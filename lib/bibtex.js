// Minimal BibTeX reader for publications.bib.
// Handles @type{key, field = {...} | "..." | number, ...} with nested braces,
// multi-line values (as exported by DBLP), comments and @string/@comment blocks.

const ACCENTS = {
  "'": { a: "á", e: "é", i: "í", o: "ó", u: "ú", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", c: "ć", n: "ń", s: "ś", z: "ź" },
  "`": { a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù" },
  '"': { a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü" },
  "^": { a: "â", e: "ê", i: "î", o: "ô", u: "û" },
  "~": { a: "ã", n: "ñ", o: "õ", N: "Ñ" },
  c: { c: "ç", C: "Ç" },
  v: { c: "č", s: "š", z: "ž", r: "ř", C: "Č", S: "Š", Z: "Ž" },
};

export function latexToText(s) {
  if (!s) return "";
  let t = s;
  t = t.replace(/\\textsuperscript\{([^}]*)\}/g, "<sup>$1</sup>");
  t = t.replace(/\$\^\{?([^$}]*)\}?\$/g, "<sup>$1</sup>");
  t = t.replace(/\\(?:emph|textit)\{([^}]*)\}/g, "<em>$1</em>");
  t = t.replace(/\\textbf\{([^}]*)\}/g, "$1");
  t = t.replace(/\{?\\([`'"^~])\{?\\?([a-zA-Z])\}?\}?/g, (m, a, c) => (ACCENTS[a] && ACCENTS[a][c]) || c);
  t = t.replace(/\{?\\([cv])\{([a-zA-Z])\}\}?/g, (m, a, c) => (ACCENTS[a] && ACCENTS[a][c]) || c);
  t = t.replace(/\\&/g, "&amp;").replace(/\\%/g, "%").replace(/\\_/g, "_").replace(/\\\$/g, "$");
  t = t.replace(/---/g, "—").replace(/--/g, "–").replace(/~/g, " ");
  t = t.replace(/[{}]/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function readValue(src, i) {
  // returns [value, nextIndex]
  while (/\s/.test(src[i])) i++;
  if (src[i] === "{") {
    let depth = 0, j = i;
    for (; j < src.length; j++) {
      if (src[j] === "\\") { j++; continue; }
      if (src[j] === "{") depth++;
      else if (src[j] === "}") { depth--; if (depth === 0) break; }
    }
    return [src.slice(i + 1, j), j + 1];
  }
  if (src[i] === '"') {
    let j = i + 1, depth = 0;
    for (; j < src.length; j++) {
      if (src[j] === "\\") { j++; continue; }
      if (src[j] === "{") depth++;
      else if (src[j] === "}") depth--;
      else if (src[j] === '"' && depth === 0) break;
    }
    return [src.slice(i + 1, j), j + 1];
  }
  const m = /^[^,}\s]+/.exec(src.slice(i));
  return [m ? m[0] : "", i + (m ? m[0].length : 0)];
}

export function parseBibtex(src) {
  const entries = [];
  const re = /@(\w+)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const type = m[1].toLowerCase();
    let i = re.lastIndex;
    if (type === "comment" || type === "string" || type === "preamble") {
      [, i] = readValue(src, m.index + m[0].length - 1);
      re.lastIndex = i;
      continue;
    }
    const keyEnd = src.indexOf(",", i);
    const key = src.slice(i, keyEnd).trim();
    i = keyEnd + 1;
    const fields = {};
    const start = m.index;
    while (i < src.length) {
      while (/[\s,]/.test(src[i])) i++;
      if (src[i] === "}") { i++; break; }
      const nm = /^([A-Za-z][\w-]*)\s*=\s*/.exec(src.slice(i));
      if (!nm) throw new Error(`publications.bib: cannot parse field near "${src.slice(i, i + 40)}" in entry ${key}`);
      i += nm[0].length;
      let [val, next] = readValue(src, i);
      i = next;
      // string concatenation with # is not used in this file; ignore it
      fields[nm[1].toLowerCase()] = val.replace(/\s+/g, " ").trim();
    }
    entries.push({ type, key, fields, raw: src.slice(start, i).trim() });
    re.lastIndex = i;
  }
  return entries;
}

export function splitAuthors(s) {
  if (!s) return [];
  return s.split(/\s+and\s+/).map((a) => {
    a = a.trim();
    if (a.includes(",")) {
      const [last, first] = a.split(",").map((x) => x.trim());
      a = `${first} ${last}`;
    }
    return latexToText(a);
  });
}
