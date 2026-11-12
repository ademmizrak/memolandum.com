import Link from "next/link";
import Header from "@/components/Header";
import {
  absoluteUrl,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/siteConfig";

export const metadata = {
  title: "Roadmap — AI Branş Öğretmenleri | Memolandum",
  description:
    "Bugün: 23 dil yolu, KPSS sözlük, Gemini Anlık Çeviri, Pulse. Yol: branş AI öğretmenleri (dil, KPSS, akademik) — kişisel lexikon + adaptive öğrenme döngüsü. Google Gemini üzerine inşa.",
  keywords: [
    "memolandum roadmap",
    "AI branş öğretmeni",
    "AI tutor vocabulary",
    "adaptive learning Gemini",
    "kişisel lexikon",
    "KPSS AI öğretmen",
    "memolandum vizyon",
  ],
  alternates: {
    canonical: absoluteUrl("/roadmap/"),
    languages: {
      tr: absoluteUrl("/roadmap/"),
      en: `${SITE_URL}/roadmap/?lang=en`,
      "x-default": absoluteUrl("/roadmap/"),
    },
  },
  openGraph: {
    title: "Memolandum Roadmap — AI Branch Teachers on Gemini",
    description:
      "Foundation live: arcade + 23 pathways + KPSS + Instant Translation. Next: domain AI teachers powered by Google Gemini and personal lexicon graphs.",
    url: absoluteUrl("/roadmap/"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Roadmap" }],
    siteName: SITE_NAME,
    locale: "tr_TR",
    type: "article",
  },
  robots: { index: true, follow: true },
};

const phases = [
  {
    id: "now",
    badge: "CANLI · NOW",
    titleTr: "Temel platform (enterprise keşif katmanı)",
    titleEn: "Foundation platform (enterprise discovery layer)",
    bodyTr:
      "8 ücretsiz arcade oyun · 23 dil yolu (/learn SSG) · KPSS & akademik sözlük (~4.000 kavram) · Gemini Anlık Çeviri · Memolandum Pulse (spaced repetition + active recall) · Kelime Kasası · Premium (Shopier / Stripe). Firebase Hosting + Cloud Functions + Auth + Firestore.",
    bodyEn:
      "8 free arcade games · 23 language pathways (/learn SSG) · KPSS & academic glossary (~4,000 concepts) · Gemini Instant Translation · Memolandum Pulse · Word Vault · Premium (Shopier / Stripe). Firebase Hosting + Cloud Functions + Auth + Firestore.",
  },
  {
    id: "next",
    badge: "SONRAKI · NEXT",
    titleTr: "AI Branş Öğretmenleri (Gemini)",
    titleEn: "AI Branch Teachers (Gemini)",
    bodyTr:
      "Her branş için uzman öğretmen katmanı: dil yolları, KPSS alanları (tarih, coğrafya, vatandaşlık…), tıp/hukuk/mimarlık. Öğretmen; quiz + oyun sinyallerinden zayıf noktaları okur, bir sonraki antrenmanı yapılandırır, kullanıcı kelimelerini normalleştirip kişisel lexikona kazandırır. Çekirdek teknoloji: Google Gemini + Pulse + kanonik/kişisel çift lexikon.",
    bodyEn:
      "Specialist teacher layer per domain: language pathways, KPSS subjects, medicine/law/architecture. Teachers read weakness signals from quiz + games, configure the next drill, normalize user words into a personal lexicon. Core stack: Google Gemini + Pulse + canonical/personal dual lexicon.",
  },
  {
    id: "north",
    badge: "KUZEY YILDIZI · NORTH STAR",
    titleTr: "Kişisel kelime grafiği ürünü",
    titleEn: "Personal vocabulary graph product",
    bodyTr:
      "Katalog değil, kullanıcıya özel öğrenme grafiği: her girişte kendi kelimeleri + zayıf noktalar + bucket’tan akıllı takviye. Oyun = antrenman · Quiz = ölçüm · AI = seviye + zenginleştirme. Ölçeklenebilir, ölçülebilir, monetize edilebilir AI öğrenme işletmesi.",
    bodyEn:
      "Not a static catalog — a personal learning graph: each visit brings your words + weak spots + smart bucket fill. Games = training · Quiz = measurement · AI = level + enrichment. A scalable, measurable, monetizable AI learning business.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/roadmap/#page`,
  name: "Memolandum Roadmap — AI Branch Teachers",
  url: absoluteUrl("/roadmap/"),
  description:
    "Product roadmap from live arcade vocabulary foundation to Gemini-powered AI branch teachers and personal lexicon graphs.",
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  about: [
    "AI tutoring",
    "Adaptive learning",
    "Google Gemini",
    "Spaced repetition",
    "KPSS exam prep",
    "Multilingual vocabulary",
  ],
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400 mb-3">
          Roadmap · Gemini · Enterprise
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
          Temelden branş AI öğretmenlerine
        </h1>
        <p className="text-slate-400 leading-relaxed mb-3">
          Memolandum bugün canlı bir kelime öğrenme işletmesi: keşfedilebilir dil yolları,
          KPSS sözlük, Anlık Çeviri ve bilimsel tekrar. Bu temel üzerine{" "}
          <strong className="text-slate-200">Google Gemini destekli AI branş öğretmenleri</strong>{" "}
          inşa ediyoruz — dil, sınav ve akademik alanlarda uzman, adaptive öğrenme döngüsü.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed mb-10" lang="en">
          Live foundation today; next layer is domain AI teachers on Gemini — adaptive loops
          over personal + canonical lexicons. Built for serious learners and serious scale.
        </p>

        <ol className="space-y-6 mb-12">
          {phases.map((p, i) => (
            <li
              key={p.id}
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-black text-cyan-400">
                  {i + 1}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-violet-400 font-mono">
                  {p.badge}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mb-2">{p.titleTr}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">{p.bodyTr}</p>
              <p className="text-slate-500 text-xs leading-relaxed" lang="en">
                <strong className="text-slate-400">{p.titleEn}.</strong> {p.bodyEn}
              </p>
            </li>
          ))}
        </ol>

        <section className="mb-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="text-lg font-black text-cyan-300 mb-2">Neden bu mimari?</h2>
          <ul className="space-y-2 text-sm text-slate-400 leading-relaxed list-disc list-inside">
            <li>Öğrenme bedava kalır; maliyetli AI API şeffaf Premium ile finanse edilir.</li>
            <li>SEO/GEO keşif katmanı (`/learn`, `/sozluk`) öğretmenleri besleyecek trafik üretir.</li>
            <li>Pulse + vault + quiz sinyalleri, branş öğretmenine temiz öğrenme verisi sağlar.</li>
            <li>Firebase + Gemini: üretimde kanıtlanmış, ölçeklenebilir Google bulut yığını.</li>
          </ul>
        </section>

        <nav className="flex flex-wrap gap-4 text-sm font-bold">
          <Link href="/learn/" className="text-cyan-400 hover:underline">
            23 dil yolu →
          </Link>
          <Link href="/sozluk/" className="text-cyan-400 hover:underline">
            KPSS sözlük →
          </Link>
          <Link href="/translate/" className="text-cyan-400 hover:underline">
            Anlık Çeviri →
          </Link>
          <Link href="/premium/" className="text-cyan-400 hover:underline">
            Premium →
          </Link>
          <Link href="/about/" className="text-cyan-400 hover:underline">
            Bilim →
          </Link>
        </nav>
      </main>
    </div>
  );
}
