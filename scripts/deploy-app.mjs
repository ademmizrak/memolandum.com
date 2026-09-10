/**
 * deploy:app — slim Next.js App Shell → Firebase Hosting
 *
 * - public/data, assets/audio, assets/words build sırasında gizlenir
 * - MEMOLANDUM_SLIM_APP=1 → sözlük detay SSG üretilmez
 * - out/ içinden kalan ağır içerik temizlenir
 * - firebase deploy --only hosting
 *
 * Usage:
 *   node scripts/deploy-app.mjs
 *   node scripts/deploy-app.mjs --build-only
 *   node scripts/deploy-app.mjs --skip-build   (mevcut out/ ile deploy)
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  ROOT,
  hideForSlimBuild,
  restoreAfterSlimBuild,
  walkFiles,
} from "./lib/deployShared.mjs";

const args = new Set(process.argv.slice(2));
const BUILD_ONLY = args.has("--build-only");
const SKIP_BUILD = args.has("--skip-build");

function run(cmd, cmdArgs) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  const res = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit", shell: true });
  if (res.status !== 0) throw new Error(`Komut başarısız (${res.status}): ${cmd}`);
}

function stripHeavyFromOut() {
  const outDir = path.join(ROOT, "out");
  if (!fs.existsSync(outDir)) return { removed: 0 };

  const killDirs = [
    path.join(outDir, "data"),
    path.join(outDir, "assets", "audio"),
    path.join(outDir, "assets", "words"),
    path.join(outDir, "assets", "sentences"),
    path.join(outDir, "assets", "_slim_skip_audio"),
    path.join(outDir, "assets", "_slim_skip_words"),
    path.join(outDir, "assets", "_slim_skip_sentences"),
    path.join(outDir, "_slim_skip_data"),
  ];

  let removed = 0;
  for (const d of killDirs) {
    if (!fs.existsSync(d)) continue;
    const n = walkFiles(d).length;
    fs.rmSync(d, { recursive: true, force: true });
    removed += n;
    console.log(`🧹 out temiz: ${path.relative(outDir, d)} (${n} dosya)`);
  }

  // Slim app: derin sözlük kavram HTML/txt'lerini sil (SPA rewrite kullanır)
  const sozluk = path.join(outDir, "sozluk");
  if (fs.existsSync(sozluk)) {
    for (const cat of fs.readdirSync(sozluk, { withFileTypes: true })) {
      if (!cat.isDirectory()) continue;
      if (cat.name.startsWith("_")) continue; // _concept shell kalsın
      const catDir = path.join(sozluk, cat.name);
      for (const ent of fs.readdirSync(catDir, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue; // kategori index.html kalsın
        const conceptDir = path.join(catDir, ent.name);
        const n = walkFiles(conceptDir).length;
        fs.rmSync(conceptDir, { recursive: true, force: true });
        removed += n;
      }
    }
    console.log("🧹 out/sozluk kavram detayları silindi (SPA)");
  }

  // Audio leftovers anywhere under out
  for (const f of walkFiles(outDir)) {
    if (/\.(mp3|wav|ogg)$/i.test(f)) {
      fs.unlinkSync(f);
      removed++;
    }
  }

  return { removed };
}

function countOut() {
  const outDir = path.join(ROOT, "out");
  if (!fs.existsSync(outDir)) return 0;
  return walkFiles(outDir).length;
}

async function main() {
  console.log("=== deploy:app (slim Hosting) ===");
  let moved = [];
  try {
    if (!SKIP_BUILD) {
      moved = hideForSlimBuild();
      process.env.MEMOLANDUM_SLIM_APP = "1";
      process.env.NEXT_PUBLIC_DATA_BASE_URL =
        process.env.NEXT_PUBLIC_DATA_BASE_URL ||
        "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data";
      process.env.NEXT_PUBLIC_ASSETS_BASE_URL =
        process.env.NEXT_PUBLIC_ASSETS_BASE_URL ||
        "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app";

      run("npm", ["run", "build"]);
      const { removed } = stripHeavyFromOut();
      console.log(`📦 out dosya sayısı: ${countOut()} (temizlenen ~${removed})`);
    }

    if (BUILD_ONLY) {
      console.log("✅ --build-only: Hosting deploy atlandı");
      return;
    }

    run("npx", ["-y", "firebase-tools@latest", "deploy", "--only", "hosting", "--non-interactive"]);
    console.log("✅ deploy:app tamam");
  } finally {
    restoreAfterSlimBuild(moved);
  }
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
