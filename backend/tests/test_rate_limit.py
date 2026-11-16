import pytest

from tests.conftest import TEST_PASSWORD
import routers.auth as auth_router


@pytest.fixture(autouse=True)
def fast_and_clean(monkeypatch):
    monkeypatch.setattr(auth_router, "FAILURE_DELAY_SECONDS", 0)
    auth_router.reset_limits()
    yield
    auth_router.reset_limits()


def _login(client, password, ip="203.0.113.7"):
    return client.post("/api/auth/login", json={"password": password}, headers={"CF-Connecting-IP": ip})


def test_blocks_after_five_failures_per_ip(client):
    for _ in range(5):
        assert _login(client, "faux").status_code == 401
    r = _login(client, TEST_PASSWORD)  # même le bon mot de passe attend la fin du blocage
    assert r.status_code == 429
    assert 0 < int(r.headers["Retry-After"]) <= 15 * 60 + 1
    assert _login(client, TEST_PASSWORD, ip="198.51.100.1").status_code == 200  # autre IP : non bloquée


def test_success_resets_ip_counter(client):
    for _ in range(4):
        _login(client, "faux")
    assert _login(client, TEST_PASSWORD).status_code == 200
    for _ in range(4):
        assert _login(client, "faux").status_code == 401


def test_global_cap_against_rotating_ips(client):
    for i in range(auth_router.MAX_FAILURES_GLOBAL):
        _login(client, "faux", ip=f"10.0.{i // 250}.{i % 250}")
    assert _login(client, "faux", ip="192.0.2.99").status_code == 429


def test_window_expires(client, monkeypatch):
    now = [1_000_000.0]
    monkeypatch.setattr(auth_router.time, "time", lambda: now[0])
    for _ in range(5):
        _login(client, "faux")
    assert _login(client, TEST_PASSWORD).status_code == 429
    now[0] += auth_router.WINDOW_SECONDS + 1
    assert _login(client, TEST_PASSWORD).status_code == 200


def test_rejects_non_string_password(client):
    r = client.post("/api/auth/login", json={"password": 123})
    assert r.status_code == 422
