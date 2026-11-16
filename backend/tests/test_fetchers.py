from types import SimpleNamespace

from fetchers import REDDIT_RETIRED, run_fetcher


def test_reddit_source_reports_retirement_without_network():
    assert run_fetcher(SimpleNamespace(type="reddit"), db=None) == (0, REDDIT_RETIRED)


def test_unknown_type():
    count, error = run_fetcher(SimpleNamespace(type="mastodon"), db=None)
    assert count == 0 and "inconnu" in error


def test_seed_has_no_reddit():
    from seed import INITIAL_SOURCES
    assert INITIAL_SOURCES and all(s["type"] != "reddit" for s in INITIAL_SOURCES)


# --- Bluesky (réponse de l'API simulée, pas de réseau) ---

import json  # noqa: E402

import httpx  # noqa: E402
import pytest  # noqa: E402

from fetchers import keyword_filter  # noqa: E402


def _post(uri, text, author="alice.bsky.social", langs=None, repost=False):
    entry = {"post": {
        "uri": uri,
        "author": {"handle": author, "displayName": author.split(".")[0].title()},
        "record": {"text": text, "createdAt": "2026-11-15T10:00:00.000Z", **({"langs": langs} if langs else {})},
        "indexedAt": "2026-11-15T10:00:01.000Z",
    }}
    if repost:
        entry["reason"] = {"$type": "app.bsky.feed.defs#reasonRepost"}
    return entry


@pytest.fixture()
def bluesky_source(app):
    from database import SessionLocal
    from models import Source
    db = SessionLocal()
    source = Source(name="bsky", type="bluesky", url="https://bsky.app/profile/alice.bsky.social",
                    tab="tech", lang_filter="all")
    db.add(source)
    db.commit()
    yield db, source
    db.close()


def _fake_feed(monkeypatch, feed, status=200):
    calls = []

    def fake_get(url, params=None, **kwargs):
        calls.append(params)
        return httpx.Response(status, json={"feed": feed} if status == 200 else {"message": "Profile not found"},
                              request=httpx.Request("GET", url))
    monkeypatch.setattr("fetchers.bluesky_fetcher.httpx.get", fake_get)
    return calls


def test_bluesky_repost_links_to_original_author(monkeypatch, bluesky_source):
    from fetchers.bluesky_fetcher import fetch_bluesky
    from models import Item
    db, source = bluesky_source
    calls = _fake_feed(monkeypatch, [
        _post("at://did:plc:alice/app.bsky.feed.post/aaa", "Mon post sur le design produit", langs=["fr"]),
        _post("at://did:plc:bob/app.bsky.feed.post/bbb", "A repost about product design", author="bob.dev",
              langs=["en"], repost=True),
    ])
    assert fetch_bluesky(source, db) == (2, None)
    assert calls[0]["actor"] == "alice.bsky.social" and calls[0]["filter"] == "posts_no_replies"
    items = {i.external_id.split("/")[-1]: i for i in db.query(Item).filter(Item.source_id == source.id)}
    assert items["aaa"].url == "https://bsky.app/profile/alice.bsky.social/post/aaa"
    assert items["bbb"].url == "https://bsky.app/profile/bob.dev/post/bbb"
    assert items["aaa"].lang == "fr" and items["bbb"].lang == "en"
    assert fetch_bluesky(source, db) == (0, None)  # deuxième passage : rien de nouveau


def test_bluesky_applies_keywords(monkeypatch, bluesky_source):
    from fetchers.bluesky_fetcher import fetch_bluesky
    db, source = bluesky_source
    source.keywords = json.dumps(["design"])
    source.exclude_keywords = json.dumps(["crypto"])
    db.commit()
    _fake_feed(monkeypatch, [
        _post("at://x/app.bsky.feed.post/1", "Design systems are great", langs=["en"]),
        _post("at://x/app.bsky.feed.post/2", "Lunch today", langs=["en"]),
        _post("at://x/app.bsky.feed.post/3", "Design for crypto apps", langs=["en"]),
    ])
    assert fetch_bluesky(source, db) == (1, None)


def test_bluesky_reports_api_message(monkeypatch, bluesky_source):
    from fetchers.bluesky_fetcher import fetch_bluesky
    db, source = bluesky_source
    _fake_feed(monkeypatch, [], status=400)
    count, error = fetch_bluesky(source, db)
    assert count == 0 and "Profile not found" in error


def test_keyword_filter():
    from types import SimpleNamespace
    keep = keyword_filter(SimpleNamespace(keywords=json.dumps(["IA"]), exclude_keywords=json.dumps(["promo"])))
    assert keep("L'IA en produit") and not keep("Rien à voir") and not keep("IA promo")
    assert keyword_filter(SimpleNamespace(keywords=None, exclude_keywords="pas du json"))("tout passe")


def test_delete_source_removes_its_unsaved_items(client, token):
    from datetime import datetime
    from database import SessionLocal
    from fetchers import insert_item
    from models import Item
    headers = {"Authorization": f"Bearer {token}"}
    source_id = client.post("/api/sources", json={"name": "tmp", "type": "rss", "url": "u", "tab": "tech"},
                            headers=headers).json()["id"]
    db = SessionLocal()
    for ext, saved in (("a", False), ("b", True)):
        insert_item(db, source_id=source_id, tab="tech", type="rss", title="t", url="u", external_id=ext,
                    is_saved=saved, fetched_at=datetime.utcnow())
    db.commit()
    assert client.delete(f"/api/sources/{source_id}", headers=headers).status_code == 200
    left = [i.external_id for i in db.query(Item).filter(Item.source_id == source_id)]
    db.close()
    assert left == ["b"]  # le sauvegardé reste
