import logging
from datetime import datetime

import feedparser
import httpx

from fetchers import insert_item

logger = logging.getLogger("pulse.youtube")


def fetch_youtube(source, db):
    from models import Item

    try:
        try:
            resp = httpx.get(
                source.url,
                timeout=10,
                follow_redirects=True,
                headers={"User-Agent": "Pulse/1.0 RSS Aggregator"},
            )
            feed = feedparser.parse(resp.content)
        except Exception:
            feed = feedparser.parse(source.url)

        if feed.bozo and not feed.entries:
            return 0, f"Feed parse error: {feed.bozo_exception}"

        count = 0
        for entry in feed.entries:
            external_id = getattr(entry, "yt_videoid", None) or entry.get("id", "")
            if not external_id:
                continue

            existing = db.query(Item).filter(
                Item.source_id == source.id,
                Item.external_id == external_id,
            ).first()
            if existing:
                continue

            title = getattr(entry, "title", "").strip()
            if not title:
                continue

            thumbnail_url = None
            if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                thumbnail_url = entry.media_thumbnail[0].get("url")

            published_at = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    published_at = datetime(*entry.published_parsed[:6])
                except Exception:
                    pass
            if not published_at:
                published_at = datetime.utcnow()

            lang = source.lang_filter if source.lang_filter != "all" else "fr"

            if insert_item(
                db,
                source_id=source.id,
                tab=source.tab,
                type="youtube",
                title=title,
                summary=getattr(entry, "summary", None),
                content=None,  # YouTube s'ouvre directement, pas de lecteur intégré
                url=entry.get("link", ""),
                thumbnail_url=thumbnail_url,
                author=source.name,
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
        logger.error(f"fetch_youtube error for {source.name}: {e}")
        return 0, str(e)
