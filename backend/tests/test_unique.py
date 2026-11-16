import sqlite3
from datetime import datetime
from pathlib import Path

from database import UNIQUE_ITEMS_INDEX, migrate_unique_items

OLD_SCHEMA = """
CREATE TABLE items (
    id INTEGER NOT NULL PRIMARY KEY, source_id INTEGER NOT NULL, tab VARCHAR NOT NULL,
    type VARCHAR NOT NULL, title TEXT NOT NULL, summary TEXT, content TEXT, url VARCHAR NOT NULL,
    thumbnail_url VARCHAR, author VARCHAR, lang VARCHAR, published_at DATETIME, fetched_at DATETIME,
    is_read BOOLEAN, is_saved BOOLEAN, external_id VARCHAR NOT NULL)
"""


def _old_db(path: Path, rows):
    con = sqlite3.connect(path)
    con.execute(OLD_SCHEMA)
    con.executemany(
        "INSERT INTO items (id, source_id, tab, type, title, url, is_read, is_saved, external_id)"
        " VALUES (?, ?, 't', 'rss', 'titre', 'u', ?, ?, ?)", rows)
    con.commit()
    con.close()


def test_migration_merges_duplicates_and_adds_index(tmp_path):
    db = tmp_path / "pulse.db"
    _old_db(db, [
        (1, 1, 0, 0, "a"), (2, 1, 1, 1, "a"), (3, 1, 0, 0, "a"),  # 3 copies, une lue et sauvegardée
        (4, 1, 0, 0, "b"),
        (5, 2, 0, 0, "a"),  # même external_id, autre source : légitime
    ])
    migrate_unique_items(str(db))

    con = sqlite3.connect(db)
    assert con.execute("SELECT id, source_id, is_read, is_saved, external_id FROM items ORDER BY id").fetchall() == [
        (1, 1, 1, 1, "a"), (4, 1, 0, 0, "b"), (5, 2, 0, 0, "a"),
    ]
    assert con.execute("SELECT 1 FROM sqlite_master WHERE name=?", (UNIQUE_ITEMS_INDEX,)).fetchone()
    con.close()

    backups = list(tmp_path.glob("pulse-avant-unique-*.db"))
    assert len(backups) == 1
    assert sqlite3.connect(backups[0]).execute("SELECT COUNT(*) FROM items").fetchone()[0] == 5


def test_migration_is_idempotent(tmp_path):
    db = tmp_path / "pulse.db"
    _old_db(db, [(1, 1, 0, 0, "a")])
    migrate_unique_items(str(db))
    migrate_unique_items(str(db))
    assert len(list(tmp_path.glob("*-avant-unique-*"))) == 1


def test_migration_on_empty_or_missing_table(tmp_path):
    migrate_unique_items(str(tmp_path / "vide.db"))  # pas de table : rien à faire
    assert not list(tmp_path.glob("*-avant-unique-*"))


def test_insert_item_ignores_duplicate(app):
    from database import SessionLocal
    from fetchers import insert_item
    from models import Item, Source

    db = SessionLocal()
    try:
        source = Source(name="s", type="rss", url="u", tab="tech")
        db.add(source)
        db.commit()
        values = dict(source_id=source.id, tab="tech", type="rss", title="t", url="u",
                      external_id="dup-1", fetched_at=datetime.utcnow())
        assert insert_item(db, **values) is True
        assert insert_item(db, **values) is False
        db.commit()
        rows = db.query(Item).filter(Item.external_id == "dup-1").all()
        assert len(rows) == 1
        assert rows[0].is_read is False and rows[0].is_saved is False  # valeurs par défaut appliquées
    finally:
        db.close()
