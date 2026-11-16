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
