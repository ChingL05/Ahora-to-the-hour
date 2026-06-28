/* ============================================================
   Ahora — Archive page
   Reads published.json and shows only the items marked "archived".
   Photos → compact grid (tap to enlarge). Writing → titled list (tap to read).
   ============================================================ */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // inline emphasis for the aside: **bold**, and *italic* / _italic_ (the aside is already italic by default)
  const fmt = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

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
      const paras = String(n.body || '').split(/\n\s*\n/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('');
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
    .catch((err) => { console.error('Could not load content.json —', err); });
})();
