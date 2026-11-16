import os
import time

from auth import create_token, verify_token

PROTECTED = [
    ("get", "/api/items?tab=tech"),
    ("get", "/api/items/saved"),
    ("patch", "/api/items/1/read"),
    ("patch", "/api/items/1/save"),
    ("get", "/api/sources"),
    ("get", "/api/sources/1"),
    ("post", "/api/sources"),
    ("patch", "/api/sources/1"),
    ("delete", "/api/sources/1"),
    ("patch", "/api/sources/1/toggle"),
    ("post", "/api/sources/1/fetch"),
]


def test_token_round_trip():
    token, expires = create_token()
    assert verify_token(token)
    assert expires - time.time() > 29 * 86400


def test_token_expires():
    token, expires = create_token(now=1_000_000)
    assert verify_token(token, now=expires - 1)
    assert not verify_token(token, now=expires)


def test_token_tampered_or_garbage_rejected():
    token, _ = create_token()
    payload, sig = token.split(".")
    assert not verify_token(payload + "." + sig[:-2] + "AA")
    assert not verify_token("abc")
    assert not verify_token("")
    forged_payload = "eyJpYXQiOjAsImV4cCI6OTk5OTk5OTk5OX0"  # exp en l'an 2286
    assert not verify_token(forged_payload + "." + sig)


def test_login_returns_signed_token_not_the_secret(client, token):
    assert token != os.environ["PULSE_SECRET_KEY"]
    assert verify_token(token)


def test_wrong_password_401(client):
    assert client.post("/api/auth/login", json={"password": "faux"}).status_code == 401


def test_every_route_requires_a_token(client):
    for method, url in PROTECTED:
        r = getattr(client, method)(url)
        assert r.status_code == 401, (method, url, r.status_code)


def test_old_static_secret_no_longer_works(client):
    headers = {"Authorization": f"Bearer {os.environ['PULSE_SECRET_KEY']}"}
    assert client.get("/api/sources", headers=headers).status_code == 401


def test_valid_token_opens_routes(client, token):
    r = client.get("/api/sources", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_open_routes(client, app):
    assert client.get("/api/health").status_code == 200
    open_paths = {
        r.path for r in app.routes
        if getattr(r, "path", "").startswith("/api") and not any(
            getattr(d.call, "__name__", "") == "require_auth" for d in getattr(r, "dependant", None).dependencies
        ) if hasattr(r, "dependant")
    }
    assert open_paths == {"/api/auth/login", "/api/health"}, open_paths
