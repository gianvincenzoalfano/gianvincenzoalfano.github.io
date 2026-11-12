import fs from "node:fs";
import { parseBibtex, latexToText, splitAuthors } from "../../lib/bibtex.js";

const SELF = "Gianvincenzo Alfano";

const CATEGORIES = [
  { id: "journal", label: "Journal articles" },
  { id: "conference", label: "Conference papers" },
  { id: "workshop", label: "Workshop papers" },
  { id: "other", label: "Other" },
];
// keywords in the .bib that are grouped under "Other"
const OTHER = new Set(["national", "chapter", "editorship", "preprint"]);

// Fields used only by the site, removed from the BibTeX shown to readers
const PRIVATE = new Set(["keywords", "hidden", "cvnumber", "award", "slides", "pdf"]);
const ORDER = ["author", "editor", "title", "journal", "booktitle", "series", "volume", "number", "pages",
  "year", "publisher", "howpublished", "doi", "url", "eprint", "archiveprefix", "note"];

function cleanBibtex(e) {
  const keys = Object.keys(e.fields).filter((k) => !PRIVATE.has(k));
  keys.sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const w = Math.max(...keys.map((k) => k.length));
  const body = keys.map((k) => `  ${k.padEnd(w)} = {${e.fields[k]}}`).join(",\n");
  return `@${e.type}{${e.key},\n${body}\n}`;
}

function pages(p) {
  if (!p) return "";
  return /[-–]/.test(p) ? `pp. ${latexToText(p)}` : latexToText(p);
}

function venue(e) {
  const f = e.fields;
  const t = latexToText;
  switch (e.type) {
    case "article": {
      let v = `<em>${t(f.journal)}</em>`;
      if (f.volume) v += ` ${t(f.volume)}`;
      if (f.number) v += `(${t(f.number)})`;
      if (f.pages) v += `: ${t(f.pages)}`;
      return `${v}, ${f.year}`;
    }
    case "inproceedings":
    case "incollection": {
      let v = `<em>${t(f.booktitle)}</em>`;
      const extra = [];
      if (f.series && f.volume) extra.push(`${t(f.series)} ${t(f.volume)}`);
      if (f.pages) extra.push(pages(f.pages));
      if (e.type === "incollection" && f.publisher) extra.push(t(f.publisher));
      if (extra.length) v += `, ${extra.join(", ")}`;
      return v;
    }
    case "proceedings":
      return `Editors. ${t(f.series || "")}${f.volume ? " " + t(f.volume) : ""}, ${f.year}`;
    case "misc":
      return f.eprint ? `arXiv:${f.eprint}, ${f.year}` : `${t(f.howpublished || "")}, ${f.year}`;
    default:
      return `${t(f.note || "")}, ${f.year}`;
  }
}

// Short label used when the Research page cites a paper, e.g. "AAAI 2025"
function shortVenue(e) {
  const f = e.fields;
  if (e.type === "article") return `${latexToText(f.journal).replace(/ [–-] .*/, "")} ${f.year}`;
  if (e.type === "misc") return `arXiv ${f.year}`;
  const m = /\(([^()]*\d{4})\)/.exec(latexToText(f.booktitle || ""));
  return m ? m[1] : `${latexToText(f.booktitle || f.note || "")} ${f.year}`;
}

export default function () {
  const src = fs.readFileSync("publications.bib", "utf8");
  const all = parseBibtex(src);
  const seen = new Set();
  for (const e of all) {
    if (seen.has(e.key)) throw new Error(`publications.bib: duplicate key ${e.key}`);
    seen.add(e.key);
    if (!e.fields.year) throw new Error(`publications.bib: entry ${e.key} has no year`);
    if (!e.fields.keywords) throw new Error(`publications.bib: entry ${e.key} has no keywords (category)`);
  }
  const entries = all
    .filter((e) => e.fields.hidden !== "true")
    .map((e) => {
      const f = e.fields;
      const kw = f.keywords.split(/[,\s]+/)[0];
      const cat = OTHER.has(kw) ? "other" : kw;
      if (!CATEGORIES.some((c) => c.id === cat)) throw new Error(`publications.bib: unknown keywords "${kw}" in ${e.key}`);
      const people = splitAuthors(f.author || f.editor).map((n) => ({ name: n, self: n === SELF }));
      const links = [];
      if (f.doi) links.push({ label: "DOI", url: `https://doi.org/${f.doi}` });
      if (f.eprint) links.push({ label: "arXiv", url: `https://arxiv.org/abs/${f.eprint}` });
      if (f.pdf) links.push({ label: "PDF", url: f.pdf });
      if (f.url && !f.doi) links.push({ label: f.url.includes("ceur-ws.org") ? "CEUR-WS" : "Link", url: f.url });
      if (f.slides) links.push({ label: "Slides", url: f.slides });
      return {
        key: e.key,
        cat,
        kind: kw,
        year: Number(f.year),
        order: Number(f.cvnumber || 0),
        title: latexToText(f.title),
        people,
        venue: venue(e),
        short: shortVenue(e),
        note: f.note ? latexToText(f.note) : "",
        award: f.award ? latexToText(f.award) : "",
        links,
        bibtex: cleanBibtex(e),
      };
    })
    .sort((a, b) => b.year - a.year || b.order - a.order);

  const years = [...new Set(entries.map((e) => e.year))].map((y) => {
    const items = entries.filter((e) => e.year === y);
    return { year: y, items, cats: [...new Set(items.map((e) => e.cat))].join(" ") };
  });
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, entries.filter((e) => e.cat === c.id).length]));
  const byKey = Object.fromEntries(entries.map((e) => [e.key, e]));
  return { entries, years, counts, categories: CATEGORIES, byKey, total: entries.length };
}
