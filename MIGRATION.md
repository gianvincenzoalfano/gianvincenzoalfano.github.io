# Migration from WordPress

## URL mapping

| Old WordPress page | Status there | New page |
|---|---|---|
| `/` (page "86-2", also reachable at `/86-2/`) | published | `/` |
| `/teaching-activities-and-cv/` | published | `/teaching/` (CV: `/cv/`) |
| `/insegnamenti-anni-precedenti/` ("Teaching Activities") | published | `/teaching/` |
| `/tesisti/` ("Thesis Students") | published | `/teaching/#tesi` |
| `/scientific-activities/` | published | `/service/` (awards: `/cv/#awards`) |
| `/publications/` | published | `/publications/` (same path) |
| `?page_id=5`, `?page_id=9`, `?page_id=79`, `?page_id=277` | drafts, never public | none |
| `/wp-content/uploads/2022/11/cv-alfano-2022-09-17*.pdf` | CV attachments (2022) | `/cv/` |
| `/wp-content/uploads/2022/10/certificatephd.pdf`, `mar-10-doc-1.pdf` | attachments | not migrated |

Every old page path in the table has a redirect page on the new site (`src/_data/redirects.json`), so once the domain points to GitHub Pages the old addresses keep working. Old `wp-content` file links cannot be redirected by a static site; they keep working only while the WordPress site exists.

Stock images (Pexels), the UniCal banner and the WordPress logo were not migrated.

## Option A: move gianvincenzoalfano.net to GitHub Pages (recommended)

1. Create the file `src/CNAME` containing one line: `gianvincenzoalfano.net`.
2. In `src/_data/site.json`, set `"url": "https://gianvincenzoalfano.net"`.
3. At the DNS provider of the domain (currently WordPress.com, under Domains → DNS records), replace the existing records with:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www`: `gianvincenzoalfano.github.io`
4. In the repository: Settings → Pages → Custom domain → `gianvincenzoalfano.net`, then tick "Enforce HTTPS" once the certificate is issued (it can take up to a day).
5. Old paths such as `/publications/` and `/scientific-activities/` now resolve on the new site.

## Option B: keep the domain on WordPress

The site lives at https://gianvincenzoalfano.github.io. Point visitors there from WordPress:
- whole-site: a site redirect, if your WordPress.com plan offers one;
- per page: replace each page's content with a link to the matching new page from the table above.
