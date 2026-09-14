#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

# On Windows git-bash (MSYS), paths inside arguments like "-v host:/container"
# get silently mistranslated unless path conversion is disabled. Harmless on
# real Linux/Mac bash, where this variable has no effect.
export MSYS_NO_PATHCONV=1

docker build -t space-mountain-kanban -f backend/Dockerfile .
mkdir -p backend/data
docker rm -f space-mountain-kanban >/dev/null 2>&1 || true
docker run -d --name space-mountain-kanban -p 8000:8000 \
  --env-file .env \
  -v "$(pwd)/backend/data:/app/data" \
  space-mountain-kanban

echo "Space Mountain Task Tracker running at http://localhost:8000"
