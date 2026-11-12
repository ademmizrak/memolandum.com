/**
 * Force-upload manifest-critical JSON with forward-slash GCS keys + publicRead.
 */
import fs from "fs";
import path from "path";
import {
  BUCKET_NAME,
  DATA_DIR,
  contentTypeFor,
  initStorage,
  walkFiles,
} from "./lib/deployShared.mjs";

function toDest(local) {
  return path
    .relative(DATA_DIR, local)
    .split(path.sep)
    .join("/");
}

const REL_DIRS = [
  "Tr_Eng_Sinav_Ozel/Synonym_Antonym",
  "Tr_Eng_Sinav_Ozel/baglaclar_ozel",
  "academic/kpss_sinav",
  "academic/technic",
  "Japan/content/jap_Tr",
];

const EXTRA = ["academic/glossary-index.json"];

async function main() {
  const storage = await initStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  const locals = [];
  for (const d of REL_DIRS) {
    const root = path.join(DATA_DIR, d);
    if (!fs.existsSync(root)) continue;
    for (const local of walkFiles(root)) {
      if (local.endsWith(".json")) locals.push(local);
    }
  }
  for (const rel of EXTRA) {
    const local = path.join(DATA_DIR, rel);
    if (fs.existsSync(local)) locals.push(local);
  }

  console.log(`Uploading ${locals.length} files with publicRead…`);
  let n = 0;
  for (const local of locals) {
    const dest = `data/${toDest(local)}`;
    if (dest.includes("\\")) {
      throw new Error(`Backslash in dest: ${dest}`);
    }
    const [file] = await bucket.upload(local, {
      destination: dest,
      predefinedAcl: "publicRead",
      metadata: {
        contentType: contentTypeFor(local),
        cacheControl: "public, max-age=60",
      },
    });
    try {
      await file.makePublic();
    } catch {
      /* ignore if already public / uniform bucket */
    }
    n++;
    if (n % 10 === 0 || n === locals.length) {
      console.log(`↑ ${n}/${locals.length} ${dest}`);
    }
  }

  const checks = [
    "data/Tr_Eng_Sinav_Ozel/Synonym_Antonym/en_tr_eşanlamlı_100kelime_101_200.json",
    "data/academic/kpss_sinav/KPSS_Cografya_001_100.json",
    "data/academic/technic/tip_fakultesi_001_100_kavram.json",
    "data/Japan/content/jap_Tr/alphabet_hiragana_jap_Tr.json",
    "data/Tr_Eng_Sinav_Ozel/baglaclar_ozel/ozel_liste_201_300.json",
  ];
  console.log("\nVerify:");
  for (const p of checks) {
    const url =
      `https://storage.googleapis.com/${BUCKET_NAME}/` +
      p.split("/").map(encodeURIComponent).join("/");
    const r = await fetch(url, { headers: { Range: "bytes=0-8" } });
    console.log(r.status, p);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
