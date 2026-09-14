# --- stage 1: build the Next.js static export ---
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- stage 2: python runtime ---
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim
WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --no-dev

COPY backend/app ./app
COPY backend/schema.sql ./schema.sql
COPY --from=frontend-builder /frontend/out ./static

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
VOLUME ["/app/data"]

CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
