// Snow Globe Atlas — data loading and helpers

const Data = (() => {
  // --- CSV parsing (handles quoted fields, commas and line breaks in quotes) ---
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return rows.slice(1)
      .filter(r => r.some(v => v.trim() !== ''))
      .map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
  }

  // --- Helpers ---
  const flag = code => {
    const cc = (code || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return '🌍';
    return String.fromCodePoint(...[...cc].map(ch => 0x1F1A5 + ch.charCodeAt(0)));
  };

  const slugify = s => (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const distanceKm = (lat1, lng1, lat2, lng2) => {
    const r = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * r / 2) ** 2 +
      Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lng2 - lng1) * r / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Accepts 2024-05, 2024-05-12, 05/2024, 12.05.2024, 2024 …
  function parseDate(v) {
    if (!v) return null;
    let m;
    if ((m = v.match(/^(\d{4})(?:[-/.](\d{1,2}))?(?:[-/.](\d{1,2}))?$/))) return new Date(+m[1], (+m[2] || 1) - 1, +m[3] || 1);
    if ((m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) return new Date(+m[3], +m[2] - 1, +m[1]);
    if ((m = v.match(/^(\d{1,2})[-/.](\d{4})$/))) return new Date(+m[2], +m[1] - 1, 1);
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }

  function photoUrl(v) {
    if (!v) return '';
    if (/^https?:\/\//i.test(v) || v.includes('/')) return v;
    return CONFIG.photosFolder + encodeURIComponent(v);
  }

  // --- Normalise rows into snow globe objects ---
  function normalise(rows) {
    const seen = {};
    const globes = [];
    rows.forEach((r, i) => {
      const lat = parseFloat(String(r.latitude).replace(',', '.'));
      const lng = parseFloat(String(r.longitude).replace(',', '.'));
      if (!r.city || isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        console.warn('Skipped row', i + 2, r);
        return;
      }
      let id = slugify(r.city) || 'globe';
      seen[id] = (seen[id] || 0) + 1;
      if (seen[id] > 1) id += '-' + seen[id];
      const date = parseDate(r.date_added);
      globes.push({
        id,
        index: globes.length,
        city: r.city,
        country: r.country || '',
        code: (r.country_code || '').toUpperCase(),
        flag: flag(r.country_code),
        continent: r.continent || 'Other',
        color: (CONTINENTS[r.continent] || {}).color || DEFAULT_COLOR,
        lat, lng,
        photo: photoUrl(r.photo),
        date,
        notes: r.notes || '',
        distance: distanceKm(CONFIG.home.lat, CONFIG.home.lng, lat, lng),
      });
    });
    return globes;
  }

  async function load() {
    const res = await fetch(CONFIG.sheetUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Sheet returned ' + res.status);
    return normalise(parseCSV(await res.text()));
  }

  function stats(globes) {
    const count = (key) => globes.reduce((acc, g) => (acc[g[key]] = (acc[g[key]] || 0) + 1, acc), {});
    const byCountry = count('country');
    const byContinent = count('continent');
    const flags = Object.fromEntries(globes.map(g => [g.country, g.flag]));
    const sortedCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const byDistance = [...globes].sort((a, b) => b.distance - a.distance);
    const byLat = [...globes].sort((a, b) => b.lat - a.lat);
    const dated = globes.filter(g => g.date);
    const byYear = dated.reduce((acc, g) => (acc[g.date.getFullYear()] = (acc[g.date.getFullYear()] || 0) + 1, acc), {});
    return {
      total: globes.length,
      countries: sortedCountries.length,
      continents: Object.keys(byContinent).length,
      sortedCountries, flags, byContinent,
      farthest: byDistance[0],
      northernmost: byLat[0],
      southernmost: byLat[byLat.length - 1],
      latest: dated.sort((a, b) => b.date - a.date)[0] || null,
      byYear,
    };
  }

  return { load, stats, flag, slugify };
})();
