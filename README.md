# CardioInsight — CVD Risk ML Platform

Cardiovascular disease risk assessment with an ML pipeline trained on NHANES
2017–2020 and a React/FastAPI web application.

**Prediction is served by the deployed calibrated Random Forest (18-feature
adult clinical model).** The frontend posts structured input to
`POST /api/assessments`; the backend runs the model and constructs the stored
result in the same request, so the client cannot override it. Probabilities are
isotonic-calibrated, and the reported certainty is `max(p, 1-p) * 100` for
calibrated CVD probability `p`; it is not the probability that the prediction is
correct. There is **no database dependency** and no local heuristic fallback: if
the ML service is unreachable the assessment is refused. `POST /api/predict`
remains available for direct inference.

## Run locally

### 1) Backend (Python 3.13)

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

No `DATABASE_URL`, Supabase URL, or PostgreSQL credential is needed.

Health check:

```powershell
curl http://localhost:8000/api/health
# expected: {"status":"ok","database":"not_used","model":{"ready":true,...}}
```

### 2) Frontend (Vite/React)

```powershell
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`; `/api` is proxied to the backend in dev.

### 3) Full stack with Docker Compose

```powershell
docker compose up --build
```

Frontend on `http://localhost:3000`, backend on `http://localhost:8000`.

## Tests

```powershell
cd backend
python -m pytest tests -q

cd ..\frontend
npm test
npm run lint
npm run build
```

## Validation status

The shipped adult complete-case model was retrained on **3,501 participants**
(392 prevalent CVD events) and evaluated on a held-out split of **701**
participants (78 events). It has **not** been externally validated.

| Cohort | n | Events | AUC | Brier |
| --- | ---: | ---: | ---: | ---: |
| Overall test split | 701 | 78 | 0.816 | 0.084 |
| Male | 356 | 53 | 0.800 | 0.108 |
| Female | 345 | 25 | 0.816 | 0.061 |
| Age 18-39 | 233 | 2 | 0.653 | 0.008 |
| Age 40-59 | 231 | 25 | 0.769 | 0.085 |
| Age 60-80 | 237 | 51 | 0.662 | 0.159 |

The overall AUC 95% bootstrap CI is 0.772-0.857; average precision is 0.297.
At the 20% high-risk threshold, sensitivity is 0.756, specificity 0.753, PPV
0.277, and NPV 0.961. The age 18-39 subgroup has only two events, so its AUC is
not reliable. These are screening-style estimates, not diagnostic certainty.

The target is **prevalent self-reported CVD**, not incident CVD or future risk.
NHANES survey weights are not applied, so cohort estimates are not
population-representative. A high-risk result requires clinical confirmation.

Training and inference now share BMI derivation and smoking-skip rules; rows
with imputed measurements or refused/unknown categorical codes are excluded
from training rather than mapped to values the live contract would reject. The
previous training/live parity issues are documented in
[DEPLOYMENT.md](DEPLOYMENT.md#model-limitations-and-validation-status), and the
old artifacts are archived at
`Models/archive/pre_parity_remediation_20261024_223015`. The deployment manifest
pins SHA-256 hashes of the model, calibrator, features, contract, preprocessing
metadata, and metrics; these checksums detect accidental corruption, not a
determined attacker with write access.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration, Docker images, health
checks, and CI/CD notes.

## API

- `GET /api/health`, `GET /health` - application + real model status
- `GET /api/predict/status` - ML model availability
- `POST /api/predict` - direct model inference
- `POST /api/assessments` - requires structured `input`; the backend computes
  and stores the model result (client-supplied results are ignored). Legacy flat
  request bodies are rejected with `422`.
- `GET /api/assessments`, `GET /api/assessments/latest`,
  `GET /api/assessments/{id}` - process-local assessment history (no database)

Interactive docs: `http://localhost:8000/docs`.

> **History durability:** assessment history is kept in backend process memory
> and is cleared on restart. The current assessment is returned directly from
> `POST /api/assessments`, so the Reports page and all downloads (Print, PDF,
> JSON, CSV) work immediately without any stored history.
