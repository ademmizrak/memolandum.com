import tr from "./messages/tr";
import en from "./messages/en";
import ar from "./messages/ar";
import pt from "./messages/pt";
import { DEFAULT_LOCALE } from "./config";

const catalogs = { tr, en, ar, pt };

export function getMessages(locale) {
  return catalogs[locale] || catalogs[DEFAULT_LOCALE];
}

/** Nested key: "nav.home" */
export function translate(locale, key, vars) {
  const parts = String(key).split(".");
  let cur = getMessages(locale);
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") {
      cur = undefined;
      break;
    }
    cur = cur[p];
  }
  const fallback = typeof vars === "string" ? vars : key;
  let str = typeof cur === "string" ? cur : fallback;
  if (vars && typeof vars === "object" && typeof str === "string") {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}
