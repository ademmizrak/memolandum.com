import Link from "next/link";
import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL } from "../../lib/seo/siteConfig";
import { LEGAL_CONTACT_EMAIL, LEGAL_PATHS } from "../../lib/legal/config";

export const metadata = {
  title: "Legal / Yasal",
  description:
    "Memolandum gizlilik politikası ve kullanım koşulları — Privacy Policy & Terms of Service for web and apps.",
  alternates: {
    canonical: absoluteUrl(LEGAL_PATHS.index),
    languages: {
      tr: absoluteUrl(LEGAL_PATHS.index),
      en: `${SITE_URL}/legal/?lang=en`,
      "x-default": absoluteUrl(LEGAL_PATHS.index),
    },
  },
  openGraph: {
    title: "Memolandum Legal",
    url: absoluteUrl(LEGAL_PATHS.index),
    images: [{ url: OG_IMAGE }],
    siteName: SITE_NAME,
  },
  robots: { index: true, follow: true },
};

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 px-6 py-16">
      <div className="max-w-xl mx-auto">
        <p className="text-cyan-400 text-sm font-semibold tracking-wide mb-2">Memolandum</p>
        <h1 className="text-3xl font-black text-white m-0 mb-3">Legal / Yasal</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Tek metin, tüm yüzeyler: web + Android/iOS. Ayrı “uygulama versiyonu” yok — mağaza
          formlarına aynı URL’leri yazın. One policy for every surface.
        </p>
        <ul className="list-none p-0 m-0 space-y-3">
          <li>
            <Link
              href={LEGAL_PATHS.privacy}
              className="block rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-cyan-300 hover:border-cyan-400/40 no-underline"
            >
              Privacy Policy / Gizlilik Politikası
            </Link>
          </li>
          <li>
            <Link
              href={LEGAL_PATHS.terms}
              className="block rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-cyan-300 hover:border-cyan-400/40 no-underline"
            >
              Terms of Service / Kullanım Koşulları
            </Link>
          </li>
          <li>
            <Link
              href="/about/"
              className="block rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-300 hover:border-white/25 no-underline"
            >
              About / Bilimsel temeller
            </Link>
          </li>
        </ul>
        <p className="mt-10 text-sm text-slate-500">
          Contact:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-cyan-500">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
