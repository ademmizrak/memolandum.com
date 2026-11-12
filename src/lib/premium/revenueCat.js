/**
 * RevenueCat (yalnızca Capacitor native).
 * Web'de tüm export'lar no-op / false döner — Shopier/Stripe yolu bozulmaz.
 */

const ENTITLEMENT_ID = "premium";

let configurePromise = null;
let configuredUid = null;

export async function isNativeIapPlatform() {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function resolveApiKey(platform) {
  const key =
    platform === "ios"
      ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
  const trimmed = (key || "").trim();
  if (!trimmed || /placeholder/i.test(trimmed)) return null;
  return trimmed;
}

export function isPremiumEntitlementActive(customerInfo) {
  const active = customerInfo?.entitlements?.active;
  if (!active || typeof active !== "object") return false;
  return typeof active[ENTITLEMENT_ID] !== "undefined";
}

/**
 * Purchases.configure — uid başına tek promise (satın alma configure bitmeden açılmaz).
 * @returns {Promise<boolean>} yapılandırıldı mı
 */
export async function ensureRevenueCatConfigured(uid) {
  if (!(await isNativeIapPlatform()) || !uid) return false;

  if (configurePromise && configuredUid === uid) {
    return configurePromise;
  }

  configuredUid = uid;
  configurePromise = (async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const apiKey = resolveApiKey(Capacitor.getPlatform());
      if (!apiKey) {
        console.warn(
          "RevenueCat API key eksik — NEXT_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY ayarlayın."
        );
        return false;
      }
      await Purchases.configure({
        apiKey,
        appUserID: uid,
      });
      return true;
    } catch (e) {
      console.warn("RevenueCat configure failed:", e?.message || e);
      configuredUid = null;
      return false;
    }
  })();

  return configurePromise;
}

/** RC customer info → store (source: revenuecat). */
export async function syncPremiumFromRevenueCat() {
  if (!(await isNativeIapPlatform())) return false;
  try {
    const { auth } = await import("../firebase/config");
    const uid = auth?.currentUser?.uid;
    const ready = await ensureRevenueCatConfigured(uid);
    if (!ready) return false;

    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const infoResult = await Purchases.getCustomerInfo();
    const customerInfo = infoResult?.customerInfo ?? infoResult;
    const active = isPremiumEntitlementActive(customerInfo);
    const { useMemolandumStore } = await import("../../store/useMemolandumStore");
    useMemolandumStore.getState().setPremium(active, { source: "revenuecat" });
    return active;
  } catch (e) {
    console.warn("RevenueCat sync failed:", e?.message || e);
    return false;
  }
}

export async function restorePremiumPurchases() {
  if (!(await isNativeIapPlatform())) {
    throw new Error("Geri yükleme yalnızca mobil uygulamada kullanılabilir.");
  }
  const { auth } = await import("../firebase/config");
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    const err = new Error("login-required");
    err.code = "login-required";
    throw err;
  }
  const ready = await ensureRevenueCatConfigured(uid);
  if (!ready) {
    throw new Error(
      "Uygulama içi satın alma yapılandırılmadı. Lütfen daha sonra tekrar deneyin."
    );
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.restorePurchases();
  const active = isPremiumEntitlementActive(customerInfo);
  const { useMemolandumStore } = await import("../../store/useMemolandumStore");
  useMemolandumStore.getState().setPremium(active, { source: "revenuecat" });
  return { restored: true, isPremium: active };
}

export async function purchasePremiumPackage() {
  if (!(await isNativeIapPlatform())) {
    throw new Error("Native IAP yalnızca mobil uygulamada kullanılabilir.");
  }
  const { auth } = await import("../firebase/config");
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    const err = new Error("login-required");
    err.code = "login-required";
    throw err;
  }

  const ready = await ensureRevenueCatConfigured(uid);
  if (!ready) {
    throw new Error(
      "Uygulama içi satın alma yapılandırılmadı. App Store / Play ürün ve RevenueCat anahtarlarını kontrol edin."
    );
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const offerings = await Purchases.getOfferings();
  const packages = offerings?.current?.availablePackages || [];
  if (!packages.length) {
    throw new Error(
      "Aktif Premium paketi bulunamadı. Lütfen App Store / Google Play ürün ayarlarını kontrol edin."
    );
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: packages[0],
    });
    const active = isPremiumEntitlementActive(customerInfo);
    const { useMemolandumStore } = await import("../../store/useMemolandumStore");
    useMemolandumStore.getState().setPremium(active, { source: "revenuecat" });
    return { nativePurchased: true, isPremium: active };
  } catch (e) {
    if (e?.userCancelled) {
      throw new Error("Ödeme işlemi iptal edildi.");
    }
    throw new Error(e?.message || "Satın alma işlemi native olarak başarısız oldu.");
  }
}

/** Logout / kullanıcı değişimi için configure cache sıfırla */
export function resetRevenueCatSession() {
  configurePromise = null;
  configuredUid = null;
}
