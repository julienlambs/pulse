# Journal — Pulse

## Session 4 — 08/11/2026 — [claude] Migration vers Le Déclic 1.21.0

### Ce qui a été fait
- Branche `declic-1.21` (pas encore poussée ni déployée). `AGENTS.md` et `.agents/` versionnés et réécrits : Pulse suit la charte Le Déclic, bleu seul, plus d'identité Leeroy (copie historique archivée dans `_archive/`, ignorée par git).
- Lot 1 : `index.css` 1.21.0 + `fonts/` copiés depuis `D:/Projets/design-system/`, paquet `@declic/ui` dans `frontend/vendor/` (copié avant `npm ci` dans le Dockerfile), thème par `useTheme()` du paquet, fond sphinx à la place du fond hexagonal violet.
- Lots 2 à 4 (un seul passage : tout était en styles en ligne) : chaque écran refait avec les briques du paquet — barre du haut, barre du bas sur téléphone et menu latéral au-delà de 600 px, cartes coupées à lien étiré, boutons groupés et puces pour les filtres, squelette, état vide, bannière d'erreur, lecteur en `.prose` (Quattro), panneaux du bas (`Reveal` + `useSurface`), confirmation de la charte pour supprimer une source, icônes `<Icone>`. CSS propre à Pulse dans `src/app.css`, uniquement des jetons.
- Audit `audit-charte.py` : 283 écarts → 3 (dans la copie d'`index.css`, côté charte).

### Avec quoi ça communique
- Rien de changé côté API : mêmes routes `/api/*`, même jeton `pulse_token`. Clé du thème : `declic_theme` (l'ancienne `leeroy_theme_mode` n'est plus lue).

### Décisions
- Badges de source : RSS en accent, Reddit / Bluesky / YouTube en neutre (les teintes hi/md/lo restent aux statuts).
- Titres de carte en Déclic 600 à `--t-lg`, comme la liste riche compacte de la charte.
- Lecteur : tailles S/M/L = 16/18/21 px (Quattro) au lieu de 14/16/19.
- Opacité des cartes lues / non lues gardée (0,5 / 0,8).

### À vérifier par Julien
- Lecteur sur Android : le bouton retour ferme bien le lecteur (`popstate`) — à retester sur le téléphone.

---

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
- `.gitignore` : exclut `.env`, `*.db`, `*.log`, `.claude/`, `CLAUDE.md`, `*.bat`, `leeroy-design-system/` (depuis le 08/11/2026 : `_archive/`)
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
