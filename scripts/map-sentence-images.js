/**
 * Maps grade-2 sentence cards to word PNG image_ids.
 * Usage: node scripts/map-sentence-images.js [--write]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SENTENCES_PATH = path.join(
  ROOT,
  "public/data/Tr_Eng_Ilkokul/Ilkokul_2_Sinif_Cumleleri.json"
);
const W1_PATH = path.join(
  ROOT,
  "public/data/Tr_Eng_Ilkokul/Ilkokul_1_Sinif_Kelimeleri.json"
);
const W2_PATH = path.join(
  ROOT,
  "public/data/Tr_Eng_Ilkokul/Ilkokul_2_Sinif_Kelimeleri.json"
);
const PNG_DIR = path.join(ROOT, "public/assets/words");
const WRITE = process.argv.includes("--write");

const sentences = JSON.parse(fs.readFileSync(SENTENCES_PATH, "utf8"));
const w1 = JSON.parse(fs.readFileSync(W1_PATH, "utf8"));
const w2 = JSON.parse(fs.readFileSync(W2_PATH, "utf8"));
const pngs = new Set(
  fs
    .readdirSync(PNG_DIR)
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.replace(".png", ""))
);

const wordEntries = [];
for (const w of [...w1, ...w2]) {
  if (!pngs.has(w.word_id)) continue;
  const text = String(w.word || "")
    .toLowerCase()
    .trim();
  if (!text || text.length === 1) continue;
  wordEntries.push({
    word_id: w.word_id,
    text,
    grade: String(w.word_id).startsWith("w_2") ? 2 : 1,
    tokens: text.split(/\s+/),
  });
}
wordEntries.sort(
  (a, b) => b.text.length - a.text.length || b.grade - a.grade
);

const STOP = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "my",
  "your",
  "his",
  "her",
  "this",
  "that",
  "these",
  "those",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "and",
  "or",
  "but",
  "with",
  "me",
  "what",
  "how",
  "do",
  "does",
  "did",
  "can",
  "let",
  "lets",
  "there",
  "very",
  "much",
  "old",
  "years",
  "have",
  "has",
  "had",
  "be",
  "been",
  "was",
  "were",
  "from",
  "as",
  "so",
  "too",
  "not",
  "no",
  "yes",
  "if",
  "about",
  "up",
  "down",
  "out",
  "off",
  "into",
  "over",
  "after",
  "before",
  "today",
  "tomorrow",
  "day",
  "class",
  "mom",
  "dad",
  "ali",
  "ayşe",
  "ayse",
  "nice",
  "meet",
  "see",
  "give",
  "show",
  "put",
  "pass",
  "turn",
  "please",
  "thanks",
  "thank",
  "together",
  "high",
  "fast",
  "long",
  "juicy",
  "yummy",
  "cute",
  "strong",
  "soft",
  "happy",
  "flower",
  "picture",
  "song",
  "pet",
  "trees",
  "milk",
  "quack",
  "climb",
  "says",
  "bye",
]);

const ALIASES = {
  // friend+Ayşe handled specially → girl; bare "friend" uses word entry
  ayşe: "girl",
  ayse: "girl",
  hands: "hand",
  eyes: "eye",
  ears: "ear",
  pencils: "pencil",
  apples: "apple",
  bananas: "banana",
  melons: "melon",
  peaches: "peach",
  strawberries: "strawberry",
  cherries: "cherry",
  balloons: "balloons",
  candles: "candles",
  chairs: "chair",
  books: "book",
  bye: "bye",
  goodbye: "goodbye",
};

/** Concrete nouns / key vocab — beat adjectives, colors, weak verbs */
const NOUN_PRIORITY = new Set([
  "ambulance",
  "balloon",
  "balloons",
  "cake",
  "doctor",
  "hotel",
  "lemon",
  "panda",
  "radio",
  "taxi",
  "boy",
  "girl",
  "friend",
  "teacher",
  "board",
  "chair",
  "desk",
  "table",
  "pencil",
  "eraser",
  "notebook",
  "book",
  "bag",
  "sharpener",
  "paper",
  "glue",
  "slide",
  "swing",
  "seesaw",
  "rope",
  "cat",
  "dog",
  "bird",
  "rabbit",
  "fish",
  "turtle",
  "parrot",
  "apple",
  "banana",
  "peach",
  "melon",
  "watermelon",
  "grape",
  "strawberry",
  "cherry",
  "lion",
  "elephant",
  "monkey",
  "bear",
  "cow",
  "horse",
  "sheep",
  "duck",
  "head",
  "eye",
  "ear",
  "nose",
  "mouth",
  "knee",
  "foot",
  "hand",
  "finger",
  "hair",
  "school",
  "name",
  "candles",
  "pencil case",
  "school bag",
  "orange fruit",
  "stop",
]);

const CONTENT_BONUS = new Set([
  "ambulance",
  "balloon",
  "balloons",
  "cake",
  "doctor",
  "hotel",
  "lemon",
  "panda",
  "radio",
  "stop",
  "taxi",
  "television",
  "yogurt",
  "zebra",
  "gorilla",
  "kangaroo",
  "boy",
  "girl",
  "friend",
  "teacher",
  "student",
  "board",
  "chair",
  "desk",
  "table",
  "pencil",
  "eraser",
  "notebook",
  "book",
  "bag",
  "sharpener",
  "paper",
  "glue",
  "slide",
  "swing",
  "seesaw",
  "rope",
  "jump",
  "run",
  "walk",
  "dance",
  "sing",
  "cat",
  "dog",
  "bird",
  "rabbit",
  "fish",
  "turtle",
  "parrot",
  "apple",
  "banana",
  "peach",
  "melon",
  "watermelon",
  "grape",
  "strawberry",
  "cherry",
  "lion",
  "elephant",
  "monkey",
  "bear",
  "cow",
  "horse",
  "sheep",
  "duck",
  "head",
  "eye",
  "ear",
  "nose",
  "mouth",
  "knee",
  "foot",
  "hand",
  "finger",
  "hair",
  "school",
  "hello",
  "name",
  "fine",
  "great",
  "count",
  "open",
  "close",
  "touch",
  "point",
  "fly",
  "swim",
  "candles",
  "pencil case",
  "school bag",
  "sit down",
  "stand up",
  "skip rope",
  "good morning",
  "good afternoon",
  "good evening",
  "good night",
  "how old",
  "how many",
  "thank you",
  "orange fruit",
  "cut",
  "listen",
  "look",
  "like",
  "big",
  "small",
  "pink",
  "purple",
  "brown",
  "black",
  "white",
  "orange",
  "yellow",
  "blue",
  "green",
  "red",
  "eleven",
  "twelve",
]);

const WEAK_ALONE = new Set([
  "like",
  "big",
  "small",
  "open",
  "close",
  "look",
  "listen",
  "cut",
  "glue",
  "run",
  "jump",
  "walk",
  "dance",
  "sing",
  "touch",
  "point",
  "fly",
  "swim",
  "count",
  "fine",
  "great",
  "stop",
  "hello",
  "hi",
]);

function normalizeSentence(s) {
  return String(s)
    .toLowerCase()
    .replace(/[!?.,:;"']/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findWordByText(text) {
  const t = text.toLowerCase();
  const g2 = wordEntries.find((w) => w.text === t && w.grade === 2);
  if (g2) return g2;
  return wordEntries.find((w) => w.text === t) || null;
}

function scoreMatch(entry, matchedVia) {
  let score = entry.text.length * 10;
  if (entry.grade === 2) score += 50;
  if (CONTENT_BONUS.has(entry.text)) score += 80;
  if (NOUN_PRIORITY.has(entry.text)) score += 120;
  if (matchedVia === "phrase") score += 100;
  if (matchedVia === "alias") score += 40;
  if (matchedVia === "special") score += 60;
  if (matchedVia === "plural") score += 30;
  if (WEAK_ALONE.has(entry.text) && matchedVia !== "phrase") score -= 40;
  // Colors/numbers lose to concrete nouns when both present
  const colorOrNumber = new Set([
    "red",
    "blue",
    "yellow",
    "green",
    "orange",
    "pink",
    "purple",
    "brown",
    "black",
    "white",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "big",
    "small",
    "like",
    "fine",
    "great",
    "open",
    "close",
    "cut",
    "look",
    "listen",
    "run",
    "jump",
    "walk",
    "dance",
    "sing",
    "touch",
    "point",
    "fly",
    "swim",
    "count",
    "hello",
    "hi",
    "color",
  ]);
  if (colorOrNumber.has(entry.text) && matchedVia !== "phrase") score -= 50;
  if (entry.text.length <= 3) score -= 20;
  return score;
}

function matchSentence(english) {
  const norm = normalizeSentence(english);
  const candidates = [];

  for (const entry of wordEntries) {
    if (entry.tokens.length < 2) continue;
    const escaped = entry.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
    if (re.test(norm)) {
      candidates.push({
        entry,
        via: "phrase",
        score: scoreMatch(entry, "phrase"),
      });
    }
  }

  const tokens = norm.split(/\s+/).filter(Boolean);
  for (const entry of wordEntries) {
    if (entry.tokens.length !== 1) continue;
    if (STOP.has(entry.text) && !CONTENT_BONUS.has(entry.text)) continue;
    if (tokens.includes(entry.text)) {
      candidates.push({
        entry,
        via: "word",
        score: scoreMatch(entry, "word"),
      });
    }
  }

  for (const tok of tokens) {
    if (ALIASES[tok]) {
      const entry = findWordByText(ALIASES[tok]);
      if (entry) {
        candidates.push({
          entry,
          via: "alias",
          score: scoreMatch(entry, "alias") + 5,
        });
      }
    }
    if (tok.endsWith("ies") && tok.length > 4) {
      const sing = tok.slice(0, -3) + "y";
      const entry = findWordByText(sing);
      if (entry) {
        candidates.push({
          entry,
          via: "plural",
          score: scoreMatch(entry, "word"),
        });
      }
    } else if (tok.endsWith("s") && tok.length > 3 && !tok.endsWith("ss")) {
      const sing = tok.slice(0, -1);
      const entry = findWordByText(sing);
      if (entry) {
        candidates.push({
          entry,
          via: "plural",
          score: scoreMatch(entry, "word"),
        });
      }
    }
  }

  // Fruit orange vs color orange
  if (/\borange\b/.test(norm)) {
    if (/(give|juicy|fruit|like|eat|yummy|please)/.test(norm) && !/color|colour|yellow/.test(norm)) {
      const entry = findWordByText("orange fruit");
      if (entry) {
        candidates.push({
          entry,
          via: "special",
          score: scoreMatch(entry, "special") + 120,
        });
      }
    }
  }

  if (/how are you/.test(norm)) {
    const entry = findWordByText("fine") || findWordByText("hello");
    if (entry) {
      candidates.push({ entry, via: "fallback", score: 90 });
    }
  }
  if (/nice to meet/.test(norm)) {
    const entry = findWordByText("hello") || findWordByText("friend");
    if (entry) {
      candidates.push({ entry, via: "fallback", score: 85 });
    }
  }
  if (/what is this/.test(norm)) {
    const entry = findWordByText("look");
    if (entry) {
      candidates.push({ entry, via: "fallback", score: 70 });
    }
  }
  if (/what color/.test(norm)) {
    const entry = findWordByText("color") || findWordByText("red");
    if (entry) {
      candidates.push({ entry, via: "fallback", score: 80 });
    }
  }
  if (/happy day/.test(norm)) {
    const entry = findWordByText("great") || findWordByText("hello");
    if (entry) {
      candidates.push({ entry, via: "fallback", score: 80 });
    }
  }
  if (/\bi am great\b|\bi am fine\b/.test(norm)) {
    const key = /\bgreat\b/.test(norm) ? "great" : "fine";
    const entry = findWordByText(key);
    if (entry) {
      candidates.push({
        entry,
        via: "special",
        score: scoreMatch(entry, "special") + 100,
      });
    }
  }
  if (/my name is|what is your name/.test(norm)) {
    const entry = findWordByText("name");
    if (entry) {
      candidates.push({
        entry,
        via: "special",
        score: scoreMatch(entry, "special") + 80,
      });
    }
  }
  if (/\bbye\b/.test(norm) || /goodbye/.test(norm)) {
    const entry =
      findWordByText(norm.includes("goodbye") ? "goodbye" : "bye") ||
      findWordByText("bye");
    if (entry) {
      candidates.push({
        entry,
        via: "special",
        score: scoreMatch(entry, "special") + 100,
      });
    }
  }
  if (/one.*two.*three|count the/.test(norm)) {
    const entry = findWordByText("count");
    if (entry) {
      candidates.push({
        entry,
        via: "special",
        score: scoreMatch(entry, "special") + 80,
      });
    }
  }

  // User example: friend Ayşe → girl
  if (/\bfriend\b/.test(norm) && /(ayşe|ayse)/.test(norm)) {
    const entry = findWordByText("girl");
    if (entry) {
      candidates.push({ entry, via: "alias", score: 350 });
    }
  } else if (/\bfriend\b/.test(norm)) {
    const entry = findWordByText("friend");
    if (entry) {
      candidates.push({
        entry,
        via: "word",
        score: scoreMatch(entry, "word") + 50,
      });
    }
  }

  // Prefer greeting phrases strongly
  for (const phrase of [
    "good morning",
    "good afternoon",
    "good evening",
    "good night",
    "how old",
    "how many",
    "sit down",
    "stand up",
    "skip rope",
    "pencil case",
    "thank you",
  ]) {
    if (norm.includes(phrase)) {
      const entry = findWordByText(phrase);
      if (entry) {
        candidates.push({
          entry,
          via: "phrase",
          score: scoreMatch(entry, "phrase") + 150,
        });
      }
    }
  }

  if (!candidates.length) {
    const entry = findWordByText("hello") || wordEntries[0];
    return { entry, via: "ultimate-fallback", score: 0, weak: true };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const weak =
    best.score < 100 ||
    best.via === "fallback" ||
    best.via === "ultimate-fallback";
  return { ...best, weak };
}

const results = [];
const weakList = [];

for (const s of sentences) {
  const m = matchSentence(s.english);
  const row = {
    sentence_id: s.sentence_id,
    english: s.english,
    image_id: m.entry.word_id,
    word: m.entry.text,
    via: m.via,
    score: m.score,
    weak: !!m.weak,
  };
  results.push(row);
  if (row.weak) weakList.push(row);
}

console.log(`Mapped ${results.length} sentences`);
console.log(`Weak/fallback: ${weakList.length}`);
console.log("\n--- Mappings ---");
for (const r of results) {
  console.log(
    `${r.sentence_id} -> ${r.image_id} (${r.word}) [${r.via}] score=${r.score}${r.weak ? " WEAK" : ""}`
  );
}
if (weakList.length) {
  console.log("\n--- Weak ---");
  for (const r of weakList) {
    console.log(`${r.sentence_id} | ${r.english} -> ${r.image_id} (${r.word})`);
  }
}

const missing = results.filter((r) => !pngs.has(r.image_id));
console.log(`\nMissing PNGs: ${missing.length}`);
if (missing.length) {
  for (const m of missing) console.log(m);
}

if (WRITE) {
  const byId = new Map(results.map((r) => [r.sentence_id, r.image_id]));
  const updated = sentences.map((s) => {
    const image_id = byId.get(s.sentence_id);
    const next = { ...s };
    if (image_id) {
      // Place image_id after sentence_id for readability
      const ordered = {
        sentence_id: s.sentence_id,
        image_id,
        english: s.english,
        turkish: s.turkish,
        cefr_level: s.cefr_level,
        curriculum: s.curriculum,
        tags: s.tags,
        audio_url: s.audio_url,
      };
      return ordered;
    }
    return next;
  });
  fs.writeFileSync(SENTENCES_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`\nWrote image_id to ${SENTENCES_PATH}`);
}
