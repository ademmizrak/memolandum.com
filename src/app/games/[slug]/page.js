// Server Component for Static Params
import { Suspense } from "react";
import GamePageClient from "./GamePageClient";
import SkeletonLoader from "../../../components/SkeletonLoader";
import { GAME_META, absoluteUrl, OG_IMAGE } from "../../../lib/seo/siteConfig";

export function generateStaticParams() {
  return [
    { slug: "shooter" },
    { slug: "breakout" },
    { slug: "highway" },
    { slug: "invaders" },
    { slug: "wordascent" },
    { slug: "worddrop" },
    { slug: "quiz" },
    { slug: "lexicon" },
    { slug: "hangman" },
    { slug: "word-snake" },
    { slug: "academic-shooter" },
    { slug: "academic-lexicon" },
    { slug: "word-card" },
  ];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const meta = GAME_META[slug] || {
    title: "Kelime Oyunu | Memolandum",
    description: "Memolandum arcade kelime öğrenme oyunu.",
  };
  const url = absoluteUrl(`/games/${slug}/`);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      images: [{ url: OG_IMAGE }],
    },
  };
}

export default async function GamePage({ params }) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<SkeletonLoader gameType={resolvedParams.slug} />}>
      <GamePageClient slug={resolvedParams.slug} />
    </Suspense>
  );
}
