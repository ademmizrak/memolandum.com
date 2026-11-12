/**
 * useAnalytics — Memolandum Conversion & Event Tracking Hook
 *
 * Google Ads ve GA4 için tüm özel conversion event'leri bu dosyada tanımlıdır.
 * GA4 yüklü değilse (NEXT_PUBLIC_GA4_ID eksik) tüm fonksiyonlar sessizce no-op olur.
 *
 * KULLANIM:
 *   const { trackSignUp, trackGameStart, trackTranslation } = useAnalytics();
 *   trackSignUp("google"); // kullanıcı Google ile kayıt oldu
 *
 * GOOGLE ADS CONVERSION LABELS:
 *   İleride Google Ads konsolundan alacağınız label'ları buraya ekleyin:
 *   CONVERSION_LABELS.signup = "AW-XXXX/LABEL"
 */

import { useCallback } from "react";
import {
  getNetworkConnectionProfile,
  resetAudioFallbackFlag,
  wasAudioFallbackUsed,
} from "../lib/contentCdn";
import {
  getLastMeasuredFps,
  isLegacyAndroidOrLowMemDevice,
  isLowSpecDeviceActive,
  onLowSpecModeTriggered,
} from "../lib/performance/canvasFpsGuard";
import { isRtlUiSession } from "../lib/i18n/canvasTextHelper";

// ─── Google Ads Conversion Label'ları (Google Ads konsolundan alınır) ─────────
// Format: "AW-CONVERSION_ID/CONVERSION_LABEL"
const CONVERSION_LABELS = {
  signup:        process.env.NEXT_PUBLIC_ADS_CONV_SIGNUP        || null, // e.g. "AW-123456789/AbCdEfGhIj"
  game_start:    process.env.NEXT_PUBLIC_ADS_CONV_GAME_START    || null,
  game_complete: process.env.NEXT_PUBLIC_ADS_CONV_GAME_COMPLETE || null,
  premium:       process.env.NEXT_PUBLIC_ADS_CONV_PREMIUM       || null,
};

// ─── Güvenli gtag wrapper ──────────────────────────────────────────────────────
function getActiveUiLocale() {
  if (typeof window === "undefined") return "tr";
  try {
    return (
      document?.documentElement?.lang ||
      localStorage.getItem("memolandum-ui-locale") ||
      "tr"
    );
  } catch (_) {
    return "tr";
  }
}

/**
 * Faz 3: Dil Çifti ve RTL Oturum Telemetri Çözümleyicisi
 * (`ui_lang`, `target_lang`, `is_rtl_session`)
 */
export function resolveLanguageTelemetryContext(rawLangPair = "") {
  const uiLang = getActiveUiLocale();
  const raw = String(rawLangPair || _activeLevelSession.langPair || "").toLowerCase();
  let targetLang = "en";

  if (raw.includes("de_") || raw.startsWith("de-")) targetLang = "de";
  else if (raw.includes("fr_") || raw.startsWith("fr-")) targetLang = "fr";
  else if (raw.includes("es_") || raw.startsWith("es-")) targetLang = "es";
  else if (raw.includes("ru_") || raw.startsWith("ru-")) targetLang = "ru";
  else if (raw.includes("it_") || raw.startsWith("it-")) targetLang = "it";
  else if (raw.includes("brpt_") || raw.startsWith("pt-")) targetLang = "pt";
  else if (raw.includes("ko_") || raw.startsWith("ko-")) targetLang = "ko";
  else if (raw.includes("jap_") || raw.startsWith("ja-")) targetLang = "ja";
  else if (raw.includes("zh_") || raw.startsWith("zh-")) targetLang = "zh";
  else if (raw.includes("el_") || raw.startsWith("el-")) targetLang = "el";
  else if (raw.includes("ar_tr") || raw === "ar-tr") targetLang = "ar";
  else if (raw.includes("ar_en") || raw === "ar-en" || raw === "en-ar") targetLang = "en";

  const isRtlSession =
    uiLang === "ar" ||
    isRtlUiSession() ||
    raw.includes("arabic") ||
    raw.startsWith("ar-") ||
    raw.endsWith("-ar");

  return {
    ui_lang: uiLang,
    target_lang: targetLang,
    is_rtl_session: Boolean(isRtlSession),
  };
}

// Faz 4: Sayfa kapanırken / sekme değiştirirken veri kaybını önleyen zorunlu Beacon event'leri
export const BEACON_CRITICAL_EVENTS = new Set([
  "level_start",
  "first_word_solved",
  "level_end",
  "level_abandoned",
  "canvas_ready",
  "tutorial_complete",
]);

export function fireAnalyticsEvent(eventName, params = {}) {
  try {
    const net = getNetworkConnectionProfile();
    const langCtx = resolveLanguageTelemetryContext(
      params.character || params.item_category || _activeLevelSession.langPair || ""
    );
    const useBeacon = BEACON_CRITICAL_EVENTS.has(eventName);
    const targetWords = Math.max(1, Number(_activeLevelSession.targetWordCount) || 3);
    const solvedWords = Math.max(0, Number(_activeLevelSession.wordsSolvedCount) || 0);
    const payload = {
      ui_locale: langCtx.ui_lang,
      ui_lang: langCtx.ui_lang,
      target_lang: langCtx.target_lang,
      is_rtl_session: langCtx.is_rtl_session,
      is_warmup_wave: Boolean(targetWords <= 3),
      words_progress: `${solvedWords}/${targetWords}`,
      words_progress_ratio: Number((solvedWords / targetWords).toFixed(2)),
      audio_fallback_used: wasAudioFallbackUsed(),
      effective_connection_type: net.effectiveType || "4g",
      low_spec_triggered: isLowSpecDeviceActive(),
      ...(useBeacon ? { transport_type: "beacon" } : {}),
      ...params,
    };

    if (typeof window !== "undefined" && typeof window._memoGtag === "function") {
      window._memoGtag("event", eventName, payload);
    }
    return payload;
  } catch (_) {
    // Sessizce yut — mevcut yapı bozulmaz
    return null;
  }
}

function fireEvent(eventName, params = {}) {
  return fireAnalyticsEvent(eventName, params);
}

// Low-Spec cihaz modu tetiklendiğinde otomatik GA4 telemetrisi gönder
if (typeof window !== "undefined") {
  onLowSpecModeTriggered((measuredFps) => {
    fireAnalyticsEvent("low_spec_mode_activated", {
      level_session_id: _activeLevelSession.levelSessionId || "",
      measured_fps: measuredFps,
      level_name: _activeLevelSession.gameSlug || "unknown",
      character: _activeLevelSession.langPair || "",
      level_id: _activeLevelSession.levelId || "",
    });
  });
}

// ─── Faz 1 & Faz 4: Aktif Seviye Hunisi & Idempotency Guard ──────────────────
const _completedLevelSessionIds = new Set();

function generateLevelSessionId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `ls_${ts}_${rnd}`;
}

function hasSessionEndedIdempotently(sessionId) {
  if (!sessionId) return false;
  if (_completedLevelSessionIds.has(sessionId)) return true;
  if (typeof window !== "undefined") {
    try {
      return window.sessionStorage?.getItem(`mm_lvl_end_${sessionId}`) === "1";
    } catch {
      return false;
    }
  }
  return false;
}

function markSessionEndedIdempotently(sessionId) {
  if (!sessionId) return;
  _completedLevelSessionIds.add(sessionId);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage?.setItem(`mm_lvl_end_${sessionId}`, "1");
    } catch {
      /* ignore */
    }
  }
}

const _activeLevelSession = {
  levelSessionId: "",
  gameSlug: "",
  langPair: "",
  levelId: "",
  startedAtMs: 0,
  targetWordCount: 3,
  wordsSolvedCount: 0,
  solvedWordIds: new Set(),
  canvasReadyFired: false,
  firstWordSolvedFired: false,
  levelEndFired: false,
  abandonedFired: false,
};

export function computeDropOffStage(session = _activeLevelSession) {
  if (!session.canvasReadyFired) return "loading_assets";
  if (!session.firstWordSolvedFired && (Number(session.wordsSolvedCount) || 0) === 0) {
    return "waiting_first_input";
  }
  return "mid_game";
}

export function getActiveLevelSessionSnapshot() {
  const targetWords = Math.max(1, Number(_activeLevelSession.targetWordCount) || 3);
  const solvedWords = Math.max(0, Number(_activeLevelSession.wordsSolvedCount) || 0);
  return {
    levelSessionId: _activeLevelSession.levelSessionId,
    gameSlug: _activeLevelSession.gameSlug,
    langPair: _activeLevelSession.langPair,
    levelId: _activeLevelSession.levelId,
    startedAtMs: _activeLevelSession.startedAtMs,
    targetWordCount: _activeLevelSession.targetWordCount,
    wordsSolvedCount: _activeLevelSession.wordsSolvedCount,
    isWarmupWave: Boolean(targetWords <= 3),
    wordsProgress: `${solvedWords}/${targetWords}`,
    wordsProgressRatio: Number((solvedWords / targetWords).toFixed(2)),
    audioFallbackUsed: wasAudioFallbackUsed(),
    canvasReadyFired: _activeLevelSession.canvasReadyFired,
    firstWordSolvedFired: _activeLevelSession.firstWordSolvedFired,
    levelEndFired: _activeLevelSession.levelEndFired,
    abandonedFired: _activeLevelSession.abandonedFired,
    dropOffStage: computeDropOffStage(_activeLevelSession),
  };
}

export function beginLevelSessionAnalytics({
  gameSlug = "",
  langPair = "",
  levelId = "",
  targetWordCount = 3,
  customSessionId = "",
} = {}) {
  resetAudioFallbackFlag();
  _activeLevelSession.levelSessionId = customSessionId || generateLevelSessionId();
  _activeLevelSession.gameSlug = gameSlug || _activeLevelSession.gameSlug || "";
  _activeLevelSession.langPair = langPair || _activeLevelSession.langPair || "";
  _activeLevelSession.levelId = levelId || _activeLevelSession.levelId || "";
  _activeLevelSession.startedAtMs = Date.now();
  _activeLevelSession.targetWordCount = Math.max(1, Number(targetWordCount) || 3);
  _activeLevelSession.wordsSolvedCount = 0;
  _activeLevelSession.solvedWordIds = new Set();
  _activeLevelSession.canvasReadyFired = false;
  _activeLevelSession.firstWordSolvedFired = false;
  _activeLevelSession.levelEndFired = false;
  _activeLevelSession.abandonedFired = false;
  return _activeLevelSession.levelSessionId;
}

export function setActiveLevelTargetWordCount(count) {
  const n = Number(count);
  if (Number.isFinite(n) && n > 0) {
    _activeLevelSession.targetWordCount = n;
  }
}

/**
 * Huni Teşhis 1: `canvas_ready` — Canvas ilk frame'i çizdiğinde ateşlenir.
 */
export function fireCanvasReadyAnalytics(
  gameSlug = "",
  langPair = "",
  levelId = "",
  customLoadDurationMs = null
) {
  if (_activeLevelSession.canvasReadyFired) return false;
  _activeLevelSession.canvasReadyFired = true;

  const now = Date.now();
  const loadDurationMs =
    customLoadDurationMs != null && Number.isFinite(Number(customLoadDurationMs))
      ? Math.max(0, Math.round(Number(customLoadDurationMs)))
      : _activeLevelSession.startedAtMs > 0
      ? Math.max(1, now - _activeLevelSession.startedAtMs)
      : 0;

  fireEvent("canvas_ready", {
    level_session_id: _activeLevelSession.levelSessionId || generateLevelSessionId(),
    level_name: gameSlug || _activeLevelSession.gameSlug || "unknown",
    character: langPair || _activeLevelSession.langPair || "",
    level_id: levelId || _activeLevelSession.levelId || "",
    load_duration_ms: loadDurationMs,
    target_word_count: _activeLevelSession.targetWordCount,
    transport_type: "beacon",
  });
  return true;
}

/**
 * Faz 4: Standart `level_end` telemetri şeması üreticisi
 */
export function buildLevelEndPayload({
  gameSlug = "",
  score = 100,
  langPair = "",
  levelId = "",
  triggerReason = "last_word_solved",
} = {}) {
  const resolvedSlug = gameSlug || _activeLevelSession.gameSlug || "quiz";
  const resolvedLang = langPair || _activeLevelSession.langPair || "";
  const resolvedLevel = levelId || _activeLevelSession.levelId || "";
  const sessionId = _activeLevelSession.levelSessionId || generateLevelSessionId();
  const timeElapsedMs =
    _activeLevelSession.startedAtMs > 0
      ? Math.max(1, Date.now() - _activeLevelSession.startedAtMs)
      : 0;
  const timeSpentSec = Math.max(1, Math.round(timeElapsedMs / 1000));
  const langCtx = resolveLanguageTelemetryContext(resolvedLang);
  const net = getNetworkConnectionProfile();

  const targetWords = Math.max(1, Number(_activeLevelSession.targetWordCount) || 3);
  const solvedWords = Math.max(0, Number(_activeLevelSession.wordsSolvedCount) || 0);

  return {
    level_session_id: sessionId,
    level_name: resolvedSlug,
    character: resolvedLang,
    level_id: resolvedLevel,
    success: true,
    score: Number(score) || 100,
    is_warmup_wave: Boolean(targetWords <= 3),
    words_solved_count: solvedWords,
    target_word_count: targetWords,
    words_completed: `${solvedWords}/${targetWords}`,
    words_progress: `${solvedWords}/${targetWords}`,
    words_progress_ratio: Number((solvedWords / targetWords).toFixed(2)),
    audio_fallback_used: wasAudioFallbackUsed(),
    time_elapsed_ms: timeElapsedMs,
    time_spent_sec: timeSpentSec,
    avg_fps: getLastMeasuredFps(),
    trigger_reason: triggerReason,
    ui_lang: langCtx.ui_lang,
    target_lang: langCtx.target_lang,
    is_rtl_session: langCtx.is_rtl_session,
    effective_connection_type: net.effectiveType || "4g",
    low_spec_triggered: isLowSpecDeviceActive(),
    transport_type: "beacon",
    value: 5,
    currency: "TRY",
  };
}

/**
 * Garantili `level_end` Tetiklemesi (Idempotent / Deduplicated by `level_session_id`):
 * Seviyeyi bitiren son kelimenin doğru bilindiği milisaniyede (kutlama ekranı/animasyonu
 * daha başlamadan hemen önce) veya zafer ekranı açıldığı anda yalnızca 1 kez ateşlenir.
 */
export function fireGuaranteedLevelEnd({
  gameSlug = "",
  score = 100,
  langPair = "",
  levelId = "",
  triggerReason = "last_word_solved",
  onLevelCompletedCallback = null,
} = {}) {
  if (!_activeLevelSession.levelSessionId) {
    _activeLevelSession.levelSessionId = generateLevelSessionId();
  }
  const sessionId = _activeLevelSession.levelSessionId;

  // Idempotency Guard: Aynı level_session_id için asla 2. kez ateşleme
  if (_activeLevelSession.levelEndFired || hasSessionEndedIdempotently(sessionId)) {
    return false;
  }
  _activeLevelSession.levelEndFired = true;
  markSessionEndedIdempotently(sessionId);

  const payload = buildLevelEndPayload({
    gameSlug,
    score,
    langPair,
    levelId,
    triggerReason,
  });

  fireEvent("level_end", payload);

  fireEvent("tutorial_complete", {
    level_session_id: sessionId,
    content_type: "game",
    item_id: payload.level_name,
    item_category: payload.character,
    transport_type: "beacon",
    value: 5,
    currency: "TRY",
  });

  fireConversion(CONVERSION_LABELS.game_complete || CONVERSION_LABELS.game_start, 5, "TRY");

  if (typeof onLevelCompletedCallback === "function") {
    try {
      onLevelCompletedCallback();
    } catch (_) {
      /* ignore */
    }
  }
  return true;
}

/**
 * Huni Teşhis 2: `first_word_solved` + Son Kelimede Garantili `level_end`
 */
export function recordWordSolvedForFunnel({
  wordId = "",
  isCorrect = false,
  gameSlug = "",
  langPair = "",
  levelId = "",
  onFinalWordSolved = null,
} = {}) {
  if (!isCorrect) return;

  const cleanWordId = String(wordId || "").trim().toLowerCase();
  if (cleanWordId && _activeLevelSession.solvedWordIds.has(cleanWordId)) {
    return;
  }
  if (cleanWordId) {
    _activeLevelSession.solvedWordIds.add(cleanWordId);
  }

  _activeLevelSession.wordsSolvedCount += 1;

  const resolvedSlug = gameSlug || _activeLevelSession.gameSlug || "quiz";
  const resolvedLang = langPair || _activeLevelSession.langPair || "";
  const resolvedLevel = levelId || _activeLevelSession.levelId || "";

  if (!_activeLevelSession.firstWordSolvedFired) {
    _activeLevelSession.firstWordSolvedFired = true;
    const timeToFirstSolveMs =
      _activeLevelSession.startedAtMs > 0
        ? Math.max(1, Date.now() - _activeLevelSession.startedAtMs)
        : 0;

    fireEvent("first_word_solved", {
      level_session_id: _activeLevelSession.levelSessionId || generateLevelSessionId(),
      level_name: resolvedSlug,
      character: resolvedLang,
      level_id: resolvedLevel,
      time_to_first_solve_ms: timeToFirstSolveMs,
      target_word_count: _activeLevelSession.targetWordCount,
      transport_type: "beacon",
      value: 2,
      currency: "TRY",
    });
  }

  // Seviyeyi bitiren son kelime doğru bilindiği milisaniyede garantili level_end ateşle!
  if (
    _activeLevelSession.wordsSolvedCount >= _activeLevelSession.targetWordCount &&
    !_activeLevelSession.levelEndFired
  ) {
    fireGuaranteedLevelEnd({
      gameSlug: resolvedSlug,
      score: _activeLevelSession.wordsSolvedCount * 100,
      langPair: resolvedLang,
      levelId: resolvedLevel,
      triggerReason: "last_word_solved",
      onLevelCompletedCallback: onFinalWordSolved,
    });
  }
}

/**
 * Faz 4: Kayıpsız Oturum Özeti (Drop-off Diagnostic Payload)
 */
export function buildLevelAbandonedPayload(reason = "visibilitychange") {
  const timeElapsedMs =
    _activeLevelSession.startedAtMs > 0
      ? Math.max(0, Date.now() - _activeLevelSession.startedAtMs)
      : 0;
  const timeSpentSec = Math.max(0, Math.round(timeElapsedMs / 1000));
  const langCtx = resolveLanguageTelemetryContext(_activeLevelSession.langPair);
  const dropOffStage = computeDropOffStage(_activeLevelSession);
  const targetWords = Math.max(1, Number(_activeLevelSession.targetWordCount) || 3);
  const solvedWords = Math.max(0, Number(_activeLevelSession.wordsSolvedCount) || 0);

  return {
    level_session_id: _activeLevelSession.levelSessionId || "uninitialized",
    level_name: _activeLevelSession.gameSlug || "unknown",
    character: _activeLevelSession.langPair || "",
    level_id: _activeLevelSession.levelId || "",
    drop_off_stage: dropOffStage,
    is_warmup_wave: Boolean(targetWords <= 3),
    words_completed: `${solvedWords}/${targetWords}`,
    words_progress: `${solvedWords}/${targetWords}`,
    words_progress_ratio: Number((solvedWords / targetWords).toFixed(2)),
    audio_fallback_used: wasAudioFallbackUsed(),
    words_solved_count: solvedWords,
    target_word_count: targetWords,
    time_elapsed_ms: timeElapsedMs,
    time_spent_sec: timeSpentSec,
    avg_fps: getLastMeasuredFps(),
    ui_lang: langCtx.ui_lang,
    target_lang: langCtx.target_lang,
    is_rtl_session: langCtx.is_rtl_session,
    abandon_reason: reason,
    transport_type: "beacon",
  };
}

/**
 * Huni Teşhis 3: `level_abandoned` — Kullanıcı `level_start` sonrası `level_end`
 * görmeden sayfadan çıkarsa (`visibilitychange` === 'hidden' veya `pagehide`) ateşlenir.
 */
export function fireLevelAbandonedIfIncomplete(reason = "visibilitychange") {
  if (
    !_activeLevelSession.startedAtMs ||
    _activeLevelSession.levelEndFired ||
    _activeLevelSession.abandonedFired ||
    hasSessionEndedIdempotently(_activeLevelSession.levelSessionId)
  ) {
    return null;
  }

  _activeLevelSession.abandonedFired = true;
  const abandonPayload = buildLevelAbandonedPayload(reason);
  fireEvent("level_abandoned", abandonPayload);
  return abandonPayload;
}

const _reportedRuntimeErrors = new Set();
const MAX_RUNTIME_ERRORS_PER_SESSION = 3;

export function resetRuntimeErrorQuotaForTest() {
  _reportedRuntimeErrors.clear();
}

/**
 * Eski Android WebView ve istemci tarafı çalışma zamanı (runtime) hatalarını
 * kota korumalı (oturum başına en fazla 3 benzersiz hata) olarak GA4 beacon'a iletir.
 */
export function reportClientRuntimeError({
  message = "",
  source = "",
  lineno = 0,
  colno = 0,
  errorType = "runtime_error",
} = {}) {
  const cleanMsg = String(message || "unknown_error").trim().slice(0, 140);
  if (!cleanMsg) return null;
  if (_reportedRuntimeErrors.size >= MAX_RUNTIME_ERRORS_PER_SESSION) return null;
  if (_reportedRuntimeErrors.has(cleanMsg)) return null;
  _reportedRuntimeErrors.add(cleanMsg);

  const langCtx = resolveLanguageTelemetryContext(_activeLevelSession.langPair);
  const payload = {
    level_session_id: _activeLevelSession.levelSessionId || "uninitialized",
    level_name: _activeLevelSession.gameSlug || "global",
    character: _activeLevelSession.langPair || "",
    level_id: _activeLevelSession.levelId || "",
    error_type: String(errorType || "runtime_error").slice(0, 40),
    error_message: cleanMsg,
    error_source: String(source || "").slice(-80),
    error_line: `${Number(lineno) || 0}:${Number(colno) || 0}`,
    ui_lang: langCtx.ui_lang,
    is_legacy_android: isLegacyAndroidOrLowMemDevice(),
    low_spec_triggered: isLowSpecDeviceActive(),
    transport_type: "beacon",
  };

  fireEvent("client_runtime_error", payload);
  return payload;
}

function fireConversion(label, value = 0, currency = "TRY") {
  if (!label) return;
  try {
    if (typeof window !== "undefined" && typeof window._memoGtag === "function") {
      window._memoGtag("event", "conversion", {
        send_to: label,
        value,
        currency,
      });
    }
  } catch (_) {
    // Sessizce yut
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnalytics() {

  /** Kullanıcı kayıt oldu */
  const trackSignUp = useCallback((method = "email") => {
    fireEvent("sign_up", { method, value: 25, currency: "TRY" });
    fireConversion(CONVERSION_LABELS.signup, 25, "TRY");
    // GA4 önerilen event
    fireEvent("generate_lead", { method, value: 25, currency: "TRY" });
  }, []);

  /** Kullanıcı giriş yaptı */
  const trackLogin = useCallback((method = "email") => {
    fireEvent("login", { method });
  }, []);

  /** Oyun başlatıldı */
  const trackGameStart = useCallback((gameSlug, langPair = "", levelId = "", targetWordCount = 3) => {
    const sessionId = beginLevelSessionAnalytics({
      gameSlug,
      langPair,
      levelId,
      targetWordCount,
    });
    fireEvent("level_start", {
      level_session_id: sessionId,
      level_name: gameSlug,
      character: langPair,
      level_id: levelId,
      target_word_count: _activeLevelSession.targetWordCount,
      transport_type: "beacon",
      value: 1,
      currency: "TRY",
    });
    fireEvent("select_content", {
      level_session_id: sessionId,
      content_type: "game",
      item_id: gameSlug,
      item_category: langPair,
    });
    fireConversion(CONVERSION_LABELS.game_start, 1, "TRY");
  }, []);

  /** Oyun tamamlandı (Garantili ve tekil level_end tetiklemesi) */
  const trackGameComplete = useCallback((gameSlug, score = 0, langPair = "", levelId = "") => {
    fireGuaranteedLevelEnd({
      gameSlug,
      score,
      langPair,
      levelId,
      triggerReason: "next_level_or_complete_cta",
    });
  }, []);

  /** Huni Teşhis: Canvas ilk frame'i çizdiğinde */
  const trackCanvasReady = useCallback((gameSlug = "", loadDurationMs = null, langPair = "", levelId = "") => {
    fireCanvasReadyAnalytics(gameSlug, langPair, levelId, loadDurationMs);
  }, []);

  /** Huni Teşhis: İlk kelime çözüldüğünde */
  const trackFirstWordSolved = useCallback((wordId = "", gameSlug = "", langPair = "", levelId = "") => {
    recordWordSolvedForFunnel({
      wordId,
      isCorrect: true,
      gameSlug,
      langPair,
      levelId,
    });
  }, []);

  /** Huni Teşhis: Seviye tamamlanmadan terk edildiğinde */
  const trackLevelAbandoned = useCallback((reason = "visibilitychange") => {
    fireLevelAbandonedIfIncomplete(reason);
  }, []);

  /** Anlık çeviri kullanıldı */
  const trackTranslation = useCallback((langPair = "") => {
    fireEvent("search", {
      search_term: "translate",
      content_type: "translation",
      item_category: langPair,
      value: 3,
      currency: "TRY",
    });
  }, []);

  /** Kelime kasasına kelime eklendi */
  const trackVaultAdd = useCallback((word = "", langPair = "") => {
    fireEvent("add_to_wishlist", {
      item_name: word,
      item_category: langPair,
      item_list_name: "word_vault",
      value: 2,
      currency: "TRY",
    });
  }, []);

  /** Premium satın alma başlatıldı */
  const trackPremiumStart = useCallback((plan = "translation_pack") => {
    fireEvent("begin_checkout", {
      item_name: plan,
      value: 29.99,
      currency: "TRY",
    });
  }, []);

  /** Premium satın alma tamamlandı */
  const trackPremiumPurchase = useCallback((plan = "translation_pack", value = 29.99) => {
    fireEvent("purchase", {
      transaction_id: `memo_${Date.now()}`,
      value,
      currency: "TRY",
      items: [{ item_id: plan, item_name: plan, price: value }],
    });
    fireConversion(CONVERSION_LABELS.premium, value, "TRY");
  }, []);

  /** Dil profili oluşturuldu */
  const trackProfileCreate = useCallback((langPair = "") => {
    fireEvent("tutorial_complete", {
      item_category: langPair,
    });
  }, []);

  /** Sayfa görüntülendi (manuel — SPA yönlendirmeleri için) */
  const trackPageView = useCallback((path = "", title = "") => {
    fireEvent("page_view", {
      page_path: path || window?.location?.pathname,
      page_title: title || document?.title,
    });
  }, []);

  return {
    trackSignUp,
    trackLogin,
    trackGameStart,
    trackGameComplete,
    trackCanvasReady,
    trackFirstWordSolved,
    trackLevelAbandoned,
    trackTranslation,
    trackVaultAdd,
    trackPremiumStart,
    trackPremiumPurchase,
    trackProfileCreate,
    trackPageView,
  };
}
