"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import {
  Play,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  GraduationCap,
  Trophy,
  Sparkles,
  Globe,
} from "lucide-react";
import { resolveDataUrl, DEFAULT_REMOTE_DATA_BASE } from "@/lib/contentCdn";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { resolveSafePlaylistCategory } from "@/lib/youtube/playlistCategory";

const GCS_YOUTUBE_JSON_URL =
  "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data/youtube_videos.json";

const BASE_CATEGORIES = [
  { id: "all", name: "Tüm Videolar", nameEn: "All Videos", icon: Video, group: "all", order: 0 },
  { id: "1sınıf", name: "1. Sınıf", nameEn: "1st Grade", icon: GraduationCap, group: "grade", order: 10 },
  { id: "2sınıf", name: "2. Sınıf", nameEn: "2nd Grade", icon: GraduationCap, group: "grade", order: 20 },
  { id: "3sınıf", name: "3. Sınıf", nameEn: "3rd Grade", icon: GraduationCap, group: "grade", order: 30 },
  { id: "4sınıf", name: "4. Sınıf", nameEn: "4th Grade", icon: GraduationCap, group: "grade", order: 40 },
  { id: "5sınıf", name: "5. Sınıf", nameEn: "5th Grade", icon: GraduationCap, group: "grade", order: 50 },
  { id: "6sınıf", name: "6. Sınıf", nameEn: "6th Grade", icon: GraduationCap, group: "grade", order: 60 },
  { id: "7sınıf", name: "7. Sınıf", nameEn: "7th Grade", icon: GraduationCap, group: "grade", order: 70 },
  { id: "8sınıf", name: "8. Sınıf (LGS)", nameEn: "8th Grade (LGS)", icon: GraduationCap, group: "grade", order: 80 },
  { id: "yds", name: "YDS Kelimeleri", nameEn: "YDS Vocabulary", nameAr: "مفردات YDS", icon: Trophy, group: "exam", order: 90 },
  { id: "ar-en", name: "Arapça–İngilizce Konu Anlatımı", nameEn: "Arabic–English Video Lessons", nameAr: "إتقان الإنجليزية خطوة بخطوة", namePt: "Árabe–Inglês (Aulas)", icon: Globe, group: "general", order: 95 },
  { id: "pt-en", name: "Portekizce–İngilizce Konu Anlatımı", nameEn: "Portuguese–English Video Lessons", namePt: "Curso de Inglês do Zero (PT-BR)", nameAr: "شرح الإنجليزية بالبرتغالية", icon: Globe, group: "general", order: 96 },
  { id: "hap-bilgiler", name: "1 Dk Hap Bilgiler", nameEn: "1-Min Quick Tips", nameAr: "معلومات سريعة في دقيقة", namePt: "Dicas Rápidas de 1 Min", icon: Sparkles, group: "general", order: 100 },
  { id: "a2", name: "A2 Daily Routines", nameEn: "A2 Daily Routines", icon: Globe, group: "general", order: 110 },
  { id: "a2-travel", name: "A2 Travel & Listening", nameEn: "A2 Travel & Listening", icon: Globe, group: "general", order: 120 },
  { id: "crazy-english", name: "Crazy English", nameEn: "Crazy English", icon: Sparkles, group: "general", order: 130 },
];

function iconForGroup(group) {
  if (group === "grade") return GraduationCap;
  if (group === "exam") return Trophy;
  if (group === "general") return Sparkles;
  return Video;
}

function normalizeCategoryKey(raw) {
  if (!raw) return "";
  try {
    return decodeURIComponent(String(raw)).trim();
  } catch {
    return String(raw).trim();
  }
}

export default function VideosClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";

  const [videoData, setVideoData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeVideo, setActiveVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Merge static base categories with any newly synced playlists in youtube_videos.json
  const categories = useMemo(() => {
    const map = new Map();
    for (const c of BASE_CATEGORIES) {
      map.set(c.id, { ...c });
    }
    if (videoData && typeof videoData === "object") {
      Object.entries(videoData).forEach(([key, info], idx) => {
        if (!info || !Array.isArray(info.videos)) return;
        const existing = map.get(key);
        if (existing) {
          existing.count = info.videos.length;
          existing.playlistId = info.playlistId;
          existing.fullTitle = info.name;
        } else {
          const cleanName = info.shortName || info.name?.split("|")[0]?.trim() || key;
          map.set(key, {
            id: key,
            name: cleanName,
            nameEn: info.shortNameEn || cleanName,
            fullTitle: info.name || cleanName,
            playlistId: info.playlistId,
            icon: iconForGroup(info.group),
            group: info.group || "general",
            order: info.order || 200 + idx,
            count: info.videos.length,
          });
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [videoData]);

  // Load active category from URL query param if present
  useEffect(() => {
    const rawParam = searchParams.get("playlist");
    if (!rawParam) {
      setActiveCategory("all");
      return;
    }
    const catParam = normalizeCategoryKey(rawParam);
    const match = categories.find(
      (c) =>
        c.id === catParam ||
        c.id.toLowerCase() === catParam.toLowerCase() ||
        c.id.replace(/ı/g, "i") === catParam.toLowerCase().replace(/ı/g, "i")
    );
    if (match) {
      setActiveCategory(match.id);
    } else if (videoData && videoData[catParam]) {
      setActiveCategory(catParam);
    } else {
      const safeKey = resolveSafePlaylistCategory(
        catParam,
        categories.map((c) => c.id).filter((id) => id !== "all")
      );
      setActiveCategory(safeKey || "all");
    }
  }, [searchParams, categories, videoData]);

  // Fetch videos data (try GCS + local, pick the richest / freshest dataset)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const cacheBust = `v=${Math.floor(Date.now() / 60000)}`;
    const primaryUrl = `${resolveDataUrl("youtube_videos.json")}?${cacheBust}`;
    const localUrl = `/data/youtube_videos.json?${cacheBust}`;
    const gcsUrl = `${GCS_YOUTUBE_JSON_URL}?${cacheBust}`;
    const remoteFallback = `${DEFAULT_REMOTE_DATA_BASE}/youtube_videos.json?${cacheBust}`;

    const candidateUrls = Array.from(new Set([gcsUrl, primaryUrl, localUrl, remoteFallback]));

    function scoreDataset(d) {
      if (!d || typeof d !== "object") return -1;
      const keys = Object.keys(d);
      if (keys.length === 0) return -1;
      let totalVideos = 0;
      let latestTime = 0;
      for (const k of keys) {
        const vids = d[k]?.videos;
        if (Array.isArray(vids)) {
          totalVideos += vids.length;
          for (const v of vids) {
            const t = Date.parse(v?.publishedAt || "") || 0;
            if (t > latestTime) latestTime = t;
          }
        }
      }
      return keys.length * 10000 + totalVideos * 100 + Math.floor(latestTime / 1e9);
    }

    async function loadBestData() {
      const results = await Promise.allSettled(
        candidateUrls.map((u) =>
          fetch(u, { cache: "no-store" }).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
        )
      );

      let best = null;
      let bestScore = -1;
      for (const res of results) {
        if (res.status === "fulfilled" && res.value) {
          const s = scoreDataset(res.value);
          if (s > bestScore) {
            bestScore = s;
            best = res.value;
          }
        }
      }

      if (!cancelled) {
        if (best) {
          setVideoData(best);
        } else {
          console.error("YouTube videoları yüklenemedi.");
        }
        setIsLoading(false);
      }
    }

    loadBestData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered video list
  const filteredVideos = useMemo(() => {
    if (!videoData) return [];

    if (activeCategory === "all") {
      const all = [];
      const seen = new Set();
      Object.keys(videoData).forEach((cat) => {
        const catInfo = videoData[cat];
        if (catInfo && Array.isArray(catInfo.videos)) {
          catInfo.videos.forEach((v) => {
            if (!v?.id || v.title === "Deleted video" || v.title === "Private video") return;
            if (!seen.has(v.id)) {
              seen.add(v.id);
              all.push({
                ...v,
                category: cat,
                categoryName: catInfo.shortName || catInfo.name,
              });
            }
          });
        }
      });
      return all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else {
      const catInfo = videoData[activeCategory];
      if (!catInfo || !Array.isArray(catInfo.videos)) return [];
      return catInfo.videos
        .filter((v) => v?.id && v.title !== "Deleted video" && v.title !== "Private video")
        .map((v) => ({
          ...v,
          category: activeCategory,
          categoryName: catInfo.shortName || catInfo.name,
        }));
    }
  }, [videoData, activeCategory]);

  const activeCategoryMeta = useMemo(() => {
    return categories.find((c) => c.id === activeCategory) || null;
  }, [categories, activeCategory]);

  // Navigate videos within current filtered list inside modal
  const handlePrevVideo = () => {
    if (!activeVideo || filteredVideos.length <= 1) return;
    const currentIdx = filteredVideos.findIndex((v) => v.id === activeVideo.id);
    const prevIdx = (currentIdx - 1 + filteredVideos.length) % filteredVideos.length;
    setActiveVideo(filteredVideos[prevIdx]);
  };

  const handleNextVideo = () => {
    if (!activeVideo || filteredVideos.length <= 1) return;
    const currentIdx = filteredVideos.findIndex((v) => v.id === activeVideo.id);
    const nextIdx = (currentIdx + 1) % filteredVideos.length;
    setActiveVideo(filteredVideos[nextIdx]);
  };

  const getPlaylistUrl = (categoryKey) => {
    if (!videoData || !videoData[categoryKey]?.playlistId) {
      return "https://www.youtube.com/@memolandum/playlists";
    }
    return `https://www.youtube.com/playlist?list=${videoData[categoryKey].playlistId}`;
  };

  const selectCategory = (catId) => {
    setActiveCategory(catId);
    if (catId === "all") {
      router.replace("/videos", { scroll: false });
    } else {
      router.replace(`/videos?playlist=${encodeURIComponent(catId)}`, { scroll: false });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Header Section */}
        <header className="mb-8 text-center max-w-3xl mx-auto">
          <a
            href="https://www.youtube.com/@memolandum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(239,68,68,0.18)] transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-red-400" />
            <span>@memolandum · {isEn ? "Animated Video Library" : "Animasyonlu Kelime & Listening Videoları"}</span>
          </a>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            {activeCategory !== "all" && activeCategoryMeta
              ? videoData?.[activeCategory]?.name?.split("|")[0]?.trim() ||
                (isEn ? activeCategoryMeta.nameEn : activeCategoryMeta.name)
              : isEn
                ? "Visual & Audio English Videos"
                : "Görsel & Sesli İngilizce Videoları"}
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            {isEn
              ? "1st–8th Grade (Primary & Middle School / LGS), YDS academic vocabulary, and A1–A2 listening animations from our @memolandum YouTube channel — updated automatically!"
              : "1–8. Sınıf (İlkokul & Ortaokul / LGS), YDS akademik kelimeler ve A1–A2 günlük konuşma oynatma listelerimiz @memolandum YouTube kanalımızdan otomatik güncellenir. Siteden çıkmadan izleyin!"}
          </p>
        </header>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
            {categories.map((cat) => {
              const Icon = cat.icon || Video;
              const active = activeCategory === cat.id;
              const count =
                cat.id === "all"
                  ? filteredVideos.length
                  : videoData?.[cat.id]?.videos?.length ?? cat.count;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]"
                      : "bg-slate-900/70 text-slate-300 border border-slate-800/80 hover:text-white hover:border-cyan-500/40 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{isAr ? cat.nameAr || cat.nameEn || cat.name : isPt ? cat.namePt || cat.nameEn || cat.name : isEn ? cat.nameEn || cat.name : cat.name}</span>
                  {typeof count === "number" && count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Category Banner */}
        {activeCategory !== "all" && videoData?.[activeCategory] && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-slate-900/90 via-slate-950 to-red-950/25 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                {isEn ? "YouTube Playlist Category" : "YouTube Oynatma Listesi Kategorisi"}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {videoData[activeCategory].name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEn
                  ? `${filteredVideos.length} videos synced from @memolandum`
                  : `@memolandum kanalından ${filteredVideos.length} güncel video listeleniyor`}
              </p>
            </div>
            <a
              href={getPlaylistUrl(activeCategory)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-300 font-bold text-xs sm:text-sm transition-all shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isEn ? "Open Playlist on YouTube" : "YouTube Oynatma Listesini Aç"}</span>
            </a>
          </div>
        )}

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse flex flex-col justify-end p-4"
              >
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/30">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400 mb-1">
              {isEn ? "No videos found in this category yet" : "Henüz video eklenmedi"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {isEn
                ? "Videos for this playlist will be synced automatically."
                : "Bu oynatma listesi için videolar yakında yüklenecektir."}
            </p>
            {activeCategory !== "all" && (
              <button
                type="button"
                onClick={() => selectCategory("all")}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-colors"
              >
                {isEn ? "Show All Videos" : "Tüm Videoları Göster"}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={`${video.category}-${video.id}`}
                  onClick={() => setActiveVideo(video)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 hover:border-cyan-500/50 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer flex flex-col justify-end"
                >
                  {/* Thumbnail Image */}
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${video.thumbnail})` }}
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-85 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/95 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/35 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="relative z-10 p-5">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-md mb-2 inline-block">
                      {video.categoryName?.split("|")[0]?.trim() || "Kategori"}
                    </span>
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-cyan-200 transition-colors">
                      {video.title}
                    </h3>
                    {video.publishedAt && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(video.publishedAt).toLocaleDateString(isEn ? "en-US" : "tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Playlist CTA at bottom */}
            <div className="mt-12 text-center">
              <a
                href={
                  activeCategory !== "all"
                    ? getPlaylistUrl(activeCategory)
                    : "https://www.youtube.com/@memolandum/playlists"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border-2 border-red-500/60 text-red-400 font-black text-sm hover:bg-slate-850 hover:border-red-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              >
                <ExternalLink className="w-4 h-4" />
                {activeCategory !== "all"
                  ? isEn
                    ? "Watch Full Playlist on YouTube"
                    : "YouTube Oynatma Listesine Git"
                  : isEn
                    ? "Visit @memolandum YouTube Channel"
                    : "@memolandum YouTube Kanalına Git"}
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveVideo(null)} />

          <div className="relative z-10 w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                {activeVideo.categoryName?.split("|")[0]?.trim() || (isEn ? "Watch on Site" : "Sitede İzle")}
              </span>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-[9/16] bg-black flex-1 max-h-[65vh]">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Description / Navigation */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-3">
              <div>
                <h3 className="font-bold text-white text-sm line-clamp-1">
                  {activeVideo.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {activeVideo.description || (isEn ? "No description." : "Açıklama bulunmuyor.")}
                </p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-900 pt-3">
                <button
                  type="button"
                  onClick={handlePrevVideo}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> {isEn ? "Prev" : "Önceki"}
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1"
                >
                  {isEn ? "Open on YouTube" : "YouTube'da Aç"} <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleNextVideo}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {isEn ? "Next" : "Sonraki"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
