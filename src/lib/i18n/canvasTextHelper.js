/**
 * Faz 3: Arabic (AR) & RTL HTML5 Canvas Typography, Ligature Protection & Bounding Box Helper
 *
 * Ensures that Arabic/Persian/Hebrew scripts rendered inside HTML5 Canvas:
 * 1. Always set `ctx.direction = 'rtl'` (and reset `ctx.direction = 'ltr'` for Latin strings)
 *    so bidirectional (English-Arabic) cards never scramble.
 * 2. Force `ctx.letterSpacing = '0px'` and render words as intact strings so Arabic cursive
 *    ligatures and diacritics (harekeler) never disconnect on mobile browsers.
 * 3. Use a high-legibility Arabic web font stack ("Cairo", "Tajawal", "Noto Sans Arabic", sans-serif)
 *    backed by `document.fonts.ready`.
 * 4. Expand bounding boxes / word chips by +15% height and vertical padding for RTL strings
 *    to prevent clipping of Arabic ascenders/descenders and diacritics.
 */

import {
  isArabicText,
  containsRtlScript as containsRtlFromUtils,
  getTextDirection,
  stripArabicDiacritics,
  normalizeArabic,
  normalizeForComparison,
  areLettersEqual,
  isWordLetter,
  prepareWordForLetterGame,
  extractWordLetters,
  wrapBiDiText,
  formatBiDiPair,
  ARABIC_ALPHABET,
  ARABIC_KEYBOARD_ROWS,
  ARABIC_KEYBOARD_LETTERS,
} from './arabicTextUtils.js';

export {
  isArabicText,
  getTextDirection,
  stripArabicDiacritics,
  normalizeArabic,
  normalizeForComparison,
  areLettersEqual,
  isWordLetter,
  prepareWordForLetterGame,
  extractWordLetters,
  wrapBiDiText,
  formatBiDiPair,
  ARABIC_ALPHABET,
  ARABIC_KEYBOARD_ROWS,
  ARABIC_KEYBOARD_LETTERS,
};

export const RTL_SCRIPT_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const ARABIC_CANVAS_FONT_FAMILY = '"Cairo", "Tajawal", "Noto Sans Arabic", system-ui, -apple-system, sans-serif';

export const ARABIC_FONT_SCALE_FACTOR = 1.15;

let fontsReadyResolved = false;
let fontsReadyPromise = null;

/**
 * Checks whether a string contains Arabic, Persian, Urdu, or Hebrew RTL script characters.
 * @param {string} text
 * @returns {boolean}
 */
export function containsRtlScript(text) {
  return containsRtlFromUtils(text);
}

/**
 * Checks if the active UI session is currently in RTL / Arabic mode.
 * @returns {boolean}
 */
export function isRtlUiSession() {
  if (typeof document !== 'undefined') {
    const dir = document.documentElement?.getAttribute('dir');
    const lang = document.documentElement?.getAttribute('lang');
    if (dir === 'rtl' || lang === 'ar') return true;
  }
  if (typeof window !== 'undefined') {
    try {
      const savedLocale =
        window.localStorage?.getItem('memolandum-ui-locale') ||
        window.localStorage?.getItem('memolandum_locale');
      if (savedLocale === 'ar') return true;
    } catch {
      // Ignore storage access errors
    }
  }
  return false;
}

/**
 * Waits non-blockingly for web fonts (including Cairo / Tajawal / Noto Sans Arabic) to finish loading.
 * Resolves immediately after a 600ms safety timeout so slow networks never stall Canvas startup.
 * @returns {Promise<boolean>}
 */
export function ensureArabicCanvasFontsReady() {
  if (typeof document !== 'undefined') {
    try {
      if (!document.getElementById('mm-arabic-font')) {
        const l = document.createElement('link');
        l.id = 'mm-arabic-font';
        l.rel = 'stylesheet';
        l.href =
          'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@500;700;800&display=swap';
        document.head.appendChild(l);
      }
    } catch {
      // Ignore DOM injection error
    }
  }
  if (fontsReadyResolved || typeof document === 'undefined' || !document.fonts?.ready) {
    fontsReadyResolved = true;
    return Promise.resolve(true);
  }
  if (!fontsReadyPromise) {
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 600));
    fontsReadyPromise = Promise.race([
      document.fonts.ready.then(() => true).catch(() => false),
      timeoutPromise,
    ]).then((ready) => {
      fontsReadyResolved = true;
      return ready;
    });
  }
  return fontsReadyPromise;
}

/**
 * Injects the high-legibility Arabic font family into a Canvas `ctx.font` specification
 * when rendering RTL script, preserving font style/weight and scaling fontSize by 1.15x
 * for optimal Arabic readability and harakat/diacritic clearance.
 * @param {string} currentFont
 * @param {boolean} isRtlText
 * @param {number} [scaleFactor=ARABIC_FONT_SCALE_FACTOR]
 * @returns {string}
 */
export function formatCanvasFontForRtl(currentFont, isRtlText, scaleFactor = ARABIC_FONT_SCALE_FACTOR) {
  if (!isRtlText || !currentFont || typeof currentFont !== 'string') {
    return currentFont;
  }
  if (currentFont.includes('Cairo') || currentFont.includes('Tajawal') || currentFont.includes('Noto Sans Arabic')) {
    return currentFont;
  }
  const match = currentFont.match(/^([^0-9]*)(\d+(?:\.\d+)?)(px|pt|rem|em)((?:\/[^\s]+)?)\s+(.+)$/i);
  if (!match) {
    return `${currentFont}, ${ARABIC_CANVAS_FONT_FAMILY}`;
  }
  const [, prefix, rawSize, unit] = match;
  const numericSize = parseFloat(rawSize);
  const scaledSize = Number.isFinite(numericSize)
    ? Math.round(numericSize * scaleFactor * 10) / 10
    : rawSize;
  return `${prefix}${scaledSize}${unit}/1.35 ${ARABIC_CANVAS_FONT_FAMILY}`;
}

/**
 * Calculates RTL-aware bounding box metrics for Canvas word chips / meteors / cards.
 * Applies a +15% vertical height & padding expansion when rendering Arabic/RTL script
 * so diacritics and deep descenders never clip against box borders.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} [baseFontPx=16]
 * @param {number} [basePadX=16]
 * @param {number} [basePadY=10]
 */
export function getLocalizedBoxMetrics(ctx, text, baseFontPx = 16, basePadX = 16, basePadY = 10) {
  const safeText = String(text ?? '');
  const isRtl = containsRtlScript(safeText);
  const scaleFactor = isRtl ? 1.15 : 1.0;

  let textWidth = safeText.length * (baseFontPx * 0.6);
  if (ctx && typeof ctx.measureText === 'function') {
    const prevDirection = ctx.direction;
    const prevFont = ctx.font;
    try {
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      if (isRtl && prevFont) {
        ctx.font = formatCanvasFontForRtl(prevFont, true);
      }
      textWidth = ctx.measureText(safeText).width;
    } catch {
      // Fallback to estimated width
    } finally {
      try {
        if (prevDirection) ctx.direction = prevDirection;
        if (prevFont) ctx.font = prevFont;
      } catch {
        // Ignore context restore error
      }
    }
  }

  const padX = Math.round(basePadX * scaleFactor);
  const padY = Math.round(basePadY * scaleFactor);
  const baseHeight = baseFontPx + basePadY * 2;
  const height = Math.round(baseHeight * scaleFactor);
  const width = Math.round(textWidth + padX * 2);
  // Subtle optical baseline adjustment for Arabic script in middle-aligned boxes
  const verticalOffset = isRtl ? Math.round(baseFontPx * 0.04) : 0;

  return {
    isRtl,
    scaleFactor,
    textWidth,
    padX,
    padY,
    width,
    height,
    verticalOffset,
  };
}

/**
 * Builds an RTL-safe hint string without breaking Arabic cursive ligatures.
 * For Latin words, spaces can separate characters (`a _ _ l e`).
 * For Arabic words, inserting spaces between letters breaks contextual letter joining,
 * so we keep the revealed prefix contiguous and append an intact ellipsis (`...`).
 *
 * @param {string} text
 * @param {number} revealRatio - Ratio between 0 and 1 of characters to reveal
 * @returns {string}
 */
export function formatRtlSafeHint(text, revealRatio = 0.35) {
  const clean = String(text ?? '').trim();
  if (!clean) return '';

  const isRtl = containsRtlScript(clean);
  const revealCount = Math.max(1, Math.min(clean.length, Math.ceil(clean.length * revealRatio)));

  if (isRtl) {
    if (revealCount >= clean.length) return clean;
    return `${clean.slice(0, revealCount)}…`;
  }

  return clean
    .split('')
    .map((ch, idx) => (idx < revealCount || ch === ' ' ? ch : '_'))
    .join(' ');
}

/**
 * Centralized RTL/LTR-aware Canvas text drawing helper.
 * Automatically assigns `ctx.direction = 'rtl'` for Arabic/RTL strings and resets
 * `ctx.direction = 'ltr'` for Latin strings so mixed English-Arabic screens never collide.
 * Enforces `ctx.letterSpacing = '0px'` on RTL text to protect Arabic ligatures.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {object} [options]
 * @param {string} [options.font]
 * @param {string} [options.fillStyle]
 * @param {string} [options.strokeStyle]
 * @param {number} [options.lineWidth]
 * @param {CanvasTextAlign} [options.textAlign]
 * @param {CanvasTextBaseline} [options.textBaseline]
 * @param {boolean} [options.stroke=false]
 * @param {boolean} [options.fill=true]
 * @param {number} [options.maxWidth]
 */
export function drawLocalizedText(ctx, text, x, y, options = {}) {
  if (!ctx || text === null || text === undefined) return;
  const str = String(text);
  if (!str) return;

  const isRtl = containsRtlScript(str);
  const prevDirection = ctx.direction;
  const prevLetterSpacing = ctx.letterSpacing;
  const prevFont = ctx.font;
  const prevFillStyle = ctx.fillStyle;
  const prevStrokeStyle = ctx.strokeStyle;
  const prevLineWidth = ctx.lineWidth;
  const prevTextAlign = ctx.textAlign;
  const prevTextBaseline = ctx.textBaseline;

  try {
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    if (isRtl) {
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = '0px';
      }
      const baseFont = options.font || prevFont;
      if (baseFont) {
        ctx.font = formatCanvasFontForRtl(baseFont, true);
      }
    } else if (options.font) {
      ctx.font = options.font;
    }

    if (options.fillStyle !== undefined) ctx.fillStyle = options.fillStyle;
    if (options.strokeStyle !== undefined) ctx.strokeStyle = options.strokeStyle;
    if (options.lineWidth !== undefined) ctx.lineWidth = options.lineWidth;
    if (options.textAlign !== undefined) ctx.textAlign = options.textAlign;
    if (options.textBaseline !== undefined) ctx.textBaseline = options.textBaseline;

    const drawY = isRtl && (ctx.textBaseline === 'middle' || options.textBaseline === 'middle')
      ? y + 1
      : y;

    if (options.stroke) {
      if (options.maxWidth !== undefined) {
        ctx.strokeText(str, x, drawY, options.maxWidth);
      } else {
        ctx.strokeText(str, x, drawY);
      }
    }

    if (options.fill !== false) {
      if (options.maxWidth !== undefined) {
        ctx.fillText(str, x, drawY, options.maxWidth);
      } else {
        ctx.fillText(str, x, drawY);
      }
    }
  } finally {
    try {
      ctx.direction = prevDirection || 'ltr';
      if ('letterSpacing' in ctx && prevLetterSpacing !== undefined) {
        ctx.letterSpacing = prevLetterSpacing;
      }
      if (options.font || isRtl) ctx.font = prevFont;
      if (options.fillStyle !== undefined) ctx.fillStyle = prevFillStyle;
      if (options.strokeStyle !== undefined) ctx.strokeStyle = prevStrokeStyle;
      if (options.lineWidth !== undefined) ctx.lineWidth = prevLineWidth;
      if (options.textAlign !== undefined) ctx.textAlign = prevTextAlign;
      if (options.textBaseline !== undefined) ctx.textBaseline = prevTextBaseline;
    } catch {
      // Ignore context restore error
    }
  }
}
