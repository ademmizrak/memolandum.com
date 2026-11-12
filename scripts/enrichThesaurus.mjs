// scripts/enrichThesaurus.mjs
import fs from 'fs';

const ENRICHED = {
  // Academic & Core Skills
  "analyze": { syn: ["examine", "investigate", "evaluate", "inspect", "scrutinize"], ant: ["synthesize", "combine", "ignore", "overlook"] },
  "analysis": { syn: ["examination", "investigation", "evaluation", "study"], ant: ["synthesis", "overview", "guess"] },
  "approach": { syn: ["near", "advance", "tackle", "method", "strategy"], ant: ["retreat", "depart", "withdraw", "avoid"] },
  "area": { syn: ["region", "zone", "sector", "territory", "field"], ant: ["point", "center", "void"] },
  "assess": { syn: ["evaluate", "judge", "appraise", "rate", "estimate"], ant: ["ignore", "neglect", "overlook", "misjudge"] },
  "assessment": { syn: ["evaluation", "appraisal", "test", "rating"], ant: ["neglect", "dismissal", "ignorance"] },
  "assume": { syn: ["suppose", "presume", "take on", "infer"], ant: ["know", "prove", "verify", "reject"] },
  "authority": { syn: ["power", "command", "control", "jurisdiction"], ant: ["powerlessness", "servitude", "subordination"] },
  "available": { syn: ["accessible", "obtainable", "ready", "free"], ant: ["unavailable", "occupied", "scarce", "inaccessible"] },
  "benefit": { syn: ["advantage", "profit", "gain", "asset"], ant: ["drawback", "detriment", "loss", "disadvantage"] },
  "concept": { syn: ["idea", "notion", "theory", "principle"], ant: ["reality", "fact", "tangible"] },
  "consistent": { syn: ["steady", "uniform", "coherent", "constant"], ant: ["inconsistent", "erratic", "variable", "random"] },
  "context": { syn: ["framework", "background", "setting", "environment"], ant: ["isolation", "detachment", "void"] },
  "contract": { syn: ["agreement", "treaty", "pact", "shrink", "compress"], ant: ["expand", "breach", "enlarge", "cancel"] },
  "data": { syn: ["information", "facts", "figures", "statistics"], ant: ["conjecture", "guess", "rumor"] },
  "definition": { syn: ["meaning", "explanation", "description", "clarification"], ant: ["ambiguity", "vagueness", "confusion"] },
  "derive": { syn: ["obtain", "originate", "stem", "extract"], ant: ["lose", "surrender", "give up"] },
  "distribute": { syn: ["allocate", "disperse", "scatter", "deliver"], ant: ["collect", "gather", "amass", "withhold"] },
  "distribution": { syn: ["allocation", "circulation", "dispersion"], ant: ["collection", "gathering", "concentration"] },
  "economic": { syn: ["financial", "monetary", "commercial", "fiscal"], ant: ["noncommercial", "wasteful", "unprofitable"] },
  "environment": { syn: ["surroundings", "ecosystem", "setting", "habitat"], ant: ["isolation", "void", "vacuum"] },
  "estimate": { syn: ["approximate", "gauge", "calculate", "assess"], ant: ["prove", "measure exactly", "verify"] },
  "evidence": { syn: ["proof", "testimony", "facts", "confirmation"], ant: ["disproof", "refutation", "conjecture"] },
  "export": { syn: ["ship abroad", "sell out", "transport", "transmit"], ant: ["import", "bring in", "buy domestic"] },
  "import": { syn: ["bring in", "introduce", "buy abroad"], ant: ["export", "send out", "expel"] },
  "factor": { syn: ["element", "component", "ingredient", "influence"], ant: ["whole", "result", "outcome"] },
  "financial": { syn: ["fiscal", "monetary", "economic", "commercial"], ant: ["nonfinancial", "spiritual"] },
  "formula": { syn: ["recipe", "method", "procedure", "rule"], ant: ["chaos", "improvisation", "disorder"] },
  "function": { syn: ["purpose", "role", "operation", "work", "serve"], ant: ["malfunction", "idleness", "failure"] },
  "identify": { syn: ["recognize", "detect", "pinpoint", "name"], ant: ["mistake", "confuse", "overlook", "ignore"] },
  "income": { syn: ["earnings", "revenue", "salary", "profit"], ant: ["expense", "expenditure", "loss", "debt"] },
  "indicate": { syn: ["show", "signal", "point out", "reveal"], ant: ["conceal", "hide", "suppress", "mask"] },
  "individual": { syn: ["person", "distinct", "particular", "singular"], ant: ["collective", "group", "society", "mass"] },
  "interpret": { syn: ["explain", "translate", "clarify", "decode"], ant: ["misinterpret", "confuse", "misunderstand"] },
  "involve": { syn: ["include", "implicate", "engage", "entail"], ant: ["exclude", "omit", "disregard"] },
  "issue": { syn: ["matter", "problem", "topic", "publish", "release"], ant: ["solution", "resolution", "withhold"] },
  "labour": { syn: ["work", "toil", "effort", "workforce"], ant: ["rest", "leisure", "idleness", "play"] },
  "legal": { syn: ["lawful", "legitimate", "statutory", "permissible"], ant: ["illegal", "unlawful", "illicit", "criminal"] },
  "legislation": { syn: ["lawmaking", "statute", "act", "ordinance"], ant: ["lawlessness", "anarchy", "repeal"] },
  "major": { syn: ["chief", "primary", "vital", "dominant", "significant"], ant: ["minor", "secondary", "trivial", "insignificant"] },
  "method": { syn: ["system", "technique", "approach", "procedure"], ant: ["disorganization", "chaos", "randomness"] },
  "occur": { syn: ["happen", "take place", "arise", "transpire"], ant: ["cease", "stop", "prevent", "disappear"] },
  "period": { syn: ["era", "epoch", "interval", "duration", "age"], ant: ["moment", "instant", "timelessness"] },
  "policy": { syn: ["strategy", "guideline", "rule", "protocol"], ant: ["indecision", "lawlessness", "chaos"] },
  "principle": { syn: ["tenet", "doctrine", "standard", "rule"], ant: ["corruption", "immorality", "dishonesty"] },
  "procedure": { syn: ["process", "routine", "protocol", "operation"], ant: ["improvisation", "confusion", "disorder"] },
  "process": { syn: ["procedure", "course", "progression", "mechanism"], ant: ["halt", "inaction", "stagnation"] },
  "require": { syn: ["demand", "necessitate", "need", "stipulate"], ant: ["waive", "spare", "omit", "dispense with"] },
  "research": { syn: ["investigate", "study", "explore", "inquire"], ant: ["ignore", "overlook", "guess", "neglect"] },
  "respond": { syn: ["reply", "react", "answer", "retort"], ant: ["ignore", "overlook", "remain silent"] },
  "response": { syn: ["reply", "reaction", "answer", "counter"], ant: ["silence", "inaction", "question"] },
  "role": { syn: ["function", "part", "capacity", "position"], ant: ["nonentity", "absence", "disconnection"] },
  "section": { syn: ["part", "portion", "segment", "division"], ant: ["whole", "entirety", "totality"] },
  "sector": { syn: ["zone", "area", "quarter", "domain"], ant: ["whole", "totality", "center"] },
  "significant": { syn: ["important", "notable", "momentous", "meaningful"], ant: ["insignificant", "trivial", "minor", "meaningless"] },
  "similar": { syn: ["alike", "comparable", "akin", "corresponding"], ant: ["different", "dissimilar", "distinct", "opposite"] },
  "source": { syn: ["origin", "root", "foundation", "spring"], ant: ["destination", "end", "outcome", "result"] },
  "specific": { syn: ["particular", "precise", "definite", "exact"], ant: ["general", "vague", "broad", "generic"] },
  "structure": { syn: ["formation", "framework", "architecture", "organization"], ant: ["disorder", "chaos", "destruction"] },
  "theory": { syn: ["hypothesis", "concept", "philosophy", "doctrine"], ant: ["practice", "fact", "reality", "proof"] },
  "vary": { syn: ["differ", "fluctuate", "change", "alter"], ant: ["conform", "remain", "standardize", "stay"] },

  // School clubs, activities, subjects & daily life
  "science": { syn: ["knowledge", "physics", "system", "empiricism"], ant: ["superstition", "ignorance", "magic"] },
  "art": { syn: ["creativity", "craft", "expression", "design"], ant: ["clumsiness", "nature", "plainness"] },
  "music": { syn: ["melody", "harmony", "tune", "song"], ant: ["noise", "silence", "cacophony"] },
  "maths": { syn: ["arithmetic", "mathematics", "calculation", "figures"], ant: ["guesswork", "illiteracy"] },
  "drama": { syn: ["theater", "acting", "play", "performance"], ant: ["reality", "truth", "monotony"] },
  "debate": { syn: ["discussion", "argument", "dispute", "dialogue"], ant: ["agreement", "consensus", "harmony"] },
  "literature": { syn: ["writings", "classics", "poetry", "prose"], ant: ["illiteracy", "silence", "ignorance"] },
  "history": { syn: ["past", "chronicle", "heritage", "record"], ant: ["future", "oblivion", "fiction"] },
  "technology": { syn: ["machinery", "computing", "innovation", "engineering"], ant: ["primitiveness", "nature", "tradition"] },
  "club": { syn: ["society", "association", "circle", "guild", "group"], ant: ["individual", "isolation", "solitude"] },
  "chess": { syn: ["board game", "strategy game", "tactics"], ant: ["chance", "luck"] },
  "activity": { syn: ["action", "pursuit", "venture", "movement"], ant: ["inactivity", "idleness", "inertia", "rest"] },
  "extracurricular": { syn: ["after-school", "outside", "supplementary"], ant: ["curriculum", "compulsory", "core"] },
  "responsibility": { syn: ["duty", "obligation", "accountability", "charge"], ant: ["irresponsibility", "negligence", "carelessness"] },
  "responsibilities": { syn: ["duties", "obligations", "commitments", "tasks"], ant: ["freedoms", "privileges", "neglect"] },
  "respect": { syn: ["honor", "esteem", "admiration", "reverence"], ant: ["disrespect", "contempt", "scorn", "disdain"] },
  "punctual": { syn: ["prompt", "timely", "precise", "exact"], ant: ["late", "tardy", "delayed", "overdue"] },
  "permission": { syn: ["authorization", "consent", "approval", "license"], ant: ["prohibition", "refusal", "ban", "denial"] },
  "obligation": { syn: ["duty", "requirement", "mandate", "necessity"], ant: ["choice", "option", "liberty", "freedom"] },
  "law": { syn: ["statute", "rule", "regulation", "ordinance"], ant: ["anarchy", "chaos", "crime", "lawlessness"] },
  "shout": { syn: ["yell", "scream", "cry out", "bellow", "roar"], ant: ["whisper", "murmur", "mutter", "hush"] },
  "whisper": { syn: ["murmur", "mutter", "breathe", "rustle"], ant: ["shout", "yell", "scream", "roar"] },
  "rubbish": { syn: ["trash", "waste", "garbage", "litter", "debris"], ant: ["treasure", "valuables", "cleanliness"] },
  "bin": { syn: ["container", "receptacle", "can", "basket"], ant: ["spill", "heap", "litter"] },
  "noticeboard": { syn: ["bulletin board", "display board", "signboard"], ant: ["trash", "blank"] },
  "infirmary": { syn: ["clinic", "sick bay", "hospital", "dispensary"], ant: ["battlefield", "playground"] },
  "building": { syn: ["structure", "edifice", "premises", "complex"], ant: ["ruin", "demolition", "wilderness"] },
  "hall": { syn: ["auditorium", "chamber", "salon", "pavilion"], ant: ["closet", "exterior", "street"] },
  "department": { syn: ["division", "branch", "section", "agency"], ant: ["whole", "center", "amalgamation"] },
  "courtyard": { syn: ["schoolyard", "quadrangle", "plaza", "patio"], ant: ["interior", "corridor", "hall"] },
  "instruction": { syn: ["guidance", "direction", "order", "teaching"], ant: ["confusion", "disorder", "ignorance"] },
  "follow": { syn: ["obey", "pursue", "trail", "shadow", "comply"], ant: ["lead", "guide", "disobey", "precede"] },
  "raise": { syn: ["lift", "elevate", "boost", "hoist"], ant: ["lower", "drop", "sink", "demote"] },
  "throw": { syn: ["pitch", "hurl", "fling", "cast", "toss"], ant: ["catch", "receive", "hold", "keep"] },
  "catch": { syn: ["seize", "grab", "intercept", "trap"], ant: ["drop", "release", "miss", "throw"] },
  "chew": { syn: ["masticate", "bite", "crunch", "gnaw"], ant: ["swallow whole", "spit"] },
  "gum": { syn: ["chewing gum", "resin", "adhesive"], ant: ["dissolvent"] },
  "casual": { syn: ["informal", "relaxed", "everyday", "easygoing"], ant: ["formal", "official", "solemn", "strict"] },
  "clothes": { syn: ["garments", "apparel", "attire", "outfit"], ant: ["nudity", "bareness"] },
  "democracy": { syn: ["republic", "equality", "self-government", "liberty"], ant: ["tyranny", "dictatorship", "autocracy", "oppression"] },
  "sovereignty": { syn: ["supremacy", "independence", "dominion", "authority"], ant: ["subjugation", "dependence", "slavery", "colony"] },
  "children": { syn: ["kids", "youth", "juveniles", "offspring"], ant: ["adults", "elders", "parents", "grown-ups"] },
  "republic": { syn: ["democracy", "commonwealth", "constitutional state"], ant: ["monarchy", "empire", "kingdom"] },
  "victory": { syn: ["triumph", "conquest", "success", "win"], ant: ["defeat", "loss", "failure", "surrender"] },
  "choice": { syn: ["option", "selection", "alternative", "preference"], ant: ["compulsion", "coercion", "necessity"] },
  "circle": { syn: ["ring", "orbit", "sphere", "loop"], ant: ["line", "square", "tangent"] },
  "code": { syn: ["cipher", "program", "symbol", "syntax"], ant: ["plaintext", "nature"] },
  "congratulation": { syn: ["compliment", "felicitation", "praise", "greetings"], ant: ["criticism", "insult", "condemnation"] },
  "discussion": { syn: ["debate", "conversation", "dialogue", "discourse"], ant: ["silence", "monologue", "agreement"] },
  "drawing": { syn: ["sketch", "illustration", "diagram", "portrait"], ant: ["text", "writing", "photograph"] },
  "laptop": { syn: ["notebook", "portable computer", "device"], ant: ["desktop", "paper", "pen"] },
  "memory": { syn: ["recollection", "remembrance", "mind", "retention"], ant: ["forgetfulness", "amnesia", "oblivion"] },
  "printer": { syn: ["output device", "press", "publisher"], ant: ["scanner", "eraser"] },
  "screen": { syn: ["monitor", "display", "shield", "panel"], ant: ["window", "opening", "void"] },
  "speaker": { syn: ["lecturer", "orator", "sound device", "spokesman"], ant: ["listener", "audience", "silence"] },
  "tablet": { syn: ["pad", "touchscreen", "slab", "device"], ant: ["paper", "desktop"] },
  "tool": { syn: ["instrument", "implement", "utensil", "device"], ant: ["weapon", "hindrance", "obstacle"] },
  "virus": { syn: ["pathogen", "infection", "bug", "malware"], ant: ["cure", "vaccine", "antivirus", "health"] },
  "website": { syn: ["webpage", "portal", "site", "online address"], ant: ["offline", "book", "paper"] },
  "analytical": { syn: ["logical", "rational", "critical", "systematic"], ant: ["intuitive", "irrational", "emotional", "chaotic"] },
  "assertive": { syn: ["confident", "bold", "decisive", "firm"], ant: ["timid", "hesitant", "passive", "shy"] },
  "benevolence": { syn: ["kindness", "compassion", "goodwill", "generosity"], ant: ["cruelty", "malevolence", "hostility", "malice"] },
  "compassion": { syn: ["sympathy", "empathy", "mercy", "kindness"], ant: ["cruelty", "callousness", "indifference", "hatred"] },
  "competitive": { syn: ["ambitious", "combative", "aggressive", "driven"], ant: ["cooperative", "passive", "unambitious", "indifferent"] },
  "confusing": { syn: ["perplexing", "baffling", "bewildering", "unclear"], ant: ["clear", "lucid", "simple", "evident"] },
  "correctly": { syn: ["accurately", "properly", "rightly", "flawlessly"], ant: ["incorrectly", "wrongly", "erroneously", "faultily"] },
  "cheerfully": { syn: ["joyfully", "gladly", "happily", "brightly"], ant: ["sadly", "gloomily", "miserably", "sourly"] },
  "actually": { syn: ["really", "truly", "indeed", "in fact"], ant: ["falsely", "allegedly", "apparently"] },
  "aesthetics": { syn: ["beauty", "artistry", "taste", "elegance"], ant: ["ugliness", "hideousness", "crudeness"] },
  "audience": { syn: ["spectators", "listeners", "viewers", "crowd"], ant: ["performers", "actors", "speakers"] },
  "error": { syn: ["mistake", "fault", "slip", "blunder", "defect"], ant: ["correction", "accuracy", "truth", "perfection"] },
  "exhibition": { syn: ["display", "expo", "showcase", "presentation"], ant: ["concealment", "cover-up", "hiding"] },
  "organization": { syn: ["institution", "association", "structure", "company"], ant: ["disorganization", "chaos", "disorder"] },
  "carry": { syn: ["transport", "bear", "convey", "hold"], ant: ["drop", "release", "abandon", "leave"] },
  "choir": { syn: ["chorus", "singing group", "vocalists"], ant: ["soloist", "silence"] },
  "flag": { syn: ["banner", "standard", "emblem", "pennant"], ant: ["shroud", "blank"] },
  "classical": { syn: ["traditional", "timeless", "orthodox", "standard"], ant: ["modern", "experimental", "avant-garde", "novel"] }
};

// Read base thesaurus
const baseFile = 'src/components/games/OrbitLex/game/thesaurusData.js';
let baseContent = fs.readFileSync(baseFile, 'utf8');
const jsonMatch = baseContent.match(/export const THESAURUS = ([\s\S]*?);/);
let currentData = {};
if (jsonMatch) {
  currentData = JSON.parse(jsonMatch[1]);
}

// Merge enriched data
let addedCount = 0;
for (const [key, val] of Object.entries(ENRICHED)) {
  const cleanKey = key.toLowerCase().trim();
  if (!currentData[cleanKey]) {
    currentData[cleanKey] = val;
    addedCount++;
  } else {
    // Merge synonyms & antonyms uniquely
    for (const s of val.syn) {
      if (!currentData[cleanKey].syn.includes(s)) currentData[cleanKey].syn.push(s);
    }
    for (const a of val.ant) {
      if (!currentData[cleanKey].ant.includes(a)) currentData[cleanKey].ant.push(a);
    }
  }
}

const finalCode = `// Auto-generated comprehensive English Thesaurus for OrbitLex
// Covers Middle School (MEB 5-8), Primary School, High School, and Academic/Exam vocabulary.

export const THESAURUS = ${JSON.stringify(currentData, null, 2)};
`;

fs.writeFileSync(baseFile, finalCode, 'utf8');
console.log(`Successfully merged ${addedCount} new words. Total headwords in THESAURUS: ${Object.keys(currentData).length}`);
