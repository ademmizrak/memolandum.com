"use client";

import dynamic from "next/dynamic";

const TranslateStudioClient = dynamic(() => import("./TranslateStudioClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-sm">
      Çeviri Stüdyosu Yükleniyor...
    </div>
  ),
});

export default function TranslateStudioWrapper() {
  return <TranslateStudioClient />;
}
