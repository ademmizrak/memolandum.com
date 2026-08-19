/**
 * Shared GCS / content CDN helpers for dual-pipeline deploys.
 */
import { Storage } from "@google-cloud/storage";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const PUBLIC_DIR = path.join(ROOT, "public");
export const DATA_DIR = path.join(PUBLIC_DIR, "data");
export const WORDS_DIR = path.join(PUBLIC_DIR, "assets", "words");
export const SENTENCES_DIR = path.join(PUBLIC_DIR, "assets", "sentences");
export const ASSETS_AUDIO_DIR = path.join(PUBLIC_DIR, "assets", "audio");

export const PROJECT_ID = "memolandum-33dc4";
export const BUCKET_NAME = "memolandum-33dc4.firebasestorage.app";
export const SERVICE_ACCOUNT_FILE = path.join(ROOT, "functions", "serviceAccountKey.json");
export const FIREBASE_CLI_CONFIG = path.join(
  os.homedir(),
  ".config",
  "configstore",
  "firebase-tools.json"
);

/** Folders temporarily renamed out of public/ during slim app build */
export const SLIM_HIDE = [
  { from: path.join(PUBLIC_DIR, "data"), to: path.join(PUBLIC_DIR, "_slim_skip_data") },
  { from: path.join(PUBLIC_DIR, "assets", "audio"), to: path.join(PUBLIC_DIR, "assets", "_slim_skip_audio") },
  { from: path.join(PUBLIC_DIR, "assets", "words"), to: path.join(PUBLIC_DIR, "assets", "_slim_skip_words") },
  { from: path.join(PUBLIC_DIR, "assets", "sentences"), to: path.join(PUBLIC_DIR, "assets", "_slim_skip_sentences") },
];

export function fileMd5(filePath) {
  const hash = crypto.createHash("md5");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("base64");
}

export function walkFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, fileList);
    else fileList.push(p);
  }
  return fileList;
}

export function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".html": "text/html; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
  };
  return map[ext] || "application/octet-stream";
}

export async function initStorage() {
  // CI / ADC
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!fs.existsSync(credPath)) {
      console.warn(`⚠️ GOOGLE_APPLICATION_CREDENTIALS file missing: ${credPath}`);
    } else {
      try {
        JSON.parse(fs.readFileSync(credPath, "utf8"));
      } catch (e) {
        console.warn(`⚠️ GOOGLE_APPLICATION_CREDENTIALS invalid JSON: ${e.message}`);
      }
      try {
        const storage = new Storage({ projectId: PROJECT_ID });
        await storage.bucket(BUCKET_NAME).getMetadata();
        console.log("✅ GCS auth: ADC (GOOGLE_APPLICATION_CREDENTIALS)");
        return storage;
      } catch (e) {
        console.warn("⚠️ ADC failed:", e.message);
      }
    }
  }

  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    try {
      const storage = new Storage({ projectId: PROJECT_ID, keyFilename: SERVICE_ACCOUNT_FILE });
      await storage.bucket(BUCKET_NAME).getMetadata();
      console.log("✅ GCS auth: service account");
      return storage;
    } catch (e) {
      console.warn("⚠️ service account failed:", e.message);
    }
  }

  if (fs.existsSync(FIREBASE_CLI_CONFIG)) {
    const config = JSON.parse(fs.readFileSync(FIREBASE_CLI_CONFIG, "utf8"));
    if (config.tokens?.access_token || config.tokens?.refresh_token) {
      // Firebase CLI OAuth client (public) — needed to refresh access tokens
      const authClient = new OAuth2Client(
        "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
        "j9iVZfS8kkCEFUPaAeJV0sAi"
      );
      authClient.setCredentials({
        access_token: config.tokens.access_token,
        refresh_token: config.tokens.refresh_token,
      });
      try {
        const { credentials } = await authClient.refreshAccessToken();
        if (credentials?.access_token) {
          config.tokens.access_token = credentials.access_token;
          if (credentials.expiry_date) config.tokens.expires_at = credentials.expiry_date;
          fs.writeFileSync(FIREBASE_CLI_CONFIG, JSON.stringify(config, null, 2));
        }
      } catch (e) {
        console.warn("⚠️ Firebase token refresh:", e.message);
      }
      const storage = new Storage({ projectId: PROJECT_ID, authClient });
      await storage.bucket(BUCKET_NAME).getMetadata();
      console.log("✅ GCS auth: Firebase CLI token");
      return storage;
    }
  }

  throw new Error('GCS auth yok. npx -y firebase-tools@latest login');
}

export function hideForSlimBuild() {
  const moved = [];
  for (const { from, to } of SLIM_HIDE) {
    if (!fs.existsSync(from)) continue;

    // Special handling for public/data since it fails with EPERM on Windows due to editor/process locks on the directory itself
    if (from === DATA_DIR) {
      if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
      }
      try {
        const entries = fs.readdirSync(from);
        for (const entry of entries) {
          const entryFrom = path.join(from, entry);
          const entryTo = path.join(to, entry);
          fs.renameSync(entryFrom, entryTo);
          moved.push({ from: entryFrom, to: entryTo, isChildOfData: true });
        }
        console.log(`🔇 slim hide (data children): ${entries.length} items hidden`);
      } catch (e) {
        console.warn(`⚠️ slim hide data children başarısız: ${e.message}`);
      }
      continue;
    }

    if (fs.existsSync(to)) {
      console.warn(`⚠️ slim hedef zaten var, atlanıyor: ${to}`);
      continue;
    }
    try {
      fs.renameSync(from, to);
      moved.push({ from, to });
      console.log(`🔇 slim hide: ${path.relative(ROOT, from)}`);
    } catch (e) {
      console.warn(`⚠️ slim hide başarısız (${path.relative(ROOT, from)}): ${e.message}`);
      console.warn("   → Build sonrası out strip + firebase ignore ile devam");
    }
  }
  return moved;
}

export function restoreAfterSlimBuild(moved) {
  for (const { from, to, isChildOfData } of [...moved].reverse()) {
    if (fs.existsSync(to) && !fs.existsSync(from)) {
      const parentDir = path.dirname(from);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.renameSync(to, from);
      console.log(`🔊 slim restore: ${path.relative(ROOT, from)}`);
    }
  }

  // Clean up empty _slim_skip_data directory if it exists and is empty
  const skipDataDir = path.join(PUBLIC_DIR, "_slim_skip_data");
  if (fs.existsSync(skipDataDir)) {
    try {
      const remaining = fs.readdirSync(skipDataDir);
      if (remaining.length === 0) {
        fs.rmdirSync(skipDataDir);
        console.log(`🧹 cleaned up empty ${skipDataDir}`);
      }
    } catch (e) {
      console.warn(`⚠️ failed to clean up ${skipDataDir}: ${e.message}`);
    }
  }

  // Safety: restore any leftover skip dirs
  for (const { from, to } of SLIM_HIDE) {
    if (from === DATA_DIR) {
      if (fs.existsSync(to)) {
        try {
          const entries = fs.readdirSync(to);
          for (const entry of entries) {
            const entryFrom = path.join(from, entry);
            const entryTo = path.join(to, entry);
            if (!fs.existsSync(entryFrom)) {
              fs.renameSync(entryTo, entryFrom);
              console.log(`🔊 slim safety restore child: ${entry}`);
            }
          }
          const remaining = fs.readdirSync(to);
          if (remaining.length === 0) {
            fs.rmdirSync(to);
          }
        } catch (e) {
          console.warn(`⚠️ slim safety restore data children failed: ${e.message}`);
        }
      }
      continue;
    }

    if (fs.existsSync(to) && !fs.existsSync(from)) {
      fs.renameSync(to, from);
      console.log(`🔊 slim safety restore: ${path.relative(ROOT, from)}`);
    }
  }
}

/** Academic JSON path during slim build (data folder renamed) */
export function glossaryDataDir() {
  const slim = path.join(PUBLIC_DIR, "_slim_skip_data", "academic");
  const normal = path.join(DATA_DIR, "academic");
  if (fs.existsSync(slim)) return slim;
  return normal;
}
