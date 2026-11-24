// Snow Globe Atlas — configuration
// Everything you might want to tweak lives in this file.

const CONFIG = {
  // Google Sheets published as CSV (File → Share → Publish to web → CSV).
  // Columns read: city, country, country_code, continent, latitude, longitude
  // Optional:     photo, date_added, notes
  sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQodB81nwsmqRIw4dE_HUsbDt7kOhSEsRcq0yilv-F037j7cXWvYMiceHYq_zwSh3klICQ2OQokHJvR/pub?gid=302830052&single=true&output=csv',

  // Folder in this repository holding the photos (column "photo" = file name).
  photosFolder: 'photos/',

  // Free vector base map (no API key). Re-coloured to dark in globe.js.
  baseStyle: 'https://tiles.openfreemap.org/styles/positron',

  // Reference point for distances and the "farthest snow globe" record.
  home: { name: 'Bern', lat: 46.948, lng: 7.4474 },

  // Collection started in…
  since: 2014,
};

// Continent palette — luminous accents for the dark globe.
const CONTINENTS = {
  'Europe':        { color: '#5cb8ff', short: 'Europe' },
  'Asia':          { color: '#ffa552', short: 'Asia' },
  'Africa':        { color: '#4fe0a0', short: 'Africa' },
  'North America': { color: '#ff6f86', short: 'N. America' },
  'South America': { color: '#f7d354', short: 'S. America' },
  'Oceania':       { color: '#46e3e3', short: 'Oceania' },
};
const DEFAULT_COLOR = '#cfd8ea';

// Dark map palette used to re-colour the base style.
const MAP_COLORS = {
  space:      '#05070f',
  land:       '#121a2c',
  landAlt:    '#152037',
  water:      '#070c18',
  waterLine:  '#0d1526',
  border:     '#2b3b5e',
  borderSoft: '#1f2b45',
  road:       '#1b2640',
  building:   '#18223a',
  label:      '#8fa0c4',
  labelSoft:  '#5f6f93',
  halo:       '#0a0f1d',
};
