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
  arcadeGames: 16,
  totalLevels: 1189,
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
  ar: [
    "الإنجليزية",
    "الألمانية",
    "الفرنسية",
    "الإسبانية",
    "الروسية",
    "الكورية",
    "البرتغالية",
    "اليونانية",
    "الإيطالية",
    "اليابانية",
    "العربية",
    "الصينية",
  ],
  pt: [
    "Inglês",
    "Alemão",
    "Francês",
    "Espanhol",
    "Russo",
    "Coreano",
    "Português",
    "Grego",
    "Italiano",
    "Japonês",
    "Árabe",
    "Chinês",
  ],
};

/* ── Başlık & Açıklama (Google ≤60 / ≤160 karakter hedefi) ─────────────── */
export const DEFAULT_TITLE =
  "Memolandum — 1–12. Sınıf İngilizce · 23 Dil · Okul & Veli Karnesi";
// ~64 karakter — brand + 1-12 Sınıf + 23 Dil + Okul & Veli Karnesi

export const DEFAULT_DESCRIPTION =
  "1–12. sınıf MEB İngilizce (Türkiye Yüzyılı Maarif Modeli), 2–8. sınıf 20 soruluk rastgele yazılı & LGS deneme quizleri (/quiz), YDS, YÖKDİL & IELTS/TOEFL · 23 dil yolu · 16 ücretsiz oyun · Akıllı tahta uyumlu Öğretmen Masası (/schools) & Veli Karnesi (/veli-rehberi).";

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
  "LGS ingilizce kelimeler",
  "A1 A2 B1 B2 ingilizce kelimeler",
  "ücretsiz kelime ezberleme sitesi",
  "oyunla ingilizce öğrenme",
  "aralıklı tekrar yöntemi türkçe",
  "spaced repetition türkçe uygulama",
  "Anki alternatifi Türkçe",

  // 🇹🇷 1–12. Sınıf MEB İngilizce (İlkokul, Ortaokul, Lise & LGS)
  "ilkokul İngilizce",
  "ortaokul İngilizce kelimeler",
  "lise İngilizce kelimeler",
  "ilkokul müfredat İngilizce kelimeler",
  "1. sınıf İngilizce kelimeler",
  "2. sınıf İngilizce kelimeler",
  "3. sınıf İngilizce kelimeler",
  "4. sınıf İngilizce kelimeler",
  "5. sınıf İngilizce kelimeler",
  "6. sınıf İngilizce kelimeler",
  "7. sınıf İngilizce kelimeler",
  "8. sınıf LGS İngilizce kelimeler",
  "9. sınıf İngilizce kelimeler",
  "10. sınıf İngilizce kelimeler",
  "11. sınıf İngilizce kelimeler",
  "12. sınıf İngilizce kelimeler",
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

  // 📝 2–8. Sınıf İngilizce Deneme Quizleri & Yazılı Sınav Hazırlık (/quiz)
  "ingilizce deneme quizi",
  "ingilizce deneme testi çöz",
  "2. sınıf ingilizce deneme quizi",
  "2. sınıf ingilizce testi çöz",
  "3. sınıf ingilizce deneme quizi",
  "3. sınıf ingilizce testi çöz",
  "4. sınıf ingilizce yazılı soruları",
  "4. sınıf ingilizce 1. dönem 1. yazılı deneme",
  "5. sınıf ingilizce deneme quizi",
  "5. sınıf ingilizce 1. dönem 1. yazılı soruları çöz",
  "6. sınıf ingilizce deneme quizi",
  "6. sınıf ingilizce 1. yazılı testi çöz",
  "7. sınıf ingilizce deneme quizi",
  "7. sınıf ingilizce 1. yazılı soruları çöz",
  "8. sınıf lgs ingilizce deneme quizi",
  "8. sınıf lgs ingilizce deneme testi çöz",
  "20 soruluk ingilizce deneme testi",
  "çoktan seçmeli ingilizce yazılı testi",
  "ücretsiz online ingilizce deneme sınavı",
  "grades 2-8 english practice quiz",
  "اختبارات لغة إنجليزية تجريبية للصفوف 2-8",
  "simulado de inglês 2 ao 8 ano grátis",

  // 🦉 Okullar & Öğretmen Sınıf Yönetimi (/schools & /schools/rehber)
  "ingilizce öğretmen sınıf yönetimi",
  "akıllı tahta ingilizce kelime oyunu",
  "akıllı tahta uyumlu üyelik gerektirmeyen ingilizce oyunları",
  "eba etap akıllı tahta ingilizce etkinlikleri",
  "türkiye yüzyılı maarif modeli ingilizce kelimeleri",
  "ücretsiz ingilizce ödev takip sistemi",
  "kvkk uyumlu okul uygulaması",
  "sınıf kodu ile ingilizce ödev",
  "memolandum for schools",
  "öğretmen kelime ödevi atama",
  "yökdil kelime ezberleme oyunu",
  "yks dil ydt ingilizce kelimeleri",
  "ielts toefl eş anlamlı kelimeler oyunu",
  "orbitlex synonym game",

  // 👨‍👩‍👧 Veli Karnesi & Aile İletişim Merkezi (/veli-rehberi)
  "veli ingilizce takip karnesi",
  "çocuk ingilizce gelişim karnesi",
  "evde çocukla ingilizce kelime oyunu",
  "reklamsız çocuk ingilizce uygulaması",
  "veli rehberi ingilizce",

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
  "aprender inglês jogando grátis",
  "curso de inglês do zero grátis",
  "curso de inglês explicado em português",
  "aulas de inglês do zero passo a passo",
  "gramática inglesa explicada em português",
  "aprender inglês do zero youtube grátis",
  "desmistificando a e an em inglês",
  "artigos indefinidos em inglês a e an",
  "jogos educativos de inglês sem anúncios",
  "aplicativo de repetição espaçada grátis",
  "memorizar palavras em inglês rápido",
  "tradutor instantâneo com IA",
  "jogos para aprender inglês grátis online",
  "vocabulário inglês para o ENEM e vestibular",
  "inglês ensino fundamental 1 ao 9 ano jogos",
  "atividades de inglês para sala de aula lousa digital",
  "flashcards de inglês com áudio grátis",
  "como decorar palavras em inglês rápido",
  "alternativa grátis ao Duolingo e Anki",
  "aprender turco e inglês em português",
  "portekizce anlatımlı ingilizce dersleri",
  "brezilya portekizcesi ingilizce konu anlatımı",
  "단어 외우기 게임",
  "영어 단어 게임",
  "単語ゲーム 無料",
  "英単語 暗記 ゲーム",
  "背单词游戏",
  "英语单词游戏免费",
  "لعبة حفظ الكلمات",
  "تعلم المفردات بالألعاب",
  "تعلم اللغة الإنجليزية بالألعاب",
  "إتقان الإنجليزية خطوة بخطوة",
  "كورس تعلم اللغة الإنجليزية من الصفر بالعربية مجانا",
  "دروس شرح قواعد اللغة الإنجليزية بالعربية",
  "شرح أدوات التنكير a و an بالتفصيل",
  "تعلم الإنجليزية للمبتدئين بالصوت والصورة",
  "لعبة حفظ الكلمات الإنجليزية",
  "تعلم اللغة التركية للعرب",
  "برنامج حفظ المفردات مجانا",
  "تطبيق تعلم الكلمات بالتكرار المتباعد",
  "ترجمة فورية بالذكاء الاصطناعي",
  "ألعاب تعليمية للأطفال بدون إعلانات",
  "منهج اللغة الإنجليزية للصفوف 1-8",
  "arapça anlatımlı ingilizce konu anlatımı",
  "arapça ingilizce ders videoları",
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
  "word-board": {
    title: "Ahşap Kelime Panosu — Bahçe Modu Kelime Oyunu | Memolandum",
    description:
      "Güneşli bahçede 8'li ahşap kelime panosu üzerinde sesli ve renkli harfli İngilizce kelime kartlarını eşleştirin. Çocuklar için reklamsız ücretsiz kelime oyunu.",
  },
  "star-cards": {
    title: "Yıldız Kartlar (Star Trio Cards) — 3'lü Renkli Kart Oyunu | Memolandum",
    description:
      "Reklam filmimizdeki güneşli çayırda 3 renkli karttan doğru kelimeyi seçin, altın yıldızları patlatın. Sesli telaffuz ve 10/10 ilerleme çubuğuyla ücretsiz kart oyunu.",
  },
  "orbitlex": {
    title: "OrbitLex — Yörünge Platformu & Eş Anlamlı Kelime Oyunu | Memolandum",
    description:
      "Gezegen yörüngesinde dönen siber geminizle engelleri aşın, eş anlamlı kristalleri toplayarak kelimeleri refleks haline getirin. Retro arcade platformer.",
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
    question: "2. sınıftan 8. sınıfa (LGS dahil) İngilizce yazılı ve deneme quizleri var mı?",
    answer:
      "Evet. https://memolandum.com/quiz/ adresinde 2., 3., 4., 5., 6., 7. ve 8. sınıflar (LGS) için her sınıfa özel 100 ayrı müfredat sorusu havuzundan her seferinde rastgele seçilen 20 soruluk çoktan seçmeli İngilizce deneme quizleri bulunur (/quiz/2-sinif/ .. /quiz/8-sinif/). Cümlede boşluk doldurma, kelime anlamı ve kalıp cümle sorularından oluşan testler üyelik gerektirmez; test sonunda anında 100 üzerinden sınav karnesi, sesli cevap anahtarı ve 'Sadece Yanlışlarımı Tekrar Çöz' modu açılır.",
  },
  {
    question: "İlkokul, Ortaokul (LGS) ve Lise (1–12. Sınıf) İngilizce müfredatı ve Türkiye Yüzyılı Maarif Modeli ile uyumlu mu?",
    answer:
      "Evet. Memolandum’da Türkiye Yüzyılı Maarif Modeli ve MEB müfredatıyla tam uyumlu olarak 1. sınıftan 12. sınıfa kadar (2., 3., 4. sınıf ilkokul; 5., 6., 7., 8. sınıf LGS ortaokul; 9., 10., 11., 12. sınıf YKS-Dil / YDT lise) ünite bazlı İngilizce kelime ve cümle paketleri olmak üzere toplam 57 atanabilir hedef bulunur. Kelime Kartı (/games/word-card/), Yıldız Kartlar (/games/star-cards/) ve 10 eğitici arcade oyunda görsel ve sesli telaffuz desteğiyle tamamen ücretsiz çalışılır.",
  },
  {
    question: "YDS, YÖKDİL, YKS-Dil (YDT), IELTS ve TOEFL için OrbitLex eş anlamlı (synonym) kelime oyunu nasıl çalışır?",
    answer:
      "OrbitLex (/games/orbitlex/) ve Akademik Kelime & Cümle modülleri, YDS, YÖKDİL, YKS-Dil (YDT), IELTS ve TOEFL sınavlarında en çok çıkan akademik kelimeleri ve eş/zıt anlamlıları (synonyms & antonyms) Ebbinghaus Aralıklı Tekrar (Spaced Repetition / SM-2) metodolojisiyle refleks hızında kalıcı hafızaya kodlamak üzere tasarlanmıştır.",
  },
  {
    question: "Akıllı tahta uyumlu, üyelik gerektirmeyen sınıf içi İngilizce kelime oyunları nasıl açılır?",
    answer:
      "Türkiye'deki İngilizce ve bilişim öğretmenleri sınıfta EBA / ETAP (Pardus) Akıllı Tahta üzerinden hiçbir üyelik veya kurulum gerektirmeden doğrudan memolandum.com/schools/ veya memolandum.com/games/ sayfasını tam ekran (Full Screen) açıp tüm sınıfla Retro Shooter, OrbitLex, Kelime Kartı ve Retro Quiz oynatabilir.",
  },
  {
    question: "Öğretmenler ve okullar için sınıf yönetimi (Memolandum for Schools) nasıl çalışır?",
    answer:
      "İngilizce öğretmenleri https://memolandum.com/schools/ adresinden 30 saniyede ücretsiz dijital sınıf açıp 6 haneli sınıf kodunu (MEMO-...) akıllı tahtada veya WhatsApp'ta paylaşır. Öğrenciler gerçek soyadı veya TC kimlik numarası girmeden rumuz ve avatarla (KVKK uyumlu) katılır; öğretmen 57 ünite arasından ödev atar, sınav notlarını takip eder ve sınıfı kilitleyebilir. Detaylı rehber: https://memolandum.com/schools/rehber/",
  },
  {
    question: "Veliler çocuklarının gelişimini nasıl takip edebilir? Veli Karnesi nedir?",
    answer:
      "Veliler https://memolandum.com/veli-rehberi/ ve https://memolandum.com/profile/ üzerinden çocuklarının öğrendiği gerçek kelimeleri, doğruluk oranını ve son 7 günlük çalışma ritmini gösteren Resmi Başarı Karnesi'ni görüntüleyip PNG olarak indirebilir. İngilizce bilmeyen veliler bile karnedeki Türkçe okunuş ipuçları ve sesli hoparlör desteğiyle akşam yemeğinde '3 Kelime Aile Oyunu' oynayabilir ve buzdolabına asılabilir Haftalık Kelime Fişi indirebilir.",
  },
  {
    question: "Çocuğum İngilizce kelimeleri hemen unutuyor, nasıl kalıcı ezberler?",
    answer:
      "Çocuklar listelerden ezberledikleri kelimeleri birkaç günde unutur. Memolandum, çocuğun yanlış yaptığı kelimeleri Akıllı Hata Defteri'ne ayırır ve aralıklı tekrar (Spaced Repetition) algoritmasıyla tam unutacağı gün oyun içinde tekrar sorar. Ayrıca Veli Karnesi'ndeki 'Buzdolabı / Çalışma Masası Kelime Fişi' ve akşam yemeğinde 1 dakikalık '3 Kelime Aile Oyunu' ile kelimeler kalıcı hafızaya yerleşir.",
  },
  {
    question: "Çocuklar için ücretsiz ve reklamsız İngilizce oyunu var mı?",
    answer:
      "Evet, Memolandum %100 reklamsızdır, uygulama içi tuzak satın alma veya yabancı kişilerle sohbet içermez. 1. sınıftan 12. sınıfa kadar tüm okul ünite kelimeleri ve 8 eğitici oyun tamamen ücretsizdir.",
  },
  {
    question: "Sınıfta akıllı tahtada oynanacak İngilizce kelime oyunları nelerdir?",
    answer:
      "Öğretmenler sınıfta akıllı tahtadan https://memolandum.com/schools/ veya /games/word-card/ sayfasını açarak MEB ünite kelimelerini görsel ve sesli kartlarla işleyebilir, Retro Quiz, Adam Asmaca (Hangman), Kelime Yılanı ve Retro Shooter oyunlarını tüm sınıfla ücretsiz oynatabilir.",
  },
  {
    question: "Duolingo'ya alternatif mi?",
    answer:
      "Memolandum, Duolingo'dan farklı olarak spaced repetition ve active recall bilimsel yöntemlerine dayanan arcade oyunlarla kelime ezberlemenizi sağlar. 23 dil yolu, 1–12. sınıf okul müfredatı, Öğretmen Masası, Veli Karnesi, KPSS sözlük ve Anlık Çeviri ile ücretsiz, %100 reklamsız ve doğrudan kelime odaklıdır.",
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
  {
    question: "Arapça–İngilizce ve Brezilya Portekizcesi–İngilizce video konu anlatımları nerede?",
    answer:
      "@memolandum YouTube kanalımızdaki 15 oynatma listesi doğrudan https://memolandum.com/videos/ sayfasıyla eşleniktir. Arapça–İngilizce adım adım konu anlatımı (إتقان الإنجليزية خطوة بخطوة) için /videos/?playlist=ar-en ve /learn/ar-en/ sayfalarını, Brezilya Portekizcesi–İngilizce sıfırdan konu anlatımı (Curso de Inglês do Zero Explicado em Português) için /videos/?playlist=pt-en ve /learn/pt-en/ sayfalarını ücretsiz izleyip 16 arcade oyunda pratik yapabilirsiniz.",
  },
];

/* ── GEO FAQ (EN) ─────────────────────────────────────────────────────── */
export const FAQ_ITEMS_EN = [
  {
    question: "What is Memolandum?",
    answer:
      "Memolandum is a global vocabulary platform that teaches words through 16 arcade games across 23 language pathways (12 study languages with EN/TR explanation directions). It includes Grades 1–12 & LGS/YDS English curriculum, @memolandum YouTube video courses (including Arabic–English and Brazilian Portuguese–English at /videos/), Teacher Classroom management (/schools), Parent Achievement Report Cards (/veli-rehberi), a KPSS & academic glossary (~4,000 concepts), Gemini Instant Translation (14 targets including Ottoman Turkish), Word Vault, and spaced repetition.",
  },
  {
    question: "Are there Grades 2–8 (Primary, Middle School & LGS) multiple-choice English practice quizzes?",
    answer:
      "Yes. At https://memolandum.com/quiz/ (and /quiz/2-sinif/ through /quiz/8-sinif/), students from 2nd grade to 8th grade (LGS) can take fast, fun 20-question random multiple-choice practice tests drawn from a curated 100-question curriculum pool per grade. Each quiz includes contextual fill-in-the-blank and vocabulary questions, native audio pronunciation, an instant 100-point exam report card, and a 1-click 'Retry My Mistakes' mode with zero sign-up required.",
  },
  {
    question: "How does Memolandum for Schools work for teachers?",
    answer:
      "Teachers can create a free digital classroom in 30 seconds at https://memolandum.com/schools/ (guide at /schools/rehber/), share a 6-character code, assign any of 57 curriculum units (Grades 1–12, LGS, YDS), and track student progress with zero personal data required (KVKK-safe nickname and avatar shield).",
  },
  {
    question: "How do the Parent Report Card and 3-Word Family Game work?",
    answer:
      "At https://memolandum.com/veli-rehberi/ and /profile/, parents can view and download their child's Achievement Certificate, see 7-day study rhythm and mastered words, play the 1-minute '3-Word Family Game' using phonetic hints and audio (no English knowledge required), and send 1-click WhatsApp praise messages.",
  },
  {
    question: "Is Memolandum free?",
    answer:
      "Learning is free: all arcade games, levels, 23 language pathways, Grades 1–12 curriculum, Teacher Classrooms, and Parent Reports are 100% free and ad-free. Gemini Instant Translation is separate — guests get 3 tries, members get 10 free translations once per account; then Memolandum Premium.",
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
  {
    question: "Where can I watch the Arabic–English and Brazilian Portuguese–English video courses?",
    answer:
      "All 15 official @memolandum YouTube playlists are synced at https://memolandum.com/videos/. Watch the Arabic–English step-by-step course (إتقان الإنجليزية خطوة بخطوة) at /videos/?playlist=ar-en and /learn/ar-en/, and the Brazilian Portuguese–English course from zero (Curso de Inglês do Zero Explicado em Português) at /videos/?playlist=pt-en and /learn/pt-en/.",
  },
];

/* ── GEO FAQ (AR) — للناطقين بالعربية ومحركات البحث والذكاء الاصطناعي ──── */
export const FAQ_ITEMS_AR = [
  {
    question: "ما هي منصة Memolandum؟",
    answer:
      "Memolandum هي منصة عالمية مجانية لتعلّم اللغات وحفظ المفردات عبر 16 لعبة أركيد تفاعلية في 23 مساراً لغوياً (12 لغة تشمل الإنجليزية، التركية، العربية، الألمانية، الفرنسية وغيرها). تدعم المنصة واجهة كاملة باللغات العربية والتركية والإنجليزية، وتضم كورس فيديو 'إتقان الإنجليزية خطوة بخطوة' (/videos/?playlist=ar-en)، ومنهج اللغة الإنجليزية للصفوف 1–12، والقاموس الأكاديمي (~4,000 مفهوم)، واستوديو الترجمة الفورية بالذكاء الاصطناعي Gemini بـ 14 لغة.",
  },
  {
    question: "أين أجد سلسلة دروس الفيديو 'إتقان الإنجليزية خطوة بخطوة' بالشرح العربي؟",
    answer:
      "يمكنك مشاهدة سلسلة دروس الفيديو المجانية 'إتقان الإنجليزية خطوة بخطوة' (مثل شرح أدوات التنكير A و An بالتفصيل مع اختبار قصير) مباشرة على https://memolandum.com/videos/?playlist=ar-en أو عبر قناة يوتيوب @memolandum، ثم تطبيق القواعد والمفردات فوراً في مسار العربية–الإنجليزية https://memolandum.com/learn/ar-en/ عبر 16 لعبة أركيد تفاعلية.",
  },
  {
    question: "هل منصة Memolandum مجانية وخالية من الإعلانات؟",
    answer:
      "نعم، التعلّم مجاني 100% وخالٍ تماماً من الإعلانات: جميع ألعاب الأركيد، المستويات، المسارات اللغوية الـ 23، مناهج الصفوف 1–12، مكتب المعلم (/schools)، وتقارير أولياء الأمور (/veli-rehberi) متاحة مجاناً للجميع. أما الترجمة الفورية بالذكاء الاصطناعي فتمنح 10 محاولات مجانية للأعضاء ثم باقة Premium.",
  },
  {
    question: "ما اللغات التي يمكنني تعلمها في Memolandum؟",
    answer:
      "تضم المنصة 23 مساراً لغوياً تشمل الإنجليزية، التركية، العربية، الألمانية، الفرنسية، الإسبانية، الروسية، الكورية، البرتغالية، اليونانية، الإيطالية، اليابانية، والصينية. يمكن للناطقين بالعربية استخدام الواجهة العربية (?lang=ar) لتعلّم المفردات والجمل الصوتية بسهولة.",
  },
  {
    question: "كيف يعمل نظام التكرار المتباعد Memolandum Pulse؟",
    answer:
      "تعتمد خوارزمية Memolandum Pulse على منحنى النسيان العلمي (Ebbinghaus) ونظام SM-2؛ حيث تعيد عرض الكلمات التي أخطأت فيها أو اقتربت من نسيانها داخل الألعاب في التوقيت المثالي لترسيخها في الذاكرة طويلة المدى.",
  },
  {
    question: "كيف تعمل الترجمة الفورية بالذكاء الاصطناعي؟",
    answer:
      "من خلال شريط الترجمة الفورية أعلى الصفحة أو استوديو /translate، يمكنك كتابة أي كلمة أو جملة أو التحدث عبر الميكروفون ليقوم Gemini AI بترجمتها فوراً إلى 14 لغة (بما فيها العربية والتركية والإنجليزية) مع إمكانية الاستماع للنطق الصوتي وحفظ الكلمة في خزنة الكلمات الخاصة بك.",
  },
  {
    question: "هل توجد اختبارات لغة إنجليزية تجريبية سريعة للصفوف من الثاني إلى الثامن (2–8)؟",
    answer:
      "نعم، يوفر قسم الاختبارات التجريبية https://memolandum.com/quiz/ اختبارات اختيار من متعدد سريعة وممتعة للصفوف 2 إلى 8، حيث يتم توليد 20 سؤالاً عشوائياً في كل مرة من بنك يضم 100 سؤال مخصص لكل صف مع نطق صوتي وبطاقة نتيجة فورية من 100 ومراجعة الأخطاء دون الحاجة لتسجيل حساب.",
  },
  {
    question: "كيف يتابع أولياء الأمور والمعلمون تقدم الطلاب؟",
    answer:
      "يوفر قسم المدارس (/schools) للمعلمين إنشاء فصل رقمي مجاني خلال 30 ثانية برمز من 6 أحرف دون طلب بيانات شخصية، بينما تتيح بطاقة تقرير ولي الأمر (/veli-rehberi) متابعة الكلمات المحفوظة ونسبة الدقة ولعب 'لعبة 3 كلمات للعائلة' مع النطق الصوتي.",
  },
];

/* ── GEO FAQ (PT-BR) — Para falantes de português e motores de IA ──────── */
export const FAQ_ITEMS_PT = [
  {
    question: "O que é o Memolandum?",
    answer:
      "O Memolandum é uma plataforma global gratuita de aprendizado de idiomas e memorização de vocabulário que combina 16 jogos arcade interativos em 23 trilhas de idiomas (incluindo Português do Brasil, Inglês, Turco, Espanhol, Francês, Alemão e Árabe) e o Curso de Inglês do Zero (Explicado em Português) em vídeo (/videos/?playlist=pt-en). Possui interface completa em Português (PT), Inglês (EN), Árabe (AR) e Turco (TR), currículo de inglês do 1º ao 12º ano, glossário acadêmico (~4.000 conceitos) e Tradução Instantânea com IA Gemini em 14 idiomas.",
  },
  {
    question: "Onde assistir ao Curso de Inglês do Zero (Explicado em Português) gratuitamente?",
    answer:
      "Você pode assistir gratuitamente à série em vídeo 'Curso de Inglês do Zero (Explicado em Português)' do canal oficial @memolandum (incluindo aulas como 'Desmistificando A e An em Inglês: A Regra de Ouro + Quiz Prático') diretamente em https://memolandum.com/videos/?playlist=pt-en e praticar o vocabulário e as frases nos 16 jogos arcade em https://memolandum.com/learn/pt-en/.",
  },
  {
    question: "O Memolandum é gratuito e sem anúncios?",
    answer:
      "Sim! O aprendizado é 100% gratuito e totalmente livre de anúncios: todos os jogos arcade, níveis, as 23 trilhas de idiomas, pacotes escolares, a Mesa do Professor (/schools) e o Boletim dos Pais (/veli-rehberi) são gratuitos. O Tradutor Instantâneo Gemini oferece 10 traduções gratuitas para membros e depois conta com o plano Premium.",
  },
  {
    question: "Quais idiomas posso aprender no Memolandum?",
    answer:
      "A plataforma oferece 23 trilhas de idiomas abrangendo Inglês, Português (Brasil), Espanhol, Francês, Alemão, Italiano, Russo, Coreano, Japonês, Chinês, Árabe, Grego e Turco (/learn/pt-en e /learn/pt-tr). Você pode navegar com a interface em Português (?lang=pt) e praticar palavras e frases com áudio.",
  },
  {
    question: "Como funciona a repetição espaçada Memolandum Pulse?",
    answer:
      "O algoritmo Memolandum Pulse baseia-se na curva do esquecimento de Ebbinghaus e no método SM-2. Ele identifica as palavras que você errou ou está prestes a esquecer e as reapresenta dentro dos jogos arcade no momento ideal para fixá-las na memória de longo prazo.",
  },
  {
    question: "Como funciona a Tradução Instantânea por IA?",
    answer:
      "Pela barra superior de Tradução Rápida ou pelo estúdio em /translate, você pode digitar ou falar pelo microfone para traduzir instantaneamente para 14 idiomas (incluindo Português do Brasil) com o Google Gemini AI, ouvir a pronúncia e salvar no seu Cofre de Palavras.",
  },
  {
    question: "Existem simulados e quizzes rápidos de inglês do 2º ao 8º ano?",
    answer:
      "Sim! Em https://memolandum.com/quiz/ estudantes do 2º ao 8º ano encontram simulados de múltipla escolha gratuitos que sorteiam 20 questões aleatórias a partir de um banco de 100 questões exclusivas por série, com pronúncia em áudio, nota imediata de 0 a 100 e modo de revisão de erros sem precisar de cadastro.",
  },
  {
    question: "Como estudantes, pais e professores no Brasil (Ensino Fundamental e ENEM) podem usar o Memolandum?",
    answer:
      "Estudantes brasileiros do Ensino Fundamental (1º ao 9º ano), Ensino Médio e candidatos ao ENEM/vestibulares podem praticar vocabulário e frases em inglês gratuitamente com áudio nativo e lento (🐢). Professores criam turmas digitais em 30 segundos em /schools para lousa digital, e pais acompanham o Boletim de Desempenho e o jogo familiar de 3 palavras em /veli-rehberi.",
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

export function buildPageAlternates(path = "/") {
  const canonical = absoluteUrl(path);
  const isHome = !path || path === "/";
  if (!isHome) {
    return {
      canonical,
    };
  }
  return {
    canonical,
    languages: {
      tr: canonical,
      "tr-TR": canonical,
      en: absoluteUrl("/en/"),
      "en-US": absoluteUrl("/en/"),
      ar: absoluteUrl("/ar/"),
      "ar-SA": absoluteUrl("/ar/"),
      "ar-IQ": absoluteUrl("/ar/"),
      "ar-EG": absoluteUrl("/ar/"),
      pt: absoluteUrl("/pt/"),
      "pt-BR": absoluteUrl("/pt/"),
      "x-default": canonical,
    },
  };
}
