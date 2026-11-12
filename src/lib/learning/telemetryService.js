import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import {
  buildLevelAbandonedPayload,
  buildLevelEndPayload,
  computeDropOffStage,
  fireCanvasReadyAnalytics,
  fireGuaranteedLevelEnd,
  fireLevelAbandonedIfIncomplete,
  getActiveLevelSessionSnapshot,
  recordWordSolvedForFunnel,
  resolveLanguageTelemetryContext,
} from "../../hooks/useAnalytics";
import { getNetworkConnectionProfile, wasAudioFallbackUsed } from "../contentCdn";
import { getLastMeasuredFps, isLowSpecDeviceActive } from "../performance/canvasFpsGuard";
import { ABUSE_POLICIES } from "../security/abuseGuard";
import { checkRateLimit, consumeRateLimit } from "../security/rateLimit";

/**
 * Faz 4: Denial-of-Wallet & Kota Koruması
 * Tek bir oturumda istemcinin gönderebileceği maksimum telemetri event sayısı.
 * Hatalı sonsuz döngülerin Firestore veya Cloud Functions kotasını tüketmesini %100 engeller.
 */
export const MAX_TELEMETRY_EVENTS_PER_SESSION = 50;
const EXIT_BUFFER_STORAGE_KEY = "mm_telemetry_exit_buffer_v1";

let _sessionTelemetryWriteCount = 0;
let _exitListenersAttached = false;

export function getSessionTelemetryWriteCount() {
  return _sessionTelemetryWriteCount;
}

export function resetSessionTelemetryQuotaForTest() {
  _sessionTelemetryWriteCount = 0;
}

/**
 * `abuseGuard.js` ve `rateLimit.js` kurallarıyla uyumlu telemetri yazım kotası kontrolü.
 */
export function canWriteTelemetryEvent(uid = null) {
  if (_sessionTelemetryWriteCount >= MAX_TELEMETRY_EVENTS_PER_SESSION) {
    return false;
  }
  const policy = uid
    ? ABUSE_POLICIES.telemetry_write?.user
    : ABUSE_POLICIES.telemetry_write?.guest;
  const max = policy?.max || (uid ? 120 : 60);
  const windowMs = policy?.windowMs || 60 * 60 * 1000;
  const bucketId = uid ? `u:${uid}` : "guest";

  const check = checkRateLimit("telemetry_write", { max, windowMs, bucketId });
  if (!check.ok) {
    return false;
  }

  _sessionTelemetryWriteCount += 1;
  consumeRateLimit("telemetry_write", { max, windowMs, bucketId });
  return true;
}

/**
 * Tracks user learning action telemetry to Firestore for 3.0 AI Model training (Append-Only).
 * Runs asynchronously and logs to Firestore if the user is authenticated and within Denial-of-Wallet quota.
 *
 * @param {string} uid - User ID (if authenticated)
 * @param {Object} telemetryData - Telemetry payload
 */
export async function trackTelemetryToFirestore(uid, telemetryData) {
  if (!canWriteTelemetryEvent(uid)) {
    return { skipped: true, reason: "quota_exceeded" };
  }

  const net = getNetworkConnectionProfile();
  const langCtx = resolveLanguageTelemetryContext(
    telemetryData?.langPair || telemetryData?.language || telemetryData?.character || ""
  );
  const snapshot = getActiveLevelSessionSnapshot();

  const enrichedPayload = {
    ...telemetryData,
    level_session_id:
      telemetryData?.level_session_id || snapshot.levelSessionId || "uninitialized",
    is_warmup_wave:
      telemetryData?.is_warmup_wave != null
        ? Boolean(telemetryData.is_warmup_wave)
        : Boolean(snapshot.isWarmupWave),
    words_progress:
      telemetryData?.words_progress || snapshot.wordsProgress || "0/3",
    words_progress_ratio:
      telemetryData?.words_progress_ratio != null
        ? Number(telemetryData.words_progress_ratio)
        : Number(snapshot.wordsProgressRatio || 0),
    audio_fallback_used:
      telemetryData?.audio_fallback_used != null
        ? Boolean(telemetryData.audio_fallback_used)
        : Boolean(wasAudioFallbackUsed()),
    ui_lang: langCtx.ui_lang,
    target_lang: langCtx.target_lang,
    is_rtl_session: langCtx.is_rtl_session,
    avg_fps: getLastMeasuredFps(),
    effective_connection_type: net.effectiveType || "4g",
    low_spec_triggered: isLowSpecDeviceActive(),
  };

  if (!uid) {
    // If guest, we do not write to Firestore under /users/{uid}/telemetry
    // But we log locally for validation
    console.log("[Telemetry Service] Guest user action recorded locally:", enrichedPayload);
    return { skipped: false, mode: "local_guest", payload: enrichedPayload };
  }

  try {
    // Append-Only: Benzersiz logId ile yalnızca yeni doküman oluşturulur (setDoc)
    const logId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const telemetryRef = doc(db, "users", uid, "telemetry", logId);
    await setDoc(telemetryRef, {
      ...enrichedPayload,
      timestamp: new Date().toISOString(),
    });
    return { skipped: false, mode: "firestore", logId, payload: enrichedPayload };
  } catch (err) {
    console.error("[Telemetry Service] Error saving telemetry:", err);
    return { skipped: true, reason: "firestore_error" };
  }
}

/**
 * Faz 4: Kayıpsız Oturum Özeti ve Tampon Boşaltma (`visibilitychange` & `pagehide` Flush)
 *
 * Kullanıcı `level_start` tetiklenmiş ancak henüz `level_end` olmamış bir oyundan çıkarsa:
 * - `drop_off_stage`: `'loading_assets'` | `'waiting_first_input'` | `'mid_game'`
 * - `words_completed`: Çözülen kelime sayısı (ör. `"1/3"`)
 * - `time_elapsed_ms`: Oyunda geçen net süre
 * - `avg_fps`: O ana kadar ölçülen ortalama Canvas FPS değeri
 * - `ui_lang`: Aktif arayüz dili (ör. `'ar'`, `'tr'`, `'en'`)
 * verilerini `navigator.sendBeacon` (veya `fetch(..., { keepalive: true })`) ve Append-Only
 * telemetri katmanına yazar.
 */
export function flushIncompleteSessionOnExit(reason = "visibilitychange", uid = null) {
  const abandonPayload = fireLevelAbandonedIfIncomplete(reason);
  if (!abandonPayload) return null;

  const diagnosticRecord = {
    actionType: "level_abandoned_diagnostic",
    level_session_id: abandonPayload.level_session_id,
    drop_off_stage: abandonPayload.drop_off_stage,
    is_warmup_wave: abandonPayload.is_warmup_wave,
    words_completed: abandonPayload.words_completed,
    words_progress: abandonPayload.words_progress,
    words_progress_ratio: abandonPayload.words_progress_ratio,
    audio_fallback_used: abandonPayload.audio_fallback_used,
    words_solved_count: abandonPayload.words_solved_count,
    target_word_count: abandonPayload.target_word_count,
    time_elapsed_ms: abandonPayload.time_elapsed_ms,
    avg_fps: abandonPayload.avg_fps,
    ui_lang: abandonPayload.ui_lang,
    target_lang: abandonPayload.target_lang,
    is_rtl_session: abandonPayload.is_rtl_session,
    level_name: abandonPayload.level_name,
    character: abandonPayload.character,
    level_id: abandonPayload.level_id,
    abandon_reason: reason,
    timestamp: new Date().toISOString(),
  };

  // 1. Yerel Append-Only çıkış tamponuna (son 15 kayıt) yaz
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(
        window.localStorage?.getItem(EXIT_BUFFER_STORAGE_KEY) || "[]"
      );
      const next = Array.isArray(existing) ? existing.slice(-14) : [];
      next.push(diagnosticRecord);
      window.localStorage?.setItem(EXIT_BUFFER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }

    // 2. Özel beacon endpoint tanımlıysa `navigator.sendBeacon` veya `fetch(..., { keepalive: true })` ile ilet
    const beaconUrl =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TELEMETRY_BEACON_URL : "";
    if (beaconUrl) {
      try {
        const blob = new Blob([JSON.stringify(diagnosticRecord)], {
          type: "application/json",
        });
        const sent =
          typeof navigator !== "undefined" &&
          typeof navigator.sendBeacon === "function" &&
          navigator.sendBeacon(beaconUrl, blob);
        if (!sent && typeof fetch === "function") {
          fetch(beaconUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(diagnosticRecord),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* ignore network errors on unload */
      }
    }
  }

  // 3. Kota dahilindeyse Append-Only Firestore telemetrisine de ilet
  if (uid) {
    trackTelemetryToFirestore(uid, diagnosticRecord).catch(() => {});
  }

  return diagnosticRecord;
}

/**
 * Mobil tarayıcılarda (iOS Safari ve Android Chrome) `beforeunload` güvenilir çalışmadığı için
 * `visibilitychange` (durum `hidden` olduğunda) ve `pagehide` dinleyicilerini tekil olarak bağlar.
 */
export function registerExitTelemetryListeners(getUidFn = null) {
  if (_exitListenersAttached || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  _exitListenersAttached = true;

  const resolveUid = () => {
    try {
      return typeof getUidFn === "function" ? getUidFn() : null;
    } catch {
      return null;
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushIncompleteSessionOnExit("visibilitychange", resolveUid());
    }
  });

  window.addEventListener("pagehide", () => {
    flushIncompleteSessionOnExit("pagehide", resolveUid());
  });
}

/**
 * Faz 1–4 Huni Teşhis (Funnel Diagnostic) & Garantili `level_end` köprüsü.
 */
export const funnelTelemetry = {
  onCanvasReady(gameSlug, langPair, levelId, loadDurationMs = null) {
    return fireCanvasReadyAnalytics(gameSlug, langPair, levelId, loadDurationMs);
  },
  onWordSolved({ wordId, isCorrect, gameSlug, langPair, levelId, onFinalWordSolved }) {
    return recordWordSolvedForFunnel({
      wordId,
      isCorrect,
      gameSlug,
      langPair,
      levelId,
      onFinalWordSolved,
    });
  },
  onLevelCompletedGuaranteed({
    gameSlug,
    score,
    langPair,
    levelId,
    triggerReason,
    onLevelCompletedCallback,
  }) {
    return fireGuaranteedLevelEnd({
      gameSlug,
      score,
      langPair,
      levelId,
      triggerReason,
      onLevelCompletedCallback,
    });
  },
  onLevelAbandoned(reason = "visibilitychange", uid = null) {
    return flushIncompleteSessionOnExit(reason, uid);
  },
  computeDropOffStage,
  buildLevelEndPayload,
  buildLevelAbandonedPayload,
  getSnapshot() {
    return getActiveLevelSessionSnapshot();
  },
};
