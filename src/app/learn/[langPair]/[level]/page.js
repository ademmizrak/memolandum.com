import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import LearnStartButton from "@/components/learn/LearnStartButton";
import NeonArcadeShellPicker from "@/components/arcade/NeonArcadeShellPicker";
import { getPathwayBySlug } from "@/lib/seo/learnPathways";
import {
  buildLearnLevelJsonLd,
  buildLearnLevelMetadata,
  getAllLearnLevels,
  getLearnLevel,
  getSiblingLevels,
  loadLevelSamples,
} from "@/lib/seo/learnLevels";
import { ARCADE_SHELLS } from "@/lib/seo/arcadeShells";
import { videosPlaylistHref } from "@/lib/youtube/playlistCategory";

export function generateStaticParams() {
  return getAllLearnLevels().list.map((e) => ({
    langPair: e.pathwaySlug,
    level: e.levelSlug,
  }));
}

export async function generateMetadata({ params }) {
  const { langPair, level } = await params;
  const entry = getLearnLevel(langPair, level);
  if (!entry) return { title: "Seviye bulunamadı | Memolandum" };
  return buildLearnLevelMetadata(entry);
}

export default async function LearnLevelPage({ params }) {
  const { langPair, level } = await params;
  const entry = getLearnLevel(langPair, level);
  if (!entry) notFound();

  const pathway = getPathwayBySlug(langPair);
  const samples = loadLevelSamples(entry, 12);
  const siblings = getSiblingLevels(entry, 10);
  const jsonLd = buildLearnLevelJsonLd(entry, samples);
  const kindLabel =
    entry.type === "sentences"
      ? "Cümle / konuşma"
      : entry.type === "alphabet"
        ? "Alfabe"
        : "Kelime çalışması";
  const videoHref =
    videosPlaylistHref(entry.levelId) ||
    videosPlaylistHref(entry.levelSlug) ||
    videosPlaylistHref(entry.packId);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-300">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/learn/" className="hover:text-slate-300">
            Dil yolları
          </Link>
          <span>/</span>
          <Link href={`/learn/${langPair}/`} className="hover:text-slate-300">
            {entry.pathwayLabelTr}
          </Link>
          <span>/</span>
          <span className="text-cyan-400">{entry.levelName}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2 flex flex-col gap-6">
            <header className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] pointer-events-none rounded-full" />
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link
                  href={`/learn/${langPair}/`}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                >
                  {entry.pathwayLabelTr}
                </Link>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {entry.packName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {kindLabel}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                {entry.levelName}
              </h1>
              <p className="text-slate-400 leading-relaxed mb-6">
                {entry.sourceNameTr} → {entry.targetNameTr} yolunda{" "}
                <strong className="text-slate-200">{entry.packName}</strong> paketinden bu
                seviyeyi arcade oyunlarla çalış. KPSS kavram sayfalarındaki gibi her seviyenin
                kendi sayfası var; buradan{" "}
                <strong className="text-slate-200">{ARCADE_SHELLS.length} oyun kabuğu</strong>
                ndan dilediğini seçersin.
              </p>
              <div className="flex flex-wrap gap-3">
                <LearnStartButton
                  href={entry.gamesHref}
                  label="Oyun kabuğu seç · oyna"
                />
                {videoHref && (
                  <Link
                    href={videoHref}
                    prefetch={false}
                    rel={videoHref.includes("?") ? "nofollow" : undefined}
                    className="inline-flex items-center rounded-xl border border-red-500/35 bg-red-500/10 px-5 py-3.5 text-sm font-bold text-red-300 hover:border-red-400/60 hover:bg-red-500/20"
                  >
                    Video ile çalış
                  </Link>
                )}
                <Link
                  href={`/learn/${langPair}/`}
                  className="inline-flex items-center rounded-xl border border-white/10 px-5 py-3.5 text-sm font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                >
                  Dil anasayfası
                </Link>
              </div>
            </header>

            {samples.length > 0 && (
              <section
                className="rounded-3xl border border-white/5 bg-slate-900/15 p-6"
                aria-label={`${entry.levelName} örnek kelime tablosu`}
              >
                <h2 className="text-xl font-black text-white mb-2">Örnek içerik</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Bu seviyeden önizleme — oyunda Memolandum Pulse™ (SM-2) ile tekrarlanır.
                </p>
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Kelime / İfade ({entry.sourceNameTr})
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Anlamı / Çevirisi ({entry.targetNameTr})
                        </th>
                        <th scope="col" className="px-4 py-3 hidden sm:table-cell">
                          Kategori / Seviye
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {samples.map((s, i) => (
                        <tr
                          key={`${s.word}-${i}`}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-slate-100">{s.word}</td>
                          <td className="px-4 py-3 text-slate-300">{s.translation}</td>
                          <td className="px-4 py-3 text-xs text-cyan-400/80 hidden sm:table-cell">
                            {entry.packName} · {entry.levelName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <dl className="sr-only">
                  {samples.map((s, i) => (
                    <div key={`dl-${s.word}-${i}`}>
                      <dt>{s.word}</dt>
                      <dd>
                        {s.translation} ({entry.packName} - {entry.levelName})
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h2 className="text-lg font-black text-cyan-300 mb-2">
                Nasıl oynarım?
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400 leading-relaxed">
                <li>
                  <strong className="text-slate-200">Oyun kabuğu seç</strong> ile /games
                  hub’ına git — {ARCADE_SHELLS.length} arcade kabuk listelenir.
                </li>
                <li>İstediğin kabuğu aç; seviye otomatik bağlanır.</li>
                <li>Doğru eşleşmeler Pulse tekrarına yazılır; Kelime Kasası’na ekleyebilirsin.</li>
                {videoHref && (
                  <li>
                    İstersen aynı seviyenin YouTube listesini{" "}
                    <Link
                      href={videoHref}
                      prefetch={false}
                      rel={videoHref.includes("?") ? "nofollow" : undefined}
                      className="text-red-300 hover:underline font-semibold"
                    >
                      Video ile çalış
                    </Link>{" "}
                    sayfasından izle.
                  </li>
                )}
              </ol>
              <div className="mt-5 flex flex-wrap gap-3">
                <LearnStartButton
                  href={entry.gamesHref}
                  label={`${ARCADE_SHELLS.length} oyun kabuğunu gör`}
                />
                {videoHref && (
                  <Link
                    href={videoHref}
                    prefetch={false}
                    rel={videoHref.includes("?") ? "nofollow" : undefined}
                    className="inline-flex items-center rounded-xl border border-red-500/35 bg-red-500/10 px-5 py-3.5 text-sm font-bold text-red-300 hover:border-red-400/60 hover:bg-red-500/20"
                  >
                    Video ile çalış
                  </Link>
                )}
              </div>
            </section>
          </article>

          <aside className="flex flex-col gap-6">
            <NeonArcadeShellPicker
              compact
              pathway={entry.pathwaySlug}
              langId={entry.packId}
              levelId={entry.levelId}
              title="OYUN KABUKLARI"
              subtitle="Neon · avatar · ikon · seç · oyna"
            />
            <Link
              href={entry.gamesHref}
              rel={entry.gamesHref?.includes("?") ? "nofollow" : undefined}
              className="text-center text-xs font-bold text-cyan-400 hover:underline -mt-2"
            >
              Tam ekran arcade seçici →
            </Link>

            {siblings.length > 0 && (
              <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-5">
                <h2 className="text-sm font-black text-white mb-3 uppercase tracking-wider">
                  Aynı paketten
                </h2>
                <ul className="space-y-1.5">
                  {siblings.map((s) => (
                    <li key={s.levelId}>
                      <Link
                        href={s.pageHref}
                        prefetch={false}
                        className="text-sm text-slate-400 hover:text-cyan-300"
                      >
                        {s.levelName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pathway && (
              <div className="rounded-3xl border border-white/5 bg-slate-900/10 p-5 text-sm text-slate-500">
                <p className="mb-2">
                  Dil yolu:{" "}
                  <Link
                    href={`/learn/${langPair}/`}
                    className="text-cyan-400 hover:underline"
                  >
                    {pathway.labelTr}
                  </Link>
                </p>
                <p lang="en" className="text-xs">
                  {pathway.labelEn} · level page · Memolandum
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
