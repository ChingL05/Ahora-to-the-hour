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
  // render a body exactly as typed in the admin: a blank line starts a new paragraph,
  // and a single line-break inside a paragraph is kept as its own line (not collapsed)
  const bodyHtml = (s) => String(s == null ? '' : s)
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/).map((blk) => blk.replace(/^\n+|\n+$/g, '')).filter(Boolean)
    .map((blk) => `<p>${esc(blk).replace(/\n/g, '<br>')}</p>`).join('');

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
    const revealText = () => { cover.classList.add('revealed'); if (body) body.classList.add('in'); coverReady = true; };
    // the letters fall onto the still-water surface — splash where they land
    const splashAt = (power, cx) => { if (coverWaterDrop && cx != null) coverWaterDrop(cx.x, cx.y, power, true); };
    // centre of the "A" (the first drop)
    const aCentre = () => { const a = word.querySelector('.ltr'); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.6 }; };
    // centre of "hora" (letters 2..n), so its settle ripple wells up from the word, not the A
    const horaCentre = () => { const l = word.querySelectorAll('.ltr'); if (l.length < 2) return null; const a = l[1].getBoundingClientRect(), b = l[l.length - 1].getBoundingClientRect(); return { x: (a.left + b.right) / 2, y: a.top + a.height * 0.6 }; };
    const splash = (power) => splashAt(power, aCentre());

    let timers = [];
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

    function playFull() {   // first visit: the word spells itself out
      clearTimers();
      word.classList.remove('settled', 'stir', 'play'); void word.offsetWidth;
      cover.classList.remove('revealed'); if (body) body.classList.remove('in');
      word.classList.add('play');
      timers.push(setTimeout(() => splash(750), (A_DELAY + 0.5) * 1000));   // A's raindrop
      timers.push(setTimeout(bgRipple, (lastLand - 0.15) * 1000));
      timers.push(setTimeout(() => splashAt(450, horaCentre()), (lastLand - 0.1) * 1000));   // h-o-r-a settle, from its own centre
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
  let coverReady = false;      // gate: auto-rain holds off until the word has settled, so
                               // the opening shows only A's drop and hora's single big ripple
  initCover();

  /* ============================================================
     CREATIVE-CODING LAYERS — quiet, time-aware, touch-friendly
       · cover  → still water (the letters fall onto it)
       · rest   → breath (a held minute, between album and pages)
       · .air   → dust, surfaced only during section transitions
     ============================================================ */
  const coarse = matchMedia('(pointer: coarse)').matches;
  const TAU = Math.PI * 2;
  const air = { opacity: 0, dark: 0 };   // driven by updateSections()
  let airCtl = null;                     // dust runner handle, so it can idle when invisible
  // the time-of-day tint (initCover sets --ripple-rgb on :root). Read once and
  // refreshed slowly, shared by the canvas layers — no getComputedStyle per frame.
  const readAccent = () => (getComputedStyle(document.documentElement)
    .getPropertyValue('--ripple-rgb').trim() || '122,132,112').split(',').map(Number);
  let accent = readAccent();
  setInterval(() => { accent = readAccent(); }, 30000);

  // a tiny canvas runner: HiDPI sizing, pauses off-screen and when the tab is hidden
  function mountCanvas(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const dpr = opts.dpr || Math.min(2, devicePixelRatio || 1);
    const interval = opts.fps ? 1000 / opts.fps : 0;   // cap frame rate to spare battery
    let w = 0, h = 0, raf = 0, vis = !document.hidden, onScreen = !!opts.fixed, wanted = true, last = 0, t0 = performance.now();
    function size() {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (opts.onsize) opts.onsize(w, h, ctx);
    }
    const ok = () => vis && onScreen && wanted && !reduce;
    function frame(now) {
      raf = ok() ? requestAnimationFrame(frame) : 0;
      if (interval && now - last < interval - 1) return;
      last = now;
      opts.draw(ctx, w, h, (now - t0) / 1000, now);
    }
    function play() { if (!raf && ok()) { t0 = performance.now() - 16; last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    document.addEventListener('visibilitychange', () => { vis = !document.hidden; vis ? play() : stop(); });
    addEventListener('resize', size);
    size();
    if (reduce) opts.draw(ctx, w, h, 0, performance.now());   // hold one still frame
    else if (opts.fixed) play();
    else new IntersectionObserver((es) => es.forEach((e) => { onScreen = e.isIntersecting; onScreen ? play() : stop(); }), { threshold: 0.02 }).observe(canvas);
    // setWanted lets callers idle a layer entirely (e.g. dust when it's invisible)
    return { play, stop, size, setWanted(b) { if (b === wanted) return; wanted = b; b ? play() : stop(); } };
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
    let cols = 0, rows = 0, off, octx, img;
    let nextRain = 1.5, prevNow = 0;
    // Three independent water surfaces, blended when drawn. The wavefront advances one
    // cell per step(), so the step cadence sets the outward speed:
    //   inter  — the cursor (click / drag). Steps every frame → original, responsive.
    //   splash — the word's landing splash. A fixed 40/s.
    //   rain   — the automatic rain. A fixed 45/s.
    // damp = how fast a ripple decays per step; lower = rings die sooner → fewer circles
    const inter  = { cur: null, prev: null, dt: 0,         acc: 0, damp: 0.965 };  // cursor — one step per frame
    const splash = { cur: null, prev: null, dt: 1000 / 40, acc: 0, damp: 0.90 };   // word's splash — quick decay, one clean ring
    const rain   = { cur: null, prev: null, dt: 1000 / 45, acc: 0, damp: 0.965 };  // automatic rain
    const ponds = [inter, splash, rain];

    const dropInto = (p, gx, gy, power) => { if (gx > 0 && gy > 0 && gx < cols - 1 && gy < rows - 1) p.prev[gy * cols + gx] += power; };
    // slow=true lands the drop on the word's splash surface (used by the cover word)
    coverWaterDrop = (clientX, clientY, power, slow) => {
      const r = canvas.getBoundingClientRect();
      dropInto(slow ? splash : inter, ((clientX - r.left) / scale) | 0, ((clientY - r.top) / scale) | 0, power || 700);
    };

    // listen on the cover, not the canvas, so ripples span the whole field and
    // touch scrolling is never blocked (passive — we never preventDefault)
    const m = { x: 0, y: 0, px: 0, py: 0, on: false };
    const move = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      m.x = cx - r.left; m.y = cy - r.top;
      if (m.on) { const d = Math.hypot(m.x - m.px, m.y - m.py); if (d > 2) dropInto(inter, (m.x / scale) | 0, (m.y / scale) | 0, Math.min(150, d * 6)); }
      m.px = m.x; m.py = m.y; m.on = true;
    };
    cover.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
    cover.addEventListener('pointerdown', (e) => coverWaterDrop(e.clientX, e.clientY, 750), { passive: true });
    cover.addEventListener('pointerleave', () => { m.on = false; });

    function stepPond(p) {
      const cur = p.cur, prev = p.prev;
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        cur[i] = ((prev[i - 1] + prev[i + 1] + prev[i - cols] + prev[i + cols]) / 2 - cur[i]) * p.damp;
      }
      p.cur = prev; p.prev = cur;
    }
    // advance a pond on its own fixed clock; catch up at most a few steps after a stall,
    // so refocusing the tab never makes the ripple lurch
    function advance(p, elapsed) {
      p.acc += elapsed;
      for (let s = 0; p.acc >= p.dt && s < 3; s++) { stepPond(p); p.acc -= p.dt; }
    }

    mountCanvas(canvas, {
      dpr: Math.min(1.75, devicePixelRatio || 1),   // enough target resolution for the blur to read as water
      fps: coarse ? 30 : 0,                          // half rate on phones — calm water, less battery
      onsize(w, h) {
        cols = Math.ceil(w / scale) + 2; rows = Math.ceil(h / scale) + 2;
        for (const p of ponds) { p.cur = new Float32Array(cols * rows); p.prev = new Float32Array(cols * rows); p.acc = 0; }
        off = document.createElement('canvas'); off.width = cols; off.height = rows;
        octx = off.getContext('2d'); img = octx.createImageData(cols, rows);
      },
      draw(ctx, w, h, t, now) {
        // auto-rain only once the cover word has settled; until then keep pushing the
        // schedule forward, so the first drop lands ~2.5s after the reveal, never during it
        if (coverReady) { if (t > nextRain) { dropInto(rain, (1 + Math.random() * (cols - 2)) | 0, (1 + Math.random() * (rows - 2)) | 0, 300); nextRain = t + 3.5 + Math.random() * 4.5; } }
        else nextRain = t + 2.5;
        // cursor surface steps every frame (original, responsive); the splash and rain
        // surfaces advance on their own calmer fixed clocks
        if (!prevNow) prevNow = now;
        const elapsed = Math.min(120, now - prevNow); prevNow = now;
        stepPond(inter); advance(splash, elapsed); advance(rain, elapsed);
        const d = img.data, ar = accent[0], ag = accent[1], ab = accent[2];
        const pa = inter.prev, pb = splash.prev, pc = rain.prev;
        for (let i = 0, n = cols * rows; i < n; i++) {
          // the surface is the three ponds summed; slope is linear, so blend the slopes
          const slope = (((pa[i - 1] || 0) + (pb[i - 1] || 0) + (pc[i - 1] || 0)) - ((pa[i + 1] || 0) + (pb[i + 1] || 0) + (pc[i + 1] || 0)))
                      + (((pa[i - cols] || 0) + (pb[i - cols] || 0) + (pc[i - cols] || 0)) - ((pa[i + cols] || 0) + (pb[i + cols] || 0) + (pc[i + cols] || 0))) * 0.5;
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

  /* ---------- 04 · BREATH (the held minute) ----------
     A soft aperture of fine sage specks (kin to the dust): the ring opens on the
     inhale and gathers back in on the exhale, turning slowly. The breathing
     envelope (PERIOD / eased e) is unchanged — only the form is. */
  function initBreath() {
    const canvas = document.querySelector('.breath-canvas');
    if (!canvas) return;
    const cueEl = document.getElementById('restCue');
    const PERIOD = 11;   // seconds per full breath ≈ 5.5 / min
    const COUNT = coarse ? 30 : 46;
    // fixed per-mote constants → a soft, slightly irregular ring rather than a clean circle
    const dots = Array.from({ length: COUNT }, (_, i) => ({
      ang: (i / COUNT) * TAU,
      roff: (Math.random() - 0.5) * 0.18,   // radial scatter (fraction of R) → a fuzzy band
      sz: 0.5 + Math.random() * 0.9,         // dot size factor
      tw: Math.random() * TAU                // twinkle phase, so specks shimmer out of step
    }));
    let last = '';
    mountCanvas(canvas, {
      fps: coarse ? 30 : 0,
      draw(ctx, w, h, t) {
        const cx = w / 2, cy = h / 2, base = Math.min(w, h);
        const p = (t % PERIOD) / PERIOD, inhale = p < 0.5;
        const local = inhale ? p / 0.5 : 1 - (p - 0.5) / 0.5;
        const e = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
        const R = base * 0.12 + e * base * 0.22;   // the ring's radius breathes in and out
        const rot = t * 0.05;                       // the aperture turns slowly
        const [r, g, b] = accent;
        ctx.clearRect(0, 0, w, h);
        // a whisper of inner glow so the centre isn't a void
        const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        rad.addColorStop(0, `rgba(${r},${g},${b},${(0.05 + e * 0.05).toFixed(3)})`);
        rad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = rad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
        // the ring of specks — eases outward on the inhale, draws back in on the exhale
        for (const m of dots) {
          const rr = R * (1 + m.roff), a = m.ang + rot;
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          const tw = 0.6 + 0.4 * Math.sin(m.tw + t * 1.3);   // gentle shimmer
          const alpha = (0.16 + 0.32 * e) * tw;              // brighter when the ring is open
          ctx.beginPath();
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          ctx.arc(x, y, (m.sz * 1.5 + 0.6) * (0.9 + e * 0.25), 0, TAU); ctx.fill();
        }
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
    airCtl = mountCanvas(canvas, {
      fixed: true,
      fps: coarse ? 30 : 0,
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
          ctx.arc(m.x, m.y, m.z * 1.7 + 0.5, 0, TAU); ctx.fill();
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
      if (airCtl) airCtl.setWanted(vis > 0.01);   // stop the loop entirely when settled on a page
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
  let notesRef = [];   // the live (non-archived) notes, so the expanded reader can open any one

  function renderAlbum(album) {
    track.innerHTML = (album || []).map((p, i) =>
      `<div class="plate"><div class="figure-reveal"><div class="shot" data-cap="${esc(p.caption)}">` +
      // first two load eagerly (visible + neighbour peek); the rest defer until leafed to
      `<img src="${esc(p.image)}" alt="${esc(p.alt)}" decoding="async" loading="${i < 2 ? 'eager' : 'lazy'}"></div></div></div>`
    ).join('');
  }

  function renderNotes(notes) {
    book.innerHTML = (notes || []).map((n, i) => {
      const paras = bodyHtml(n.body);
      const aside = n.aside ? `<p class="aside">${fmt(n.aside)}</p>` : '';
      return `<article class="page${i === 0 ? ' current' : ''}">` +
        `<span class="runhead">Ahora — Field Notes</span>` +
        `<div class="stagger"><span class="label">${esc(n.label)}</span>` +
        `<h2>${esc(n.title)}</h2>${paras}${aside}</div>` +
        `<span class="open-cue">Read in full &rarr;</span>` +
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
        // same line rules as the field notes: keep the author's line breaks (blank line
        // or single newline → its own line); the card's 3-line clamp keeps the size fixed
        const lead = esc(String(n.body || '').replace(/\r\n?/g, '\n').replace(/\n{2,}/g, '\n').trim()).replace(/\n/g, '<br>');
        return `<button class="feat-card" data-to="${i}">` +
          `<span class="label">${esc(n.label)}</span>` +
          `<span class="feat-title">${esc(n.title)}</span>` +
          `<span class="feat-lead">${lead}</span>` +
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

    // a horizontal swipe turns the page; a tap (little movement) opens the blog in full
    let bd = false, bx = 0, by = 0, moved = 0;
    book.addEventListener('pointerdown', (e) => { bd = true; bx = e.clientX; by = e.clientY; moved = 0; book.setPointerCapture(e.pointerId); });
    book.addEventListener('pointermove', (e) => { if (bd) moved = Math.max(moved, Math.abs(e.clientX - bx), Math.abs(e.clientY - by)); });
    book.addEventListener('pointerup', (e) => {
      if (!bd) return; bd = false;
      const dx = e.clientX - bx;
      if (Math.abs(dx) > 50) flip(dx < 0 ? 1 : -1);
      else if (moved < 8) openPost(cur);
    });
    book.addEventListener('pointercancel', () => { bd = false; });

    showPage(0, false);
    pio.observe(pages[0]);   // first page staggers in when scrolled into view
    readerApi = {
      flip,
      to(n) { if (lock) return; lock = true; showPage(n); setTimeout(() => { lock = false; }, 720); },
      current: () => cur,
    };
  }

  /* ---------- THE EXPANDED READER (a blog opens in a floating paper panel) ---------- */
  const postModal = document.getElementById('postModal');
  let lastPostFocus = null;
  function openPost(i) {
    const n = notesRef[i];
    if (!n || !postModal) return;
    const paras = bodyHtml(n.body);
    document.getElementById('postModalLabel').textContent = n.label || '';
    document.getElementById('postModalTitle').textContent = n.title || '';
    document.getElementById('postModalBody').innerHTML = paras + (n.aside ? `<p class="aside">${fmt(n.aside)}</p>` : '');
    lastPostFocus = document.activeElement;
    postModal.classList.add('open');
    postModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    postModal.querySelector('.post-scroll').scrollTop = 0;
    postModal.querySelector('.post-close').focus();
  }
  function closePost() {
    if (!postModal) return;
    postModal.classList.remove('open');
    postModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastPostFocus && lastPostFocus.focus) lastPostFocus.focus();
  }
  const postOpen = () => postModal && postModal.classList.contains('open');
  if (postModal) postModal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closePost(); });

  /* ---------- contact form (Netlify Forms) — submit in place, no page jump ----------
     Netlify captures the POST and emails it; on success we show a quiet inline
     confirmation instead of Netlify's default success page. Without JS the form
     still works natively (posts to Netlify and lands on its success page). */
  (function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.getElementById('formStatus');
    const btn = form.querySelector('.invite-send');
    const say = (msg, isError) => {
      if (!status) return;
      status.hidden = false;
      status.classList.toggle('error', !!isError);
      status.textContent = msg;
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      const body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
        .then((r) => {
          if (!r.ok) throw new Error('status ' + r.status);
          form.reset();
          if (btn) btn.textContent = 'Sent';
          say('Thank you — your note is on its way.', false);
        })
        .catch(() => {
          if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
          say('Something went wrong — please try again, or reach me on Instagram.', true);
        });
    });
  })();

  /* ---------- shared keyboard + anchors (wired once, use whatever exists) ---------- */
  let albumApi = null, readerApi = null;
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && postOpen()) { closePost(); return; }
    if (postOpen()) return;   // while a blog is expanded, leave the sections alone
    if (e.key === 'Enter' && active === 'reader' && readerApi) { openPost(readerApi.current()); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const fwd = e.key === 'ArrowRight';
    if (active === 'album' && albumApi) albumApi.goTo(albumApi.activeIndex() + (fwd ? 1 : -1));
    else if (active === 'reader' && readerApi) readerApi.flip(fwd ? 1 : -1);
  });
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (ev) => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return; ev.preventDefault(); scrollTo(t); });
  });
  // a featured card opens its blog in the expanded reader; the book turns to the
  // matching page underneath, so closing the pop-up leaves you on that note
  if (featuredEl) featuredEl.addEventListener('click', (e) => {
    const card = e.target.closest('.feat-card');
    if (!card) return;
    const i = +card.dataset.to;
    if (readerApi) readerApi.to(i);
    openPost(i);
  });

  /* ---------- load content, build, wire up ---------- */
  fetch('published.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((data) => {
      renderAlbum((data.album || []).filter((p) => !p.archived));
      const liveNotes = (data.notes || []).filter((n) => !n.archived);
      notesRef = liveNotes;
      renderNotes(liveNotes);
      renderFeatured(liveNotes);
      initAlbum();
      initReader();
      updateSections();
    })
    .catch((err) => {
      console.error('Could not load published.json —', err);
      if (track) track.innerHTML = '<div class="plate"><p class="load-fallback">The album is resting just now — please try again in a moment.</p></div>';
      if (book) book.innerHTML = '<article class="page current"><div class="stagger in"><p class="load-fallback">The pages are resting just now — please try again in a moment.</p></div></article>';
    });

  /* ---------- drive the vertical section cross-fade ---------- */
  if (lenis) lenis.on('scroll', scheduleSections);
  addEventListener('scroll', scheduleSections, { passive: true });
  updateSections();
})();
