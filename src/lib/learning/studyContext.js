/**
 * Enterprise study context — tek kaynak: manifest.
 * lastPlayedLang/Level asla “tahmin” edilmez; level → parent lang türetilir.
 */

import { gameManifest } from "../../config/manifest.js";

const DEFAULT_GAME = "shooter";
const VALID_GAMES = new Set([
  "shooter",
  "breakout",
  "highway",
  "invaders",
  "wordascent",
  "worddrop",
  "lexicon",
  "quiz",
  "hangman",
  "word-snake",
  "word-card",
  "word-board",
  "star-cards",
  "academic-shooter",
  "academic-lexicon",
  "orbitlex",
]);

const LEGACY_LEVEL_ALIASES = {
  "en-tr_ilkokul-words-1_sinif": "meb-1-sinif-kelimeleri",
  "en-tr_ilkokul-words-2_sinif": "meb-2-sinif-kelimeleri",
  "en-tr_ilkokul-words-3_sinif": "meb-3-sinif-kelimeleri",
  "en-tr_ilkokul-words-4_sinif": "meb-4-sinif-kelimeleri",
  "en-tr_eng_ilkokul-words-1_sinif": "meb-1-sinif-kelimeleri",
  "en-tr_eng_ilkokul-words-2_sinif": "meb-2-sinif-kelimeleri",
  "en-tr_eng_ilkokul-words-3_sinif": "meb-3-sinif-kelimeleri",
  "en-tr_eng_ilkokul-words-4_sinif": "meb-4-sinif-kelimeleri",
  "en-tr_ilkokul-sentences-2_sinif": "meb-2-sinif-cumleleri",
  "en-tr_ilkokul-sentences-3_sinif": "meb-3-sinif-cumleleri",
  "en-tr_ilkokul-sentences-4_sinif": "meb-4-sinif-cumleleri",
  "en-tr_ortaokul-words-5_sinif": "meb-5-sinif-kelimeleri",
  "en-tr_ortaokul-words-6_sinif": "meb-6-sinif-kelimeleri",
  "en-tr_ortaokul-words-7_sinif": "meb-7-sinif-kelimeleri",
  "en-tr_ortaokul-words-8_sinif": "meb-8-sinif-kelimeleri",
};

const LEGACY_LANG_ALIASES = {
  "en-tr_ilkokul": "en-tr_eng_ilkokul",
  "en-tr_ortaokul": "en-tr_eng_ortaokul",
  "en-tr_yds": "en-tr_eng_yds_kelimeleri",
  "en-tr_yks": "en-tr_eng_yks_kelimeleri",
  "en-tr_genel": "en-tr_eng_genel",
};

let _indexCache = null;

function buildIndex() {
  if (_indexCache) return _indexCache;
  const byLevelId = new Map();
  const bySubId = new Map();

  for (const main of gameManifest.mainCategories || []) {
    for (const sub of main.subCategories || []) {
      bySubId.set(sub.id, { main, sub });
      const allLevels = [...(sub.levels || []), ...(sub.sentenceLevels || [])];
      for (const level of allLevels) {
        if (!level?.id) continue;
        if (!byLevelId.has(level.id)) {
          byLevelId.set(level.id, { main, sub, level });
        }
        if (level.slug && !byLevelId.has(level.slug)) {
          byLevelId.set(level.slug, { main, sub, level });
        }
      }
    }
  }
  _indexCache = { byLevelId, bySubId };
  return _indexCache;
}

/** Level id → { mainId, langId, levelId, names… } */
export function findLevelContext(levelId, preferredLangId = null) {
  if (!levelId) return null;
  const resolvedLevelId = LEGACY_LEVEL_ALIASES[levelId] || levelId;
  const resolvedLangId =
    (preferredLangId && LEGACY_LANG_ALIASES[preferredLangId]) || preferredLangId;

  const { byLevelId, bySubId } = buildIndex();
  if (resolvedLangId && bySubId.has(resolvedLangId)) {
    const preferred = bySubId.get(resolvedLangId);
    const allLevels = [
      ...(preferred.sub.levels || []),
      ...(preferred.sub.sentenceLevels || []),
    ];
    const matchedLevel = allLevels.find(
      (l) => l && (l.id === resolvedLevelId || l.slug === resolvedLevelId)
    );
    if (matchedLevel) {
      return {
        mainId: preferred.main.id,
        mainName: preferred.main.name,
        langId: preferred.sub.id,
        langName: preferred.sub.name,
        levelId: matchedLevel.id,
        levelName: matchedLevel.name,
        level: matchedLevel,
        sub: preferred.sub,
        main: preferred.main,
      };
    }
  }
  const hit = byLevelId.get(resolvedLevelId);
  if (!hit) return null;
  return {
    mainId: hit.main.id,
    mainName: hit.main.name,
    langId: hit.sub.id,
    langName: hit.sub.name,
    levelId: hit.level.id,
    levelName: hit.level.name,
    level: hit.level,
    sub: hit.sub,
    main: hit.main,
  };
}

export function findSubContext(langId) {
  if (!langId) return null;
  const resolvedLangId = LEGACY_LANG_ALIASES[langId] || langId;
  const hit = buildIndex().bySubId.get(resolvedLangId);
  if (!hit) return null;
  return { mainId: hit.main.id, mainName: hit.main.name, langId: hit.sub.id, langName: hit.sub.name, sub: hit.sub, main: hit.main };
}

export function getDefaultStudyContext() {
  const main = gameManifest.mainCategories?.[0];
  const sub = main?.subCategories?.[0];
  const level = sub?.levels?.[0];
  return {
    mainId: main?.id || "en-tr",
    langId: sub?.id || "en-tr_eng_genel",
    levelId: level?.id || "en-tr_eng_genel-words-a1_vocabulary",
    gameId: DEFAULT_GAME,
    langName: sub?.name || "İngilizce",
    levelName: level?.name || "Başlangıç",
    lastPlayedAt: 0,
  };
}

/**
 * Kanonik context üret.
 * ÖNEMLİ: levelId varsa önce preferred langId içinde aranır; yoksa manifest parent’tan gelir.
 */
export function normalizeStudyContext({ langId, levelId, gameId, lastPlayedAt } = {}) {
  const game = VALID_GAMES.has(gameId) ? gameId : DEFAULT_GAME;

  if (levelId) {
    const ctx = findLevelContext(levelId, langId);
    if (ctx) {
      return {
        mainId: ctx.mainId,
        langId: ctx.langId,
        levelId: ctx.levelId,
        gameId: game,
        langName: ctx.langName,
        levelName: ctx.levelName,
        lastPlayedAt: Number(lastPlayedAt) || 0,
      };
    }
  }

  if (langId) {
    const sub = findSubContext(langId);
    if (sub) {
      const first = sub.sub.levels?.[0] || sub.sub.sentenceLevels?.[0];
      if (first) {
        return normalizeStudyContext({
          langId: sub.langId,
          levelId: first.id,
          gameId: game,
          lastPlayedAt,
        });
      }
    }
  }

  return null;
}

/** Store / cloud’tan güvenli resume */
export function resolveResumeContext({
  lastPlayedLang,
  lastPlayedLevel,
  lastPlayedGame,
  lastPlayedAt,
} = {}) {
  return (
    normalizeStudyContext({
      langId: lastPlayedLang,
      levelId: lastPlayedLevel,
      gameId: lastPlayedGame,
      lastPlayedAt,
    }) || getDefaultStudyContext()
  );
}

/**
 * LWW: hangisi daha yeni ve geçerli?
 * @returns normalized context to keep
 */
export function pickNewerStudyContext(local, remote) {
  const a = normalizeStudyContext(local);
  const b = normalizeStudyContext(remote);
  if (a && !b) return a;
  if (b && !a) return b;
  if (!a && !b) return getDefaultStudyContext();
  const ta = Number(local?.lastPlayedAt) || Number(a.lastPlayedAt) || 0;
  const tb = Number(remote?.lastPlayedAt) || Number(b.lastPlayedAt) || 0;
  if (tb > ta) return { ...b, lastPlayedAt: tb };
  return { ...a, lastPlayedAt: ta };
}

/** Aynı dil kategorisinde veya sonraki kategoride sonraki seviye (next level butonu) */
export function findNextLevelId(langId, currentLevelId) {
  const subCtx = findSubContext(langId);
  const sub = subCtx?.sub;
  if (!sub) return null;
  const all = [...(sub.levels || []), ...(sub.sentenceLevels || [])];
  const idx = all.findIndex((l) => l.id === currentLevelId);
  if (idx >= 0 && idx < all.length - 1) {
    return all[idx + 1].id;
  }
  // Son seviyeye ulaşıldıysa, aynı ana kategorideki bir sonraki alt kategoriye geç
  const main = subCtx?.main;
  if (main && Array.isArray(main.subCategories)) {
    const subIdx = main.subCategories.findIndex((s) => s.id === langId);
    if (subIdx >= 0 && subIdx < main.subCategories.length - 1) {
      const nextSub = main.subCategories[subIdx + 1];
      const nextAll = [...(nextSub.levels || []), ...(nextSub.sentenceLevels || [])];
      if (nextAll.length > 0) {
        return nextAll[0].id;
      }
    }
  }
  // Alternatif döngü: İlk seviyeye dön
  return all[0]?.id || null;
}

export const GAME_DISPLAY_NAMES = {
  shooter: "Retro Shooter",
  breakout: "Breakout",
  highway: "Highway",
  invaders: "Invaders",
  wordascent: "Word Ascent",
  worddrop: "Word Drop",
  lexicon: "Lexicon Tokens",
  quiz: "Retro Quiz",
  hangman: "Retro Hangman",
  "word-snake": "Retro Yılan",
  "word-card": "Kelime Kartı",
  "word-board": "Ahşap Kelime Panosu",
  "star-cards": "Yıldız Kartlar",
  orbitlex: "OrbitLex",
};

export function gameDisplayName(gameId) {
  return GAME_DISPLAY_NAMES[gameId] || gameId || DEFAULT_GAME;
}

/** Gerçekten kaydedilmiş bir “kaldığın yer” var mı? (varsayılan manifest değil) */
export function hasSavedResume(lastPlayedLevel, lastPlayedAt) {
  return !!(lastPlayedLevel && Number(lastPlayedAt) > 0);
}

/** “3 gün önce” — masaya dönüş mesajı */
export function formatResumeAge(lastPlayedAt, t, now = Date.now()) {
  const tVal = Number(lastPlayedAt) || 0;
  if (!tVal) return null;
  const diff = Math.max(0, now - tVal);
  const mins = Math.floor(diff / 60000);
  if (typeof t !== "function") {
    // Fallback if translation function is not provided
    if (mins < 1) return "az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "dün";
    if (days < 30) return `${days} gün önce`;
    const months = Math.floor(days / 30);
    return months <= 1 ? "1 ay önce" : `${months} ay önce`;
  }
  if (mins < 1) return t("home.resumeAge.justNow");
  if (mins < 60) return t("home.resumeAge.minsAgo", { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("home.resumeAge.hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t("home.resumeAge.yesterday");
  if (days < 30) return t("home.resumeAge.daysAgo", { days });
  const months = Math.floor(days / 30);
  return months <= 1 ? t("home.resumeAge.oneMonthAgo") : t("home.resumeAge.monthsAgo", { months });
}

/**
 * Resolves current level index (1-based) and total levels count for HUD display.
 */
export function getLevelProgress(levelId, langId) {
  const ctx = findLevelContext(levelId) || findSubContext(langId);
  const sub = ctx?.sub || findSubContext(langId)?.sub;
  if (!sub) return { current: 1, total: 10, formatted: "01/10" };

  const allLevels = [...(sub.levels || []), ...(sub.sentenceLevels || [])];
  const idx = allLevels.findIndex((l) => l.id === levelId);
  const current = idx >= 0 ? idx + 1 : 1;
  const total = allLevels.length || 10;

  return {
    current,
    total,
    formatted: `${String(current).padStart(2, "0")}/${total}`,
    code: ctx?.level?.levelCode || `LVL ${current}`,
    levelName: ctx?.levelName || `Level ${current}`,
  };
}
