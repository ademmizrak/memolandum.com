import { Capacitor } from "@capacitor/core";
import {
  resolveDataUrl,
  getCachedAudioUrlSync,
  getNetworkConnectionProfile,
  playSynthesizedConfirmTone,
} from "./contentCdn";

/**
 * Maps manifest language codes/prefixes or language names to standard BCP-47 language tags for SpeechSynthesis / Native TTS.
 */
export function getSpeechLangCode(langId) {
  if (!langId || typeof langId !== "string") return "en-US";
  const lower = langId.toLowerCase().trim();

  // If already a valid BCP-47 tag with dash (e.g. "en-US", "de-DE", "tr-TR", "pt-BR")
  if (/^[a-z]{2}-[a-z]{2}$/i.test(lower)) {
    const [l, r] = lower.split("-");
    return `${l.toLowerCase()}-${r.toUpperCase()}`;
  }

  const prefix = lower.split("-")[0].trim();

  switch (prefix) {
    case "en":
      return "en-US";
    case "de":
    case "ger":
      return "de-DE";
    case "fr":
      return "fr-FR";
    case "es":
    case "sp":
      return "es-ES";
    case "it":
      return "it-IT";
    case "pt":
      return "pt-BR";
    case "el":
    case "gr":
      return "el-GR";
    case "ru":
      return "ru-RU";
    case "ar":
      return "ar-SA";
    case "tr":
    case "osm":
      return "tr-TR";
    case "ja":
    case "jp":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    case "zh":
    case "cn":
      return "zh-CN";
    default:
      break;
  }

  // Fallback substring matching for curriculum/names across all 23 pathways
  if (lower.includes("almanca") || lower.includes("german") || lower.includes("de_")) return "de-DE";
  if (lower.includes("fransiz") || lower.includes("french") || lower.includes("france") || lower.includes("fr_")) return "fr-FR";
  if (lower.includes("ispanyol") || lower.includes("spanish") || lower.includes("spain") || lower.includes("es_")) return "es-ES";
  if (lower.includes("italyan") || lower.includes("italian") || lower.includes("italy") || lower.includes("it_")) return "it-IT";
  if (
    lower.includes("portekiz") ||
    lower.includes("portuguese") ||
    lower.includes("portugal") ||
    lower.includes("brpt") ||
    lower.includes("pt_br") ||
    lower.includes("pt-br") ||
    lower.includes("pt_")
  ) {
    return "pt-BR";
  }
  if (lower.includes("yunan") || lower.includes("greek") || lower.includes("el_")) return "el-GR";
  if (lower.includes("rusca") || lower.includes("russian") || lower.includes("russia") || lower.includes("ru_")) return "ru-RU";
  if (lower.includes("arapca") || lower.includes("arabic") || lower.includes("ar_")) return "ar-SA";
  if (lower.includes("osmanli") || lower.includes("turkce") || lower.includes("turkish")) return "tr-TR";
  if (lower.includes("japon") || lower.includes("japan") || lower.includes("ja_")) return "ja-JP";
  if (lower.includes("kore") || lower.includes("korean") || lower.includes("ko_")) return "ko-KR";
  if (lower.includes("cin") || lower.includes("china") || lower.includes("chinese") || lower.includes("zh_")) return "zh-CN";

  return "en-US";
}

/**
 * Extracts the speakable target word from a word object or plain string.
 */
export function extractWordText(wordObj) {
  if (!wordObj) return "";
  if (typeof wordObj === "string") return wordObj.trim();
  return (
    wordObj.english ||
    wordObj.word ||
    wordObj.original_script ||
    wordObj.target ||
    wordObj.term ||
    wordObj.text ||
    ""
  ).trim();
}

/**
 * Extracts the meaning/translation text from a word object.
 */
export function extractMeaningText(wordObj) {
  if (!wordObj || typeof wordObj !== "object") return "";
  return String(
    wordObj.turkish ||
      wordObj.meaning ||
      wordObj.translation ||
      wordObj.target_translation ||
      wordObj.definitionTr ||
      wordObj.tr ||
      ""
  ).trim();
}

/**
 * Cleans a dictionary meaning string so TTS reads the primary meaning concisely
 * during gameplay (e.g. "House / Home (building)" -> "House").
 */
export function cleanMeaningForSpeech(meaningText) {
  if (!meaningText || typeof meaningText !== "string") return "";
  let cleaned = meaningText.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (!cleaned) {
    cleaned = meaningText.replace(/[()]/g, "").trim();
  }
  const primaryPart = cleaned.split(/\s*[\/;|,]\s*/)[0]?.trim() || cleaned;
  return primaryPart;
}

const ARABIC_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Resolves the BCP-47 speech synthesis language tag for the meaning text.
 */
export function resolveMeaningSpeechLang(meaningText, langId = "", wordObj = null) {
  const clean = String(meaningText || "").trim();
  if (ARABIC_SCRIPT_RE.test(clean)) return "ar-SA";

  const lower = String(langId || wordObj?.langId || wordObj?.language || "")
    .toLowerCase()
    .trim();

  if (lower.endsWith("_en") || lower.endsWith("-en") || lower === "ar-en" || lower === "ar_en") {
    return "en-US";
  }
  if (lower.endsWith("_ar") || lower.endsWith("-ar") || lower === "en-ar" || lower === "en_ar") {
    return "ar-SA";
  }
  if (lower.endsWith("_pt") || lower.endsWith("-pt") || lower.endsWith("_brpt")) {
    return "pt-BR";
  }
  if (lower.endsWith("_tr") || lower.endsWith("-tr")) {
    return "tr-TR";
  }

  if (/[ğüşöçıİĞÜŞÖÇ]/.test(clean)) return "tr-TR";
  return "en-US";
}

function shouldSpeakMeaningByDefault(text, meaningText, langId = "", wordObj = null) {
  if (!meaningText) return false;
  if (meaningText.toLowerCase().trim() === String(text || "").toLowerCase().trim()) {
    return false;
  }
  if (ARABIC_SCRIPT_RE.test(text) || ARABIC_SCRIPT_RE.test(meaningText)) {
    return true;
  }
  const lower = String(langId || wordObj?.langId || wordObj?.language || "")
    .toLowerCase()
    .trim();
  if (
    lower.includes("arabic") ||
    lower.includes("arapca") ||
    lower.includes("ar_") ||
    lower.startsWith("ar-") ||
    lower.endsWith("-ar") ||
    lower.endsWith("_ar") ||
    lower.endsWith("_en") ||
    lower.endsWith("-en")
  ) {
    return true;
  }
  return false;
}

/**
 * Module-level reference to prevent garbage collection of active SpeechSynthesisUtterance in Chromium/WebKit.
 */
let activeUtterance = null;
let _pronunciationSeq = 0;
let _meaningTimerId = null;
let _sharedAudioPool = null;
let _sharedAudioPoolIdx = 0;

function clearPendingMeaningTimer() {
  if (_meaningTimerId !== null) {
    clearTimeout(_meaningTimerId);
    _meaningTimerId = null;
  }
}

function getSharedAudioElement() {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (!_sharedAudioPool) {
    _sharedAudioPool = [new Audio(), new Audio(), new Audio()];
    _sharedAudioPool.forEach((a) => {
      a.volume = 1.0;
    });
  }
  const audio = _sharedAudioPool[_sharedAudioPoolIdx];
  _sharedAudioPoolIdx = (_sharedAudioPoolIdx + 1) % _sharedAudioPool.length;
  return audio;
}

function playAudioUrlWithSharedPool(url, onFallback, onEnded) {
  if (!url) {
    onFallback?.();
    return;
  }
  const audio = getSharedAudioElement();
  if (!audio) {
    onFallback?.();
    return;
  }

  let settled = false;
  const triggerFallback = (err) => {
    if (settled) return;
    settled = true;
    audio.onerror = null;
    audio.onplaying = null;
    audio.onended = null;
    onFallback?.(err);
  };

  const timeoutId = setTimeout(() => {
    if (audio.readyState < 2 && !audio.ended && !settled) {
      triggerFallback("timeout");
    }
  }, 1500);

  audio.onerror = () => {
    clearTimeout(timeoutId);
    triggerFallback(audio.error);
  };

  audio.onplaying = () => {
    clearTimeout(timeoutId);
  };

  audio.onended = () => {
    clearTimeout(timeoutId);
    if (settled) return;
    settled = true;
    audio.onended = null;
    onEnded?.();
  };

  try {
    audio.src = url;
    audio.load();
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        clearTimeout(timeoutId);
        triggerFallback(e);
      });
    }
  } catch (err) {
    clearTimeout(timeoutId);
    triggerFallback(err);
  }
}

/**
 * Stops any active native or Web Speech API TTS playback.
 */
export function stopTts() {
  _pronunciationSeq++;
  clearPendingMeaningTimer();
  if (typeof window === "undefined") return;
  try {
    if (_sharedAudioPool) {
      _sharedAudioPool.forEach((a) => {
        try {
          if (!a.paused) a.pause();
        } catch {
          /* ignore */
        }
      });
    }
  } catch {
    /* ignore */
  }
  try {
    if (Capacitor.isNativePlatform()) {
      import("@capacitor-community/text-to-speech")
        .then(({ TextToSpeech }) => TextToSpeech.stop().catch(() => {}))
        .catch(() => {});
    }
  } catch {
    /* ignore */
  }
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Text-to-Speech using Native Capacitor bridge on Android/iOS (`@capacitor-community/text-to-speech`)
 * and Web Speech API on desktop/mobile web browsers:
 * - Cancels stuck previous audio queues
 * - Automatically unpauses if suspended
 * - Sets measured playback rate (0.9) for optimal vocabulary clarity
 */
export function speakTts(
  text,
  { lang = "en-US", rate = 0.9, pitch = 1.0, volume = 1.0, onEnd = null, onError = null } = {}
) {
  if (typeof window === "undefined") return false;
  if (!text || typeof text !== "string" || !text.trim()) return false;

  const cleanText = text.trim();
  const hasArabicScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(cleanText);
  let normalizedLang = getSpeechLangCode(lang);
  if (hasArabicScript) {
    normalizedLang = "ar-SA";
  } else if (normalizedLang === "ar-SA" && /[A-Za-z]/.test(cleanText)) {
    normalizedLang = "en-US";
  }

  // Native Android / iOS Capacitor TTS
  if (Capacitor.isNativePlatform()) {
    import("@capacitor-community/text-to-speech")
      .then(async ({ TextToSpeech }) => {
        try {
          await TextToSpeech.stop().catch(() => {});
          await TextToSpeech.speak({
            text: cleanText,
            lang: normalizedLang,
            rate: Number(rate) || 0.9,
            pitch: Number(pitch) || 1.0,
            volume: Number(volume) || 1.0,
            category: "ambient",
          });
          onEnd?.();
        } catch (nativeErr) {
          console.warn("[TTS Native] speak failed, attempting Web Speech fallback:", nativeErr);
          if (!speakWebSpeech(cleanText, { lang: normalizedLang, rate, pitch, volume, onEnd, onError })) {
            onError?.(nativeErr);
          }
        }
      })
      .catch((importErr) => {
        if (!speakWebSpeech(cleanText, { lang: normalizedLang, rate, pitch, volume, onEnd, onError })) {
          onError?.(importErr);
        }
      });
    return true;
  }

  return speakWebSpeech(cleanText, { lang: normalizedLang, rate, pitch, volume, onEnd, onError });
}

function speakWebSpeech(text, { lang = "en-US", rate = 0.9, pitch = 1.0, volume = 1.0, onEnd = null, onError = null } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return false;
  }

  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    if (synth.paused) {
      synth.resume();
    }

    let finished = false;
    const maxWaitMs = Math.min(3200, Math.max(850, text.length * 110));
    const watchdogId = setTimeout(() => {
      if (finished) return;
      finished = true;
      if (activeUtterance === utterance) activeUtterance = null;
      onEnd?.();
    }, maxWaitMs);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    activeUtterance = utterance;
    if (typeof window !== "undefined") {
      window._memolandumActiveUtterance = utterance;
    }

    utterance.onend = () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdogId);
      if (activeUtterance === utterance) activeUtterance = null;
      onEnd?.();
    };
    utterance.onerror = (e) => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdogId);
      if (activeUtterance === utterance) activeUtterance = null;
      console.warn("[TTS] Utterance error:", e?.error || e);
      onError?.(e);
    };

    synth.speak(utterance);
    return true;
  } catch (err) {
    console.warn("[TTS] Speech synthesis failed:", err);
    onError?.(err);
    return false;
  }
}

/**
 * Unified word pronunciation player:
 * 1. Checks if audio is enabled.
 * 2. Keeps pre-recorded studio audio (+10.000 Stüdyo Ses Kaydı) as Primary (via SoundManager or built-in shared Audio pool).
 * 3. If audioUrl is missing, 404s, 403s, or fails to play -> falls back to Native TTS (on Android) or Web Speech API TTS.
 * 4. For Arabic-English (ar-en) and target-meaning pairs, automatically pronounces the meaning word after the primary word finishes.
 */
export function playWordPronunciation(wordObj, options = {}) {
  const {
    isAudioEnabled = true,
    langId = "",
    soundManager = null,
    rate = 0.9,
    onFallback = null,
    includeMeaning,
  } = options;

  if (!isAudioEnabled || !wordObj) return;

  const text = extractWordText(wordObj);
  if (!text) return;

  const seq = ++_pronunciationSeq;
  clearPendingMeaningTimer();

  const effectiveLangId =
    langId ||
    (typeof wordObj === "object" ? wordObj.langId || wordObj.language || "" : "") ||
    "en-tr";

  let rawAudioUrl = "";
  if (typeof wordObj === "object") {
    rawAudioUrl = wordObj.audioUrl || wordObj.audio_url || "";
    if (!rawAudioUrl && wordObj.audio) {
      if (typeof wordObj.audio === "string") {
        rawAudioUrl = wordObj.audio;
      } else if (typeof wordObj.audio === "object") {
        rawAudioUrl =
          wordObj.audio.default || wordObj.audio.female || wordObj.audio.male || "";
      }
    }
  }

  const lang = options.lang || getSpeechLangCode(effectiveLangId);
  const rawMeaning = extractMeaningText(wordObj);
  const meaningToSpeak = cleanMeaningForSpeech(rawMeaning);
  const speakMeaning =
    includeMeaning !== undefined
      ? Boolean(includeMeaning && meaningToSpeak)
      : shouldSpeakMeaningByDefault(text, meaningToSpeak, effectiveLangId, wordObj);
  const meaningLang = speakMeaning
    ? resolveMeaningSpeechLang(meaningToSpeak, effectiveLangId, wordObj)
    : "en-US";

  let meaningScheduled = false;
  const scheduleMeaningPronunciation = () => {
    if (!speakMeaning || meaningScheduled || seq !== _pronunciationSeq) return;
    meaningScheduled = true;
    clearPendingMeaningTimer();
    _meaningTimerId = setTimeout(() => {
      _meaningTimerId = null;
      if (seq !== _pronunciationSeq) return;
      speakTts(meaningToSpeak, { lang: meaningLang, rate });
    }, 140);
  };

  let fallbackCalled = false;
  const fallback = () => {
    if (fallbackCalled || seq !== _pronunciationSeq) return;
    fallbackCalled = true;
    playSynthesizedConfirmTone();
    onFallback?.();
    const started = speakTts(text, {
      lang,
      rate,
      onEnd: scheduleMeaningPronunciation,
      onError: scheduleMeaningPronunciation,
    });
    if (!started) {
      scheduleMeaningPronunciation();
    }
  };

  if (rawAudioUrl) {
    const playTargetAudio = (targetUrl) => {
      if (soundManager && typeof soundManager.playWordAudio === "function") {
        soundManager.init?.();
        soundManager.playWordAudio(targetUrl, fallback, scheduleMeaningPronunciation);
      } else {
        playAudioUrlWithSharedPool(targetUrl, fallback, scheduleMeaningPronunciation);
      }
      if (speakMeaning) {
        _meaningTimerId = setTimeout(() => {
          if (!meaningScheduled && !fallbackCalled && seq === _pronunciationSeq) {
            scheduleMeaningPronunciation();
          }
        }, 2300);
      }
    };

    const cachedBlobUrl = getCachedAudioUrlSync(rawAudioUrl);
    if (cachedBlobUrl) {
      playTargetAudio(cachedBlobUrl);
      return;
    }
    const { isSlowNetwork } = getNetworkConnectionProfile();
    if (isSlowNetwork) {
      fallback();
      return;
    }
    const resolvedUrl = resolveDataUrl(rawAudioUrl);
    playTargetAudio(resolvedUrl);
  } else {
    fallback();
  }
}
