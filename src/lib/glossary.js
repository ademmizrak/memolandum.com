import fs from "fs";
import path from "path";

// Memory cache to prevent repeated disk reads during dynamic renders
let cachedConcepts = null;
let cachedCategories = null;
let cachedByCategory = null;
let cachedBySlug = null;

export function toLightweightConcept(c) {
  if (!c) return null;
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    category: c.category,
    categoryName: c.categoryName,
    description: c.description,
    tags: c.tags || [],
    level: c.level || "",
    word_alt: c.word_alt || "",
  };
}

export const CATEGORY_META = {
  "cografya": {
    name: "Coğrafya",
    desc: "KPSS ve genel kültür sınavlarına yönelik yer şekilleri, iklim, jeopolitik konum ve Türkiye coğrafyası kavramları.",
    tags: ["KPSS", "Coğrafya", "Sınav Hazırlık"]
  },
  "genel-kultur": {
    name: "Genel Kültür",
    desc: "Tarihî olaylar, spor başarıları, uluslararası kuruluşlar ve güncel kültürel gelişmeleri kapsayan geniş bilgi hazinesi.",
    tags: ["Genel Kültür", "Güncel Bilgiler", "KPSS"]
  },
  "matematik-geometri": {
    name: "Matematik & Geometri",
    desc: "Temel aritmetik, cebirsel bağıntılar, geometri formülleri, grafikler ve istatistiksel analiz kavramları.",
    tags: ["Matematik", "Geometri", "Analitik Düşünme"]
  },
  "tarih": {
    name: "Tarih",
    desc: "İslamiyet öncesi Türk tarihi, Osmanlı İmparatorluğu, Kurtuluş Savaşı, Cumhuriyet tarihi ve dünya tarihi dönüm noktaları.",
    tags: ["KPSS", "Tarih", "Sosyal Bilimler"]
  },
  "turkce": {
    name: "Türkçe",
    desc: "Dil bilgisi kuralları, sözcük ve cümle anlamları, anlatım bozuklukları ve temel edebiyat terminolojisi.",
    tags: ["Türkçe", "Dil Bilgisi", "Sınav Hazırlık"]
  },
  "vatandaslik": {
    name: "Vatandaşlık",
    desc: "Temel hukuk kuralları, Anayasa maddeleri, devlet yönetimi, idare hukuku ve temel insan hakları.",
    tags: ["KPSS", "Vatandaşlık", "Hukuk Bilgisi"]
  },
  "astronomi-uzay": {
    name: "Astronomi & Uzay",
    desc: "Astrofizik, kozmik yapılar, kara delikler, yıldızların evrimi ve uzay havacılığına dair en temel teknik terimler.",
    tags: ["Astrofizik", "Kozmoloji", "Uzay Bilimi"]
  },
  "hukuk": {
    name: "Hukuk",
    desc: "Medeni hukuk, ceza hukuku, borçlar hukuku ve roma hukuku derslerindeki en önemli akademik terimler.",
    tags: ["Hukuk Fakültesi", "Mevzuat", "Akademik Hukuk"]
  },
  "mimari": {
    name: "Mimarlık",
    desc: "Tarihsel mimari üsluplar, yapı elemanları, restorasyon teorileri ve şehircilik tasarım prensipleri.",
    tags: ["Mimarlık", "Sanat Tarihi", "Tasarım"]
  },
  "tip": {
    name: "Tıp",
    desc: "Tıp fakültesi anatomik terimleri, fizyolojik süreçler, hastalıklar ve tıbbi terminolojinin anahtar kavramları.",
    tags: ["Tıp Fakültesi", "Anatomi", "Fizyoloji"]
  }
};

/**
 * Loads all glossary concepts from the public/data/academic directory.
 * Standardized schema: { id, title, slug, category, categoryName, description, content, tags, level, word_alt }
 */
export function loadGlossaryData() {
  if (cachedConcepts) return cachedConcepts;

  // turbopackIgnore: prevent NFT from tracing the entire project
  const cwd = /*turbopackIgnore: true*/ process.cwd();
  const primaryDir = path.join(/*turbopackIgnore: true*/ cwd, "public", "data", "academic");
  const slimFallbackDir = path.join(/*turbopackIgnore: true*/ cwd, "public", "_slim_skip_data", "academic");

  let baseDir = primaryDir;
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ primaryDir) && fs.existsSync(/*turbopackIgnore: true*/ slimFallbackDir)) {
      baseDir = slimFallbackDir;
    }
    if (!fs.existsSync(/*turbopackIgnore: true*/ baseDir)) {
      cachedConcepts = [];
      return cachedConcepts;
    }
  } catch {
    cachedConcepts = [];
    return cachedConcepts;
  }

  const subDirs = ["kpss_sinav", "technic"];
  const allConcepts = [];

  for (const sub of subDirs) {
    const dirPath = path.join(/*turbopackIgnore: true*/ baseDir, sub);
    let files = [];
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ dirPath)) continue;
      files = fs
        .readdirSync(/*turbopackIgnore: true*/ dirPath)
        .filter((f) => f.endsWith(".json") && f !== "glossary-index.json");
    } catch {
      continue;
    }

    for (const file of files) {
      const filePath = path.join(/*turbopackIgnore: true*/ dirPath, file);
      try {
        const content = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8");
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && typeof item.description === "string") {
              item.description = item.description.replace(/\s*\[cite:\s*[\d,\s]+\]/gi, "").trim();
            }
            if (item && typeof item.content === "string") {
              item.content = item.content.replace(/\s*\[cite:\s*[\d,\s]+\]/gi, "").trim();
            }
            allConcepts.push(item);
          }
        }
      } catch (err) {
        console.error(`[Glossary] Error reading/parsing file: ${filePath}`, err);
      }
    }
  }

  cachedConcepts = allConcepts;
  return allConcepts;
}

/**
 * Returns list of metadata for all 10 categories including counts
 */
export function getAllCategories() {
  if (cachedCategories) return cachedCategories;

  const concepts = loadGlossaryData();
  const counts = {};

  concepts.forEach((c) => {
    if (c.category) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
  });

  const categories = Object.keys(CATEGORY_META).map((slug) => {
    const meta = CATEGORY_META[slug];
    return {
      slug,
      name: meta.name,
      desc: meta.desc,
      tags: meta.tags,
      count: counts[slug] || 0
    };
  });

  cachedCategories = categories;
  return categories;
}

/**
 * Returns metadata of a specific category
 */
export function getCategoryBySlug(slug) {
  const categories = getAllCategories();
  return categories.find((c) => c.slug === slug) || null;
}

/**
 * Returns concepts belonging to a specific category
 */
export function getConceptsByCategory(categorySlug) {
  if (!cachedByCategory) {
    const concepts = loadGlossaryData();
    cachedByCategory = new Map();
    for (const c of concepts) {
      if (!cachedByCategory.has(c.category)) cachedByCategory.set(c.category, []);
      cachedByCategory.get(c.category).push(c);
    }
  }
  return cachedByCategory.get(categorySlug) || [];
}

/**
 * Finds a specific concept in a category
 */
export function getConceptBySlug(categorySlug, conceptSlug) {
  if (!cachedBySlug) {
    const concepts = loadGlossaryData();
    cachedBySlug = new Map();
    for (const c of concepts) {
      cachedBySlug.set(`${c.category}::${c.slug}`, c);
    }
  }
  return cachedBySlug.get(`${categorySlug}::${conceptSlug}`) || null;
}

/**
 * Returns concepts that have similar tags or belong to the same category
 */
export function getRelatedConcepts(concept, limit = 6) {
  if (!concept) return [];
  const concepts = getConceptsByCategory(concept.category);
  const filtered = concepts.filter((c) => c.id !== concept.id);

  // Score based on shared tags
  const scored = filtered.map((c) => {
    const intersection = c.tags.filter((t) => concept.tags.includes(t)).length;
    return { concept: c, score: intersection };
  });

  // Sort by score desc, fallback to a stable sort
  scored.sort((a, b) => b.score - a.score || a.concept.title.localeCompare(b.concept.title));

  return scored.slice(0, limit).map((s) => s.concept);
}
