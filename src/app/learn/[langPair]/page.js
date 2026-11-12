import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import LearnStartButton from "@/components/learn/LearnStartButton";
import {
  absoluteUrl,
  SITE_NAME,
} from "@/lib/seo/siteConfig";
import {
  buildLearnFaq,
  buildLearnJsonLd,
  buildLearnMetadata,
  countWords,
  getAllPathways,
  getPathwayBySlug,
  loadSampleWords,
  NATIVE_LANG_SEO,
} from "@/lib/seo/learnPathways";
import { getPathwayStudyHub } from "@/lib/seo/learnPathwayHub";
import { videosPlaylistHref } from "@/lib/youtube/playlistCategory";

export function generateStaticParams() {
  return getAllPathways().map((p) => ({ langPair: p.slug }));
}

export async function generateMetadata({ params }) {
  const { langPair } = await params;
  const pathway = getPathwayBySlug(langPair);
  if (!pathway) {
    return { title: "Pathway not found" };
  }
  return buildLearnMetadata(pathway);
}

const SECTION_ACCENT = {
  words: "border-cyan-500/25 bg-cyan-500/5",
  sentences: "border-violet-500/25 bg-violet-500/5",
  alphabet: "border-amber-500/25 bg-amber-500/5",
  kpop: "border-pink-500/25 bg-pink-500/5",
  packs: "border-emerald-500/25 bg-emerald-500/5",
};

function LevelGrid({ levels, max = 24, isEn = false }) {
  const shown = levels.slice(0, max);
  const rest = levels.length - shown.length;
  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map((lv) => {
          const videoHref = videosPlaylistHref(lv.id) || videosPlaylistHref(lv.levelSlug);
          return (
            <li key={lv.id}>
              <div className="rounded-xl border border-white/8 bg-slate-950/50 px-3.5 py-3 transition hover:border-cyan-400/40">
                <Link
                  href={lv.href}
                  prefetch={false}
                  className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-100 hover:text-cyan-200"
                >
                  <span className="leading-snug">{lv.name}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-cyan-500/80">
                    {isEn ? "Level →" : "Seviye →"}
                  </span>
                </Link>
                {videoHref && (
                  <Link
                    href={videoHref}
                    prefetch={false}
                    rel={videoHref.includes("?") ? "nofollow" : undefined}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-black tracking-wide text-red-400/90 hover:text-red-300"
                  >
                    {isEn ? "Study with video →" : "Video ile çalış →"}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {rest > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {isEn ? `+${rest} more packs — ` : `+${rest} paket daha — `}
          <Link href="/#basla" className="text-cyan-400 hover:underline">
            {isEn ? "select all from main menu" : "ana menüden tümünü seç"}
          </Link>
        </p>
      )}
    </>
  );
}

export default async function LearnPathwayPage({ params }) {
  const { langPair } = await params;
  const pathway = getPathwayBySlug(langPair);
  if (!pathway) notFound();

  const isEn = pathway.targetCode === "en";
  const native = NATIVE_LANG_SEO[pathway.sourceCode] || {
    nativeName: pathway.sourceNameTr,
    sourceNameEn: pathway.labelEn?.split("→")?.[0]?.trim() || pathway.sourceNameTr,
  };

  const samples = loadSampleWords(pathway, 8);
  const wordCount = countWords(pathway);
  const faq = buildLearnFaq(pathway);
  const jsonLdBlocks = buildLearnJsonLd(pathway, samples);
  const hub = getPathwayStudyHub(pathway);
  const playHref =
    hub?.gamesHref ||
    hub?.primary?.gamesHref ||
    `/games/?pathway=${pathway.slug}`;
  const vaultHref = "/vocabulary/";
  const translateHref = "/translate/";

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <nav className="text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-cyan-400">
            {isEn ? "Home" : "Ana sayfa"}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/learn/" className="hover:text-cyan-400">
            {isEn ? "Language pathways" : "Dil yolları"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{pathway.slug}</span>
        </nav>

        <header className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            {isEn
              ? `${pathway.labelEn} · ${native.nativeName} · Pathway Home`
              : `${pathway.labelEn} · ${native.nativeName} · Dil anasayfası`}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            {isEn
              ? `${pathway.labelEn} (${native.nativeName})`
              : `${pathway.sourceNameTr} → ${pathway.targetNameTr} (${native.nativeName})`}
          </h1>
          <p className="text-slate-400 leading-relaxed text-base mb-4">
            {isEn ? pathway.introEn : pathway.introTr}{" "}
            {wordCount > 0 && (
              <strong className="text-slate-300 font-semibold">
                {isEn
                  ? `${wordCount.toLocaleString("en-US")} entries in the core vocabulary set.`
                  : `Genel kelime setinde ${wordCount.toLocaleString("tr-TR")} kayıt.`}
              </strong>
            )}
          </p>
          {hub && (
            <p className="text-sm text-slate-500 mb-6">
              {hub.totals.packs > 1
                ? isEn
                  ? `${hub.totals.packs} study tracks · `
                  : `${hub.totals.packs} çalışma yolu · `
                : ""}
              {hub.totals.wordTracks > 0
                ? isEn
                  ? `${hub.totals.wordTracks} vocabulary levels · `
                  : `${hub.totals.wordTracks} kelime seviyesi · `
                : ""}
              {hub.totals.sentenceTracks > 0
                ? isEn
                  ? `${hub.totals.sentenceTracks} sentence / speaking sets`
                  : `${hub.totals.sentenceTracks} cümle / konuşma seti`
                : isEn
                  ? "Vocabulary-focused track"
                  : "Kelime odaklı yol"}
            </p>
          )}
          <p className="text-slate-500 text-sm leading-relaxed mb-8" lang={isEn ? "tr" : "en"}>
            {isEn ? pathway.introTr : pathway.introEn}
          </p>
          <div className="flex flex-wrap gap-3">
            <LearnStartButton
              href={playHref}
              label={isEn ? "Pick arcade shell · play" : "Oyun kabuğu seç · oyna"}
            />
            <Link
              href="/#basla"
              className="inline-flex items-center rounded-xl border border-white/10 px-5 py-3.5 text-sm font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
            >
              {isEn ? "Select from main menu" : "Ana menüden seç"}
            </Link>
          </div>
        </header>

        {hub?.packs?.length > 0 && (
          <section className="mb-14" aria-label={isEn ? "Study tracks" : "Çalışma yolları"}>
            <h2 className="text-xl font-black text-white mb-2">
              {isEn ? "What do you want to study?" : "Ne çalışmak istiyorsun?"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {isEn
                ? `Structured subcategories: vocabulary, sentences / speaking${hub.isEnglishFamily ? ", and exam packs (YDS/YKS)" : ""} — open any level page to launch across 16 neon arcade shells.`
                : `İngilizce’deki alt kategoriler gibi: kelime, cümle / konuşma${hub.isEnglishFamily ? ", sınav paketleri (YDS/YKS)" : ""} — her seviyenin kendi sayfası var; oradan 16 oyun kabuğundan birini seçersin.`}
            </p>

            <div className="space-y-10">
              {hub.packs.map((pack) => (
                <article
                  key={pack.id}
                  id={pack.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/35 p-5 sm:p-6 scroll-mt-24"
                >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">{pack.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {pack.wordCount > 0
                          ? isEn
                            ? `${pack.wordCount} word levels`
                            : `${pack.wordCount} kelime seviyesi`
                          : ""}
                        {pack.wordCount > 0 && pack.sentenceCount > 0 ? " · " : ""}
                        {pack.sentenceCount > 0
                          ? isEn
                            ? `${pack.sentenceCount} sentence / speaking sets`
                            : `${pack.sentenceCount} cümle / konuşma seti`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={pack.startHref}
                      prefetch={false}
                      rel={pack.startHref?.includes("?") ? "nofollow" : undefined}
                      className="shrink-0 rounded-lg bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25"
                    >
                      {isEn ? "Start →" : "Başla →"}
                    </Link>
                  </div>

                  <div className="space-y-6">
                    {pack.sections.map((section) => (
                      <div
                        key={section.key}
                        className={`rounded-xl border p-4 ${SECTION_ACCENT[section.key] || "border-white/10 bg-white/[0.02]"}`}
                      >
                        <h4 className="text-sm font-black text-slate-100 mb-1">
                          {isEn ? section.titleEn || section.titleTr : section.titleTr}
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                          {isEn ? section.blurbEn || section.blurbTr : section.blurbTr}
                        </p>
                        <LevelGrid
                          levels={section.levels}
                          max={section.key === "sentences" ? 16 : 24}
                          isEn={isEn}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-black text-white mb-3">
            {isEn ? `Why ${pathway.labelEn}?` : `Neden ${pathway.labelTr}?`}
          </h2>
          <p className="text-slate-400 leading-relaxed mb-4">
            {isEn
              ? "Memolandum embeds vocabulary and phrase retention into 16 free arcade games: Retro Shooter, Breakout, Highway, Invaders, Word Ascent, Word Drop, Hangman, Word Snake, Academic Shooter, Academic Lexicon, OrbitLex, and Wooden Word Board. Every correct match triggers active recall; Memolandum Pulse brings words back right before the forgetting threshold."
              : "Memolandum, kelime ve cümle ezberlemeyi 16 ücretsiz arcade oyuna gömer: Retro Shooter, Breakout, Highway, Invaders, Word Ascent, Word Drop, Hangman, Word Snake, Academic Shooter, Academic Lexicon, OrbitLex ve Ahşap Kelime Panosu. Her doğru eşleştirme active recall tetikler; Memolandum Pulse unutma eşiğinde kelimeyi geri getirir."}
          </p>
          <p className="text-slate-400 leading-relaxed">
            {isEn ? (
              <>
                On the same platform:{" "}
                <Link href="/sozluk/" className="text-cyan-400 hover:underline">
                  KPSS &amp; academic glossary
                </Link>
                ,{" "}
                <Link href={translateHref} className="text-cyan-400 hover:underline">
                  Instant Translation
                </Link>{" "}
                and{" "}
                <Link href={vaultHref} className="text-cyan-400 hover:underline">
                  Word Vault
                </Link>
                .
              </>
            ) : (
              <>
                Aynı platformda{" "}
                <Link href="/sozluk/" className="text-cyan-400 hover:underline">
                  KPSS &amp; akademik sözlük
                </Link>
                ,{" "}
                <Link href={translateHref} className="text-cyan-400 hover:underline">
                  Anlık Çeviri
                </Link>{" "}
                ve{" "}
                <Link href={vaultHref} className="text-cyan-400 hover:underline">
                  Kelime Kasası
                </Link>{" "}
                vardır.
              </>
            )}
          </p>
        </section>

        {samples.length > 0 && (
          <section className="mb-12" aria-label={isEn ? "Sample vocabulary" : "Örnek kelimeler"}>
            <h2 className="text-xl font-black text-white mb-2">
              {isEn
                ? `Sample ${native.sourceNameEn} (${native.nativeName}) vocabulary`
                : `Örnek ${pathway.sourceNameTr} (${native.nativeName}) kelimeleri`}
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {isEn
                ? "Live preview from this pathway's vocabulary dataset."
                : "Bu yoldaki gerçek veri setinden önizleme."}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/40">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-slate-900/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      {isEn ? `Word (${native.sourceNameEn})` : `Kelime (${pathway.sourceNameTr})`}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {isEn ? "Meaning / Translation" : `Anlamı (${pathway.targetNameTr})`}
                    </th>
                    <th scope="col" className="px-4 py-3 hidden sm:table-cell">
                      {isEn ? "Category / Level" : "Kategori / Seviye"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {samples.map((s, idx) => (
                    <tr key={`${s.word}-${idx}`} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-bold text-slate-100">{s.word}</td>
                      <td className="px-4 py-3 text-slate-300">{s.translation}</td>
                      <td className="px-4 py-3 text-xs text-cyan-400/80 hidden sm:table-cell">
                        {s.level || pathway.labelTr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-black text-white mb-5">
            {isEn ? "Frequently asked questions" : "Sıkça sorulan sorular"}
          </h2>
          <div className="space-y-5">
            {faq.map((item) => (
              <article key={item.question}>
                <h3 className="text-base font-bold text-slate-100 mb-1.5">
                  {item.question}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="pt-8 border-t border-white/5 text-sm text-slate-500">
          <p className="mb-3">
            {isEn ? "All language pathways: " : "Diğer dil yolları: "}
            <Link href="/learn/" className="text-cyan-400 hover:underline">
              /learn
            </Link>
            {" · "}
            {SITE_NAME}
          </p>
          <p>
            <Link href={absoluteUrl("/method/")} className="hover:text-cyan-400">
              {isEn ? "Pulse method" : "Pulse yöntemi"}
            </Link>
            {" · "}
            <Link href={absoluteUrl("/about/")} className="hover:text-cyan-400">
              {isEn ? "Scientific foundations" : "Bilimsel temeller"}
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
