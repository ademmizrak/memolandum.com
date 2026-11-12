/**
 * Öğrenme bedava · AI çeviri premium
 *
 * Maliyet notu (2026 ölçüm): ~60 cümle ≈ 4 TRY Google AI → ~0,067 TRY/çeviri.
 * Yoğun kullanım 50/gün ≈ 1500/ay ≈ ~100 TRY API → Premium fiyatı bunun üzerinde olmalı.
 */

/** Üye hesabına özel ömür boyu ücretsiz AI deneme */
export const FREE_TRANSLATION_QUOTA = 10;

/** Misafir: kötüye kullanımı kesmek için daha düşük; sonrası giriş */
export const GUEST_TRANSLATION_QUOTA = 3;

/**
 * Premium “fair use” — sınırsız reklamı yerine makul tavan + hız limiti.
 * API maliyetini korur; dürüst öğreneni engellemez.
 */
export const PREMIUM_FAIR_USE_MONTHLY = 1200;

/**
 * 3. taraf web ödeme kanalları (Shopier/Stripe) Google Play Store politikası gereği devre dışı bırakıldı.
 * Ödemeler yalnızca Google Play / App Store üzerinden alınır.
 */
export const PAYMENTS_LIVE = true;

export const PREMIUM_PRODUCT = {
  id: "memolandum_premium_monthly",
  name: "Memolandum Premium",
  slogan: {
    tr: "Tüm Oyunlar & Seviyeler Ücretsiz · AI Çeviri Premium",
    en: "All Games & Levels Free · AI Translation is Premium",
  },
  /** TR — maliyet + 2× marj hedefi (~100 TRY API → ~199 TL) */
  try: {
    amount: 199,
    currency: "TRY",
    label: "199 TL / ay",
    compareAt: "249 TL",
    provider: "shopier",
  },
  /** Global — DeepL/ChatGPT altı, sürdürülebilir */
  usd: {
    amount: 5.99,
    currency: "USD",
    label: "$5.99 / month",
    compareAt: "$7.99",
    provider: "stripe",
  },
  periodDays: 30,
  fairUseMonthly: PREMIUM_FAIR_USE_MONTHLY,
  features: {
    tr: [
      {
        title: "Yüksek hacimli AI çeviri",
        desc: `Ayda ~${PREMIUM_FAIR_USE_MONTHLY} çeviriye kadar fair-use (metin + ses) — API maliyeti Premium’da`,
      },
      {
        title: "Tüm oyunlar ve seviyeler ücretsiz",
        desc: "Statik kelime veritabanı ve arcade oyunlar herkese sonsuza kadar ücretsiz",
      },
      {
        title: "İlk 10 çeviri hediye",
        desc: "Her üye hesabında bir kez — denemek için yeterli, hesap çoğaltmayı engelleriz",
      },
      {
        title: "Bulut senkron & kasa",
        desc: "İlerleme ve kelime kasası hesabınızda güvende",
      },
    ],
    en: [
      {
        title: "High-volume AI translation",
        desc: `Up to ~${PREMIUM_FAIR_USE_MONTHLY} translations/month fair use (text + voice)`,
      },
      {
        title: "Learning stays free",
        desc: "Static word databases & arcade games free forever",
      },
      {
        title: "10 free translations",
        desc: "Once per member account — enough to try, hard to abuse",
      },
      {
        title: "Cloud sync & vault",
        desc: "Progress and word vault on your account",
      },
    ],
  },
};

export function freeQuotaForUser(isAuthenticated) {
  return isAuthenticated ? FREE_TRANSLATION_QUOTA : GUEST_TRANSLATION_QUOTA;
}

export function remainingFreeTranslations(count = 0, isAuthenticated = false) {
  const max = freeQuotaForUser(isAuthenticated);
  return Math.max(0, max - (Number(count) || 0));
}

export {
  IS_NATIVE_APP,
  IS_PLAY_BILLING_ENABLED,
  ANDROID_FREE_QUOTA_MESSAGE_TR,
  ANDROID_FREE_QUOTA_MESSAGE_EN,
  isNativeApp,
  shouldHideExternalPayments,
} from "../../utils/platform";

