import json
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

# JSON Schema for OpenRouter's Structured Outputs (response_format), hand-written
# (not derived from the Pydantic models below) to exactly match the shape
# live-verified against openai/gpt-oss-120b before this was built.
ASSISTANT_RESPONSE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "assistant_response",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "required": ["reply", "actions"],
            "properties": {
                "reply": {"type": "string"},
                "actions": {
                    "type": "array",
                    "items": {
                        "anyOf": [
                            {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["operation", "columnId", "title", "details", "dueDate"],
                                "properties": {
                                    "operation": {"const": "add_card"},
                                    "columnId": {"type": "string"},
                                    "title": {"type": "string"},
                                    "details": {"type": "string"},
                                    "dueDate": {"type": ["string", "null"]},
                                },
                            },
                            {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["operation", "cardId", "title", "details", "dueDate"],
                                "properties": {
                                    "operation": {"const": "update_card"},
                                    "cardId": {"type": "string"},
                                    "title": {"type": ["string", "null"]},
                                    "details": {"type": ["string", "null"]},
                                    "dueDate": {"type": ["string", "null"]},
                                },
                            },
                            {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["operation", "cardId", "toColumnId"],
                                "properties": {
                                    "operation": {"const": "move_card"},
                                    "cardId": {"type": "string"},
                                    "toColumnId": {"type": "string"},
                                },
                            },
                            {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["operation", "cardId"],
                                "properties": {
                                    "operation": {"const": "delete_card"},
                                    "cardId": {"type": "string"},
                                },
                            },
                        ]
                    },
                },
            },
        },
    },
}


class AddCardAction(BaseModel):
    operation: Literal["add_card"]
    columnId: str
    title: str
    details: str
    dueDate: str | None


class UpdateCardAction(BaseModel):
    operation: Literal["update_card"]
    cardId: str
    title: str | None
    details: str | None
    dueDate: str | None


class MoveCardAction(BaseModel):
    operation: Literal["move_card"]
    cardId: str
    toColumnId: str


class DeleteCardAction(BaseModel):
    operation: Literal["delete_card"]
    cardId: str


Action = Annotated[
    Union[AddCardAction, UpdateCardAction, MoveCardAction, DeleteCardAction],
    Field(discriminator="operation"),
]


class AssistantResponse(BaseModel):
    reply: str
    actions: list[Action]


def build_system_prompt(board: dict, today: str) -> str:
    return f"""You are the digital assistant embedded in a Kanban board app called "Space Mountain Task Tracker". You help the user manage their tasks: adding cards, changing a card's description or due date, moving cards between columns, deleting cards, and answering questions about tasks using their descriptions.

Today's date is {today}.

Current board state as JSON (columns and cards, each with its id):
{json.dumps(board)}

Rules:
- Always reference existing cards and columns by the "id" fields from the board state above. Never invent an id.
- If a request is ambiguous (e.g. more than one card could match), ask a short clarifying question in your reply and return an empty actions list — do not guess.
- Use the actions list to make any change to the board. Never claim to have made a change without including a matching action.
- For update_card, use null for title/details/dueDate to leave that field unchanged. For dueDate specifically, use an empty string "" to clear it, or a new date to change it.
- For questions about a task (e.g. "what's card X about", "when is Y due"), answer directly from the board state above with an empty actions list. No action is needed for a question.
- Keep replies brief and friendly."""
