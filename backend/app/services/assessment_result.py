"""Build the display-ready assessment result from the server-side prediction.

The client previously computed this layer and posted it back to the assessments
API, which meant a caller could forge the probability, level, top factors, or
recommendations. The authoritative result is now assembled here from the model
output and the validated input; client-submitted result fields are ignored.
"""

from __future__ import annotations

from app.core.feature_contract import load_contract
from app.ml.prediction_service import PredictionResponse
from app.schemas.assessment import (
    AssessmentRecommendations,
    AssessmentResultPayload,
    AssessmentTopFactor,
)
from app.schemas.prediction import AssessmentInput

MODEL_TAGLINE = "Calibrated Clinical Model"
TOP_FACTOR_COUNT = 6
_SPECS = {feature["name"]: feature for feature in load_contract()["features"]}


def _format_number(value: float) -> str:
    rounded = round(float(value), 4)
    if abs(rounded - round(rounded)) < 1e-9:
        return str(int(round(rounded)))
    return f"{rounded:g}"


def _format_feature_value(feature_name: str, value: float) -> str:
    spec = _SPECS[feature_name]
    if spec.get("type") == "categorical":
        label = next(
            (
                option
                for option, code in spec.get("encode", {}).items()
                if int(code) == int(round(value))
            ),
            None,
        )
        return label or _format_number(value)
    if spec.get("display"):
        converted = float(value) / float(spec["display"]["factor"])
        return f"{converted:.1f} {spec['display']['unit']}"
    rendered = _format_number(value)
    unit = spec.get("unit")
    return f"{rendered} {unit}" if unit else rendered


def _top_factors(prediction: PredictionResponse) -> list[AssessmentTopFactor]:
    return [
        AssessmentTopFactor(
            name=_SPECS[item.feature]["label"],
            value=_format_feature_value(item.feature, item.value),
            contribution=item.contribution,
        )
        for item in prediction.contributions[:TOP_FACTOR_COUNT]
    ]


def _interpretation(level: str, top_factors: list[AssessmentTopFactor]) -> str:
    drivers = [factor.name for factor in top_factors if factor.contribution > 0][:3]
    driver_text = ", ".join(drivers) if drivers else "the leading model factors"
    if level == "Low":
        return (
            "Low predicted cardiovascular risk. No dominant risk drivers were "
            "identified; continuing a healthy lifestyle and routine monitoring "
            "is recommended."
        )
    if level == "Moderate":
        return (
            f"Moderate predicted cardiovascular risk. Notable contributions from "
            f"{driver_text} suggest modifiable factors that could meaningfully "
            "reduce risk."
        )
    return (
        f"High predicted cardiovascular risk. The strongest drivers are "
        f"{driver_text}. Prompt clinical assessment and active risk modification "
        "are strongly recommended."
    )


def _recommendations(
    input_: AssessmentInput,
    level: str,
) -> AssessmentRecommendations:
    lifestyle: list[str] = []
    monitoring: list[str] = []
    medical: list[str] = []

    life = input_.lifestyle
    body = input_.body_composition
    blood = input_.blood_pressure
    metabolic = input_.metabolic
    lipids = input_.lipids

    if life.current_smoking != "Not at all":
        lifestyle.append(
            "Enroll in a structured smoking cessation program and set a quit date."
        )
    elif life.ever_smoked_100 == "Yes":
        lifestyle.append(
            "Maintain smoking abstinence and avoid secondhand smoke exposure."
        )

    bmi = body.weight_kg / ((body.height_cm / 100.0) ** 2)
    if bmi > 25:
        lifestyle.append(
            "Target gradual weight reduction toward a BMI < 25 "
            f"(current {bmi:.1f} kg/m2) through diet and activity."
        )
    waist_threshold = 102 if input_.demographics.sex == "Male" else 88
    if body.waist_cm > waist_threshold:
        lifestyle.append(
            "Prioritize reduction of central adiposity; a balanced "
            "Mediterranean-style diet is recommended."
        )

    if blood.systolic_bp >= 130 or blood.diastolic_bp >= 80:
        monitoring.append(
            "Monitor blood pressure twice weekly and maintain a home BP diary."
        )
    else:
        monitoring.append("Recheck blood pressure annually at routine visits.")

    if metabolic.hba1c >= 6.5 or metabolic.fasting_glucose >= 126:
        monitoring.append(
            "Confirm glycemic status with a fasting glucose or oral glucose "
            "tolerance test."
        )
    elif metabolic.hba1c >= 5.7 or metabolic.fasting_glucose >= 100:
        monitoring.append(
            "Monitor HbA1c and fasting glucose every 6 months given prediabetic "
            "range."
        )

    if lipids.total_cholesterol >= 200 or lipids.ldl_cholesterol >= 130:
        monitoring.append(
            "Repeat a full lipid panel within 3 months to confirm trend."
        )
    else:
        monitoring.append(
            "Repeat lipid panel every 1-2 years per cardiovascular screening "
            "guidance."
        )
    monitoring.append("Reassess overall cardiovascular risk annually.")

    if (
        blood.hypertension_diagnosis == "Yes"
        or blood.systolic_bp >= 140
        or blood.diastolic_bp >= 90
    ):
        medical.append(
            "Review antihypertensive therapy and target blood pressure < 130/80 mmHg."
        )
    if metabolic.hba1c >= 6.5:
        medical.append(
            "Discuss diabetes management and initiate or escalate glycemic therapy "
            "as appropriate."
        )
    if lipids.ldl_cholesterol >= 160:
        medical.append(
            "Discuss statin therapy and lipid-lowering goals with the treating "
            "clinician."
        )
    if lipids.triglycerides >= 500:
        medical.append(
            "Assess for secondary causes of hypertriglyceridemia and consider "
            "fibrate therapy."
        )
    if level == "High":
        medical.append(
            "Refer for specialist cardiology review for comprehensive risk "
            "stratification."
        )
        medical.append(
            "Discuss aspirin or antithrombotic prophylaxis based on bleeding-risk "
            "assessment."
        )
    elif level == "Moderate":
        medical.append(
            "Schedule a follow-up consultation within 3 months to review modifiable "
            "risk factors."
        )
    else:
        medical.append(
            "Continue routine preventive care and lifestyle counseling."
        )

    return AssessmentRecommendations(
        lifestyle=lifestyle
        or ["Maintain a balanced diet, regular exercise, and adequate sleep."],
        monitoring=monitoring,
        medical=medical,
    )


def build_assessment_result(
    input_: AssessmentInput,
    prediction: PredictionResponse,
) -> AssessmentResultPayload:
    top_factors = _top_factors(prediction)
    return AssessmentResultPayload(
        probability=prediction.probability,
        level=prediction.level,
        confidence=prediction.confidence,
        interpretation=_interpretation(prediction.level, top_factors),
        top_factors=top_factors,
        recommendations=_recommendations(input_, prediction.level),
    )
