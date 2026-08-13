"""Pydantic schemas for the assessments API."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.assessment import Assessment
from app.utils.legacy import is_legacy_input


class AssessmentCreate(BaseModel):
    """Payload submitted by the frontend following the risk result.

    The prediction is never recomputed on the backend — the client sends its
    verified model output (``result``) alongside the raw patient ``input``.

    The request contract is camelCase (``modelTagline``) to match the read
    schema (``AssessmentRead``) and the frontend; the snake_case name is still
    accepted via ``populate_by_name``.
    """

    model_config = ConfigDict(populate_by_name=True)

    model: str = Field(min_length=1, max_length=64)
    model_tagline: str = Field(min_length=1, max_length=64, alias="modelTagline")
    input: dict[str, Any]
    result: dict[str, Any]


class AssessmentRead(BaseModel):
    """Record returned to the client — mirrors ``AssessmentResult`` shape.

    ``legacy`` marks records persisted against the pre-contract (20-feature)
    input shape so the UI can render them without treating their inputs as
    compatible with the deployed 44-feature model.
    """

    id: str
    createdAt: str
    model: str
    modelTagline: str
    legacy: bool = False
    input: dict[str, Any]
    result: dict[str, Any]

    @classmethod
    def from_model(cls, assessment: Assessment) -> "AssessmentRead":
        return cls(
            id=assessment.id,
            createdAt=assessment.created_at.isoformat(),
            model=assessment.model,
            modelTagline=assessment.model_tagline,
            legacy=is_legacy_input(assessment.input),
            input=assessment.input,
            result=assessment.result,
        )