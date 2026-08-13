"""CardioInsight AI backend.

Persists assessments produced by the frontend risk engine and serves the
deployed Random Forest prediction endpoint (the 44-feature research consensus
model, driven by the canonical feature contract). The backend owns assessment
ID generation, storage, and ML inference.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.assessments import router as assessments_router
from app.api.predict import router as predict_router
from app.core.config import ALLOWED_ORIGINS
from app.database.session import Base, engine
from app.models.assessment import Assessment  # noqa: F401 - registers the model


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="CardioInsight AI",
    version="1.2.0",
    description=(
        "Persistence + prediction API for the CardioInsight cardiovascular risk "
        "assessment platform. Predictions run on the 44-feature research Random "
        "Forest via the canonical feature contract."
    ),
    lifespan=lifespan,
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


def _database_connected() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 - health probe must not raise
        return False


@app.get("/api/health")
def health():
    db_ok = _database_connected()
    return {"status": "ok", "database": "connected" if db_ok else "disconnected"}


@app.get("/health")
def legacy_health():
    """Backwards-compatible alias used by earlier READMEs/health checks."""
    db_ok = _database_connected()
    return {"status": "ok", "database": "connected" if db_ok else "disconnected"}