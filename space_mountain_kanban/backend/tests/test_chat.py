import json

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import app.chat.routes as chat_routes
from app import config
from app.chat.openrouter import chat_completion
from app.chat.schema import (
    AddCardAction,
    AssistantResponse,
    DeleteCardAction,
    MoveCardAction,
    UpdateCardAction,
)


def _fake_openrouter_response(structured_content: dict) -> dict:
    return {"choices": [{"message": {"content": json.dumps(structured_content)}}]}


# --- Part 8 checks: basic OpenRouter connectivity and Structured Outputs ---


@pytest.mark.live
def test_basic_completion_answers_2_plus_2() -> None:
    data = chat_completion([{"role": "user", "content": "what is 2+2, reply with just the digit"}])
    content = data["choices"][0]["message"]["content"].strip()
    assert content == "4"


@pytest.mark.live
def test_structured_outputs_returns_valid_json_matching_the_schema() -> None:
    schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "greeting",
            "strict": True,
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "required": ["greeting", "name", "age"],
                "properties": {
                    "greeting": {"type": "string"},
                    "name": {"type": "string"},
                    "age": {"type": "integer"},
                },
            },
        },
    }
    data = chat_completion(
        [{"role": "user", "content": "Say hello to Alice who is 30 years old."}],
        response_format=schema,
    )
    parsed = json.loads(data["choices"][0]["message"]["content"])
    assert parsed["name"] == "Alice"
    assert parsed["age"] == 30


# --- Schema validation (pure, no client/network) ---


def test_assistant_response_parses_each_action_type() -> None:
    payload = {
        "reply": "ok",
        "actions": [
            {"operation": "add_card", "columnId": "col-1", "title": "T", "details": "", "dueDate": None},
            {"operation": "update_card", "cardId": "c1", "title": None, "details": None, "dueDate": ""},
            {"operation": "move_card", "cardId": "c1", "toColumnId": "col-2"},
            {"operation": "delete_card", "cardId": "c1"},
        ],
    }
    parsed = AssistantResponse.model_validate(payload)
    assert len(parsed.actions) == 4
    assert isinstance(parsed.actions[0], AddCardAction)
    assert isinstance(parsed.actions[1], UpdateCardAction)
    assert isinstance(parsed.actions[2], MoveCardAction)
    assert isinstance(parsed.actions[3], DeleteCardAction)


def test_assistant_response_rejects_an_unknown_operation() -> None:
    with pytest.raises(ValidationError):
        AssistantResponse.model_validate({"reply": "x", "actions": [{"operation": "nuke_board"}]})


# --- Route behavior with OpenRouter mocked (no network/cost) ---


def test_chat_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 401


def test_chat_without_api_key_returns_a_clean_error(logged_in_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(config, "OPENROUTER_API_KEY", None)
    response = logged_in_client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert response.status_code == 500
    assert "error" in response.json()


def test_chat_applies_an_add_card_action(logged_in_client: TestClient, monkeypatch) -> None:
    fake = _fake_openrouter_response(
        {
            "reply": "Added the card.",
            "actions": [
                {"operation": "add_card", "columnId": "col-1", "title": "AI added card", "details": "", "dueDate": None}
            ],
        }
    )
    monkeypatch.setattr(chat_routes, "chat_completion", lambda *a, **k: fake)

    response = logged_in_client.post("/api/chat", json={"messages": [{"role": "user", "content": "add a card"}]})

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Added the card."
    assert "AI added card" in [c["title"] for c in body["board"]["cards"]]


def test_chat_add_card_treats_empty_string_due_date_as_no_due_date(
    logged_in_client: TestClient, monkeypatch
) -> None:
    # Regression test: live testing showed the model sometimes sends ""
    # rather than null for "no due date" on a new card, which must not be
    # stored as the literal empty string.
    fake = _fake_openrouter_response(
        {
            "reply": "Added it.",
            "actions": [
                {"operation": "add_card", "columnId": "col-1", "title": "No date card", "details": "", "dueDate": ""}
            ],
        }
    )
    monkeypatch.setattr(chat_routes, "chat_completion", lambda *a, **k: fake)

    response = logged_in_client.post("/api/chat", json={"messages": [{"role": "user", "content": "add a card"}]})

    assert response.status_code == 200
    card = next(c for c in response.json()["board"]["cards"] if c["title"] == "No date card")
    assert card["dueDate"] is None


def test_chat_with_no_actions_does_not_mutate_the_board(logged_in_client: TestClient, monkeypatch) -> None:
    fake = _fake_openrouter_response({"reply": "Which card do you mean?", "actions": []})
    monkeypatch.setattr(chat_routes, "chat_completion", lambda *a, **k: fake)

    before = logged_in_client.get("/api/board").json()
    response = logged_in_client.post(
        "/api/chat", json={"messages": [{"role": "user", "content": "update the card"}]}
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "Which card do you mean?"
    after = logged_in_client.get("/api/board").json()
    assert before == after


def test_chat_applies_multiple_actions_in_one_turn(logged_in_client: TestClient, monkeypatch) -> None:
    fake = _fake_openrouter_response(
        {
            "reply": "Added three cards.",
            "actions": [
                {"operation": "add_card", "columnId": "col-1", "title": "Card A", "details": "", "dueDate": None},
                {"operation": "add_card", "columnId": "col-1", "title": "Card B", "details": "", "dueDate": None},
                {"operation": "add_card", "columnId": "col-1", "title": "Card C", "details": "", "dueDate": None},
            ],
        }
    )
    monkeypatch.setattr(chat_routes, "chat_completion", lambda *a, **k: fake)

    response = logged_in_client.post(
        "/api/chat", json={"messages": [{"role": "user", "content": "add three cards"}]}
    )

    assert response.status_code == 200
    titles = {c["title"] for c in response.json()["board"]["cards"]}
    assert {"Card A", "Card B", "Card C"}.issubset(titles)


def test_chat_update_card_dueDate_empty_string_clears_it(logged_in_client: TestClient, monkeypatch) -> None:
    fake = _fake_openrouter_response(
        {
            "reply": "Cleared the due date.",
            "actions": [{"operation": "update_card", "cardId": "card-1", "title": None, "details": None, "dueDate": ""}],
        }
    )
    monkeypatch.setattr(chat_routes, "chat_completion", lambda *a, **k: fake)

    response = logged_in_client.post("/api/chat", json={"messages": [{"role": "user", "content": "clear due date"}]})

    assert response.status_code == 200
    card = next(c for c in response.json()["board"]["cards"] if c["id"] == "card-1")
    assert card["dueDate"] is None


def test_chat_action_referencing_a_nonexistent_card_returns_an_error(
    logged_in_client: TestClient, monkeypatch
) -> None:
    fake = _fake_openrouter_response(
        {"reply": "Deleted it.", "actions": [{"operation": "delete_card", "cardId": "does-not-exist"}]}
    )
    monkeypatch.setattr(chat_routes, "chat_completion", lambda *a, **k: fake)

    response = logged_in_client.post("/api/chat", json={"messages": [{"role": "user", "content": "delete it"}]})

    assert response.status_code == 502
    assert "error" in response.json()


# --- One true, real, end-to-end live test ---


@pytest.mark.live
def test_chat_live_end_to_end_add_card(logged_in_client: TestClient) -> None:
    response = logged_in_client.post(
        "/api/chat",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": "Add a card to To Do titled Live E2E Backend Test with no details and no due date.",
                }
            ]
        },
    )
    assert response.status_code == 200
    titles = [c["title"] for c in response.json()["board"]["cards"]]
    assert "Live E2E Backend Test" in titles
