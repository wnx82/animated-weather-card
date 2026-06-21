const CARD_VERSION = '1.0.0';

const SCENE_ASSETS = {
  sunny: 'sunny.webp',
  'clear-night': 'clear-night.webp',
  partlycloudy: 'partlycloudy.webp',
  cloudy: 'cloudy.webp',
  rainy: 'rainy.webp',
  pouring: 'pouring.webp',
  snowy: 'snowy.webp',
  'snowy-rainy': 'snowy.webp',
  lightning: 'lightning.webp',
  'lightning-rainy': 'lightning.webp',
  fog: 'fog.webp',
  windy: 'windy.webp',
  'windy-variant': 'windy.webp',
  hail: 'windy.webp',
  exceptional: 'cloudy.webp'
};

const CONDITION_TRANSLATIONS = {
  sunny: 'Ensoleillé',
  'clear-night': 'Nuit claire',
  partlycloudy: 'Partiellement nuageux',
  cloudy: 'Nuageux',
  rainy: 'Pluvieux',
  pouring: 'Forte pluie',
  snowy: 'Neige',
  'snowy-rainy': 'Neige et pluie',
  lightning: 'Orage',
  'lightning-rainy': 'Orage pluvieux',
  fog: 'Brouillard',
  windy: 'Vent',
  'windy-variant': 'Vent',
  hail: 'Grêle',
  exceptional: 'Exceptionnel'
};

const DEFAULT_CONFIG = {
  type: 'custom:animated-weather-scene-card',
  entity: 'weather.home',
  title: 'Météo',
  height: 180,
  show_temperature: true,
  show_condition: false,
  show_forecast: false,
  use_assets: true,
  asset_path: '/local/community/animated-weather-scene-card/assets/',
  animation_speed: 'normal',
  radius: 20,
  text_color: '#ffffff',
  overlay: true
};

const SPEED_MAP = {
  slow: 0.75,
  normal: 1,
  fast: 1.5,
  turbo: 2
};

class AnimatedWeatherSceneCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { ...DEFAULT_CONFIG };
    this._assetCache = {};
    this._assetBase = DEFAULT_CONFIG.asset_path;
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Configuration manquante pour animated-weather-scene-card.');
    }

    this._config = {
      ...DEFAULT_CONFIG,
      ...config
    };

    if (!this._config.entity) {
      throw new Error("L'entité météo est requise. Exemple : weather.home");
    }

    if (typeof this._config.height === 'string') {
      const parsed = parseInt(this._config.height, 10);
      if (!Number.isNaN(parsed)) {
        this._config.height = parsed;
      }
    }

    this._config.radius = Number(this._config.radius) || DEFAULT_CONFIG.radius;
    this._config.animation_speed = String(this._config.animation_speed || DEFAULT_CONFIG.animation_speed).toLowerCase();
    if (!SPEED_MAP[this._config.animation_speed]) {
      this._config.animation_speed = DEFAULT_CONFIG.animation_speed;
    }
    this._config.text_color = this._config.text_color || DEFAULT_CONFIG.text_color;
    this._config.overlay = this._config.overlay !== false;
    this._config.asset_path = String(this._config.asset_path || DEFAULT_CONFIG.asset_path);
    this._assetBase = this._config.asset_path.replace(/\/+$|\/$/g, '/') + '/';
    this._render();
  }

  getCardSize() {
    return 3;
  }

  static getStubConfig() {
    return { ...DEFAULT_CONFIG };
  }

  static async getConfigElement() {
    if (!customElements.get('animated-weather-scene-card-editor')) {
      customElements.define('animated-weather-scene-card-editor', AnimatedWeatherSceneCardEditor);
    }
    return document.createElement('animated-weather-scene-card-editor');
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get _sceneSpeed() {
    return SPEED_MAP[this._config.animation_speed] || 1;
  }

  _normalizeSceneKey(condition) {
    if (!condition) {
      return 'exceptional';
    }

    const key = condition.toString().toLowerCase().trim();
    switch (key) {
      case 'partlycloudy':
      case 'partly_cloudy':
        return 'partlycloudy';
      case 'snowy-rainy':
      case 'snowy_rainy':
        return 'snowy-rainy';
      case 'lightning-rainy':
      case 'lightning_rainy':
        return 'lightning-rainy';
      case 'windy-variant':
      case 'windy_variant':
        return 'windy-variant';
      default:
        return Object.prototype.hasOwnProperty.call(SCENE_ASSETS, key) ? key : 'exceptional';
    }
  }

  _translateCondition(condition) {
    return CONDITION_TRANSLATIONS[condition] || condition || 'Inconnu';
  }

  _temperatureUnit(entity) {
    return entity?.attributes?.temperature_unit || (this._hass?.config?.unit_system?.temperature === 'F' ? 'F' : 'C');
  }

  _formatTemperature(entity) {
    const temperature = entity?.attributes?.temperature;
    if (temperature === undefined || temperature === null || Number.isNaN(Number(temperature))) {
      return '--';
    }
    return `${Math.round(temperature)}°${this._temperatureUnit(entity)}`;
  }

  _sceneAssetUrl(scene) {
    const assetFile = SCENE_ASSETS[scene] || SCENE_ASSETS.exceptional;
    return `${this._assetBase}${assetFile}`;
  }

  _ensureAsset(scene) {
    if (this._assetCache[scene] !== undefined) {
      return;
    }
    const url = this._sceneAssetUrl(scene);
    const image = new Image();
    image.onload = () => {
      this._assetCache[scene] = true;
      this._render();
    };
    image.onerror = () => {
      this._assetCache[scene] = false;
    };
    image.src = url;
  }

  _backgroundStyle(scene) {
    const hasAsset = this._config.use_assets && this._assetCache[scene];
    if (hasAsset) {
      return `background-image: url('${this._sceneAssetUrl(scene)}');`;
    }
    return '';
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    const config = this._config;
    const hass = this._hass;
    const entity = hass?.states?.[config.entity];
    const entityState = entity?.state || 'unknown';
    const sceneKey = entity ? this._normalizeSceneKey(entityState) : 'exceptional';
    const sceneClass = `scene ${sceneKey}`;
    const location = entity?.attributes?.friendly_name || config.title || config.entity;
    const temperature = entity && config.show_temperature ? this._formatTemperature(entity) : '';
    const conditionLabel = this._translateCondition(sceneKey);
    const backgroundStyle = this._backgroundStyle(sceneKey);

    if (config.use_assets) {
      this._ensureAsset(sceneKey);
    }

    const errorMessage = !entity
      ? `Impossible de trouver l'entité ${config.entity}. Vérifiez votre configuration.`
      : entityState === 'unknown' || entityState === 'unavailable'
      ? `Entité ${config.entity} non disponible (${entityState}).`
      : null;

    const cardContent = errorMessage
      ? `<div class="status-message">${errorMessage}</div>`
      : `
          <div class="card-text">
            <div class="card-location">${location}</div>
            ${temperature ? `<div class="card-temperature">${temperature}</div>` : ''}
            ${config.show_condition ? `<div class="card-condition">${conditionLabel}</div>` : ''}
          </div>
        `;

    const overlayClass = config.overlay ? 'overlay active' : 'overlay';
    const heightValue = Number(config.height) || DEFAULT_CONFIG.height;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: ${heightValue}px;
          height: ${heightValue}px;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .card {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: ${config.radius}px;
          background: #0f1726;
          color: ${config.text_color};
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 24px 50px rgba(0,0,0,0.2);
        }

        .scene {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: background 0.35s ease;
        }

        .scene.sunny { background: linear-gradient(180deg, #70b7ff 0%, #3e7de0 55%, #1a4ea8 100%); }
        .scene.clear-night { background: radial-gradient(circle at 22% 20%, #f2f8ff 0%, #1b2c5b 40%, #0a122a 100%); }
        .scene.partlycloudy { background: linear-gradient(180deg, #92c5ff 0%, #5d8ee0 50%, #2f5f9a 100%); }
        .scene.cloudy { background: linear-gradient(180deg, #7f8aa5 0%, #5b6e8d 50%, #2a3d5a 100%); }
        .scene.rainy,
        .scene.pouring,
        .scene.lightning,
        .scene['lightning-rainy'] { background: linear-gradient(180deg, #40577a 0%, #20304a 55%, #0d1726 100%); }
        .scene.snowy,
        .scene['snowy-rainy'],
        .scene.fog { background: linear-gradient(180deg, #9bb3c8 0%, #73869d 55%, #4a5c75 100%); }
        .scene.windy,
        .scene['windy-variant'],
        .scene.hail,
        .scene.exceptional { background: linear-gradient(180deg, #5f748f 0%, #3f5069 55%, #222f4b 100%); }

        .scene::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 22%);
          opacity: 0.8;
          animation: toneShift 14s ease-in-out infinite;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.36));
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .overlay.active {
          opacity: 1;
        }

        .content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          height: 100%;
          padding: 18px;
        }

        .card-text {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 18px 20px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .card-location {
          font-size: 0.95rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.84;
          color: ${config.text_color};
          font-weight: 700;
        }

        .card-temperature {
          font-size: clamp(2rem, 4vw, 3.6rem);
          font-weight: 800;
          line-height: 1;
          color: ${config.text_color};
        }

        .card-condition {
          font-size: 0.92rem;
          opacity: 0.75;
          color: ${config.text_color};
        }

        .status-message {
          width: 100%;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 18px;
          color: ${config.text_color};
          background: rgba(0, 0, 0, 0.35);
          border-radius: 18px;
          font-size: 0.98rem;
        }

        @keyframes toneShift {
          0%, 100% { opacity: 0.8; transform: translateX(0) translateY(0); }
          50% { opacity: 0.72; transform: translateX(4px) translateY(-4px); }
        }

        @media (max-width: 520px) {
          .content {
            padding: 14px;
          }

          .card-text {
            padding: 14px 16px;
            border-radius: 18px;
          }

          .card-temperature {
            font-size: clamp(1.8rem, 7vw, 3rem);
          }
        }
      </style>

      <div class="card ${sceneClass}" style="${backgroundStyle}">
        <div class="overlay ${overlayClass}"></div>
        <div class="scene"></div>
        <div class="content">
          ${cardContent}
        </div>
      </div>
    `;
  }
}

class AnimatedWeatherSceneCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render();
  }

  get _value() {
    return { ...this._config };
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
          color: var(--primary-text-color, #000);
        }

        .form-row {
          display: grid;
          gap: 10px;
          margin-bottom: 16px;
        }

        label {
          font-size: 0.95rem;
          font-weight: 600;
        }

        input[type='text'], input[type='number'], select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          font-size: 0.95rem;
        }

        .checkbox-row {
          display: grid;
          gap: 8px;
        }

        .checkbox-row label {
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }
      </style>

      <div class="form-row">
        <label>Entité météo</label>
        <input id="entity" type="text" value="${this._config.entity || ''}" />
      </div>
      <div class="form-row">
        <label>Titre / lieu</label>
        <input id="title" type="text" value="${this._config.title || ''}" />
      </div>
      <div class="form-row">
        <label>Hauteur (px)</label>
        <input id="height" type="number" min="120" value="${this._config.height || 180}" />
      </div>
      <div class="form-row">
        <label>Chemin des assets</label>
        <input id="asset_path" type="text" value="${this._config.asset_path || DEFAULT_CONFIG.asset_path}" />
      </div>
      <div class="form-row">
        <label>Vitesse d'animation</label>
        <select id="animation_speed">
          <option value="slow" ${this._config.animation_speed === 'slow' ? 'selected' : ''}>slow</option>
          <option value="normal" ${this._config.animation_speed === 'normal' ? 'selected' : ''}>normal</option>
          <option value="fast" ${this._config.animation_speed === 'fast' ? 'selected' : ''}>fast</option>
          <option value="turbo" ${this._config.animation_speed === 'turbo' ? 'selected' : ''}>turbo</option>
        </select>
      </div>
      <div class="form-row">
        <label>Rayon des coins</label>
        <input id="radius" type="number" min="0" value="${this._config.radius || DEFAULT_CONFIG.radius}" />
      </div>
      <div class="form-row">
        <label>Couleur du texte</label>
        <input id="text_color" type="text" value="${this._config.text_color || DEFAULT_CONFIG.text_color}" />
      </div>
      <div class="checkbox-row">
        <label><input id="show_temperature" type="checkbox" ${this._config.show_temperature ? 'checked' : ''} /> Afficher température</label>
        <label><input id="show_condition" type="checkbox" ${this._config.show_condition ? 'checked' : ''} /> Afficher condition (optionnel)</label>
        <label><input id="show_forecast" type="checkbox" ${this._config.show_forecast ? 'checked' : ''} /> Afficher prévisions (non visible si désactivé)</label>
        <label><input id="use_assets" type="checkbox" ${this._config.use_assets ? 'checked' : ''} /> Utiliser assets</label>
        <label><input id="overlay" type="checkbox" ${this._config.overlay ? 'checked' : ''} /> Activer overlay</label>
      </div>
    `;

    this.shadowRoot.querySelectorAll('input, select').forEach((element) => {
      element.addEventListener('change', () => this._valueChanged());
    });
  }

  _valueChanged() {
    const newConfig = {
      ...this._config,
      entity: this.shadowRoot.getElementById('entity')?.value || DEFAULT_CONFIG.entity,
      title: this.shadowRoot.getElementById('title')?.value || DEFAULT_CONFIG.title,
      height: Number(this.shadowRoot.getElementById('height')?.value) || DEFAULT_CONFIG.height,
      asset_path: this.shadowRoot.getElementById('asset_path')?.value || DEFAULT_CONFIG.asset_path,
      animation_speed: this.shadowRoot.getElementById('animation_speed')?.value || DEFAULT_CONFIG.animation_speed,
      radius: Number(this.shadowRoot.getElementById('radius')?.value) || DEFAULT_CONFIG.radius,
      text_color: this.shadowRoot.getElementById('text_color')?.value || DEFAULT_CONFIG.text_color,
      show_temperature: this.shadowRoot.getElementById('show_temperature')?.checked,
      show_condition: this.shadowRoot.getElementById('show_condition')?.checked,
      show_forecast: this.shadowRoot.getElementById('show_forecast')?.checked,
      use_assets: this.shadowRoot.getElementById('use_assets')?.checked,
      overlay: this.shadowRoot.getElementById('overlay')?.checked
    };
    this._config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }
}

customElements.define('animated-weather-scene-card', AnimatedWeatherSceneCard);
