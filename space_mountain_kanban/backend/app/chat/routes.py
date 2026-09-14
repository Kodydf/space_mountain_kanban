from datetime import date

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError

from app import config
from app.auth.session import get_current_user
from app.board import repository
from app.board.repository import NotFoundError
from app.chat.openrouter import chat_completion
from app.chat.schema import (
    ASSISTANT_RESPONSE_SCHEMA,
    Action,
    AddCardAction,
    AssistantResponse,
    DeleteCardAction,
    MoveCardAction,
    UpdateCardAction,
    build_system_prompt,
)
from app.db import get_connection

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _apply_action(conn, user_id: int, action: Action) -> None:
    if isinstance(action, AddCardAction):
        # A new card has no "leave unchanged" state, so treat "" the same as
        # null — the model sometimes sends "" rather than null for "no date".
        repository.add_card(conn, user_id, action.columnId, action.title, action.details, action.dueDate or None)
    elif isinstance(action, UpdateCardAction):
        fields: dict[str, str | None] = {}
        if action.title is not None:
            fields["title"] = action.title
        if action.details is not None:
            fields["details"] = action.details
        if action.dueDate is not None:
            fields["dueDate"] = None if action.dueDate == "" else action.dueDate
        repository.update_card(conn, user_id, action.cardId, **fields)
    elif isinstance(action, MoveCardAction):
        # Always append to the end of the target column — move_card clamps
        # any out-of-range index, so a large sentinel does that simply.
        repository.move_card(conn, user_id, action.cardId, action.toColumnId, 10**9)
    elif isinstance(action, DeleteCardAction):
        repository.delete_card(conn, user_id, action.cardId)


@router.post("")
def chat(payload: ChatRequest, user_id: int = Depends(get_current_user)) -> JSONResponse:
    if not config.OPENROUTER_API_KEY:
        return JSONResponse(status_code=500, content={"error": "Server is missing the OpenRouter API key."})

    conn = get_connection()
    try:
        board = repository.get_board(conn, user_id)
        system_prompt = build_system_prompt(board.model_dump(), date.today().isoformat())
        messages = [{"role": "system", "content": system_prompt}] + [
            {"role": m.role, "content": m.content} for m in payload.messages
        ]

        try:
            data = chat_completion(messages, response_format=ASSISTANT_RESPONSE_SCHEMA)
        except httpx.HTTPStatusError as e:
            return JSONResponse(
                status_code=502, content={"error": f"OpenRouter error ({e.response.status_code}): {e.response.text}"}
            )
        except httpx.HTTPError as e:
            return JSONResponse(status_code=502, content={"error": f"Could not reach OpenRouter: {e}"})

        choices = data.get("choices") or []
        content = choices[0]["message"]["content"] if choices else None
        if not content:
            return JSONResponse(status_code=502, content={"error": "The assistant returned no response."})

        try:
            parsed = AssistantResponse.model_validate_json(content)
        except ValidationError as e:
            return JSONResponse(status_code=502, content={"error": f"Invalid response from the assistant: {e}"})

        try:
            for action in parsed.actions:
                _apply_action(conn, user_id, action)
        except NotFoundError as e:
            return JSONResponse(status_code=502, content={"error": f"The assistant referenced something that doesn't exist: {e}"})

        fresh_board = repository.get_board(conn, user_id)
        return JSONResponse(status_code=200, content={"reply": parsed.reply, "board": fresh_board.model_dump()})
    finally:
        conn.close()
