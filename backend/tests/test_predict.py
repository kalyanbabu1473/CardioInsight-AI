"""Prediction endpoint tests — POST /api/predict against the deployed model."""

from app.ml.prediction_service import MODEL_NAME

VALID_INPUT = {
    "demographics": {"age": 48, "gender": "Female"},
    "bodyComposition": {"weightKg": 74, "heightCm": 172, "waistCm": 86},
    "bloodPressure": {
        "systolicBP1": 128,
        "systolicBP2": 126,
        "systolicBP3": 125,
        "hypertensionDiagnosis": "No",
    },
    "metabolic": {"hba1c": 5.6, "fastingGlucose": 102, "insulin": 14},
    "lipids": {
        "ldlCholesterol": 132,
        "totalCholesterol": 208,
        "triglycerides": 168,
        "hdlCholesterol": 46,
    },
    "environmentalToxins": {
        "bloodCadmium": 0.4,
        "bloodLead": 1.2,
        "bloodSelenium": 190.0,
        "urinaryThallium": 0.1,
        "urinaryLead": 0.5,
        "urinaryCadmium": 0.3,
        "urinaryCobalt": 0.4,
        "urinaryBarium": 2.0,
        "urinaryAntimony": 0.1,
        "urinaryTungsten": 0.1,
    },
    "pfas": {"pfos": 2.4, "pfoa": 2.1, "pfhxs": 1.5, "pfna": 0.4, "smPfos": 0.9},
    "urinaryOpes": {"bcep": 0.8, "bdcpp": 1.1, "dphp": 0.7},
    "medicalHistory": {
        "highCholesterolDiagnosis": "No",
        "cholesterolMedication": "No",
        "arthritis": "No",
    },
    "lifestyle": {
        "workedOutsideHome7d": "Yes",
        "currentSmoking": "Some days",
        "dailySittingMinutes": 420,
        "dietaryCaffeineMg": 210,
        "alcoholicDrinksPerDay": 2,
    },
    "socioeconomic": {"incomePovertyRatio": 2.4},
}


def test_predict_status_reports_ready(client):
    res = client.get("/api/predict/status")
    assert res.status_code == 200
    body = res.json()
    assert body["ready"] is True
    assert body["model"] == MODEL_NAME


def test_predict_valid_input(client):
    res = client.post("/api/predict", json={"input": VALID_INPUT})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["model"] == MODEL_NAME
    assert 0.0 <= body["probability"] <= 1.0
    assert body["level"] in {"Low", "Moderate", "High"}
    assert 0.0 <= body["confidence"] <= 1.0
    assert len(body["feature_names"]) == 44
    assert len(body["feature_values"]) == 44


def test_predict_reports_shap_contributions(client):
    body = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    assert isinstance(body["expected_value"], float)
    assert len(body["contributions"]) == 44
    for c in body["contributions"]:
        assert c["feature"] in body["feature_names"]
        assert c["label"]
        assert isinstance(c["contribution"], float)
    # TreeExplainer here operates in probability space: baseline + sum of
    # attributions reproduces the model's predicted probability.
    restored = body["expected_value"] + sum(
        c["contribution"] for c in body["contributions"]
    )
    assert abs(restored - body["probability"]) < 0.05
    # Sorted by absolute impact, most influential feature first.
    mags = [abs(c["contribution"]) for c in body["contributions"]]
    assert mags == sorted(mags, reverse=True)


def test_predict_deterministic(client):
    first = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    second = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    assert first["probability"] == second["probability"]


def test_predict_outputs_real_features(client):
    res = client.post("/api/predict", json={"input": VALID_INPUT}).json()
    assert res["feature_names"] == [
        "BMXWT", "BMXWAIST", "BPQ020", "BPQ090D", "LBXGH", "MCQ160A",
        "PAD680", "RIDAGEYR", "RIAGENDR", "SMQ856", "SMQ040", "LBXBCD",
        "BMXHT", "BMXBMI", "URXUPB", "URXUTL", "URXBCEP", "BPXOSY1",
        "BPQ080", "BPXOSY2", "BPXOSY3", "LBXGLU", "LBXBSE", "LBXBPB",
        "LBDLDL", "LBXNFOA", "LBXMFOS", "DR1TCAFF", "ALQ130", "LBXPFNA",
        "LBXTC", "LBXPFHS", "URXBDCP", "URXDPHP", "URXUCO", "URXUCD",
        "URXUBA", "LBXTR", "URXUSB", "URXUTU", "LBXNFOS", "INDFMPIR",
        "LBDHDD", "LBXIN",
    ]


def test_predict_validates_range(client):
    bad = {**VALID_INPUT}
    bad["demographics"] = {"age": 0}  # below supported minimum of 1
    res = client.post("/api/predict", json={"input": bad})
    assert res.status_code == 422


def test_predict_rejects_bad_enum(client):
    bad = {**VALID_INPUT}
    bad["medicalHistory"] = {**bad["medicalHistory"], "arthritis": "Maybe"}
    res = client.post("/api/predict", json={"input": bad})
    assert res.status_code == 422


def test_predict_rejects_missing_section(client):
    bad = {**VALID_INPUT}
    del bad["pfas"]  # a model feature cannot be dropped without refusing prediction
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
    assert body["feature_count"] == 44
    assert len(body["feature_order"]) == 44
    assert len(body["features"]) == 44