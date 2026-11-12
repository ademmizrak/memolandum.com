import fs from "fs";
import path from "path";

const GRADES_CONFIG = [
  {
    grade: 1,
    slug: "1-sinif",
    title: "1. Sınıf İngilizce Deneme Quizi",
    subtitle: "Temel Kelimeler & Görsel-Sesli İlkokul Quizi",
    badge: "İlkokul · 1. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_1_Sinif_Kelimeleri.json",
    sentencesPath: null,
  },
  {
    grade: 2,
    slug: "2-sinif",
    title: "2. Sınıf İngilizce Deneme Quizi",
    subtitle: "Kelimeler, Kalıp Cümleler ve Ünite Tekrar Testi",
    badge: "İlkokul · 2. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_2_Sinif_Kelimeleri.json",
    sentencesPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_2_Sinif_Cumleleri.json",
  },
  {
    grade: 3,
    slug: "3-sinif",
    title: "3. Sınıf İngilizce Deneme Quizi",
    subtitle: "Tüm Üniteler Kelime & Cümle Değerlendirme Testi",
    badge: "İlkokul · 3. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_3_Sinif_Kelimeleri.json",
    sentencesPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_3_Sinif_Cumleleri.json",
  },
  {
    grade: 4,
    slug: "4-sinif",
    title: "4. Sınıf İngilizce Yazılı & Deneme Quizi",
    subtitle: "1. ve 2. Dönem Yazılıya Hazırlık Kelime & Cümle Havuzu",
    badge: "İlkokul · 4. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_4_Sinif_Kelimeleri.json",
    sentencesPath: "public/data/Tr_Eng_Ilkokul/Ilkokul_4_Sinif_Cumleleri.json",
  },
  {
    grade: 5,
    slug: "5-sinif",
    title: "5. Sınıf İngilizce 1. Yazılı Deneme Quizi",
    subtitle: "Ortaokul (School Life & Classroom) 100 Soruluk Sınav Havuzu",
    badge: "Ortaokul · 5. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ortaokul/Ortaokul_5_Sinif_Kelimeleri.json",
    sentencesPath: null,
  },
  {
    grade: 6,
    slug: "6-sinif",
    title: "6. Sınıf İngilizce 1. Yazılı Deneme Quizi",
    subtitle: "Ortaokul (School Life & Routines) 100 Soruluk Sınav Havuzu",
    badge: "Ortaokul · 6. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ortaokul/Ortaokul_6_Sinif_Kelimeleri.json",
    sentencesPath: null,
  },
  {
    grade: 7,
    slug: "7-sinif",
    title: "7. Sınıf İngilizce 1. Yazılı Deneme Quizi",
    subtitle: "Ortaokul (School Life, Education & Classroom) 100 Soruluk Havuz",
    badge: "Ortaokul · 7. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ortaokul/Ortaokul_7_Sinif_Kelimeleri.json",
    sentencesPath: null,
  },
  {
    grade: 8,
    slug: "8-sinif",
    title: "8. Sınıf (LGS) İngilizce Deneme Quizi",
    subtitle: "LGS & 1. Yazılıya Hazırlık 100 Soruluk Kelime ve Cümle Havuzu",
    badge: "LGS · 8. Sınıf",
    wordsPath: "public/data/Tr_Eng_Ortaokul/Ortaokul_8_Sinif_Kelimeleri.json",
    sentencesPath: null,
  },
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createBlankedSentence(sentence, rawWord) {
  if (!sentence || !rawWord) return "_______";
  const cleanWord = rawWord.trim();

  // Build candidate phrases to match inside the sentence
  const slashParts = cleanWord
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates = [];
  for (const part of slashParts) {
    // 1. Exact part
    candidates.push(part);
    // 2. Without parenthetical notes e.g. "Football (Soccer)" -> "Football", "To blow (up)" -> "To blow up" and "To blow"
    const withParensContent = part.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
    const withoutParens = part.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    if (withParensContent && !candidates.includes(withParensContent)) {
      candidates.push(withParensContent);
    }
    if (withoutParens && !candidates.includes(withoutParens)) {
      candidates.push(withoutParens);
    }
    // Also extract inside parens if it's an alternative
    const parenMatch = part.match(/\((.*?)\)/);
    if (parenMatch && parenMatch[1]) {
      candidates.push(parenMatch[1].trim());
    }
  }

  // Strip leading "To ", "A ", "An " for verb/noun forms
  const expanded = [...candidates];
  for (const c of candidates) {
    const stripped = c
      .replace(/^to\s+/i, "")
      .replace(/^(a|an)\s+/i, "")
      .trim();
    if (stripped && !expanded.includes(stripped)) {
      expanded.push(stripped);
    }
    // Handle "one's" -> "(my|your|his|her|our|their|one's)"
    if (/one's/i.test(stripped)) {
      expanded.unshift(stripped);
    }
  }

  // Sort longest first so multi-word phrases match before single words
  expanded.sort((a, b) => b.length - a.length);

  for (const cand of expanded) {
    if (!cand) continue;
    let pattern;
    if (/one's/i.test(cand)) {
      pattern = escapeRegex(cand).replace(
        /one's/i,
        "(?:my|your|his|her|our|their|one's)"
      );
    } else {
      // Allow simple verb inflections on the first word or last word (e.g. decorate -> decorated, line up -> lined up)
      const tokens = cand.split(/\s+/);
      pattern = tokens
        .map((tok) => {
          const base = escapeRegex(tok.replace(/e$/i, ""));
          return `${escapeRegex(tok)}(?:s|es|ed|d|ing)?|${base}(?:ed|ing|es|s)?`;
        })
        .map((p) => `(?:${p})`)
        .join("\\s+");
    }

    const re = new RegExp(`\\b(${pattern})\\b`, "i");
    if (re.test(sentence)) {
      return sentence.replace(re, "_______");
    }
  }

  // Fallback: try matching any significant word (>= 4 chars) from the target phrase
  const words = cleanWord
    .replace(/\(.*?\)/g, "")
    .split(/[\s/]+/)
    .map((w) => w.replace(/[^a-zA-Z']/g, ""))
    .filter((w) => w.length >= 3 && !/^(the|and|for|with)$/i.test(w));

  for (const w of words) {
    const stem = escapeRegex(w.replace(/(?:ence|ance|tion|e)$/i, ""));
    if (stem.length >= 3) {
      const re = new RegExp(`\\b(${stem}[a-z]*)\\b`, "i");
      if (re.test(sentence)) {
        return sentence.replace(re, "_______");
      }
    }
  }

  if (/question tags/i.test(cleanWord) && /don't you/i.test(sentence)) {
    return sentence.replace(/don't you\?/i, "_______? (Question tags)");
  }

  return `${sentence} (_______)`;
}

function deterministicPickDistractors(items, currentIndex, count = 3, field = "english") {
  const target = items[currentIndex];
  const targetUnit = target.unitNo;
  const targetVal = (target[field] || "").toLowerCase().trim();

  // Prefer same unit first, then other units, using a deterministic prime step
  const sameUnit = items.filter(
    (it, idx) =>
      idx !== currentIndex &&
      it.unitNo === targetUnit &&
      (it[field] || "").toLowerCase().trim() !== targetVal
  );
  const otherUnits = items.filter(
    (it, idx) =>
      idx !== currentIndex &&
      it.unitNo !== targetUnit &&
      (it[field] || "").toLowerCase().trim() !== targetVal
  );

  const pool = [...sameUnit, ...otherUnits];
  const chosen = [];
  const usedVals = new Set([targetVal]);

  let cursor = (currentIndex * 7 + 3) % Math.max(1, pool.length);
  let steps = 0;
  while (chosen.length < count && steps < pool.length) {
    const candidate = pool[cursor];
    const val = (candidate[field] || "").trim();
    const norm = val.toLowerCase();
    if (val && !usedVals.has(norm)) {
      usedVals.add(norm);
      chosen.push(val);
    }
    cursor = (cursor + 11) % pool.length;
    steps++;
  }

  return chosen;
}

const outDir = path.resolve("public/data/quizzes");
fs.mkdirSync(outDir, { recursive: true });

const allPoolsSummary = {};

for (const cfg of GRADES_CONFIG) {
  const rawWords = JSON.parse(fs.readFileSync(path.resolve(cfg.wordsPath), "utf8"));
  const rawSentences = cfg.sentencesPath
    ? JSON.parse(fs.readFileSync(path.resolve(cfg.sentencesPath), "utf8"))
    : [];

  // Take exactly 100 unique curriculum items for the 100-question pool
  const selectedWords = rawWords.slice(0, 100);

  const normalizedItems = selectedWords.map((item, idx) => {
    const english = (item.word || item.english || "").trim();
    const turkish = (item.translation || item.turkish || item.meaning || "").trim();
    const unitObj = item.curriculum?.units?.[0] || item.curriculum || {};
    const unitNo = unitObj.unit_no || 1;
    const unitName = unitObj.unit_name || "School Life";

    // For Grade 2, if Ilkokul_2_Sinif_Cumleleri has a richer sentence containing the word, use it!
    let exampleSentence = (item.example_sentence || "").trim();
    let sentenceTr = "";
    const wordBoundaryRe = new RegExp(`\\b${escapeRegex(english)}\\b`, "i");
    const matchedSent = rawSentences.find((s) =>
      wordBoundaryRe.test(s.english || "")
    );
    if (matchedSent) {
      if (cfg.grade === 2 || !exampleSentence || exampleSentence.startsWith("This is a ")) {
        exampleSentence = matchedSent.english;
      }
      sentenceTr = matchedSent.turkish || "";
    }

    const blankedSentence = createBlankedSentence(exampleSentence, english);

    return {
      index: idx + 1,
      wordId: item.word_id || item.id || `w_${cfg.grade}_${idx + 1}`,
      english,
      turkish,
      unitNo,
      unitName,
      cefr: item.cefr_level || (cfg.grade <= 4 ? "A1" : cfg.grade <= 6 ? "A2" : "B1"),
      exampleSentence,
      blankedSentence,
      sentenceTr,
      audioUrl: item.audioUrl || item.audio_url || null,
      imageUrl: item.imageUrl || matchedSent?.imageUrl || null,
    };
  });

  // Now generate 100 questions (1 per word) with rich exam variety
  const questions = normalizedItems.map((it, idx) => {
    const englishDistractors = deterministicPickDistractors(normalizedItems, idx, 3, "english");
    const turkishDistractors = deterministicPickDistractors(normalizedItems, idx, 3, "turkish");

    // Cycle question types so the 100-question pool has a great mix:
    // 0, 2 -> context_blank (Cümlede Boşluk Doldurma)
    // 1 -> en_to_tr (İngilizce -> Türkçe Anlam)
    // 3 -> tr_to_en (Türkçe -> İngilizce Karşılık)
    const mod = idx % 4;
    const hasCleanBlank =
      it.blankedSentence.includes("_______") &&
      !it.blankedSentence.endsWith("(_______)");

    let questionType = "en_to_tr";
    if ((mod === 0 || mod === 2) && hasCleanBlank) {
      questionType = "context_blank";
    } else if (mod === 3) {
      questionType = "tr_to_en";
    } else {
      questionType = "en_to_tr";
    }

    let promptTr = "";
    let questionText = "";
    let helperText = "";
    let correctAnswer = "";
    let distractors = [];

    if (questionType === "context_blank") {
      promptTr = "Cümlede boş bırakılan yere anlamca en uygun kelime hangisidir?";
      questionText = it.blankedSentence;
      helperText = `İpucu (Anlamı): ${it.turkish}`;
      correctAnswer = it.english;
      distractors = englishDistractors;
    } else if (questionType === "tr_to_en") {
      promptTr = "Verilen Türkçe anlamın İngilizce karşılığı aşağıdakilerden hangisidir?";
      questionText = it.turkish;
      helperText = hasCleanBlank ? `Örnek: "${it.blankedSentence}"` : "";
      correctAnswer = it.english;
      distractors = englishDistractors;
    } else {
      promptTr = "Verilen İngilizce kelime veya ifadenin Türkçe anlamı hangisidir?";
      questionText = it.english;
      helperText = it.exampleSentence ? `Örnek: "${it.exampleSentence}"` : "";
      correctAnswer = it.turkish;
      distractors = turkishDistractors;
    }

    return {
      id: `q_g${cfg.grade}_${String(idx + 1).padStart(3, "0")}`,
      number: idx + 1,
      grade: cfg.grade,
      unitNo: it.unitNo,
      unitName: it.unitName,
      cefr: it.cefr,
      wordId: it.wordId,
      english: it.english,
      turkish: it.turkish,
      exampleSentence: it.exampleSentence,
      blankedSentence: it.blankedSentence,
      sentenceTr: it.sentenceTr,
      audioUrl: it.audioUrl,
      questionType,
      promptTr,
      questionText,
      helperText,
      correctAnswer,
      distractors,
      englishDistractors,
      turkishDistractors,
    };
  });

  const payload = {
    grade: cfg.grade,
    slug: cfg.slug,
    title: cfg.title,
    subtitle: cfg.subtitle,
    badge: cfg.badge,
    poolSize: questions.length,
    defaultTestSize: 20,
    questions,
  };

  const filePath = path.join(outDir, `grade_${cfg.grade}_quiz_pool.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  allPoolsSummary[cfg.grade] = payload;

  const fallbackBlanks = questions.filter((q) =>
    q.blankedSentence.endsWith("(_______)")
  ).length;
  console.log(
    `Grade ${cfg.grade}: ${questions.length} questions generated -> ${filePath} (fallbackBlanks: ${fallbackBlanks})`
  );
}

const libDir = path.resolve("src/lib/quizzes");
fs.mkdirSync(libDir, { recursive: true });
fs.writeFileSync(
  path.join(libDir, "gradeQuizPools.js"),
  `// Auto-generated by scripts/build-grade-quiz-pools.mjs\nexport const GRADE_QUIZ_POOLS = ${JSON.stringify(allPoolsSummary)};\nexport default GRADE_QUIZ_POOLS;\n`,
  "utf8"
);
console.log("Wrote src/lib/quizzes/gradeQuizPools.js");
