/**
 * Lokal müfredat JSON'larındaki dil-çapraz audioUrl hatalarını düzeltir,
 * ardından düzeltilmiş JSON'ları Firebase Storage'a (GCS) yükler.
 *
 * Kullanım:
 *   node scripts/repair-and-sync-data.mjs              # fix + upload
 *   node scripts/repair-and-sync-data.mjs --dry-run    # sadece rapor
 *   node scripts/repair-and-sync-data.mjs --fix-only  # sadece lokal düzelt
 *   node scripts/repair-and-sync-data.mjs --upload-only
 */
import { Storage } from "@google-cloud/storage";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../public/data");
const BUCKET_NAME = "memolandum-33dc4.firebasestorage.app";
const SERVICE_ACCOUNT_FILE = path.resolve(
  __dirname,
  "../functions/serviceAccountKey.json"
);
const FIREBASE_CLI_CONFIG = path.join(
  os.homedir(),
  ".config",
  "configstore",
  "firebase-tools.json"
);

const LANG_ROOTS = [
  "Almanca",
  "Arabic",
  "Chinesee",
  "French",
  "Greek",
  "Italy",
  "Japan",
  "Korean",
  "Osm_Tr",
  "Portugal",
  "Russian",
  "Spanish",
  "Turkish",
  "Tr_Eng_Temel_Cumleler",
  "Tr_Eng_YDS_kelimeleri",
  "Tr_Eng_YKS_Kelimeleri",
  "Tr_Eng_Sinav_Ozel",
  "Tr_Eng_Yaz_Cumleleri",
];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FIX_ONLY = args.has("--fix-only");
const UPLOAD_ONLY = args.has("--upload-only");

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name.startsWith(".") ||
        entry.name.startsWith("_archive") ||
        entry.name === "node_modules"
      ) {
        continue;
      }
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function normalizeKey(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function ownerFromRelative(rel) {
  const first = rel.split(/[\\/]/)[0];
  if (first.endsWith(".json")) return "__root__";
  return first;
}

function urlLangRoot(url) {
  const m = String(url || "").match(/\/data\/([^/]+)\//i);
  return m ? m[1] : null;
}

function isCompatibleOwner(owner, urlLang) {
  if (!urlLang) return true;
  if (!owner || owner === "__root__") return false;
  if (owner.toLowerCase() === urlLang.toLowerCase()) return true;
  if (owner === "Turkish" && /^Tr_Eng/i.test(urlLang)) return true;
  if (/^Tr_Eng/i.test(owner) && (urlLang === "Turkish" || /^Tr_Eng/i.test(urlLang))) {
    return true;
  }
  return false;
}

function isCrossLangUrl(owner, url) {
  const ul = urlLangRoot(url);
  if (!ul) return false;
  return !isCompatibleOwner(owner, ul);
}

function extractItems(data) {
  if (Array.isArray(data)) {
    return { items: data, kind: "root" };
  }
  for (const key of ["words", "sentences", "items", "phrase_vault", "vocabulary_vault"]) {
    if (Array.isArray(data?.[key])) {
      return { items: data[key], kind: key };
    }
  }
  return null;
}

function candidateText(item) {
  return (
    item.word ||
    item.english ||
    item.original_script ||
    item.en ||
    item.romanized_script ||
    item.hanzi ||
    item.id ||
    ""
  );
}

function nestedAudioPath(item) {
  if (!item?.audio) return "";
  if (typeof item.audio === "string") return item.audio;
  return item.audio.default || item.audio.male || item.audio.female || "";
}

function toDataUrl(owner, audioPath) {
  if (!audioPath) return "";
  let p = String(audioPath).replace(/\\/g, "/");
  if (p.startsWith("/data/")) return p;
  if (p.startsWith("data/")) return `/${p}`;
  if (p.startsWith("/audio/")) return `/data/${owner}${p}`;
  if (p.startsWith("audio/")) return `/data/${owner}/${p}`;
  if (p.startsWith("/")) return `/data/${owner}${p}`;
  return `/data/${owner}/${p}`;
}

function localExistsFromDataUrl(dataUrl) {
  const rel = String(dataUrl || "")
    .replace(/^\/data\//i, "")
    .replace(/^data\//i, "");
  if (!rel) return false;
  return fs.existsSync(path.join(DATA_DIR, rel));
}

function buildLangMp3Index(allMp3) {
  /** @type {Map<string, Map<string, string[]>>} */
  const byLang = new Map();
  for (const mp3 of allMp3) {
    const rel = path.relative(DATA_DIR, mp3).replace(/\\/g, "/");
    const owner = rel.split("/")[0];
    if (!LANG_ROOTS.includes(owner)) continue;
    const base = path.basename(mp3, ".mp3");
    const norm = normalizeKey(base);
    if (!byLang.has(owner)) byLang.set(owner, new Map());
    const map = byLang.get(owner);
    if (!map.has(norm)) map.set(norm, []);
    map.get(norm).push(`/data/${rel}`);
  }
  return byLang;
}

function findScopedAudio(owner, item, langIndex) {
  const map = langIndex.get(owner);
  if (!map) return "";

  const idKey = normalizeKey(item.id);
  if (idKey && map.has(idKey)) return map.get(idKey)[0];

  // id suffix match: eng_a1_001_the → try containing id
  if (item.id) {
    const idNorm = normalizeKey(item.id);
    for (const [key, urls] of map.entries()) {
      if (key.includes(idNorm) || idNorm.includes(key)) {
        if (idNorm.length >= 4 && key.length >= 4) return urls[0];
      }
    }
  }

  const textKey = normalizeKey(candidateText(item));
  if (textKey.length >= 3 && map.has(textKey)) return map.get(textKey)[0];

  // sentence_101_what_happened style
  if (item.id != null && item.en) {
    const slug = normalizeKey(`sentence_${item.id}_${item.en}`);
    if (map.has(slug)) return map.get(slug)[0];
  }

  return "";
}

function clearCrossLangNestedAudio(item, owner) {
  if (!item.audio || typeof item.audio !== "object") return false;
  let changed = false;
  for (const key of ["default", "male", "female"]) {
    const val = item.audio[key];
    if (val && isCrossLangUrl(owner, val)) {
      item.audio[key] = null;
      changed = true;
    }
  }
  return changed;
}

function fixItem(item, owner, langIndex) {
  let changed = false;
  const nested = nestedAudioPath(item);
  const currentUrl = item.audioUrl || "";
  const currentOk =
    currentUrl &&
    !isCrossLangUrl(owner, currentUrl) &&
    (!currentUrl.startsWith("/data/") || localExistsFromDataUrl(currentUrl));

  // Nested /audio/... → aynı dil /data/{owner}/... (yalnızca mevcut URL kötü/eksikse)
  if (!currentOk && nested && !isCrossLangUrl(owner, nested)) {
    const remapped = toDataUrl(owner, nested);
    if (remapped && localExistsFromDataUrl(remapped)) {
      if (item.audioUrl !== remapped) {
        item.audioUrl = remapped;
        changed = true;
      }
      changed = clearCrossLangNestedAudio(item, owner) || changed;
      return changed;
    }
  }

  if (currentOk) {
    changed = clearCrossLangNestedAudio(item, owner) || changed;
    return changed;
  }

  const found = findScopedAudio(owner, item, langIndex);
  if (found) {
    if (item.audioUrl !== found) {
      item.audioUrl = found;
      changed = true;
    }
  } else if (currentUrl && isCrossLangUrl(owner, currentUrl)) {
    item.audioUrl = "";
    changed = true;
  } else if (
    currentUrl &&
    currentUrl.startsWith("/data/") &&
    !localExistsFromDataUrl(currentUrl)
  ) {
    item.audioUrl = "";
    changed = true;
  }

  changed = clearCrossLangNestedAudio(item, owner) || changed;
  return changed;
}

function fixJsonFile(jsonPath, langIndex, stats) {
  const rel = path.relative(DATA_DIR, jsonPath).replace(/\\/g, "/");
  if (rel.includes("_archive")) return false;

  let raw;
  try {
    raw = fs.readFileSync(jsonPath, "utf8");
  } catch {
    return false;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    stats.invalidJson += 1;
    return false;
  }

  const extracted = extractItems(data);
  if (!extracted) return false;

  const owner = ownerFromRelative(rel);
  // Root fillers.json — never keep cross-lang absolute URLs
  const effectiveOwner = owner === "__root__" ? "__root__" : owner;

  let fileChanged = 0;
  for (const item of extracted.items) {
    stats.items += 1;
    const before = item.audioUrl || "";
    const wasCross = before && isCrossLangUrl(effectiveOwner === "__root__" ? "Spanish" : effectiveOwner, before)
      ? true
      : effectiveOwner === "__root__" && !!urlLangRoot(before);

    let changed = false;
    if (effectiveOwner === "__root__") {
      // fillers: strip any /data/{OtherLang}/ links
      if (item.audioUrl && urlLangRoot(item.audioUrl)) {
        item.audioUrl = "";
        changed = true;
      }
      if (item.audio && typeof item.audio === "object") {
        for (const key of ["default", "male", "female"]) {
          if (item.audio[key] && urlLangRoot(item.audio[key])) {
            item.audio[key] = null;
            changed = true;
          }
        }
      }
    } else {
      changed = fixItem(item, effectiveOwner, langIndex);
    }

    if (changed) {
      fileChanged += 1;
      stats.fixedItems += 1;
      if (wasCross) stats.clearedCross += 1;
    }
  }

  if (fileChanged > 0) {
    stats.fixedFiles += 1;
    if (!DRY_RUN) {
      const out =
        extracted.kind === "root"
          ? extracted.items
          : { ...data, [extracted.kind]: extracted.items };
      fs.writeFileSync(jsonPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    }
    return true;
  }
  return false;
}

async function initializeStorage() {
  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    try {
      console.log("🔑 serviceAccountKey.json ile auth...");
      const storage = new Storage({
        projectId: "memolandum-33dc4",
        keyFilename: SERVICE_ACCOUNT_FILE,
      });
      await storage.bucket(BUCKET_NAME).getMetadata();
      return storage;
    } catch (e) {
      console.warn("⚠️ Service account başarısız:", e.message);
    }
  }

  if (fs.existsSync(FIREBASE_CLI_CONFIG)) {
    console.log("🔄 Firebase CLI oturumu ile auth...");
    const config = JSON.parse(fs.readFileSync(FIREBASE_CLI_CONFIG, "utf8"));
    if (config.tokens?.access_token) {
      const authClient = new OAuth2Client();
      authClient.setCredentials({
        access_token: config.tokens.access_token,
        refresh_token: config.tokens.refresh_token,
      });
      const storage = new Storage({
        projectId: "memolandum-33dc4",
        authClient,
      });
      await storage.bucket(BUCKET_NAME).getMetadata();
      return storage;
    }
  }

  throw new Error(
    'Kimlik doğrulama yok. `npx firebase login` çalıştırıp tekrar deneyin.'
  );
}

async function uploadJsonFiles(changedRels) {
  const storage = await initializeStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  const allJson = walkFiles(DATA_DIR).filter(
    (f) =>
      f.endsWith(".json") &&
      !f.includes("manifest.json") &&
      !f.includes("audioMap.json") &&
      !f.includes(`${path.sep}_archive`)
  );

  // Prefer uploading changed files; if none tracked, upload all (upload-only)
  const targets =
    changedRels && changedRels.size > 0
      ? allJson.filter((f) =>
          changedRels.has(path.relative(DATA_DIR, f).replace(/\\/g, "/"))
        )
      : allJson;

  console.log(`📤 GCS'e yüklenecek JSON: ${targets.length}`);
  let uploaded = 0;
  for (const localFilePath of targets) {
    const relativePath = path.relative(DATA_DIR, localFilePath).replace(/\\/g, "/");
    const gcsDestination = `data/${relativePath}`;
    process.stdout.write(`  → ${relativePath}\r`);
    const [file] = await bucket.upload(localFilePath, {
      destination: gcsDestination,
      metadata: {
        contentType: "application/json; charset=utf-8",
        cacheControl: "public, max-age=300",
      },
    });
    try {
      await file.makePublic();
    } catch {
      /* bucket may already be public via IAM */
    }
    uploaded += 1;
  }
  console.log(`\n✅ Storage upload tamam: ${uploaded} dosya`);
  return uploaded;
}

async function main() {
  console.log("══════════════════════════════════════════════");
  console.log(" Memolandum data repair + Firebase Storage sync");
  console.log(` mode: ${DRY_RUN ? "DRY-RUN" : FIX_ONLY ? "FIX-ONLY" : UPLOAD_ONLY ? "UPLOAD-ONLY" : "FIX+UPLOAD"}`);
  console.log("══════════════════════════════════════════════");

  const allFiles = walkFiles(DATA_DIR);
  const jsonFiles = allFiles.filter(
    (f) =>
      f.endsWith(".json") &&
      !f.includes("manifest.json") &&
      !f.includes("audioMap.json")
  );
  const mp3Files = allFiles.filter((f) => f.endsWith(".mp3"));
  const langIndex = buildLangMp3Index(mp3Files);

  console.log(`JSON: ${jsonFiles.length} | MP3: ${mp3Files.length}`);

  const stats = {
    items: 0,
    fixedItems: 0,
    fixedFiles: 0,
    clearedCross: 0,
    invalidJson: 0,
  };
  const changedRels = new Set();

  if (!UPLOAD_ONLY) {
    for (const jsonPath of jsonFiles) {
      const rel = path.relative(DATA_DIR, jsonPath).replace(/\\/g, "/");
      const changed = fixJsonFile(jsonPath, langIndex, stats);
      if (changed) changedRels.add(rel);
    }
    console.log("\n── Fix özeti ──");
    console.log(
      JSON.stringify(
        {
          itemsScanned: stats.items,
          itemsFixed: stats.fixedItems,
          filesUpdated: stats.fixedFiles,
          crossLangClearedApprox: stats.clearedCross,
          invalidJson: stats.invalidJson,
          dryRun: DRY_RUN,
        },
        null,
        2
      )
    );
    if (changedRels.size) {
      console.log("Güncellenen dosyalar (örnek):");
      [...changedRels].slice(0, 25).forEach((r) => console.log("  •", r));
      if (changedRels.size > 25) console.log(`  … +${changedRels.size - 25} daha`);
    }
  }

  if (DRY_RUN || FIX_ONLY) {
    console.log("\n(Upload atlandı)");
    return;
  }

  // Upload changed files; if upload-only or nothing changed, upload all JSON
  const uploadSet =
    UPLOAD_ONLY || changedRels.size === 0 ? null : changedRels;
  if (UPLOAD_ONLY) {
    await uploadJsonFiles(null);
  } else if (changedRels.size === 0) {
    console.log("\nDeğişen dosya yok — Storage upload atlandı.");
  } else {
    await uploadJsonFiles(uploadSet);
  }

  console.log("\nSonraki adım: Hosting için `npm run build` + `firebase deploy --only hosting`");
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exit(1);
});
