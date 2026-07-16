/** Memolandum SEO / GEO tek kaynak */
export const SITE_URL = "https://memolandum.com";

export const SITE_NAME = "Memolandum";

export const SITE_TAGLINE = "Oyna, Ezberle";

export const DEFAULT_TITLE =
  "Memolandum | Oyna Ezberle — Kelime Öğrenme Oyunu & Anlık AI Çeviri";

export const DEFAULT_DESCRIPTION =
  "Arcade oyunlarla kelime ezberleyin, Gemini destekli anlık çeviri kullanın, dil bazlı profillerle ilerlemenizi takip edin. İngilizce, Almanca, Rusça, Korece ve daha fazlası — ücretsiz web kelime öğrenme platformu.";

export const KEYWORDS = [
  "kelime ezberleme oyunu",
  "ingilizce kelime ezberleme",
  "oyna ezberle",
  "AI çeviri",
  "anlık çeviri",
  "kelime öğrenme uygulaması",
  "YDS kelime",
  "A1 A2 B1 B2 kelimeler",
  "rusça türkçe kelime",
  "korece türkçe öğrenme",
  "dil öğrenme oyunu",
  "memolandum",
  "vocabulary game",
];

export const OG_IMAGE = `${SITE_URL}/memolandum_preview.png`;

export const GAME_META = {
  shooter: {
    title: "Retro Shooter — Kelime Uzay Nişancısı | Memolandum",
    description:
      "Siber uzay shooter oynayarak hedef kelimeleri vurun ve ezberleyin. Memolandum ücretsiz kelime öğrenme oyunu.",
  },
  breakout: {
    title: "Breakout — Kelime Kırma Oyunu | Memolandum",
    description:
      "Classic breakout mekaniğiyle kelime bloklarını kırın, anlamları pekiştirin. Ücretsiz kelime ezber oyunu.",
  },
  highway: {
    title: "Highway — Kelime Otoyolu | Memolandum",
    description:
      "Hızlı karar vererek doğru kelime şeritlerinde ilerleyin. Memolandum arcade dil öğrenme.",
  },
  invaders: {
    title: "Siberian Invaders — Kelime İstilacıları | Memolandum",
    description:
      "Invaders tarzı oyunda kelimeleri savunun ve öğrenin. Ücretsiz eğitim arcade.",
  },
  wordascent: {
    title: "Word Ascent — Kelime Tırmanışı | Memolandum",
    description:
      "Yukarı tırmanırken kelime dağarcığınızı güçlendirin. Memolandum word ascent oyunu.",
  },
  worddrop: {
    title: "Word Drop — Düşen Kelimeler | Memolandum",
    description:
      "Düşen kelimeleri yakalayın ve anlamlarıyla eşleştirin. Ücretsiz kelime oyunu.",
  },
  quiz: {
    title: "Retro Quiz — Çoktan Seçmeli Kelime Oyunu | Memolandum",
    description:
      "4 şıklı kelime patlatma testleriyle bilginizi ölçün, can ve kalkanlarınızı doldurun. Memolandum retro quiz oyunu.",
  },
};

/** GEO: AI asistanların doğrudan alıntılayabileceği soru-cevaplar (TR) */
export const FAQ_ITEMS = [
  {
    question: "Memolandum nedir?",
    answer:
      "Memolandum, kelime ezberlemeyi arcade oyunlarla birleştiren ücretsiz bir dil öğrenme platformudur. Kullanıcılar shooter, breakout, highway gibi oyunlarla A1–B2 kelime setlerini çalışır; Gemini tabanlı anlık çeviri ve kişisel kelime kasası ile desteklenir.",
  },
  {
    question: "Memolandum ücretsiz mi?",
    answer:
      "Evet. Web üzerinden üye olarak veya misafir olarak oynayabilirsiniz. Temel oyunlar, kelime listeleri ve anlık çeviri ücretsiz sunulur.",
  },
  {
    question: "Hangi diller destekleniyor?",
    answer:
      "İngilizce–Türkçe başta olmak üzere Almanca, Fransızca, İspanyolca, Rusça, Korece, Portekizce, Yunanca, İtalyanca, Japonca, Arapça ve Çince dil yolları mevcuttur. Aynı hesapta birden fazla dil profili açabilirsiniz. Site arayüzü Türkçe ve İngilizce olarak sunulur.",
  },
  {
    question: "Anlık çeviri nasıl çalışır?",
    answer:
      "Sayfa üstündeki Anlık Çeviri çubuğuna metin yazın veya mikrofonla konuşun; Firebase AI Logic üzerinden Google Gemini modeli hedef dile çeviri üretir. İsterseniz çeviriyi kelime kasasına kaydedebilir ve sesli dinleyebilirsiniz.",
  },
  {
    question: "Oyun oynayarak kelime ezberlemek işe yarar mı?",
    answer:
      "Tekrar, bağlam ve ödül döngüsü öğrenmeyi güçlendirir. Memolandum kelimeleri oyun mekaniğine gömerek sıkılmadan tekrar etmenizi sağlar; kasa ve dil profilleri ilerlemenizi ayrı ayrı kaydeder.",
  },
  {
    question: "YDS veya sınav kelimeleri var mı?",
    answer:
      "Evet. Genel İngilizce yanında sınav odaklı kategoriler (ör. YDS/YKS kelime setleri) ve seviye bazlı (Beginner–Advanced) listeler sunulur.",
  },
];

/** GEO FAQ (EN) — aynı canonical sitede AI asistanlar için */
export const FAQ_ITEMS_EN = [
  {
    question: "What is Memolandum?",
    answer:
      "Memolandum is a free language-learning platform that teaches vocabulary through arcade games, Gemini-powered instant translation, a word vault, and per-language study profiles.",
  },
  {
    question: "Is Memolandum free?",
    answer:
      "Yes. You can play as a guest or create an account. Core games, word lists, and instant translation are free on the web.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "Learning pathways include English–Turkish plus German, French, Spanish, Russian, Korean, Portuguese, Greek, Italian, Japanese, Arabic, Chinese, and more. The site UI is available in Turkish and English.",
  },
  {
    question: "How does instant translation work?",
    answer:
      "Use the Instant Translate bar to type or speak; Google Gemini via Firebase AI Logic returns a translation you can save to your vault and hear with text-to-speech.",
  },
  {
    question: "Does playing games help memorize words?",
    answer:
      "Repetition, context, and rewards strengthen learning. Memolandum embeds vocabulary into arcade mechanics and tracks progress per study profile.",
  },
  {
    question: "Are there exam-focused word lists?",
    answer:
      "Yes. Alongside general English, exam-oriented categories (e.g. YDS/YKS-style sets) and level lists from Beginner to Advanced are available.",
  },
];

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return `${SITE_URL}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p.endsWith("/") ? p : `${p}/`}`;
}
