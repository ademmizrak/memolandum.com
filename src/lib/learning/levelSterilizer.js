/**
 * Level Sterilizer & Data Sanitizer Module
 * Ensures raw level JSON data is clean, normalized, deduplicated, and valid.
 */

import { preloadAudioAssetsNonBlocking } from "../contentCdn";

export function sanitizeWordData(rawWords = [], options = {}) {
  if (!Array.isArray(rawWords)) return [];

  const maxLimit =
    options && Number(options.maxLimit) > 0
      ? Number(options.maxLimit)
      : rawWords.length;

  const seenKeys = new Set();
  const sterilized = [];

  for (let i = 0; i < rawWords.length; i++) {
    if (sterilized.length >= maxLimit) break;
    const w = rawWords[i];
    if (!w || typeof w !== 'object') continue;

    // Extract English/Original text
    const english = String(
      w.english ||
      w.original_script ||
      w.word ||
      w.mission_word ||
      w.mission_phrase ||
      w.en ||
      w.osmanlica_latin ||
      w.hanzi ||
      w.kanji ||
      w.character ||
      w.character_script ||
      w.root ||
      ''
    ).trim();

    // Extract Turkish/Translation text
    const turkish = String(
      w.turkish ||
      w.meaning ||
      w.translation ||
      w.target_translation ||
      w.tr ||
      w.guncel_turkce ||
      w.es ||
      w.fr ||
      w.de ||
      w.ar ||
      w.pt ||
      w.brpt ||
      w.zh ||
      w.cn ||
      w.it ||
      w.ru ||
      w.ja ||
      w.jap ||
      w.ko ||
      w.el ||
      w.type ||
      ''
    ).trim();

    // Must have non-empty english and turkish fields
    if (!english || !turkish) continue;

    // Generate unique key for deduplication (by normalized source word so identical source words with slightly different meaning strings never duplicate in the same level pool)
    const uniqueSourceKey = english.toLowerCase().trim();
    if (seenKeys.has(uniqueSourceKey)) continue;
    seenKeys.add(uniqueSourceKey);

    const romanized = String(
      w.osmanlica_arapca ||
      w.romanized_script ||
      w.romanized ||
      w.latin_okunusu ||
      w.pinyin ||
      ''
    ).trim();

    const wordId =
      w.id ||
      w.word_id ||
      w.sentence_id ||
      `word_${i}_${english.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    let rawAudioUrl = w.audioUrl || w.audio_url || '';
    if (!rawAudioUrl && w.audio) {
      if (typeof w.audio === 'string') {
        rawAudioUrl = w.audio;
      } else if (typeof w.audio === 'object') {
        rawAudioUrl = w.audio.default || w.audio.female || w.audio.male || '';
      }
    }
    const cleanWordLength = english.replace(/[^a-zA-Z0-9\u00C0-\u024F\u0600-\u06FF]/g, '').length || english.length;
    const isSingleWord = !english.includes(' ');
    const isMicroEasy = isSingleWord && cleanWordLength <= 7;

    sterilized.push({
      ...w,
      id: String(wordId),
      english,
      turkish,
      word: english,
      meaning: turkish,
      translation: turkish,
      romanized,
      romanized_script: romanized,
      audioUrl: rawAudioUrl,
      wordLength: cleanWordLength,
      isMicroEasy,
    });
  }

  return sterilized;
}

/**
 * Faz 2 & Faz 4 — Non-Blocking CDN & Graceful Audio Fallback Sterilizer:
 * Ses dosyası URL'si geciktiğinde veya 404/timeout döndüğünde bile hata fırlatmadan
 * (graceful fallback ile) temizlenmiş seviye JSON dizisini anında teslim eder.
 */
export function sterilizeLevelWithNonBlockingAudio(rawWords = [], options = {}) {
  const sterilized = sanitizeWordData(rawWords, options);
  try {
    preloadAudioAssetsNonBlocking(sterilized, 0);
  } catch {
    // Ses önyükleme hataları seviye JSON teslimatını asla bloklamaz
  }
  return sterilized;
}
