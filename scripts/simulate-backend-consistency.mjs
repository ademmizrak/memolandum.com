#!/usr/bin/env node
/**
 * Local ↔ Firebase tutarlılık simülasyonu
 * Kullanım: npm run test:consistency
 */
import { spawnSync } from "child_process";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "scratch", "_sim_out");
const outfile = join(outDir, "bundle.cjs");
const entry = join(root, "scratch", "simulate_backend_consistency.js");

mkdirSync(outDir, { recursive: true });

console.log("Bundling simulation with esbuild…");
const build = spawnSync(
  "npx",
  [
    "--yes",
    "esbuild",
    entry,
    "--bundle",
    "--platform=node",
    "--format=cjs",
    `--outfile=${outfile}`,
    "--log-level=error",
  ],
  { cwd: root, shell: true, encoding: "utf8" }
);

if (build.status !== 0) {
  console.error(build.stderr || build.stdout);
  process.exit(1);
}

console.log("Running scenarios…\n");
const run = spawnSync("node", [outfile], {
  cwd: root,
  shell: true,
  encoding: "utf8",
  stdio: "inherit",
});

process.exit(run.status ?? 1);
