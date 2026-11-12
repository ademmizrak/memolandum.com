"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { useStoreHydrated } from "../../hooks/useStoreHydrated";
import { countDueWords } from "../../lib/learning/weakWordsService";
import { useLocale } from "../../lib/i18n/LocaleProvider";

/**
 * Gerçek SM-2 due sayısına bağlı pekiştirme CTA.
 * dueCount === 0 ise null (sahte streak / boş vaat yok).
 */
export default function DueReviewCta({
  variant = "band",
  className = "",
  href = "/vocabulary?tab=due",
}) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const hydrated = useStoreHydrated();
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault);
  const activeChildId = useMemolandumStore((s) => s.activeChildId);

  const dueCount = useMemo(
    () =>
      hydrated
        ? countDueWords(vocabularyVault, {
            childId: activeChildId || undefined,
          })
        : 0,
    [hydrated, vocabularyVault, activeChildId]
  );

  if (!hydrated || dueCount <= 0) return null;

  if (variant === "button") {
    return (
      <Link
        href={href}
        className={`w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm rounded-xl hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)] flex items-center justify-center gap-2 ${className}`}
      >
        <Brain className="w-4 h-4" />
        <span>
          {isAr
            ? `${dueCount} كلمات بانتظار المراجعة`
            : isPt
              ? `${dueCount} PALAVRAS PARA REVISAR`
              : isEn
                ? `${dueCount} WORDS DUE FOR REVIEW`
                : `${dueCount} KELİME TEKRAR BEKLİYOR`}
        </span>
      </Link>
    );
  }

  return (
    <div
      className={`w-full bg-gradient-to-r from-slate-950 via-violet-950/35 to-slate-950 border border-violet-500/35 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(139,92,246,0.1)] ${className}`}
    >
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/35 flex items-center justify-center text-violet-300 flex-shrink-0">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold tracking-widest text-violet-300 uppercase mb-0.5">
            {isAr ? "مراجعة Pulse" : isPt ? "Revisão Pulse" : isEn ? "Pulse review" : "Pulse tekrar"}
          </p>
          <p className="text-sm font-bold text-gray-100 m-0">
            {isAr
              ? `حان وقت مراجعة ${dueCount} كلمة`
              : isPt
                ? `${dueCount} palavras prontas para revisão`
                : isEn
                  ? `${dueCount} words due for review`
                  : `${dueCount} kelime tekrar zamanı geldi`}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 m-0">
            {isAr
              ? "مفردات مستحقة بنظام التكرار المتباعد — راجعها الآن."
              : isPt
                ? "Vocabulário SM-2 agendado — revise e reforce agora."
                : isEn
                  ? "SM-2 due vocabulary — review and reinforce now."
                  : "SM-2 vadesi dolmuş kelimeler — şimdi pekiştir."}
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0"
      >
        {isAr ? "راجع الآن" : isPt ? "Revisar agora" : isEn ? "Review now" : "Pekiştir"}
      </Link>
    </div>
  );
}
