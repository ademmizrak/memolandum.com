/**
 * Abuse Guard — istemci katmanı cephesi.
 * Kullanım: assertAllowed({ action, text?, blobSize?, isAuthenticated? })
 *
 * Katmanlar:
 * 1) contentGate
 * 2) rateLimit (misafir / üye kotası)
 * 3) davranış sinyali (çok ekleme, az oynama → yumuşak kısıt)
 *
 * Not: App Check (config.js) + ileride Functions rate limit ile tamamlanır.
 */

import { gateContent } from "./contentGate";
import { checkRateLimit, consumeRateLimit } from "./rateLimit";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** @type {Record<string, { guest: { max: number, windowMs: number }, user: { max: number, windowMs: number }, contentKind?: string }>} */
export const ABUSE_POLICIES = {
  translate_text: {
    guest: { max: 40, windowMs: DAY },
    user: { max: 120, windowMs: DAY },
    contentKind: "translate",
  },
  translate_audio: {
    guest: { max: 12, windowMs: DAY },
    user: { max: 40, windowMs: DAY },
  },
  vault_add: {
    guest: { max: 25, windowMs: DAY },
    user: { max: 80, windowMs: DAY },
    contentKind: "vault_phrase",
  },
  pl_ingest: {
    guest: { max: 20, windowMs: DAY },
    user: { max: 60, windowMs: DAY },
    contentKind: "pl_ingest",
  },
  ai_enrich: {
    guest: { max: 10, windowMs: DAY },
    user: { max: 40, windowMs: DAY },
  },
  adaptive_deck: {
    guest: { max: 15, windowMs: DAY },
    user: { max: 60, windowMs: DAY },
  },
};

const BEHAVIOR_KEY = "mm_abuse_behavior_v1";

export class AbuseError extends Error {
  /**
   * @param {string} message
   * @param {{ code: string, retryAfterMs?: number }} meta
   */
  constructor(message, meta = { code: "abuse" }) {
    super(message);
    this.name = "AbuseError";
    this.code = meta.code;
    this.retryAfterMs = meta.retryAfterMs;
  }
}

function bucketId(isAuthenticated, uid) {
  if (uid) return `u:${uid}`;
  if (isAuthenticated) return "user";
  return "guest";
}

function policyFor(action, isAuthenticated) {
  const p = ABUSE_POLICIES[action];
  if (!p) return null;
  return isAuthenticated ? p.user : p.guest;
}

function readBehavior() {
  if (typeof window === "undefined") return { adds: 0, plays: 0, day: "" };
  try {
    const raw = JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || "{}");
    const day = new Date().toISOString().slice(0, 10);
    if (raw.day !== day) return { adds: 0, plays: 0, day };
    return {
      adds: Number(raw.adds) || 0,
      plays: Number(raw.plays) || 0,
      day,
    };
  } catch {
    return { adds: 0, plays: 0, day: new Date().toISOString().slice(0, 10) };
  }
}

function writeBehavior(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Oyun / quiz seansı bittiğinde çağır — abuse skorunu iyileştirir. */
export function recordPlaySignal() {
  const s = readBehavior();
  s.plays += 1;
  writeBehavior(s);
}

function recordAddSignal() {
  const s = readBehavior();
  s.adds += 1;
  writeBehavior(s);
}

/**
 * Çok ekleme / az oynama → vault & pl için ek kısıt (çeviriyi tamamen kilitlemez).
 */
function behaviorBlocksAdd(isAuthenticated) {
  const s = readBehavior();
  const maxAddsWithoutPlay = isAuthenticated ? 40 : 15;
  if (s.plays === 0 && s.adds >= maxAddsWithoutPlay) {
    return {
      blocked: true,
      message: "Biraz oyun veya quiz oynayıp tekrar deneyin.",
      code: "behavior_ratio",
    };
  }
  if (s.plays > 0 && s.adds / Math.max(1, s.plays) > 25) {
    return {
      blocked: true,
      message: "Çok hızlı ekleme algılandı. Kısa bir ara verin.",
      code: "behavior_burst",
    };
  }
  return { blocked: false };
}

function formatRetry(ms) {
  const m = Math.ceil((ms || 0) / 60000);
  if (m <= 1) return "birkaç dakika";
  if (m < 60) return `yaklaşık ${m} dakika`;
  return `yaklaşık ${Math.ceil(m / 60)} saat`;
}

/**
 * İşlem öncesi kontrol. Başarısızsa AbuseError fırlatır.
 * Başarılıysa { text } döner; API çağrısından sonra commitAbuse() ile kotayı işlet.
 *
 * @param {{
 *   action: keyof typeof ABUSE_POLICIES,
 *   text?: string,
 *   isAuthenticated?: boolean,
 *   uid?: string | null,
 *   skipDedupe?: boolean,
 * }} opts
 */
export function assertAllowed(opts) {
  const {
    action,
    text,
    isAuthenticated = false,
    uid = null,
    skipDedupe = false,
  } = opts || {};

  const policyDef = ABUSE_POLICIES[action];
  if (!policyDef) {
    return { text: text != null ? String(text).trim() : "" };
  }

  let normalized = text != null ? String(text) : "";

  if (policyDef.contentKind && text != null) {
    const gated = gateContent(text, policyDef.contentKind);
    if (!gated.ok) {
      throw new AbuseError(gated.message, { code: gated.code });
    }
    normalized = gated.text;
  }

  if (action === "vault_add" || action === "pl_ingest") {
    const b = behaviorBlocksAdd(isAuthenticated);
    if (b.blocked) {
      throw new AbuseError(b.message, { code: b.code });
    }
  }

  const limits = policyFor(action, isAuthenticated);
  const id = bucketId(isAuthenticated, uid);

  const check = checkRateLimit(action, { ...limits, bucketId: id });
  if (!check.ok) {
    throw new AbuseError(
      `Günlük limit doldu. ${formatRetry(check.retryAfterMs)} sonra tekrar deneyin.`,
      { code: "rate_limit", retryAfterMs: check.retryAfterMs }
    );
  }

  return { text: normalized, deduped: false, action, bucketId: id, limits };
}

/**
 * İzin verilen işlem gerçekten çalıştıktan sonra çağır.
 * @param {ReturnType<typeof assertAllowed>} ticket
 */
export function commitAbuse(ticket) {
  if (!ticket || ticket.deduped) return;
  if (!ticket.action || !ticket.limits) return;
  consumeRateLimit(ticket.action, {
    ...ticket.limits,
    bucketId: ticket.bucketId,
  });
  if (ticket.action === "vault_add" || ticket.action === "pl_ingest") {
    recordAddSignal();
  }
}

/**
 * Guard + commit’i tek adımda sarmalar (senkron ön kontrol).
 * Async işten önce: const ticket = assertAllowed(...); ...; commitAbuse(ticket);
 */
export function guardOrThrow(opts) {
  return assertAllowed(opts);
}
