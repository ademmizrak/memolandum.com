"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Sparkles,
  Play,
  Zap,
  ChevronRight,
  Volume2,
  CheckCircle2,
  Trophy,
  RefreshCw,
} from "lucide-react";

const HERO_TRACKS = {
  tr: [
    {
      id: "general",
      label: "🇬🇧 Genel İngilizce",
      lang: "other-turkish-en_tr",
      level: "words_en_tr.json",
    },
    {
      id: "school",
      label: "🎒 1–8. Sınıf & LGS",
      lang: "en-tr_eng_ilkokul",
      level: "meb-4-sinif-kelimeleri",
    },
    {
      id: "exam",
      label: "🎯 YDS & YKS-DİL",
      lang: "en-tr_eng_yds_kelimeleri",
      level: "yds_en_tr_b2_c2_001_100.json",
    },
    {
      id: "arabic",
      label: "🇸🇦 Arapça–İngilizce",
      lang: "other-arabic-ar_en",
      level: "a1_words.json",
    },
  ],
  en: [
    {
      id: "general",
      label: "🇬🇧 Core Vocabulary",
      lang: "other-turkish-en_tr",
      level: "words_en_tr.json",
    },
    {
      id: "school",
      label: "🎒 Grades 1–8",
      lang: "en-tr_eng_ilkokul",
      level: "meb-4-sinif-kelimeleri",
    },
    {
      id: "arabic",
      label: "🇸🇦 Arabic–English",
      lang: "other-arabic-ar_en",
      level: "a1_words.json",
    },
    {
      id: "portuguese",
      label: "🇧🇷 Portuguese–English",
      lang: "other-portugal-brpt_en",
      level: "words_brpt_en.json",
    },
  ],
  ar: [
    {
      id: "ar_a1",
      label: "🇸🇦 الإنجليزية للمبتدئين (A1)",
      lang: "other-arabic-ar_en",
      level: "a1_words.json",
    },
    {
      id: "ar_a2",
      label: "🚀 المستوى المتوسط (A2–B1)",
      lang: "other-arabic-ar_en",
      level: "a2_words.json",
    },
    {
      id: "ar_sents",
      label: "💬 الجمل اليومية",
      lang: "other-arabic-ar_en",
      level: "sentences_ar_en.json",
    },
  ],
  pt: [
    {
      id: "pt_a1",
      label: "🇧🇷 Inglês Iniciante (A1)",
      lang: "other-portugal-brpt_en",
      level: "words_brpt_en.json",
    },
    {
      id: "pt_sents",
      label: "💬 Frases em Inglês",
      lang: "other-portugal-brpt_en",
      level: "sentences_brpt_en.json",
    },
    {
      id: "school",
      label: "🎒 1º ao 8º Ano",
      lang: "en-tr_eng_ilkokul",
      level: "meb-4-sinif-kelimeleri",
    },
  ],
};

const MINI_CHALLENGE_META = {
  tr: {
    promptLabel: "CANLI OYUN ÖNİZLEMESİ · DOKUN & VUR!",
    question: "Bu kelimenin doğru anlamını vur:",
    successMsg: "🎯 TAM İSABET! +100 XP · Sıradaki kelime geliyor...",
    retryMsg: "⚡ Tekrar dene! Doğru hedefe dokun:",
    nextBtn: "🎲 Yeni Kelime",
  },
  en: {
    promptLabel: "LIVE GAME PREVIEW · TAP TO HIT!",
    question: "Tap the matching meaning target:",
    successMsg: "🎯 BULLSEYE! +100 XP · Loading next word...",
    retryMsg: "⚡ Try again! Tap the right target:",
    nextBtn: "🎲 Next Word",
  },
  ar: {
    promptLabel: "تجربة اللعب المباشر · المس الهدف الصحيح!",
    question: "اختر المعنى الصحيح لهذه الكلمة:",
    successMsg: "🎯 إصابة رائعة! +100 XP · الكلمة التالية...",
    retryMsg: "⚡ حاول مرة أخرى! المس المعنى الصحيح:",
    nextBtn: "🎲 كلمة جديدة",
  },
  pt: {
    promptLabel: "PRÉVIA AO VIVO · TOQUE NO ALVO CERTO!",
    question: "Toque no significado correto desta palavra:",
    successMsg: "🎯 NA MOSCA! +100 XP · Próxima palavra...",
    retryMsg: "⚡ Tente de novo! Toque no alvo correto:",
    nextBtn: "🎲 Nova Palavra",
  },
};

const MINI_CHALLENGE_POOLS = {
  tr: [
    { word: "DISCOVER", phonetic: "/dɪˈskʌv.ər/", correct: "Keşfetmek", wrong: ["Gizlemek", "Unutmak"] },
    { word: "ADVENTURE", phonetic: "/ədˈven.tʃər/", correct: "Macera", wrong: ["Sessizlik", "Ödev"] },
    { word: "ACHIEVE", phonetic: "/əˈtʃiːv/", correct: "Başarmak", wrong: ["Vazgeçmek", "Ertelemek"] },
    { word: "CURIOUS", phonetic: "/ˈkjʊə.ri.əs/", correct: "Meraklı", wrong: ["Yorgun", "Karanlık"] },
    { word: "BRILLIANT", phonetic: "/ˈbrɪl.jənt/", correct: "Parlak / Harika", wrong: ["Sıradan", "Yavaş"] },
    { word: "PROTECT", phonetic: "/prəˈtekt/", correct: "Korumak", wrong: ["Kırmak", "Kaybetmek"] },
    { word: "CONFIDENT", phonetic: "/ˈkɒn.fɪ.dənt/", correct: "Öz güvenli", wrong: ["Kararsız", "Uykulu"] },
    { word: "IMAGINE", phonetic: "/ɪˈmædʒ.ɪn/", correct: "Hayal etmek", wrong: ["Silmek", "Kapatmak"] },
    { word: "JOURNEY", phonetic: "/ˈdʒɜː.ni/", correct: "Yolculuk", wrong: ["Fırtına", "Mutfak"] },
    { word: "PREPARE", phonetic: "/prɪˈpeər/", correct: "Hazırlanmak", wrong: ["Gecikmek", "Saklanmak"] },
    { word: "COURAGE", phonetic: "/ˈkʌr.ɪdʒ/", correct: "Cesaret", wrong: ["Korku", "Şüphe"] },
    { word: "INVENT", phonetic: "/ɪnˈvent/", correct: "İcat etmek", wrong: ["Kopyalamak", "Bozmak"] },
    { word: "GENEROUS", phonetic: "/ˈdʒen.ər.əs/", correct: "Cömert", wrong: ["Cimri", "Aceleci"] },
    { word: "EXPLORE", phonetic: "/ɪkˈsplɔːr/", correct: "Araştırmak / Gezmek", wrong: ["Beklemek", "Susmak"] },
    { word: "SCIENTIST", phonetic: "/ˈsaɪən.tɪst/", correct: "Bilim insanı", wrong: ["Yolcu", "Komşu"] },
    { word: "ENVIRONMENT", phonetic: "/ɪnˈvaɪ.rən.mənt/", correct: "Çevre / Doğa", wrong: ["Toplantı", "Bilet"] },
    { word: "DECISION", phonetic: "/dɪˈsɪʒ.ən/", correct: "Karar", wrong: ["Bahane", "Tatil"] },
    { word: "IMPROVE", phonetic: "/ɪmˈpruːv/", correct: "Geliştirmek", wrong: ["Azaltmak", "Durdurmak"] },
    { word: "HONEST", phonetic: "/ˈɒn.ɪst/", correct: "Dürüst", wrong: ["Kızgın", "Gürültülü"] },
    { word: "VALUABLE", phonetic: "/ˈvæl.jə.bəl/", correct: "Değerli", wrong: ["Gereksiz", "Ucuz"] },
    { word: "CELEBRATE", phonetic: "/ˈsel.ə.breɪt/", correct: "Kutlamak", wrong: ["Tartışmak", "Şikayet etmek"] },
    { word: "KNOWLEDGE", phonetic: "/ˈnɒl.ɪdʒ/", correct: "Bilgi", wrong: ["Tahmin", "Gölge"] },
    { word: "PATIENT", phonetic: "/ˈpeɪ.ʃənt/", correct: "Sabırlı", wrong: ["Telaşlı", "Dağınık"] },
    { word: "SUCCESS", phonetic: "/səkˈses/", correct: "Başarı", wrong: ["Engel", "Tesadüf"] },
  ],
  en: [
    { word: "RESILIENT", phonetic: "/rɪˈzɪl.i.ənt/", correct: "Strong & quick to recover", wrong: ["Fragile & temporary", "Silent & invisible"] },
    { word: "ELOQUENT", phonetic: "/ˈel.ə.kwənt/", correct: "Fluent & persuasive", wrong: ["Hesitant & vague", "Harsh & noisy"] },
    { word: "DILIGENT", phonetic: "/ˈdɪl.ɪ.dʒənt/", correct: "Hard-working & careful", wrong: ["Careless & lazy", "Sudden & brief"] },
    { word: "INEVITABLE", phonetic: "/ɪˈnev.ɪ.tə.bəl/", correct: "Certain to happen", wrong: ["Easy to avoid", "Rarely noticed"] },
    { word: "THRIVE", phonetic: "/θraɪv/", correct: "Grow & prosper", wrong: ["Shrink & fade", "Wait & hesitate"] },
    { word: "PROFOUND", phonetic: "/prəˈfaʊnd/", correct: "Deep & insightful", wrong: ["Shallow & trivial", "Fast & loud"] },
    { word: "MITIGATE", phonetic: "/ˈmɪt.ɪ.ɡeɪt/", correct: "Make less severe", wrong: ["Worsen rapidly", "Ignore completely"] },
    { word: "TENACIOUS", phonetic: "/təˈneɪ.ʃəs/", correct: "Persistent & determined", wrong: ["Quick to surrender", "Uncertain & shy"] },
  ],
  ar: [
    { word: "DISCOVER", phonetic: "/dɪˈskʌv.ər/", correct: "يَكْتَشِف", wrong: ["يَخْتَبِئ", "يَنْسَى"] },
    { word: "ADVENTURE", phonetic: "/ədˈven.tʃər/", correct: "مُغَامَرَة", wrong: ["هُدُوء", "وَاجِب"] },
    { word: "ACHIEVE", phonetic: "/əˈtʃiːv/", correct: "يُحَقِّق / يُنْجِز", wrong: ["يَسْتَسْلِم", "يُؤَجِّل"] },
    { word: "CONFIDENT", phonetic: "/ˈkɒn.fɪ.dənt/", correct: "وَاثِق بِنَفْسِهِ", wrong: ["مُتَرَدِّد", "غَاضِب"] },
    { word: "PROTECT", phonetic: "/prəˈtekt/", correct: "يَحْمِي", wrong: ["يَكْسِر", "يَفْقِد"] },
    { word: "IMPROVE", phonetic: "/ɪmˈpruːv/", correct: "يُحَسِّن / يُطَوِّر", wrong: ["يُقَلِّل", "يَتَوَقَّف"] },
    { word: "KNOWLEDGE", phonetic: "/ˈnɒl.ɪdʒ/", correct: "مَعْرِفَة", wrong: ["ظِلّ", "صُدْفَة"] },
    { word: "SUCCESS", phonetic: "/səkˈses/", correct: "نَجَاح", wrong: ["عَقَبَة", "خَوْف"] },
  ],
  pt: [
    { word: "DISCOVER", phonetic: "/dɪˈskʌv.ər/", correct: "Descobrir", wrong: ["Esconder", "Esquecer"] },
    { word: "ADVENTURE", phonetic: "/ədˈven.tʃər/", correct: "Aventura", wrong: ["Silêncio", "Tarefa"] },
    { word: "ACHIEVE", phonetic: "/əˈtʃiːv/", correct: "Alcançar / Conquistar", wrong: ["Desistir", "Adiar"] },
    { word: "CONFIDENT", phonetic: "/ˈkɒn.fɪ.dənt/", correct: "Confiante", wrong: ["Indeciso", "Cansado"] },
    { word: "PROTECT", phonetic: "/prəˈtekt/", correct: "Proteger", wrong: ["Quebrar", "Perder"] },
    { word: "IMPROVE", phonetic: "/ɪmˈpruːv/", correct: "Melhorar", wrong: ["Diminuir", "Parar"] },
    { word: "KNOWLEDGE", phonetic: "/ˈnɒl.ɪdʒ/", correct: "Conhecimento", wrong: ["Sombra", "Acaso"] },
    { word: "SUCCESS", phonetic: "/səkˈses/", correct: "Sucesso", wrong: ["Obstáculo", "Medo"] },
  ],
};

function buildChallengeItem(rawItem, order = [0, 1, 2]) {
  const baseOptions = [
    { id: "a", text: rawItem.correct, correct: true },
    { id: "b", text: rawItem.wrong[0], correct: false },
    { id: "c", text: rawItem.wrong[1], correct: false },
  ];
  return {
    word: rawItem.word,
    phonetic: rawItem.phonetic,
    options: order.map((idx) => baseOptions[idx]),
  };
}

const FEATURED_GAMES = [
  {
    slug: "shooter",
    icon: "🚀",
    tag: "AKSİYON",
    tagEn: "ACTION",
    tagAr: "أكشن",
    tagPt: "AÇÃO",
    title: {
      tr: "Uzay Avcısı (Shooter)",
      en: "Retro Space Shooter",
      ar: "صائد الفضاء (Shooter)",
      pt: "Caçador Espacial",
    },
    desc: {
      tr: "Meteordaki doğru anlamı lazerle vur!",
      en: "Shoot the meteor with the right meaning!",
      ar: "أطلق الليزر على المعنى الصحيح!",
      pt: "Atire no meteoro com o significado certo!",
    },
    gradient: "from-violet-600/35 via-indigo-900/70 to-slate-950",
    border: "border-violet-400/50 hover:border-violet-300",
    pillBg: "bg-violet-500/25 text-violet-200 border-violet-400/40",
    ctaBg: "bg-violet-500 hover:bg-violet-400 text-slate-950",
  },
  {
    slug: "star-cards",
    icon: "⭐",
    tag: "POPÜLER",
    tagEn: "POPULAR",
    tagAr: "شائع",
    tagPt: "POPULAR",
    title: {
      tr: "Yıldız Kartlar",
      en: "Star Trio Cards",
      ar: "بطاقات النجوم الثلاث",
      pt: "Cartões Estelares",
    },
    desc: {
      tr: "3 renkli karttan doğru kelimeyi seç, yıldızları patlat!",
      en: "Pick the right card & burst the stars!",
      ar: "اختر البطاقة الصحيحة وفجّر النجوم!",
      pt: "Escolha o cartão certo e estoure estrelas!",
    },
    gradient: "from-amber-500/30 via-amber-950/65 to-slate-950",
    border: "border-amber-400/55 hover:border-amber-300",
    pillBg: "bg-amber-500/25 text-amber-200 border-amber-400/45",
    ctaBg: "bg-amber-400 hover:bg-amber-300 text-slate-950",
  },
  {
    slug: "word-board",
    icon: "🌳",
    tag: "SESLİ OYUN",
    tagEn: "AUDIO",
    tagAr: "صوتي",
    tagPt: "ÁUDIO",
    title: {
      tr: "Ahşap Kelime Panosu",
      en: "Wooden Word Board",
      ar: "لوحة الكلمات الخشبية",
      pt: "Quadro de Madeira",
    },
    desc: {
      tr: "Güneşli bahçede 8'li ahşap panoda kelime avla!",
      en: "Hunt audio words on the sunny 8-card board!",
      ar: "اصطد الكلمات الصوتية على اللوحة الخشبية!",
      pt: "Cace palavras com áudio no jardim!",
    },
    gradient: "from-emerald-600/30 via-emerald-950/65 to-slate-950",
    border: "border-emerald-400/50 hover:border-emerald-300",
    pillBg: "bg-emerald-500/25 text-emerald-200 border-emerald-400/45",
    ctaBg: "bg-emerald-400 hover:bg-emerald-300 text-slate-950",
  },
  {
    slug: "highway",
    icon: "🏎️",
    tag: "REFLEKS",
    tagEn: "SPEED",
    tagAr: "سرعة",
    tagPt: "VELOZ",
    title: {
      tr: "Otoyol Yarışı (Highway)",
      en: "Highway Survivor",
      ar: "سباق الطريق السريع",
      pt: "Corrida na Rodovia",
    },
    desc: {
      tr: "Doğru şeride geç, kelimeyi tam hızda yakala!",
      en: "Switch lanes & catch the right translation!",
      ar: "غيّر المسار والتقط الترجمة الصحيحة!",
      pt: "Mude de faixa e pegue a tradução certa!",
    },
    gradient: "from-cyan-600/30 via-sky-950/65 to-slate-950",
    border: "border-cyan-400/50 hover:border-cyan-300",
    pillBg: "bg-cyan-500/25 text-cyan-200 border-cyan-400/45",
    ctaBg: "bg-cyan-400 hover:bg-cyan-300 text-slate-950",
  },
  {
    slug: "word-snake",
    icon: "🐍",
    tag: "KLASİK",
    tagEn: "ARCADE",
    tagAr: "كلاسيك",
    tagPt: "ARCADE",
    title: {
      tr: "Kelime Yılanı (Snake)",
      en: "Retro Word Snake",
      ar: "ثعبان الكلمات",
      pt: "Cobrinha de Palavras",
    },
    desc: {
      tr: "Harfleri sırayla yiyerek kelimeyi tamamla!",
      en: "Eat the letters in order to spell the word!",
      ar: "التهم الحروف بالترتيب لتكوين الكلمة!",
      pt: "Coma as letras na ordem para formar a palavra!",
    },
    gradient: "from-lime-600/30 via-green-950/65 to-slate-950",
    border: "border-lime-400/50 hover:border-lime-300",
    pillBg: "bg-lime-500/25 text-lime-200 border-lime-400/45",
    ctaBg: "bg-lime-400 hover:bg-lime-300 text-slate-950",
  },
  {
    slug: "orbitlex",
    icon: "🪐",
    tag: "3D YENİ",
    tagEn: "3D NEW",
    tagAr: "جديد 3D",
    tagPt: "3D NOVO",
    title: {
      tr: "OrbitLex 3D",
      en: "OrbitLex 3D",
      ar: "مغامرة OrbitLex 3D",
      pt: "OrbitLex 3D",
    },
    desc: {
      tr: "Yörüngede süzül, eş ve zıt anlam kristallerini topla!",
      en: "Glide in orbit & collect synonym crystals!",
      ar: "حلّق في المدار واجمع بلورات المترادفات!",
      pt: "Voe em órbita e colete cristais de sinônimos!",
    },
    gradient: "from-fuchsia-600/30 via-purple-950/65 to-slate-950",
    border: "border-fuchsia-400/50 hover:border-fuchsia-300",
    pillBg: "bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400/45",
    ctaBg: "bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950",
  },
];

export default function ArcadeHeroBanner({
  locale = "tr",
  onScrollToAllGames,
  onOpenParentReport,
}) {
  const langKey = locale === "ar" ? "ar" : locale === "pt" ? "pt" : locale === "en" ? "en" : "tr";
  const isAr = langKey === "ar";
  const isPt = langKey === "pt";
  const isEn = langKey === "en";

  const tracks = HERO_TRACKS[langKey] || HERO_TRACKS.tr;
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const activeTrack = tracks[selectedTrackIdx] || tracks[0];

  const challengeMeta = MINI_CHALLENGE_META[langKey] || MINI_CHALLENGE_META.tr;
  const challengePool = MINI_CHALLENGE_POOLS[langKey] || MINI_CHALLENGE_POOLS.tr;

  const [wordIdx, setWordIdx] = useState(0);
  const [optionOrder, setOptionOrder] = useState([0, 1, 2]);
  const [pickedOptionId, setPickedOptionId] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);

  const pickNextRandomWord = useCallback(
    (poolLen = challengePool.length, currentIdx = -1) => {
      if (poolLen <= 1) {
        setWordIdx(0);
        setPickedOptionId(null);
        return;
      }
      let next = Math.floor(Math.random() * poolLen);
      if (next === currentIdx) {
        next = (next + 1 + Math.floor(Math.random() * (poolLen - 1))) % poolLen;
      }
      const shuffled = [0, 1, 2].sort(() => Math.random() - 0.5);
      setWordIdx(next);
      setOptionOrder(shuffled);
      setPickedOptionId(null);
    },
    [challengePool.length]
  );

  useEffect(() => {
    pickNextRandomWord(challengePool.length, -1);
  }, [langKey, challengePool.length, pickNextRandomWord]);

  const rawItem = challengePool[wordIdx % challengePool.length] || challengePool[0];
  const challenge = {
    ...challengeMeta,
    ...buildChallengeItem(rawItem, optionOrder),
  };

  const pickedOption = challenge.options.find((o) => o.id === pickedOptionId) || null;
  const isSolved = Boolean(pickedOption?.correct);

  useEffect(() => {
    if (!isSolved) return undefined;
    const timer = setTimeout(() => {
      pickNextRandomWord(challengePool.length, wordIdx);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isSolved, challengePool.length, wordIdx, pickNextRandomWord]);

  const buildGameUrl = (slug) => {
    if (slug === "orbitlex") {
      return `/games/orbitlex/?lang=${encodeURIComponent(activeTrack.lang)}&level=${encodeURIComponent(activeTrack.level)}`;
    }
    return `/games/${slug}/?lang=${encodeURIComponent(activeTrack.lang)}&level=${encodeURIComponent(activeTrack.level)}`;
  };

  return (
    <section
      aria-label={
        isAr
          ? "احفظ الكلمات باللعب في ١٦ لعبة أركيد تفاعلية"
          : isPt
            ? "Memorize palavras jogando 16 jogos arcade"
            : isEn
              ? "Memorize vocabulary by playing 16 fun arcade games"
              : "Eğlenceli oyunlarla kelime ezberleme platformu"
      }
      className="relative mb-6 rounded-3xl border-2 border-indigo-500/45 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-slate-900 p-4 sm:p-6 shadow-[0_12px_45px_rgba(79,70,229,0.28)] overflow-hidden"
    >
      {/* Arka plan hafif neon ışıma (Eski Android GPU dostu saf CSS) */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.45) 0%, rgba(0,0,0,0) 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(0,0,0,0) 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-5">
        {/* ÜST BÖLÜM: Radikal Oyun-Odaklı Değer Önerisi + Canlı Mini-Oyun Deneyimi */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          {/* Sol 7 Sütun: Net Mesaj + Birincil "Hemen Oyna" Butonları */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3.5 text-start">
            <div>
              {/* Üst Rozet Şeridi */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm">
                  <Gamepad2 className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden />
                  <span>
                    {isAr
                      ? "١٦ لعبة أركيد لتعلّم الكلمات · مجاناً ١٠٠٪"
                      : isPt
                        ? "16 JOGOS ARCADE DE VOCABULÁRIO · 100% GRÁTIS"
                        : isEn
                          ? "16 ARCADE VOCABULARY GAMES · 100% FREE"
                          : "16 EĞLENCELİ KELİME OYUNU · %100 ÜCRETSİZ"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/35">
                  <Sparkles className="w-3 h-3" aria-hidden />
                  <span>
                    {isAr
                      ? "بدون تسجيل · العب فوراً"
                      : isPt
                        ? "Sem cadastro · Jogue na hora"
                        : isEn
                          ? "No sign-up needed · Instant play"
                          : "Üyelik şartı yok · Dokun ve hemen oyna"}
                  </span>
                </span>
              </div>

              {/* Ana Radikal Başlık */}
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-white leading-[1.18] tracking-tight">
                {isAr ? (
                  <>
                    انسَ القوائم المملة:{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                      احفظ الكلمات باللعب والمتعة!
                    </span>
                  </>
                ) : isPt ? (
                  <>
                    Esqueça Listas Chatas:{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                      Memorize Palavras Jogando!
                    </span>
                  </>
                ) : isEn ? (
                  <>
                    Forget Boring Lists:{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                      Memorize Words by Playing Fun Games!
                    </span>
                  </>
                ) : (
                  <>
                    Sıkıcı Listeleri Unut:{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                      Oyun Oynayarak Kelime Ezberle!
                    </span>
                  </>
                )}
              </h1>

              {/* Kısa ve Vurucu Açıklama */}
              <p className="mt-2 text-xs sm:text-sm text-slate-200/95 font-medium leading-relaxed max-w-2xl">
                {isAr
                  ? "صوّب الليزر على المعنى الصحيح في الفضاء، أو فجّر بطاقات النجوم، أو قد سيارتك في المسار الصحيح! حوّل مفردات الإنجليزية و٢٣ لغة إلى ذاكرة دائمة في ٣٠ ثانية."
                  : isPt
                    ? "Atire no significado certo no espaço, estoure cartões estelares no jardim ou dirija na faixa certa! Transforme palavras em inglês e 23 idiomas em reflexo permanente."
                    : isEn
                      ? "Shoot the right meaning in space, burst Star Cards in the garden, or switch lanes on the highway! Turn 23 languages & school exams into permanent memory."
                      : "Uzayda doğru anlamı lazerle vur, bahçede Yıldız Kartları patlat, otoyolda doğru şeride geç veya yılanla harfleri topla! 1. sınıftan YDS'ye ve 23 dile kadar kelimeleri oyun oynarken kalıcı hafızana kazı."}
              </p>
            </div>

            {/* Hızlı Seviye / Hedef Seçici + Dev "Hemen Oyuna Başla" Aksiyon Barı */}
            <div className="pt-1 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-cyan-300 mr-1">
                  {isAr ? "🎯 اختر هدفك:" : isPt ? "🎯 Seu objetivo:" : isEn ? "🎯 Pick track:" : "🎯 Hedefini seç:"}
                </span>
                {tracks.map((trItem, idx) => {
                  const active = idx === selectedTrackIdx;
                  return (
                    <button
                      key={trItem.id}
                      type="button"
                      onClick={() => {
                        setSelectedTrackIdx(idx);
                        pickNextRandomWord(challengePool.length, wordIdx);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                        active
                          ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm shadow-cyan-500/30"
                          : "bg-slate-900/80 text-slate-300 border-slate-700/80 hover:border-cyan-400/50 hover:text-white"
                      }`}
                    >
                      {trItem.label}
                    </button>
                  );
                })}
              </div>

              {/* Ana Eylem Butonları */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <Link
                  href={buildGameUrl("star-cards")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base shadow-[0_6px_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" aria-hidden />
                  <span>
                    {isAr
                      ? "العب الآن (بدون تسجيل)"
                      : isPt
                        ? "JOGAR AGORA (GRÁTIS)"
                        : isEn
                          ? "PLAY NOW (1-TAP START)"
                          : "HEMEN OYNA (TEK DOKUNUŞ)"}
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3] rtl:rotate-180 shrink-0" />
                </Link>

                <button
                  type="button"
                  onClick={onScrollToAllGames}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-600/35 hover:bg-indigo-600/55 text-white border border-indigo-400/50 font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden />
                  <span>
                    {isAr
                      ? "تصفّح الـ ١٦ لعبة واللغات"
                      : isPt
                        ? "Ver Todos os 16 Jogos"
                        : isEn
                          ? "See All 16 Games & Languages"
                          : "16 Oyunun Tamamını Seç"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Sağ 5 Sütun: Etkileşimli "Dokun & Kelimeyi Vur" Canlı Mini-Oyun Kartı */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border-2 border-cyan-400/45 bg-slate-950/90 p-3.5 sm:p-4 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-hidden />
                <span>{challenge.promptLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                <Trophy className="w-3 h-3" aria-hidden />
                <span>{solvedCount > 0 ? `+${solvedCount * 100} XP` : isSolved ? "+100 XP" : "3 SN TEST"}</span>
              </span>
            </div>

            {/* Hedef Kelime Ekranı */}
            <div className="my-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {challenge.question}
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-wide text-white flex flex-wrap items-center gap-2 mt-0.5">
                  <span>🎯 {challenge.word}</span>
                  <span className="text-xs font-mono font-normal text-cyan-300/90">
                    {challenge.phonetic}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => pickNextRandomWord(challengePool.length, wordIdx)}
                  title={challenge.nextBtn}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-slate-200 text-[11px] font-extrabold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-300" aria-hidden />
                  <span className="hidden sm:inline">{challenge.nextBtn}</span>
                </button>
                <Link
                  href={buildGameUrl("shooter")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[11px] font-extrabold transition-all shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" aria-hidden />
                  <span>{isAr ? "في اللعبة" : isPt ? "No Jogo" : isEn ? "In Game" : "Tam Ekran"}</span>
                </Link>
              </div>
            </div>

            {/* 3 Etkileşimli Hedef Şık Butonu */}
            <div className="grid grid-cols-3 gap-2 my-1.5">
              {challenge.options.map((opt) => {
                const isPicked = pickedOptionId === opt.id;
                let btnStyle =
                  "bg-slate-900 hover:bg-indigo-950/90 text-white border-slate-700 hover:border-cyan-400/60";
                if (isPicked && opt.correct) {
                  btnStyle =
                    "bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-[1.03]";
                } else if (isPicked && !opt.correct) {
                  btnStyle = "bg-rose-900/70 text-rose-200 border-rose-400/60";
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (isSolved) return;
                      setPickedOptionId(opt.id);
                      if (opt.correct) {
                        setSolvedCount((prev) => prev + 1);
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl border-2 font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${btnStyle}`}
                  >
                    {isPicked && opt.correct && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Canlı Geri Bildirim & Tam Oyuna Geçiş */}
            <div className="mt-1 flex items-center justify-between gap-2 min-h-[28px]">
              {pickedOption ? (
                pickedOption.correct ? (
                  <div className="w-full flex items-center justify-between gap-2 bg-emerald-500/15 border border-emerald-400/40 rounded-lg px-2.5 py-1">
                    <span className="text-[11px] font-extrabold text-emerald-300">
                      {challenge.successMsg}
                    </span>
                    <Link
                      href={buildGameUrl("shooter")}
                      className="text-[11px] font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap"
                    >
                      {isAr ? "أكمل اللعب ←" : isPt ? "Continuar →" : isEn ? "Keep Playing →" : "Oyuna Devam Et →"}
                    </Link>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-amber-300">
                    {challenge.retryMsg}
                  </span>
                )
              ) : (
                <span className="text-[11px] text-slate-400">
                  {isAr
                    ? "👆 المس إحدى الإجابات أعلاه لتجربة سرعة التعلّم!"
                    : isPt
                      ? "👆 Toque em uma resposta acima para testar agora!"
                      : isEn
                        ? "👆 Tap one of the 3 targets above to try instant recall!"
                        : "👆 Yukarıdaki 3 hedeften birine dokun, oyun hızını hemen dene!"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ALT BÖLÜM: İlk Açılışta Doğrudan Görünen 6 Popüler Oyun Vitrini (Tek Dokunuşla Başlat) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                {isAr
                  ? "🕹️ اختر لعبتك المفضلة وابدأ فوراً:"
                  : isPt
                    ? "🕹️ ESCOLHA SEU JOGO FAVORITO E COMECE NA HORA:"
                    : isEn
                      ? "🕹️ PICK YOUR FAVORITE GAME & PLAY INSTANTLY:"
                      : "🕹️ FAVORİ OYUNUNU SEÇ, TEK DOKUNUŞLA HEMEN BAŞLA:"}
              </span>
            </div>
            <Link
              href="/games/"
              className="text-xs font-extrabold text-cyan-300 hover:text-white inline-flex items-center gap-1"
            >
              <span>
                {isAr
                  ? "كل الألعاب (16)"
                  : isPt
                    ? "Todos os 16 Jogos"
                    : isEn
                      ? "All 16 Games"
                      : "Tüm 16 Oyun"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          {/* Mobil 2 Sütun (360px ekranlarda bile 4-6 oyun anında görünür), Masaüstü 6 Sütun */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {FEATURED_GAMES.map((game) => {
              const titleText = game.title[langKey] || game.title.tr;
              const descText = game.desc[langKey] || game.desc.tr;
              const tagText =
                isAr ? game.tagAr : isPt ? game.tagPt : isEn ? game.tagEn : game.tag;
              return (
                <Link
                  key={game.slug}
                  href={buildGameUrl(game.slug)}
                  className={`group rounded-2xl border p-3 bg-gradient-to-b ${game.gradient} ${game.border} transition-all duration-200 hover:-translate-y-0.5 shadow-md flex flex-col justify-between gap-2 no-underline text-start`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden>
                        {game.icon}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${game.pillBg}`}
                      >
                        {tagText}
                      </span>
                    </div>
                    <div className="text-xs sm:text-[13px] font-black text-white group-hover:text-amber-200 leading-snug">
                      {titleText}
                    </div>
                    <p className="text-[11px] text-slate-300/90 leading-tight mt-1 line-clamp-2">
                      {descText}
                    </p>
                  </div>

                  <div
                    className={`mt-1 w-full py-1.5 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${game.ctaBg}`}
                  >
                    <Play className="w-3 h-3 fill-current shrink-0" aria-hidden />
                    <span>{isAr ? "العب" : isPt ? "Jogar" : isEn ? "Play" : "Oyna"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
