# CardioInsight AI — backend image
# Serves the FastAPI prediction + DB-free assessment API.
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
COPY Models/CardioAI_Clinical_Model.pkl ./Models/CardioAI_Clinical_Model.pkl
COPY Models/CardioAI_Clinical_Calibrator.pkl ./Models/CardioAI_Clinical_Calibrator.pkl
COPY Models/CardioAI_Clinical_Features.pkl ./Models/CardioAI_Clinical_Features.pkl
COPY Models/CardioAI_Clinical_Preprocessing.json ./Models/CardioAI_Clinical_Preprocessing.json
COPY Models/CardioAI_Clinical_Metrics.json ./Models/CardioAI_Clinical_Metrics.json
COPY Models/CardioAI_Clinical_Manifest.json ./Models/CardioAI_Clinical_Manifest.json
COPY feature_contract.json ./feature_contract.json

# Production defaults (override via env / compose). No database is required.
ENV ENVIRONMENT=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    ML_MODEL_PATH=/app/Models/CardioAI_Clinical_Model.pkl \
    ML_CALIBRATOR_PATH=/app/Models/CardioAI_Clinical_Calibrator.pkl \
    ML_CONTRACT_PATH=/app/feature_contract.json \
    ML_FEATURES_PATH=/app/Models/CardioAI_Clinical_Features.pkl \
    ML_PREPROCESSING_PATH=/app/Models/CardioAI_Clinical_Preprocessing.json \
    ML_METRICS_PATH=/app/Models/CardioAI_Clinical_Metrics.json \
    ML_MANIFEST_PATH=/app/Models/CardioAI_Clinical_Manifest.json

# Build-time gate: fail the build if the model is an LFS pointer, unloadable,
# or does not exactly match the 18-feature contract. Only this script is copied
# (backend/scripts also holds large backup artifacts that must stay out of the
# image). Runs as root before the unprivileged USER switch.
COPY backend/scripts/verify_model.py ./scripts/verify_model.py
RUN python ./scripts/verify_model.py

# Application runs unprivileged. It only reads code/model files and writes
# nothing, since assessment history is process-local memory.
RUN chown -R 10001:10001 /app
USER 10001

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
