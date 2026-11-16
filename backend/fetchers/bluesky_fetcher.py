import logging
from datetime import datetime

import httpx
from langdetect import detect, LangDetectException

from fetchers import insert_item, keyword_filter

logger = logging.getLogger("pulse.bluesky")

BSKY_API = "https://public.api.bsky.app/xrpc"


def _detect_lang(text):
    try:
        lang = detect(text)
        return "fr" if lang == "fr" else "en"
    except LangDetectException:
        return "en"


def _post_lang(record, text):
    """Langue déclarée par l'auteur (champ `langs` du post), sinon détection sur le texte."""
    langs = record.get("langs") or []
    if langs:
        return "fr" if any(str(code).lower().startswith("fr") for code in langs) else "en"
    return _detect_lang(text)


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _clean_handle(url):
    """Normalise handle ou URL Bluesky vers un handle propre."""
    handle = url.strip().lstrip("@")
    # Si c'est une URL bsky.app/profile/xxx
    if "bsky.app/profile/" in handle:
        handle = handle.split("bsky.app/profile/")[-1].strip("/").split("/")[0]
    return handle


def fetch_bluesky(source, db):
    from models import Item

    handle = _clean_handle(source.url)
    if not handle:
        return 0, "Handle Bluesky invalide"

    try:
        resp = httpx.get(
            f"{BSKY_API}/app.bsky.feed.getAuthorFeed",
            # Posts et reposts du compte, sans ses réponses à d'autres fils
            params={"actor": handle, "limit": 30, "filter": "posts_no_replies"},
            timeout=10,
            headers={"User-Agent": "Pulse/1.0"},
        )
        if resp.status_code != 200:
            try:
                message = resp.json().get("message")
            except ValueError:
                message = None
            return 0, f"HTTP {resp.status_code} pour {handle}" + (f" : {message}" if message else "")

        keep = keyword_filter(source)
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

            if not keep(text):
                continue

            lang = _post_lang(record, text)
            if source.lang_filter != "all" and lang != source.lang_filter:
                continue

            # Pour un repost, l'auteur et le lien sont ceux du post d'origine
            author_obj = post.get("author", {})
            author_handle = author_obj.get("handle") or handle
            author = author_obj.get("displayName") or author_handle

            published_at = (
                _parse_date(record.get("createdAt"))
                or _parse_date(post.get("indexedAt"))
                or datetime.utcnow()
            )

            post_rkey = external_id.split("/")[-1]
            url = f"https://bsky.app/profile/{author_handle}/post/{post_rkey}"

            if insert_item(
                db,
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
            ):
                count += 1

        db.commit()
        return count, None

    except Exception as e:
        db.rollback()
        logger.error(f"fetch_bluesky error for {handle}: {e}")
        return 0, str(e)
