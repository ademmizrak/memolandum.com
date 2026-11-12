/**
 * YDS Top-500 veritabanı üretici
 *
 * - Mevcut Grup JSON'larından benzersiz kelimeleri toplar
 * - Frekans seed listesine göre önceliklendirir
 * - Ses dosyası olanları tercih eder
 * - Tam 500 kelime → 5×100 frekans grubu (alfabetik dilim değil)
 * - public/ + functions/ altına yazar, eski Grup6/7'yi arşivler
 *
 * Kullanım: node scripts/yds/build-yds-top500.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { YDS_FREQUENCY_SEED } from "./yds-frequency-seed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(ROOT, "public/data/Tr_Eng_YDS_kelimeleri");
const FUNCTIONS_DIR = path.join(ROOT, "functions/data/Tr_Eng_YDS_kelimeleri");
const AUDIO_DIR = path.join(PUBLIC_DIR, "audio_yds");
const ARCHIVE_DIR = path.join(PUBLIC_DIR, "_archive_pre_top500");
const TARGET = 500;
const GROUP_SIZE = 100;

function slugWord(word) {
  return String(word || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function loadExistingUnique() {
  const byKey = new Map();
  const dirs = [PUBLIC_DIR, ARCHIVE_DIR].filter((d) => fs.existsSync(d));

  for (const dir of dirs) {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /^YDS_Grup\d+_en_tr_v2\.json$/.test(f) || f === "YDS_Top500_master.json")
      .sort();

    for (const file of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const rows = Array.isArray(raw) ? raw : raw.words || [];
      for (const row of rows) {
        const word = String(row.word || row.english || "").trim();
        if (!word) continue;
        const key = word.toLowerCase();
        if (byKey.has(key)) continue;
        const translation = String(
          row.translation || row.turkish || row.meaning || ""
        ).trim();
        if (!translation) continue;
        byKey.set(key, {
          word,
          translation,
          pos: row.pos || "",
          tags: Array.isArray(row.tags) ? row.tags : ["YDS"],
        });
      }
    }
  }
  return byKey;
}

function hasAudio(word) {
  if (!fs.existsSync(AUDIO_DIR)) return false;
  const base = word.toLowerCase();
  return (
    fs.existsSync(path.join(AUDIO_DIR, `${base}.mp3`)) ||
    fs.existsSync(path.join(AUDIO_DIR, `${slugWord(word)}.mp3`))
  );
}

function pickTop500(byKey) {
  const seedOrder = [];
  const seen = new Set();

  for (const raw of YDS_FREQUENCY_SEED) {
    const key = String(raw).toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    const hit = byKey.get(key);
    if (!hit) continue;
    seen.add(key);
    seedOrder.push({ ...hit, _prio: seedOrder.length, _audio: hasAudio(hit.word) });
  }

  // Seed'de olmayan mevcut kelimeler — önce sesli olanlar
  const rest = [...byKey.entries()]
    .filter(([k]) => !seen.has(k))
    .map(([, v]) => ({ ...v, _prio: 10_000, _audio: hasAudio(v.word) }))
    .sort((a, b) => {
      if (a._audio !== b._audio) return a._audio ? -1 : 1;
      return a.word.localeCompare(b.word);
    });

  const candidates = [...seedOrder, ...rest];
  if (candidates.length < TARGET) {
    throw new Error(
      `Yetersiz kelime: ${candidates.length} < ${TARGET}. Mevcut arşivi genişletin.`
    );
  }

  // Frekans sırasını koru; sesi olmayanları mümkünse sona bırak
  const selected = [];
  const deferred = [];
  for (const c of candidates) {
    if (c._audio) {
      if (selected.length < TARGET) selected.push(c);
    } else {
      deferred.push(c);
    }
  }
  for (const c of deferred) {
    if (selected.length >= TARGET) break;
    selected.push(c);
  }

  return selected.slice(0, TARGET);
}

function toPublicRow(item, id) {
  const file = `${item.word.toLowerCase()}.mp3`;
  return {
    id,
    word: item.word,
    translation: item.translation,
    pos: item.pos || "unknown",
    tags: ["YDS", "top500"],
    audioUrl: `/data/Tr_Eng_YDS_kelimeleri/audio_yds/${file}`,
    rank: id,
  };
}

function writeGroups(selected) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  // Eski grupları arşivle
  for (const file of fs.readdirSync(PUBLIC_DIR)) {
    if (!/^YDS_Grup\d+_en_tr_v2\.json$/.test(file)) continue;
    const src = path.join(PUBLIC_DIR, file);
    fs.copyFileSync(src, path.join(ARCHIVE_DIR, file));
  }

  // Frekans sırasını koru ama harf dilimlerini kırmak için stripe et:
  // Grup1 ← rank 1,6,11…  Grup2 ← 2,7,12… (her sette yüksek frekans da olur)
  const buckets = Array.from({ length: TARGET / GROUP_SIZE }, () => []);
  selected.forEach((item, idx) => {
    buckets[idx % buckets.length].push({ ...item, _rank: idx + 1 });
  });

  const groups = [];
  for (let g = 0; g < buckets.length; g++) {
    const chunk = buckets[g];
    const rows = chunk.map((item, i) => {
      const row = toPublicRow(item, g * GROUP_SIZE + i + 1);
      row.rank = item._rank;
      return row;
    });
    const name = `YDS_Grup${g + 1}_en_tr_v2.json`;
    const outPath = path.join(PUBLIC_DIR, name);
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + "\n", "utf8");
    groups.push({ name, count: rows.length, first: rows[0].word, last: rows.at(-1).word });

    if (fs.existsSync(FUNCTIONS_DIR)) {
      fs.writeFileSync(
        path.join(FUNCTIONS_DIR, name),
        JSON.stringify(rows, null, 2) + "\n",
        "utf8"
      );
    }
  }

  // Master liste (orijinal frekans sırası)
  const master = selected.map((item, i) => toPublicRow(item, i + 1));
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "YDS_Top500_master.json"),
    JSON.stringify(
      {
        title: "Türkiye YDS / YÖKDİL sık kullanılan 500 kelime",
        version: 3,
        count: master.length,
        generatedAt: new Date().toISOString(),
        grouping: "frequency-striped-5x100",
        words: master,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  return groups;
}

function updateManifest() {
  const manifestPath = path.join(ROOT, "src/config/manifest.js");
  let src = fs.readFileSync(manifestPath, "utf8");

  const levelsBlock = `          "levels": [
            {
              "id": "en-tr_eng_yds_kelimeleri-0",
              "name": "YDS Set 1 (Top 500)",
              "path": "Tr_Eng_YDS_kelimeleri/YDS_Grup1_en_tr_v2.json",
              "slug": "ingilizce-yds-kelimeleri-1-100"
            },
            {
              "id": "en-tr_eng_yds_kelimeleri-1",
              "name": "YDS Set 2 (Top 500)",
              "path": "Tr_Eng_YDS_kelimeleri/YDS_Grup2_en_tr_v2.json",
              "slug": "ingilizce-yds-kelimeleri-101-200"
            },
            {
              "id": "en-tr_eng_yds_kelimeleri-2",
              "name": "YDS Set 3 (Top 500)",
              "path": "Tr_Eng_YDS_kelimeleri/YDS_Grup3_en_tr_v2.json",
              "slug": "ingilizce-yds-kelimeleri-201-300"
            },
            {
              "id": "en-tr_eng_yds_kelimeleri-3",
              "name": "YDS Set 4 (Top 500)",
              "path": "Tr_Eng_YDS_kelimeleri/YDS_Grup4_en_tr_v2.json",
              "slug": "ingilizce-yds-kelimeleri-301-400"
            },
            {
              "id": "en-tr_eng_yds_kelimeleri-4",
              "name": "YDS Set 5 (Top 500)",
              "path": "Tr_Eng_YDS_kelimeleri/YDS_Grup5_en_tr_v2.json",
              "slug": "ingilizce-yds-kelimeleri-401-500"
            }
          ],`;

  const re =
    /("id":\s*"en-tr_eng_yds_kelimeleri"[\s\S]*?"folder":\s*"Tr_Eng_YDS_kelimeleri",\s*)"levels":\s*\[[\s\S]*?\],/;

  if (!re.test(src)) {
    console.warn("⚠ manifest YDS levels bloğu bulunamadı — elle güncelleyin.");
    return false;
  }
  src = src.replace(re, `$1${levelsBlock}`);
  fs.writeFileSync(manifestPath, src, "utf8");
  return true;
}

function letterStats(selected) {
  const letters = {};
  for (const w of selected) {
    const L = (w.word[0] || "?").toUpperCase();
    letters[L] = (letters[L] || 0) + 1;
  }
  return Object.entries(letters)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
}

function main() {
  console.log("Building YDS Top-500…");
  const byKey = loadExistingUnique();
  console.log(`  unique in archive: ${byKey.size}`);

  const selected = pickTop500(byKey);
  const audioCount = selected.filter((w) => hasAudio(w.word)).length;
  console.log(`  selected: ${selected.length} (with audio: ${audioCount})`);
  console.log(`  letters: ${letterStats(selected)}`);

  const groups = writeGroups(selected);
  for (const g of groups) {
    console.log(`  ✓ ${g.name} n=${g.count} [${g.first} … ${g.last}]`);
  }

  // Eski Grup6/7 public'te kalsın ama kullanılmasın — silmeyelim, arşiv yeterli
  // Manifest'ten çıkar
  const ok = updateManifest();
  console.log(ok ? "  ✓ manifest updated (5 frequency tiers)" : "  ✗ manifest skipped");

  const missingAudio = selected.filter((w) => !hasAudio(w.word)).map((w) => w.word);
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "_yds_missing_audio.json"),
    JSON.stringify({ count: missingAudio.length, words: missingAudio }, null, 2) + "\n"
  );
  console.log(`  missing audio: ${missingAudio.length} → _yds_missing_audio.json`);
  console.log("Done.");
}

main();
