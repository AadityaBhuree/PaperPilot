# =============================================================================
# PaperPilot Backend — FastAPI
# =============================================================================

FROM python:3.12-slim

WORKDIR /app

# System dependencies for OCR, PDF processing, and sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port uvicorn listens on
EXPOSE 8000

# Run with uvicorn
# Uses $PORT (default 8000) for flexibility in cloud deployments
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
