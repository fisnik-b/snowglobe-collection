# ❄️ Snow Globe Collection

Une application web interactive pour afficher et explorer une collection de boules à neige du monde entier.

## 📁 Structure du Projet

```
snowglobe-collection/
├── index.html          # Structure HTML principale (~100 lignes)
├── css/
│   └── styles.css      # Tous les styles CSS (glassmorphism, responsive)
├── js/
│   ├── config.js       # Configuration (URL, drapeaux, couleurs)
│   ├── map.js          # Logique de la carte Leaflet
│   ├── stats.js        # Calculs et affichage des statistiques
│   └── main.js         # Initialisation et chargement des données
└── README.md           # Ce fichier
```

## 🚀 Fonctionnalités

- **Carte interactive** avec marqueurs personnalisés par continent
- **Statistiques en temps réel** (total, pays, continents)
- **Filtres par continent** avec couleurs distinctes
- **Liste des pays** avec 3+ boules à neige
- **Design glassmorphism** moderne et responsive
- **Source de données** Google Sheets (mise à jour automatique)

## 🛠️ Technologies

- **HTML5/CSS3/JavaScript** vanilla (pas de framework)
- **Leaflet.js** pour la carte interactive
- **PapaParse** pour parser le CSV
- **Google Fonts** (Inter)

## 📦 Installation

Aucune installation nécessaire ! C'est une application web statique.

### Option 1 : Ouvrir localement
```bash
# Ouvrir simplement index.html dans votre navigateur
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

### Option 2 : Serveur local
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# Puis ouvrir http://localhost:8000
```

## 🌐 Déploiement

### GitHub Pages (Gratuit et simple)
1. Push le code sur GitHub
2. Aller dans Settings > Pages
3. Sélectionner la branche `main`
4. Le site sera accessible à `https://[username].github.io/snowglobe-collection`

### Netlify / Vercel
Encore plus simple : connecter le repo GitHub et c'est déployé automatiquement !

## ⚙️ Configuration

### Modifier la source de données
Éditez `js/config.js` :
```javascript
const SHEET_URL = 'votre-url-google-sheets.csv';
```

### Ajouter des drapeaux
Dans `js/config.js` :
```javascript
const COUNTRY_FLAGS = {
    'Nouveau Pays': '🏳️',
    // ...
};
```

### Modifier les couleurs
Dans `js/config.js` et `css/styles.css`

## 📊 Format des Données

Le Google Sheet doit contenir ces colonnes :
- `city` : Nom de la ville
- `country` : Nom du pays
- `continent` : Continent (Europe, Asia, Africa, etc.)
- `latitude` : Latitude (nombre)
- `longitude` : Longitude (nombre)
- `photo` : URL de la photo (optionnel)

## 🎨 Personnalisation

### Changer le titre
`index.html` ligne 44-45

### Modifier les couleurs des continents
`js/config.js` ligne 75-82

### Ajuster le design
`css/styles.css`

## 📝 Licence

Projet personnel - Libre d'utilisation

## 👤 Auteur

Collection personnelle de boules à neige
