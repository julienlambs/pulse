# Règles projet — Pulse

## Stack
- Backend : FastAPI + Python, APScheduler intégré, SQLite
- Frontend : React + Vite, Tailwind CSS v4 + charte Le Déclic 1.21.0 (paquet `@declic/ui`)
- CI/CD : GitHub Actions → GHCR → NAS
- NAS : `/volume2/docker/pulse/`, port 8085

## Conventions code
- Pas de TypeScript — JavaScript pur côté frontend
- Mobile-first : chaque composant conçu pour 390px en priorité
- Charte Le Déclic : uniquement les jetons de `src/index.css` ; ce fichier et `src/fonts/` sont des copies de la charte,
  à recopier (pas à retoucher) ; composants par le paquet `@declic/ui`
- Pas de couleurs hardcodées — uniquement les variables CSS du design system
- Pas de nouvelle dépendance sans validation explicite
- Commits : `type: description courte en français` (feat / fix / style / chore)

## Contraintes critiques
- Toujours vérifier `external_id` avant d'insérer un item en base (mécanisme anti-doublons)
- Les items `is_saved = true` ne sont jamais purgés automatiquement
- Les comportements fonctionnels sont définis dans `.agents/ux.md`, pas dans les maquettes graphiques

## Discipline d'exécution
- Toute tâche touchant 3 étapes distinctes ou 3 fichiers ou plus : produire un plan/todo via `todo_write` avant d'agir — pas d'exécution improvisée sur les tâches de cette taille (règle transversale, voir `Projets/cadrage-agents-locaux.md`). **N'utilise JAMAIS `enter_plan_mode`** : cassé sous ACP (le mode plan ne restreint pas réellement le comportement dans ce contexte, voir [qwen-code#1806](https://github.com/QwenLM/qwen-code/issues/1806)) et déclenche une boucle infinie sur le modèle local (`Qwen3.6-35B-A3B`, bug connu — voir HuggingFace discussions #19/#20 du modèle). La protection réelle contre les actions risquées passe par la bannière d'approbation de l'hôte ACP, pas par ce mécanisme.
- Avant de rédiger ce plan/todo pour une tâche non triviale : lis d'abord les fichiers concernés (`read_file`/`grep`/`glob`) et appuie le plan sur des faits vérifiés dans le code, pas des suppositions — cite fichier:ligne pour les affirmations clés du plan plutôt que de deviner.
- Après toute édition de fichier (`edit`/`write_file`) sur du code ou de la config : relire immédiatement le fichier modifié (`read_file`) pour confirmer que le changement a bien été appliqué comme prévu, avant de continuer ou de conclure la tâche (règle transversale, voir `Projets/cadrage-agents-locaux.md`)

## Mémoire partagée — protocole journal
Ce fichier (comme `architecture.md`/`sources.md`/`ux.md`/`journal.md`) est importé par `AGENTS.md` à la racine — lu nativement par qwen-code, et par Claude Code via l'import `@AGENTS.md` de `CLAUDE.md`. Les deux agents doivent suivre ce protocole.
- Entrées du log chronologique : toujours tagger avec l'agent — `[qwen]` pour qwen-code, `[claude]` pour Claude Code
- Le log chronologique est append-only — ajouter une entrée datée en haut, ne jamais écraser les entrées existantes
- La section "État actuel" peut être mise à jour librement
- Lire `.agents/architecture.md` et `.agents/ux.md` si la tâche touche à la structure des données ou aux comportements UI
