import logging
import os
import sqlite3
from datetime import date
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "./pulse.db")
UNIQUE_ITEMS_INDEX = "uq_items_source_external"

logger = logging.getLogger("pulse.db")

engine = create_engine(
    f"sqlite:///{DATABASE_URL}",
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_unique_items(DATABASE_URL)


def migrate_unique_items(db_path: str) -> None:
    """Pose la contrainte UNIQUE (source_id, external_id) sur une base créée avant elle.

    Une seule fois : sauvegarde de la base (`<nom>-avant-unique-AAAAMMJJ.db`, à côté),
    fusion des doublons (on garde la ligne la plus ancienne, marquée lue / sauvegardée
    si l'une des copies l'était), puis création de l'index, le tout dans une transaction.
    """
    con = sqlite3.connect(db_path)
    try:
        if not con.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='items'").fetchone():
            return
        if con.execute("SELECT 1 FROM sqlite_master WHERE type='index' AND name=?", (UNIQUE_ITEMS_INDEX,)).fetchone():
            return

        if con.execute("SELECT EXISTS(SELECT 1 FROM items)").fetchone()[0]:
            path = Path(db_path)
            backup = path.with_name(f"{path.stem}-avant-unique-{date.today():%Y%m%d}{path.suffix or '.db'}")
            if not backup.exists():
                dest = sqlite3.connect(backup)
                try:
                    con.backup(dest)
                finally:
                    dest.close()
                logger.info(f"Migration UNIQUE : sauvegarde {backup}")

        groups = """SELECT source_id, external_id, MIN(id) AS keep_id,
                           MAX(is_saved) AS saved, MAX(is_read) AS read_
                    FROM items GROUP BY source_id, external_id HAVING COUNT(*) > 1"""
        with con:
            duplicates = con.execute(groups).fetchall()
            for _source_id, _external_id, keep_id, saved, read_ in duplicates:
                con.execute("UPDATE items SET is_saved = ?, is_read = ? WHERE id = ?", (saved, read_, keep_id))
            removed = con.execute(
                "DELETE FROM items WHERE id NOT IN (SELECT MIN(id) FROM items GROUP BY source_id, external_id)"
            ).rowcount
            con.execute(f"CREATE UNIQUE INDEX {UNIQUE_ITEMS_INDEX} ON items (source_id, external_id)")
        logger.info(f"Migration UNIQUE : {len(duplicates)} doublon(s) fusionné(s), {removed} ligne(s) supprimée(s)")
    finally:
        con.close()
