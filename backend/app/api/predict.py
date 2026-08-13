"""Prediction endpoint — POST /api/predict.

Receives the 44-feature AssessmentInput the frontend wizard collects, converts
it to the exact ordered feature vector the deployed Random Forest was trained
on, runs inference and returns a structured, clinically-appropriate response.
Errors are logged server-side and returned to clients as generic validation
messages only. The canonical feature contract is also served here so every
client shares a single source of truth.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.core.feature_contract import load_contract
from app.ml.model_loader import model_ready, model_unavailable_reason
from app.ml.prediction_service import MODEL_NAME, predict
from app.schemas.prediction import PredictRequest, PredictionResponse

logger = logging.getLogger("cardioinsight.api.predict")

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.get("/status")
def predict_status():
    """Health probe for the ML service (model availability + feature count).

    When the model is unavailable a safe ``detail`` reason is included so
    production can be diagnosed from the API alone.
    """
    ready = model_ready()
    return {
        "model": MODEL_NAME if ready else None,
        "ready": ready,
        "detail": None if ready else model_unavailable_reason(),
    }


@router.get("/feature-contract")
def feature_contract():
    """Serve the canonical feature contract (single source of truth)."""
    return load_contract()


@router.post("", response_model=PredictionResponse)
async def run_predict(payload: PredictRequest) -> PredictionResponse:
    if not model_ready():
        logger.error("Prediction attempted while ML model is unavailable.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_unavailable_reason()
            or "Prediction service is temporarily unavailable.",
        )

    try:
        return predict(payload.input)
    except (ValueError, TypeError) as exc:  # invalid clinical input
        logger.warning("Rejected prediction request: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provided clinical values are outside the supported range or incomplete.",
        )
    except Exception as exc:  # noqa: BLE001 - never leak internals
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed. Please try again.",
        )