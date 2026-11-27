// mySnowglobes — 3D globe (MapLibre GL JS + OpenFreeMap)

const Globe = (() => {
  let map, onSelect, fontStack = ['Noto Sans Regular'];
  let spinning = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let interacting = false;
  let selectedId = null;

  // ---------- Base style: fetch Positron and re-colour it for the night ----------
  async function buildStyle() {
    let style;
    try {
      const res = await fetch(CONFIG.baseStyle);
      if (!res.ok) throw new Error(res.status);
      style = await res.json();
    } catch (e) {
      console.warn('Base map unavailable, using a plain globe', e);
      style = {
        version: 8,
        glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
        sources: {},
        layers: [{ id: 'background', type: 'background' }],
      };
    }

    const C = MAP_COLORS;
    const hidden = /poi|housenumber|highway|road|transport|airport|aerodrome|aeroway|railway|rail|mountain|peak|park_label|building/;

    style.layers = style.layers.filter(l => l.type !== 'fill-extrusion' && l.type !== 'hillshade');
    style.layers.forEach(l => {
      const id = l.id.toLowerCase();
      l.paint = l.paint || {};
      l.layout = l.layout || {};

      if (l.type === 'background') {
        l.paint = { 'background-color': C.land };
      } else if (l.type === 'fill') {
        delete l.paint['fill-pattern'];
        let color = C.land, opacity = 1;
        if (id.includes('water') || id.includes('ocean')) color = C.water;
        else if (id.includes('building')) { color = C.building; opacity = 0.6; }
        else if (/park|wood|forest|grass|landcover|landuse|ice|glacier|sand|wetland/.test(id)) { color = C.landAlt; opacity = 0.5; }
        l.paint['fill-color'] = color;
        l.paint['fill-opacity'] = opacity;
        l.paint['fill-outline-color'] = color;
      } else if (l.type === 'line') {
        delete l.paint['line-pattern'];
        let color = C.road, opacity = 0.7;
        if (id.includes('waterway') || id.includes('river')) { color = C.waterLine; opacity = 1; }
        else if (id.includes('boundary') || id.includes('admin')) {
          const country = id.includes('country') || id.includes('2') || id.includes('disputed');
          color = country ? C.border : C.borderSoft;
          opacity = country ? 0.9 : 0.5;
        }
        l.paint['line-color'] = color;
        l.paint['line-opacity'] = opacity;
      } else if (l.type === 'symbol') {
        if (hidden.test(id)) {
          l.layout.visibility = 'none';
        } else {
          // reuse the base map's font for our labels (plain list of font names only)
          const f = l.layout['text-font'];
          if (Array.isArray(f) && f.length && f.every(x => typeof x === 'string' && x.includes(' '))) fontStack = f;
          const strong = id.includes('country') || id.includes('continent');
          l.paint['text-color'] = strong ? C.label : C.labelSoft;
          l.paint['text-halo-color'] = C.halo;
          l.paint['text-halo-width'] = 1.2;
          l.paint['icon-opacity'] = 0;
        }
      }
    });

    // Globe + atmosphere
    style.projection = { type: 'globe' };
    style.sky = {
      'sky-color': '#0b1a3a',
      'horizon-color': '#2a4f99',
      'fog-color': '#0b1a3a',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.8,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 0.8, 7, 0],
    };
    return style;
  }

  // ---------- Data layers ----------
  function toGeoJSON(globes) {
    return {
      type: 'FeatureCollection',
      features: globes.map(g => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
        properties: { id: g.id, city: g.city, color: g.color },
      })),
    };
  }

  function addLayers() {
    // Countries with at least one snow globe, softly tinted (borders: Natural Earth, public domain)
    const base = map.getStyle().layers;
    const firstAbove = base.find(l => l.type === 'symbol' || (l.type === 'line' && /boundary|admin/.test(l.id)));
    map.addSource('countries', { type: 'geojson', data: CONFIG.countriesFile });
    map.addLayer({
      id: 'country-tint', type: 'fill', source: 'countries',
      filter: ['in', ['get', 'c'], ['literal', []]],
      paint: {
        'fill-color': DEFAULT_COLOR,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.22, 5, 0.14, 8, 0.06],
      },
    }, firstAbove && firstAbove.id);
    map.addLayer({
      id: 'country-edge', type: 'line', source: 'countries',
      filter: ['in', ['get', 'c'], ['literal', []]],
      paint: {
        'line-color': DEFAULT_COLOR,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.45, 6, 0.25],
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.6, 6, 1.2],
      },
    }, firstAbove && firstAbove.id);

    map.addSource('globes', {
      type: 'geojson',
      data: toGeoJSON([]),
      cluster: true,
      clusterRadius: 38,
      clusterMaxZoom: 7,
    });

    const clusterRadius = ['step', ['get', 'point_count'], 15, 5, 19, 15, 24];

    map.addLayer({
      id: 'cluster-glow', type: 'circle', source: 'globes', filter: ['has', 'point_count'],
      paint: { 'circle-radius': ['+', clusterRadius, 10], 'circle-color': '#7fb6ff', 'circle-opacity': 0.16, 'circle-blur': 0.9 },
    });
    map.addLayer({
      id: 'cluster', type: 'circle', source: 'globes', filter: ['has', 'point_count'],
      paint: {
        'circle-radius': clusterRadius,
        'circle-color': '#13213f',
        'circle-opacity': 0.92,
        'circle-stroke-color': '#9cc7ff',
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': 0.75,
      },
    });
    map.addLayer({
      id: 'cluster-count', type: 'symbol', source: 'globes', filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': fontStack, 'text-size': 13, 'text-allow-overlap': true },
      paint: { 'text-color': '#ffffff' },
    });

    map.addLayer({
      id: 'point-glow', type: 'circle', source: 'globes', filter: ['!', ['has', 'point_count']],
      paint: { 'circle-radius': 16, 'circle-color': ['get', 'color'], 'circle-opacity': 0.35, 'circle-blur': 1 },
    });
    map.addLayer({
      id: 'point', type: 'circle', source: 'globes', filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 5, 6, 7, 10, 9],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': 0.9,
      },
    });
    map.addLayer({
      id: 'point-selected', type: 'circle', source: 'globes', filter: ['==', ['get', 'id'], ''],
      paint: {
        'circle-radius': 15,
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });
    map.addLayer({
      id: 'point-label', type: 'symbol', source: 'globes', filter: ['!', ['has', 'point_count']], minzoom: 3.2,
      layout: {
        'text-field': ['get', 'city'], 'text-font': fontStack, 'text-size': 12,
        'text-offset': [0, 1.25], 'text-anchor': 'top', 'text-optional': true,
      },
      paint: { 'text-color': '#dfe8ff', 'text-halo-color': MAP_COLORS.halo, 'text-halo-width': 1.4 },
    });
  }

  function bindEvents() {
    const stopSpin = () => { interacting = true; spinning = false; };
    ['mousedown', 'touchstart', 'wheel', 'dragstart'].forEach(e => map.on(e, stopSpin));
    map.on('mouseup', () => (interacting = false));
    map.on('touchend', () => (interacting = false));
    map.on('moveend', spin);

    map.on('click', 'cluster', async (e) => {
      const f = e.features[0];
      const zoom = await map.getSource('globes').getClusterExpansionZoom(f.properties.cluster_id);
      map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(zoom + 0.3, 9), duration: 900 });
    });
    map.on('click', 'point', (e) => onSelect(e.features[0].properties.id));

    ['cluster', 'point'].forEach(layer => {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    });
  }

  // Slow rotation until the user touches the globe
  function spin() {
    if (!spinning || interacting || !map || map.getZoom() > 3) return;
    const c = map.getCenter();
    c.lng -= 4;
    map.easeTo({ center: c, duration: 1000, easing: t => t });
  }

  function startZoom() {
    const w = Math.min(window.innerWidth, window.innerHeight * 1.2);
    return w < 500 ? 0.9 : w < 900 ? 1.4 : 1.8;
  }

  // ---------- Public API ----------
  async function init(container, handlers) {
    onSelect = handlers.onSelect;
    const style = await buildStyle();
    map = new maplibregl.Map({
      container,
      style,
      center: [12, 30],
      zoom: startZoom(),
      minZoom: 0.6,
      maxZoom: 14,
      attributionControl: { compact: true },
      renderWorldCopies: false,
    });
    map.on('style.load', () => map.setProjection({ type: 'globe' }));
    await new Promise(resolve => map.on('load', resolve));
    addLayers();
    bindEvents();
    return map;
  }

  function setData(globes) {
    map.getSource('globes').setData(toGeoJSON(globes));
  }

  // Tint every country of the collection in its continent colour
  function setCountries(globes) {
    const colors = {};
    globes.forEach(g => { if (g.code && !colors[g.code]) colors[g.code] = g.color; });
    const codes = Object.keys(colors);
    const filter = ['in', ['get', 'c'], ['literal', codes]];
    const color = codes.length
      ? ['match', ['get', 'c'], ...codes.flatMap(c => [c, colors[c]]), DEFAULT_COLOR]
      : DEFAULT_COLOR;
    ['country-tint', 'country-edge'].forEach(id => map.setFilter(id, filter));
    map.setPaintProperty('country-tint', 'fill-color', color);
    map.setPaintProperty('country-edge', 'line-color', color);
  }

  function select(g, { fly = true, bottomPad = 0 } = {}) {
    spinning = false;
    selectedId = g.id;
    map.setFilter('point-selected', ['==', ['get', 'id'], g.id]);
    if (fly) {
      map.flyTo({
        center: [g.lng, g.lat],
        zoom: Math.max(map.getZoom(), 5.2),
        padding: { top: 40, bottom: bottomPad, left: 0, right: 0 },
        speed: 1.1, curve: 1.5, essential: true,
      });
    }
  }

  function clearSelection() {
    selectedId = null;
    map.setFilter('point-selected', ['==', ['get', 'id'], '']);
  }

  function fitTo(globes, padding) {
    if (!globes.length) return;
    if (globes.length === 1) return map.flyTo({ center: [globes[0].lng, globes[0].lat], zoom: 5, padding });
    const b = new maplibregl.LngLatBounds();
    globes.forEach(g => b.extend([g.lng, g.lat]));
    map.fitBounds(b, { padding, maxZoom: 5.5, duration: 1400 });
  }

  function resetView() {
    clearSelection();
    map.flyTo({ center: [12, 30], zoom: startZoom(), padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 1600, essential: true });
  }

  return { init, setData, setCountries, select, clearSelection, fitTo, resetView };
})();
