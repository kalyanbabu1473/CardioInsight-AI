# CardioInsight — Deployment Guide

This document describes how to run the CardioInsight AI platform in
development and production, what the deployed components are, and the checks
that verify a healthy stack.

---

## Architecture

```
 Browser
   │  (Vite dev server :5173  |  nginx :80/:3000 in production)
   ▼
 Frontend (React SPA)
   │  POST /api/predict       (ML inference)
   │  POST/GET /api/assessments   (persistence)
   ▼
 Backend (FastAPI :8000)
   ├── ml/        loads Models/CardioAI_Assessment_Model.pkl + feature list
   ├── api/       /api/predict, /api/assessments, /api/health
   └── database/  SQLAlchemy (SQLite by default; PostgreSQL in production)
```

- The **prediction is authoritative**: the frontend calls `POST /api/predict`
  and displays whatever probability/level/confidence the backend returns. It
  never overrides those numbers locally.
- If the backend is unreachable, the UI falls back to a **local heuristic
  estimate** that is explicitly labeled "Local estimate (offline)" so it can
  never be mistaken for the trained model.
- The ML model is the **Random Forest (CardioAI Assessment Model)**: 500 trees,
  `max_depth=20`, `class_weight="balanced"`, trained on the 20 clinical NHANES
  features the assessment wizard collects (ROC AUC 0.9005 on hold-out).
  Risk thresholds: `p < 0.30` Low, `0.30 ≤ p < 0.70` Moderate, `p ≥ 0.70` High.

---

## Local development

### Backend

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Verify:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health        # {"status":"ok"}
Invoke-RestMethod http://127.0.0.1:8000/api/predict/status # {"ready":true,"model":"..."}
```

The model artifacts must exist at
`Models/CardioAI_Assessment_Model.pkl` and
`Models/CardioAI_Assessment_Features.pkl` (the defaults). Override via the
`ML_MODEL_PATH` / `ML_FEATURES_PATH` environment variables or `backend/.env`.

### Frontend

```powershell
cd frontend
npm install
npm run dev            # http://localhost:5173, proxies /api -> :8000
```

### Tests

```powershell
cd backend
python -m pytest tests -q
```

Coverage: health endpoints, assessment persistence (create/list/get/latest),
prediction happy path, determinism, and validation (range + enum + extra-field
rejection).

### Production build

```powershell
cd frontend
npm run build          # outputs to frontend/dist
```

---

## Deployment

### Option A — Docker Compose (recommended)

```powershell
docker compose up --build
```

- `frontend` — nginx serving the built SPA on `:3000` with `/api` reverse
  proxied to `backend`; health probe at `GET /healthz`.
- `backend` — FastAPI + model on `:8000`, model loaded from the image, SQLite
  persisted in the `cardioinsight-data` volume.

Build-time option for the frontend image: the "Download Master Dataset" button
ships the 124 MB NHANES CSV. To exclude it:

```powershell
docker compose build --build-arg INCLUDE_DATASET=false frontend
```

(The landing Dataset page then renders without a download link; the file
remains available in the repository `frontend/public/datasets/`.)

### Option B — Bare metal / VM

1. Backend: run uvicorn (above) with `ENVIRONMENT=production`.
2. Frontend: serve `frontend/dist/` with any static server and reverse-proxy
   `/api/*` to the backend host:port.

---

## Configuration reference

| Variable            | Default                                        | Purpose                                   |
| ------------------- | ---------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL`      | `sqlite:///backend/database/cardioinsight.db`  | SQLAlchemy URL (use PostgreSQL in prod)   |
| `ML_MODEL_PATH`     | `Models/CardioAI_Assessment_Model.pkl`         | Path to the deployment Random Forest      |
| `ML_FEATURES_PATH`  | `Models/CardioAI_Assessment_Features.pkl`      | Ordered 20-feature list                   |
| `ALLOWED_ORIGINS`   | localhost:5173/3000 (dev)                      | CORS origins (comma-separated)            |
| `HOST`/`PORT`       | `127.0.0.1`/`8000`                             | uvicorn bind address                      |
| `ENVIRONMENT`       | `development`                                  | `development` / `production`              |

---

## CI / CD

`.github/workflows/ci.yml` runs on every push/PR:

- frontend: `npm ci` → `oxlint` → `npm run build`
- backend: `pip install -r backend/requirements.txt` → `pytest tests`

Both jobs need the deployment model artifacts present in the repository
(negated in `.gitignore`). Since `CardioAI_Assessment_Model.pkl` is ~55 MB,
track it with **Git LFS** (`git lfs track "Models/CardioAI_Assessment_Model.pkl"`)
so CI can `actions/checkout@v4` it normally.

---

## Health checks

| Probe                      | Expected                              |
| -------------------------- | ------------------------------------- |
| `GET /api/health`          | `{"status":"ok"}` (DB reachable)      |
| `GET /health`              | `{"status":"ok"}` (legacy alias)      |
| `GET /api/predict/status`  | `{"ready":true,"model":"..."}`        |
| `GET /healthz` (nginx)     | `200 ok`                              |

---

## API

- `POST /api/predict` — body `{"input": {AssessmentInput}}`, returns
  `{model, probability, level, confidence, feature_names, feature_values}`.
  `422` for out-of-range/invalid values, `503` when the model is unavailable.
- `POST /api/assessments` — persists a record; returns it with the server
  sequential id `CI-YYYYMMDD-NNNN`.
- `GET /api/assessments`, `GET /api/assessments/latest`,
  `GET /api/assessments/{id}`.
- `GET /api/health`, `GET /health`.

Interactive docs: `http://localhost:8000/docs` (OpenAPI).
