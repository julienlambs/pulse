import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import require_auth
from database import get_db
from models import Source

router = APIRouter(prefix="/api/sources", tags=["sources"])
logger = logging.getLogger("pulse.sources")


def _source_to_dict(source: Source):
    return {
        "id": source.id,
        "name": source.name,
        "type": source.type,
        "url": source.url,
        "tab": source.tab,
        "keywords": source.keywords,
        "lang_filter": source.lang_filter,
        "is_active": source.is_active,
        "last_fetched_at": source.last_fetched_at.isoformat() if source.last_fetched_at else None,
        "last_fetch_count": source.last_fetch_count,
        "last_fetch_error": source.last_fetch_error,
    }


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
    return 0, f"Unknown source type: {source.type}"


@router.get("", dependencies=[Depends(require_auth)])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).order_by(Source.tab, Source.name).all()
    return [_source_to_dict(s) for s in sources]


@router.get("/{source_id}", dependencies=[Depends(require_auth)])
def get_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return _source_to_dict(source)


@router.post("", dependencies=[Depends(require_auth)])
def create_source(body: dict, db: Session = Depends(get_db)):
    source = Source(
        name=body["name"],
        type=body["type"],
        url=body["url"],
        tab=body["tab"],
        keywords=body.get("keywords"),
        lang_filter=body.get("lang_filter", "all"),
        is_active=body.get("is_active", True),
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _source_to_dict(source)


@router.patch("/{source_id}", dependencies=[Depends(require_auth)])
def update_source(source_id: int, body: dict, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    for field in ["name", "type", "url", "tab", "keywords", "lang_filter", "is_active"]:
        if field in body:
            setattr(source, field, body[field])
    db.commit()
    db.refresh(source)
    return _source_to_dict(source)


@router.delete("/{source_id}", dependencies=[Depends(require_auth)])
def delete_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
    return {"ok": True}


@router.patch("/{source_id}/toggle", dependencies=[Depends(require_auth)])
def toggle_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    source.is_active = not source.is_active
    db.commit()
    return _source_to_dict(source)


@router.post("/{source_id}/fetch", dependencies=[Depends(require_auth)])
def trigger_fetch(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    count, error = _run_fetcher(source, db)
    source.last_fetched_at = datetime.utcnow()
    source.last_fetch_count = count
    source.last_fetch_error = error
    db.commit()
    logger.info(f"Manual fetch {source.name}: {count} items, error={error}")
    return {"count": count, "error": error}
