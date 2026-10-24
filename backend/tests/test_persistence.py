"""Health + DB-free assessment endpoint tests."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from app.ml.prediction_service import MODEL_NAME
from app.services.assessment_store import store


def test_health_ok(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] == "not_used"
    assert body["model"]["ready"] is True
    assert body["model"]["name"] == MODEL_NAME
    assert body["model"]["detail"] is None


def test_legacy_health_alias(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] == "not_used"
    assert body["model"]["ready"] is True


def _valid_input():
    return {
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
        "lifestyle": {"everSmoked100": "Yes", "currentSmoking": "Not at all"},
    }


def _payload():
    return {
        "model": "FORGED MODEL",
        "modelTagline": "Forged tagline",
        "input": _valid_input(),
        "result": {
            "probability": 0.99,
            "level": "High",
            "confidence": 99.0,
            "interpretation": "Forged interpretation.",
            "topFactors": [],
            "recommendations": {
                "lifestyle": ["Forged lifestyle"],
                "monitoring": [],
                "medical": [],
            },
        },
    }


def test_assessment_history_starts_empty(client):
    assert client.get("/api/assessments").json() == []
    assert client.get("/api/assessments/latest").status_code == 404


def test_create_assessment_without_database(client):
    res = client.post("/api/assessments", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["id"].startswith("CI-")
    assert body["model"] == MODEL_NAME
    assert body["modelTagline"] == "Calibrated Clinical Model"
    assert body["legacy"] is False
    assert body["createdAt"]
    assert body["result"]["probability"] != 0.99
    assert body["result"]["level"] in {"Low", "Moderate", "High"}
    assert body["result"]["interpretation"] != "Forged interpretation."
    assert len(body["result"]["topFactors"]) == 6
    assert set(body["result"]["recommendations"]) == {
        "lifestyle",
        "monitoring",
        "medical",
    }


def test_legacy_flat_input_is_rejected(client):
    payload = _payload()
    payload["input"] = {
        "age": 48,
        "sex": "Male",
        "systolicBP": 128,
        "biomarkers": {},
    }
    res = client.post("/api/assessments", json=payload)
    assert res.status_code == 422


def test_client_cannot_forge_result_or_identifiers(client):
    payload = _payload()
    payload["id"] = "CI-19990101-9999"
    payload["createdAt"] = "1999-01-01T00:00:00+00:00"
    payload["legacy"] = True
    res = client.post("/api/assessments", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["id"] != "CI-19990101-9999"
    assert body["createdAt"] != "1999-01-01T00:00:00+00:00"
    assert body["legacy"] is False
    assert body["result"]["probability"] != 0.99


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


def test_missing_assessment_returns_404(client):
    assert client.get("/api/assessments/CI-19990101-0001").status_code == 404


def test_frontend_posts_input_and_receives_server_result(client):
    """The repository sends only input; the server owns the result."""
    prediction = client.post("/api/predict", json={"input": _valid_input()}).json()
    created = client.post(
        "/api/assessments",
        json={
            "input": _valid_input(),
            "result": {"probability": 0.01, "level": "Low", "confidence": 99.0},
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["result"]["probability"] == prediction["probability"]
    assert body["result"]["level"] == prediction["level"]
    assert body["result"]["confidence"] == prediction["confidence"]
    assert 50.0 <= body["result"]["confidence"] <= 100.0
    assert body["result"]["topFactors"][0]["name"] == prediction["contributions"][0]["label"]
    assert client.get("/api/assessments/latest").json()["id"] == body["id"]


def test_invalid_prediction_is_not_stored(client):
    bad = _valid_input()
    bad["demographics"] = {"age": 17, "sex": "Female"}
    assert client.post("/api/predict", json={"input": bad}).status_code == 422
    assert client.post("/api/assessments", json={"input": bad}).status_code == 422
    assert client.get("/api/assessments").json() == []


def test_missing_model_returns_503_and_stores_nothing(client, monkeypatch):
    from app.api import assessments as assessments_api
    from app.api import predict as predict_api

    monkeypatch.setattr(predict_api, "model_ready", lambda: False)
    monkeypatch.setattr(
        predict_api, "model_unavailable_reason", lambda: "model unavailable"
    )
    monkeypatch.setattr(assessments_api, "model_ready", lambda: False)
    monkeypatch.setattr(
        assessments_api, "model_unavailable_reason", lambda: "model unavailable"
    )
    status = client.get("/api/predict/status")
    assert status.status_code == 200
    assert status.json()["ready"] is False
    assert status.json()["detail"] == "model unavailable"

    res = client.post("/api/predict", json={"input": _valid_input()})
    assert res.status_code == 503
    res = client.post("/api/assessments", json={"input": _valid_input()})
    assert res.status_code == 503
    assert client.get("/api/assessments").json() == []


def test_health_returns_503_when_model_unavailable(client, monkeypatch):
    from app import main

    monkeypatch.setattr(main, "model_ready", lambda: False)
    monkeypatch.setattr(
        main, "model_unavailable_reason", lambda: "model unavailable"
    )
    for path in ("/api/health", "/health"):
        res = client.get(path)
        assert res.status_code == 503
        assert res.json()["model"]["ready"] is False
        assert res.json()["model"]["detail"] == "model unavailable"


def test_assessment_store_assigns_unique_ids_under_concurrency():
    fixed = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def create(_):
        return store.create(
            model=MODEL_NAME,
            model_tagline="Calibrated Clinical Model",
            input={},
            result={},
            created_at=fixed,
        )

    with ThreadPoolExecutor(max_workers=8) as pool:
        records = list(pool.map(create, range(24)))

    ids = [record.id for record in records]
    assert len(ids) == 24
    assert len(set(ids)) == 24
