FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps from backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and taxonomy
COPY backend/ /app/backend/
COPY taxonomy/ /app/taxonomy/

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["sh", "-c", "cd /app/backend && python -m alembic -c alembic.ini upgrade head 2>&1; exec uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
