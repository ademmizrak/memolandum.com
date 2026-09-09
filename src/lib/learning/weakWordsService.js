/**
 * Memolandum Kişiselleştirilmiş Hata Defteri & Zayıf Kelime Servisi (Weak-Word Remediation)
 * 
 * Öğrencinin oyunlarda ve alıştırmalarda zorlandığı, yanlış yaptığı veya 
 * SM-2 aralıklı tekrar algoritmasında (Memolandum Pulse™) gecikmiş kelimeleri tespit eder.
 */

import { migrateVaultItem, isDue, schedulePulse, PulseQuality } from "./memolandumPulse";

/**
 * Kasadaki ve son çözülen testlerdeki zorlanılan/yanlış kelimeleri listeler.
 * @param {Object} vocabularyVault - Store'daki kelime kasası
 * @param {Array} quizHistory - Son çözülen soru geçmişi
 * @param {Object} [options]
 * @param {string} [options.filterLang] - Belirli bir dil filtresi (örn: 'en-tr')
 * @param {number} [options.limit=100]
 */
export function getWeakWords(vocabularyVault = {}, quizHistory = [], options = {}) {
  const now = Date.now();
  const limit = options.limit || 100;
  const filterLang = options.filterLang || "all";

  const weakMap = new Map();

  // 1. Kasadaki SM-2 verilerini tara
  Object.values(vocabularyVault).forEach((rawItem) => {
    const item = migrateVaultItem(rawItem, now);
    if (!item || !item.id) return;

    if (filterLang !== "all" && item.language && !item.language.includes(filterLang)) {
      return;
    }

    const strength = Number(item.strength) || 1;
    const lapses = Number(item.lapses) || 0;
    const easiness = Number(item.easiness) || 2.5;
    const due = isDue(item, now);

    // Zayıf kelime kriterleri:
    // a) En az 1 kez hata yapılmış (lapses > 0)
    // b) Seviye 1 veya 2 (yeni / pekişmemiş)
    // c) Zorluk katsayısı düşük (easiness < 2.2)
    // d) Tekrar zamanı gelmiş ve henüz pekişmemiş
    const isWeak = lapses > 0 || strength <= 2 || easiness < 2.2 || (due && strength <= 3);

    if (isWeak) {
      weakMap.set(item.id, {
        ...item,
        weakScore: lapses * 3 + (5 - strength) * 2 + (due ? 2 : 0) + (easiness < 2.2 ? 2 : 0),
        reason: lapses > 0 
          ? `${lapses} kez hata yapıldı` 
          : strength <= 2 
            ? "Pekiştirme bekliyor" 
            : "Tekrar vakti geldi",
      });
    }
  });

  // 2. Son soru geçmişindeki (quizHistory) yanlışları tara (kasada henüz yer almasa bile)
  (quizHistory || []).forEach((hist) => {
    if (!hist.isCorrect && hist.english) {
      const id = hist.wordId || hist.english.toLowerCase();
      if (!weakMap.has(id)) {
        weakMap.set(id, {
          id,
          english: hist.english,
          turkish: hist.turkish || "",
          audioUrl: hist.audioUrl || "",
          language: hist.language || "en-tr",
          strength: 1,
          lapses: 1,
          weakScore: 5,
          reason: "Son alıştırmada yanlış yapıldı",
        });
      } else {
        const existing = weakMap.get(id);
        existing.weakScore += 2;
      }
    }
  });

  // En çok zorlanılandan başlayarak sırala
  const sorted = Array.from(weakMap.values()).sort((a, b) => b.weakScore - a.weakScore);

  return sorted.slice(0, limit);
}

/**
 * Zayıf kelimenin pekiştirildiğini işaretler ve SM-2 gücünü artırır
 */
export function calculateReinforcedWord(wordItem, wasKnown = true) {
  const now = Date.now();
  const current = migrateVaultItem(wordItem, now);

  if (wasKnown) {
    const scheduled = schedulePulse(current, PulseQuality.GOOD, now);
    return {
      ...scheduled,
      lapses: Math.max(0, (scheduled.lapses || 0) - 1),
      strength: Math.min(5, (scheduled.strength || 1) + 1),
      lastSeen: now,
    };
  } else {
    const scheduled = schedulePulse(current, PulseQuality.AGAIN, now);
    return {
      ...scheduled,
      lapses: (scheduled.lapses || 0) + 1,
      strength: 1,
      lastSeen: now,
    };
  }
}
