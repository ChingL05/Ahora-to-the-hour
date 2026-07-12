/* ============================================================
   Ahora — Archive page
   Reads published.json and shows only the items marked "archived".
   Photos → compact grid (tap to enlarge). Writing → titled list (tap to read).
   ============================================================ */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // inline emphasis for the aside: **bold**, and *italic* / _italic_ (the aside is already italic by default)
  const fmt = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
  // render a body exactly as typed: blank line → new paragraph, single line-break → its own line
  const bodyHtml = (s) => String(s == null ? '' : s)
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/).map((blk) => blk.replace(/^\n+|\n+$/g, '')).filter(Boolean)
    .map((blk) => `<p>${esc(blk).replace(/\n/g, '<br>')}</p>`).join('');

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- DUST: the standing background ----------
     The same drifting air as the front page, but always present here and freer —
     each mote drifts in its own direction (not just upward) and curves gently as it
     goes, wrapping around the edges, so the field reads as floating dust rather than
     a still grain. Dark motes over the warm ground; pauses when the tab is hidden. */
  (function initArcDust() {
    const canvas = document.querySelector('.arc-dust');
    if (!canvas) return;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const ctx = canvas.getContext('2d');
    const dpr = coarse ? 1 : Math.min(1.5, devicePixelRatio || 1);
    const interval = coarse ? 1000 / 30 : 0;          // half-rate on phones, spares battery
    const COLOR = [112, 102, 82];                      // warm taupe — the chamois ground gone darker, like fine earth in the air
    const LAYER = 0.62;                                // overall presence — subtle, not busy
    let motes = [], w = 0, h = 0, raf = 0, last = 0, vis = !document.hidden;

    const spawn = () => {
      const a = Math.random() * TAU, sp = 0.05 + Math.random() * 0.13;   // drift heading + speed
      return {
        x: Math.random() * w, y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,                  // depth → size + brightness
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,    // a free heading, any direction
        ph: Math.random() * 6.28
      };
    };

    function size() {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(coarse ? 80 : 160, Math.round(w * h / 11000));
      motes = Array.from({ length: n }, spawn);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const [cr, cg, cb] = COLOR;
      for (const m of motes) {
        m.ph += 0.015;                                  // a gentle, perceptible sway
        m.x += m.vx + Math.sin(m.ph) * 0.08 * m.z;      // sway curves the path on both axes,
        m.y += m.vy + Math.cos(m.ph) * 0.08 * m.z;      // so a mote wanders rather than running straight
        // wrap on every edge — motes drift freely off one side and back in the other
        if (m.x < -4) m.x = w + 4; else if (m.x > w + 4) m.x = -4;
        if (m.y < -4) m.y = h + 4; else if (m.y > h + 4) m.y = -4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${((0.24 + m.z * 0.58) * LAYER).toFixed(3)})`;
        ctx.arc(m.x, m.y, m.z * 1.7 + 0.5, 0, TAU); ctx.fill();
      }
    }

    function frame(now) {
      raf = (vis && !reduce) ? requestAnimationFrame(frame) : 0;
      if (interval && now - last < interval - 1) return;
      last = now; draw();
    }
    function play() { if (!raf && vis && !reduce) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    addEventListener('resize', size);
    document.addEventListener('visibilitychange', () => { vis = !document.hidden; vis ? play() : stop(); });
    size();
    if (reduce) draw(); else play();                    // reduced motion → one still, settled frame
  })();

  const photosEl = document.getElementById('arc-photos');
  const notesEl = document.getElementById('arc-notes');
  let photos = [];

  function renderPhotos(list) {
    if (!list.length) { photosEl.innerHTML = '<p class="arc-empty">Nothing set aside yet.</p>'; return; }
    photosEl.innerHTML = list.map((p, i) =>
      `<button class="arc-thumb" data-i="${i}" aria-label="${esc(p.caption || p.alt || 'photograph')}">` +
      `<img src="${esc(p.image)}" alt="${esc(p.alt)}" loading="lazy" decoding="async"></button>`
    ).join('');
  }

  function renderNotes(list) {
    if (!list.length) { notesEl.innerHTML = '<p class="arc-empty">Nothing set aside yet.</p>'; return; }
    notesEl.innerHTML = list.map((n) => {
      const paras = bodyHtml(n.body);
      const aside = n.aside ? `<p class="aside">${fmt(n.aside)}</p>` : '';
      const lab = esc((n.label || '').replace(/\s*\d+\s*$/, '') || 'Note');  // archive drops the numbering
      return `<article class="arc-entry">` +
        `<button class="arc-entry-head"><span class="label">${lab}</span><span class="arc-title">${esc(n.title)}</span></button>` +
        `<div class="arc-body"><div class="arc-body-inner">${paras}${aside}</div></div></article>`;
    }).join('');
  }

  // accordion for writing
  notesEl.addEventListener('click', (e) => {
    const head = e.target.closest('.arc-entry-head');
    if (head) head.parentElement.classList.toggle('open');
  });

  // lightbox for photographs
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  let cur = 0;
  function show(i) {
    cur = (i + photos.length) % photos.length;
    const p = photos[cur];
    lbImg.src = p.image;
    lbImg.alt = p.alt || '';
    lbCap.textContent = p.caption || '';
  }
  function openLb(i) { show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }

  photosEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.arc-thumb');
    if (btn) openLb(+btn.dataset.i);
  });
  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', () => show(cur - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'ArrowLeft') show(cur - 1);
  });

  fetch('published.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((data) => {
      photos = (data.album || []).filter((p) => p.archived);
      const notes = (data.notes || []).filter((n) => n.archived);
      renderPhotos(photos);
      renderNotes(notes);
    })
    .catch((err) => {
      console.error('Could not load published.json —', err);
      const msg = '<p class="arc-empty">The archive is resting just now — please try again in a moment.</p>';
      photosEl.innerHTML = msg; notesEl.innerHTML = msg;
    });
})();
