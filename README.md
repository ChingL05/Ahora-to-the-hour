# Ahora — to the hour

A quiet personal site: an album you leaf through and a few pages you read.

It is a **static site** whose content lives in `content.json` and can be edited two ways:
1. **From the `/admin` panel** (no code) — upload photos and write notes in a form. *(after the one-time setup below)*
2. **By hand** — edit `content.json` directly.

```
index.html        ← page structure (cover, album, pages, invitation)
styles.css        ← all styling
main.js           ← motion + builds the album/pages from content.json
content.json      ← YOUR CONTENT lives here (photos list + notes)
admin/            ← the no-code editing panel (Decap CMS)
optimize-photos.sh← shrinks big photos for the web
photos/           ← original photos
photos/web/       ← optimised copies the site loads
```

## Preview locally

```bash
cd "Ahora Now"
python3 -m http.server 8137
# open http://localhost:8137
```
(Open via the server, not by double-clicking the file — the browser blocks `content.json` over `file://`.)

---

## Editing content BY HAND (works today, no setup)

Open `content.json`. It has two lists:

**Add a photo** — first optimise it, then add an entry:
```bash
# 1. drop your photo into photos/, then:
./optimize-photos.sh           # makes photos/web/<name>.jpg
```
```json
{ "image": "photos/web/yourphoto.jpg", "alt": "a short description" }
```
Add that line to the `"album"` list, in the order you want.

**Add a note** — add an entry to the `"notes"` list:
```json
{
  "label": "Note 04",
  "title": "Your title",
  "body": "First paragraph.\n\nSecond paragraph.",
  "aside": ""
}
```
The album counter and page total update themselves.

---

## The no-code `/admin` panel (one-time setup)

The site ships with **Decap CMS** (`admin/`). Once hosted on Netlify it gives you a login at
`yoursite.com/admin` where you upload photos and write notes in a form — it saves to
`content.json` and republishes automatically. Setup is a one-time thing:

1. **Put the project in a GitHub repo.**
   ```bash
   cd "Ahora Now"
   git init && git add -A && git commit -m "Ahora site"
   # create an empty repo on github.com, then:
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. **Deploy on Netlify** — at app.netlify.com → *Add new site → Import from GitHub* → pick the repo.
   No build command; publish directory is the project root. You'll get a `*.netlify.app` URL
   (add your own domain later under *Domain settings*).
3. **Turn on logins** — in the Netlify site dashboard:
   - *Identity → Enable Identity*
   - *Identity → Services → Git Gateway → Enable*
   - *Identity → Invite users →* invite your email; accept the emailed invite.
4. **Edit** — go to `yoursite.com/admin`, log in, and add photos / notes. Changes commit to
   GitHub and the site refreshes in ~30 seconds.

> If you keep the branch name different from `main`, update `branch:` in `admin/config.yml`.

### One caveat: image size from the admin panel
Photos uploaded through `/admin` are stored **at their original size** (the `optimize-photos.sh`
step only runs on your computer). For a low-traffic personal site that's usually fine, but if you
upload many large phone photos it will get heavy. Options, easiest first:
- Resize photos before uploading (any phone/Preview "export at 2000px" works), **or**
- Ask me to add an automatic build step (resizes on deploy) or enable Netlify's image CDN.

---

## Hosting summary
Static, free, automatic HTTPS, custom domain supported. **Netlify** is recommended here because
the `/admin` panel uses its Identity login. (Cloudflare Pages / GitHub Pages also host the site
fine, but the no-code admin needs a compatible auth provider.)
