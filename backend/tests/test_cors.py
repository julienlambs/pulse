def _preflight(client, origin):
    return client.options("/api/sources", headers={
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
    })


def test_production_origin_allowed(client):
    r = _preflight(client, "https://pulse.julienlambs.dev")
    assert r.headers.get("access-control-allow-origin") == "https://pulse.julienlambs.dev"
    assert "access-control-allow-credentials" not in r.headers


def test_dev_origin_allowed(client):
    r = _preflight(client, "http://localhost:5173")
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_other_origin_refused(client):
    r = _preflight(client, "https://evil.example")
    assert "access-control-allow-origin" not in r.headers
    r = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in r.headers


def test_docs_disabled(client):
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404
