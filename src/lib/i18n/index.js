import tr from "./messages/tr";
import en from "./messages/en";
import { DEFAULT_LOCALE } from "./config";

const catalogs = { tr, en };

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
  let str = typeof cur === "string" ? cur : key;
  if (vars && typeof str === "string") {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}
