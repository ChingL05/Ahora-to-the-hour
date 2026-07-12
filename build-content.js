/* ============================================================
   Ahora — build step (runs on Netlify before each deploy)
   Compiles the album (content.json) and the published blogs
   (content/blogs/*.json) into a single published.json, which is
   what the website actually reads.

   Why this exists: blogs and photos each carry a Status — "Draft" or
   "Ready". This build includes only the Ready ones, so anything still
   in Draft stays off the live site until you set it Ready. Marking
   several as Ready publishes them all together on the next build.
   (Items saved before Status existed have no status → treated as Ready,
   so nothing already live disappears.) No dependencies.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const root = __dirname;
// Ready to show live? Anything not explicitly "Draft" counts (covers older
// items that predate the Status field). The status field itself never ships.
const isReady = (item) => (item.status || 'Ready') !== 'Draft';
const strip = ({ status, ...rest }) => rest;

const album = (JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8')).album || [])
  .filter(isReady)
  .map(strip);

const blogsDir = path.join(root, 'content', 'blogs');
let notes = [];
if (fs.existsSync(blogsDir)) {
  notes = fs.readdirSync(blogsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const n = JSON.parse(fs.readFileSync(path.join(blogsDir, f), 'utf8'));
      return { ...n, _file: f };
    })
    .filter(isReady)
    // book order: by the "Order" number, then by filename as a stable tie-break
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a._file.localeCompare(b._file))
    .map(({ _file, ...n }) => strip(n));
}

fs.writeFileSync(
  path.join(root, 'published.json'),
  JSON.stringify({ album, notes }, null, 2) + '\n'
);
console.log(`published.json written — ${album.length} photos, ${notes.length} blogs`);
