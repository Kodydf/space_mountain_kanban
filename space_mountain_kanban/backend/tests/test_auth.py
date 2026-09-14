from fastapi.testclient import TestClient


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_login_success_sets_cookie_and_allows_me(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert response.status_code == 200
    assert response.json() == {"username": "user"}
    assert "session_id" in response.cookies

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 200
    assert me_response.json() == {"username": "user"}


def test_login_failure_returns_401_and_sets_no_cookie(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"username": "user", "password": "wrong"})
    assert response.status_code == 401
    assert "session_id" not in response.cookies


def test_logout_invalidates_the_session(client: TestClient) -> None:
    client.post("/api/auth/login", json={"username": "user", "password": "password"})

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 204

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
