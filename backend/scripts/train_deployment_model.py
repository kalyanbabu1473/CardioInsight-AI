"""Train the CardioInsight production deployment model.

This model is trained specifically on the 20 clinical NHANES features that the
CardioInsight assessment wizard actually collects. The repository also contains
research models (CardioAI_Model.pkl 20-feature; Random_Forest_Model.pkl
43-feature) whose feature sets include environmental toxicants (PFAS serum
levels, urinary cadmium), survey-only missingness flags (SMQ856,
*_WASMISSING), and co-morbidity history that a clinical intake form cannot
collect. Feeding fabricated values for those features would be scientifically
invalid, so this script reproduces the same Random Forest pipeline that every
research notebook uses (500 trees, max_depth=20, class_weight='balanced',
random_state=42, 80/20 strat-split) but only on the features the wizard
actually gathers.

The risk category thresholds (p < 0.30 Low, 0.30-0.70 Moderate, >= 0.70 High)
match the risk_categories() function in
13_Deploymnet_Model_&_Clinical_Risk_predictin.ipynb.
"""

import argparse
import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, matthews_corrcoef, roc_auc_score
from sklearn.model_selection import train_test_split

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE_CSV = os.path.join(ROOT, "Outputs", "ML_READY_DATASET.csv")

# Exactly the 20 features the assessment wizard can populate.
FEATURES = [
    "RIDAGEYR",  # age (years)
    "RIAGENDR",  # sex: 1 = Male, 2 = Female
    "RIDRETH3",  # race: 1/2/3/4/6/7
    "BMXHT",  # height (cm)
    "BMXWT",  # weight (kg)
    "BMXWAIST",  # waist circumference (cm)
    "BMXBMI",  # body mass index (kg/m2)
    "BPXOSY1",  # systolic BP first reading (mmHg)
    "BPXODI1",  # diastolic BP first reading (mmHg)
    "BPQ020",  # ever told had high blood pressure (1=Yes, 2=No)
    "BPQ040A",  # now taking BP medication (1=Yes, 2=No)
    "LBXGH",  # glycohemoglobin / HbA1c (%)
    "LBXGLU",  # fasting serum glucose (mg/dL)
    "LBXTC",  # total cholesterol (mg/dL)
    "LBDLDL",  # direct LDL cholesterol (mg/dL)
    "LBDHDD",  # direct HDL cholesterol (mg/dL)
    "LBXTR",  # triglycerides (mg/dL)
    "LBXIN",  # serum insulin (uU/mL)
    "SMQ020",  # ever smoked 100 cigarettes (1=Yes, 2=No)
    "SMQ040",  # now smoke cigarettes (1=Daily, 2=Some days, 3=Not at all)
]


def risk_category(prob):
    """Replicates the risk_category() of notebook 13 using probability (0-1)."""
    if prob < 0.30:
        return "Low"
    if prob < 0.70:
        return "Moderate"
    return "High"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-model",
        default=os.path.join(ROOT, "Models", "CardioAI_Assessment_Model.pkl"),
    )
    parser.add_argument("--out-features", default=os.path.join(ROOT, "Models", "CardioAI_Assessment_Features.pkl"))
    args = parser.parse_args()

    print("Loading", SOURCE_CSV)
    df = pd.read_csv(SOURCE_CSV)

    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise SystemExit("Missing columns in dataset: %s" % ", ".join(missing))

    X = df[FEATURES].copy()
    y = df["Composite_CVD"]

    # Categorical codes 7 (refused) and 9 (don't know) are treated as noise and
    # mapped to 2 (No) so the training distribution matches what the form sends.
    for col in ["BPQ020", "BPQ040A", "SMQ020", "SMQ040"]:
        if col in ["SMQ040"]:
            X[col] = X[col].replace({7: 3, 9: 3})
        else:
            X[col] = X[col].replace({7: 2, 9: 2})

    print("Adult rows:", len(df))
    print("Features:", len(FEATURES))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=500,
        max_depth=20,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("Accuracy : %.4f" % accuracy_score(y_test, y_pred))
    print("ROC AUC  : %.4f" % roc_auc_score(y_test, y_prob))
    print("F1 Score : %.4f" % f1_score(y_test, y_pred))
    print("MCC      : %.4f" % matthews_corrcoef(y_test, y_pred))

    os.makedirs(os.path.dirname(args.out_model), exist_ok=True)
    joblib.dump(model, args.out_model)
    joblib.dump(FEATURES, args.out_features)
    print("Saved model:", args.out_model)
    print("Saved features:", args.out_features)


if __name__ == "__main__":
    main()