"use client";

/**
 * GoogleAnalytics — Memolandum Analytics & Ads Tracking Komponenti
 *
 * Yalnızca NEXT_PUBLIC_GA4_ID tanımlıysa yüklenir.
 * Mevcut çalışan yapıya hiçbir yan etkisi yoktur.
 *
 * Env vars:
 *   NEXT_PUBLIC_GA4_ID         = G-XXXXXXXXXX    (Google Analytics 4)
 *   NEXT_PUBLIC_ADS_ID         = AW-XXXXXXXXXX   (Google Ads Conversion Tag — opsiyonel)
 *
 * Kullanım: <GoogleAnalytics /> → layout.js'e eklenmiştir
 */

import Script from "next/script";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID;

export default function GoogleAnalytics() {
  // ID yoksa hiçbir şey yükleme — mevcut yapı bozulmaz
  if (!GA4_ID) return null;

  const gtmSrc = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        id="gtag-script"
        src={gtmSrc}
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // GA4 temel yapılandırma
            gtag('config', '${GA4_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: true,
              // Kullanıcı gizliliği (KVKK / GDPR uyumlu)
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
            });

            ${ADS_ID ? `// Google Ads Conversion Tag\ngtag('config', '${ADS_ID}');` : "// Google Ads ID henüz eklenmedi (NEXT_PUBLIC_ADS_ID)"}

            // Memolandum özel eventleri window'a aç — useAnalytics hook kullanır
            window._memoGtag = function() {
              if (typeof gtag === 'function') {
                gtag.apply(null, arguments);
              }
            };
          `,
        }}
      />
    </>
  );
}
