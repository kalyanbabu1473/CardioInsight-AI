"""Pydantic schemas for the prediction endpoint.

``AssessmentInput`` mirrors the 11-category wizard structure and, through the
feature contract, EXACTLY the 44 features the production Random Forest was
trained on. Every range below is taken verbatim from the training distribution
(see feature_contract.json) so the model only ever receives real, in-distribution
clinical values.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

YesNo = Literal["Yes", "No"]
Gender = Literal["Male", "Female"]
SmokingStatus = Literal["Every day", "Some days", "Not at all"]


class ModelBase(BaseModel):
    """Accept camelCase payloads (frontend) and snake_case code alike."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class DemographicsInput(ModelBase):
    age: float = Field(alias="age", ge=1, le=80)  # RIDAGEYR
    gender: Gender = Field()  # RIAGENDR: Male=1, Female=2


class BodyCompositionInput(ModelBase):
    weight_kg: float = Field(alias="weightKg", ge=3.2, le=254.3)  # BMXWT
    height_cm: float = Field(alias="heightCm", ge=78.3, le=199.6)  # BMXHT
    waist_cm: float = Field(alias="waistCm", ge=40.0, le=187.5)  # BMXWAIST


class BloodPressureInput(ModelBase):
    systolic_bp_1: float = Field(alias="systolicBP1", ge=52.0, le=225.0)  # BPXOSY1
    systolic_bp_2: float = Field(alias="systolicBP2", ge=54.0, le=222.0)  # BPXOSY2
    systolic_bp_3: float = Field(alias="systolicBP3", ge=55.0, le=220.0)  # BPXOSY3
    hypertension_diagnosis: YesNo = Field(alias="hypertensionDiagnosis")  # BPQ020


class MetabolicInput(ModelBase):
    hba1c: float = Field(ge=2.8, le=16.2)  # LBXGH
    fasting_glucose: float = Field(alias="fastingGlucose", ge=47.0, le=524.0)  # LBXGLU
    insulin: float = Field(ge=0.71, le=512.5)  # LBXIN


class LipidsInput(ModelBase):
    ldl_cholesterol: float = Field(alias="ldlCholesterol", ge=7, le=357)  # LBDLDL
    total_cholesterol: float = Field(alias="totalCholesterol", ge=71, le=431)  # LBXTC
    triglycerides: float = Field(ge=10.0, le=2684.0)  # LBXTR
    hdl_cholesterol: float = Field(alias="hdlCholesterol", ge=5, le=189)  # LBDHDD


class EnvironmentalToxinsInput(ModelBase):
    blood_cadmium: float = Field(alias="bloodCadmium", ge=0.071, le=13.03)  # LBXBCD
    blood_lead: float = Field(alias="bloodLead", ge=0.049, le=42.48)  # LBXBPB
    blood_selenium: float = Field(alias="bloodSelenium", ge=74.8, le=562.23)  # LBXBSE
    urinary_thallium: float = Field(alias="urinaryThallium", ge=0.013, le=1.492)  # URXUTL
    urinary_lead: float = Field(alias="urinaryLead", ge=0.021, le=19.34)  # URXUPB
    urinary_cadmium: float = Field(alias="urinaryCadmium", ge=0.039, le=7.581)  # URXUCD
    urinary_cobalt: float = Field(alias="urinaryCobalt", ge=0.017, le=32.377)  # URXUCO
    urinary_barium: float = Field(alias="urinaryBarium", ge=0.059, le=92.612)  # URXUBA
    urinary_antimony: float = Field(alias="urinaryAntimony", ge=0.016, le=4.285)  # URXUSB
    urinary_tungsten: float = Field(alias="urinaryTungsten", ge=0.013, le=29.4)  # URXUTU


class PfasInput(ModelBase):
    pfos: float = Field(ge=0.07, le=95.1)  # LBXNFOS
    pfoa: float = Field(ge=0.07, le=52.8)  # LBXNFOA
    pfhxs: float = Field(ge=0.07, le=48.8)  # LBXPFHS
    pfna: float = Field(ge=0.07, le=7.0)  # LBXPFNA
    sm_pfos: float = Field(alias="smPfos", ge=0.07, le=19.3)  # LBXMFOS


class UrinaryOpesInput(ModelBase):
    bcep: float = Field(ge=0.0707, le=268.0)  # URXBCEP
    bdcpp: float = Field(ge=0.0707, le=260.0)  # URXBDCP
    dphp: float = Field(ge=0.0707, le=270.0)  # URXDPHP


class MedicalHistoryInput(ModelBase):
    high_cholesterol_diagnosis: YesNo = Field(alias="highCholesterolDiagnosis")  # BPQ080
    cholesterol_medication: YesNo = Field(alias="cholesterolMedication")  # BPQ090D
    arthritis: YesNo = Field()  # MCQ160A


class LifestyleInput(ModelBase):
    worked_outside_home_7d: YesNo = Field(alias="workedOutsideHome7d")  # SMQ856
    current_smoking: SmokingStatus = Field(alias="currentSmoking")  # SMQ040
    daily_sitting_minutes: float = Field(
        alias="dailySittingMinutes", ge=0, le=9999
    )  # PAD680
    dietary_caffeine_mg: float = Field(
        alias="dietaryCaffeineMg", ge=0.0, le=4320.0
    )  # DR1TCAFF
    alcoholic_drinks_per_day: float = Field(
        alias="alcoholicDrinksPerDay", ge=0.0, le=25.0
    )  # ALQ130


class SocioeconomicInput(ModelBase):
    income_poverty_ratio: float = Field(
        alias="incomePovertyRatio", ge=0.0, le=5.0
    )  # INDFMPIR


class AssessmentInput(ModelBase):
    """The complete clinical intake — all 44 model features across 11 sections.

    A request is only valid when every required field is present; the backend
    never imputes or defaults a missing feature. If a feature cannot be
    supplied, prediction is refused rather than fabricated.
    """

    demographics: DemographicsInput
    body_composition: BodyCompositionInput = Field(alias="bodyComposition")
    blood_pressure: BloodPressureInput = Field(alias="bloodPressure")
    metabolic: MetabolicInput
    lipids: LipidsInput
    environmental_toxins: EnvironmentalToxinsInput = Field(alias="environmentalToxins")
    pfas: PfasInput
    urinary_opes: UrinaryOpesInput = Field(alias="urinaryOpes")
    medical_history: MedicalHistoryInput = Field(alias="medicalHistory")
    lifestyle: LifestyleInput
    socioeconomic: SocioeconomicInput


class PredictRequest(BaseModel):
    """Top-level payload sent by the frontend to `/api/predict`."""

    input: AssessmentInput


class FeatureContribution(BaseModel):
    """Per-feature SHAP contribution toward the predicted probability.

    ``contribution`` is the exact TreeSHAP value (log-odds space) for the
    positive class; positive means the feature pushed risk up for this patient,
    negative means it lowered it. Values are authoritative from the deployed
    Random Forest, never heuristic.
    """

    feature: str
    label: str
    value: float
    contribution: float


class PredictionResponse(BaseModel):
    """Structured output of the deployed Random Forest model."""

    model: str
    probability: float
    level: Literal["Low", "Moderate", "High"]
    confidence: float
    feature_names: list[str]
    feature_values: list[float]
    expected_value: float = 0.0
    contributions: list[FeatureContribution] = []