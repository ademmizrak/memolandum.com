import SchoolsClient from "../../components/schools/SchoolsClient";
import { buildSchoolsPageJsonLd } from "../../lib/seo/jsonLd";
import { OG_IMAGE, absoluteUrl, buildPageAlternates } from "../../lib/seo/siteConfig";

export const metadata = {
  title: "Akıllı Tahta Uyumlu Sınıf İçi İngilizce Kelime Oyunları & Öğretmen Masası | Memolandum",
  description:
    "Akıllı tahta uyumlu, üyelik gerektirmeyen sınıf içi İngilizce kelime oyunları (EBA / ETAP). 30 saniyede dijital sınıfınızı açın, Türkiye Yüzyılı Maarif Modeli 1–12. sınıf MEB üniteleri, LGS ve YDS listesinden ödev atayın. KVKK uyumlu ücretsiz öğretmen paneli.",
  keywords: [
    "memolandum for schools",
    "akıllı tahta uyumlu üyelik gerektirmeyen sınıf içi ingilizce kelime oyunları",
    "eba etap akıllı tahta ingilizce kelime oyunu",
    "türkiye yüzyılı maarif modeli ingilizce oyunları",
    "ingilizce öğretmen sınıf yönetimi",
    "akıllı tahta ingilizce kelime oyunu",
    "1-12 sınıf meb ingilizce ödev",
    "lgs ingilizce kelime ödevi",
    "kvkk uyumlu okul uygulaması",
    "ücretsiz öğretmen ödev takip",
  ],
  openGraph: {
    title: "Memolandum for Schools — Okullar ve İngilizce Öğretmenleri İçin",
    description:
      "1–12. Sınıf MEB, LGS & YDS ünite ödevleri, 6 haneli sınıf kodu, kapalı zarf mahremiyeti ve ücretsiz öğretmen paneli.",
    url: absoluteUrl("/schools/"),
    siteName: "Memolandum",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum for Schools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memolandum for Schools — Okullar ve İngilizce Öğretmenleri İçin",
    description:
      "1–12. Sınıf MEB, LGS & YDS ünite ödevleri, 6 haneli sınıf kodu ve ücretsiz öğretmen paneli.",
    images: [OG_IMAGE],
  },
  alternates: buildPageAlternates("/schools/"),
};

export default function SchoolsPage() {
  const jsonLd = buildSchoolsPageJsonLd();
  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <SchoolsClient />
    </>
  );
}
