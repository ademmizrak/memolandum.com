/**
 * İçerik kapısı — spam, çöp, aşırı uzun / URL vb. metinleri erken reddeder.
 */

const URL_RE = /https?:\/\/|www\.|mailto:/i;
const REPEAT_RE = /(.)\1{7,}/; // 8+ aynı karakter
const ONLY_PUNCT_RE = /^[\s\p{P}\p{S}]+$/u;

/**
 * @typedef {'translate' | 'vault_word' | 'vault_phrase' | 'pl_ingest'} ContentKind
 */

const LIMITS = {
  translate: { min: 1, max: 280 },
  vault_word: { min: 1, max: 80 },
  vault_phrase: { min: 1, max: 200 },
  pl_ingest: { min: 1, max: 120 },
};

/**
 * @param {string} text
 * @param {ContentKind} kind
 * @returns {{ ok: true, text: string } | { ok: false, code: string, message: string }}
 */
export function gateContent(text, kind = "translate") {
  const limits = LIMITS[kind] || LIMITS.translate;
  const trimmed = String(text ?? "").trim();

  if (!trimmed || trimmed.length < limits.min) {
    return { ok: false, code: "empty", message: "Metin boş görünüyor." };
  }

  if (trimmed.length > limits.max) {
    return {
      ok: false,
      code: "too_long",
      message: `Metin çok uzun (en fazla ${limits.max} karakter).`,
    };
  }

  if (ONLY_PUNCT_RE.test(trimmed)) {
    return { ok: false, code: "punct_only", message: "Geçerli bir metin girin." };
  }

  if (REPEAT_RE.test(trimmed)) {
    return { ok: false, code: "spam_repeat", message: "Metin spam gibi görünüyor." };
  }

  if (URL_RE.test(trimmed) && kind !== "translate") {
    return { ok: false, code: "url", message: "Bağlantı eklenemez." };
  }

  // Çoğunlukla kontrol karakteri / binary
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(trimmed)) {
    return { ok: false, code: "binary", message: "Geçersiz karakterler var." };
  }

  return { ok: true, text: trimmed };
}

export function contentLimits() {
  return { ...LIMITS };
}
