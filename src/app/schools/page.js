import SchoolsClient from "../../components/schools/SchoolsClient";

export const metadata = {
  title: "Okullar ve İngilizce Öğretmenleri İçin | Memolandum for Schools",
  description: "Sınıfınızı açın, 6 haneli sınıf kodu ile öğrencilerinizi toplayın, 1-4. sınıf okul ünite ödevlerini atayın ve tüm sınıfın kelime hafızasını canlı takip edin. Akıllı tahta uyumlu retro arcade İngilizce eğitimi.",
  openGraph: {
    title: "Memolandum for Schools - Okullar ve İngilizce Öğretmenleri İçin",
    description: "%100 Okul Müfredatına Uygun (1-4. Sınıf) Sınıf ve Öğretmen Yönetim Paneli.",
    url: "https://memolandum.com/schools",
    siteName: "Memolandum",
    type: "website",
  },
  alternates: {
    canonical: "https://memolandum.com/schools",
  },
};

export default function SchoolsPage() {
  return <SchoolsClient />;
}
