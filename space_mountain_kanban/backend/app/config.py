import os
from pathlib import Path

from dotenv import load_dotenv

# The .env file lives in the project root (one level above backend/), and
# holds the OpenRouter key. Inside Docker, `docker run --env-file .env`
# already sets it directly, so this is a no-op there (load_dotenv never
# overrides an already-set variable) — it only fills the gap for local,
# non-Docker runs (e.g. `uv run pytest -m live`).
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "kanban.db"

SESSION_COOKIE_NAME = "session_id"

# Hardcoded MVP credentials, seeded into the database at startup if missing.
SEED_USERNAME = "user"
SEED_PASSWORD = "password"

OPENROUTER_API_KEY = os.environ.get("OpenRouter_API_Key")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-oss-120b"
