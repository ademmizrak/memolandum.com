import { Capacitor } from "@capacitor/core";

/**
 * Central platform & Google Play Store compliance utility.
 * Evaluated safely in both SSR (Next.js static export) and browser/WebView runtime.
 */
export const IS_NATIVE_APP =
  typeof window !== "undefined" ? Capacitor.isNativePlatform() : false;

export const IS_PLAY_BILLING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PLAY_BILLING === "true" ||
  process.env.VITE_ENABLE_PLAY_BILLING === "true";

export const ANDROID_FREE_QUOTA_MESSAGE_TR =
  "Günlük/Ücretsiz AI Çeviri kotanız doldu. Tüm kelime oyunları ve 23 dil yolu ücretsiz olarak açıktır!";

export const ANDROID_FREE_QUOTA_MESSAGE_EN =
  "Your daily/free AI Translation quota is full. All vocabulary games and 23 language pathways are open for free!";

/**
 * Runtime-safe check for Capacitor Native (Android / iOS) WebView environment.
 */
export function isNativeApp() {
  if (typeof window === "undefined") return false;
  try {
    return !!(
      Capacitor.isNativePlatform() ||
      window.Capacitor?.isNativePlatform?.()
    );
  } catch {
    return !!(window.Capacitor?.isNativePlatform?.());
  }
}

/**
 * Returns true ONLY inside the native mobile app (Android / iOS Capacitor WebView)
 * so 3rd-party external web payment links (Shopier, Stripe, Kreosus) are hidden in Google Play / App Store builds,
 * while remaining 100% active and visible on the public website (memolandum.com).
 */
export function shouldHideExternalPayments() {
  return isNativeApp();
}

/**
 * Native OS Share Sheet integration via @capacitor/share with Web Share API fallback.
 * @param {{ title?: string, text?: string, url?: string, dialogTitle?: string }} opts
 * @returns {Promise<boolean>} true if shared (or user dismissed share sheet), false if unsupported
 */
export async function shareContent({ title, text, url, dialogTitle } = {}) {
  if (typeof window === "undefined") return false;

  if (isNativeApp()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: title || "Memolandum",
        text: text || "",
        url: url || "https://memolandum.com",
        dialogTitle: dialogTitle || title || "Paylaş",
      });
      return true;
    } catch (err) {
      const msg = String(err?.message || err || "");
      if (/cancel|dismiss|abort/i.test(msg)) {
        return true;
      }
      console.warn("[Share] Native share failed, trying fallback:", msg);
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: title || "Memolandum",
        text: text || "",
        url: url || "https://memolandum.com",
      });
      return true;
    } catch (err) {
      if (err?.name === "AbortError") return true;
    }
  }

  return false;
}

/**
 * Light haptic feedback for arcade game collisions & correct word recalls on Android/iOS.
 * @param {"light" | "medium" | "heavy" | "success" | "warning" | "error"} type
 */
export async function triggerHaptic(type = "light") {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import(
      "@capacitor/haptics"
    );
    if (type === "success") {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === "warning") {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === "error") {
      await Haptics.notification({ type: NotificationType.Error });
    } else if (type === "heavy") {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === "medium") {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    /* ignore haptics errors on unsupported devices */
  }
}
