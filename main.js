/* ============================================================
   Ahora — to the hour · interactions
   Content is loaded from published.json — compiled at deploy time from the
   album (content.json) and the published blogs (content/blogs/*.json) — so it
   can be edited from the /admin panel without touching code.
   ============================================================ */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // inline emphasis for the aside: **bold**, and *italic* / _italic_ (the aside is already italic by default)
  const fmt = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');

  /* ---------- Lenis: vertical inertia scrolling ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.45,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollTo = (el) =>
    lenis ? lenis.scrollTo(el, { duration: 1.6 })
          : window.scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'smooth' });

  /* ---------- reveals: the invitation staggers in when scrolled into view ---------- */
  const vio = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); vio.unobserve(e.target); } });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.invite .stagger').forEach((el) => vio.observe(el));

  /* ---------- the cover: "Ahora" arriving like rain on still water ----------
     First visit: A drops with a slow raindrop ripple, the long pause holds,
     then h-o-r-a bloom in together and the body settles in beneath. Returning
     to the cover keeps the word in place but re-drops the A. The ripple's
     colour and a live clock drift with the visitor's local hour. */
  function initCover() {
    const cover = document.querySelector('.cover');
    const word = cover && cover.querySelector('.word');
    if (!cover || !word) return;
    const bg = cover.querySelector('.bg-ripple');
    const clockEl = cover.querySelector('.clock');
    const body = cover.querySelector('.cover-body');

    // mirrors the CSS knobs, so the text settles once the word has formed
    const A_DELAY = 0.25, GAP_AH = 2.4, GAP_HORA = 0, RISE_HORA = 1.3;
    const lastLand = A_DELAY + GAP_AH + GAP_HORA * 3 + 0.16 + RISE_HORA;
    const KEY = 'ahora-cover-played';
    const root = document.documentElement;

    // a whisper of warmth across the day, always within the site's palette
    const tintForHour = (h) =>
      h < 6  ? ['116,126,120', '#717C74'] :
      h < 11 ? ['122,132,112', '#7A8470'] :
      h < 16 ? ['124,130,110', '#7A8470'] :
      h < 20 ? ['132,122,100', '#7E7058'] :
               ['126,110,90',  '#766452'];
    function tick() {
      const d = new Date();
      const [rgb, accent] = tintForHour(d.getHours());
      root.style.setProperty('--ripple-rgb', rgb);
      root.style.setProperty('--accent', accent);
      const p2 = (n) => String(n).padStart(2, '0');
      if (clockEl) clockEl.innerHTML = `now — <b>${p2(d.getHours())}:${p2(d.getMinutes())}</b>`;
    }
    tick();
    setInterval(tick, 30000);

    const bgRipple = () => { if (bg) { bg.classList.remove('go'); void bg.offsetWidth; bg.classList.add('go'); } };
    const revealText = () => { cover.classList.add('revealed'); if (body) body.classList.add('in'); };
    // the letters fall onto the still-water surface — splash where the "A" lands
    const splash = (power) => {
      if (!coverWaterDrop) return;
      const a = word.querySelector('.ltr');
      if (!a) return;
      const r = a.getBoundingClientRect();
      coverWaterDrop(r.left + r.width / 2, r.top + r.height * 0.6, power);
    };

    let timers = [];
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

    function playFull() {   // first visit: the word spells itself out
      clearTimers();
      word.classList.remove('settled', 'stir', 'play'); void word.offsetWidth;
      cover.classList.remove('revealed'); if (body) body.classList.remove('in');
      word.classList.add('play');
      timers.push(setTimeout(() => splash(750), (A_DELAY + 0.5) * 1000));   // A's raindrop
      timers.push(setTimeout(bgRipple, (lastLand - 0.15) * 1000));
      timers.push(setTimeout(() => splash(450), (lastLand - 0.1) * 1000));   // h-o-r-a settle
      timers.push(setTimeout(revealText, (lastLand - 0.1) * 1000));
      sessionStorage.setItem(KEY, '1');
    }
    function settle() {     // reduced motion: word + text simply present
      clearTimers();
      word.classList.remove('play', 'stir'); word.classList.add('settled');
      revealText();
    }
    function stir() {       // returning: A re-drops, the water stirs again
      clearTimers();
      word.classList.remove('play'); word.classList.add('settled');
      revealText();
      word.classList.remove('stir'); void word.offsetWidth; word.classList.add('stir');
      bgRipple();
      splash(650);   // the A re-drops onto the surface
    }

    new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        if (reduce) settle();
        else if (sessionStorage.getItem(KEY)) stir();
        else playFull();
      });
    }, { threshold: 0.55 }).observe(cover);
  }
  let coverWaterDrop = null;   // initCoverWater publishes this so the cover word can splash
  initCover();

  /* ============================================================
     CREATIVE-CODING LAYERS — quiet, time-aware, touch-friendly
       · cover  → still water (the letters fall onto it)
       · rest   → breath (a held minute, between album and pages)
       · .air   → dust, surfaced only during section transitions
     ============================================================ */
  const coarse = matchMedia('(pointer: coarse)').matches;
  const air = { opacity: 0, dark: 0 };   // driven by updateSections()
  const accentRGB = () => (getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb').trim() || '122,132,112').split(',').map(Number);

  // a tiny canvas runner: HiDPI sizing, pauses off-screen and when the tab is hidden
  function mountCanvas(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const dpr = opts.dpr || Math.min(2, devicePixelRatio || 1);
    let w = 0, h = 0, raf = 0, vis = !document.hidden, onScreen = !!opts.fixed, t0 = performance.now();
    function size() {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (opts.onsize) opts.onsize(w, h, ctx);
    }
    const ok = () => vis && onScreen && !reduce;
    function frame(now) { raf = ok() ? requestAnimationFrame(frame) : 0; opts.draw(ctx, w, h, (now - t0) / 1000, now); }
    function play() { if (!raf && ok()) { t0 = performance.now() - 16; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    document.addEventListener('visibilitychange', () => { vis = !document.hidden; vis ? play() : stop(); });
    addEventListener('resize', size);
    size();
    if (reduce) opts.draw(ctx, w, h, 0, performance.now());   // hold one still frame
    else if (opts.fixed) play();
    else new IntersectionObserver((es) => es.forEach((e) => { onScreen = e.isIntersecting; onScreen ? play() : stop(); }), { threshold: 0.02 }).observe(canvas);
  }

  /* ---------- 01 · STILL WATER (cover) ----------
     Ripple sim runs on a coarse grid; the shading is painted to a tiny
     cols×rows buffer and upscaled — so a finger-drag touches a few thousand
     cells, never millions of pixels. Rendered on the warm ground so the
     word stays readable. */
  function initCoverWater() {
    const cover = document.querySelector('.cover');
    const canvas = cover && cover.querySelector('.cover-water');
    if (!canvas) return;
    const scale = coarse ? 6 : 5;          // grid cell size; the sim only ever works on cols×rows cells
    // a GPU CSS blur on the element dissolves the upscaled grid into water — reliable
    // across browsers (unlike canvas ctx.filter, which mobile Safari often drops)
    canvas.style.filter = `blur(${coarse ? 7 : 5}px)`;
    const GROUND = [232, 228, 217];
    let cols = 0, rows = 0, cur, prev, off, octx, img;
    let nextRain = 1.5, acc = accentRGB();
    setInterval(() => { acc = accentRGB(); }, 30000);

    const drop = (gx, gy, power) => { if (gx > 0 && gy > 0 && gx < cols - 1 && gy < rows - 1) prev[gy * cols + gx] += power; };
    coverWaterDrop = (clientX, clientY, power) => {
      const r = canvas.getBoundingClientRect();
      drop(((clientX - r.left) / scale) | 0, ((clientY - r.top) / scale) | 0, power || 700);
    };

    // listen on the cover, not the canvas, so ripples span the whole field and
    // touch scrolling is never blocked (passive — we never preventDefault)
    const m = { x: 0, y: 0, px: 0, py: 0, on: false };
    const move = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      m.x = cx - r.left; m.y = cy - r.top;
      if (m.on) { const d = Math.hypot(m.x - m.px, m.y - m.py); if (d > 2) drop((m.x / scale) | 0, (m.y / scale) | 0, Math.min(150, d * 6)); }
      m.px = m.x; m.py = m.y; m.on = true;
    };
    cover.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
    cover.addEventListener('pointerdown', (e) => coverWaterDrop(e.clientX, e.clientY, 750), { passive: true });
    cover.addEventListener('pointerleave', () => { m.on = false; });

    function step() {
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        cur[i] = ((prev[i - 1] + prev[i + 1] + prev[i - cols] + prev[i + cols]) / 2 - cur[i]) * 0.965;
      }
      const t = prev; prev = cur; cur = t;
    }

    mountCanvas(canvas, {
      dpr: Math.min(1.75, devicePixelRatio || 1),   // enough target resolution for the blur to read as water
      onsize(w, h) {
        cols = Math.ceil(w / scale) + 2; rows = Math.ceil(h / scale) + 2;
        cur = new Float32Array(cols * rows); prev = new Float32Array(cols * rows);
        off = document.createElement('canvas'); off.width = cols; off.height = rows;
        octx = off.getContext('2d'); img = octx.createImageData(cols, rows);
      },
      draw(ctx, w, h, t) {
        if (t > nextRain) { drop((1 + Math.random() * (cols - 2)) | 0, (1 + Math.random() * (rows - 2)) | 0, 300); nextRain = t + 3.5 + Math.random() * 4.5; }
        step();
        const d = img.data, ar = acc[0], ag = acc[1], ab = acc[2];
        for (let i = 0, n = cols * rows; i < n; i++) {
          const slope = ((prev[i - 1] || 0) - (prev[i + 1] || 0)) + ((prev[i - cols] || 0) - (prev[i + cols] || 0)) * 0.5;
          let kk = slope * 0.04; kk = kk < -1 ? -1 : kk > 1 ? 1 : kk;   // surface tilt → light
          const o = i * 4;
          // crests lift toward warm light; troughs deepen and pick up the sage tint
          d[o]     = GROUND[0] + kk * (kk > 0 ? 18 : 30) + (kk < 0 ? (ar - GROUND[0]) * -kk * 0.22 : 0);
          d[o + 1] = GROUND[1] + kk * (kk > 0 ? 17 : 28) + (kk < 0 ? (ag - GROUND[1]) * -kk * 0.22 : 0);
          d[o + 2] = GROUND[2] + kk * (kk > 0 ? 14 : 22) + (kk < 0 ? (ab - GROUND[2]) * -kk * 0.22 : 0);
          d[o + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        // upscale the coarse grid; the CSS blur on the element removes the facets
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, cols, rows, 0, 0, w, h);
      }
    });
  }

  /* ---------- 04 · BREATH (the held minute) ---------- */
  function initBreath() {
    const canvas = document.querySelector('.breath-canvas');
    if (!canvas) return;
    const cueEl = document.getElementById('restCue');
    const PERIOD = 11;   // seconds per full breath ≈ 5.5 / min
    let last = '';
    mountCanvas(canvas, {
      draw(ctx, w, h, t) {
        const cx = w / 2, cy = h / 2;
        const p = (t % PERIOD) / PERIOD, inhale = p < 0.5;
        const local = inhale ? p / 0.5 : 1 - (p - 0.5) / 0.5;
        const e = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
        const R = Math.min(w, h) * 0.10 + e * Math.min(w, h) * 0.24;
        const [r, g, b] = accentRGB();
        ctx.clearRect(0, 0, w, h);
        for (let k = 3; k >= 0; k--) {
          ctx.beginPath(); ctx.strokeStyle = `rgba(${r},${g},${b},${(0.08 + 0.09 * (3 - k)).toFixed(3)})`;
          ctx.lineWidth = 1.1; ctx.arc(cx, cy, Math.max(1, R - k * 9), 0, 6.2832); ctx.stroke();
        }
        const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        rad.addColorStop(0, `rgba(${r},${g},${b},${(0.14 + e * 0.10).toFixed(3)})`);
        rad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = rad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
        if (cueEl) { const want = inhale ? 'breathe in' : 'breathe out'; if (want !== last) { last = want; cueEl.textContent = want; } }
      }
    });
  }

  /* ---------- 03 · DUST (connective air) ---------- */
  function initAir() {
    const canvas = document.querySelector('.air');
    if (!canvas) return;
    let motes = [], w = 0, h = 0;
    const spawn = () => ({ x: Math.random() * w, y: Math.random() * h, z: 0.3 + Math.random() * 0.7, vx: (Math.random() - 0.5) * 0.1, vy: -0.04 - Math.random() * 0.1, ph: Math.random() * 6.28 });
    mountCanvas(canvas, {
      fixed: true,
      dpr: coarse ? 1 : Math.min(1.5, devicePixelRatio || 1),
      onsize(cw, ch) { w = cw; h = ch; const n = Math.min(coarse ? 70 : 150, Math.round(cw * ch / 12000)); motes = Array.from({ length: n }, spawn); },
      draw(ctx, cw, ch) {
        ctx.clearRect(0, 0, cw, ch);
        if (air.opacity < 0.01) return;                  // settled on a light page — nothing to draw
        const dark = air.dark;                           // 1 over the album, 0 over the light pages
        const cr = (232 + (96 - 232) * (1 - dark)) | 0, cg = (228 + (94 - 228) * (1 - dark)) | 0, cb = (204 + (84 - 204) * (1 - dark)) | 0;
        const aMul = 0.55 + dark * 0.45;                 // brighter over the dark album
        for (const m of motes) {
          m.ph += 0.01; m.x += m.vx + Math.sin(m.ph) * 0.06 * m.z; m.y += m.vy;
          if (m.y < -4) { Object.assign(m, spawn()); m.y = h + 4; }
          if (m.x < -4) m.x = w + 4; else if (m.x > w + 4) m.x = -4;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${((0.24 + m.z * 0.58) * aMul).toFixed(3)})`;
          ctx.arc(m.x, m.y, m.z * 1.7 + 0.5, 0, 6.2832); ctx.fill();
        }
      }
    });
  }

  initCoverWater();
  initBreath();
  initAir();

  /* ---------- which big section the arrow keys belong to ---------- */
  let active = 'album';
  const sectO = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > 0.5) active = e.target.id; });
  }, { threshold: [0.5, 0.75] });
  ['album', 'reader'].forEach((id) => { const el = document.getElementById(id); if (el) sectO.observe(el); });

  /* ---------- Izanami-style vertical cross-fade of whole sections + header ---------- */
  const masthead = document.querySelector('.masthead');
  const albumEl = document.getElementById('album');
  const restEl = document.getElementById('rest');
  const dustLayer = document.querySelector('.air');
  const screens = [...document.querySelectorAll('section.screen')];
  // each section's signature colour — the page background blends between these as
  // you scroll, so whatever shows through the cross-fade always matches (no frames)
  const SECTION_BG = { cover: [232, 228, 217], album: [20, 26, 37], rest: [18, 21, 27], reader: [232, 228, 217], invite: [232, 228, 217] };
  function updateSections() {
    const vh = innerHeight;
    // read pass: gather all layout reads together so touch scrolling never thrashes
    const data = screens.map((s) => {
      const r = s.getBoundingClientRect();
      const dc = ((r.top + r.height / 2) - vh / 2) / vh;
      return { s, dc, op: clamp(0, 1, 1 - Math.abs(dc) / 0.72) };
    });
    // write pass
    let topOp = 0, albumOp = 0, restOp = 0, wr = 0, wg = 0, wb = 0, ws = 0;
    data.forEach(({ s, dc, op }) => {
      s.style.opacity = op.toFixed(3);
      if (!reduce) s.style.transform = `translateY(${(dc * 30).toFixed(1)}px)`;
      topOp = Math.max(topOp, op);
      if (s === albumEl) albumOp = op;
      if (s === restEl) restOp = op;
      const c = SECTION_BG[s.id] || SECTION_BG.cover;
      const wgt = op * op + 0.001;             // the centred section dominates the blend
      wr += c[0] * wgt; wg += c[1] * wgt; wb += c[2] * wgt; ws += wgt;
    });
    if (ws > 0) document.body.style.backgroundColor = `rgb(${(wr / ws) | 0},${(wg / ws) | 0},${(wb / ws) | 0})`;
    masthead.style.opacity = (0.2 + 0.8 * topOp).toFixed(3);
    masthead.classList.toggle('invert', Math.max(albumOp, restOp) > 0.5);
    // dust: the connective air. Most present mid-transition (topOp low), gone
    // when settled on a section, and suppressed around the breath — so the
    // album→pages gap reads as the held minute, never as dust.
    if (dustLayer) {
      const between = clamp(0, 1, 1 - topOp);
      // steady over the dark album, rising through transitions, gone over the breath
      const vis = Math.max(between, albumOp * 0.55) * (1 - clamp(0, 1, restOp));
      dustLayer.style.opacity = vis.toFixed(3);
      air.opacity = vis;
      air.dark = clamp(0, 1, albumOp);
    }
  }
  // coalesce many scroll events into a single update per frame (smoother on touch)
  let secRaf = 0;
  const scheduleSections = () => { if (!secRaf) secRaf = requestAnimationFrame(() => { secRaf = 0; updateSections(); }); };

  /* ============================================================
     BUILD CONTENT, then wire up the album & the pages
     ============================================================ */
  const track = document.getElementById('track');
  const book = document.getElementById('book');
  const leafEl = document.getElementById('leaf');
  const featuredEl = document.getElementById('featured');

  function renderAlbum(album) {
    track.innerHTML = (album || []).map((p) =>
      `<div class="plate"><div class="figure-reveal"><div class="shot" data-cap="${esc(p.caption)}">` +
      `<img src="${esc(p.image)}" alt="${esc(p.alt)}" decoding="async"></div></div></div>`
    ).join('');
  }

  function renderNotes(notes) {
    book.innerHTML = (notes || []).map((n, i) => {
      const paras = String(n.body || '').split(/\n\s*\n/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('');
      const aside = n.aside ? `<p class="aside">${fmt(n.aside)}</p>` : '';
      return `<article class="page${i === 0 ? ' current' : ''}">` +
        `<span class="runhead">Ahora — Field Notes</span>` +
        `<div class="stagger"><span class="label">${esc(n.label)}</span>` +
        `<h2>${esc(n.title)}</h2>${paras}${aside}</div>` +
        `<span class="folio">${i + 1}</span></article>`;
    }).join('');
    if (leafEl) leafEl.textContent = `1 — ${(notes || []).length || 1}`;
  }

  // The "Featured" strip above the book — up to 3 highlighted notes.
  // `notes` is the same (non-archived) list the book is built from, so the
  // index on each card maps straight to a page the reader can flip to.
  function renderFeatured(notes) {
    if (!featuredEl) return;
    const picks = (notes || [])
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.featured)
      .slice(0, 3);
    if (!picks.length) { featuredEl.hidden = true; featuredEl.innerHTML = ''; return; }
    featuredEl.hidden = false;
    featuredEl.innerHTML =
      `<span class="label feat-label">Featured</span>` +
      `<div class="feat-row">` +
      picks.map(({ n, i }) => {
        const lead = String(n.body || '').split(/\n\s*\n/).filter(Boolean)[0] || '';
        return `<button class="feat-card" data-to="${i}">` +
          `<span class="label">${esc(n.label)}</span>` +
          `<span class="feat-title">${esc(n.title)}</span>` +
          `<span class="feat-lead">${esc(lead)}</span>` +
          `<span class="feat-cue">Read →</span></button>`;
      }).join('') +
      `</div>`;
  }

  /* ---------- THE ALBUM ---------- */
  function initAlbum() {
    const plates = [...track.querySelectorAll('.plate')];
    if (!plates.length) return;
    const albumHead = document.querySelector('.album-head');
    const countEl = document.getElementById('count');
    const capEl = document.getElementById('cap');
    const pad2 = (n) => String(n).padStart(2, '0');
    const clampX = (x) => Math.max(0, Math.min(track.scrollWidth - track.clientWidth, x));

    function activeIndex() {
      const c = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      plates.forEach((p, i) => { const pc = p.offsetLeft + p.offsetWidth / 2; const d = Math.abs(pc - c); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function updateReveal() {
      const c = track.scrollLeft + track.clientWidth / 2;
      plates.forEach((p) => {
        const pc = p.offsetLeft + p.offsetWidth / 2;
        const dn = (pc - c) / track.clientWidth;            // signed distance from centre
        const ad = Math.min(1, Math.abs(dn) / 0.55);        // 0 centred .. 1 off
        const e = ad * ad;
        p.style.opacity = (1 - e * 0.85).toFixed(3);
        p.style.filter = `blur(${(e * 11).toFixed(2)}px)`;
        // the photo slides gently in from the side and settles as it reaches centre
        const fig = p.querySelector('.figure-reveal');
        fig.style.transform = `translateX(${(clamp(-1, 1, dn) * track.clientWidth * 0.06).toFixed(1)}px)`;
        const shot = p.querySelector('.shot');
        shot.style.clipPath = `inset(0 0 ${(ad * 16).toFixed(1)}% 0)`;
        shot.style.transform = `scale(${(1 + ad * 0.05).toFixed(3)})`;
      });
      const sx = track.scrollLeft;
      albumHead.style.opacity = clamp(0, 1, 1 - sx / (track.clientWidth * 0.42)).toFixed(3);
      albumHead.style.transform = `translateX(${(-sx * 0.35).toFixed(1)}px)`;
    }
    let lastCap = '';
    function syncMeta() {
      const i = activeIndex();
      countEl.textContent = `${pad2(i + 1)} / ${pad2(plates.length)}`;
      if (!capEl) return;
      const cap = plates[i].querySelector('.shot').dataset.cap || '';
      if (cap !== lastCap) {
        lastCap = cap;
        capEl.style.opacity = 0;
        setTimeout(() => { capEl.textContent = cap; capEl.style.opacity = 1; }, 150);
      }
    }
    const render = () => { updateReveal(); syncMeta(); };

    let target = 0, raf = null;
    function loop() {
      const diff = target - track.scrollLeft;
      if (Math.abs(diff) < 0.5) { track.scrollLeft = target; render(); raf = null; return; }
      track.scrollLeft += diff * 0.14;
      render();
      raf = requestAnimationFrame(loop);
    }
    const run = () => { if (!raf) raf = requestAnimationFrame(loop); };
    function goTo(i, smooth = true) {
      i = clamp(0, plates.length - 1, i);
      const p = plates[i];
      const left = clampX(p.offsetLeft - (track.clientWidth - p.offsetWidth) / 2);
      target = left;
      if (smooth) run(); else { track.scrollLeft = left; render(); }
    }

    let idle;
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); e.stopPropagation();
      target = clampX((raf ? target : track.scrollLeft) + e.deltaX * 1.2);
      run();
      clearTimeout(idle);
      idle = setTimeout(() => goTo(activeIndex()), 150);
    }, { passive: false });

    // drag to leaf (mouse only — touch uses native scrolling + snap, which feels right on mobile)
    let down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add('dragging'); track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', (e) => { if (down) { track.scrollLeft = clampX(sl - (e.clientX - sx)); target = track.scrollLeft; render(); } });
    const endDrag = () => { if (down) { down = false; track.classList.remove('dragging'); goTo(activeIndex()); } };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    let sraf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(sraf); sraf = requestAnimationFrame(render); }, { passive: true });

    const centerFirst = () => goTo(0, false);
    if (document.readyState === 'complete') centerFirst(); else addEventListener('load', centerFirst);
    addEventListener('resize', () => { goTo(activeIndex(), false); updateSections(); });

    albumApi = { goTo, activeIndex };
    render();
  }

  /* ---------- THE PAGES (book) ---------- */
  function initReader() {
    const pages = [...book.querySelectorAll('.page')];
    if (!pages.length) return;
    let cur = 0, lock = false, accX = 0, accTimer;

    const pio = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.querySelector('.stagger')?.classList.add('in'); pio.unobserve(e.target); } });
    }, { threshold: 0.25 });

    function showPage(n, animate = true) {
      n = clamp(0, pages.length - 1, n);
      pages.forEach((p, i) => {
        p.classList.toggle('current', i === n);
        p.classList.toggle('left', i < n);
        const st = p.querySelector('.stagger');
        if (i === n && animate) { st.classList.remove('in'); requestAnimationFrame(() => requestAnimationFrame(() => st.classList.add('in'))); }
        else if (i !== n) st.classList.remove('in');
      });
      cur = n;
      if (leafEl) leafEl.textContent = `${n + 1} — ${pages.length}`;
    }
    function flip(dir) {
      if (lock) return;
      const n = cur + dir;
      if (n < 0 || n >= pages.length) return;
      lock = true; showPage(n); setTimeout(() => { lock = false; }, 720);
    }

    const reader = document.getElementById('reader');
    reader.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); e.stopPropagation();
      accX += e.deltaX;
      clearTimeout(accTimer);
      accTimer = setTimeout(() => { accX = 0; }, 180);
      if (Math.abs(accX) > 80) { flip(accX > 0 ? 1 : -1); accX = 0; }
    }, { passive: false });

    let bd = false, bx = 0;
    book.addEventListener('pointerdown', (e) => { bd = true; bx = e.clientX; book.setPointerCapture(e.pointerId); });
    book.addEventListener('pointerup', (e) => { if (!bd) return; bd = false; const dx = e.clientX - bx; if (Math.abs(dx) > 50) flip(dx < 0 ? 1 : -1); });
    book.addEventListener('pointercancel', () => { bd = false; });

    showPage(0, false);
    pio.observe(pages[0]);   // first page staggers in when scrolled into view
    readerApi = {
      flip,
      to(n) { if (lock) return; lock = true; showPage(n); setTimeout(() => { lock = false; }, 720); },
    };
  }

  /* ---------- shared keyboard + anchors (wired once, use whatever exists) ---------- */
  let albumApi = null, readerApi = null;
  addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const fwd = e.key === 'ArrowRight';
    if (active === 'album' && albumApi) albumApi.goTo(albumApi.activeIndex() + (fwd ? 1 : -1));
    else if (active === 'reader' && readerApi) readerApi.flip(fwd ? 1 : -1);
  });
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (ev) => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return; ev.preventDefault(); scrollTo(t); });
  });
  // a featured card opens its blog: turn the book to that page, then bring it into view
  if (featuredEl) featuredEl.addEventListener('click', (e) => {
    const card = e.target.closest('.feat-card');
    if (!card || !readerApi) return;
    readerApi.to(+card.dataset.to);
    book.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------- load content, build, wire up ---------- */
  fetch('published.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((data) => {
      renderAlbum((data.album || []).filter((p) => !p.archived));
      const liveNotes = (data.notes || []).filter((n) => !n.archived);
      renderNotes(liveNotes);
      renderFeatured(liveNotes);
      initAlbum();
      initReader();
      updateSections();
    })
    .catch((err) => { console.error('Could not load content.json —', err); });

  /* ---------- drive the vertical section cross-fade ---------- */
  if (lenis) lenis.on('scroll', scheduleSections);
  addEventListener('scroll', scheduleSections, { passive: true });
  updateSections();
})();
