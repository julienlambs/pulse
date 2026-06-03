import json
import logging
from datetime import datetime
from html.parser import HTMLParser

import feedparser
import httpx
from langdetect import detect, LangDetectException

logger = logging.getLogger("pulse.rss")


class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data):
        self._parts.append(data)

    def get_text(self):
        return " ".join(self._parts).strip()


def _strip_html(html_text):
    if not html_text:
        return ""
    s = _HTMLStripper()
    try:
        s.feed(html_text)
        return s.get_text()
    except Exception:
        import re
        return re.sub(r"<[^>]+>", "", html_text).strip()


def _detect_lang(text):
    try:
        lang = detect(text)
        return "fr" if lang == "fr" else "en"
    except LangDetectException:
        return "en"


def _fetch_full_content(url):
    try:
        from readability import Document
        kwargs = dict(timeout=8, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0 (compatible; Pulse/1.0)"})
        try:
            resp = httpx.get(url, **kwargs)
        except httpx.ConnectError:
            resp = httpx.get(url, verify=False, **kwargs)
        if resp.status_code != 200:
            return None
        doc = Document(resp.text)
        content = doc.summary()
        if not content or len(_strip_html(content)) < 200:
            return None
        return content
    except Exception as e:
        logger.debug(f"Content fetch failed for {url}: {e}")
        return None


def _fetch_feed(url):
    kwargs = dict(timeout=10, follow_redirects=True, headers={"User-Agent": "Pulse/1.0 RSS Aggregator"})
    try:
        resp = httpx.get(url, **kwargs)
    except httpx.ConnectError:
        try:
            resp = httpx.get(url, verify=False, **{k: v for k, v in kwargs.items() if k != 'verify'})
        except Exception:
            return feedparser.parse(url)
    except Exception:
        return feedparser.parse(url)

    if resp.status_code != 200:
        result = feedparser.parse("")
        result["bozo"] = True
        result["bozo_exception"] = Exception(f"HTTP {resp.status_code}")
        return result
    return feedparser.parse(resp.content)


def fetch_rss(source, db):
    from models import Item

    try:
        feed = _fetch_feed(source.url)

        if feed.bozo and not feed.entries:
            return 0, f"Feed parse error: {feed.bozo_exception}"

        keywords = []
        if source.keywords:
            try:
                keywords = json.loads(source.keywords)
            except Exception:
                pass

        exclude_keywords = []
        if source.exclude_keywords:
            try:
                exclude_keywords = json.loads(source.exclude_keywords)
            except Exception:
                pass

        count = 0
        for entry in feed.entries:
            external_id = getattr(entry, "id", None) or entry.get("link", "")
            if not external_id:
                continue

            existing = db.query(Item).filter(
                Item.source_id == source.id,
                Item.external_id == external_id,
            ).first()
            if existing:
                continue

            title = _strip_html(getattr(entry, "title", "")).strip()
            if not title:
                continue

            raw_summary = (
                getattr(entry, "summary", "")
                or getattr(entry, "description", "")
                or ""
            )
            summary = _strip_html(raw_summary)[:600]

            text_lower = (title + " " + summary).lower()

            if keywords:
                if not any(kw.lower() in text_lower for kw in keywords):
                    continue

            if exclude_keywords:
                if any(kw.lower() in text_lower for kw in exclude_keywords):
                    continue

            lang = _detect_lang(title + " " + summary)

            if source.lang_filter != "all" and lang != source.lang_filter:
                continue

            url = entry.get("link", "")
            content = _fetch_full_content(url) if url else None

            published_at = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    published_at = datetime(*entry.published_parsed[:6])
                except Exception:
                    pass
            if not published_at:
                published_at = datetime.utcnow()

            item = Item(
                source_id=source.id,
                tab=source.tab,
                type=source.type,
                title=title,
                summary=summary or None,
                content=content,
                url=url,
                author=getattr(entry, "author", None),
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
        logger.error(f"fetch_rss error for {source.name}: {e}")
        return 0, str(e)
