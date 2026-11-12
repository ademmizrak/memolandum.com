let KEY = "orbit-lex-v1";
export function setSaveKey(key) {
  KEY = key || "orbit-lex-v1";
}
function empty() {
  return {
    version: 1,
    completed: [],
    bestCoins: {},
    bestTime: {},
    bestDiamonds: {},
    bestStars: {},
    muted: false,
    lastMode: "mixed"
  };
}
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      bestCoins: parsed.bestCoins ?? {},
      bestTime: parsed.bestTime ?? {},
      bestDiamonds: parsed.bestDiamonds ?? {},
      bestStars: parsed.bestStars ?? {},
      muted: Boolean(parsed.muted),
      lastMode: parsed.lastMode || "mixed"
    };
  } catch {
    return empty();
  }
}
export function writeSave(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
export function markComplete(levelId, coins, diamonds, time, stars) {
  const data = loadSave();
  if (!data.completed.includes(levelId)) data.completed.push(levelId);
  data.bestCoins[levelId] = Math.max(data.bestCoins[levelId] ?? 0, coins);
  data.bestDiamonds[levelId] = Math.max(data.bestDiamonds[levelId] ?? 0, diamonds);
  data.bestStars[levelId] = Math.max(data.bestStars[levelId] ?? 0, stars);
  const prev = data.bestTime[levelId];
  data.bestTime[levelId] = prev ? Math.min(prev, time) : time;
  writeSave(data);
  return data;
}
export function isUnlocked(levelIndex, completed, levelIds) {
  if (levelIndex <= 0) return true;
  return completed.includes(levelIds[levelIndex - 1]);
}