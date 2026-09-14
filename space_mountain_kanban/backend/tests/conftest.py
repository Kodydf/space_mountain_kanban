import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch) -> TestClient:
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "test.db")
    with TestClient(app) as c:
        yield c


@pytest.fixture
def logged_in_client(client: TestClient) -> TestClient:
    response = client.post(
        "/api/auth/login", json={"username": config.SEED_USERNAME, "password": config.SEED_PASSWORD}
    )
    assert response.status_code == 200
    return client
