import katex from "katex";
import markdownIt from "markdown-it";

const md = markdownIt({ html: true, typographer: false });

export default function (eleventyConfig) {
  // Static files
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });
  const font = "node_modules/@fontsource-variable/alegreya/files";
  for (const f of ["latin", "latin-ext"]) {
    for (const s of ["normal", "italic"]) {
      eleventyConfig.addPassthroughCopy({ [`${font}/alegreya-${f}-wght-${s}.woff2`]: `assets/fonts/alegreya-${f}-wght-${s}.woff2` });
    }
  }
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist/katex.min.css": "assets/katex/katex.min.css" });
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist/fonts/*.woff2": "assets/katex/fonts" });

  // Math rendered at build time: {% math "\\mathsf{FP}^{\\#P}" %}
  eleventyConfig.addShortcode("math", (tex) =>
    katex.renderToString(tex, { throwOnError: true, output: "htmlAndMathml" })
  );

  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("absolute", (path, base) => new URL(path, base).href);
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

  // Markdown inside Nunjucks: {% markdown %}...{% endmarkdown %}
  eleventyConfig.addPairedShortcode("markdown", (body) => md.render(body.replace(/^\n+/, "")));
  // "{n} works" with {key} placeholders; values may contain HTML.
  eleventyConfig.addFilter("fmt", (s, vals) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vals ? vals[k] : m)));
  // "2026-08" -> "Aug 2026" in the page language; "2026" stays as is.
  eleventyConfig.addFilter("monthLabel", (d, lang) => {
    const m = /^(\d{4})-(\d{2})$/.exec(d);
    if (!m) return d;
    return new Intl.DateTimeFormat(lang, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 15)));
  });
  // Share of each topic's mentions in a text (same rule as site.js), sorted by share.
  eleventyConfig.addFilter("topicShares", (topics, text) => {
    const n = topics.map(([name, pattern, anchor], k) => ({ name, pattern, anchor, k, n: (text.match(new RegExp(pattern, "gi")) || []).length }));
    const total = n.reduce((a, b) => a + b.n, 0) || 1;
    return n.map((t) => ({ ...t, share: (t.n / total).toFixed(2) })).sort((a, b) => b.n - a.n || a.k - b.k);
  });
  eleventyConfig.addFilter("find", (arr, key, val) => arr.find((x) => x[key] === val));

  eleventyConfig.addWatchTarget("publications.bib");
  eleventyConfig.addWatchTarget("lib/");

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
