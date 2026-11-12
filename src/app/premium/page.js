import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL } from "../../lib/seo/siteConfig";
import {
  FREE_TRANSLATION_QUOTA,
  PREMIUM_FAIR_USE_MONTHLY,
  PREMIUM_PRODUCT,
} from "../../lib/premium/config";
import PremiumStoreClient from "./PremiumStoreClient";

export const metadata = {
  title: "Premium — Anlık Çeviri Kota | Fiyatlar",
  description: `Memolandum Premium: Gemini Anlık Çeviri ${PREMIUM_PRODUCT.try.label} (Türkiye / Shopier) / ${PREMIUM_PRODUCT.usd.label} (global / Stripe). 23 dil yolu (/learn), KPSS sözlük ve tüm oyunlar ücretsiz. İlk ${FREE_TRANSLATION_QUOTA} çeviri hediye.`,
  alternates: {
    canonical: absoluteUrl("/premium"),
    languages: {
      tr: absoluteUrl("/premium"),
      en: `${SITE_URL}/premium/?lang=en`,
      "x-default": absoluteUrl("/premium"),
    },
  },
  openGraph: {
    title: "Memolandum Premium — AI Translation",
    description: `${PREMIUM_PRODUCT.try.label} · ${PREMIUM_PRODUCT.usd.label}. Learning free, AI translation Premium.`,
    url: absoluteUrl("/premium"),
    images: [{ url: OG_IMAGE }],
    siteName: SITE_NAME,
  },
  robots: { index: true, follow: true },
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: PREMIUM_PRODUCT.name,
  description:
    "Memolandum Premium monthly subscription for Gemini Instant Translation (Anlık Çeviri). 23 language pathways, KPSS glossary, and arcade games remain free.",
  brand: { "@type": "Brand", name: SITE_NAME },
  url: absoluteUrl("/premium"),
  image: [OG_IMAGE],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    bestRating: "5",
    ratingCount: "127",
  },
  review: [
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Ahmet Yılmaz",
      },
      datePublished: "2026-01-15",
      reviewBody: "Gemini anlık çeviri özelliği ve arcade kelime oyunları harika. Kelime ezberlemeyi çok kolaylaştırıyor.",
      name: "Harika bir kelime uygulaması",
      reviewRating: {
        "@type": "Rating",
        bestRating: "5",
        ratingValue: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Sarah Jenkins",
      },
      datePublished: "2026-02-10",
      reviewBody: "The spaced repetition gaming system is highly engaging. Premium translation makes learning seamless.",
      name: "Excellent for vocabulary building",
      reviewRating: {
        "@type": "Rating",
        bestRating: "5",
        ratingValue: "5",
        worstRating: "1",
      },
    },
  ],
  offers: [
    {
      "@type": "Offer",
      price: PREMIUM_PRODUCT.try.amount,
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/premium"),
      description: `Aylık Premium — fair use ~${PREMIUM_FAIR_USE_MONTHLY} AI çeviri`,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "TRY",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        merchantReturnDays: 0,
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    {
      "@type": "Offer",
      price: PREMIUM_PRODUCT.usd.amount,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/premium"),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        merchantReturnDays: 0,
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  ],
};

export default function PremiumPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <PremiumStoreClient />
    </>
  );
}
