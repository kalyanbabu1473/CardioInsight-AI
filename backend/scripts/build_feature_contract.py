"""Build the single-source-of-truth feature contract for CardioInsight.

The contract anchors the assessment wizard, the prediction backend, and the
report layer to the 18 features consumed by the deployed clinical Random Forest
(`Models/CardioAI_Clinical_Model.pkl`). Seventeen values are collected from the
clinician; BMI is computed from height and weight.

Run from the repository root:
    backend/.venv/Scripts/python backend/scripts/build_feature_contract.py
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FEATURES = [
    "RIDAGEYR",
    "RIAGENDR",
    "BMXHT",
    "BMXWT",
    "BMXWAIST",
    "BMXBMI",
    "BPXOSY1",
    "BPXODI1",
    "BPQ020",
    "LBXGH",
    "LBXGLU",
    "LBXTC",
    "LBDLDL",
    "LBDHDD",
    "LBXTR",
    "LBXIN",
    "SMQ020",
    "SMQ040",
]

META = {
    "RIDAGEYR": ("Age", "years", "Demographics", "Age in years (right-censored at 80). The deployed model is trained and validated on adults aged 18-80; pediatric assessments are not supported."),
    "RIAGENDR": ("Sex", "", "Demographics", "Biological sex (Male=1, Female=2)."),
    "BMXHT": ("Height", "cm", "Body Measurements", "Standing height."),
    "BMXWT": ("Weight", "kg", "Body Measurements", "Measured body weight."),
    "BMXWAIST": ("Waist circumference", "cm", "Body Measurements", "Measured waist circumference."),
    "BMXBMI": ("Body mass index", "kg/m2", "Body Measurements", "Derived from measured height and weight (kg/m^2), rounded to four decimals. Training and live inference use the same derivation; the imputed NHANES BMXBMI column is not used."),
    "BPXOSY1": ("Systolic blood pressure", "mmHg", "Blood Pressure", "First systolic blood pressure reading."),
    "BPXODI1": ("Diastolic blood pressure", "mmHg", "Blood Pressure", "First diastolic blood pressure reading."),
    "BPQ020": ("High blood pressure diagnosis", "", "Blood Pressure", "Ever told by a doctor you had high blood pressure (Yes=1, No=2). Refused/don't-know codes are excluded."),
    "LBXGH": ("HbA1c / glycated hemoglobin", "%", "Laboratory", "Glycohemoglobin from whole blood."),
    "LBXGLU": ("Fasting glucose", "mg/dL", "Laboratory", "Fasting serum glucose."),
    "LBXTC": ("Total cholesterol", "mg/dL", "Laboratory", "Total serum cholesterol."),
    "LBDLDL": ("LDL cholesterol", "mg/dL", "Laboratory", "Direct low-density lipoprotein cholesterol."),
    "LBDHDD": ("HDL cholesterol", "mg/dL", "Laboratory", "Direct high-density lipoprotein cholesterol."),
    "LBXTR": ("Triglycerides", "mg/dL", "Laboratory", "Serum triglycerides."),
    "LBXIN": ("Fasting insulin", "uU/mL", "Laboratory", "Fasting serum insulin."),
    "SMQ020": ("Ever smoked 100 cigarettes", "", "Lifestyle", "Ever smoked at least 100 cigarettes in your lifetime (Yes=1, No=2). Refused/don't-know codes are excluded."),
    "SMQ040": ("Current cigarette smoking", "", "Lifestyle", "Currently smoke cigarettes (Every day=1, Some days=2, Not at all=3). For never-smokers (SMQ020=No), NHANES skips this question and the model uses the structural skip value 3; live input must still say 'Not at all'."),
}

RANGES = {
    "RIDAGEYR": (18, 80),
    "BMXHT": (131.1, 198.7),
    "BMXWT": (39.6, 204.6),
    "BMXWAIST": (61.1, 178.0),
    "BMXBMI": (15.4317, 67.0369),
    "BPXOSY1": (66.0, 217.0),
    "BPXODI1": (36.0, 131.0),
    "LBXGH": (2.8, 15.2),
    "LBXGLU": (47.0, 451.0),
    "LBXTC": (76, 428),
    "LBDLDL": (7, 357),
    "LBDHDD": (11, 187),
    "LBXTR": (10.0, 399.0),
    "LBXIN": (0.71, 512.5),
}

MEANS = {
    "RIDAGEYR": 49.13,
    "BMXHT": 167.23,
    "BMXWT": 83.29,
    "BMXWAIST": 100.28,
    "BMXBMI": 29.7088,
    "BPXOSY1": 123.61,
    "BPXODI1": 74.71,
    "LBXGH": 5.83,
    "LBXGLU": 112.19,
    "LBXTC": 182.64,
    "LBDLDL": 108.23,
    "LBDHDD": 53.67,
    "LBXTR": 103.72,
    "LBXIN": 14.66,
}

DISPLAY = {
    "BMXWAIST": {"unit": "in", "factor": 2.54},
}

FIELD_MAP = {
    "RIDAGEYR": "demographics.age",
    "RIAGENDR": "demographics.sex",
    "BMXHT": "bodyComposition.heightCm",
    "BMXWT": "bodyComposition.weightKg",
    "BMXWAIST": "bodyComposition.waistCm",
    "BMXBMI": "bodyComposition.bmi",
    "BPXOSY1": "bloodPressure.systolicBP",
    "BPXODI1": "bloodPressure.diastolicBP",
    "BPQ020": "bloodPressure.hypertensionDiagnosis",
    "LBXGH": "metabolic.hba1c",
    "LBXGLU": "metabolic.fastingGlucose",
    "LBXTC": "lipids.totalCholesterol",
    "LBDLDL": "lipids.ldlCholesterol",
    "LBDHDD": "lipids.hdlCholesterol",
    "LBXTR": "lipids.triglycerides",
    "LBXIN": "metabolic.insulin",
    "SMQ020": "lifestyle.everSmoked100",
    "SMQ040": "lifestyle.currentSmoking",
}

DERIVED = {"BMXBMI"}

CATEGORICAL = {
    "RIAGENDR": ("Male", "Female"),
    "BPQ020": ("Yes", "No"),
    "SMQ020": ("Yes", "No"),
    "SMQ040": ("Every day", "Some days", "Not at all"),
}

CATEGORIES = {
    "demographics": "Demographics",
    "bodyComposition": "Body Composition",
    "bloodPressure": "Blood Pressure & History",
    "metabolic": "Metabolic Panel",
    "lipids": "Lipid Panel",
    "lifestyle": "Lifestyle",
}

FEATURE_CATEGORY = {
    "RIDAGEYR": "demographics",
    "RIAGENDR": "demographics",
    "BMXHT": "bodyComposition",
    "BMXWT": "bodyComposition",
    "BMXWAIST": "bodyComposition",
    "BMXBMI": "bodyComposition",
    "BPXOSY1": "bloodPressure",
    "BPXODI1": "bloodPressure",
    "BPQ020": "bloodPressure",
    "LBXGH": "metabolic",
    "LBXGLU": "metabolic",
    "LBXIN": "metabolic",
    "LBXTC": "lipids",
    "LBDLDL": "lipids",
    "LBDHDD": "lipids",
    "LBXTR": "lipids",
    "SMQ020": "lifestyle",
    "SMQ040": "lifestyle",
}


def main() -> None:
    features = []
    for name in FEATURES:
        label, unit, domain, notes = META[name]
        entry = {
            "name": name,
            "label": label,
            "unit": unit,
            "domain": domain,
            "category": FEATURE_CATEGORY[name],
            "notes": notes,
            "required": True,
            "field": FIELD_MAP[name],
        }
        if name in DERIVED:
            entry["derived"] = True
        if name in DISPLAY:
            entry["display"] = DISPLAY[name]
        if name in CATEGORICAL:
            options = list(CATEGORICAL[name])
            entry["type"] = "categorical"
            entry["options"] = options
            entry["encode"] = {opt: code for code, opt in enumerate(options, start=1)}
        else:
            entry["type"] = "continuous"
            lo, hi = RANGES[name]
            entry["min"] = lo
            entry["max"] = hi
            if name in MEANS:
                entry["mean"] = MEANS[name]
        features.append(entry)

    contract = {
        "schema_version": "3.0.0",
        "training_cohort": "NHANES 2017-March 2020 adults 18-80 with complete observed model features; no continuous imputation; unknown categorical codes excluded",
        "model": "CardioAI_Clinical_Model.pkl",
        "target": "Composite_CVD",
        "feature_count": len(FEATURES),
        "feature_order": FEATURES,
        "calibration": "isotonic",
        "risk_thresholds": {"low": 0.05, "high": 0.20},
        "categories": CATEGORIES,
        "subgroup_labels": {},
        "features": features,
    }

    out = os.path.join(ROOT, "feature_contract.json")
    with open(out, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(contract, fh, indent=2, ensure_ascii=False)
    print(f"Wrote {out} with {len(FEATURES)} features.")
    print("Order: " + ", ".join(FEATURES))


if __name__ == "__main__":
    if "--check" not in sys.argv:
        main()
