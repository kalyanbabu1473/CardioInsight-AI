"""Assessments API — persistence endpoints.

The risk engine lives in the frontend; these routes only store, retrieve, and
list the records the client persists.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.assessment import Assessment
from app.schemas.assessment import AssessmentCreate, AssessmentRead
from app.utils.assessment_ids import build_id, id_prefix

from datetime import datetime, timezone

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


def _next_sequence(db: Session, now: datetime) -> int:
    prefix = id_prefix(now)
    existing = db.scalars(
        select(Assessment.id).where(Assessment.id.like(f"{prefix}%"))
    ).all()
    return len(existing) + 1


@router.post(
    "",
    response_model=AssessmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    """Persists a client-computed assessment and assigns its sequential ID."""
    now = datetime.now(timezone.utc)
    assessment = Assessment(
        id=build_id(now, _next_sequence(db, now)),
        created_at=now,
        model=payload.model,
        model_tagline=payload.model_tagline,
        input=payload.input,
        result=payload.result,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return AssessmentRead.from_model(assessment)


@router.get("", response_model=list[AssessmentRead])
def list_assessments(db: Session = Depends(get_db)):
    """List every persisted assessment, newest first."""
    records = db.scalars(
        select(Assessment).order_by(Assessment.created_at.desc())
    ).all()
    return [AssessmentRead.from_model(r) for r in records]


@router.get("/latest", response_model=AssessmentRead)
def latest_assessment(db: Session = Depends(get_db)):
    """Return the most recently persisted assessment."""
    record = db.scalars(
        select(Assessment).order_by(Assessment.created_at.desc()).limit(1)
    ).first()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No assessments found"
        )
    return AssessmentRead.from_model(record)


@router.get("/{assessment_id}", response_model=AssessmentRead)
def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    """Return a single assessment by ID."""
    record = db.get(Assessment, assessment_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment {assessment_id} not found",
        )
    return AssessmentRead.from_model(record)