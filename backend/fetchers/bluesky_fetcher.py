import logging
from datetime import datetime

import httpx
from langdetect import detect, LangDetectException

logger = logging.getLogger("pulse.bluesky")

BSKY_API = "https://public.api.bsky.app/xrpc"


def _detect_lang(text):
    try:
        lang = detect(text)
        return "fr" if lang == "fr" else "en"
    except LangDetectException:
        return "en"


def _clean_handle(url):
    """Normalise handle ou URL Bluesky vers un handle propre."""
    handle = url.strip().lstrip("@")
    # Si c'est une URL bsky.app/profile/xxx
    if "bsky.app/profile/" in handle:
        handle = handle.split("bsky.app/profile/")[-1].strip("/")
    return handle


def fetch_bluesky(source, db):
    from models import Item

    handle = _clean_handle(source.url)
    if not handle:
        return 0, "Handle Bluesky invalide"

    try:
        resp = httpx.get(
            f"{BSKY_API}/app.bsky.feed.getAuthorFeed",
            params={"actor": handle, "limit": 30},
            timeout=10,
            headers={"User-Agent": "Pulse/1.0"},
        )
        if resp.status_code != 200:
            return 0, f"HTTP {resp.status_code} pour {handle}"

        feed = resp.json().get("feed", [])
        count = 0

        for entry in feed:
            post = entry.get("post", {})
            record = post.get("record", {})
            text = record.get("text", "").strip()
            if not text:
                continue

            external_id = post.get("uri", "")
            if not external_id:
                continue

            existing = db.query(Item).filter(
                Item.source_id == source.id,
                Item.external_id == external_id,
            ).first()
            if existing:
                continue

            lang = _detect_lang(text)
            if source.lang_filter != "all" and lang != source.lang_filter:
                continue

            author_obj = post.get("author", {})
            author = author_obj.get("displayName") or author_obj.get("handle", handle)

            indexed_at = post.get("indexedAt") or record.get("createdAt")
            published_at = None
            if indexed_at:
                try:
                    published_at = datetime.fromisoformat(indexed_at.replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    pass
            if not published_at:
                published_at = datetime.utcnow()

            # URL du post
            post_rkey = external_id.split("/")[-1]
            url = f"https://bsky.app/profile/{handle}/post/{post_rkey}"

            item = Item(
                source_id=source.id,
                tab=source.tab,
                type="bluesky",
                title=text[:140] + ("…" if len(text) > 140 else ""),
                summary=text[:500] if len(text) > 140 else None,
                content=text,  # le texte complet est le contenu natif
                url=url,
                author=author,
                lang=lang,
                published_at=published_at,
                fetched_at=datetime.utcnow(),
                external_id=external_id,
            )
            db.add(item)
            count += 1

        db.commit()
        return count, None

    except Exception as e:
        db.rollback()
        logger.error(f"fetch_bluesky error for {handle}: {e}")
        return 0, str(e)
