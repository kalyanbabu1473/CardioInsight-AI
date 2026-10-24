"""CardioInsight AI backend.

Serves the deployed calibrated Random Forest prediction endpoint (the
18-feature clinical model, driven by the canonical feature contract) and a
DB-free assessment API backed by process-local memory. No database is required at
startup or while serving requests.
"""

import logging
import math
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.assessments import router as assessments_router
from app.api.predict import router as predict_router
from app.core.config import ALLOWED_ORIGINS
from app.ml.artifact_manifest import verify_artifacts
from app.ml.model_loader import model_ready, model_unavailable_reason
from app.ml.prediction_service import MODEL_NAME

logger = logging.getLogger("cardioinsight.startup")


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Verify artifact integrity at startup and log fail-closed status."""
    integrity = verify_artifacts()
    if integrity["ok"]:
        logger.info("Artifact manifest verified: %s", integrity["manifest_path"])
    else:
        logger.error(
            "Artifact manifest verification failed: %s",
            "; ".join(integrity["errors"]),
        )
    if model_ready():
        logger.info("ML model ready: %s", MODEL_NAME)
    else:
        reason = model_unavailable_reason() or "unknown readiness failure"
        logger.error("ML model readiness failed at startup: %s", reason)
    yield


app = FastAPI(
    title="CardioInsight AI",
    version="2.0.0",
    lifespan=lifespan,
    description=(
        "Prediction API for the CardioInsight cardiovascular risk assessment "
        "platform. Predictions run on the calibrated 18-feature clinical Random "
        "Forest via the canonical feature contract. Assessment history is kept "
        "in process memory; no external database is used."
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


def _json_safe(value: Any) -> Any:
    """Make validation errors JSON-serializable, including NaN/Infinity input.

    Pydantic stores the rejected input in the error payload. Raw JSON with
    non-standard `NaN`/`Infinity` tokens therefore produces a validation error
    that the default JSON encoder cannot serialize, turning a clean 422 into a
    500. Replace non-finite numbers with None and exceptions with strings.
    """
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, BaseException):
        return str(value)
    return value


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return a serializable 422 for malformed or non-finite clinical input."""
    return JSONResponse(
        status_code=422,
        content={"detail": _json_safe(exc.errors())},
    )


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
