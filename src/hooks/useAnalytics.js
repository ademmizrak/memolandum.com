/**
 * useAnalytics — Memolandum Conversion & Event Tracking Hook
 *
 * Google Ads ve GA4 için tüm özel conversion event'leri bu dosyada tanımlıdır.
 * GA4 yüklü değilse (NEXT_PUBLIC_GA4_ID eksik) tüm fonksiyonlar sessizce no-op olur.
 *
 * KULLANIM:
 *   const { trackSignUp, trackGameStart, trackTranslation } = useAnalytics();
 *   trackSignUp("google"); // kullanıcı Google ile kayıt oldu
 *
 * GOOGLE ADS CONVERSION LABELS:
 *   İleride Google Ads konsolundan alacağınız label'ları buraya ekleyin:
 *   CONVERSION_LABELS.signup = "AW-XXXX/LABEL"
 */

import { useCallback } from "react";

// ─── Google Ads Conversion Label'ları (Google Ads konsolundan alınır) ─────────
// Format: "AW-CONVERSION_ID/CONVERSION_LABEL"
const CONVERSION_LABELS = {
  signup:     process.env.NEXT_PUBLIC_ADS_CONV_SIGNUP     || null, // e.g. "AW-123456789/AbCdEfGhIj"
  game_start: process.env.NEXT_PUBLIC_ADS_CONV_GAME_START || null,
  premium:    process.env.NEXT_PUBLIC_ADS_CONV_PREMIUM    || null,
};

// ─── Güvenli gtag wrapper ──────────────────────────────────────────────────────
function fireEvent(eventName, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window._memoGtag === "function") {
      window._memoGtag("event", eventName, params);
    }
  } catch (_) {
    // Sessizce yut — mevcut yapı bozulmaz
  }
}

function fireConversion(label, value = 0, currency = "TRY") {
  if (!label) return;
  try {
    if (typeof window !== "undefined" && typeof window._memoGtag === "function") {
      window._memoGtag("event", "conversion", {
        send_to: label,
        value,
        currency,
      });
    }
  } catch (_) {
    // Sessizce yut
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnalytics() {

  /** Kullanıcı kayıt oldu */
  const trackSignUp = useCallback((method = "email") => {
    fireEvent("sign_up", { method });
    fireConversion(CONVERSION_LABELS.signup);
    // GA4 önerilen event
    fireEvent("generate_lead", { method });
  }, []);

  /** Kullanıcı giriş yaptı */
  const trackLogin = useCallback((method = "email") => {
    fireEvent("login", { method });
  }, []);

  /** Oyun başlatıldı */
  const trackGameStart = useCallback((gameSlug, langPair = "") => {
    fireEvent("level_start", {
      level_name: gameSlug,
      character: langPair,
    });
    fireEvent("select_content", {
      content_type: "game",
      item_id: gameSlug,
    });
    fireConversion(CONVERSION_LABELS.game_start);
  }, []);

  /** Oyun tamamlandı */
  const trackGameComplete = useCallback((gameSlug, score = 0) => {
    fireEvent("level_end", {
      level_name: gameSlug,
      success: true,
      score,
    });
  }, []);

  /** Anlık çeviri kullanıldı */
  const trackTranslation = useCallback((langPair = "") => {
    fireEvent("search", {
      search_term: "translate",
      content_type: "translation",
      item_category: langPair,
    });
  }, []);

  /** Kelime kasasına kelime eklendi */
  const trackVaultAdd = useCallback((word = "", langPair = "") => {
    fireEvent("add_to_wishlist", {
      item_name: word,
      item_category: langPair,
      item_list_name: "word_vault",
    });
  }, []);

  /** Premium satın alma başlatıldı */
  const trackPremiumStart = useCallback((plan = "translation_pack") => {
    fireEvent("begin_checkout", {
      item_name: plan,
      value: 29.99,
      currency: "TRY",
    });
  }, []);

  /** Premium satın alma tamamlandı */
  const trackPremiumPurchase = useCallback((plan = "translation_pack", value = 29.99) => {
    fireEvent("purchase", {
      transaction_id: `memo_${Date.now()}`,
      value,
      currency: "TRY",
      items: [{ item_id: plan, item_name: plan, price: value }],
    });
    fireConversion(CONVERSION_LABELS.premium, value, "TRY");
  }, []);

  /** Dil profili oluşturuldu */
  const trackProfileCreate = useCallback((langPair = "") => {
    fireEvent("tutorial_complete", {
      item_category: langPair,
    });
  }, []);

  /** Sayfa görüntülendi (manuel — SPA yönlendirmeleri için) */
  const trackPageView = useCallback((path = "", title = "") => {
    fireEvent("page_view", {
      page_path: path || window?.location?.pathname,
      page_title: title || document?.title,
    });
  }, []);

  return {
    trackSignUp,
    trackLogin,
    trackGameStart,
    trackGameComplete,
    trackTranslation,
    trackVaultAdd,
    trackPremiumStart,
    trackPremiumPurchase,
    trackProfileCreate,
    trackPageView,
  };
}
