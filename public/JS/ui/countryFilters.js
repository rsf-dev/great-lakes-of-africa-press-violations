// JS/ui/countryFilters.js

export const CountryFilters = (() => {
  let deps = null;

  function setInputValue(v) {
    const input = document.getElementById("lieu-filter");
    if (input) input.value = v || "";
  }

  function hideDropdown() {
    const dd = document.getElementById("lieu-dropdown");
    if (dd) dd.classList.add("hidden");
  }

  function clearDropdown() {
    const dd = document.getElementById("lieu-dropdown");
    if (dd) {
      dd.innerHTML = "";
      dd.classList.add("hidden");
    }
  }

  function clearVilleSelect() {
    const select = document.getElementById("ville-select");
    if (select) {
      select.innerHTML = "";
      select.classList.add("hidden");
    }
  }

  function renderCountrySuggestions(text) {
    const { getState, setSelectedCountry, setSelectedVille, setVillesDisponibles } = deps;
    const { countrysDisponibles, allEvents } = getState();

    const dd = document.getElementById("lieu-dropdown");
    if (!dd) return;

    dd.innerHTML = "";

    const filtered = (countrysDisponibles || []).filter(o =>
      String(o).toLowerCase().includes(String(text).toLowerCase())
    );

    if (!filtered.length) {
      dd.classList.add("hidden");
      return;
    }

    filtered.forEach(country => {
      const btn = document.createElement("button");
      btn.className = "lieu-option";
      btn.textContent = country;

      btn.addEventListener("mousedown", e => {
        e.preventDefault();

        deps.pausePlayback?.();

        setSelectedCountry(country);
        setSelectedVille(null);
        setInputValue(country);
        dd.classList.add("hidden");

        deps.updateCountryPanel?.(country);
        deps.setRightPanelExpanded?.(true);

        // villes dispos
        const villes = Array.from(
          new Set(
            allEvents
              .filter(ev => deps.getEventCountry(ev) === country)
              .map(ev => ev.lieu)
          )
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

        setVillesDisponibles(villes);

        // highlight country + rerender
        const ev0 = allEvents.find(ev => deps.getEventCountry(ev) === country);
        if (ev0) deps.highlightCountryForEvent?.(ev0);
        deps.zoomToCountry?.(country);
        deps.afficherEvenements?.();
        initVilleDropdown(); // refresh select
      });

      dd.appendChild(btn);
    });

    dd.classList.remove("hidden");
  }

  function initVilleDropdown() {
    const { getState, setSelectedVille } = deps;
    const { villesDisponibles, currentLang, selectedCountry, allEvents } = getState();

    const select = document.getElementById("ville-select");
    if (!select) return;

    select.innerHTML = "";
    select.classList.remove("hidden");

    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = (currentLang === "en") ? "All cities" : "Toutes les villes";
    select.appendChild(optAll);

    (villesDisponibles || []).forEach(ville => {
      const opt = document.createElement("option");
      opt.value = ville;
      opt.textContent = ville;
      select.appendChild(opt);
    });

    select.onchange = () => {
      deps.pausePlayback?.();
      const v = select.value || null;
      setSelectedVille(v);
      deps.afficherEvenements?.();

      if (v) {
        const ev0 = allEvents.find(ev =>
          ev.lieu === v && deps.getEventCountry(ev) === selectedCountry
        );
        if (ev0 && Number.isFinite(ev0.lat) && Number.isFinite(ev0.lng) && deps.map) {
          deps.map.setView([ev0.lat, ev0.lng], 7);
        }
      }
    };
  }

  function clearFiltersPreservePlayback({ resetZoom = false } = {}) {
    const {
      setSelectedCountry,
      setSelectedVille,
      setVillesDisponibles,
      map,
      INITIAL_CENTER,
      INITIAL_ZOOM
    } = deps;

    setSelectedCountry(null);
    setSelectedVille(null);
    setVillesDisponibles([]);

    setInputValue("");
    clearDropdown();
    clearVilleSelect();

    deps.clearCountryHighlight?.();
    deps.resetLastHighlightedCountry?.();
    deps.updateCountryPanel?.(null);

    if (resetZoom && map) {
      map.flyTo(INITIAL_CENTER, INITIAL_ZOOM, { animate: true, duration: 0.8 });
    }

    deps.afficherEvenements?.();
  }

  function buildCountryListFromEvents(allEvents) {
    const s = new Set();
    (allEvents || []).forEach(ev => {
      const o = deps.getEventCountry(ev);
      if (o) s.add(o);
    });

    return Array.from(s).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }

  function init(initDeps) {
    deps = initDeps;

    const input = document.getElementById("lieu-filter");
    const resetBtn = document.getElementById("lieu-reset");

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        deps.pausePlayback?.();
        clearFiltersPreservePlayback({ resetZoom: false });
      });
    }

    if (input) {
      input.addEventListener("input", () => {
        const val = input.value.trim();
        if (val.length < 1) {
          deps.pausePlayback?.();
          clearFiltersPreservePlayback({ resetZoom: false });
          return;
        }
        renderCountrySuggestions(val);
      });
    }
  }

  function setCountrysList(countrys) {
    // on stocke dans le state via setter
    deps.setCountrysDisponibles?.(countrys || []);
  }

  return {
    init,
    setCountrysList,
    buildCountryListFromEvents,
    initVilleDropdown,
    clearFiltersPreservePlayback
  };
})();
