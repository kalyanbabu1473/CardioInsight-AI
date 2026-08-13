"""Health + persistence endpoint tests."""

from app.ml.prediction_service import MODEL_NAME


def test_health_ok(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] in {"connected", "disconnected"}


def test_legacy_health_alias(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] in {"connected", "disconnected"}


def _valid_input():
    return {
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
            "currentSmoking": "Not at all",
            "dailySittingMinutes": 420,
            "dietaryCaffeineMg": 210,
            "alcoholicDrinksPerDay": 1,
        },
        "socioeconomic": {"incomePovertyRatio": 2.4},
    }


def _payload():
    return {
        "model": MODEL_NAME,
        "modelTagline": "Production Model",
        "input": _valid_input(),
        "result": {
            "probability": 0.1178,
            "level": "Low",
            "confidence": 0.7644,
        },
    }


def test_create_assessment_persists(client):
    res = client.post("/api/assessments", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["id"].startswith("CI-")
    assert body["result"]["level"] == "Low"
    assert body["legacy"] is False


def test_legacy_input_marked(client):
    payload = _payload()
    payload["input"] = {
        "age": 48,
        "sex": "Male",
        "systolicBP": 128,
        "biomarkers": {},
    }
    res = client.post("/api/assessments", json=payload)
    assert res.status_code == 201, res.text
    assert res.json()["legacy"] is True


def test_list_and_get_assessment(client):
    created = client.post("/api/assessments", json=_payload()).json()
    listed = client.get("/api/assessments").json()
    assert any(a["id"] == created["id"] for a in listed)

    fetched = client.get(f"/api/assessments/{created['id']}").json()
    assert fetched["id"] == created["id"]


def test_get_latest_assessment(client):
    one = client.post("/api/assessments", json=_payload()).json()
    two = client.post("/api/assessments", json=_payload()).json()
    latest = client.get("/api/assessments/latest").json()
    assert latest["id"] == two["id"]
    assert latest["id"] != one["id"]