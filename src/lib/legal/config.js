/** Tek hukuki yüzey — web + gelecekteki Android/iOS (ayrı versiyon yok) */
import { SITE_URL, absoluteUrl } from "../seo/siteConfig";

export const LEGAL_CONTACT_EMAIL = "info@memolandum.com";
/** ISO — maddi hukuki güncellemede değiştirin */
export const LEGAL_LAST_UPDATED = "2026-07-18";

export const LEGAL_CONTROLLER_NAME = "Memolandum";
export const LEGAL_BRAND = "Memolandum";

export const LEGAL_PATHS = {
  index: "/legal/",
  privacy: "/legal/privacy/",
  terms: "/legal/terms/",
};

export const LEGAL_URLS = {
  privacy: absoluteUrl(LEGAL_PATHS.privacy),
  terms: absoluteUrl(LEGAL_PATHS.terms),
  index: absoluteUrl(LEGAL_PATHS.index),
  contactMailto: `mailto:${LEGAL_CONTACT_EMAIL}`,
  site: SITE_URL,
  about: absoluteUrl("/about/"),
};
