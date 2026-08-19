/**
 * deploy:content — GCS checksum / delta sync (Hosting'e dokunmaz)
 *
 * Syncs:
 *   public/data/**          → gs://bucket/data/
 *   public/assets/words/**  → gs://bucket/assets/words/
 *   public/assets/audio/**  → gs://bucket/assets/audio/
 *
 * Usage:
 *   node scripts/deploy-content.mjs
 *   node scripts/deploy-content.mjs --dry-run
 *   node scripts/deploy-content.mjs --only=data
 *   node scripts/deploy-content.mjs --only=Tr_Eng_Ilkokul
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  DATA_DIR,
  WORDS_DIR,
  SENTENCES_DIR,
  ASSETS_AUDIO_DIR,
  BUCKET_NAME,
  initStorage,
  walkFiles,
  fileMd5,
  contentTypeFor,
} from "./lib/deployShared.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.slice("--only=".length) : null;
const CONCURRENCY = 6;

function buildGlossaryIndex() {
  let base = path.join(DATA_DIR, "academic");
  if (!fs.existsSync(base)) {
    base = path.join(ROOT, "public", "_slim_skip_data", "academic");
  }
  if (!fs.existsSync(base)) {
    console.warn("⚠️ academic data yok — glossary-index atlandı");
    return null;
  }

  const subDirs = ["kpss_sinav", "technic"];
  const concepts = [];
  for (const sub of subDirs) {
    const dir = path.join(base, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      if (file === "glossary-index.json") continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        if (!Array.isArray(data)) continue;
        for (const c of data) {
          if (!c?.slug || !c?.category) continue;
          concepts.push({
            id: c.id,
            title: c.title,
            slug: c.slug,
            category: c.category,
            categoryName: c.categoryName,
            description: c.description,
            content: c.content,
            tags: c.tags,
            level: c.level,
            word_alt: c.word_alt,
          });
        }
      } catch (e) {
        console.warn("glossary parse", file, e.message);
      }
    }
  }

  const outPath = path.join(base, "glossary-index.json");
  fs.writeFileSync(outPath, JSON.stringify(concepts));
  console.log(`📚 glossary-index.json: ${concepts.length} kavram → ${outPath}`);
  return outPath;
}

function matchesOnly(dest, local) {
  if (!ONLY) return true;
  const hay = `${dest} ${local}`.replace(/\\/g, "/").toLowerCase();
  const needle = ONLY.toLowerCase();

  // Tree aliases — substring "sentences" Arabic audio yollarını da yakalamasın
  if (needle === "sentences" || needle === "assets/sentences") {
    return hay.includes("assets/sentences/");
  }
  if (needle === "words" || needle === "assets/words") {
    return hay.includes("assets/words/");
  }
  if (needle === "audio" || needle === "assets/audio") {
    return hay.includes("assets/audio/");
  }
  if (needle === "data") {
    return hay.startsWith("data/") || hay.includes("/public/data/");
  }
  if (needle === "youtube_videos.json") {
    return dest === "data/youtube_videos.json";
  }

  return hay.includes(needle);
}

function collectLocalObjects() {
  /** @type {{ local: string, dest: string }[]} */
  const items = [];
  const needle = ONLY ? ONLY.toLowerCase() : null;

  const addTree = (localRoot, gcsPrefix, filterFn, treeKind) => {
    if (!fs.existsSync(localRoot)) return;
    if (needle === "sentences" || needle === "assets/sentences") {
      if (treeKind !== "sentences") return;
    } else if (needle === "words" || needle === "assets/words") {
      if (treeKind !== "words") return;
    } else if (needle === "audio" || needle === "assets/audio") {
      if (treeKind !== "audio") return;
    } else if (needle === "data") {
      if (treeKind !== "data") return;
    } else if (needle === "youtube_videos.json") {
      if (treeKind !== "data") return;
    }

    for (const local of walkFiles(localRoot)) {
      if (filterFn && !filterFn(local)) continue;
      const rel = path.relative(localRoot, local).replace(/\\/g, "/");
      const dest = `${gcsPrefix}/${rel}`.replace(/\/+/g, "/");
      if (!matchesOnly(dest, local)) continue;
      items.push({ local, dest });
    }
  };

  addTree(DATA_DIR, "data", () => true, "data");
  addTree(WORDS_DIR, "assets/words", (f) => /\.png$/i.test(f), "words");
  addTree(SENTENCES_DIR, "assets/sentences", (f) => /\.png$/i.test(f), "sentences");
  addTree(ASSETS_AUDIO_DIR, "assets/audio", (f) => /\.(mp3|wav|ogg)$/i.test(f), "audio");

  return items;
}

async function md5Matches(bucket, dest, localPath) {
  try {
    const file = bucket.file(dest);
    const [exists] = await file.exists();
    if (!exists) return false;
    const [meta] = await file.getMetadata();
    const remote = meta.md5Hash;
    if (!remote) return false;
    return remote === fileMd5(localPath);
  } catch {
    return false;
  }
}

async function run() {
  console.log("=== deploy:content (GCS delta) ===");
  if (DRY) console.log("DRY RUN — upload yok");

  if (!ONLY || ONLY.toLowerCase().includes("academic") || ONLY.toLowerCase() === "data") {
    buildGlossaryIndex();
  } else {
    console.log("📚 glossary-index atlandı (scoped --only)");
  }

  const storage = await initStorage();
  const bucket = storage.bucket(BUCKET_NAME);
  const items = collectLocalObjects();
  console.log(`📂 Yerel aday: ${items.length}`);

  const toUpload = [];
  let checked = 0;
  for (const item of items) {
    checked++;
    if (checked % 500 === 0) console.log(`  checksum… ${checked}/${items.length}`);
    const same = await md5Matches(bucket, item.dest, item.local);
    if (!same) toUpload.push(item);
  }

  console.log(`📤 Yüklenecek (delta): ${toUpload.length} / ${items.length}`);
  if (DRY || toUpload.length === 0) {
    console.log(DRY ? "✅ Dry-run bitti" : "🎉 Delta yok — senkron");
    return;
  }

  let done = 0;
  let next = 0;
  async function worker() {
    while (next < toUpload.length) {
      const i = next++;
      const { local, dest } = toUpload[i];
      const ext = path.extname(local).toLowerCase();
      const cacheControl =
        ext === ".json" ? "public, max-age=60" : "public, max-age=31536000, immutable";
      try {
        const [file] = await bucket.upload(local, {
          destination: dest,
          metadata: { contentType: contentTypeFor(local), cacheControl },
        });
        await file.makePublic();
        done++;
        if (done % 50 === 0 || done === toUpload.length) {
          console.log(`  ↑ ${done}/${toUpload.length}`);
        }
      } catch (e) {
        const msg = String(e.message || e).slice(0, 180);
        console.error(`❌ ${dest}: ${msg}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toUpload.length) }, worker));
  console.log(`\n✅ deploy:content tamam — ${done} dosya GCS'e gitti`);
  console.log(`   gs://${BUCKET_NAME}/data/ …`);
}

run().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
