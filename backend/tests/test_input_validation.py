"""Exhaustive request-contract tests for /api/predict.

Every numeric field is exercised at its allowed boundaries, immediately outside
them, with null/empty/text input, and with raw JSON NaN/Infinity tokens. Every
categorical field is exercised with each allowed option and representative
invalid values. Derived BMI and smoking consistency are tested separately
because they are cross-field constraints.
"""

import copy
import json
import math
import random

import pytest

from app.core.feature_contract import load_contract
from tests.test_predict import VALID_INPUT

CONTINUOUS = {
    "RIDAGEYR": ("demographics", "age"),
    "BMXHT": ("bodyComposition", "heightCm"),
    "BMXWT": ("bodyComposition", "weightKg"),
    "BMXWAIST": ("bodyComposition", "waistCm"),
    "BPXOSY1": ("bloodPressure", "systolicBP"),
    "BPXODI1": ("bloodPressure", "diastolicBP"),
    "LBXGH": ("metabolic", "hba1c"),
    "LBXGLU": ("metabolic", "fastingGlucose"),
    "LBXTC": ("lipids", "totalCholesterol"),
    "LBDLDL": ("lipids", "ldlCholesterol"),
    "LBDHDD": ("lipids", "hdlCholesterol"),
    "LBXTR": ("lipids", "triglycerides"),
    "LBXIN": ("metabolic", "insulin"),
}

BOUNDS = {
    "RIDAGEYR": (18, 80),
    "BMXHT": (131.1, 198.7),
    "BMXWT": (39.6, 204.6),
    "BMXWAIST": (61.1, 178.0),
    "BPXOSY1": (66.0, 217.0),
    "BPXODI1": (36.0, 131.0),
    "LBXGH": (2.8, 15.2),
    "LBXGLU": (47.0, 451.0),
    "LBXTC": (76.0, 428.0),
    "LBDLDL": (7.0, 357.0),
    "LBDHDD": (11.0, 187.0),
    "LBXTR": (10.0, 399.0),
    "LBXIN": (0.71, 512.5),
}

CATEGORICAL = {
    "RIAGENDR": ("demographics", "sex", ["Male", "Female"]),
    "BPQ020": ("bloodPressure", "hypertensionDiagnosis", ["Yes", "No"]),
    "SMQ020": ("lifestyle", "everSmoked100", ["Yes", "No"]),
    "SMQ040": (
        "lifestyle",
        "currentSmoking",
        ["Every day", "Some days", "Not at all"],
    ),
}


def payload():
    return copy.deepcopy(VALID_INPUT)


def set_field(body, section, key, value):
    body[section][key] = value


def post_value(client, name, value):
    body = payload()
    section, key = CONTINUOUS[name]
    set_field(body, section, key, value)
    return client.post("/api/predict", json={"input": body})


def raw_nonfinite(client, section, key, token):
    body = payload()
    set_field(body, section, key, "__NONFINITE__")
    raw = json.dumps({"input": body}).replace('"__NONFINITE__"', token)
    return client.post(
        "/api/predict",
        content=raw,
        headers={"content-type": "application/json"},
    )


@pytest.mark.parametrize("name", list(CONTINUOUS))
def test_each_continuous_field_accepts_its_contract_minimum(client, name):
    if name in {"BMXHT", "BMXWT"}:
        pytest.skip("height/weight minima are tested with a compatible BMI")
    lo, _ = BOUNDS[name]
    assert post_value(client, name, lo).status_code == 200


@pytest.mark.parametrize("name", list(CONTINUOUS))
def test_each_continuous_field_accepts_its_contract_maximum(client, name):
    if name in {"BMXHT", "BMXWT"}:
        pytest.skip("height/weight maxima are tested with a compatible BMI")
    _, hi = BOUNDS[name]
    assert post_value(client, name, hi).status_code == 200


@pytest.mark.parametrize("name", list(CONTINUOUS))
def test_each_continuous_field_rejects_values_outside_contract(client, name):
    lo, hi = BOUNDS[name]
    below = lo - 0.1
    above = hi + 0.1
    assert post_value(client, name, below).status_code == 422
    assert post_value(client, name, above).status_code == 422


@pytest.mark.parametrize("name", list(CONTINUOUS))
@pytest.mark.parametrize("value", [None, "", "not-a-number"])
def test_each_continuous_field_rejects_missing_or_text(client, name, value):
    res = post_value(client, name, value)
    assert res.status_code == 422


@pytest.mark.parametrize("name", list(CONTINUOUS))
@pytest.mark.parametrize("token", ["NaN", "Infinity", "-Infinity"])
def test_each_continuous_field_rejects_raw_nonfinite_json(client, name, token):
    section, key = CONTINUOUS[name]
    res = raw_nonfinite(client, section, key, token)
    assert res.status_code == 422, res.text
    detail = res.json()["detail"]
    assert detail
    assert detail[0]["type"] == "finite_number"
    assert detail[0]["input"] is None
    assert math.isfinite(0.0)


def test_top_level_nonfinite_input_is_a_serializable_422(client):
    for token in ("NaN", "Infinity", "-Infinity"):
        res = client.post(
            "/api/predict",
            content='{"input": ' + token + "}",
            headers={"content-type": "application/json"},
        )
        assert res.status_code == 422, res.text
        assert res.json()["detail"]


def test_malformed_or_incomplete_requests_are_422(client):
    cases = [
        {},
        {"input": None},
        {"input": []},
        {"input": {"demographics": {"age": 48, "sex": "Female"}}},
    ]
    for body in cases:
        assert client.post("/api/predict", json=body).status_code == 422

    assert (
        client.post(
            "/api/predict",
            content="{not-json",
            headers={"content-type": "application/json"},
        ).status_code
        == 422
    )


def test_extra_top_level_field_is_ignored(client):
    res = client.post("/api/predict", json={"input": payload(), "extra": 1})
    assert res.status_code == 200


@pytest.mark.parametrize("name", list(CATEGORICAL))
def test_each_categorical_field_accepts_all_valid_options(client, name):
    section, key, options = CATEGORICAL[name]
    for option in options:
        body = payload()
        set_field(body, section, key, option)
        if name == "SMQ020" and option == "No":
            body["lifestyle"]["currentSmoking"] = "Not at all"
        res = client.post("/api/predict", json={"input": body})
        assert res.status_code == 200, (name, option, res.text)


def test_never_smoker_with_current_smoking_is_rejected(client):
    for current in ("Every day", "Some days"):
        body = payload()
        body["lifestyle"] = {
            "everSmoked100": "No",
            "currentSmoking": current,
        }
        res = client.post("/api/predict", json={"input": body})
        assert res.status_code == 422, res.text


@pytest.mark.parametrize("name", list(CATEGORICAL))
@pytest.mark.parametrize(
    "value",
    ["", "unknown", "yes", "YES", " Yes", "Yes ", "1", 1, 2, None],
)
def test_each_categorical_field_rejects_invalid_values(client, name, value):
    section, key, _ = CATEGORICAL[name]
    body = payload()
    set_field(body, section, key, value)
    assert client.post("/api/predict", json={"input": body}).status_code == 422


def test_height_minimum_with_compatible_bmi_is_accepted(client):
    body = payload()
    body["bodyComposition"].update({"heightCm": 131.1, "weightKg": 39.6})
    assert client.post("/api/predict", json={"input": body}).status_code == 200


def test_height_maximum_with_compatible_bmi_is_accepted(client):
    body = payload()
    body["bodyComposition"].update({"heightCm": 198.7, "weightKg": 80.0})
    assert client.post("/api/predict", json={"input": body}).status_code == 200


def test_weight_minimum_with_compatible_bmi_is_accepted(client):
    body = payload()
    body["bodyComposition"].update({"heightCm": 131.1, "weightKg": 39.6})
    assert client.post("/api/predict", json={"input": body}).status_code == 200


def test_weight_maximum_with_compatible_bmi_is_accepted(client):
    body = payload()
    body["bodyComposition"].update({"heightCm": 198.7, "weightKg": 204.6})
    assert client.post("/api/predict", json={"input": body}).status_code == 200


def test_derived_bmi_boundaries_are_enforced(client):
    contract = load_contract()
    bmi_spec = next(f for f in contract["features"] if f["name"] == "BMXBMI")
    bmi_min = float(bmi_spec["min"])
    bmi_max = float(bmi_spec["max"])

    accepted_min_height = math.sqrt(39.6 / bmi_min) * 100.0
    accepted_min = payload()
    accepted_min["bodyComposition"].update(
        {"heightCm": accepted_min_height, "weightKg": 39.6}
    )
    assert client.post("/api/predict", json={"input": accepted_min}).status_code == 200

    below = payload()
    below["bodyComposition"].update({"heightCm": 170.0, "weightKg": 44.4})
    assert client.post("/api/predict", json={"input": below}).status_code == 422

    exactly_max_weight = bmi_max * (1.311**2)
    accepted_max = payload()
    accepted_max["bodyComposition"].update(
        {"heightCm": 131.1, "weightKg": exactly_max_weight}
    )
    assert client.post("/api/predict", json={"input": accepted_max}).status_code == 200

    above = payload()
    above["bodyComposition"].update(
        {"heightCm": 131.1, "weightKg": exactly_max_weight + 0.1}
    )
    assert client.post("/api/predict", json={"input": above}).status_code == 422


def test_fixed_seed_random_valid_assessments_remain_finite(client):
    rng = random.Random(42)
    body_pairs = [
        (131.1, 39.6),
        (140.0, 40.0),
        (150.0, 50.0),
        (160.0, 60.0),
        (170.0, 70.0),
        (180.0, 90.0),
        (198.7, 204.6),
        (131.1, 115.21),
        (180.0, 50.0),
    ]
    for index in range(20):
        body = payload()
        height, weight = body_pairs[index % len(body_pairs)]
        body["bodyComposition"].update(
            {
                "heightCm": height,
                "weightKg": weight,
                "waistCm": round(rng.uniform(61.1, 178.0), 2),
            }
        )
        body["demographics"]["age"] = round(rng.uniform(18, 80), 2)
        body["demographics"]["sex"] = rng.choice(["Male", "Female"])
        body["bloodPressure"].update(
            {
                "systolicBP": round(rng.uniform(66.0, 217.0), 2),
                "diastolicBP": round(rng.uniform(36.0, 131.0), 2),
                "hypertensionDiagnosis": rng.choice(["Yes", "No"]),
            }
        )
        body["metabolic"].update(
            {
                "hba1c": round(rng.uniform(2.8, 15.2), 2),
                "fastingGlucose": round(rng.uniform(47.0, 451.0), 2),
                "insulin": round(rng.uniform(0.71, 512.5), 2),
            }
        )
        body["lipids"].update(
            {
                "totalCholesterol": round(rng.uniform(76.0, 428.0), 2),
                "ldlCholesterol": round(rng.uniform(7.0, 357.0), 2),
                "hdlCholesterol": round(rng.uniform(11.0, 187.0), 2),
                "triglycerides": round(rng.uniform(10.0, 399.0), 2),
            }
        )
        ever = rng.choice(["Yes", "No"])
        body["lifestyle"].update(
            {
                "everSmoked100": ever,
                "currentSmoking": (
                    "Not at all"
                    if ever == "No"
                    else rng.choice(["Every day", "Some days", "Not at all"])
                ),
            }
        )
        res = client.post("/api/predict", json={"input": body})
        assert res.status_code == 200, (index, body, res.text)
        result = res.json()
        assert math.isfinite(result["probability"])
        assert math.isfinite(result["probability_raw"])
        assert all(math.isfinite(value) for value in result["feature_values"])

