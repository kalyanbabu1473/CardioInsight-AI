"""Train the deployable CardioInsight clinical Random Forest.

The deployed model uses 18 clinical features a clinical intake can collect
directly, with BMI derived from height and weight. Training and inference share
``app.ml.preprocessing`` so the model sees exactly the same transformations:

* no continuous imputation (complete-case cohort);
* adult-only cohort (18-80 years);
* never-smokers use the NHANES structural skip value SMQ040=3;
* refused/unknown categorical codes are excluded, never mapped to an answer.

Probability calibration is fitted on out-of-fold predictions from the training
split only, so the held-out test set remains untouched for evaluation.

Run from the repository root:
    backend/.venv/Scripts/python backend/scripts/train_clinical_model.py
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.core.feature_contract import feature_order  # noqa: E402
from app.ml.preprocessing import (  # noqa: E402
    AGE_MAX,
    AGE_MIN,
    build_training_frame,
    exclusion_summary,
)

SOURCE_CSV = ROOT / "Outputs" / "ML_READY_DATASET.csv"
MODEL_OUT = ROOT / "Models" / "CardioAI_Clinical_Model.pkl"
CALIBRATOR_OUT = ROOT / "Models" / "CardioAI_Clinical_Calibrator.pkl"
FEATURES_OUT = ROOT / "Models" / "CardioAI_Clinical_Features.pkl"
METRICS_OUT = ROOT / "Models" / "CardioAI_Clinical_Metrics.json"
IMPORTANCE_OUT = ROOT / "Models" / "CardioAI_Clinical_Feature_Importance.csv"
PREPROCESSING_OUT = ROOT / "Models" / "CardioAI_Clinical_Preprocessing.json"

SEED = 42
THRESHOLDS = (0.05, 0.20)
BOOTSTRAP_ITERATIONS = 2000


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _safe_number(value) -> float | None:
    number = float(value)
    return number if np.isfinite(number) else None


def _threshold_metrics(y: np.ndarray, p: np.ndarray, threshold: float) -> dict:
    predicted = (p >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, predicted, labels=[0, 1]).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) else None
    specificity = tn / (tn + fp) if (tn + fp) else None
    ppv = tp / (tp + fp) if (tp + fp) else None
    npv = tn / (tn + fn) if (tn + fn) else None
    f1 = 2 * ppv * sensitivity / (ppv + sensitivity) if ppv and sensitivity else 0.0
    return {
        "threshold": threshold,
        "predicted_positive": int(predicted.sum()),
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
        "sensitivity": _safe_number(sensitivity) if sensitivity is not None else None,
        "specificity": _safe_number(specificity) if specificity is not None else None,
        "ppv": _safe_number(ppv) if ppv is not None else None,
        "npv": _safe_number(npv) if npv is not None else None,
        "f1": _safe_number(f1),
        "accuracy": _safe_number((tp + tn) / len(y)),
    }


def _calibration_fit(y: np.ndarray, p: np.ndarray) -> dict:
    q = np.clip(p, 1e-6, 1.0 - 1e-6)
    logit = np.log(q / (1.0 - q)).reshape(-1, 1)
    fit = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=1000).fit(logit, y)
    return {
        "intercept": _safe_number(fit.intercept_[0]),
        "slope": _safe_number(fit.coef_[0][0]),
    }


def _bootstrap_ci(
    y: np.ndarray,
    p: np.ndarray,
    rng: np.random.Generator,
    iterations: int = BOOTSTRAP_ITERATIONS,
) -> dict:
    aucs: list[float] = []
    briers: list[float] = []
    average_precisions: list[float] = []
    n = len(y)
    for _ in range(iterations):
        idx = rng.integers(0, n, n)
        sample_y = y[idx]
        if len(np.unique(sample_y)) < 2:
            continue
        sample_p = p[idx]
        aucs.append(float(roc_auc_score(sample_y, sample_p)))
        briers.append(float(brier_score_loss(sample_y, sample_p)))
        average_precisions.append(float(average_precision_score(sample_y, sample_p)))

    def interval(values: list[float]) -> list[float] | None:
        if not values:
            return None
        lower, upper = np.percentile(values, [2.5, 97.5])
        return [_safe_number(lower), _safe_number(upper)]

    return {
        "iterations_requested": iterations,
        "iterations_valid": len(aucs),
        "roc_auc_95_ci": interval(aucs),
        "brier_95_ci": interval(briers),
        "average_precision_95_ci": interval(average_precisions),
    }


def _subgroup_metrics(
    frame: pd.DataFrame,
    y: np.ndarray,
    p: np.ndarray,
    rng: np.random.Generator,
) -> list[dict]:
    groups = {
        "sex:Male": frame["RIAGENDR"].eq(1).to_numpy(),
        "sex:Female": frame["RIAGENDR"].eq(2).to_numpy(),
        "age:18-39": frame["RIDAGEYR"].between(18, 39).to_numpy(),
        "age:40-59": frame["RIDAGEYR"].between(40, 59).to_numpy(),
        "age:60-80": frame["RIDAGEYR"].between(60, 80).to_numpy(),
    }
    results = []
    for name, mask in groups.items():
        group_y = y[mask]
        group_p = p[mask]
        events = int(group_y.sum())
        non_events = int(len(group_y) - events)
        reliable = events >= 10 and non_events >= 10
        auc = (
            _safe_number(roc_auc_score(group_y, group_p))
            if events > 0 and non_events > 0
            else None
        )
        brier = _safe_number(brier_score_loss(group_y, group_p)) if len(group_y) else None
        ci = _bootstrap_ci(group_y, group_p, rng) if reliable else None
        results.append(
            {
                "group": name,
                "n": int(len(group_y)),
                "events": events,
                "non_events": non_events,
                "prevalence": _safe_number(events / len(group_y)) if len(group_y) else None,
                "roc_auc": auc,
                "brier": brier,
                "reliable": reliable,
                "uncertainty": ci,
                "note": (
                    "AUC/Brier reported; uncertainty estimated by bootstrap."
                    if reliable
                    else "Too few events or non-events for a reliable subgroup estimate."
                ),
            }
        )
    return results


def main() -> None:
    df = pd.read_csv(SOURCE_CSV)
    features = feature_order()
    if len(features) != 18:
        raise SystemExit(f"Expected 18 features, contract has {len(features)}")
    missing = [name for name in features if name not in df.columns]
    if missing:
        raise SystemExit("Missing columns in dataset: %s" % ", ".join(missing))

    X, y = build_training_frame(df)
    exclusions = exclusion_summary(df)
    if not 0 < int(y.sum()) < len(y):
        raise SystemExit("Training cohort does not contain both outcome classes.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )
    y_train_array = np.asarray(y_train)
    y_test_array = np.asarray(y_test)

    model = RandomForestClassifier(
        n_estimators=500,
        max_depth=20,
        class_weight="balanced",
        random_state=SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    oof = cross_val_predict(
        model,
        X_train,
        y_train,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED),
        method="predict_proba",
        n_jobs=-1,
    )[:, 1]
    calibrator = IsotonicRegression(out_of_bounds="clip").fit(oof, y_train)

    raw_test = model.predict_proba(X_test)[:, 1]
    calibrated_test = np.clip(np.asarray(calibrator.predict(raw_test)), 0.0, 1.0)
    predicted_high = (calibrated_test >= 0.20).astype(int)
    rng = np.random.default_rng(SEED)

    metrics = {
        "model": "Random_Forest_Clinical_18_AdultCompleteCase",
        "metrics_version": "2.0.0",
        "calibration": "isotonic",
        "feature_count": len(features),
        "target": "Composite_CVD (prevalent self-reported CVD)",
        "training_cohort": (
            "NHANES adults 18-80 with 16 observed clinical features, derived BMI, "
            "and deterministic never-smoker skip"
        ),
        "cohort_rows": int(len(X)),
        "cohort_events": int(y.sum()),
        "cohort_prevalence": _safe_number(y.mean()),
        "exclusions": exclusions,
        "train_rows": int(len(X_train)),
        "train_events": int(y_train_array.sum()),
        "test_rows": int(len(X_test)),
        "test_events": int(y_test_array.sum()),
        "test_prevalence": _safe_number(y_test_array.mean()),
        "roc_auc": _safe_number(roc_auc_score(y_test, calibrated_test)),
        "average_precision": _safe_number(
            average_precision_score(y_test, calibrated_test)
        ),
        "brier_raw": _safe_number(brier_score_loss(y_test, raw_test)),
        "brier_calibrated": _safe_number(
            brier_score_loss(y_test, calibrated_test)
        ),
        "log_loss_raw": _safe_number(log_loss(y_test, raw_test)),
        "log_loss_calibrated": _safe_number(
            log_loss(y_test, calibrated_test)
        ),
        "high_risk_accuracy": _safe_number(accuracy_score(y_test, predicted_high)),
        "high_risk_f1": _safe_number(f1_score(y_test, predicted_high)),
        "high_risk_mcc": _safe_number(matthews_corrcoef(y_test, predicted_high)),
        "risk_thresholds": {"low": 0.05, "high": 0.20},
        "threshold_metrics": [
            _threshold_metrics(y_test_array, calibrated_test, threshold)
            for threshold in THRESHOLDS
        ],
        "calibration_fit": _calibration_fit(y_test_array, calibrated_test),
        "uncertainty": _bootstrap_ci(
            y_test_array, calibrated_test, rng, BOOTSTRAP_ITERATIONS
        ),
        "subgroups": _subgroup_metrics(X_test, y_test_array, calibrated_test, rng),
        "split": {
            "method": "stratified random 80/20",
            "test_size": 0.20,
            "random_state": SEED,
        },
        "seed": SEED,
        "dataset_sha256": _sha256(SOURCE_CSV),
        "preprocessing": {
            "version": "1.0.0",
            "age_range": [AGE_MIN, AGE_MAX],
            "continuous_imputation": "none (complete-case)",
            "bmi": "height/weight derived, rounded to 4 decimals",
            "smoking": (
                "SMQ020=No -> SMQ040=3 structural skip; SMQ020=Yes requires "
                "an observed SMQ040 code in {1,2,3}"
            ),
            "unknown_categories": "excluded, not mapped",
        },
    }
    if metrics["brier_calibrated"] is None or metrics["log_loss_calibrated"] is None:
        raise SystemExit("Metric computation produced a non-finite value.")

    os.makedirs(MODEL_OUT.parent, exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    joblib.dump(calibrator, CALIBRATOR_OUT)
    joblib.dump(features, FEATURES_OUT)
    METRICS_OUT.write_text(
        json.dumps(metrics, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    PREPROCESSING_OUT.write_text(
        json.dumps(
            {
                "version": "1.0.0",
                "shared_module": "backend/app/ml/preprocessing.py",
                "age_range": [AGE_MIN, AGE_MAX],
                "complete_case": True,
                "continuous_imputation": "none",
                "bmi": {
                    "formula": "weight_kg / (height_cm / 100) ** 2",
                    "rounding_decimals": 4,
                    "source_column": "BMXBMI (recorded NHANES field) is not used",
                },
                "smoking": {
                    "rule": "SMQ020=2 -> SMQ040=3",
                    "reason": "NHANES structural skip for never smokers",
                    "ever_smoker_codes": [1, 2],
                    "current_smoker_codes": [1, 2, 3],
                },
                "unknown_categories": "excluded",
                "excluded_codes": {
                    "BPQ020": [7, 8, 9],
                    "SMQ020": [7, 8, 9],
                    "SMQ040": [7, 8, 9],
                },
                "cohort": exclusions,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )

    importance = pd.DataFrame(
        {
            "Feature": list(model.feature_names_in_),
            "Importance": model.feature_importances_,
        }
    ).sort_values("Importance", ascending=False)
    importance.to_csv(IMPORTANCE_OUT, index=False)

    print("Model:", MODEL_OUT)
    print("Calibrator:", CALIBRATOR_OUT)
    print("Features:", FEATURES_OUT)
    print("Metrics:", METRICS_OUT)
    print("Preprocessing:", PREPROCESSING_OUT)
    print("Importance:", IMPORTANCE_OUT)
    for key in (
        "cohort_rows",
        "cohort_events",
        "train_rows",
        "test_rows",
        "test_events",
        "roc_auc",
        "average_precision",
        "brier_raw",
        "brier_calibrated",
        "log_loss_raw",
        "log_loss_calibrated",
    ):
        print(f"  {key}: {metrics[key]}")


if __name__ == "__main__":
    main()
