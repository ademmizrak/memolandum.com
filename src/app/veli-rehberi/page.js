import VeliRehberiClient from "./VeliRehberiClient";
import { buildParentGuideJsonLd } from "../../lib/seo/jsonLd";
import { OG_IMAGE, absoluteUrl, buildPageAlternates } from "../../lib/seo/siteConfig";

export const metadata = {
  title: "Veli Kullanım, Karne ve Çocuk Güvenliği Rehberi | Memolandum",
  description:
    "İngilizce bilmeseniz bile çocuğunuzun gelişimini Veli Başarı Karnesi ile nasıl takip edebileceğinizi, akşam yemeğinde Türkçe okunuşlu '3 Kelime Aile Oyunu'nu ve %100 reklamsız çocuk güvenli yapımızı 1 dakikada keşfedin.",
  keywords: [
    "veli ingilizce takip karnesi",
    "çocuk ingilizce gelişim karnesi",
    "evde çocukla ingilizce kelime oyunu",
    "reklamsız çocuk ingilizce uygulaması",
    "memolandum veli rehberi",
    "ilkokul ortaokul ingilizce veli takip",
  ],
  openGraph: {
    title: "Veli Kullanım, Karne ve Çocuk Güvenliği Rehberi | Memolandum",
    description:
      "Velilerimiz için 1 dakikalık sade rehber: Başarı Karnesi, Evde 3 Kelime Aile Oyunu, WhatsApp gurur mesajları ve %100 reklamsız çocuk güvenliği.",
    url: absoluteUrl("/veli-rehberi/"),
    siteName: "Memolandum",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Veli Rehberi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veli Kullanım, Karne ve Çocuk Güvenliği Rehberi | Memolandum",
    description:
      "Başarı Karnesi, Evde 3 Kelime Aile Oyunu ve %100 reklamsız çocuk güvenliği rehberi.",
    images: [OG_IMAGE],
  },
  alternates: buildPageAlternates("/veli-rehberi/"),
};

export default function VeliRehberiPage() {
  const jsonLd = buildParentGuideJsonLd();
  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <VeliRehberiClient />
    </>
  );
}
