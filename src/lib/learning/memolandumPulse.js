/**
 * Memolandum Pulse™
 * Arcade-native spaced repetition for vocabulary.
 *
 * Bilimsel temel: active recall (Roediger) + spaced repetition (Ebbinghaus / SM-2)
 * + kısa learning-step kuyruğu (Anki tarzı). Oyun UX’ine uyarlandı:
 * hızlı doğru → daha uzun aralık; yanlış → hemen yeniden due.
 */

export const PULSE_VERSION = 1;

/** Kalite notları (SM-2 uyumlu) */
export const PulseQuality = Object.freeze({
  AGAIN: 1,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
});

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const DEFAULT_EASE = 2.5;

/** Learning steps (dakika) — oyun oturumunda 0 = hemen tekrar seçilebilir */
const LEARNING_STEPS_MIN = [0, 12, 60];

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

export function clampEase(ease) {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, Number(ease) || DEFAULT_EASE));
}

/**
 * Oyun sonucu → Pulse kalitesi
 * @param {{ correct: boolean, responseTimeSec?: number, struggled?: boolean }} opts
 */
export function qualityFromGameResult({ correct, responseTimeSec = 8, struggled = false }) {
  if (!correct) return PulseQuality.AGAIN;
  if (struggled) return PulseQuality.HARD;
  const t = Number(responseTimeSec);
  if (Number.isFinite(t) && t < 3) return PulseQuality.EASY;
  if (Number.isFinite(t) && t > 14) return PulseQuality.HARD;
  return PulseQuality.GOOD;
}

/** UI / legacy uyumu: SRS durumundan 1–5 strength */
export function strengthFromPulse(item, now = Date.now()) {
  if (!item) return 1;
  const interval = Number(item.intervalDays) || 0;
  const reps = Number(item.reps) || 0;
  const dueAt = Number(item.dueAt) || 0;

  if (reps === 0 && interval === 0) return 1;
  if (interval === 0) return 2; // learning
  if (dueAt > 0 && dueAt <= now) return Math.min(4, Math.max(2, item.strength || 3)); // due review
  if (interval >= 14) return 5;
  if (interval >= 5) return 4;
  if (interval >= 2) return 3;
  return 2;
}

/**
 * Eski strength-only kayıtları Pulse alanlarına yükselt
 */
export function migrateVaultItem(raw, now = Date.now()) {
  if (!raw || typeof raw !== "object") return raw;

  if (raw.pulseVersion === PULSE_VERSION && raw.dueAt != null && raw.easiness != null) {
    return {
      ...raw,
      easiness: clampEase(raw.easiness),
      strength: strengthFromPulse(raw, now),
    };
  }

  const strength = Math.max(1, Math.min(5, Number(raw.strength) || 1));
  const lastSeen = Number(raw.lastSeen) || now;
  let easiness = DEFAULT_EASE;
  let intervalDays = 0;
  let reps = 0;
  let lapses = Number(raw.lapses) || 0;
  let learningStep = 0;
  let dueAt = now;

  if (strength <= 1) {
    intervalDays = 0;
    learningStep = 0;
    reps = 0;
    dueAt = now;
  } else if (strength === 2) {
    intervalDays = 0;
    learningStep = 1;
    reps = 1;
    dueAt = now;
  } else if (strength === 3) {
    intervalDays = 1;
    reps = 2;
    learningStep = LEARNING_STEPS_MIN.length;
    dueAt = lastSeen + 1 * DAY_MS;
  } else if (strength === 4) {
    intervalDays = 4;
    reps = 3;
    easiness = 2.4;
    learningStep = LEARNING_STEPS_MIN.length;
    dueAt = lastSeen + 4 * DAY_MS;
  } else {
    intervalDays = 10;
    reps = 5;
    easiness = 2.55;
    learningStep = LEARNING_STEPS_MIN.length;
    dueAt = lastSeen + 10 * DAY_MS;
  }

  const migrated = {
    ...raw,
    pulseVersion: PULSE_VERSION,
    easiness: clampEase(easiness),
    intervalDays,
    dueAt,
    reps,
    lapses,
    learningStep,
    streak: Number(raw.streak) || 0,
    lastSeen,
    romanized: raw.romanized || raw.romanized_script || "",
    note: raw.note || "",
  };
  migrated.strength = strengthFromPulse(migrated, now);
  return migrated;
}

export function migrateVaultMap(vault = {}, now = Date.now()) {
  if (!vault || typeof vault !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(vault)) {
    out[k] = migrateVaultItem(v, now);
  }
  return out;
}

/**
 * Yeni kasa kaydı (henüz tekrarlanmamış)
 */
export function createPulseEntry(base = {}, now = Date.now()) {
  const entry = {
    id: base.id,
    english: base.english || "",
    turkish: base.turkish || "",
    audioUrl: base.audioUrl || "",
    language: base.language || "",
    origin: base.origin,
    sourceLang: base.sourceLang,
    targetLang: base.targetLang,
    romanized: base.romanized || base.romanized_script || "",
    note: base.note || "",
    pulseVersion: PULSE_VERSION,
    easiness: DEFAULT_EASE,
    intervalDays: 0,
    dueAt: now,
    reps: 0,
    lapses: 0,
    learningStep: 0,
    streak: 0,
    lastSeen: now,
    strength: 1,
    firstTryCorrect: base.firstTryCorrect ?? false,
    learningProgressPct: base.learningProgressPct ?? 100,
  };
  // strip undefined optional fields
  Object.keys(entry).forEach((k) => entry[k] === undefined && delete entry[k]);
  return entry;
}

function applyAgain(item, now) {
  const next = { ...item };
  next.lapses = (Number(next.lapses) || 0) + 1;
  next.streak = 0;
  next.reps = Math.max(0, (Number(next.reps) || 0) - 1);
  next.easiness = clampEase((Number(next.easiness) || DEFAULT_EASE) - 0.2);
  next.intervalDays = 0;
  next.learningStep = 0;
  next.dueAt = now; // hemen tekrar
  next.lastSeen = now;
  next.strength = strengthFromPulse(next, now);
  next.pulseVersion = PULSE_VERSION;
  return next;
}

function applySuccess(item, quality, now) {
  const next = { ...item };
  const ease = clampEase(next.easiness);
  let learningStep = Number(next.learningStep) || 0;
  let intervalDays = Number(next.intervalDays) || 0;
  let reps = Number(next.reps) || 0;

  // Learning phase
  if (intervalDays === 0 && learningStep < LEARNING_STEPS_MIN.length) {
    if (quality === PulseQuality.HARD) {
      // aynı adımda kısa gecikme
      next.dueAt = now + LEARNING_STEPS_MIN[Math.max(0, learningStep)] * MIN_MS;
      next.easiness = clampEase(ease - 0.05);
    } else if (quality === PulseQuality.EASY) {
      // learning’i atla, graduate
      learningStep = LEARNING_STEPS_MIN.length;
      intervalDays = 1;
      reps += 1;
      next.dueAt = now + intervalDays * DAY_MS;
      next.easiness = clampEase(ease + 0.1);
    } else {
      // GOOD → next learning step or graduate
      learningStep += 1;
      if (learningStep >= LEARNING_STEPS_MIN.length) {
        intervalDays = 1;
        reps += 1;
        next.dueAt = now + intervalDays * DAY_MS;
      } else {
        next.dueAt = now + LEARNING_STEPS_MIN[learningStep] * MIN_MS;
      }
    }
    next.learningStep = learningStep;
    next.intervalDays = intervalDays;
    next.reps = reps;
    next.streak = (Number(next.streak) || 0) + 1;
    next.lastSeen = now;
    next.strength = strengthFromPulse(next, now);
    next.pulseVersion = PULSE_VERSION;
    return next;
  }

  // Review phase (SM-2-ish)
  let newEase = ease;
  if (quality === PulseQuality.HARD) newEase -= 0.15;
  else if (quality === PulseQuality.EASY) newEase += 0.1;
  newEase = clampEase(newEase);

  let newInterval;
  if (intervalDays <= 0) newInterval = 1;
  else if (reps <= 1) newInterval = quality === PulseQuality.EASY ? 3 : 1;
  else if (reps === 2) newInterval = quality === PulseQuality.HARD ? 2 : Math.max(2, Math.round(intervalDays * newEase * 0.85));
  else {
    const factor = quality === PulseQuality.HARD ? 1.1 : quality === PulseQuality.EASY ? newEase + 0.15 : newEase;
    newInterval = Math.max(1, Math.round(intervalDays * factor));
  }

  // Cap extreme intervals for product sanity (still long-term memory)
  newInterval = Math.min(180, newInterval);

  next.easiness = newEase;
  next.intervalDays = newInterval;
  next.reps = reps + 1;
  next.learningStep = LEARNING_STEPS_MIN.length;
  next.dueAt = now + newInterval * DAY_MS;
  next.streak = (Number(next.streak) || 0) + 1;
  next.lastSeen = now;
  next.strength = strengthFromPulse(next, now);
  next.pulseVersion = PULSE_VERSION;
  return next;
}

/**
 * Tek review sonucu uygula
 * @param {object} item vault item
 * @param {number} quality PulseQuality
 */
export function schedulePulse(item, quality, now = Date.now()) {
  const base = migrateVaultItem(item || createPulseEntry({}, now), now);
  const q = Number(quality);
  if (q < 3) return applyAgain(base, now);
  return applySuccess(base, q, now);
}

export function isDue(item, now = Date.now()) {
  if (!item) return true;
  const dueAt = Number(item.dueAt);
  if (!Number.isFinite(dueAt)) return true;
  return dueAt <= now;
}

/** Kullanıcının çeviri / manuel eklediği kelime mi? */
export function isUserAddedWord(item) {
  if (!item) return false;
  if (item.origin === "instant_translate" || item.origin === "manual") return true;
  if (typeof item.language === "string" && item.language.startsWith("ai:")) return true;
  if (typeof item.id === "string" && item.id.startsWith("ai_")) return true;
  return false;
}

/** Oyun / quiz ile kasaya düşen */
export function isGameLearnedWord(item) {
  return !!item && !isUserAddedWord(item);
}

/** Due etiketi — kullanıcıya anlaşılır */
export function formatPulseDueLabel(item, now = Date.now()) {
  if (!item) return "Yeni";
  const dueAt = Number(item.dueAt) || 0;
  const interval = Number(item.intervalDays) || 0;
  if (!dueAt || dueAt <= now) {
    if (interval === 0 && (Number(item.reps) || 0) === 0) return "Şimdi öğren";
    return "Tekrar zamanı";
  }
  const diffMs = dueAt - now;
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} dk sonra`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} sa sonra`;
  const days = Math.round(hours / 24);
  return `${days} gün sonra`;
}

export function isMastered(item, now = Date.now()) {
  if (!item) return false;
  const interval = Number(item.intervalDays) || 0;
  return interval >= 7 && !isDue(item, now);
}

/**
 * Seçim ağırlığı — due/yeni öncelikli, mastered seyrek
 */
export function getPulseWeight(item, now = Date.now(), { reviewWeight = 0.15 } = {}) {
  if (!item) return 1.0;
  const migrated = migrateVaultItem(item, now);

  // 1. Priority 1: Active Learning Curve (25%, 50%, 75%) -> Boost weight to show frequently
  if (migrated.learningProgressPct != null && Number(migrated.learningProgressPct) < 100) {
    const progress = Number(migrated.learningProgressPct) || 25;
    const boost = progress <= 25 ? 2.5 : progress <= 50 ? 2.0 : 1.5;
    return boost;
  }

  // 2. Priority 2: Known on first attempt -> 80% reduction (weight 0.2)
  if (migrated.firstTryCorrect === true) {
    return 0.2;
  }

  // 3. Priority 3: Standard Spaced Repetition Due Schedule
  const interval = Number(migrated.intervalDays) || 0;
  const dueAt = Number(migrated.dueAt) || 0;

  if (isDue(migrated, now)) {
    const overdueDays = dueAt > 0 ? (now - dueAt) / DAY_MS : 0;
    return overdueDays > 2 ? 1.25 : 1.0;
  }
  if (interval === 0) return 0.9; // learning, not yet due minute
  if (interval < 3) return 0.35;
  if (interval < 7) return 0.22;
  return reviewWeight; // ~%85 seyreltme
}

/**
 * Vault içinden kelime bul
 */
export function findVaultItem(vocabularyVault, word) {
  if (!word || !vocabularyVault) return null;
  const wordId = word.id || word.word_id;
  const englishLower = (word.english || word.word || "").toLowerCase().trim();

  if (wordId && vocabularyVault[wordId]) return { key: wordId, item: vocabularyVault[wordId] };

  if (englishLower) {
    const key = Object.keys(vocabularyVault).find((k) => {
      const v = vocabularyVault[k];
      return (v.english || v.word || "").toLowerCase().trim() === englishLower;
    });
    if (key) return { key, item: vocabularyVault[key] };
  }
  return null;
}

export function resolveWordId(word) {
  if (!word) return null;
  const englishKey = (word.english || word.word || "").toLowerCase().trim();
  return word.id || word.word_id || (englishKey ? `word_${englishKey}` : null);
}


/**
 * Faz 1 Micro-Onboarding ("Warm-up Wave") yapılandırması.
 * - Seviye 1 (completedLevels === 0): Maksimum 3 kelime (15-20 sn hedefi)
 * - Seviye 2 (completedLevels === 1): Kademeli geçiş 5 kelime
 * - Seviye 3+ (completedLevels >= 2): Normal 12 kelimelik SM-2 Pulse döngüsü
 */
export function getWarmupWaveConfig(completedLevels = 0, isFirstSession = false) {
  const lvl = Number.isFinite(Number(completedLevels)) ? Number(completedLevels) : 0;
  if (lvl <= 0 || (isFirstSession && lvl === 0)) {
    return {
      isWarmup: true,
      wave: 1,
      targetCount: 3,
      maxSecondsTarget: 20,
      nextWaveTargetCount: 5,
    };
  }
  if (lvl === 1) {
    return {
      isWarmup: true,
      wave: 2,
      targetCount: 5,
      maxSecondsTarget: 35,
      nextWaveTargetCount: 12,
    };
  }
  return {
    isWarmup: false,
    wave: 3,
    targetCount: 12,
    maxSecondsTarget: 90,
    nextWaveTargetCount: 12,
  };
}
