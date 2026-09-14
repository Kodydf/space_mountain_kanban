import secrets

from fastapi import HTTPException, Request, status

from app import config

# In-memory session store: token -> user id. A single-instance local Docker
# MVP doesn't need a persistent session store; restarting the container
# simply logs everyone out.
SESSIONS: dict[str, int] = {}


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = user_id
    return token


def destroy_session(token: str) -> None:
    SESSIONS.pop(token, None)


def get_current_user(request: Request) -> int:
    token = request.cookies.get(config.SESSION_COOKIE_NAME)
    user_id = SESSIONS.get(token) if token else None
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user_id
