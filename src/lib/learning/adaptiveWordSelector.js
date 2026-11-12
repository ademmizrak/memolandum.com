/**
 * Adaptive word selection powered by Memolandum Pulse™
 * Due / learning / new words first; mastered words heavily diluted.
 * Oturum seti: varsayılan 12 kelimelik steril rastgele örneklem.
 */

import {
  findVaultItem,
  getPulseWeight,
  getWarmupWaveConfig,
  isDue,
  migrateVaultItem,
} from "./memolandumPulse";

/** Oyun / quiz oturumu başına varsayılan kelime sayısı */
export const SESSION_WORD_TARGET = 12;

/** Faz 1 Micro-Onboarding (Warm-up Wave) kelime hedefleri */
export const WARMUP_WAVE_1_TARGET = 3;
export const WARMUP_WAVE_2_TARGET = 5;

/**
 * Kullanıcının tamamladığı seviye sayısına göre hedef kelime sayısını döndürür.
 * - Seviye 1 (completedLevels === 0): 3 kelime (15-20 saniyelik mikro-set)
 * - Seviye 2 (completedLevels === 1): 5 kelime (kademeli SM-2 geçişi)
 * - Seviye 3+ (completedLevels >= 2): 12 kelime (normal SM-2 döngüsü)
 */
export function resolveSessionWordTarget({
  completedLevels = null,
  isFirstSession = false,
  defaultTarget = SESSION_WORD_TARGET,
} = {}) {
  if (completedLevels === null && !isFirstSession) {
    return defaultTarget;
  }
  const cfg = getWarmupWaveConfig(completedLevels ?? 0, isFirstSession);
  return cfg.isWarmup ? cfg.targetCount : defaultTarget;
}

/**
 * İlk seviye (Warm-up Wave) için en kısa, tek kelimelik ve yüksek frekanslı
 * (kolay okunabilir) kelimeleri önceliklendirir.
 */
export function rankEasyMicroWords(wordsData = []) {
  if (!Array.isArray(wordsData) || wordsData.length === 0) return [];
  return [...wordsData].sort((a, b) => {
    const engA = String(a?.english || a?.word || "").trim();
    const engB = String(b?.english || b?.word || "").trim();
    const isMultiA = engA.includes(" ") ? 1 : 0;
    const isMultiB = engB.includes(" ") ? 1 : 0;
    if (isMultiA !== isMultiB) return isMultiA - isMultiB;
    const easyA = a?.isMicroEasy === true ? 0 : 1;
    const easyB = b?.isMicroEasy === true ? 0 : 1;
    if (easyA !== easyB) return easyA - easyB;
    return engA.length - engB.length;
  });
}

export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * @deprecated Prefer getPulseWeight — kept for scratch tests / callers
 */
export function getWordAdaptiveWeight(word, vocabularyVault = {}, learnedWeightScale = 0.15) {
  const found = findVaultItem(vocabularyVault, word);
  if (!found) return 1.0;
  return getPulseWeight(found.item, Date.now(), { reviewWeight: learnedWeightScale });
}

/**
 * @param {Array} wordsData
 * @param {Object} vocabularyVault
 * @param {Object} options
 * @param {number} [options.targetCount] — verilmezse SESSION_WORD_TARGET (havuz küçükse hepsi)
 * @param {boolean} [options.takeAll=false] — true ise tüm havuzu (eski davranış)
 * @param {number} [options.learnedWeightScale=0.15]
 * @param {boolean} [options.shuffle=true]
 * @param {number} [options.dueBias=0.55]
 */
export function selectAdaptiveWords(wordsData = [], vocabularyVault = {}, options = {}) {
  if (!Array.isArray(wordsData) || wordsData.length === 0) return [];

  const learnedWeightScale = options.learnedWeightScale ?? 0.15;
  const doShuffle = options.shuffle ?? true;
  const takeAll = options.takeAll === true;

  const warmupTarget =
    options.completedLevels !== undefined || options.isFirstSession === true
      ? resolveSessionWordTarget({
          completedLevels: options.completedLevels,
          isFirstSession: options.isFirstSession,
          defaultTarget: SESSION_WORD_TARGET,
        })
      : SESSION_WORD_TARGET;

  const effectiveDefaultTarget =
    options.targetCount && options.targetCount > 0
      ? Math.min(options.targetCount, warmupTarget)
      : warmupTarget;

  const targetCount = takeAll
    ? wordsData.length
    : Math.min(wordsData.length, effectiveDefaultTarget);
  const dueBias = Math.min(0.85, Math.max(0.35, options.dueBias ?? 0.55));
  const now = Date.now();

  // Eğer ilk seviye (Warm-up Wave 1: 3 kelime) ise en kısa/kolay kelimelerden mikro-havuz oluştur
  const candidateData =
    warmupTarget === WARMUP_WAVE_1_TARGET && wordsData.length > WARMUP_WAVE_1_TARGET
      ? rankEasyMicroWords(wordsData).slice(0, Math.min(wordsData.length, 6))
      : wordsData;

  // Önce havuzu karıştır — alfabetik JSON sırasına bağımlılığı kır
  const pool = shuffleArray(candidateData);

  const annotated = pool.map((word) => {
    const found = findVaultItem(vocabularyVault, word);
    const item = found ? migrateVaultItem(found.item, now) : null;
    const due = !item || isDue(item, now);
    const weight = item
      ? getPulseWeight(item, now, { reviewWeight: learnedWeightScale })
      : 1.0;
    return { word, item, due, weight, isNew: !item };
  });

  const dueOrNew = annotated.filter((a) => a.due || a.isNew);
  const rest = annotated.filter((a) => !a.due && !a.isNew);

  const dueSlots = Math.min(targetCount, Math.ceil(targetCount * dueBias));
  const selected = [];
  const usedIds = new Set();
  const usedSourceWords = new Set();
  const usedMeanings = new Set();

  const pickWeighted = (sourcePool, n, allowDuplicateMeaning = false) => {
    const copy = [...sourcePool];
    while (selected.length < n && copy.length > 0) {
      const totalWeight = copy.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight <= 0) break;
      let rand = Math.random() * totalWeight;
      let chosenIndex = 0;
      for (let i = 0; i < copy.length; i++) {
        rand -= copy[i].weight;
        if (rand <= 0) {
          chosenIndex = i;
          break;
        }
      }
      const chosen = copy[chosenIndex];
      const idKey = String(chosen.word.id || chosen.word.english || "").trim();
      const srcKey = String(chosen.word.english || chosen.word.word || "").trim().toLowerCase();
      const meaningKey = String(chosen.word.turkish || chosen.word.meaning || "").trim().toLowerCase();

      const isDuplicate =
        (idKey && usedIds.has(idKey)) ||
        (srcKey && usedSourceWords.has(srcKey)) ||
        (!allowDuplicateMeaning && meaningKey && usedMeanings.has(meaningKey));

      if (!isDuplicate) {
        if (idKey) usedIds.add(idKey);
        if (srcKey) usedSourceWords.add(srcKey);
        if (meaningKey) usedMeanings.add(meaningKey);
        selected.push(chosen.word);
      }
      copy.splice(chosenIndex, 1);
    }
  };

  pickWeighted(shuffleArray(dueOrNew), Math.min(dueSlots, dueOrNew.length), false);
  pickWeighted(shuffleArray(rest.length ? rest : dueOrNew), targetCount, false);

  if (selected.length < targetCount) {
    pickWeighted(shuffleArray(annotated), targetCount, false);
  }
  if (selected.length < targetCount) {
    pickWeighted(shuffleArray(annotated), targetCount, true);
  }

  return doShuffle ? shuffleArray(selected) : selected;
}

/**
 * Steril havuzdan oturum seti üret (her oyun başlangıcında çağır).
 */
export function buildSessionWordSet(wordsData, vocabularyVault = {}, options = {}) {
  return selectAdaptiveWords(wordsData, vocabularyVault, {
    shuffle: true,
    targetCount: options.targetCount ?? SESSION_WORD_TARGET,
    learnedWeightScale: options.learnedWeightScale ?? 0.15,
    dueBias: options.dueBias ?? 0.55,
    ...options,
  });
}
