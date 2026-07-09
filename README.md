# Lorius Scripts

A minimal, responsive static website for showcasing free Roblox scripts.
Built with semantic HTML5, vanilla CSS and JavaScript — no build step, no
dependencies. Ready for AdSense integration and future monetization.

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero with intro animations, feature highlights, ad slots |
| Scripts | `scripts.html` | Script cards (logo, name, description, copy/download) rendered from JSON |
| Suggestions | `suggestions.html` | Visitor suggestion form (backend-ready payload) |
| About | `about.html` | Site purpose, YouTube channel mention, social link placeholders |
| Admin Hub | `admin.html` | Owner-only editor to add/edit/delete scripts and export the catalog |

## Managing scripts (Admin Hub)

The script catalog lives in **`data/scripts.json`**. Each entry looks like:

```json
{
  "id": "blox-fruits-hub",
  "game": "Blox Fruits",
  "logo": "assets/logos/blox-fruits.png",
  "description": "What the script does.",
  "script": "loadstring(game:HttpGet(\"https://...\"))()"
}
```

Two ways to update it:

1. **Admin Hub (recommended):** open `admin.html`, add/edit/delete scripts in
   the form. Changes save to your browser instantly for previewing. When happy,
   click **Export JSON** and replace `data/scripts.json` with the downloaded
   file, then commit and push.
2. **Direct edit:** edit `data/scripts.json` by hand — the Scripts page
   renders whatever is in it.

Game logos go in `assets/logos/`. If a logo is missing, cards automatically
show a colored monogram fallback, so logos are optional.

> Note: the Admin Hub is a client-side convenience editor with no
> authentication. Visitors who open it can only change their *own* browser's
> view — the published site only changes when you commit a new
> `data/scripts.json`. Keep it unlisted (it is `noindex` and not linked from
> the public nav).

## AdSense integration

1. After AdSense approval, paste your verification / auto-ads snippet into the
   marked comment block in the `<head>` of every HTML page.
2. Replace the `.ad-slot` placeholder divs with real ad unit code. They are
   positioned below the hero, between sections, above/below the script grid,
   and below the suggestion form.

## Suggestions backend

Suggestions are collected as JSON payloads
(`{ name, email, suggestion, submittedAt }`). Until a backend is wired up they
are stored in the visitor's `localStorage`. To connect a real backend, set
`SUGGESTIONS_ENDPOINT` at the top of `js/suggestions.js` to your API URL
(Formspree, a Cloudflare Worker, or your own server).

## Local development

Serve the folder with any static server (needed so `fetch` can load
`data/scripts.json`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening files directly via `file://` also works — the site falls back to an
embedded copy of the default catalog.

## Structure

```
├── index.html            # Home
├── scripts.html          # Script library
├── suggestions.html      # Suggestion form
├── about.html            # About
├── admin.html            # Admin Hub (owner editor)
├── data/
│   └── scripts.json      # Script catalog (single source of truth)
├── assets/
│   └── logos/            # Game logo images
├── css/
│   └── style.css         # All styles, animations, responsive rules
└── js/
    ├── main.js           # Nav, scroll reveal, shared behavior
    ├── scripts-data.js   # Data layer (JSON + localStorage)
    ├── scripts-page.js   # Renders script cards
    ├── suggestions.js    # Suggestion form handling
    └── admin.js          # Admin Hub CRUD + import/export
```
