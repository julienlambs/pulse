from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # rss / reddit / bluesky / youtube
    url = Column(String, nullable=False)
    tab = Column(String, nullable=False)  # ai_product / ux_product / tech / hardware / video
    keywords = Column(Text, nullable=True)          # JSON array stringifié
    exclude_keywords = Column(Text, nullable=True)  # JSON array stringifié
    lang_filter = Column(String, default="all")  # fr / en / all
    is_active = Column(Boolean, default=True)
    last_fetched_at = Column(DateTime, nullable=True)
    last_fetch_count = Column(Integer, default=0)
    last_fetch_error = Column(Text, nullable=True)


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    tab = Column(String, nullable=False)
    type = Column(String, nullable=False)  # rss / reddit / bluesky / youtube
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    author = Column(String, nullable=True)
    lang = Column(String, nullable=True)  # fr / en
    published_at = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    is_saved = Column(Boolean, default=False)
    external_id = Column(String, nullable=False)
