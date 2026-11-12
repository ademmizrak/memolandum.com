/**
 * Selective deploy for İlkokul Word Card changes.
 * - GCS: only Tr_Eng_Ilkokul JSON (+ optional audio)
 * - Hosting: next build without copying tens of thousands of audio files
 *
 * Usage:
 *   node scripts/deploy-ilkokul-selective.mjs
 *   node scripts/deploy-ilkokul-selective.mjs --skip-gcs
 *   node scripts/deploy-ilkokul-selective.mjs --skip-hosting
 *   node scripts/deploy-ilkokul-selective.mjs --with-audio
 */
import { Storage } from "@google-cloud/storage";
import { OAuth2Client } from "google-auth-library";
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const ILKOKUL_DIR = path.join(DATA_DIR, "Tr_Eng_Ilkokul");
const BUCKET_NAME = "memolandum-33dc4.firebasestorage.app";
const SERVICE_ACCOUNT_FILE = path.join(ROOT, "functions", "serviceAccountKey.json");
const FIREBASE_CLI_CONFIG = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
const SKIP_MARKER = "_deploy_skip_audio";

const args = new Set(process.argv.slice(2));
const SKIP_GCS = args.has("--skip-gcs");
const SKIP_HOSTING = args.has("--skip-hosting");
const WITH_AUDIO = args.has("--with-audio");

const JSON_FILES = [
  "Ilkokul_1_Sinif_Kelimeleri.json",
  "Ilkokul_2_Sinif_Kelimeleri.json",
  "Ilkokul_2_Sinif_Cumleleri.json",
  "Ilkokul_3_Sinif_Kelimeleri.json",
  "Ilkokul_3_Sinif_Cumleleri.json",
  "Ilkokul_4_Sinif_Kelimeleri.json",
  "Ilkokul_4_Sinif_Cumleleri.json",
];

function walkDirs(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(p);
      walkDirs(p, out);
    }
  }
  return out;
}

function isAudioDirName(name) {
  const n = name.toLowerCase();
  return n === "audio" || n === "audio_phrases" || n === "audio_vocabulary";
}

function hideAudioDirs() {
  const dirs = walkDirs(DATA_DIR);
  const renamed = [];
  // deepest first so parent renames don't break children paths we already queued
  dirs.sort((a, b) => b.length - a.length);
  for (const dir of dirs) {
    const base = path.basename(dir);
    if (!isAudioDirName(base)) continue;
    const target = path.join(path.dirname(dir), `${base}${SKIP_MARKER}`);
    if (fs.existsSync(target)) continue;
    fs.renameSync(dir, target);
    renamed.push([dir, target]);
  }
  return renamed;
}

function restoreAudioDirs(renamed) {
  // restore parents before children: shorter path first
  renamed.sort((a, b) => a[0].length - b[0].length);
  for (const [original, skipped] of renamed) {
    if (fs.existsSync(skipped) && !fs.existsSync(original)) {
      fs.renameSync(skipped, original);
    }
  }
}

async function initStorage() {
  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    try {
      const storage = new Storage({
        projectId: "memolandum-33dc4",
        keyFilename: SERVICE_ACCOUNT_FILE,
      });
      await storage.bucket(BUCKET_NAME).getMetadata();
      console.log("✅ GCS auth: service account");
      return storage;
    } catch (e) {
      console.warn("⚠️ service account failed:", e.message);
    }
  }

  if (fs.existsSync(FIREBASE_CLI_CONFIG)) {
    const config = JSON.parse(fs.readFileSync(FIREBASE_CLI_CONFIG, "utf8"));
    if (config.tokens?.access_token) {
      const authClient = new OAuth2Client();
      authClient.setCredentials({ access_token: config.tokens.access_token });
      const storage = new Storage({ projectId: "memolandum-33dc4", authClient });
      await storage.bucket(BUCKET_NAME).getMetadata();
      console.log("✅ GCS auth: Firebase CLI token");
      return storage;
    }
  }

  throw new Error('GCS auth yok. Önce: npx -y firebase-tools@latest login');
}

function collectIlkokulUploads() {
  const files = [];
  for (const name of JSON_FILES) {
    const p = path.join(ILKOKUL_DIR, name);
    if (!fs.existsSync(p)) throw new Error(`Eksik JSON: ${p}`);
    files.push(p);
  }
  if (WITH_AUDIO) {
    const audioRoot = path.join(ILKOKUL_DIR, "Audio");
    if (fs.existsSync(audioRoot)) {
      const stack = [audioRoot];
      while (stack.length) {
        const d = stack.pop();
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, ent.name);
          if (ent.isDirectory()) stack.push(p);
          else if (/\.(mp3|wav|ogg)$/i.test(ent.name)) files.push(p);
        }
      }
    }
  }
  return files;
}

async function uploadGcs() {
  const storage = await initStorage();
  const bucket = storage.bucket(BUCKET_NAME);
  const files = collectIlkokulUploads();
  console.log(`📤 GCS'e ${files.length} dosya yüklenecek (sadece İlkokul)...`);

  let ok = 0;
  const CONCURRENCY = 15;
  let idx = 0;
  async function worker() {
    while (idx < files.length) {
      const i = idx++;
      const localFilePath = files[i];
      const relativePath = path.relative(DATA_DIR, localFilePath).replace(/\\/g, "/");
      const destination = `data/${relativePath}`;
      const ext = path.extname(localFilePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".json") contentType = "application/json; charset=utf-8";
      else if (ext === ".mp3") contentType = "audio/mpeg";
      else if (ext === ".wav") contentType = "audio/wav";

      try {
        const [file] = await bucket.upload(localFilePath, {
          destination,
          metadata: {
            contentType,
            cacheControl: ext === ".json" ? "public, max-age=60" : "public, max-age=31536000",
          },
        });
        await file.makePublic().catch(() => {});
        ok += 1;
        if (ok % 25 === 0 || ok === files.length) {
          console.log(`  [${ok}/${files.length}] Uploaded: ${destination}`);
        }
      } catch (err) {
        console.warn(`  ❌ Upload failed for ${destination}:`, err.message);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`✅ GCS upload tamam: ${ok} dosya`);
}

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  const res = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: process.env,
    ...opts,
  });
  if (res.status !== 0) {
    throw new Error(`Komut başarısız (${res.status}): ${cmd}`);
  }
}

async function deployHosting() {
  let renamed = [];
  try {
    console.log("🔇 Build öncesi Audio klasörleri geçici gizleniyor (30k+ ses atlanır)...");
    renamed = hideAudioDirs();
    console.log(`   Gizlenen Audio klasörü: ${renamed.length}`);

    run("npm", ["run", "build"]);

    // Ensure ilkokul JSON + word images are in out/
    const outIlkokul = path.join(ROOT, "out", "data", "Tr_Eng_Ilkokul");
    fs.mkdirSync(outIlkokul, { recursive: true });
    for (const name of JSON_FILES) {
      fs.copyFileSync(path.join(ILKOKUL_DIR, name), path.join(outIlkokul, name));
    }

    const wordsSrc = path.join(ROOT, "public", "assets", "words");
    const wordsDst = path.join(ROOT, "out", "assets", "words");
    if (fs.existsSync(wordsSrc)) {
      fs.mkdirSync(wordsDst, { recursive: true });
      for (const name of fs.readdirSync(wordsSrc)) {
        if (!/\.png$/i.test(name)) continue;
        fs.copyFileSync(path.join(wordsSrc, name), path.join(wordsDst, name));
      }
      console.log(`🖼️  Word PNG kopyalandı → out/assets/words`);
    }

    run("npx", ["-y", "firebase-tools@latest", "deploy", "--only", "hosting", "--non-interactive"]);
    console.log("✅ Hosting deploy tamam");
  } finally {
    console.log("🔊 Audio klasörleri geri alınıyor...");
    restoreAudioDirs(renamed);
  }
}

async function main() {
  console.log("=== Selective İlkokul deploy ===");
  console.log(`GCS: ${SKIP_GCS ? "skip" : "yes"} | Hosting: ${SKIP_HOSTING ? "skip" : "yes"} | Audio: ${WITH_AUDIO ? "yes" : "no"}`);

  if (!SKIP_GCS) await uploadGcs();
  if (!SKIP_HOSTING) await deployHosting();

  console.log("\n🎉 Selective deploy bitti.");
  console.log("Site: https://memolandum.com (veya Firebase Hosting URL)");
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exit(1);
});
