/* ============================================================
   Ahora — to the hour · interactions
   Content (album photos + notes) is loaded from content.json,
   so it can be edited from the /admin panel without touching code.
   ============================================================ */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

  /* ---------- reveals: cover & invitation ---------- */
  const vio = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); vio.unobserve(e.target); } });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.cover .lines, .cover .stagger, .invite .stagger').forEach((el) => vio.observe(el));

  /* ---------- which big section the arrow keys belong to ---------- */
  let active = 'album';
  const sectO = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > 0.5) active = e.target.id; });
  }, { threshold: [0.5, 0.75] });
  ['album', 'reader'].forEach((id) => { const el = document.getElementById(id); if (el) sectO.observe(el); });

  /* ---------- Izanami-style vertical cross-fade of whole sections + header ---------- */
  const masthead = document.querySelector('.masthead');
  const albumEl = document.getElementById('album');
  const screens = [...document.querySelectorAll('section.screen')];
  function updateSections() {
    const vh = innerHeight;
    let topOp = 0, albumOp = 0;
    screens.forEach((s) => {
      const r = s.getBoundingClientRect();
      const dc = ((r.top + r.height / 2) - vh / 2) / vh;
      const op = clamp(0, 1, 1 - Math.abs(dc) / 0.72);
      s.style.opacity = op.toFixed(3);
      if (!reduce) s.style.transform = `translateY(${(dc * 30).toFixed(1)}px)`;
      topOp = Math.max(topOp, op);
      if (s === albumEl) albumOp = op;
    });
    masthead.style.opacity = (0.2 + 0.8 * topOp).toFixed(3);
    masthead.classList.toggle('invert', albumOp > 0.5);
  }

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
      const aside = n.aside ? `<p class="aside">${esc(n.aside)}</p>` : '';
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
  fetch('content.json', { cache: 'no-cache' })
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
  if (lenis) lenis.on('scroll', updateSections);
  addEventListener('scroll', updateSections, { passive: true });
  updateSections();
})();
