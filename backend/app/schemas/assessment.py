"""Pydantic schemas for the assessments API."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.prediction import AssessmentInput
from app.services.assessment_store import AssessmentRecord
from app.utils.legacy import is_legacy_input


class AssessmentCreate(BaseModel):
    """Payload accepted by ``POST /api/assessments``.

    Only the validated clinical ``input`` is authoritative. Legacy clients may
    still send ``model``, ``modelTagline``, and ``result``; those fields are
    accepted for compatibility but deliberately ignored. The backend recomputes
    the prediction and every derived display field from ``input``.
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    model: str | None = Field(default=None, max_length=64)
    model_tagline: str | None = Field(default=None, max_length=64, alias="modelTagline")
    input: AssessmentInput
    result: dict[str, Any] | None = Field(
        default=None,
        description="Ignored. The server computes the authoritative result.",
    )


class AssessmentTopFactor(BaseModel):
    name: str
    value: str
    contribution: float


class AssessmentRecommendations(BaseModel):
    lifestyle: list[str]
    monitoring: list[str]
    medical: list[str]


class AssessmentResultPayload(BaseModel):
    """Server-computed result, shaped like the frontend ``RiskResult``."""

    model_config = ConfigDict(populate_by_name=True)

    probability: float = Field(ge=0.0, le=1.0)
    level: Literal["Low", "Moderate", "High"]
    confidence: float = Field(ge=0.0, le=100.0)
    interpretation: str
    top_factors: list[AssessmentTopFactor] = Field(alias="topFactors")
    recommendations: AssessmentRecommendations


class AssessmentRead(BaseModel):
    """Record returned to the client - mirrors ``AssessmentResult`` shape.

    ``legacy`` marks records stored against the pre-contract (20-feature)
    input shape so the UI can render them without treating their inputs as
    compatible with the deployed 18-feature clinical model.
    """

    id: str
    createdAt: str
    model: str
    modelTagline: str
    legacy: bool = False
    input: dict[str, Any]
    result: dict[str, Any]

    @classmethod
    def from_record(cls, assessment: AssessmentRecord) -> "AssessmentRead":
        return cls(
            id=assessment.id,
            createdAt=assessment.created_at.isoformat(),
            model=assessment.model,
            modelTagline=assessment.model_tagline,
            legacy=is_legacy_input(assessment.input),
            input=assessment.input,
            result=assessment.result,
        )
