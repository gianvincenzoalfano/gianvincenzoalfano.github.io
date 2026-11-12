import katex from "katex";

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

  eleventyConfig.addWatchTarget("publications.bib");
  eleventyConfig.addWatchTarget("lib/");

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
