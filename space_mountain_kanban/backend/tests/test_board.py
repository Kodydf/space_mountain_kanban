from fastapi.testclient import TestClient

from app.db import get_connection


def test_get_board_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/board")
    assert response.status_code == 401


def test_get_board_returns_seeded_data(logged_in_client: TestClient) -> None:
    response = logged_in_client.get("/api/board")
    assert response.status_code == 200
    body = response.json()
    assert [c["id"] for c in body["columns"]] == ["col-1", "col-2", "col-3", "col-4", "col-5"]
    assert len(body["cards"]) == 8


def test_add_card_appends_to_end_of_column(logged_in_client: TestClient) -> None:
    response = logged_in_client.post(
        "/api/board/cards",
        json={"columnId": "col-3", "title": "New task", "details": "desc", "dueDate": "2026-12-01"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "New task"
    assert body["details"] == "desc"
    assert body["dueDate"] == "2026-12-01"
    assert body["columnId"] == "col-3"

    board = logged_in_client.get("/api/board").json()
    col3_cards = [c for c in board["cards"] if c["columnId"] == "col-3"]
    assert col3_cards[-1]["id"] == body["id"]


def test_update_card_only_changes_provided_fields(logged_in_client: TestClient) -> None:
    response = logged_in_client.patch("/api/board/cards/card-1", json={"title": "Renamed"})
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Renamed"
    assert body["details"] == "Sketch the first-run experience for new users."
    assert body["dueDate"] == "2026-09-25"


def test_update_card_can_clear_due_date(logged_in_client: TestClient) -> None:
    response = logged_in_client.patch("/api/board/cards/card-1", json={"dueDate": None})
    assert response.status_code == 200
    assert response.json()["dueDate"] is None


def test_update_nonexistent_card_returns_404(logged_in_client: TestClient) -> None:
    response = logged_in_client.patch("/api/board/cards/does-not-exist", json={"title": "x"})
    assert response.status_code == 404


def test_delete_card_removes_only_that_card(logged_in_client: TestClient) -> None:
    response = logged_in_client.delete("/api/board/cards/card-2")
    assert response.status_code == 204

    board = logged_in_client.get("/api/board").json()
    ids = [c["id"] for c in board["cards"]]
    assert "card-2" not in ids
    assert len(ids) == 7
    assert "card-1" in ids


def test_rename_column(logged_in_client: TestClient) -> None:
    response = logged_in_client.patch("/api/board/columns/col-1", json={"title": "Backlog"})
    assert response.status_code == 200
    assert response.json() == {"id": "col-1", "title": "Backlog"}

    board = logged_in_client.get("/api/board").json()
    column = next(c for c in board["columns"] if c["id"] == "col-1")
    assert column["title"] == "Backlog"


def test_move_card_to_a_different_column(logged_in_client: TestClient) -> None:
    response = logged_in_client.post("/api/board/cards/card-1/move", json={"toColumnId": "col-5", "toIndex": 0})
    assert response.status_code == 204

    board = logged_in_client.get("/api/board").json()
    card = next(c for c in board["cards"] if c["id"] == "card-1")
    assert card["columnId"] == "col-5"
    col5_cards = [c for c in board["cards"] if c["columnId"] == "col-5"]
    assert col5_cards[0]["id"] == "card-1"


def test_move_card_reorders_within_the_same_column(logged_in_client: TestClient) -> None:
    board = logged_in_client.get("/api/board").json()
    col1_ids = [c["id"] for c in board["cards"] if c["columnId"] == "col-1"]
    assert col1_ids == ["card-1", "card-2"]

    response = logged_in_client.post("/api/board/cards/card-2/move", json={"toColumnId": "col-1", "toIndex": 0})
    assert response.status_code == 204

    board2 = logged_in_client.get("/api/board").json()
    col1_ids2 = [c["id"] for c in board2["cards"] if c["columnId"] == "col-1"]
    assert col1_ids2 == ["card-2", "card-1"]


def test_data_persists_across_a_separate_connection(logged_in_client: TestClient) -> None:
    response = logged_in_client.post(
        "/api/board/cards", json={"columnId": "col-1", "title": "Persisted card", "details": ""}
    )
    card_id = response.json()["id"]

    conn = get_connection()
    try:
        row = conn.execute("SELECT title FROM cards WHERE id = ?", (card_id,)).fetchone()
    finally:
        conn.close()

    assert row is not None
    assert row["title"] == "Persisted card"
