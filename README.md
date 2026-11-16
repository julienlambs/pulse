# Pulse

Agrégateur de veille tech personnel. Pulse rassemble des flux RSS, des comptes Bluesky et des chaînes
YouTube dans une seule interface, pensée d'abord pour le téléphone (PWA installable).

- **5 onglets thématiques** : IA produit, UX & produit, tech, hardware & actu, vidéo.
- **Lecteur intégré** : le texte complet des articles est extrait à la collecte, lisible sans quitter l'app.
- **Filtres** : langue (FR / EN), type de source, non lus ; mots-clés à inclure ou exclure par source.
- **Sauvegardés** : les articles marqués sont gardés indéfiniment, le reste est purgé après 30 jours.
- **Admin** : ajout, test, activation et suppression des sources depuis l'app.

Application mono-utilisateur, protégée par mot de passe.

## Stack

| Couche | Techno |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy, APScheduler (collecte toutes les heures, purge à 3 h) |
| Base | SQLite |
| Collecte | feedparser, httpx, readability-lxml (texte complet), langdetect, API publique Bluesky |
| Frontend | React 18 + Vite, Tailwind CSS v4, charte « Le Déclic » (paquet `@declic/ui` fourni dans `frontend/vendor/`) |
| Déploiement | 2 conteneurs Docker (API + nginx qui sert le front et relaie `/api`), images publiées sur GHCR par GitHub Actions |

## Sécurité

- Mot de passe vérifié par bcrypt (`PULSE_PASSWORD_HASH`).
- Jeton de session signé HMAC-SHA256, valable 30 jours ; la clé de signature (`PULSE_SECRET_KEY`) ne quitte pas le serveur.
- Connexion limitée à 5 échecs par IP sur 15 minutes (et 50 toutes IP confondues), puis attente imposée.
- CORS restreint à l'origine de l'app. Toutes les routes `/api` demandent le jeton, sauf la connexion et `/api/health`.

## Lancer en local

Prérequis : Python 3.11+, Node 20+.

```bash
cp .env.example .env
# Dans .env : PULSE_PASSWORD_HASH, PULSE_SECRET_KEY (commandes de génération en commentaire),
# et DATABASE_URL=./pulse.db

# API (port 8000)
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Front (port 5173, relaie /api vers le port 8000)
cd frontend
npm ci
npm run dev
```

Au premier démarrage, la base est créée et remplie avec une liste de sources de départ (`backend/seed.py`).

## Lancer avec Docker

```bash
cp .env.example .env    # puis le remplir ; dans un .env lu par Docker Compose, doubler les $ du hash bcrypt ($$)
docker compose up -d    # front sur le port 8085, base dans ./data
```

`docker-compose.yml` utilise les images publiées sur GHCR ; pour construire en local, ajouter un
`docker-compose.override.yml` avec `build: ./backend` et `build: ./frontend`.

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Licence

Code sous licence [MIT](LICENSE).
Les polices et l'identité visuelle « Le Déclic » (`frontend/src/fonts/Declic-*`, `frontend/src/fonts/mono/`,
`frontend/vendor/declic-ui-*.tgz`) restent la propriété de leur auteur et ne sont pas couvertes par cette licence.
iA Writer Quattro est distribuée sous sa propre licence (`frontend/src/fonts/ia/LICENSE.md`).
