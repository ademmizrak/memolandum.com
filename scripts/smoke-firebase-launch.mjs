/**
 * Lansman öncesi Firebase + GCS smoke test.
 * Secret değer basmaz; sadece durum kodları ve uyumluluk.
 *
 * Usage: node scripts/smoke-firebase-launch.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROJECT = "memolandum-33dc4";
const BUCKET = `${PROJECT}.firebasestorage.app`;
const GCS_DATA = `https://storage.googleapis.com/${BUCKET}/data`;
const GCS_ROOT = `https://storage.googleapis.com/${BUCKET}`;
const WEB_APP_ID = "1:539033091302:web:1e4c4763aff1da0c2bcf27";

const results = [];

function loadEnvFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  const out = {};
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function record(group, name, ok, detail = "") {
  results.push({ group, name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${group} · ${name}${detail ? ` — ${detail}` : ""}`);
}

async function headOrGet(url, { method = "HEAD", acceptOk = [200] } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    let res = await fetch(url, { method, redirect: "follow", signal: ctrl.signal });
    // Some GCS objects reject HEAD; fall back to GET range
    if (method === "HEAD" && (res.status === 400 || res.status === 403 || res.status === 405)) {
      res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-64" },
        signal: ctrl.signal,
      });
    }
    return res;
  } finally {
    clearTimeout(t);
  }
}

function loadManifestPaths() {
  const manifestPath = path.join(ROOT, "src/config/manifest.js");
  const content = fs.readFileSync(manifestPath, "utf8");
  const paths = new Set();
  const re = /"path"\s*:\s*"([^"]+\.json)"/g;
  let m;
  while ((m = re.exec(content))) paths.add(m[1]);
  return [...paths];
}

async function main() {
  console.log("\n=== Memolandum Firebase / GCS Lansman Smoke ===\n");

  // --- Env alignment ---
  const local = loadEnvFile(".env.local") || {};
  const prod = loadEnvFile(".env.production") || {};
  const base = loadEnvFile(".env") || {};

  const requiredFrontend = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  for (const key of requiredFrontend) {
    const hasLocal = Boolean(local[key]);
    const hasProd = Boolean(prod[key]);
    record(
      "env",
      key,
      hasLocal && hasProd,
      `local=${hasLocal ? "set" : "missing"} prod=${hasProd ? "set" : "missing"}`
    );
  }

  record(
    "env",
    "projectId match",
    (local.NEXT_PUBLIC_FIREBASE_PROJECT_ID || PROJECT) === PROJECT &&
      (prod.NEXT_PUBLIC_FIREBASE_PROJECT_ID || PROJECT) === PROJECT,
    `expected=${PROJECT}`
  );

  record(
    "env",
    "storageBucket match",
    (local.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || BUCKET) === BUCKET &&
      (prod.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || BUCKET) === BUCKET,
    `expected=${BUCKET}`
  );

  record(
    "env",
    "web appId match",
    (local.NEXT_PUBLIC_FIREBASE_APP_ID || WEB_APP_ID) === WEB_APP_ID &&
      (prod.NEXT_PUBLIC_FIREBASE_APP_ID || WEB_APP_ID) === WEB_APP_ID,
    `expected=${WEB_APP_ID}`
  );

  record(
    "env",
    "NEXT_PUBLIC_DATA_BASE_URL",
    Boolean(local.NEXT_PUBLIC_DATA_BASE_URL || prod.NEXT_PUBLIC_DATA_BASE_URL),
    local.NEXT_PUBLIC_DATA_BASE_URL || prod.NEXT_PUBLIC_DATA_BASE_URL || "missing"
  );

  record(
    "env",
    "App Check (RECAPTCHA) production",
    Boolean(prod.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY),
    prod.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY
      ? "prod set"
      : "prod missing — callable App Check kırılabilir"
  );

  record(
    "env",
    "App Check local",
    Boolean(local.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY),
    local.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY
      ? "local set"
      : "local missing (dev debug token gerekebilir)"
  );

  record(
    "env",
    "Gemini client key present",
    Boolean(local.NEXT_PUBLIC_GEMINI_API_KEY || prod.NEXT_PUBLIC_GEMINI_API_KEY || base.NEXT_PUBLIC_GEMINI_API_KEY),
    "istemci yedek çeviri için"
  );

  // --- Public Auth / Identity reachability ---
  const apiKey = prod.NEXT_PUBLIC_FIREBASE_API_KEY || local.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (apiKey) {
    const idUrl = `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(idUrl);
      // 400/403 with JSON still proves API key hits Identity Toolkit
      const body = await res.text();
      const hitsFirebase = /FIREBASE|API_KEY|PROJECT|INVALID|CONFIGURATION/i.test(body) || res.ok;
      record(
        "auth",
        "Identity Toolkit API key",
        hitsFirebase && res.status !== 404,
        `HTTP ${res.status}`
      );
    } catch (e) {
      record("auth", "Identity Toolkit API key", false, e.message);
    }

    const authDomain = prod.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${PROJECT}.firebaseapp.com`;
    try {
      const res = await headOrGet(`https://${authDomain}/__/auth/handler`, {
        method: "GET",
        acceptOk: [200, 400],
      });
      record(
        "auth",
        "authDomain handler",
        res.status < 500,
        `https://${authDomain} → HTTP ${res.status}`
      );
    } catch (e) {
      record("auth", "authDomain handler", false, e.message);
    }
  } else {
    record("auth", "Identity Toolkit API key", false, "API key yok");
  }

  // --- GCS bucket public content ---
  const criticalJson = [
    "Tr_Eng_Ilkokul/Ilkokul_1_Sinif_Kelimeleri.json",
    "Tr_Eng_Ilkokul/Ilkokul_2_Sinif_Kelimeleri.json",
    "Tr_Eng_Ilkokul/Ilkokul_3_Sinif_Kelimeleri.json",
    "Tr_Eng_Ilkokul/Ilkokul_4_Sinif_Kelimeleri.json",
    "Turkish/content/en_tr/words_en_tr.json",
    "academic/glossary-index.json",
  ];

  for (const rel of criticalJson) {
    const url = `${GCS_DATA}/${rel}`;
    try {
      const res = await headOrGet(url, { method: "GET" });
      let detail = `HTTP ${res.status}`;
      let ok = res.status === 200 || res.status === 206;
      if (ok) {
        const text = await res.text();
        const looksJson = text.trim().startsWith("{") || text.trim().startsWith("[");
        ok = looksJson || res.status === 206;
        detail += looksJson ? ` · ${Math.round(text.length / 1024)}KB sample` : " · range OK";
      }
      record("gcs", rel, ok, detail);
    } catch (e) {
      record("gcs", rel, false, e.message);
    }
  }

  // Sample asset paths
  const assetSamples = [
    "assets/words",
    "assets/audio",
    "assets/sentences",
  ];
  for (const prefix of assetSamples) {
    // list via a known shallow probe — bucket root listing may be denied; try a tiny common pattern
    const probe = `${GCS_ROOT}/${prefix}/`;
    try {
      const res = await headOrGet(probe, { method: "GET" });
      // 404 XML listing-disabled is still "bucket reachable"
      const body = await res.text().catch(() => "");
      const reachable =
        res.status === 200 ||
        res.status === 403 ||
        res.status === 404 ||
        /NoSuchKey|AccessDenied|Listing/i.test(body);
      record(
        "gcs",
        `prefix ${prefix}/`,
        reachable,
        `HTTP ${res.status} (prefix probe)`
      );
    } catch (e) {
      record("gcs", `prefix ${prefix}/`, false, e.message);
    }
  }

  // Manifest coverage sample (first 25 unique paths)
  const allPaths = loadManifestPaths();
  const sample = allPaths.slice(0, 25);
  let manifestOk = 0;
  let manifestFail = 0;
  for (const rel of sample) {
    const url = `${GCS_DATA}/${rel}`;
    try {
      const res = await headOrGet(url, { method: "GET" });
      if (res.status === 200 || res.status === 206) {
        manifestOk++;
        // drain body
        await res.arrayBuffer().catch(() => {});
      } else {
        manifestFail++;
        record("manifest-sample", rel, false, `HTTP ${res.status}`);
      }
    } catch (e) {
      manifestFail++;
      record("manifest-sample", rel, false, e.message);
    }
  }
  record(
    "manifest-sample",
    `first ${sample.length} unique JSON paths`,
    manifestFail === 0,
    `${manifestOk} OK / ${manifestFail} fail · total unique in manifest=${allPaths.length}`
  );

  // --- Hosting / site ---
  for (const url of [
    "https://memolandum.com/",
    "https://memolandum.com/games/",
    "https://memolandum.com/learn/",
    "https://memolandum.com/learn/en-tr/meb-1-sinif-kelimeleri/",
    "https://memolandum-33dc4.web.app/",
  ]) {
    try {
      const res = await headOrGet(url, { method: "GET" });
      await res.arrayBuffer().catch(() => {});
      record("hosting", url, res.status >= 200 && res.status < 400, `HTTP ${res.status}`);
    } catch (e) {
      record("hosting", url, false, e.message);
    }
  }

  // --- Callable HTTPS endpoints existence (unauthenticated → 401/403 expected) ---
  const callables = [
    "syncProgress",
    "geminiTranslate",
    "createPremiumCheckout",
    "updateScore",
    "deleteUserAccount",
    "cloudTranslate", // source exports; may be undeployed
  ];
  for (const name of callables) {
    const url = `https://us-central1-${PROJECT}.cloudfunctions.net/${name}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {} }),
      });
      const text = await res.text();
      // Deployed callables typically 401/403/400 with JSON; undeployed → 404 HTML/text
      const deployed = res.status !== 404 && !/Error: Page not found|Not Found/i.test(text);
      record(
        "functions",
        name,
        deployed,
        `HTTP ${res.status}${deployed ? "" : " — muhtemelen deploy edilmemiş"}`
      );
    } catch (e) {
      record("functions", name, false, e.message);
    }
  }

  // HTTP triggers
  for (const name of [
    "shopierPremiumWebhook",
    "shopierPremiumCallback",
    "stripePremiumWebhook",
  ]) {
    const url = `https://us-central1-${PROJECT}.cloudfunctions.net/${name}`;
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      const deployed = res.status !== 404;
      record(
        "functions-http",
        name,
        deployed,
        `HTTP ${res.status} · ${text.slice(0, 60).replace(/\s+/g, " ")}`
      );
    } catch (e) {
      record("functions-http", name, false, e.message);
    }
  }

  // Dual firebase config modules
  const cfgA = fs.readFileSync(path.join(ROOT, "src/lib/firebase/config.js"), "utf8");
  const cfgB = fs.readFileSync(path.join(ROOT, "src/config/firebase.js"), "utf8");
  record(
    "frontend",
    "dual config bucket string",
    cfgA.includes(BUCKET) && cfgB.includes(BUCKET),
    BUCKET
  );
  record(
    "frontend",
    "contentCdn default bucket",
    fs
      .readFileSync(path.join(ROOT, "src/lib/contentCdn.js"), "utf8")
      .includes(BUCKET),
    BUCKET
  );
  record(
    "frontend",
    "storage.rules present",
    fs.existsSync(path.join(ROOT, "storage.rules")),
    fs.existsSync(path.join(ROOT, "storage.rules"))
      ? "ok"
      : "yok — client SDK upload yoksa kabul edilebilir; public GCS okuma ayrı"
  );
  record(
    "frontend",
    "firestore.rules present",
    fs.existsSync(path.join(ROOT, "firestore.rules")),
    "ok"
  );

  // Summary
  const fail = results.filter((r) => !r.ok);
  const pass = results.filter((r) => r.ok);
  console.log("\n=== ÖZET ===");
  console.log(`PASS: ${pass.length}`);
  console.log(`FAIL: ${fail.length}`);
  if (fail.length) {
    console.log("\nBaşarısızlar:");
    for (const f of fail) {
      console.log(` - [${f.group}] ${f.name}: ${f.detail}`);
    }
  }
  console.log("");
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
