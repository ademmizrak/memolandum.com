const fs = require('fs');
const path = require('path');

// 1. Fix store paths in all engines
const enginesDir = path.join(__dirname, 'src/engines');
const engines = fs.readdirSync(enginesDir).filter(f => f.endsWith('.shell.js'));

engines.forEach(engine => {
  const filePath = path.join(enginesDir, engine);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace ../../store/useMemolandumStore with ../store/useMemolandumStore
  code = code.replace(/..\/..\/store\/useMemolandumStore/g, '../store/useMemolandumStore');
  
  fs.writeFileSync(filePath, code);
  console.log('Fixed path in ' + engine);
});

// 2. Fix src/app/games/[slug]/page.js
const pagePath = path.join(__dirname, 'src/app/games/[slug]/page.js');
const pageCode = `// Server Component for Static Params
import GamePageClient from "./GamePageClient";

export function generateStaticParams() {
  return [
    { slug: 'shooter' },
    { slug: 'breakout' },
    { slug: 'highway' },
    { slug: 'invaders' },
    { slug: 'wordascent' },
    { slug: 'worddrop' }
  ];
}

export default function GamePage({ params }) {
  return <GamePageClient slug={params.slug} />;
}
`;
fs.writeFileSync(pagePath, pageCode);
console.log('Fixed page.js');

// 3. Create src/app/games/[slug]/GamePageClient.js
const clientPath = path.join(__dirname, 'src/app/games/[slug]/GamePageClient.js');
const clientCode = `"use client";

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
        levelId={lastPlayedLevel}
        langId={lastPlayedLang}
        onExit={() => router.push('/')}
        onNextLevel={(nextLvl) => {
          useMemolandumStore.getState().setLastPlayed(lastPlayedLang, nextLvl);
        }}
      />
    </div>
  );
}
`;
fs.writeFileSync(clientPath, clientCode);
console.log('Created GamePageClient.js');
