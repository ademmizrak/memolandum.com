/**
 * Client-safe KPSS / akademik kategori indeksi (fs yok).
 * Sözlük route’larıyla hizalı: /sozluk/{slug}/
 */

export const KPSS_EXAM_CATEGORIES = [
  {
    slug: "cografya",
    name: "Coğrafya",
    nameEn: "Geography",
    blurb: "Yer şekilleri, iklim, jeopolitik",
    blurbEn: "Landforms, climate, geopolitics",
    emoji: "🌍",
    accent: "#22d3ee",
  },
  {
    slug: "tarih",
    name: "Tarih",
    nameEn: "History",
    blurb: "Osmanlı, Cumhuriyet, dünya tarihi",
    blurbEn: "Ottoman, Republic, world history",
    emoji: "📜",
    accent: "#fbbf24",
  },
  {
    slug: "vatandaslik",
    name: "Vatandaşlık",
    nameEn: "Civics",
    blurb: "Anayasa, idare, haklar",
    blurbEn: "Constitution, administration, rights",
    emoji: "⚖️",
    accent: "#a78bfa",
  },
  {
    slug: "genel-kultur",
    name: "Genel Kültür",
    nameEn: "General Culture",
    blurb: "Güncel · kurumlar · kültür",
    blurbEn: "Current affairs · institutions · culture",
    emoji: "🧠",
    accent: "#34d399",
  },
  {
    slug: "turkce",
    name: "Türkçe",
    nameEn: "Turkish",
    blurb: "Dil bilgisi, anlam, anlatım",
    blurbEn: "Grammar, semantics, expression",
    emoji: "📝",
    accent: "#fb7185",
  },
  {
    slug: "matematik-geometri",
    name: "Matematik & Geometri",
    nameEn: "Math & Geometry",
    blurb: "Cebir, formül, grafik",
    blurbEn: "Algebra, formulas, graphs",
    emoji: "📐",
    accent: "#38bdf8",
  },
];

export const ACADEMIC_EXTRA_CATEGORIES = [
  {
    slug: "tip",
    name: "Tıp",
    nameEn: "Medicine",
    blurb: "Anatomi · fizyoloji",
    blurbEn: "Anatomy · physiology",
    emoji: "🩺",
    accent: "#f87171",
  },
  {
    slug: "hukuk",
    name: "Hukuk",
    nameEn: "Law",
    blurb: "Medeni · ceza · borçlar",
    blurbEn: "Civil · criminal · obligations",
    emoji: "👨‍⚖️",
    accent: "#c084fc",
  },
  {
    slug: "mimari",
    name: "Mimarlık",
    nameEn: "Architecture",
    blurb: "Üslup · yapı · şehircilik",
    blurbEn: "Style · structure · urbanism",
    emoji: "🏛️",
    accent: "#f59e0b",
  },
  {
    slug: "astronomi-uzay",
    name: "Astronomi & Uzay",
    nameEn: "Astronomy & Space",
    blurb: "Kozmos · astrofizik",
    blurbEn: "Cosmos · astrophysics",
    emoji: "🚀",
    accent: "#818cf8",
  },
];
