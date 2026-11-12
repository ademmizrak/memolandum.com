"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { isUserAddedWord } from "../../lib/learning/memolandumPulse";
import { auth } from "../../lib/firebase/config";
import { saveWordToCloud } from "../../lib/firebase/authService";

const MIN_PLAY = 6;

const GAME_OPTIONS = [
  { slug: "lexicon", title: "Lexicon Tokens", color: "from-lime-400 to-green-600" },
  { slug: "quiz", title: "Retro Quiz", color: "from-amber-400 to-orange-500" },
  { slug: "shooter", title: "Retro Shooter", color: "from-cyan-500 to-blue-600" },
  { slug: "breakout", title: "Breakout DX-Ball", color: "from-pink-500 to-rose-600" },
  { slug: "highway", title: "Highway Survivor", color: "from-amber-500 to-yellow-600" },
  { slug: "invaders", title: "Siberian Invaders", color: "from-purple-500 to-indigo-600" },
  { slug: "wordascent", title: "The Word Ascent", color: "from-emerald-500 to-teal-600" },
  { slug: "worddrop", title: "Reverse Word Drop", color: "from-rose-500 to-pink-600" },
  { slug: "hangman", title: "Retro Hangman", color: "from-amber-500 to-orange-600" },
  { slug: "word-snake", title: "Retro Yılan", color: "from-emerald-400 to-green-600" },
];

function slugify(v) {
  return (
    String(v || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "word"
  );
}

function parseBulkLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[|=;]\s*|\s+[-–—]\s+/);
      if (parts.length >= 2) {
        return { word: parts[0].trim(), meaning: parts.slice(1).join(" - ").trim() };
      }
      const tab = line.split("\t");
      if (tab.length >= 2) return { word: tab[0].trim(), meaning: tab[1].trim() };
      return null;
    })
    .filter((x) => x && x.word && x.meaning);
}

export default function MyLexiconClient() {
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault);
  const addLearnedWords = useMemolandumStore((s) => s.addLearnedWords);
  const setActiveCustomWords = useMemolandumStore((s) => s.setActiveCustomWords);
  const uid = useMemolandumStore((s) => s.uid);

  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [romanized, setRomanized] = useState("");
  const [note, setNote] = useState("");
  const [bulk, setBulk] = useState("");
  const [status, setStatus] = useState("");
  const [gameOpen, setGameOpen] = useState(false);

  const manualWords = useMemo(() => {
    return Object.values(vocabularyVault || {})
      .filter(isUserAddedWord)
      .filter((w) => w.origin === "manual" || (typeof w.id === "string" && w.id.startsWith("manual_")))
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  }, [vocabularyVault]);

  const buildEntry = (w, m, r = "", n = "") => {
    const english = String(w || "").trim();
    const turkish = String(m || "").trim();
    if (!english || !turkish) return null;
    const id = `manual_${slugify(english)}_${slugify(turkish)}`.slice(0, 120);
    return {
      id,
      english,
      turkish,
      romanized: String(r || "").trim(),
      note: String(n || "").trim(),
      audioUrl: "",
      language: "manual",
      origin: "manual",
    };
  };

  const persistEntries = async (entries) => {
    if (!entries.length) return 0;
    addLearnedWords(entries, "manual");
    const currentUid = uid || auth?.currentUser?.uid;
    if (currentUid) {
      await Promise.all(entries.map((item) => saveWordToCloud(currentUid, item.id, item)));
    }
    return entries.length;
  };

  const handleAddOne = async (e) => {
    e?.preventDefault?.();
    const entry = buildEntry(word, meaning, romanized, note);
    if (!entry) {
      setStatus("Kelime ve anlam gerekli.");
      return;
    }
    if (vocabularyVault?.[entry.id]) {
      setStatus("Bu kelime zaten kasada.");
      return;
    }
    await persistEntries([entry]);
    setWord("");
    setMeaning("");
    setRomanized("");
    setNote("");
    setStatus("Kasaya eklendi — tüm oyunlarda kullanılabilir.");
  };

  const handleBulk = async () => {
    const rows = parseBulkLines(bulk);
    if (!rows.length) {
      setStatus("Satır formatı: kelime = anlam (veya kelime | anlam)");
      return;
    }
    const entries = rows
      .map((r) => buildEntry(r.word, r.meaning))
      .filter(Boolean)
      .filter((item) => !vocabularyVault?.[item.id]);
    if (!entries.length) {
      setStatus("Yeni eklenecek satır yok (hepsi zaten kasada olabilir).");
      return;
    }
    await persistEntries(entries);
    setBulk("");
    setStatus(`${entries.length} kelime kasaya eklendi.`);
  };

  const launchGame = (slug) => {
    const playable = manualWords.map((w) => ({
      id: w.id,
      english: w.english,
      turkish: w.turkish,
      romanized: w.romanized || "",
      audioUrl: w.audioUrl || "",
      language: w.language || "manual",
      origin: w.origin || "manual",
    }));
    if (playable.length < MIN_PLAY) {
      setStatus(`Oyuna gitmek için en az ${MIN_PLAY} kelime ekleyin (şimdi ${playable.length}).`);
      return;
    }
    setActiveCustomWords(playable);
    window.location.href = `/games/${slug}/`;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-5 py-8 sm:py-12">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-lime-500/80 m-0 mb-2">
          My Lexicon · Manual vault
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white m-0 mb-2 tracking-tight">
          Kendi kelimelerini ekle
        </h1>
        <p className="text-slate-400 leading-relaxed m-0 mb-6 max-w-xl">
          Akademik veya kişisel listenizi yazın. Kayıtlar{" "}
          <strong className="text-lime-300/90">Senin eklediklerin</strong> sekmesine düşer ve{" "}
          <strong className="text-cyan-300/90">tüm arcade kabuklarında</strong> özel seviye olarak
          oynanabilir.
        </p>

        <form
          onSubmit={handleAddOne}
          className="rounded-2xl border border-lime-400/30 bg-gradient-to-b from-lime-950/30 to-slate-950/80 p-5 sm:p-6 mb-6"
        >
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-[11px] font-mono text-lime-400/80 uppercase tracking-wider">
                Kelime / ifade
              </span>
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="örn. photosynthesis"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none focus:border-lime-400/50"
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-mono text-lime-400/80 uppercase tracking-wider">
                Anlam
              </span>
              <input
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="örn. fotosentez"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none focus:border-lime-400/50"
                required
              />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <label className="block">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Okunuş (opsiyonel)
              </span>
              <input
                value={romanized}
                onChange={(e) => setRomanized(e.target.value)}
                placeholder="örn. foto-sin-te-sis"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-lime-400/40"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Not (opsiyonel)
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ders / konu etiketi"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-lime-400/40"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto min-h-12 px-6 rounded-xl font-black text-sm bg-lime-400 text-slate-950 hover:bg-lime-300 active:scale-[0.99] transition"
          >
            Kasaya ekle
          </button>
        </form>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
          <h2 className="text-sm font-bold text-white m-0 mb-1">Toplu ekle</h2>
          <p className="text-xs text-slate-500 m-0 mb-3">
            Her satır: <code className="text-lime-400/80">kelime = anlam</code> veya{" "}
            <code className="text-lime-400/80">kelime | anlam</code>
          </p>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={5}
            placeholder={"mitochondria = mitokondri\nneuron | nöron"}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-lime-400/40 mb-3 font-mono"
          />
          <button
            type="button"
            onClick={handleBulk}
            className="min-h-11 px-5 rounded-xl font-bold text-sm border border-lime-400/40 text-lime-300 hover:bg-lime-500/10"
          >
            Toplu kaydet
          </button>
        </section>

        {status ? (
          <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 mb-5">
            {status}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={() => setGameOpen(true)}
            disabled={manualWords.length < MIN_PLAY}
            className="min-h-12 px-5 rounded-xl font-black text-sm bg-gradient-to-r from-lime-400 to-cyan-400 text-slate-950 disabled:opacity-40"
          >
            Tüm oyunlarda çalış ({manualWords.length})
          </button>
          <Link
            href="/vocabulary/"
            className="inline-flex items-center min-h-12 px-5 rounded-xl font-bold text-sm border border-white/15 text-slate-200 hover:border-cyan-400/40"
          >
            Kelime Kasası →
          </Link>
        </div>

        <section>
          <h2 className="text-base font-bold text-white m-0 mb-3">
            Elle eklediklerin ({manualWords.length})
          </h2>
          {manualWords.length === 0 ? (
            <p className="text-slate-500 text-sm">Henüz manuel kelime yok. Yukarıdan ekleyin.</p>
          ) : (
            <ul className="m-0 p-0 list-none space-y-2">
              {manualWords.slice(0, 40).map((w) => (
                <li
                  key={w.id}
                  className="rounded-xl border border-white/8 bg-slate-950/70 px-3 py-2.5 flex justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-white">{w.english}</div>
                    <div className="text-sm text-lime-300/90">{w.turkish}</div>
                    {w.romanized ? (
                      <div className="text-[11px] font-mono text-cyan-400/80">[{w.romanized}]</div>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 shrink-0">MANUAL</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>Hesap ve kişisel veri yönetimi:</span>
          <div className="flex items-center gap-4">
            <Link href="/profile/#delete-account" className="text-red-400/80 hover:text-red-300 underline">
              Hesabımı ve Verilerimi Sil (Profil)
            </Link>
            <Link href="/delete-account/" className="text-slate-400 hover:text-cyan-400 underline">
              Veri Silme Sayfası
            </Link>
          </div>
        </section>
      </main>

      {gameOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-950 border border-lime-500/40 rounded-3xl p-5 sm:p-6 max-w-3xl w-full my-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-black text-white m-0">Oyun seç</h3>
                <p className="text-xs text-slate-400 mt-1 mb-0">
                  {manualWords.length} kelimelik özel listen tüm kabuklarda açılır.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGameOpen(false)}
                className="text-slate-400 hover:text-white px-2"
              >
                ✕
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => launchGame(g.slug)}
                  className={`w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${g.color}`}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
