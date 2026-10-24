# CardioInsight — CVD Risk ML Platform

Cardiovascular disease risk assessment with an ML pipeline trained on NHANES
2017–2020 and a React/FastAPI web application.

**Prediction is served by the deployed Random Forest (44-feature consensus
model).** The frontend asks the backend at `POST /api/predict` and never
overrides its result. There is **no database dependency** and no local heuristic
fallback: if the ML service is unreachable the assessment is refused.

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
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration, Docker images, health
checks, and CI/CD notes.

## API

- `GET /api/health`, `GET /health` — application + real model status
- `GET /api/predict/status` — ML model availability
- `POST /api/predict` — run the deployed model
- `GET/POST /api/assessments`, `GET /api/assessments/latest`,
  `GET /api/assessments/{id}` — process-local assessment history (no database)

Interactive docs: `http://localhost:8000/docs`.

> **History durability:** assessment history is kept in backend process memory
> and is cleared on restart. The current assessment is returned directly from
> `POST /api/assessments`, so the Reports page and all downloads (Print, PDF,
> JSON, CSV) work immediately without any stored history.
