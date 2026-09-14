$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

docker build -t space-mountain-kanban -f backend/Dockerfile .
New-Item -ItemType Directory -Force -Path backend/data | Out-Null
docker rm -f space-mountain-kanban 2>$null | Out-Null
docker run -d --name space-mountain-kanban -p 8000:8000 `
  --env-file .env `
  -v "${PWD}/backend/data:/app/data" `
  space-mountain-kanban

Write-Host "Space Mountain Task Tracker running at http://localhost:8000"
