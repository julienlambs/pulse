# Journal — Pulse

## Session 5 — 16/11/2026 — [claude] Corrections avant de rendre le dépôt public

### Ce qui a été fait
- Sécurité : jeton de session signé HMAC-SHA256, 30 jours (`PULSE_TOKEN_TTL_DAYS`), à la place de `PULSE_SECRET_KEY`
  renvoyée telle quelle ; limite de tentatives au login (5 échecs / 15 min par IP, 50 toutes IP, 429 + Retry-After,
  1 s par échec) ; CORS limité à l'app + Vite ; `/docs` coupé. Tout 401 renvoie à l'écran de connexion.
- Données : index UNIQUE `(source_id, external_id)`, migration au démarrage (sauvegarde `pulse-avant-unique-AAAAMMJJ.db`,
  2 doublons de prod fusionnés sur une copie). Insertion par `ON CONFLICT DO NOTHING`.
- Reddit retiré (429 sur 7 subreddits sur 8 en prod), `reddit_fetcher.py` supprimé. Bluesky corrigé (liens des reposts,
  mots-clés, langue, réponses écartées), bouton Tester plus clair, suppression d'une source = suppression de ses articles
  non sauvegardés. Tests pytest (30). README + licence MIT.
- Scan de secrets : gitleaks 8.30.1 + grep, rien. Historique à réécrire (e-mail personnel en auteur, e-mail dans les
  lignes Co-Authored-By) avant publication.

### Avec quoi ça communique
- `/api/auth/login` renvoie `{token, expires_at}` ; même clé `pulse_token` en localStorage. Les anciens jetons (= ancienne
  clé) sont refusés : reconnexion une fois après déploiement.

### Décisions
- Jeton HMAC maison (bibliothèque standard) plutôt que PyJWT : pas de nouvelle dépendance.
- Reddit retiré plutôt que l'API OAuth (validation manuelle des apps par Reddit, issue incertaine). Choix de Julien.
- Licence MIT pour le code ; polices et identité Le Déclic hors licence.

### À faire par Julien au déploiement
- Régénérer `PULSE_SECRET_KEY` dans le `.env` du NAS (l'ancienne valeur a circulé comme jeton dans le navigateur).
- Désactiver ou supprimer les 8 sources Reddit dans l'Admin.
- Supprimer un jour la sauvegarde `data/pulse-avant-unique-*.db` (~140 Mo) une fois la migration validée.

### Bugs connus
- Port 8085 publié sur `0.0.0.0` (réseau local et Tailscale) : la règle commune veut `172.17.0.1:8085:80`. Touche le compose.
- Quelques flux RSS renvoient 0 article au premier passage (L'IA du Capitaine, Génération IA, TLDR AI) : à vérifier.
- Filtre « Aujourd'hui » des Sauvegardés : décalage UTC (inchangé).

---
## Session 4 — 08/11/2026 — [claude] Migration vers Le Déclic 1.21.0

### Ce qui a été fait
- Branche `declic-1.21`, fusionnée dans `master` et déployée sur le NAS le 08/11/2026. `AGENTS.md` et `.agents/` versionnés et réécrits : Pulse suit la charte Le Déclic, bleu seul, plus d'identité Leeroy (copie historique archivée dans `_archive/`, ignorée par git).
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
- Bouton Tester d'une nouvelle source : tester sans créer de source temporaire (route d'essai dédiée)
