import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import models  # noqa — enregistre les modèles avant init_db
from database import SessionLocal, init_db
from models import Item, Source

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("pulse")

scheduler = BackgroundScheduler()


def _run_fetcher(source, db):
    if source.type in ("rss", "reddit"):
        from fetchers.rss_fetcher import fetch_rss
        return fetch_rss(source, db)
    elif source.type == "youtube":
        from fetchers.youtube_fetcher import fetch_youtube
        return fetch_youtube(source, db)
    elif source.type == "bluesky":
        from fetchers.bluesky_fetcher import fetch_bluesky
        return fetch_bluesky(source, db)
    return 0, f"Unknown type: {source.type}"


def fetch_all_sources():
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.is_active == True).all()
        logger.info(f"Scheduler: fetching {len(sources)} active sources")
        for source in sources:
            try:
                count, error = _run_fetcher(source, db)
                source.last_fetched_at = datetime.utcnow()
                source.last_fetch_count = count
                source.last_fetch_error = error
                db.commit()
                logger.info(f"  {source.name}: {count} new items")
            except Exception as e:
                logger.error(f"  {source.name}: unhandled error — {e}")
    finally:
        db.close()


def purge_old_items():
    retention = int(os.getenv("RETENTION_DAYS", "30"))
    cutoff = datetime.utcnow() - timedelta(days=retention)
    db = SessionLocal()
    try:
        deleted = db.query(Item).filter(
            Item.published_at < cutoff,
            Item.is_saved == False,
        ).delete()
        db.commit()
        if deleted:
            logger.info(f"Purge: deleted {deleted} old items")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    from seed import seed_sources
    seed_sources()

    interval = int(os.getenv("FETCH_INTERVAL_MINUTES", "60"))
    scheduler.add_job(fetch_all_sources, "interval", minutes=interval, id="fetch_all")
    scheduler.add_job(purge_old_items, "cron", hour=3, minute=0, id="purge")
    scheduler.start()
    logger.info(f"Scheduler started — fetch every {interval}min, purge daily at 03:00")

    # Fetch initial en arrière-plan pour ne pas bloquer le démarrage du serveur
    import threading
    threading.Thread(target=fetch_all_sources, daemon=True).start()

    yield

    scheduler.shutdown()


app = FastAPI(title="Pulse API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import items, sources  # noqa — après création de l'app
from routers import auth as auth_router  # noqa
app.include_router(items.router)
app.include_router(sources.router)
app.include_router(auth_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
