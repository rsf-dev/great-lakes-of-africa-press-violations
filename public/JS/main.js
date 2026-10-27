// JS/main.js  (Grands Lacs)
// ========================================================
// Fichier orchestrateur principal
// --------------------------------------------------------
// Rôle :
// - charger les données
// - initialiser la carte
// - gérer les filtres globaux
// - piloter les panneaux
// - synchroniser playback / liste / cartes / charts
//
// Ce fichier a été nettoyé pour refléter l'UI actuelle :
// - topbar de navigation
// - panel événements à gauche
// - panel pays / auteurs à droite
// - chart bottom piloté par la topbar
// ========================================================

// ========================================================
// 1) DEBUG / VERSIONING
// ========================================================

console.log("main.js loaded", import.meta.url);
window.addEventListener("error", (e) => console.error("window.error", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error("unhandledrejection", e.reason));

const ASSET_VERSION = new URL(import.meta.url).searchParams.get("v") || "dev";
const V = `?v=${encodeURIComponent(ASSET_VERSION)}`;

function withV(url) {
  return url.includes("?")
    ? `${url}&v=${encodeURIComponent(ASSET_VERSION)}`
    : `${url}${V}`;
}

async function importV(path) {
  const url = `${path}?v=${encodeURIComponent(ASSET_VERSION)}`;
  return import(url);
}

const { fetchResponse: fetch, validateEvents, parseCoordinate } = await importV("./utils/data.js");
const { REGLAGES, validerReglages } = await importV("./reglages.js");
validerReglages();
const MODULES = REGLAGES.fichiers.modules;
const moduleKeys = Object.keys(MODULES);
const loadedModules = await Promise.all(moduleKeys.map(key => importV(MODULES[key])));
const modules = Object.fromEntries(moduleKeys.map((key, index) => [key, loadedModules[index]]));
const { initUtilityMenu } = modules.menu;
const { initPanelScrollProgress } = modules.panelScroll;
const { dates, strings, security, bottomChart, eventsRenderer, legend, countryFilters, playback, i18n, tutorial, geojsonLevels, mapRendering, nearbyNavigation } = modules;
const { parseDateFlexible, getEventTime, formatDateFR, startOfDayUTC, startOfDay, endOfDay } = dates;
const { normalizeType } = strings;
const { escapeHtml, getSafeHttpUrl } = security;
const { BottomChart } = bottomChart;
const { EventsRenderer } = eventsRenderer;
const { LegendUI } = legend;
const { CountryFilters } = countryFilters;
const { createPlayback } = playback;
const { UI_STRINGS, applyStaticTextsForLang, getDisplayLabelForType: getI18nDisplayLabelForType } = i18n;
const { createTutorial } = tutorial;
const { createGeojsonLevelsController } = geojsonLevels;
const { createNearbyNavigator } = nearbyNavigation;
const { createBasemapLayer, createGeojsonRenderer, waitForBasemapReady, applyBasemapTheme, createBasemapControl, validateBasemaps } = mapRendering;


// ========================================================
// 2) CONFIG APP
// ========================================================

const FEATURES = REGLAGES.fonctionnalites;
const FILES = REGLAGES.fichiers;
const MAP_SETTINGS = REGLAGES.carte;
const MAP_CRS = { mercator: L.CRS.EPSG3857 }[MAP_SETTINGS.projection];
if (!MAP_CRS) throw new Error(`Projection non prise en charge : ${MAP_SETTINGS.projection}`);
const INITIAL_CENTER = MAP_SETTINGS.centreInitial;
const INITIAL_ZOOM = MAP_SETTINGS.zoomInitial;
const MIN_ZOOM = MAP_SETTINGS.zoomMinimum;
const MAX_ZOOM = MAP_SETTINGS.zoomMaximum;
const ICON_BASE_URL = FILES.assets.dossierIcones;
const iconUrl = (file) => withV(`${ICON_BASE_URL}${file}`);
const DEFAULT_ICON_URL = iconUrl(FILES.assets.iconeParDefaut);

const PLAYBACK_START_DATE_STR = REGLAGES.lecture.dateDebut;
const PLAYBACK_END_DATE_STR = REGLAGES.lecture.dateFin;
const PLAYBACK_END_TIME = PLAYBACK_END_DATE_STR ? endOfDay(parseDateFlexible(PLAYBACK_END_DATE_STR)?.getTime()) : null;
const PLAYBACK_START_TIME = parseDateFlexible(PLAYBACK_START_DATE_STR)?.getTime() || Date.UTC(2021, 0, 1);
const PLAYBACK_CUES = REGLAGES.lecture.reperes;

const COUNTRY_BORDER_STYLES = REGLAGES.stylesGeojson.frontieresParPays;
const DEFAULT_BORDER_STYLE = REGLAGES.stylesGeojson.contour;
const TYPE_COLORS = Object.assign(Object.create(null), Object.fromEntries(REGLAGES.categories.map(category => [category.cle, category.couleur])));
const TYPE_CONFIG = Object.assign(Object.create(null), Object.fromEntries(REGLAGES.categories.map(category => [category.cle, { slug: category.slug, file: category.icone }])));
const TYPE_MAP_EN_TO_FR = Object.assign(Object.create(null), Object.fromEntries(REGLAGES.categories.flatMap(category =>
  category.valeursEntree.filter(value => value !== category.cle).map(value => [value, category.cle])
)));

function getDisplayLabelForType(type, lang = currentLang) {
  const category = REGLAGES.categories.find(item => item.cle === type);
  return category?.labels?.[lang] || getI18nDisplayLabelForType(type, lang);
}


// ========================================================
// 3) ÉTAT GLOBAL
// ========================================================

let map;
let nearbyNavigator = null;
let activeBasemap = null;
let geojsonRenderer = null;
let basemapControl = null;
let basemapEntries = [];
let geojsonLevelsController = null;
let allEvents = [];
let currentLang = getInitialLanguage();
let languageChangeSeq = 0;

// filtres globaux
let selectedTypes = new Set();
let selectedCountry = null;
let selectedVille = null;
let selectedAuthor = null;

// listes disponibles
let countrysDisponibles = [];
let villesDisponibles = [];

// panel droit
let rightPanelView = REGLAGES.controles.statistiques.vueParDefaut;
let rightPanelVisibleTypes = new Set();
let rightChartRowsByContainer = new Map();

let regionsModeActive = Boolean(FEATURES.choropleth?.enabled && FEATURES.choropleth?.actifParDefaut);
let regionsChoroplethLayer = null;
let regionsChoroplethSeq = 0;
let regionsChoroplethCounts = new Map();
let regionsChoroplethMaxCount = 1;

// playback state
let playbackActive = false;
let playbackSpeed = 1;
let playbackTimer = null;
let playbackSequence = [];
let playbackIndex = -1;
let playbackWindowStartTime = PLAYBACK_START_TIME;
let playbackCutoffTime = null;

// geojson / layers
let bordersGeoData = null;
let bordersGeoPromise = null;
let borderRenderSeq = 0;
let borderLayer = null;
let currentCountryLayer = null;
let lastHighlightedCountry = null;

// cache données par langue
const dataByLang = { fr: null, en: null };

// loading state
let loadingProgress = 0;
let loadingOverlayDone = false;


// ========================================================
// 4) HELPERS GÉNÉRAUX
// ========================================================

function getAppUI() {
  return UI_STRINGS[currentLang]?.ui || UI_STRINGS.fr.ui;
}

function getAppState() {
  return {
    allEvents,
    selectedTypes,
    setSelectedTypes: (next) => { selectedTypes = next; }
  };
}

function getRightChartRowsMap(containerId) {
  if (!rightChartRowsByContainer.has(containerId)) {
    rightChartRowsByContainer.set(containerId, new Map());
  }
  return rightChartRowsByContainer.get(containerId);
}

function getTypeSlugFromCategory(category) {
  const cfg = TYPE_CONFIG[category];
  return cfg?.slug || normalizeType(category);
}

function buildEventId(ev) {
  const d = (ev.date || ev.date_evenement || ev.date_event || ev.date_iso || "").toString();
  return `event-${normalizeType(ev.lieu)}-${normalizeType(ev.journaliste)}-${normalizeType(d)}-${ev.compteur_evenements}`;
}

function getEventAuthor(ev) {
  return ev.auteur ?? ev.author ?? ev.auteur_infraction ?? null;
}

function getEventCountry(ev) {
  return ev.country || ev.Country || ev.oblast || ev.Oblast || null;
}

function getEventGeojsonName(ev) {
  return ev.geojson || ev.Geojson || null;
}

function getShapeNameForSelectedCountry(countryName) {
  if (!countryName) return null;
  const ev0 = allEvents.find(ev => (getEventCountry(ev) || "") === countryName);
  return ev0 ? getEventGeojsonName(ev0) : null;
}

function normalizeConfiguredEvent(event) {
  const pick = key => {
    for (const field of REGLAGES.champsDonnees[key] || []) {
      const value = event?.[field];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  };
  return {
    ...event,
    date: pick("date") ?? event.date,
    lieu: pick("emplacement") ?? event.lieu,
    journaliste: pick("personne") ?? event.journaliste,
    description: pick("description") ?? event.description,
    type_violence: pick("categorie") ?? event.type_violence,
    auteur: pick("auteur") ?? event.auteur ?? event.author,
    country: pick("pays") ?? event.country ?? event.Country ?? event.oblast ?? event.Oblast,
    geojson: pick("nomGeojson") ?? event.geojson ?? event.Geojson,
    lat: parseCoordinate(pick("latitude") ?? event.lat, 90),
    lng: parseCoordinate(pick("longitude") ?? event.lng, 180),
    compteur_evenements: pick("identifiant") ?? event.compteur_evenements,
    lien: pick("lien") ?? event.lien ?? event.link
  };
}

function getFeatureShapeName(feature) {
  const p = feature?.properties || {};
  return p.NAM_0 || p.ISO_A3 || p.WB_A3 || p.ISO_A2 || "";
}

function getCountryDisplayNameForShape(shapeName) {
  if (!shapeName) return null;
  const key = normalizeKey(shapeName);
  const ev = (allEvents || []).find(item => normalizeKey(getEventGeojsonName(item)) === key);
  return ev ? getEventCountry(ev) : shapeName;
}

function hexToRgb(hex) {
  const clean = String(hex).replace("#", "");
  const value = parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function mixHexColor(from, to, t) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const x = Math.max(0, Math.min(1, t));
  const c = {
    r: Math.round(a.r + (b.r - a.r) * x),
    g: Math.round(a.g + (b.g - a.g) * x),
    b: Math.round(a.b + (b.b - a.b) * x)
  };
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

function getRegionCountColor(count, maxCount) {
  if (!count) return REGLAGES.choropleth.couleurSansCas;
  const t = maxCount > 0 ? Math.log1p(count) / Math.log1p(maxCount) : 0;
  return mixHexColor(REGLAGES.choropleth.couleurMinimum, REGLAGES.choropleth.couleurMaximum, t);
}

function eventPassesRegionsChoroplethFilters(ev) {
  const typeOK = selectedTypes.size === 0 || selectedTypes.has(ev.type_violence);
  const authorOK = !selectedAuthor || getEventAuthor(ev) === selectedAuthor;
  const playbackOK = eventPassesPlaybackWindow(ev);
  return typeOK && authorOK && playbackOK;
}

function getSelectedTypesLabel() {
  const allTypes = Object.keys(TYPE_CONFIG);
  if (selectedTypes.size === 0 || selectedTypes.size === allTypes.length) return null;

  return Array.from(selectedTypes)
    .map(type => getDisplayLabelForType(type, currentLang))
    .join(", ");
}

function getAllEventTypes() {
  return Array.from(new Set((allEvents || []).map(ev => ev.type_violence))).filter(Boolean);
}

function hasActiveTitleFilters() {
  const allTypeCount = getAllEventTypes().length;
  const allTypesSelected = allTypeCount === 0 || selectedTypes.size === 0 || selectedTypes.size === allTypeCount;
  return Boolean(selectedCountry || selectedVille || selectedAuthor || !isPlaybackWindowDefault()) || !allTypesSelected;
}

function syncTitleClearButton() {
  const clearBtn = document.getElementById("title-clear-filters");
  if (clearBtn) clearBtn.hidden = !hasActiveTitleFilters();
}


// ========================================================
// 5) TOPBAR / NAVIGATION
// ========================================================

function updateTopbarTexts() {
  const ui = getAppUI();

  const navEvents = document.getElementById("nav-events");
  const navCountries = document.getElementById("nav-countries");
  const navAuthors = document.getElementById("nav-authors");
  const navChart = document.getElementById("nav-chart");

  if (navEvents) navEvents.textContent = ui.topNavEvents ?? "Panneau des événements";
  if (navCountries) navCountries.textContent = ui.topNavCountries ?? "Comparer les pays et villes";
  if (navAuthors) navAuthors.textContent = ui.topNavAuthors ?? "Comparer les auteurs";
  if (navChart) navChart.textContent = ui.topNavChart ?? "Graphique d’évolution";
}

function isBottomChartExpanded() {
  return document.getElementById("bottom-chart-panel")?.classList.contains("open") || false;
}

function syncTopbarNavState() {
  const eventPanelOpen = document.getElementById("event-panel")?.classList.contains("expanded");
  const countryPanelOpen = document.getElementById("country-panel")?.classList.contains("expanded");
  const chartOpen = isBottomChartExpanded();

  document.getElementById("nav-events")?.classList.toggle("is-active", !!eventPanelOpen);
  document.getElementById("nav-countries")?.classList.toggle(
    "is-active",
    !!countryPanelOpen && rightPanelView === "pays"
  );
  document.getElementById("nav-authors")?.classList.toggle(
    "is-active",
    !!countryPanelOpen && rightPanelView === "auteurs"
  );
  document.getElementById("nav-chart")?.classList.toggle("is-active", chartOpen);

  document.getElementById("utility-events-toggle")?.classList.toggle("active", !!eventPanelOpen);
  const regionsBtn = document.getElementById("utility-regions-mode-toggle");
  regionsBtn?.classList.toggle("active", regionsModeActive);
  regionsBtn?.setAttribute("aria-pressed", regionsModeActive ? "true" : "false");
  document.getElementById("utility-countries-toggle")?.classList.toggle(
    "active",
    !!countryPanelOpen && rightPanelView === "pays"
  );
  document.getElementById("utility-authors-toggle")?.classList.toggle(
    "active",
    !!countryPanelOpen && rightPanelView === "auteurs"
  );
  document.getElementById("utility-chart-toggle")?.classList.toggle("active", chartOpen);
}

function openEventsPanelFromNav() {
  const isOpen = document.getElementById("event-panel")?.classList.contains("expanded");
  setPanelExpanded(!isOpen);
}

function openCountriesPanelFromNav() {
  const panel = document.getElementById("country-panel");
  const isSameViewOpen = panel?.classList.contains("expanded") && rightPanelView === "pays";

  if (isSameViewOpen) {
    setRightPanelExpanded(false);
  } else {
    setRightPanelView("pays");
    setRightPanelExpanded(true);
  }
}

function openAuthorsPanelFromNav() {
  const panel = document.getElementById("country-panel");
  const isSameViewOpen = panel?.classList.contains("expanded") && rightPanelView === "auteurs";

  if (isSameViewOpen) {
    setRightPanelExpanded(false);
  } else {
    setRightPanelView("auteurs");
    setRightPanelExpanded(true);
  }
}

function openBottomChartFromNav() {
  BottomChart.toggle(updateBottomChart);
  requestAnimationFrame(syncTopbarNavState);
}


// ========================================================
// 6) UI FILTRES / COLLAPSE
// ========================================================

function updateRightPanelIndicators() {
  const dotFilter = document.getElementById("dot-filter");
  const hasFilters = !!(
    selectedCountry ||
    selectedVille ||
    selectedAuthor ||
    selectedTypes.size < Object.keys(TYPE_CONFIG).length
  );

  dotFilter?.classList.toggle("active", hasFilters);
  syncTitleClearButton();
}

function updateActiveFiltersUI() {
  const listEl = document.getElementById("active-filters-list");
  const clearBtn = document.getElementById("clear-all-filters-left");
  const ui = getAppUI();

  if (!listEl) return;

  listEl.innerHTML = "";
  const chips = [];

  if (selectedCountry) {
    chips.push(`${ui.filterByCountry ?? "Pays"} : ${selectedCountry}`);
  }

  if (selectedVille) {
    chips.push(`${ui.cityLabel ?? "Ville"} : ${selectedVille}`);
  }

  if (selectedAuthor) {
    chips.push(`${ui.filterByAuthor ?? "Auteur"} : ${selectedAuthor}`);
  }

  const typesLabel = getSelectedTypesLabel();
  if (typesLabel) {
    chips.push(`${ui.filterByType ?? "Type"} : ${typesLabel}`);
  }

  if (chips.length === 0) {
    const empty = document.createElement("span");
    empty.className = "active-filters-empty";
    empty.textContent = ui.noActiveFilters ?? "Aucun filtre actif";
    listEl.appendChild(empty);
    clearBtn?.classList.add("hidden");
    return;
  }

  chips.forEach(label => {
    const el = document.createElement("span");
    el.className = "active-filter-chip";
    el.textContent = label;
    listEl.appendChild(el);
  });

  if (clearBtn) {
    clearBtn.classList.remove("hidden");
    clearBtn.textContent = ui.clearFilters ?? "Supprimer les filtres";
  }
}

function setupCollapse({ btnId, bodyId, storageKey = null, defaultCollapsed = false }) {
  const btn = document.getElementById(btnId);
  const body = document.getElementById(bodyId);
  if (!btn || !body) return;

  const load = () => {
    if (!storageKey) return defaultCollapsed;
    try {
      const v = localStorage.getItem(storageKey);
      return v === null ? defaultCollapsed : v === "1";
    } catch { return defaultCollapsed; }
  };

  const save = (isCollapsed) => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, isCollapsed ? "1" : "0"); } catch { /* Stockage désactivé dans certains contextes intégrés. */ }
  };

  const apply = (isCollapsed) => {
    body.classList.toggle("is-collapsed", isCollapsed);
    btn.textContent = isCollapsed ? "▸" : "▾";
    btn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    save(isCollapsed);
  };

  let collapsed = load();
  apply(collapsed);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    collapsed = !collapsed;
    apply(collapsed);
  });
}



function setPanelExpanded(expanded) {
  const panel = document.getElementById("event-panel");
  if (!panel) return;

  const shouldExpand = expanded === "toggle"
    ? !panel.classList.contains("expanded")
    : !!expanded;
  const countryPanel = document.getElementById("country-panel");

  panel.classList.toggle("expanded", shouldExpand);
  panel.classList.toggle("collapsed", !shouldExpand);

  if (shouldExpand) {
    countryPanel?.classList.remove("expanded");
    countryPanel?.classList.add("collapsed");
  }

  syncTopbarNavState();
}

function setRightPanelExpanded(expanded) {
  const panel = document.getElementById("country-panel");
  if (!panel) return;

  const shouldExpand = expanded === "toggle"
    ? !panel.classList.contains("expanded")
    : !!expanded;
  const eventPanel = document.getElementById("event-panel");

  panel.classList.toggle("expanded", shouldExpand);
  panel.classList.toggle("collapsed", !shouldExpand);

  if (shouldExpand) {
    eventPanel?.classList.remove("expanded");
    eventPanel?.classList.add("collapsed");
  }

  syncTopbarNavState();
}

function setRightPanelView(nextView, { force = false } = {}) {
  if (nextView !== "pays" && nextView !== "auteurs") return;
  if (!force && rightPanelView === nextView) return;

  rightPanelView = nextView;

  document.getElementById("right-view-pays")?.classList.toggle("hidden", rightPanelView !== "pays");
  document.getElementById("right-view-auteurs")?.classList.toggle("hidden", rightPanelView !== "auteurs");

  renderRightPanelBody();
  syncTopbarNavState();
}

function renderRightPanelBody() {
  const title = document.getElementById("country-name");
  const ui = getAppUI();
  if (title) title.textContent = rightPanelView === "auteurs" ? ui.menuAuthors : ui.menuCountries;

  ensureRightPanelLegend({
    onChange: () => {
      if (rightPanelView === "auteurs") renderAuthorsStackedChart();
      else renderCountriesAndCitiesCharts();
    }
  });

  if (rightPanelView === "auteurs") renderAuthorsStackedChart();
  else renderCountriesAndCitiesCharts();
}

function renderCountriesAndCitiesCharts() {
  renderOverviewStackedChart("countrys", {
    containerId: "country-chart-container",
    showTabs: false
  });

  renderOverviewStackedChart("villes", {
    containerId: "cities-chart-container",
    showTabs: false
  });
}


// ========================================================
// 9) LISTE / FOCUS EVENT
// ========================================================

function highlightEventInList(ev) {
  const targetId = buildEventId(ev);
  const target = document.getElementById(targetId);
  const list = document.getElementById("event-list");
  if (!target || !list) return;

  const EMBED_MODE = window.self !== window.top;

  setTimeout(() => {
    if (!EMBED_MODE) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    } else {
      const listRect = list.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const top = list.scrollTop + (targetRect.top - listRect.top) - 12;
      list.scrollTo({ top, behavior: "auto" });
    }

    target.classList.add("highlighted");
    setTimeout(() => target.classList.remove("highlighted"), 1500);
  }, 150);
}

function spiderfyIfClustered(clusterGroup, marker, { zoom = null } = {}) {
  if (!clusterGroup || !marker) return;

  if (Number.isFinite(zoom) && map.getZoom() < zoom) {
    map.setZoom(zoom, { animate: true });
  }

  clusterGroup.zoomToShowLayer(marker, () => {
    const parent = clusterGroup.getVisibleParent(marker);
    if (parent && parent !== marker && typeof parent.spiderfy === "function") parent.spiderfy();
    if (marker.getLatLng) map.panTo(marker.getLatLng(), { animate: true });
  });
}

function focusEventInList(ev) {
  setPanelExpanded(true);
  highlightEventInList(ev);
}

function focusEventOnMap(ev, marker = null) {
  if (marker?.getLatLng) {
    map.setView(marker.getLatLng(), map.getZoom(), { animate: true });
  } else if (Number.isFinite(ev?.lat) && Number.isFinite(ev?.lng)) {
    map.setView([ev.lat, ev.lng], map.getZoom(), { animate: true });
  }

  spiderfyIfClustered(EventsRenderer.getClusterGroup(), marker, { zoom: null });
}

function focusEvent(ev, marker = null) {
  focusEventInList(ev);
  focusEventOnMap(ev, marker);
}


// ========================================================
// 10) GEOJSON / BORDERS / HIGHLIGHT
// ========================================================

function normalizeKey(v) {
  return v == null ? null : String(v).trim().toLowerCase();
}

function getBorderKeyFromFeature(f) {
  const p = f?.properties || {};
  return normalizeKey(p.NAM_0 || p.ISO_A3 || p.WB_A3 || p.ISO_A2 || null);
}

function featureMatchesKey(f, key) {
  const k = normalizeKey(key);
  return !!k && getBorderKeyFromFeature(f) === k;
}

async function loadBordersGeojson() {
  if (bordersGeoData) return bordersGeoData;
  if (!bordersGeoPromise) {
    bordersGeoPromise = (async () => {
      const response = await fetch(withV(FILES.geojson.frontieres));
      if (!response.ok) throw new Error("GeoJSON " + FILES.geojson.frontieres + ": HTTP " + response.status);
      bordersGeoData = await response.json();
      return bordersGeoData;
    })().catch(error => {
      bordersGeoPromise = null;
      throw error;
    });
  }
  return bordersGeoPromise;
}

function clearCountryHighlight() {
  if (currentCountryLayer && map) {
    map.removeLayer(currentCountryLayer);
    currentCountryLayer = null;
  }
}

async function highlightCountryByShapeName(shapeName) {
  if (!shapeName || !map) return;
  if (regionsModeActive) return;
  if (lastHighlightedCountry === shapeName) return;

  lastHighlightedCountry = shapeName;
  clearCountryHighlight();

  const data = await loadBordersGeojson();
  if (!data || regionsModeActive || lastHighlightedCountry !== shapeName) return;

  const feature = (data.features || []).find(f => featureMatchesKey(f, shapeName));
  if (!feature) return;

  currentCountryLayer = geojsonRenderer.createLayer(feature, {
    style: REGLAGES.stylesGeojson.selection,
    interactive: false,
    className: "country-highlight"
  }).addTo(map);
}

async function highlightCountryForEvent(ev) {
  const shapeName = getEventGeojsonName(ev);
  if (!shapeName) return;
  return highlightCountryByShapeName(shapeName);
}

async function loadBorderLayer() {
  if (!map || !FEATURES.frontieres?.enabled || regionsModeActive) return;
  const seq = ++borderRenderSeq;
  const data = await loadBordersGeojson();
  if (seq !== borderRenderSeq || regionsModeActive || borderLayer) return;
  borderLayer = geojsonRenderer.createLayer(data, {
    style: feature => ({ ...DEFAULT_BORDER_STYLE, ...(COUNTRY_BORDER_STYLES[feature.properties?.ISO_A3] || {}) }),
    interactive: false,
    className: "ukraine-border"
  }).addTo(map);
  const bounds = borderLayer.getBounds();
  if (MAP_SETTINGS.ajusterVueFrontieres && bounds.isValid()) {
    map.fitBounds(bounds, { maxZoom: Math.min(MAP_SETTINGS.zoomMaximumFrontieres, MAX_ZOOM) });
  }
}

function removeBorderLayer() {
  borderRenderSeq++;
  if (borderLayer && map) {
    map.removeLayer(borderLayer);
  }
  borderLayer = null;
}

function getRegionCountLabel(count) {
  return currentLang === "en"
    ? (count === 1 ? "1 case" : `${count} cases`)
    : (count === 1 ? "1 cas" : `${count} cas`);
}

function clearRegionsChoroplethLayer({ cancelPending = false } = {}) {
  if (cancelPending) regionsChoroplethSeq++;
  if (regionsChoroplethLayer && map) {
    map.removeLayer(regionsChoroplethLayer);
  }
  regionsChoroplethLayer = null;
}

function getRegionTooltipContent(shapeName) {
  const label = getCountryDisplayNameForShape(shapeName) || shapeName;
  const count = regionsChoroplethCounts.get(normalizeKey(shapeName)) || 0;
  return `${escapeHtml(label)} · ${escapeHtml(getRegionCountLabel(count))}`;
}

function getRegionChoroplethStyle(feature) {
  const shapeName = getFeatureShapeName(feature);
  const count = regionsChoroplethCounts.get(normalizeKey(shapeName)) || 0;
  const opacity = count ? REGLAGES.choropleth.opaciteAvecCas : REGLAGES.choropleth.opaciteSansCas;
  return {
    stroke: true,
    fill: true,
    color: REGLAGES.choropleth.contour,
    weight: REGLAGES.choropleth.epaisseurContour,
    opacity: 1,
    fillColor: getRegionCountColor(count, regionsChoroplethMaxCount),
    fillOpacity: opacity
  };
}

async function renderRegionsChoroplethLayer() {
  if (!map || !regionsModeActive) {
    clearRegionsChoroplethLayer({ cancelPending: true });
    return;
  }

  const seq = ++regionsChoroplethSeq;
  const data = await loadBordersGeojson();
  if (!data || seq !== regionsChoroplethSeq || !regionsModeActive) return;

  const validShapes = new Set(data.features.map(feature => normalizeKey(getFeatureShapeName(feature))).filter(Boolean));
  const countsByShape = new Map();
  for (const ev of (allEvents || []).filter(eventPassesRegionsChoroplethFilters)) {
    const shapeName = getEventGeojsonName(ev);
    const key = normalizeKey(shapeName);
    if (!key || !validShapes.has(key)) continue;
    countsByShape.set(key, (countsByShape.get(key) || 0) + 1);
  }

  regionsChoroplethCounts = countsByShape;
  regionsChoroplethMaxCount = Math.max(1, ...countsByShape.values());

  // Les filtres changent les couleurs et les compteurs, pas les geometries.
  if (regionsChoroplethLayer) {
    regionsChoroplethLayer.setStyle(getRegionChoroplethStyle);
    regionsChoroplethLayer.eachLayer(layer => {
      layer.getTooltip()?.setContent(getRegionTooltipContent(getFeatureShapeName(layer.feature)));
    });
    return;
  }

  regionsChoroplethLayer = geojsonRenderer.createLayer(data, {
    pane: "overlayPane",
    className: "regions-choropleth-layer",
    style: getRegionChoroplethStyle,
    onEachFeature: (feature, layer) => {
      const shapeName = getFeatureShapeName(feature);
      layer.bindTooltip(getRegionTooltipContent(shapeName), {
        sticky: true,
        direction: "top",
        className: "regions-choropleth-tooltip"
      });

      layer.on({
        tooltipopen: event => {
          event.tooltip.setContent(getRegionTooltipContent(shapeName));
        },
        click: (e) => {
          L.DomEvent.stop(e);
          e?.originalEvent?.target?.blur?.();
          if (!regionsChoroplethCounts.get(normalizeKey(shapeName))) return;
          const nextOblast = getCountryDisplayNameForShape(shapeName);
          if (nextOblast) applyTitleCountryFilter(nextOblast);
        }
      });
    }
  }).addTo(map);
}

function setRegionsMode(active) {
  const next = Boolean(active && FEATURES.choropleth?.enabled);
  if (regionsModeActive === next) return;

  regionsModeActive = next;
  lastHighlightedCountry = null;
  clearCountryHighlight();

  if (regionsModeActive) {
    removeBorderLayer();
  } else {
    clearRegionsChoroplethLayer({ cancelPending: true });
    loadBorderLayer().catch(showLoadingError);
  }

  afficherEvenements();
  syncTopbarNavState();
}

async function zoomToCountry(countryName) {
  if (!map || !countryName) return;

  const data = await loadBordersGeojson();
  if (!data) return;

  const key = getShapeNameForSelectedCountry(countryName);
  if (!key) return;

  const feature = (data.features || []).find(f => featureMatchesKey(f, key));
  if (!feature) return;

  const bounds = L.geoJSON(feature).getBounds();
  if (!bounds?.isValid?.() || !bounds.isValid()) return;

  map.fitBounds(bounds, {
    padding: [30, 30],
    maxZoom: map.getZoom(),
    animate: true
  });
}


// ========================================================
// 12) CHARTS DROITS / LÉGENDE DROITE
// ========================================================

function initRightPanelVisibleTypes() {
  if (rightPanelVisibleTypes.size === 0) {
    Object.keys(TYPE_CONFIG).forEach(t => rightPanelVisibleTypes.add(t));
  }
}

function ensureRightPanelLegend({ onChange } = {}) {
  const legend = document.getElementById("right-panel-legend");
  if (!legend) return;

  initRightPanelVisibleTypes();
  legend.innerHTML = "";

  Object.keys(TYPE_CONFIG).forEach(type => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "chart-tab-btn right-panel-legend-button";
    item.classList.toggle("active", rightPanelVisibleTypes.has(type));
    item.setAttribute("aria-pressed", String(rightPanelVisibleTypes.has(type)));

    const sw = document.createElement("span");
    sw.className = "bottom-chart-swatch";
    sw.style.background = TYPE_COLORS[type] || REGLAGES.stylesGeojson?.fallbackColor || "#999";
    sw.setAttribute("aria-hidden", "true");

    const lab = document.createElement("span");
    lab.textContent = getDisplayLabelForType(type, currentLang);

    item.appendChild(sw);
    item.appendChild(lab);

    item.addEventListener("click", () => {
      if (rightPanelVisibleTypes.has(type)) rightPanelVisibleTypes.delete(type);
      else rightPanelVisibleTypes.add(type);

      item.classList.toggle("active", rightPanelVisibleTypes.has(type));
      item.setAttribute("aria-pressed", String(rightPanelVisibleTypes.has(type)));
      onChange?.();
    });

    legend.appendChild(item);
  });
}

async function updateCountryPanel(_countryName) {
  renderRightPanelBody();
}

function buildStackedCountsByGroup({
  groupBy,
  onlyCountry = null,
  startTime = null,
  cutoffTime = null,
  ignoreCountryFilter = false,
  ignoreVilleFilter = false,
  ignoreAuthorFilter = false
}) {
  initRightPanelVisibleTypes();

  const allCats = Object.keys(TYPE_CONFIG);
  const counts = Object.create(null);

  const keyFn = (ev) => {
    if (groupBy === "villes") return ev.lieu || null;
    if (groupBy === "authors") return getEventAuthor(ev) || null;
    return getEventCountry(ev) || null;
  };

  for (const ev of allEvents) {
    if (selectedTypes.size !== 0 && !selectedTypes.has(ev.type_violence)) continue;

    if (!eventPassesPlaybackWindow(ev, { startTime, cutoffTime })) continue;

    if (!ignoreAuthorFilter && selectedAuthor) {
      if (getEventAuthor(ev) !== selectedAuthor) continue;
    }

    if (!ignoreCountryFilter && selectedCountry) {
      if (getEventCountry(ev) !== selectedCountry) continue;
    }

    if (!ignoreVilleFilter && selectedVille) {
      if (ev.lieu !== selectedVille) continue;
    }

    if (groupBy === "villes" && onlyCountry && getEventCountry(ev) !== onlyCountry) continue;

    const groupKey = keyFn(ev);
    if (!groupKey) continue;

    const type = ev.type_violence;
    if (!TYPE_CONFIG[type]) continue;
    if (!rightPanelVisibleTypes.has(type)) continue;

    if (!counts[groupKey]) {
      counts[groupKey] = {};
      for (const cat of allCats) counts[groupKey][cat] = 0;
    }

    counts[groupKey][type] += 1;
  }

  const rows = Object.entries(counts).map(([name, byType]) => {
    const total = allCats.reduce((acc, cat) => acc + (byType[cat] || 0), 0);
    return { name, byType, total };
  });

  rows.sort((a, b) => b.total - a.total);

  return { rows, allCats };
}

function getOrCreateRightChartWrapper(container) {
  let chartWrapper = container.querySelector(".chart-bars");

  if (!chartWrapper) {
    container.innerHTML = "";
    chartWrapper = document.createElement("div");
    chartWrapper.className = "chart-bars";
    container.appendChild(chartWrapper);
  }

  return chartWrapper;
}

function upsertRightChartRow({ chartWrapper, name, allCats, rowsMap }) {
  let entry = rowsMap.get(name);
  if (entry && entry.rowEl?.isConnected) return entry;

  const row = document.createElement("div");
  row.className = "chart-bar-row";
  row.style.willChange = "transform";

  const label = document.createElement("span");
  label.className = "chart-bar-label";
  label.textContent = name;

  const bar = document.createElement("div");
  bar.className = "chart-bar";

  const value = document.createElement("span");
  value.className = "chart-bar-value";
  value.textContent = "0";

  row.appendChild(label);
  row.appendChild(bar);
  row.appendChild(value);
  chartWrapper.appendChild(row);

  const segElsByType = new Map();
  for (const cat of allCats) {
    const seg = document.createElement("div");
    seg.className = `chart-bar-segment chart-bar-fill chart-bar-fill-${getTypeSlugFromCategory(cat)}`;
    seg.style.width = "0%";
    seg.style.transition = "width 220ms ease";
    bar.appendChild(seg);
    segElsByType.set(cat, seg);
  }

  entry = { rowEl: row, labelEl: label, valueEl: value, segElsByType };
  rowsMap.set(name, entry);
  return entry;
}

function animateReorderFLIPWithFirst(items, firstTopByEl) {
  requestAnimationFrame(() => {
    for (const it of items) {
      const row = it.rowEl;
      const firstTop = firstTopByEl.get(row);
      if (firstTop == null) continue;

      const lastTop = row.getBoundingClientRect().top;
      const dy = firstTop - lastTop;
      if (!dy) continue;

      row.style.transition = "none";
      row.style.transform = `translateY(${dy}px)`;

      requestAnimationFrame(() => {
        row.style.transition = "transform 220ms ease";
        row.style.transform = "translateY(0)";
      });
    }
  });
}

function renderOverviewStackedChart(groupBy, opts = {}) {
  const containerId = opts.containerId ?? "country-chart-container";
  const container = document.getElementById(containerId);
  if (!container) return;

  const rowsMap = getRightChartRowsMap(containerId);
  const ui = getAppUI();

  const onlyCountry = groupBy === "villes" ? selectedCountry : null;
  const startTime = getPlaybackWindowStartTime();

  const { rows, allCats } = buildStackedCountsByGroup({
    groupBy,
    onlyCountry,
    startTime,
    cutoffTime: playbackCutoffTime,
    ignoreCountryFilter: groupBy === "countrys",
    ignoreVilleFilter: groupBy === "villes" || groupBy === "countrys",
    ignoreAuthorFilter: groupBy === "authors"
  });

  if (!rows.length) {
    container.innerHTML = `<p class="chart-placeholder">${ui.chartNoEvents ?? "Aucune donnée"}</p>`;
    return;
  }

  const MAX_ROWS = groupBy === "villes"
    ? REGLAGES.controles.statistiques.lignesMaximumVilles
    : groupBy === "authors"
      ? REGLAGES.controles.statistiques.lignesMaximumAuteurs
      : REGLAGES.controles.statistiques.lignesMaximumPays;
  const shown = rows.slice(0, MAX_ROWS);
  const maxTotal = shown[0]?.total || 1;

  const chartWrapper = getOrCreateRightChartWrapper(container);

  const usedNames = new Set();
  const rowEntries = [];
  const firstTopByEl = new Map();

  for (const { name } of shown) {
    const entry = upsertRightChartRow({ chartWrapper, name, allCats, rowsMap });
    entry.rowEl.style.display = "";
    usedNames.add(name);
    rowEntries.push(entry);
    firstTopByEl.set(entry.rowEl, entry.rowEl.getBoundingClientRect().top);
  }

  for (const [name, entry] of rowsMap.entries()) {
    if (!entry?.rowEl?.isConnected) continue;
    if (!usedNames.has(name)) {
      entry.rowEl.style.display = "none";
      entry.rowEl.style.order = "9999";
    }
  }

  shown.forEach(({ name, byType, total }, idx) => {
    const entry = rowsMap.get(name);
    if (!entry) return;

    entry.rowEl.style.order = String(idx);
    entry.rowEl.classList.toggle(
      "is-current-country",
      (groupBy === "countrys" && selectedCountry && name === selectedCountry) ||
      (groupBy === "villes" && selectedVille && name === selectedVille) ||
      (groupBy === "authors" && selectedAuthor && name === selectedAuthor)
    );

    entry.valueEl.textContent = String(total);
    entry.labelEl.style.cursor = "pointer";
    entry.labelEl.title = currentLang === "en" ? "Filter" : "Filtrer";

    entry.labelEl.onclick = () => {
      Playback.pause?.();

      if (groupBy === "countrys") {
        selectedCountry = name;
        selectedVille = null;

        villesDisponibles = Array.from(
          new Set(allEvents.filter(ev => getEventCountry(ev) === name).map(ev => ev.lieu))
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

        updateCountryPanel(name);
        setRightPanelExpanded(true);

        const ev0 = allEvents.find(ev => getEventCountry(ev) === name);
        if (ev0) highlightCountryForEvent(ev0);

        zoomToCountry(name);
        setPanelExpanded(true);
        afficherEvenements();
        return;
      }

      if (groupBy === "villes") {
        const ville = name;
        const ev0 = allEvents.find(ev =>
          ev.lieu === ville && (!selectedCountry || getEventCountry(ev) === selectedCountry)
        );

        const co = ev0 ? getEventCountry(ev0) : null;

        if (!co) {
          selectedVille = ville;
          afficherEvenements();
          return;
        }

        selectedCountry = co;
        selectedVille = ville;

        villesDisponibles = Array.from(
          new Set(allEvents.filter(ev => getEventCountry(ev) === co).map(ev => ev.lieu))
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

        setPanelExpanded(true);
        updateCountryPanel(co);
        setRightPanelExpanded(true);

        if (ev0) highlightCountryForEvent(ev0);
        afficherEvenements();

        if (Number.isFinite(ev0?.lat) && Number.isFinite(ev0?.lng) && map) {
          map.setView([ev0.lat, ev0.lng], Math.min(7, MAX_ZOOM), { animate: true });
        }

        return;
      }

      if (groupBy === "authors") {
        selectedAuthor = name;
        setPanelExpanded(true);
        setRightPanelExpanded(true);
        updateBottomChart(true);
        afficherEvenements();
      }
    };

    const totalWidthPct = (total / maxTotal) * 100;

    for (const cat of allCats) {
      const v = byType[cat] || 0;
      const seg = entry.segElsByType.get(cat);
      if (!seg) continue;

      const segPct = total > 0 ? (v / total) * totalWidthPct : 0;
      seg.style.width = `${segPct}%`;
      seg.style.display = v > 0 ? "block" : "none";
    }
  });

  animateReorderFLIPWithFirst(rowEntries, firstTopByEl);
}

function renderAuthorsStackedChart() {
  renderOverviewStackedChart("authors", {
    containerId: "authors-chart-container",
    showTabs: false
  });
}


// ========================================================
// 13) BOTTOM CHART / PLAYBACK DATE
// ========================================================

function formatDayLabelUTC(dayTs) {
  return formatDateFR(dayTs);
}

function formatDateInputValue(ts) {
  if (!Number.isFinite(ts)) return "";
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInputValue(value, { endOfDayValue = false } = {}) {
  const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return endOfDayValue ? endOfDay(ts) : ts;
}

function getPlaybackTimelineMaxTime() {
  const eventTimes = (allEvents || [])
    .map(ev => getEventTime(ev))
    .filter(Number.isFinite);
  let maxTime = eventTimes.length ? Math.max(...eventTimes) : PLAYBACK_START_TIME;
  if (Number.isFinite(PLAYBACK_END_TIME)) maxTime = Math.min(maxTime, PLAYBACK_END_TIME);
  return endOfDay(maxTime);
}

function getPlaybackWindowStartTime() {
  return Number.isFinite(playbackWindowStartTime) ? playbackWindowStartTime : PLAYBACK_START_TIME;
}

function getPlaybackWindowEndTime() {
  return Number.isFinite(playbackCutoffTime) ? playbackCutoffTime : getPlaybackTimelineMaxTime();
}

function eventPassesPlaybackWindow(ev, { startTime = getPlaybackWindowStartTime(), cutoffTime = playbackCutoffTime } = {}) {
  const t = getEventTime(ev);
  if (!Number.isFinite(t)) return false;
  if (Number.isFinite(startTime) && t < startTime) return false;
  if (cutoffTime !== null && Number.isFinite(cutoffTime) && t > cutoffTime) return false;
  return true;
}

function updatePlaybackDateUI() {
  const el = document.querySelector(".playback-date");
  if (!el) return;

  if (playbackCutoffTime == null) {
    el.textContent = "";
    return;
  }

  const startTime = getPlaybackWindowStartTime();
  el.textContent = Number.isFinite(startTime)
    ? `${formatDateFR(startTime)} - ${formatDateFR(playbackCutoffTime)}`
    : formatDateFR(playbackCutoffTime);
}

function setPlaybackWindowStartFromTimeline(ts, { allowBeforeMin = false, allowBeyondMax = false, ignoreCurrentEnd = false } = {}) {
  Playback.pause?.();

  const dayStart = startOfDayUTC(ts);
  if (!Number.isFinite(dayStart)) return;

  const defaultMinStart = startOfDayUTC(PLAYBACK_START_TIME);
  const minStart = allowBeforeMin ? Math.min(defaultMinStart, dayStart) : defaultMinStart;
  const timelineMaxStart = startOfDayUTC(getPlaybackTimelineMaxTime());
  const maxStart = allowBeyondMax ? Math.max(timelineMaxStart, dayStart) : timelineMaxStart;
  const endDay = !ignoreCurrentEnd && Number.isFinite(playbackCutoffTime) ? startOfDayUTC(playbackCutoffTime) : null;
  const upperBound = Number.isFinite(endDay) ? Math.min(endDay, maxStart) : maxStart;
  const nextStart = Math.min(Math.max(dayStart, minStart), upperBound);

  playbackWindowStartTime = nextStart;
  updatePlaybackDateUI?.();
}

function setPlaybackCutoffFromTimeline(ts, { allowBeforeMin = false, allowBeyondMax = false } = {}) {
  Playback.pause?.();

  const startTime = getPlaybackWindowStartTime();
  const minEnd = Number.isFinite(startTime)
    ? startOfDayUTC(startTime) + (24 * 3600 * 1000) - 1
    : null;
  const maxEnd = allowBeyondMax ? Math.max(getPlaybackTimelineMaxTime(), endOfDay(ts)) : getPlaybackTimelineMaxTime();
  const defaultMinBound = PLAYBACK_START_TIME;
  const minBound = Number.isFinite(minEnd)
    ? minEnd
    : (allowBeforeMin ? Math.min(defaultMinBound, ts) : defaultMinBound);
  const nextCutoff = Math.min(Math.max(ts, minBound), maxEnd);

  let idx = -1;
  for (let i = 0; i < playbackSequence.length; i++) {
    const t = getEventTime(playbackSequence[i]);
    if (!Number.isFinite(t)) continue;
    if (t <= nextCutoff) idx = i;
    else break;
  }

  setPlaybackState({
    playbackCutoffTime: nextCutoff,
    playbackIndex: idx
  });

  updatePlaybackDateUI?.();
}

function updateBottomChart(force = false) {
  BottomChart.update({
    force,

    getState: () => ({
      allEvents,
      selectedTypes,
      selectedCountry,
      selectedVille,
      playbackActive,
      playbackWindowStartTime: getPlaybackWindowStartTime(),
      playbackCutoffTime,
      currentLang,
      getEventCountry,
      selectedAuthor,
      getEventAuthor
    }),

    pausePlayback: Playback.pause,
    render: afficherEvenements,

    setPlaybackWindowStartTime: setPlaybackWindowStartFromTimeline,
    setPlaybackCutoffTime: setPlaybackCutoffFromTimeline,

    getDisplayLabelForType: (type) => getDisplayLabelForType(type, currentLang),
    typeConfigKeys: Object.keys(TYPE_CONFIG),
    typeColors: TYPE_COLORS,
    formatDayLabelUTC,
    getEventTime,
    startOfDayUTC,
    playbackStartTime: PLAYBACK_START_TIME,
    playbackMaxTime: getPlaybackTimelineMaxTime()
  });
}


// ========================================================
// 14) ICÔNES
// ========================================================

function createMarkerIcon(type) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return L.icon({ iconUrl: DEFAULT_ICON_URL, iconSize: [24, 24] });

  const element = document.createElement("div");
  element.className = "marker-icon marker-" + normalizeType(cfg.slug);
  element.style.backgroundImage = "url(" + JSON.stringify(iconUrl(cfg.file)) + ")";
  return L.divIcon({
    html: element,
    className: "",
    iconSize: [36, 36],
    popupAnchor: [0, -12]
  });
}

function createLegendIcon(type) {
  const cfg = TYPE_CONFIG[type];
  const url = cfg ? iconUrl(cfg.file) : DEFAULT_ICON_URL;
  return L.icon({ iconUrl: url, iconSize: [36, 36] });
}

function getLegendIconUrl(type) {
  return createLegendIcon(type).options.iconUrl;
}


// ========================================================
// 15) RENDU ÉVÉNEMENTS
// ========================================================

function populateTitleCountrySelect() {
  const select = document.getElementById("title-country-select");
  if (!select) return;

  const previous = selectedCountry || "";
  select.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = currentLang === "en" ? "All countries" : "Tous les pays";
  select.appendChild(optAll);

  (countrysDisponibles || []).forEach(country => {
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    select.appendChild(opt);
  });

  select.value = (countrysDisponibles || []).includes(previous) ? previous : "";
}

function populateTitleAuthorSelect() {
  const select = document.getElementById("title-author-select");
  if (!select) return;

  const previous = selectedAuthor || "";
  const authors = Array.from(new Set(allEvents.map(ev => getEventAuthor(ev))))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

  select.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = currentLang === "en" ? "All authors" : "Tous les auteurs";
  select.appendChild(optAll);

  authors.forEach(author => {
    const opt = document.createElement("option");
    opt.value = author;
    opt.textContent = author;
    select.appendChild(opt);
  });

  select.value = authors.includes(previous) ? previous : "";
}

function getTitleCalendarLabel(key) {
  const labels = {
    calendarStart: currentLang === "en" ? "Start" : "Début",
    calendarEnd: currentLang === "en" ? "End" : "Fin"
  };
  return labels[key] || key;
}

function isPlaybackWindowDefault() {
  const startTime = getPlaybackWindowStartTime();
  const endTime = getPlaybackWindowEndTime();
  return Number.isFinite(startTime) &&
    Number.isFinite(endTime) &&
    startOfDayUTC(startTime) === startOfDayUTC(PLAYBACK_START_TIME) &&
    startOfDayUTC(endTime) >= startOfDayUTC(getPlaybackTimelineMaxTime());
}

function syncTitleCalendarControls() {
  const startInput = document.getElementById("title-calendar-start");
  const endInput = document.getElementById("title-calendar-end");
  const startControl = document.getElementById("title-calendar-start-button");
  const endControl = document.getElementById("title-calendar-end-button");
  const startLabel = document.getElementById("title-calendar-start-label");
  const endLabel = document.getElementById("title-calendar-end-label");
  if (!startInput && !endInput && !startControl && !endControl) return;

  const startTime = getPlaybackWindowStartTime();
  const endTime = getPlaybackWindowEndTime();
  const minValue = formatDateInputValue(PLAYBACK_START_TIME);
  const maxValue = formatDateInputValue(getPlaybackTimelineMaxTime());
  const startValue = formatDateInputValue(startTime);
  const endValue = formatDateInputValue(endTime);
  const startIsDefault = startOfDayUTC(startTime) === startOfDayUTC(PLAYBACK_START_TIME);
  const endIsDefault = startOfDayUTC(endTime) >= startOfDayUTC(getPlaybackTimelineMaxTime());

  if (startLabel) startLabel.textContent = getTitleCalendarLabel("calendarStart");
  if (endLabel) endLabel.textContent = getTitleCalendarLabel("calendarEnd");

  if (startInput) {
    startInput.min = minValue;
    startInput.max = endValue || maxValue;
    startInput.value = startValue;
    startInput.title = formatDateFR(startTime);
  }

  if (startControl) {
    startControl.title = formatDateFR(startTime);
    startControl.setAttribute("aria-label", `${getTitleCalendarLabel("calendarStart")} ${formatDateFR(startTime)}`);
  }

  if (endInput) {
    endInput.min = startValue || minValue;
    endInput.max = maxValue;
    endInput.value = endValue;
    endInput.title = formatDateFR(endTime);
  }

  if (endControl) {
    endControl.title = formatDateFR(endTime);
    endControl.setAttribute("aria-label", `${getTitleCalendarLabel("calendarEnd")} ${formatDateFR(endTime)}`);
  }

  startControl?.classList.toggle("active", !startIsDefault);
  endControl?.classList.toggle("active", !endIsDefault);
}

function openTitleDateInput(input) {
  if (!input) return;

  if (input.type !== "date") input.type = "date";
  input.focus({ preventScroll: true });

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch (err) {
      // showPicker can fail for visually hidden inputs; click fallback below.
    }
  }

  input.click();
}

function applyTitleCalendarInputs() {
  const startInput = document.getElementById("title-calendar-start");
  const endInput = document.getElementById("title-calendar-end");

  const nextStart = parseDateInputValue(startInput?.value);
  const nextEnd = parseDateInputValue(endInput?.value, { endOfDayValue: true });

  if (Number.isFinite(nextStart)) setPlaybackWindowStartFromTimeline(nextStart);
  if (Number.isFinite(nextEnd)) setPlaybackCutoffFromTimeline(nextEnd);

  afficherEvenements();
  renderRightPanelBody();
  updateBottomChart(true);
  syncTitleFilterControls();
}

function resetPlaybackWindowToDefault() {
  playbackWindowStartTime = PLAYBACK_START_TIME;
  setPlaybackCutoffFromTimeline(getPlaybackTimelineMaxTime());
}

function syncTitleFilterControls() {
  const countrySelect = document.getElementById("title-country-select");
  if (countrySelect && countrySelect.value !== (selectedCountry || "")) {
    countrySelect.value = selectedCountry || "";
  }

  const authorSelect = document.getElementById("title-author-select");
  if (authorSelect && authorSelect.value !== (selectedAuthor || "")) {
    authorSelect.value = selectedAuthor || "";
  }

  syncTitleCalendarControls();

  const villeSelect = document.getElementById("ville-select");
  syncTitleClearButton();
  if (!villeSelect) return;

  const hasCountry = Boolean(selectedCountry);
  if (!hasCountry && selectedVille) {
    selectedVille = null;
  }

  const villes = hasCountry
    ? (villesDisponibles.length ? villesDisponibles : getVillesForCountry(selectedCountry))
    : getAllVilles();

  if (selectedVille && !villes.includes(selectedVille)) {
    selectedVille = null;
  }

  populateTitleVilleSelect(villes);
  villeSelect.classList.remove("hidden");
  villeSelect.disabled = !hasCountry;
  villeSelect.classList.toggle("is-muted", !hasCountry);
  villeSelect.setAttribute("aria-disabled", hasCountry ? "false" : "true");
  villeSelect.title = hasCountry
    ? ""
    : (currentLang === "en" ? "Select a country first" : "Sélectionnez d'abord un pays");
  syncTitleClearButton();
}

function populateTitleVilleSelect(villes) {
  const select = document.getElementById("ville-select");
  if (!select) return;

  const previous = selectedVille || "";
  select.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = currentLang === "en" ? "All cities" : "Toutes les villes";
  select.appendChild(optAll);

  (villes || []).forEach(ville => {
    const opt = document.createElement("option");
    opt.value = ville;
    opt.textContent = ville;
    select.appendChild(opt);
  });

  select.value = (villes || []).includes(previous) ? previous : "";
  select.onchange = () => {
    Playback.pause?.();
    selectedVille = select.value || null;

    afficherEvenements();

    if (!selectedVille || !map) return;
    const ev0 = allEvents.find(ev =>
      ev.lieu === selectedVille && (!selectedCountry || getEventCountry(ev) === selectedCountry)
    );
    if (ev0 && Number.isFinite(ev0.lat) && Number.isFinite(ev0.lng)) {
      map.setView([ev0.lat, ev0.lng], 7, { animate: true });
    }
  };
}

function getVillesForCountry(country) {
  return Array.from(
    new Set(
      allEvents
        .filter(ev => getEventCountry(ev) === country)
        .map(ev => ev.lieu)
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

function getAllVilles() {
  return Array.from(new Set((allEvents || []).map(ev => ev.lieu)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

function applyTitleCountryFilter(country) {
  Playback.pause?.();

  selectedCountry = country || null;
  selectedVille = null;
  villesDisponibles = selectedCountry ? getVillesForCountry(selectedCountry) : [];

  if (selectedCountry) {
    setRightPanelView("pays");
    setRightPanelExpanded(true);
    updateCountryPanel(selectedCountry);
    const ev0 = allEvents.find(ev => getEventCountry(ev) === selectedCountry);
    if (ev0) highlightCountryForEvent(ev0);
    zoomToCountry(selectedCountry);
  } else {
    clearCountryHighlight();
    lastHighlightedCountry = null;
    updateCountryPanel(null);
  }

  afficherEvenements();
  syncTitleFilterControls();
}

function applyTitleAuthorFilter(author) {
  Playback.pause?.();
  selectedAuthor = author || null;

  if (selectedAuthor) {
    setRightPanelView("auteurs");
    setRightPanelExpanded(true);
  }

  afficherEvenements();
  syncTitleFilterControls();
}

function initRsfCartographyModal() {
  const trigger = document.getElementById("rsf-cartography-toggle");
  const modal = document.getElementById("rsf-cartography-modal");
  const closeButton = document.getElementById("rsf-cartography-close");
  if (!trigger || !modal) return;

  const closeModal = () => {
    modal.hidden = true;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  const openModal = () => {
    const utilityMenu = document.getElementById("utility-menu");
    const utilityPanel = document.getElementById("utility-menu-panel");
    const utilityToggle = document.getElementById("utility-menu-toggle");
    utilityMenu?.classList.remove("open");
    if (utilityPanel) utilityPanel.hidden = true;
    utilityToggle?.setAttribute("aria-expanded", "false");

    modal.hidden = false;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    closeButton?.focus();
  };

  trigger.addEventListener("click", openModal);
  modal.querySelectorAll("[data-close-rsf-cartography]").forEach(button => {
    button.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
}

function applyConfiguredControls() {
  const visibleByFeature = {
    "nav-events": FEATURES.listeCas?.enabled,
    "nav-countries": FEATURES.statistiques?.enabled,
    "nav-authors": FEATURES.auteurs?.enabled,
    "nav-chart": FEATURES.chronologie?.enabled,
    "utility-events-toggle": FEATURES.listeCas?.enabled,
    "utility-regions-mode-toggle": FEATURES.choropleth?.enabled,
    "utility-countries-toggle": FEATURES.statistiques?.enabled,
    "utility-authors-toggle": FEATURES.auteurs?.enabled,
    "utility-chart-toggle": FEATURES.chronologie?.enabled,
    "rsf-cartography-toggle": FEATURES.rsfCartographie?.enabled,
    "tutorial-replay-btn": FEATURES.tutoriel?.enabled,
    "title-calendar-start-button": FEATURES.lecture?.enabled,
    "title-calendar-end-button": FEATURES.lecture?.enabled,
    "playback-prev": FEATURES.lecture?.enabled && REGLAGES.controles.lecture.afficherPrecedent,
    "playback-toggle": FEATURES.lecture?.enabled && REGLAGES.controles.lecture.afficherLecturePause,
    "playback-next": FEATURES.lecture?.enabled && REGLAGES.controles.lecture.afficherSuivant,
    "playback-end": FEATURES.lecture?.enabled && REGLAGES.controles.lecture.afficherFin,
    "playback-speed": FEATURES.lecture?.enabled,
    "title-clear-filters": REGLAGES.controles.panneauTitre.afficherEffacerFiltres
  };
  for (const [id, visible] of Object.entries(visibleByFeature)) {
    const element = document.getElementById(id);
    if (!element) continue;
    element.hidden = !visible;
    element.style.display = visible ? "" : "none";
  }

  const filterControls = [
    ["title-country-select", REGLAGES.controles.panneauTitre.afficherPays],
    ["ville-select", REGLAGES.controles.panneauTitre.afficherEmplacement],
    ["title-author-select", REGLAGES.controles.panneauTitre.afficherAuteur],
    ["title-calendar-start-button", REGLAGES.controles.panneauTitre.afficherDates && FEATURES.lecture?.enabled],
    ["title-calendar-end-button", REGLAGES.controles.panneauTitre.afficherDates && FEATURES.lecture?.enabled],
    ["header-legend", REGLAGES.controles.panneauTitre.afficherCategories]
  ];
  filterControls.forEach(([id, visible]) => {
    const element = document.getElementById(id);
    if (element) {
      element.hidden = !visible;
      element.style.display = visible ? "" : "none";
    }
  });

  const titlePanel = document.getElementById("app-topbar");
  const titleToggle = document.getElementById("map-title-toggle");
  const collapsed = !REGLAGES.controles.panneauTitre.ouvertParDefaut;
  titlePanel?.classList.toggle("collapsed", collapsed);
  titleToggle?.setAttribute("aria-expanded", String(!collapsed));

  const languageControl = document.querySelector(".language-toggle");
  if (languageControl) {
    languageControl.hidden = !FEATURES.langues?.enabled;
    languageControl.querySelectorAll("[data-lang]").forEach(button => {
      button.hidden = !REGLAGES.projet.langues.includes(button.dataset.lang);
    });
  }
  document.querySelectorAll("#playback-speed option").forEach(option => {
    option.hidden = !REGLAGES.controles.lecture.vitesses.map(String).includes(option.value);
  });
  const speed = document.getElementById("playback-speed");
  if (speed) speed.value = String(REGLAGES.controles.lecture.vitesseParDefaut);

  const nav = document.querySelector(".app-topbar-nav");
  const navIds = { evenements: "nav-events", pays: "nav-countries", auteurs: "nav-authors", chronologie: "nav-chart" };
  REGLAGES.controles.menu.ordreNavigation.forEach(key => {
    const button = document.getElementById(navIds[key]);
    if (button && nav) nav.appendChild(button);
  });
  const utilityMenu = document.getElementById("utility-menu-panel");
  const utilityIds = {
    langues: ".utility-menu-field",
    tutoriel: "#tutorial-replay-btn",
    evenements: "#utility-events-toggle",
    choropleth: "#utility-regions-mode-toggle",
    pays: "#utility-countries-toggle",
    auteurs: "#utility-authors-toggle",
    chronologie: "#utility-chart-toggle",
    rsfCartographie: "#rsf-cartography-toggle"
  };
  if (utilityMenu) {
    const orderedItems = REGLAGES.controles.menu.ordrePanneau
      .map(key => utilityMenu.querySelector(utilityIds[key]))
      .filter(Boolean);
    utilityMenu.replaceChildren(...orderedItems);
  }

  document.title = REGLAGES.projet.titreHtml;
  document.querySelector('meta[name="robots"]')?.setAttribute("content", REGLAGES.projet.indexationMoteurs ? "index, follow" : "noindex, nofollow");
  const logo = document.querySelector(".app-topbar-logo img");
  if (logo) logo.src = withV(FILES.assets.logo);
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = withV(FILES.assets.favicon);
  const stylesheet = document.querySelector('link[rel="stylesheet"][href^="css/"]');
  if (stylesheet) stylesheet.href = withV(FILES.assets.feuilleDeStyle);
  document.querySelectorAll(".rsf-cartography-link").forEach((link, index) => {
    const card = REGLAGES.cartesLiees[index];
    if (!card) return;
    const safeHref = getSafeHttpUrl(card.href);
    if (safeHref) link.href = safeHref;
    else { link.removeAttribute("href"); link.hidden = true; }
    const image = link.querySelector("img");
    if (image) image.src = withV(card.image);
  });
}

function initHarmonizedShell() {
  initPanelScrollProgress({ getLanguage: () => currentLang });
  applyConfiguredControls();
  const titlePanel = document.getElementById("app-topbar");
  const titleToggle = document.getElementById("map-title-toggle");
  const countrySelect = document.getElementById("title-country-select");
  const authorSelect = document.getElementById("title-author-select");
  const calendarStartButton = document.getElementById("title-calendar-start-button");
  const calendarEndButton = document.getElementById("title-calendar-end-button");
  const calendarStart = document.getElementById("title-calendar-start");
  const calendarEnd = document.getElementById("title-calendar-end");

  const toggleTitle = () => {
    if (!titlePanel || !titleToggle) return;
    titlePanel.classList.toggle("collapsed");
    titleToggle.setAttribute("aria-expanded", titlePanel.classList.contains("collapsed") ? "false" : "true");
  };

  titleToggle?.addEventListener("click", toggleTitle);
  titleToggle?.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTitle();
    }
  });

  countrySelect?.addEventListener("change", () => applyTitleCountryFilter(countrySelect.value));
  authorSelect?.addEventListener("change", () => applyTitleAuthorFilter(authorSelect.value));
  calendarStartButton?.addEventListener("click", (event) => {
    event.preventDefault();
    openTitleDateInput(calendarStart);
  });
  calendarEndButton?.addEventListener("click", (event) => {
    event.preventDefault();
    openTitleDateInput(calendarEnd);
  });
  calendarStartButton?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openTitleDateInput(calendarStart);
  });
  calendarEndButton?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openTitleDateInput(calendarEnd);
  });
  calendarStart?.addEventListener("change", applyTitleCalendarInputs);
  calendarEnd?.addEventListener("change", applyTitleCalendarInputs);
  document.getElementById("title-clear-filters")?.addEventListener("click", () => clearAllFilters({ resetZoom: false }));


  document.getElementById("utility-events-toggle")?.addEventListener("click", openEventsPanelFromNav);
  document.getElementById("utility-regions-mode-toggle")?.addEventListener("click", () => setRegionsMode(!regionsModeActive));
  document.getElementById("utility-countries-toggle")?.addEventListener("click", openCountriesPanelFromNav);
  document.getElementById("utility-authors-toggle")?.addEventListener("click", openAuthorsPanelFromNav);
  document.getElementById("utility-chart-toggle")?.addEventListener("click", openBottomChartFromNav);
  document.getElementById("close-event-panel")?.addEventListener("click", () => setPanelExpanded(false));
  document.getElementById("close-country-panel")?.addEventListener("click", () => setRightPanelExpanded(false));
  document.getElementById("close-bottom-chart")?.addEventListener("click", () => {
    BottomChart.hide();
    syncTopbarNavState();
  });
  initRsfCartographyModal();
  syncTopbarNavState();
}

function afficherEvenements({ renderGeography = true } = {}) {
  EventsRenderer.render({
    allEvents,
    selectedTypes,
    selectedCountry,
    selectedVille,
    selectedAuthor,

    getEventAuthor,

    playbackWindowStartTime: getPlaybackWindowStartTime(),
    playbackCutoffTime,
    currentLang,

    getEventTime,
    getEventCountry,
    startOfDayUTC,
    formatDateFR,
    buildEventId,
    normalizeType,

    getDisplayLabelForType: (type) => getDisplayLabelForType(type, currentLang),

    createMarkerIcon,
    getLegendIconUrl,

    pausePlayback: Playback.pause,
    focusEvent,
    setRightPanelExpanded,
    updateHeaderLegendCounts: LegendUI.updateHeaderLegendCounts,
    updateBottomChart,
    caseFields: REGLAGES.listeCas?.champsSupplementaires || [],

    attachToMap: !regionsModeActive || Boolean(selectedCountry)
  });

  if (renderGeography && regionsModeActive) renderRegionsChoroplethLayer().catch(showLoadingError);
  else if (renderGeography) clearRegionsChoroplethLayer();

  renderRightPanelBody();
  updateRightPanelIndicators();
  updateActiveFiltersUI();
  syncTitleFilterControls();
  nearbyNavigator?.refresh();
}


// ========================================================
// 16) PLAYBACK MODULE
// ========================================================

function getPlaybackState() {
  return {
    allEvents,
    playbackActive,
    playbackSpeed,
    playbackTimer,
    playbackSequence,
    playbackIndex,
    playbackWindowStartTime,
    playbackCutoffTime
  };
}

function setPlaybackState(patch) {
  if ("playbackActive" in patch) playbackActive = patch.playbackActive;
  if ("playbackSpeed" in patch) playbackSpeed = patch.playbackSpeed;
  if ("playbackTimer" in patch) playbackTimer = patch.playbackTimer;
  if ("playbackSequence" in patch) playbackSequence = patch.playbackSequence;
  if ("playbackIndex" in patch) playbackIndex = patch.playbackIndex;
  if ("playbackWindowStartTime" in patch) playbackWindowStartTime = patch.playbackWindowStartTime;
  if ("playbackCutoffTime" in patch) playbackCutoffTime = patch.playbackCutoffTime;
}

const Playback = createPlayback({
  getState: getPlaybackState,
  setState: setPlaybackState,
  PLAYBACK_START_TIME,
  PLAYBACK_START_DATE_STR,
  PLAYBACK_END_TIME,
  PLAYBACK_END_DATE_STR,
  getEventTime,
  startOfDay,
  endOfDay,
  formatDateFR,
  getWindowStartTime: getPlaybackWindowStartTime,
  buildEventId,
  render: afficherEvenements,

  contextCues: PLAYBACK_CUES,
  parseDateFlexible,
  onContextCue: ({ key, ts }) => {
    const dict = UI_STRINGS[currentLang]?.playbackMessages || {};
    const title = dict[`${key}_title`] || "";
    const body = dict[`${key}_body`] || "";
    if (!title && !body) return;

    const dateLabel = ts ? formatDateFR(ts) : "";
    void dateLabel;
    // showPlaybackMessage({ title, dateLabel, body, durationMs });
  }
});


// ========================================================
// 17) TUTORIAL
// ========================================================

const Tutorial = createTutorial({
  getState: () => ({ currentLang, allEvents }),
  setPanelExpanded,
  setRightPanelExpanded,
  updateOblastPanel: updateCountryPanel,
  highlightOblastForEvent: highlightCountryForEvent,
  clearOblastHighlight: clearCountryHighlight,
  render: afficherEvenements,
  UI_STRINGS,

  showBottomChart: () => BottomChart.show(updateBottomChart),
  hideBottomChart: () => BottomChart.hide(),
  updateBottomChart: () => updateBottomChart(true)
});


// ========================================================
// 18) DATA LOADERS
// ========================================================

async function loadEventsForLang(lang) {
  if (dataByLang[lang]) return dataByLang[lang];

  const file = FILES.donnees[lang];
  if (!file) throw new Error(`Fichier de données manquant pour la langue : ${lang}`);
  const url = withV(file);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Événements ${lang} : HTTP ${resp.status}`);
  const data = validateEvents(await resp.json(), REGLAGES.champsDonnees).map(normalizeConfiguredEvent);

  if (lang === "en") {
    data.forEach(ev => {
      if (TYPE_MAP_EN_TO_FR[ev.type_violence]) {
        ev.type_violence_original = ev.type_violence;
        ev.type_violence = TYPE_MAP_EN_TO_FR[ev.type_violence];
      }
    });
  }

  dataByLang[lang] = data;
  return data;
}


// ========================================================
// 19) THEME / LOADING
// ========================================================

function setLoadingProgress(pct) {
  const bar = document.getElementById("loading-bar-fill");
  if (!bar) return;

  loadingProgress = Math.max(loadingProgress, Math.min(100, pct));
  bar.style.width = `${loadingProgress}%`;
}

function hideLoadingOverlay() {
  if (loadingOverlayDone) return;
  loadingOverlayDone = true;
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  // Laisse la barre atteindre 100 % avant le fondu de l'unique loader.
  setTimeout(() => {
    overlay.classList.add("is-complete");
    setTimeout(() => overlay.remove(), 400);
  }, 400);
}

function setTheme(fond) {
  applyBasemapTheme(fond);
  if (allEvents.length) updateBottomChart(true);
}

function refreshBasemapControl() {
  if (basemapControl) { map.removeControl(basemapControl); basemapControl = null; }
  if (!map || basemapEntries.length < 2) return;
  basemapControl = createBasemapControl({ L, map, entries: basemapEntries, lang: currentLang });
}

function showLoadingError(error) {
  console.error("Impossible de terminer le chargement de la carte", error);
  const subtext = document.querySelector(".loading-subtext");
  if (subtext) subtext.textContent = currentLang === "en"
    ? "The map could not be loaded. Please check your connection and try again."
    : "La carte n’a pas pu être chargée. Vérifiez votre connexion et réessayez.";
  const retry = document.getElementById("loading-retry");
  if (retry) {
    retry.textContent = currentLang === "en" ? "Try again" : "Réessayer";
    retry.hidden = false;
  }
}


// ========================================================
// 20) FILTRES GLOBAUX
// ========================================================

function clearAllFilters({ resetZoom = false } = {}) {
  Playback.pause?.();

  selectedAuthor = null;
  selectedTypes = new Set(allEvents.map(ev => ev.type_violence));
  resetPlaybackWindowToDefault();
  BottomChart.resetZoom?.();

  CountryFilters.clearFiltersPreservePlayback({ resetZoom });

  clearCountryHighlight();
  lastHighlightedCountry = null;

  setRightPanelView("pays");
  BottomChart.hide();
  syncTopbarNavState();

  afficherEvenements();
  setRightPanelExpanded(false);
  LegendUI.syncHeaderLegendSelection?.();
  LegendUI.syncMenuLegendFromSelection?.();
  syncTitleFilterControls();
}


// ========================================================
// 21) LANGUE
// ========================================================

function normalizeLanguage(lang) {
  const code = String(lang || "").trim().toLowerCase().split(/[-_]/)[0];
  return REGLAGES.projet.langues.includes(code) ? code : REGLAGES.projet.langueParDefaut;
}

function getInitialLanguage() {
  return normalizeLanguage(new URLSearchParams(window.location.search).get("lang"));
}

function syncLanguageControls() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll(".lang-btn").forEach(button => {
    const active = button.dataset.lang === currentLang;
    button.classList.toggle("lang-active", active);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function writeLanguageToUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", currentLang);
  window.history.replaceState(window.history.state, "", url);
}

async function setLanguage(lang, { updateUrl = true } = {}) {
  const nextLang = normalizeLanguage(lang);
  const requestId = ++languageChangeSeq;
  if (nextLang === currentLang) {
    syncLanguageControls();
    if (updateUrl) writeLanguageToUrl();
    return;
  }

  let events;
  try {
    events = await loadEventsForLang(nextLang);
  } catch (error) {
    if (requestId === languageChangeSeq) console.error("Changement de langue impossible :", error);
    return;
  }
  if (requestId !== languageChangeSeq) return;

  Playback.stop(true);

  currentLang = nextLang;
  geojsonLevelsController?.setLanguage(currentLang);
  allEvents = events;
  selectedAuthor = null;
  selectedTypes = new Set(allEvents.map(ev => ev.type_violence));

  countrysDisponibles = CountryFilters.buildCountryListFromEvents(allEvents);
  CountryFilters.setCountrysList(countrysDisponibles);
  populateTitleCountrySelect();
  populateTitleAuthorSelect();
  CountryFilters.clearFiltersPreservePlayback({ resetZoom: false });

  LegendUI.init({
    getState: getAppState,
    getLegendIconUrl,
    getDisplayLabelForType: (type) => getDisplayLabelForType(type, currentLang),
    pausePlayback: Playback.pause,
    render: afficherEvenements
  });

  LegendUI.buildMenuLegend();
  LegendUI.initHeaderLegend();

  ensureRightPanelLegend({ onChange: () => renderRightPanelBody() });

  Playback.buildPlaybackSequence();
  updatePlaybackDateUI();

  afficherEvenements();
  applyStaticTextsForLang(currentLang);
  syncLanguageControls();
  if (updateUrl) writeLanguageToUrl();
  refreshBasemapControl();
  updateTopbarTexts();

  setRightPanelView(rightPanelView, { force: true });
}


// ========================================================
// 22) INIT MAP / APP
// ========================================================

async function initMap() {
  const initialBasemap = validateBasemaps(MAP_SETTINGS.fonds);
  setTheme(initialBasemap);
  setLoadingProgress(10);
  applyStaticTextsForLang(currentLang);
  syncLanguageControls();
  if (new URLSearchParams(window.location.search).has("lang")) writeLanguageToUrl();

  map = L.map("map", {
    crs: MAP_CRS,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    zoomSnap: MAP_SETTINGS.zoomSnap,
    zoomDelta: MAP_SETTINGS.zoomDelta,
    wheelPxPerZoomLevel: MAP_SETTINGS.wheelPxPerZoomLevel,
    scrollWheelZoom: MAP_SETTINGS.scrollWheelZoom,
    zoomControl: false
  }).setView(INITIAL_CENTER, INITIAL_ZOOM);
  geojsonRenderer = createGeojsonRenderer({ L, getMaplibreMap: () => activeBasemap?.getMaplibreMap?.() || null, defaultStyle: REGLAGES.stylesGeojson.defaut });
  geojsonLevelsController = createGeojsonLevelsController({ map, L, createGeojsonLayer: geojsonRenderer.createLayer, levels: FILES.geojson.niveauxAdministratifs, defaultStyle: REGLAGES.stylesGeojson?.niveauxAdministratifs, loadGeoJSON: async file => {
    const response = await fetch(withV(file));
    if (!response.ok) throw new Error(`GeoJSON ${file}: HTTP ${response.status}`);
    return response.json();
  }, lang: currentLang });
  L.control.zoom({ position: "topleft" }).addTo(map);

  EventsRenderer.init({ leafletMap: map });
  if (FEATURES.navigationProche?.enabled !== false) {
    nearbyNavigator = createNearbyNavigator({
      L, map, settings: FEATURES.navigationProche,
      getClusterGroup: () => EventsRenderer.getClusterGroup(),
      isEnabled: () => !regionsModeActive,
      getLang: () => currentLang,
      getStrings: () => UI_STRINGS[currentLang]?.ui?.navigationProche || {},
      onNavigate: () => Playback.pause()
    });
  }

  CountryFilters.init({
    map,
    INITIAL_CENTER,
    INITIAL_ZOOM,

    getState: () => ({
      allEvents,
      countrysDisponibles,
      villesDisponibles,
      currentLang,
      selectedCountry
    }),

    setSelectedCountry: (v) => { selectedCountry = v; },
    setSelectedVille: (v) => { selectedVille = v; },
    setVillesDisponibles: (v) => { villesDisponibles = v; },
    setCountrysDisponibles: (v) => { countrysDisponibles = v; },

    pausePlayback: Playback.pause,
    afficherEvenements,
    highlightCountryForEvent,
    clearCountryHighlight,
    resetLastHighlightedCountry: () => { lastHighlightedCountry = null; },
    updateCountryPanel,
    setRightPanelExpanded,
    zoomToCountry,
    getEventCountry
  });

  setLoadingProgress(20);

  window.initialMapCenter = INITIAL_CENTER;
  window.initialMapZoom = INITIAL_ZOOM;
  window.minMapZoom = MIN_ZOOM;
  window.maxMapZoom = MAX_ZOOM;

  window.resetMapView = function () {
    regionsModeActive = Boolean(FEATURES.choropleth?.enabled && FEATURES.choropleth?.actifParDefaut);
    clearRegionsChoroplethLayer({ cancelPending: true });
    if (regionsModeActive) removeBorderLayer();
    else loadBorderLayer().catch(showLoadingError);
    selectedAuthor = null;
    Playback.stop(true);
    resetPlaybackWindowToDefault();
    BottomChart.resetZoom?.();
    CountryFilters.clearFiltersPreservePlayback({ resetZoom: true });
    lastHighlightedCountry = null;
    updateCountryPanel(null);
    afficherEvenements();
    BottomChart.hide();
    syncTopbarNavState();
  };

  basemapEntries = MAP_SETTINGS.fonds.map(config => {
    const layer = createBasemapLayer(config, { L, settings: MAP_SETTINGS });
    layer.on("add", () => {
      activeBasemap = layer;
      geojsonRenderer.refresh();
      setTheme(config);
    });
    layer.on("remove", () => {
      if (activeBasemap === layer) {
        activeBasemap = null;
        queueMicrotask(() => { if (!activeBasemap) geojsonRenderer.refresh(); });
      }
    });
    return { config, layer };
  });
  const fondParDefaut = MAP_SETTINGS.fonds.find(fond => fond.actifParDefaut) || MAP_SETTINGS.fonds[0];
  const defaultBasemap = basemapEntries.find(entry => entry.config.id === fondParDefaut.id).layer;
  defaultBasemap.addTo(map);
  refreshBasemapControl();
  // Données et géométries arrivent pendant le chargement du fond.
  [allEvents] = await Promise.all([
    loadEventsForLang(currentLang),
    regionsModeActive || FEATURES.frontieres?.enabled ? loadBordersGeojson() : Promise.resolve()
  ]);
  setLoadingProgress(40);

  setLoadingProgress(50);

  // Les événements ont été chargés avec les géométries.
  applyStaticTextsForLang(currentLang);
  updateTopbarTexts();

  setLoadingProgress(65);

  selectedTypes = new Set(allEvents.map(ev => ev.type_violence));

  countrysDisponibles = CountryFilters.buildCountryListFromEvents(allEvents);
  CountryFilters.setCountrysList(countrysDisponibles);
  populateTitleCountrySelect();
  populateTitleAuthorSelect();

  initRightPanelVisibleTypes();
  ensureRightPanelLegend({ onChange: () => renderRightPanelBody() });

  LegendUI.init({
    getState: getAppState,
    getLegendIconUrl,
    getDisplayLabelForType: (type) => getDisplayLabelForType(type, currentLang),
    pausePlayback: Playback.pause,
    render: afficherEvenements
  });

  LegendUI.buildMenuLegend();
  LegendUI.initHeaderLegend();

  updateCountryPanel(null);

  Playback.buildPlaybackSequence();
  BottomChart.computeGlobalDays(allEvents, PLAYBACK_START_TIME, getEventTime, startOfDayUTC);

  afficherEvenements({ renderGeography: false });
  if (regionsModeActive) await renderRegionsChoroplethLayer();
  else await loadBorderLayer();
  setLoadingProgress(90);

  await waitForBasemapReady(defaultBasemap, { timeoutMs: MAP_SETTINGS.delaiChargementMaximum });
  setLoadingProgress(100);
  hideLoadingOverlay();

  if (FEATURES.tutoriel?.enabled && FEATURES.tutoriel?.demarrageAutomatique && !Tutorial.hasSeen()) {
    setTimeout(() => Tutorial.start(), 900);
  }
}


// ========================================================
// 23) BIND EVENTS DOM
// ========================================================

function bindTopbarEvents() {
  document.getElementById("nav-events")?.addEventListener("click", openEventsPanelFromNav);
  document.getElementById("nav-countries")?.addEventListener("click", openCountriesPanelFromNav);
  document.getElementById("nav-authors")?.addEventListener("click", openAuthorsPanelFromNav);
  document.getElementById("nav-chart")?.addEventListener("click", openBottomChartFromNav);
}

function bindTutorialEvents() {
  document.getElementById("tutorial-next-btn")?.addEventListener("click", () => Tutorial.next());
  document.getElementById("tutorial-skip-btn")?.addEventListener("click", () => Tutorial.skip());
  document.getElementById("tutorial-replay-btn")?.addEventListener("click", () => Tutorial.start());

  document.getElementById("tutorial-lang-btn")?.addEventListener("click", async () => {
    const newLang = currentLang === "en" ? "fr" : "en";
    await setLanguage(newLang);

    if (Tutorial.isActive() && Tutorial.getStep() > 0) {
      Tutorial.goToStep(Tutorial.getStep());
    }
  });
}

function bindFilterEvents() {
  document.getElementById("clear-all-filters-left")?.addEventListener("click", () => {
    clearAllFilters({ resetZoom: false });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearAllFilters({ resetZoom: true });
    }
  });
}

function bindLanguageEvents() {
  window.addEventListener("popstate", () => setLanguage(getInitialLanguage(), { updateUrl: false }));
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await setLanguage(btn.dataset.lang);

      if (Tutorial.isActive?.() && Tutorial.getStep?.() > 0) {
        Tutorial.goToStep(Tutorial.getStep());
      }
    });
  });
}

function bindPlaybackEvents() {
  const pbToggle = document.getElementById("playback-toggle");
  const pbPrev = document.getElementById("playback-prev");
  const pbNext = document.getElementById("playback-next");
  const pbSpeed = document.getElementById("playback-speed");
  const pbEnd = document.getElementById("playback-end");

  pbToggle?.addEventListener("click", () => {
    Playback.toggle();
    if (!BottomChart.isOpen()) BottomChart.show(updateBottomChart);
    requestAnimationFrame(syncTopbarNavState);
  });

  pbPrev?.addEventListener("click", () => {
    Playback.pause();
    Playback.stepPrev();
  });

  pbNext?.addEventListener("click", () => {
    Playback.pause();
    Playback.stepNext();
  });

  pbEnd?.addEventListener("click", () => Playback.goToEnd());

  pbSpeed?.addEventListener("change", () => {
    const nextSpeed = parseFloat(pbSpeed.value) || 1;
    setPlaybackState({ playbackSpeed: nextSpeed });

    if (getPlaybackState().playbackActive) {
      Playback.stop(false);
      Playback.start();
    }
  });

  document.getElementById("toggle-bottom-chart")?.addEventListener("click", () => {
    BottomChart.toggle(updateBottomChart);
    requestAnimationFrame(syncTopbarNavState);
  });
}

function bindCollapseEvents() {
  setupCollapse({
    btnId: "collapse-right-legend",
    bodyId: "right-panel-legend",
    storageKey: "collapse.rightLegend.v2",
    defaultCollapsed: true
  });

  setupCollapse({
    btnId: "collapse-bottom-legend",
    bodyId: "bottom-chart-legend",
    storageKey: "collapse.bottomLegend.v2",
    defaultCollapsed: true
  });

  setupCollapse({
    btnId: "collapse-notes",
    bodyId: "notes-body",
    storageKey: "collapse.notes",
    defaultCollapsed: false
  });
}


// ========================================================
// 24) BOOT
// ========================================================

function onDomReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

let appBooted = false;
onDomReady(() => {
  initUtilityMenu();
  if (appBooted) return;
  appBooted = true;
  initHarmonizedShell();
  bindTopbarEvents();
  bindTutorialEvents();
  bindFilterEvents();
  bindLanguageEvents();
  bindPlaybackEvents();
  bindCollapseEvents();

  syncTopbarNavState();
  document.getElementById("loading-retry")?.addEventListener("click", () => window.location.reload());
  initMap().catch(showLoadingError);
});
