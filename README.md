# gianvincenzoalfano.github.io

Personal academic website of Gianvincenzo Alfano (DIMES, University of Calabria).

Every push to `main` builds the site and publishes it on GitHub Pages; nothing has to be built on your computer.

## Everyday edits

Each task is a single-file edit, made directly on GitHub (pencil icon) or locally.

| To… | Edit | How |
|---|---|---|
| Add or fix a paper | `publications.bib` | Paste the BibTeX (e.g. from DBLP) and add `keywords = {journal}` (or `conference`, `workshop`, `national`, `chapter`, `editorship`, `preprint`). Optional fields: `award = {...}` highlights it, `slides = {url}`, `pdf = {url}`, `note = {...}`, `hidden = {true}` keeps it off the site. Order is by `year`. |
| Add a news item | `src/_data/news.json` | Add `{ "date": "YYYY-MM", "text": { "en": "...", "it": "...", ... }, "link": "/publications/#key" }` at the top, with one text per language (`date` can also be just `YYYY`). The home page shows the first five. |
| Update the CV | `src/assets/files/cv-alfano.pdf` | Upload the new PDF with the same name. Make sure it contains no personal data (see TODO.md). |
| Change a course or a thesis | `src/_data/teaching.json` | Shared by all languages; course names stay in Italian. Role and degree labels come from `src/_data/i18n/<lang>.json`. |
| Change service, projects, research, CV summary | `src/_includes/content/<page>/<lang>.njk` | One file per language (`en`, `it`, `es`, `fr`, `de`, `zh`), Markdown with a little HTML. Edit every language, or at least `en` and `it`. |
| Change menus, home page text, bio, labels | `src/_data/i18n/<lang>.json` | One file per language. The bars next to the bio are computed from the bio text with the `topics` patterns. |
| Change title, address, profile links, photo | `src/_data/site.json` | |

A paper is linked from other pages as `/publications/#key`, where `key` is its BibTeX key.

## How it is built

- **[Eleventy](https://www.11ty.dev/) 3** static site generator, Nunjucks and Markdown templates in `src/`.
- **Publications** are read from `publications.bib` by a small parser (`lib/bibtex.js`, `src/_data/publications.js`); the build stops with a clear message if the file has a syntax error, a duplicate key, or an entry without `year` or `keywords`.
- **Math** uses KaTeX, rendered at build time (`{% math "\\mathsf{NP}" %}` in any page); no script runs in the browser.
- **Font**: Alegreya (SIL Open Font License), self-hosted from the `@fontsource-variable/alegreya` package.
- **Motion** (after luciolacava.me): an animated bipolar argumentation framework in the background of every page (`src/assets/js/af-bg.js`: attacks and supports, nodes coloured with the grounded labelling, one relation changing every few seconds with the labelling recomputed, highlight near the pointer), aurora background, live status dots, a streaming bio with a live "Topics in this bio" panel (share of mentions per research topic; the bars reorder as the text streams, and selecting a topic highlights it in the bio and links to the matching research line), reading-progress bar, reveal on scroll, back-to-top. One small script, `src/assets/js/site.js`, is an optional enhancement: without JavaScript every page is complete (full bio, final values), and with "reduce motion" enabled nothing moves. The publication filters stay CSS-only (`:has()`), BibTeX blocks use `<details>`.
- **Home text**: the streamed bio is in `src/index.njk` (`bio1`, `bio2`); the topics of the panel are the `data-topic` patterns (regular expressions) in the same file, and the script recomputes the values from the text.
- **Deploy**: `.github/workflows/deploy.yml` runs `npm ci`, `npm run build`, `npm run check` (internal links, anchors, titles, image alt text) and publishes `_site/` to GitHub Pages. Pull requests are built and checked but not published.

Why Eleventy and not Jekyll with jekyll-scholar or al-folio: the site was prepared in an environment without access to RubyGems, so a Jekyll build could not be tested before delivery; Eleventy could be, end to end. Both give the same workflow (a `.bib` file drives the publication list, a push deploys). al-folio was also set aside because it ships a large JavaScript bundle, which conflicts with the no-JavaScript and Lighthouse targets.

## One-time setup

1. Repository Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Push to `main`; the site appears at https://gianvincenzoalfano.github.io after the workflow finishes (Actions tab).
3. For the custom domain, see `MIGRATION.md`.

## Working locally (optional)

Requires Node.js 22.

```sh
npm ci
npm run serve     # http://localhost:8080, rebuilds on save
npm run build && npm run check
```

## Files

- `src/pages/`: one template per page, generated once per language (English at `/`, the others at `/it/`, `/es/`, `/fr/`, `/de/`, `/zh/`; list in `src/_data/languages.json`)
- `src/_includes/content/`: per-language page text; `src/_data/i18n/`: per-language interface strings
- Dark mode: the moon button in the header; the choice is stored in the browser, otherwise the system setting applies
- `src/_data/redirects.json`: old WordPress paths and their new pages
- `TODO.md`: open points and every change made to the source material
- `MIGRATION.md`: URL mapping and domain instructions
