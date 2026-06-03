from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_auth
from database import get_db
from models import Item

router = APIRouter(prefix="/api/items", tags=["items"], dependencies=[Depends(require_auth)])


def _item_to_dict(item: Item):
    return {
        "id": item.id,
        "source_id": item.source_id,
        "tab": item.tab,
        "type": item.type,
        "title": item.title,
        "summary": item.summary,
        "content": item.content,
        "url": item.url,
        "thumbnail_url": item.thumbnail_url,
        "author": item.author,
        "lang": item.lang,
        "published_at": item.published_at.isoformat() if item.published_at else None,
        "fetched_at": item.fetched_at.isoformat() if item.fetched_at else None,
        "is_read": item.is_read,
        "is_saved": item.is_saved,
        "external_id": item.external_id,
    }


@router.get("")
def get_items(
    tab: str = Query(...),
    lang: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Item).filter(Item.tab == tab)
    if lang and lang != "all":
        query = query.filter(Item.lang == lang)
    query = query.order_by(Item.published_at.desc())
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return {"items": [_item_to_dict(i) for i in items], "total": total}


@router.get("/saved")
def get_saved(
    tab: Optional[str] = Query(None),
    lang: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Item).filter(Item.is_saved == True)
    if tab and tab != "all":
        query = query.filter(Item.tab == tab)
    if lang and lang != "all":
        query = query.filter(Item.lang == lang)
    if date_from:
        from datetime import datetime
        query = query.filter(Item.published_at >= datetime.fromisoformat(date_from))
    if date_to:
        from datetime import datetime
        query = query.filter(Item.published_at <= datetime.fromisoformat(date_to))
    query = query.order_by(Item.published_at.desc())
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return {"items": [_item_to_dict(i) for i in items], "total": total}


@router.patch("/{item_id}/read")
def mark_read(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_read = True
    db.commit()
    return {"ok": True}


@router.patch("/{item_id}/save")
def toggle_save(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_saved = not item.is_saved
    db.commit()
    return {"ok": True, "is_saved": item.is_saved}
