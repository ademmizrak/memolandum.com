import { THESAURUS } from "./thesaurusData.js";

/** Intermediate (IELTS B1–B2) headwords with at least three synonyms and antonyms each. */
export const LEXICON = [
  {
    id: "abundant",
    word: "ABUNDANT",
    definition: "Existing or available in large quantities.",
    definitionTr: "Bol, bereketli, çok miktarda.",
    synonyms: ["plentiful", "copious", "ample", "bountiful"],
    antonyms: ["scarce", "meager", "sparse", "insufficient"]
  },
  {
    id: "achieve",
    word: "ACHIEVE",
    definition: "To succeed in reaching a goal by effort.",
    definitionTr: "Başarmak, elde etmek, hedefe ulaşmak.",
    synonyms: ["accomplish", "attain", "fulfil", "realize"],
    antonyms: ["fail", "abandon", "forfeit", "lose"]
  },
  {
    id: "adverse",
    word: "ADVERSE",
    definition: "Preventing success; harmful or unfavourable.",
    definitionTr: "Olumsuz, aleyhte, elverişsiz, zararlı.",
    synonyms: ["unfavourable", "harmful", "detrimental", "hostile"],
    antonyms: ["favourable", "beneficial", "advantageous", "helpful"]
  },
  {
    id: "beneficial",
    word: "BENEFICIAL",
    definition: "Producing a good or helpful result.",
    definitionTr: "Faydalı, yararlı, kazançlı.",
    synonyms: ["advantageous", "helpful", "favourable", "constructive"],
    antonyms: ["harmful", "detrimental", "damaging", "adverse"]
  },
  {
    id: "consequence",
    word: "CONSEQUENCE",
    definition: "A result or effect of an action or situation.",
    definitionTr: "Sonuç, netice, tesir.",
    synonyms: ["result", "outcome", "effect", "aftermath"],
    antonyms: ["cause", "origin", "source", "reason"]
  },
  {
    id: "significant",
    word: "SIGNIFICANT",
    definition: "Large enough or important enough to notice.",
    definitionTr: "Önemli, kayda değer, anlamlı.",
    synonyms: ["important", "notable", "considerable", "meaningful"],
    antonyms: ["insignificant", "trivial", "minor", "negligible"]
  },
  {
    id: "persistent",
    word: "PERSISTENT",
    definition: "Continuing firmly despite difficulty.",
    definitionTr: "Israrcı, sürekli, inatçı, sebatkar.",
    synonyms: ["determined", "tenacious", "steadfast", "enduring"],
    antonyms: ["wavering", "yielding", "fleeting", "reluctant"]
  },
  {
    id: "essential",
    word: "ESSENTIAL",
    definition: "Absolutely necessary; of the greatest importance.",
    definitionTr: "Zorunlu, elzem, temel, vazgeçilmez.",
    synonyms: ["necessary", "vital", "crucial", "indispensable"],
    antonyms: ["optional", "unnecessary", "trivial", "dispensable"]
  },
  {
    id: "comprehend",
    word: "COMPREHEND",
    definition: "To understand the meaning of something fully.",
    definitionTr: "Kavramak, tam anlamak, idrak etmek.",
    synonyms: ["understand", "grasp", "perceive", "fathom"],
    antonyms: ["misunderstand", "confuse", "misinterpret", "ignore"]
  },
  {
    id: "acquire",
    word: "ACQUIRE",
    definition: "To get or obtain something, often by effort.",
    definitionTr: "Edinmek, kazanmak, ele geçirmek.",
    synonyms: ["obtain", "gain", "procure", "secure"],
    antonyms: ["lose", "relinquish", "forfeit", "surrender"]
  },
  {
    id: "analyse",
    word: "ANALYSE",
    definition: "To examine something in detail in order to explain it.",
    definitionTr: "Çözümlemek, derinlemesine incelemek, analiz etmek.",
    synonyms: ["examine", "evaluate", "inspect", "scrutinize"],
    antonyms: ["combine", "synthesize", "assemble", "overlook"]
  },
  {
    id: "adequate",
    word: "ADEQUATE",
    definition: "Enough in quantity or good enough in quality.",
    definitionTr: "Yeterli, kafi, elverişli.",
    synonyms: ["sufficient", "enough", "satisfactory", "ample"],
    antonyms: ["inadequate", "deficient", "insufficient", "scant"]
  },
  {
    id: "distinct",
    word: "DISTINCT",
    definition: "Clearly different or separate from others.",
    definitionTr: "Belirgin, farklı, ayırt edilebilir.",
    synonyms: ["different", "separate", "unique", "discrete"],
    antonyms: ["identical", "similar", "vague", "indistinct"]
  },
  {
    id: "emphasise",
    word: "EMPHASISE",
    definition: "To give special importance to something.",
    definitionTr: "Vurgulamak, önemini belirtmek, altını çizmek.",
    synonyms: ["highlight", "stress", "underscore", "accentuate"],
    antonyms: ["understate", "downplay", "minimize", "ignore"]
  },
  {
    id: "evident",
    word: "EVIDENT",
    definition: "Easy to see, notice, or understand.",
    definitionTr: "Açık, bariz, apaçık, belirgin.",
    synonyms: ["obvious", "apparent", "clear", "manifest"],
    antonyms: ["hidden", "obscure", "unclear", "doubtful"]
  },
  {
    id: "substantial",
    word: "SUBSTANTIAL",
    definition: "Of considerable importance, size, or worth.",
    definitionTr: "Kayda değer, önemli miktarda, sağlam.",
    synonyms: ["considerable", "sizable", "hefty", "solid"],
    antonyms: ["minor", "slight", "negligible", "insignificant"]
  },
  {
    id: "communication",
    word: "COMMUNICATION",
    definition: "The imparting or exchanging of information by speaking, writing, or other media.",
    definitionTr: "İletişim, haberleşme, irtibat.",
    synonyms: ["interaction", "correspondence", "contact", "dialogue"],
    antonyms: ["isolation", "silence", "separation", "detachment"]
  },
  {
    id: "development",
    word: "DEVELOPMENT",
    definition: "The process of developing or being developed.",
    definitionTr: "Gelişim, ilerleme, kalkınma.",
    synonyms: ["growth", "progress", "advancement", "evolution"],
    antonyms: ["decline", "deterioration", "regression", "decay"]
  },
  {
    id: "experience",
    word: "EXPERIENCE",
    definition: "Practical contact with and observation of facts or events.",
    definitionTr: "Deneyim, tecrübe, birikim.",
    synonyms: ["knowledge", "expertise", "practice", "familiarity"],
    antonyms: ["inexperience", "ignorance", "unfamiliarity", "naivety"]
  },
  {
    id: "opportunity",
    word: "OPPORTUNITY",
    definition: "A set of circumstances that makes it possible to do something.",
    definitionTr: "Fırsat, imkan, olanak.",
    synonyms: ["chance", "occasion", "opening", "possibility"],
    antonyms: ["obstacle", "barrier", "misfortune", "disadvantage"]
  },
  {
    id: "environment",
    word: "ENVIRONMENT",
    definition: "The surroundings or conditions in which a person, animal, or plant lives.",
    definitionTr: "Çevre, ortam, ekosistem.",
    synonyms: ["surroundings", "habitat", "ecosystem", "setting"],
    antonyms: ["isolation", "void", "vacuum", "nonexistence"]
  },
  {
    id: "relationship",
    word: "RELATIONSHIP",
    definition: "The way in which two or more people or things are connected.",
    definitionTr: "İlişki, bağ, münasebet.",
    synonyms: ["connection", "bond", "association", "link"],
    antonyms: ["separation", "division", "estrangement", "disconnection"]
  },
  {
    id: "creative",
    word: "CREATIVE",
    definition: "Relating to or involving the use of the imagination or original ideas.",
    definitionTr: "Yaratıcı, üretken, özgün.",
    synonyms: ["inventive", "innovative", "imaginative", "original"],
    antonyms: ["unoriginal", "imitative", "conventional", "dull"]
  },
  {
    id: "accurate",
    word: "ACCURATE",
    definition: "Correct in all details; exact.",
    definitionTr: "Doğru, kesin, tam, hatasız.",
    synonyms: ["precise", "exact", "correct", "flawless"],
    antonyms: ["inaccurate", "wrong", "erroneous", "faulty"]
  },
  {
    id: "improve",
    word: "IMPROVE",
    definition: "Make or become better.",
    definitionTr: "Geliştirmek, iyileştirmek, ilerletmek.",
    synonyms: ["enhance", "upgrade", "boost", "refine"],
    antonyms: ["worsen", "deteriorate", "damage", "impair"]
  },
  {
    id: "challenge",
    word: "CHALLENGE",
    definition: "A task or situation that tests someone's abilities.",
    definitionTr: "Zorluk, meydan okuma, engel.",
    synonyms: ["obstacle", "test", "difficulty", "hurdle"],
    antonyms: ["ease", "simplicity", "solution", "advantage"]
  }
];

export function normalizeWordKey(raw) {
  if (!raw) return "";
  let s = String(raw).trim().toLowerCase();
  // Strip parentheticals e.g. "An app (application)" -> "An app"
  s = s.replace(/\(.*?\)/g, "").trim();
  // Strip slashes e.g. "Headmaster / Headmistress" -> "Headmaster"
  if (s.includes("/")) s = s.split("/")[0].trim();
  // Strip leading articles / infinitive "to "
  s = s.replace(/^(a|an|the|to)\s+/i, "").trim();
  // Normalize Latin diacritics (e.g. Portuguese/Spanish/French accents) for key matching
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Strip non-alphanumeric except hyphen and space
  s = s.replace(/[^a-z0-9\s-]/g, "").trim();
  return s;
}

export function findThesaurusEntry(raw) {
  const key = normalizeWordKey(raw);
  if (!key) return null;

  // 1. Direct match in comprehensive Thesaurus
  if (THESAURUS[key]) return THESAURUS[key];

  // 2. Suffix stemming
  const stems = [
    key.replace(/ies$/, "y"),
    key.replace(/ing$/, ""),
    key.replace(/ed$/, ""),
    key.replace(/es$/, ""),
    key.replace(/s$/, ""),
    key.replace(/ly$/, ""),
    key.replace(/tion$/, "te"),
    key.replace(/tion$/, ""),
    key.replace(/ment$/, ""),
    key.replace(/ness$/, ""),
    key.replace(/able$/, ""),
    key.replace(/ful$/, ""),
    key.replace(/less$/, ""),
    key.replace(/er$/, ""),
    key.replace(/est$/, "")
  ];
  for (const st of stems) {
    if (st && st !== key && THESAURUS[st]) return THESAURUS[st];
  }

  // 3. Multi-word phrase breakdown (e.g. "Sports Field" -> "field", "Science Club" -> "science")
  const parts = key.split(/[\s-]+/).filter(Boolean);
  if (parts.length > 1) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (THESAURUS[p]) return THESAURUS[p];
      const pStems = [
        p.replace(/ies$/, "y"),
        p.replace(/s$/, ""),
        p.replace(/ed$/, ""),
        p.replace(/ing$/, "")
      ];
      for (const pst of pStems) {
        if (pst && THESAURUS[pst]) return THESAURUS[pst];
      }
    }
  }

  return null;
}

export function findLexiconEntry(wordStr) {
  if (!wordStr) return null;
  const clean = normalizeWordKey(wordStr);
  return (
    LEXICON.find(
      (w) =>
        normalizeWordKey(w.word) === clean || normalizeWordKey(w.id) === clean
    ) || null
  );
}

/**
 * Ensures synonyms and antonyms are strictly in English and never contain Turkish translations.
 */
export function resolveEnglishSynonymsAndAntonyms(w) {
  if (!w) return { synonyms: ["equivalent", "similar", "matching"], antonyms: ["opposite", "contrary", "reverse"] };
  const rawWord = typeof w === "string" ? w : String(w.english || w.word || w.original_script || "").trim();
  const wordClean = normalizeWordKey(rawWord);
  const tr = typeof w === "string" ? "" : String(
    w.turkish || w.definitionTr || w.meaning || w.translation || ""
  ).trim();

  // For Arabic-English (ar_en) or Portuguese/Spanish/French/German-English (brpt_en, es_en, etc.)
  // where w.english is the target word ("كتاب", "livro", "coração") and w.turkish/w.meaning is English ("Book", "heart"),
  // also look up the English meaning in THESAURUS when rawWord is not directly found!
  const isMeaningEnglish = Boolean(tr && /[A-Za-z]/.test(tr) && !/[çğıöşüÇĞİÖŞÜ]/.test(tr));
  const directThesaurusHit = wordClean ? findThesaurusEntry(rawWord) : null;
  const directLexiconHit = wordClean ? findLexiconEntry(rawWord) : null;
  const usedMeaningLookup = !directThesaurusHit && !directLexiconHit && isMeaningEnglish;

  const thesaurusHit = directThesaurusHit || (isMeaningEnglish ? findThesaurusEntry(tr) : null);
  const lexiconHit = directLexiconHit || (isMeaningEnglish ? findLexiconEntry(tr) : null);

  const isTr = (str) => {
    if (!str) return true;
    const s = String(str).trim().toLowerCase();
    // Only exclude `tr` if `rawWord` was directly matched as an English headword;
    // if `rawWord` is Arabic/Portuguese/etc. (`usedMeaningLookup`), `tr` IS its English meaning!
    if (!usedMeaningLookup && wordClean && tr && s === tr.toLowerCase()) return true;
    // Check Turkish specific characters: ç, ğ, ı, ö, ş, ü
    return /[çğıöşüÇĞİÖŞÜ]/.test(str);
  };

  let syns = [];
  if (usedMeaningLookup && isMeaningEnglish) {
    const cleanMeaning = tr.split("/")[0].replace(/\(.*?\)/g, "").trim().toLowerCase();
    if (cleanMeaning && cleanMeaning !== wordClean) {
      syns.push(cleanMeaning);
    }
  }
  if (Array.isArray(w.synonyms) && w.synonyms.length > 0) {
    for (const rawSyn of w.synonyms) {
      const s = String(rawSyn).trim();
      if (s && !isTr(s) && s.toLowerCase() !== wordClean && !syns.includes(s)) {
        syns.push(s);
      }
    }
  }

  // Pull from THESAURUS
  if (syns.length < 3 && thesaurusHit?.syn) {
    for (const s of thesaurusHit.syn) {
      if (!syns.includes(s) && !isTr(s) && s.toLowerCase() !== wordClean) {
        syns.push(s);
      }
      if (syns.length >= 4) break;
    }
  }

  // Pull from LEXICON
  if (syns.length < 3 && lexiconHit?.synonyms) {
    for (const s of lexiconHit.synonyms) {
      if (!syns.includes(s) && !isTr(s) && s.toLowerCase() !== wordClean) {
        syns.push(s);
      }
      if (syns.length >= 4) break;
    }
  }

  let ants = [];
  const rawAnts = w.antonyms || w.opposites;
  if (Array.isArray(rawAnts) && rawAnts.length > 0) {
    ants = rawAnts
      .map(String)
      .map((s) => s.trim())
      .filter((s) => s && !isTr(s) && s.toLowerCase() !== wordClean);
  }

  // Pull from THESAURUS
  if (ants.length < 3 && thesaurusHit?.ant) {
    for (const a of thesaurusHit.ant) {
      if (!ants.includes(a) && !isTr(a) && a.toLowerCase() !== wordClean) {
        ants.push(a);
      }
      if (ants.length >= 4) break;
    }
  }

  // Pull from LEXICON
  if (ants.length < 3 && lexiconHit?.antonyms) {
    for (const a of lexiconHit.antonyms) {
      if (!ants.includes(a) && !isTr(a) && a.toLowerCase() !== wordClean) {
        ants.push(a);
      }
      if (ants.length >= 4) break;
    }
  }

  // Dynamic contextual fallbacks (strictly English, never Turkish)
  const DYNAMIC_SYN_POOLS = [
    ["equivalent", "comparable", "parallel", "analogous", "similar"],
    ["related", "kindred", "corresponding", "alike", "matching"],
    ["aligned", "associated", "connected", "harmonious", "compatible"],
    ["coherent", "fitting", "congruent", "uniform", "consistent"]
  ];
  const DYNAMIC_ANT_POOLS = [
    ["opposite", "contrary", "reverse", "opposing", "counter"],
    ["divergent", "inverse", "antithetical", "conflicting", "incompatible"],
    ["contrasting", "distinct", "different", "contradictory", "disparate"],
    ["adverse", "alien", "opposed", "dissonant", "polarized"]
  ];

  const hashSource = wordClean || rawWord || tr || "word";
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0;
  }
  const synPool = DYNAMIC_SYN_POOLS[hash % DYNAMIC_SYN_POOLS.length];
  const antPool = DYNAMIC_ANT_POOLS[hash % DYNAMIC_ANT_POOLS.length];

  let pIdx = 0;
  while (syns.length < 3) {
    const candidate = synPool[pIdx % synPool.length];
    if (!syns.includes(candidate) && candidate.toLowerCase() !== wordClean) {
      syns.push(candidate);
    }
    pIdx++;
  }

  pIdx = 0;
  while (ants.length < 3) {
    const candidate = antPool[pIdx % antPool.length];
    if (!ants.includes(candidate) && candidate.toLowerCase() !== wordClean) {
      ants.push(candidate);
    }
    pIdx++;
  }

  return {
    synonyms: syns.slice(0, 4),
    antonyms: ants.slice(0, 4)
  };
}

export function getWord(id) {
  const found = LEXICON.find((w) => w.id === id);
  if (!found) {
    return LEXICON[0];
  }
  return found;
}