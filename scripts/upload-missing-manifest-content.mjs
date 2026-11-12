/**
 * Targeted GCS upload for previously-failing manifest content paths.
 * Uploads only the files we need public — academic subdirs + sinav + japan alphabet.
 */
import fs from "fs";
import path from "path";
import {
  BUCKET_NAME,
  DATA_DIR,
  ROOT,
  contentTypeFor,
  fileMd5,
  initStorage,
  walkFiles,
} from "./lib/deployShared.mjs";

const REL_DIRS = [
  "academic/kpss_sinav",
  "academic/technic",
  "Tr_Eng_Sinav_Ozel/Synonym_Antonym",
  "Tr_Eng_Sinav_Ozel/baglaclar_ozel",
  "Japan/content/jap_Tr",
];

const EXTRA_FILES = ["academic/glossary-index.json"];

const DRY = process.argv.includes("--dry-run");

async function main() {
  // Refresh glossary index (same as deploy-content)
  const { spawnSync } = await import("child_process");
  // inline minimal: deploy-content buildGlossaryIndex is not exported — copy light version
  const base = path.join(DATA_DIR, "academic");
  if (fs.existsSync(base)) {
    const concepts = [];
    for (const sub of ["kpss_sinav", "technic"]) {
      const dir = path.join(base, sub);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
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
        } catch {
          /* skip */
        }
      }
    }
    fs.writeFileSync(
      path.join(base, "glossary-index.json"),
      JSON.stringify(concepts)
    );
    console.log(`glossary-index: ${concepts.length} concepts`);
  }

  const items = [];
  for (const rel of REL_DIRS) {
    const localRoot = path.join(DATA_DIR, rel);
    if (!fs.existsSync(localRoot)) {
      console.warn("missing dir", rel);
      continue;
    }
    for (const local of walkFiles(localRoot)) {
      if (!local.endsWith(".json")) continue;
      const destRel = path.relative(DATA_DIR, local).split(path.sep).join("/");
      items.push({ local, dest: `data/${destRel}` });
    }
  }
  for (const rel of EXTRA_FILES) {
    const local = path.join(DATA_DIR, rel);
    if (fs.existsSync(local)) items.push({ local, dest: `data/${rel}` });
  }

  console.log(`Candidates: ${items.length}`);
  const storage = await initStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  const toUpload = [];
  for (const item of items) {
    try {
      const file = bucket.file(item.dest);
      const [exists] = await file.exists();
      if (exists) {
        const [meta] = await file.getMetadata();
        if (meta.md5Hash && meta.md5Hash === fileMd5(item.local)) continue;
      }
      toUpload.push(item);
    } catch {
      toUpload.push(item);
    }
  }

  console.log(`Delta upload: ${toUpload.length}`);
  if (DRY) {
    toUpload.slice(0, 20).forEach((i) => console.log("  would ↑", i.dest));
    if (toUpload.length > 20) console.log(`  … +${toUpload.length - 20} more`);
    return;
  }

  let done = 0;
  for (const { local, dest } of toUpload) {
    try {
      const [file] = await bucket.upload(local, {
        destination: dest,
        metadata: {
          contentType: contentTypeFor(local),
          cacheControl: "public, max-age=60",
        },
      });
      await file.makePublic();
      done++;
      console.log(`↑ ${done}/${toUpload.length} ${dest}`);
    } catch (e) {
      console.error(`FAIL ${dest}:`, String(e.message || e).slice(0, 200));
    }
  }
  console.log(`Done. uploaded=${done}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
