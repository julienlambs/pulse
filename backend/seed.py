import json
import logging

logger = logging.getLogger("pulse.seed")

INITIAL_SOURCES = [
    # --- ai_product ---
    {"name": "L'IA du Capitaine", "type": "rss", "url": "https://liaidublog.substack.com/feed", "tab": "ai_product", "lang_filter": "fr"},
    {"name": "Génération IA", "type": "rss", "url": "https://generationia.flint.media/feed", "tab": "ai_product", "lang_filter": "fr"},
    {"name": "ActuIA", "type": "rss", "url": "https://www.actuia.com/feed/", "tab": "ai_product", "lang_filter": "fr"},
    {"name": "TLDR AI", "type": "rss", "url": "https://tldr.tech/ai/rss", "tab": "ai_product", "lang_filter": "en"},
    {"name": "UX Collective", "type": "rss", "url": "https://uxdesign.cc/feed", "tab": "ai_product", "lang_filter": "en", "keywords": json.dumps(["AI", "product", "design"])},
    # --- ux_product ---
    {"name": "Lenny's Newsletter", "type": "rss", "url": "https://www.lennysnewsletter.com/feed", "tab": "ux_product", "lang_filter": "en"},
    {"name": "Product Talk", "type": "rss", "url": "https://www.producttalk.org/feed/", "tab": "ux_product", "lang_filter": "en"},
    {"name": "SVPG", "type": "rss", "url": "https://www.svpg.com/feed/", "tab": "ux_product", "lang_filter": "en"},
    # --- tech ---
    {"name": "Blog du Modérateur", "type": "rss", "url": "https://www.blogdumoderateur.com/feed/", "tab": "tech", "lang_filter": "fr"},
    {"name": "Cafétech", "type": "rss", "url": "https://cafetech.fr/feed/", "tab": "tech", "lang_filter": "fr"},
    {"name": "The Verge", "type": "rss", "url": "https://www.theverge.com/rss/index.xml", "tab": "tech", "lang_filter": "en"},
    {"name": "Hacker News", "type": "rss", "url": "https://news.ycombinator.com/rss", "tab": "tech", "lang_filter": "en"},
    # --- hardware ---
    {"name": "Frandroid", "type": "rss", "url": "https://www.frandroid.com/feed", "tab": "hardware", "lang_filter": "fr"},
    {"name": "Les Numériques", "type": "rss", "url": "https://www.lesnumeriques.com/rss.xml", "tab": "hardware", "lang_filter": "fr"},
    # --- video ---
    {"name": "Micode", "type": "youtube", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCqiMoXKBFgMQphiX1QJqGnQ", "tab": "video", "lang_filter": "fr"},
    {"name": "e-penser 2.0", "type": "youtube", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCcziTK2NKeWtWQ6kB5tmQ8Q", "tab": "video", "lang_filter": "fr"},
    {"name": "Basti UI", "type": "youtube", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCEq2A3QiEi8igc3O7ohGHaw", "tab": "video", "lang_filter": "fr"},
]


def seed_sources():
    from database import SessionLocal
    from models import Source

    db = SessionLocal()
    try:
        if db.query(Source).count() > 0:
            return
        for data in INITIAL_SOURCES:
            db.add(Source(**data))
        db.commit()
        logger.info(f"Seeded {len(INITIAL_SOURCES)} sources")
    finally:
        db.close()
