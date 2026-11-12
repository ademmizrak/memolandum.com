"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { gameManifest } from "../config/manifest";
import GameSelector from "./GameSelector";
import { ChevronLeft, Play, Zap, Video } from "lucide-react";
import { useMemolandumStore } from "../store/useMemolandumStore";
import { useStoreHydrated } from "../hooks/useStoreHydrated";
import { useLocale } from "../lib/i18n/LocaleProvider";
import {
  findLevelContext,
  getDefaultStudyContext,
  resolveResumeContext,
  hasSavedResume,
  formatResumeAge,
  gameDisplayName,
} from "../lib/learning/studyContext";
import { getSlugFromManifestLangId } from "../lib/seo/learnPathwayResolve";
import DueReviewCta from "./learning/DueReviewCta";
import { getPlaylistCategory } from "../lib/youtube/playlistCategory";

const MAIN_CATEGORY_LABELS = {
  "en-tr": { tr: "İngilizce-Türkçe", en: "English-Turkish", ar: "الإنجليزية - التركية", pt: "Inglês-Turco" },
  "other-langs": { tr: "Diğer Diller", en: "Other Languages", ar: "لغات أخرى", pt: "Outros Idiomas" },
};

const SUB_CATEGORY_LABELS = {
  "en-tr_eng_genel": { tr: "Genel İngilizce", en: "General English", ar: "الإنجليزية العامة", pt: "Inglês Geral" },
  "en-tr_eng_sinav_ozel": { tr: "Sınav Özel", en: "Exam Special", ar: "خاص بالاختبارات", pt: "Especial Exames" },
  "en-tr_eng_temel_cumleler": { tr: "Temel Cümleler", en: "Core Sentences", ar: "الجمل الأساسية", pt: "Frases Essenciais" },
  "en-tr_eng_yaz_cumleleri": { tr: "Yaz Cümleleri", en: "Summer Sentences", ar: "جمل الصيف", pt: "Frases de Verão" },
  "en-tr_eng_yds_kelimeleri": { tr: "YDS Kelimeleri", en: "YDS Vocabulary", ar: "مفردات YDS", pt: "Vocabulário YDS" },
  "en-tr_eng_yks_kelimeleri": { tr: "YKS Kelimeleri", en: "YKS Vocabulary", ar: "مفردات YKS", pt: "Vocabulário YKS" },
  "en-tr_eng_ilkokul": { tr: "İlkokul (1–4. Sınıf)", en: "Primary School (Grades 1–4)", ar: "الابتدائية (الصفوف 1–4)", pt: "Fundamental I (1º–4º Ano)" },
  "en-tr_eng_ortaokul": { tr: "Ortaokul (5–8. Sınıf / LGS)", en: "Middle School (Grades 5–8 / LGS)", ar: "المتوسطة (الصفوف 5–8)", pt: "Fundamental II (5º–8º Ano)" },
  "other-academic": { tr: "Akademik", en: "Academic", ar: "أكاديمي", pt: "Acadêmico" },
  "other-almanca-de_en": { tr: "Almanca - İngilizce", en: "German - English", ar: "الألمانية - الإنجليزية", pt: "Alemão - Inglês" },
  "other-almanca-de_tr": { tr: "Almanca - Türkçe", en: "German - Turkish", ar: "الألمانية - التركية", pt: "Alemão - Turco" },
  "other-arabic-ar_en": { tr: "Arapça - İngilizce", en: "Arabic - English", ar: "العربية - الإنجليزية", pt: "Árabe - Inglês" },
  "other-arabic-ar_tr": { tr: "Arapça - Türkçe", en: "Arabic - Turkish", ar: "العربية - التركية", pt: "Árabe - Turco" },
  "other-chinesee-zh_ch_en": { tr: "Çince - İngilizce", en: "Chinese - English", ar: "الصينية - الإنجليزية", pt: "Chinês - Inglês" },
  "other-chinesee-zh_ch_tr": { tr: "Çince - Türkçe", en: "Chinese - Turkish", ar: "الصينية - التركية", pt: "Chinês - Turco" },
  "other-french-fr_en": { tr: "Fransızca - İngilizce", en: "French - English", ar: "الفرنسية - الإنجليزية", pt: "Francês - Inglês" },
  "other-french-fr_tr": { tr: "Fransızca - Türkçe", en: "French - Turkish", ar: "الفرنسية - التركية", pt: "Francês - Turco" },
  "other-greek-el_en": { tr: "Yunanca - İngilizce", en: "Greek - English", ar: "اليونانية - الإنجليزية", pt: "Grego - Inglês" },
  "other-greek-el_tr": { tr: "Yunanca - Türkçe", en: "Greek - Turkish", ar: "اليونانية - التركية", pt: "Grego - Turco" },
  "other-italy-it_en": { tr: "İtalyanca - İngilizce", en: "Italian - English", ar: "الإيطالية - الإنجليزية", pt: "Italiano - Inglês" },
  "other-italy-it_tr": { tr: "İtalyanca - Türkçe", en: "Italian - Turkish", ar: "الإيطالية - التركية", pt: "Italiano - Turco" },
  "other-japan-jap_en": { tr: "Japonca - İngilizce", en: "Japanese - English", ar: "اليابانية - الإنجليزية", pt: "Japonês - Inglês" },
  "other-japan-jap_tr": { tr: "Japonca - Türkçe", en: "Japanese - Turkish", ar: "اليابانية - التركية", pt: "Japonês - Turco" },
  "other-korean-ko_en": { tr: "Korece - İngilizce", en: "Korean - English", ar: "الكورية - الإنجليزية", pt: "Coreano - Inglês" },
  "other-korean-ko_tr": { tr: "Korece - Türkçe", en: "Korean - Turkish", ar: "الكورية - التركية", pt: "Coreano - Turco" },
  "other-osm_tr": { tr: "Osmanlıca - Türkçe", en: "Ottoman - Turkish", ar: "العثمانية - التركية", pt: "Otomano - Turco" },
  "other-portugal-brpt_en": { tr: "Portekizce - İngilizce", en: "Portuguese - English", ar: "البرتغالية - الإنجليزية", pt: "Português - Inglês" },
  "other-portugal-brpt_tr": { tr: "Portekizce - Türkçe", en: "Portuguese - Turkish", ar: "البرتغالية - التركية", pt: "Português - Turco" },
  "other-russian-ru_en": { tr: "Rusça - İngilizce", en: "Russian - English", ar: "الروسية - الإنجليزية", pt: "Russo - Inglês" },
  "other-russian-ru_tr": { tr: "Rusça - Türkçe", en: "Russian - Turkish", ar: "الروسية - التركية", pt: "Russo - Turco" },
  "other-spanish-es_en": { tr: "İspanyolca - İngilizce", en: "Spanish - English", ar: "الإسبانية - الإنجليزية", pt: "Espanhol - Inglês" },
  "other-spanish-es_tr": { tr: "İspanyolca - Türkçe", en: "Spanish - Turkish", ar: "الإسبانية - التركية", pt: "Espanhol - Turco" },
};

const LEVEL_NAME_OVERRIDES = {
  "Beginner / Başlangıç Kelimeleri": {
    tr: "Başlangıç Kelimeleri (A1)",
    en: "Beginner Vocabulary (A1)",
    ar: "مفردات المبتدئين (A1)",
    pt: "Vocabulário Iniciante (A1)",
  },
  "Elementary / Temel Kelimeleri": {
    tr: "Temel Kelimeler (A2)",
    en: "Elementary Vocabulary (A2)",
    ar: "المفردات الأساسية (A2)",
    pt: "Vocabulário Básico (A2)",
  },
  "Intermediate / Orta Kelimeleri": {
    tr: "Orta Seviye Kelimeler (B1)",
    en: "Intermediate Vocabulary (B1)",
    ar: "مفردات المستوى المتوسط (B1)",
    pt: "Vocabulário Intermediário (B1)",
  },
  "Upper-Intermediate / Orta Üstü Kelimeleri": {
    tr: "Orta Üstü Kelimeler (B2)",
    en: "Upper-Intermediate Vocabulary (B2)",
    ar: "مفردات فوق المتوسط (B2)",
    pt: "Vocabulário Pós-Intermediário (B2)",
  },
  "Advanced / İleri Kelimeleri": {
    tr: "İleri Seviye Kelimeler (C1)",
    en: "Advanced Vocabulary (C1)",
    ar: "المفردات المتقدمة (C1)",
    pt: "Vocabulário Avançado (C1)",
  },
  "Proficient / Yetkin Kelimeleri": {
    tr: "Yetkin Seviye Kelimeler (C2)",
    en: "Proficient Vocabulary (C2)",
    ar: "مفردات الإتقان (C2)",
    pt: "Vocabulário Proficiente (C2)",
  },
};

export default function TabbedNavigator({ initialSlug }) {
  const { locale, t } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const langKey = isAr ? "ar" : isPt ? "pt" : isEn ? "en" : "tr";
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const lastPlayedLang = useMemolandumStore((s) => s.lastPlayedLang);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const lastPlayedGame = useMemolandumStore((s) => s.lastPlayedGame);
  const lastPlayedAt = useMemolandumStore((s) => s.lastPlayedAt);
  const setLastPlayed = useMemolandumStore((s) => s.setLastPlayed);
  const clearActiveCustomWords = useMemolandumStore((s) => s.clearActiveCustomWords);

  const resume = useMemo(
    () =>
      resolveResumeContext({
        lastPlayedLang,
        lastPlayedLevel,
        lastPlayedGame,
        lastPlayedAt,
      }),
    [lastPlayedLang, lastPlayedLevel, lastPlayedGame, lastPlayedAt]
  );

  const savedDesk = hasSavedResume(lastPlayedLevel, lastPlayedAt);
  const resumeAge = formatResumeAge(lastPlayedAt, t);
  const resumeGameLabel = gameDisplayName(resume.gameId);

  const defaults = getDefaultStudyContext();

  const [activeMainId, setActiveMainId] = useState(resume.mainId || defaults.mainId);
  const [activeSubId, setActiveSubId] = useState(resume.langId || defaults.langId);
  const [activeLevelId, setActiveLevelId] = useState(resume.levelId || defaults.levelId);
  const [activeGameId, setActiveGameId] = useState(resume.gameId || defaults.gameId);
  const [previousMainId, setPreviousMainId] = useState("");
  /** Seçim pin’i — main tab gezinmesi lastPlayed’i bozmasın */
  const [pinnedLevelId, setPinnedLevelId] = useState(resume.levelId || null);

  // Store rehydrate / cloud LWW sonrası UI’yı kanonik resume ile hizala.
  // Seviye seçilince setLastPlayed → resume güncellenir; bu effect "Oyun Seç"
  // sekmesini dil sekmesine geri çekmesin (kullanıcı orada mahsur kalmasın).
  useEffect(() => {
    if (!resume?.levelId) return;
    setActiveMainId((prev) => (prev === "game" ? prev : resume.mainId));
    setActiveSubId(resume.langId);
    setActiveLevelId(resume.levelId);
    setActiveGameId(resume.gameId || defaults.gameId);
    setPinnedLevelId(resume.levelId);
  }, [resume.langId, resume.levelId, resume.gameId, resume.mainId, resume.lastPlayedAt]);

  useEffect(() => {
    if (initialSlug) {
      for (const main of gameManifest.mainCategories) {
        for (const sub of main.subCategories) {
          const level = sub.levels.find((l) => l.slug === initialSlug);
          if (level) {
            setActiveMainId(main.id);
            setActiveSubId(sub.id);
            setActiveLevelId(level.id);
            setPinnedLevelId(level.id);
            return;
          }
        }
      }
    }
  }, [initialSlug]);

  // Kayıtlı çalışma geçmişi veya URL slug'ı olmayan yeni AR / PT ziyaretçiler için kendi dil yolunu varsayılan seç
  useEffect(() => {
    if (savedDesk || initialSlug) return;
    if (locale === "ar" || locale === "pt") {
      const targetSubId = locale === "ar" ? "other-arabic-ar_en" : "other-portugal-brpt_en";
      const otherMain = gameManifest.mainCategories.find((c) => c.id === "other-langs");
      const sub = otherMain?.subCategories?.find((s) => s.id === targetSubId);
      if (sub) {
        setActiveMainId("other-langs");
        setActiveSubId(sub.id);
        if (sub.levels?.[0]?.id) {
          setActiveLevelId(sub.levels[0].id);
        }
      }
    }
  }, [locale, savedDesk, initialSlug]);

  // Main değişince: yalnızca UI; lastPlayed’e yazma. Pin varsa onu koru.
  useEffect(() => {
    if (activeMainId === "game") return;

    const mainCat = gameManifest.mainCategories.find((c) => c.id === activeMainId);
    if (!mainCat?.subCategories?.length) return;

    const pinnedCtx = pinnedLevelId ? findLevelContext(pinnedLevelId) : null;
    if (pinnedCtx && pinnedCtx.mainId === activeMainId) {
      setActiveSubId(pinnedCtx.langId);
      setActiveLevelId(pinnedCtx.levelId);
      return;
    }

    if (!mainCat.subCategories.find((s) => s.id === activeSubId)) {
      const firstSub = mainCat.subCategories[0];
      setActiveSubId(firstSub.id);
      setActiveLevelId(firstSub.levels?.[0]?.id || "");
    }
  }, [activeMainId]);

  const mainCategoriesWithGames = gameManifest.mainCategories;

  const [activeLevelMode, setActiveLevelMode] = useState("words");

  const currentMain = gameManifest.mainCategories.find((c) => c.id === activeMainId);
  const currentSub =
    currentMain?.subCategories.find((c) => c.id === activeSubId) ||
    currentMain?.subCategories[0];

  useEffect(() => {
    if (currentSub) {
      const isKorean = currentSub.id?.includes("korean");
      const hasSentences = currentSub.sentenceLevels?.length > 0;
      if (activeLevelMode === "kpop" && !isKorean) {
        setActiveLevelMode("words");
      } else if (activeLevelMode === "sentences" && !hasSentences) {
        setActiveLevelMode("words");
      }
    }
  }, [currentSub, activeLevelMode]);

  const getDisplayLevels = () => {
    let sourceLevels = currentSub?.levels || [];
    const isKorean = currentSub?.id?.includes("korean");
    const isSchool =
      currentSub?.id?.toLowerCase().includes("ilkokul") ||
      currentSub?.id?.toLowerCase().includes("ortaokul");

    if (isKorean) {
      if (activeLevelMode === "words") {
        sourceLevels = sourceLevels.filter((l) => !l.id?.includes("kpop"));
      } else if (activeLevelMode === "kpop") {
        sourceLevels = sourceLevels.filter((l) => l.id?.includes("kpop"));
      }
    }

    // Okul (İlkokul / Ortaokul): kelime + cümle paketleri aynı gridde
    if (isSchool && currentSub?.sentenceLevels?.length > 0) {
      return [...sourceLevels, ...currentSub.sentenceLevels];
    }

    if (activeLevelMode === "sentences" && currentSub?.sentenceLevels?.length > 0) {
      sourceLevels = currentSub.sentenceLevels;
    }
    return sourceLevels;
  };
  const displayLevels = getDisplayLevels();
  const isSchoolSub =
    currentSub?.id?.toLowerCase().includes("ilkokul") ||
    currentSub?.id?.toLowerCase().includes("ortaokul");

  const handleGameOrLevelStart = (newLevelId, newGameId) => {
    // Normal dil/seviye seçimi özel seviye kilidini kırar
    clearActiveCustomWords();

    const levelCandidate =
      newLevelId || pinnedLevelId || activeLevelId || resume.levelId || defaults.levelId;
    const gm = newGameId || activeGameId || resume.gameId || "shooter";

    // ENTERPRISE: lang her zaman level’ın parent’ından — Portekizce drift yok
    const ctx = findLevelContext(levelCandidate);
    if (!ctx) {
      console.warn("[TabbedNavigator] level manifestte yok", levelCandidate);
      return;
    }

    setPinnedLevelId(ctx.levelId);
    setActiveSubId(ctx.langId);
    setActiveLevelId(ctx.levelId);
    setActiveMainId(ctx.mainId);
    setActiveGameId(gm);
    setLastPlayed(ctx.langId, ctx.levelId, gm);
    router.push(`/games/${gm}`);
  };

  const formatLevelName = (rawName) => {
    if (LEVEL_NAME_OVERRIDES[rawName]) {
      return {
        levelText: LEVEL_NAME_OVERRIDES[rawName][langKey] || LEVEL_NAME_OVERRIDES[rawName].tr,
        descText: "",
      };
    }

    let cleanName = rawName.replace(/^Ita\s+(En|Tr)\s*-\s*/i, "").trim();
    if (isAr) {
      cleanName = cleanName
        .replace(/(\d+)\.\s*Sınıf\s+Kelimeler/i, "مفردات الصف $1")
        .replace(/(\d+)\.\s*Sınıf\s+Cümleler/i, "جمل الصف $1")
        .replace(/(\d+)\.\s*Sınıf/gi, "الصف $1")
        .replace(/Kelimeleri$/i, "مفردات")
        .replace(/Cümleleri$/i, "جمل");
    } else if (isPt) {
      cleanName = cleanName
        .replace(/(\d+)\.\s*Sınıf\s+Kelimeler/i, "$1º Ano Vocabulário")
        .replace(/(\d+)\.\s*Sınıf\s+Cümleler/i, "$1º Ano Frases")
        .replace(/(\d+)\.\s*Sınıf/gi, "$1º Ano")
        .replace(/Kelimeleri$/i, "Vocabulário")
        .replace(/Cümleleri$/i, "Frases");
    } else if (isEn) {
      cleanName = cleanName
        .replace(/(\d+)\.\s*Sınıf\s+Kelimeler/i, "Grade $1 Vocabulary")
        .replace(/(\d+)\.\s*Sınıf\s+Cümleler/i, "Grade $1 Sentences")
        .replace(/(\d+)\.\s*Sınıf/gi, "Grade $1")
        .replace(/Kelimeleri$/i, "Vocabulary")
        .replace(/Cümleleri$/i, "Sentences");
    }

    const match = cleanName.match(/(\d{3})\s+(\d{3})/);
    if (!match) {
      return { levelText: cleanName, descText: "" };
    }

    const startNum = parseInt(match[1], 10);
    const endNum = parseInt(match[2], 10);
    const diff = endNum - startNum + 1;

    let descText = "";
    if (isAr) {
      descText =
        startNum === 1
          ? `أهم ${diff} كلمة شائعة`
          : `الكلمات الأكثر شيوعاً (${startNum}–${endNum})`;
    } else if (isPt) {
      descText =
        startNum === 1
          ? `As ${diff} palavras mais comuns`
          : `Palavras mais comuns (${startNum}–${endNum})`;
    } else if (isEn) {
      descText =
        startNum === 1
          ? `Top ${diff} Most Common Words`
          : `Most Common Words (${startNum}–${endNum})`;
    } else if (startNum === 1) {
      descText = `En Sık Kullanılan ${diff} Kelime`;
    } else {
      const nth = Math.floor(startNum / diff) + 1;
      let word = `${nth}.`;
      if (nth === 2) word = "İkinci";
      if (nth === 3) word = "Üçüncü";
      if (nth === 4) word = "Dördüncü";
      if (nth === 5) word = "Beşinci";
      if (nth === 6) word = "Altıncı";

      descText = `En Sık Kullanılan ${word} ${diff} Kelime`;
    }

    let levelText = cleanName.substring(0, match.index).trim();
    if (levelText.endsWith("-")) levelText = levelText.slice(0, -1).trim();

    return { levelText, descText };
  };

  const localizedResumeLang =
    SUB_CATEGORY_LABELS[resume.langId]?.[langKey] || resume.langName;
  const localizedResumeLevel = formatLevelName(resume.levelName || "").levelText || resume.levelName;

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto">
      {!hydrated ? (
        <div className="w-full h-[88px] rounded-2xl border border-cyan-500/20 bg-slate-950/80 animate-pulse" />
      ) : (
        <div className="w-full bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(6,182,212,0.12)] hover:border-cyan-400/60 transition-all group">
          <div className="flex items-center gap-3.5 text-center sm:text-start">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  {savedDesk ? t("home.savedDesk.title") : t("home.savedDesk.start")}
                </span>
                {savedDesk && resumeAge && (
                  <>
                    {" "}
                    <span className="text-[10px] font-mono text-slate-400 tracking-wide">
                      {t("home.savedDesk.lastStudy", { age: resumeAge })}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-200">
                <span className="text-white font-extrabold">{localizedResumeLang}</span> •{" "}
                <span className="text-cyan-300">{localizedResumeLevel}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                {savedDesk
                  ? t("home.savedDesk.resumeDesc", { game: resumeGameLabel })
                  : t("home.savedDesk.setupDesc")}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleGameOrLevelStart(resume.levelId, resume.gameId)}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 border-2 border-red-500/60 text-red-500 font-black text-xs sm:text-sm rounded-xl hover:bg-slate-800 hover:border-red-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-red-500 text-red-500" />
            <span className="text-red-500 font-black tracking-wider uppercase">
              {savedDesk ? t("home.savedDesk.resumeCta") : t("home.savedDesk.startCta")}
            </span>
          </button>
        </div>
      )}

      {hydrated && <DueReviewCta />}

      <div
        className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)" }}
      >
        <div className="banner-glow-effect"></div>
        <div className="relative z-10 w-full text-center">
          <span className="banner-badge mb-2">{t("home.step1")}</span>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            {t("home.step1Title")}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 relative z-10 w-full mt-2">
          {mainCategoriesWithGames.map((main, idx) => {
            const mainLabel = MAIN_CATEGORY_LABELS[main.id]?.[langKey] || main.name;
            return (
              <div key={main.id} className="flex items-center gap-2 sm:gap-6">
                {idx > 0 && (
                  <div className="hidden sm:flex text-4xl sm:text-5xl font-black text-white/10 select-none">
                    /
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-5xl font-black text-cyan-500/40 select-none bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 drop-shadow-lg">
                    {idx + 1}
                  </span>{" "}
                  <button
                    type="button"
                    onClick={() => setActiveMainId(main.id)}
                    className={`px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-base font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                      activeMainId === main.id ||
                      (activeMainId === "game" && previousMainId === main.id)
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-[1.03] sm:scale-105"
                        : "bg-dark-900/60 text-gray-300 border-white/10 hover:border-cyan-500/50 hover:bg-dark-800"
                    }`}
                  >
                    {mainLabel}
                  </button>
                </div>
              </div>
            );
          })}
          {/* Third Category: Akademik */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden sm:flex text-4xl sm:text-5xl font-black text-white/10 select-none">
              /
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-5xl font-black text-cyan-500/40 select-none bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 drop-shadow-lg">
                3
              </span>{" "}
              <button
                type="button"
                onClick={() => router.push("/sozluk/")}
                className="px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-base font-bold transition-all duration-300 flex items-center gap-2 border-2 bg-dark-900/60 text-gray-300 border-white/10 hover:border-cyan-500/50 hover:bg-dark-800 hover:text-white cursor-pointer"
              >
                {t("home.academic")}
              </button>
            </div>
          </div>
        </div>
        <div className="relative z-10 w-full text-center mt-1">
          <button
            type="button"
            onClick={() => router.push("/vocabulary")}
            className="text-xs font-bold text-slate-500 hover:text-emerald-300 transition-colors underline-offset-2 hover:underline bg-transparent border-none cursor-pointer"
          >
            {t("home.vaultHint")}
          </button>
        </div>
      </div>

      <div
        className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #4c1d95 100%)" }}
      >
        <div
          className="banner-glow-effect"
          style={{
            right: "auto",
            left: "-10%",
            background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
        <div className="relative z-10 w-full text-center">
          <span
            className="banner-badge mb-2"
            style={{
              borderColor: "#38bdf8",
              color: "#7dd3fc",
              background: "rgba(56, 189, 248, 0.2)",
            }}
          >
            {t("home.step2")}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            {t("home.step2Title")}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 justify-center relative z-10 w-full mt-2">
          {activeMainId === "game" ? (
            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={() => setActiveMainId(previousMainId || defaults.mainId)}
                className="bg-dark-900/60 text-gray-300 hover:text-white px-4 py-3 rounded-xl border border-white/10 hover:border-gray-500 transition-colors flex items-center gap-2 font-bold"
              >
                <ChevronLeft className="w-5 h-5" /> {t("common.back")}
              </button>{" "}
              <button
                type="button"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] px-6 py-3 rounded-xl font-bold transition-all duration-300 scale-105 border-transparent cursor-default"
              >
                {t("home.step3GameTitle")}
              </button>
            </div>
          ) : (
            currentMain?.subCategories.map((sub, idx) => {
              const subLabel = SUB_CATEGORY_LABELS[sub.id]?.[langKey] || sub.name;
              return (
                <React.Fragment key={sub.id}>
                  {idx > 0 ? " " : null}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubId(sub.id);
                      const first = sub.levels?.[0]?.id || "";
                      setActiveLevelId(first);
                    }}
                    className={`px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-base font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                      activeSubId === sub.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-[1.03] sm:scale-105 border-transparent"
                        : "bg-dark-900/60 text-gray-300 border-white/10 hover:border-purple-500/50 hover:bg-dark-800"
                    }`}
                  >
                    {subLabel}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      <div
        className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
        style={{
          background: "linear-gradient(135deg, #020617 0%, #0891b2 50%, #0f766e 100%)",
          alignItems: "stretch",
        }}
      >
        <div
          className="banner-glow-effect"
          style={{
            top: "auto",
            bottom: "-50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
        <div className="relative z-10 w-full text-center">
          <span
            className="banner-badge mb-2"
            style={{
              borderColor: "#34d399",
              color: "#6ee7b7",
              background: "rgba(52, 211, 153, 0.2)",
            }}
          >
            {activeMainId === "games" ? t("home.step3Game") : t("home.step3")}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            {activeMainId === "games"
              ? isAr
                ? "اختيار اللعبة"
                : isPt
                  ? "OPÇÕES DE JOGO"
                  : isEn
                    ? "GAME OPTIONS"
                    : "OYUN SEÇİMİ"
              : isAr
                ? "خيارات المستوى"
                : isPt
                  ? "OPÇÕES DE NÍVEL"
                  : isEn
                    ? "LEVEL OPTIONS"
                    : "SEVİYE SEÇENEKLERİ"}
          </h2>

          {activeMainId !== "games" && currentSub?.sentenceLevels?.length > 0 && !isSchoolSub && (
            <div className="flex justify-center mb-6">
              <div className="bg-dark-900/60 p-1.5 rounded-xl border border-white/10 inline-flex gap-1">
                <button
                  onClick={() => {
                    setActiveLevelMode("words");
                    setActiveLevelId("");
                  }}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
                    activeLevelMode === "words"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isAr ? "📚 المفردات" : isPt ? "📚 Vocabulário" : isEn ? "📚 Vocabulary" : "📚 Kelimeler"}
                </button>{" "}
                <button
                  onClick={() => {
                    setActiveLevelMode("sentences");
                    setActiveLevelId("");
                  }}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
                    activeLevelMode === "sentences"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isAr ? "💬 الجمل الشائعة" : isPt ? "💬 Frases Comuns" : isEn ? "💬 Common Sentences" : "💬 En Sık Kullanılan Cümleler"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 w-full">
          {activeMainId === "games" ? (
            <GameSelector
              activeGameId={activeGameId}
              onSelectGame={(gameId) => {
                setActiveGameId(gameId);
                handleGameOrLevelStart(activeLevelId, gameId);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {displayLevels.map((level) => {
                const formatted = formatLevelName(level.name);
                const isSentenceLevel =
                  level.id?.includes("sentences") ||
                  level.path?.toLowerCase().includes("cumle") ||
                  level.path?.toLowerCase().includes("sentence");
                const playlistCategory = getPlaylistCategory(level.id);
                return (
                  <div
                    key={level.id}
                    className={`p-4 rounded-xl text-center border-2 flex flex-col items-center justify-between min-h-[120px] relative overflow-hidden group transition-all duration-300 ${
                      activeLevelId === level.id
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-[1.03] z-10"
                        : isSentenceLevel
                          ? "bg-dark-900/60 border-cyan-500/30 text-gray-300 hover:border-cyan-400/60 hover:bg-dark-800"
                          : "bg-dark-900/60 border-white/10 text-gray-300 hover:border-emerald-500/50 hover:bg-dark-800"
                    }`}
                  >
                    <div
                      onClick={() => {
                        const isIlkokul =
                          level.id.toLowerCase().includes("ilkokul") ||
                          activeSubId.toLowerCase().includes("ilkokul");
                        if (isIlkokul) {
                          handleGameOrLevelStart(level.id, "word-card");
                        } else {
                          setPreviousMainId(activeMainId);
                          setActiveLevelId(level.id);
                          setActiveMainId("games");
                        }
                      }}
                      className="cursor-pointer flex-1 flex flex-col items-center justify-center gap-2 w-full"
                    >
                      {isSentenceLevel && (
                        <span
                          className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            activeLevelId === level.id
                              ? "bg-white/20 text-white"
                              : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {isAr ? "جمل" : isPt ? "Frase" : isEn ? "Sentence" : "Cümle"}
                        </span>
                      )}
                      <div
                        className={`font-black text-[15px] sm:text-base leading-tight transition-colors ${
                          activeLevelId === level.id
                            ? "text-white"
                            : "text-gray-200 group-hover:text-emerald-400"
                        }`}
                      >
                        {formatted.levelText}
                      </div>
                      {formatted.descText && (
                        <div
                          className={`text-sm font-medium w-full leading-snug mt-1 transition-colors ${
                            activeLevelId === level.id
                              ? "text-white font-bold"
                              : "text-gray-300 group-hover:text-emerald-200"
                          }`}
                        >
                          {formatted.descText}
                        </div>
                      )}
                      {isSchoolSub && (
                        <div
                          className={`text-[11px] mt-1 ${
                            activeLevelId === level.id ? "text-emerald-100" : "text-slate-500"
                          }`}
                        >
                          {isAr ? "اختيار الوحدة داخل اللعبة" : isPt ? "Escolha a unidade no jogo" : isEn ? "Select unit in-game" : "Ünite seçimi oyunda"}
                        </div>
                      )}
                    </div>

                    {playlistCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/videos?playlist=${playlistCategory}`);
                        }}
                        className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-black tracking-wider flex items-center justify-center gap-1.5 border transition-all z-20 ${
                          activeLevelId === level.id
                            ? "bg-white/20 hover:bg-white/30 text-white border-white/30"
                            : "bg-red-500/10 hover:bg-red-500/25 text-red-400 border-red-500/30 hover:border-red-500/60"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 fill-current" />
                        <span>{isAr ? "ادرس بالفيديو" : isPt ? "ESTUDAR COM VÍDEO" : isEn ? "STUDY WITH VIDEO" : "VİDEO İLE ÇALIŞ"}</span>
                      </button>
                    )}

                    {activeLevelId === level.id && (
                      <div className="absolute top-2 right-2">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {displayLevels.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10 font-mono">
                  {isAr ? "لم يتم العثور على بيانات" : isEn ? "NO DATA FOUND" : "VERİ BULUNAMADI"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
