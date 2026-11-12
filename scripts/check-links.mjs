// Checks every internal link, image and #anchor in the built site (_site).
// Run after "npm run build"; exits with an error if something is broken.
import fs from "node:fs";
import path from "node:path";

const root = "_site";
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) files.push(p);
  }
})(root);

const ids = new Map();
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  ids.set(f, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

function target(from, url) {
  let [p, hash] = url.split("#");
  p = p.split("?")[0];
  let file = p === "" ? from : p.startsWith("/") ? path.join(root, p) : path.join(path.dirname(from), p);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  return { file, hash };
}

let errors = 0;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    const { file, hash } = target(f, url);
    if (!fs.existsSync(file)) { console.error(`${f}: missing ${url}`); errors++; continue; }
    if (hash && file.endsWith(".html") && !ids.get(file)?.has(hash)) { console.error(`${f}: missing anchor ${url}`); errors++; }
  }
  if (!/<title>[^<]+<\/title>/.test(html)) { console.error(`${f}: no <title>`); errors++; }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) { console.error(`${f}: image without alt`); errors++; }
}
console.log(`${files.length} pages checked, ${errors} problems`);
process.exit(errors ? 1 : 0);
