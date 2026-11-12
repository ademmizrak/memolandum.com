"use client";

import Link from "next/link";
import {
  ACADEMIC_EXTRA_CATEGORIES,
  KPSS_EXAM_CATEGORIES,
} from "@/lib/seo/kpssCategories";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function KpssQuickGrid() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const useIntl = isEn || isAr || isPt;

  return (
    <section
      id="kpss"
      className="mb-0 flex w-full flex-col scroll-mt-28 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] via-slate-900/50 to-violet-600/[0.08] p-4 sm:p-5"
      aria-labelledby="kpss-quick-heading"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            {isAr ? "قاموس KPSS متاح الآن" : isPt ? "Glossário KPSS disponível" : isEn ? "KPSS is live" : "KPSS’ler başlıyor"}
          </p>
          <h2
            id="kpss-quick-heading"
            className="text-base sm:text-lg font-black tracking-tight text-white"
          >
            {isAr
              ? "دروس ومفاهيم أكاديمية — اختر التخصص"
              : isPt
                ? "Aulas e conceitos acadêmicos — escolha a matéria"
                : isEn
                  ? "KPSS lessons — pick a subject"
                  : "KPSS dersleri — branşını seç"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-400">
            {isAr
              ? "اختر التخصص — وتعلّم المفاهيم داخل ألعاب الأركيد."
              : isPt
                ? "Escolha a matéria — pratique os conceitos nos jogos arcade."
                : isEn
                  ? "Pick a subject — play concepts in arcade shells."
                  : "Branşını seç — kavramları arcade’de ezberle."}
          </p>
        </div>
        <Link
          href="/sozluk/"
          className="shrink-0 rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/20"
        >
          {isAr ? "القاموس الكامل ←" : isPt ? "Glossário completo →" : isEn ? "Full glossary →" : "Tüm sözlük →"}
        </Link>
      </div>

      <ul className="grid flex-1 gap-2.5 sm:grid-cols-2">
        {KPSS_EXAM_CATEGORIES.map((cat) => (
          <li key={cat.slug}>
            <Link
              href={`/sozluk/${cat.slug}/`}
              className="group flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/55 p-3.5 transition hover:border-amber-400/45 hover:bg-slate-900/80"
              style={{ boxShadow: `inset 0 0 0 1px ${cat.accent}22` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {cat.emoji}
                </span>{" "}
                <span className="text-sm font-black text-slate-100 group-hover:text-amber-100">
                  {useIntl ? cat.nameEn : cat.name}
                </span>
              </div>
              <p className="mb-3 flex-1 text-[11px] leading-relaxed text-slate-500">
                {useIntl ? cat.blurbEn || cat.blurb : cat.blurb}
              </p>
              <span
                className="inline-flex w-fit items-center rounded-md px-2 py-1 text-[10px] font-bold tracking-wide"
                style={{
                  color: cat.accent,
                  background: `${cat.accent}18`,
                  border: `1px solid ${cat.accent}44`,
                }}
              >
                {isAr ? "افتح الدرس ←" : isPt ? "Abrir aula →" : isEn ? "Open lesson →" : "Dersi aç →"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-white/5 pt-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {isAr ? "مسارات أكاديمية إضافية" : isPt ? "Trilhas acadêmicas extras" : isEn ? "Also academic tracks" : "Akademik branşlar da açık"}
        </p>
        <ul className="flex flex-wrap gap-2">
          {ACADEMIC_EXTRA_CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/sozluk/${cat.slug}/`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-violet-400/40 hover:text-violet-200"
              >
                <span aria-hidden>{cat.emoji}</span>{" "}
                <span>{useIntl ? cat.nameEn : cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
