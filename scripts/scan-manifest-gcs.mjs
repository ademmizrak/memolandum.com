import fs from "fs";

const content = fs.readFileSync("src/config/manifest.js", "utf8");
const paths = new Set();
const re = /"path"\s*:\s*"([^"]+\.json)"/g;
let m;
while ((m = re.exec(content))) paths.add(m[1]);

const base =
  "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data/";
const list = [...paths];
let ok = 0;
const fail = [];
let i = 0;

async function worker() {
  while (i < list.length) {
    const idx = i++;
    const p = list[idx];
    const url = base + p.split("/").map(encodeURIComponent).join("/");
    try {
      const r = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-16" },
      });
      if (r.status === 200 || r.status === 206) ok++;
      else fail.push([r.status, p]);
      await r.arrayBuffer().catch(() => {});
    } catch {
      fail.push(["ERR", p]);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
console.log("TOTAL", list.length, "OK", ok, "FAIL", fail.length);
const byStatus = {};
for (const [s] of fail) byStatus[s] = (byStatus[s] || 0) + 1;
console.log("byStatus", byStatus);
fail.slice(0, 40).forEach(([s, p]) => console.log(s, p));
const tr = fail.filter(([, p]) => /[şğüöçıİâîû]/i.test(p));
console.log("turkish-char fails", tr.length);
