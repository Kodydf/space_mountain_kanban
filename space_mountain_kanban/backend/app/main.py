from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.routes import router as auth_router
from app.board.routes import router as board_router
from app.chat.routes import router as chat_router
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Space Mountain Task Tracker", lifespan=lifespan)

app.include_router(auth_router)
app.include_router(board_router)
app.include_router(chat_router)


@app.get("/api/hello")
def hello() -> dict[str, str]:
    return {"message": "Hello from the backend"}


# Static files are mounted last so that /api/* routes above always take
# priority over the catch-all static file serving.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
