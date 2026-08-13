"""Map validated assessment input into the 44 NHANES features the production
Random Forest consumes, in the model's exact training order.

Every value is backed by a real NHANES 2017-March 2020 variable the wizard
collects directly. Nothing is imputed, defaulted, or fabricated: if a feature
is missing it never reaches this function (the schema rejects incomplete
requests).

The only derived feature is BMXBMI, computed from measured height and weight
exactly as NHANES defines it (kg / height(m)^2), which is the same formula the
training data used for participants with complete measurements.
"""

from app.core.feature_contract import feature_order, load_contract
from app.schemas.prediction import AssessmentInput


def _derive_bmi(input_: AssessmentInput) -> float:
    meters = input_.body_composition.height_cm / 100.0
    return round(float(input_.body_composition.weight_kg / (meters * meters)), 4)


def to_model_row(input_: AssessmentInput) -> list[float]:
    """Produce the ordered 44-feature vector matching the model's training order."""
    bmi = _derive_bmi(input_)
    cfg = {f["name"]: f for f in load_contract()["features"]}

    values: dict[str, float] = {
        # --- Body composition ---
        "BMXWT": input_.body_composition.weight_kg,
        "BMXHT": input_.body_composition.height_cm,
        "BMXWAIST": input_.body_composition.waist_cm,
        "BMXBMI": bmi,
        # --- Blood pressure ---
        "BPXOSY1": input_.blood_pressure.systolic_bp_1,
        "BPXOSY2": input_.blood_pressure.systolic_bp_2,
        "BPXOSY3": input_.blood_pressure.systolic_bp_3,
        "BPQ020": cfg["BPQ020"]["encode"][input_.blood_pressure.hypertension_diagnosis],
        # --- Metabolic ---
        "LBXGH": input_.metabolic.hba1c,
        "LBXGLU": input_.metabolic.fasting_glucose,
        "LBXIN": input_.metabolic.insulin,
        # --- Lipids ---
        "LBDLDL": input_.lipids.ldl_cholesterol,
        "LBXTC": input_.lipids.total_cholesterol,
        "LBXTR": input_.lipids.triglycerides,
        "LBDHDD": input_.lipids.hdl_cholesterol,
        # --- Environmental toxins ---
        "LBXBCD": input_.environmental_toxins.blood_cadmium,
        "LBXBPB": input_.environmental_toxins.blood_lead,
        "LBXBSE": input_.environmental_toxins.blood_selenium,
        "URXUTL": input_.environmental_toxins.urinary_thallium,
        "URXUPB": input_.environmental_toxins.urinary_lead,
        "URXUCD": input_.environmental_toxins.urinary_cadmium,
        "URXUCO": input_.environmental_toxins.urinary_cobalt,
        "URXUBA": input_.environmental_toxins.urinary_barium,
        "URXUSB": input_.environmental_toxins.urinary_antimony,
        "URXUTU": input_.environmental_toxins.urinary_tungsten,
        # --- PFAS ---
        "LBXNFOS": input_.pfas.pfos,
        "LBXNFOA": input_.pfas.pfoa,
        "LBXPFHS": input_.pfas.pfhxs,
        "LBXPFNA": input_.pfas.pfna,
        "LBXMFOS": input_.pfas.sm_pfos,
        # --- Urinary OPEs ---
        "URXBCEP": input_.urinary_opes.bcep,
        "URXBDCP": input_.urinary_opes.bdcpp,
        "URXDPHP": input_.urinary_opes.dphp,
        # --- Medical history ---
        "BPQ080": cfg["BPQ080"]["encode"][input_.medical_history.high_cholesterol_diagnosis],
        "BPQ090D": cfg["BPQ090D"]["encode"][input_.medical_history.cholesterol_medication],
        "MCQ160A": cfg["MCQ160A"]["encode"][input_.medical_history.arthritis],
        # --- Lifestyle ---
        "SMQ856": cfg["SMQ856"]["encode"][input_.lifestyle.worked_outside_home_7d],
        "SMQ040": cfg["SMQ040"]["encode"][input_.lifestyle.current_smoking],
        "PAD680": input_.lifestyle.daily_sitting_minutes,
        "DR1TCAFF": input_.lifestyle.dietary_caffeine_mg,
        "ALQ130": input_.lifestyle.alcoholic_drinks_per_day,
        # --- Demographics / socioeconomic ---
        "RIDAGEYR": input_.demographics.age,
        "RIAGENDR": cfg["RIAGENDR"]["encode"][input_.demographics.gender],
        "INDFMPIR": input_.socioeconomic.income_poverty_ratio,
    }

    missing = [name for name in feature_order() if name not in values]
    if missing:
        raise ValueError(f"Cannot construct feature vector, missing: {missing}")

    return [float(values[name]) for name in feature_order()]