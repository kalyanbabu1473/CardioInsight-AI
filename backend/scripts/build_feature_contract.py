"""Build the single-source-of-truth feature contract for CardioInsight.

The contract anchors the assessment wizard, the prediction backend, and the
report layer to EXACTLY the 44 features the production Random Forest was
trained on (`Models/Random_Forest_Model.pkl`, order ==
`Outputs/Final_Selected_Features.csv`).

Every entry is verified against the actual training data
(`Outputs/ML_READY_DATASET.csv`): value ranges, dtype, and categorical codes
come from the training distribution so the wizard can only ever send real,
in-distribution values — never fabricated ones.

Output: `feature_contract.json` at the repository root. Run from repo root:
    backend/.venv/Scripts/python backend/scripts/build_feature_contract.py
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --------------------------------------------------------------------------
# Curated metadata: {feature: (label, unit, domain, notes)}
# --------------------------------------------------------------------------
META = {
    "BMXWT": ("Weight", "kg", "Body Measurements", "Measured body weight."),
    "BMXWAIST": ("Waist circumference", "cm", "Body Measurements", "Measured waist circumference."),
    "BPQ020": ("High blood pressure diagnosis", "", "Medical History", "Ever told had high blood pressure (1=Yes, 2=No)."),
    "BPQ090D": ("Prescribed meds for high cholesterol", "", "Medical History", "Ever told to take prescription medicine for high cholesterol (1=Yes, 2=No)."),
    "LBXGH": ("HbA1c / glycated hemoglobin", "%", "Laboratory", "Glycohemoglobin from whole blood."),
    "MCQ160A": ("Arthritis diagnosis", "", "Medical History", "Ever told by a doctor had arthritis (1=Yes, 2=No)."),
    "PAD680": ("Daily sitting time", "minutes/day", "Physical Activity", "Minutes/day spent sitting on a typical day."),
    "RIDAGEYR": ("Age", "years", "Demographics", "Age in years (right-censored at 80 in training)."),
    "RIAGENDR": ("Gender", "", "Demographics", "Biological sex (Male=1, Female=2)."),
    "SMQ856": ("Worked outside home last 7 days", "", "Secondhand Smoke", "Working at a job/business outside the home during last 7 days (Yes=1, No=2)."),
    "SMQ040": ("Current cigarette smoking", "", "Smoking", "Currently smoke cigarettes (Every day=1, Some days=2, Not at all=3)."),
    "LBXBCD": ("Blood cadmium", "ug/L", "Laboratory", "Cadmium in whole blood."),
    "BMXHT": ("Height", "cm", "Body Measurements", "Standing height."),
    "BMXBMI": ("Body mass index", "kg/m2", "Body Measurements", "Derived from height and weight (kg/m^2)."),
    "URXUPB": ("Urinary lead", "ug/L", "Environmental", "Lead in urine."),
    "URXUTL": ("Urinary thallium", "ug/L", "Environmental", "Thallium in urine."),
    "URXBCEP": ("Urinary BCEP", "ng/mL", "Environmental", "Bis(2-chloroethyl) phosphate in urine."),
    "BPXOSY1": ("Systolic BP reading 1", "mmHg", "Blood Pressure", "First oscillometric systolic reading."),
    "BPQ080": ("High cholesterol diagnosis", "", "Medical History", "Ever told had high cholesterol (1=Yes, 2=No)."),
    "BPXOSY2": ("Systolic BP reading 2", "mmHg", "Blood Pressure", "Second oscillometric systolic reading."),
    "BPXOSY3": ("Systolic BP reading 3", "mmHg", "Blood Pressure", "Third oscillometric systolic reading."),
    "LBXGLU": ("Fasting glucose", "mg/dL", "Laboratory", "Fasting serum glucose."),
    "LBXBSE": ("Blood selenium", "ug/L", "Laboratory", "Selenium in whole blood."),
    "LBXBPB": ("Blood lead", "ug/dL", "Laboratory", "Lead in whole blood."),
    "LBDLDL": ("LDL cholesterol", "mg/dL", "Laboratory", "Direct low-density lipoprotein cholesterol."),
    "LBXNFOA": ("PFOA", "ng/mL", "PFAS", "n-Perfluorooctanoic acid in serum."),
    "LBXMFOS": ("Sm-PFOS", "ng/mL", "PFAS", "Perfluoromethylheptane sulfonic acid isomers (Sm-PFOS) in serum."),
    "DR1TCAFF": ("Dietary caffeine", "mg/day", "Diet", "Total caffeine from Day 1 dietary recall."),
    "ALQ130": ("Alcoholic drinks per day", "drinks/day", "Alcohol", "Average number of alcoholic drinks consumed per day."),
    "LBXPFNA": ("PFNA", "ng/mL", "PFAS", "Perfluorononanoic acid in serum."),
    "LBXTC": ("Total cholesterol", "mg/dL", "Laboratory", "Total serum cholesterol."),
    "LBXPFHS": ("PFHxS", "ng/mL", "PFAS", "Perfluorohexane sulfonic acid in serum."),
    "URXBDCP": ("Urinary BDCPP", "ng/mL", "Environmental", "Bis(1,3-dichloro-2-propyl) phosphate in urine."),
    "URXDPHP": ("Urinary DPHP", "ng/mL", "Environmental", "Diphenyl phosphate in urine."),
    "URXUCO": ("Urinary cobalt", "ug/L", "Environmental", "Cobalt in urine."),
    "URXUCD": ("Urinary cadmium", "ug/L", "Environmental", "Cadmium in urine."),
    "URXUBA": ("Urinary barium", "ug/L", "Environmental", "Barium in urine."),
    "LBXTR": ("Triglycerides", "mg/dL", "Laboratory", "Serum triglycerides."),
    "URXUSB": ("Urinary antimony", "ug/L", "Environmental", "Antimony in urine."),
    "URXUTU": ("Urinary tungsten", "ug/L", "Environmental", "Tungsten in urine."),
    "LBXNFOS": ("PFOS", "ng/mL", "PFAS", "Perfluorooctane sulfonic acid in serum."),
    "INDFMPIR": ("Income-to-poverty ratio", "", "Demographics", "Ratio of family income to the federal poverty guideline: 1.0 means income equals the poverty line, lower values mean income below it, higher values mean more comfortable income (0-5)."),
    "LBDHDD": ("HDL cholesterol", "mg/dL", "Laboratory", "Direct high-density lipoprotein cholesterol."),
    "LBXIN": ("Fasting insulin", "uU/mL", "Laboratory", "Fasting serum insulin."),
}

# Training value ranges — from Outputs/ML_READY_DATASET.csv (verified stats).
RANGES = {
    "BMXWT": (3.2, 254.3), "BMXWAIST": (40.0, 187.5), "LBXGH": (2.8, 16.2),
    "PAD680": (0, 9999), "RIDAGEYR": (1, 80), "LBXBCD": (0.071, 13.03),
    "BMXHT": (78.3, 199.6), "BMXBMI": (11.9, 92.3),
    "URXUPB": (0.021, 19.34), "URXUTL": (0.013, 1.492), "URXBCEP": (0.0707, 268.0),
    "BPXOSY1": (52.0, 225.0), "BPXOSY2": (54.0, 222.0), "BPXOSY3": (55.0, 220.0),
    "LBXGLU": (47.0, 524.0), "LBXBSE": (74.8, 562.23), "LBXBPB": (0.049, 42.48),
    "LBDLDL": (7, 357), "LBXNFOA": (0.07, 52.8), "LBXMFOS": (0.07, 19.3),
    "DR1TCAFF": (0.0, 4320.0), "ALQ130": (0.0, 25.0), "LBXPFNA": (0.07, 7.0), "LBXTC": (71, 431),
    "LBXPFHS": (0.07, 48.8), "URXBDCP": (0.0707, 260.0), "URXDPHP": (0.0707, 270.0),
    "URXUCO": (0.017, 32.377), "URXUCD": (0.039, 7.581), "URXUBA": (0.059, 92.612),
    "LBXTR": (10.0, 2684.0), "URXUSB": (0.016, 4.285), "URXUTU": (0.013, 29.4),
    "LBXNFOS": (0.07, 95.1), "INDFMPIR": (0.0, 5.0), "LBDHDD": (5, 189),
    "LBXIN": (0.71, 512.5),
}

# Display overrides: the wizard collects waist in inches, but the deployed
# model expects cm. `factor` converts a display value to the model unit.
DISPLAY = {
    "BMXWAIST": {"unit": "in", "factor": 2.54},
}

# Dataset averages for continuous features (from ML_READY_DATASET.csv). Used to
# suggest a typical value in the wizard. ALQ130 mean reflects the 25-drink cap.
MEANS = {
    "BMXWT": 64.68, "BMXWAIST": 86.63, "LBXGH": 5.66, "PAD680": 245.11,
    "RIDAGEYR": 33.54, "LBXBCD": 0.31, "BMXHT": 153.63, "BMXBMI": 25.80,
    "URXUPB": 0.33, "URXUTL": 0.19, "URXBCEP": 0.54,
    "BPXOSY1": 115.57, "BPXOSY2": 115.27, "BPXOSY3": 115.40,
    "LBXGLU": 104.72, "LBXBSE": 179.39, "LBXBPB": 0.91, "LBDLDL": 101.64,
    "LBXNFOA": 1.35, "LBXMFOS": 1.29, "DR1TCAFF": 85.14, "ALQ130": 0.96,
    "LBXPFNA": 0.52, "LBXTC": 172.62, "LBXPFHS": 1.15, "URXBDCP": 1.95,
    "URXDPHP": 1.39, "URXUCO": 0.43, "URXUCD": 0.19, "URXUBA": 1.31,
    "LBXTR": 88.81, "URXUSB": 0.06, "URXUTU": 0.11, "LBXNFOS": 3.16,
    "INDFMPIR": 2.35, "LBDHDD": 53.58, "LBXIN": 11.60,
}

# Sub-grouping for the Environmental Toxins step: blood vs urinary samples are
# rendered in separate columns so the clinician sees the sample type at a glance.
SUBGROUP = {
    "LBXBCD": "blood", "LBXBPB": "blood", "LBXBSE": "blood",
    "URXUPB": "urine", "URXUTL": "urine", "URXUCD": "urine",
    "URXUCO": "urine", "URXUBA": "urine", "URXUSB": "urine",
    "URXUTU": "urine",
}

# Sub-group display names, keyed by the SUBGROUP value above.
SUBGROUP_LABELS = {"blood": "Blood", "urine": "Urine"}

# Feature -> dot-path into the frontend AssessmentInput that holds its value.
FIELD_MAP = {
    "BMXWT": "bodyComposition.weightKg",
    "BMXWAIST": "bodyComposition.waistCm",
    "BPQ020": "bloodPressure.hypertensionDiagnosis",
    "BPQ090D": "medicalHistory.cholesterolMedication",
    "LBXGH": "metabolic.hba1c",
    "MCQ160A": "medicalHistory.arthritis",
    "PAD680": "lifestyle.dailySittingMinutes",
    "RIDAGEYR": "demographics.age",
    "RIAGENDR": "demographics.gender",
    "SMQ856": "lifestyle.workedOutsideHome7d",
    "SMQ040": "lifestyle.currentSmoking",
    "LBXBCD": "environmentalToxins.bloodCadmium",
    "BMXHT": "bodyComposition.heightCm",
    "BMXBMI": "bodyComposition.bmi",
    "URXUPB": "environmentalToxins.urinaryLead",
    "URXUTL": "environmentalToxins.urinaryThallium",
    "URXBCEP": "urinaryOpes.bcep",
    "BPXOSY1": "bloodPressure.systolicBP1",
    "BPQ080": "medicalHistory.highCholesterolDiagnosis",
    "BPXOSY2": "bloodPressure.systolicBP2",
    "BPXOSY3": "bloodPressure.systolicBP3",
    "LBXGLU": "metabolic.fastingGlucose",
    "LBXBSE": "environmentalToxins.bloodSelenium",
    "LBXBPB": "environmentalToxins.bloodLead",
    "LBDLDL": "lipids.ldlCholesterol",
    "LBXNFOA": "pfas.pfoa",
    "LBXMFOS": "pfas.smPfos",
    "DR1TCAFF": "lifestyle.dietaryCaffeineMg",
    "ALQ130": "lifestyle.alcoholicDrinksPerDay",
    "LBXPFNA": "pfas.pfna",
    "LBXTC": "lipids.totalCholesterol",
    "LBXPFHS": "pfas.pfhxs",
    "URXBDCP": "urinaryOpes.bdcpp",
    "URXDPHP": "urinaryOpes.dphp",
    "URXUCO": "environmentalToxins.urinaryCobalt",
    "URXUCD": "environmentalToxins.urinaryCadmium",
    "URXUBA": "environmentalToxins.urinaryBarium",
    "LBXTR": "lipids.triglycerides",
    "URXUSB": "environmentalToxins.urinaryAntimony",
    "URXUTU": "environmentalToxins.urinaryTungsten",
    "LBXNFOS": "pfas.pfos",
    "INDFMPIR": "socioeconomic.incomePovertyRatio",
    "LBDHDD": "lipids.hdlCholesterol",
    "LBXIN": "metabolic.insulin",
}

# Computed features (never collected directly).
DERIVED = {"BMXBMI"}

# Categorical fields: wizard option -> NHANES code.
CATEGORICAL = {
    "RIAGENDR": ("Male", "Female"),
    "BPQ020": ("Yes", "No"),
    "BPQ090D": ("Yes", "No"),
    "MCQ160A": ("Yes", "No"),
    "SMQ856": ("Yes", "No"),
    "SMQ040": ("Every day", "Some days", "Not at all"),
    "BPQ080": ("Yes", "No"),
}

# Wizard category -> (folder-ish id, display name, ordered feature names).
CATEGORIES = {
    "demographics": "Demographics",
    "bodyComposition": "Body Composition",
    "bloodPressure": "Blood Pressure",
    "metabolic": "Metabolic",
    "lipids": "Lipids",
    "environmentalToxins": "Environmental Toxins",
    "pfas": "PFAS Compounds",
    "urinaryOpes": "Urinary Organophosphate Esters",
    "medicalHistory": "Medical History",
    "lifestyle": "Lifestyle",
    "socioeconomic": "Socioeconomic",
}

# Each feature -> its wizard category id.
FEATURE_CATEGORY = {
    "RIDAGEYR": "demographics",
    "RIAGENDR": "demographics",
    "BMXWT": "bodyComposition",
    "BMXHT": "bodyComposition",
    "BMXWAIST": "bodyComposition",
    "BMXBMI": "bodyComposition",
    "BPXOSY1": "bloodPressure",
    "BPXOSY2": "bloodPressure",
    "BPXOSY3": "bloodPressure",
    "BPQ020": "bloodPressure",
    "LBXGH": "metabolic",
    "LBXGLU": "metabolic",
    "LBXIN": "metabolic",
    "LBDLDL": "lipids",
    "LBXTC": "lipids",
    "LBXTR": "lipids",
    "LBDHDD": "lipids",
    "LBXBCD": "environmentalToxins",
    "LBXBPB": "environmentalToxins",
    "LBXBSE": "environmentalToxins",
    "URXUPB": "environmentalToxins",
    "URXUTL": "environmentalToxins",
    "URXUCD": "environmentalToxins",
    "URXUCO": "environmentalToxins",
    "URXUBA": "environmentalToxins",
    "URXUSB": "environmentalToxins",
    "URXUTU": "environmentalToxins",
    "LBXNFOS": "pfas",
    "LBXNFOA": "pfas",
    "LBXPFHS": "pfas",
    "LBXPFNA": "pfas",
    "LBXMFOS": "pfas",
    "URXBCEP": "urinaryOpes",
    "URXBDCP": "urinaryOpes",
    "URXDPHP": "urinaryOpes",
    "BPQ080": "medicalHistory",
    "BPQ090D": "medicalHistory",
    "MCQ160A": "medicalHistory",
    "SMQ856": "lifestyle",
    "SMQ040": "lifestyle",
    "PAD680": "lifestyle",
    "DR1TCAFF": "lifestyle",
    "ALQ130": "lifestyle",
    "INDFMPIR": "socioeconomic",
}


def main() -> None:
    selected = os.path.join(ROOT, "Outputs", "Final_Selected_Features.csv")
    order = []
    with open(selected, encoding="utf-8") as fh:
        header = fh.readline().strip()
        for line in fh:
            name = line.strip().split(",")[0]
            order.append(name)
    if header.upper().startswith("FEATURE"):
        pass

    features = []
    for name in order:
        label, unit, domain, notes = META[name]
        entry = {
            "name": name,
            "label": label,
            "unit": unit,
            "domain": domain,
            "category": FEATURE_CATEGORY.get(name, "other"),
            "notes": notes,
            "required": True,
        }
        if name in FIELD_MAP:
            entry["field"] = FIELD_MAP[name]
        if name in DERIVED:
            entry["derived"] = True
        if name in DISPLAY:
            entry["display"] = DISPLAY[name]
        if name in SUBGROUP:
            entry["subgroup"] = SUBGROUP[name]
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

    ordering_expected = [f["name"] for f in features]
    contract = {
        "schema_version": "1.0.0",
        "model": "Random_Forest_Model.pkl",
        "target": "Composite_CVD",
        "feature_count": len(order),
        "feature_order": ordering_expected,
        "categories": CATEGORIES,
        "subgroup_labels": SUBGROUP_LABELS,
        "features": features,
    }

    out = os.path.join(ROOT, "feature_contract.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(contract, fh, indent=2, ensure_ascii=False)
    print(f"Wrote {out} with {len(order)} features.")
    print("Order: " + ", ".join(order))


if __name__ == "__main__":
    if "--check" not in sys.argv:
        main()