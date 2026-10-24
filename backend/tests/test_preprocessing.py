"""Shared preprocessing / training-inference parity tests."""

from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from app.ml.feature_mapper import to_model_row
from app.ml.preprocessing import (
    build_training_frame,
    derive_bmi,
    eligibility_components,
    eligible_mask,
    exclusion_summary,
    normalize_smoking_code,
)
from app.schemas.prediction import AssessmentInput

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = REPO_ROOT / "Outputs" / "ML_READY_DATASET.csv"

pytestmark = pytest.mark.skipif(
    not DATA_PATH.is_file(), reason="source dataset is not available"
)


@pytest.fixture(scope="module")
def frame():
    return pd.read_csv(DATA_PATH)


@pytest.fixture(scope="module")
def training(frame):
    return build_training_frame(frame)


def test_derive_bmi_rounds_like_inference():
    assert derive_bmi(172, 74) == 25.0135
    assert derive_bmi(160, 50) == 19.5312
    with pytest.raises(ValueError):
        derive_bmi(0, 70)
    with pytest.raises(ValueError):
        derive_bmi(170, 0)
    with pytest.raises(ValueError):
        derive_bmi(float("nan"), 70)


def test_never_smoker_uses_structural_skip_code():
    assert normalize_smoking_code(2, None) == 3
    assert normalize_smoking_code(2, float("nan")) == 3
    assert normalize_smoking_code(1, 1) == 1
    assert normalize_smoking_code(1, 2) == 2
    assert normalize_smoking_code(1, 3) == 3
    with pytest.raises(ValueError):
        normalize_smoking_code(1, None)
    with pytest.raises(ValueError):
        normalize_smoking_code(1, 7)
    with pytest.raises(ValueError):
        normalize_smoking_code(7, 3)


def test_complete_case_cohort_is_adult_and_observed(frame, training):
    X, y = training
    summary = exclusion_summary(frame)
    assert summary == {
        "total_rows": 15457,
        "excluded_age_outside_18_80": 5867,
        "excluded_missing_continuous": 6083,
        "excluded_unknown_category": 6,
        "excluded_missing_target": 0,
        "eligible_rows": 3501,
        "eligible_events": 392,
    }
    assert len(X) == len(y) == 3501
    assert int(y.sum()) == 392
    assert (X["RIDAGEYR"] >= 18).all()
    assert (X["RIDAGEYR"] <= 80).all()
    assert not X.isna().any().any()
    assert np.isfinite(X.to_numpy()).all()


def test_derived_bmi_is_used_for_every_training_row(frame, training):
    X, _ = training
    expected = [
        derive_bmi(height, weight)
        for height, weight in zip(frame.loc[X.index, "BMXHT"], frame.loc[X.index, "BMXWT"])
    ]
    assert X["BMXBMI"].tolist() == expected
    assert not np.allclose(
        frame.loc[X.index, "BMXBMI"].to_numpy(), X["BMXBMI"].to_numpy()
    )


def test_never_smokers_are_retained_with_skip_code(frame, training):
    X, _ = training
    never = frame.loc[X.index, "SMQ020"].eq(2)
    assert never.any()
    assert (X.loc[never.to_numpy(), "SMQ040"] == 3).all()


def test_unknown_and_inconsistent_categories_are_excluded(frame):
    parts = eligibility_components(frame)
    bad_bp = frame["BPQ020"].isin([7, 9])
    bad_smoke = frame["SMQ020"].isin([7, 9])
    inconsistent = (
        frame["SMQ020"].eq(1)
        & ~frame["SMQ040"].isin([1, 2, 3])
    )
    assert (frame.loc[bad_bp, "Composite_CVD"].notna()).all()
    assert not parts["category_ok"][bad_bp].any()
    assert not parts["category_ok"][bad_smoke].any()
    assert not parts["category_ok"][inconsistent].any()
    assert int((~eligible_mask(frame)).sum()) == 11956


def test_training_row_parity_for_sampled_rows(training):
    X, _ = training
    for index in X.index[:10]:
        row = X.loc[index]
        ever = "Yes" if int(row["SMQ020"]) == 1 else "No"
        current = {
            1: "Every day",
            2: "Some days",
            3: "Not at all",
        }[int(row["SMQ040"])]
        input_ = AssessmentInput.model_validate(
            {
                "demographics": {
                    "age": float(row["RIDAGEYR"]),
                    "sex": "Male" if int(row["RIAGENDR"]) == 1 else "Female",
                },
                "bodyComposition": {
                    "weightKg": float(row["BMXWT"]),
                    "heightCm": float(row["BMXHT"]),
                    "waistCm": float(row["BMXWAIST"]),
                },
                "bloodPressure": {
                    "systolicBP": float(row["BPXOSY1"]),
                    "diastolicBP": float(row["BPXODI1"]),
                    "hypertensionDiagnosis": (
                        "Yes" if int(row["BPQ020"]) == 1 else "No"
                    ),
                },
                "metabolic": {
                    "hba1c": float(row["LBXGH"]),
                    "fastingGlucose": float(row["LBXGLU"]),
                    "insulin": float(row["LBXIN"]),
                },
                "lipids": {
                    "totalCholesterol": float(row["LBXTC"]),
                    "ldlCholesterol": float(row["LBDLDL"]),
                    "hdlCholesterol": float(row["LBDHDD"]),
                    "triglycerides": float(row["LBXTR"]),
                },
                "lifestyle": {
                    "everSmoked100": ever,
                    "currentSmoking": current,
                },
            }
        )
        assert to_model_row(input_) == row.tolist()
