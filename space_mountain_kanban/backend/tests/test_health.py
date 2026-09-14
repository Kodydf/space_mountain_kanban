from fastapi.testclient import TestClient


def test_root_serves_the_kanban_board(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "Space Mountain Task Tracker" in response.text


def test_hello_api(client: TestClient) -> None:
    response = client.get("/api/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from the backend"}
