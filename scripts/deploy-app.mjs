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
  copyDataJsonsToOut,
  copyAssetsToOut,
} from "./lib/deployShared.mjs";

const args = new Set(process.argv.slice(2));
const BUILD_ONLY = args.has("--build-only");
const SKIP_BUILD = args.has("--skip-build");
const SKIP_SMOKE = args.has("--skip-smoke");

function run(cmd, cmdArgs) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  const res = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit", shell: true });
  if (res.status !== 0) throw new Error(`Komut başarısız (${res.status}): ${cmd}`);
}

function stripHeavyFromOut() {
  const outDir = path.join(ROOT, "out");
  if (!fs.existsSync(outDir)) return { removed: 0 };

  // Only strip heavy audio directories and skip folders
  const killDirs = [
    path.join(outDir, "assets", "audio"),
    path.join(outDir, "assets", "_slim_skip_audio"),
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

  // Sözlük SSG: kavram index.html dosyalarını KORU (SEO & 404 önleme), yalnızca derin .txt / __next.* RSC yüklerini sil
  const sozluk = path.join(outDir, "sozluk");
  if (fs.existsSync(sozluk)) {
    let sozlukRemoved = 0;
    for (const f of walkFiles(sozluk)) {
      const rel = path.relative(sozluk, f).replace(/\\/g, "/");
      const parts = rel.split("/");
      if (parts.length > 2 && (f.endsWith(".txt") || parts.some((p) => p.startsWith("__next.")))) {
        try {
          fs.unlinkSync(f);
          sozlukRemoved++;
        } catch {
          /* ignore */
        }
      }
    }
    removed += sozlukRemoved;
    console.log(`🧹 out/sozluk derin txt yükleri silindi, statik SEO index.html korundu (${sozlukRemoved} dosya)`);
  }

  // Learn SSG: derin pathway/level txt yüklerini sil (hosting bundle optimizasyonu)
  const learn = path.join(outDir, "learn");
  if (fs.existsSync(learn)) {
    let learnRemoved = 0;
    for (const f of walkFiles(learn)) {
      const rel = path.relative(learn, f).replace(/\\/g, "/");
      const parts = rel.split("/");
      if (parts.length > 2 && (f.endsWith(".txt") || parts.some((p) => p.startsWith("__next.")))) {
        try {
          fs.unlinkSync(f);
          learnRemoved++;
        } catch {
          /* ignore */
        }
      }
    }
    removed += learnRemoved;
    console.log(`🧹 out/learn derin txt yükleri silindi (${learnRemoved} dosya)`);
  }

  // Audio leftovers anywhere under out (including out/data/**/Audio)
  for (const f of walkFiles(outDir)) {
    if (/\.(mp3|wav|ogg)$/i.test(f) || /[\/\\]Audio[\/\\]/i.test(f)) {
      try {
        fs.unlinkSync(f);
        removed++;
      } catch {
        /* ignore */
      }
    }
  }

  // Ensure JSON data and image assets are in out/
  copyAssetsToOut();
  copyDataJsonsToOut();

  return { removed };
}

function countOut() {
  const outDir = path.join(ROOT, "out");
  if (!fs.existsSync(outDir)) return 0;
  return walkFiles(outDir).length;
}

async function main() {
  console.log("=== deploy:app (slim Hosting) ===");
  if (!SKIP_SMOKE) {
    console.log("🔍 Faz 1–4 Pre-Deploy Regresyon ve Telemetri Testleri çalıştırılıyor...");
    run("node", ["scripts/smoke-schools-loop.mjs", "--pre-deploy"]);
  }
  let moved = [];
  try {
    if (!SKIP_BUILD) {
      moved = hideForSlimBuild();
      process.env.MEMOLANDUM_SLIM_APP = "1";
      process.env.NEXT_PUBLIC_DATA_BASE_URL =
        process.env.NEXT_PUBLIC_DATA_BASE_URL ||
        "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data";
      process.env.NEXT_PUBLIC_ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "";

      run("npm", ["run", "build"]);
    }
    const { removed } = stripHeavyFromOut();
    console.log(`📦 out dosya sayısı: ${countOut()} (temizlenen ~${removed})`);
  } finally {
    restoreAfterSlimBuild(moved);
    // Guarantee JSON data and image assets are in out/ after restore
    copyAssetsToOut();
    copyDataJsonsToOut();
  }

  if (BUILD_ONLY) {
    console.log("✅ --build-only: Hosting deploy atlandı");
    return;
  }

  process.env.FIREBASE_HOSTING_UPLOAD_CONCURRENCY =
    process.env.FIREBASE_HOSTING_UPLOAD_CONCURRENCY || "25";
  run("npx", ["-y", "firebase-tools@latest", "deploy", "--only", "hosting", "--non-interactive"]);
  console.log("✅ deploy:app tamam");
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
