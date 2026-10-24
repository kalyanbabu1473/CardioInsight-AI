"""Deterministic preprocessing shared by training and live inference.

The deployed model must see exactly the vectors it was trained on. This module
is the single implementation of the two transformations that previously drifted:

* BMI is derived from measured height/weight with the same four-decimal rounding
  used by inference. Training no longer reads the NHANES-provided, imputed
  ``BMXBMI`` column.
* ``SMQ040`` (current smoking) is set to ``3`` (not at all) when ``SMQ020`` says
  the participant never smoked 100 cigarettes. NHANES structurally skips
  ``SMQ040`` for those participants, so this is a deterministic skip rule, not
  an imputation.

Eligibility is complete-case: no continuous feature is imputed and refused or
unknown categorical codes are excluded rather than mapped to a substantive
answer. The resulting cohort is adult-only (18-80 years).
"""

from __future__ import annotations

import math

import numpy as np
import pandas as pd

from app.core.feature_contract import feature_order

AGE_MIN = 18.0
AGE_MAX = 80.0
SMOKING_SKIP_CODE = 3
VALID_SMOKING_CODES = frozenset({1, 2, 3})

# SMQ040 is deliberately excluded: it is structurally absent for never smokers.
# BMXBMI is deliberately excluded: it is derived, not observed.
OBSERVED_FEATURES = tuple(
    name for name in feature_order() if name not in {"BMXBMI", "SMQ040"}
)
CONTINUOUS_OBSERVED = tuple(
    name
    for name in OBSERVED_FEATURES
    if name not in {"RIAGENDR", "BPQ020", "SMQ020"}
)


def derive_bmi(height_cm: float, weight_kg: float) -> float:
    """Return BMI rounded exactly as the live feature mapper does."""
    height = float(height_cm)
    weight = float(weight_kg)
    if not math.isfinite(height) or not math.isfinite(weight):
        raise ValueError("Height and weight must be finite.")
    if height <= 0.0 or weight <= 0.0:
        raise ValueError("Height and weight must be positive.")
    meters = height / 100.0
    return round(weight / (meters * meters), 4)


def normalize_smoking_code(ever_smoked_100: int, current_smoking: object) -> int:
    """Apply NHANES' skip logic without inventing a smoking status.

    ``SMQ020=2`` (never smoked 100 cigarettes) means ``SMQ040`` is not asked;
    the model's training value for the skip is 3. ``SMQ020=1`` requires a real
    observed ``SMQ040`` answer in {1, 2, 3}. All other codes are invalid.
    """
    ever = int(ever_smoked_100)
    if ever == 2:
        return SMOKING_SKIP_CODE
    if ever != 1:
        raise ValueError("SMQ020 must be 1 (Yes) or 2 (No).")
    if current_smoking is None or not math.isfinite(float(current_smoking)):
        raise ValueError("SMQ040 is required for ever-smokers.")
    code = int(current_smoking)
    if code not in VALID_SMOKING_CODES:
        raise ValueError("SMQ040 must be 1, 2, or 3 for ever-smokers.")
    return code


def _missing_flags(frame: pd.DataFrame) -> pd.Series:
    missing = pd.Series(False, index=frame.index)
    for name in OBSERVED_FEATURES:
        flag = f"{name}_WASMISSING"
        if flag in frame.columns:
            missing |= frame[flag].eq(1).fillna(False)
    for name in CONTINUOUS_OBSERVED:
        if name in frame.columns:
            values = pd.to_numeric(frame[name], errors="coerce")
            missing |= values.isna() | ~np.isfinite(values)
    return missing


def _category_valid(frame: pd.DataFrame) -> pd.Series:
    valid = frame["RIAGENDR"].isin([1, 2])
    valid &= frame["BPQ020"].isin([1, 2])
    valid &= frame["SMQ020"].isin([1, 2])
    ever = frame["SMQ020"].eq(1)
    observed_smoking = frame["SMQ040"].isin(list(VALID_SMOKING_CODES))
    # Never smokers are allowed to have the structurally skipped value; the
    # normalize_smoking_code() call supplies the model's skip code regardless.
    valid &= (~ever) | observed_smoking
    return valid.fillna(False)


def eligibility_components(frame: pd.DataFrame) -> dict[str, pd.Series]:
    """Return the sequential complete-case eligibility masks.

    The masks are ordered to make an auditable exclusion waterfall: age, then
    missing values, then invalid/unknown categories, then the target.
    """
    age_ok = frame["RIDAGEYR"].between(AGE_MIN, AGE_MAX)
    age_ok &= pd.to_numeric(frame["RIDAGEYR"], errors="coerce").notna()
    missing_ok = ~_missing_flags(frame)
    category_ok = _category_valid(frame)
    target_ok = frame["Composite_CVD"].isin([0, 1])
    return {
        "age_ok": age_ok.fillna(False),
        "missing_ok": missing_ok,
        "category_ok": category_ok,
        "target_ok": target_ok.fillna(False),
    }


def eligible_mask(frame: pd.DataFrame) -> pd.Series:
    parts = eligibility_components(frame)
    return parts["age_ok"] & parts["missing_ok"] & parts["category_ok"] & parts["target_ok"]


def exclusion_summary(frame: pd.DataFrame) -> dict[str, int]:
    """Count mutually exclusive exclusion reasons plus the eligible cohort."""
    parts = eligibility_components(frame)
    age_ok = parts["age_ok"]
    missing_ok = parts["missing_ok"] & age_ok
    category_ok = parts["category_ok"] & missing_ok
    target_ok = parts["target_ok"] & category_ok
    eligible = target_ok
    return {
        "total_rows": int(len(frame)),
        "excluded_age_outside_18_80": int((~age_ok).sum()),
        "excluded_missing_continuous": int((age_ok & ~missing_ok).sum()),
        "excluded_unknown_category": int((missing_ok & ~category_ok).sum()),
        "excluded_missing_target": int((category_ok & ~target_ok).sum()),
        "eligible_rows": int(eligible.sum()),
        "eligible_events": int(frame.loc[eligible, "Composite_CVD"].sum()),
    }


def build_training_frame(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Build the exact adult complete-case X/y used to fit the model."""
    eligible = frame.loc[eligible_mask(frame)].copy()
    missing = [name for name in feature_order() if name not in frame.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {', '.join(missing)}")

    eligible["BMXBMI"] = [
        derive_bmi(height, weight)
        for height, weight in zip(eligible["BMXHT"], eligible["BMXWT"])
    ]
    eligible["SMQ040"] = [
        normalize_smoking_code(ever, current)
        for ever, current in zip(eligible["SMQ020"], eligible["SMQ040"])
    ]

    X = eligible.loc[:, feature_order()].astype(float)
    y = eligible["Composite_CVD"].astype(int)
    if X.isna().any().any() or not np.isfinite(X.to_numpy()).all():
        raise ValueError("Training frame contains missing or non-finite features.")
    return X, y
