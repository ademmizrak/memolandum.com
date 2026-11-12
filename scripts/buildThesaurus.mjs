// scripts/buildThesaurus.mjs
import fs from 'fs';
import path from 'path';

// Clean curated base database with 500+ headwords
const BASE = {
  // Education & School Life (Direct MEB Ortaokul & Ilkokul alignment)
  "headmaster": {
    syn: ["principal", "director", "headteacher", "administrator"],
    ant: ["student", "pupil", "subordinate", "assistant"]
  },
  "headmistress": {
    syn: ["principal", "director", "headteacher", "administrator"],
    ant: ["student", "pupil", "subordinate", "assistant"]
  },
  "teacher": {
    syn: ["educator", "instructor", "tutor", "mentor", "professor"],
    ant: ["student", "pupil", "learner", "apprentice"]
  },
  "student": {
    syn: ["pupil", "learner", "scholar", "disciple"],
    ant: ["teacher", "instructor", "educator", "master"]
  },
  "caretaker": {
    syn: ["custodian", "janitor", "guardian", "keeper"],
    ant: ["intruder", "destroyer", "trespasser"]
  },
  "cleaner": {
    syn: ["janitor", "custodian", "sweeper", "purifier"],
    ant: ["polluter", "defiler", "vandal"]
  },
  "librarian": {
    syn: ["curator", "archivist", "bibliographer", "keeper"],
    ant: ["destroyer", "illiterate", "vandal"]
  },
  "nurse": {
    syn: ["caregiver", "medic", "healer", "attendant"],
    ant: ["patient", "injurer", "harmful"]
  },
  "counsellor": {
    syn: ["advisor", "consultant", "mentor", "guide"],
    ant: ["misleader", "adversary", "critic"]
  },
  "secretary": {
    syn: ["clerk", "assistant", "administrator", "recorder"],
    ant: ["boss", "executive", "director"]
  },
  "coach": {
    syn: ["trainer", "instructor", "mentor", "director"],
    ant: ["player", "trainee", "novice"]
  },
  "classmate": {
    syn: ["peer", "schoolmate", "fellow", "colleague"],
    ant: ["stranger", "rival", "outsider", "enemy"]
  },
  "classroom": {
    syn: ["schoolroom", "study", "lecture hall", "auditorium"],
    ant: ["playground", "street", "wilderness"]
  },
  "library": {
    syn: ["archive", "bookroom", "repository", "athenaeum"],
    ant: ["dump", "wasteland", "void"]
  },
  "canteen": {
    syn: ["cafeteria", "refectory", "dining hall", "eatery"],
    ant: ["classroom", "library", "gym"]
  },
  "gym": {
    syn: ["gymnasium", "fitness center", "arena", "sports hall"],
    ant: ["classroom", "library", "office"]
  },
  "corridor": {
    syn: ["hallway", "passageway", "aisle", "gallery"],
    ant: ["room", "dead end", "exterior"]
  },
  "gate": {
    syn: ["barrier", "entrance", "portal", "doorway"],
    ant: ["wall", "blockade", "interior"]
  },
  "fountain": {
    syn: ["spring", "jet", "spout", "source"],
    ant: ["drain", "sink", "drought"]
  },
  "uniform": {
    syn: ["identical", "consistent", "standardized", "homogeneous"],
    ant: ["variable", "diverse", "heterogeneous", "irregular"]
  },
  "obey": {
    syn: ["comply", "follow", "conform", "submit", "respect"],
    ant: ["disobey", "rebel", "defy", "resist"]
  },
  "disobey": {
    syn: ["defy", "rebel", "resist", "violate", "infringe"],
    ant: ["obey", "comply", "submit", "conform"]
  },
  "rules": {
    syn: ["regulations", "laws", "guidelines", "principles"],
    ant: ["chaos", "disorder", "anarchy", "lawlessness"]
  },
  "rule": {
    syn: ["regulation", "law", "principle", "standard"],
    ant: ["exception", "chaos", "anarchy", "disorder"]
  },
  "bully": {
    syn: ["harasser", "oppressor", "intimidator", "tyrant"],
    ant: ["protector", "friend", "defender", "rescuer"]
  },
  "attendance": {
    syn: ["presence", "participation", "appearance"],
    ant: ["absence", "truancy", "nonattendance"]
  },
  "absence": {
    syn: ["truancy", "nonexistence", "lack", "deficiency"],
    ant: ["presence", "attendance", "appearance"]
  },
  "assembly": {
    syn: ["gathering", "meeting", "congregation", "rally"],
    ant: ["dispersal", "separation", "isolation"]
  },
  "celebrate": {
    syn: ["commemorate", "rejoice", "honor", "observe"],
    ant: ["mourn", "grieve", "lament", "ignore"]
  },
  "celebration": {
    syn: ["festival", "commemoration", "festivity", "gala"],
    ant: ["mourning", "lamentation", "funeral", "grief"]
  },
  "competition": {
    syn: ["contest", "tournament", "rivalry", "match"],
    ant: ["cooperation", "collaboration", "agreement"]
  },
  "cooperation": {
    syn: ["collaboration", "teamwork", "assistance", "alliance"],
    ant: ["conflict", "competition", "rivalry", "opposition"]
  },
  "decision": {
    syn: ["choice", "verdict", "determination", "resolution"],
    ant: ["indecision", "hesitation", "wavering", "doubt"]
  },
  "prize": {
    syn: ["award", "reward", "trophy", "medal", "honor"],
    ant: ["penalty", "punishment", "forfeit", "loss"]
  },
  "speech": {
    syn: ["address", "lecture", "oration", "talk"],
    ant: ["silence", "muteness", "listening"]
  },
  "winner": {
    syn: ["champion", "victor", "conqueror", "leader"],
    ant: ["loser", "defeated", "runner-up", "victim"]
  },
  "organize": {
    syn: ["arrange", "coordinate", "structure", "systematize"],
    ant: ["disorganize", "confuse", "scatter", "disorder"]
  },
  "arrange": {
    syn: ["organize", "order", "classify", "set up"],
    ant: ["disarrange", "disorganize", "scatter", "jumble"]
  },
  "announce": {
    syn: ["declare", "proclaim", "broadcast", "publish"],
    ant: ["conceal", "suppress", "withhold", "hide"]
  },
  "ancient": {
    syn: ["antique", "historic", "primordial", "archaic"],
    ant: ["modern", "contemporary", "recent", "new"]
  },
  "modern": {
    syn: ["contemporary", "current", "fresh", "novel"],
    ant: ["ancient", "archaic", "obsolete", "old"]
  },
  "careful": {
    syn: ["cautious", "attentive", "mindful", "vigilant"],
    ant: ["careless", "reckless", "negligent", "rash"]
  },
  "carefully": {
    syn: ["cautiously", "attentively", "mindfully", "prudently"],
    ant: ["carelessly", "recklessly", "hastily", "rashly"]
  },
  "careless": {
    syn: ["reckless", "negligent", "inattentive", "hasty"],
    ant: ["careful", "cautious", "meticulous", "attentive"]
  },
  "collect": {
    syn: ["gather", "accumulate", "amass", "assemble"],
    ant: ["scatter", "disperse", "distribute", "waste"]
  },
  "continue": {
    syn: ["persist", "proceed", "resume", "maintain"],
    ant: ["discontinue", "stop", "halt", "cease"]
  },
  "ability": {
    syn: ["capability", "capacity", "talent", "skill", "aptitude"],
    ant: ["inability", "incapacity", "weakness", "limitation"]
  },
  "able": {
    syn: ["capable", "competent", "skilled", "proficient"],
    ant: ["unable", "incapable", "incompetent", "weak"]
  },
  "accept": {
    syn: ["receive", "admit", "embrace", "acknowledge"],
    ant: ["refuse", "reject", "decline", "deny"]
  },
  "accurate": {
    syn: ["precise", "exact", "correct", "truthful", "flawless"],
    ant: ["inaccurate", "wrong", "erroneous", "faulty"]
  },
  "achieve": {
    syn: ["accomplish", "attain", "realize", "fulfill"],
    ant: ["fail", "lose", "abandon", "forfeit"]
  },
  "active": {
    syn: ["energetic", "dynamic", "lively", "vigorous"],
    ant: ["passive", "idle", "lazy", "inactive"]
  },
  "admit": {
    syn: ["confess", "concede", "acknowledge", "grant"],
    ant: ["deny", "refute", "reject", "disavow"]
  },
  "advantage": {
    syn: ["benefit", "profit", "gain", "asset", "plus"],
    ant: ["disadvantage", "drawback", "handicap", "loss"]
  },
  "afraid": {
    syn: ["scared", "fearful", "frightened", "terrified"],
    ant: ["brave", "courageous", "bold", "fearless"]
  },
  "agree": {
    syn: ["consent", "concur", "harmonize", "assent"],
    ant: ["disagree", "differ", "object", "dispute"]
  },
  "allow": {
    syn: ["permit", "authorize", "grant", "sanction"],
    ant: ["forbid", "prohibit", "ban", "disallow"]
  },
  "always": {
    syn: ["constantly", "continually", "forever", "perpetually"],
    ant: ["never", "rarely", "seldom", "infrequently"]
  },
  "amazing": {
    syn: ["astonishing", "incredible", "astounding", "wonderful"],
    ant: ["ordinary", "common", "boring", "mundane"]
  },
  "angry": {
    syn: ["furious", "enraged", "irritated", "wrathful"],
    ant: ["calm", "peaceful", "placid", "serene"]
  },
  "answer": {
    syn: ["reply", "respond", "counter", "react"],
    ant: ["question", "ask", "inquire", "doubt"]
  },
  "appear": {
    syn: ["emerge", "surface", "materialize", "arrive"],
    ant: ["disappear", "vanish", "fade", "depart"]
  },
  "arrive": {
    syn: ["reach", "attain", "land", "appear"],
    ant: ["depart", "leave", "vacate", "exit"]
  },
  "ask": {
    syn: ["inquire", "question", "interrogate", "request"],
    ant: ["answer", "reply", "respond", "retort"]
  },
  "attack": {
    syn: ["assault", "strike", "charge", "invade"],
    ant: ["defend", "protect", "shield", "resist"]
  },
  "attractive": {
    syn: ["alluring", "appealing", "captivating", "pretty"],
    ant: ["unattractive", "ugly", "repulsive", "hideous"]
  },
  "awful": {
    syn: ["terrible", "dreadful", "horrible", "atrocious"],
    ant: ["wonderful", "excellent", "superb", "delightful"]
  },
  "bad": {
    syn: ["wicked", "evil", "poor", "inferior", "nasty"],
    ant: ["good", "excellent", "fine", "superb"]
  },
  "beautiful": {
    syn: ["gorgeous", "lovely", "attractive", "handsome"],
    ant: ["ugly", "hideous", "unsightly", "plain"]
  },
  "begin": {
    syn: ["start", "commence", "initiate", "launch"],
    ant: ["finish", "end", "conclude", "terminate"]
  },
  "believe": {
    syn: ["trust", "credit", "accept", "rely on"],
    ant: ["doubt", "distrust", "disbelieve", "suspect"]
  },
  "benefit": {
    syn: ["advantage", "gain", "profit", "merit"],
    ant: ["detriment", "disadvantage", "harm", "loss"]
  },
  "beneficial": {
    syn: ["advantageous", "helpful", "favourable", "constructive"],
    ant: ["harmful", "detrimental", "damaging", "adverse"]
  },
  "big": {
    syn: ["large", "huge", "enormous", "gigantic", "massive"],
    ant: ["small", "tiny", "little", "minute"]
  },
  "bitter": {
    syn: ["sour", "sharp", "acrid", "tart"],
    ant: ["sweet", "sugary", "delicious", "pleasant"]
  },
  "brave": {
    syn: ["courageous", "bold", "fearless", "valiant"],
    ant: ["cowardly", "timid", "fearful", "scared"]
  },
  "bright": {
    syn: ["brilliant", "shining", "radiant", "luminous"],
    ant: ["dark", "dim", "dull", "gloomy"]
  },
  "build": {
    syn: ["construct", "erect", "assemble", "create"],
    ant: ["demolish", "destroy", "ruin", "dismantle"]
  },
  "busy": {
    syn: ["active", "engaged", "occupied", "hectic"],
    ant: ["idle", "free", "vacant", "unoccupied"]
  },
  "calm": {
    syn: ["peaceful", "serene", "tranquil", "quiet"],
    ant: ["stormy", "agitated", "nervous", "chaotic"]
  },
  "cheap": {
    syn: ["inexpensive", "affordable", "low-cost", "budget"],
    ant: ["expensive", "costly", "pricey", "luxurious"]
  },
  "clean": {
    syn: ["spotless", "pure", "sanitary", "tidy"],
    ant: ["dirty", "filthy", "polluted", "soiled"]
  },
  "clear": {
    syn: ["transparent", "lucid", "evident", "plain"],
    ant: ["cloudy", "vague", "obscure", "murky"]
  },
  "clever": {
    syn: ["smart", "intelligent", "witty", "sharp"],
    ant: ["foolish", "stupid", "dull", "silly"]
  },
  "cold": {
    syn: ["chilly", "freezing", "frigid", "icy"],
    ant: ["hot", "warm", "boiling", "scorching"]
  },
  "comfort": {
    syn: ["ease", "relief", "consolation", "luxury"],
    ant: ["discomfort", "pain", "distress", "agony"]
  },
  "common": {
    syn: ["usual", "frequent", "familiar", "widespread"],
    ant: ["rare", "uncommon", "unusual", "scarce"]
  },
  "complete": {
    syn: ["finish", "conclude", "entire", "thorough"],
    ant: ["incomplete", "partial", "unfinished", "fractional"]
  },
  "complex": {
    syn: ["complicated", "intricate", "elaborate", "involved"],
    ant: ["simple", "plain", "straightforward", "easy"]
  },
  "connect": {
    syn: ["join", "link", "unite", "attach", "bind"],
    ant: ["disconnect", "separate", "detach", "divide"]
  },
  "correct": {
    syn: ["accurate", "right", "proper", "precise"],
    ant: ["incorrect", "wrong", "false", "erroneous"]
  },
  "courage": {
    syn: ["bravery", "valor", "boldness", "fortitude"],
    ant: ["cowardice", "timidity", "fear", "weakness"]
  },
  "create": {
    syn: ["produce", "invent", "generate", "originate"],
    ant: ["destroy", "annihilate", "ruin", "demolish"]
  },
  "cruel": {
    syn: ["brutal", "harsh", "ruthless", "merciless"],
    ant: ["kind", "gentle", "merciful", "humane"]
  },
  "cry": {
    syn: ["weep", "sob", "wail", "mourn"],
    ant: ["laugh", "smile", "rejoice", "cheer"]
  },
  "damage": {
    syn: ["harm", "ruin", "impair", "injure", "spoil"],
    ant: ["repair", "mend", "restore", "heal"]
  },
  "danger": {
    syn: ["peril", "hazard", "risk", "threat"],
    ant: ["safety", "security", "protection", "sanctuary"]
  },
  "dangerous": {
    syn: ["hazardous", "perilous", "risky", "unsafe"],
    ant: ["safe", "secure", "harmless", "protected"]
  },
  "dark": {
    syn: ["dim", "gloomy", "shadowy", "murky", "obscure"],
    ant: ["bright", "light", "radiant", "luminous"]
  },
  "dead": {
    syn: ["lifeless", "deceased", "extinct", "inert"],
    ant: ["alive", "living", "animate", "active"]
  },
  "deep": {
    syn: ["profound", "bottomless", "intense", "heavy"],
    ant: ["shallow", "superficial", "flat", "surface"]
  },
  "defeat": {
    syn: ["beat", "conquer", "overcome", "surpass"],
    ant: ["victory", "triumph", "win", "succeed"]
  },
  "defend": {
    syn: ["protect", "guard", "shield", "secure"],
    ant: ["attack", "assault", "strike", "harm"]
  },
  "delicious": {
    syn: ["tasty", "flavourful", "yummy", "delectable"],
    ant: ["disgusting", "tasteless", "repulsive", "unpalatable"]
  },
  "destroy": {
    syn: ["demolish", "ruin", "wreck", "annihilate"],
    ant: ["build", "construct", "create", "restore"]
  },
  "develop": {
    syn: ["grow", "evolve", "expand", "advance", "mature"],
    ant: ["deteriorate", "decline", "decay", "regress"]
  },
  "development": {
    syn: ["growth", "progress", "advancement", "evolution"],
    ant: ["decline", "deterioration", "regression", "decay"]
  },
  "difficult": {
    syn: ["hard", "tough", "arduous", "challenging"],
    ant: ["easy", "simple", "effortless", "smooth"]
  },
  "dirty": {
    syn: ["filthy", "soiled", "polluted", "messy"],
    ant: ["clean", "pure", "spotless", "tidy"]
  },
  "discover": {
    syn: ["find", "uncover", "detect", "reveal"],
    ant: ["hide", "conceal", "overlook", "lose"]
  },
  "doubt": {
    syn: ["uncertainty", "hesitation", "suspicion", "mistrust"],
    ant: ["certainty", "trust", "confidence", "faith"]
  },
  "dry": {
    syn: ["arid", "dehydrated", "parched", "withered"],
    ant: ["wet", "moist", "damp", "soaked"]
  },
  "early": {
    syn: ["prompt", "premature", "punctual", "advance"],
    ant: ["late", "tardy", "delayed", "overdue"]
  },
  "easy": {
    syn: ["simple", "effortless", "uncomplicated", "facile"],
    ant: ["difficult", "hard", "tough", "demanding"]
  },
  "empty": {
    syn: ["vacant", "blank", "void", "bare", "hollow"],
    ant: ["full", "packed", "crowded", "occupied"]
  },
  "enemy": {
    syn: ["foe", "rival", "opponent", "adversary"],
    ant: ["friend", "ally", "companion", "partner"]
  },
  "enjoy": {
    syn: ["relish", "appreciate", "savor", "delight in"],
    ant: ["dislike", "hate", "detest", "abhor"]
  },
  "enormous": {
    syn: ["gigantic", "huge", "massive", "colossal", "vast"],
    ant: ["tiny", "minute", "small", "little"]
  },
  "enter": {
    syn: ["access", "penetrate", "step into", "arrive"],
    ant: ["exit", "leave", "depart", "vacate"]
  },
  "equal": {
    syn: ["identical", "equivalent", "uniform", "even"],
    ant: ["unequal", "different", "disparate", "irregular"]
  },
  "essential": {
    syn: ["vital", "crucial", "fundamental", "indispensable"],
    ant: ["optional", "unnecessary", "trivial", "secondary"]
  },
  "exact": {
    syn: ["precise", "accurate", "correct", "definite"],
    ant: ["approximate", "inexact", "vague", "rough"]
  },
  "examine": {
    syn: ["inspect", "scrutinize", "investigate", "analyse"],
    ant: ["ignore", "overlook", "neglect", "skim"]
  },
  "exceed": {
    syn: ["surpass", "outdo", "transcend", "excel"],
    ant: ["fall behind", "lag", "fail", "lose"]
  },
  "exhibit": {
    syn: ["display", "show", "showcase", "demonstrate"],
    ant: ["hide", "conceal", "mask", "suppress"]
  },
  "expensive": {
    syn: ["costly", "pricey", "dear", "luxurious"],
    ant: ["cheap", "inexpensive", "affordable", "reasonable"]
  },
  "experience": {
    syn: ["knowledge", "expertise", "practice", "familiarity"],
    ant: ["inexperience", "ignorance", "naivety", "unfamiliarity"]
  },
  "explain": {
    syn: ["clarify", "describe", "interpret", "elucidate"],
    ant: ["confuse", "obscure", "muddle", "complicate"]
  },
  "fail": {
    syn: ["flop", "collapse", "miss", "founder"],
    ant: ["succeed", "pass", "triumph", "achieve"]
  },
  "fair": {
    syn: ["just", "equitable", "impartial", "honest"],
    ant: ["unfair", "biased", "partial", "crooked"]
  },
  "famous": {
    syn: ["renowned", "celebrated", "noted", "eminent"],
    ant: ["unknown", "obscure", "nameless", "anonymous"]
  },
  "fast": {
    syn: ["quick", "rapid", "swift", "speedy", "brisk"],
    ant: ["slow", "sluggish", "gradual", "leisurely"]
  },
  "fat": {
    syn: ["plump", "stout", "chubby", "corpulent"],
    ant: ["thin", "slim", "slender", "skinny"]
  },
  "fight": {
    syn: ["battle", "combat", "clash", "struggle"],
    ant: ["peace", "surrender", "truce", "harmony"]
  },
  "find": {
    syn: ["discover", "locate", "detect", "unearth"],
    ant: ["lose", "misplace", "miss", "drop"]
  },
  "finish": {
    syn: ["complete", "conclude", "end", "terminate"],
    ant: ["start", "begin", "commence", "initiate"]
  },
  "firm": {
    syn: ["solid", "sturdy", "unyielding", "resolute"],
    ant: ["weak", "soft", "fragile", "pliant"]
  },
  "fit": {
    syn: ["healthy", "capable", "suitable", "sound"],
    ant: ["unfit", "unhealthy", "ineligible", "weak"]
  },
  "fix": {
    syn: ["repair", "mend", "restore", "settle"],
    ant: ["break", "damage", "ruin", "spoil"]
  },
  "foolish": {
    syn: ["silly", "stupid", "unwise", "absurd"],
    ant: ["wise", "sensible", "clever", "prudent"]
  },
  "forbid": {
    syn: ["prohibit", "ban", "disallow", "veto"],
    ant: ["allow", "permit", "authorize", "grant"]
  },
  "forget": {
    syn: ["omit", "neglect", "disregard", "drop"],
    ant: ["remember", "recall", "recollect", "memorize"]
  },
  "forgive": {
    syn: ["pardon", "excuse", "absolve", "condone"],
    ant: ["punish", "blame", "condemn", "resent"]
  },
  "free": {
    syn: ["liberated", "independent", "unbound", "open"],
    ant: ["bound", "captive", "restricted", "enslaved"]
  },
  "freeze": {
    syn: ["chill", "solidify", "glaciate", "halt"],
    ant: ["melt", "thaw", "boil", "liquefy"]
  },
  "frequent": {
    syn: ["repeated", "regular", "constant", "common"],
    ant: ["infrequent", "rare", "occasional", "scarce"]
  },
  "fresh": {
    syn: ["new", "crisp", "novel", "recent", "pure"],
    ant: ["stale", "rotten", "old", "withered"]
  },
  "friend": {
    syn: ["companion", "ally", "pal", "partner", "buddy"],
    ant: ["enemy", "foe", "rival", "opponent"]
  },
  "friendly": {
    syn: ["warm", "amiable", "cordial", "sociable"],
    ant: ["hostile", "unfriendly", "cold", "aloof"]
  },
  "funny": {
    syn: ["humorous", "comical", "amusing", "witty"],
    ant: ["serious", "grave", "solemn", "boring"]
  },
  "gain": {
    syn: ["acquire", "obtain", "earn", "profit"],
    ant: ["lose", "forfeit", "waste", "surrender"]
  },
  "gather": {
    syn: ["collect", "assemble", "accumulate", "amass"],
    ant: ["scatter", "disperse", "distribute", "shed"]
  },
  "generous": {
    syn: ["charitable", "giving", "bountiful", "munificent"],
    ant: ["stingy", "selfish", "miserly", "greedy"]
  },
  "gentle": {
    syn: ["tender", "mild", "soft", "calm", "peaceful"],
    ant: ["rough", "harsh", "violent", "brutal"]
  },
  "genuine": {
    syn: ["authentic", "real", "actual", "truthful"],
    ant: ["fake", "false", "artificial", "counterfeit"]
  },
  "give": {
    syn: ["donate", "provide", "grant", "bestow", "supply"],
    ant: ["take", "receive", "withhold", "keep"]
  },
  "glad": {
    syn: ["happy", "pleased", "cheerful", "delighted"],
    ant: ["sad", "sorrowful", "unhappy", "depressed"]
  },
  "gloomy": {
    syn: ["dark", "dim", "dismal", "bleak", "melancholy"],
    ant: ["cheerful", "bright", "sunny", "joyful"]
  },
  "good": {
    syn: ["fine", "superior", "excellent", "virtuous", "sound"],
    ant: ["bad", "evil", "wicked", "poor", "inferior"]
  },
  "great": {
    syn: ["grand", "magnificent", "immense", "illustrious"],
    ant: ["insignificant", "minor", "small", "trivial"]
  },
  "grow": {
    syn: ["expand", "increase", "develop", "flourish", "thrive"],
    ant: ["shrink", "diminish", "contract", "decay"]
  },
  "guilty": {
    syn: ["culpable", "blameworthy", "responsible", "sinful"],
    ant: ["innocent", "blameless", "pure", "faultless"]
  },
  "happy": {
    syn: ["joyful", "cheerful", "delighted", "content", "glad"],
    ant: ["sad", "unhappy", "miserable", "sorrowful", "depressed"]
  },
  "hard": {
    syn: ["solid", "firm", "tough", "difficult", "arduous"],
    ant: ["soft", "easy", "simple", "yielding", "flexible"]
  },
  "harm": {
    syn: ["injury", "damage", "detriment", "hurt"],
    ant: ["benefit", "help", "aid", "healing"]
  },
  "harmful": {
    syn: ["detrimental", "damaging", "destructive", "injurious"],
    ant: ["harmless", "beneficial", "safe", "wholesome"]
  },
  "harsh": {
    syn: ["severe", "rough", "stern", "cruel", "austere"],
    ant: ["gentle", "mild", "soft", "lenient"]
  },
  "hate": {
    syn: ["detest", "loathe", "abhor", "despise"],
    ant: ["love", "adore", "cherish", "admire"]
  },
  "healthy": {
    syn: ["sound", "fit", "robust", "wholesome", "vigorous"],
    ant: ["sick", "ill", "unhealthy", "frail", "diseased"]
  },
  "heavy": {
    syn: ["weighty", "hefty", "dense", "burdensome"],
    ant: ["light", "weightless", "airy", "slender"]
  },
  "help": {
    syn: ["assist", "aid", "support", "serve", "relieve"],
    ant: ["hinder", "obstruct", "impede", "resist"]
  },
  "hide": {
    syn: ["conceal", "cover", "mask", "disguise"],
    ant: ["reveal", "expose", "show", "display"]
  },
  "high": {
    syn: ["tall", "elevated", "towering", "lofty"],
    ant: ["low", "short", "deep", "depressed"]
  },
  "honest": {
    syn: ["truthful", "sincere", "frank", "candid", "upright"],
    ant: ["dishonest", "deceitful", "corrupt", "false"]
  },
  "hope": {
    syn: ["aspiration", "optimism", "desire", "faith"],
    ant: ["despair", "hopelessness", "pessimism", "gloom"]
  },
  "hostile": {
    syn: ["antagonistic", "aggressive", "unfriendly", "belligerent"],
    ant: ["friendly", "amicable", "warm", "peaceful"]
  },
  "hot": {
    syn: ["boiling", "scorching", "warm", "torrid", "scalding"],
    ant: ["cold", "freezing", "chilly", "frigid", "cool"]
  },
  "huge": {
    syn: ["enormous", "gigantic", "massive", "vast", "colossal"],
    ant: ["tiny", "miniature", "small", "minute", "slight"]
  },
  "humble": {
    syn: ["modest", "unpretentious", "meek", "submissive"],
    ant: ["proud", "arrogant", "boastful", "haughty"]
  },
  "hungry": {
    syn: ["famished", "starving", "ravenous", "greedy"],
    ant: ["full", "satiated", "satisfied", "gorged"]
  },
  "hurt": {
    syn: ["injure", "wound", "damage", "ache", "pain"],
    ant: ["heal", "cure", "comfort", "remedy"]
  },
  "ignore": {
    syn: ["disregard", "overlook", "neglect", "snub"],
    ant: ["notice", "heed", "acknowledge", "regard"]
  },
  "important": {
    syn: ["significant", "crucial", "vital", "momentous"],
    ant: ["trivial", "unimportant", "insignificant", "minor"]
  },
  "impossible": {
    syn: ["unachievable", "hopeless", "unattainable", "absurd"],
    ant: ["possible", "feasible", "viable", "achievable"]
  },
  "improve": {
    syn: ["enhance", "upgrade", "refine", "better", "boost"],
    ant: ["worsen", "deteriorate", "damage", "impair"]
  },
  "include": {
    syn: ["incorporate", "contain", "encompass", "involve"],
    ant: ["exclude", "omit", "eliminate", "reject"]
  },
  "increase": {
    syn: ["expand", "amplify", "boost", "elevate", "multiply"],
    ant: ["decrease", "diminish", "reduce", "lessen"]
  },
  "innocent": {
    syn: ["blameless", "pure", "guiltless", "faultless"],
    ant: ["guilty", "culpable", "corrupt", "sinful"]
  },
  "intelligent": {
    syn: ["smart", "clever", "bright", "brilliant", "sharp"],
    ant: ["stupid", "foolish", "ignorant", "dull"]
  },
  "interesting": {
    syn: ["engaging", "fascinating", "captivating", "intriguing"],
    ant: ["boring", "dull", "tedious", "monotonous"]
  },
  "join": {
    syn: ["unite", "connect", "combine", "link", "attach"],
    ant: ["separate", "divide", "detach", "disconnect"]
  },
  "keep": {
    syn: ["retain", "preserve", "maintain", "hold"],
    ant: ["discard", "lose", "relinquish", "give away"]
  },
  "kind": {
    syn: ["benevolent", "caring", "gentle", "sympathetic"],
    ant: ["cruel", "harsh", "mean", "unkind", "ruthless"]
  },
  "know": {
    syn: ["understand", "comprehend", "perceive", "grasp"],
    ant: ["ignore", "misunderstand", "doubt", "forget"]
  },
  "large": {
    syn: ["big", "vast", "broad", "immense", "grand"],
    ant: ["small", "tiny", "little", "compact"]
  },
  "late": {
    syn: ["tardy", "delayed", "overdue", "slow"],
    ant: ["early", "prompt", "punctual", "premature"]
  },
  "laugh": {
    syn: ["chuckle", "giggle", "snicker", "grin"],
    ant: ["cry", "weep", "mourn", "sob"]
  },
  "lazy": {
    syn: ["idle", "slothful", "inactive", "sluggish"],
    ant: ["diligent", "industrious", "active", "hardworking"]
  },
  "lead": {
    syn: ["guide", "direct", "conduct", "usher"],
    ant: ["follow", "trail", "obey", "yield"]
  },
  "learn": {
    syn: ["master", "acquire", "absorb", "grasp"],
    ant: ["forget", "neglect", "ignore", "unlearn"]
  },
  "leave": {
    syn: ["depart", "vacate", "exit", "abandon"],
    ant: ["arrive", "enter", "stay", "remain"]
  },
  "light": {
    syn: ["bright", "luminous", "pale", "weightless"],
    ant: ["dark", "heavy", "gloomy", "dim"]
  },
  "live": {
    syn: ["reside", "dwell", "survive", "exist"],
    ant: ["die", "perish", "expire", "decease"]
  },
  "long": {
    syn: ["lengthy", "extensive", "elongated", "prolonged"],
    ant: ["short", "brief", "curt", "concise"]
  },
  "lose": {
    syn: ["misplace", "forfeit", "drop", "waste"],
    ant: ["find", "win", "gain", "acquire", "retrieve"]
  },
  "loud": {
    syn: ["noisy", "clamorous", "deafening", "boisterous"],
    ant: ["quiet", "silent", "soft", "hushed", "calm"]
  },
  "love": {
    syn: ["adore", "cherish", "treasure", "admire"],
    ant: ["hate", "loathe", "detest", "despise"]
  },
  "lucky": {
    syn: ["fortunate", "blessed", "charmed", "favored"],
    ant: ["unlucky", "unfortunate", "cursed", "doomed"]
  },
  "major": {
    syn: ["significant", "primary", "vital", "dominant"],
    ant: ["minor", "trivial", "secondary", "slight"]
  },
  "make": {
    syn: ["create", "construct", "produce", "fashion"],
    ant: ["destroy", "demolish", "ruin", "undo"]
  },
  "many": {
    syn: ["numerous", "abundant", "copious", "plentiful"],
    ant: ["few", "scarce", "sparse", "rare"]
  },
  "modern": {
    syn: ["contemporary", "current", "fresh", "novel"],
    ant: ["ancient", "archaic", "old", "antiquated"]
  },
  "near": {
    syn: ["close", "adjacent", "neighboring", "approaching"],
    ant: ["distant", "far", "remote", "detached"]
  },
  "necessary": {
    syn: ["essential", "required", "mandatory", "compulsory"],
    ant: ["unnecessary", "optional", "dispensable", "useless"]
  },
  "never": {
    syn: ["at no time", "ne'er", "not ever"],
    ant: ["always", "ever", "constantly", "forever"]
  },
  "new": {
    syn: ["novel", "modern", "recent", "fresh", "original"],
    ant: ["old", "antique", "ancient", "stale", "worn"]
  },
  "nice": {
    syn: ["pleasant", "lovely", "agreeable", "kind", "charming"],
    ant: ["nasty", "horrible", "unpleasant", "disagreeable"]
  },
  "noisy": {
    syn: ["loud", "boisterous", "clamorous", "rowdy"],
    ant: ["quiet", "peaceful", "silent", "tranquil"]
  },
  "normal": {
    syn: ["typical", "regular", "standard", "ordinary"],
    ant: ["abnormal", "unusual", "strange", "bizarre"]
  },
  "old": {
    syn: ["aged", "ancient", "antique", "elderly", "veteran"],
    ant: ["young", "new", "fresh", "modern", "youthful"]
  },
  "open": {
    syn: ["unlocked", "accessible", "candid", "frank"],
    ant: ["closed", "shut", "locked", "secret"]
  },
  "opportunity": {
    syn: ["chance", "occasion", "opening", "possibility"],
    ant: ["obstacle", "barrier", "misfortune", "disadvantage"]
  },
  "patient": {
    syn: ["tolerant", "enduring", "calm", "forbearing"],
    ant: ["impatient", "restless", "agitated", "eager"]
  },
  "peace": {
    syn: ["harmony", "tranquility", "serenity", "truce"],
    ant: ["war", "conflict", "turmoil", "strife", "battle"]
  },
  "perfect": {
    syn: ["flawless", "faultless", "immaculate", "ideal"],
    ant: ["imperfect", "flawed", "faulty", "defective"]
  },
  "polite": {
    syn: ["courteous", "civil", "respectful", "gracious"],
    ant: ["rude", "impolite", "vulgar", "discourteous"]
  },
  "poor": {
    syn: ["needy", "destitute", "penniless", "inferior"],
    ant: ["rich", "wealthy", "affluent", "superior"]
  },
  "powerful": {
    syn: ["mighty", "potent", "strong", "influential"],
    ant: ["weak", "feeble", "powerless", "fragile"]
  },
  "praise": {
    syn: ["compliment", "applaud", "commend", "honor"],
    ant: ["criticize", "condemn", "blame", "insult"]
  },
  "protect": {
    syn: ["guard", "shield", "defend", "preserve"],
    ant: ["attack", "harm", "expose", "abandon"]
  },
  "proud": {
    syn: ["dignified", "honored", "gratified", "noble"],
    ant: ["humble", "ashamed", "modest", "meek"]
  },
  "pure": {
    syn: ["clean", "untainted", "flawless", "spotless"],
    ant: ["polluted", "contaminated", "impure", "dirty"]
  },
  "quick": {
    syn: ["fast", "rapid", "swift", "speedy", "prompt"],
    ant: ["slow", "sluggish", "delayed", "leisurely"]
  },
  "quiet": {
    syn: ["silent", "calm", "peaceful", "tranquil", "hushed"],
    ant: ["loud", "noisy", "rowdy", "boisterous"]
  },
  "rare": {
    syn: ["scarce", "uncommon", "unusual", "precious"],
    ant: ["common", "frequent", "abundant", "usual"]
  },
  "real": {
    syn: ["genuine", "authentic", "actual", "true"],
    ant: ["fake", "false", "fictional", "imaginary"]
  },
  "refuse": {
    syn: ["reject", "decline", "withhold", "deny"],
    ant: ["accept", "agree", "admit", "consent"]
  },
  "remember": {
    syn: ["recall", "recollect", "memorize", "retain"],
    ant: ["forget", "neglect", "ignore", "overlook"]
  },
  "rich": {
    syn: ["wealthy", "affluent", "opulent", "abundant"],
    ant: ["poor", "destitute", "penniless", "needy"]
  },
  "right": {
    syn: ["correct", "proper", "true", "accurate", "just"],
    ant: ["wrong", "incorrect", "false", "unjust"]
  },
  "rise": {
    syn: ["ascend", "climb", "soar", "elevate"],
    ant: ["fall", "sink", "descend", "drop"]
  },
  "rough": {
    syn: ["uneven", "coarse", "bumpy", "rugged"],
    ant: ["smooth", "flat", "sleek", "polished"]
  },
  "rude": {
    syn: ["impolite", "ill-mannered", "insolent", "curt"],
    ant: ["polite", "courteous", "respectful", "civil"]
  },
  "safe": {
    syn: ["secure", "protected", "harmless", "sheltered"],
    ant: ["dangerous", "hazardous", "unsafe", "perilous"]
  },
  "save": {
    syn: ["rescue", "preserve", "conserve", "protect"],
    ant: ["waste", "spend", "abandon", "destroy"]
  },
  "short": {
    syn: ["brief", "concise", "curt", "little"],
    ant: ["long", "lengthy", "tall", "extended"]
  },
  "sick": {
    syn: ["ill", "unwell", "ailing", "diseased"],
    ant: ["healthy", "well", "fit", "sound"]
  },
  "silent": {
    syn: ["quiet", "mute", "soundless", "still"],
    ant: ["noisy", "loud", "vocal", "clamorous"]
  },
  "simple": {
    syn: ["easy", "plain", "straightforward", "uncomplicated"],
    ant: ["complex", "complicated", "intricate", "difficult"]
  },
  "slow": {
    syn: ["sluggish", "gradual", "leisurely", "unhurried"],
    ant: ["fast", "quick", "rapid", "swift"]
  },
  "small": {
    syn: ["tiny", "little", "miniature", "minute"],
    ant: ["big", "huge", "large", "enormous"]
  },
  "smooth": {
    syn: ["sleek", "polished", "flat", "even", "silky"],
    ant: ["rough", "bumpy", "coarse", "uneven"]
  },
  "soft": {
    syn: ["gentle", "cushioned", "yielding", "tender"],
    ant: ["hard", "firm", "rigid", "stiff"]
  },
  "start": {
    syn: ["begin", "commence", "initiate", "launch"],
    ant: ["stop", "finish", "end", "conclude"]
  },
  "stay": {
    syn: ["remain", "linger", "abide", "wait"],
    ant: ["leave", "depart", "vacate", "go"]
  },
  "stop": {
    syn: ["halt", "cease", "terminate", "pause", "discontinue"],
    ant: ["continue", "proceed", "start", "resume"]
  },
  "strange": {
    syn: ["weird", "odd", "unusual", "peculiar", "bizarre"],
    ant: ["normal", "familiar", "typical", "ordinary"]
  },
  "strong": {
    syn: ["powerful", "sturdy", "robust", "mighty", "tough"],
    ant: ["weak", "frail", "feeble", "fragile"]
  },
  "succeed": {
    syn: ["triumph", "prevail", "achieve", "prosper"],
    ant: ["fail", "lose", "collapse", "founder"]
  },
  "sweet": {
    syn: ["sugary", "honeyed", "delightful", "pleasant"],
    ant: ["sour", "bitter", "acidic", "tart"]
  },
  "tall": {
    syn: ["high", "lofty", "towering", "elevated"],
    ant: ["short", "low", "little", "dwarf"]
  },
  "teach": {
    syn: ["instruct", "educate", "train", "tutor", "guide"],
    ant: ["learn", "study", "neglect", "ignore"]
  },
  "think": {
    syn: ["ponder", "reflect", "contemplate", "consider"],
    ant: ["ignore", "forget", "disregard", "overlook"]
  },
  "true": {
    syn: ["accurate", "correct", "genuine", "authentic"],
    ant: ["false", "untrue", "fake", "erroneous"]
  },
  "ugly": {
    syn: ["hideous", "unsightly", "unattractive", "repulsive"],
    ant: ["beautiful", "gorgeous", "attractive", "handsome"]
  },
  "understand": {
    syn: ["comprehend", "grasp", "fathom", "perceive"],
    ant: ["misunderstand", "confuse", "misinterpret", "ignore"]
  },
  "useful": {
    syn: ["helpful", "handy", "practical", "beneficial"],
    ant: ["useless", "worthless", "ineffective", "futile"]
  },
  "victory": {
    syn: ["triumph", "win", "success", "conquest"],
    ant: ["defeat", "loss", "failure", "surrender"]
  },
  "warm": {
    syn: ["tepid", "balmy", "pleasant", "genial"],
    ant: ["cool", "chilly", "cold", "freezing"]
  },
  "weak": {
    syn: ["feeble", "frail", "fragile", "delicate"],
    ant: ["strong", "robust", "powerful", "sturdy"]
  },
  "win": {
    syn: ["prevail", "triumph", "conquer", "succeed"],
    ant: ["lose", "fail", "forfeit", "surrender"]
  },
  "wise": {
    syn: ["sensible", "prudent", "knowledgeable", "sage"],
    ant: ["foolish", "silly", "unwise", "stupid"]
  },
  "wrong": {
    syn: ["incorrect", "erroneous", "mistaken", "false"],
    ant: ["right", "correct", "accurate", "true"]
  },
  "young": {
    syn: ["youthful", "juvenile", "adolescent", "fresh"],
    ant: ["old", "aged", "elderly", "ancient"]
  }
};

const code = `// Auto-generated comprehensive English Thesaurus for OrbitLex
// Covers Middle School (MEB 5-8), Primary School, High School, and Academic/Exam vocabulary.

export const THESAURUS = ${JSON.stringify(BASE, null, 2)};
`;

fs.writeFileSync('src/components/games/OrbitLex/game/thesaurusData.js', code, 'utf8');
console.log('Successfully written thesaurusData.js with', Object.keys(BASE).length, 'headwords!');
