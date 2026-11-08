# Journal — Pulse

## Session 3 — Phase 5 complète + sécurité

### État actuel
App déployée sur le NAS et accessible par Tailscale sur le port 8085.
Route Cloudflare Tunnel à configurer : `pulse.julienlambs.dev` → `http://172.17.0.1:8085`
Dev local toujours dispo : backend port 8000, frontend Vite port 5173.

**Repo GitHub** : `julienlambs/pulse` (privé — deviendra public en fin de projet)

---

### Ce qui a été fait

**Phase 1 à 4** ✅ (voir session 2)

**Sécurité — Auth complète** ✅
- Toute l'app protégée par login (plus seulement l'admin)
- Auth backend : bcrypt (`PULSE_PASSWORD_HASH`) + token séparé (`PULSE_SECRET_KEY`)
- Helper `apiFetch` (src/lib/api.js) : injecte automatiquement le Bearer token sur tous les appels API
- `.env` sur NAS : `$` du hash bcrypt échappés en `$$` pour docker-compose

**Phase 5 — Dockerisation + CI/CD** ✅
- `backend/Dockerfile` : Python 3.11-slim + uvicorn
- `frontend/Dockerfile` : node build → nginx + `nginx.conf` proxy `/api` → `pulse_api:8000`
- `docker-compose.yml` : images GHCR, réseau interne `pulse_net`, volume `./data:/data`
- `docker-compose.override.yml` : build local pour dev (gitignored)
- `.github/workflows/docker-publish.yml` : build + push GHCR sur push master + `workflow_dispatch`
- Packages GHCR publics (images sans secrets, auth NAS non nécessaire)
- Cron Synology Task Scheduler : tous les jours à 6h00, pull + up
- `Pulse_Deploy.bat` : script deploy manuel local (gitignored)
- Secrets GitHub : `NAS_HOST`, `NAS_USER`, `NAS_SSH_KEY` (conservés mais step deploy retiré du workflow)

**Repo git** ✅
- `.gitignore` : exclut `.env`, `*.db`, `*.log`, `.claude/`, `CLAUDE.md`, `*.bat`, `leeroy-design-system/`
- Premier commit propre : 44 fichiers, zéro donnée personnelle
- User-Agent `rss_fetcher.py` : générique (plus de domaine perso)

---

### Bugs connus
- Bluesky : certains handles retournent 0 items selon disponibilité de l'API publique
- Filtre "Aujourd'hui" dans Saved peut ne rien retourner si articles datent d'avant minuit UTC (décalage timezone)
- Le bouton "Tester" dans SourceForm pour une nouvelle source crée/supprime une source temporaire en base — acceptable mais pas optimal

---

### Prochain chantier
**Phase 6 — Route Cloudflare Tunnel + PWA**

1. Configurer route Cloudflare Tunnel : `pulse.julienlambs.dev` → `http://172.17.0.1:8085`
2. PWA : `manifest.json` + `service-worker.js` pour installation mobile (icône, splash, offline basique)

Puis : itérations sur retours utilisateur MVP.

---

### Backlog
- Traduction automatique des articles anglais via Claude API (bouton "Traduire" dans le lecteur)
- Custom feeds Bluesky communautaires (starter packs)
- Statistiques détaillées par source dans l'admin (graphe d'activité)
- Recherche full-text dans le feed
