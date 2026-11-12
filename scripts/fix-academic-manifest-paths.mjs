/**
 * Manifest academic path fixer:
 * academic/FOO.json → academic/kpss_sinav|technic/FOO.json when local file exists.
 */
import fs from "fs";

const MANIFEST = "src/config/manifest.js";
let src = fs.readFileSync(MANIFEST, "utf8");

const re = /"path"\s*:\s*"(academic\/[^"]+\.json)"/g;
const replacements = [];
let m;
while ((m = re.exec(src))) {
  const oldPath = m[1];
  if (oldPath === "academic/glossary-index.json") continue;
  if (oldPath.startsWith("academic/kpss_sinav/") || oldPath.startsWith("academic/technic/")) {
    continue;
  }

  const file = oldPath.slice("academic/".length);
  const candidates = [
    `academic/kpss_sinav/${file}`,
    `academic/technic/${file}`,
  ];
  const hit = candidates.find((c) => fs.existsSync(`public/data/${c}`));
  if (!hit) {
    console.warn("NO LOCAL MATCH", oldPath);
    continue;
  }
  replacements.push([oldPath, hit]);
}

let changed = 0;
for (const [from, to] of replacements) {
  const needle = `"path": "${from}"`;
  const next = `"path": "${to}"`;
  if (!src.includes(needle)) {
    // try spaced variant already matched
    const alt = `"path":"${from}"`;
    if (src.includes(alt)) {
      src = src.split(alt).join(`"path":"${to}"`);
      changed++;
      console.log("FIX", from, "→", to);
      continue;
    }
    console.warn("SKIP not found exact", from);
    continue;
  }
  const count = src.split(needle).length - 1;
  src = src.split(needle).join(next);
  changed += count;
  console.log(`FIX x${count}`, from, "→", to);
}

fs.writeFileSync(MANIFEST, src);
console.log("\nTotal path updates:", changed);
