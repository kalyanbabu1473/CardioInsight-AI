"""Assessments API — DB-free persistence endpoints.

The risk engine runs on the backend ML service and the frontend keeps the
returned assessment for immediate reporting. ``POST`` recomputes the prediction
and all display fields from validated ``input``; client-supplied result fields
are ignored. These routes store, retrieve, and list the records for the lifetime
of this process using an in-memory store, so no database connection is required.

Durability note: history is process-local and is cleared when the backend
restarts. The current assessment is returned directly from ``POST`` and every
report download is generated from that returned record, so reports remain fully
functional without durable server-side history.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.ml.model_loader import model_ready, model_unavailable_reason
from app.ml.prediction_service import MODEL_NAME, predict
from app.schemas.assessment import AssessmentCreate, AssessmentRead
from app.services.assessment_result import MODEL_TAGLINE, build_assessment_result
from app.services.assessment_store import store

logger = logging.getLogger("cardioinsight.api.assessments")

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.post(
    "",
    response_model=AssessmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(payload: AssessmentCreate):
    """Compute and store an authoritative assessment from validated input."""
    if not model_ready():
        logger.error("Assessment attempted while ML model is unavailable.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_unavailable_reason()
            or "Prediction service is temporarily unavailable.",
        )

    try:
        prediction = predict(payload.input)
        result = build_assessment_result(payload.input, prediction)
    except (ValueError, TypeError):
        logger.warning("Rejected assessment request: invalid clinical values")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Provided clinical values are outside the supported range or incomplete.",
        )
    except Exception as exc:  # noqa: BLE001 - never leak internals
        logger.exception("Assessment prediction failed with %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed. Please try again.",
        )

    assessment = store.create(
        model=MODEL_NAME,
        model_tagline=MODEL_TAGLINE,
        input=payload.input.model_dump(by_alias=True, mode="json"),
        result=result.model_dump(by_alias=True),
    )
    return AssessmentRead.from_record(assessment)


@router.get("", response_model=list[AssessmentRead])
def list_assessments():
    """List every assessment in this process, newest first."""
    return [AssessmentRead.from_record(r) for r in store.list()]


@router.get("/latest", response_model=AssessmentRead)
def latest_assessment():
    """Return the most recently stored assessment."""
    record = store.latest()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No assessments found"
        )
    return AssessmentRead.from_record(record)


@router.get("/{assessment_id}", response_model=AssessmentRead)
def get_assessment(assessment_id: str):
    """Return a single assessment by ID."""
    record = store.get(assessment_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment {assessment_id} not found",
        )
    return AssessmentRead.from_record(record)
