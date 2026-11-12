/**
 * Learn seviye SSG indeksi + örnek içerik + Çoklu JSON-LD (@graph: LearningResource, Quiz, VideoObject, SoftwareApplication)
 */
import fs from "fs";
import path from "path";
import { gameManifest } from "@/config/manifest";
import { LEARN_PATHWAYS, getPathwayBySlug, NATIVE_LANG_SEO } from "./learnPathways";
import { absoluteUrl, SITE_NAME, SITE_URL, OG_IMAGE } from "./siteConfig";
import {
  ARCADE_SHELLS,
  buildGamesPickerHref,
  buildLevelPageHref,
} from "./arcadeShells";
import { getPlaylistCategory } from "../youtube/playlistCategory";

export { ARCADE_SHELLS, buildGamesPickerHref, buildLevelPageHref };

function resolvePageSlug(level, used) {
  const raw = level.slug || level.id || "level";
  let base = String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  let s = base || "level";
  if (!used.has(s)) {
    used.add(s);
    return s;
  }
  const tip = String(level.levelCode || level.id || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-24);
  s = tip ? `${base}-${tip}` : `${base}-2`;
  let n = 2;
  while (used.has(s)) {
    s = `${base}-${n++}`;
  }
  used.add(s);
  return s;
}

function collectRawLevels(sub) {
  return [...(sub.levels || []), ...(sub.sentenceLevels || [])];
}

function findPacksForPathway(pathway) {
  if (!pathway?.manifestLangId) return [];
  let mainHit = null;
  let primarySub = null;
  for (const main of gameManifest.mainCategories || []) {
    for (const sub of main.subCategories || []) {
      if (sub.id === pathway.manifestLangId) {
        mainHit = main;
        primarySub = sub;
        break;
      }
    }
    if (mainHit) break;
  }
  if (!mainHit || !primarySub) return [];
  if (mainHit.id === "en-tr") return mainHit.subCategories || [primarySub];
  return [primarySub];
}

let _indexCache = null;
let _youtubeDatasetCache = null;

function resolvePublicDataPath(relPath) {
  const root = process["cwd"]();
  const primary = [root, "public", "data", relPath].join(path.sep);
  if (fs.existsSync(primary)) return primary;
  const slimFallback = [root, "public", "_slim_skip_data", relPath].join(path.sep);
  if (fs.existsSync(slimFallback)) return slimFallback;
  return primary;
}

function loadYoutubeDatasetCached() {
  if (_youtubeDatasetCache !== null) return _youtubeDatasetCache;
  try {
    const ytPath = resolvePublicDataPath("youtube_videos.json");
    if (fs.existsSync(ytPath)) {
      _youtubeDatasetCache = JSON.parse(fs.readFileSync(ytPath, "utf8"));
      return _youtubeDatasetCache;
    }
  } catch {
    /* ignore */
  }
  _youtubeDatasetCache = {};
  return _youtubeDatasetCache;
}

/**
 * Seviyeye karşılık gelen YouTube oynatma listesi / video bilgisini döndürür (JSON-LD VideoObject için).
 */
export function getVideoMetadataForLevel(entry) {
  if (!entry) return null;
  const cat =
    getPlaylistCategory(entry.levelId) ||
    getPlaylistCategory(entry.levelSlug) ||
    getPlaylistCategory(entry.packId);
  if (!cat) return null;

  const ytData = loadYoutubeDatasetCached();
  const playlist = ytData?.[cat];
  const firstVideo = playlist?.videos?.[0] || null;

  const videoId = firstVideo?.id || "XV7Q720bCWA";
  const title =
    firstVideo?.title ||
    playlist?.name ||
    `${entry.levelName} — Memolandum Eğitici Video`;
  const description =
    firstVideo?.description ||
    `${entry.levelName} (${entry.packName || "Memolandum"}) 3D animasyonlu kelime ve telaffuz eğitim videosu.`;
  const thumbnailUrl =
    firstVideo?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const uploadDate = firstVideo?.publishedAt || "2026-09-01T09:00:00Z";

  return {
    playlistKey: cat,
    playlistId: playlist?.playlistId || null,
    videoId,
    name: title,
    description: String(description).slice(0, 320),
    thumbnailUrl,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    uploadDate,
  };
}

/** Tüm learn seviye kayıtları (SSG + lookup) */
export function getAllLearnLevels() {
  if (_indexCache) return _indexCache;
  const list = [];
  const byKey = new Map();

  for (const pathway of LEARN_PATHWAYS) {
    const used = new Set();
    const packs = findPacksForPathway(pathway);
    for (const sub of packs) {
      for (const level of collectRawLevels(sub)) {
        if (!level?.id) continue;
        const pageSlug = resolvePageSlug(level, used);
        const entry = {
          pathwaySlug: pathway.slug,
          pathwayLabelTr: pathway.labelTr,
          pathwayLabelEn: pathway.labelEn,
          sourceNameTr: pathway.sourceNameTr,
          targetNameTr: pathway.targetNameTr,
          packId: sub.id,
          packName: sub.name,
          levelId: level.id,
          levelName: level.name,
          levelSlug: pageSlug,
          levelCode: level.levelCode || null,
          type: level.type || (level.id?.includes("sentences") ? "sentences" : "words"),
          path: level.path || null,
          pageHref: buildLevelPageHref(pathway.slug, pageSlug),
          gamesHref: buildGamesPickerHref({
            pathway: pathway.slug,
            langId: sub.id,
            levelId: level.id,
          }),
        };
        list.push(entry);
        byKey.set(`${pathway.slug}::${pageSlug}`, entry);
        byKey.set(`id::${pathway.slug}::${level.id}`, entry);
      }
    }
  }

  _indexCache = { list, byKey };
  return _indexCache;
}

export function getLearnLevel(pathwaySlug, levelSlug) {
  const { byKey } = getAllLearnLevels();
  return byKey.get(`${pathwaySlug}::${levelSlug}`) || null;
}

export function getLearnLevelsForPathway(pathwaySlug) {
  return getAllLearnLevels().list.filter((e) => e.pathwaySlug === pathwaySlug);
}

export function getSiblingLevels(entry, limit = 8) {
  if (!entry) return [];
  return getAllLearnLevels()
    .list.filter(
      (e) =>
        e.pathwaySlug === entry.pathwaySlug &&
        e.packId === entry.packId &&
        e.levelId !== entry.levelId
    )
    .slice(0, limit);
}

function normalizeItem(w) {
  const word =
    w.word ||
    w.term ||
    w.english ||
    w.en ||
    (w.hanzi ? (w.pinyin ? `${w.hanzi} (${w.pinyin})` : w.hanzi) : "") ||
    (w.original_script
      ? w.romanized_script
        ? `${w.original_script} (${w.romanized_script})`
        : w.original_script
      : "") ||
    w.mission_word ||
    w.mission_phrase ||
    "";
  const translation =
    w.translation ||
    w.meaning ||
    w.turkish ||
    w.tr ||
    w.gloss ||
    w.target_translation ||
    "";
  if (!word && !translation) return null;
  return { word: String(word), translation: String(translation) };
}

function itemMatchesLevel(item, levelCode) {
  if (!levelCode) return true;
  const target = String(levelCode).toLowerCase();
  const candidates = [
    item.level,
    item.level_tag,
    item.levelCode,
    item.category,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
  return candidates.some((c) => c === target || c.includes(target) || target.includes(c));
}

function hashSlugOffset(str, max) {
  if (!str || max <= 0) return 0;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % max;
}

/** Seviye JSON’undan örnek satırlar (thin-content önleme) */
export function loadLevelSamples(entry, limit = 10) {
  if (!entry?.path) return [];
  const filePath = resolvePublicDataPath(entry.path);
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let list = [];
    if (Array.isArray(data)) {
      if (data.length > 0 && Array.isArray(data[0]?.words)) {
        const targetCode = String(entry.levelCode || "").toLowerCase();
        const hit = data.find(
          (lv) =>
            String(lv.level || lv.level_tag || lv.code || "").toLowerCase() === targetCode
        );
        list = hit?.words || data.flatMap((lv) => lv.words || []);
      } else {
        list = data;
      }
    } else if (Array.isArray(data.words)) {
      list = data.words;
    } else if (Array.isArray(data.items)) {
      list = data.items;
    } else if (Array.isArray(data.vocabulary_vault)) {
      list = data.vocabulary_vault;
    } else if (Array.isArray(data.phrase_vault)) {
      list = data.phrase_vault;
    } else if (Array.isArray(data.levels)) {
      const hit = data.levels.find(
        (lv) =>
          lv.level === entry.levelCode ||
          lv.level_tag === entry.levelCode ||
          lv.code === entry.levelCode
      );
      list = hit?.words || hit?.items || [];
    }

    const filtered = entry.levelCode
      ? list.filter((item) => itemMatchesLevel(item, entry.levelCode))
      : list;

    const normalized = (filtered.length ? filtered : list)
      .map(normalizeItem)
      .filter(Boolean);

    if (normalized.length <= limit) return normalized;

    // If fallback to full list was used, deterministically offset by slug so sibling levels never show identical rows
    if (!filtered.length && entry.levelSlug) {
      const start = hashSlugOffset(entry.levelSlug, Math.max(1, normalized.length - limit));
      return normalized.slice(start, start + limit);
    }

    return normalized.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Faz 5 — Self-canonical hreflang doğrulaması (yalnızca gerçek statik eşdeğer URL varsa hreflang eklenir; ?lang= kopyaları üretilmez).
 */
export function getLevelAlternates(entry) {
  const url = absoluteUrl(entry.pageHref);

  const pathway = getPathwayBySlug(entry.pathwaySlug);
  if (!pathway) return { canonical: url };

  const equivalentPathway = LEARN_PATHWAYS.find(
    (p) => p.sourceCode === pathway.sourceCode && p.targetCode !== pathway.targetCode
  );

  if (equivalentPathway) {
    const equivalentLevel = getAllLearnLevels().list.find(
      (e) =>
        e.pathwaySlug === equivalentPathway.slug &&
        e.levelCode &&
        e.levelCode === entry.levelCode &&
        e.type === entry.type
    );

    if (equivalentLevel) {
      const eqUrl = absoluteUrl(equivalentLevel.pageHref);
      const trUrl = pathway.targetCode === "tr" ? url : eqUrl;
      const enUrl = pathway.targetCode === "en" ? url : eqUrl;
      return {
        canonical: url,
        languages: {
          tr: trUrl,
          "tr-TR": trUrl,
          en: enUrl,
          "en-US": enUrl,
          "x-default": enUrl,
        },
      };
    }
  }

  return { canonical: url };
}

export function buildLearnLevelMetadata(entry) {
  const isEnTarget = String(entry.pathwaySlug || "").endsWith("-en");
  const sourceCode = String(entry.pathwaySlug || "").split("-")[0];
  const native = NATIVE_LANG_SEO[sourceCode] || {
    nativeName: entry.sourceNameTr,
    sourceNameEn: entry.pathwayLabelEn?.split("→")?.[0]?.trim() || entry.sourceNameTr,
    keywords: [],
  };
  const isMeb =
    /ilkokul|meb/i.test(entry.packId || "") ||
    /ilkokul|meb/i.test(entry.packName || "") ||
    /meb-/i.test(entry.levelSlug || "");
  const kindTr =
    entry.type === "sentences"
      ? "cümle / konuşma"
      : entry.type === "alphabet"
        ? "alfabe"
        : "kelime";
  const kindEn =
    entry.type === "sentences"
      ? "sentences & speaking"
      : entry.type === "alphabet"
        ? "alphabet"
        : "vocabulary";

  const title = isMeb
    ? `${entry.levelName} — İlkokul İngilizce`
    : isEnTarget
      ? `${entry.levelName} — ${entry.pathwayLabelEn} (${native.nativeName}) ${kindEn}`
      : `${entry.levelName} — ${entry.sourceNameTr} (${native.nativeName}) ${kindTr}`;

  const description = isMeb
    ? `İlkokul İngilizce müfredatı · ${entry.levelName}. Kelime Kartı ve 16 ücretsiz arcade oyun kabuğu ile görsel ve sesli çalışın — Memolandum.`
    : isEnTarget
      ? `${entry.pathwayLabelEn} (${native.nativeName}) · ${entry.levelName}. Master ${kindEn} across 16 free neon arcade games with spaced repetition — Memolandum.`
      : `${entry.pathwayLabelTr} (${native.nativeName}) · ${entry.packName}: ${entry.levelName}. 16 arcade oyun kabuğundan biriyle ezberle. Spaced repetition · ücretsiz.`;

  const url = absoluteUrl(entry.pageHref);

  return {
    title,
    description,
    keywords: isMeb
      ? [
          "ilkokul İngilizce",
          entry.levelName,
          "ilkokul kelime kartı",
          "okul müfredatı",
          "Memolandum",
        ]
      : [
          ...native.keywords,
          entry.levelName,
          entry.pathwayLabelEn,
          entry.pathwayLabelTr,
          "Memolandum",
        ].filter(Boolean),
    alternates: getLevelAlternates(entry),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: isEnTarget ? "en_US" : "tr_TR",
      alternateLocale: ["tr_TR", "en_US", "ar_SA", "pt_BR"],
      type: "article",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: entry.levelName }],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Faz 5 — Zenginleştirilmiş Çoklu JSON-LD (`@graph`: `LearningResource` + `Quiz` + `VideoObject` + `SoftwareApplication`)
 */
export function buildLearnLevelJsonLd(entry, samples = []) {
  const url = absoluteUrl(entry.pageHref);
  const isEnTarget = String(entry.pathwaySlug || "").endsWith("-en");
  const isMeb =
    /ilkokul|meb/i.test(entry.packId || "") ||
    /ilkokul|meb/i.test(entry.packName || "") ||
    /meb-/i.test(entry.levelSlug || "");
  const gradeMatch = String(entry.levelName || "").match(/(\d+)\.\s*Sınıf/i);
  const grade = gradeMatch ? Number(gradeMatch[1]) : null;

  const resourceName = isMeb
    ? `${entry.levelName} — İlkokul İngilizce`
    : isEnTarget
      ? `${entry.levelName} — ${entry.pathwayLabelEn}`
      : `${entry.levelName} — ${entry.pathwayLabelTr}`;

  const resourceDesc = isMeb
    ? `İlkokul İngilizce müfredatına uyumlu ${entry.levelName}. Memolandum Kelime Kartı ve 16 HTML5 Canvas oyun kabuğu ile görsel ve sesli çalışma.`
    : isEnTarget
      ? `${entry.levelName} in ${entry.pathwayLabelEn}. Free Memolandum arcade vocabulary & sentence drill across 16 HTML5 Canvas game shells.`
      : `${entry.packName} içinde ${entry.levelName}. Memolandum 16 arcade oyun kabuğu ile kelime / cümle çalışması.`;

  const learningResourceNode = {
    "@type": "LearningResource",
    "@id": `${url}#resource`,
    name: resourceName,
    description: resourceDesc,
    url,
    learningResourceType:
      entry.type === "sentences" ? "Sentence practice" : "Vocabulary drill",
    inLanguage: ["tr", "en", "ar", "pt"],
    isAccessibleForFree: true,
    ...(isMeb
      ? {
          educationalLevel: grade
            ? `Primary School Grade ${grade}`
            : "Primary School English",
          educationalAlignment: [
            {
              "@type": "AlignmentObject",
              alignmentType: "educationalFramework",
              targetName: "Türkiye Yüzyılı Maarif Modeli / MEB İngilizce Müfredatı",
            },
            ...(grade
              ? [
                  {
                    "@type": "AlignmentObject",
                    alignmentType: "educationalLevel",
                    targetName: `${grade}. Sınıf`,
                  },
                ]
              : []),
          ],
        }
      : {}),
    isPartOf: {
      "@type": "Course",
      name: isMeb
        ? "İlkokul İngilizce — Memolandum"
        : isEnTarget
          ? entry.pathwayLabelEn
          : entry.pathwayLabelTr,
      url: absoluteUrl(`/learn/${entry.pathwaySlug}/`),
    },
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(samples.length
      ? {
          teaches: samples
            .slice(0, 8)
            .map((s) => s.word || s.english)
            .filter(Boolean),
        }
      : {}),
  };

  const quizQuestions = (samples || [])
    .slice(0, 10)
    .map((s) => {
      const term = String(s.word || s.english || "").trim();
      const meaning = String(s.translation || s.turkish || "").trim();
      if (!term || !meaning) return null;
      return {
        "@type": "Question",
        eduQuestionType: "Flashcard",
        name: term,
        acceptedAnswer: {
          "@type": "Answer",
          text: meaning,
        },
      };
    })
    .filter(Boolean);

  const quizNode = {
    "@type": "Quiz",
    "@id": `${url}#quiz`,
    name: `${resourceName} — Active Recall Quiz`,
    description: `${entry.levelName} kelime ve anlam eşleştirme alıştırması (Memolandum Pulse™ SM-2).`,
    about: { "@id": `${url}#resource` },
    inLanguage: ["tr", "en", "ar", "pt"],
    isAccessibleForFree: true,
    hasPart: quizQuestions,
  };

  const softwareAppNode = {
    "@type": "SoftwareApplication",
    "@id": `${url}#app`,
    name: `${SITE_NAME} — ${entry.levelName} (${ARCADE_SHELLS.length} Arcade Games)`,
    applicationCategory: "EducationalApplication, GameApplication",
    operatingSystem: "Any (Web Browser, HTML5 Canvas)",
    url: absoluteUrl(entry.gamesHref),
    inLanguage: ["tr", "en", "ar", "pt"],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: ARCADE_SHELLS.map((s) => s.name).join(", "),
  };

  const videoMeta = getVideoMetadataForLevel(entry);
  const graph = [learningResourceNode, quizNode, softwareAppNode];

  if (videoMeta) {
    graph.push({
      "@type": "VideoObject",
      "@id": `${url}#video`,
      name: videoMeta.name,
      description: videoMeta.description,
      thumbnailUrl: [videoMeta.thumbnailUrl],
      embedUrl: videoMeta.embedUrl,
      contentUrl: videoMeta.contentUrl,
      uploadDate: videoMeta.uploadDate,
      inLanguage: ["tr", "en"],
      isAccessibleForFree: true,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
