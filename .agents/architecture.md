# Architecture — Pulse

## Vue d'ensemble

Pulse est un agrégateur de veille personnel. Un backend FastAPI ingère des sources hétérogènes (RSS, Bluesky, YouTube) toutes les heures, stocke les articles en SQLite, et expose une API REST consommée par un frontend React mobile-first.

```
Sources externes
(RSS / Bluesky / YouTube)
        │
        ▼
  APScheduler (toutes les heures)
        │
        ▼
  Ingesteurs par type (aiguillage : fetchers.run_fetcher)
  ├── rss_fetcher.py      (feedparser + readability-lxml)
  ├── bluesky_fetcher.py  (API AT Protocol publique)
  └── youtube_fetcher.py  (flux RSS natif YouTube)
        │
        ▼
  SQLite (pulse.db)
        │
        ▼
  FastAPI REST API
        │
        ▼
  React Frontend (PWA mobile-first)
```

---

## Stack technique

| Couche | Techno |
|---|---|
| Backend | FastAPI + Python |
| Scheduler | APScheduler (intégré dans FastAPI) |
| Base de données | SQLite |
| Parsing RSS | feedparser |
| Extraction contenu | readability-lxml |
| Détection langue | langdetect |
| Frontend | React + Vite |
| Style | Tailwind CSS v4 + charte Le Déclic 1.21.0 (paquet `@declic/ui`) |
| Infra | Docker (2 conteneurs), Cloudflare Tunnel |
| CI/CD | GitHub Actions → GHCR → NAS |

---

## Modèle de données

### Table `sources`

| Champ | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | Nom affiché ex: "Lenny's Newsletter" |
| `type` | TEXT | rss / bluesky / youtube (`reddit` : ancien type, retiré le 16/11/2026, n'est plus collecté) |
| `url` | TEXT | URL du flux ou handle Bluesky |
| `tab` | TEXT | ai_product / ux_product / tech / hardware / video |
| `keywords` | TEXT | JSON array de mots-clés pour filtrage optionnel |
| `lang_filter` | TEXT | fr / en / all |
| `is_active` | BOOLEAN | Activer/désactiver sans supprimer, défaut true |
| `last_fetched_at` | DATETIME | Dernier passage du scheduler |
| `last_fetch_count` | INTEGER | Nombre d'articles ingérés au dernier fetch |
| `last_fetch_error` | TEXT | Message d'erreur si fetch échoué, nullable |

### Table `items`

| Champ | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `source_id` | INTEGER FK | Référence vers sources.id |
| `tab` | TEXT | Onglet cible, copié depuis la source |
| `type` | TEXT | rss / reddit / bluesky / youtube |
| `title` | TEXT | Titre de l'article ou du post |
| `summary` | TEXT | Résumé ou début du contenu |
| `content` | TEXT | Contenu complet extrait via readability, nullable |
| `url` | TEXT | Lien vers le contenu original |
| `thumbnail_url` | TEXT | Miniature, principalement YouTube, nullable |
| `author` | TEXT | Auteur ou nom du compte |
| `lang` | TEXT | fr ou en, détecté automatiquement via langdetect |
| `published_at` | DATETIME | Date de publication originale |
| `fetched_at` | DATETIME | Date d'ingestion dans Pulse |
| `is_read` | BOOLEAN | Lu ou non, défaut false |
| `is_saved` | BOOLEAN | Sauvegardé, défaut false |
| `external_id` | TEXT | ID unique côté source, sert à éviter les doublons |

Index UNIQUE `uq_items_source_external` sur `(source_id, external_id)` (16/11/2026). Sur une base plus ancienne,
`database.migrate_unique_items` le pose au démarrage, une seule fois : sauvegarde `pulse-avant-unique-AAAAMMJJ.db`
à côté de la base, fusion des doublons, création de l'index. Supprimer une source supprime ses articles non sauvegardés.

---

## Flux d'ingestion

### RSS

```
1. Fetch du flux via feedparser
2. Pour chaque entrée : vérifier external_id en base (éviter doublons)
3. Filtrage par mots-clés si keywords défini sur la source
4. Détection langue via langdetect sur title + summary
5. Si résumé tronqué : fetch de l'URL + extraction via readability-lxml
   └── Si fetch échoue : content = null, fallback ouverture navigateur côté frontend
6. Insertion en base
7. Mise à jour last_fetched_at, last_fetch_count, last_fetch_error sur la source
```

### Bluesky

```
1. Appel API AT Protocol publique `app.bsky.feed.getAuthorFeed` (pas de clé), `filter=posts_no_replies`
2. Posts et reposts du compte ; pour un repost, auteur et lien sont ceux du post d'origine
3. Vérification external_id (uri du post)
4. Mots-clés à inclure / exclure (même filtre que le RSS : fetchers.keyword_filter)
5. Langue : champ `langs` du post, détection seulement à défaut
6. Insertion en base (content = texte natif du post, pas de fetch externe)

Un compte inactif donne 0 article : la purge à 30 jours efface les vieux posts.
```

### YouTube

```
1. Fetch du flux RSS natif : https://www.youtube.com/feeds/videos.xml?channel_id=XXX
2. Extraction titre, description, thumbnail (balise media:thumbnail)
3. Vérification external_id (video id YouTube)
4. Insertion en base (content = null, tap ouvre YouTube directement)
```

---

## Purge automatique

Tâche quotidienne via APScheduler à 3h00 :

```python
DELETE FROM items
WHERE published_at < NOW() - INTERVAL 30 DAYS
AND is_saved = false
```

Les items sauvegardés (is_saved = true) ne sont jamais purgés automatiquement.

---

## Endpoints API

### Items

```
GET  /api/items?tab=ai_product&lang=fr&limit=50&offset=0
     Retourne les items d'un onglet, triés par published_at DESC

PATCH /api/items/{id}/read
      Marque un item comme lu

PATCH /api/items/{id}/save
      Toggle is_saved sur un item
```

### Sources (admin)

```
GET    /api/sources
GET    /api/sources/{id}
POST   /api/sources
PATCH  /api/sources/{id}
DELETE /api/sources/{id}
PATCH  /api/sources/{id}/toggle
       Active ou désactive une source
```

### Auth

```
POST /api/auth/login
     Body : { "password": "..." }  (texte, 1 à 128 caractères)
     Retourne : { "token": "...", "expires_at": <secondes Unix> }
     Jeton signé HMAC-SHA256 (auth.py), valable PULSE_TOKEN_TTL_DAYS jours (30), stocké en localStorage.
     Tout 401 vide le jeton et renvoie à l'écran de connexion (lib/api.js, événement pulse:logout).
     Limite : 5 échecs / 15 min par IP (CF-Connecting-IP), 50 toutes IP, puis 429 + Retry-After ; 1 s de pause par échec.

Toutes les routes /api demandent le jeton, sauf /api/auth/login et /api/health (vérifié par tests/test_auth.py).
CORS : https://pulse.julienlambs.dev et http://localhost:5173 (PULSE_ALLOWED_ORIGINS). /docs coupé (PULSE_ENABLE_DOCS=1).
```

### Trigger manuel (admin)

```
POST /api/sources/{id}/fetch
     Déclenche un fetch immédiat sur une source spécifique
```

---

## Structure des dossiers

```
pulse/
├── CLAUDE.md
├── AGENTS.md
├── .agents/
│   ├── architecture.md     (ce fichier)
│   ├── sources.md
│   ├── ux.md
│   ├── rules.md
│   └── journal.md
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py             Point d'entrée FastAPI + scheduler
│   ├── database.py         Connexion SQLite + init tables
│   ├── models.py           Modèles SQLAlchemy
│   ├── auth.py             Jeton signé : création, vérification
│   ├── tests/              pytest (requirements-dev.txt)
│   ├── routers/
│   │   ├── items.py
│   │   ├── sources.py
│   │   └── auth.py
│   └── fetchers/
│       ├── __init__.py     run_fetcher, insert_item, keyword_filter
│       ├── rss_fetcher.py
│       ├── bluesky_fetcher.py
│       └── youtube_fetcher.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css           (charte Le Déclic — copie, version en tête)
        ├── app.css             (CSS propre à Pulse : lecteur…)
        ├── fonts/              (polices de la charte — copie)
        ├── lib/
        ├── components/
        │   ├── layout/
        │   │   ├── Header.jsx
        │   │   └── BottomNav.jsx
        │   ├── feed/
        │   │   ├── FeedTab.jsx
        │   │   ├── ArticleCard.jsx
        │   │   ├── VideoCard.jsx
        │   │   └── LangFilter.jsx
        │   ├── reader/
        │   │   ├── Reader.jsx
        │   │   └── FontSizePicker.jsx
        │   ├── saved/
        │   │   ├── SavedPage.jsx
        │   │   ├── TabFilter.jsx
        │   │   └── DateFilter.jsx
        │   └── admin/
        │       ├── AdminPage.jsx
        │       ├── SourceList.jsx
        │       ├── SourceCard.jsx
        │       └── SourceForm.jsx
        └── pages/
            └── Login.jsx
```

---

## Variables d'environnement (.env)

```
PULSE_PASSWORD_HASH=       # hash bcrypt du mot de passe
PULSE_SECRET_KEY=          # clé de signature des jetons (≥ 32 caractères), reste sur le serveur
PULSE_TOKEN_TTL_DAYS=30    # durée du jeton
DATABASE_URL=              # chemin SQLite ex: /data/pulse.db
FETCH_INTERVAL_MINUTES=60  # fréquence de refresh des sources
RETENTION_DAYS=30          # durée de rétention des articles non sauvegardés
```

---

## Docker

Deux conteneurs :

| Conteneur | Image | Port | Rôle |
|---|---|---|---|
| `pulse_api` | `ghcr.io/julienlambs/pulse-api:latest` | 8000 (interne) | FastAPI + scheduler |
| `pulse_frontend` | `ghcr.io/julienlambs/pulse-frontend:latest` | 8085 (exposé) | React + nginx |

Dossier NAS : `/volume2/docker/pulse/`
DB : `/volume2/docker/pulse/data/pulse.db`
Domaine : `pulse.julienlambs.dev` via Cloudflare Tunnel, route `http://172.17.0.1:8085`

---

## CI/CD

Push sur `master` → GitHub Actions `docker-publish.yml` → build + push GHCR. Le NAS tire les images chaque jour à 6 h (tâche planifiée Synology), ou à la main.
Repo : `julienlambs/pulse`
