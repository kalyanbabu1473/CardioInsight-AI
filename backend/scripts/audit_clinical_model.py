"""Read-only audit of the deployed adult complete-case clinical model.

Reproduces the documented training split, evaluates the shipped model and
calibrator, verifies the artifact manifest, and records cohort limitations.
This script does not retrain or overwrite model artifacts.

Run from the repository root:
    backend/.venv/Scripts/python backend/scripts/audit_clinical_model.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    log_loss,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.core.config import calibrator_path, metrics_path, model_path  # noqa: E402
from app.core.feature_contract import feature_order, load_contract  # noqa: E402
from app.ml.artifact_manifest import verify_artifacts  # noqa: E402
from app.ml.preprocessing import (  # noqa: E402
    OBSERVED_FEATURES,
    build_training_frame,
    derive_bmi,
    eligibility_components,
    exclusion_summary,
)

import joblib  # noqa: E402

DATA_PATH = ROOT / "Outputs" / "ML_READY_DATASET.csv"
OUT_PATH = ROOT / "Outputs" / "clinical_model_audit.json"
TARGET = "Composite_CVD"
SEED = 42
THRESHOLDS = (0.05, 0.20)
MIN_RELIABLE_EVENTS = 10


def _safe_float(value) -> float | None:
    if value is None:
        return None
    value = float(value)
    return value if np.isfinite(value) else None


def _threshold_metrics(y: np.ndarray, p: np.ndarray, threshold: float) -> dict:
    predicted = (p >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, predicted, labels=[0, 1]).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) else None
    specificity = tn / (tn + fp) if (tn + fp) else None
    ppv = tp / (tp + fp) if (tp + fp) else None
    npv = tn / (tn + fn) if (tn + fn) else None
    f1 = 2 * ppv * sensitivity / (ppv + sensitivity) if ppv and sensitivity else 0.0
    accuracy = (tp + tn) / len(y)
    mcc_denominator = np.sqrt(
        float(tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
    )
    mcc = ((tp * tn) - (fp * fn)) / mcc_denominator if mcc_denominator else 0.0
    return {
        "threshold": threshold,
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
        "sensitivity": _safe_float(sensitivity),
        "specificity": _safe_float(specificity),
        "ppv": _safe_float(ppv),
        "npv": _safe_float(npv),
        "f1": _safe_float(f1),
        "accuracy": _safe_float(accuracy),
        "mcc": _safe_float(mcc),
    }


def _metrics(y: np.ndarray, raw: np.ndarray, calibrated: np.ndarray) -> dict:
    result = {
        "n": int(len(y)),
        "positives": int(y.sum()),
        "prevalence": _safe_float(y.mean()),
        "roc_auc": _safe_float(roc_auc_score(y, calibrated)),
        "average_precision": _safe_float(
            average_precision_score(y, calibrated)
        ),
        "brier_raw": _safe_float(brier_score_loss(y, raw)),
        "brier_calibrated": _safe_float(brier_score_loss(y, calibrated)),
        "log_loss_raw": _safe_float(log_loss(y, raw, labels=[0, 1])),
        "log_loss_calibrated": _safe_float(
            log_loss(y, calibrated, labels=[0, 1])
        ),
        "thresholds": [
            _threshold_metrics(y, calibrated, threshold)
            for threshold in THRESHOLDS
        ],
    }

    p = np.clip(calibrated, 1e-6, 1 - 1e-6)
    logit = np.log(p / (1 - p)).reshape(-1, 1)
    lr = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=1000)
    lr.fit(logit, y)
    result["calibration_intercept"] = _safe_float(lr.intercept_[0])
    result["calibration_slope"] = _safe_float(lr.coef_[0][0])

    fraction, mean_predicted = calibration_curve(
        y, calibrated, n_bins=10, strategy="quantile"
    )
    result["reliability_deciles"] = [
        {
            "mean_predicted": _safe_float(mean_predicted[i]),
            "observed": _safe_float(fraction[i]),
        }
        for i in range(len(fraction))
        if np.isfinite(mean_predicted[i]) and np.isfinite(fraction[i])
    ]
    return result


def _bootstrap(
    y: np.ndarray, raw: np.ndarray, calibrated: np.ndarray, iterations: int = 2000
) -> dict:
    rng = np.random.default_rng(SEED)
    auc_values = []
    ap_values = []
    brier_values = []
    for _ in range(iterations):
        idx = rng.integers(0, len(y), len(y))
        if len(np.unique(y[idx])) < 2:
            continue
        auc_values.append(roc_auc_score(y[idx], calibrated[idx]))
        ap_values.append(average_precision_score(y[idx], calibrated[idx]))
        brier_values.append(brier_score_loss(y[idx], calibrated[idx]))
    return {
        "requested_iterations": iterations,
        "valid_iterations": len(auc_values),
        "auc_95ci": [
            _safe_float(np.percentile(auc_values, 2.5)),
            _safe_float(np.percentile(auc_values, 97.5)),
        ],
        "average_precision_95ci": [
            _safe_float(np.percentile(ap_values, 2.5)),
            _safe_float(np.percentile(ap_values, 97.5)),
        ],
        "brier_95ci": [
            _safe_float(np.percentile(brier_values, 2.5)),
            _safe_float(np.percentile(brier_values, 97.5)),
        ],
    }


def _subgroups(
    df_test: pd.DataFrame, y: np.ndarray, raw: np.ndarray, calibrated: np.ndarray
) -> list[dict]:
    groups = []
    definitions = [
        ("sex_male", df_test["RIAGENDR"] == 1),
        ("sex_female", df_test["RIAGENDR"] == 2),
        ("age_18_39", df_test["RIDAGEYR"].between(18, 39)),
        ("age_40_59", df_test["RIDAGEYR"].between(40, 59)),
        ("age_60_80", df_test["RIDAGEYR"].between(60, 80)),
        ("adult_18_80", df_test["RIDAGEYR"].between(18, 80)),
    ]
    for name, mask in definitions:
        mask_array = np.asarray(mask, dtype=bool)
        if mask_array.sum() == 0:
            continue
        group_y = y[mask_array]
        group_raw = raw[mask_array]
        group_p = calibrated[mask_array]
        positives = int(group_y.sum())
        negatives = int(len(group_y) - positives)
        reliable = positives >= MIN_RELIABLE_EVENTS and negatives >= MIN_RELIABLE_EVENTS
        auc = (
            _safe_float(roc_auc_score(group_y, group_p))
            if len(np.unique(group_y)) == 2
            else None
        )
        groups.append(
            {
                "name": name,
                "n": int(mask_array.sum()),
                "positives": positives,
                "negatives": negatives,
                "prevalence": _safe_float(group_y.mean()),
                "roc_auc": auc,
                "brier_raw": _safe_float(brier_score_loss(group_y, group_raw)),
                "brier_calibrated": _safe_float(
                    brier_score_loss(group_y, group_p)
                ),
                "reliable_auc": reliable and auc is not None,
                "reliability_note": (
                    None
                    if reliable
                    else f"fewer than {MIN_RELIABLE_EVENTS} events in one class"
                ),
            }
        )
    return groups


def _data_checks(
    df: pd.DataFrame, X: pd.DataFrame, y: pd.Series, features: list[str]
) -> dict:
    contract = load_contract()
    spec = {f["name"]: f for f in contract["features"]}
    parts = eligibility_components(df)
    target = pd.to_numeric(df[TARGET], errors="coerce")

    missing = {
        name: int(df[name].isna().sum()) for name in OBSERVED_FEATURES if name in df
    }
    duplicate_seqn = int(df["SEQN"].duplicated().sum()) if "SEQN" in df else None

    range_mismatches = {}
    for name in features:
        if spec[name].get("type") != "continuous" or name not in df:
            continue
        values = pd.to_numeric(df[name], errors="coerce")
        lo = float(spec[name]["min"])
        hi = float(spec[name]["max"])
        outside = int(((values < lo) | (values > hi)).sum())
        if outside:
            range_mismatches[name] = {
                "outside": outside,
                "min": _safe_float(values.min()),
                "max": _safe_float(values.max()),
                "contract_min": lo,
                "contract_max": hi,
            }

    height = pd.to_numeric(df["BMXHT"], errors="coerce")
    weight = pd.to_numeric(df["BMXWT"], errors="coerce")
    recorded_bmi = pd.to_numeric(df["BMXBMI"], errors="coerce")
    derived_bmi = weight / ((height / 100.0) ** 2)
    diff = (derived_bmi - recorded_bmi).abs()
    derived_from_cohort = X["BMXBMI"].to_numpy()
    bmi_outside = int(
        ((derived_from_cohort < spec["BMXBMI"]["min"]) | (derived_from_cohort > spec["BMXBMI"]["max"])).sum()
    )

    unknown = {
        name: int(df[name].isin([7, 9]).sum())
        for name in ("BPQ020", "SMQ020", "SMQ040")
        if name in df
    }
    skipped_smq040 = int((df["SMQ020"].eq(2) & df["SMQ040"].isna()).sum())
    inconsistent_smq040 = int(
        (df["SMQ020"].eq(1) & ~df["SMQ040"].isin([1, 2, 3])).sum()
    )

    return {
        "raw_rows": int(len(df)),
        "raw_columns": int(df.shape[1]),
        "duplicate_seqn": duplicate_seqn,
        "missing_observed_features": missing,
        "range_mismatches_in_raw_rows": range_mismatches,
        "exclusions": exclusion_summary(df),
        "cohort": {
            "rows": int(len(X)),
            "events": int(y.sum()),
            "prevalence": _safe_float(y.mean()),
            "age_min": _safe_float(X["RIDAGEYR"].min()),
            "age_max": _safe_float(X["RIDAGEYR"].max()),
            "bmi_min": _safe_float(X["BMXBMI"].min()),
            "bmi_max": _safe_float(X["BMXBMI"].max()),
            "bmi_outside_contract": bmi_outside,
        },
        "bmi_recorded_vs_derived_in_raw_rows": {
            "exact_within_0_01": int((diff < 0.01).sum()),
            "mismatch_gt_1": int((diff > 1).sum()),
            "max_abs_diff": _safe_float(diff.max()),
        },
        "age": {
            "raw_min": _safe_float(df["RIDAGEYR"].min()),
            "raw_max": _safe_float(df["RIDAGEYR"].max()),
            "under_18_rows": int((df["RIDAGEYR"] < 18).sum()),
            "under_18_target_prevalence": _safe_float(target[df["RIDAGEYR"] < 18].mean()),
            "contract_min": 18,
            "contract_max": 80,
        },
        "smoking": {
            "never_smokers_with_missing_smq040": skipped_smq040,
            "ever_smokers_without_current_status": inconsistent_smq040,
        },
        "unknown_or_refused_category_counts": unknown,
        "eligibility_components": {
            "age_ok": int(parts["age_ok"].sum()),
            "missing_ok": int(parts["missing_ok"].sum()),
            "category_ok": int(parts["category_ok"].sum()),
            "target_ok": int(parts["target_ok"].sum()),
        },
        "imputation_flags_present": {
            name: int(df[name].sum())
            for name in (
                "BMXHT_WASMISSING",
                "BMXWT_WASMISSING",
                "BMXBMI_WASMISSING",
                "BMXWAIST_WASMISSING",
            )
            if name in df
        },
    }


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    features = feature_order()
    contract = load_contract()
    X_all, y_all = build_training_frame(df)
    model = joblib.load(model_path)
    calibrator = joblib.load(calibrator_path)
    manifest = verify_artifacts(force=True)

    X_train, X_test, y_train, y_test = train_test_split(
        X_all, y_all, test_size=0.2, random_state=SEED, stratify=y_all
    )
    raw = model.predict_proba(X_test)[:, list(model.classes_).index(1)]
    calibrated = np.clip(calibrator.predict(raw), 0.0, 1.0)
    y_array = y_test.to_numpy()

    stored_metrics = json.loads(Path(metrics_path).read_text(encoding="utf-8"))
    result = {
        "audit_version": "2.0.0",
        "artifacts": {
            "model_path": str(Path(model_path)),
            "calibrator_path": str(Path(calibrator_path)),
            "metrics_path": str(Path(metrics_path)),
            "model_type": type(model).__name__,
            "calibrator_type": type(calibrator).__name__,
            "features": features,
            "feature_count": len(features),
            "contract_feature_count": contract["feature_count"],
            "manifest_ok": manifest["ok"],
            "manifest_errors": manifest["errors"],
        },
        "target": {
            "name": TARGET,
            "definition": "prevalent self-reported CVD (MCQ160B-F; code 9 dropped; any 1 = positive)",
            "incident_outcome": False,
        },
        "design": {
            "data_source": "NHANES 2017-2020 preprocessed research dataset",
            "survey_weights_used": False,
            "population_representative": False,
            "external_validation": False,
            "split": "single stratified 80/20 random split by row; participants are unique by SEQN",
            "preprocessing": "complete-case; no imputation; BMI derived and rounded to 4 decimals",
            "calibration": "isotonic fitted on 5-fold out-of-fold training predictions",
        },
        "split": {
            "train_rows": int(len(X_train)),
            "test_rows": int(len(X_test)),
            "train_events": int(y_train.sum()),
            "test_events": int(y_array.sum()),
            "seed": SEED,
            "test_prevalence": _safe_float(y_array.mean()),
            "matches_stored_metrics": (
                int(len(X_train)) == stored_metrics["train_rows"]
                and int(len(X_test)) == stored_metrics["test_rows"]
                and int(y_array.sum()) == stored_metrics["test_events"]
            ),
        },
        "overall_test": _metrics(y_array, raw, calibrated),
        "bootstrap": _bootstrap(y_array, raw, calibrated),
        "subgroups": _subgroups(X_test, y_array, raw, calibrated),
        "stored_metrics_agreement": {
            "roc_auc": _safe_float(stored_metrics["roc_auc"]),
            "average_precision": _safe_float(stored_metrics["average_precision"]),
            "brier_calibrated": _safe_float(stored_metrics["brier_calibrated"]),
            "log_loss_calibrated": _safe_float(stored_metrics["log_loss_calibrated"]),
        },
        "data_checks": _data_checks(df, X_all, y_all, features),
        "limitations": [
            "Prevalent self-reported CVD, not incident CVD or future risk.",
            "No NHANES survey weights; estimates are not population-representative.",
            "No external validation; only a single held-out split from the same dataset.",
            "Age 18-39 subgroup has too few events for reliable subgroup reporting.",
            "Artifact manifest hashes detect accidental corruption but are not signatures.",
        ],
    }

    OUT_PATH.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print("Artifacts")
    print(f"  model: {result['artifacts']['model_path']}")
    print(f"  manifest_ok: {manifest['ok']}")
    print("Split")
    print(
        f"  train={result['split']['train_rows']} "
        f"test={result['split']['test_rows']} "
        f"test_events={result['split']['test_events']} "
        f"prevalence={result['split']['test_prevalence']:.4f}"
    )
    metrics = result["overall_test"]
    print("Overall test")
    print(
        f"  n={metrics['n']} AUC={metrics['roc_auc']:.4f} "
        f"Brier={metrics['brier_calibrated']:.4f} "
        f"logloss={metrics['log_loss_calibrated']:.4f} "
        f"PR-AUC={metrics['average_precision']:.4f}"
    )
    print(
        f"  calibration intercept={metrics['calibration_intercept']:.4f} "
        f"slope={metrics['calibration_slope']:.4f}"
    )
    for threshold in metrics["thresholds"]:
        print(
            f"  @{threshold['threshold']:.2f}: sens={threshold['sensitivity']:.3f} "
            f"spec={threshold['specificity']:.3f} ppv={threshold['ppv']:.3f} "
            f"npv={threshold['npv']:.3f} f1={threshold['f1']:.3f}"
        )
    print("Bootstrap 95% CI")
    print(f"  AUC: {result['bootstrap']['auc_95ci']}")
    print(f"  AP:  {result['bootstrap']['average_precision_95ci']}")
    print(f"  Brier: {result['bootstrap']['brier_95ci']}")
    groups = ", ".join(
        f"{g['name']}={g['roc_auc']:.3f}" if g["roc_auc"] is not None else f"{g['name']}=n/a"
        for g in result["subgroups"]
    )
    print(f"Subgroups: {groups}")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()

