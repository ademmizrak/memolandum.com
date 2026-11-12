"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import NeonArcadeShellPicker from "@/components/arcade/NeonArcadeShellPicker";
import { PATHWAY_INDEX, getSlugFromManifestLangId } from "@/lib/seo/learnPathwayResolve";
import { useMemolandumStore } from "@/store/useMemolandumStore";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function GamesHubClient() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const searchParams = useSearchParams();
  const lastPlayedLang = useMemolandumStore((s) => s.lastPlayedLang);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);

  const langId = searchParams.get("lang") || lastPlayedLang || "";
  const levelId = searchParams.get("level") || lastPlayedLevel || "";
  const pathway =
    searchParams.get("pathway") ||
    getSlugFromManifestLangId(langId) ||
    "";

  const pathwayMeta = PATHWAY_INDEX.find((p) => p.slug === pathway);
  const hasContext = Boolean(pathway || langId || levelId);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
      <nav className="text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-cyan-400">
          {isAr ? "الرئيسية" : isPt ? "Início" : isEn ? "Home" : "Ana sayfa"}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/learn/" className="hover:text-cyan-400">
          {isAr ? "مسارات اللغات" : isPt ? "Trilhas de idiomas" : isEn ? "Language pathways" : "Dil yolları"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-400">
          {isAr ? "ألعاب الأركيد" : isPt ? "Jogos arcade" : isEn ? "Arcade shells" : "Oyun kabukları"}
        </span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-3">
          {isAr ? "أركيد نيون · 13 لعبة" : isPt ? "Arcade Neon · 13 Jogos" : isEn ? "Neon Arcade · 13 Shells" : "Neon Arcade · 13 kabuk"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
          {isAr ? "اختر لعبة الأركيد" : isPt ? "Escolha seu Jogo Arcade" : isEn ? "Pick Your Arcade Shell" : "Oyun kabuğunu seç"}
        </h1>
        <p className="text-slate-400 leading-relaxed mb-4">
          {isAr
            ? "تدرّب على نفس مجموعة المفردات عبر 13 لعبة أركيد تفاعلية. اختر اللعبة، العب، واحفظ الكلمات."
            : isPt
              ? "Pratique o mesmo pacote de vocabulário em 13 jogos arcade interativos. Escolha o jogo, jogue e memorize."
              : isEn
                ? "Practice the same vocabulary set across 13 neon arcade game shells. Pick a game, play, and memorize."
                : "Aynı seti 13 farklı neon arcade kabuğunda çalış. Hover’da avatar döner, ikon yanar — seç, oyna, ezberle."}
        </p>
        {hasContext ? (
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 text-sm text-slate-300">
            <span className="text-cyan-400 font-bold">
              {isAr ? "المسار النشط: " : isPt ? "Trilha ativa: " : isEn ? "Active context: " : "Aktif bağlam: "}
            </span>
            {pathwayMeta
              ? isEn || isAr || isPt
                ? pathwayMeta.labelEn || pathwayMeta.labelTr
                : pathwayMeta.labelTr
              : pathway || (isAr ? "مسار لغوي" : isPt ? "trilha de idioma" : isEn ? "language pathway" : "dil yolu")}
            {levelId ? (
              <span className="text-slate-500">
                {isAr ? " · المستوى مرتبط" : isPt ? " · nível vinculado" : isEn ? " · level linked" : " · seviye bağlı"}
              </span>
            ) : null}
            {pathway ? (
              <>
                {" · "}
                <Link href={`/learn/${pathway}/`} className="text-cyan-400 hover:underline">
                  {isAr ? "صفحة اللغة" : isPt ? "página do idioma" : isEn ? "pathway home" : "dil anasayfası"}
                </Link>
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {isAr ? (
              <>
                اختر{" "}
                <Link href="/learn/" className="text-cyan-400 hover:underline">
                  مساراً لغوياً
                </Link>{" "}
                ومستوى أولاً لتشغيل الألعاب بتلك المجموعة.
              </>
            ) : isPt ? (
              <>
                Escolha uma{" "}
                <Link href="/learn/" className="text-cyan-400 hover:underline">
                  trilha de idioma
                </Link>{" "}
                e um nível primeiro para abrir os jogos com esse pacote.
              </>
            ) : isEn ? (
              <>
                Pick a{" "}
                <Link href="/learn/" className="text-cyan-400 hover:underline">
                  language pathway
                </Link>{" "}
                and level first to launch games with that set.
              </>
            ) : (
              <>
                Önce bir{" "}
                <Link href="/learn/" className="text-cyan-400 hover:underline">
                  dil anasayfası
                </Link>{" "}
                ve seviye seçersen kabuklar o setle açılır.
              </>
            )}
          </p>
        )}
      </header>

      <NeonArcadeShellPicker
        pathway={pathway}
        langId={langId}
        levelId={levelId}
        title={isAr ? "ألعاب الأركيد النيون" : isPt ? "JOGOS ARCADE NEON" : isEn ? "NEON ARCADE SHELLS" : "NEON ARCADE KABUKLARI"}
        subtitle={
          isAr
            ? "مضيئة · متحركة · 13 لعبة أركيد"
            : isPt
              ? "Brilhantes · animados · 13 jogos arcade"
              : isEn
                ? "Glowing · animated · 13 arcade game shells"
                : "Işıklı · dönen · avatarlı · 13 kabuk"
        }
      />

      <p className="mt-10 text-center text-xs text-slate-600">
        {isAr
          ? "الألعاب الأكاديمية لقاموس KPSS متاحة في صفحات القاموس: academic-shooter · academic-lexicon"
          : isPt
            ? "Os jogos acadêmicos do glossário KPSS estão nas páginas do glossário: academic-shooter · academic-lexicon"
            : isEn
              ? "KPSS academic game shells are available on glossary pages: academic-shooter · academic-lexicon"
              : "KPSS akademik kabuklar sözlük sayfalarında: academic-shooter · academic-lexicon"}
      </p>
    </main>
  );
}
