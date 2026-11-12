/**
 * Almanca cümle JSON'larında yanlış de_biz_prof_* ses bağlarını düzeltir.
 * Diskte zaten doğru setler var:
 *   de_sent_*, de_biz_prof_*, de_dev_mind_*, de_soc_int_*, de_trv_exp_*
 *
 *   node scripts/fix-almanca-sentence-audio.mjs
 *   node scripts/fix-almanca-sentence-audio.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIO_DIR = path.join(ROOT, "public/data/Almanca/audio/de/sentences");
const FILES = [
  path.join(ROOT, "public/data/Almanca/content/de_tr/sentences_de_tr.json"),
  path.join(ROOT, "public/data/Almanca/content/de_en/sentences_de_en.json"),
];

const DRY = process.argv.includes("--dry-run");

function expectedAudioFile(id) {
  const raw = String(id || "").trim();
  if (!raw) return null;
  // de_sent_001 → de_sent_001.mp3
  if (/^de_sent_\d+$/i.test(raw)) return `${raw}.mp3`;
  // biz_prof_001 → de_biz_prof_001.mp3
  if (/^(biz_prof|dev_mind|soc_int|trv_exp)_\d+$/i.test(raw)) {
    return `de_${raw}.mp3`;
  }
  // fallback: already prefixed
  if (/^de_/i.test(raw)) return `${raw}.mp3`;
  return null;
}

function fixFile(jsonPath) {
  const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(rows)) throw new Error(`Not an array: ${jsonPath}`);

  let fixed = 0;
  let missing = 0;
  let alreadyOk = 0;

  for (const row of rows) {
    const fileName = expectedAudioFile(row.id);
    if (!fileName) {
      missing += 1;
      continue;
    }
    const abs = path.join(AUDIO_DIR, fileName);
    const url = `/data/Almanca/audio/de/sentences/${fileName}`;
    if (!fs.existsSync(abs)) {
      missing += 1;
      // yanlış biz_prof bağını bırakma — temizle
      if (row.audioUrl && /de_biz_prof_/i.test(row.audioUrl) && !/biz_prof_/i.test(row.id)) {
        row.audioUrl = "";
        fixed += 1;
      }
      continue;
    }
    if (row.audioUrl === url) {
      alreadyOk += 1;
      continue;
    }
    row.audioUrl = url;
    fixed += 1;
  }

  if (!DRY && fixed > 0) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  }

  return { file: path.relative(ROOT, jsonPath), fixed, alreadyOk, missing, total: rows.length };
}

const results = FILES.map(fixFile);
console.log(JSON.stringify({ dryRun: DRY, results }, null, 2));

// quick verify unique audio again
const sample = JSON.parse(fs.readFileSync(FILES[0], "utf8"));
const urls = new Set(sample.map((r) => r.audioUrl).filter(Boolean));
console.log("de_tr unique audioUrls after fix:", urls.size);
const dups = sample.filter((r) => r.id.startsWith("de_sent_") && /biz_prof/.test(r.audioUrl || ""));
console.log("de_sent still on biz_prof:", dups.length);
console.log("sample de_sent_001", sample.find((r) => r.id === "de_sent_001"));
console.log("sample biz_prof_001", sample.find((r) => r.id === "biz_prof_001"));
console.log("sample trv_exp_001", sample.find((r) => r.id === "trv_exp_001"));
