# Found Room — Site Architecture

Rules for editing and deploying the site. Follow these every time, without exception.

---

## The golden rule

**Never edit the root-level `.html` files directly.** They are build outputs. Any change made there will be overwritten the next time `build.py` runs (either locally or in CI). All edits happen in `_src/`.

---

## Where things live

```
_src/
  layouts/
    base.html          ← HTML shell. Edit to change the document <head>, <body>, or slot layout.
  partials/
    header.html        ← Shared nav. Edit here to change navigation site-wide.
    footer.html        ← Shared footer. Edit here to change footer site-wide.
  pages/
    [page-slug]/
      config.json      ← Page metadata (see below).
      style.css        ← Page-specific CSS only (see rules below).
      sections/        ← Content modules, assembled in alphabetical order.
        01-hero.md
        02-body.md
        ...

assets/
  css/
    global.css         ← Shared styles: nav, footer, typography, layout utilities, variables.
  js/
    global.js          ← Shared JavaScript: nav scroll, mobile menu, reveal animations.
```

---

## config.json fields

| Field | Required | Description |
|---|---|---|
| `title` | yes | Page `<title>` and OG title |
| `description` | yes | Meta description and OG description |
| `output` | yes | Output filename (e.g. `about.html`) |
| `og_image` | no | Full URL to OG image (defaults to `/assets/og-default.jpg`) |
| `og_type` | no | OG type — `website` (default) or `article` |
| `body_class` | no | Class added to `<body>`. Use `"page-home"` for the home page transparent nav variant. |

---

## CSS rules

**`assets/css/global.css`** — for anything used on more than one page:
- CSS variables (`:root`)
- Nav, header, footer
- Body/html resets
- Typography utilities
- Page-variant selectors (`body.page-home nav`, etc.)

**`_src/pages/[page]/style.css`** — for styles that only appear on one page:
- Hero layout and imagery
- Section-specific grid/spacing
- Page-specific components and animations
- Responsive overrides for page-specific layouts

**Never in a page `style.css`:**
- `:root` variable declarations (already in `global.css`)
- `body`, `html` resets (already in `global.css`)
- `nav`, `.nav-logo`, `.nav-links`, `.nav-cta` (shared component — use `body.page-home nav` in `global.css` for variants)
- Any style that would need to be kept in sync across multiple files

### Adding a new page variant

If a page needs a different visual treatment for a shared component (e.g. a different nav colour):

1. Add `"body_class": "page-yourname"` to that page's `config.json`
2. Add `body.page-yourname nav { ... }` (or whatever component) to `global.css`
3. Do **not** redeclare the component in the page's `style.css`

---

## Build workflow

```bash
# From the repo root
python3 build.py
```

This reads all `_src/pages/*/` directories and writes built HTML to the repo root. Run this after any change to `_src/`, `assets/`, or `_src/layouts/`.

The built HTML files (`*.html` at repo root) are checked in. Always commit both the source files AND the rebuilt HTML together.

---

## Deploy workflow

Git push is blocked from the VM. After committing, push from the Mac terminal:

```bash
cd ~/Desktop/foundroom/foundroom-site/repo
git push
```

GitHub Actions picks up the push, runs `build.py` in CI, and deploys to GitHub Pages automatically.

---

## Adding a new page

1. Create `_src/pages/[your-slug]/config.json` with at minimum `title`, `description`, `output`
2. Create `_src/pages/[your-slug]/style.css` (can be empty if no page-specific styles)
3. Create `_src/pages/[your-slug]/sections/01-hero.md` (and additional sections as needed)
4. Run `python3 build.py`
5. If it's a journal article, add it to `_src/pages/journal/sections/02-essays.md`
6. Add the page to `sitemap.xml`
7. Add the page to `llms.txt` and `llms-full.txt`
8. Commit source + built HTML together
9. Push from Mac terminal

---

## What NOT to do

- Do not edit `index.html`, `about.html`, or any other root HTML file directly
- Do not put global resets or shared component styles in a page's `style.css`
- Do not commit only the source files without rebuilding (the built HTML must stay in sync)
- Do not commit only the built HTML without the source files that generated it
- Do not run `git push` from the VM (it is blocked by proxy — use Mac terminal)
- Do not install packages with `npm install` without the `NODE_PATH` env var pointing to the global modules directory
