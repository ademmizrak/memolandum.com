import SchoolsClient from "../../../components/schools/SchoolsClient";
import { buildSchoolsPageJsonLd } from "../../../lib/seo/jsonLd";
import { OG_IMAGE, absoluteUrl } from "../../../lib/seo/siteConfig";

export const metadata = {
  title: "Öğretmen Güvenlik, Mahremiyet ve Kullanım Rehberi",
  description:
    "Öğretmenlerimiz için sıfır kişisel veri zorunluluğu (KVKK uyumlu rumuz ve avatar kalkanı), kapalı zarf öğrenci mahremiyeti, kilitli öğretmen gözlem defteri ve 30 saniyede 1–12. sınıf ödev atama rehberi.",
  keywords: [
    "öğretmen kullanım rehberi",
    "kvkk uyumlu sınıf yönetimi",
    "öğrenci mahremiyeti okul uygulaması",
    "akıllı tahta ingilizce oyun rehberi",
    "memolandum öğretmen rehberi",
  ],
  openGraph: {
    title: "Öğretmen Güvenlik, Mahremiyet ve Kullanım Rehberi | Memolandum",
    description:
      "Gerçek soyad veya okul adı zorunluluğu olmadan, rumuz ve avatarlarla %100 güvenli 1–12. sınıf İngilizce sınıf yönetimi.",
    url: absoluteUrl("/schools/rehber/"),
    siteName: "Memolandum",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Öğretmen Rehberi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Öğretmen Güvenlik, Mahremiyet ve Kullanım Rehberi | Memolandum",
    description:
      "Gerçek soyad veya okul adı zorunluluğu olmadan, rumuz ve avatarlarla %100 güvenli sınıf yönetimi.",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: absoluteUrl("/schools/rehber/"),
  },
};

export default function TeacherGuidePage() {
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
      <SchoolsClient initialTab="guide" />
    </>
  );
}
