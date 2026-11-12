import gradeQuizPools from "./gradeQuizPools.js";
import lgsStrategyPools from "./lgsStrategyPools.js";

export const QUIZ_STORAGE_KEY = "memolandum_grade_quiz_stats_v1";

export const QUIZ_GRADES_META = [
  {
    grade: 2,
    slug: "2-sinif",
    shortLabel: "2. Sınıf",
    title: "2. Sınıf İngilizce Deneme Quizi",
    titleEn: "2nd Grade English Practice Quiz",
    subtitle: "Kelimeler, Kalıp Cümleler ve Ünite Tekrar Testi",
    subtitleEn: "Core Vocabulary, Key Sentences & Unit Review",
    badge: "İlkokul · 2. Sınıf",
    levelId: "meb-2-sinif-kelimeleri",
    langId: "en-tr_eng_ilkokul",
    playlist: "2sınıf",
    icon: "🎈",
    accent: {
      from: "from-emerald-500/20",
      to: "to-teal-900/30",
      border: "border-emerald-500/40 hover:border-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      button: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25",
      text: "text-emerald-300",
      ring: "ring-emerald-400/50",
    },
  },
  {
    grade: 3,
    slug: "3-sinif",
    shortLabel: "3. Sınıf",
    title: "3. Sınıf İngilizce Deneme Quizi",
    titleEn: "3rd Grade English Practice Quiz",
    subtitle: "Tüm Üniteler Kelime & Cümle Değerlendirme Testi",
    subtitleEn: "All Units Vocabulary & Sentence Assessment",
    badge: "İlkokul · 3. Sınıf",
    levelId: "meb-3-sinif-kelimeleri",
    langId: "en-tr_eng_ilkokul",
    playlist: "3sınıf",
    icon: "🚀",
    accent: {
      from: "from-amber-500/20",
      to: "to-orange-900/30",
      border: "border-amber-500/40 hover:border-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      button: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25",
      text: "text-amber-300",
      ring: "ring-amber-400/50",
    },
  },
  {
    grade: 4,
    slug: "4-sinif",
    shortLabel: "4. Sınıf",
    title: "4. Sınıf İngilizce Yazılı & Deneme Quizi",
    titleEn: "4th Grade English Exam & Practice Quiz",
    subtitle: "Yazılıya Hazırlık Kelime, Kurallar & Cümle Havuzu",
    subtitleEn: "Exam Prep Vocabulary, Classroom Rules & Sentences",
    badge: "İlkokul · 4. Sınıf",
    levelId: "meb-4-sinif-kelimeleri",
    langId: "en-tr_eng_ilkokul",
    playlist: "4sınıf",
    icon: "🌟",
    accent: {
      from: "from-purple-500/20",
      to: "to-indigo-900/30",
      border: "border-purple-500/40 hover:border-purple-400",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      button: "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/25",
      text: "text-purple-300",
      ring: "ring-purple-400/50",
    },
  },
  {
    grade: 5,
    slug: "5-sinif",
    shortLabel: "5. Sınıf",
    title: "5. Sınıf İngilizce 1. Yazılı Deneme Quizi",
    titleEn: "5th Grade English Exam Practice Quiz",
    subtitle: "Ortaokul (School Life & Classroom) 100 Soruluk Sınav Havuzu",
    subtitleEn: "Middle School (School Life & Classroom) 100-Question Pool",
    badge: "Ortaokul · 5. Sınıf",
    levelId: "meb-5-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "5sınıf",
    icon: "🎒",
    accent: {
      from: "from-indigo-500/20",
      to: "to-blue-900/30",
      border: "border-indigo-500/40 hover:border-indigo-400",
      badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      button: "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25",
      text: "text-indigo-300",
      ring: "ring-indigo-400/50",
    },
  },
  {
    grade: 6,
    slug: "6-sinif",
    shortLabel: "6. Sınıf",
    title: "6. Sınıf İngilizce 1. Yazılı Deneme Quizi",
    titleEn: "6th Grade English Exam Practice Quiz",
    subtitle: "Ortaokul (School Life & Routines) 100 Soruluk Sınav Havuzu",
    subtitleEn: "Middle School (School Life & Routines) 100-Question Pool",
    badge: "Ortaokul · 6. Sınıf",
    levelId: "meb-6-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "6sınıf",
    icon: "⚡",
    accent: {
      from: "from-cyan-500/20",
      to: "to-sky-900/30",
      border: "border-cyan-500/40 hover:border-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      button: "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/25",
      text: "text-cyan-300",
      ring: "ring-cyan-400/50",
    },
  },
  {
    grade: 7,
    slug: "7-sinif",
    shortLabel: "7. Sınıf",
    title: "7. Sınıf İngilizce 1. Yazılı Deneme Quizi",
    titleEn: "7th Grade English Exam Practice Quiz",
    subtitle: "Ortaokul (School Life, Education & Classroom) 100 Soruluk Havuz",
    subtitleEn: "Middle School (School Life, Education & Classroom) 100-Question Pool",
    badge: "Ortaokul · 7. Sınıf",
    levelId: "meb-7-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "7sınıf",
    icon: "🔥",
    accent: {
      from: "from-teal-500/20",
      to: "to-emerald-900/30",
      border: "border-teal-500/40 hover:border-teal-400",
      badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      button: "bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-teal-500/25",
      text: "text-teal-300",
      ring: "ring-teal-400/50",
    },
  },
  {
    grade: 8,
    slug: "8-sinif",
    shortLabel: "8. Sınıf (LGS)",
    title: "8. Sınıf (LGS) İngilizce Deneme Quizi",
    titleEn: "8th Grade (LGS) English Exam Practice Quiz",
    subtitle: "LGS & 1. Yazılıya Hazırlık 100 Soruluk Kelime ve Cümle Havuzu",
    subtitleEn: "LGS & Exam Prep 100-Question Vocabulary & Context Pool",
    badge: "LGS · 8. Sınıf",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "🏆",
    accent: {
      from: "from-rose-500/20",
      to: "to-amber-900/30",
      border: "border-rose-500/40 hover:border-rose-400",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      button: "bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 shadow-rose-500/25",
      text: "text-rose-300",
      ring: "ring-rose-400/50",
    },
  },
];

// Bonus 1st grade support if navigated directly
export const GRADE_1_META = {
  grade: 1,
  slug: "1-sinif",
  shortLabel: "1. Sınıf",
  title: "1. Sınıf İngilizce Kelime Quizi",
  titleEn: "1st Grade English Practice Quiz",
  subtitle: "Temel 100 Kelime Görsel & Sesli Alıştırma Testi",
  subtitleEn: "Core 100 Words Visual & Audio Quiz",
  badge: "İlkokul · 1. Sınıf",
  levelId: "meb-1-sinif-kelimeleri",
  langId: "en-tr_eng_ilkokul",
  playlist: "1sınıf",
  icon: "🎨",
  accent: {
    from: "from-cyan-500/20",
    to: "to-blue-900/30",
    border: "border-cyan-500/40 hover:border-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    button: "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/25",
    text: "text-cyan-300",
    ring: "ring-cyan-400/50",
  },
};

export const LGS_STRATEGY_CATEGORIES = [
  {
    grade: "lgs-olumsuz-kokler",
    slug: "lgs-olumsuz-kokler",
    categoryNumber: 1,
    isLgsStrategy: true,
    poolCount: 200,
    shortLabel: "1. Olumsuz Soru Kökleri",
    title: "LGS 1. Kategori: Olumsuz Soru Kökleri & Önce/Sonra Tuzakları",
    titleEn: "LGS Category 1: Negative Question Roots & Before/After Traps",
    subtitle: "NOT correct · DOES NOT have an answer · REFUSES with excuse · CANNOT be a rule · Step BEFORE/AFTER (200 Soru Havuzu)",
    badge: "LGS Çeldirici #1 · 200 Soru",
    trapSummary: "Gizli olumsuz fiiller (refuse, can't stand, rarely) ve mutfak adımlarında BEFORE / AFTER tuzakları",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "⚠️",
    accent: {
      from: "from-rose-500/20",
      to: "to-orange-950/40",
      border: "border-rose-500/45 hover:border-rose-400",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      button: "bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/25",
      text: "text-rose-300",
      ring: "ring-rose-400/50",
    },
  },
  {
    grade: "lgs-diyalog-bosluk",
    slug: "lgs-diyalog-bosluk",
    categoryNumber: 2,
    isLgsStrategy: true,
    poolCount: 200,
    shortLabel: "2. Diyalog & Boşluk",
    title: "LGS 2. Kategori: Diyalog ve Boşluk Doldurma Soru Kökleri",
    titleEn: "LGS Category 2: Dialogue Completion & Common Interests",
    subtitle: "Completes the conversation · Who has something in common with... · What can we say about... (200 Soru Havuzu)",
    badge: "LGS Çeldirici #2 · 200 Soru",
    trapSummary: "Boşluktan önceki/sonraki ipucu cümlesi, 'have something in common' ortak nokta ve yorum çıkarımları",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "💬",
    accent: {
      from: "from-cyan-500/20",
      to: "to-blue-950/40",
      border: "border-cyan-500/45 hover:border-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      button: "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/25",
      text: "text-cyan-300",
      ring: "ring-cyan-400/50",
    },
  },
  {
    grade: "lgs-afis-davetiye",
    slug: "lgs-afis-davetiye",
    categoryNumber: 3,
    isLgsStrategy: true,
    poolCount: 200,
    shortLabel: "3. Afiş & Eksik Bilgi",
    title: "LGS 3. Kategori: Davetiye, Afiş ve Eksik Bilgi Soru Kökleri",
    titleEn: "LGS Category 3: Poster, Invitation & Missing Information Traps",
    subtitle: "In the poster above, there is NO information about the... (Time/Duration, Fee/Price, Contact, Place) (200 Soru Havuzu)",
    badge: "LGS Çeldirici #3 · 200 Soru",
    trapSummary: "'5 PM - 8 PM' → Time/Duration elenir · '$15' → Fee/Price elenir · 'Call...' → Contact elenir",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "📢",
    accent: {
      from: "from-amber-500/20",
      to: "to-yellow-950/40",
      border: "border-amber-500/45 hover:border-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      button: "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/25",
      text: "text-amber-300",
      ring: "ring-amber-400/50",
    },
  },
  {
    grade: "lgs-grafik-tablo",
    slug: "lgs-grafik-tablo",
    categoryNumber: 4,
    isLgsStrategy: true,
    poolCount: 200,
    shortLabel: "4. Grafik & Tablo",
    title: "LGS 4. Kategori: Grafik ve Tablo Okuma Çeldiricileri (Quantifiers)",
    titleEn: "LGS Category 4: Charts, Tables & Quantifiers Distractors",
    subtitle: "Nearly/Almost half (%45–49) vs Half (%50) · More than half (%51+) · Both A and B · None of them (%0) (200 Soru Havuzu)",
    badge: "LGS Çeldirici #4 · 200 Soru",
    trapSummary: "%46–49 için 'Half (%50)' çeldiricisi, %51+ için 'The majority', ortak (✓|✓) için 'Both A and B'",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "📊",
    accent: {
      from: "from-emerald-500/20",
      to: "to-teal-950/40",
      border: "border-emerald-500/45 hover:border-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      button: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/25",
      text: "text-emerald-300",
      ring: "ring-emerald-400/50",
    },
  },
  {
    grade: "lgs-es-anlam-tuzaklari",
    slug: "lgs-es-anlam-tuzaklari",
    categoryNumber: 5,
    isLgsStrategy: true,
    poolCount: 200,
    shortLabel: "5. Eş Anlam (Paraphrasing)",
    title: "LGS 5. Kategori: Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
    titleEn: "LGS Category 5: Paraphrasing & Synonym Traps",
    subtitle: "count on = trust · melt butter = heat butter · don't have to pay = free of charge vs NO info about fee (200 Soru Havuzu)",
    badge: "LGS Çeldirici #5 · 200 Soru",
    trapSummary: "'Ücret ödemenize gerek yok' = 'Free of charge' ('Ücret bilgisi yoktur' en güçlü çeldiricidir!)",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "🔄",
    accent: {
      from: "from-purple-500/20",
      to: "to-indigo-950/40",
      border: "border-purple-500/45 hover:border-purple-400",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      button: "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/25",
      text: "text-purple-300",
      ring: "ring-purple-400/50",
    },
  },
  {
    grade: "lgs-siklik-zarflari",
    slug: "lgs-siklik-zarflari",
    categoryNumber: 6,
    isLgsStrategy: true,
    poolCount: 200,
    shortLabel: "6. Sıklık Zarfları",
    title: "LGS 6. Kategori: Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)",
    titleEn: "LGS Category 6: Weekly Schedule & Frequency Adverb Traps",
    subtitle: "Saturday & Sunday = at weekends / twice a week (NOT twice a day!) · Mon–Fri = on weekdays (200 Soru Havuzu)",
    badge: "LGS Çeldirici #6 · 200 Soru",
    trapSummary: "Tabloda Cumartesi & Pazar (2 gün) için 'twice a day' (günde iki kez) tuzağına dikkat! Doğrusu 'at weekends / twice a week'",
    levelId: "meb-8-sinif-kelimeleri",
    langId: "en-tr_eng_ortaokul",
    playlist: "8sınıf",
    icon: "🗓️",
    accent: {
      from: "from-indigo-500/20",
      to: "to-violet-950/40",
      border: "border-indigo-500/45 hover:border-indigo-400",
      badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      button: "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25",
      text: "text-indigo-300",
      ring: "ring-indigo-400/50",
    },
  },
];

export const LGS_ALL_MIXED_META = {
  grade: "lgs-celdirici-kampi",
  slug: "lgs-celdirici-kampi",
  categoryNumber: 0,
  isLgsStrategy: true,
  poolCount: 1200,
  shortLabel: "🔥 Tüm 6 Kategori Karma (1.200 Soru)",
  title: "LGS Karma Soru Kökü & Çeldirici Kampı (6 Kategori · 1.200 Soru Havuzu)",
  titleEn: "LGS Mixed Question Roots & Distractor Camp (1,200-Question Pool)",
  subtitle: "Olumsuz Kökler, Diyalog, Afiş, Grafik/Tablo, Eş Anlam ve Sıklık Zarfları — 1.200 Soruluk Dev Havuzdan 20 Rastgele Soru",
  badge: "LGS Dev Havuz · 1.200 Soru",
  trapSummary: "MEB'in 6 temel çeldirici grubunun tamamından karma 20 soruluk gerçek LGS denemesi",
  levelId: "meb-8-sinif-kelimeleri",
  langId: "en-tr_eng_ortaokul",
  playlist: "8sınıf",
  icon: "🏆",
  accent: {
    from: "from-amber-500/25",
    to: "to-rose-950/40",
    border: "border-amber-400/60 hover:border-amber-300",
    badge: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    button: "bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 shadow-amber-500/25",
    text: "text-amber-300",
    ring: "ring-amber-400/50",
  },
};

export function resolveQuizGradeMeta(rawParam) {
  if (!rawParam) return null;
  const norm = String(rawParam).toLowerCase().trim();
  if (norm === "lgs-celdirici-kampi" || norm === "lgs-karma") {
    return LGS_ALL_MIXED_META;
  }
  const lgsCat = LGS_STRATEGY_CATEGORIES.find(
    (c) => c.slug === norm || c.grade === norm || `lgs-kategori-${c.categoryNumber}` === norm
  );
  if (lgsCat) return lgsCat;

  if (norm === "lgs") {
    return QUIZ_GRADES_META.find((g) => g.grade === 8) || null;
  }
  const matchNum = norm.match(/([1-8])/);
  if (!matchNum) return null;
  const num = Number(matchNum[1]);
  if (num === 1) return GRADE_1_META;
  return QUIZ_GRADES_META.find((g) => g.grade === num) || null;
}

export function getGradeQuestionPool(gradeOrSlug) {
  if (!gradeOrSlug) return [];
  const norm = String(gradeOrSlug).toLowerCase().trim();
  if (norm === "lgs-celdirici-kampi" || norm === "lgs-karma") {
    return Object.values(lgsStrategyPools).flatMap((p) => p.questions || []);
  }
  if (lgsStrategyPools[norm]) {
    return lgsStrategyPools[norm].questions || [];
  }
  const num = Number(gradeOrSlug);
  const poolObj = gradeQuizPools[num] || gradeQuizPools[String(num)];
  return poolObj ? poolObj.questions || [] : [];
}

/**
 * Fisher-Yates shuffle (pure copy)
 */
export function shuffleArray(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Formats a raw pool question into a playable 4-option multiple choice item
 * according to the selected mode ("mixed" | "context" | "vocab").
 */
export function materializeQuizQuestion(rawQ, mode = "mixed", indexInTest = 0) {
  if (rawQ.passageText || rawQ.categorySlug) {
    const rawOptions = [
      { text: rawQ.correctAnswer, isCorrect: true },
      ...(rawQ.distractors || []).slice(0, 3).map((d) => ({ text: d, isCorrect: false })),
    ];
    const letters = ["A", "B", "C", "D"];
    const shuffledOptions = shuffleArray(rawOptions).map((opt, idx) => ({
      letter: letters[idx] || String(idx + 1),
      text: opt.text,
      isCorrect: opt.isCorrect,
    }));

    return {
      ...rawQ,
      effectiveType: "lgs_strategy",
      promptTr: rawQ.promptTr || "Metne, tabloya veya diyaloğa göre doğru seçeneği işaretleyiniz:",
      promptEn: "Choose the correct option according to the text/table above:",
      questionText: rawQ.questionText,
      passageText: rawQ.passageText,
      helperText: rawQ.helperText,
      correctAnswer: rawQ.correctAnswer,
      options: shuffledOptions,
    };
  }

  let effectiveType = rawQ.questionType || "en_to_tr";
  if (mode === "context") {
    effectiveType = "context_blank";
  } else if (mode === "vocab") {
    effectiveType = indexInTest % 2 === 0 ? "en_to_tr" : "tr_to_en";
  }

  let promptTr = rawQ.promptTr;
  let promptEn = "Choose the best answer:";
  let questionText = rawQ.questionText;
  let helperText = rawQ.helperText;
  let correctAnswer = rawQ.correctAnswer;
  let distractors = rawQ.distractors || [];

  if (effectiveType === "context_blank") {
    promptTr = "Cümlede boş bırakılan yere anlamca en uygun ifade hangisidir?";
    promptEn = "Fill in the blank with the most suitable word or phrase:";
    questionText = rawQ.blankedSentence || rawQ.exampleSentence;
    helperText = `İpucu (Türkçe Anlamı): ${rawQ.turkish}`;
    correctAnswer = rawQ.english;
    distractors = rawQ.englishDistractors || rawQ.distractors || [];
  } else if (effectiveType === "tr_to_en") {
    promptTr = "Verilen Türkçe anlamın İngilizce karşılığı aşağıdakilerden hangisidir?";
    promptEn = "Which English word or phrase matches the Turkish meaning below?";
    questionText = rawQ.turkish;
    helperText = rawQ.blankedSentence ? `Örnek Cümle: "${rawQ.blankedSentence}"` : "";
    correctAnswer = rawQ.english;
    distractors = rawQ.englishDistractors || rawQ.distractors || [];
  } else {
    promptTr = "Verilen İngilizce kelime veya ifadenin Türkçe anlamı hangisidir?";
    promptEn = "What is the Turkish meaning of the English word or phrase below?";
    questionText = rawQ.english;
    helperText = rawQ.exampleSentence ? `Örnek Cümle: "${rawQ.exampleSentence}"` : "";
    correctAnswer = rawQ.turkish;
    distractors = rawQ.turkishDistractors || rawQ.distractors || [];
  }

  const rawOptions = [
    { text: correctAnswer, isCorrect: true },
    ...distractors.slice(0, 3).map((d) => ({ text: d, isCorrect: false })),
  ];

  const letters = ["A", "B", "C", "D"];
  const shuffledOptions = shuffleArray(rawOptions).map((opt, idx) => ({
    letter: letters[idx] || String(idx + 1),
    text: opt.text,
    isCorrect: opt.isCorrect,
  }));

  return {
    ...rawQ,
    effectiveType,
    promptTr,
    promptEn,
    questionText,
    helperText,
    correctAnswer,
    options: shuffledOptions,
  };
}

/**
 * Draws `count` (default 20) random questions from the 100-question grade pool.
 * Prioritizes unseen questions from the 100-item pool so consecutive tests cover all 100 questions!
 */
export function buildRandomQuizSession(
  grade,
  { count = 20, mode = "mixed", seenIds = [], specificQuestions = null } = {}
) {
  const fullPool = getGradeQuestionPool(grade);
  if (!fullPool.length) return { questions: [], poolSize: 0, resetSeenCycle: false };

  if (Array.isArray(specificQuestions) && specificQuestions.length > 0) {
    const materialized = shuffleArray(specificQuestions).map((q, idx) =>
      materializeQuizQuestion(q, mode, idx)
    );
    return {
      questions: materialized,
      poolSize: fullPool.length,
      resetSeenCycle: false,
    };
  }

  const seenSet = new Set(Array.isArray(seenIds) ? seenIds : []);
  const unseenPool = fullPool.filter((q) => !seenSet.has(q.id));
  const seenPool = fullPool.filter((q) => seenSet.has(q.id));

  let selectedRaw = [];
  let resetSeenCycle = false;

  if (unseenPool.length >= count) {
    selectedRaw = shuffleArray(unseenPool).slice(0, count);
  } else {
    // Take all remaining unseen questions and fill the rest from reshuffled seen pool
    const needed = count - unseenPool.length;
    selectedRaw = [
      ...shuffleArray(unseenPool),
      ...shuffleArray(seenPool).slice(0, needed),
    ];
    resetSeenCycle = true;
  }

  const materialized = shuffleArray(selectedRaw).map((q, idx) =>
    materializeQuizQuestion(q, mode, idx)
  );

  return {
    questions: materialized,
    poolSize: fullPool.length,
    resetSeenCycle,
  };
}

export function loadAllQuizStats() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveQuizAttemptResult(grade, { score, correctCount, wrongCount, totalQuestions, durationSec, questionIds = [], resetSeenCycle = false }) {
  if (typeof window === "undefined") return null;
  try {
    const all = loadAllQuizStats();
    const key = String(grade);
    const prev = all[key] || {
      attempts: 0,
      bestScore: 0,
      lastScore: 0,
      totalSolved: 0,
      totalCorrect: 0,
      seenQuestionIds: [],
      history: [],
    };

    const baseSeen = resetSeenCycle ? [] : prev.seenQuestionIds || [];
    const nextSeen = Array.from(new Set([...baseSeen, ...questionIds]));

    const entry = {
      id: `att_${Date.now()}`,
      timestamp: Date.now(),
      score,
      correctCount,
      wrongCount,
      totalQuestions,
      durationSec,
    };

    const updated = {
      attempts: (prev.attempts || 0) + 1,
      bestScore: Math.max(prev.bestScore || 0, score),
      lastScore: score,
      totalSolved: (prev.totalSolved || 0) + totalQuestions,
      totalCorrect: (prev.totalCorrect || 0) + correctCount,
      seenQuestionIds: nextSeen,
      history: [entry, ...(prev.history || [])].slice(0, 15),
    };

    all[key] = updated;
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(all));
    return updated;
  } catch {
    return null;
  }
}
