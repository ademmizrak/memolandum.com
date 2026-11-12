/**
 * Kelime Kasası dil etiketleri — filtre ve görüntüleme için normalize.
 */

import { findSubContext } from "./studyContext";

const FOLDER_FLAGS = {
  Spanish: "🇪🇸",
  French: "🇫🇷",
  Almanca: "🇩🇪",
  Italy: "🇮🇹",
  Russian: "🇷🇺",
  Portugal: "🇧🇷",
  Japan: "🇯🇵",
  Korean: "🇰🇷",
  Arabic: "🇸🇦",
  Greek: "🇬🇷",
  Chinesee: "🇨🇳",
  Osm_Tr: "📜",
};

/**
 * @returns {{ key: string, label: string, flag: string, raw: string }}
 */
export function resolveVaultLanguage(rawLanguage) {
  const raw = String(rawLanguage || "").trim();
  if (!raw) {
    return { key: "_unknown", label: "Dil yok", flag: "🌐", raw: "" };
  }

  if (raw.startsWith("ai:")) {
    const code = raw.slice(3).toUpperCase() || "?";
    return {
      key: `ai:${raw.slice(3).toLowerCase()}`,
      label: `Çeviri · ${code}`,
      flag: "✨",
      raw,
    };
  }

  const sub = findSubContext(raw);
  if (sub) {
    // Aynı ana dil ailesini tek filtrede topla (YDS + genel İngilizce vb.)
    let key = raw;
    let label = sub.langName;
    let flag = "🌐";

    if (raw.startsWith("en-tr") || sub.mainId === "en-tr") {
      key = "en-tr";
      label = "İngilizce";
      flag = "🇬🇧";
    } else if (/portugal|brpt/i.test(raw)) {
      const isTr = /brpt_tr|brpt-tr|_tr$/i.test(raw) || sub.langName.includes("Türkçe");
      key = isTr ? "pt-tr" : "pt-en";
      label = isTr ? "Portekizce · Türkçe" : "Portekizce · İngilizce";
      flag = "🇧🇷";
    } else if (/almanca|de_/i.test(raw)) {
      key = "de";
      label = sub.langName;
      flag = "🇩🇪";
    } else if (/french|fr_/i.test(raw)) {
      key = "fr";
      label = sub.langName;
      flag = "🇫🇷";
    } else if (/spanish|es_/i.test(raw)) {
      key = "es";
      label = sub.langName;
      flag = "🇪🇸";
    } else if (/korean|ko_/i.test(raw)) {
      key = "ko";
      label = sub.langName;
      flag = "🇰🇷";
    } else if (/japan|ja_/i.test(raw)) {
      key = "ja";
      label = sub.langName;
      flag = "🇯🇵";
    } else if (/russian|ru_/i.test(raw)) {
      key = "ru";
      label = sub.langName;
      flag = "🇷🇺";
    } else if (/arab|ar_/i.test(raw)) {
      key = "ar";
      label = sub.langName;
      flag = "🇸🇦";
    } else if (/greek|el_/i.test(raw)) {
      key = "el";
      label = sub.langName;
      flag = "🇬🇷";
    } else if (/italy|it_/i.test(raw)) {
      key = "it";
      label = sub.langName;
      flag = "🇮🇹";
    } else if (/chinese|zh_|chinesee/i.test(raw)) {
      key = "zh";
      label = sub.langName;
      flag = "🇨🇳";
    } else if (/osm/i.test(raw)) {
      key = "osm";
      label = sub.langName || "Osmanlıca";
      flag = "📜";
    } else {
      key = `sub:${raw}`;
      label = sub.langName;
    }

    return { key, label, flag, raw };
  }

  // Klasör adı (Portugal, Almanca…)
  if (FOLDER_FLAGS[raw]) {
    return { key: `folder:${raw}`, label: raw, flag: FOLDER_FLAGS[raw], raw };
  }

  return { key: `raw:${raw.toLowerCase()}`, label: raw, flag: "🌐", raw };
}

export function languageMatchesFilter(wordLanguage, filterKey) {
  if (!filterKey || filterKey === "all") return true;
  const meta = resolveVaultLanguage(wordLanguage);
  return meta.key === filterKey || meta.raw === filterKey;
}

/** Dropdown seçenekleri — benzersiz key */
export function buildLanguageFilterOptions(words = []) {
  const map = new Map();
  for (const w of words) {
    const meta = resolveVaultLanguage(w.language);
    if (!map.has(meta.key)) {
      map.set(meta.key, { value: meta.key, label: `${meta.flag} ${meta.label}`, count: 0 });
    }
    map.get(meta.key).count += 1;
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "tr"));
}
