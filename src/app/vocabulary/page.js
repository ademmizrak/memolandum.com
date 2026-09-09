"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import {
  formatPulseDueLabel,
  isDue,
  isGameLearnedWord,
  isUserAddedWord,
  migrateVaultItem,
} from "../../lib/learning/memolandumPulse";
import {
  buildLanguageFilterOptions,
  languageMatchesFilter,
  resolveVaultLanguage,
} from "../../lib/learning/vaultLanguage";
import { RetroLineChart } from "../../components/ui/charts/RetroLineChart";
import { RetroBarChart } from "../../components/ui/charts/RetroBarChart";
import { RetroRadialChart } from "../../components/ui/charts/RetroRadialChart";
import WeakWordsModal from "../../components/learning/WeakWordsModal";

const STRENGTH_CONFIG = {
  1: { label: "Yeni", color: "#ef4444", glow: "rgba(239,68,68,0.3)", emoji: "🔴" },
  2: { label: "Öğreniyor", color: "#f97316", glow: "rgba(249,115,22,0.3)", emoji: "🟠" },
  3: { label: "Orta", color: "#eab308", glow: "rgba(234,179,8,0.3)", emoji: "🟡" },
  4: { label: "İyi", color: "#22c55e", glow: "rgba(34,197,94,0.3)", emoji: "🟢" },
  5: { label: "Usta", color: "#22d3ee", glow: "rgba(34,211,238,0.3)", emoji: "💎" },
};

const SOURCE_TABS = [
  { id: "all", label: "Tümü" },
  { id: "due", label: "Tekrar bekleyen" },
  { id: "weak", label: "⚠️ Hata Defterim" },
  { id: "learned", label: "Oyundan öğrenilen" },
  { id: "added", label: "Senin eklediklerin" },
  { id: "mastered", label: "Usta" },
];

function ReviewMode({ words, onExit, onReview }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState([]);
  const audioRef = useRef(null);

  const word = words[idx];

  const handlePlay = () => {
    const url = word?.audioUrl;
    if (!url || !audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  };

  const handleRate = (knew) => {
    onReview(word.id, knew);
    setResults((prev) => [...prev, { word, knew }]);
    if (idx + 1 >= words.length) setDone(true);
    else {
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  if (done) {
    const correct = results.filter((r) => r.knew).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "40px 20px",
        }}
      >
        <div style={{ fontSize: 64 }}>{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}</div>
        <h2 style={{ color: "#22d3ee", fontSize: 28, fontWeight: 700, margin: 0 }}>
          Pulse tekrarı tamamlandı
        </h2>
        <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#22c55e", fontSize: 32, fontWeight: 800 }}>{correct}</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Bildim</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#ef4444", fontSize: 32, fontWeight: 800 }}>
              {results.length - correct}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Bilmedim</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#c084fc", fontSize: 32, fontWeight: 800 }}>{pct}%</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Başarı</div>
          </div>
        </div>
        <button
          onClick={onExit}
          style={{
            marginTop: 16,
            padding: "12px 32px",
            background: "linear-gradient(135deg,#22d3ee,#6366f1)",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Kasaya dön
        </button>
      </div>
    );
  }

  const cfg = STRENGTH_CONFIG[word?.strength || 1];
  const source = isUserAddedWord(word) ? "Senin eklediğin" : "Oyundan";
  const langMeta = resolveVaultLanguage(word?.language);
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "40px 20px",
      }}
    >
      <audio ref={audioRef} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#6b7280", fontSize: 14 }}>
        <span>
          {langMeta.flag} {langMeta.label}
        </span>
        <span>•</span>
        <span>
          {idx + 1} / {words.length}
        </span>
        <span>•</span>
        <span style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </span>
        <span>•</span>
        <span style={{ color: "#94a3b8" }}>{source}</span>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(idx / Math.max(1, words.length)) * 100}%`,
            background: "linear-gradient(90deg,#22d3ee,#6366f1)",
            transition: "width 0.3s",
          }}
        />
      </div>
      <div
        onClick={() => {
          setFlipped(true);
          if (!flipped) handlePlay();
        }}
        style={{
          width: "100%",
          maxWidth: 480,
          minHeight: 220,
          background: "linear-gradient(135deg,rgba(22,211,238,0.06),rgba(99,102,241,0.06))",
          border: `1.5px solid ${flipped ? cfg.color + "60" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 20,
          padding: 40,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          transition: "border-color 0.3s",
          boxShadow: flipped ? `0 0 32px ${cfg.glow}` : "none",
          position: "relative",
        }}
      >
        {!flipped && (
          <div style={{ position: "absolute", top: 14, right: 14, color: "#374151", fontSize: 12 }}>
            Görmek için dokun
          </div>
        )}
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#e2e8f0",
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          {word?.english}
        </div>
        {flipped && (
          <>
            <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color, textAlign: "center" }}>
              {word?.turkish}
            </div>
            {word?.audioUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay();
                }}
                style={{
                  marginTop: 8,
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: "#22d3ee",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🔊 Dinle
              </button>
            )}
          </>
        )}
      </div>
      {flipped ? (
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={() => handleRate(false)}
            style={{
              padding: "14px 32px",
              background: "rgba(239,68,68,0.15)",
              border: "1.5px solid rgba(239,68,68,0.4)",
              borderRadius: 12,
              color: "#ef4444",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✗ Bilmedim
          </button>
          <button
            onClick={() => handleRate(true)}
            style={{
              padding: "14px 32px",
              background: "rgba(34,197,94,0.15)",
              border: "1.5px solid rgba(34,197,94,0.4)",
              borderRadius: 12,
              color: "#22c55e",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✓ Bildim
          </button>
        </div>
      ) : (
        <div style={{ color: "#4b5563", fontSize: 13 }}>Kartı çevir, sonra değerlendir</div>
      )}
      <button
        onClick={onExit}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Tekrarı bitir
      </button>
    </div>
  );
}

export default function VocabularyPage() {
  const { vocabularyVault, recordVaultReview, updateWordStrength, isGuest } =
    useMemolandumStore();
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];

  const [mainTab, setMainTab] = useState("vault"); // "vault" | "stats"
  const [viewMode, setViewMode] = useState("thumbnail"); // "thumbnail" | "grid" | "rows"
  const [sourceTab, setSourceTab] = useState("all");
  const [filterLang, setFilterLang] = useState("all");
  const [filterStrength, setFilterStrength] = useState("all");
  const [sortBy, setSortBy] = useState("due");
  const [searchQ, setSearchQ] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewWords, setReviewWords] = useState([]);
  const [weakWordsModalOpen, setWeakWordsModalOpen] = useState(false);

  // Multi-select & Custom Level Creation State
  const createCustomLevel = useMemolandumStore((s) => s.createCustomLevel);
  const [selectedWordIds, setSelectedWordIds] = useState([]);
  const [customLevelCreatedModal, setCustomLevelCreatedModal] = useState(null);
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);

  const toggleSelectWord = (wordId) => {
    setSelectedWordIds((prev) =>
      prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId]
    );
  };

  const toggleSelectAllFiltered = (filteredList) => {
    const allFilteredIds = (filteredList || []).map((w) => w.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedWordIds.includes(id));
    if (allSelected) {
      setSelectedWordIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedWordIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleCreateCustomLevel = () => {
    if (selectedWordIds.length === 0) return;
    const selectedObjList = allWords.filter((w) => selectedWordIds.includes(w.id));
    const title = `Kişisel Level (${selectedObjList.length} Kelime)`;
    const created = createCustomLevel(title, selectedWordIds);
    setCustomLevelCreatedModal({ level: created, words: selectedObjList });
  };

  const setActiveCustomWords = useMemolandumStore((s) => s.setActiveCustomWords);

  const handleLaunchCustomGame = (gameSlug) => {
    if (selectedWordIds.length > 0) {
      const selectedObjList = allWords.filter((w) => selectedWordIds.includes(w.id));
      const title = `Kişisel Level (${selectedObjList.length} Kelime)`;
      createCustomLevel(title, selectedWordIds);
      setActiveCustomWords(selectedObjList);
    }
    window.location.href = `/games/${gameSlug}`;
  };

  const now = Date.now();

  const allWords = useMemo(() => {
    return Object.values(vocabularyVault || {}).map((w) => migrateVaultItem(w, now));
  }, [vocabularyVault]);

  // Learning Curve Analytics Breakdown
  const stageCounts = useMemo(() => {
    let firstTry = 0;
    let p100 = 0;
    let p75 = 0;
    let p50 = 0;
    let p25 = 0;

    allWords.forEach((w) => {
      if (w.firstTryCorrect === true) {
        firstTry++;
      } else if (w.learningProgressPct === 100) {
        p100++;
      } else if (w.learningProgressPct === 75) {
        p75++;
      } else if (w.learningProgressPct === 50) {
        p50++;
      } else if (w.learningProgressPct === 25) {
        p25++;
      } else {
        // Fallback mapping based on word strength level (1..5) for vault words
        const s = w.strength || 1;
        if (s >= 4) firstTry++;
        else if (s === 3) p75++;
        else if (s === 2) p50++;
        else p25++;
      }
    });

    return { firstTry, p100, p75, p50, p25 };
  }, [allWords]);

  // Last 7 Days Practice Activity Aggregation
  const dailyHistory = useMemo(() => {
    const daysMap = {};
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = dayNames[d.getDay()];
      daysMap[key] = { label, correct: 0, wrong: 0 };
    }

    (quizHistory || []).forEach((h) => {
      const dStr = new Date(h.timestamp || Date.now()).toISOString().split("T")[0];
      if (daysMap[dStr]) {
        if (h.isCorrect) daysMap[dStr].correct++;
        else daysMap[dStr].wrong++;
      }
    });

    return Object.values(daysMap);
  }, [quizHistory]);

  /** Önce kaynak sekmesi — dil listesi buna göre üretilir (boş filtre tuzağı olmasın) */
  const sourceScopedWords = useMemo(() => {
    if (sourceTab === "due") return allWords.filter((w) => isDue(w, now));
    if (sourceTab === "weak") return allWords.filter((w) => (w.lapses || 0) > 0 || (w.strength || 1) <= 2 || (w.easiness || 2.5) < 2.2);
    if (sourceTab === "learned") return allWords.filter(isGameLearnedWord);
    if (sourceTab === "added") return allWords.filter(isUserAddedWord);
    if (sourceTab === "mastered") return allWords.filter((w) => (w.strength || 1) >= 5);
    return allWords;
  }, [allWords, sourceTab, now]);

  const lastPlayedLang = useMemolandumStore((s) => s.lastPlayedLang);

  const languageOptions = useMemo(
    () => buildLanguageFilterOptions(sourceScopedWords),
    [sourceScopedWords]
  );

  // Auto-set initial filterLang to user's active/most studied language on initial load
  const hasInitializedLang = React.useRef(false);
  useEffect(() => {
    if (hasInitializedLang.current || languageOptions.length <= 1) return;

    // 1. Match user's lastPlayedLang
    const activeOption = languageOptions.find(
      (o) => o.value !== "all" && (o.value === lastPlayedLang || lastPlayedLang?.includes(o.value))
    );

    if (activeOption) {
      setFilterLang(activeOption.value);
      hasInitializedLang.current = true;
    } else {
      // 2. Otherwise select the language option with the highest word count
      const topOption = [...languageOptions]
        .filter((o) => o.value !== "all")
        .sort((a, b) => (b.count || 0) - (a.count || 0))[0];
      if (topOption) {
        setFilterLang(topOption.value);
        hasInitializedLang.current = true;
      }
    }
  }, [languageOptions, lastPlayedLang]);

  useEffect(() => {
    if (filterLang === "all") return;
    if (!languageOptions.some((o) => o.value === filterLang)) {
      setFilterLang("all");
    }
  }, [languageOptions, filterLang]);

  const sourceCounts = useMemo(() => {
    const due = allWords.filter((w) => isDue(w, now)).length;
    const weak = allWords.filter((w) => (w.lapses || 0) > 0 || (w.strength || 1) <= 2 || (w.easiness || 2.5) < 2.2).length;
    const learned = allWords.filter(isGameLearnedWord).length;
    const added = allWords.filter(isUserAddedWord).length;
    const mastered = allWords.filter((w) => (w.strength || 1) >= 5).length;
    return {
      all: allWords.length,
      due,
      weak,
      learned,
      added,
      mastered,
    };
  }, [allWords, now]);

  const filtered = useMemo(() => {
    let ws = sourceScopedWords;

    if (filterLang !== "all") {
      ws = ws.filter((w) => languageMatchesFilter(w.language, filterLang));
    }
    if (filterStrength !== "all") {
      ws = ws.filter((w) => (w.strength || 1) === Number(filterStrength));
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      ws = ws.filter(
        (w) =>
          w.english?.toLowerCase().includes(q) || w.turkish?.toLowerCase().includes(q)
      );
    }
    return [...ws].sort((a, b) => {
      if (sortBy === "lastSeen") return (b.lastSeen || 0) - (a.lastSeen || 0);
      if (sortBy === "strength_asc") return (a.strength || 1) - (b.strength || 1);
      if (sortBy === "strength_desc") return (b.strength || 1) - (a.strength || 1);
      if (sortBy === "due") {
        const ad = isDue(a, now) ? 0 : 1;
        const bd = isDue(b, now) ? 0 : 1;
        if (ad !== bd) return ad - bd;
        return (a.dueAt || 0) - (b.dueAt || 0);
      }
      return a.english?.localeCompare(b.english || "") || 0;
    });
  }, [
    sourceScopedWords,
    filterLang,
    filterStrength,
    searchQ,
    sortBy,
    now,
  ]);

  const stats = useMemo(() => {
    const s = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    sourceScopedWords.forEach((w) => {
      s[w.strength || 1] = (s[w.strength || 1] || 0) + 1;
    });
    return s;
  }, [sourceScopedWords]);

  const startReview = (words) => {
    const list = [...words].sort((a, b) => {
      const ad = isDue(a, now) ? 0 : 1;
      const bd = isDue(b, now) ? 0 : 1;
      if (ad !== bd) return ad - bd;
      return (a.dueAt || 0) - (b.dueAt || 0);
    });
    setReviewWords(list);
    setReviewMode(true);
  };

  if (reviewMode) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "Inter,sans-serif" }}>
        <Header />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
          <button
            onClick={() => setReviewMode(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 14,
              marginBottom: 8,
              padding: 0,
            }}
          >
            ← Kelime Kasasına dön
          </button>
          <ReviewMode
            words={reviewWords}
            onExit={() => setReviewMode(false)}
            onReview={(id, knew) => recordVaultReview(id, knew)}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        fontFamily: "Inter,sans-serif",
        color: "#e2e8f0",
      }}
    >
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                margin: 0,
                background: "linear-gradient(135deg,#22d3ee,#c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Kelime Kasası
            </h1>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 15 }}>
              Memolandum Pulse™ · {sourceCounts.all} kelime · {sourceCounts.due} tekrar bekliyor
            </p>
            <Link
              href="/method/"
              style={{ color: "#f59e0b", fontSize: 13, textDecoration: "none", fontWeight: 600 }}
            >
              Pulse nasıl çalışır? →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/my-lexicon/"
              style={{
                padding: "12px 18px",
                background: "linear-gradient(135deg,#a3e635,#22c55e)",
                borderRadius: 10,
                color: "#0f172a",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 4px 18px rgba(163,230,53,0.35)",
                display: "inline-flex",
                flexDirection: "column",
                gap: 2,
                lineHeight: 1.2,
              }}
            >
              <span>＋ Kendi kelimelerimi ekle</span>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
                My Lexicon · tüm oyunlarda çalış
              </span>
            </Link>
            {allWords.length > 0 && (
              <>
                <button
                  onClick={() => setWeakWordsModalOpen(true)}
                  disabled={sourceCounts.weak === 0}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(244,63,94,0.15)",
                    border: "1.5px solid rgba(244,63,94,0.4)",
                    borderRadius: 10,
                    color: "#f43f5e",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                    opacity: sourceCounts.weak === 0 ? 0.4 : 1,
                  }}
                >
                  ⚠️ Hata Defteri ({sourceCounts.weak})
                </button>
                <button
                  onClick={() => startReview(allWords.filter((w) => isDue(w, now)))}
                  disabled={sourceCounts.due === 0}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(245,158,11,0.15)",
                    border: "1.5px solid rgba(245,158,11,0.4)",
                    borderRadius: 10,
                    color: "#f59e0b",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                    opacity: sourceCounts.due === 0 ? 0.4 : 1,
                  }}
                >
                  ⚡ Due tekrar ({sourceCounts.due})
                </button>
                <button
                  onClick={() => startReview(filtered)}
                  disabled={filtered.length === 0}
                  style={{
                    padding: "10px 20px",
                    background:
                      "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(99,102,241,0.15))",
                    border: "1.5px solid rgba(34,211,238,0.3)",
                    borderRadius: 10,
                    color: "#22d3ee",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                    opacity: filtered.length === 0 ? 0.4 : 1,
                  }}
                >
                  ▶ Görünenleri tekrar et
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Tab Switcher: Vault vs Analytics Profile */}
        <div className="flex bg-slate-950/80 border border-slate-800/80 rounded-2xl p-1.5 mb-6 max-w-md shadow-md font-mono text-sm">
          <button
            type="button"
            onClick={() => setMainTab("vault")}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              mainTab === "vault"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📚 KELİME KASASI ({sourceCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setMainTab("stats")}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              mainTab === "stats"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📊 ÖĞRENME PROFİLİ
          </button>
        </div>

        {/* TAB 2: Learning Profile Analytics Dashboard */}
        {mainTab === "stats" && (
          <div className="flex flex-col gap-6 mb-12">
            {/* Top Analytics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-2xl flex flex-col gap-1 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">TOPLAM KELİME</span>
                <span className="text-2xl md:text-3xl font-extrabold text-white font-mono">{sourceCounts.all}</span>
                <span className="text-[11px] text-gray-500">Kasada kayıtlı kelimeler</span>
              </div>
              <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-2xl flex flex-col gap-1 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">TEK SEFERDE BİLİNEN</span>
                <span className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">{stageCounts.firstTry}</span>
                <span className="text-[11px] text-gray-500">%80 az gösterilen pekiştirilmişler</span>
              </div>
              <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col gap-1 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">EĞRİDEKİ KELİMELER</span>
                <span className="text-2xl md:text-3xl font-extrabold text-amber-400 font-mono">
                  {stageCounts.p25 + stageCounts.p50 + stageCounts.p75}
                </span>
                <span className="text-[11px] text-gray-500">%25-75 öğrenme aşamasındakiler</span>
              </div>
              <div className="bg-slate-950/80 border border-purple-500/30 p-4 rounded-2xl flex flex-col gap-1 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">USTALAŞILANLAR</span>
                <span className="text-2xl md:text-3xl font-extrabold text-purple-400 font-mono">{sourceCounts.mastered}</span>
                <span className="text-[11px] text-gray-500">Seviye 5 Usta kelimeler</span>
              </div>
            </div>

            {/* Retro Line Chart: 7-Day History */}
            <RetroLineChart data={dailyHistory} />

            {/* Grid 2-col for Donut & Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RetroRadialChart stageCounts={stageCounts} />
              <RetroBarChart stats={stats} />
            </div>
          </div>
        )}

        {/* TAB 1: Vault Word List */}
        {mainTab === "vault" && (
          <>
            {/* Dil Özel Sekmeleri (Language-Isolated Tabs) */}
            {languageOptions.length > 1 && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1.5 font-mono text-xs border-b border-slate-800/80">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] pr-1 flex items-center gap-1">
                  🌐 DİL SEKMELERİ:
                </span>
                {languageOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterLang(opt.value)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      filterLang === opt.value
                        ? "bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-500/50 shadow-md shadow-purple-900/20"
                        : "bg-slate-900/60 text-gray-400 border border-slate-800 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.count != null && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/60 text-purple-300 font-mono">
                        {opt.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Top-Left Enterprise View Switcher & Selection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1.5 rounded-xl shadow-inner font-mono text-xs">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2.5 hidden sm:inline">
                    GÖRÜNÜM:
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("thumbnail")}
                    title="Thumbnail / Mini Kart Görünümü"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                      viewMode === "thumbnail"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                        : "text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    🎴 <span>Thumbnail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Izgara Görünümü"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                      viewMode === "grid"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                        : "text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    ▦ <span>Izgara</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("rows")}
                    title="Satırlı / Liste Görünümü"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                      viewMode === "rows"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                        : "text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    ☰ <span>Satırlı</span>
                  </button>
                </div>

                {/* Multi-Select Action Button */}
                {filtered.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleSelectAllFiltered(filtered)}
                    className="px-3 py-2 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-mono font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span className="text-cyan-400">
                      {filtered.every((w) => selectedWordIds.includes(w.id)) ? "☑" : "☐"}
                    </span>
                    <span>
                      {filtered.every((w) => selectedWordIds.includes(w.id)) ? "Seçimi Kaldır" : "Tümünü Seç"}
                    </span>
                  </button>
                )}
              </div>

              <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                {selectedWordIds.length > 0 && (
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    {selectedWordIds.length} seçili
                  </span>
                )}
                <span>
                  Görünen: <strong className="text-cyan-400">{filtered.length}</strong> / {sourceCounts.all} kelime
                </span>
              </div>
            </div>

            {/* Kaynak sekmeleri — Pulse + origin */}
        {allWords.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {SOURCE_TABS.map((tab) => {
              const count = sourceCounts[tab.id] ?? 0;
              const active = sourceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSourceTab(tab.id);
                    setFilterLang("all");
                    setFilterStrength("all");
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 99,
                    border: `1px solid ${active ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background: active ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
                    color: active ? "#fbbf24" : "#94a3b8",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {allWords.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              {Object.entries(STRENGTH_CONFIG).map(([str, cfg]) => (
                <div
                  key={str}
                  onClick={() =>
                    setFilterStrength(filterStrength === str ? "all" : str)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background:
                      filterStrength === str ? `${cfg.color}22` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      filterStrength === str ? cfg.color + "60" : "rgba(255,255,255,0.08)"
                    }`,
                    borderRadius: 99,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                  <span style={{ color: cfg.color, fontWeight: 700, fontSize: 15 }}>
                    {stats[str] || 0}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Green Oval Action Button: "Seçilenleri Oyuna Yolla" */}
            <button
              type="button"
              disabled={selectedWordIds.length === 0}
              onClick={() => setIsGameSelectorOpen(true)}
              className={`px-5 py-2.5 rounded-full font-mono text-xs font-extrabold transition-all flex items-center gap-2.5 ${
                selectedWordIds.length > 0
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105 animate-pulse cursor-pointer border border-emerald-300"
                  : "bg-slate-900/80 text-gray-500 border border-slate-800 opacity-60 cursor-not-allowed"
              }`}
              title={selectedWordIds.length === 0 ? "Lütfen aşağıdaki kartlardan kelime seçiniz" : "Seçili kelimelerle oyuna başla"}
            >
              <span className="text-sm">🚀</span>
              <span>Seçilenleri Oyuna Yolla</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${selectedWordIds.length > 0 ? "bg-black/40 text-emerald-300 border border-emerald-400/40" : "bg-slate-800 text-gray-500"}`}>
                {selectedWordIds.length}
              </span>
            </button>
          </div>
        )}

        {allWords.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 24,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Kelime ara..."
              style={{
                flex: "1 1 160px",
                padding: "9px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#e2e8f0",
                fontSize: 14,
                outline: "none",
                minWidth: 120,
              }}
            />
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              style={{
                padding: "9px 14px",
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#e2e8f0",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <option value="all">Tüm diller ({sourceScopedWords.length})</option>
              {languageOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} ({o.count})
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "9px 14px",
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#e2e8f0",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <option value="due">Tekrar sırası (Due)</option>
              <option value="lastSeen">Son görülen</option>
              <option value="strength_asc">Zayıftan güçluye</option>
              <option value="strength_desc">Güçlüden zayıfa</option>
              <option value="alpha">Alfabetik</option>
            </select>
            <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 4 }}>
              {filtered.length} kelime
            </span>
          </div>
        )}

        {allWords.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
            <h2
              style={{ color: "#374151", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}
            >
              Kasa henüz boş
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: 15,
                maxWidth: 400,
                margin: "0 auto 28px",
              }}
            >
              Oyunlarda öğrendiğin kelimeler ve çeviriden eklediklerin burada toplanır. Pulse
              tekrar zamanını ayarlar.
            </p>
            {isGuest && (
              <p
                style={{
                  color: "#f59e0b",
                  fontSize: 13,
                  background: "rgba(245,158,11,0.08)",
                  padding: "10px 20px",
                  borderRadius: 10,
                  display: "inline-block",
                }}
              >
                💡 Üye olursan kelimeler tüm cihazlarında senkronize tutulur.
              </p>
            )}
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/my-lexicon/"
                style={{
                  padding: "12px 28px",
                  background: "linear-gradient(135deg,#a3e635,#22c55e)",
                  borderRadius: 12,
                  color: "#0f172a",
                  fontWeight: 800,
                  textDecoration: "none",
                  fontSize: 15,
                  boxShadow: "0 4px 18px rgba(163,230,53,0.3)",
                }}
              >
                ＋ Kendi kelimelerimi ekle
              </Link>
              <Link
                href="/"
                style={{
                  padding: "12px 28px",
                  background: "linear-gradient(135deg,#22d3ee,#6366f1)",
                  borderRadius: 12,
                  color: "#fff",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                Oyunlara git →
              </Link>
              <Link
                href="/translate/"
                style={{
                  padding: "12px 28px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  color: "#e2e8f0",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                Çeviriden ekle
              </Link>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* VIEW MODE 1: THUMBNAIL / MINI KART GÖRÜNÜMÜ */}
            {viewMode === "thumbnail" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((word) => {
                  const cfg = STRENGTH_CONFIG[word.strength || 1];
                  const due = isDue(word, now);
                  const added = isUserAddedWord(word);
                  const langMeta = resolveVaultLanguage(word.language);
                  const isSelected = selectedWordIds.includes(word.id);

                  return (
                    <div
                      key={word.id}
                      onClick={() => toggleSelectWord(word.id)}
                      className={`relative cursor-pointer bg-slate-950/80 border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-1 ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-2 ring-cyan-400/50"
                          : "hover:border-slate-700"
                      }`}
                      style={{
                        borderColor: isSelected ? "#22d3ee" : due ? "rgba(245,158,11,0.4)" : `${cfg.color}35`,
                        boxShadow: isSelected ? "0 0 25px rgba(6,182,212,0.3)" : `0 4px 20px ${cfg.glow}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected
                                ? "bg-cyan-500 border-cyan-400 text-black font-extrabold text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                                : "bg-slate-900 border-slate-700 text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">
                            {langMeta.flag} {langMeta.label}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            added ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-slate-800 text-gray-400"
                          }`}
                        >
                          {added ? "EKLEDİĞİN" : "OYUNDAN"}
                        </span>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-white tracking-tight">{word.english}</div>
                        <div className="text-sm text-cyan-300/80 font-medium mt-0.5">{word.turkish}</div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="font-bold flex items-center gap-1" style={{ color: cfg.color }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                        <span className={`text-[11px] font-mono ${due ? "text-amber-400 font-bold" : "text-gray-500"}`}>
                          {formatPulseDueLabel(word, now)}
                        </span>
                      </div>

                      <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            title={STRENGTH_CONFIG[s].label}
                            onClick={() => updateWordStrength(word.id, s)}
                            className="flex-1 h-1.5 rounded-full transition-colors"
                            style={{
                              backgroundColor: s <= (word.strength || 1) ? cfg.color : "rgba(255,255,255,0.08)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: IZGARA GÖRÜNÜMÜ */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((word) => {
                  const cfg = STRENGTH_CONFIG[word.strength || 1];
                  const due = isDue(word, now);
                  const added = isUserAddedWord(word);
                  const langMeta = resolveVaultLanguage(word.language);
                  const isSelected = selectedWordIds.includes(word.id);

                  return (
                    <div
                      key={word.id}
                      onClick={() => toggleSelectWord(word.id)}
                      className={`cursor-pointer bg-slate-950/70 border rounded-xl p-3.5 flex flex-col gap-2 transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50 shadow-md"
                          : "border-slate-800/80 hover:border-cyan-500/40"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 mt-1 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected
                                ? "bg-cyan-500 border-cyan-400 text-black font-extrabold text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                                : "bg-slate-900 border-slate-700 text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                          <div className="min-w-0">
                            <div className="text-base font-bold text-white leading-snug truncate">{word.english}</div>
                            <div className="text-xs text-gray-400 truncate">{word.turkish}</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-500 shrink-0">{langMeta.flag}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] mt-1 pt-2 border-t border-slate-900">
                        <span className="font-semibold" style={{ color: cfg.color }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                        <span className={due ? "text-amber-400 font-bold" : "text-gray-500"}>
                          {formatPulseDueLabel(word, now)}
                        </span>
                      </div>

                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateWordStrength(word.id, s)}
                            className="flex-1 h-1 rounded-full"
                            style={{
                              backgroundColor: s <= (word.strength || 1) ? cfg.color : "rgba(255,255,255,0.08)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 3: SATIRLI / LİSTE GÖRÜNÜMÜ */}
            {viewMode === "rows" && (
              <div className="flex flex-col gap-2 font-mono">
                {filtered.map((word) => {
                  const cfg = STRENGTH_CONFIG[word.strength || 1];
                  const due = isDue(word, now);
                  const added = isUserAddedWord(word);
                  const langMeta = resolveVaultLanguage(word.language);
                  const isSelected = selectedWordIds.includes(word.id);

                  return (
                    <div
                      key={word.id}
                      onClick={() => toggleSelectWord(word.id)}
                      className={`cursor-pointer bg-slate-950/80 border rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50 shadow-md"
                          : "border-slate-800/80 hover:border-cyan-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? "bg-cyan-500 border-cyan-400 text-black font-extrabold text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                              : "bg-slate-900 border-slate-700 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                        <span className="text-lg">{langMeta.flag}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{word.english}</div>
                          <div className="text-xs text-gray-400 font-sans">{word.turkish}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-bold" style={{ color: cfg.color }}>
                            {cfg.emoji} {cfg.label}
                          </span>
                          <div className="flex gap-1 w-16">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateWordStrength(word.id, s)}
                                className="flex-1 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: s <= (word.strength || 1) ? cfg.color : "rgba(255,255,255,0.1)",
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="text-xs min-w-[100px] text-right">
                          <span className={due ? "text-amber-400 font-bold" : "text-gray-500"}>
                            {formatPulseDueLabel(word, now)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {filtered.length === 0 && allWords.length > 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            Bu sekmede / filtrede kelime yok.
          </div>
        )}
          </>
        )}

        {/* Floating Action Bar for Selected Words */}
        {selectedWordIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.35)] flex items-center gap-4 font-mono max-w-[90vw] overflow-x-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-bold text-xs sm:text-sm">
                {selectedWordIds.length} Kelime Seçildi
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800 flex-shrink-0" />

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const selectedObjList = allWords.filter((w) => selectedWordIds.includes(w.id));
                  startReview(selectedObjList);
                }}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                ⚡ Seçilenleri Tekrar Et
              </button>

              <button
                type="button"
                onClick={() => setIsGameSelectorOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 animate-pulse"
              >
                🚀 Seçilenleri Oyuna Yolla
              </button>

              <button
                type="button"
                onClick={() => setSelectedWordIds([])}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                title="Seçimi Temizle"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {isGameSelectorOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-950 border border-teal-500/50 rounded-3xl p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_80px_rgba(20,184,166,0.3)] font-mono my-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-bold uppercase tracking-widest mb-1">
                    🔥 ÖZEL LEVEL MODU
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white">
                    OYUN SEÇİMİ (GAME OPTIONS)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Seçtiğiniz <strong className="text-emerald-400">{selectedWordIds.length} kelime</strong> özel seviye olarak hazırlandı. Hangi oyunda oynamak istersiniz?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGameSelectorOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* 7 Arcade Game Cards Grid */}
              <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    {
                      slug: "shooter",
                      title: "Retro Shooter",
                      desc: "Meteordaki kelimeleri vurarak eşle.",
                      icon: "🚀",
                      sub: "SPACE SHOOTER",
                      color: "from-cyan-500 to-blue-600",
                    },
                    {
                      slug: "breakout",
                      title: "Breakout DX-Ball",
                      desc: "Tuğlaları kırarak kelimeleri eşle.",
                      icon: "🧱",
                      sub: "BRICK BREAKER",
                      color: "from-pink-500 to-rose-600",
                    },
                    {
                      slug: "highway",
                      title: "Highway Survivor",
                      desc: "Siber şeritlerde doğru şeride sür.",
                      icon: "🏎️",
                      sub: "LANE RACER",
                      color: "from-amber-500 to-yellow-600",
                    },
                    {
                      slug: "invaders",
                      title: "Siberian Invaders",
                      desc: "Uzay istilacılarını formasyonla vur.",
                      icon: "👾",
                      sub: "NEON SHMUP",
                      color: "from-purple-500 to-indigo-600",
                    },
                    {
                      slug: "wordascent",
                      title: "The Word Ascent",
                      desc: "Platformlarda zıplayarak tırman.",
                      icon: "🧗",
                      sub: "VERTICAL CLIMBER",
                      color: "from-emerald-500 to-teal-600",
                    },
                    {
                      slug: "worddrop",
                      title: "Reverse Word Drop",
                      desc: "Blokları Tetris gibi yerleştir.",
                      icon: "🧩",
                      sub: "DIKEY TETRIS",
                      color: "from-rose-500 to-pink-600",
                    },
                    {
                      slug: "lexicon",
                      title: "Lexicon Tokens",
                      desc: "Tek elle kart çevir: kelime, okunuş, ses, anlam.",
                      icon: "🃏",
                      sub: "TOKEN ARCADE",
                      color: "from-lime-400 to-green-600",
                    },
                    {
                      slug: "hangman",
                      title: "Retro Hangman",
                      desc: "Gizli kelimeyi harf harf tahmin et.",
                      icon: "👤",
                      sub: "WORD GUESSING",
                      color: "from-amber-500 to-orange-650",
                    },
                    {
                      slug: "word-snake",
                      title: "Retro Yılan",
                      desc: "Kelimeleri harf harf yiyerek topla.",
                      icon: "🐍",
                      sub: "RETRO SNAKE",
                      color: "from-emerald-400 to-green-600",
                    },
                    {
                      slug: "quiz",
                      title: "Retro Quiz",
                      desc: "Kelimeleri çoktan seçmeli sorularla patlat.",
                      icon: "🎯",
                      sub: "MEMOLANDUM QUIZ",
                      color: "from-amber-400 to-orange-500",
                    },
                  ].map((g) => (
                    <div
                      key={g.slug}
                      className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-1">
                          <span>{g.sub}</span>
                          <span className="text-xl group-hover:scale-125 transition-transform">{g.icon}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                          {g.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                          {g.desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunchCustomGame(g.slug)}
                        className={`w-full py-2.5 bg-gradient-to-r ${g.color} text-white font-bold rounded-xl text-xs shadow-md transition-all group-hover:opacity-90 flex items-center justify-center gap-1.5`}
                      >
                        <span>HEMEN OYNA</span>
                        <span>➔</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGameSelectorOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Level Created Success Modal */}
        {customLevelCreatedModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-cyan-500/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center font-mono">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-3xl mb-4 animate-bounce">
                🎉
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">
                Kişisel Level Oluşturuldu!
              </h3>
              <p className="text-sm text-cyan-300/90 mb-6">
                <strong>{customLevelCreatedModal.words.length} kelimelik</strong> özel çalışma leveliniz kasanıza kaydedildi. Hemen istediğiniz oyunda oynayabilirsiniz!
              </p>

              <div className="flex flex-col gap-2.5 mb-6">
                <button
                  onClick={() => handleLaunchCustomGame("shooter")}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  🚀 Retro Shooter'da Oyna
                </button>
                <button
                  onClick={() => handleLaunchCustomGame("breakout")}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  🧱 Retro Breakout'ta Oyna
                </button>
                <button
                  onClick={() => handleLaunchCustomGame("highway")}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  🏎️ Retro Highway'de Oyna
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomLevelCreatedModal(null);
                  setSelectedWordIds([]);
                }}
                className="w-full py-2.5 bg-slate-900 border border-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* Kişiselleştirilmiş Hata Defteri Modalı */}
        <WeakWordsModal
          isOpen={weakWordsModalOpen}
          onClose={() => setWeakWordsModalOpen(false)}
        />
      </main>
    </div>
  );
}
