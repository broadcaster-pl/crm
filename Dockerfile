# StreamFlow MVP - Backend Dockerfile
# Multi-stage build dla optymalnego rozmiaru

# ============= STAGE 1: Builder =============
FROM python:3.12-slim as builder

WORKDIR /app

# Instaluj zależności systemowe
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Kopiuj i instaluj zależności Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ============= STAGE 2: Runtime =============
FROM python:3.12-slim as runtime

WORKDIR /app

# Utwórz użytkownika non-root
RUN useradd --create-home --shell /bin/bash streamflow

# Kopiuj zainstalowane pakiety z buildera
COPY --from=builder /root/.local /home/streamflow/.local

# Dodaj pakiety do PATH
ENV PATH=/home/streamflow/.local/bin:$PATH

# Kopiuj kod aplikacji
COPY backend/ ./backend/
COPY templates/ ./templates/

# Utwórz katalog na bazę danych
RUN mkdir -p /app/data && chown -R streamflow:streamflow /app

# Przełącz na użytkownika non-root
USER streamflow

# Expose port
ENV API_PORT=8004
EXPOSE ${API_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:%s/health' % os.getenv('API_PORT', '8004'))" || exit 1

# Uruchom aplikację
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${API_PORT:-8004}"]
