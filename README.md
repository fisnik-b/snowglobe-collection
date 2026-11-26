# mySnowglobes

Ma collection de boules à neige sur un globe 3D interactif.
**Site :** https://fisnik-b.github.io/snowglobe-collection/

## Ajouter une boule à neige

1. **Google Sheets** « Snowglobe Collection » : ajouter une ligne.
2. **Photo** (facultatif) : déposer le fichier dans le dossier [`photos/`](photos/) sur GitHub
   (*Add file → Upload files*), puis écrire son nom dans la colonne `photo`.
3. C'est tout : le site relit le Sheets à chaque ouverture (Google met parfois quelques minutes à rafraîchir).

### Colonnes du Sheets

| Colonne | Obligatoire | Exemple | Rôle |
|---|---|---|---|
| `city` | oui | `Colombo` | Nom affiché |
| `country` | oui | `Sri Lanka` | Pays affiché |
| `country_code` | oui | `LK` | Code ISO à 2 lettres → drapeau automatique |
| `continent` | oui | `Asia` | Europe, Asia, Africa, North America, South America, Oceania |
| `latitude` / `longitude` | oui | `7.29` / `80.63` | Position sur le globe |
| `photo` | non | `colombo.jpg` | Fichier dans `photos/` |
| `date_added` | non | `2025-11` | Mois d'ajout → tri « Newest » et stats par année |
| `notes` | non | `Offerte par…` | Petit texte affiché sur la fiche |

Les colonnes facultatives peuvent être ajoutées à droite à tout moment ; le site les détecte par leur nom.

## Fonctionnalités

- Globe 3D qui tourne au démarrage, zoom fluide jusqu'à la ville
- Recherche (ville, pays, continent) et filtres par continent
- Panneau glissant : collection (tri récent / A–Z / pays) et statistiques
- Fiche par boule : photo, animation de neige, boule suivante/précédente (boutons, flèches ou balayage)
- Lien direct vers une boule : `…/snowglobe-collection/#colombo` (bouton **Share**)
- Icône pour « Ajouter à l'écran d'accueil » sur iPhone

## Structure

```
index.html            page
css/app.css           styles (thème sombre)
js/config.js          réglages : lien du Sheets, couleurs, point de référence
js/data.js            lecture du Sheets, drapeaux, statistiques
js/globe.js           globe 3D (MapLibre + OpenFreeMap)
js/ui.js              interface : filtres, recherche, panneau, fiche
js/app.js             assemblage
photos/               photos des boules à neige
assets/               icônes de l'app
```

## Technique

- [MapLibre GL JS](https://maplibre.org/) 5 (projection globe) via CDN, aucune étape de build
- Fond de carte [OpenFreeMap](https://openfreemap.org/) (gratuit, sans clé), recoloré en sombre
- Hébergement GitHub Pages (branche `main`, dossier racine)
- Tester en local : `python3 -m http.server` puis http://localhost:8000 (pas en double-cliquant sur le fichier)
