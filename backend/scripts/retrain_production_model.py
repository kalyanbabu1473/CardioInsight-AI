"""Retrain the production Random Forest on the 44-feature consensus set.

CardioInsight no longer collects ``SMQ020`` (ever smoked 100+ cigarettes) or
``SMQ866`` (time in a bar last 7 days); instead the wizard gathers gender
(``RIAGENDR``), current smoking status (``SMQ040``), and alcoholic drinks per
day (``ALQ130``). This script reproduces the exact notebook-06 pipeline
(SMOTE over-sampling, 500 trees, max_depth=20, class_weight='balanced',
random_state=42, reproducible 80/20 strat-split of ``ML_READY_DATASET.csv``) on
the new 44-feature training matrix. The new model's ``feature_names_in_`` then
defines the authoritative 44-feature order the contract must match.

``ALQ130`` sentinel codes above the NHANES codebook maximum (25 drinks/day) are
capped at 25 so the training distribution matches what the form can send.

Run from repo root:
    backend/.venv/Scripts/python backend/scripts/retrain_production_model.py
"""

import os

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, matthews_corrcoef, roc_auc_score
from sklearn.model_selection import train_test_split

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUTS = os.path.join(ROOT, "Outputs")
SOURCE_CSV = os.path.join(OUTPUTS, "ML_READY_DATASET.csv")
MODEL_OUT = os.path.join(ROOT, "Models", "Random_Forest_Model.pkl")

ALQ130_CAP = 25.0  # NHANES ALQ130 codebook maximum (drinks/day)

# Authoritative 44-feature order. Replaces SMQ020/SMQ866 with RIAGENDR
# (gender), SMQ040 (current smoking status) and ALQ130 (alcohol drinks/day).
FEATURES = [
    "BMXWT", "BMXWAIST", "BPQ020", "BPQ090D", "LBXGH", "MCQ160A",
    "PAD680", "RIDAGEYR", "RIAGENDR", "SMQ856", "SMQ040", "LBXBCD",
    "BMXHT", "BMXBMI", "URXUPB", "URXUTL", "URXBCEP", "BPXOSY1",
    "BPQ080", "BPXOSY2", "BPXOSY3", "LBXGLU", "LBXBSE", "LBXBPB",
    "LBDLDL", "LBXNFOA", "LBXMFOS", "DR1TCAFF", "ALQ130", "LBXPFNA",
    "LBXTC", "LBXPFHS", "URXBDCP", "URXDPHP", "URXUCO", "URXUCD",
    "URXUBA", "LBXTR", "URXUSB", "URXUTU", "LBXNFOS", "INDFMPIR",
    "LBDHDD", "LBXIN",
]

DROPPED = {"SMQ020", "SMQ866"}


def main() -> None:
    df = pd.read_csv(SOURCE_CSV)

    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise SystemExit("Missing columns in dataset: %s" % ", ".join(missing))
    if any(c in df.columns for c in DROPPED):
        print("Note: dropped features %s still present; ignoring them." % sorted(DROPPED))

    X = df[FEATURES].copy()
    y = df["Composite_CVD"]

    # ALQ130 values above the NHANES codebook max are sentinel/refused codes
    # (e.g. 777, 999); cap at 25 so the model only sees in-distribution values.
    X["ALQ130"] = X["ALQ130"].clip(upper=ALQ130_CAP)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print("Train/test split:", X_train.shape, X_test.shape)

    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
    print("After SMOTE:", X_train_bal.shape)

    model = RandomForestClassifier(
        n_estimators=500,
        max_depth=20,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    model.fit(X_train_bal, y_train_bal)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    print("Accuracy : %.4f" % accuracy_score(y_test, y_pred))
    print("ROC AUC  : %.4f" % roc_auc_score(y_test, y_prob))
    print("F1 Score : %.4f" % f1_score(y_test, y_pred))
    print("MCC      : %.4f" % matthews_corrcoef(y_test, y_pred))
    print("n_features:", model.n_features_in_)

    names = list(model.feature_names_in_)
    assert names == FEATURES, "Feature order mismatch with canonical list"
    print("Feature order OK (%d features)." % len(names))

    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    print("Saved:", MODEL_OUT)

    # Persist the canonical order + refreshed matrices so future retrains and
    # the contract builder share one source of truth.
    with open(os.path.join(OUTPUTS, "Final_Selected_Features.csv"), "w", encoding="utf-8") as fh:
        fh.write("Feature\n")
        fh.write("\n".join(FEATURES))
        fh.write("\n")
    X_train.to_csv(os.path.join(OUTPUTS, "X_train_final.csv"), index=False)
    X_test.to_csv(os.path.join(OUTPUTS, "X_test_final.csv"), index=False)
    y_train.to_csv(os.path.join(OUTPUTS, "y_train_final.csv"), index=False)
    y_test.to_csv(os.path.join(OUTPUTS, "y_test_final.csv"), index=False)
    print("Wrote Final_Selected_Features.csv and train/test matrices.")


if __name__ == "__main__":
    main()