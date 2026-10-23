# ukraine_exactions_journalists

Guide pas à pas commun aux cartes, notamment pour les champs de fiche, les filtres et les niveaux GeoJSON : [GUIDE_ADMIN_CARTES.md](../GUIDE_ADMIN_CARTES.md).


## Rendu et réglages de la carte

- Les panneaux suivent le thème du fond choisi.
- `fonctionnalites.choropleth.enabled: true` conserve le bouton dans le menu. `actifParDefaut: false` démarre en mode marqueurs ; `true` démarre en choroplèthe. La réinitialisation respecte le même choix.
- `fonctionnalites.tutoriel.enabled: true` conserve le tutoriel dans le menu. `demarrageAutomatique: false` empêche son ouverture à l’arrivée ; `true` la réactive à la première visite.
- `stylesGeojson` centralise les contours et remplissages : `stroke`, `color`, `weight`, `opacity`, `fill`, `fillColor` et `fillOpacity`. `fillColor: null` reprend la couleur du contour.
- Les styles par pays sont dans `stylesGeojson.frontieresParPays` ; le style commun est dans `stylesGeojson.contour`.
- Le choroplèthe réutilise sa géométrie et actualise les styles en mémoire. Les compteurs et les infobulles suivent les filtres et la langue. Le survol ne modifie aucun contour.
- Une seule initialisation et un seul loader attendent le rendu final des tuiles et des couches. Les niveaux administratifs et les modules optionnels déclarés dans les réglages sont conservés.


## Fonds de carte et thèmes

Les sept fonds sont disponibles dans `carte.fonds` : Clair, Sombre, Fiord, Liberty, Bright, Satellite et Relief. Une seule entrée doit avoir `actifParDefaut: true`. Le fond initial propre à cette carte est conservé.

Chaque fond déclare `theme: "light"` ou `"dark"`. Sombre, Fiord et Satellite utilisent des panneaux noirs avec texte clair ; les autres fonds utilisent des panneaux blancs avec texte sombre. Les noms du fournisseur ne sont pas des valeurs de thème. `css/themes.css` regroupe les palettes des panneaux, formulaires, légendes, menus et contrôles. La chronologie redessine aussi ses axes et son fond au changement de thème.

Les tuiles Relief sont disponibles jusqu’au zoom natif 13 et Satellite jusqu’au zoom natif 23 ; `options.maxNativeZoom` permet de les agrandir aux zooms supérieurs autorisés par la carte. Les données, filtres, contours et options propres à la carte sont conservés.

Le menu burger ferme au clic extérieur et avec Échap, sans réinitialiser les filtres. Son attribut `hidden`, son état ouvert et `aria-expanded` sont synchronisés.

## Navigation vers les événements proches

En mode marqueurs, à partir du zoom 9 (la carte est limitée au zoom 10), un bouton fléché indique le groupe ou événement le plus proche hors écran ou caché par un panneau, lorsqu’il reste au plus une icône visible. Il reprend l’icône du cas ou le nombre d’événements du groupe et indique sa distance dans l’infobulle. Les cibles suivent les filtres et la période affichée ; le clic conserve le zoom final et place la cible dans une zone dégagée. La lecture est suspendue au clic.

Le bouton suit les thèmes clair et sombre. Il évite panneaux, titre, menu, zoom et légendes : marge de 56 px sur le pourtour en ordinateur ; placement au bas de la zone libre, au-dessus du titre, avec une marge de 20 px en mobile. Il se masque en choroplèthe, pendant les déplacements, sous les fenêtres et quand un panneau mobile ou l’encombrement ne laisse pas assez de place.

Dans `JS/reglages.js`, `fonctionnalites.navigationProche` regroupe `enabled`, `zoomMinimum`, `maximumVisibles`, `margeDesktop`, `margeMobile`, `espacementComposants`, `seuilMobile` et `dureeDeplacement` (secondes). `enabled: false` désactive la navigation. Les libellés suivent la langue de la carte.
