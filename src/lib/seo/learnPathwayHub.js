/**
 * Dil yolu → “dil anasayfası” çalışma paketleri (manifest’ten).
 * Server-side: /learn/[langPair] hub.
 */
import { gameManifest } from "@/config/manifest";
import { buildGamesPickerHref, buildLevelPageHref } from "./arcadeShells";
import { getAllLearnLevels } from "./learnLevels";

const EN_MAIN_ID = "en-tr";

function isAlphabetLevel(level) {
  const id = level?.id || "";
  const path = level?.path || "";
  const type = level?.type || "";
  return (
    type === "alphabet" ||
    /alphabet|hiragana|katakana/i.test(id) ||
    /alphabet|hiragana|katakana/i.test(path)
  );
}

function isKpopLevel(level) {
  const id = level?.id || "";
  const path = level?.path || "";
  return /kpop/i.test(id) || /kpop/i.test(path);
}

function isCefrWordLevel(level) {
  if (isAlphabetLevel(level) || isKpopLevel(level)) return false;
  if (level?.type === "words") return true;
  if (level?.type === "sentences") return false;
  const code = String(level?.levelCode || "");
  if (/^(A1|A2|B1|B2|C1|C2)(_|$)/i.test(code) || /vocabulary/i.test(code)) return true;
  if (
    /beginner|elementary|intermediate|advanced|proficient|başlangıç|temel|orta|ileri|yetkin/i.test(
      level?.name || ""
    )
  ) {
    return true;
  }
  return false;
}

function mapLevel(level, packId, pathwaySlug, levelIndex) {
  const indexed =
    levelIndex.get(`id::${pathwaySlug}::${level.id}`) || null;
  const levelSlug = indexed?.levelSlug;
  const pageHref = levelSlug
    ? buildLevelPageHref(pathwaySlug, levelSlug)
    : buildGamesPickerHref({
        pathway: pathwaySlug,
        langId: packId,
        levelId: level.id,
      });
  const gamesHref = buildGamesPickerHref({
    pathway: pathwaySlug,
    langId: packId,
    levelId: level.id,
  });

  return {
    id: level.id,
    name: level.name,
    type:
      level.type ||
      (isAlphabetLevel(level) ? "alphabet" : isKpopLevel(level) ? "kpop" : "words"),
    levelCode: level.levelCode || null,
    levelSlug: levelSlug || null,
    /** Seviye detay sayfası (KPSS kavram modeli) */
    href: pageHref,
    /** 10 oyun kabuğu seçici */
    gamesHref,
  };
}

function isIlkokulPack(sub) {
  const id = String(sub?.id || "");
  const folder = String(sub?.folder || "");
  const name = String(sub?.name || "");
  return /ilkokul|meb/i.test(id) || /Ilkokul|MEB/i.test(folder) || /ilkokul/i.test(name);
}

function isOrtaokulPack(sub) {
  const id = String(sub?.id || "");
  const folder = String(sub?.folder || "");
  const name = String(sub?.name || "");
  return /ortaokul/i.test(id) || /Ortaokul/i.test(folder) || /ortaokul/i.test(name);
}

/**
 * Tek subCategory → kelime / cümle / alfabe / kpop / paket bölümleri
 */
export function buildPackSections(sub, pathwaySlug, levelIndex) {
  const packId = sub.id;
  const levels = sub.levels || [];
  const sentenceLevels = sub.sentenceLevels || [];
  const map = (l) => mapLevel(l, packId, pathwaySlug, levelIndex);
  const mebPack = isIlkokulPack(sub);
  const ortaokulPack = isOrtaokulPack(sub);

  if (mebPack || ortaokulPack) {
    const wordLevels = levels.map(map);
    const sentenceMapped = sentenceLevels.map((l) => map({ ...l, type: "sentences" }));
    const sections = [];
    if (wordLevels.length) {
      sections.push({
        key: ortaokulPack ? "ortaokul-words" : "meb-words",
        titleTr: ortaokulPack ? "Ortaokul — Kelimeler (5.–8. Sınıf)" : "İlkokul — Kelimeler (1.–4. Sınıf)",
        titleEn: ortaokulPack ? "Middle School — Vocabulary (grades 5–8)" : "Primary — Vocabulary (grades 1–4)",
        blurbTr: ortaokulPack
          ? "5. Sınıf ve ortaokul müfredatına uygun ünite kelime setleri. Sesli ve oyunlaştırmalı pratik yapın."
          : "Okul müfredatına uygun kelime setleri. Kelime Kartı ile görsel + sesli çalışın.",
        blurbEn: ortaokulPack
          ? "Curriculum-aligned middle school vocabulary. Practice with arcade games and audio."
          : "Curriculum-aligned vocabulary sets. Study with Word Card (image + audio).",
        levels: wordLevels,
      });
    }
    if (sentenceMapped.length) {
      sections.push({
        key: ortaokulPack ? "ortaokul-sentences" : "meb-sentences",
        titleTr: ortaokulPack ? "Ortaokul — Temel Cümleler" : "İlkokul — Temel Cümleler (2.–4. Sınıf)",
        titleEn: ortaokulPack ? "Middle School — Core Sentences" : "Primary — Core Sentences (grades 2–4)",
        blurbTr: ortaokulPack
          ? "Ünite ünite günlük ortaokul cümleleri ve kalıplar."
          : "Ünite ünite günlük cümleler · çocuk dostu seslendirme.",
        blurbEn: ortaokulPack
          ? "Unit-by-unit daily middle school sentences and phrases."
          : "Unit-by-unit daily sentences · child-friendly audio.",
        levels: sentenceMapped,
      });
    }
    const startLevel = wordLevels[0] || sentenceMapped[0];
    return {
      id: packId,
      name: sub.name,
      mebCurriculum: true,
      wordCount: wordLevels.length,
      sentenceCount: sentenceMapped.length,
      startHref:
        startLevel?.href ||
        buildGamesPickerHref({ pathway: pathwaySlug, langId: packId }),
      gamesHref:
        startLevel?.gamesHref ||
        buildGamesPickerHref({ pathway: pathwaySlug, langId: packId }),
      sections,
    };
  }

  const words = levels.filter(isCefrWordLevel).map(map);
  const alphabet = levels.filter(isAlphabetLevel).map(map);
  const kpop = levels.filter(isKpopLevel).map(map);
  const leftover = levels
    .filter((l) => !isCefrWordLevel(l) && !isAlphabetLevel(l) && !isKpopLevel(l))
    .map(map);
  const sentences = sentenceLevels.map((l) => map({ ...l, type: "sentences" }));

  const speakingFromLevels =
    words.length === 0 && leftover.length > 0 && sentences.length === 0
      ? leftover
      : [];
  const wordPacks = speakingFromLevels.length > 0 ? [] : leftover;

  const sections = [];
  if (words.length) {
    sections.push({
      key: "words",
      titleTr: "Kelime çalış",
      titleEn: "Word study",
      blurbTr: "Seviye sayfasını aç → 10 oyun kabuğundan birini seç.",
      blurbEn: "Open the level page → pick one of 10 arcade shells.",
      levels: words,
    });
  }
  if (alphabet.length) {
    sections.push({
      key: "alphabet",
      titleTr: "Alfabe / yazı sistemi",
      titleEn: "Alphabet / writing system",
      blurbTr: "Harf ve hece temelleri.",
      blurbEn: "Letters and script foundations.",
      levels: alphabet,
    });
  }
  if (sentences.length || speakingFromLevels.length) {
    sections.push({
      key: "sentences",
      titleTr: "Cümle / hızlı konuşma",
      titleEn: "Sentences / quick speaking",
      blurbTr: "Günlük ve tematik cümle setleri.",
      blurbEn: "Daily and thematic phrase sets.",
      levels: [...sentences, ...speakingFromLevels],
    });
  }
  if (kpop.length) {
    sections.push({
      key: "kpop",
      titleTr: "K-Pop kelimeleri",
      titleEn: "K-Pop vocabulary",
      blurbTr: "K-Pop odaklı kelime setleri.",
      blurbEn: "K-Pop focused word sets.",
      levels: kpop,
    });
  }
  if (wordPacks.length) {
    sections.push({
      key: "packs",
      titleTr: "Kelime paketleri",
      titleEn: "Word packs",
      blurbTr: "Sınav ve tematik kelime paketleri.",
      blurbEn: "Exam and thematic vocabulary packs.",
      levels: wordPacks,
    });
  }

  const startLevel =
    words[0] ||
    alphabet[0] ||
    sentences[0] ||
    speakingFromLevels[0] ||
    wordPacks[0] ||
    kpop[0];

  return {
    id: packId,
    name: sub.name,
    wordCount: words.length + wordPacks.length + alphabet.length + kpop.length,
    sentenceCount: sentences.length + speakingFromLevels.length,
    startHref: startLevel?.href
      || buildGamesPickerHref({ pathway: pathwaySlug, langId: packId }),
    gamesHref: startLevel?.gamesHref
      || buildGamesPickerHref({ pathway: pathwaySlug, langId: packId }),
    sections,
  };
}

function findSubById(subId) {
  for (const main of gameManifest.mainCategories || []) {
    for (const sub of main.subCategories || []) {
      if (sub.id === subId) return { main, sub };
    }
  }
  return null;
}

/**
 * Pathway registry kaydı → dil anasayfası hub modeli
 */
export function getPathwayStudyHub(pathway) {
  if (!pathway?.manifestLangId) return null;
  const hit = findSubById(pathway.manifestLangId);
  if (!hit) return null;

  const { main, sub } = hit;
  const isEnglishFamily = main.id === EN_MAIN_ID;
  const packSubs = isEnglishFamily ? main.subCategories || [sub] : [sub];
  const { byKey } = getAllLearnLevels();

  const packs = packSubs.map((s) => buildPackSections(s, pathway.slug, byKey));
  const primary = packs.find((p) => p.id === pathway.manifestLangId) || packs[0];

  return {
    pathwaySlug: pathway.slug,
    isEnglishFamily,
    packs,
    primary,
    gamesHref: buildGamesPickerHref({
      pathway: pathway.slug,
      langId: pathway.manifestLangId,
    }),
    totals: {
      packs: packs.length,
      wordTracks: packs.reduce(
        (n, p) =>
          n +
          (p.sections.find((s) => s.key === "words" || s.key === "packs")?.levels
            .length || 0),
        0
      ),
      sentenceTracks: packs.reduce(
        (n, p) =>
          n + (p.sections.find((s) => s.key === "sentences")?.levels.length || 0),
        0
      ),
    },
  };
}
