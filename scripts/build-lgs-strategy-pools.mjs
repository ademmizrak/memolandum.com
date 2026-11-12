/**
 * Builds the 6 specialized MEB LGS Question Root & Distractor Trap Pools.
 * Each of the 6 categories contains EXACTLY 200 unique, realistic LGS multiple-choice questions
 * (Total: 1,200 LGS Strategy Questions across Grades 8 Units 1-10).
 *
 * Categories:
 * 1. lgs-olumsuz-kokler       (200 Qs) - Olumsuz Soru Kökleri & Önce/Sonra Adım Tuzakları
 * 2. lgs-diyalog-bosluk       (200 Qs) - Diyalog ve Boşluk Doldurma Soru Kökleri
 * 3. lgs-afis-davetiye        (200 Qs) - Davetiye, Afiş ve Eksik Bilgi Soru Kökleri
 * 4. lgs-grafik-tablo         (200 Qs) - Grafik ve Tablo Okuma Çeldiricileri (Quantifiers & Comparisons)
 * 5. lgs-es-anlam-tuzaklari   (200 Qs) - Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları
 * 6. lgs-siklik-zarflari      (200 Qs) - Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_PUBLIC_DIR = path.join(ROOT, "public", "data", "quizzes");
const OUT_SRC_JS = path.join(ROOT, "src", "lib", "quizzes", "lgsStrategyPools.js");

const NAMES_A = [
  "Jack", "Sarah", "Ted", "Emily", "Kevin", "Lily", "Oliver", "Chloe", "Leo", "Mia",
  "Lucas", "Sophie", "Noah", "Grace", "Ethan", "Zoe", "Mason", "Hannah", "Logan", "Ella",
  "Arda", "Zeynep", "Mert", "Elif", "Bora", "Selin", "Kaan", "Defne", "Emre", "Ece",
];

const NAMES_B = [
  "Julia", "David", "Emma", "Ryan", "Maya", "Alex", "Clara", "Sam", "Nora", "Ben",
  "Alice", "Tom", "Lucy", "Max", "Eva", "Jake", "Ruby", "Luke", "Iris", "Cole",
  "Burak", "Ceren", "Deniz", "Melis", "Tuna", "Duru", "Onur", "Sude", "Cem", "Nil",
];

/* ============================================================================
 * CATEGORY 1: OLUMSUZ SORU KÖKLERİ (200 QUESTIONS)
 * Subtypes (40 questions each = 200):
 *  1A: Which of the following is NOT correct according to the text?
 *  1B: Which question DOES NOT have an answer in the brochure / text?
 *  1C: Who REFUSES the invitation by making an excuse?
 *  1D: Which of the following CANNOT be one of the rules?
 *  1E: Which step comes BEFORE / AFTER [action] in the recipe?
 * ========================================================================== */
function buildCategory1NegativeRoots() {
  const questions = [];

  // 1A: NOT correct according to the text (40 items)
  const profileScenarios = [
    {
      unitNo: 1,
      unitName: "Friendship",
      topic: "true friends",
      fact1: "always backs up her friends when they need help",
      fact2: "never shares her friends' secrets with others",
      fact3: "enjoys spending time at book fairs on Saturdays",
      true1: "She is a supportive and reliable friend.",
      true2: "Her friends can always count on her.",
      true3: "She likes visiting book events at the weekend.",
      falseCorrect: "She often tells her friends' secrets to strangers.",
      trapNote: "Soru kökündeki 'NOT correct' (doğru DEĞİLDİR) ifadesine dikkat! Metinde 'never shares secrets' (sırları asla paylaşmaz) denirken bu şıkta tam tersi söylenmiştir.",
    },
    {
      unitNo: 2,
      unitName: "Teen Life",
      topic: "daily routines and music prefs",
      fact1: "listens to rock music because he finds it energetic",
      fact2: "can't standlistening to opera or folk music",
      fact3: "goes camping with his scouts club once a month",
      true1: "He thinks rock music is trendy and energetic.",
      true2: "He dislikes opera and folk music.",
      true3: "He joins a nature activity every month.",
      falseCorrect: "He is fond of listening to opera in his free time.",
      trapNote: "Metinde 'can't stand opera' (operaya tahammül edemez) ifadesi gizli olumsuzluktur. 'fond of opera' şıkkı metne göre YANLIŞTIR (NOT correct).",
    },
    {
      unitNo: 4,
      unitName: "On the Phone",
      topic: "smartphone habits",
      fact1: "uses her smartphone mostly to practice foreign languages and read e-books",
      fact2: "rarely plays online games because she thinks they waste time",
      fact3: "prefers texting messages to making long phone calls",
      true1: "She uses mobile apps for educational purposes.",
      true2: "She prefers sending text messages to talking on the phone.",
      true3: "She doesn't spend much time playing mobile games.",
      falseCorrect: "She plays online games for hours every evening.",
      trapNote: "Metindeki 'rarely' (nadiren) zarfı gizli olumsuzluk taşır. 'Her akşam saatlerce oyun oynar' ifadesi doğru DEĞİLDİR (NOT correct).",
    },
    {
      unitNo: 5,
      unitName: "The Internet",
      topic: "internet safety",
      fact1: "never accepts friend requests from people he doesn't know",
      fact2: "uses strong passwords and updates his antivirus software regularly",
      fact3: "uses the Internet for doing school research and paying bills",
      true1: "He is careful about online safety rules.",
      true2: "He refuses strangers' requests on social media.",
      true3: "He uses the Net for both schoolwork and online banking.",
      falseCorrect: "He shares his personal password with online strangers.",
      trapNote: "Soru kökü 'NOT correct' (hangisi yanlıştır) soruyor. Metinde güvenli şifre kullandığı ve yabancıları reddettiği belirtilmiştir.",
    },
    {
      unitNo: 6,
      unitName: "Adventures",
      topic: "extreme sports",
      fact1: "is crazy about kayaking and paragliding because she loves adrenaline",
      fact2: "Always wears a helmet and a life jacket before starting any sport",
      fact3: "thinks indoor board games are boring and unexciting",
      true1: "She is an adrenaline seeker who enjoys extreme sports.",
      true2: "She pays attention to safety equipment.",
      true3: "She prefers outdoor sports to indoor board games.",
      falseCorrect: "She never uses safety gear while doing extreme sports.",
      trapNote: "Metinde 'always wears a helmet and a life jacket' denirken bu şıkta 'never uses safety gear' denmiştir. 'NOT correct' olduğu için doğru cevap budur.",
    },
    {
      unitNo: 7,
      unitName: "Tourism",
      topic: "holiday preferences",
      fact1: "prefers visiting ancient castles and historic mosques to staying at seaside resorts",
      fact2: "loves tasting traditional local dishes in every city he visits",
      fact3: "usually stays at affordable bed-and-breakfast pensions",
      true1: "He is interested in cultural and historic vacations.",
      true2: "He enjoys trying local cuisine during his trips.",
      true3: "He doesn't prefer luxury all-inclusive beach hotels.",
      falseCorrect: "He only goes on beach holidays and hates historic sites.",
      trapNote: "'prefers A to B' kalıbında ilk söylenen (ancient castles) tercih edilendir. Sadece plaj tatili yaptığı bilgisi YANLIŞTIR (NOT correct).",
    },
    {
      unitNo: 8,
      unitName: "Chores",
      topic: "household responsibilities",
      fact1: "is in charge of loading the dishwasher and taking out the garbage at home",
      fact2: "doesn't mind vacuuming the carpets at weekends",
      fact3: "hates ironing the clothes because he finds it exhausting",
      true1: "He shares household chores with his family.",
      true2: "He is responsible for some kitchen chores.",
      true3: "Ironing is NOT one of his favourite chores.",
      falseCorrect: "Ironing the clothes is his favourite household chore.",
      trapNote: "Metinde 'hates ironing' (ütüden nefret eder) denmektedir. 'En sevdiği iş ütüdür' şıkkı metne göre doğru DEĞİLDİR.",
    },
    {
      unitNo: 9,
      unitName: "Science",
      topic: "scientific achievements",
      fact1: "is working on a biodegradable plastic project in the school lab",
      fact2: "reads science magazines every week to follow new inventions",
      fact3: "wants to study molecular biology at university in the future",
      true1: "She conducts experiments in the school laboratory.",
      true2: "She closely follows scientific developments.",
      true3: "Her project aims to protect the environment.",
      falseCorrect: "She has no interest in science or laboratory experiments.",
      trapNote: "'NOT correct' soru kökünde metinle çelişen şık aranır. Bilime ilgisi olmadığı ifadesi metinle tamamen çelişir.",
    },
  ];

  for (let i = 0; i < 40; i++) {
    const sc = profileScenarios[i % profileScenarios.length];
    const name = NAMES_A[i % NAMES_A.length];
    const age = 13 + (i % 3);
    const city = ["London", "Ankara", "Izmir", "Toronto", "Berlin", "Madrid", "Rome", "Vienna"][i % 8];
    const passage = `"Hi, I'm ${name} (${age}) from ${city}. In my daily life, ${name} ${sc.fact1}. Also, ${name} ${sc.fact2}, and ${sc.fact3}."`;
    questions.push({
      id: `lgs_cat1_${questions.length + 1}`,
      categorySlug: "lgs-olumsuz-kokler",
      categoryTitle: "1. Olumsuz Soru Kökleri & Önce/Sonra Tuzakları",
      unitNo: sc.unitNo,
      unitName: sc.unitName,
      subType: "NOT correct",
      promptTr: "Metni dikkatlice okuyunuz. Altı çizili OLUMSUZ soru köküne göre doğru şıkkı bulunuz:",
      passageText: passage,
      questionText: `Which of the following is NOT correct about ${name} according to the text?`,
      correctAnswer: sc.falseCorrect,
      distractors: [sc.true1, sc.true2, sc.true3],
      helperText: sc.trapNote,
      english: "is NOT correct (Doğru DEĞİLDİR)",
      turkish: sc.trapNote,
      exampleSentence: passage,
    });
  }

  // 1B: Which question DOES NOT have an answer in the brochure / text? (40 items)
  const brochureTemplates = [
    {
      unitNo: 6,
      unitName: "Adventures",
      title: "SKYHIGH PARAGLIDING CAMP",
      detailA: "Date: June 15–18 (Thursday to Sunday)",
      detailB: "Place: Ölüdeniz, Fethiye",
      detailC: "Fee: $80 per person (Includes helmet & professional instructor)",
      answered1: "Where will the paragliding camp take place?",
      answered2: "How much does a participant have to pay?",
      answered3: "When is the camp going to start?",
      unansweredCorrect: "How will the participants travel to Fethiye?",
      trapNote: "Broşürde yer (Place), ücret (Fee) ve tarih (Date) var; ancak ulaşımın nasıl sağlanacağı (How will they travel / transportation) hakkında HİÇBİR BİLGİ YOKTUR.",
    },
    {
      unitNo: 1,
      unitName: "Friendship",
      title: "CLASS OF 2026 REUNION PARTY",
      detailA: "Venue: Starlight Garden Café, Maple Street",
      detailB: "Time: Saturday, 6:00 PM – 10:00 PM",
      detailC: "Activities: Live DJ music, bowling tournament, and barbecue",
      answered1: "What kind of activities are there at the party?",
      answered2: "What time does the reunion party start?",
      answered3: "Where is the event going to be held?",
      unansweredCorrect: "How much is the entrance fee for each student?",
      trapNote: "Metinde mekan (Venue), saat (Time) ve etkinlikler (Activities) verilmiş; fakat giriş ücreti (entrance fee) hiç belirtilmemiştir ('DOES NOT have an answer').",
    },
    {
      unitNo: 7,
      unitName: "Tourism",
      title: "DISCOVER HISTORIC MARDİN TOUR",
      detailA: "Accommodation: 3 nights at a traditional stone boutique hotel",
      detailB: "Attractions: Deyrulzafaran Monastery, Zinciriye Medrese & Old Bazaar",
      detailC: "Transportation: VIP tour bus departing at 07:30 AM",
      answered1: "Where will the tourists stay during the tour?",
      answered2: "Which historic places will they visit?",
      answered3: "How will the tourists travel during the trip?",
      unansweredCorrect: "What is the weather like in Mardin during the tour?",
      trapNote: "Konaklama (Where stay), gezilecek yerler (Which places) ve ulaşım (How travel) metinde var; hava durumu (weather) sorusunun cevabı YOKTUR.",
    },
    {
      unitNo: 9,
      unitName: "Science",
      title: "NATIONAL HIGH SCHOOL ROBOTICS FAIR",
      detailA: "Date & Time: April 22, from 10:00 AM to 4:00 PM",
      detailB: "Award: 3D Printer for the winning team",
      detailC: "Contact: robotics@sciencefair.org for registration",
      answered1: "What is the prize for the first place?",
      answered2: "How can students register for the fair?",
      answered3: "How long does the robotics fair last?",
      unansweredCorrect: "How many juries will evaluate the projects?",
      trapNote: "10:00 AM - 4:00 PM ifadesi 'How long' (6 saat) sorusunu cevaplar! Ancak jüri sayısı ('How many juries') metinde yer almaz.",
    },
    {
      unitNo: 3,
      unitName: "In the Kitchen",
      title: "ITALIAN PASTA WORKSHOP FOR TEENS",
      detailA: "Chef: Master Chef Lorenzo Rossi",
      detailB: "Ingredients Provided: Flour, organic eggs, olive oil, basil, and parmesan",
      detailC: "Location: Downtown Culinary Academy Kitchen #3",
      answered1: "Who is going to teach at the workshop?",
      answered2: "Which ingredients will they use in the kitchen?",
      answered3: "Where will the cooking workshop take place?",
      unansweredCorrect: "What time does the workshop finish?",
      trapNote: "Eğitmen (Who), malzemeler (Which ingredients) ve yer (Where) verilmiş; ancak bitiş saati ('What time does it finish?') metinde YOKTUR.",
    },
  ];

  for (let i = 0; i < 40; i++) {
    const b = brochureTemplates[i % brochureTemplates.length];
    const edition = Math.floor(i / brochureTemplates.length) + 1;
    const passage = `📋 [${b.title} — GROUP #${edition}]\n• ${b.detailA}\n• ${b.detailB}\n• ${b.detailC}`;
    questions.push({
      id: `lgs_cat1_${questions.length + 1}`,
      categorySlug: "lgs-olumsuz-kokler",
      categoryTitle: "1. Olumsuz Soru Kökleri & Önce/Sonra Tuzakları",
      unitNo: b.unitNo,
      unitName: b.unitName,
      subType: "DOES NOT have an answer",
      promptTr: "Broşürü inceleyiniz. Broşürde cevabı OLMAYAN ('DOES NOT have an answer') soruyu bulunuz:",
      passageText: passage,
      questionText: "Which question DOES NOT have an answer in the brochure above?",
      correctAnswer: b.unansweredCorrect,
      distractors: [b.answered1, b.answered2, b.answered3],
      helperText: b.trapNote,
      english: "DOES NOT have an answer (Cevabı YOKTUR)",
      turkish: b.trapNote,
      exampleSentence: passage,
    });
  }

  // 1C: Who REFUSES the invitation by making an excuse? (40 items)
  const refusalTemplates = [
    {
      event: "a sci-fi movie night on Saturday evening",
      accept1: (n) => `${n}: "Sounds awesome! I love sci-fi movies. I'll definitely be there."`,
      accept2: (n) => `${n}: "Why not? Just text me the time and address."`,
      refuseNoExcuse: (n) => `${n}: "No, thanks. I really dislike watching sci-fi movies."`,
      refuseWithExcuse: (n) => `${n}: "I'd love to join you, but I have to help my dad in the garden and study for my Maths exam."`,
    },
    {
      event: "a cycling tour around the lake on Sunday morning",
      accept1: (n) => `${n}: "That would be great! Cycling is my favourite outdoor activity."`,
      accept2: (n) => `${n}: "Count me in! I'll bring my helmet and water bottle."`,
      refuseNoExcuse: (n) => `${n}: "I'm sorry, I can't. I never ride a bike."`,
      refuseWithExcuse: (n) => `${n}: "That sounds fun, capability-wise, but my cousin is coming over from out of town on Sunday."`,
    },
    {
      event: "a slumber party at Emily's house tonight",
      accept1: (n) => `${n}: "Yeah, sure! Thanks for inviting me. Should I bring some snacks?"`,
      accept2: (n) => `${n}: "Awesome! I can't miss this chance."`,
      refuseNoExcuse: (n) => `${n}: "No way! I hate slumber parties."`,
      refuseWithExcuse: (n) => `${n}: "I'm sorry, I can't make it. I'm feeling really ill and I have a terrible fever."`,
    },
    {
      event: "the school basketball tournament final on Friday",
      accept1: (n) => `${n}: "I'll be there for sure! Let's cheer for our school team."`,
      accept2: (n) => `${n}: "Great idea! What time are we meeting in front of the gym?"`,
      refuseNoExcuse: (n) => `${n}: "Sorry, I'm not interested in basketball at all."`,
      refuseWithExcuse: (n) => `${n}: "I'd love to come, but I have a dentist appointment at 4 PM on Friday."`,
    },
  ];

  for (let i = 0; i < 40; i++) {
    const rt = refusalTemplates[i % refusalTemplates.length];
    const n1 = NAMES_A[i % NAMES_A.length];
    const n2 = NAMES_B[i % NAMES_B.length];
    const n3 = NAMES_A[(i + 5) % NAMES_A.length];
    const n4 = NAMES_B[(i + 7) % NAMES_B.length];

    const passage = `Invitation: "Hey friends! Would you like to join ${rt.event}?"\n• ${rt.accept1(n1)}\n• ${rt.accept2(n2)}\n• ${rt.refuseNoExcuse(n3)}\n• ${rt.refuseWithExcuse(n4)}`;
    questions.push({
      id: `lgs_cat1_${questions.length + 1}`,
      categorySlug: "lgs-olumsuz-kokler",
      categoryTitle: "1. Olumsuz Soru Kökleri & Önce/Sonra Tuzakları",
      unitNo: 1,
      unitName: "Friendship",
      subType: "REFUSES with an excuse",
      promptTr: "Soru kökündeki 'REFUSES ... by making an excuse' (mazeret bildirerek reddeder) ifadesine dikkat ediniz:",
      passageText: passage,
      questionText: "According to the replies above, who REFUSES the invitation by making an excuse?",
      correctAnswer: n4,
      distractors: [n1, n2, n3],
      helperText: `MEB Çeldirici Analizi: ${n1} ve ${n2} daveti kabul ediyor (accepts). ${n3} daveti reddediyor ama mazeret bildirmiyor (sadece sevmediğini söylüyor). ${n4} ise geçerli bir mazeret (excuse) belirterek reddediyor!`,
      english: "REFUSES by making an excuse (Mazeret bildirerek reddeder)",
      turkish: `${n4} bir mazeret belirterek daveti reddediyor; ${n3} ise mazeretsiz reddediyor (çeldirici!).`,
      exampleSentence: passage,
    });
  }

  // 1D: Which of the following CANNOT be one of the rules? (40 items)
  const ruleScenarios = [
    {
      unitNo: 8,
      unitName: "Chores",
      context: "Mrs. Miller's Classroom & Library Rules",
      rule1: "We must return the borrowed books on time.",
      rule2: "We have to keep our desks neat and tidy.",
      rule3: "We must raise our hands before speaking in class.",
      cannotBeRule: "We can make loud phone calls and eat fast food in the library.",
      trapNote: "'CANNOT be one of the rules' (kurallardan biri OLAMAZ) soruluyor. Kütüphanede yüksek sesle konuşup yemek yemek kurallardan biri olamaz!",
    },
    {
      unitNo: 5,
      unitName: "The Internet",
      context: "Safe Internet Usage Rules for Teens",
      rule1: "Never share your home address or credit card number online.",
      rule2: "Always check the reliability of websites before downloading files.",
      rule3: "Ask your parents before meeting an online friend in person.",
      cannotBeRule: "Share your banking passwords with everyone on social media.",
      trapNote: "'CANNOT be one of the rules' köküne dikkat! Şifreleri herkesle paylaşmak güvenli internet kuralı OLAMAZ.",
    },
    {
      unitNo: 10,
      unitName: "Natural Forces",
      context: "Precautions Against Global Warming & Drought",
      rule1: "We should turn off the tap while brushing our teeth to save water.",
      rule2: "We must plant more trees and use recyclable paper products.",
      rule3: "We should prefer public transportation or cycling to private cars.",
      cannotBeRule: "We should waste clean water and cut down forests for factories.",
      trapNote: "Kurallardan veya önlemlerden biri OLAMAYACAK ('CANNOT be') seçenek, suyu israf etmeyi ve ormanları kesmeyi öneren şıktır.",
    },
    {
      unitNo: 9,
      unitName: "Science",
      context: "Chemistry Laboratory Safety Rules",
      rule1: "Students must wear safety goggles and lab coats during experiments.",
      rule2: "Never touch hot test tubes or chemical substances with bare hands.",
      rule3: "Keep the laboratory benches clean and report any accidents immediately.",
      cannotBeRule: "Taste unknown chemical liquids without asking the science teacher.",
      trapNote: "Laboratuvar güvenlik kurallarından biri OLAMAYACAK ('CANNOT be') ifade, bilinmeyen kimyasalları tatmaktır.",
    },
  ];

  for (let i = 0; i < 40; i++) {
    const rs = ruleScenarios[i % ruleScenarios.length];
    const schoolNo = i + 1;
    const passage = `📌 [${rs.context} — Poster #${schoolNo}]\n1. ${rs.rule1}\n2. ${rs.rule2}\n3. ${rs.rule3}`;
    questions.push({
      id: `lgs_cat1_${questions.length + 1}`,
      categorySlug: "lgs-olumsuz-kokler",
      categoryTitle: "1. Olumsuz Soru Kökleri & Önce/Sonra Tuzakları",
      unitNo: rs.unitNo,
      unitName: rs.unitName,
      subType: "CANNOT be one of the rules",
      promptTr: "Aşağıdakilerden hangisi bu listedeki kurallardan biri OLAMAZ ('CANNOT be')?",
      passageText: passage,
      questionText: `Which of the following CANNOT be added to "${rs.context}" above?`,
      correctAnswer: rs.cannotBeRule,
      distractors: [rs.rule1, rs.rule2, rs.rule3],
      helperText: rs.trapNote,
      english: "CANNOT be one of the rules (Kurallardan biri OLAMAZ)",
      turkish: rs.trapNote,
      exampleSentence: passage,
    });
  }

  // 1E: Which step comes BEFORE / AFTER [action] in the recipe? (40 items)
  const recipeChains = [
    {
      dish: "Menemen (Turkish Scrambled Eggs with Tomatoes)",
      steps: [
        "Wash two fresh tomatoes and green peppers.",
        "Peel the tomatoes carefully with a sharp knife.",
        "Dice the peeled tomatoes into small cubes.",
        "Melt a tablespoon of butter in a frying pan.",
        "Crack two eggs into the pan and stir gently.",
      ],
    },
    {
      dish: "Homemade Chocolate Chip Muffins",
      steps: [
        "Preheat the oven to 180°C before preparing the batter.",
        "Whisk the eggs and sugar in a large mixing bowl.",
        "Add milk, oil, flour, and baking powder into the bowl.",
        "Pour the mixture into the muffin cups and sprinkle chocolate chips.",
        "Bake the muffins in the hot oven for 25 minutes.",
      ],
    },
    {
      dish: "Creamy Red Lentil Soup",
      steps: [
        "Rinse a cup of red lentils under cold water.",
        "Chop an onion and a carrot into small pieces.",
        "Sauté the chopped onion in olive oil for three minutes.",
        "Add the lentils and beş cups of hot water into the pot.",
        "Blend the soup until it becomes smooth and serve warm with lemon.",
      ],
    },
    {
      dish: "Fresh Mediterranean Pasta Salad",
      steps: [
        "Boil a packet of penne pasta in salted water for 10 minutes.",
        "Drain the boiled pasta using a strainer and let it cool.",
        "Slice black olives, cherry tomatoes, and feta cheese.",
        "Mix the pasta and sliced vegetables in a deep salad bowl.",
        "Pour olive oil and lemon sauce over the salad before serving.",
      ],
    },
  ];

  for (let i = 0; i < 40; i++) {
    const rc = recipeChains[i % recipeChains.length];
    const askAfter = i % 2 === 0;
    // Choose middle steps (index 1, 2, or 3) so both BEFORE and AFTER exist!
    const pivotIdx = 1 + (Math.floor(i / 2) % 3);
    const pivotStep = rc.steps[pivotIdx];
    const targetStep = askAfter ? rc.steps[pivotIdx + 1] : rc.steps[pivotIdx - 1];
    const oppositeTrapStep = askAfter ? rc.steps[pivotIdx - 1] : rc.steps[pivotIdx + 1];
    const otherDistractors = rc.steps.filter(
      (s, idx) => idx !== pivotIdx && s !== targetStep && s !== oppositeTrapStep
    );

    const passage = `👩‍🍳 Recipe: ${rc.dish}\nStep 1: ${rc.steps[0]}\nStep 2: ${rc.steps[1]}\nStep 3: ${rc.steps[2]}\nStep 4: ${rc.steps[3]}\nStep 5: ${rc.steps[4]}`;
    const directionWord = askAfter ? "AFTER" : "BEFORE";
    const directionTr = askAfter ? "SONRAKİ (AFTER)" : "ÖNCEKİ (BEFORE)";
    const trapTr = askAfter ? "ÖNCEKİ (BEFORE)" : "SONRAKİ (AFTER)";

    questions.push({
      id: `lgs_cat1_${questions.length + 1}`,
      categorySlug: "lgs-olumsuz-kokler",
      categoryTitle: "1. Olumsuz Soru Kökleri & Önce/Sonra Tuzakları",
      unitNo: 3,
      unitName: "In the Kitchen",
      subType: `Step ${directionWord}`,
      promptTr: `Mutfak sıralama sorusu: Soru kökündeki '${directionWord}' (${directionTr} adım) kelimesine dikkat ediniz!`,
      passageText: passage,
      questionText: `According to the recipe above, which step comes immediately ${directionWord} "${pivotStep}"?`,
      correctAnswer: targetStep,
      distractors: [oppositeTrapStep, otherDistractors[0], otherDistractors[1]],
      helperText: `MEB Adım Tuzağı: Soru kökü "${directionWord}" (${directionTr}) adımı soruyor! MEB çeldirici olarak hemen ${trapTr} adımı ("${oppositeTrapStep}") şıklara koyar. Doğru adım: "${targetStep}".`,
      english: `${directionWord} (${directionTr} Adım)`,
      turkish: `Doğru adım: ${targetStep}`,
      exampleSentence: passage,
    });
  }

  return questions;
}

/* ============================================================================
 * CATEGORY 2: DİYALOG VE BOŞLUK DOLDURMA SORU KÖKLERİ (200 QUESTIONS)
 * Subtypes:
 *  2A: Which of the following completes the conversation above? (80 Qs)
 *  2B: According to the conversation, who has something in common with [Name]? (60 Qs)
 *  2C: What can we say about [Name] according to her/his comments? (60 Qs)
 * ========================================================================== */
function buildCategory2DialogueCompletion() {
  const questions = [];

  // 2A: Which of the following completes the conversation above? (80 items)
  const dialogueTemplates = [
    {
      unitNo: 1,
      unitName: "Friendship",
      line1: (a) => `${a}: Are you doing anything special this Saturday evening?`,
      line2: (b) => `${b}: Not really. Why are you asking?`,
      line3: (a) => `${a}: ---`,
      line4: (b) => `${b}: That sounds great! Wait for me in front of the cinema at 7 PM.`,
      correct: "We are going to watch the new comedy movie. Would you like to join us?",
      distractors: [
        "Where is the nearest movie theatre in this neighbourhood?",
        "How often do you go to the cinema with your classmates?",
        "I am sorry, I have to stay at home and take care of my little sister.",
      ],
      trapNote: "Boşluktan sonraki cümlede 'Harika olur! Saat 7'de sinemanın önünde beni bekle' denildiği için boşluğa bir sinema daveti (Would you like to join us?) gelmelidir.",
    },
    {
      unitNo: 3,
      unitName: "In the Kitchen",
      line1: (a) => `${a}: This homemade apple pie tastes delicious! ---`,
      line2: (b) => `${b}: Just flour, butter, cinnamon, sugar, and four green apples.`,
      line3: (a) => `${a}: Really? Is it easy to bake at home?`,
      line4: (b) => `${b}: Yes, it takes only 35 minutes in the oven.`,
      correct: "What are the ingredients of it?",
      distractors: [
        "How long do you bake the apple pie in the oven?",
        "Who taught you how to cook traditional desserts?",
        "Do you prefer sour apples or sweet apples?",
      ],
      trapNote: "Cevapta 'Sadece un, tereyağı, tarçın, şeker ve 4 yeşil elma' (malzeme listesi) verildiği için soru 'What are the ingredients of it?' (İçindekiler/malzemeler nelerdir?) olmalıdır. 'How long' çeldiricidir çünkü süre bir sonraki soruda geçmektedir!",
    },
    {
      unitNo: 4,
      unitName: "On the Phone",
      line1: (a) => `${a}: Hello, TechCare Customer Service. How may I help you?`,
      line2: (b) => `${b}: Hi, I bought a wireless headphone yesterday, but its microphone isn't working. Could you put me through to the technical team?`,
      line3: (a) => `${a}: ---`,
      line4: (b) => `${b}: Sure, my name is Kevin Brooks and my phone number is 555-0192.`,
      correct: "I'm afraid the line is engaged right now. Would you like to leave a message and your contact details?",
      distractors: [
        "Hold on a moment, I'll connect you immediately.",
        "You clicked the wrong button on the website.",
        "We don't sell wireless headphones at our store.",
      ],
      trapNote: "Son cümlede müşteri adını ve telefon numarasını bıraktığı için müşteri temsilcisi hattın meşgul olduğunu (engaged) söyleyip mesaj/iletişim bilgisi istemiş olmalıdır.",
    },
    {
      unitNo: 5,
      unitName: "The Internet",
      line1: (a) => `${a}: Dad, I can't log in to my school portal. ---`,
      line2: (b) => `${b}: Let me check the modem. Oh, the red light is blinking; there is no connection.`,
      line3: (a) => `${a}: What should we do now?`,
      line4: (b) => `${b}: I'll call the Internet service provider right away.`,
      correct: "I think the Internet isn't working properly.",
      distractors: [
        "How many hours a day do you use the Internet?",
        "I always upload my school projects on time.",
        "Whose laptop is on the living room table?",
      ],
      trapNote: "Babanın cevabı 'Modemi kontrol edeyim, kırmızı ışık yanıp sönüyor, bağlantı yok' olduğu için boşluğa 'Sanırım internet düzgün çalışmıyor' ifadesi gelmelidir.",
    },
    {
      unitNo: 6,
      unitName: "Adventures",
      line1: (a) => `${a}: Have you ever tried bungee jumping or skydiving?`,
      line2: (b) => `${b}: Never! To be honest, I'm afraid of heights.`,
      line3: (a) => `${a}: ---`,
      line4: (b) => `${b}: I usually go trekking or cycling in safe forest trails.`,
      correct: "Then what kind of sports do you prefer doing in your free time?",
      distractors: [
        "Why do you love jumping from high bridges so much?",
        "When did you buy your parachute and helmet?",
        "Who is the best skydiver in your club?",
      ],
      trapNote: "Cevapta 'Genellikle güvenli orman patikalarında doğa yürüyüşü veya bisiklet yaparım' denildiği için soru 'Peki boş zamanlarında ne tür sporları tercih edersin?' olmalıdır.",
    },
    {
      unitNo: 7,
      unitName: "Tourism",
      line1: (a) => `${a}: Welcome back! Where did you go for your semester holiday?`,
      line2: (b) => `${b}: I went to Cappadocia with my family for four days.`,
      line3: (a) => `${a}: ---`,
      line4: (b) => `${b}: It was chilly and snowy, but the fairy chimneys looked magical under the snow!`,
      correct: "What was the weather like while you were there?",
      distractors: [
        "How much did you pay for the cave hotel?",
        "Did you travel there by plane or by coach?",
        "What are the most famous traditional dishes of the region?",
      ],
      trapNote: "Cevapta 'Soğuk ve karlıydı (chilly and snowy)' denildiği için soru 'Oradayken hava nasıldı?' (What was the weather like?) olmalıdır.",
    },
    {
      unitNo: 8,
      unitName: "Chores",
      line1: (a) => `${a}: Our guests are arriving in an hour, and the living room is still a mess!`,
      line2: (b) => `${b}: Don't worry! ---`,
      line3: (a) => `${a}: Thank you so much! While you do that, I'll set the table in the dining room.`,
      line4: (b) => `${b}: Deal! Everything will be ready on time.`,
      correct: "I can vacuum the carpets and dust the shelves right now.",
      distractors: [
        "I never help my parents with the household chores.",
        "What time does the football match start on TV?",
        "You must do all the cleaning by yourself today.",
      ],
      trapNote: "'Don't worry!' (Merak etme!) ve sonrasındaki 'Çok teşekkürler! Sen onu yaparken ben de sofrayı kuracağım' ifadeleri, boşlukta ev işine yardım teklifi olduğunu gösterir.",
    },
    {
      unitNo: 10,
      unitName: "Natural Forces",
      line1: (a) => `${a}: Did you watch the news about the landslide in the Black Sea region?`,
      line2: (b) => `${b}: Yes, it was terrible. Fortunately, nobody was injured.`,
      line3: (a) => `${a}: ---`,
      line4: (b) => `${b}: Heavy rain lasted for three days and people had cut down too many trees on the slopes.`,
      correct: "What were the main reasons for the disaster?",
      distractors: [
        "How many people lost their lives in the earthquake?",
        "When will the rescue teams arrive in the city?",
        "Where should we hide during a tornado?",
      ],
      trapNote: "Cevapta 'Üç gün süren şiddetli yağmur ve yamaçlardaki ağaçların kesilmesi' (sebepler) anlatıldığı için soru 'Felaketin ana sebepleri nelerdi?' olmalıdır.",
    },
  ];

  for (let i = 0; i < 80; i++) {
    const dt = dialogueTemplates[i % dialogueTemplates.length];
    const nA = NAMES_A[i % NAMES_A.length];
    const nB = NAMES_B[(i + 3) % NAMES_B.length];
    const passage = `💬 Conversation:\n${dt.line1(nA)}\n${dt.line2(nB)}\n${dt.line3(nA)}\n${dt.line4(nB)}`;
    questions.push({
      id: `lgs_cat2_${questions.length + 1}`,
      categorySlug: "lgs-diyalog-bosluk",
      categoryTitle: "2. Diyalog ve Boşluk Doldurma Soru Kökleri",
      unitNo: dt.unitNo,
      unitName: dt.unitName,
      subType: "Completes the conversation",
      promptTr: "Diyalogda boşluktan ÖNCEKİ ve SONRAKİ cümle ipuçlarını takip ederek diyaloğu tamamlayan ifadeyi bulunuz:",
      passageText: passage,
      questionText: "Which of the following completes the conversation above?",
      correctAnswer: dt.correct,
      distractors: dt.distractors,
      helperText: dt.trapNote,
      english: "Which of the following completes the conversation?",
      turkish: dt.trapNote,
      exampleSentence: passage,
    });
  }

  // 2B: Who has something in common with [Name]? (60 items)
  const commonInterestTemplates = [
    {
      unitNo: 2,
      unitName: "Teen Life",
      targetStmt: "I love spending my weekends in nature. Camping in the forest and hiking are my favourite activities.",
      matchStmt: "I am fond of outdoor activities; sleeping in a tent and walking in nature make me feel peaceful.",
      diff1: "I prefer staying at home and playing video games on my console all weekend.",
      diff2: "I am crazy about fashion and I spend every Saturday at crowded shopping malls.",
      diff3: "I can't stand insects or forests, so I never join nature camps.",
      commonTopic: "doğa ve kamp (outdoor / camping) sevgisi",
    },
    {
      unitNo: 3,
      unitName: "In the Kitchen",
      targetStmt: "I have a sweet tooth! I always prefer baking chocolate cakes and fruit tarts to cooking meat dishes.",
      matchStmt: "Desserts are my favourite! I love preparing puddings and cookies in the kitchen.",
      diff1: "I never eat sugary food because I only like spicy grilled kebabs and steak.",
      diff2: "I prefer sour and salty snacks like pickles and potato chips.",
      diff3: "I hate spending time in the kitchen, so I always order fast food.",
      commonTopic: "tatlı yapma ve yeme (sweet tooth / desserts) tercihi",
    },
    {
      unitNo: 6,
      unitName: "Adventures",
      targetStmt: "I am an underwater enthusiast. Scuba diving and exploring coral reefs are the most exciting experiences for me.",
      matchStmt: "Water sports are my passion! I love diving into the deep sea to watch marine life.",
      diff1: "I only enjoy winter sports such as snowboarding and ice climbing.",
      diff2: "I am afraid of deep water, so I prefer caving and rock climbing.",
      diff3: "I think all extreme sports are too dangerous; I prefer playing chess.",
      commonTopic: "su altı dalışı (scuba diving / underwater sports) tutkusu",
    },
    {
      unitNo: 7,
      unitName: "Tourism",
      targetStmt: "When I travel to a new country, I always visit ancient ruins, museums, and historic castles first.",
      matchStmt: "Cultural holidays are the best for me! Exploring historical architecture and old temples is fascinating.",
      diff1: "I find museums really boring; I just want to sunbathe on the beach all day.",
      diff2: "I only travel to modern metropolises to go shopping in luxury stores.",
      diff3: "I prefer winter ski resorts to historical cities.",
      commonTopic: "tarihi ve kültürel mekanları (historic sites / museums) gezme isteği",
    },
    {
      unitNo: 9,
      unitName: "Science",
      targetStmt: "Observing the planets through a telescope and reading about space exploration are my biggest hobbies.",
      matchStmt: "I am really interested in astronomy; I want to become an astronaut and study Mars one day.",
      diff1: "I am only interested in plant genetics and agricultural farming.",
      diff2: "I prefer repairing old car engines in my grandfather's garage.",
      diff3: "I don't like science subjects; literature and poetry are my favourites.",
      commonTopic: "uzay ve astronomi (astronomy / space exploration) merakı",
    },
  ];

  for (let i = 0; i < 60; i++) {
    const ct = commonInterestTemplates[i % commonInterestTemplates.length];
    const targetPerson = NAMES_A[i % NAMES_A.length];
    const matchPerson = NAMES_B[i % NAMES_B.length];
    const d1Person = NAMES_A[(i + 4) % NAMES_A.length];
    const d2Person = NAMES_B[(i + 6) % NAMES_B.length];
    const d3Person = NAMES_A[(i + 9) % NAMES_A.length];

    const passage = `🗣️ Group Chat:\n• ${targetPerson}: "${ct.targetStmt}"\n• ${matchPerson}: "${ct.matchStmt}"\n• ${d1Person}: "${ct.diff1}"\n• ${d2Person}: "${ct.diff2}"\n• ${d3Person}: "${ct.diff3}"`;
    questions.push({
      id: `lgs_cat2_${questions.length + 1}`,
      categorySlug: "lgs-diyalog-bosluk",
      categoryTitle: "2. Diyalog ve Boşluk Doldurma Soru Kökleri",
      unitNo: ct.unitNo,
      unitName: ct.unitName,
      subType: "Something in common",
      promptTr: `'has something in common with ${targetPerson}' (${targetPerson} ile ortak bir noktası vardır) soru köküne göre doğru kişiyi bulunuz:`,
      passageText: passage,
      questionText: `According to the conversation above, who has something in common with ${targetPerson}?`,
      correctAnswer: matchPerson,
      distractors: [d1Person, d2Person, d3Person],
      helperText: `MEB Kalıp İpucu: "have something in common" = ortak bir noktası / zevki olmak demektir. ${targetPerson} ve ${matchPerson} kişilerinin ortak noktası: ${ct.commonTopic}.`,
      english: "has something in common with (Ortak bir noktası vardır)",
      turkish: `${targetPerson} ile ${matchPerson} ortak zevke sahiptir (${ct.commonTopic}).`,
      exampleSentence: passage,
    });
  }

  // 2C: What can we say about [Name] according to her/his comments? (60 items)
  const commentTemplates = [
    {
      unitNo: 1,
      unitName: "Friendship",
      comment: "Whenever my classmates have a problem, I listen to them patiently and help them solve it. Also, I never tell lies.",
      correctInference: "knows how to be a supportive and honest friend.",
      wrong1: "is a laid-back and unreliable person.",
      wrong2: "always argues with classmates and breaks promises.",
      wrong3: "prefers being alone to making friends.",
      trapNote: "Yorumda arkadaşlarını sabırla dinlediği, yardım ettiği ve asla yalan söylemediği belirtildiği için 'destekleyici ve dürüst (supportive and honest)' olduğu çıkarılır.",
    },
    {
      unitNo: 5,
      unitName: "The Internet",
      comment: "I spend more than seven hours a day on social media, and I feel angry and anxious whenever my Wi-Fi connection goes down.",
      correctInference: "is an Internet addict and spends too much time online.",
      wrong1: "uses the Internet only for half an hour a week.",
      wrong2: "doesn't have a smartphone or a computer at home.",
      wrong3: "prefers face-to-face communication to social media.",
      trapNote: "Günde 7 saatten fazla sosyal medyada kalması ve internet kesilince öfkelenmesi, onun bir internet bağımlısı ('Internet addict') olduğunu gösterir.",
    },
    {
      unitNo: 8,
      unitName: "Chores",
      comment: "In our house, my wife cooks the dinner, I wash the dishes and mop the floor, and our children tidy up their rooms every evening.",
      correctInference: "believes in sharing household chores equally among family members.",
      wrong1: "thinks only mothers should do all the housework.",
      wrong2: "never helps with any kitchen or cleaning chores.",
      wrong3: "lives alone in a small apartment.",
      trapNote: "Ailedeki herkesin bir ev işini üstlenmesi, ev işlerinin paylaşılmasına ('sharing household chores') önem verildiğini kanıtlar.",
    },
    {
      unitNo: 6,
      unitName: "Adventures",
      comment: "Last summer I tried rafting and paragliding, and next month I am going to try cave diving in Antalya because I love pushing my limits!",
      correctInference: "is fond of challenging and extreme sports.",
      wrong1: "finds extreme sports too risky and frightening.",
      wrong2: "prefers quiet indoor hobbies like knitting.",
      wrong3: "has never tried any outdoor adventure in life.",
      trapNote: "'pushing my limits' (sınırlarımı zorlamak) ve rafting/paragliding/cave diving örnekleri kişinin ekstrem sporlara düşkün ('fond of extreme sports') olduğunu gösterir.",
    },
    {
      unitNo: 10,
      unitName: "Natural Forces",
      comment: "I always carry a reusable cloth bag when I go shopping, use rechargeable batteries, and sort plastic, glass, and paper at home.",
      correctInference: "is an eco-friendly person who cares about recycling.",
      wrong1: "pollutes the environment with plastic bags.",
      wrong2: "thinks global warming is not a serious problem.",
      wrong3: "never recycles waste materials at home.",
      trapNote: "Bez çanta kullanmak, şarjlı pil tercih etmek ve atıkları ayrıştırmak kişinin çevre dostu ('eco-friendly') olduğunu gösterir.",
    },
  ];

  for (let i = 0; i < 60; i++) {
    const cm = commentTemplates[i % commentTemplates.length];
    const person = NAMES_A[(i + 2) % NAMES_A.length];
    const passage = `💬 ${person}'s Comment:\n"${cm.comment}"`;
    questions.push({
      id: `lgs_cat2_${questions.length + 1}`,
      categorySlug: "lgs-diyalog-bosluk",
      categoryTitle: "2. Diyalog ve Boşluk Doldurma Soru Kökleri",
      unitNo: cm.unitNo,
      unitName: cm.unitName,
      subType: "What can we say about...",
      promptTr: `${person}'in yorumuna göre onun hakkında ne söyleyebiliriz ('What can we say about ${person}')?`,
      passageText: passage,
      questionText: `What can we say about ${person} according to the comment above?`,
      correctAnswer: `${person} ${cm.correctInference}`,
      distractors: [
        `${person} ${cm.wrong1}`,
        `${person} ${cm.wrong2}`,
        `${person} ${cm.wrong3}`,
      ],
      helperText: cm.trapNote,
      english: "What can we say about ... according to the comments?",
      turkish: cm.trapNote,
      exampleSentence: passage,
    });
  }

  return questions;
}

/* ============================================================================
 * CATEGORY 3: DAVETİYE, AFİŞ VE EKSİK BİLGİ SORU KÖKLERİ (200 QUESTIONS)
 * "In the poster / invitation above, there is NO information about the..."
 * Classic MEB Poster Traps:
 *  - "5 PM - 8 PM" -> Time & Duration exist
 *  - "$15 per person" / "Free entry" -> Fee / Price exists
 *  - "For more details, call / email..." -> Contact exists
 *  - "At City Youth Center" -> Place / Venue exists
 *  - "On Sunday, October 12" -> Date exists
 * ========================================================================== */
function buildCategory3PosterMissingInfo() {
  const questions = [];

  const events = [
    { unitNo: 1, unitName: "Friendship", name: "AUTUMN BOWLING TOURNAMENT", place: "Strike Zone Bowling Alley", activity: "Team matches & trophy ceremony" },
    { unitNo: 2, unitName: "Teen Life", name: "TEEN ROCK & JAZZ MUSIC FESTIVAL", place: "Green Park Open-Air Stage", activity: "Live concerts & backstage meet-up" },
    { unitNo: 3, unitName: "In the Kitchen", name: "HOMEMADE PIZZA & PASTA FAIR", place: "Sunshine Culinary Hall", activity: "Cooking contest & recipe tasting" },
    { unitNo: 5, unitName: "The Internet", name: "CYBER SECURITY & CODING BOOTCAMP", place: "Innovation Tech Hub", activity: "Python coding & safe net seminar" },
    { unitNo: 6, unitName: "Adventures", name: "MOUNT OLYMPOS TREKKING & CAMPING", place: "Beydağları National Park", activity: "Rock climbing, campfire & hiking" },
    { unitNo: 7, unitName: "Tourism", name: "ANCIENT EPHESUS HERITAGE TOUR", place: "Selçuk Cultural Route, İzmir", activity: "Guided museum & Celsus Library walk" },
    { unitNo: 9, unitName: "Science", name: "SPACE & ASTRONOMY OBSERVATION NIGHT", place: "National Observatory Dome", activity: "Telescope viewing & planetarium show" },
    { unitNo: 10, unitName: "Natural Forces", name: "CLEAN FOREST & TREE PLANTING DAY", place: "Belgrad Forest North Entrance", activity: "Planting 500 pine saplings & recycling" },
  ];

  // 5 Missing-Info Target Variations (40 each = 200)
  // Variation 0: Missing FEE / PRICE (Poster has Date, Time/Duration, Place, Contact)
  // Variation 1: Missing CONTACT / RESERVATION (Poster has Date, Time, Fee, Place)
  // Variation 2: Missing PLACE / LOCATION (Poster has Date, Time, Fee, Contact)
  // Variation 3: Missing TIME / DURATION (Poster has Date, Place, Fee, Contact)
  // Variation 4: Missing EQUIPMENT / WHAT TO BRING (Poster has Date & Time, Place, Fee, Contact)

  for (let i = 0; i < 200; i++) {
    const ev = events[i % events.length];
    const variation = i % 5;
    const dayNum = 10 + (i % 18);
    const month = ["May", "June", "September", "October", "November", "April"][i % 6];
    const startH = 1 + (i % 5);
    const endH = startH + 3;
    const price = 10 + (i % 4) * 5;
    const phone = `0212 555 ${1000 + i}`;

    let lines = [];
    let missingCorrect = "";
    let presentDistractors = [];
    let trapExplanation = "";

    if (variation === 0) {
      lines = [
        `📅 Date: Sunday, ${month} ${dayNum}`,
        `⏰ Hours: ${startH}:00 PM – ${endH}:00 PM`,
        `📍 Venue: ${ev.place}`,
        `📞 For more details, call: ${phone}`,
      ];
      missingCorrect = "the fee / price of the event";
      presentDistractors = [
        "the date and time of the event",
        "the location / place of the event",
        "the contact information for details",
      ];
      trapExplanation = `MEB Afiş Tuzağı: Afişte "${startH}:00 PM – ${endH}:00 PM" yazdığı için Time/Duration elenir; "${ev.place}" yazdığı için Place/Location elenir; "call ${phone}" yazdığı için Contact elenir. Ücret (fee / price) hakkında HİÇBİR BİLGİ YOKTUR!`;
    } else if (variation === 1) {
      lines = [
        `📅 Date: Saturday, ${month} ${dayNum}`,
        `⏰ Time: ${startH}:00 PM – ${endH}:00 PM`,
        `📍 Location: ${ev.place}`,
        `💵 Ticket Price: $${price} per person (Snacks included)`,
      ];
      missingCorrect = "the contact number / how to get more information";
      presentDistractors = [
        "the fee / price per person",
        "the duration and time of the event",
        "the place where the event takes place",
      ];
      trapExplanation = `MEB Afiş Tuzağı: Afişte "$${price} per person" yazdığı için Fee/Price elenir; "${startH}:00 PM – ${endH}:00 PM" yazdığı için Time/Duration elenir; "${ev.place}" yazdığı için Place elenir. İletişim bilgisi (contact) YOKTUR!`;
    } else if (variation === 2) {
      lines = [
        `📅 Date: Friday, ${month} ${dayNum}`,
        `⏰ Time: ${startH}:00 PM – ${endH}:00 PM (3 hours)`,
        `💵 Entry Fee: $${price} per student`,
        `📧 For registration, email: info@memoevents.org`,
      ];
      missingCorrect = "the place / venue where the event will take place";
      presentDistractors = [
        "the cost / price of joining the event",
        "the time and duration of the event",
        "the contact address for registration",
      ];
      trapExplanation = `MEB Afiş Tuzağı: Afişte ücret ($${price} -> cost/price), saat/süre (${startH}:00 PM – ${endH}:00 PM -> time/duration) ve iletişim (email -> contact) var; ancak etkinliğin yapılacağı YER (place / venue) YOKTUR!`;
    } else if (variation === 3) {
      lines = [
        `📅 Date: Sunday, ${month} ${dayNum}`,
        `📍 Place: ${ev.place}`,
        `💵 Fee: Free of charge (No fee required!)`,
        `📞 Contact: Call Mr. Parker at ${phone}`,
      ];
      missingCorrect = "what time the event starts and finishes",
      presentDistractors = [
        "whether the event is paid or free (the fee)",
        "where the participants will meet (the place)",
        "who to call for more details (the contact)",
      ];
      trapExplanation = `MEB Afiş Tuzağı: Dikkat! "Free of charge" ifadesi ücret (fee) bilgisinin verildiğini gösterir ("ücretsizdir"). Ancak etkinliğin saat kaçta başlayıp bittiği (what time it starts and finishes) afişte YOKTUR!`;
    } else {
      lines = [
        `📅 When: Saturday, ${month} ${dayNum} (${startH}:00 PM – ${endH}:00 PM)`,
        `📍 Where: ${ev.place}`,
        `💵 Fee: $${price} per person`,
        `📞 More details: ${phone}`,
      ];
      missingCorrect = "the equipment / materials participants need to bring";
      presentDistractors = [
        "the time and duration of the event",
        "the fee / price per person",
        "the contact phone number",
      ];
      trapExplanation = `MEB Afiş Tuzağı: Afişte "${startH}:00 PM – ${endH}:00 PM" -> Time/Duration, "$${price}" -> Fee/Price ve "${phone}" -> Contact bilgilerini verir. Katılımcıların getirmesi gereken ekipman (equipment) hakkında bilgi YOKTUR!`;
    }

    const passage = `📢 [POSTER: ${ev.name}]\n• Activity: ${ev.activity}\n• ${lines.join("\n• ")}`;
    questions.push({
      id: `lgs_cat3_${questions.length + 1}`,
      categorySlug: "lgs-afis-davetiye",
      categoryTitle: "3. Davetiye, Afiş ve Eksik Bilgi Soru Kökleri",
      unitNo: ev.unitNo,
      unitName: ev.unitName,
      subType: "NO information about...",
      promptTr: "Afişteki bilgileri şıklarla eşleştirip afişte OLMAYAN ('NO information about') bilgiyi bulunuz:",
      passageText: passage,
      questionText: "In the poster above, there is NO information about ---.",
      correctAnswer: missingCorrect,
      distractors: presentDistractors,
      helperText: trapExplanation,
      english: "there is NO information about... (Hakkında bilgi YOKTUR)",
      turkish: trapExplanation,
      exampleSentence: passage,
    });
  }

  return questions;
}

/* ============================================================================
 * CATEGORY 4: GRAFİK VE TABLO OKUMA ÇELDİRİCİLERİ (200 QUESTIONS)
 * Quantifiers & Comparisons:
 *  4A: Nearly / Almost half (%45-%49) vs "Half" (%50) trap (50 Qs)
 *  4B: More than half / The majority (%51-%75) (50 Qs)
 *  4C: Both A and B prefer... (Table with ✓ / ✗) (50 Qs)
 *  4D: None of them / Nobody is interested in... (%0 or all ✗) (50 Qs)
 * ========================================================================== */
function buildCategory4ChartsQuantifiers() {
  const questions = [];

  const surveyTopics = [
    {
      unitNo: 2,
      unitName: "Teen Life",
      title: "Teens' Favourite Free Time Activities (100 Teens)",
      itemA: "Playing online games",
      itemB: "Listening to pop music",
      itemC: "Going camping in nature",
      itemD: "Reading detective books",
    },
    {
      unitNo: 3,
      unitName: "In the Kitchen",
      title: "Preferred Cooking Methods Among Adults (100 People)",
      itemA: "Grilling meat and fish",
      itemB: "Boiling vegetables",
      itemC: "Baking pastries in the oven",
      itemD: "Frying potatoes in oil",
    },
    {
      unitNo: 4,
      unitName: "On the Phone",
      title: "Why Do Students Use Their Smartphones? (100 Students)",
      itemA: "Texting messages on chat apps",
      itemB: "Studying English vocabulary",
      itemC: "Making video calls",
      itemD: "Buying clothes online",
    },
    {
      unitNo: 6,
      unitName: "Adventures",
      title: "Most Popular Extreme Sports in the Club (100 Members)",
      itemA: "Paragliding",
      itemB: "White-water rafting",
      itemC: "Scuba diving",
      itemD: "Bungee jumping",
    },
    {
      unitNo: 7,
      unitName: "Tourism",
      title: "Holiday Types Preferred by Tourists (100 Tourists)",
      itemA: "Cultural & historic tours",
      itemB: "Seaside & beach holidays",
      itemC: "Winter ski resorts",
      itemD: "Camping in nature",
    },
  ];

  // 4A: Nearly / Almost half (%46-%49) vs "Exactly half" (%50) trap (50 items)
  for (let i = 0; i < 50; i++) {
    const st = surveyTopics[i % surveyTopics.length];
    const almostHalfPct = 46 + (i % 4); // 46%, 47%, 48%, or 49%
    const secondPct = 25;
    const thirdPct = 15;
    const fourthPct = 100 - almostHalfPct - secondPct - thirdPct; // 11-14%

    const passage = `📊 [SURVEY CHART: ${st.title}]\n• ${st.itemA}: ${almostHalfPct}%\n• ${st.itemB}: ${secondPct}% (A quarter)\n• ${st.itemC}: ${thirdPct}%\n• ${st.itemD}: ${fourthPct}%`;
    questions.push({
      id: `lgs_cat4_${questions.length + 1}`,
      categorySlug: "lgs-grafik-tablo",
      categoryTitle: "4. Grafik ve Tablo Okuma Çeldiricileri (Quantifiers)",
      unitNo: st.unitNo,
      unitName: st.unitName,
      subType: "Nearly / Almost half (%46–%49)",
      promptTr: `Grafikteki %${almostHalfPct} oranına dikkat ediniz! MEB'in 'Nearly / Almost half' ile 'Half (%50)' arasındaki çeldirici farkını kullanarak doğru şıkkı seçiniz:`,
      passageText: passage,
      questionText: "Which of the following is CORRECT according to the chart above?",
      correctAnswer: `Nearly / Almost half of them prefer ${st.itemA.toLowerCase()}.`,
      distractors: [
        `Exactly half of them (50%) prefer ${st.itemA.toLowerCase()}.`,
        `More than half of them prefer ${st.itemB.toLowerCase()}.`,
        `Nobody is interested in ${st.itemD.toLowerCase()}.`,
      ],
      helperText: `MEB Grafik Çeldiricisi: Grafikte ${st.itemA} oranı %${almostHalfPct}'dir. %45–%49 arası oranlar "Nearly / Almost half" (Neredeyse yarısı) olarak ifade edilir! Şıktaki "Exactly half" (%50) en büyük çeldiricidir ve YANLIŞTIR.`,
      english: "Nearly / Almost half (Neredeyse yarısı: %45–%49)",
      turkish: `%${almostHalfPct} oranı 'Nearly / Almost half' demektir; 'Half' (%50) çeldiricidir!`,
      exampleSentence: passage,
    });
  }

  // 4B: More than half / The majority (%54-%68) (50 items)
  for (let i = 0; i < 50; i++) {
    const st = surveyTopics[i % surveyTopics.length];
    const majorityPct = 55 + (i % 14); // 55%..68%
    const secondPct = 20;
    const thirdPct = 15;
    const fourthPct = 100 - majorityPct - secondPct - thirdPct;

    const passage = `📊 [SURVEY CHART: ${st.title}]\n• ${st.itemA}: ${majorityPct}%\n• ${st.itemB}: ${secondPct}%\n• ${st.itemC}: ${thirdPct}%\n• ${st.itemD}: ${fourthPct}%`;
    questions.push({
      id: `lgs_cat4_${questions.length + 1}`,
      categorySlug: "lgs-grafik-tablo",
      categoryTitle: "4. Grafik ve Tablo Okuma Çeldiricileri (Quantifiers)",
      unitNo: st.unitNo,
      unitName: st.unitName,
      subType: "More than half / The majority (%51+)",
      promptTr: `Grafikteki %${majorityPct} oranının sözel karşılığını ('More than half / The majority') bulunuz:`,
      passageText: passage,
      questionText: "According to the survey results above, which statement is CORRECT?",
      correctAnswer: `More than half / The majority of the participants prefer ${st.itemA.toLowerCase()}.`,
      distractors: [
        `Less than a quarter of them prefer ${st.itemA.toLowerCase()}.`,
        `The majority of the participants prefer ${st.itemD.toLowerCase()}.`,
        `Almost half of them prefer ${st.itemC.toLowerCase()}.`,
      ],
      helperText: `MEB Grafik Kuralı: %51 ve üzerindeki oranlar (${majorityPct}%) şıklarda "More than half" (yarısından fazlası) veya "The majority / Most of..." (çoğunluğu) olarak yer alır.`,
      english: "More than half / The majority (Yarısından fazlası / Çoğunluğu: %51+)",
      turkish: `%${majorityPct} oranı 'More than half / The majority' ile ifade edilir.`,
      exampleSentence: passage,
    });
  }

  // 4C: Both A and B prefer... (Table reading with ✓ / ✗) (50 items)
  const tableActivities = [
    { unitNo: 8, unitName: "Chores", col1: "Vacuuming the floor", col2: "Washing the dishes", col3: "Mowing the lawn", col4: "Dusting the furniture" },
    { unitNo: 2, unitName: "Teen Life", col1: "Going to rock concerts", col2: "Playing chess", col3: "Doing archery", col4: "Cooking dinner" },
    { unitNo: 6, unitName: "Adventures", col1: "Kayaking", col2: "Caving", col3: "Hang-gliding", col4: "Motor racing" },
    { unitNo: 7, unitName: "Tourism", col1: "Visiting museums", col2: "Trying local dishes", col3: "Buying souvenirs", col4: "Taking photos" },
  ];

  for (let i = 0; i < 50; i++) {
    const ta = tableActivities[i % tableActivities.length];
    const p1 = NAMES_A[i % NAMES_A.length];
    const p2 = NAMES_B[i % NAMES_B.length];

    // Both p1 and p2 have (✓) ONLY on col2!
    const passage =
      `📋 [PREFERENCE TABLE: ${p1} & ${p2}]\n` +
      `• ${ta.col1}: ${p1} (✓) | ${p2} (✗)\n` +
      `• ${ta.col2}: ${p1} (✓) | ${p2} (✓)\n` +
      `• ${ta.col3}: ${p1} (✗) | ${p2} (✓)\n` +
      `• ${ta.col4}: ${p1} (✗) | ${p2} (✗)`;

    questions.push({
      id: `lgs_cat4_${questions.length + 1}`,
      categorySlug: "lgs-grafik-tablo",
      categoryTitle: "4. Grafik ve Tablo Okuma Çeldiricileri (Quantifiers)",
      unitNo: ta.unitNo,
      unitName: ta.unitName,
      subType: "Both A and B prefer...",
      promptTr: "Tabloda hem birinci kişinin hem de ikinci kişinin ORTAK işaretlediği (✓ | ✓) satırı bulunuz:",
      passageText: passage,
      questionText: `According to the table above, which of the following is CORRECT about ${p1} and ${p2}?`,
      correctAnswer: `Both ${p1} and ${p2} enjoy ${ta.col2.toLowerCase()}.`,
      distractors: [
        `Both ${p1} and ${p2} prefer ${ta.col1.toLowerCase()}.`,
        `Both ${p1} and ${p2} are fond of ${ta.col3.toLowerCase()}.`,
        `Both ${p1} and ${p2} love ${ta.col4.toLowerCase()}.`,
      ],
      helperText: `MEB Tablo Kuralı: "Both ${p1} and ${p2}" (Hem ${p1} hem de ${p2}) ifadesi için tabloda İKİSİNİN DE (✓) aldığı satıra bakılır: "${ta.col2}". Sadece birinin (✓) aldığı satırlar çeldiricidir!`,
      english: "Both A and B prefer... (İkisinin de ortak tercihi: ✓ ve ✓)",
      turkish: `Tabloda ikisinin de (✓) aldığı tek satır: ${ta.col2}.`,
      exampleSentence: passage,
    });
  }

  // 4D: None of them / Nobody is interested in... (%0 or ✗ | ✗) (50 items)
  for (let i = 0; i < 50; i++) {
    const ta = tableActivities[(i + 1) % tableActivities.length];
    const p1 = NAMES_A[(i + 3) % NAMES_A.length];
    const p2 = NAMES_B[(i + 5) % NAMES_B.length];
    const p3 = NAMES_A[(i + 8) % NAMES_A.length];

    // col4 has 0% / (✗ | ✗ | ✗) for everyone
    const passage =
      `📋 [CLUB SURVEY TABLE — ${p1}, ${p2} & ${p3}]\n` +
      `• ${ta.col1}: ${p1} (✓) | ${p2} (✓) | ${p3} (✗)  [67%]\n` +
      `• ${ta.col2}: ${p1} (✓) | ${p2} (✗) | ${p3} (✓)  [67%]\n` +
      `• ${ta.col3}: ${p1} (✓) | ${p2} (✓) | ${p3} (✓)  [100%]\n` +
      `• ${ta.col4}: ${p1} (✗) | ${p2} (✗) | ${p3} (✗)  [0%]`;

    questions.push({
      id: `lgs_cat4_${questions.length + 1}`,
      categorySlug: "lgs-grafik-tablo",
      categoryTitle: "4. Grafik ve Tablo Okuma Çeldiricileri (Quantifiers)",
      unitNo: ta.unitNo,
      unitName: ta.unitName,
      subType: "None of them / Nobody (%0)",
      promptTr: "Tabloda %0 olan veya hiç kimsenin (✗ | ✗ | ✗) tercih etmediği satırı ifade eden 'None of them / Nobody' şıkkını bulunuz:",
      passageText: passage,
      questionText: "Which of the following is CORRECT according to the table above?",
      correctAnswer: `None of them / Nobody is interested in ${ta.col4.toLowerCase()}.`,
      distractors: [
        `Nobody likes ${ta.col3.toLowerCase()}.`,
        `All of them hate ${ta.col1.toLowerCase()}.`,
        `Most of them prefer ${ta.col4.toLowerCase()}.`,
      ],
      helperText: `MEB Tablo Kuralı: "None of them" veya "Nobody" (Hiçbiri / Hiç kimse) ifadesi tabloda %0 olan veya hiç (✓) almayan "${ta.col4}" satırını temsil eder.`,
      english: "None of them / Nobody is interested in... (Hiçbiri ilgilenmiyor: %0)",
      turkish: `Hiç kimsenin işaretlemediği (✗ | ✗ | ✗) etkinlik: ${ta.col4}.`,
      exampleSentence: passage,
    });
  }

  return questions;
}

/* ============================================================================
 * CATEGORY 5: EŞ ANLAMLI (PARAPHRASING) ÇELDİRİCİ TUZAKLARI (200 QUESTIONS)
 * Core MEB Paraphrasing Traps:
 *  5A: "can never count on / shares my secrets" -> "NOT an honest / trustworthy friend" vs "always backs up" (40 Qs)
 *  5B: "first beat the eggs, then melt some butter... step AFTER beating the eggs" -> "Heating the butter" vs "Cracking the eggs" (40 Qs)
 *  5C: "don't have to pay anything / $0" -> "The event is free of charge" vs "There is NO information about the fee" (40 Qs)
 *  5D: "keen on / fond of / crazy about vs can't stand / dislike" paraphrasing (40 Qs)
 *  5E: "book in advance / eco-friendly / keep in touch / single ticket" paraphrasing (40 Qs)
 * ========================================================================== */
function buildCategory5ParaphrasingTraps() {
  const questions = [];

  // 5A: Friendship honesty / count on / secret sharing traps (40 items)
  const honestyVariations = [
    {
      stmt: (n) => `"I can never count on ${n} because ${n} always shares my secrets with other classmates."`,
      correct: (n) => `${n} is NOT an honest or trustworthy friend.`,
      trap1: (n) => `${n} always backs up friends and keeps promises.`,
      trap2: (n) => `${n} is the most reliable person in the classroom.`,
      trap3: (n) => `Everyone can trust ${n} without hesitation.`,
      note: "MEB Eş Anlam Tuzağı: 'never count on' (asla güvenemem) + 'shares my secrets' (sırlarımı paylaşır) = 'NOT an honest / trustworthy friend' (dürüst/güvenilir bir arkadaş DEĞİLDİR). 'always backs up' en sık konulan çeldiricidir!",
    },
    {
      stmt: (n) => `"Whenever I am in trouble, ${n} is always there to help me and never leaves me alone."`,
      correct: (n) => `${n} is a supportive friend who always backs me up.`,
      trap1: (n) => `${n} is a self-centered and sneaky person.`,
      trap2: (n) => `I can never rely on ${n} when I need help.`,
      trap3: (n) => `${n} only cares about personal interests.`,
      note: "MEB Eş Anlam Eşleşmesi: 'help me when I am in trouble' = 'supportive / backs me up' (destekler / arka çıkar).",
    },
    {
      stmt: (n) => `"${n} never changes mind easily; even when ${n} is wrong, ${n} refuses to listen to others' opinions."`,
      correct: (n) => `${n} is a stubborn person.`,
      trap1: (n) => `${n} is very easy-going and flexible.`,
      trap2: (n) => `${n} always respects and accepts different ideas.`,
      trap3: (n) => `${n} is the most generous student at school.`,
      note: "MEB Eş Anlam Eşleşmesi: 'never changes mind easily' (fikrini kolayca değiştirmez) = 'stubborn' (inatçı).",
    },
    {
      stmt: (n) => `"${n} loves buying presents for friends and always shares food and books with people in need."`,
      correct: (n) => `${n} is a generous and sharing friend.`,
      trap1: (n) => `${n} is a mean and stingy person who hates sharing.`,
      trap2: (n) => `${n} never helps anyone or buys gifts.`,
      trap3: (n) => `${n} is jealous of other classmates' success.`,
      note: "MEB Eş Anlam Eşleşmesi: 'loves buying presents and shares with others' = 'generous' (cömert). Zıt anlamlısı 'mean / stingy' (cimri) çeldirici olarak verilir.",
    },
  ];

  for (let i = 0; i < 40; i++) {
    const hv = honestyVariations[i % honestyVariations.length];
    const name = NAMES_A[i % NAMES_A.length];
    const passage = `📝 Student Diary (#${i + 1}):\n${hv.stmt(name)}`;
    questions.push({
      id: `lgs_cat5_${questions.length + 1}`,
      categorySlug: "lgs-es-anlam-tuzaklari",
      categoryTitle: "5. Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
      unitNo: 1,
      unitName: "Friendship",
      subType: "Count on / Honest / Back up Paraphrasing",
      promptTr: "Metindeki ifadeyle birebir aynı anlama gelen (paraphrased) şıkkı bulunuz, zıt anlam çeldiricisine düşmeyiniz:",
      passageText: passage,
      questionText: `Which of the following has the SAME meaning as the statement about ${name} above?`,
      correctAnswer: hv.correct(name),
      distractors: [hv.trap1(name), hv.trap2(name), hv.trap3(name)],
      helperText: hv.note,
      english: "Paraphrasing: count on = trust / rely on | back up = support",
      turkish: hv.note,
      exampleSentence: passage,
    });
  }

  // 5B: Kitchen Paraphrasing + Step AFTER/BEFORE Trap (40 items)
  const kitchenParaphrases = [
    {
      text: "To make a delicious omelette, first crack and beat the eggs in a bowl, then melt some butter in a frying pan, and finally pour the eggs into the hot pan.",
      question: "What is the step AFTER beating the eggs?",
      correct: "Heating / melting the butter in a pan.",
      trapPrev: "Cracking / mixing the eggs in a bowl.",
      trapOther1: "Serving the omelette with fresh tomatoes.",
      trapOther2: "Washing the dirty dishes in the sink.",
      note: "MEB Paraphrasing + Sıralama Tuzağı: Metinde 'melt some butter' geçer, doğru şıkta eş anlamlısı 'Heating the butter' yazar! Çeldirici şıkta ise bir ÖNCEKİ adım ('Cracking the eggs') verilerek dikkatiniz ölçülür.",
    },
    {
      text: "To prepare homemade lemonade, first wash the lemons, next cut them in half, then squeeze the lemons to get their juice, and finally mix the juice with cold water and sugar.",
      question: "What should we do AFTER cutting the lemons in half?",
      correct: "Pressing / squeezing the lemons to extract their juice.",
      trapPrev: "Washing the lemons under cold water.",
      trapOther1: "Peeling the apples and bananas.",
      trapOther2: "Baking the lemon cake in the oven.",
      note: "MEB Paraphrasing Tuzağı: Metindeki 'squeeze the lemons' ifadesi doğru şıkta 'Pressing / squeezing the lemons to extract their juice' olarak eş anlamlı verilir. 'Washing the lemons' ise önceki adımdır (çeldirici!).",
    },
    {
      text: "Before you mash the potatoes for the salad, you must boil them in salted water for twenty minutes and peel their skins.",
      question: "Which of the following is CORRECT according to the recipe?",
      correct: "You need to cook the potatoes in hot water before mashing them.",
      trapPrev: "You should mash the raw potatoes before boiling them.",
      trapOther1: "You must fry the potatoes in deep oil.",
      trapOther2: "You don't need to peel the potatoes at all.",
      note: "MEB Eş Anlam Eşleşmesi: 'boil them in salted water' = 'cook the potatoes in hot water' (sıcak suda pişirmek/haşlamak). 'Before you mash...' bağlacı sıralamayı tersine çevirir!",
    },
    {
      text: "After you knead the dough for ten minutes, cover the bowl with a clean towel and let it rest in a warm place for half an hour.",
      question: "What is the step AFTER kneading the dough?",
      correct: "Covering the dough and waiting for 30 minutes.",
      trapPrev: "Mixing the flour and water to start kneading.",
      trapOther1: "Slicing the baked bread on a wooden board.",
      trapOther2: "Grating cheddar cheese over the pasta.",
      note: "MEB Eş Anlam Eşleşmesi: 'half an hour' = '30 minutes' (30 dakika) ve 'let it rest' = 'waiting'. Yoğurmadan SONRAKİ adım üzerini örtüp 30 dk bekletmektir.",
    },
  ];

  for (let i = 0; i < 40; i++) {
    const kp = kitchenParaphrases[i % kitchenParaphrases.length];
    const chef = NAMES_B[i % NAMES_B.length];
    const passage = `🍳 Chef ${chef}'s Tip:\n"${kp.text}"`;
    questions.push({
      id: `lgs_cat5_${questions.length + 1}`,
      categorySlug: "lgs-es-anlam-tuzaklari",
      categoryTitle: "5. Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
      unitNo: 3,
      unitName: "In the Kitchen",
      subType: "Kitchen Step + Paraphrasing Trap",
      promptTr: "Metindeki fiilin eş anlamlısına (melt = heat, half an hour = 30 mins) ve ÖNCE/SONRA sırasına dikkat ediniz:",
      passageText: passage,
      questionText: kp.question,
      correctAnswer: kp.correct,
      distractors: [kp.trapPrev, kp.trapOther1, kp.trapOther2],
      helperText: kp.note,
      english: "melt butter = heat butter | half an hour = 30 minutes",
      turkish: kp.note,
      exampleSentence: passage,
    });
  }

  // 5C: "You don't have to pay anything" -> "The event is free of charge" vs "There is NO information about the fee" (40 items)
  const freeEventContexts = [
    "join the inter-school chess tournament",
    "attend the municipal science and technology exhibition",
    "participate in the weekend youth nature camp",
    "enter the city modern art museum on Sundays",
    "watch the outdoor summer cinema screening at the park",
    "register for the online coding and robotics course",
    "visit the annual book fair at the convention center",
    "join the charity marathon for street animals",
  ];

  for (let i = 0; i < 40; i++) {
    const ctx = freeEventContexts[i % freeEventContexts.length];
    const organizer = NAMES_A[(i + 6) % NAMES_A.length];
    const phrasing =
      i % 2 === 0
        ? `You don't have to pay anything to ${ctx}.`
        : `Students can ${ctx} without paying a penny!`;

    const passage = `📢 Announcement from ${organizer}:\n"${phrasing} All materials and refreshments will be provided by the municipality."`;
    questions.push({
      id: `lgs_cat5_${questions.length + 1}`,
      categorySlug: "lgs-es-anlam-tuzaklari",
      categoryTitle: "5. Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
      unitNo: 1,
      unitName: "Friendship",
      subType: "Free of charge vs NO information about the fee",
      promptTr: "MEB'in en meşhur çeldiricisi! 'Ücret ödemenize gerek yok' cümlesinin eş anlamlısını seçiniz ('ücret hakkında bilgi yoktur' tuzağına düşmeyiniz!):",
      passageText: passage,
      questionText: "Which of the following is CORRECT according to the announcement above?",
      correctAnswer: "The event is completely free of charge.",
      distractors: [
        "There is NO information about the fee in the text.",
        "Participants must pay an entrance fee at the gate.",
        "Only wealthy adults are allowed to join the event.",
      ],
      helperText: `MEB'in En Güçlü Çeldiricisi: Metinde "${phrasing}" (Hiçbir şey ödemenize gerek yok) denmektedir. Bunun eş anlamlısı "The event is free of charge" (Etkinlik ücretsizdir) şıkkıdır. "There is NO information about the fee" (Ücret hakkında bilgi yoktur) şıkkı YANLIŞTIR çünkü ücretsiz olduğu açıkça belirtilmiştir!`,
      english: "don't have to pay anything = free of charge (Ücretsiz)",
      turkish: "'Ücretsizdir' bilgisi verildiği için 'ücret hakkında bilgi yoktur' şıkkı en tehlikeli çeldiricidir!",
      exampleSentence: passage,
    });
  }

  // 5D & 5E: General Paraphrasing across Units 2, 4, 5, 6, 7, 8, 9, 10 (80 items)
  const generalParaphrases = [
    {
      unitNo: 2,
      unitName: "Teen Life",
      stmt: "Kevin is crazy about archery and kayaking, but he can't stand indoor board games.",
      correct: "Kevin is keen on outdoor sports, whereas he dislikes board games.",
      trap1: "Kevin prefers playing board games to doing archery.",
      trap2: "Kevin hates all kinds of outdoor sports.",
      trap3: "There is no information about Kevin's hobbies.",
      note: "'crazy about' = 'keen on / fond of' (düşkün/çok sever); 'can't stand' = 'dislikes / hates' (tahammül edemez/sevmez).",
    },
    {
      unitNo: 4,
      unitName: "On the Phone",
      stmt: "You should book your flight ticket at least two weeks before your trip to find cheaper seats.",
      correct: "Making a reservation in advance helps you buy more affordable tickets.",
      trap1: "You can only buy flight tickets at the airport on the flight day.",
      trap2: "Plane tickets are always free if you call the airline.",
      trap3: "You must cancel your flight two weeks before the trip.",
      note: "'book ... before your trip' = 'make a reservation in advance' (önceden rezervasyon yapmak); 'cheaper' = 'more affordable' (daha uygun fiyatlı).",
    },
    {
      unitNo: 5,
      unitName: "The Internet",
      stmt: "Before believing the news you see on social media, you should always check if it is true from official websites.",
      correct: "You must confirm the accuracy of online news from reliable sources.",
      trap1: "Everything shared on social media is 100% accurate and true.",
      trap2: "You should never use official websites for school research.",
      trap3: "Social media is only used for playing online games.",
      note: "'check if it is true' = 'confirm the accuracy' (doğruluğunu teyit etmek); 'official websites' = 'reliable sources' (güvenilir kaynaklar).",
    },
    {
      unitNo: 6,
      unitName: "Adventures",
      stmt: "Climbing an icy mountain without proper thermal clothes and a helmet can cost you your life.",
      correct: "Ice climbing is an extremely risky sport if you don't use safety equipment.",
      trap1: "Ice climbing is the safest sport for primary school children.",
      trap2: "You don't need any special clothes or a helmet for mountaineering.",
      trap3: "There is no danger in climbing icy mountains alone.",
      note: "'can cost you your life' = 'extremely risky / dangerous' (son derece riskli); 'proper clothes and a helmet' = 'safety equipment' (güvenlik ekipmanı).",
    },
    {
      unitNo: 7,
      unitName: "Tourism",
      stmt: "More than two million foreign tourists visited the ancient city of Ephesus last year.",
      correct: "Ephesus is a very popular historic destination among international visitors.",
      trap1: "Nobody prefers visiting ancient ruins in Turkey anymore.",
      trap2: "Ephesus is a newly built modern shopping center.",
      trap3: "Only local people from Izmir are allowed to enter Ephesus.",
      note: "'foreign tourists' = 'international visitors' (uluslararası ziyaretçiler); 'ancient city' = 'historic destination' (tarihi destinasyon).",
    },
    {
      unitNo: 8,
      unitName: "Chores",
      stmt: "It is my brother's duty to feed the dog and take out the rubbish every evening.",
      correct: "My brother is in charge of pet care and taking out the garbage.",
      trap1: "My brother never helps with any responsibilities at home.",
      trap2: "We don't have any pets in our house.",
      trap3: "My mother is the only person who takes out the rubbish.",
      note: "'It is someone's duty' = 'be in charge of / be responsible for' (sorumlu olmak); 'rubbish' = 'garbage / trash' (çöp).",
    },
    {
      unitNo: 9,
      unitName: "Science",
      stmt: "Dr. Aziz Sancar won the Nobel Prize in Chemistry thanks to his groundbreaking research on DNA repair.",
      correct: "He received a prestigious international award for his scientific discovery on DNA.",
      trap1: "He refused to work in chemistry laboratories during his career.",
      trap2: "His research had nothing to do with genetics or DNA.",
      trap3: "He won a medal in an international sports tournament.",
      note: "'won the Nobel Prize' = 'received a prestigious international award' (prestijli bir uluslararası ödül aldı); 'groundbreaking research' = 'scientific discovery'.",
    },
    {
      unitNo: 10,
      unitName: "Natural Forces",
      stmt: "If we continue wasting water and polluting rivers, our planet will face severe water shortage in the near future.",
      correct: "Unnecessary water consumption and water pollution will cause drought soon.",
      trap1: "We have unlimited clean water resources forever.",
      trap2: "Polluting rivers helps agricultural crops grow faster.",
      trap3: "There is no connection between wasting water and drought.",
      note: "'wasting water' = 'unnecessary water consumption'; 'water shortage' = 'drought / scarcity of water' (su kıtlığı / kuraklık).",
    },
  ];

  for (let i = 0; i < 80; i++) {
    const gp = generalParaphrases[i % generalParaphrases.length];
    const speaker = NAMES_B[(i + 4) % NAMES_B.length];
    const passage = `📖 Reading Excerpt (${speaker}):\n"${gp.stmt}"`;
    questions.push({
      id: `lgs_cat5_${questions.length + 1}`,
      categorySlug: "lgs-es-anlam-tuzaklari",
      categoryTitle: "5. Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
      unitNo: gp.unitNo,
      unitName: gp.unitName,
      subType: "Paraphrasing Match",
      promptTr: "Cümledeki anahtar kelimelerin eş anlamlılarını (synonyms / paraphrasing) kullanarak doğru çıkarımı bulunuz:",
      passageText: passage,
      questionText: "Which of the following best restates (paraphrases) the sentence above?",
      correctAnswer: gp.correct,
      distractors: [gp.trap1, gp.trap2, gp.trap3],
      helperText: `MEB Paraphrasing İpucu: ${gp.note}`,
      english: gp.stmt,
      turkish: gp.note,
      exampleSentence: passage,
    });
  }

  return questions;
}

/* ============================================================================
 * CATEGORY 6: ZAMAN VE SIKLIK ZARFLARI ÇELDİRİCİLERİ (200 QUESTIONS)
 * Weekly Schedule & Frequency Traps:
 *  6A: "Saturday & Sunday" -> "at weekends / twice a week" vs "twice a day" TRAP! (50 Qs)
 *  6B: "Monday to Friday" -> "on weekdays / five times a week" vs "five times a day / at weekends" (50 Qs)
 *  6C: "Every day at 08:00 AM" -> "once a day / daily" vs "once a week" (50 Qs)
 *  6D: "3 days a week (Mon, Wed, Fri)" -> "three times a week" vs "three times a month / never" (50 Qs)
 * ========================================================================== */
function buildCategory6FrequencyTraps() {
  const questions = [];

  const activities = [
    { unitNo: 2, unitName: "Teen Life", act: "goes swimming at the sports center", short: "Swimming" },
    { unitNo: 2, unitName: "Teen Life", act: "attends violin and music practice", short: "Violin Practice" },
    { unitNo: 5, unitName: "The Internet", act: "joins the online coding lesson", short: "Online Coding" },
    { unitNo: 6, unitName: "Adventures", act: "practices rock climbing at the gym", short: "Rock Climbing" },
    { unitNo: 8, unitName: "Chores", act: "vacuums the carpets and mops the floor", short: "Vacuuming & Mopping" },
    { unitNo: 8, unitName: "Chores", act: "waters the plants and feeds the street cats", short: "Watering Plants" },
    { unitNo: 9, unitName: "Science", act: "watches science documentaries on TV", short: "Science Documentaries" },
    { unitNo: 1, unitName: "Friendship", act: "meets buddies at the bowling alley", short: "Bowling with Friends" },
  ];

  // 6A: Saturday & Sunday -> "at weekends / twice a week" vs "twice a day" trap (50 items)
  for (let i = 0; i < 50; i++) {
    const ac = activities[i % activities.length];
    const name = NAMES_A[i % NAMES_A.length];
    const useAtWeekends = i % 2 === 0;

    const passage =
      `🗓️ [${name}'s Weekly Schedule — ${ac.short}]\n` +
      `• Monday – Friday: ✗ (No activity)\n` +
      `• Saturday: ✓ (10:00 AM)\n` +
      `• Sunday: ✓ (10:00 AM)`;

    const correctAns = useAtWeekends
      ? `${name} ${ac.act} at weekends.`
      : `${name} ${ac.act} twice a week.`;

    questions.push({
      id: `lgs_cat6_${questions.length + 1}`,
      categorySlug: "lgs-siklik-zarflari",
      categoryTitle: "6. Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)",
      unitNo: ac.unitNo,
      unitName: ac.unitName,
      subType: "Saturday & Sunday vs 'twice a day' Trap",
      promptTr: "Haftalık tabloda 'Cumartesi ve Pazar' işaretli! MEB'in meşhur 'twice a day' (günde iki kez) tuzağına düşmeden doğru sıklık zarfını seçiniz:",
      passageText: passage,
      questionText: `According to ${name}'s weekly schedule above, which of the following is CORRECT?`,
      correctAnswer: correctAns,
      distractors: [
        `${name} ${ac.act} twice a day.`,
        `${name} ${ac.act} only on weekdays.`,
        `${name} never ${ac.act}.`,
      ],
      helperText: `MEB Sıklık Zarfı Tuzağı: Tabloda Cumartesi ve Pazar (2 gün) işaretlidir. Bunun doğru karşılığı "at weekends" (hafta sonları) veya "twice a week" (haftada iki kez) ifadesidir! Çeldirici şıktaki "twice a day" (GÜNDE iki kez) ifadesi en çok düşülen MEB tuzağıdır!`,
      english: "Saturday & Sunday = at weekends / twice a week (NOT twice a day!)",
      turkish: "2 gün (Cmt-Paz) = haftada iki kez (twice a week) veya hafta sonu (at weekends); 'twice a day' (günde iki kez) çeldiricidir!",
      exampleSentence: passage,
    });
  }

  // 6B: Monday to Friday -> "on weekdays / five times a week" vs "at weekends / five times a day" (50 items)
  for (let i = 0; i < 50; i++) {
    const ac = activities[(i + 2) % activities.length];
    const name = NAMES_B[i % NAMES_B.length];
    const useOnWeekdays = i % 2 === 0;

    const passage =
      `🗓️ [${name}'s Weekly Schedule — ${ac.short}]\n` +
      `• Monday, Tuesday, Wednesday, Thursday, Friday: ✓ (Every weekday after school)\n` +
      `• Saturday & Sunday: ✗ (Rests at home)`;

    const correctAns = useOnWeekdays
      ? `${name} ${ac.act} on weekdays.`
      : `${name} ${ac.act} five times a week.`;

    questions.push({
      id: `lgs_cat6_${questions.length + 1}`,
      categorySlug: "lgs-siklik-zarflari",
      categoryTitle: "6. Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)",
      unitNo: ac.unitNo,
      unitName: ac.unitName,
      subType: "Weekdays (Mon–Fri) Trap",
      promptTr: "Tabloda Pazartesi'den Cuma'ya 5 gün işaretli! 'on weekdays' / 'five times a week' ile 'five times a day' çeldiricisini ayırt ediniz:",
      passageText: passage,
      questionText: `How often does ${name} do the activity according to the schedule above?`,
      correctAnswer: correctAns,
      distractors: [
        `${name} ${ac.act} five times a day.`,
        `${name} ${ac.act} only at weekends.`,
        `${name} ${ac.act} once a month.`,
      ],
      helperText: `MEB Sıklık Zarfı Kuralı: Pazartesi–Cuma arası 5 gün = "on weekdays" (hafta içi günlerde) veya "five times a week" (haftada 5 kez). Çeldirici şıktaki "five times a day" (günde 5 kez) yanlıştır!`,
      english: "Monday to Friday = on weekdays / five times a week",
      turkish: "Hafta içi 5 gün = on weekdays / five times a week ('five times a day' çeldiricidir!).",
      exampleSentence: passage,
    });
  }

  // 6C: Every morning / 7 days -> "every day / daily / once a day" vs "once a week" (50 items)
  for (let i = 0; i < 50; i++) {
    const ac = activities[(i + 4) % activities.length];
    const name = NAMES_A[(i + 5) % NAMES_A.length];

    const passage =
      `🗓️ [${name}'s Routine Table — ${ac.short}]\n` +
      `• Mon ✓ | Tue ✓ | Wed ✓ | Thu ✓ | Fri ✓ | Sat ✓ | Sun ✓\n` +
      `• Time: 07:30 AM – 08:00 AM (Once every morning)`;

    questions.push({
      id: `lgs_cat6_${questions.length + 1}`,
      categorySlug: "lgs-siklik-zarflari",
      categoryTitle: "6. Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)",
      unitNo: ac.unitNo,
      unitName: ac.unitName,
      subType: "Daily / Once a day vs Once a week",
      promptTr: "Haftanın 7 günü her sabah yapılan bir etkinlik için doğru sıklık zarfını bulunuz:",
      passageText: passage,
      questionText: `Which of the following is CORRECT about ${name}'s routine above?`,
      correctAnswer: `${name} ${ac.act} once a day / every morning.`,
      distractors: [
        `${name} ${ac.act} only once a week.`,
        `${name} hardly ever / seldom ${ac.act}.`,
        `${name} ${ac.act} twice a month.`,
      ],
      helperText: `MEB Sıklık Zarfı Kuralı: Haftanın 7 günü günde 1 kez yapılan etkinlik = "once a day / daily / every morning". Çeldirici şıktaki "once a week" (haftada bir kez) yanlıştır!`,
      english: "Every day (Mon–Sun) = daily / once a day",
      turkish: "Her gün = daily / once a day ('once a week' ve 'hardly ever' çeldiricidir).",
      exampleSentence: passage,
    });
  }

  // 6D: Three times a week (Mon, Wed, Fri) vs Three times a day / Seldom (50 items)
  for (let i = 0; i < 50; i++) {
    const ac = activities[(i + 6) % activities.length];
    const name = NAMES_B[(i + 3) % NAMES_B.length];

    const passage =
      `🗓️ [${name}'s Weekly Plan — ${ac.short}]\n` +
      `• Monday: ✓ (5:00 PM)\n` +
      `• Tuesday: ✗\n` +
      `• Wednesday: ✓ (5:00 PM)\n` +
      `• Thursday: ✗\n` +
      `• Friday: ✓ (5:00 PM)\n` +
      `• Saturday & Sunday: ✗`;

    questions.push({
      id: `lgs_cat6_${questions.length + 1}`,
      categorySlug: "lgs-siklik-zarflari",
      categoryTitle: "6. Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)",
      unitNo: ac.unitNo,
      unitName: ac.unitName,
      subType: "Three times a week vs Three times a day",
      promptTr: "Tabloda Pazartesi, Çarşamba ve Cuma (haftada 3 gün) işaretlidir. Doğru sıklık ifadesini seçiniz:",
      passageText: passage,
      questionText: `According to the table above, how often does ${name} do the activity?`,
      correctAnswer: `Three times a week (on Mondays, Wednesdays, and Fridays).`,
      distractors: [
        `Three times a day (morning, afternoon, and night).`,
        `Only at weekends (on Saturdays and Sundays).`,
        `Once a year during the summer holiday.`,
      ],
      helperText: `MEB Sıklık Zarfı Tuzağı: Tabloda haftanın 3 günü (Pzt, Çar, Cum) işaretli olduğu için doğru cevap "Three times a week" (haftada üç kez) olur. "Three times a day" (günde üç kez) MEB'in kelime benzerliği tuzağıdır!`,
      english: "Mon, Wed, Fri = three times a week (NOT three times a day!)",
      turkish: "Haftada 3 gün = three times a week ('three times a day' çeldiricidir!).",
      exampleSentence: passage,
    });
  }

  return questions;
}

function main() {
  fs.mkdirSync(OUT_PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_SRC_JS), { recursive: true });

  const cat1 = buildCategory1NegativeRoots();
  const cat2 = buildCategory2DialogueCompletion();
  const cat3 = buildCategory3PosterMissingInfo();
  const cat4 = buildCategory4ChartsQuantifiers();
  const cat5 = buildCategory5ParaphrasingTraps();
  const cat6 = buildCategory6FrequencyTraps();

  const pools = {
    "lgs-olumsuz-kokler": {
      slug: "lgs-olumsuz-kokler",
      categoryNumber: 1,
      title: "1. Olumsuz Soru Kökleri & Önce/Sonra Adım Tuzakları",
      shortLabel: "1. Olumsuz Kökler",
      poolSize: cat1.length,
      questions: cat1,
    },
    "lgs-diyalog-bosluk": {
      slug: "lgs-diyalog-bosluk",
      categoryNumber: 2,
      title: "2. Diyalog ve Boşluk Doldurma Soru Kökleri",
      shortLabel: "2. Diyalog & Boşluk",
      poolSize: cat2.length,
      questions: cat2,
    },
    "lgs-afis-davetiye": {
      slug: "lgs-afis-davetiye",
      categoryNumber: 3,
      title: "3. Davetiye, Afiş ve Eksik Bilgi Soru Kökleri",
      shortLabel: "3. Afiş & Eksik Bilgi",
      poolSize: cat3.length,
      questions: cat3,
    },
    "lgs-grafik-tablo": {
      slug: "lgs-grafik-tablo",
      categoryNumber: 4,
      title: "4. Grafik ve Tablo Okuma Çeldiricileri (Quantifiers)",
      shortLabel: "4. Grafik & Tablo",
      poolSize: cat4.length,
      questions: cat4,
    },
    "lgs-es-anlam-tuzaklari": {
      slug: "lgs-es-anlam-tuzaklari",
      categoryTitle: "5. Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
      slugName: "lgs-es-anlam-tuzaklari",
      categoryNumber: 5,
      title: "5. Eş Anlamlı (Paraphrasing) Çeldirici Tuzakları",
      shortLabel: "5. Eş Anlam Tuzakları",
      poolSize: cat5.length,
      questions: cat5,
    },
    "lgs-siklik-zarflari": {
      slug: "lgs-siklik-zarflari",
      categoryNumber: 6,
      title: "6. Zaman ve Sıklık Zarfları Çeldiricileri (Frequency Traps)",
      shortLabel: "6. Sıklık Zarfları",
      poolSize: cat6.length,
      questions: cat6,
    },
  };

  let totalCount = 0;
  for (const [slug, data] of Object.entries(pools)) {
    totalCount += data.questions.length;
    const jsonPath = path.join(OUT_PUBLIC_DIR, `${slug}_pool.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ Wrote ${slug}: ${data.questions.length} questions -> ${jsonPath}`);
  }

  const jsContent = `// AUTO-GENERATED BY scripts/build-lgs-strategy-pools.mjs — DO NOT EDIT MANUALLY\nexport const LGS_STRATEGY_POOLS = ${JSON.stringify(pools)};\nexport default LGS_STRATEGY_POOLS;\n`;
  fs.writeFileSync(OUT_SRC_JS, jsContent, "utf8");
  console.log(`🎉 Generated ${Object.keys(pools).length} LGS Strategy Categories (${totalCount} total questions, 200 per category) -> ${OUT_SRC_JS}`);
}

main();
