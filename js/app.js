// Snow Globe Atlas — app state and wiring

(async () => {
  const { $ } = UI;
  const state = {
    all: [],          // every snow globe
    continent: 'all', // active filter
    sort: 'newest',
    current: null,    // open snow globe
  };
  let drawer;

  // ---------- Derived lists ----------
  const filtered = () => state.continent === 'all' ? state.all : state.all.filter(g => g.continent === state.continent);

  function sorted(list) {
    const l = [...list];
    if (state.sort === 'city') return l.sort((a, b) => a.city.localeCompare(b.city));
    if (state.sort === 'country') return l.sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city));
    // newest: by date when present, otherwise the last rows of the sheet first
    return l.sort((a, b) => (b.date || 0) - (a.date || 0) || b.index - a.index);
  }
  const ordered = () => sorted(filtered());

  // ---------- Rendering ----------
  function renderAll() {
    UI.renderChips(state.all, state.continent, setContinent);
    UI.renderGrid(ordered(), open);
  }

  function setContinent(c) {
    state.continent = c;
    renderAll();
    Globe.setData(filtered());
    close({ silent: true });
    const pad = UI.isDesktop()
      ? { top: 140, bottom: 60, left: 440, right: 60 }
      : { top: 190, bottom: drawer.visibleHeight() + 30, left: 30, right: 30 };
    if (c === 'all') Globe.resetView();
    else Globe.fitTo(filtered(), pad);
  }

  // ---------- Detail ----------
  function open(id, { fly = true } = {}) {
    const g = state.all.find(x => x.id === id);
    if (!g) return;
    // if the snow globe is outside the current filter, show everything again
    if (state.continent !== 'all' && g.continent !== state.continent) {
      state.continent = 'all';
      renderAll();
      Globe.setData(state.all);
    }
    state.current = g;
    const list = ordered();
    UI.renderDetail(g, list.findIndex(x => x.id === g.id), list.length);

    const detail = $('#detail');
    const wasOpen = detail.classList.contains('open');
    detail.classList.add('open');
    detail.setAttribute('aria-hidden', 'false');
    document.body.classList.add('detail-open');
    if (!wasOpen) $('#detail-close').focus({ preventScroll: true });

    const sheetH = UI.isDesktop() ? 0 : detail.offsetHeight;
    Globe.select(g, { fly, bottomPad: sheetH });
    UI.Snow.start();

    if (location.hash.slice(1) !== g.id) history.replaceState(null, '', '#' + g.id);
  }

  function close({ silent = false } = {}) {
    const detail = $('#detail');
    if (!detail.classList.contains('open')) return;
    detail.classList.remove('open');
    detail.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('detail-open');
    UI.Snow.stop();
    Globe.clearSelection();
    state.current = null;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function step(dir) {
    if (!state.current) return;
    const list = ordered();
    const i = list.findIndex(x => x.id === state.current.id);
    const next = list[(i + dir + list.length) % list.length];
    open(next.id);
  }

  async function share() {
    const g = state.current;
    if (!g) return;
    const url = location.origin + location.pathname + '#' + g.id;
    const data = { title: `${g.city} · Snow Globe Atlas`, text: `${g.flag} ${g.city}, ${g.country}`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(url); UI.toast('Link copied'); }
    } catch (e) {
      if (e.name !== 'AbortError') UI.toast('Could not share this link');
    }
  }

  // Swipe on the detail sheet: left/right = next/previous, down = close
  function setupDetailGestures() {
    const el = $('#detail');
    let x0, y0, t0;
    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - x0, dy = t.clientY - y0;
      x0 = null;
      if (Date.now() - t0 > 700) return;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
      else if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.4 && el.scrollTop <= 0) close();
    }, { passive: true });
  }

  // ---------- Wiring ----------
  function wire() {
    $('#detail-close').addEventListener('click', () => close());
    $('#detail-prev').addEventListener('click', () => step(-1));
    $('#detail-next').addEventListener('click', () => step(1));
    $('#detail-share').addEventListener('click', share);
    $('#reset-view').addEventListener('click', () => { close(); if (state.continent !== 'all') setContinent('all'); else Globe.resetView(); });
    setupDetailGestures();

    document.querySelectorAll('.sort').forEach(b => b.addEventListener('click', () => {
      state.sort = b.dataset.sort;
      document.querySelectorAll('.sort').forEach(s => s.classList.toggle('active', s === b));
      UI.renderGrid(ordered(), open);
    }));

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input')) return;
      if (e.key === 'Escape') close();
      if (!state.current) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    window.addEventListener('hashchange', () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && (!state.current || state.current.id !== id)) open(id);
      if (!id) close();
    });
  }

  // ---------- Boot ----------
  try {
    drawer = UI.setupDrawer();
    UI.setupSearch(() => state.all, (id) => open(id));
    wire();

    const [globes] = await Promise.all([
      Data.load(),
      Globe.init('map', { onSelect: (id) => open(id) }),
    ]);
    state.all = globes;

    const stats = Data.stats(globes);
    UI.renderSummary(stats);
    UI.renderStats(stats, (id) => open(id));
    renderAll();
    Globe.setData(globes);

    document.body.classList.add('ready');
    setTimeout(() => $('#loader').remove(), 900);

    const id = decodeURIComponent(location.hash.slice(1));
    if (id) setTimeout(() => open(id), 600);
  } catch (err) {
    console.error(err);
    $('#loader').classList.add('error');
    $('#loader p').textContent = 'The collection could not be loaded. Check your connection and refresh.';
  }
})();
