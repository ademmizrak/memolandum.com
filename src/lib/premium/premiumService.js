import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, cloudFuncs } from "../firebase/config";
import { isNativeApp } from "../../utils/platform";
import {
  isNativeIapPlatform,
  purchasePremiumPackage,
  restorePremiumPurchases,
  syncPremiumFromRevenueCat,
} from "./revenueCat";

const TR_PROVIDERS = new Set(["shopier", "iyzico"]);
const SHOPIER_FALLBACK_URL = "https://www.shopier.com/49186522";

function submitPostForm(actionUrl, fields = {}) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value != null ? String(value) : "";
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

/**
 * Web'de Shopier (TR) / Stripe (Global) Cloud Function üzerinden ödeme başlatır.
 * Mobil uygulamada (Google Play / App Store) yerel mağaza (IAP) üzerinden abonelik başlatır.
 */
export async function startPremiumCheckout(provider = "shopier") {
  if (provider === "native" || isNativeApp() || (await isNativeIapPlatform())) {
    if (!auth?.currentUser) {
      const err = new Error("login-required");
      err.code = "login-required";
      throw err;
    }
    return purchasePremiumPackage();
  }

  const targetProvider = provider || "shopier";

  // Misafir kullanıcı web'de doğrudan Shopier güvenli ödeme sayfasına yönlendirilir
  // (Shopier ödeme formundaki e-posta ile webhook eşleşmesi desteklenir)
  if (!auth?.currentUser) {
    window.location.href = SHOPIER_FALLBACK_URL;
    return { provider: "shopier", checkoutUrl: SHOPIER_FALLBACK_URL };
  }

  try {
    const createCheckout = httpsCallable(cloudFuncs, "createPremiumCheckout");
    const res = await createCheckout({ provider: targetProvider });
    const data = res?.data || {};

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return data;
    }
    if (data.paymentPageUrl) {
      window.location.href = data.paymentPageUrl;
      return data;
    }
    if (data.formAction && data.formFields) {
      submitPostForm(data.formAction, data.formFields);
      return data;
    }
  } catch (err) {
    console.warn("createPremiumCheckout callable fallback:", err?.message || err);
    window.location.href = SHOPIER_FALLBACK_URL;
    return { provider: "shopier", checkoutUrl: SHOPIER_FALLBACK_URL };
  }

  window.location.href = SHOPIER_FALLBACK_URL;
  return { provider: "shopier", checkoutUrl: SHOPIER_FALLBACK_URL };
}

export { restorePremiumPurchases, syncPremiumFromRevenueCat, isNativeIapPlatform };

export function isTrPaymentProvider(provider) {
  return TR_PROVIDERS.has(provider);
}

/** Firestore billing/subscription → aktif mi? */
export function isSubscriptionActive(sub) {
  if (!sub || typeof sub !== "object") return false;
  if (sub.status === "active" || sub.status === "trialing") {
    if (sub.premiumUntil) {
      const until = sub.premiumUntil.toDate
        ? sub.premiumUntil.toDate()
        : new Date(sub.premiumUntil);
      return until.getTime() > Date.now();
    }
    return true;
  }
  return false;
}

/**
 * Aktif abonelik dinleyicisi — yazma yok (yalnızca Admin Function yazar).
 */
export function subscribeToPremiumStatus(uid, onChange) {
  if (!uid || !db) {
    onChange(false, null);
    return () => {};
  }
  const ref = doc(db, "users", uid, "billing", "subscription");
  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? snap.data() : null;
      onChange(isSubscriptionActive(data), data);
    },
    (err) => {
      console.warn("premium snapshot:", err?.message || err);
      onChange(false, null);
    }
  );
}
