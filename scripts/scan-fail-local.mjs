import fs from "fs";
import { spawnSync } from "child_process";

// Reuse fail list by quick re-scan of known categories
const content = fs.readFileSync("src/config/manifest.js", "utf8");
const paths = new Set();
const re = /"path"\s*:\s*"([^"]+\.json)"/g;
let m;
while ((m = re.exec(content))) paths.add(m[1]);

const base =
  "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data/";
const fails = [];
for (const p of paths) {
  const url = base + p.split("/").map(encodeURIComponent).join("/");
  const r = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-8" },
  });
  await r.arrayBuffer().catch(() => {});
  if (!(r.status === 200 || r.status === 206)) fails.push(p);
}

let localOk = 0;
let localMissing = 0;
for (const p of fails) {
  if (fs.existsSync(`public/data/${p}`)) localOk++;
  else localMissing++;
}

console.log("GCS fail count", fails.length);
console.log("those with local public/data copy", localOk);
console.log("those missing locally too", localMissing);
console.log("\nAll fails:");
fails.forEach((p) =>
  console.log(
    (fs.existsSync(`public/data/${p}`) ? "LOCAL" : "NOLOC") + " " + p
  )
);
