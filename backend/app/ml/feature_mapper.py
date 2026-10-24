"""Map validated assessment input into the 18 clinical features the production
Random Forest consumes, in the model's exact training order.

Every value is backed by a real NHANES 2017-March 2020 variable the wizard
collects directly. Nothing is imputed, defaulted, or fabricated: if a feature
is missing it never reaches this function (the schema rejects incomplete
requests).

The only derived feature is BMXBMI, computed from measured height and weight
exactly as NHANES defines it (kg / height(m)^2). Training uses the same shared
function, so the model receives identical BMI values in both paths. The smoking
skip rule is also shared: never-smokers (SMQ020=No) use SMQ040=3.
"""

import math

from app.core.feature_contract import feature_order, load_contract
from app.ml.preprocessing import derive_bmi, normalize_smoking_code
from app.schemas.prediction import AssessmentInput


def to_model_row(input_: AssessmentInput) -> list[float]:
    """Produce the ordered 18-feature vector matching the model's training order."""
    bmi = derive_bmi(
        input_.body_composition.height_cm,
        input_.body_composition.weight_kg,
    )
    cfg = {f["name"]: f for f in load_contract()["features"]}
    ever_smoked_code = cfg["SMQ020"]["encode"][input_.lifestyle.ever_smoked_100]
    current_smoking_code = normalize_smoking_code(
        ever_smoked_code,
        cfg["SMQ040"]["encode"][input_.lifestyle.current_smoking],
    )

    values: dict[str, float] = {
        "RIDAGEYR": input_.demographics.age,
        "RIAGENDR": cfg["RIAGENDR"]["encode"][input_.demographics.sex],
        "BMXHT": input_.body_composition.height_cm,
        "BMXWT": input_.body_composition.weight_kg,
        "BMXWAIST": input_.body_composition.waist_cm,
        "BMXBMI": bmi,
        "BPXOSY1": input_.blood_pressure.systolic_bp,
        "BPXODI1": input_.blood_pressure.diastolic_bp,
        "BPQ020": cfg["BPQ020"]["encode"][
            input_.blood_pressure.hypertension_diagnosis
        ],
        "LBXGH": input_.metabolic.hba1c,
        "LBXGLU": input_.metabolic.fasting_glucose,
        "LBXTC": input_.lipids.total_cholesterol,
        "LBDLDL": input_.lipids.ldl_cholesterol,
        "LBDHDD": input_.lipids.hdl_cholesterol,
        "LBXTR": input_.lipids.triglycerides,
        "LBXIN": input_.metabolic.insulin,
        "SMQ020": ever_smoked_code,
        "SMQ040": current_smoking_code,
    }

    missing = [name for name in feature_order() if name not in values]
    if missing:
        raise ValueError(f"Cannot construct feature vector, missing: {missing}")

    ordered = {name: float(values[name]) for name in feature_order()}
    _validate_model_row(ordered, cfg)
    return [ordered[name] for name in feature_order()]


def _validate_model_row(values: dict[str, float], cfg: dict[str, dict]) -> None:
    """Reject non-finite or out-of-contract values before model inference.

    Direct inputs are already constrained by Pydantic, but derived values (BMI)
    and future derived features are not. This guard keeps the model inside the
    validated contract regardless of how a feature was produced. Error messages
    intentionally omit patient values so request logs do not contain PHI.
    """
    for name, value in values.items():
        if not math.isfinite(value):
            raise ValueError(f"Feature {name} must be a finite number.")
        spec = cfg[name]
        if spec.get("type") == "continuous":
            lo = float(spec["min"])
            hi = float(spec["max"])
            if value < lo or value > hi:
                raise ValueError(f"Feature {name} is outside the supported range.")
        elif spec.get("encode"):
            if int(value) not in set(spec["encode"].values()):
                raise ValueError(f"Feature {name} has an unsupported category code.")
