/**
 * YDS kelimeleri için Google Cloud Text-to-Speech MP3 üretici
 *
 * Gereksinim:
 *   - tts-generator/google-key.json  VEYA
 *   - GOOGLE_APPLICATION_CREDENTIALS  VEYA
 *   - --key=path/to/service-account.json
 *
 * Kullanım:
 *   node scripts/yds/generate-yds-tts.mjs
 *   node scripts/yds/generate-yds-tts.mjs --force
 *   node scripts/yds/generate-yds-tts.mjs --dry-run
 *   node scripts/yds/generate-yds-tts.mjs --limit=10
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(ROOT, "public/data/Tr_Eng_YDS_kelimeleri");
const AUDIO_DIR = path.join(PUBLIC_DIR, "audio_yds");
const DEFAULT_KEY = path.join(ROOT, "tts-generator/google-key.json");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const DRY = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const keyArg = args.find((a) => a.startsWith("--key="));
const KEY_PATH =
  (keyArg && keyArg.split("=")[1]) ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  (fs.existsSync(DEFAULT_KEY) ? DEFAULT_KEY : null);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function collectWords() {
  const words = [];
  const seen = new Set();
  const masterPath = path.join(PUBLIC_DIR, "YDS_Top500_master.json");
  if (fs.existsSync(masterPath)) {
    const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
    for (const w of master.words || []) {
      const key = String(w.word || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      words.push(w.word);
    }
    return words;
  }
  for (const file of fs.readdirSync(PUBLIC_DIR).filter((f) => /^YDS_Grup\d+_en_tr_v2\.json$/.test(f))) {
    const rows = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, file), "utf8"));
    for (const row of rows) {
      const key = String(row.word || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      words.push(row.word);
    }
  }
  return words;
}

function resolveClient() {
  if (!KEY_PATH || !fs.existsSync(KEY_PATH)) {
    throw new Error(
      "Google Cloud TTS anahtarı bulunamadı.\n" +
        "  1) tts-generator/google-key.json koyun, veya\n" +
        "  2) GOOGLE_APPLICATION_CREDENTIALS ayarlayın, veya\n" +
        "  3) --key=C:/path/service-account.json verin\n" +
        "Servis hesabında 'Cloud Text-to-Speech API User' rolü olmalı."
    );
  }

  // Prefer local tts-generator dependency
  let textToSpeech;
  try {
    textToSpeech = require(path.join(ROOT, "tts-generator/node_modules/@google-cloud/text-to-speech"));
  } catch {
    textToSpeech = require("@google-cloud/text-to-speech");
  }

  return new textToSpeech.TextToSpeechClient({ keyFilename: KEY_PATH });
}

async function synthesizeOne(client, word, outFile) {
  const request = {
    input: { text: word },
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-D",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.92,
      pitch: -1.0,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(outFile, response.audioContent, "binary");
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const words = collectWords();
  console.log(`YDS TTS — ${words.length} kelime`);

  const todo = [];
  for (const word of words) {
    const outFile = path.join(AUDIO_DIR, `${word.toLowerCase()}.mp3`);
    if (!FORCE && fs.existsSync(outFile) && fs.statSync(outFile).size > 500) continue;
    todo.push({ word, outFile });
  }

  console.log(`  üretilecek: ${todo.length} (force=${FORCE})`);
  if (DRY) {
    console.log("  [dry-run] örnek:", todo.slice(0, 15).map((t) => t.word).join(", "));
    return;
  }

  if (todo.length === 0) {
    console.log("  Tüm sesler mevcut — iş yok.");
    return;
  }

  const client = resolveClient();
  let ok = 0;
  let fail = 0;
  const capped = todo.slice(0, LIMIT);

  for (let i = 0; i < capped.length; i++) {
    const { word, outFile } = capped[i];
    try {
      await synthesizeOne(client, word, outFile);
      ok++;
      console.log(`  ✓ [${i + 1}/${capped.length}] ${word}`);
      await delay(120);
    } catch (err) {
      fail++;
      console.error(`  ✗ ${word}: ${err.message}`);
      // Quota / auth hard-fail
      if (/UNAUTHENTICATED|PERMISSION_DENIED|invalid_grant/i.test(err.message)) {
        console.error("Kimlik doğrulama hatası — durduruluyor.");
        break;
      }
      await delay(400);
    }
  }

  console.log(`Bitti. ok=${ok} fail=${fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
