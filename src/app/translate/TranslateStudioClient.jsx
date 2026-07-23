"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import {
  Mic,
  Square,
  Languages,
  Loader2,
  Copy,
  Check,
  BookmarkPlus,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Globe,
  Zap,
  Info,
  BookOpen,
  Tag,
} from "lucide-react";
import {
  TRANSLATE_LANGUAGES,
  translateText,
  translateAudioBlob,
  buildVaultWordFromTranslation,
} from "../../lib/firebase/translateService";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { saveWordToCloud } from "../../lib/firebase/authService";
import { auth } from "../../lib/firebase/config";
import {
  FREE_TRANSLATION_QUOTA,
  GUEST_TRANSLATION_QUOTA,
  freeQuotaForUser,
  remainingFreeTranslations,
} from "../../lib/premium/config";
import {
  fetchCloudTranslationCount,
  incrementCloudTranslationCount,
} from "../../lib/premium/usageService";
import Link from "next/link";

const SILENCE_MS = 3000;
const SPEECH_RMS = 0.02;
const SILENCE_RMS = 0.012;
const LANG_STORAGE_KEY = "memolandum-translate-target";

const TTS_LANG_MAP = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  ru: "ru-RU",
  ko: "ko-KR",
  pt: "pt-BR",
  ar: "ar-SA",
  ja: "ja-JP",
  zh: "zh-CN",
  el: "el-GR",
  it: "it-IT",
  osm: "tr-TR",
};

export default function TranslateStudioClient() {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && TRANSLATE_LANGUAGES.some((l) => l.code === saved)) {
        setTargetLang(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const [translation, setTranslation] = useState("");
  const [sourceHint, setSourceHint] = useState("");
  const [tone, setTone] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [nuances, setNuances] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vaultState, setVaultState] = useState("idle"); // idle | saving | saved | exists
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { addLearnedWords, vocabularyVault } = useMemolandumStore();
  const isPremium = useMemolandumStore((state) => state.isPremium);
  const isAuthenticated = useMemolandumStore((state) => state.isAuthenticated);
  const uid = useMemolandumStore((state) => state.uid);
  const translationCount = useMemolandumStore((state) => state.translationCount) || 0;
  const incrementTranslationCount = useMemolandumStore((state) => state.incrementTranslationCount);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const rafRef = useRef(null);
  const hasSpeechRef = useRef(false);
  const stopRecordingRef = useRef(() => {});

  const isPremiumRef = useRef(isPremium);
  const translationCountRef = useRef(translationCount);
  const isAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    isPremiumRef.current = isPremium;
    translationCountRef.current = translationCount;
    isAuthRef.current = isAuthenticated;
  }, [isPremium, translationCount, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        audioCtxRef.current?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (!uid || !isAuthenticated) return undefined;
    let cancelled = false;
    (async () => {
      const cloud = await fetchCloudTranslationCount(uid);
      if (cancelled || cloud == null) return;
      useMemolandumStore.setState({ translationCount: cloud });
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, isAuthenticated]);

  const handleTargetChange = (code) => {
    setTargetLang(code);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  };

  const consumeQuota = useCallback(async () => {
    incrementTranslationCount();
    if (uid && isAuthRef.current) {
      const next = await incrementCloudTranslationCount(uid);
      if (typeof next === "number") {
        useMemolandumStore.setState({ translationCount: next });
      }
    }
  }, [incrementTranslationCount, uid]);

  const checkFreeQuota = useCallback(() => {
    if (isPremiumRef.current) return true;
    const max = freeQuotaForUser(isAuthRef.current);
    if (translationCountRef.current >= max) {
      setStatus("error");
      setError(
        isAuthRef.current
          ? `Ücretsiz ${FREE_TRANSLATION_QUOTA} AI çeviri hakkınız doldu. Oyunlar ve seviyeler ücretsizdir — sınırsız çeviri için Premium'a geçin.`
          : `Misafir hakkınız (${GUEST_TRANSLATION_QUOTA}) doldu. Üye olarak +${FREE_TRANSLATION_QUOTA} hak kazanın veya Premium'a bakın.`
      );
      return false;
    }
    return true;
  }, []);

  const runTranslation = useCallback(
    async (rawText) => {
      const trimmed = rawText.trim();
      if (!trimmed) {
        setTranslation("");
        setSourceHint("");
        setTone("");
        setContextNotes("");
        setNuances([]);
        setStatus("idle");
        setError("");
        setVaultState("idle");
        return;
      }
      if (!targetLang) {
        setStatus("error");
        setError("Önce hedef dili seçin.");
        return;
      }

      if (!checkFreeQuota()) return;

      setStatus("loading");
      setError("");
      setVaultState("idle");

      try {
        const res = await translateText(trimmed, targetLang);
        setTranslation(res.translation || "");
        setSourceHint(res.sourceLang ? String(res.sourceLang).toUpperCase() : "");
        setTone(res.tone || "");
        setContextNotes(res.contextNotes || "");
        setNuances(res.nuances || []);
        setStatus("idle");
        await consumeQuota();
      } catch (err) {
        setStatus("error");
        setError(err?.message || "Çeviri sırasında bir hata oluştu.");
      }
    },
    [targetLang, checkFreeQuota, consumeQuota]
  );

  const clearSilenceMonitor = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    hasSpeechRef.current = false;
    try {
      audioCtxRef.current?.close();
    } catch {
      /* ignore */
    }
    audioCtxRef.current = null;
  }, []);

  const startSilenceMonitor = useCallback(
    (stream) => {
      clearSilenceMonitor();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        const data = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          if (rms >= SPEECH_RMS) {
            hasSpeechRef.current = true;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else if (hasSpeechRef.current && rms < SILENCE_RMS) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                silenceTimerRef.current = null;
                stopRecordingRef.current();
              }, SILENCE_MS);
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.warn("Silence monitor skipped:", err?.message || err);
      }
    },
    [clearSilenceMonitor]
  );

  const stopRecording = useCallback(() => {
    clearSilenceMonitor();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  }, [clearSilenceMonitor]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    if (!targetLang) {
      setStatus("error");
      setError("Önce hedef dili seçin.");
      return;
    }
    if (!checkFreeQuota()) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        clearSilenceMonitor();
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        setStatus("loading");
        setError("");
        try {
          const res = await translateAudioBlob(audioBlob, targetLang);
          if (res.transcript) setText(res.transcript);
          setTranslation(res.translation || "");
          setSourceHint(res.sourceLang ? String(res.sourceLang).toUpperCase() : "");
          setTone(res.tone || "");
          setContextNotes(res.contextNotes || "");
          setNuances(res.nuances || []);
          setStatus("idle");
          await consumeQuota();
        } catch (err) {
          setStatus("error");
          setError(err?.message || "Sesli çeviri alınamadı.");
        }
      };

      recorder.start();
      setIsRecording(true);
      setError("");
      setStatus("idle");
      startSilenceMonitor(stream);
    } catch {
      setStatus("error");
      setError("Mikrofon erişimi reddedildi veya desteklenmiyor.");
    }
  }, [targetLang, checkFreeQuota, consumeQuota, clearSilenceMonitor, startSilenceMonitor]);

  const handleTranslateClick = () => {
    if (status === "loading") return;
    if (isRecording) {
      stopRecording();
      return;
    }
    runTranslation(text);
  };

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (speechText, langCode) => {
    if (!speechText || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    const mapped = TTS_LANG_MAP[langCode] || "en-US";
    utterance.lang = mapped;
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAddToVault = async () => {
    if (!text.trim() || !translation.trim()) return;
    const item = buildVaultWordFromTranslation({
      sourceText: text.trim(),
      translation: translation.trim(),
      targetLang,
      sourceLang: sourceHint,
      contextNotes,
    });
    if (!item) return;

    if (vocabularyVault && vocabularyVault[item.id]) {
      setVaultState("exists");
      setTimeout(() => setVaultState("idle"), 2500);
      return;
    }

    setVaultState("saving");
    addLearnedWords([item], item.language);

    const currentUid = uid || auth.currentUser?.uid;
    if (currentUid) {
      await saveWordToCloud(currentUid, item.id, item);
    }

    setVaultState("saved");
    setTimeout(() => setVaultState("idle"), 2500);
  };

  const leftQuota = remainingFreeTranslations(translationCount, isAuthenticated);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-gray-100 flex flex-col" suppressHydrationWarning={true}>
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Üst Başlık & KOTA Bilgisi Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.08)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent m-0">
                  Derin Bağlam AI Çeviri Stüdyosu
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 m-0">
                Gelişmiş Google AI zekası ile kültür, duygu ve deyimsel bağlamı anında algılayan çeviri stüdyosu.
              </p>
            </div>
          </div>

          {/* Quota Badge */}
          <div className="shrink-0">
            {!mounted ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                ⚡ AI Çeviri Stüdyosu
              </span>
            ) : isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Sparkles className="w-3.5 h-3.5" /> PREMIUM AKTİF (Sınırsız Zekâ)
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  ⚡ Kalan Hak: <strong className="text-white">{leftQuota}</strong> / {freeQuotaForUser(isAuthenticated)}
                </span>
                <Link
                  href="/premium/"
                  className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 no-underline hover:opacity-90 transition-opacity"
                >
                  Premiuma Geç →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Hedef Dil Seçici Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Globe className="w-4 h-4 text-cyan-400" /> Hedef Dil Seçin:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleTargetChange("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                targetLang === ""
                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Otomatik (Türkçe / İngilizce)
            </button>
            {TRANSLATE_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleTargetChange(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  targetLang === l.code
                    ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hata Mesajı Barı */}
        {status === "error" && error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
            <span>{error}</span>
            {!isPremium && (
              <Link href="/premium/" className="px-3 py-1 bg-red-500 text-white font-extrabold text-xs rounded-lg no-underline hover:bg-red-600">
                Yükselt
              </Link>
            )}
          </div>
        )}

        {/* İkili Yan Yana Çeviri Çerçevesi (Dual Studio Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sol: Girdi Metin Alanı */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl focus-within:border-cyan-500/50 transition-colors relative min-h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                {sourceHint ? `Algılanan Dil: ${sourceHint}` : "Kaynak Metin / Ses"}
              </span>
              {text.trim() && (
                <button
                  onClick={() => {
                    setText("");
                    setTranslation("");
                    setTone("");
                    setContextNotes("");
                    setNuances([]);
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Temizle
                </button>
              )}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleTranslateClick();
                }
              }}
              placeholder="Metin yazın veya mikrofona konuşun (Deyimler, argolar, resmî ve duygusal ifadeler derin bağlamla çözülür)…"
              className="w-full flex-1 bg-transparent border-none text-slate-100 placeholder-slate-600 text-sm sm:text-base resize-none focus:outline-none leading-relaxed"
            />

            {/* Sol Alt Aksiyonlar (Mikrofon & Dinle & Çevir) */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-2">
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Kaydı Durdur
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    title="Sesli Konuş (STT)"
                    className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:scale-105 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
                {text.trim() && !isRecording && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(text, "en")}
                    title="Kaynak Metni Dinle"
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
                {isRecording && (
                  <span className="text-[11px] text-cyan-400/80 font-semibold animate-pulse">
                    Dinleniyor (3 sn sessizlik = otomatik çevir)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-600">
                  {text.length} karakter
                </span>
                <button
                  type="button"
                  onClick={handleTranslateClick}
                  disabled={status === "loading" || (!isRecording && !text.trim())}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Çevir
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Çıktı Çeviri Alanı */}
          <div className="flex flex-col bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-4 shadow-xl relative min-h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  {targetLang ? TRANSLATE_LANGUAGES.find((l) => l.code === targetLang)?.name : "Derin Bağlamsal AI Çeviri"}
                </span>
                {tone && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Ton: {tone}
                  </span>
                )}
              </div>

              {status === "loading" && (
                <span className="text-xs text-cyan-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gemini Bağlamı Çözümlüyor...
                </span>
              )}
            </div>

            <div className="flex-1 text-slate-100 text-sm sm:text-base leading-relaxed overflow-y-auto">
              {translation ? (
                <div className="font-semibold text-cyan-100 text-lg leading-relaxed">{translation}</div>
              ) : status === "loading" ? (
                <div className="text-slate-600 italic">Gemini 2.5 Flash derin anlamı ve kültürel tonu analiz ediyor...</div>
              ) : (
                <div className="text-slate-600 italic">Çeviri ve derin bağlam analizi burada görüntülenecek...</div>
              )}
            </div>

            {/* Sağ Alt Aksiyonlar (Kopyala, Dinle, Kasaya Ekle) */}
            {translation && (
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSpeak(translation, targetLang || "tr")}
                    title="Çeviriyi Dinle (TTS)"
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Volume2 className="w-4 h-4" /> Dinle
                  </button>

                  <button
                    onClick={handleCopy}
                    title="Kopyala"
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>

                {/* Single-Click Kasama Ekle Button */}
                <button
                  onClick={handleAddToVault}
                  disabled={vaultState === "saving" || vaultState === "saved" || vaultState === "exists"}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg ${
                    vaultState === "saved"
                      ? "bg-emerald-500 text-slate-950 border border-emerald-400"
                      : vaultState === "exists"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:scale-105 active:scale-95 shadow-cyan-500/25"
                  }`}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  {vaultState === "saving"
                    ? "Ekleniyor..."
                    : vaultState === "saved"
                    ? "Kasaya Eklendi ✓"
                    : vaultState === "exists"
                    ? "Zaten Kasanızda"
                    : "Kasama Ekle"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Derin Bağlam & İpucu Kutusu (Context Notes & Nuances Card) */}
        {(contextNotes || (nuances && nuances.length > 0)) && (
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-[0_0_25px_rgba(99,102,241,0.1)] flex flex-col gap-4 animate-in fade-in duration-300">
            {contextNotes && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 m-0 flex items-center gap-1.5">
                    💡 Derin Bağlam & Kültürel İpucu
                  </h4>
                  <p className="text-sm text-slate-300 mt-1 m-0 leading-relaxed font-medium">
                    {contextNotes}
                  </p>
                </div>
              </div>
            )}

            {nuances && nuances.length > 0 && (
              <div className="border-t border-slate-800/80 pt-3">
                <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 m-0">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Önemli İfadeler & Nüanslar:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {nuances.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300">{item.phrase}</span>
                        <span className="text-[11px] font-semibold text-slate-400">{item.meaning}</span>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-slate-500 m-0 italic">{item.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alt Kısım Hızlı Yönlendirme Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Link
            href="/vocabulary"
            className="no-underline group bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors m-0">
                  Kelime Kasası
                </h4>
                <p className="text-xs text-slate-500 m-0">Kaydettiğiniz tüm kelimeleri tekrar edin ve güçlendirin.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/"
            className="no-underline group bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🕹️</span>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors m-0">
                  Arcade Oyunlar
                </h4>
                <p className="text-xs text-slate-500 m-0">Kelimeleri eğlenceli 6 farklı mini oyunla ezberleyin.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </main>
    </div>
  );
}
