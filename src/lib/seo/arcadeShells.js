/**
 * Client-safe arcade shell list + games picker URL helpers (fs yok).
 */

export const ARCADE_SHELLS = [
  { id: "shooter", name: "Retro Shooter", blurb: "Meteordaki kelimeleri vurarak eşle." },
  { id: "breakout", name: "Breakout DX-Ball", blurb: "Tuğlaları kırarak kelimeleri eşle." },
  { id: "highway", name: "Highway Survivor", blurb: "Doğru şeritte sür, kelimeyi yakala." },
  { id: "invaders", name: "Siberian Invaders", blurb: "İstilacı formasyonları vur." },
  { id: "wordascent", name: "The Word Ascent", blurb: "Platformlarda zıplayarak tırman." },
  { id: "worddrop", name: "Reverse Word Drop", blurb: "Blokları yerleştir, eşleştir." },
  { id: "quiz", name: "Retro Quiz", blurb: "Çoktan seçmeli active recall." },
  { id: "lexicon", name: "Lexicon Tokens", blurb: "Kart çevir: kelime, ses, anlam." },
  { id: "hangman", name: "Retro Hangman", blurb: "Harf harf tahmin et." },
  { id: "word-snake", name: "Retro Yılan", blurb: "Harfleri yiyerek kelimeyi tamamla." },
  { id: "academic-shooter", name: "Academic Shooter", blurb: "Akademik kelimeleri uzay arenasında hedefle." },
  { id: "academic-lexicon", name: "Academic Lexicon", blurb: "Akademik terimleri kartlarla hızlıca özümse." },
  { id: "word-card", name: "Kelime Kartı", blurb: "Görsel ve sesli interaktif kelime kartları." },
  { id: "word-board", name: "Ahşap Kelime Panosu", blurb: "Güneşli bahçede 8'li ahşap pano üzerinde sesli kelime avı." },
  { id: "star-cards", name: "Yıldız Kartlar", blurb: "Güneşli çayırda 3 renkli karttan doğru kelimeyi seç, yıldızları patlat." },
  { id: "orbitlex", name: "OrbitLex Platformer", blurb: "Yörüngede süzül, eş ve zıt anlam kristallerini topla." },
];

export function buildGamesPickerHref({ pathway, langId, levelId } = {}) {
  const q = new URLSearchParams();
  if (pathway) q.set("pathway", pathway);
  if (langId) q.set("lang", langId);
  if (levelId) q.set("level", levelId);
  const qs = q.toString();
  return `/games/${qs ? `?${qs}` : ""}`;
}

export function buildLevelPageHref(pathwaySlug, levelSlug) {
  return `/learn/${pathwaySlug}/${levelSlug}/`;
}

export function buildGameShellHref(gameId, { pathway, langId, levelId } = {}) {
  const q = new URLSearchParams();
  if (pathway) q.set("pathway", pathway);
  if (langId) q.set("lang", langId);
  if (levelId) q.set("level", levelId);
  const qs = q.toString();
  return `/games/${gameId}/${qs ? `?${qs}` : ""}`;
}
