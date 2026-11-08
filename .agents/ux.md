# UX — Pulse

Référence complète des écrans, comportements et navigation.
La maquette Claude Design sert de référence graphique uniquement.
Ce fichier fait foi pour la logique et les comportements fonctionnels.
Le visuel (couleurs, polices, formes, tailles) suit la charte Le Déclic (`D:/Projets/design-system/`, bleu seul) ;
les indications graphiques ci-dessous la suivent depuis la migration du 08/11/2026.

---

## Navigation globale

### Header fixe

```
[ Pulse          🔖  ☀️  ⚙️ ]
```

- `Pulse` : wordmark en Déclic, couleur `var(--link)`
- `🔖` : ouvre la page Sauvegardés
- `☀️` : toggle dark/light mode, persisté en localStorage
- `⚙️` : ouvre la page Admin (protégée par login)
- Background : `var(--header-bg)` avec `backdrop-filter: blur(12px)`
- Hauteur : 56px

### Bottom bar fixe

5 onglets : IA / UX / Tech / Hardware / Vidéo
- Icône de la charte + libellé en Saira, casse normale (brique « barre du bas » `.bb`)
- Onglet actif : couleur `var(--link)`
- Onglet inactif : couleur `var(--muted)`

---

## Écran : Feed (onglets IA / UX / Tech / Hardware / Vidéo)

### Filtre langue

Chips horizontales sous le header : `TOUS` / `FR` / `EN`
- Puces de la charte (`.pf`)
- `TOUS` actif par défaut
- Filtre persisté par onglet en localStorage (si tu filtres FR sur IA, ça reste FR quand tu reviens)

### Carte article (RSS, Reddit, Bluesky)

```
┌─────────────────────────────────────┐
│ [BADGE SOURCE]  [EN]          🔖    │
│                                     │
│ Titre de l'article en Déclic        │
│ 600 · 15.5px · line-height 1.3      │
│                                     │
│ Résumé tronqué sur 2 lignes en      │
│ muted · Saira 13px                  │
│                                     │
│ Auteur · il y a 2h                  │
└─────────────────────────────────────┘
```

- Carte coupée de la charte (`.cs > .in`, coupe 9 px)
- Badge source : badge de la charte ; RSS en accent (`.bg-acc`), Reddit, Bluesky et YouTube en neutre (`.bg-neu`) : bleu seul, les teintes hi/md/lo restent aux statuts
- Badge `EN` : badge neutre, visible uniquement si lang = en
- Icône marque-page : `var(--muted)` par défaut, `var(--link)` si is_saved = true
- État lu : `opacity: 0.65` sur la carte entière
- Tap sur la carte : ouvre le lecteur intégré (si content disponible) ou navigateur externe (fallback)
- Tap long sur le marque-page : toggle is_saved sans ouvrir l'article

### Carte vidéo (YouTube)

```
┌─────────────────────────────────────┐
│                                     │
│         MINIATURE PLEINE            │
│         LARGEUR · 16:9              │
│                              24:11  │
│                                     │
│ [YOUTUBE]  Nom de la chaîne         │
│ Titre de la vidéo en Déclic         │
│ Nom chaîne · il y a 3 j       🔖   │
└─────────────────────────────────────┘
```

- Miniature : coupée à 60°, durée en overlay bas-droite
- Tap : ouvre YouTube directement, pas de lecteur intégré

### Comportement du feed

- Tri : `published_at DESC`, les plus récents en premier
- Pagination : scroll infini, chargement par batch de 20 items
- Pas de mémorisation de position entre sessions : on repart toujours du haut
- Marquer comme lu : automatiquement au tap sur la carte

---

## Écran : Lecteur d'article

### Header lecteur

```
[ ←        Aa  🔖  ↗ ]
```

- `←` : retour au feed, position de scroll conservée
- `Aa` : ouvre le popover de taille de texte
- `🔖` : toggle is_saved
- `↗` : ouvre l'article dans le navigateur externe

### Contenu

- Nom de source en badge + date de publication : Saira 13px, `var(--muted)`
- Titre : Déclic, titre de page (`.h-page`), `var(--text)`
- Corps : font système (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), line-height 1.7, `var(--text)`
- Suit le thème global de l'app (dark ou light selon préférence utilisateur)

### Popover taille de texte (Aa)

Bottom sheet avec drag handle.
Trois chips : `S` (14px) / `M` (16px) / `L` (19px)
- `M` actif par défaut
- Préférence persistée en localStorage
- Se ferme au tap en dehors

### Fallback

Si `content` est null en base : tap sur la carte ouvre directement le navigateur externe sans passer par le lecteur.

---

## Écran : Sauvegardés

Accessible via icône `🔖` dans le header. Page dédiée, pas un onglet de la bottom bar.

### Filtres

**Filtre onglet source** (chips scrollables horizontalement) :
`TOUS` / `IA` / `UX` / `TECH` / `HARDWARE` / `VIDÉO`
- `TOUS` actif par défaut
- Mêmes puces de la charte

**Filtre période** (dropdown) :
- Options prédéfinies : Aujourd'hui / Cette semaine / Ce mois / 3 derniers mois
- Option supplémentaire : Période personnalisée → ouvre un date picker avec date début et date fin
- `Cette semaine` par défaut

Les deux filtres se combinent.

### Contenu

- Même format de cartes que le feed
- Tri : `published_at DESC` par défaut
- Les items sauvegardés ne sont jamais purgés automatiquement

---

## Écran : Admin

Accessible via icône `⚙️` dans le header. Protégé par login.

### Liste des sources

Pour chaque source :

```
┌─────────────────────────────────────┐
│ Lenny's Newsletter  [RSS] → IA  ●  │
│ Dernier fetch : il y a 23 min       │
│ 12 articles                         │
└─────────────────────────────────────┘
```

- Nom en Saira 500
- Badge type (RSS / Reddit / Bluesky / YouTube) coloré selon le même système que les cartes du feed
- Onglet de destination en `var(--muted)`
- Interrupteur de la charte (`Switch`), carte inactive en `opacity: 0.6`
- Ligne secondaire : Saira 13px, `var(--muted)`
- Si `last_fetch_error` non null : point rouge + texte `Erreur · il y a 2h` en `var(--hi)`

### Bouton flottant

`+` en bas à droite, bouton principal coupé de la charte, ombre en `drop-shadow` sur l'enveloppe.
Ouvre le formulaire d'ajout de source en bottom sheet.

### Formulaire source (bottom sheet)

Champs :
- Nom (texte)
- Type (select : RSS / Reddit / Bluesky / YouTube)
- URL ou handle
- Onglet de destination (select : IA / UX / Tech / Hardware / Vidéo)
- Mots-clés de filtrage (texte, optionnel, séparés par virgules)
- Filtre langue (select : Tous / FR / EN)

Bouton `Tester` : déclenche un fetch immédiat sur l'URL saisie et affiche le nombre d'articles trouvés avant de sauvegarder.

Bouton `Sauvegarder` : désactivé si champs obligatoires vides.

Suppression : bouton poubelle sur la carte source, confirmation en deux temps.

---

## Écran : Login

Affiché au premier lancement ou si token expiré / absent.

- Champ mot de passe unique
- Bouton `Entrer`
- Token stocké en localStorage après validation
- Pas de gestion multi-utilisateur

---

## États globaux à gérer

| État | Comportement |
|---|---|
| Chargement initial | Skeleton cards pendant le fetch API |
| Feed vide | Empty state : texte muted centré "Aucun article pour le moment" |
| Erreur réseau | Toast discret en bas d'écran |
| Source en erreur | Indicateur visible dans l'admin uniquement, pas dans le feed |
| Aucun sauvegardé | Empty state sur la page Sauvegardés |
