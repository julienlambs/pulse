# Pulse

Agrégateur de veille tech personnel. Centralise des flux RSS, posts Bluesky et chaînes YouTube (Reddit retiré le 16/11/2026) dans une interface mobile-first unifiée. 5 onglets thématiques : IA Produit/PM, UX & Product, Tech général, Hardware & Actu, Vidéo.

Projet 2AM Studio — développeur solo : Julien LAMBS.
Repo : `julienlambs/pulse` (MIT ; prêt à devenir public, voir journal du 16/11/2026)
Déployé sur NAS Synology via Docker, accessible sur `pulse.julienlambs.dev`.

Ce fichier est la mémoire partagée du projet, lue par les deux agents qui travaillent dessus : qwen-code (le lit nativement) et Claude Code (l'importe via `@AGENTS.md` depuis son propre `CLAUDE.md`). Les deux doivent suivre les instructions ci-dessous et dans les fichiers importés — et les deux peuvent les mettre à jour (voir protocole journal dans `rules.md`).

@.agents/architecture.md
@.agents/sources.md
@.agents/ux.md
@.agents/rules.md
@.agents/journal.md

---

## Stack

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

## Comportement attendu

- À chaque fois qu'une idée ou feature hors objectif immédiat est mentionnée, la noter silencieusement dans la section "### Backlog" de `.agents/journal.md` sans interrompre, puis continuer sur la tâche en cours.
- Quand "mets le journal à jour" ou "fin de session" est dit, mettre à jour `.agents/journal.md` : résumer ce qui a été fait, l'état actuel, les bugs connus, le prochain chantier.
- Toujours lister les fichiers qui vont être modifiés avant d'agir.
- `src/index.css` et `src/fonts/` sont des **copies** de la charte (`D:/Projets/design-system/`) : ne pas les retoucher à la main, les recopier depuis la charte à chaque mise à jour (version notée en tête d'`index.css`). Le CSS propre à Pulse va dans `src/app.css`.
- Composants : ceux du paquet `@declic/ui` (`frontend/vendor/declic-ui-<version>.tgz`), jamais de copie locale ni de retouche dans `node_modules`. Thème : `useTheme()` du paquet.
- Toujours vérifier `external_id` avant d'insérer un item en base (évite de télécharger un contenu déjà présent), puis insérer par `fetchers.insert_item` : la contrainte UNIQUE `(source_id, external_id)` ignore un doublon.
- Tests backend : `cd backend && pytest` (dépendances : `requirements-dev.txt`). Les lancer avant chaque commit backend.

---

## Règles absolues

- **Mobile-first** : chaque composant est conçu pour 390px de large en priorité.
- **Charte Le Déclic** (bleu seul, pas de couleur partenaire — décision du 08/11/2026) : uniquement les jetons d'`index.css` (`--pri`, `--card2`, `--s-N`, `--z-*`…), coins coupés à 60°, aucun arrondi, Saira pour le texte, Déclic pour les titres, icônes `<Icone nom="…">`. Pas de couleurs en dur. Vérifier avec `python D:/Projets/design-system/outils/audit-charte.py frontend` (objectif : 0).
- **Pas de TypeScript** : JavaScript pur côté frontend.
- **Pas de dépendances inutiles** : valider avec Julien avant d'ajouter une lib non prévue dans la stack.
- **Maquette = inspiration graphique uniquement** : les comportements fonctionnels sont définis dans `ux.md`, pas dans la maquette.
- **Commits** : `type: description courte en français`
  - `feat:` nouvelle fonctionnalité
  - `fix:` correction bug
  - `style:` ajustement visuel sans impact fonctionnel
  - `chore:` maintenance, dépendances, config

## Règles de remontée

- Nouveau port, domaine, volume ou changement d'infra partagée → mettre à jour `Projets/CLAUDE.md` en fin de session.
- Changement de stack principale ou nouvel outil du quotidien → escalader vers `~/.claude/CLAUDE.md` (rare, concerne surtout Claude Code).
