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
   │  POST /api/predict             (ML inference)
   │  POST/GET /api/assessments     (process-local history, no database)
   ▼
 Backend (FastAPI :8000)
   ├─ ml/        loads Models/Random_Forest/Random_Forest_Model.pkl + contract
   ├─ api/       /api/predict, /api/assessments, /api/health
   └─ services/  in-memory assessment history (cleared on restart)
```

- The **prediction is authoritative**: the frontend calls `POST /api/predict`
  and displays whatever probability/level/confidence the backend returns. It
  never overrides those numbers locally.
- There is **no database** (no Supabase, PostgreSQL, SQLAlchemy, or SQLite)
  and no offline heuristic fallback. If the ML service is unreachable the
  assessment is refused rather than approximated.
- The ML model is the **Random Forest (Composite CVD — 44 features)**, driven by
  `feature_contract.json`. Risk thresholds: `p < 0.30` Low,
  `0.30 ≤ p < 0.70` Moderate, `p ≥ 0.70` High.
- Reports (Print, PDF, JSON, CSV) are generated in the browser from the
  assessment returned by the API, so they require no server-side storage.

### Assessment history limitation

Assessment history is held in backend process memory only. It survives normal
requests but is **cleared when the backend restarts** (and is not shared across
multiple worker processes). The current assessment is returned directly by
`POST /api/assessments`, so the Reports page and all downloads continue to work
for the assessment just submitted. If durable history is required later, it
would need an external persistence service — intentionally not added here.

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
Invoke-RestMethod http://127.0.0.1:8000/api/health        # status ok + model.ready
Invoke-RestMethod http://127.0.0.1:8000/api/predict/status # ready: true
```

The model artifacts must exist at
`Models/Random_Forest/Random_Forest_Model.pkl` and
`Models/CardioAI_Assessment_Features.pkl`, with the contract at
`feature_contract.json` (the defaults). Override via the `ML_MODEL_PATH`,
`ML_FEATURES_PATH`, and `ML_CONTRACT_PATH` environment variables or
`backend/.env`.

No database environment variables are read.

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

Coverage: health (model status, no DB), assessment create/list/get/latest
without a database, prediction happy path, determinism, and validation
(range + enum + missing-section rejection).

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
- `backend` — FastAPI + model on `:8000`, model loaded from the image. No
  database or writable volume is required.

Build-time option for the frontend image: the "Download Master Dataset" button
ships the 124 MB NHANES CSV. To exclude it:

```powershell
docker compose build --build-arg INCLUDE_DATASET=false frontend
```

### Option B — Render (native Python web service)

- **Build command:** `pip install -r backend/requirements.txt`
- **Start command:**
  `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health check path:** `/api/health`
- **Required environment variables:** none for the database. The model paths
  default to the repository layout; optionally set `ML_MODEL_PATH`,
  `ML_CONTRACT_PATH`, `ML_FEATURES_PATH`, and `ALLOWED_ORIGINS`.
- **Remove** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, `PGHOST`, `PGPORT`, `PGUSER`,
  `PGPASSWORD`, `PGDATABASE`, and any other database credentials from the
  service. The app no longer reads them.

The frontend is served by the existing Render static site
(`render.yaml` → `cardioinsight-frontend`). Keep
`frontend/.env.production`'s `VITE_API_BASE_URL` pointing at the backend.

### Option C — Bare metal / VM

1. Backend: run uvicorn (above) with `ENVIRONMENT=production`.
2. Frontend: serve `frontend/dist/` with any static server and reverse-proxy
   `/api/*` to the backend host:port.

---

## Configuration reference

| Variable            | Default                                          | Purpose                                   |
| ------------------- | ------------------------------------------------ | ----------------------------------------- |
| `ML_MODEL_PATH`     | `Models/Random_Forest/Random_Forest_Model.pkl`   | Path to the deployment Random Forest      |
| `ML_FEATURES_PATH`  | `Models/CardioAI_Assessment_Features.pkl`        | Fallback ordered feature list             |
| `ML_CONTRACT_PATH`  | `feature_contract.json`                          | Canonical 44-feature contract             |
| `ALLOWED_ORIGINS`   | localhost:5173/3000 + production frontend        | CORS origins (comma-separated)            |
| `HOST`/`PORT`       | `127.0.0.1`/`8000`                               | uvicorn bind address                      |
| `ENVIRONMENT`       | `development`                                    | `development` / `production`              |

There is deliberately **no** `DATABASE_URL` or database configuration.

---

## CI / CD

`.github/workflows/ci.yml` runs on every push/PR:

- frontend: `npm ci` → `oxlint` → `npm run build`
- backend: `pip install -r backend/requirements.txt` → `pytest tests`

Both jobs need the deployment model artifacts present in the repository
(negated in `.gitignore`). Since the model is large, track it with **Git LFS**
so CI can `actions/checkout@v4` it normally.

---

## Health checks

| Probe                      | Expected                                              |
| -------------------------- | ----------------------------------------------------- |
| `GET /api/health`          | `200` + `status: ok`, `model.ready: true`             |
| `GET /health`              | Same as `/api/health` (legacy alias)                  |
| `GET /api/predict/status`  | `{"ready":true,"model":"..."}`                        |
| `GET /healthz` (nginx)     | `200 ok`                                              |

If the trained model fails to load, `/api/health` and `/health` return `503`
with `status: degraded` and the precise (non-secret) reason — no database probe
is performed.

---

## API

- `POST /api/predict` — body `{"input": {AssessmentInput}}`, returns
  `{model, probability, level, confidence, feature_names, feature_values,
  expected_value, contributions}`.
  `422` for out-of-range/invalid values, `503` when the model is unavailable.
- `POST /api/assessments` — stores a record in process memory; returns it with
  the server sequential id `CI-YYYYMMDD-NNNN`.
- `GET /api/assessments`, `GET /api/assessments/latest`,
  `GET /api/assessments/{id}`.
- `GET /api/health`, `GET /health`.

Interactive docs: `http://localhost:8000/docs` (OpenAPI).
