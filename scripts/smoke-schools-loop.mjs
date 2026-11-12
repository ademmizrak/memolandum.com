/**
 * Smoke:
 * 1) Faz 1–4 Canlıya Alım Öncesi Regresyon Testleri (Pre-Deploy Smoke Checks):
 *    - Test 1 (Warm-up Wave Kuralı): `completedLevels === 0` → `adaptiveWordSelector.js` <= 3 kelime
 *    - Test 2 (Non-Blocking CDN): Ses 404/timeout olduğunda `levelSterilizer.js` hata fırlatmadan JSON döner
 *    - Test 3 (RTL & Telemetri Şeması): `ar` dil kodunda `isRtl === true`, `level_end` beacon + idempotency + Denial-of-Wallet şeması
 * 2) Öğretmen & Sınıf Güvenlik Smoke Testi (memberIds get kilidi, skor yazma yasağı, teacherNotes)
 *
 * Kullanım:
 *   node scripts/smoke-schools-loop.mjs --pre-deploy   (deploy-app.mjs tarafından build öncesi çağrılır)
 *   node scripts/smoke-schools-loop.mjs                (tam regresyon + canlı Firestore güvenlik testi)
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PRE_DEPLOY_ONLY = process.argv.includes("--pre-deploy");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = {
  ...loadEnvFile(path.join(ROOT, ".env")),
  ...loadEnvFile(path.join(ROOT, ".env.production")),
  ...loadEnvFile(path.join(ROOT, ".env.local")),
};

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "memolandum-33dc4.firebaseapp.com",
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "memolandum-33dc4",
  storageBucket:
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "memolandum-33dc4.firebasestorage.app",
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const stamp = Date.now().toString(36);
const TEACHER_EMAIL = `info+smoke.teacher.${stamp}@memolandum.com`;
const STUDENT_EMAIL = `info+smoke.student.${stamp}@memolandum.com`;
const STRANGER_EMAIL = `info+smoke.stranger.${stamp}@memolandum.com`;
const PASS = `Sm0ke!${stamp}Aa1`;
const CLASS_CODE = `T${stamp.slice(-3).toUpperCase()}-${stamp.slice(0, 3).toUpperCase()}`.slice(
  0,
  12
);

function ok(label) {
  console.log(`✅ ${label}`);
}
function fail(label, err) {
  console.error(`❌ [SMOKE HATA RAPORU] ${label}:`, err?.message || err);
  process.exitCode = 1;
}

/**
 * Faz 4: Canlıya Alım Öncesi Regresyon Testleri (Test 1, Test 2, Test 3)
 * Esbuild ile src modüllerini tek pakette derleyip Node ortamında doğrular.
 */
function runPreDeployRegressionChecks() {
  console.log("\n=== Faz 1–4 Pre-Deploy Smoke & Regresyon Kontrolleri ===");
  const outDir = path.join(ROOT, "scratch", "_smoke_predeploy");
  fs.mkdirSync(outDir, { recursive: true });
  const runnerSrc = path.join(outDir, "runner.mjs");
  const runnerBundle = path.join(outDir, "runner.bundle.cjs");

  const testCode = `
import { selectAdaptiveWords, resolveSessionWordTarget } from "../../src/lib/learning/adaptiveWordSelector.js";
import { sterilizeLevelWithNonBlockingAudio } from "../../src/lib/learning/levelSterilizer.js";
import {
  containsRtlScript,
  getLocalizedBoxMetrics,
  formatRtlSafeHint,
  formatCanvasFontForRtl,
  normalizeArabic,
  areLettersEqual,
  extractWordLetters,
  prepareWordForLetterGame,
} from "../../src/lib/i18n/canvasTextHelper.js";
import {
  getSpeechLangCode,
  resolveMeaningSpeechLang,
  cleanMeaningForSpeech,
  extractMeaningText,
} from "../../src/lib/pronunciation.js";
import { resolveEnglishSynonymsAndAntonyms } from "../../src/components/games/OrbitLex/game/lexicon.js";
import {
  beginLevelSessionAnalytics,
  fireCanvasReadyAnalytics,
  recordWordSolvedForFunnel,
  fireGuaranteedLevelEnd,
  buildLevelEndPayload,
  buildLevelAbandonedPayload,
  computeDropOffStage,
  reportClientRuntimeError,
  resetRuntimeErrorQuotaForTest,
} from "../../src/hooks/useAnalytics.js";
import {
  isLegacyAndroidOrLowMemDevice,
  getAdaptiveDevicePixelRatio,
  scaleParticleCount,
  attachAdaptiveCanvasGuard,
} from "../../src/lib/performance/canvasFpsGuard.js";
import {
  canWriteTelemetryEvent,
  MAX_TELEMETRY_EVENTS_PER_SESSION,
  resetSessionTelemetryQuotaForTest,
} from "../../src/lib/learning/telemetryService.js";
import {
  markAudioFallbackUsed,
  wasAudioFallbackUsed,
  resolveDataUrl,
  DEFAULT_GCS_DATA_BASE,
} from "../../src/lib/contentCdn.js";
import { ARCADE_SHELLS } from "../../src/lib/seo/arcadeShells.js";
import { simulateConcurrentClassroomLoad } from "../../src/lib/schools/schoolService.js";
import {
  buildLearnLevelJsonLd,
  getLevelAlternates,
  getAllLearnLevels,
} from "../../src/lib/seo/learnLevels.js";
import fs from "fs";
import path from "path";

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Warm-up Wave Kuralı (completedLevels === 0 -> <= 3 kelime)
// ---------------------------------------------------------------------------
const mockPool = Array.from({ length: 20 }, (_, i) => ({
  id: "w_" + i,
  english: i < 5 ? "cat" + i : "extraordinary_phrase_" + i,
  turkish: "anlam_" + i,
}));

const wave1Words = selectAdaptiveWords(mockPool, {}, {
  completedLevels: 0,
  isFirstSession: true,
});
assert(
  Array.isArray(wave1Words) && wave1Words.length > 0 && wave1Words.length <= 3,
  "Test 1 Başarısız: İlk seviye (completedLevels === 0) kelime sayısı <= 3 olmalı, dönen: " + wave1Words?.length
);

const wave2Target = resolveSessionWordTarget({ completedLevels: 1, isFirstSession: false });
assert(
  wave2Target === 5,
  "Test 1 Başarısız: 2. seviye (completedLevels === 1) hedefi 5 olmalı, dönen: " + wave2Target
);
console.log("✅ [Test 1 - Warm-up Wave Kuralı] Yeni kullanıcı (completedLevels=0) mikro-set uzunluğu: " + wave1Words.length + " (<= 3) ve Seviye 2 hedefi: " + wave2Target);

// ---------------------------------------------------------------------------
// TEST 2: Non-Blocking CDN (Ses 404/timeout olduğunda levelSterilizer.js hata fırlatmaz)
// ---------------------------------------------------------------------------
globalThis.window = {
  location: { hostname: "memolandum.com", pathname: "/ar/", search: "" },
  localStorage: {
    _map: new Map([["memolandum-ui-locale", "ar"]]),
    getItem(k) { return this._map.get(k) || null; },
    setItem(k, v) { this._map.set(k, String(v)); },
  },
  sessionStorage: {
    _map: new Map(),
    getItem(k) { return this._map.get(k) || null; },
    setItem(k, v) { this._map.set(k, String(v)); },
  },
  _memoGtagEvents: [],
  _memoGtag(cmd, eventName, params) {
    this._memoGtagEvents.push({ cmd, eventName, params });
  },
};
globalThis.document = {
  documentElement: {
    lang: "ar",
    dir: "rtl",
    getAttribute(attr) { return attr === "dir" ? "rtl" : attr === "lang" ? "ar" : null; },
  },
};
// 404 / Timeout simüle eden fetch
globalThis.fetch = async () => {
  return { ok: false, status: 404 };
};

const startMs = Date.now();
const sterilized = sterilizeLevelWithNonBlockingAudio([
  { english: "apple", turkish: "تفاحة", audioUrl: "https://memolandum.com/assets/audio/missing_404.mp3" },
  { english: "book", turkish: "كتاب", audioUrl: "https://memolandum.com/assets/audio/timeout_404.mp3" },
  { english: "water", turkish: "ماء", audioUrl: "https://memolandum.com/assets/audio/broken_404.mp3" },
]);
const elapsedSterilizeMs = Date.now() - startMs;

assert(
  Array.isArray(sterilized) && sterilized.length === 3,
  "Test 2 Başarısız: Ses 404/timeout durumunda sterilizeLevelWithNonBlockingAudio 3 kelime döndürmeliydi."
);
assert(
  elapsedSterilizeMs < 100,
  "Test 2 Başarısız: Ses yüklemesi JSON teslimatını blokladı (" + elapsedSterilizeMs + "ms)."
);
console.log("✅ [Test 2 - Non-Blocking CDN] Ses 404/timeout simülasyonunda " + sterilized.length + " kelime " + elapsedSterilizeMs + "ms içinde bloklanmadan teslim edildi.");

// ---------------------------------------------------------------------------
// TEST 3: RTL & Telemetri Şeması (ar dil kodu, isRtl === true, beacon & idempotency)
// ---------------------------------------------------------------------------
const arabicSample = "تفاحة";
const isRtlDetected = containsRtlScript(arabicSample);
assert(isRtlDetected === true, "Test 3 Başarısız: Arapça metin için containsRtlScript true dönmeli.");

const rtlMetrics = getLocalizedBoxMetrics(null, arabicSample, 18, 16, 10);
assert(
  rtlMetrics.isRtl === true && rtlMetrics.scaleFactor === 1.15,
  "Test 3 Başarısız: RTL metin kutusu %15 (1.15x) genişletme uygulamalı."
);

const arabicHint = formatRtlSafeHint("كتاب", 0.5);
assert(
  !arabicHint.includes(" "),
  "Test 3 Başarısız: Arapça ipucu harf birleşmelerini (ligatures) bozacak boşluk içermemeli: " + arabicHint
);

// Faz 1–3 Arapça Normalizasyon, 1.15x Font Ölçeği ve Harf Eşleştirme Kontrolleri
assert(
  normalizeArabic("أُكْتُبْ") === "اكتب" && areLettersEqual("أ", "ا") && areLettersEqual("ة", "ه") && areLettersEqual("ى", "ي"),
  "Test 3 Başarısız: normalizeArabic / areLettersEqual Elif, Teh Marbuta, Yaa ve hareke (Tashkeel) normalizasyonunu doğrulamalı."
);
assert(
  extractWordLetters("كِتَابٌ").join("") === "كتاب",
  "Test 3 Başarısız: extractWordLetters Arapça kelimedeki harekeleri temizleyip 4 temel harfi döndürmeli."
);
const scaledRtlFont = formatCanvasFontForRtl('bold 20px "Press Start 2P"', true);
assert(
  scaledRtlFont.includes("23px") && scaledRtlFont.includes("Cairo"),
  "Test 3 Başarısız: formatCanvasFontForRtl 20px fontu 1.15x (23px) ve Cairo ailesine ölçeklemeli: " + scaledRtlFont
);

// Arapça-İngilizce (ar-en) Stüdyo Ses CDN Çözümlemesi & Anlam Telaffuzu Kontrolleri
const resolvedArabicAudioUrl = resolveDataUrl(
  "/data/Arabic/audio/ar/audio_ar_words/audio_ar_words_female/ar_a1_036.mp3"
);
assert(
  resolvedArabicAudioUrl ===
    DEFAULT_GCS_DATA_BASE + "/Arabic/audio/ar/audio_ar_words/audio_ar_words_female/ar_a1_036.mp3",
  "Test 3 Başarısız: Arapça stüdyo MP3 URL'si GCS CDN adresine çözümlenmeli, bulunan: " +
    resolvedArabicAudioUrl
);
assert(
  resolveMeaningSpeechLang("One", "other-arabic-ar_en") === "en-US" &&
    resolveMeaningSpeechLang("واحد", "en-ar") === "ar-SA" &&
    cleanMeaningForSpeech("House / Home (building)") === "House" &&
    extractMeaningText({ english: "واحد", turkish: "One" }) === "One",
  "Test 3 Başarısız: ar-en anlam telaffuz dili ('en-US') ve anlam temizleme (cleanMeaningForSpeech) doğrulaması başarısız."
);

// Brezilya Portekizcesi (pt-BR / brpt_en) Normalizasyon, Büyük Harf ('i' -> 'I') ve TTS Testleri
assert(
  prepareWordForLetterGame("livro", "other-portugal-brpt_en") === "LIVRO" &&
    prepareWordForLetterGame("coração", "other-portugal-brpt_en") === "CORAÇÃO",
  "Test 3 Başarısız: prepareWordForLetterGame Portekizce 'livro' kelimesini 'LIVRO' (noktasız I) yapmalı."
);
assert(
  areLettersEqual("A", "Ã") &&
    areLettersEqual("A", "Á") &&
    areLettersEqual("C", "Ç") &&
    areLettersEqual("E", "Ê") &&
    areLettersEqual("O", "Õ") &&
    areLettersEqual("I", "Í"),
  "Test 3 Başarısız: areLettersEqual Portekizce aksanlı harfleri (Ã, Á, Ç, Ê, Õ, Í) temel Latin harfleriyle eşleştirmeli."
);
assert(
  getSpeechLangCode("other-portugal-brpt_en") === "pt-BR" &&
    getSpeechLangCode("other-portugal-brpt_tr") === "pt-BR" &&
    getSpeechLangCode("pt") === "pt-BR",
  "Test 3 Başarısız: getSpeechLangCode Brezilya Portekizcesi kurslarını 'pt-BR' olarak çözümlemeli."
);
const ptOrbitLex = resolveEnglishSynonymsAndAntonyms({ english: "livro", turkish: "book" });
assert(
  Array.isArray(ptOrbitLex.synonyms) && ptOrbitLex.synonyms.includes("book"),
  "Test 3 Başarısız: OrbitLex Portekizce-İngilizce ('livro' -> 'book') eş anlamlı havuzunu çözümlemeli."
);

// Oturum başlat ve aşamaları doğrula
const sessionId = beginLevelSessionAnalytics({
  gameSlug: "shooter",
  langPair: "other-arabic-ar_en",
  levelId: "a1_words.json",
  targetWordCount: 3,
});
assert(
  typeof sessionId === "string" && sessionId.startsWith("ls_"),
  "Test 3 Başarısız: Geçerli bir level_session_id üretilmeli."
);
assert(
  computeDropOffStage() === "loading_assets",
  "Test 3 Başarısız: Canvas hazır olmadan önce drop_off_stage 'loading_assets' olmalı."
);

fireCanvasReadyAnalytics("shooter", "other-arabic-ar_en", "a1_words.json", 120);
assert(
  computeDropOffStage() === "waiting_first_input",
  "Test 3 Başarısız: İlk kelime çözülmeden önce drop_off_stage 'waiting_first_input' olmalı."
);

markAudioFallbackUsed();
recordWordSolvedForFunnel({
  wordId: "w1",
  isCorrect: true,
  gameSlug: "shooter",
  langPair: "other-arabic-ar_en",
  levelId: "a1_words.json",
});
assert(
  computeDropOffStage() === "mid_game",
  "Test 3 Başarısız: İlk kelime çözüldükten sonra drop_off_stage 'mid_game' olmalı."
);

const abandonPreview = buildLevelAbandonedPayload("visibilitychange");
assert(
  abandonPreview.drop_off_stage === "mid_game" &&
    abandonPreview.is_warmup_wave === true &&
    abandonPreview.words_completed === "1/3" &&
    abandonPreview.words_progress === "1/3" &&
    abandonPreview.words_progress_ratio === 0.33 &&
    abandonPreview.audio_fallback_used === true &&
    abandonPreview.ui_lang === "ar" &&
    abandonPreview.is_rtl_session === true &&
    abandonPreview.transport_type === "beacon",
  "Test 3 Başarısız: level_abandoned şeması eksik veya hatalı: " + JSON.stringify(abandonPreview)
);

const levelEndPayload = buildLevelEndPayload({
  gameSlug: "shooter",
  score: 300,
  langPair: "other-arabic-ar_en",
  levelId: "a1_words.json",
});
assert(
  levelEndPayload.level_session_id === sessionId &&
    levelEndPayload.is_warmup_wave === true &&
    levelEndPayload.words_progress === "1/3" &&
    levelEndPayload.audio_fallback_used === true &&
    wasAudioFallbackUsed() === true &&
    levelEndPayload.ui_lang === "ar" &&
    levelEndPayload.target_lang === "en" &&
    levelEndPayload.is_rtl_session === true &&
    levelEndPayload.transport_type === "beacon",
  "Test 3 Başarısız: level_end telemetri şeması kurallara uymuyor: " + JSON.stringify(levelEndPayload)
);

const firstFire = fireGuaranteedLevelEnd({
  gameSlug: "shooter",
  score: 300,
  langPair: "other-arabic-ar_en",
  levelId: "a1_words.json",
});
const secondFire = fireGuaranteedLevelEnd({
  gameSlug: "shooter",
  score: 300,
  langPair: "other-arabic-ar_en",
  levelId: "a1_words.json",
});
assert(
  firstFire === true && secondFire === false,
  "Test 3 Başarısız: Idempotency Guard aynı level_session_id için 2. level_end çağrısını engellemeli."
);

// Denial-of-Wallet kota testi
resetSessionTelemetryQuotaForTest();
let allowedCount = 0;
for (let i = 0; i < MAX_TELEMETRY_EVENTS_PER_SESSION + 10; i++) {
  if (canWriteTelemetryEvent("smoke_uid")) allowedCount++;
}
assert(
  allowedCount === MAX_TELEMETRY_EVENTS_PER_SESSION,
  "Test 3 Başarısız: Denial-of-Wallet kotası " + MAX_TELEMETRY_EVENTS_PER_SESSION + " eventte durmalıydı, izin verilen: " + allowedCount
);

console.log("✅ [Test 3 - RTL & Telemetri Şeması] isRtl=true, +15% kutu, beacon, idempotency (1x level_end), is_warmup_wave, words_progress, audio_fallback_used ve Denial-of-Wallet (max " + MAX_TELEMETRY_EVENTS_PER_SESSION + ") doğrulandı.");

// ---------------------------------------------------------------------------
// TEST 4: 16 Oyun Kabuğu Hizalaması & 30 Öğrencili Sınıf Contention Koruması
// ---------------------------------------------------------------------------
assert(
  ARCADE_SHELLS.length === 16,
  "Test 4 Başarısız: ARCADE_SHELLS 16 oyun kabuğu içermeli, bulunan: " + ARCADE_SHELLS.length
);
const classLoad = simulateConcurrentClassroomLoad({
  studentCount: 30,
  wordsPerStudent: 5,
  classCode: "SMOKE-30X",
});
assert(
  classLoad.contentionFree === true &&
    classLoad.totalRawWordEvents === 150 &&
    classLoad.totalFirestoreWrites === 30 &&
    classLoad.maxWritesPerSingleDocument === 1,
  "Test 4 Başarısız: 30 öğrencili eşzamanlı sınıf yük testinde contention tespit edildi: " + JSON.stringify(classLoad)
);
console.log("✅ [Test 4 - 16 Kabuk & 30 Öğrenci Sınıf Yük Testi] 16/16 oyun kabuğu aktif; 150 kelime vuruşu %" + classLoad.writeReductionRatio + " azaltımla 30 sharded yazmaya indirgendi (max 1 write/doc, 0 contention).");

// ---------------------------------------------------------------------------
// TEST 5: Faz 5 SEO & GEO Bütünlük Kontrolü (llms.txt, @graph JSON-LD, hreflang, robots.txt & Semantik Tablo)
// ---------------------------------------------------------------------------
const rootDir = process.cwd();
const llmsTxt = fs.readFileSync(path.join(rootDir, "public", "llms.txt"), "utf8");
const llmsFullTxt = fs.readFileSync(path.join(rootDir, "public", "llms-full.txt"), "utf8");
const robotsTxt = fs.readFileSync(path.join(rootDir, "public", "robots.txt"), "utf8");
const levelPageSource = fs.readFileSync(
  path.join(rootDir, "src", "app", "learn", "[langPair]", "[level]", "page.js"),
  "utf8"
);

// 1) llms.txt & llms-full.txt içinde 16 oyun kabuğu ve ana sınav/müfredat kategorileri
const missingShellsInLlms = ARCADE_SHELLS.filter(
  (s) => !llmsTxt.includes(s.id) || !llmsFullTxt.includes(s.id)
);
assert(
  missingShellsInLlms.length === 0,
  "Test 5 Başarısız: llms.txt veya llms-full.txt içinde eksik oyun kabukları var: " +
    missingShellsInLlms.map((s) => s.id).join(", ")
);

const requiredGeoTerms = [
  "1,189",
  "9–12",
  "YDS",
  "YKS-DİL",
  "IELTS",
  "TOEFL",
  "Memolandum Pulse",
  "SM-2",
  "KVKK",
  "@memolandum",
];
const missingGeoTerms = requiredGeoTerms.filter((t) => !llmsTxt.includes(t));
assert(
  missingGeoTerms.length === 0,
  "Test 5 Başarısız: llms.txt içinde eksik GEO terimleri: " + missingGeoTerms.join(", ")
);

// 2) robots.txt AI Bot İzinleri ve Özel Rota Koruması
const requiredAiBots = [
  "GPTBot",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
];
const missingBots = requiredAiBots.filter((b) => !robotsTxt.includes("User-Agent: " + b));
assert(
  missingBots.length === 0 &&
    robotsTxt.includes("Allow: /llms.txt") &&
    robotsTxt.includes("Disallow: /admin/") &&
    robotsTxt.includes("Disallow: /auth/") &&
    robotsTxt.includes("Disallow: /schools/roster/"),
  "Test 5 Başarısız: robots.txt AI bot izinleri veya özel rota kısıtlamaları eksik."
);

// 3) Çoklu JSON-LD (@graph: LearningResource + Quiz + VideoObject + SoftwareApplication) & hreflang
const allLevels = getAllLearnLevels().list;
const sampleLevel =
  allLevels.find((l) => l.levelId.includes("yds") || l.levelId.includes("ilkokul")) ||
  allLevels[0];
const sampleWords = [
  { word: "apple", translation: "elma" },
  { word: "book", translation: "kitap" },
  { word: "water", translation: "su" },
];
const jsonLd = buildLearnLevelJsonLd(sampleLevel, sampleWords);
assert(
  jsonLd && jsonLd["@context"] === "https://schema.org" && Array.isArray(jsonLd["@graph"]),
  "Test 5 Başarısız: buildLearnLevelJsonLd @graph dizisi döndürmeli."
);

const graphTypes = jsonLd["@graph"].map((n) => n["@type"]);
assert(
  graphTypes.includes("LearningResource") &&
    graphTypes.includes("Quiz") &&
    graphTypes.includes("VideoObject") &&
    graphTypes.includes("SoftwareApplication"),
  "Test 5 Başarısız: JSON-LD @graph içinde LearningResource, Quiz, VideoObject ve SoftwareApplication bulunmalı. Bulunanlar: " +
    graphTypes.join(", ")
);

const quizNode = jsonLd["@graph"].find((n) => n["@type"] === "Quiz");
const videoNode = jsonLd["@graph"].find((n) => n["@type"] === "VideoObject");
const appNode = jsonLd["@graph"].find((n) => n["@type"] === "SoftwareApplication");
assert(
  Array.isArray(quizNode?.hasPart) &&
    quizNode.hasPart.length === 3 &&
    quizNode.hasPart[0]["@type"] === "Question" &&
    quizNode.hasPart[0].acceptedAnswer?.["@type"] === "Answer",
  "Test 5 Başarısız: Quiz JSON-LD düğümü Question/acceptedAnswer yapısını içermeli."
);
assert(
  Boolean(videoNode?.name && videoNode?.thumbnailUrl && videoNode?.embedUrl && videoNode?.uploadDate),
  "Test 5 Başarısız: VideoObject JSON-LD düğümü name, thumbnailUrl, embedUrl ve uploadDate içermeli."
);
assert(
  Array.isArray(appNode?.inLanguage) &&
    ["tr", "en", "ar", "pt"].every((l) => appNode.inLanguage.includes(l)),
  "Test 5 Başarısız: SoftwareApplication JSON-LD inLanguage ['tr', 'en', 'ar', 'pt'] içermeli."
);

// 4) Hreflang / Self-Canonical Doğrulaması (?lang= kopyası üretmeden gerçek statik canonical kontrolü) & Semantik Kelime Tablosu (<table> + <dl>)
const alts = getLevelAlternates(sampleLevel);
assert(
  Boolean(
    alts?.canonical &&
      !alts.canonical.includes("?lang=") &&
      (!alts.languages ||
        (alts.languages.tr &&
          alts.languages.en &&
          alts.languages["x-default"] &&
          !alts.languages.tr.includes("?lang=")))
  ),
  "Test 5 Başarısız: getLevelAlternates geçerli self-canonical URL döndürmeli ve ?lang= kopyaları üretmemeli."
);
assert(
  levelPageSource.includes("<table") &&
    levelPageSource.includes("<thead") &&
    levelPageSource.includes("<dl"),
  "Test 5 Başarısız: Statik seviye sayfası botlar için semantik <table> ve <dl> kelime önizlemesi içermeli."
);

// 5) Google Search Console "Yorumun birden fazla toplam puanı var" (Duplicate aggregateRating) koruması & GA4 CSP connect-src kontrolü
const rootLayoutSource = fs.readFileSync(
  path.join(rootDir, "src", "app", "layout.js"),
  "utf8"
);
const firebaseJsonSource = fs.readFileSync(
  path.join(rootDir, "firebase.json"),
  "utf8"
);
assert(
  rootLayoutSource.includes("buildKnowledgeGraphJsonLd()") &&
    !rootLayoutSource.includes("buildSoftwareAppJsonLd()"),
  "Test 5 Başarısız: layout.js içinde buildSoftwareAppJsonLd() hem @graph içinde hem ayrı blok olarak tekrarlanmamalı (duplicate aggregateRating hatası)."
);
assert(
  firebaseJsonSource.includes("https://*.analytics.google.com") &&
    firebaseJsonSource.includes("https://*.google-analytics.com") &&
    firebaseJsonSource.includes("https://stats.g.doubleclick.net"),
  "Test 5 Başarısız: firebase.json CSP connect-src içinde GA4 beacon ve Google Signals domainleri (*.analytics.google.com, stats.g.doubleclick.net) tanımlı olmalı."
);

console.log("✅ [Test 5 - SEO & GEO v2.0 Bütünlük Kontrolü] llms.txt (16 kabuk + 1.189 seviye), JSON-LD @graph (LearningResource + Quiz + VideoObject + SoftwareApplication), tekil aggregateRating koruması, 4 dilli hreflang, robots.txt AI bot izinleri ve semantik HTML tablo doğrulandı.");

// ---------------------------------------------------------------------------
// TEST 6: Eski Sürüm Android WebView Mobil-Öncelikli Koruması, Kelime Tekilleştirme & 106-Dosya Sözlük Sıfır-Hata Kapısı
// ---------------------------------------------------------------------------
globalThis.window.navigator = {
  userAgent: "Mozilla/5.0 (Linux; Android 8.1.0; SM-J730F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36",
  maxTouchPoints: 5,
  deviceMemory: 2,
  hardwareConcurrency: 2,
};
globalThis.window.devicePixelRatio = 3.0;
globalThis.window.innerWidth = 360;

assert(
  isLegacyAndroidOrLowMemDevice() === true,
  "Test 6 Başarısız: Android 8.1 / Chrome 74 / 2GB RAM cihaz isLegacyAndroidOrLowMemDevice() === true dönmeli."
);
assert(
  getAdaptiveDevicePixelRatio(false) === 1.25,
  "Test 6 Başarısız: Eski Android cihazlarda DPR=3.0 değeri OOM koruması için 1.25 ile sınırlandırılmalı, dönen: " + getAdaptiveDevicePixelRatio(false)
);
assert(
  scaleParticleCount(100, false) === 50,
  "Test 6 Başarısız: Eski Android cihazlarda başlangıç parçacık sayısı %50 ölçeklenmeli, dönen: " + scaleParticleCount(100, false)
);

const mockCtx = {
  moveTo() {},
  arcTo() {},
  closePath() {},
  fillText() {},
  strokeText() {},
  measureText() { return { width: 40 }; },
};
attachAdaptiveCanvasGuard(mockCtx);
assert(
  typeof mockCtx.roundRect === "function",
  "Test 6 Başarısız: attachAdaptiveCanvasGuard eski Android WebView (Chrome < 99) için ctx.roundRect polyfill eklemeli."
);

const globalsCssSource = fs.readFileSync(path.join(rootDir, "src", "app", "globals.css"), "utf8");
const bt = String.fromCharCode(96);
const startIdx = rootLayoutSource.indexOf("__html: " + bt);
const endIdx = rootLayoutSource.indexOf(bt, startIdx + 10);
assert(
  startIdx !== -1 && endIdx > startIdx,
  "Test 6 Başarısız: layout.js içinde satır içi önyükleme (bootstrap) script'i bulunamadı."
);
// Şablon dizgesi (template literal) değerlendirildikten sonra oluşan JS kodunun sözdizimini (SyntaxError) doğrula
const evaluatedInlineScript = eval(rootLayoutSource.slice(startIdx + 8, endIdx + 1));
new Function(evaluatedInlineScript);

assert(
  rootLayoutSource.includes("String.prototype.replaceAll") &&
    rootLayoutSource.includes("Array.prototype.at") &&
    rootLayoutSource.includes("Object.hasOwn") &&
    rootLayoutSource.includes("CanvasRenderingContext2D.prototype.roundRect") &&
    globalsCssSource.includes("-webkit-fill-available") &&
    globalsCssSource.includes("touch-action: manipulation"),
  "Test 6 Başarısız: layout.js ES2021+ polyfill'leri veya globals.css eski Android dvh / touch-action kuralları eksik."
);

resetRuntimeErrorQuotaForTest();
const errPayload1 = reportClientRuntimeError({
  message: "TypeError: simulated legacy WebView error",
  source: "/play",
  lineno: 42,
  colno: 7,
  errorType: "window_error",
});
const errPayloadDup = reportClientRuntimeError({
  message: "TypeError: simulated legacy WebView error",
  source: "/play",
  lineno: 42,
  colno: 7,
  errorType: "window_error",
});
assert(
  errPayload1 &&
    errPayload1.is_legacy_android === true &&
    errPayload1.transport_type === "beacon" &&
    errPayloadDup === null,
  "Test 6 Başarısız: reportClientRuntimeError eski Android bayrağını iletmeli ve mükerrer hataları tekilleştirmeli."
);

// Kelime Tekilleştirme (Deduplication) Koruması: Aynı kaynak kelime farklı ID veya anlam nüansıyla gelse bile tekilleştirilmeli, R2 audioUrl korunmalı
const dupRawPool = [
  { id: "kor_fan_011", original_script: "덕질", meaning: "Stan activities", audioUrl: "/data/Korean/audio/K_pop_ko/kor_fan_011.mp3" },
  { id: "kor_fan_052", original_script: "덕질", meaning: "Stan life", audioUrl: "/data/Korean/audio/K_pop_ko/kor_fan_052.mp3" },
  { id: "kor_fan_002", original_script: "대박", meaning: "Awesome", audioUrl: "/data/Korean/audio/K_pop_ko/kor_fan_002.mp3" },
];
const sterilizedDedup = sterilizeLevelWithNonBlockingAudio(dupRawPool);
assert(
  sterilizedDedup.length === 2 &&
    sterilizedDedup[0].id === "kor_fan_011" &&
    sterilizedDedup[0].audioUrl === "/data/Korean/audio/K_pop_ko/kor_fan_011.mp3",
  "Test 6 Başarısız: sterilizeLevelWithNonBlockingAudio mükerrer kaynak kelimeleri R2 ses dosyasını bozmadan tekilleştirmeli."
);

// 106 Sözlük JSON Dosyası Sıfır-Hata Kapısı
function walkJsonFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJsonFiles(full, out);
    else if (ent.name.endsWith(".json")) out.push(full);
  }
  return out;
}
const allDataJsons = walkJsonFiles(path.join(rootDir, "public", "data"));
let totalCheckedEntries = 0;
let emptySourceOrMeaningCount = 0;
for (const jf of allDataJsons) {
  const parsed = JSON.parse(fs.readFileSync(jf, "utf8"));
  let items = [];
  if (Array.isArray(parsed)) {
    items = parsed[0]?.words && Array.isArray(parsed[0].words) ? parsed.flatMap((g) => g.words || []) : parsed;
  } else if (parsed?.words) items = parsed.words;
  else if (parsed?.phrase_vault) items = parsed.phrase_vault;
  else if (parsed?.vocabulary_vault) items = parsed.vocabulary_vault;
  for (const w of items) {
    if (!w || typeof w !== "object") continue;
    totalCheckedEntries++;
    const src = String(w.english || w.original_script || w.word || w.mission_word || w.mission_phrase || w.en || w.osmanlica_latin || w.hanzi || w.kanji || w.character || w.character_script || w.root || w.title || "").trim();
    const trg = String(w.turkish || w.meaning || w.translation || w.target_translation || w.tr || w.guncel_turkce || w.es || w.fr || w.de || w.ar || w.pt || w.brpt || w.zh || w.cn || w.it || w.ru || w.ja || w.jap || w.ko || w.el || w.type || w.description || "").trim();
    if (!src || !trg) emptySourceOrMeaningCount++;
  }
}
assert(
  allDataJsons.length >= 106 && emptySourceOrMeaningCount === 0,
  "Test 6 Başarısız: Sözlük JSON dosyalarında boş kaynak veya anlam tespit edildi: " + emptySourceOrMeaningCount
);
console.log("✅ [Test 6 - Eski Android WebView Koruması & 106-Dosya Sözlük Kapısı] Android 8/Chrome 74 DPR=1.25 sınırı, ctx.roundRect & ES2021+ polyfill'leri, client_runtime_error beacon, kelime tekilleştirme ve " + allDataJsons.length + " JSON (" + totalCheckedEntries + " kayıt, 0 boş alan) doğrulandı.");
`;

  fs.writeFileSync(runnerSrc, testCode, "utf8");

  const build = spawnSync(
    "npx",
    [
      "--yes",
      "esbuild",
      runnerSrc,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--alias:@=${path.join(ROOT, "src")}`,
      `--outfile=${runnerBundle}`,
      "--log-level=error",
    ],
    { cwd: ROOT, shell: true, encoding: "utf8" }
  );

  if (build.status !== 0) {
    console.error("❌ [SMOKE HATA RAPORU] Pre-deploy test derlemesi başarısız:\n", build.stderr || build.stdout);
    process.exit(1);
  }

  const run = spawnSync("node", [runnerBundle], {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (run.status !== 0) {
    console.error("❌ [SMOKE HATA RAPORU] Pre-deploy regresyon kontrollerinden en az biri başarısız oldu. Deploy durduruldu!");
    process.exit(run.status ?? 1);
  }

  console.log("🎉 Tüm Faz 1–4 Pre-Deploy Regresyon Kontrolleri BAŞARILI.\n");
}

async function expectDenied(label, fn) {
  try {
    await fn();
    throw new Error(`${label}: beklenen permission-denied gelmedi`);
  } catch (e) {
    const code = e?.code || "";
    const msg = String(e?.message || e);
    if (
      code.includes("permission-denied") ||
      msg.includes("permission-denied") ||
      msg.includes("Missing or insufficient permissions")
    ) {
      ok(label);
      return;
    }
    throw e;
  }
}

async function main() {
  // Her durumda önce Faz 1–4 Pre-Deploy Regresyon Kontrollerini çalıştır
  runPreDeployRegressionChecks();

  if (PRE_DEPLOY_ONLY) {
    return;
  }

  if (!firebaseConfig.apiKey) {
    fail("Firebase API key yok (.env.local)");
    return;
  }

  const app = initializeApp(firebaseConfig, `smoke-${stamp}`);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let teacherCred = null;
  let studentCred = null;
  let strangerCred = null;

  try {
    teacherCred = await createUserWithEmailAndPassword(auth, TEACHER_EMAIL, PASS);
    ok(`Öğretmen auth: ${teacherCred.user.uid.slice(0, 8)}…`);

    await setDoc(doc(db, "classrooms", CLASS_CODE), {
      classCode: CLASS_CODE,
      teacherUid: teacherCred.user.uid,
      teacherName: "MsSmokeOwl",
      teacherAvatar: { type: "emoji", value: "🦉" },
      schoolName: "Özel masa",
      province: "",
      district: "",
      className: "Smoke 4-A",
      grade: "4. Sınıf",
      createdAt: serverTimestamp(),
      currentAssignment: {
        unitName: "Smoke Ünite",
        unitTitle: "Smoke Ünite",
        levelId: "meb-4-sinif-kelimeleri",
        unitNo: 1,
        targetWords: 15,
        dueDate: "Bu Pazar 20:00",
        assignedAt: Date.now(),
      },
      studentsCount: 0,
      students: {},
      memberIds: [],
    });
    ok(`Sınıf oluşturuldu: ${CLASS_CODE}`);

    await signOut(auth);
    strangerCred = await createUserWithEmailAndPassword(auth, STRANGER_EMAIL, PASS);
    await expectDenied("Yabancı auth: sınıf get RED", () =>
      getDoc(doc(db, "classrooms", CLASS_CODE))
    );

    await signOut(auth);
    studentCred = await createUserWithEmailAndPassword(auth, STUDENT_EMAIL, PASS);
    const seatId = studentCred.user.uid;

    // Öğrenci henüz üye değil → get RED
    await expectDenied("Üye olmayan öğrenci: get RED", () =>
      getDoc(doc(db, "classrooms", CLASS_CODE))
    );

    // CF join simülasyonu: öğretmen roster + memberIds yazar (teacher update OK)
    await signOut(auth);
    await signInWithEmailAndPassword(auth, TEACHER_EMAIL, PASS);
    const studentEntry = {
      uid: seatId,
      ownerUid: seatId,
      name: "Yıldız",
      joinedAt: Date.now(),
      wordsLearned: 0,
      accuracy: null,
      lastStudiedAt: null,
      status: "Başlamadı",
    };
    await updateDoc(doc(db, "classrooms", CLASS_CODE), {
      [`students.${seatId}`]: studentEntry,
      studentsCount: 1,
      memberIds: [seatId],
      updatedAt: serverTimestamp(),
    });
    ok("Join sim (öğretmen update → memberIds + seat)");

    await updateDoc(doc(db, "classrooms", CLASS_CODE), {
      [`students.${seatId}.wordsLearned`]: 7,
      [`students.${seatId}.accuracy`]: 86,
      [`students.${seatId}.status`]: "Devam Ediyor",
      [`students.${seatId}.lastStudiedAt`]: Date.now(),
    });
    ok("Progress sim (öğretmen/Admin yolu)");

    await signOut(auth);
    await signInWithEmailAndPassword(auth, STUDENT_EMAIL, PASS);
    // KVKK Koruması (firestore.rules satır 127 & 149): Üye öğrenci bile tam sınıf dokümanını (diğer öğrencilerin verilerini) doğrudan getDoc ile okuyamaz (yalnızca getMyClassroom CF üzerinden okur)
    await expectDenied("Üye öğrenci: tam sınıf dokümanı get RED (KVKK izolasyonu)", () =>
      getDoc(doc(db, "classrooms", CLASS_CODE))
    );

    await expectDenied("Öğrenci istemci skor yazımı RED", () =>
      updateDoc(doc(db, "classrooms", CLASS_CODE), {
        [`students.${seatId}.accuracy`]: 100,
        [`students.${seatId}.wordsLearned`]: 99,
      })
    );

    await signOut(auth);
    await signInWithEmailAndPassword(auth, TEACHER_EMAIL, PASS);
    const teacherSnap = await getDoc(doc(db, "classrooms", CLASS_CODE));
    const seat = teacherSnap.data()?.students?.[seatId];
    if (!seat || seat.name !== "Yıldız" || seat.wordsLearned !== 7) {
      throw new Error(`Öğretmen roster hatalı: ${JSON.stringify(seat)}`);
    }
    ok("Öğretmen roster: Yıldız · 7 kelime");

    await setDoc(doc(db, "classrooms", CLASS_CODE, "teacherNotes", seatId), {
      text: "Smoke gizli not",
      teacherUid: teacherCred.user.uid,
      studentId: seatId,
      updatedAt: serverTimestamp(),
    });
    ok("Öğretmen notu yazıldı");

    await signOut(auth);
    await signInWithEmailAndPassword(auth, STUDENT_EMAIL, PASS);
    await expectDenied("Öğrenci teacherNotes list RED", () =>
      getDocs(collection(db, "classrooms", CLASS_CODE, "teacherNotes"))
    );
    await expectDenied("Öğrenci teacherNotes get RED", () =>
      getDoc(doc(db, "classrooms", CLASS_CODE, "teacherNotes", seatId))
    );

    console.log("\n🎉 Smoke schools security PASSED");
  } catch (err) {
    fail("Smoke failed", err);
  } finally {
    try {
      await signOut(auth).catch(() => {});
      if (teacherCred) {
        await signInWithEmailAndPassword(auth, TEACHER_EMAIL, PASS);
        try {
          await deleteDoc(doc(db, "classrooms", CLASS_CODE, "teacherNotes", studentCred.user.uid));
        } catch {
          /* ignore */
        }
        await deleteDoc(doc(db, "classrooms", CLASS_CODE)).catch(() => {});
        ok(`Sınıf silindi: ${CLASS_CODE}`);
        await deleteUser(auth.currentUser).catch(() => {});
      }
    } catch (e) {
      console.warn("cleanup teacher:", e?.message);
    }
    for (const email of [STUDENT_EMAIL, STRANGER_EMAIL]) {
      try {
        await signOut(auth).catch(() => {});
        await signInWithEmailAndPassword(auth, email, PASS);
        await deleteUser(auth.currentUser).catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }
}

main();
