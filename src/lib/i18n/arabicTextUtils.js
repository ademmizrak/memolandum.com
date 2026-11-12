/**
 * Arabic & BiDi Text Processing Layer (ar-en / en-ar)
 *
 * Provides core normalization, RTL detection, BiDi isolation, and letter-matching
 * utilities shared across all 16 HTML5 Canvas and React game shells.
 */

// Arabic & RTL Unicode ranges (Standard Arabic, Supplement, Extended-A, Presentation Forms A & B)
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const RTL_SCRIPT_REGEX = /[\u0591-\u07FF\u08A0-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

// Arabic Tashkeel (diacritics/harakat), Quranic marks, and Tatweel (Kashida)
const ARABIC_DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

// Unicode BiDi control characters (for idempotency checks)
const BIDI_CONTROL_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/;

// Playable letter regex (Unicode letters across Latin, Turkish, Arabic, Cyrillic, etc.)
const PLAYABLE_LETTER_REGEX = /[\p{L}]/u;

/**
 * Standard 28-letter Arabic alphabet used for distractor generation and grid padding.
 */
export const ARABIC_ALPHABET = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

/**
 * Standard 3-row Arabic on-screen keyboard layout for letter-guessing shells (e.g. RetroHangman).
 */
export const ARABIC_KEYBOARD_ROWS = [
  "ضصثقفغعهخحجد",
  "شسيبلاتنمكط",
  "ئءؤرلاىةوزظذ",
];

/**
 * Flat list of unique Arabic keyboard keys (base 28 letters + common hamza/ta-marbuta/alef-maksura keys).
 */
export const ARABIC_KEYBOARD_LETTERS = [
  "ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د",
  "ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط",
  "ذ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ",
];

/**
 * Checks whether the given string contains Arabic characters.
 * @param {string} text
 * @returns {boolean}
 */
export function isArabicText(text) {
  if (!text || typeof text !== "string") return false;
  return ARABIC_SCRIPT_REGEX.test(text);
}

/**
 * Checks whether the given string contains any RTL script characters (Arabic, Hebrew, Persian, Urdu).
 * @param {string} text
 * @returns {boolean}
 */
export function containsRtlScript(text) {
  if (!text || typeof text !== "string") return false;
  return RTL_SCRIPT_REGEX.test(text);
}

/**
 * Determines the natural direction ('rtl' | 'ltr') of a text string.
 * @param {string} text
 * @param {'ltr'|'rtl'} [fallback='ltr']
 * @returns {'rtl'|'ltr'}
 */
export function getTextDirection(text, fallback = "ltr") {
  if (!text || typeof text !== "string") return fallback;
  if (containsRtlScript(text)) return "rtl";
  if (/[A-Za-z\u00C0-\u024F]/.test(text)) return "ltr";
  return fallback;
}

/**
 * Strips Arabic diacritics (Tashkeel / Harakat) and Tatweel (Kashida) from a string
 * while keeping base letters intact for visual rendering or letter-slot splitting.
 * @param {string} text
 * @returns {string}
 */
export function stripArabicDiacritics(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(ARABIC_DIACRITICS_REGEX, "");
}

/**
 * Normalizes Arabic text for tolerant user input & letter comparison:
 * - Removes Tashkeel (diacritics: \u064B-\u065F, \u0670, etc.) and Tatweel (\u0640)
 * - Unifies Alef variants (أ, إ, آ, ٱ -> ا)
 * - Unifies Teh Marbuta (ة -> ه)
 * - Unifies Alef Maksura & Farsi/Urdu Yeh (ى, ی, ے -> ي)
 * - Unifies Waw with Hamza (ؤ -> و) and Yeh with Hamza (ئ -> ي)
 * - Unifies Farsi Kaf (ک -> ك)
 * @param {string} text
 * @param {Object} [options]
 * @param {boolean} [options.keepTehMarbuta=false] - If true, keeps ة distinct from ه
 * @returns {string}
 */
export function normalizeArabic(text, options = {}) {
  if (!text || typeof text !== "string") return "";

  let normalized = text
    .normalize("NFKC")
    // Strip Tashkeel & Tatweel
    .replace(ARABIC_DIACRITICS_REGEX, "")
    // Normalize Alef variants (آ أ إ ٱ ٲ ٳ ٵ -> ا)
    .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673\u0675]/g, "\u0627")
    // Normalize Alef Maksura & Farsi/Urdu Yeh (ى ی ے -> ي)
    .replace(/[\u0649\u06CC\u06D2]/g, "\u064A")
    // Normalize Waw with Hamza (ؤ -> و)
    .replace(/\u0624/g, "\u0648")
    // Normalize Yeh with Hamza (ئ -> ي)
    .replace(/\u0626/g, "\u064A")
    // Normalize Farsi Kaf (ک -> ك)
    .replace(/\u06A9/g, "\u0643");

  if (!options.keepTehMarbuta) {
    // Normalize Teh Marbuta (ة -> ه)
    normalized = normalized.replace(/\u0629/g, "\u0647");
  }

  return normalized.trim();
}

/**
 * Normalizes any word or single letter for case-insensitive, diacritic-tolerant
 * (Portuguese/Romance accents: Á, À, Â, Ã, É, Ê, Í, Ó, Ô, Õ, Ú, Ç, etc.),
 * Turkish-tolerant, and Arabic-tolerant comparison.
 * @param {string} text
 * @returns {string}
 */
export function normalizeForComparison(text) {
  if (!text || typeof text !== "string") return "";
  if (isArabicText(text)) {
    return normalizeArabic(text);
  }
  return text
    .trim()
    .replace(/[ıİ]/g, "I")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/**
 * Compares two characters or strings with full Arabic normalization and Latin/Portuguese/Turkish insensitivity.
 * E.g. areLettersEqual('أ', 'ا') === true, areLettersEqual('ة', 'ه') === true,
 * areLettersEqual('A', 'Ã') === true, areLettersEqual('C', 'Ç') === true, areLettersEqual('i', 'İ') === true.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function areLettersEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a === b) return true;
  const normA = normalizeForComparison(a);
  const normB = normalizeForComparison(b);
  return normA.length > 0 && normA === normB;
}

/**
 * Checks if a single character is a playable word letter (excludes spaces, punctuation, and standalone diacritics).
 * @param {string} ch
 * @returns {boolean}
 */
export function isWordLetter(ch) {
  if (!ch || typeof ch !== "string") return false;
  const stripped = stripArabicDiacritics(ch);
  if (!stripped) return false;
  return PLAYABLE_LETTER_REGEX.test(stripped);
}

/**
 * Prepares a word for letter-based games (Hangman, WordSnake, WordDrop, Scramble):
 * - For Arabic words, strips combining diacritics/harakat so each array element is a base Arabic letter.
 * - For Turkish words containing Turkish-exclusive letters (ğ, ş, ı, İ), uses tr-TR locale uppercasing.
 * - For Brazilian Portuguese, English, and other Latin languages, uses standard `.toUpperCase()` so 'i' becomes 'I' (not 'İ') while preserving Portuguese diacritics (Ç, Ã, É, Ô, etc.) for display.
 * @param {string} word
 * @param {string} [langId]
 * @returns {string} Cleaned word string ready for `.split("")`
 */
export function prepareWordForLetterGame(word, langId = "") {
  if (!word || typeof word !== "string") return "";
  if (isArabicText(word)) {
    return stripArabicDiacritics(word).trim();
  }
  const trimmed = word.trim();
  const isExplicitTurkishTarget =
    /[ğşıĞŞİ]/.test(trimmed) ||
    (typeof langId === "string" && /^tr[-_]/i.test(langId.trim()));
  if (isExplicitTurkishTarget) {
    return trimmed.toLocaleUpperCase("tr-TR");
  }
  return trimmed.toUpperCase();
}

/**
 * Extracts only playable base letters from a word (used by WordSnake, etc.).
 * @param {string} word
 * @returns {string[]}
 */
export function extractWordLetters(word) {
  const prepared = prepareWordForLetterGame(word);
  if (!prepared) return [];
  return Array.from(prepared).filter((ch) => isWordLetter(ch));
}

/**
 * Wraps a text segment in Unicode BiDi directional isolates + marks so mixed
 * Arabic and English strings (including parentheses and punctuation) render
 * without directional scrambling in HTML5 Canvas fillText() or DOM nodes.
 * @param {string} text
 * @param {'rtl'|'ltr'} [forceDir]
 * @returns {string}
 */
export function wrapBiDiText(text, forceDir) {
  if (typeof text !== "string" || text.length === 0) return "";
  // Avoid double-wrapping if already wrapped in BiDi controls
  if (BIDI_CONTROL_REGEX.test(text)) return text;

  const dir = forceDir || getTextDirection(text, "ltr");
  if (dir === "rtl") {
    // RLI (\u2067) + RLM (\u200F) + text + PDI (\u2069)
    return `\u2067\u200F${text}\u2069`;
  }
  // LRI (\u2066) + LRM (\u200E) + text + PDI (\u2069)
  return `\u2066\u200E${text}\u2069`;
}

/**
 * Safely formats a pair of strings (e.g. Arabic word + English meaning) so neither
 * string's directionality bleeds into the separator or parentheses.
 * @param {string} first
 * @param {string} second
 * @param {string} [separator=" — "]
 * @returns {string}
 */
export function formatBiDiPair(first, second, separator = " — ") {
  const a = String(first ?? "").trim();
  const b = String(second ?? "").trim();
  if (!a) return b;
  if (!b) return a;
  if (!containsRtlScript(a) && !containsRtlScript(b)) {
    return `${a}${separator}${b}`;
  }
  return `${wrapBiDiText(a)}${separator}${wrapBiDiText(b)}`;
}
