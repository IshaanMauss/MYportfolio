# Ishaan Chaturvedi | Portfolio

A static, dependency-free portfolio. No build step, no framework: HTML, CSS and vanilla JS, all content driven by one JSON file.

## Run locally

Browsers block `fetch()` on `file://`, so serve the folder:

```sh
npx serve .
# or
python -m http.server
```

## Add or change content

Everything on the page comes from **`data/portfolio.json`**:

| Key | What it controls |
| --- | --- |
| `profile` | Name, headline, bio, photo, links, rotating roles, the hero request trace, optional `resume` path |
| `systems` | The "Systems" write-ups (problem / approach / outcome + flow diagram steps) |
| `projects` | Project cards. Category prefix before `/` becomes a filter. `private: true` shows a PRIVATE badge |
| `skills` | Stack groups (also feeds the marquee and the technology count) |
| `now` | "What I'm working on" cards |
| `experience` | Timeline entries (`role`, `org`, `period`, `summary`). Empty = section hides itself |

Stats (projects, write-ups, technologies) are computed, never hand-typed.

**No-code route:** open `add-project.html` (the Studio) while the site is served. Fill the form, then "Copy full portfolio.json" and paste over `data/portfolio.json`. It can auto-fill a project from a public GitHub URL.

## Themes

Three palettes switchable from the nav (saved per visitor): Midnight + Electric Cobalt + Acid Lime, Orchid + Deep Violet + Signal Orange, Sage + Cream + Burgundy. All colours are CSS variables at the top of `css/style.css`.

## Shortcuts

`Ctrl/Cmd + K` or `/` opens the command menu (jump to sections, change theme, open links, copy email).

## Before you deploy

- If your Netlify address is not `lookupmyportfolio.netlify.app`, update the `og:url`, `og:image`, `twitter:image` and `canonical` URLs in `index.html`.
- Add a `resume` path in `data/portfolio.json` if you want a Resume button.
- `_legacy-v1/` holds the previous version of the site. Delete it when you no longer need it.
