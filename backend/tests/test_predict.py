"""Prediction endpoint tests - POST /api/predict against the deployed model."""

from concurrent.futures import ThreadPoolExecutor

import pytest

from app.ml.prediction_service import MODEL_NAME, _confidence, _risk_level

VALID_INPUT = {
    "demographics": {"age": 48, "sex": "Female"},
    "bodyComposition": {"weightKg": 74, "heightCm": 172, "waistCm": 86},
    "bloodPressure": {
        "systolicBP": 128,
        "diastolicBP": 82,
        "hypertensionDiagnosis": "No",
    },
    "metabolic": {"hba1c": 5.6, "fastingGlucose": 102, "insulin": 14},
    "lipids": {
        "totalCholesterol": 208,
        "ldlCholesterol": 132,
        "hdlCholesterol": 46,
        "triglycerides": 168,
    },
    "lifestyle": {"everSmoked100": "Yes", "currentSmoking": "Some days"},
}

EXPECTED_FEATURES = [
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


def test_predict_status_reports_ready(client):
    res = client.get("/api/predict/status")
    assert res.status_code == 200
    body = res.json()
    assert body["ready"] is True
    assert body["model"] == MODEL_NAME
    assert body["detail"] is None


def test_predict_valid_input(client):
    res = client.post("/api/predict", json={"input": VALID_INPUT})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["model"] == MODEL_NAME
    assert 0.0 <= body["probability"] <= 1.0
    assert 0.0 <= body["probability_raw"] <= 1.0
    assert body["calibration"] == "isotonic"
    assert body["level"] in {"Low", "Moderate", "High"}
    assert 50.0 <= body["confidence"] <= 100.0
    expected_certainty = round(
        max(body["probability"], 1 - body["probability"]) * 100, 2
    )
    assert abs(body["confidence"] - expected_certainty) <= 0.01
    assert len(body["feature_names"]) == 18
    assert len(body["feature_values"]) == 18


def test_predict_reports_shap_contributions(client):
    body = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    assert isinstance(body["expected_value"], float)
    assert len(body["contributions"]) == 18
    for contribution in body["contributions"]:
        assert contribution["feature"] in body["feature_names"]
        assert contribution["label"]
        assert isinstance(contribution["contribution"], float)
    restored = body["expected_value"] + sum(
        c["contribution"] for c in body["contributions"]
    )
    assert abs(restored - body["probability_raw"]) < 2e-4
    magnitudes = [abs(c["contribution"]) for c in body["contributions"]]
    assert magnitudes == sorted(magnitudes, reverse=True)


def test_predict_deterministic(client):
    first = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    second = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    assert first["probability"] == second["probability"]
    assert first["probability_raw"] == second["probability_raw"]


def test_predict_outputs_real_features(client):
    res = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    assert res["feature_names"] == EXPECTED_FEATURES


def test_predict_validates_range(client):
    bad = {**VALID_INPUT}
    bad["demographics"] = {"age": 0, "sex": "Female"}
    res = client.post("/api/predict", json={"input": bad})
    assert res.status_code == 422


def test_predict_rejects_bad_enum(client):
    bad = {**VALID_INPUT}
    bad["lifestyle"] = {**bad["lifestyle"], "currentSmoking": "Maybe"}
    res = client.post("/api/predict", json={"input": bad})
    assert res.status_code == 422


def test_predict_rejects_missing_section(client):
    bad = {**VALID_INPUT}
    del bad["lifestyle"]
    res = client.post("/api/predict", json={"input": bad})
    assert res.status_code == 422


def test_predict_ignores_extra_fields(client):
    extra = {**VALID_INPUT}
    extra["unexpectedField"] = 999
    res = client.post("/api/predict", json={"input": extra})
    assert res.status_code == 200


def test_feature_contract_endpoint(client):
    res = client.get("/api/predict/feature-contract")
    assert res.status_code == 200
    body = res.json()
    assert body["feature_count"] == 18
    assert len(body["feature_order"]) == 18
    assert len(body["features"]) == 18
    assert body["model"] == "CardioAI_Clinical_Model.pkl"
    assert body["calibration"] == "isotonic"
    assert body["risk_thresholds"] == {"low": 0.05, "high": 0.20}


@pytest.mark.parametrize(
    ("probability", "expected"),
    [
        (0.05, 95.0),
        (0.20, 80.0),
        (0.50, 50.0),
        (0.80, 80.0),
        (0.95, 95.0),
    ],
)
def test_prediction_certainty_is_max_class_probability_percent(
    probability, expected
):
    assert _confidence(probability) == expected


@pytest.mark.parametrize(
    ("probability", "expected"),
    [
        (0.0, "Low"),
        (0.0499, "Low"),
        (0.05, "Moderate"),
        (0.1999, "Moderate"),
        (0.20, "High"),
        (1.0, "High"),
    ],
)
def test_risk_thresholds_remain_at_contract_boundaries(probability, expected):
    assert _risk_level(probability) == expected


def test_concurrent_distinct_requests_do_not_leak_state():
    """Each request must use its own input and return its own prediction."""
    from fastapi.testclient import TestClient

    from app.main import app

    def submit(index):
        body = {**VALID_INPUT, "demographics": dict(VALID_INPUT["demographics"])}
        body["demographics"]["age"] = 20 if index % 2 == 0 else 80
        body["demographics"]["sex"] = "Male" if index % 2 == 0 else "Female"
        body["bloodPressure"] = {
            **VALID_INPUT["bloodPressure"],
            "systolicBP": 100 if index % 2 == 0 else 180,
        }
        with TestClient(app) as thread_client:
            response = thread_client.post("/api/predict", json={"input": body})
        return index, response

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(submit, range(8)))

    probabilities = {}
    for index, response in results:
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["feature_values"][0] == (20.0 if index % 2 == 0 else 80.0)
        probabilities.setdefault(index % 2, set()).add(body["probability"])
    assert len(probabilities[0]) == 1
    assert len(probabilities[1]) == 1
    assert probabilities[0] != probabilities[1]
