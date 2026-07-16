"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import SkeletonLoader from "../../../components/SkeletonLoader";

const GameEngineWrapper = dynamic(() => import('../../../engines/base'), { 
  ssr: false,
  loading: () => <SkeletonLoader gameType="loading" />
});

export default function GamePageClient({ slug }) {
  const router = useRouter();
  const validSlugs = ['shooter', 'breakout', 'highway', 'invaders', 'wordascent', 'worddrop'];
  const [mounted, setMounted] = useState(false);
  
  const { lastPlayedLang, lastPlayedLevel } = useMemolandumStore();

  useEffect(() => {
    setMounted(true);
    if (!validSlugs.includes(slug)) {
      router.push('/');
    }
  }, [slug, router]);

  if (!mounted) return <SkeletonLoader gameType={slug} />;
  if (!validSlugs.includes(slug)) return null;

  return (
    <div className="w-full h-screen overflow-hidden bg-dark-900 text-gray-200 font-sans selection:bg-primary-500/30">
      <GameEngineWrapper 
        gameType={slug}
        levelId={lastPlayedLevel || 'en-tr_eng_genel-0'}
        langId={lastPlayedLang || 'en-tr_eng_genel'}
        onExit={() => router.push('/')}
        onNextLevel={(nextLvl) => {
          useMemolandumStore.getState().setLastPlayed(lastPlayedLang || 'en-tr_eng_genel', nextLvl);
        }}
      />
    </div>
  );
}
