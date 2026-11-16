# Sources — Pulse

Liste des sources initiales à seeder en base au premier lancement.
Toutes les sources sont actives par défaut sauf mention contraire.
Les sources Bluesky sont volontairement vides au démarrage — à configurer via l'interface admin.

---

## Onglet : IA Produit/PM (`ai_product`)

| Nom | Type | URL | Lang filter | Mots-clés |
|---|---|---|---|---|
| L'IA du Capitaine | rss | https://liaidublog.substack.com/feed | fr | |
| Génération IA | rss | https://generationia.flint.media/feed | fr | |
| ActuIA | rss | https://www.actuia.com/feed/ | fr | |
| TLDR AI | rss | https://tldr.tech/ai/rss | en | |
| UX Collective | rss | https://uxdesign.cc/feed | en | AI, product, design |

---

## Onglet : UX & Product (`ux_product`)

| Nom | Type | URL | Lang filter | Mots-clés |
|---|---|---|---|---|
| Lenny's Newsletter | rss | https://www.lennysnewsletter.com/feed | en | |
| Product Talk | rss | https://www.producttalk.org/feed/ | en | |
| SVPG | rss | https://www.svpg.com/feed/ | en | |

---

## Onglet : Tech général (`tech`)

| Nom | Type | URL | Lang filter | Mots-clés |
|---|---|---|---|---|
| Blog du Modérateur | rss | https://www.blogdumoderateur.com/feed/ | fr | |
| Cafétech | rss | https://cafetech.fr/feed/ | fr | |
| The Verge | rss | https://www.theverge.com/rss/index.xml | en | |
| Hacker News | rss | https://news.ycombinator.com/rss | en | |

---

## Onglet : Hardware & Actu (`hardware`)

| Nom | Type | URL | Lang filter | Mots-clés |
|---|---|---|---|---|
| Frandroid | rss | https://www.frandroid.com/feed | fr | |
| Les Numériques | rss | https://www.lesnumeriques.com/rss.xml | fr | |

---

## Onglet : Vidéo (`video`)

Les chaînes YouTube utilisent le flux RSS natif.
Format URL : `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`

| Nom | Type | Channel ID | Lang filter |
|---|---|---|---|
| Micode | youtube | UCqiMoXKBFgMQphiX1QJqGnQ | fr |
| e-penser 2.0 | youtube | UCcziTK2NKeWtWQ6kB5tmQ8Q | fr |
| Basti UI | youtube | UCEq2A3QiEi8igc3O7ohGHaw | fr |

---

## Bluesky (`ai_product`, `ux_product`, `tech`)

Aucun compte hardcodé. Les comptes Bluesky sont gérés exclusivement via l'interface admin.
À configurer au premier lancement en explorant les starter packs sur blueskystarterpack.com :
- Packs recommandés : "Product Management Voices", "Designsky", "Digital Product & Experience & Design"

---

## Notes de maintenance

- Vérifier la validité des URLs RSS au premier lancement, certaines peuvent avoir changé
- Reddit retiré le 16/11/2026 : ses flux RSS refusent les lecteurs anonymes (HTTP 429), l'API .json répond 403
- Frandroid et Les Numériques ont des flux très chargés, filtrage par mots-clés à affiner si trop de bruit
- Les Channel ID YouTube sont stables, ils ne changent pas si la chaîne est renommée
