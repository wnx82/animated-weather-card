# Animated Weather Scene Card

Animated Weather Scene Card est une carte Lovelace Home Assistant inspirée de Nimbus Weather Card et Atmospheric Weather Card. Elle propose une présentation minimale : une image de fond selon l'état météo, le lieu et la température actuelle affichés dans l'image.

![Capture d'écran prévue](https://raw.githubusercontent.com/wnx82/animated-weather-card/main/assets/preview.png)

## Versioning

- Version actuelle : `1.0.0`
- Le numéro de version est déclaré dans `animated-weather-scene-card.js` et `package.json`.
- Le fichier `CHANGELOG.md` liste les versions et les évolutions.

## Installation manuelle

1. Copier le dossier `animated-weather-scene-card` dans `/config/www/community/`.
2. Ajouter la ressource Lovelace :

```yaml
resources:
  - url: /local/community/animated-weather-scene-card/animated-weather-scene-card.js
    type: module
```

3. Ajouter la carte :

```yaml
type: custom:animated-weather-scene-card
entity: weather.forecast_home
title: Météo
height: 180
show_temperature: true
show_condition: false
show_forecast: false
use_assets: true
asset_path: /local/community/animated-weather-scene-card/assets/
animation_speed: normal
radius: 20
text_color: "#ffffff"
overlay: true
```

## Installation HACS (Custom Repository)

1. Ajouter `https://github.com/wnx82/animated-weather-card` comme dépôt HACS personnalisé.
2. Chercher `Animated Weather Scene Card` dans la section Frontend.
3. Installer et redémarrer Home Assistant.
4. Ajouter la ressource : `/local/community/animated-weather-scene-card/animated-weather-scene-card.js`.

## Configuration YAML

Options disponibles :

- `type`: `custom:animated-weather-scene-card`
- `entity`: entité météo Home Assistant (`weather.home`, `weather.forecast_home`, etc.)
- `title`: texte affiché si l'entité n'a pas de friendly_name
- `height`: hauteur de la carte en pixels
- `show_temperature`: afficher la température actuelle
- `show_condition`: afficher l'état météo actuellement choisi (optionnel)
- `show_forecast`: définir si les prévisions doivent être présentes (option future)
- `use_assets`: utiliser des images personnalisées si disponibles
- `asset_path`: chemin vers les assets personnalisés
- `animation_speed`: vitesse d'animation (`slow`, `normal`, `fast`, `turbo`)
- `radius`: rayon des coins arrondis
- `text_color`: couleur du texte
- `overlay`: activer un overlay sombre pour la lisibilité

## États météo supportés

- `sunny`
- `clear-night`
- `partlycloudy`
- `cloudy`
- `rainy`
- `pouring`
- `snowy`
- `snowy-rainy`
- `lightning`
- `lightning-rainy`
- `fog`
- `windy`
- `windy-variant`
- `hail`
- `exceptional`

## Assets personnalisés

Placez vos images WebP ou GIF dans :

`/config/www/community/animated-weather-scene-card/assets/`

Nommez-les selon l'état météo :

- `sunny.webp`
- `clear-night.webp`
- `partlycloudy.webp`
- `cloudy.webp`
- `rainy.webp`
- `pouring.webp`
- `snowy.webp`
- `lightning.webp`
- `fog.webp`
- `windy.webp`

La carte utilise l'image personnalisée si elle est présente. Sinon, elle génère un fond CSS animé.

## Conseils de performance

- Favorisez des images WebP légères.
- Limitez les cartes animées par vue pour préserver les performances.
- Utilisez `height: 180` ou un format similaire pour garder la carte fluide sur mobile.

## Changelog

Consultez `CHANGELOG.md` pour l'historique des versions et des changements.
