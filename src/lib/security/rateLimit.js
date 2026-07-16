/**
 * Client-side sliding window rate limiter (localStorage).
 * Sunucu kotası eklenene kadar bot hızını keser; tek başına yeterli değildir.
 */

const STORAGE_PREFIX = "mm_rl_v1:";

function storageKey(action, bucketId) {
  return `${STORAGE_PREFIX}${action}:${bucketId || "anon"}`;
}

function readBucket(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeBucket(key, stamps) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(stamps.slice(-200)));
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {string} action
 * @param {{ max: number, windowMs: number, bucketId?: string }} opts
 * @returns {{ ok: true, remaining: number } | { ok: false, retryAfterMs: number, remaining: 0 }}
 */
export function checkRateLimit(action, { max, windowMs, bucketId } = {}) {
  if (!action || !max || !windowMs) {
    return { ok: true, remaining: Infinity };
  }

  const key = storageKey(action, bucketId);
  const now = Date.now();
  const cutoff = now - windowMs;
  const stamps = readBucket(key).filter((t) => t > cutoff);

  if (stamps.length >= max) {
    const oldest = stamps[0] || now;
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(1000, oldest + windowMs - now),
    };
  }

  return { ok: true, remaining: max - stamps.length };
}

/**
 * Başarılı / kabul edilen işlem sonrası sayacı artırır.
 */
export function consumeRateLimit(action, { max, windowMs, bucketId } = {}) {
  const key = storageKey(action, bucketId);
  const now = Date.now();
  const cutoff = now - (windowMs || 0);
  const stamps = readBucket(key).filter((t) => t > cutoff);
  stamps.push(now);
  writeBucket(key, stamps);
  return {
    ok: true,
    remaining: Math.max(0, (max || stamps.length) - stamps.length),
  };
}

/**
 * Aynı içeriğin kısa sürede tekrarını kotaya yazmadan geçirmek için.
 */
export function wasRecentlySeen(dedupeKey, ttlMs = 60_000) {
  if (typeof window === "undefined" || !dedupeKey) return false;
  const key = `${STORAGE_PREFIX}dedupe:${dedupeKey}`;
  try {
    const prev = Number(localStorage.getItem(key) || 0);
    if (prev && Date.now() - prev < ttlMs) return true;
    localStorage.setItem(key, String(Date.now()));
    return false;
  } catch {
    return false;
  }
}
