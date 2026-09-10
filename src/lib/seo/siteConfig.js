/** Memolandum SEO / GEO — Küresel anahtar kelime mimarisi
 *
 *  Kapsam: 23 dil yolu · KPSS / akademik sözlük · Gemini Anlık Çeviri ·
 *          İlkokul İngilizce (1–4. sınıf kelime + 2–4. sınıf cümle)
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

/** App Store / Play Store — privacy & terms (kanonik URL’ler) */
export const LEGAL_PRIVACY_URL = `${SITE_URL}/legal/privacy/`;
export const LEGAL_TERMS_URL = `${SITE_URL}/legal/terms/`;
export const LEGAL_CONTACT_EMAIL = "info@memolandum.com";

/* ── Ürün sayıları (tek kaynak — SEO / FAQ / JSON-LD) ─────────────────── */
export const PRODUCT_COUNTS = {
  arcadeGames: 8,
  /** public/data altındaki öğrenme içerik yolları (EN↔TR vb.) */
  languagePathways: 23,
  /** STUDY_LANG_PRESETS — hedef öğrenme dilleri */
  studyLanguages: 12,
  /** TRANSLATE_LANGUAGES — Gemini Anlık Çeviri hedefleri (Osmanlıca dahil) */
  translateLanguages: 14,
  glossaryConcepts: 4000,
  glossaryCategories: 10,
  /** İlkokul İngilizce — kelime setleri (1.–4. sınıf) */
  mebWordGrades: 4,
  /** İlkokul İngilizce — cümle setleri (2.–4. sınıf) */
  mebSentenceGrades: 3,
  /** Yaklaşık kelime/cümle kartı (sınıf başına ~100) */
  mebFlashcards: 700,
};

/** Öğrenme dilleri (UI etiketleri) — dünya çapında arama metinleri için */
export const STUDY_LANGUAGE_NAMES = {
  tr: [
    "İngilizce",
    "Almanca",
    "Fransızca",
    "İspanyolca",
    "Rusça",
    "Korece",
    "Portekizce",
    "Yunanca",
    "İtalyanca",
    "Japonca",
    "Arapça",
    "Çince",
  ],
  en: [
    "English",
    "German",
    "French",
    "Spanish",
    "Russian",
    "Korean",
    "Portuguese",
    "Greek",
    "Italian",
    "Japanese",
    "Arabic",
    "Chinese",
  ],
};

/* ── Başlık & Açıklama (Google ≤60 / ≤160 karakter hedefi) ─────────────── */
export const DEFAULT_TITLE =
  "Memolandum — 23 Dil · İlkokul İngilizce · KPSS & Anlık Çeviri";
// ~58 karakter — brand + dil + İlkokul + KPSS + çeviri

export const DEFAULT_DESCRIPTION =
  "23 dil yolu · İlkokul İngilizce (1–4. sınıf kelime, 2–4. sınıf cümle) · 8 arcade oyun · KPSS sözlük · Gemini Anlık Çeviri. Spaced repetition — Memolandum.";
// ~155 karakter — learn + İlkokul + KPSS + çeviri

/* ── Genişletilmiş Anahtar Kelime Bankası ───────────────────────────────── */
export const KEYWORDS = [
  // 🇹🇷 Türkçe — Yüksek hacimli
  "kelime ezberleme oyunu",
  "ingilizce kelime ezberleme",
  "ingilizce kelime öğrenme",
  "kelime öğrenme uygulaması",
  "dil öğrenme oyunu",
  "oyna ezberle",
  "çok dilli kelime ezberleme",
  "23 dil kelime öğrenme",

  // 🇹🇷 Türkçe — Sınav / KPSS / akademik
  "KPSS sözlük",
  "KPSS kelime ezberleme",
  "KPSS genel kültür",
  "KPSS coğrafya",
  "KPSS tarih vatandaşlık",
  "KPSS matematik geometri",
  "akademik sözlük oyunu",
  "YDS kelime ezberleme",
  "YKS ingilizce kelimeler",
  "A1 A2 B1 B2 ingilizce kelimeler",
  "ücretsiz kelime ezberleme sitesi",
  "oyunla ingilizce öğrenme",
  "aralıklı tekrar yöntemi türkçe",
  "spaced repetition türkçe uygulama",
  "Anki alternatifi Türkçe",

  // 🇹🇷 İlkokul İngilizce
  "ilkokul İngilizce",
  "ilkokul müfredat İngilizce kelimeler",
  "1. sınıf İngilizce kelimeler",
  "2. sınıf İngilizce kelimeler",
  "3. sınıf İngilizce kelimeler",
  "4. sınıf İngilizce kelimeler",
  "2. sınıf İngilizce cümleler",
  "3. sınıf İngilizce cümleler",
  "4. sınıf İngilizce cümleler",
  "ilkokul İngilizce kelime kartı",
  "ilkokul İngilizce cümle ezberleme",
  "okul ünite İngilizce",
  "çocuklar için İngilizce kelime oyunu",
  "ilkokul İngilizce oyunla öğrenme",
  "primary school English Turkey",
  "primary grade 1 English vocabulary",
  "primary grade 4 English sentences",

  // 🇹🇷 Anlık çeviri
  "anlık çeviri",
  "anlık çeviri uygulaması",
  "sesli anlık çeviri",
  "gemini anlık çeviri",
  "AI çeviri kelime kaydet",
  "ücretsiz anlık çeviri",
  "metin ses çeviri",

  // 🇬🇧 English — global
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
  "multilingual vocabulary app",
  "23 language pathways vocabulary",
  "instant translation AI",
  "voice instant translator",
  "gemini AI translator vocabulary",
  "play games to learn english words",
  "duolingo alternative free",
  "quizlet alternative game based",
  "anki alternative fun",
  "best free vocabulary game 2026",

  // 🌍 Dil yolu / dil çifti pazarları (23 pathway)
  "english turkish vocabulary",
  "german turkish vocabulary game",
  "german english vocabulary",
  "french turkish vocabulary",
  "french english vocabulary game",
  "spanish turkish vocabulary",
  "spanish english word game",
  "russian turkish vocabulary",
  "russian english vocabulary game",
  "korean turkish vocabulary",
  "korean english vocabulary game",
  "portuguese turkish vocabulary",
  "brazilian portuguese english vocabulary",
  "greek turkish vocabulary",
  "greek english word learning",
  "italian turkish vocabulary",
  "italian english vocabulary game",
  "japanese turkish vocabulary",
  "japanese english word game",
  "arabic turkish vocabulary",
  "arabic english vocabulary learning",
  "chinese turkish vocabulary",
  "chinese english vocabulary game free",
  "ottoman turkish translator",

  // 🇩🇪 🇫🇷 🇪🇸 🇮🇹 🇷🇺 🇵🇹 🇰🇷 🇯🇵 🇨🇳 🇸🇦 🇬🇷 — yerel arama
  "Vokabeln lernen Spiel",
  "Wortschatz Spiel kostenlos",
  "jeu vocabulaire gratuit",
  "apprendre vocabulaire jeux",
  "juego vocabulario gratis",
  "aprender vocabulario juegos",
  "gioco vocabolario online",
  "imparare vocabolario giochi",
  "игра для заучивания слов",
  "выучить слова игра",
  "jogo vocabulário grátis",
  "aprender vocabulário jogos",
  "단어 외우기 게임",
  "영어 단어 게임",
  "単語ゲーム 無料",
  "英単語 暗記 ゲーム",
  "背单词游戏",
  "英语单词游戏免费",
  "لعبة حفظ الكلمات",
  "تعلم المفردات بالألعاب",
  "παιχνίδι λεξιλογίου",

  // 🧠 Akademik / bilim — SEO & GEO
  "spaced repetition app free",
  "active recall study method",
  "dual coding learning",
  "gamification education",
  "neuroscience vocabulary learning",
  "memory retention techniques",
  "ebbinghaus forgetting curve app",
  "implicit learning vocabulary",
  "cognitive vocabulary training",
  "memory science language learning",

  // 📦 Marka / ürün
  "memolandum",
  "kelime kasası",
  "kişisel sözlük uygulaması",
  "word vault spaced repetition",
  "memolandum pulse",
  "memolandum method",
  "memolandum anlık çeviri",
  "memolandum KPSS",
  "memolandum sözlük",
  "memolandum ilkokul ingilizce",
  "memolandum kelime kartı",
];

export const OG_IMAGE = `${SITE_URL}/memolandum_preview.png`;

/* ── Oyun başlıkları — Anahtar kelime güçlendirilmiş ───────────────────── */
export const GAME_META = {
  shooter: {
    title: "Retro Shooter — Kelime Uzay Nişancısı | Memolandum Kelime Oyunu",
    description:
      "Siber uzay shooter oynayarak 23 dil yolunda kelimeleri vurun ve spaced repetition ile ezberleyin. Ücretsiz kelime öğrenme oyunu — Memolandum.",
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
  lexicon: {
    title: "Lexicon Tokens — Card Word Arcade | Memolandum",
    description:
      "Single-handed token cards: target word, latin reading, audio, meaning. Micro-deck commute mode with Memolandum Pulse™.",
  },
  hangman: {
    title: "Retro Hangman — Kelime Tahmin Oyunu | Memolandum",
    description:
      "Harf tahminleri yaparak gizli ingilizce kelimeleri çözün ve ezberleyin. Eğlenceli siberpunk adam asmaca oyunu.",
  },
  "word-snake": {
    title: "Retro Yılan — Kelime Yılanı Oyunu | Memolandum",
    description:
      "Izgaradaki harfleri doğru heceleme sırasıyla yiyerek kelimeleri toplayın. Eğlenceli ve siberpunk tek elle oynanan kelime yılanı oyunu.",
  },
  "academic-shooter": {
    title: "KPSS & Akademik Shooter — Kavram Nişancısı | Memolandum",
    description:
      "KPSS, tıp, hukuk ve akademik sözlük kavramlarını Retro Shooter ile ezberleyin. 4.000 kavram · ücretsiz akademik kelime oyunu.",
  },
  "academic-lexicon": {
    title: "Akademik Lexicon — KPSS Kart Destesi | Memolandum",
    description:
      "KPSS ve akademik kavramları kart destesiyle çalışın. Spaced repetition destekli My Lexicon — Memolandum Sözlük.",
  },
  "word-card": {
    title: "Kelime Kartı — İlkokul İngilizce | Memolandum",
    description:
      "Görsel ve sesli kelime/cümle kartlarıyla 1–4. sınıf İngilizce çalışın. Ünite ünite okul müfredatı · çocuk dostu seslendirme · ücretsiz Word Card.",
  },
};

/* ── GEO FAQ (TR) — AI asistanların doğrudan alıntılayacağı formatlar ──── */
export const FAQ_ITEMS = [
  {
    question: "Memolandum nedir?",
    answer:
      "Memolandum, kelime ezberlemeyi 8 arcade oyunla birleştiren küresel bir dil öğrenme platformudur. 23 dil yolunda (İngilizce, Almanca, Fransızca, İspanyolca, Rusça, Korece, Portekizce, Yunanca, İtalyanca, Japonca, Arapça, Çince ve EN/TR yönleri) çalışır. İlkokul İngilizce (1–4. sınıf kelime, 2–4. sınıf cümle), KPSS & akademik sözlük (4.000 kavram), Gemini Anlık Çeviri (14 dil) ve Kelime Kasası ile spaced repetition sunar. Tüm oyunlar ücretsizdir; AI çeviri üye hesabında ilk 10 denemeden sonra Premium’dur.",
  },
  {
    question: "Memolandum ücretsiz mi?",
    answer:
      "Öğrenme ücretsizdir: tüm arcade oyunlar, seviyeler, 23 dil yolu ve KPSS/akademik sözlük web’de üye veya misafir olarak açıktır. Gemini Anlık Çeviri farklıdır — misafire 3, üye hesaba özel bir kez 10 ücretsiz çeviri; sonrası Memolandum Premium ile devam eder (fair-use kota).",
  },
  {
    question: "Hangi diller destekleniyor?",
    answer:
      "23 dil yolu: 12 öğrenme dili (İngilizce, Almanca, Fransızca, İspanyolca, Rusça, Korece, Portekizce, Yunanca, İtalyanca, Japonca, Arapça, Çince) çoğunlukla EN ve TR açıklama yönleriyle. Tüm yolların listesi /learn adresinde — her yol için ayrı açılış sayfası ve oyuna deep-link vardır. Gemini Anlık Çeviri 14 hedef dil sunar (Osmanlıca dahil). Aynı hesapta birden fazla dil profili açabilirsiniz.",
  },
  {
    question: "Dil yolları nerede?",
    answer:
      "https://memolandum.com/learn/ hub’ında 23 dil yolu listelenir. Örnek: /learn/de-tr (Almanca–Türkçe), /learn/en-tr (İngilizce–Türkçe), /learn/ko-en (Korece–İngilizce). Her sayfadan Retro Shooter’a doğrudan başlayabilirsiniz.",
  },
  {
    question: "KPSS sözlüğü var mı?",
    answer:
      "Evet. Memolandum Sözlük’te (/sozluk) KPSS odaklı kategoriler (Coğrafya, Tarih, Vatandaşlık, Genel Kültür, Türkçe, Matematik-Geometri) ile Tıp, Hukuk, Mimarlık ve Astronomi olmak üzere 10 kategoride yaklaşık 4.000 akademik kavram bulunur. Kavramları Retro Shooter ve My Lexicon ile ezberleyebilirsiniz.",
  },
  {
    question: "Anlık çeviri nasıl çalışır?",
    answer:
      "Sayfa üstündeki Anlık Çeviri çubuğuna veya /translate stüdyosuna metin yazın / mikrofonla konuşun; Google Gemini AI 14 hedef dile çeviri üretir (Osmanlıca dahil). Sonucu Kelime Kasası’na kaydedip sesli dinleyebilirsiniz. Üye hesabında ilk 10 AI çeviri ücretsizdir; kota bitince Premium gerekir.",
  },
  {
    question: "Oyun oynayarak kelime ezberleme işe yarar mı?",
    answer:
      "Evet. Bilimsel araştırmalar, oyun tabanlı öğrenmenin active recall (Roediger & Karpicke, 2006) ve spaced repetition (Ebbinghaus, 1885) ile birleştiğinde geleneksel yöntemlere göre %50'ye kadar daha kalıcı öğrenme sağladığını göstermektedir. Memolandum bu yöntemleri doğrudan arcade oyun mekaniğine gömer.",
  },
  {
    question: "YDS veya sınav kelimeleri var mı?",
    answer:
      "Evet. Genel İngilizce yanında YDS/YKS kelime setleri, seviye bazlı (A1–Advanced) listeler, KPSS akademik sözlük ve İlkokul İngilizce müfredatı (1–4. sınıf kelime + 2–4. sınıf cümle) sunulur.",
  },
  {
    question: "İlkokul İngilizce var mı?",
    answer:
      "Evet. Memolandum’da okul müfredatına uyumlu İlkokul İngilizce paketleri vardır: 1.–4. sınıf kelime setleri ve 2.–4. sınıf temel cümleler (sınıf başına ~100 kart). Ünite ünite çalışılır; Kelime Kartı oyununda görsel + çocuk dostu seslendirme vardır. Başlamak için https://memolandum.com/learn/en-tr/ sayfasındaki İlkokul paketini veya doğrudan /games/word-card/ adresini kullanın.",
  },
  {
    question: "Duolingo'ya alternatif mi?",
    answer:
      "Memolandum, Duolingo'dan farklı olarak spaced repetition ve active recall bilimsel yöntemlerine dayanan arcade oyunlarla kelime ezberlemenizi sağlar. 23 dil yolu, KPSS sözlük ve Anlık Çeviri ile ücretsiz, reklamsız ve doğrudan kelime odaklıdır.",
  },
  {
    question: "Spaced repetition nedir?",
    answer:
      "Spaced repetition (aralıklı tekrar), Hermann Ebbinghaus'un 1885'te keşfettiği unutma eğrisine karşı geliştirilen bilimsel bir tekrarlama yöntemidir. Memolandum algoritmaları, bir kelimeyi unutmak üzere olduğunuz kritik anda tekrar karşınıza çıkarır ve kelimeleri kısa süreli bellekten kalıcı hafızaya taşır.",
  },
  {
    question: "Kelime Kasası nedir?",
    answer:
      "Kelime Kasası, oyunlardan öğrendiğiniz ve Anlık Çeviri’den kaydettiğiniz kelimeleri güç seviyesine (Yeni → Usta) ve Memolandum Pulse tekrar zamanına göre takip ettiğiniz kişisel sözlüktür. Due tekrar listesiyle unutmak üzere olduğunuz kelimeleri çalışırsınız.",
  },
  {
    question: "AI çeviri stüdyosu nerede?",
    answer:
      "Gemini Anlık Çeviri stüdyosu /translate adresindedir (üst şeritte de Anlık Çeviri çubuğu vardır). Metin veya sesle çevirip sonucu Kelime Kasanıza kaydedebilirsiniz. Üye: ilk 10 ücretsiz; misafir: 3 deneme; sonrası Premium.",
  },
  {
    question: "AI branş öğretmenleri nedir? Ne zaman?",
    answer:
      "Memolandum’un kuzey yıldızı: dil, KPSS ve akademik branşlarda Gemini destekli uzman öğretmen katmanı. Bugün canlı temel (oyunlar, /learn, sözlük, Pulse, Anlık Çeviri) üzerine kurulacak; öğretmen quiz/oyun sinyallerinden zayıf noktaları okuyup bir sonraki antrenmanı yapılandıracak. Detay: /roadmap",
  },
  {
    question: "Memolandum Pulse yöntemi nedir?",
    answer:
      "Memolandum Pulse, aralıklı tekrar ve aktif hatırlamayı arcade oyunlara gömen öğrenme ritmidir. Detaylı anlatım /method sayfasındadır: doğru/hızlıysa aralık uzar, yanlışsa kelime tekrar kuyruğuna alınır.",
  },
];

/* ── GEO FAQ (EN) ─────────────────────────────────────────────────────── */
export const FAQ_ITEMS_EN = [
  {
    question: "What is Memolandum?",
    answer:
      "Memolandum is a global vocabulary platform that teaches words through 8 arcade games across 23 language pathways (12 study languages with EN/TR explanation directions). It includes primary-school English curriculum (grades 1–4 words, grades 2–4 sentences), a KPSS & academic glossary (~4,000 concepts), Gemini Instant Translation (14 targets including Ottoman Turkish), Word Vault, and spaced repetition. All games are free; AI translation is 10 free uses per member account, then Premium.",
  },
  {
    question: "Is Memolandum free?",
    answer:
      "Learning is free: all arcade games, levels, 23 language pathways, and the KPSS/academic glossary are open on the web for guests and members. Gemini Instant Translation is separate — guests get 3 tries, members get 10 free translations once per account; then Memolandum Premium (fair-use monthly quota).",
  },
  {
    question: "Which languages are supported?",
    answer:
      "23 language pathways covering English, German, French, Spanish, Russian, Korean, Portuguese, Greek, Italian, Japanese, Arabic, and Chinese — mostly with English and Turkish explanation sides. Browse all at /learn with dedicated landing pages and game deep-links. Instant Translation covers 14 target languages (including Ottoman Turkish). Multiple study profiles on one account; accessible worldwide.",
  },
  {
    question: "Where are the language pathways?",
    answer:
      "https://memolandum.com/learn/ lists all 23 pathways. Examples: /learn/de-tr (German–Turkish), /learn/en-tr (English–Turkish), /learn/ko-en (Korean–English). Each page links straight into Retro Shooter with that pathway selected.",
  },
  {
    question: "Does Memolandum have a KPSS glossary?",
    answer:
      "Yes. The Academic Glossary at /sozluk covers KPSS topics (Geography, History, Citizenship, General Culture, Turkish, Math & Geometry) plus Medicine, Law, Architecture, and Astronomy — about 4,000 concepts playable in Retro Shooter and My Lexicon.",
  },
  {
    question: "How does Instant Translation work?",
    answer:
      "Use the Instant Translation bar or the /translate studio: type or speak; Google Gemini translates into 14 target languages. Save results to your Word Vault and listen with TTS. Members get 10 free AI translations once per account; then Premium.",
  },
  {
    question: "Is Memolandum a Duolingo alternative?",
    answer:
      "Yes. Unlike Duolingo's XP-streak model, Memolandum focuses on deep vocabulary memorization through arcade mechanics, spaced repetition, 23 language pathways, KPSS glossary, and Instant Translation — ideal for students who need lasting word memorization worldwide.",
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
      "Yes. Alongside general English, exam-oriented categories (YDS/YKS-style sets), KPSS academic concepts, level lists from Beginner (A1) to Advanced, and primary-school English curriculum (grades 1–4 words + grades 2–4 sentences) are available.",
  },
  {
    question: "Does Memolandum include primary-school English?",
    answer:
      "Yes. Memolandum offers curriculum-aligned primary (ilkokul) English packs: vocabulary for grades 1–4 and core sentences for grades 2–4 (~100 cards per set), organized by unit. Word Card mode adds illustrations and child-friendly audio. Start at https://memolandum.com/learn/en-tr/ (İlkokul pack) or /games/word-card/.",
  },
  {
    question: "What is implicit learning in vocabulary?",
    answer:
      "Implicit (or implicit cognitive) learning refers to acquiring language patterns without conscious awareness — as demonstrated by Arthur Reber (1967). Memolandum's game engines present target vocabulary in the peripheral field while you focus on gameplay, enabling this subconscious encoding.",
  },
  {
    question: "What is the Word Vault?",
    answer:
      "The Word Vault is your personal dictionary of words learned in games and saved from Instant Translation. Each entry has a strength level (New → Mastered) and a Memolandum Pulse due time so you review words right before you would forget them.",
  },
  {
    question: "Where is Memolandum Instant Translation?",
    answer:
      "The Gemini studio is at /translate (and Instant Translation in the top bar). Translate by text or voice and save to your Word Vault. Members: 10 free translations once per account; guests: 3 tries; then Premium.",
  },
  {
    question: "What are AI branch teachers?",
    answer:
      "Memolandum’s north star: Gemini-powered specialist teachers for language pathways, KPSS domains, and academic subjects. Built on today’s live foundation (games, /learn, glossary, Pulse, Instant Translation). Teachers will read quiz/game signals and configure the next drill. Details: /roadmap",
  },
  {
    question: "What is Memolandum Pulse?",
    answer:
      "Memolandum Pulse is the spaced-repetition and active-recall rhythm embedded in the arcade games. The full explainer is on /method: fast correct answers stretch intervals; mistakes put words back into the review queue.",
  },
];

/* ── Sayfa bazlı SEO / GEO meta paketleri ─────────────────────────────── */
export const PAGE_SEO = {
  vocabulary: {
    title: "Kelime Kasası — Kişisel Sözlük & Spaced Repetition | Memolandum",
    description:
      "Oyun ve Anlık Çeviri’den biriken kelimeleri güç seviyesine ve Pulse tekrar zamanına göre takip edin. Due liste, 23 dil yolu filtresi — ücretsiz Kelime Kasası.",
    keywords: [
      "kelime kasası",
      "kişisel sözlük",
      "spaced repetition kelime listesi",
      "kelime tekrar uygulaması",
      "word vault",
      "vocabulary tracker",
      "due review vocabulary",
      "memolandum kelime kasası",
    ],
  },
  translate: {
    title: "Anlık Çeviri | Gemini AI Çeviri Stüdyosu — Memolandum",
    description:
      "Anlık çeviri: metin veya sesle Gemini AI — 14 hedef dil (Osmanlıca dahil). Üye: ilk 10 ücretsiz; misafir: 3 deneme; sonrası Premium. Sonucu Kelime Kasası’na kaydedin.",
    keywords: [
      "anlık çeviri",
      "anlık çeviri uygulaması",
      "ai çeviri",
      "gemini çeviri",
      "sesli çeviri",
      "sesli anlık çeviri",
      "kelime çeviri kaydet",
      "AI translator",
      "instant translation",
      "instant translation vocabulary",
      "voice translator online free",
      "gemini AI translator",
      "memolandum çeviri",
      "memolandum anlık çeviri",
      "ücretsiz anlık çeviri",
      "ottoman turkish translator",
    ],
  },
  method: {
    title: "Memolandum Pulse™ — Nasıl Öğrenirsin? | Aralıklı Tekrar & Active Recall",
    description:
      "Memolandum Pulse nedir? Unutma eğrisi, aralıklı tekrar ve aktif hatırlamayı arcade oyunlarla birleştiren bilimsel kelime öğrenme yöntemi — kolay anlatım.",
    keywords: [
      "memolandum pulse",
      "aralıklı tekrar",
      "spaced repetition",
      "active recall",
      "kelime ezberleme yöntemi",
      "unutma eğrisi",
      "bilimsel dil öğrenme",
    ],
  },
  sozluk: {
    title: "KPSS & Akademik Sözlük | 4.000 Kavram — Memolandum",
    description:
      "KPSS Coğrafya, Tarih, Vatandaşlık, Genel Kültür, Türkçe, Matematik + Tıp, Hukuk, Mimarlık, Astronomi. 4.000 kavramı Shooter ve Lexicon ile ezberleyin.",
    keywords: [
      "KPSS sözlük",
      "KPSS kelime ezberleme",
      "KPSS genel kültür",
      "KPSS coğrafya kavramları",
      "KPSS tarih",
      "KPSS vatandaşlık",
      "akademik sözlük",
      "akademik kelime ezberleme",
      "tıp terimleri ezberleme",
      "hukuk terimleri sözlük",
      "memolandum sözlük",
      "KPSS oyunla çalış",
    ],
  },
};

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return `${SITE_URL}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p.endsWith("/") ? p : `${p}/`}`;
}
