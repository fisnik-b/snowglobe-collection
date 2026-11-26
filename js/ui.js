// mySnowglobes — interface components

const UI = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const fmt = new Intl.NumberFormat('en-US');
  const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
  const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => (t.hidden = true), 300);
    }, ms);
  }

  // ---------- Continent chips ----------
  function renderChips(globes, active, onPick) {
    const counts = globes.reduce((a, g) => (a[g.continent] = (a[g.continent] || 0) + 1, a), {});
    const order = Object.keys(CONTINENTS).filter(c => counts[c]).concat(Object.keys(counts).filter(c => !CONTINENTS[c]));
    const chip = (key, label, n, color) => `
      <button class="chip${active === key ? ' active' : ''}" data-continent="${esc(key)}" style="--c:${color}" aria-pressed="${active === key}">
        ${key === 'all' ? '' : '<span class="dot"></span>'}${esc(label)} <span class="n">${n}</span>
      </button>`;
    const nav = $('#chips');
    nav.innerHTML = chip('all', 'All', globes.length, '#ffffff') +
      order.map(c => chip(c, (CONTINENTS[c] || {}).short || c, counts[c], (CONTINENTS[c] || {}).color || DEFAULT_COLOR)).join('');
    nav.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => onPick(b.dataset.continent)));
  }

  // ---------- Vitrine: shelves of snow globes, one section per continent ----------
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-');

  function miniGlobe(g, i) {
    const s1 = 20 + (i * 7) % 24, s2 = 42 - (i * 5) % 16;
    return `
      <svg class="mini" viewBox="0 0 64 74" aria-hidden="true">
        <path d="M13 57h38l5 14H8z" fill="#1d2c50" stroke="rgba(156,199,255,.45)"/>
        <rect x="18" y="61" width="28" height="5" rx="1" fill="#c9a24a" opacity=".85"/>
        <circle cx="32" cy="32" r="25" fill="#13213f" stroke="rgba(207,226,255,.55)" stroke-width="1.5"/>
        <circle cx="32" cy="38" r="16" fill="${g.color}" opacity=".16"/>
        <circle cx="${s1}" cy="18" r="1.1" fill="#fff"/><circle cx="${s2}" cy="14" r=".9" fill="#fff"/><circle cx="${24 + (i * 3) % 16}" cy="50" r=".9" fill="#fff" opacity=".7"/>
        <path d="M17 22q4-7 12-8" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="mini-flag">${g.flag}</span>`;
  }

  function tileArt(g, i) {
    if (g.photo) {
      return `<img src="${esc(g.photo)}" alt="" loading="lazy" decoding="async"
        onerror="this.parentNode.classList.remove('has-photo');this.outerHTML=this.parentNode.dataset.fallback">`;
    }
    return miniGlobe(g, i);
  }

  function renderVitrine(list, onOpen) {
    const box = $('#vitrine');
    if (!list.length) {
      box.innerHTML = '<p class="empty">No snow globe here yet.</p>';
      return;
    }
    const groups = [];
    list.forEach(g => {
      let grp = groups[groups.length - 1];
      if (!grp || grp.name !== g.continent) groups.push(grp = { name: g.continent, color: g.color, items: [] });
      grp.items.push(g);
    });
    let n = 0;
    box.innerHTML = groups.map(grp => {
      let rows = '';
      for (let r = 0; r < grp.items.length; r += 4) {
        rows += '<div class="shelf">' + grp.items.slice(r, r + 4).map(g => {
          const i = n++;
          const fallback = esc(miniGlobe(g, i));
          return `
          <button class="tile${g.photo ? ' has-photo' : ''}" data-id="${esc(g.id)}" aria-label="${esc(g.city)}, ${esc(g.country)}">
            <span class="tile-art" data-fallback="${fallback}">${tileArt(g, i)}</span>
            <span class="tile-name">${esc(g.city)}</span>
          </button>`;
        }).join('') + '</div>';
      }
      return `
        <section class="aisle" id="aisle-${slug(grp.name)}" style="--c:${grp.color}">
          <h3 class="aisle-head"><span class="dot"></span>${esc(grp.name)}<span class="aisle-count">${grp.items.length}</span></h3>
          ${rows}
        </section>`;
    }).join('');
    box.querySelectorAll('.tile').forEach(t => t.addEventListener('click', () => onOpen(t.dataset.id)));
  }

  function renderSummary(stats) {
    $('#drawer-summary').innerHTML =
      `Collected since ${CONFIG.since}`;
    $('#brand-sub').textContent = `${stats.total} cities in ${stats.countries} countries`;
  }

  // ---------- Stats ----------
  function renderStats(s, onOpen) {
    const maxCountry = s.sortedCountries[0] ? s.sortedCountries[0][1] : 1;
    const continents = Object.entries(s.byContinent).sort((a, b) => b[1] - a[1]);
    const years = Object.entries(s.byYear).sort((a, b) => a[0] - b[0]);
    const maxYear = Math.max(1, ...years.map(y => y[1]));
    const record = (label, g, value) => g ? `
      <button class="record" data-id="${esc(g.id)}">
        <span class="record-label">${label}</span>
        <span class="record-value">${g.flag} ${esc(g.city)}</span>
        <span class="record-sub">${value}</span>
      </button>` : '';

    $('#panel-stats').innerHTML = `
      <div class="kpis">
        <div class="kpi"><span>${s.total}</span>snow globes</div>
        <div class="kpi"><span>${s.countries}</span>countries</div>
      </div>

      <h3 class="section-title">By continent</h3>
      <div class="stack-bar" role="img" aria-label="Share of snow globes by continent">
        ${continents.map(([c, n]) => `<span style="flex:${n};--c:${(CONTINENTS[c] || {}).color || DEFAULT_COLOR}" title="${esc(c)}: ${n}"></span>`).join('')}
      </div>
      <ul class="legend">
        ${continents.map(([c, n]) => `<li style="--c:${(CONTINENTS[c] || {}).color || DEFAULT_COLOR}"><span class="dot"></span>${esc(c)}<b>${n}</b></li>`).join('')}
      </ul>

      <h3 class="section-title">Records</h3>
      <div class="records">
        ${record(`Farthest from ${esc(CONFIG.home.name)}`, s.farthest, s.farthest ? fmt.format(Math.round(s.farthest.distance)) + ' km' : '')}
        ${record('Northernmost', s.northernmost, s.northernmost ? s.northernmost.lat.toFixed(1) + '° N' : '')}
        ${record('Southernmost', s.southernmost, s.southernmost ? Math.abs(s.southernmost.lat).toFixed(1) + (s.southernmost.lat < 0 ? '° S' : '° N') : '')}
        ${s.latest ? record('Latest addition', s.latest, monthFmt.format(s.latest.date)) : ''}
      </div>

      ${years.length ? `
      <h3 class="section-title">Added per year</h3>
      <div class="years">
        ${years.map(([y, n]) => `<div class="year"><span class="year-bar" style="height:${(n / maxYear) * 100}%"><b>${n}</b></span><span class="year-label">${y}</span></div>`).join('')}
      </div>` : ''}

      <h3 class="section-title">Countries</h3>
      <ul class="countries">
        ${s.sortedCountries.map(([c, n]) => `
          <li>
            <span class="c-name">${s.flags[c] || '🌍'} ${esc(c)}</span>
            <span class="c-bar"><span style="width:${(n / maxCountry) * 100}%"></span></span>
            <b>${n}</b>
          </li>`).join('')}
      </ul>`;
    $('#panel-stats').querySelectorAll('.record').forEach(r => r.addEventListener('click', () => onOpen(r.dataset.id)));
  }

  // ---------- Drawer (bottom sheet on mobile, side panel on desktop) ----------
  function setupDrawer() {
    const drawer = $('#drawer');
    const handle = $('#drawer-handle');
    const states = ['peek', 'half', 'full'];
    document.body.dataset.drawer = drawer.dataset.state;
    let startY = 0, startOffset = 0, dragging = false, moved = false;

    const visible = (state) => {
      const h = window.innerHeight;
      return { peek: 118, half: Math.round(h * 0.5), full: Math.round(h * 0.88) }[state];
    };
    const offsetFor = (state) => drawer.offsetHeight - visible(state);

    function set(state) {
      drawer.dataset.state = state;
      document.body.dataset.drawer = state;
      drawer.style.transform = '';
    }

    function onDown(e) {
      if (isDesktop()) return;
      dragging = true; moved = false;
      startY = e.clientY;
      startOffset = offsetFor(drawer.dataset.state);
      drawer.classList.add('dragging');
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 4) moved = true;
      const off = Math.max(offsetFor('full'), Math.min(offsetFor('peek'), startOffset + dy));
      drawer.style.transform = `translateY(${off}px)`;
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      drawer.classList.remove('dragging');
      if (!moved) {
        // a simple tap cycles peek → half → full → peek
        return set({ peek: 'half', half: 'full', full: 'peek' }[drawer.dataset.state]);
      }
      const dy = e.clientY - startY;
      const current = startOffset + dy;
      // snap: follow a flick, otherwise nearest state
      let target;
      if (Math.abs(dy) > 60) {
        const i = states.indexOf(drawer.dataset.state);
        target = states[Math.max(0, Math.min(2, i + (dy < 0 ? 1 : -1)))];
      } else {
        target = states.reduce((best, s) => Math.abs(offsetFor(s) - current) < Math.abs(offsetFor(best) - current) ? s : best, 'peek');
      }
      set(target);
    }

    [handle, $('.drawer-summary')].forEach(el => {
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    });
    handle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        set(drawer.dataset.state === 'peek' ? 'half' : 'peek');
      }
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
      $('#panel-collection').hidden = tab.dataset.tab !== 'collection';
      $('#panel-stats').hidden = tab.dataset.tab !== 'stats';
      $('#drawer-body').scrollTop = 0;
      if (drawer.dataset.state === 'peek') set('half');
    }));

    return {
      set,
      get state() { return drawer.dataset.state; },
      visibleHeight: () => (isDesktop() ? 0 : visible(drawer.dataset.state)),
    };
  }

  // ---------- Search ----------
  function setupSearch(getGlobes, onOpen) {
    const input = $('#search'), list = $('#search-results'), clear = $('#search-clear');
    let results = [], active = -1;

    function render() {
      const q = norm(input.value.trim());
      clear.hidden = !input.value;
      if (!q) { list.hidden = true; return; }
      results = getGlobes()
        .map(g => {
          const city = norm(g.city), country = norm(g.country), cont = norm(g.continent);
          const score = city.startsWith(q) ? 0 : country.startsWith(q) ? 1 : city.includes(q) ? 2 : (country.includes(q) || cont.includes(q)) ? 3 : 9;
          return { g, score };
        })
        .filter(r => r.score < 9)
        .sort((a, b) => a.score - b.score || a.g.city.localeCompare(b.g.city))
        .slice(0, 8)
        .map(r => r.g);
      active = results.length ? 0 : -1;
      list.innerHTML = results.length
        ? results.map((g, i) => `<li role="option" data-id="${esc(g.id)}" class="${i === active ? 'active' : ''}" aria-selected="${i === active}">
            <span class="r-flag">${g.flag}</span><span class="r-city">${esc(g.city)}</span><span class="r-country">${esc(g.country)}</span></li>`).join('')
        : '<li class="none">No match — maybe the next trip?</li>';
      list.hidden = false;
      list.querySelectorAll('li[data-id]').forEach(li => li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(li.dataset.id); }));
    }

    function pick(id) {
      input.value = '';
      clear.hidden = true;
      list.hidden = true;
      input.blur();
      onOpen(id);
    }

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', () => setTimeout(() => (list.hidden = true), 120));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!results.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
        list.querySelectorAll('li[data-id]').forEach((li, i) => { li.classList.toggle('active', i === active); li.setAttribute('aria-selected', i === active); });
      } else if (e.key === 'Enter' && results[active]) {
        e.preventDefault(); // otherwise Enter also "clicks" the newly focused close button
        pick(results[active].id);
      } else if (e.key === 'Escape') {
        input.value = ''; render(); input.blur();
      }
    });
    clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  }

  // ---------- Snowfall in the detail hero ----------
  const Snow = (() => {
    let raf, flakes = [], until = 0;
    const canvas = () => $('#snow');
    function start(duration = 4200) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const c = canvas(), ctx = c.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth, h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = Array.from({ length: Math.round(w / 6) }, () => ({
        x: Math.random() * w, y: Math.random() * -h, r: 0.8 + Math.random() * 2.4,
        vy: 0.4 + Math.random() * 1.1, drift: Math.random() * Math.PI * 2,
      }));
      until = performance.now() + duration;
      cancelAnimationFrame(raf);
      const tick = (t) => {
        ctx.clearRect(0, 0, w, h);
        const fade = Math.max(0, Math.min(1, (until - t) / 900));
        flakes.forEach(f => {
          f.y += f.vy; f.drift += 0.02; f.x += Math.sin(f.drift) * 0.35;
          if (f.y > h + 4 && t < until - 900) { f.y = -4; f.x = Math.random() * w; }
          ctx.globalAlpha = 0.85 * fade;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff'; ctx.fill();
        });
        if (fade > 0) raf = requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, w, h);
      };
      raf = requestAnimationFrame(tick);
    }
    function stop() { cancelAnimationFrame(raf); const c = canvas(); c.getContext('2d').clearRect(0, 0, c.width, c.height); }
    return { start, stop };
  })();

  // ---------- Detail sheet ----------
  function renderDetail(g, pos, total) {
    const hero = $('#detail-hero');
    hero.style.setProperty('--c', g.color);
    hero.querySelectorAll('.hero-img, .hero-ph').forEach(n => n.remove());
    const holder = document.createElement('div');
    if (g.photo) {
      holder.className = 'hero-img';
      holder.innerHTML = `<img src="${esc(g.photo)}" alt="Snow globe from ${esc(g.city)}">`;
      holder.querySelector('img').addEventListener('error', () => {
        holder.className = 'hero-ph';
        holder.innerHTML = placeholderHTML(g);
      });
    } else {
      holder.className = 'hero-ph';
      holder.innerHTML = placeholderHTML(g);
    }
    hero.prepend(holder);

    $('#detail-city').textContent = g.city;
    $('#detail-country').textContent = `${g.flag}  ${g.country}` + (g.date ? `, ${g.date.getFullYear()}` : '');
    const meta = [
      `<span class="tag" style="--c:${g.color}"><span class="dot"></span>${esc(g.continent)}</span>`,
      g.date ? `<span class="tag">Added in ${esc(monthFmt.format(g.date))}</span>` : '',
      `<span class="tag">${fmt.format(Math.round(g.distance))} km from ${esc(CONFIG.home.name)}</span>`,
    ];
    $('#detail-meta').innerHTML = meta.join('');
    const notes = $('#detail-notes');
    notes.textContent = g.notes;
    notes.hidden = !g.notes;
    $('#detail-pos').textContent = `${pos + 1} / ${total}`;
  }

  function placeholderHTML(g) {
    return `
      <svg class="globe-art" viewBox="0 0 120 140" aria-hidden="true">
        <defs>
          <radialGradient id="glass" cx="38%" cy="32%" r="70%">
            <stop offset="0" stop-color="#ffffff" stop-opacity=".35"/>
            <stop offset=".55" stop-color="#ffffff" stop-opacity=".06"/>
            <stop offset="1" stop-color="#ffffff" stop-opacity=".14"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="58" r="46" fill="#162342"/>
        <circle cx="60" cy="58" r="46" fill="url(#glass)" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>
      </svg>
      <span class="hero-flag">${g.flag}</span>
      <span class="hero-note">Photo coming soon</span>`;
  }

  return { toast, renderChips, renderVitrine, renderSummary, renderStats, setupDrawer, setupSearch, renderDetail, Snow, isDesktop, $ };
})();
