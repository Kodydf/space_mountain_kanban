import hashlib
import secrets
import sqlite3
from pathlib import Path

from app import config

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schema.sql"

# Mirrors frontend/src/lib/seed-data.ts, so a fresh install's out-of-the-box
# experience is unchanged from the original client-only demo.
SEED_COLUMNS = [
    ("col-1", "To Do"),
    ("col-2", "In Progress"),
    ("col-3", "Review"),
    ("col-4", "Blocked"),
    ("col-5", "Done"),
]

SEED_CARDS = [
    ("card-1", "col-1", "Design onboarding flow", "Sketch the first-run experience for new users.", "2026-09-25"),
    ("card-2", "col-1", "Set up analytics", "Wire up basic event tracking for the dashboard.", "2026-09-03"),
    ("card-3", "col-2", "Build settings page", "Account and notification preferences.", "2026-09-12"),
    ("card-4", "col-2", "Refactor auth module", "Simplify token refresh logic.", "2026-08-28"),
    ("card-5", "col-3", "Review pull request #142", "Check the new pagination component.", "2026-09-07"),
    ("card-6", "col-4", "Waiting on design assets", "Blocked until the icon set is delivered.", None),
    ("card-7", "col-5", "Launch marketing site", "Published the new landing page.", "2026-08-20"),
    ("card-8", "col-5", "Migrate database schema", "Applied the v2 schema migration in production.", "2026-09-01"),
]


def get_connection() -> sqlite3.Connection:
    config.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()
    return f"{salt}${digest}"


def _verify_password(password: str, stored_hash: str) -> bool:
    salt, _, _ = stored_hash.partition("$")
    return _hash_password(password, salt) == stored_hash


def _seed_board_if_missing(conn: sqlite3.Connection, user_id: int) -> None:
    existing = conn.execute("SELECT id FROM boards WHERE user_id = ?", (user_id,)).fetchone()
    if existing is not None:
        return

    board_id = conn.execute(
        "INSERT INTO boards (user_id) VALUES (?)", (user_id,)
    ).lastrowid

    conn.executemany(
        "INSERT INTO board_columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
        [(col_id, board_id, title, i) for i, (col_id, title) in enumerate(SEED_COLUMNS)],
    )

    positions: dict[str, int] = {}
    card_rows = []
    for card_id, column_id, title, details, due_date in SEED_CARDS:
        position = positions.get(column_id, 0)
        positions[column_id] = position + 1
        card_rows.append((card_id, column_id, title, details, due_date, position))
    conn.executemany(
        "INSERT INTO cards (id, column_id, title, details, due_date, position) VALUES (?, ?, ?, ?, ?, ?)",
        card_rows,
    )


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA_PATH.read_text())

        existing_user = conn.execute(
            "SELECT id FROM users WHERE username = ?", (config.SEED_USERNAME,)
        ).fetchone()
        if existing_user is None:
            user_id = conn.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (config.SEED_USERNAME, _hash_password(config.SEED_PASSWORD)),
            ).lastrowid
        else:
            user_id = existing_user["id"]

        _seed_board_if_missing(conn, user_id)
        conn.commit()
    finally:
        conn.close()


def verify_user(username: str, password: str) -> int | None:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE username = ?", (username,)
        ).fetchone()
        if row is None or not _verify_password(password, row["password_hash"]):
            return None
        return row["id"]
    finally:
        conn.close()


def get_username(user_id: int) -> str | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()
        return row["username"] if row else None
    finally:
        conn.close()
