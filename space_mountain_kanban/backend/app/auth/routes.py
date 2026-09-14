from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from app import config
from app.auth.session import create_session, destroy_session, get_current_user
from app.db import get_username, verify_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

ONE_WEEK_SECONDS = 60 * 60 * 24 * 7


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    username: str


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, response: Response) -> UserOut:
    user_id = verify_user(payload.username, payload.password)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    token = create_session(user_id)
    response.set_cookie(
        config.SESSION_COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        max_age=ONE_WEEK_SECONDS,
    )
    return UserOut(username=payload.username)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response) -> None:
    token = request.cookies.get(config.SESSION_COOKIE_NAME)
    if token:
        destroy_session(token)
    response.delete_cookie(config.SESSION_COOKIE_NAME)


@router.get("/me", response_model=UserOut)
def me(user_id: int = Depends(get_current_user)) -> UserOut:
    username = get_username(user_id)
    return UserOut(username=username)
