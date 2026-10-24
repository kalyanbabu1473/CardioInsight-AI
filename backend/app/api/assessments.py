"""Assessments API — DB-free persistence endpoints.

The risk engine runs on the backend ML service and the frontend keeps the
returned assessment for immediate reporting. These routes store, retrieve, and
list the records for the lifetime of this process using an in-memory store, so
no database connection is required.

Durability note: history is process-local and is cleared when the backend
restarts. The current assessment is returned directly from ``POST`` and every
report download is generated from that returned record, so reports remain fully
functional without durable server-side history.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.assessment import AssessmentCreate, AssessmentRead
from app.services.assessment_store import store

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.post(
    "",
    response_model=AssessmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(payload: AssessmentCreate):
    """Stores a client-computed assessment and assigns its sequential ID."""
    assessment = store.create(
        model=payload.model,
        model_tagline=payload.model_tagline,
        input=payload.input,
        result=payload.result,
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
