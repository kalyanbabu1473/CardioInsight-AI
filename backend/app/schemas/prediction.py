"""Pydantic schemas for the prediction endpoint.

``AssessmentInput`` mirrors the 6-category clinical wizard and, through the
feature contract, exactly the 18 features the production Random Forest was
trained on. Every range below is taken from the training distribution (see
feature_contract.json) so the model only ever receives real, in-distribution
clinical values.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

YesNo = Literal["Yes", "No"]
Sex = Literal["Male", "Female"]
SmokingStatus = Literal["Every day", "Some days", "Not at all"]


class ModelBase(BaseModel):
    """Accept camelCase payloads (frontend) and snake_case code alike."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore",
        allow_inf_nan=False,
    )


class DemographicsInput(ModelBase):
    age: float = Field(ge=18, le=80)  # RIDAGEYR
    sex: Sex = Field()  # RIAGENDR: Male=1, Female=2


class BodyCompositionInput(ModelBase):
    weight_kg: float = Field(alias="weightKg", ge=39.6, le=204.6)  # BMXWT
    height_cm: float = Field(alias="heightCm", ge=131.1, le=198.7)  # BMXHT
    waist_cm: float = Field(alias="waistCm", ge=61.1, le=178.0)  # BMXWAIST


class BloodPressureInput(ModelBase):
    systolic_bp: float = Field(alias="systolicBP", ge=66.0, le=217.0)  # BPXOSY1
    diastolic_bp: float = Field(alias="diastolicBP", ge=36.0, le=131.0)  # BPXODI1
    hypertension_diagnosis: YesNo = Field(alias="hypertensionDiagnosis")  # BPQ020


class MetabolicInput(ModelBase):
    hba1c: float = Field(ge=2.8, le=15.2)  # LBXGH
    fasting_glucose: float = Field(alias="fastingGlucose", ge=47.0, le=451.0)  # LBXGLU
    insulin: float = Field(ge=0.71, le=512.5)  # LBXIN


class LipidsInput(ModelBase):
    total_cholesterol: float = Field(alias="totalCholesterol", ge=76, le=428)  # LBXTC
    ldl_cholesterol: float = Field(alias="ldlCholesterol", ge=7, le=357)  # LBDLDL
    hdl_cholesterol: float = Field(alias="hdlCholesterol", ge=11, le=187)  # LBDHDD
    triglycerides: float = Field(ge=10.0, le=399.0)  # LBXTR


class LifestyleInput(ModelBase):
    ever_smoked_100: YesNo = Field(alias="everSmoked100")  # SMQ020
    current_smoking: SmokingStatus = Field(alias="currentSmoking")  # SMQ040

    @model_validator(mode="after")
    def _smoking_answers_are_consistent(self) -> "LifestyleInput":
        if self.ever_smoked_100 == "No" and self.current_smoking != "Not at all":
            raise ValueError(
                "currentSmoking must be 'Not at all' when everSmoked100 is 'No'"
            )
        return self


class AssessmentInput(ModelBase):
    """The complete clinical intake - all 18 model features across 6 sections.

    A request is only valid when every required field is present; the backend
    never imputes or defaults a missing feature. If a feature cannot be
    supplied, prediction is refused rather than fabricated.
    """

    demographics: DemographicsInput
    body_composition: BodyCompositionInput = Field(alias="bodyComposition")
    blood_pressure: BloodPressureInput = Field(alias="bloodPressure")
    metabolic: MetabolicInput
    lipids: LipidsInput
    lifestyle: LifestyleInput


class PredictRequest(BaseModel):
    """Top-level payload for direct inference at `/api/predict`."""

    model_config = ConfigDict(allow_inf_nan=False)

    input: AssessmentInput


class FeatureContribution(BaseModel):
    """Per-feature SHAP contribution toward the underlying forest's output.

    ``contribution`` is the exact TreeSHAP value for the positive class; positive
    means the feature pushed risk up for this patient, negative means it lowered
    it. Values explain the raw forest score (``probability_raw``), not the
    calibrated probability.
    """

    feature: str
    label: str
    value: float
    contribution: float


class PredictionResponse(BaseModel):
    """Structured output of the deployed, calibrated Random Forest model."""

    model_config = ConfigDict(allow_inf_nan=False)

    model: str
    probability: float = Field(ge=0.0, le=1.0)
    probability_raw: float = Field(ge=0.0, le=1.0)
    level: Literal["Low", "Moderate", "High"]
    confidence: float = Field(
        ge=0.0,
        le=100.0,
        description=(
            "Prediction certainty as max(calibrated CVD probability, 1 - p) * 100. "
            "Not the probability that the prediction is correct."
        ),
    )
    calibration: Literal["isotonic", "none"] = "isotonic"
    feature_names: list[str]
    feature_values: list[float]
    expected_value: float = 0.0
    contributions: list[FeatureContribution] = []
