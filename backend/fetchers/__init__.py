from sqlalchemy.dialects.sqlite import insert as sqlite_insert


def insert_item(db, **values) -> bool:
    """Insère un article ; ignore sans erreur un doublon (même source, même external_id).

    Filet de sécurité de la contrainte UNIQUE : deux collectes simultanées de la même source
    ne font plus échouer tout le lot. Les lecteurs vérifient quand même external_id avant,
    pour ne pas télécharger le contenu d'un article déjà en base.
    Renvoie True si l'article a été ajouté.
    """
    from models import Item

    stmt = sqlite_insert(Item).values(**values).on_conflict_do_nothing(
        index_elements=["source_id", "external_id"]
    )
    return db.execute(stmt).rowcount == 1


REDDIT_RETIRED = (
    "Reddit n'est plus pris en charge : ses flux refusent les lecteurs anonymes (HTTP 429). "
    "Désactive ou supprime cette source."
)


def run_fetcher(source, db):
    """Lance le lecteur adapté au type de la source. Renvoie (nombre de nouveaux articles, erreur ou None)."""
    if source.type == "rss":
        from fetchers.rss_fetcher import fetch_rss
        return fetch_rss(source, db)
    if source.type == "youtube":
        from fetchers.youtube_fetcher import fetch_youtube
        return fetch_youtube(source, db)
    if source.type == "bluesky":
        from fetchers.bluesky_fetcher import fetch_bluesky
        return fetch_bluesky(source, db)
    if source.type == "reddit":
        return 0, REDDIT_RETIRED
    return 0, f"Type de source inconnu : {source.type}"
