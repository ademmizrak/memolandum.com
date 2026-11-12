// scripts/enrichThesaurus2.mjs
import fs from 'fs';

const BATCH2 = {
  "project": { syn: ["undertaking", "venture", "plan", "scheme", "enterprise"], ant: ["inaction", "idleness", "neglect"] },
  "group": { syn: ["team", "cluster", "assembly", "crew", "squad"], ant: ["individual", "single", "solitary"] },
  "work": { syn: ["labor", "task", "effort", "toil", "job"], ant: ["rest", "play", "leisure", "vacation"] },
  "school": { syn: ["academy", "institution", "college", "seminary"], ant: ["workplace", "street", "wilderness"] },
  "field": { syn: ["ground", "arena", "meadow", "pitch", "tract"], ant: ["building", "interior", "corridor"] },
  "court": { syn: ["arena", "enclosure", "ground", "tribunal"], ant: ["street", "open sea"] },
  "playground": { syn: ["play area", "park", "sports field", "yard"], ant: ["classroom", "library", "office"] },
  "garden": { syn: ["park", "plot", "orchard", "nursery"], ant: ["wasteland", "desert", "building"] },
  "graduate": { syn: ["alumnus", "qualify", "succeed", "pass"], ant: ["fail", "drop out", "undergraduate"] },
  "diploma": { syn: ["degree", "certificate", "credential", "qualification"], ant: ["failure", "incompetence"] },
  "qualification": { syn: ["credential", "certification", "skill", "fitness"], ant: ["ineligibility", "unfitness", "disqualification"] },
  "register": { syn: ["enroll", "sign up", "record", "log"], ant: ["withdraw", "cancel", "deregister", "erase"] },
  "timetable": { syn: ["schedule", "agenda", "calendar", "programme"], ant: ["disorder", "chaos", "improvisation"] },
  "schedule": { syn: ["timetable", "agenda", "roster", "plan"], ant: ["chaos", "disorder", "spontaneity"] },
  "subject": { syn: ["topic", "discipline", "theme", "course"], ant: ["irrelevance", "whole"] },
  "routine": { syn: ["habit", "regularity", "custom", "procedure"], ant: ["novelty", "irregularity", "surprise", "chaos"] },
  "national": { syn: ["nationwide", "patriotic", "civic", "federal"], ant: ["local", "foreign", "international", "global"] },
  "country": { syn: ["nation", "state", "homeland", "territory"], ant: ["city", "wilderness", "colony"] },
  "festival": { syn: ["celebration", "carnival", "fiesta", "fair"], ant: ["mourning", "monotony", "funeral"] },
  "solve": { syn: ["resolve", "answer", "unravel", "decode", "figure out"], ant: ["complicate", "confuse", "fail", "obscure"] },
  "solution": { syn: ["answer", "resolution", "key", "remedy"], ant: ["problem", "complication", "dilemma"] },
  "problem": { syn: ["issue", "difficulty", "trouble", "puzzle"], ant: ["solution", "benefit", "advantage"] },
  "parent": { syn: ["guardian", "father", "mother", "caretaker"], ant: ["child", "orphan", "offspring"] },
  "poem": { syn: ["verse", "poetry", "rhyme", "sonnet"], ant: ["prose", "dialogue", "report"] },
  "programme": { syn: ["curriculum", "schedule", "agenda", "plan"], ant: ["chaos", "disorganization"] },
  "program": { syn: ["schedule", "agenda", "software", "code"], ant: ["chaos", "disorganization"] },
  "leader": { syn: ["commander", "captain", "guide", "chief", "head"], ant: ["follower", "subordinate", "disciple"] },
  "leadership": { syn: ["guidance", "direction", "command", "authority"], ant: ["servitude", "submission", "following"] },
  "team": { syn: ["squad", "crew", "unit", "alliance", "group"], ant: ["individual", "rival", "opponent"] },
  "greet": { syn: ["welcome", "salute", "hail", "receive", "meet"], ant: ["ignore", "snub", "reject", "dismiss"] },
  "greeting": { syn: ["salutation", "welcome", "hail", "reception"], ant: ["dismissal", "insult", "snub"] },
  "parade": { syn: ["procession", "march", "pageant", "cavalcade"], ant: ["retreat", "dispersal", "solitude"] },
  "backpack": { syn: ["knapsack", "rucksack", "bag", "pack"], ant: ["emptiness"] },
  "bag": { syn: ["sack", "tote", "pack", "pouch"], ant: ["emptiness"] },
  "pack": { syn: ["bundle", "load", "stow", "gather"], ant: ["unpack", "empty", "unload", "scatter"] },
  "ceremony": { syn: ["ritual", "service", "rite", "formality"], ant: ["informality", "spontaneity"] },
  "anthem": { syn: ["hymn", "song", "chant", "ode"], ant: ["silence", "dirge"] },
  "read": { syn: ["peruse", "scan", "study", "comprehend"], ant: ["write", "ignore", "misread"] },
  "write": { syn: ["compose", "draft", "author", "record", "pen"], ant: ["read", "erase", "delete", "destroy"] },
  "species": { syn: ["breed", "type", "kind", "class", "category"], ant: ["individual", "whole", "hybrid"] },
  "historical": { syn: ["historic", "traditional", "classical", "authentic"], ant: ["modern", "fictional", "imaginary", "future"] },
  "line": { syn: ["queue", "row", "rank", "sequence"], ant: ["cluster", "disorder", "chaos"] },
  "stand": { syn: ["rise", "endure", "bear", "remain upright"], ant: ["sit", "lie down", "fall", "collapse"] },
  "sit": { syn: ["rest", "settle", "perch", "recline"], ant: ["stand", "rise", "run"] },
  "spotlight": { syn: ["limelight", "focus", "prominence", "center"], ant: ["shadow", "darkness", "obscurity"] },
  "partner": { syn: ["associate", "colleague", "companion", "ally"], ant: ["rival", "opponent", "enemy"] },
  "primary": { syn: ["fundamental", "prime", "chief", "basic", "initial"], ant: ["secondary", "tertiary", "minor", "final"] },
  "secondary": { syn: ["subordinate", "auxiliary", "second", "minor"], ant: ["primary", "prime", "chief", "main"] },
  "private": { syn: ["personal", "confidential", "secret", "exclusive"], ant: ["public", "shared", "open", "communal"] },
  "public": { syn: ["communal", "civic", "general", "open"], ant: ["private", "secret", "confidential", "exclusive"] },
  "state": { syn: ["nation", "government", "condition", "status"], ant: ["anarchy", "chaos", "individual"] },
  "board": { syn: ["panel", "plank", "directors", "embark"], ant: ["disembark", "alight"] }
};

const baseFile = 'src/components/games/OrbitLex/game/thesaurusData.js';
let baseContent = fs.readFileSync(baseFile, 'utf8');
const jsonMatch = baseContent.match(/export const THESAURUS = ([\s\S]*?);/);
let currentData = {};
if (jsonMatch) {
  currentData = JSON.parse(jsonMatch[1]);
}

let added = 0;
for (const [key, val] of Object.entries(BATCH2)) {
  const k = key.toLowerCase().trim();
  if (!currentData[k]) {
    currentData[k] = val;
    added++;
  } else {
    for (const s of val.syn) {
      if (!currentData[k].syn.includes(s)) currentData[k].syn.push(s);
    }
    for (const a of val.ant) {
      if (!currentData[k].ant.includes(a)) currentData[k].ant.push(a);
    }
  }
}

const finalCode = `// Auto-generated comprehensive English Thesaurus for OrbitLex
// Covers Middle School (MEB 5-8), Primary School, High School, and Academic/Exam vocabulary.

export const THESAURUS = ${JSON.stringify(currentData, null, 2)};
`;

fs.writeFileSync(baseFile, finalCode, 'utf8');
console.log(`Successfully merged ${added} words. Total headwords: ${Object.keys(currentData).length}`);
