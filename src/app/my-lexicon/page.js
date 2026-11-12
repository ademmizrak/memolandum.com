import MyLexiconClient from "./MyLexiconClient";
import { absoluteUrl, OG_IMAGE } from "../../lib/seo/siteConfig";

const title = "My Lexicon — Kendi Kelimelerini Ekle | Memolandum";
const description =
  "Akademik veya kişisel kelime listenizi elle ekleyin. Memolandum kasasına kaydedin ve tüm arcade oyunlarında çalışın.";

export const metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/my-lexicon/") },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/my-lexicon/"),
    images: [{ url: OG_IMAGE }],
  },
};

export default function MyLexiconPage() {
  return <MyLexiconClient />;
}
