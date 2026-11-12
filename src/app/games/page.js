import { Suspense } from "react";
import Header from "@/components/Header";
import GamesHubClient from "./GamesHubClient";
import { ARCADE_SHELLS } from "@/lib/seo/arcadeShells";
import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/siteConfig";

export const metadata = {
  title: "Oyun Kabukları — 10 Arcade Kelime Oyunu | Memolandum",
  description:
    "Retro Shooter, Breakout, Highway, Invaders, Word Ascent, Word Drop, Quiz, Lexicon, Hangman, Word Snake — dil yolunu ve seviyeyi seçtikten sonra kabuğunu seç, oyna, ezberle.",
  alternates: {
    canonical: absoluteUrl("/games/"),
    languages: {
      tr: absoluteUrl("/games/"),
      en: `${SITE_URL}/games/?lang=en`,
      "x-default": absoluteUrl("/games/"),
    },
  },
  openGraph: {
    title: "Memolandum — Arcade Game Shells",
    description: "Pick one of 10 vocabulary arcade shells for your language pathway level.",
    url: absoluteUrl("/games/"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Games" }],
    siteName: SITE_NAME,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Memolandum Arcade Game Shells",
  url: absoluteUrl("/games/"),
  numberOfItems: ARCADE_SHELLS.length,
  itemListElement: ARCADE_SHELLS.map((g, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: g.name,
    description: g.blurb,
    url: absoluteUrl(`/games/${g.id}/`),
  })),
};

export default function GamesHubPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Suspense
        fallback={
          <main className="max-w-5xl mx-auto px-4 pt-12 text-slate-500">
            Oyun kabukları yükleniyor…
          </main>
        }
      >
        <GamesHubClient />
      </Suspense>
    </div>
  );
}
