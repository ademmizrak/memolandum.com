"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Play, ExternalLink, X, ChevronLeft, ChevronRight, Video, GraduationCap, Trophy } from "lucide-react";
import { resolveDataUrl } from "@/lib/contentCdn";

const CATEGORIES = [
  { id: "all", name: "Tüm Videolar", icon: Video },
  { id: "2sınıf", name: "2. Sınıf", icon: GraduationCap },
  { id: "3sınıf", name: "3. Sınıf", icon: GraduationCap },
  { id: "4sınıf", name: "4. Sınıf", icon: GraduationCap },
  { id: "yds", name: "YDS Kelimeleri", icon: Trophy }
];

export default function VideosClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [videoData, setVideoData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeVideo, setActiveVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active category from URL query param if present
  useEffect(() => {
    const catParam = searchParams.get("playlist");
    if (catParam && CATEGORIES.some(c => c.id === catParam)) {
      setActiveCategory(catParam);
    }
  }, [searchParams]);

  // Fetch videos data
  useEffect(() => {
    setIsLoading(true);
    fetch(`${resolveDataUrl("youtube_videos.json")}?v=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Veri yüklenemedi");
        return res.json();
      })
      .then((data) => {
        setVideoData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("YouTube videoları yüklenirken hata:", err);
        setIsLoading(false);
      });
  }, []);

  // Filtered video list
  const filteredVideos = useMemo(() => {
    if (!videoData) return [];
    
    if (activeCategory === "all") {
      // Flatten all videos, remove duplicates by ID, sort by latest
      const all = [];
      const seen = new Set();
      Object.keys(videoData).forEach((cat) => {
        const catInfo = videoData[cat];
        if (catInfo && Array.isArray(catInfo.videos)) {
          catInfo.videos.forEach((v) => {
            if (!seen.has(v.id)) {
              seen.add(v.id);
              // Avoid general promo video in listing unless it matches
              all.push({ ...v, category: cat, categoryName: catInfo.name });
            }
          });
        }
      });
      return all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else {
      const catInfo = videoData[activeCategory];
      if (!catInfo || !Array.isArray(catInfo.videos)) return [];
      return catInfo.videos.map((v) => ({
        ...v,
        category: activeCategory,
        categoryName: catInfo.name,
      }));
    }
  }, [videoData, activeCategory]);

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
    if (!videoData || !videoData[categoryKey]) return "https://www.youtube.com/@memolandum";
    return `https://www.youtube.com/playlist?list=${videoData[categoryKey].playlistId}`;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Header Section */}
        <header className="mb-10 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
            <Video className="w-3.5 h-3.5" /> Animasyonlu Kelime Videoları
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Görsel & Sesli Shorts Videoları
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            İlkokul ve YDS İngilizce kelimelerini animasyonlar eşliğinde, telaffuzlarıyla birlikte eğlenceli videolarla pekiştirin. Siteden çıkmadan izleyin!
          </p>
        </header>

        {/* Category Tabs */}
        <div className="flex justify-center mb-10 overflow-x-auto py-2 px-1 scrollbar-hide">
          <div className="bg-slate-950/80 p-2 rounded-2xl border border-slate-800/80 inline-flex gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    // Update URL query parameter
                    if (cat.id === "all") {
                      router.replace("/videos", { scroll: false });
                    } else {
                      router.replace(`/videos?playlist=${cat.id}`, { scroll: false });
                    }
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse flex flex-col justify-end p-4">
                <div className="h-4 bg-slate-850 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-850 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/30">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400 mb-1">Henüz video eklenmedi</h3>
            <p className="text-sm text-slate-500">Bu oynatma listesi için videolar yakında yüklenecektir.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 hover:border-cyan-500/50 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer flex flex-col justify-end"
                >
                  {/* Thumbnail Image */}
                  <div className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${video.thumbnail})` }} />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/35 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="relative z-10 p-5">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md mb-2 inline-block">
                      {video.categoryName?.split("|")[0]?.trim() || "Kategori"}
                    </span>
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-cyan-200 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {new Date(video.publishedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Playlist CTA at bottom */}
            {activeCategory !== "all" && (
              <div className="mt-12 text-center">
                <a
                  href={getPlaylistUrl(activeCategory)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border-2 border-red-500/60 text-red-500 font-black text-sm hover:bg-slate-850 hover:border-red-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                >
                  <ExternalLink className="w-4 h-4" />
                  YouTube Oynatma Listesine Git
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveVideo(null)} />
          
          <div className="relative z-10 w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                Sitede İzle
              </span>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Container (9:16 Aspect Ratio) */}
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
                  {activeVideo.description || "Açıklama bulunmuyor."}
                </p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-900 pt-3">
                <button
                  onClick={handlePrevVideo}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Önceki
                </button>
                <a
                  href={`https://youtube.com/shorts/${activeVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                >
                  YouTube'da Aç <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleNextVideo}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Sonraki <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
