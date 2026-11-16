"""Configuration commune : base SQLite temporaire et secrets de test, posés avant tout import de l'app."""
import os
import sys
import tempfile
from pathlib import Path

import bcrypt
import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

TEST_PASSWORD = "mot-de-passe-de-test"
_tmp = tempfile.mkdtemp(prefix="pulse-tests-")
os.environ["DATABASE_URL"] = str(Path(_tmp) / "test.db")
os.environ["PULSE_SECRET_KEY"] = "k" * 64
os.environ["PULSE_PASSWORD_HASH"] = bcrypt.hashpw(TEST_PASSWORD.encode(), bcrypt.gensalt(4)).decode()


@pytest.fixture(scope="session")
def app():
    import models  # noqa: F401
    from database import init_db
    from main import app as fastapi_app
    init_db()
    return fastapi_app


@pytest.fixture()
def client(app):
    from fastapi.testclient import TestClient
    return TestClient(app)  # sans `with` : pas de lifespan, donc ni planificateur ni collecte


@pytest.fixture()
def token(client):
    return client.post("/api/auth/login", json={"password": TEST_PASSWORD}).json()["token"]
