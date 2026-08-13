# CardioInsight — CVD Risk ML Platform

Cardiovascular disease risk assessment with an ML pipeline trained on NHANES
2017–2020 and a React/FastAPI web application.

**Prediction is served by the deployed Random Forest (CardioAI Assessment
Model)** — 500 trees trained on the 20 clinical features the assessment wizard
collects (ROC AUC 0.9005). The frontend asks the backend at `POST /api/predict`
and never overrides its result; if the backend is unreachable it falls back to
an explicitly-labelled local heuristic estimate.

## Run locally

### 1) Backend (Python 3.13)

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Health check:

```powershell
curl http://localhost:8000/api/health
# expected: {"status":"ok"}
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

- `GET /api/health`, `GET /health` — service health
- `GET /api/predict/status` — ML model availability
- `POST /api/predict` — run the deployed model
- `GET/POST /api/assessments`, `GET /api/assessments/latest`,
  `GET /api/assessments/{id}` — assessment persistence

Interactive docs: `http://localhost:8000/docs`.
