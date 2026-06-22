# Ahora — to the hour

**Live:** https://ahora-to-the-hour.netlify.app · **Repo:** https://github.com/ChingL05/Ahora-to-the-hour
**Deploy:** any push to `main` auto-deploys on Netlify (~30s). Content is also editable at `/admin`.

> **Working on this later (or with a fresh AI session):** the `/admin` panel commits content
> straight to GitHub, so the repo can be ahead of your local copy. **Always `git pull` before
> editing**, then commit & push. Code/design → edit files; photos & notes → use `/admin`.

A quiet personal site: an album you leaf through and a few pages you read.

It is a **static site**. The album lives in `content.json`; each blog is its own file in
`content/blogs/`. A tiny build step compiles them into `published.json`, which the site reads.
Content can be edited two ways:
1. **From the `/admin` panel** (no code) — upload photos and write blogs in a form, with a
   **draft** step so a blog isn't published until it's ready. *(after the one-time setup below)*
2. **By hand** — edit `content.json` / the files in `content/blogs/` directly.

```
index.html        ← page structure (cover, album, blogs, invitation)
styles.css        ← all styling
main.js           ← motion + builds the album/blogs from published.json
content.json      ← the ALBUM (photos list)
content/blogs/    ← one JSON file per BLOG (drafted independently)
build-content.js  ← compiles album + published blogs → published.json (runs on deploy)
published.json    ← generated; what the site actually loads (don't hand-edit)
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

**Add a blog** — create a new file `content/blogs/your-title.json`:
```json
{
  "label": "Note 04",
  "title": "Your title",
  "body": "First paragraph.\n\nSecond paragraph.",
  "aside": "",
  "order": 4,
  "featured": false,
  "archived": false
}
```
`order` sets its place in the book (lower = earlier). The album counter and page total update
themselves. (Editing by hand publishes immediately — the Draft step only exists in `/admin`.)

---

## The no-code `/admin` panel (one-time setup — GitHub login)

The site ships with **Decap CMS** (`admin/`). You log in with **GitHub**; Decap then commits your
edits to this repo and Netlify rebuilds the site. The GitHub login is handled by two small
serverless functions already in this repo (`netlify/functions/auth.js` + `callback.js`), so no
third-party service is needed. (Netlify Identity, which the old setup used, is deprecated.)

**1. Deploy on Netlify**
app.netlify.com → *Add new site → Import from GitHub* → pick `Ahora-to-the-hour`.
Settings come from `netlify.toml` (publish = root, functions = `netlify/functions`). You'll get a
`https://<something>.netlify.app` URL — note it (call it **SITE_URL**).

**2. Point the config at your site**
In `admin/config.yml`, set `base_url:` to your **SITE_URL**, then commit & push:
```bash
git add admin/config.yml && git commit -m "Set admin base_url" && git push
```

**3. Create a GitHub OAuth App**
github.com → *Settings → Developer settings → OAuth Apps → New OAuth App*:
- **Homepage URL:** your SITE_URL
- **Authorization callback URL:** `SITE_URL/.netlify/functions/callback`
- Click *Register*, copy the **Client ID**, then *Generate a new client secret* and copy it.

**4. Add the secrets to Netlify**
Netlify → *Site configuration → Environment variables → Add*:
- `GITHUB_OAUTH_ID` = the Client ID
- `GITHUB_OAUTH_SECRET` = the Client secret

Then *Deploys → Trigger deploy → Deploy site* so the functions pick up the variables.

**5. Edit**
Go to `SITE_URL/admin` → *Login with GitHub* → authorise. Add photos / write blogs; each save
commits to the repo and the site refreshes in ~30 seconds.

### Drafts (Blogs only)
Blogs use Decap's **editorial workflow**: a new or edited blog gets a status —
**Draft → In review → Ready** — and is *not* on the live site until you open it and click
**Publish**. Saving a draft commits to its own branch (a GitHub pull request), so you can craft a
blog over several sittings without anything showing publicly. Photos in the Album don't have this
step — they publish on save.

> Notes: the repo is **public**, so the functions request the `public_repo` scope. If you ever make
> the repo private, change `public_repo` → `repo` in `netlify/functions/auth.js`. If your branch
> isn't `main`, update `branch:` in `admin/config.yml`.

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
