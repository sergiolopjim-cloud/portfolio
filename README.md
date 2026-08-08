# Sergio Lopez — Photography site

Static site. No build step. Everything it needs is in this folder.

```
index.html          the site
support.js          runtime (do not edit)
image-slot.js       image component (do not edit)
assets/             logo
images/             ALL PHOTOS — your galleries
images/slideshow/   the photos on the landing page
images/manifest.json  maintained automatically — never edit by hand
.nojekyll           tells GitHub Pages to serve files as-is
.github/            automation that rebuilds manifest.json after every upload
```

## How photos work

**Filenames do the sorting.** Two dashes between the three parts, single dashes
between words inside a part:

```
category--location--client-and-name.jpg

product-photography--mexico-city--mezcal-amores-01.jpg
hotel-photography--mexico-city--casa-polanco-01.jpg
architecture-photography--malmo--villa-nord-01.jpg
```

- before the first `--` → the category
- between the two `--` → the location
- after the second `--` → the client / project
- a trailing number (`-01`, `-02`) is ignored, so one client's photos group together

**Folders are free.** Organise inside `images/` however you like — by year, by
category, nested as deep as you want. Only each file's NAME is read, so your own
filing system never affects the site.

**Two folders:**

- `images/` — every photo (any subfolders). Builds the categories and project galleries.
- `images/slideshow/` — copies of the few you want on the landing page.
  Putting a photo in this folder IS the selection. Empty folder = all photos show.

Nothing else to edit. After any upload the automation rebuilds `manifest.json`
and the site updates in about a minute.

## Publishing — first time

1. On github.com create a new **public** repository, e.g. `portfolio`.
2. Install **GitHub Desktop** (desktop.github.com), sign in.
3. GitHub Desktop → File → **Clone repository** → pick `portfolio` → choose a folder.
4. Copy everything inside this `site` folder into the cloned folder.
   On Mac press **⌘ + Shift + .** to reveal the hidden `.nojekyll` and `.github`.
5. GitHub Desktop: message "first version" → **Commit to main** → **Push origin**.
6. github.com → repo → **Settings** → **Pages** → Source *Deploy from a branch*,
   Branch `main`, folder `/ (root)` → **Save**.
7. Wait ~1 minute → `https://YOURNAME.github.io/portfolio/`

## Adding photos after that

Drag photos into the `images` folder on your Mac → GitHub Desktop → Commit → Push.
(Or on github.com: open `images` → **Add file → Upload files** → drag → Commit.)

To feature photos on the landing page, put copies in `images/slideshow/` the same way.
To remove a photo, delete the file and push.

## Your GoDaddy domain

1. Create a file named `CNAME` (no extension) in this folder containing only your
   domain, e.g. `sergiolopez.com` — then commit + push. (Don't add it before the
   DNS below, or Pages will point at a domain that doesn't resolve yet.)
2. GoDaddy → your domain → **DNS**:
   - Four `A` records, host `@`:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One `CNAME` record: host `www` → `YOURNAME.github.io`
   - Delete any existing `@` A record pointing at GoDaddy's parking page.
3. GitHub → Settings → Pages → **Custom domain** → your domain → Save.
4. When it verifies, tick **Enforce HTTPS**. DNS can take a few hours.
