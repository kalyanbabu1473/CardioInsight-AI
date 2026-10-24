"""CardioInsight AI backend.

Serves the deployed Random Forest prediction endpoint (the 44-feature research
consensus model, driven by the canonical feature contract) and a DB-free
assessment API backed by process-local memory. No database is required at
startup or while serving requests.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.assessments import router as assessments_router
from app.api.predict import router as predict_router
from app.core.config import ALLOWED_ORIGINS
from app.ml.model_loader import model_ready, model_unavailable_reason
from app.ml.prediction_service import MODEL_NAME


app = FastAPI(
    title="CardioInsight AI",
    version="1.3.0",
    description=(
        "Prediction API for the CardioInsight cardiovascular risk assessment "
        "platform. Predictions run on the 44-feature research Random Forest via "
        "the canonical feature contract. Assessment history is kept in process "
        "memory; no external database is used."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessments_router)
app.include_router(predict_router)


def _health_body() -> dict:
    ready = model_ready()
    return {
        "status": "ok" if ready else "degraded",
        "database": "not_used",
        "model": {
            "ready": ready,
            "name": MODEL_NAME if ready else None,
            "detail": None if ready else model_unavailable_reason(),
        },
    }


@app.get("/api/health")
def health():
    """Application + real model status; never probes a database.

    Returns ``503`` when the trained model failed to load so a broken
    prediction service is not reported as healthy.
    """
    body = _health_body()
    return JSONResponse(
        status_code=200 if body["model"]["ready"] else 503,
        content=body,
    )


@app.get("/health")
def legacy_health():
    """Backwards-compatible alias used by earlier READMEs/health checks."""
    return health()
