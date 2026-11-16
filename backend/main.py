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
from fetchers import run_fetcher
from models import Item, Source

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("pulse")

scheduler = BackgroundScheduler()


def fetch_all_sources():
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.is_active == True).all()
        logger.info(f"Scheduler: fetching {len(sources)} active sources")
        for source in sources:
            try:
                count, error = run_fetcher(source, db)
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


_docs = os.getenv("PULSE_ENABLE_DOCS") == "1"  # doc interactive /docs, à n'activer qu'en local
app = FastAPI(
    title="Pulse API",
    lifespan=lifespan,
    docs_url="/docs" if _docs else None,
    redoc_url=None,
    openapi_url="/openapi.json" if _docs else None,
)

# L'app passe par le même domaine (proxy nginx en prod, proxy Vite en dev) : CORS ne sert
# qu'à un appel direct depuis une autre origine, limité à celles-ci.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "PULSE_ALLOWED_ORIGINS", "https://pulse.julienlambs.dev,http://localhost:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # jeton Bearer, pas de cookie
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

from routers import items, sources  # noqa — après création de l'app
from routers import auth as auth_router  # noqa
app.include_router(items.router)
app.include_router(sources.router)
app.include_router(auth_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
