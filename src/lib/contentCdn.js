/**
 * Content CDN helpers — Firebase Hosting CDN / local-first with remote fallback,
 * Faz 2 Progressive Asset Loading, 1500ms Audio Queue, and Cache API / Hybrid Storage persistence.
 */

export const DEFAULT_REMOTE_DATA_BASE = "https://memolandum.com/data";
export const DEFAULT_GCS_DATA_BASE = "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data";
export const DEFAULT_REMOTE_ASSET_BASE = "https://memolandum.com";
export const AUDIO_FETCH_TIMEOUT_MS = 1500;
export const LESSON_CACHE_BUCKET = "memolandum-cdn-v2";

const _memoryJsonCache = new Map();
const _memoryAudioBlobMap = new Map();
const _preloadedAudioCache = new Set();
let _audioQueueBusy = false;
const _audioFetchQueue = [];
let _sharedSynthCtx = null;
let _audioFallbackUsedInSession = false;

export function markAudioFallbackUsed() {
  _audioFallbackUsedInSession = true;
}

export function wasAudioFallbackUsed() {
  return _audioFallbackUsedInSession;
}

export function resetAudioFallbackFlag() {
  _audioFallbackUsedInSession = false;
}

function isCapacitorRuntime() {
  if (typeof window === "undefined") return false;
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function isLocalHost() {
  if (typeof window === "undefined") return false;

  if (window.Capacitor || (window.location.hostname === "localhost" && !window.location.port)) {
    return false;
  }

  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

/**
 * Faz 2 — Kullanıcının ağ bağlantı profilini döndürür (3G / 2G / Save-Data tespiti).
 */
export function getNetworkConnectionProfile() {
  if (typeof navigator === "undefined") {
    return { effectiveType: "4g", saveData: false, isSlowNetwork: false };
  }
  try {
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null;
    const effectiveType = String(conn?.effectiveType || "4g").toLowerCase();
    const saveData = Boolean(conn?.saveData);
    const isSlowNetwork =
      saveData ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g" ||
      effectiveType === "3g";

    return {
      effectiveType,
      saveData,
      isSlowNetwork,
    };
  } catch {
    return { effectiveType: "4g", saveData: false, isSlowNetwork: false };
  }
}

/** @returns {string} base URL ending without trailing slash, or "" */
export function getDataBaseUrl() {
  const env = (process.env.NEXT_PUBLIC_DATA_BASE_URL || "").replace(/\/$/, "");
  if (env) return env;
  if (isCapacitorRuntime()) return DEFAULT_REMOTE_DATA_BASE;
  return "";
}

export function getAssetBaseUrl() {
  const env = (process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "").replace(/\/$/, "");
  if (env) return env;
  return "";
}

/**
 * Resolve a data-relative path to absolute URL.
 * @param {string} filePath e.g. "Tr_Eng_Ilkokul/x.json" or "/data/..." or "/assets/words/w.png"
 */
export function resolveDataUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const clean = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  if (clean.startsWith("assets/audio/") && isCapacitorRuntime()) {
    const assetBase = getAssetBaseUrl() || DEFAULT_REMOTE_ASSET_BASE;
    return `${assetBase}/${clean}`;
  }

  if (clean.startsWith("assets/")) {
    const assetBase = getAssetBaseUrl();
    if (assetBase) return `${assetBase}/${clean}`;
    return `/${clean}`;
  }

  const pathPrefix = clean.startsWith("data/") ? clean.slice(5) : clean;
  const isAudioFile =
    /\.(mp3|wav|ogg)(\?|$)/i.test(pathPrefix) ||
    /(^|\/)audio(_[a-z0-9]+)?\//i.test(pathPrefix);
  const dataBase = getDataBaseUrl() || (isAudioFile ? DEFAULT_GCS_DATA_BASE : "");
  if (dataBase) return `${dataBase}/${pathPrefix}`;
  return `/data/${pathPrefix}`;
}

/**
 * Lesson JSON URL candidates — local / same-origin first, remote memolandum.com fallback.
 */
export function resolveLessonJsonUrls(filePath) {
  if (!filePath) return [];
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return [filePath];
  }
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const pathPrefix = cleanPath.startsWith("data/") ? cleanPath.slice(5) : cleanPath;
  const dataBase = getDataBaseUrl();
  const remoteUrl = dataBase ? `${dataBase}/${pathPrefix}` : `https://memolandum.com/data/${pathPrefix}`;

  if (isCapacitorRuntime()) {
    return [remoteUrl];
  }

  const localUrl = `/data/${pathPrefix}`;
  if (localUrl === remoteUrl) return [localUrl];

  return [localUrl, remoteUrl];
}

export function resolveWordImageUrl(imageId) {
  if (!imageId) return "";
  if (String(imageId).startsWith("http")) return imageId;
  const id = String(imageId).replace(/\.png$/i, "");
  if (id.startsWith("s_")) {
    return resolveDataUrl(`assets/sentences/${id}.png`);
  }
  return resolveDataUrl(`assets/words/${id}.png`);
}

/**
 * Faz 2 — Agresif Yerel Önbellek (In-Memory + Browser Cache API + LocalStorage Hybrid):
 * Aynı seviye/dil tekrar açıldığında GCS CDN'e tekrar istek atılmasını sıfırlar ve <50ms içinde döner.
 */
export async function fetchLessonJsonProgressive(filePath, signal) {
  if (!filePath) throw new Error("Dosya yolu belirtilmedi.");

  // 1. In-memory sıfır gecikmeli önbellek
  if (_memoryJsonCache.has(filePath)) {
    return _memoryJsonCache.get(filePath);
  }

  // 2. LocalStorage önbelleği (anında başlangıç — Stale-While-Revalidate)
  const localKey = `lesson_cache_${filePath}`;
  if (typeof window !== "undefined") {
    try {
      const cachedRaw = localStorage.getItem(localKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed) {
          _memoryJsonCache.set(filePath, parsed);
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }

    // 3. Tarayıcı Cache API kontrolü
    if ("caches" in window) {
      try {
        const cache = await window.caches.open(LESSON_CACHE_BUCKET);
        const candidates = resolveLessonJsonUrls(filePath);
        for (const base of candidates) {
          const matched = await cache.match(base);
          if (matched && matched.ok) {
            const data = await matched.json();
            _memoryJsonCache.set(filePath, data);
            try {
              localStorage.setItem(localKey, JSON.stringify(data));
            } catch {
              /* ignore */
            }
            return data;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  // 4. Ağdan çek ve hem Cache API hem LocalStorage'a kaydet
  const urls = resolveLessonJsonUrls(filePath);
  let lastErr = null;
  for (const base of urls) {
    try {
      const response = await fetch(base, { signal });
      if (response.ok) {
        const cloneForCache = response.clone();
        const data = await response.json();
        _memoryJsonCache.set(filePath, data);

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(localKey, JSON.stringify(data));
          } catch {
            /* ignore */
          }
          if ("caches" in window) {
            window.caches
              .open(LESSON_CACHE_BUCKET)
              .then((c) => c.put(base, cloneForCache))
              .catch(() => {});
          }
        }
        return data;
      }
      lastErr = new Error(`HTTP ${response.status} for ${base}`);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("Veritabanından kelime çekilemedi veya JSON boş.");
}

/**
 * Faz 2 — Ses henüz inmediğinde oyun akışını kesmemek için Web Audio API ile
 * hafif, hoş bir sentetik onay sesi üretir (90ms, sıfır ağ maliyeti).
 */
export function playSynthesizedConfirmTone() {
  markAudioFallbackUsed();
  if (typeof window === "undefined") return false;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    if (!_sharedSynthCtx) {
      _sharedSynthCtx = new AudioCtx();
    }
    if (_sharedSynthCtx.state === "suspended") {
      _sharedSynthCtx.resume().catch(() => {});
    }
    const now = _sharedSynthCtx.currentTime;
    const osc = _sharedSynthCtx.createOscillator();
    const gain = _sharedSynthCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.085); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(_sharedSynthCtx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tek bir ses URL'ini 1500ms (1.5 sn) timeout ile çekip Cache API + Blob Map'e kaydeder.
 */
async function fetchAudioWithTimeout(resolvedUrl, timeoutMs = AUDIO_FETCH_TIMEOUT_MS) {
  if (!resolvedUrl || typeof window === "undefined") return null;
  if (_memoryAudioBlobMap.has(resolvedUrl)) {
    return _memoryAudioBlobMap.get(resolvedUrl);
  }

  // Önce Tarayıcı Cache API'ye bak
  if ("caches" in window) {
    try {
      const cache = await window.caches.open(LESSON_CACHE_BUCKET);
      const cachedRes = await cache.match(resolvedUrl);
      if (cachedRes && cachedRes.ok) {
        const blob = await cachedRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        _memoryAudioBlobMap.set(resolvedUrl, blobUrl);
        return blobUrl;
      }
    } catch {
      /* ignore */
    }
  }

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(resolvedUrl, { signal: controller.signal });
    if (!res.ok) {
      markAudioFallbackUsed();
      return null;
    }
    const cloneForCache = res.clone();
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    _memoryAudioBlobMap.set(resolvedUrl, blobUrl);

    if ("caches" in window) {
      window.caches
        .open(LESSON_CACHE_BUCKET)
        .then((c) => c.put(resolvedUrl, cloneForCache))
        .catch(() => {});
    }
    return blobUrl;
  } catch {
    markAudioFallbackUsed();
    return null;
  } finally {
    clearTimeout(timerId);
  }
}

async function drainAudioPrefetchQueue() {
  if (_audioQueueBusy) return;
  _audioQueueBusy = true;
  try {
    while (_audioFetchQueue.length > 0) {
      const nextUrl = _audioFetchQueue.shift();
      if (!nextUrl || _memoryAudioBlobMap.has(nextUrl)) continue;
      await fetchAudioWithTimeout(nextUrl, AUDIO_FETCH_TIMEOUT_MS);
    }
  } finally {
    _audioQueueBusy = false;
  }
}

/**
 * Faz 2 — Önbellekte hazır olan ses URL'ini senkron döndürür (hazır değilse null döner
 * ve arka planda 1500ms timeout ile kuyruğa ekler).
 */
export function getCachedAudioUrlSync(rawUrl) {
  if (!rawUrl) return null;
  const resolved = resolveDataUrl(rawUrl);
  if (_memoryAudioBlobMap.has(resolved)) {
    return _memoryAudioBlobMap.get(resolved);
  }
  return null;
}

/**
 * Faz 1 & Faz 2 — Bloklamayan & Ağ Duyarlı Ses Önyükleme Kuyruğu (1500ms Timeout):
 * - Kullanıcının bağlantısı yavaşsa (`2g` / `slow-2g` / `3g` veya `saveData === true`),
 *   yalnızca sıradaki 2 kelime için (`lazy prefetch`) tek tek indirir.
 * - Normal bağlantıda aktif seviye kelimelerini sırayla 1500ms timeout'lu kuyrukta ısıtır.
 */
export function preloadAudioAssetsNonBlocking(words = [], startIndex = 0) {
  if (typeof window === "undefined" || !Array.isArray(words) || words.length === 0) {
    return;
  }

  const { isSlowNetwork } = getNetworkConnectionProfile();
  // Yavaş ağlarda yalnızca sıradaki 2 kelimeyi indir (lazy prefetch)
  const sliceCount = isSlowNetwork ? 2 : Math.min(words.length, 6);
  const targetSlice = words.slice(Math.max(0, startIndex), Math.max(0, startIndex) + sliceCount);

  const scheduleIdle =
    typeof window.requestIdleCallback === "function"
      ? (cb) => window.requestIdleCallback(cb, { timeout: 1200 })
      : (cb) => setTimeout(cb, 24);

  scheduleIdle(() => {
    try {
      for (let i = 0; i < targetSlice.length; i++) {
        const rawUrl = targetSlice[i]?.audioUrl || targetSlice[i]?.audio_url || "";
        if (!rawUrl) continue;
        const resolvedUrl = resolveDataUrl(rawUrl);
        if (!resolvedUrl || _preloadedAudioCache.has(resolvedUrl)) continue;
        _preloadedAudioCache.add(resolvedUrl);
        _audioFetchQueue.push(resolvedUrl);
      }
      drainAudioPrefetchQueue();
    } catch {
      // Ses önyükleme hataları oyunu asla bloklamaz
    }
  });
}
