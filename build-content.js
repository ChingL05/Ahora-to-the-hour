/* ============================================================
   Ahora — build step (runs on Netlify before each deploy)
   Compiles the album (content.json) and the published blogs
   (content/blogs/*.json) into a single published.json, which is
   what the website actually reads.

   Why this exists: blogs now live one-file-each so they can be
   drafted independently in the CMS. Draft/in-review blogs sit on
   their own PR branch and never reach `main`, so a production build
   (which only sees `main`) simply doesn't include them — they stay
   off the live site until you Publish. No dependencies.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const root = __dirname;
const album = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8')).album || [];

const blogsDir = path.join(root, 'content', 'blogs');
let notes = [];
if (fs.existsSync(blogsDir)) {
  notes = fs.readdirSync(blogsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const n = JSON.parse(fs.readFileSync(path.join(blogsDir, f), 'utf8'));
      return { ...n, _file: f };
    })
    // book order: by the "Order" number, then by filename as a stable tie-break
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a._file.localeCompare(b._file))
    .map(({ _file, ...n }) => n);
}

fs.writeFileSync(
  path.join(root, 'published.json'),
  JSON.stringify({ album, notes }, null, 2) + '\n'
);
console.log(`published.json written — ${album.length} photos, ${notes.length} blogs`);
