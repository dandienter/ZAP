# ==========================================
# ZAP Backend - Production Dockerfile
# FastAPI + SymPy CFL Engine + Python 3.11/3.12
# ==========================================

FROM python:3.11-slim

# Set timezone & unbuffered logs
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Jakarta

WORKDIR /app

# Install system dependencies (build-essential, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend codebase, data, and cfl modules
COPY backend/ ./backend/
COPY data/ ./data/

# Jalankan sebagai user non-root
RUN groupadd --system zapgroup && \
    useradd --system --gid zapgroup --home-dir /app zapuser && \
    chown -R zapuser:zapgroup /app
USER zapuser

WORKDIR /app/backend

# Expose FastAPI port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
