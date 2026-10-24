# CardioInsight — Deployment Guide

This document describes how to run the CardioInsight AI platform in
development and production, what the deployed components are, and the checks
that verify a healthy stack.

---

## Architecture

```
 Browser
   |  (Vite dev server :5173  |  nginx :80/:3000 in production)
   v
 Frontend (React SPA)
   |  POST /api/assessments     (server prediction + process-local history)
   |  POST /api/predict         (optional direct inference)
   v
 Backend (FastAPI :8000)
   +-- ml/        manifest-verified model + calibrator + preprocessing + contract
   +-- api/       /api/predict, /api/assessments, /api/health
   +-- services/  server result builder + in-memory history (cleared on restart)
```

### Assessment history limitation

Assessment history is held in backend process memory only. It survives normal
requests but is **cleared when the backend restarts** (and is not shared across
multiple worker processes). The current assessment is returned directly by
`POST /api/assessments`, so the Reports page and all downloads continue to work
for the assessment just submitted. If durable history is required later, it
would need an external persistence service — intentionally not added here.

### Model limitations and validation status

The shipped model is not externally validated and is not a clinical diagnostic
device. It predicts **prevalent self-reported CVD** from `MCQ160B`-`MCQ160F`,
not incident CVD or future risk. Its held-out evaluation is a single stratified
split of the adult complete-case NHANES-derived cohort:

| Cohort | n | Events | AUC | Brier |
| --- | ---: | ---: | ---: | ---: |
| Overall test split | 701 | 78 | 0.8156 | 0.0844 |
| Male | 356 | 53 | 0.7997 | 0.1076 |
| Female | 345 | 25 | 0.8161 | 0.0606 |
| Age 18-39 | 233 | 2 | 0.6526 | 0.0083 |
| Age 40-59 | 231 | 25 | 0.7694 | 0.0847 |
| Age 60-80 | 237 | 51 | 0.6618 | 0.1591 |

The overall AUC 95% bootstrap CI is `0.7717-0.8573`, average precision is
`0.2970` (95% CI `0.2270-0.3768`), and the Brier score is `0.0844` (95% CI
`0.0707-0.0990`). Calibration intercept is `0.0640` and slope `1.0759`.
Average precision is more informative than AUC at this 11.2% prevalence.

At the 20% high-risk threshold, overall sensitivity is `0.756`, specificity
`0.753`, PPV `0.277`, and NPV `0.961` (TP 59, FP 154, TN 469, FN 19). At the 5%
threshold, sensitivity is `0.923` and specificity `0.563`. These are
screening-style estimates, not diagnostic certainty; a high-risk result
requires clinical confirmation.

The age 18-39 subgroup has only **two events**, so its AUC is not reliable.
No subgroup result should be interpreted as evidence of fairness or equivalent
performance. The cohort contains no participants under 18 or over 80.

Training and live inference now share `app.ml.preprocessing`:

- BMI is derived from height and weight and rounded to four decimals in both
  paths. The recorded `BMXBMI` column is not used.
- The cohort is complete-case. Rows flagged as imputed for observed features or
  missing continuous values are excluded; no continuous value is imputed.
- Never-smokers (`SMQ020=2`) use the NHANES structural skip value `SMQ040=3`.
  Ever-smokers require an observed `SMQ040` in `{1,2,3}`.
- Refused/unknown categorical codes are excluded, never mapped to a substantive
  answer.

Retraining and independent validation are still required before any clinical
use. The previous parity-broken artifacts are preserved at
`Models/archive/pre_parity_remediation_20261024_223015`; do not deploy them.

### Assessment API integrity

`POST /api/assessments` requires structured `AssessmentInput` and computes the
result server-side with the deployed model. A caller cannot persist an arbitrary
probability, level, factors, or recommendations; those fields are ignored if
present. Legacy flat request bodies are rejected with `422`. The endpoint still
has no authentication or rate limiting, so do not expose it as a public
clinical service without adding those controls.

### Artifact integrity

At startup and on model load, the backend verifies
`Models/CardioAI_Clinical_Manifest.json` against SHA-256 hashes and byte sizes
for the model, calibrator, features, contract, preprocessing metadata, and
metrics. It also checks the 18-feature order and that preprocessing is marked
complete-case. A Git LFS pointer or any mismatch makes the model unavailable and
health checks return `503`; the deployment model must therefore be a real
committed binary. The manifest detects accidental corruption or partial
deployment; it is not a signature and does not stop an attacker who can rewrite
every artifact.

Artifact paths are resolved from the repository root, not from the current
working directory. Defaults select the clinical model and all of its matching
metadata. Relative overrides are also anchored at the repository root and must
keep the canonical artifact filenames. A stale legacy override such as
`Random_Forest_Model.pkl` or a relative path escaping the repository fails before
hash verification, so the build cannot silently switch models.

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
`Models/CardioAI_Clinical_Model.pkl`,
`Models/CardioAI_Clinical_Calibrator.pkl`,
`Models/CardioAI_Clinical_Features.pkl`,
`Models/CardioAI_Clinical_Preprocessing.json`,
`Models/CardioAI_Clinical_Metrics.json`, and
`Models/CardioAI_Clinical_Manifest.json`, with the contract at
`feature_contract.json` (the defaults). Override via the `ML_MODEL_PATH`,
`ML_CALIBRATOR_PATH`, `ML_FEATURES_PATH`, `ML_CONTRACT_PATH`,
`ML_PREPROCESSING_PATH`, `ML_METRICS_PATH`, and `ML_MANIFEST_PATH`
environment variables or `backend/.env`.

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

cd ..\frontend
npm test
npm run lint
npm run build
```

Backend coverage includes model/calibrator/contract artifacts, manifest hash
verification and fail-closed loading, shared preprocessing/parity, input
boundaries, smoking consistency, non-finite JSON handling, direct
model/calibrator/predict math, SHAP additivity, diagnostics, server-owned
assessment results, persistence, and concurrent requests. Frontend coverage
includes BMI rounding/validation, smoking consistency, server-result-only
persistence, and report HTML escaping.

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

- **Build command:**
  `pip install -r backend/requirements.txt && python backend/scripts/verify_model.py`
- **Start command:**
  `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health check path:** `/api/health`
- **Root directory:** repository root (`backend` must not be used as the
  service root, because the build command resolves `backend/scripts/...`).
- The deployment model is committed as a normal binary, **not Git LFS**.
  The build-time verification fails the deploy if the checkout contains an LFS
  pointer or an artifact/manifest mismatch instead of serving repeated `503`s.
- **Required environment variables:** none for the database or model paths.
  Leave `ML_MODEL_PATH`, `ML_CALIBRATOR_PATH`, `ML_FEATURES_PATH`,
  `ML_CONTRACT_PATH`, `ML_PREPROCESSING_PATH`, `ML_METRICS_PATH`, and
  `ML_MANIFEST_PATH` unset so the canonical repository defaults are used.
  Delete any existing overrides, especially legacy values such as
  `../Models/Random_Forest/Random_Forest_Model.pkl`; they are not needed and
  now fail configuration validation. Set only `ALLOWED_ORIGINS` if the frontend
  origin differs from the default.
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
| `ML_MODEL_PATH`      | `Models/CardioAI_Clinical_Model.pkl`             | Path to the deployment Random Forest      |
| `ML_CALIBRATOR_PATH` | `Models/CardioAI_Clinical_Calibrator.pkl`        | Isotonic probability calibrator           |
| `ML_FEATURES_PATH`   | `Models/CardioAI_Clinical_Features.pkl`          | Fallback ordered feature list             |
| `ML_CONTRACT_PATH`   | `feature_contract.json`                          | Canonical 18-feature clinical contract    |
| `ML_PREPROCESSING_PATH` | `Models/CardioAI_Clinical_Preprocessing.json` | Shared training/inference preprocessing metadata |
| `ML_METRICS_PATH`    | `Models/CardioAI_Clinical_Metrics.json`          | Stored held-out metrics and thresholds    |
| `ML_MANIFEST_PATH`   | `Models/CardioAI_Clinical_Manifest.json`         | SHA-256 manifest verified on model load   |
| `ALLOWED_ORIGINS`   | localhost:5173/3000 + production frontend        | CORS origins (comma-separated)            |
| `HOST`/`PORT`       | `127.0.0.1`/`8000`                               | uvicorn bind address                      |
| `ENVIRONMENT`       | `development`                                    | `development` / `production`              |

There is deliberately **no** `DATABASE_URL` or database configuration.

---

## CI / CD

`.github/workflows/ci.yml` runs on every push/PR:

- frontend: `npm ci` -> `oxlint` -> `npm test` -> `npm run build`
- backend: `pip install -r backend/requirements.txt` -> contract-sync check ->
  `verify_model.py` (including manifest) -> `pytest tests`

Both jobs need the deployment artifacts present in the repository (negated in
`.gitignore`). The 21.8 MB clinical model is committed as a **normal binary**,
not Git LFS, so deployment hosts receive the real file without an LFS smudge
step. The calibrator, feature list, preprocessing metadata, metrics, and
manifest are small tracked files. CI verifies the manifest, feature order,
calibrator, and model before running the backend suite; a regression test also
rejects re-tracking the clinical model with LFS.

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

On Render, a `503` whose reason mentions `lfs_pointer=True` or a model
size/hash mismatch means the checkout contains an LFS pointer instead of the
real model. Confirm it with the build log, use the build command above, then
clear the Render build cache and deploy the commit containing the real binary.
A start-time log line `ML model readiness failed at startup: ...` reports the
same sanitized reason before health checks run.

If the verifier prints `../Models/Random_Forest/Random_Forest_Model.pkl`,
`../feature_contract.json`, or `source: ML_MODEL_PATH`, the Render service has
stale path overrides. Delete the `ML_*` variables from the service, keep the
repository root as the service root, clear the build cache, and redeploy. The
default paths then resolve to the committed clinical artifacts.

---

## API

- `POST /api/predict` - body `{"input": {AssessmentInput}}`, returns
  `{model, probability, level, confidence, feature_names, feature_values,
  expected_value, contributions}`.
  `422` for out-of-range/invalid values, `503` when the model is unavailable.
- `POST /api/assessments` - body `{"input": {AssessmentInput}}`. Runs the model,
  constructs the result server-side, stores the record in process memory, and
  returns it with the server sequential id `CI-YYYYMMDD-NNNN`. Client-supplied
  results are ignored; legacy flat bodies return `422`; unavailable model returns
  `503`.
- `GET /api/assessments`, `GET /api/assessments/latest`,
  `GET /api/assessments/{id}`.
- `GET /api/health`, `GET /health`.

Interactive docs: `http://localhost:8000/docs` (OpenAPI).
