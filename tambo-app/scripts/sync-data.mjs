// Reads the two static maps in the repo root and produces:
//   src/data/catalog.json   the use cases and features the assistant may talk about
//   public/maps/*.html      copies of the maps for the embedded viewer
// Run by `npm run sync` (and automatically before dev and build), so the app never drifts from the maps.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = resolve(here, "..");

function parseMap(file) {
  let s = readFileSync(resolve(root, file), "utf8");
  s = s.slice(0, s.indexOf('<script type="application/json" id="dt-other">'));
  const a = s.indexOf("var N=[") + 6;
  const b = s.indexOf("\n];", a) + 2;
  const nodes = JSON.parse(s.slice(a, b));
  const l = s.indexOf('var L=(', b);
  const q = s.indexOf('"', l);
  const links = JSON.parse(s.slice(q, s.indexOf('"', q + 1) + 1))
    .split("|").map((x) => x.split(" ")).filter((x) => x.length === 3);
  const byId = Object.fromEntries(nodes.map((n) => [n[0], n]));
  const rel = (id, r) => links.filter((x) => x[0] === id && x[2] === r).map((x) => byId[x[1]]?.[2]).filter(Boolean);
  return { nodes, rel };
}
function sections(desc) {
  const parts = desc.split("\n\n");
  const o = { lead: parts[0] };
  for (const p of parts.slice(1)) {
    const i = p.indexOf(": ");
    if (i > 0) o[p.slice(0, i)] = p.slice(i + 2);
  }
  return o;
}
const steps = (t) => (t || "").replace(/\.\s+(?=[A-Z(])/g, ".\u0001").split("\u0001").filter(Boolean);
const hash = (id) => "#c-" + id.replace(/_/g, "-");

const uc = parseMap("use-case-map.html");
const useCases = uc.nodes.filter((n) => n[1] === "usecase").map((n) => {
  const d = sections(n[4]), x = n[5] || {};
  return {
    id: n[0], title: n[2], situation: d.lead, steps: steps(d["How it works"]),
    result: d["Business impact"] || "", safeguards: d["Challenges"] || "", benchmark: d["Industry benchmark"] || "",
    industries: uc.rel(n[0], "in_industry"), functions: uc.rel(n[0], "serves_function"), outcomes: uc.rel(n[0], "delivers"),
    evidence: x.evName || "", headline: x.kn ? { value: x.kn[0], label: x.kn[1], basis: x.kn[2] } : null,
    hash: hash(n[0]),
  };
});

const pm = parseMap("product-map.html");
const features = pm.nodes.filter((n) => n[1] === "usecase").map((n) => {
  const d = sections(n[4]), x = n[5] || {};
  return {
    id: n[0], title: n[2], what: d.lead, steps: steps(d["How it works"]), why: d["Why it matters"] || "",
    goodToKnow: d["Good to know"] || "", area: pm.rel(n[0], "in_industry")[0] || "", audiences: pm.rel(n[0], "serves_function"),
    benefits: pm.rel(n[0], "delivers"), availability: x.evName || x.status || "", hash: hash(n[0]),
  };
});
const platform = pm.nodes.find((n) => n[1] === "company")[4];

mkdirSync(resolve(out, "src/data"), { recursive: true });
mkdirSync(resolve(out, "public/maps"), { recursive: true });
writeFileSync(resolve(out, "src/data/catalog.json"), JSON.stringify({ platform, useCases, features }, null, 1));
for (const f of ["use-case-map.html", "product-map.html"]) copyFileSync(resolve(root, f), resolve(out, "public/maps", f));
console.log(`catalog: ${useCases.length} use cases, ${features.length} features`);
