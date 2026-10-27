// JS/i18n/i18n.js
export const UI_STRINGS = {
  fr: {
    loader: {
      subtitle: "Exactions contre les journalistes dans la région des Grands Lacs",
      subtext: "Chargement de la carte…"
    },
    tutorial: {
      step1: {
        title: "Bienvenue",
        subtitle: "Information importante",
        body: "Cette carte recense les exactions subies par les journalistes dans les pays de l'Afrique des Grands Lacs depuis 2021. Si vous êtes sur mobile, penchez votre écran pour voir cette carte à l'horizontale. Vous pouvez changer la langue (anglais, français), et voir comment la parcourir en cliquant sur \"Montrez-moi\".",
        body2: "Cette carte et les données qui lui sont attachées sont issues d'un monitoring de RSF selon son mandat et peuvent être mises à jour en temps réel. Reporters sans frontières collecte ces informations grâce à une veille et à la communication d'informations de la part de ses partenaires dans les pays des Grands Lacs",
        nextLabel: "Montrez-moi"
      },
      step2: {
        title: "Filtres de la carte",
        subtitle: "Pays, villes et auteurs",
        body: "Le composant titre regroupe les filtres principaux : pays, ville, auteur présumé et catégories d’exactions. Les boutons de catégories agissent directement sur la carte et les panneaux.",
        body2: "Le bouton \"Supprimer les filtres\" rétablit la vue complète et remet les catégories dans leur état initial.",
        nextLabel: "Suivant"
      },
      step3: {
        title: "Menu de navigation",
        subtitle: "Fermer le panneau",
        body: "Le menu burger rassemble le changement de langue, le tutoriel, la liste des cas, les vues pays/villes, auteurs et la chronologie.",
        body2: "Cliquez à nouveau sur le bouton du menu pour le fermer.",
        nextLabel: "Suivant"
      },
      step4: {
        title: "Liste des cas",
        subtitle: "Depuis la liste",
        body: "La liste des cas permet de parcourir les exactions documentées.",
        body2: "Cliquez sur un cas pour centrer la carte sur son emplacement. Le bouton \"Fermer\" ferme le panneau.",
        nextLabel: "Suivant"
      },
      step5: {
        title: "Lecture et chronologie",
        subtitle: "Zoom de la chronologie",
        body: "Le module lecture est placé en bas. Il rejoue les cas dans l’ordre chronologique et garde la carte synchronisée avec le curseur.",
        body2: "La chronologie en haut affiche des colonnes empilées par jour. Survolez une barre pour afficher le bouton +, cliquez pour zoomer, puis utilisez − et les flèches pour dézoomer ou vous déplacer.",
        nextLabel: "Suivant"
      },
      step6: {
        title: "Statistiques et notes",
        subtitle: "Pays, villes et auteurs",
        body: "Le panneau de droite affiche les compteurs, graphiques, légende repliable et notes pour le pays ou l’auteur sélectionné. Sans sélection, il résume l’ensemble des cas disponibles.",
        body2: "Les éléments des graphiques permettent de filtrer par pays, ville ou auteur. Le bouton \"Fermer\" ferme le panneau.",
        nextLabel: "Suivant"
      },
      step7: {
        title: "Mode Choropleth",
        body: "Le mode Choropleth permet de visualiser les données de manière cartographique. Cliquez à nouveau sur le bouton pour le désactiver.",
        subtitle: "Données par pays",
        body2: "Cliquez sur un pays pour afficher les données correspondantes. Les filtres et la date mettent à jour l'affichage de la carte.",
        nextLabel: "Terminer"
      },
      skipLabel: "Passer"
    },
    ui: {
      notesSection: "Notes",
      closeButton: "Fermer",
      eventFooterNote: "<b>Autres exactions :</b> comprend le vol et la destruction de matériel, le refus d'accréditation, les fermetures, saisies, saccages et suspensions de médias ou journaux, les licenciements abusifs, l'expulsion ou l'exil de journalistes, les poursuites contre des journalistes ou des médias et l'espionnage ou la cybersurveillance.",
      topNavEvents: "Événements",
      topNavCountries: "Pays",
      topNavAuthors: "Auteurs",
      topNavChart: "Évolution",
      legendSection: "Légende",
      countrySection: "Pays",
      citiesSection: "Villes",
      activeFiltersTitle: "Filtres actifs",
      noActiveFilters: "Aucun filtre actif",
      cityLabel: "Ville",
      filterByCountry: "Pays",
      filterByAuthor: "Auteur",
      filterByType: "Type",
      tabPays: "Pays",
      tabAuteurs: "Auteur",
      clearFilters: "Supprimer les filtres",
      eventPanelTitle: "Liste des cas",
      selectCountry: "Cliquez sur un pays ou une ville ci-dessous",
      floatingTitle: "Surveillance des exactions contre les journalistes dans l'Afrique des Grands Lacs",
      panelWhenCountry: "Les statistiques apparaîtront ici dès qu’un pays sera sélectionné.",
      chartNoEvents: "Ce pays n’a pas d’événements sur les catégories disponibles.",
      chartNoEventsCategory: "Aucun événement pour cette catégorie.",
      chartSearchCountry: "Sélectionnez un événement (ou une ville) pour afficher les statistiques d’un pays.",
      countryTotalLabel: "Total d’événements :",
      countryCitiesLabel: "Villes concernées :",
      tutoButton: "Tutoriel",
      tutorialLangButton: "Switch to English",
      menuLanguage: "Langue",
      menuEvents: "Liste des cas",
      menuRegions: "Carte Choropleth",
      menuCountries: "Pays et villes",
      menuAuthors: "Auteurs",
      menuTimeline: "Chronologie",
      menuOpen: "Ouvrir le menu",
      navigationProche: { evenement: "Rejoindre l’événement le plus proche", groupe: "Rejoindre le groupe le plus proche ({count} événements)" },
      rsfCartography: "RSF cartographie",
      searchPlaceholder: " ",
      bottomChartTitle: "Évolution par catégorie",
      countrysBtn: "Pays",
      villesBtn: "Villes",
      footerCredits: `
        Graphiques et carte : <i>Vianney Loriquet / RSF.</i><br>
        icones et illustrations : <button class="credits-link" data-open-credits="flaticon">Flaticon (voir détails)</button>
      `,
      flaticonCredits: `<ul class="credits-list">
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/antena" target="_blank" title="antena icônes">Icônes Antena créées par Handicon - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/mort" target="_blank" title="mort icônes">Icônes Mort créées par Dreamstale - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/hopital" target="_blank" title="hôpital icônes">Icônes Hôpital créées par Pixel Buddha - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/cible" target="_blank" title="cible icônes">Icônes Cible créées par Freepik - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/la-violence" target="_blank" title="la violence icônes">Icônes Violence créées par Mehwish - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/prison" target="_blank" title="prison icônes">Icônes Prison créées par Freepik - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/point-dinterrogation" target="_blank" title="point d'interrogation icônes">Icônes Point d'interrogation créées par Fathema Khanom - Flaticon</a></li>
      </ul>`
    },
    cartography: {
      title: "RSF cartographie",
      close: "Fermer",
      cards: [
        "Violences contre les journalistes dans le monde (édition 2025)",
        "Surveillance des violences contre les journalistes en Ukraine",
        "Surveillance des violences contre les journalistes dans la région des Grands Lacs africains",
        "Les journalistes sur les routes de l'exil (édition 2021 à 2025)"
      ]
    },
    playbackMessages: {
      example_title: "Vide",
      example_body: "Vide"
    }
  },

  en: {
    loader: {
      subtitle: "Abuses against journalists in Africa’s Great Lakes region",
      subtext: "Loading the map"
    },
    tutorial: {
      step1: {
        title: "Welcome",
        subtitle: "Important information",
        body: "This map records the abuses suffered by journalists in Africa’s Great Lakes region since 2021. If you are on your mobile, rotate your screen to view the map in landscape mode. This map is available in English and French. You can change the language and see how to navigate it by clicking on \"Show me.\"",
        body2: "This map and the data it contains are updated in real time and reflect RSF’s ongoing monitoring of the situation (within the scope of its mandate). RSF collects this information through its own constant monitoring and via communication with its partners and correspondents in the Great Lakes region of Africa.",
        nextLabel: "Show me"
      },
      step2: {
        title: "Map filters",
        subtitle: "Countries, cities and authors",
        body: "The title component now groups the main filters: country, city, alleged perpetrator and abuse categories. Category buttons update the map and panels directly.",
        body2: "The \"Clear filters\" button restores the full map view and resets the categories to their initial state.",
        nextLabel: "Next"
      },
      step3: {
        title: "Navigation menu",
        subtitle: "Close the panel",
        body: "The burger menu gathers language, tutorial, case list, countries/cities, authors and timeline controls.",
        body2: "Click the menu button again to close it.",
        nextLabel: "Next"
      },
      step4: {
        title: "Case list",
        subtitle: "From the list",
        body: "The case list lets you browse documented abuses.",
        body2: "Click a case to center the map on its location. The \"Close\" button closes the panel.",
        nextLabel: "Next"
      },
      step5: {
        title: "Playback and timeline",
        subtitle: "Timeline zoom",
        body: "The playback module is placed at the bottom. It replays cases chronologically and keeps the map synchronized with the cursor.",
        body2: "The timeline at the top displays stacked daily columns. Click on a bar to zoom in, then use − and the arrows to zoom out or move.",
        nextLabel: "Next"
      },
      step6: {
        title: "Statistics and notes",
        subtitle: "Countries, cities and authors",
        body: "The right-hand panel displays counters, charts, a collapsible legend and notes for the selected country or author. Without a selection, it summarizes all available cases.",
        body2: "Click on the chart elements to filter by country, city or author. The \"Close\" button closes the panel.",
        nextLabel: "Next"
      },
      step7: {
        title: "Choropleth map",
        body: "The Choropleth map allows you to visualize the data geographically. Click the button again to disable it.",
        subtitle: "Data by country",
        body2: "Click on a country to display the corresponding data. Filters and date update the map display.",
        nextLabel: "Finish"
      },
      skipLabel: "Skip"
    },
    ui: {
      notesSection: "Notes",
      closeButton: "Close",
      eventFooterNote: "<b>Other abuses:</b> includes theft and destruction of equipment, refusal of accreditation, the closure, seizure, ransacking and suspension of media outlets and newspapers, unfair dismissals, the expulsion or exile of journalists, legal proceedings against journalists and media outlets, espionage and cyber-surveillance.",
      topNavEvents: "Events panel",
      topNavCountries: "Compare countries and cities",
      topNavAuthors: "Compare authors",
      topNavChart: "Trend chart",
      legendSection: "Legend",
      countrySection: "Countries",
      citiesSection: "Cities",
      activeFiltersTitle: "Active filters",
      noActiveFilters: "No active filters",
      cityLabel: "City",
      filterByCountry: "Country",
      filterByAuthor: "Author",
      filterByType: "Type",
      tabPays: "Countries",
      tabAuteurs: "Authors",
      clearFilters: "Clear filters",
      eventPanelTitle: "Case list",
      selectCountry: "Click on a country, town or city below",
      floatingTitle: "Monitoring abuses against journalists in Africa’s Great Lakes region",
      panelWhenCountry: "Statistics will appear here as soon as a country is selected.",
      chartNoEvents: "This location has no events in the available categories.",
      chartNoEventsCategory: "No events for this category.",
      chartSearchCountry: "Select an event (or a city) to display country statistics.",
      countryTotalLabel: "Total events:",
      countryCitiesLabel: "Cities involved:",
      tutoButton: "Tutorial",
      tutorialLangButton: "Voir en Français",
      menuLanguage: "Language",
      menuEvents: "Case list",
      menuRegions: "Choropleth map",
      menuCountries: "Countries and cities",
      menuAuthors: "Authors",
      menuTimeline: "Timeline",
      menuOpen: "Open menu",
      navigationProche: { evenement: "Go to the nearest event", groupe: "Go to the nearest group ({count} events)" },
      rsfCartography: "RSF cartography",
      searchPlaceholder: " ",
      bottomChartTitle: "Evolution by category",
      countrysBtn: "Countries",
      villesBtn: "Cities",
      footerCredits: `
        Graphs and map: <i>Vianney Loriquet / RSF.</i><br>
        Icons and illustrations: <button class="credits-link" data-open-credits="flaticon">Flaticon (details)</button>
      `,
      flaticonCredits: `<ul class="credits-list">
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/mort" target="_blank" title="mort icônes">Death icons created by Dreamstale - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/cible" target="_blank" title="cible icônes">Target icons created by Freepik - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/alerte" target="_blank" title="alerte icônes">Alerte icônes créées par Good Ware - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/prison" target="_blank" title="prison icônes">Prison icons created by Freepik - Flaticon</a></li>
        <li><a href="https://www.flaticon.com/fr/icones-gratuites/point-dinterrogation" target="_blank" title="point d'interrogation icônes">Question mark icons created by Fathema Khanom - Flaticon</a></li>
      </ul>`
    },
    cartography: {
      title: "RSF cartography",
      close: "Close",
      cards: [
        "Violence against journalists worldwide (2025 edition)",
        "Monitoring violence against journalists in Ukraine",
        "Monitoring violence against journalists in Africa's Great Lakes region",
        "Journalists on the routes of exile (2021 to 2025 edition)"
      ]
    },
    playbackMessages: {
      example_title: "Empty",
      example_body: "Empty"
    }
  }
};

export const TYPE_LABELS = {
  fr: {
    "Violences": "Violences",
    "Tués": "Tués",
    "Disparus": "Disparus",
    "Arrêtés, détenus, otages": "Arrêtés, détenus, otages",
    "Autres": "Autres"
  },
  en: {
    "Violences": "Violence",
    "Tués": "Killed",
    "Disparus": "Missing",
    "Arrêtés, détenus, otages": "Arrested, detained or taken hostage",
    "Autres": "Others"
  }
};

export function getDisplayLabelForType(type, lang) {
  const dict = TYPE_LABELS[lang] || TYPE_LABELS.fr;
  return Object.prototype.hasOwnProperty.call(dict, type) ? dict[type] : type;
}

export function applyStaticTextsForLang(lang) {
  const ui = UI_STRINGS[lang]?.ui;
  const strings = UI_STRINGS[lang];

  const eventFooterNote = document.getElementById("event-footer-note");
  if (eventFooterNote) eventFooterNote.innerHTML = ui.eventFooterNote;
  const notesSectionTitle = document.getElementById("notes-section-title");
  if (notesSectionTitle) notesSectionTitle.textContent = ui.notesSection;

  const rightLegendTitle = document.getElementById("right-legend-section-title");
  if (rightLegendTitle) rightLegendTitle.textContent = ui.legendSection;

  const bottomLegendTitle = document.getElementById("bottom-legend-section-title");
  if (bottomLegendTitle) bottomLegendTitle.textContent = ui.legendSection;

  document.querySelectorAll(".panel-close-button").forEach(btn => {
    btn.textContent = ui.closeButton;
    btn.setAttribute("aria-label", ui.closeButton);
  });

  const countrySectionTitle = document.getElementById("country-section-title");
  if (countrySectionTitle) countrySectionTitle.textContent = ui.countrySection;

  const citiesSectionTitle = document.getElementById("cities-section-title");
  if (citiesSectionTitle) citiesSectionTitle.textContent = ui.citiesSection;

  const activeFiltersTitle = document.getElementById("active-filters-title");
  if (activeFiltersTitle) activeFiltersTitle.textContent = ui.activeFiltersTitle;

  const activeFiltersEmpty = document.getElementById("active-filters-empty");
  if (activeFiltersEmpty) activeFiltersEmpty.textContent = ui.noActiveFilters;

  const tabPays = document.getElementById("right-tab-pays-label");
  if (tabPays) tabPays.textContent = ui.tabPays;

  const tabAuteurs = document.getElementById("right-tab-auteurs-label");
  if (tabAuteurs) tabAuteurs.textContent = ui.tabAuteurs;

  const clearFilters = document.getElementById("clear-all-filters");
  if (clearFilters) clearFilters.textContent = ui.clearFilters;

  const titleClearFilters = document.getElementById("title-clear-filters");
  if (titleClearFilters) titleClearFilters.textContent = ui.clearFilters;

  const eventPanelTitle = document.querySelector(".panel-list-title");
  if (eventPanelTitle) eventPanelTitle.textContent = ui.eventPanelTitle;

  const titleEl = document.getElementById("floating-title");
  if (titleEl) titleEl.textContent = strings.ui.floatingTitle;

  const bottomTitle = document.querySelector(".bottom-chart-title");
  if (bottomTitle) bottomTitle.textContent = strings.ui.bottomChartTitle;

  const tutoBtn = document.getElementById("tutorial-replay-btn");
  if (tutoBtn) tutoBtn.textContent = strings.ui.tutoButton;

  const menuLanguageLabel = document.querySelector(".utility-menu-field > span");
  if (menuLanguageLabel) menuLanguageLabel.textContent = strings.ui.menuLanguage;

  const languageToggle = document.querySelector(".utility-menu .language-toggle");
  if (languageToggle) languageToggle.setAttribute("aria-label", strings.ui.menuLanguage);

  const utilityToggle = document.getElementById("utility-menu-toggle");
  if (utilityToggle) utilityToggle.setAttribute("aria-label", strings.ui.menuOpen);

  [
    ["utility-events-toggle", strings.ui.menuEvents],
    ["utility-regions-mode-toggle", strings.ui.menuRegions],
    ["utility-countries-toggle", strings.ui.menuCountries],
    ["utility-authors-toggle", strings.ui.menuAuthors],
    ["utility-chart-toggle", strings.ui.menuTimeline],
    ["rsf-cartography-toggle", strings.ui.rsfCartography]
  ].forEach(([id, label]) => {
    const btn = document.getElementById(id);
    if (btn && label) btn.textContent = label;
  });

  const cartographyTitle = document.getElementById("rsf-cartography-title");
  if (cartographyTitle) cartographyTitle.textContent = strings.cartography?.title || strings.ui.rsfCartography;

  const cartographyClose = document.getElementById("rsf-cartography-close");
  if (cartographyClose) cartographyClose.setAttribute("aria-label", strings.cartography?.close || strings.ui.closeButton);

  document.querySelectorAll("#rsf-cartography-modal .rsf-cartography-link span").forEach((span, index) => {
    const label = strings.cartography?.cards?.[index];
    if (label) span.textContent = label;
  });

  const skipBtn = document.getElementById("tutorial-skip-btn");
  if (skipBtn) skipBtn.textContent = strings.tutorial.skipLabel;

  const tutLangBtn = document.getElementById("tutorial-lang-btn");
  if (tutLangBtn) tutLangBtn.textContent = strings.ui.tutorialLangButton;

  const loaderSubtitle = document.querySelector(".loading-subtitle");
  const loaderSubtext = document.querySelector(".loading-subtext");
  if (loaderSubtitle) loaderSubtitle.textContent = strings.loader.subtitle;
  if (loaderSubtext) loaderSubtext.textContent = strings.loader.subtext;

  const lieuInput = document.getElementById("lieu-filter");
  if (lieuInput) lieuInput.placeholder = strings.ui.searchPlaceholder;

  const countryChartContainer = document.getElementById("country-chart-container");
  if (countryChartContainer) {
    const hasCanvasOrBars = countryChartContainer.querySelector("canvas, .chart-bars");
    if (!hasCanvasOrBars) {
      countryChartContainer.innerHTML = `<p class="chart-placeholder">${strings.ui.chartSearchCountry}</p>`;
    }
  }

  const authorsChartContainer = document.getElementById("authors-chart-container");
  if (authorsChartContainer) {
    const hasBars = authorsChartContainer.querySelector(".chart-bars");
    if (!hasBars) {
      authorsChartContainer.innerHTML = `<p class="chart-placeholder">${lang === "en"
        ? "Select an author to display statistics."
        : "Sélectionnez un auteur pour afficher les statistiques."
        }</p>`;
    }
  }

  bindCreditsModalOnce();

  const footer = document.getElementById("footer-credits");
  if (footer && ui.footerCredits) {
    footer.innerHTML = ui.footerCredits;
  }
}

function openCreditsModal({ title, html }) {
  const modal = document.getElementById("credits-modal");
  const t = document.getElementById("credits-title");
  const b = document.getElementById("credits-body");
  if (!modal || !t || !b) return;

  t.textContent = title || "";
  b.innerHTML = html || "";

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeCreditsModal() {
  const modal = document.getElementById("credits-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

let creditsBound = false;
function bindCreditsModalOnce() {
  if (creditsBound) return;
  creditsBound = true;

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest?.("[data-open-credits]");
    const closeBtn = e.target.closest?.("[data-close-credits]");

    if (closeBtn) {
      closeCreditsModal();
      return;
    }

    if (openBtn) {
      const key = openBtn.getAttribute("data-open-credits");
      const lang = window.currentLang || "en";
      const ui = UI_STRINGS[lang]?.ui;

      if (key === "flaticon") {
        openCreditsModal({
          title: lang === "en" ? "Icon credits (Flaticon)" : "Crédits des icônes (Flaticon)",
          html: ui?.flaticonCredits || ""
        });
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCreditsModal();
  });
}
