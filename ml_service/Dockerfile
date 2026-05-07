#Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

#Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

#Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

#Runtime stage
FROM python:3.11-slim

WORKDIR /app

#Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

#Copy application code
COPY api/     ./api/
COPY models/  ./models/
COPY data/    ./data/

#Environment
ENV MODEL_PATH=models/trained/xgboost_v1.pkl
ENV PORT=8000

#Expose FastAPI port
EXPOSE 8000

#Health check for Render / Docker Compose
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

#Start FastAPI with uvicorn
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
