/**
 * Level zaferinden Quiz'e geçince önceki arcade oyuna dönüş bağlamı.
 * sessionStorage — sekme oturumu; kalıcı lastPlayed'i quiz ile ezmemek için.
 */

const STORAGE_KEY = "memolandum_quiz_return";

const VALID_GAMES = new Set([
  "shooter",
  "breakout",
  "highway",
  "invaders",
  "wordascent",
  "worddrop",
  "lexicon",
  "hangman",
  "word-snake",
]);

export function saveQuizReturnContext({ gameId, levelId, langId } = {}) {
  if (typeof window === "undefined") return;
  if (!gameId || gameId === "quiz" || !VALID_GAMES.has(gameId)) return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        gameId,
        levelId: levelId || null,
        langId: langId || null,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* private mode / quota */
  }
}

export function readQuizReturnContext() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.gameId || !VALID_GAMES.has(parsed.gameId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuizReturnContext() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function gameDisplayName(gameId) {
  const map = {
    shooter: "Retro Shooter",
    breakout: "Breakout",
    highway: "Highway",
    invaders: "Invaders",
    wordascent: "Word Ascent",
    worddrop: "Word Drop",
    lexicon: "Lexicon Tokens",
    hangman: "Retro Hangman",
    "word-snake": "Retro Yılan",
  };
  return map[gameId] || gameId;
}
