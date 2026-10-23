// Configuration administrateur de la carte des Grands Lacs.
export const REGLAGES = {
  projet: {
    titreHtml: "Afrique des Grands Lacs : monitoring des exactions contre les journalistes",
    langueParDefaut: "en",
    langues: ["fr", "en"],
    indexationMoteurs: false
  },
  fichiers: {
    donnees: { fr: "evenements.json", en: "events.json" },
    geojson: { frontieres: "geojson/static.geojson", niveauxAdministratifs: [] },
    assets: {
      feuilleDeStyle: "css/style.css",
      logo: "logo.svg",
      favicon: "logo.svg",
      dossierIcones: "icons/",
      iconeParDefaut: "autre.png"
    },
    modules: {
      dates: "./utils/dates.js",
      strings: "./utils/strings.js",
      security: "./utils/security.js",
      bottomChart: "./charts/bottomChart.js",
      eventsRenderer: "./events/eventsRenderer.js",
      panelScroll: "./ui/panelScroll.js",
      legend: "./ui/legend.js",
      countryFilters: "./ui/countryFilters.js",
      playback: "./playback/playback.js",
      i18n: "./i18n/i18n.js",
      tutorial: "./tutorial/tutorial.js",
      geojsonLevels: "./maps/geojsonLevels.js",
      menu: "./ui/menu.js",
      nearbyNavigation: "./maps/nearbyNavigation.js",
      mapRendering: "./maps/rendering.js"
    }
  },
  champsDonnees: {
    date: ["date", "date_evenement", "date_event", "date_iso"],
    emplacement: ["lieu", "ville", "city", "location"],
    personne: ["journaliste", "name", "nom"],
    description: ["description", "summary"],
    categorie: ["type_violence", "type", "category"],
    auteur: ["auteur", "author", "auteur_infraction"],
    pays: ["Oblast", "Country", "country", "pays"],
    nomGeojson: ["Geojson", "geojson", "shapeName"],
    latitude: ["lat", "latitude"],
    longitude: ["lng", "lon", "longitude"],
    identifiant: ["compteur_evenements", "id"],
    lien: ["lien", "link"]
  },
  carte: {
    // Projections : "mercator" (EPSG:3857, compatible avec les fonds actuels) ; "naturalEarth2" (Proj4Leaflet et fonds compatibles requis).
    projection: "mercator",
    centreInitial: [-2.9384785971872263, 25.905946086059735],
    zoomInitial: 5,
    zoomMinimum: 5,
    zoomMaximum: 10,
    zoomDelta: 0.5,
    zoomSnap: 0.1,
    wheelPxPerZoomLevel: 60,
    scrollWheelZoom: true,
    delaiChargementMaximum: 30000,
    zoomMaximumFrontieres: 7,
    ajusterVueFrontieres: true,
    attribution: '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    // "maplibre" : style vectoriel ; "raster" : tuiles image. Un seul actifParDefaut: true.
    // theme : "light" ou "dark" ; une seule entrée actifParDefaut: true.
    // maxNativeZoom évite de demander au fournisseur des tuiles inexistantes.
    fonds: [
      {
        id: "positron",
        labels: {
          fr: "Clair",
          en: "Light",
          es: "Claro"
        },
        type: "maplibre",
        url: "https://tiles.openfreemap.org/styles/positron",
        options: {
          attributionControl: false
        },
        theme: "light",
        actifParDefaut: false
      },
      {
        id: "dark",
        labels: {
          fr: "Sombre",
          en: "Dark",
          es: "Oscuro"
        },
        type: "maplibre",
        url: "https://tiles.openfreemap.org/styles/dark",
        options: {
          attributionControl: false
        },
        theme: "dark",
        actifParDefaut: false
      },
      {
        id: "fiord",
        labels: {
          fr: "Fiord",
          en: "Fiord",
          es: "Fiord"
        },
        type: "maplibre",
        url: "https://tiles.openfreemap.org/styles/fiord",
        options: {
          attributionControl: false
        },
        theme: "dark",
        actifParDefaut: true
      },
      {
        id: "liberty",
        labels: {
          fr: "Liberty",
          en: "Liberty",
          es: "Liberty"
        },
        type: "maplibre",
        url: "https://tiles.openfreemap.org/styles/liberty",
        options: {
          attributionControl: false
        },
        theme: "light",
        actifParDefaut: false
      },
      {
        id: "bright",
        labels: {
          fr: "Bright",
          en: "Bright",
          es: "Bright"
        },
        type: "maplibre",
        url: "https://tiles.openfreemap.org/styles/bright",
        options: {
          attributionControl: false
        },
        theme: "light",
        actifParDefaut: false
      },
      {
        id: "satellite",
        labels: {
          fr: "Satellite",
          en: "Satellite",
          es: "Satélite"
        },
        type: "raster",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxNativeZoom: 23
        },
        theme: "dark",
        attribution: "Tiles &copy; Esri",
        actifParDefaut: false
      },
      {
        id: "relief",
        labels: {
          fr: "Relief",
          en: "Relief",
          es: "Relieve"
        },
        type: "raster",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxNativeZoom: 13
        },
        theme: "light",
        attribution: "Tiles &copy; Esri",
        actifParDefaut: false
      }
    ],
  },
  categories: [
    { cle: "Violences", slug: "violences", icone: "violence.png", couleur: "#FF9800", labels: { fr: "Violences", en: "Violence" }, valeursEntree: ["Violences", "Violence"] },
    { cle: "Autres", slug: "autres", icone: "agression.png", couleur: "#607D8B", labels: { fr: "Autres", en: "Others" }, valeursEntree: ["Autres", "Others"] },
    { cle: "Tués", slug: "tues", icone: "assassinat.png", couleur: "#dc143c", labels: { fr: "Tués", en: "Killed" }, valeursEntree: ["Tués", "Killed"] },
    { cle: "Disparus", slug: "disparus", icone: "disparu.png", couleur: "#2196F3", labels: { fr: "Disparus", en: "Missing" }, valeursEntree: ["Disparus", "Missing"] },
    { cle: "Arrêtés, détenus, otages", slug: "arretes-detenus-otages", icone: "arrestation.png", couleur: "#af1c83ff", labels: { fr: "Arrêtés, détenus, otages", en: "Arrested, detained or held hostage" }, valeursEntree: ["Arrêtés, détenus, otages", "Arrested, detained or held hostage"] }
  ],
  listeCas: { champsSupplementaires: [] },
  // Styles Leaflet/MapLibre : stroke, color, weight, opacity, fill, fillColor, fillOpacity.
  // fillColor: null reprend color. Chaque couche complète defaut.
  stylesGeojson: {
    defaut: {
      stroke: true,
      color: "#3388ff",
      weight: 3,
      opacity: 1,
      fill: true,
      fillColor: null,
      fillOpacity: 0.2
    },
    contour: {
      stroke: true,
      color: "#97500dff",
      weight: 0.2,
      opacity: 1,
      fill: true,
      fillColor: null,
      fillOpacity: 0.1
    },
    selection: {
      stroke: true,
      color: "#e4e000ff",
      weight: 1,
      opacity: 1,
      fill: true,
      fillColor: "#e4e000ff",
      fillOpacity: 0.15
    },
    niveauxAdministratifs: {
      stroke: true,
      color: "#64748b",
      weight: 1,
      opacity: 0.8,
      fill: true,
      fillColor: "#64748b",
      fillOpacity: 0
    },
    frontieresParPays: {
      COD: {
        color: "#0080FF",
        weight: 0.4,
        fillOpacity: 0.15
      },
      RWA: {
        color: "#DEB801",
        weight: 0.4,
        fillOpacity: 0.15
      },
      BDI: {
        color: "#C20F2D",
        weight: 0.4,
        fillOpacity: 0.15
      },
      UGA: {
        color: "#000000",
        weight: 0.4,
        fillOpacity: 0.15
      },
      TZA: {
        color: "#27764D",
        weight: 0.4,
        fillOpacity: 0.15
      },
      KEN: {
        color: "#CB1A21",
        weight: 0.4,
        fillOpacity: 0.15
      }
    },
    fallbackColor: "#999"
  },
  choropleth: {
    couleurSansCas: "#7890a0",
    couleurMinimum: "#f7d457",
    couleurMaximum: "#76001f",
    contour: "rgba(255,255,255,0.82)",
    opaciteSansCas: 0.42,
    epaisseurContour: 0.6, // Constante au survol.
    opaciteAvecCas: 0.9
  },
  fonctionnalites: {
    navigationProche: {
      enabled: true, // Navigation vers le groupe ou événement hors écran le plus proche.
      zoomMinimum: 9, // Cette carte est limitée au zoom 10.
      maximumVisibles: 1, // Afficher le bouton avec 0 ou 1 groupe/événement visible.
      margeDesktop: 56, // Pixels ; le placement évite aussi les panneaux et commandes.
      margeMobile: 20,
      espacementComposants: 12,
      seuilMobile: 768,
      dureeDeplacement: 0.65 // Secondes ; le zoom final reste inchangé.
    },
    listeCas: { enabled: true },
    statistiques: { enabled: true },
    auteurs: { enabled: true },
    chronologie: { enabled: true },
    lecture: { enabled: true },
    tutoriel: {
      enabled: true, // Conserve le tutoriel dans le menu.
      demarrageAutomatique: false // true : ouverture automatique à la première visite.
    },
    langues: { enabled: true },
    rsfCartographie: { enabled: true },
    filtresAdditionnels: { enabled: true },
    frontieres: { enabled: true },
    choropleth: {
      enabled: true, // Conserve la commande dans le menu.
      actifParDefaut: false // false : marqueurs au démarrage ; true : choroplèthe.
    }
  },
  controles: {
    panneauTitre: {
      ouvertParDefaut: true,
      afficherPays: true,
      afficherEmplacement: true,
      afficherAuteur: true,
      afficherDates: true,
      afficherCategories: true,
      afficherEffacerFiltres: true
    },
    lecture: { vitesses: [0.5, 1, 2], vitesseParDefaut: 1, afficherPrecedent: true, afficherLecturePause: true, afficherSuivant: true, afficherFin: true },
    statistiques: { vues: ["pays", "auteurs"], vueParDefaut: "pays", lignesMaximumPays: 30, lignesMaximumVilles: 100, lignesMaximumAuteurs: 30 },
    menu: {
      ordreNavigation: ["evenements", "pays", "auteurs", "chronologie"],
      ordrePanneau: ["langues", "tutoriel", "evenements", "choropleth", "pays", "auteurs", "chronologie", "rsfCartographie"]
    }
  },
  lecture: { dateDebut: "01/01/2021", dateFin: null, reperes: [] },
  cartesLiees: [
    { href: "https://rsf-carte-journalistes-tues-disparus-otages-detenus-2025.rsf.org/", image: "assets/carte_bilan.png" },
    { href: "https://ukraine-mobilisation.rsf.org/", image: "assets/carte_ukraine.png" },
    { href: "https://grands-lacs.rsf.org/", image: "assets/grands-lacs.png" },
    { href: "https://routes-de-l-exil.data.rsf.org/", image: "assets/carte_exil.png" }
  ]
};

export function validerReglages(reglages = REGLAGES) {
  const erreurs = [];
  if (!reglages.projet?.langues?.includes(reglages.projet.langueParDefaut)) erreurs.push("langue par défaut absente de la liste des langues");
  if (!reglages.fichiers?.donnees?.[reglages.projet?.langueParDefaut]) erreurs.push("fichier de données par défaut manquant");
  if (!reglages.fichiers?.geojson?.frontieres) erreurs.push("GeoJSON des frontières manquant");
  if (!reglages.categories?.length) erreurs.push("aucune catégorie configurée");
  const fonds = reglages.carte?.fonds;
  if (!Array.isArray(fonds) || !fonds.length) erreurs.push("aucun fond de carte configuré");
  else {
    if (fonds.filter(fond => fond.actifParDefaut).length !== 1) erreurs.push("un seul fond doit être actif par défaut");
    if (new Set(fonds.map(fond => fond.id)).size !== fonds.length) erreurs.push("identifiants de fonds dupliqués");
    if (fonds.some(fond => !fond.id || !fond.url || !["maplibre", "raster"].includes(fond.type))) erreurs.push("chaque fond doit avoir un id, une URL et un type maplibre ou raster");
  }
  if (erreurs.length) throw new Error(`[reglages.js] ${erreurs.join(" ; ")}`);
  return true;
}
