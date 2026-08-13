# CardioInsight AI — backend image
# Serves the FastAPI persistence + prediction API.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Runtime deps first (cached layer).
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Application code.
COPY backend/app ./app

# Only the deployment model artifacts (research models stay out of the image).
COPY Models/Random_Forest/Random_Forest_Model.pkl ./Models/Random_Forest_Model.pkl
COPY Models/CardioAI_Assessment_Features.pkl ./Models/CardioAI_Assessment_Features.pkl
COPY feature_contract.json ./feature_contract.json

# Production defaults (override via env / compose).
ENV ENVIRONMENT=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    ML_MODEL_PATH=/app/Models/Random_Forest_Model.pkl \
    ML_CONTRACT_PATH=/app/feature_contract.json \
    ML_FEATURES_PATH=/app/Models/CardioAI_Assessment_Features.pkl \
    DATABASE_URL=sqlite:////app/data/cardioinsight.db

# Application code runs unprivileged; the data dir is writable by UID 10001.
RUN mkdir -p /app/data && chown -R 10001:10001 /app
USER 10001

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]