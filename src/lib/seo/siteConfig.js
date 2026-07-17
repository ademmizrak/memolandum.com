/** Memolandum SEO / GEO — Optimize edilmiş anahtar kelime mimarisi
 *
 *  ⚠️  TİKTOK GÜVENLİK NOTU:
 *  "Subliminal" ve "brain hacking" terimleri TikTok içerik politikasında
 *  "zihinsel manipülasyon" kategorisine girebilir ve kaldırılabilir.
 *  Bunların yerine: "implicit learning", "memory science", "cognitive training"
 *  gibi akademik ve nötr eşdeğerler kullanılmalıdır.
 */

export const SITE_URL = "https://memolandum.com";

export const SITE_NAME = "Memolandum";

export const SITE_TAGLINE = "Oyna, Ezberle";

/* ── Başlık & Açıklama (Google'ın önerdiği ≤60 / ≤160 karakter) ─────────── */
export const DEFAULT_TITLE =
  "Memolandum — Kelime Ezberleme Oyunu | Spaced Repetition & AI Çeviri";
// 68 karakter — güçlü anahtar kelime (kelime ezberleme oyunu) + brand

export const DEFAULT_DESCRIPTION =
  "Arcade oyunlarla ingilizce kelime ezberle — spaced repetition, active recall ve dual coding teorisiyle. Gemini AI çeviri, kelime kasası ve 13+ dil. Ücretsiz başla!";
// 164 karakter — eylem çağrısı + anahtar kelimeler + özellikler

/* ── Genişletilmiş Anahtar Kelime Bankası ───────────────────────────────── */
export const KEYWORDS = [
  // 🇹🇷 Türkçe — Yüksek hacimli ana kelimeler
  "kelime ezberleme oyunu",
  "ingilizce kelime ezberleme",
  "ingilizce kelime öğrenme",
  "kelime öğrenme uygulaması",
  "dil öğrenme oyunu",
  "oyna ezberle",

  // 🇹🇷 Türkçe — Uzun kuyruk
  "YDS kelime ezberleme",
  "YKS ingilizce kelimeler",
  "A1 A2 B1 B2 ingilizce kelimeler",
  "ingilizce kelime tekrar yöntemi",
  "oyunla ingilizce öğrenme",
  "ücretsiz kelime ezberleme sitesi",
  "aralıklı tekrar yöntemi türkçe",
  "spaced repetition türkçe uygulama",
  "Anki alternatifi Türkçe",

  // 🇬🇧 İngilizce
  "vocabulary game",
  "word memorization game",
  "learn vocabulary with games",
  "spaced repetition vocabulary",
  "active recall vocabulary",
  "free vocabulary learning app",
  "english vocabulary game online",
  "vocabulary arcade game online free",
  "gamified vocabulary learning",
  "memorize english words fast",
  "implicit learning vocabulary",
  "cognitive vocabulary training",
  "memory science language learning",
  "play games to learn english words",

  // 🌍 Çoklu dil hedef kitleleri
  "english turkish vocabulary",
  "german vocabulary game",
  "french vocabulary game online",
  "russian vocabulary game",
  "portuguese vocabulary learning",
  "korean vocabulary game online",
  "italian vocabulary game",
  "greek vocabulary learning app",
  "japanese vocabulary arcade",
  "arabic english vocabulary learning",
  "chinese vocabulary game free",

  // 🧠 Akademik/Bilimsel — SEO & GEO (TikTok güvenli)
  "spaced repetition app free",
  "active recall study method",
  "dual coding learning",
  "gamification education",
  "neuroscience vocabulary learning",
  "memory retention techniques",
  "ebbinghaus forgetting curve app",

  // 🤖 GEO — AI asistan sorgularına yönelik
  "memolandum",
  "best free vocabulary game 2025",
  "duolingo alternative free",
  "quizlet alternative game based",
  "anki alternative fun",
];

export const OG_IMAGE = `${SITE_URL}/memolandum_preview.png`;

/* ── Oyun başlıkları — Anahtar kelime güçlendirilmiş ───────────────────── */
export const GAME_META = {
  shooter: {
    title: "Retro Shooter — Kelime Uzay Nişancısı | Memolandum Kelime Oyunu",
    description:
      "Siber uzay shooter oynayarak ingilizce kelimeleri vurun ve spaced repetition ile ezberleyin. Ücretsiz kelime öğrenme oyunu — Memolandum.",
  },
  breakout: {
    title: "Breakout — Kelime Kırma Oyunu | İngilizce Kelime Ezberleme",
    description:
      "Classic breakout mekaniğiyle kelime bloklarını kırın, active recall ile anlamları pekiştirin. Ücretsiz ingilizce kelime oyunu — Memolandum.",
  },
  highway: {
    title: "Highway Survivor — İngilizce Kelime Oyunu | Memolandum",
    description:
      "Hızlı karar vererek doğru kelime şeritlerinde ilerleyin. Arcade ingilizce kelime öğrenme oyunu — ücretsiz.",
  },
  invaders: {
    title: "Siberian Invaders — Kelime Savunma Oyunu | Memolandum",
    description:
      "Space invaders tarzı kelime oyunuyla ingilizce kelimeleri savunun ve öğrenin. Ücretsiz eğitim arcade oyunu.",
  },
  wordascent: {
    title: "Word Ascent — Kelime Tırmanışı | Memolandum Vocabulary Game",
    description:
      "Yukarı tırmanırken kelime dağarcığınızı güçlendirin. Gamified vocabulary learning — ücretsiz başla.",
  },
  worddrop: {
    title: "Word Drop — Düşen Kelimeler | İngilizce Kelime Ezberleme Oyunu",
    description:
      "Düşen ingilizce kelimeleri yakalayın ve türkçe anlamlarıyla eşleştirin. Ücretsiz memory game.",
  },
  quiz: {
    title: "Retro Quiz — İngilizce Kelime Testi | Memolandum",
    description:
      "4 şıklı retro kelime testi. Active recall tekniğiyle ingilizce kelime bilginizi ölçün ve pekiştirin.",
  },
};

/* ── GEO FAQ (TR) — AI asistanların doğrudan alıntılayacağı formatlar ──── */
export const FAQ_ITEMS = [
  {
    question: "Memolandum nedir?",
    answer:
      "Memolandum, kelime ezberlemeyi arcade oyunlarla birleştiren ücretsiz bir dil öğrenme platformudur. Spaced repetition (aralıklı tekrar), active recall (aktif hatırlama) ve dual coding (çift kodlama) bilimsel yöntemleriyle çalışır. Shooter, breakout, highway gibi oyunlarla A1–B2 seviyesi ingilizce kelimeler çalışılır; Gemini AI destekli anlık çeviri ve kişisel kelime kasası ile desteklenir.",
  },
  {
    question: "Memolandum ücretsiz mi?",
    answer:
      "Evet, temel özellikler tamamen ücretsizdir. Web üzerinden üye olarak veya misafir olarak oynayabilirsiniz. Temel oyunlar, kelime listeleri ve anlık çeviri ücretsiz sunulur.",
  },
  {
    question: "Hangi diller destekleniyor?",
    answer:
      "İngilizce–Türkçe başta olmak üzere Almanca, Fransızca, İspanyolca, Rusça, Korece, Portekizce, Yunanca, İtalyanca, Japonca, Arapça ve Çince dil yolları mevcuttur. Aynı hesapta birden fazla dil profili açabilirsiniz.",
  },
  {
    question: "Oyun oynayarak kelime ezberleme işe yarar mı?",
    answer:
      "Evet. Bilimsel araştırmalar, oyun tabanlı öğrenmenin active recall (Roediger & Karpicke, 2006) ve spaced repetition (Ebbinghaus, 1885) ile birleştiğinde geleneksel yöntemlere göre %50'ye kadar daha kalıcı öğrenme sağladığını göstermektedir. Memolandum bu yöntemleri doğrudan arcade oyun mekaniğine gömer.",
  },
  {
    question: "YDS veya sınav kelimeleri var mı?",
    answer:
      "Evet. Genel İngilizce yanında sınav odaklı kategoriler (YDS/YKS kelime setleri) ve seviye bazlı (A1–Advanced) listeler sunulur.",
  },
  {
    question: "Duolingo'ya alternatif mi?",
    answer:
      "Memolandum, Duolingo'dan farklı olarak spaced repetition ve active recall bilimsel yöntemlerine dayanan arcade oyunlarla kelime ezberlemenizi sağlar. Ücretsiz, reklamsız ve doğrudan kelime odaklıdır. Özellikle hızlı kelime ezberleme hedefleyenler için idealdir.",
  },
  {
    question: "Anlık çeviri nasıl çalışır?",
    answer:
      "Sayfa üstündeki çeviri çubuğuna metin yazın veya mikrofonla konuşun; Google Gemini AI hedef dile çeviri üretir. Çeviriyi kelime kasasına kaydedebilir ve sesli dinleyebilirsiniz.",
  },
  {
    question: "Spaced repetition nedir?",
    answer:
      "Spaced repetition (aralıklı tekrar), Hermann Ebbinghaus'un 1885'te keşfettiği unutma eğrisine karşı geliştirilen bilimsel bir tekrarlama yöntemidir. Memolandum algoritmaları, bir kelimeyi unutmak üzere olduğunuz kritik anda tekrar karşınıza çıkarır ve kelimeleri kısa süreli bellekten kalıcı hafızaya taşır.",
  },
];

/* ── GEO FAQ (EN) ─────────────────────────────────────────────────────── */
export const FAQ_ITEMS_EN = [
  {
    question: "What is Memolandum?",
    answer:
      "Memolandum is a free language-learning platform that teaches vocabulary through arcade games using spaced repetition, active recall, and dual coding — proven cognitive science methods. It offers Gemini-powered instant translation, a word vault, and per-language study profiles.",
  },
  {
    question: "Is Memolandum free?",
    answer:
      "Yes. You can play as a guest or create an account. Core games, word lists, and instant translation are free on the web.",
  },
  {
    question: "Is Memolandum a Duolingo alternative?",
    answer:
      "Yes. Unlike Duolingo's XP-streak model, Memolandum focuses on deep vocabulary memorization through arcade mechanics, spaced repetition algorithms, and active recall — making it ideal for students who need fast, lasting word memorization.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "English–Turkish plus German, French, Spanish, Russian, Korean, Portuguese, Greek, Italian, Japanese, Arabic, and Chinese. Multiple language profiles are supported on one account.",
  },
  {
    question: "How does spaced repetition work in Memolandum?",
    answer:
      "Memolandum's algorithms track each word you struggle with and re-present them at the scientifically optimal interval before you forget — based on Ebbinghaus's forgetting curve. This moves words from short-term to long-term memory.",
  },
  {
    question: "Does playing games help memorize vocabulary?",
    answer:
      "Yes. Research by Roediger & Karpicke (Science, 2006) confirms that active recall during game-like testing produces up to 50% stronger memory retention than passive study. Memolandum embeds active recall directly into arcade mechanics.",
  },
  {
    question: "Are there exam-focused word lists?",
    answer:
      "Yes. Alongside general English, exam-oriented categories (YDS/YKS-style sets) and level lists from Beginner (A1) to Advanced are available.",
  },
  {
    question: "What is implicit learning in vocabulary?",
    answer:
      "Implicit (or implicit cognitive) learning refers to acquiring language patterns without conscious awareness — as demonstrated by Arthur Reber (1967). Memolandum's game engines present target vocabulary in the peripheral field while you focus on gameplay, enabling this subconscious encoding.",
  },
];

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return `${SITE_URL}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p.endsWith("/") ? p : `${p}/`}`;
}
