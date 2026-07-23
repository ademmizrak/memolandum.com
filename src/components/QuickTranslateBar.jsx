"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Volume2,
  Copy,
  Check,
  BookmarkPlus,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  TRANSLATE_LANGUAGES,
  translateText,
  translateAudioBlob,
  buildVaultWordFromTranslation,
} from "../lib/firebase/translateService";
import { useMemolandumStore } from "../store/useMemolandumStore";
import { saveWordToCloud } from "../lib/firebase/authService";
import { auth } from "../lib/firebase/config";
import {
  FREE_TRANSLATION_QUOTA,
  GUEST_TRANSLATION_QUOTA,
  freeQuotaForUser,
} from "../lib/premium/config";
import { incrementCloudTranslationCount } from "../lib/premium/usageService";

const SILENCE_MS = 3000;
const SPEECH_RMS = 0.02;
const SILENCE_RMS = 0.012;
const LANG_STORAGE_KEY = "memolandum-translate-target";

export default function QuickTranslateBar({ onOpenPremium } = {}) {
  const [mounted, setMounted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [targetLang, setTargetLang] = useState("tr");
  const [translation, setTranslation] = useState("");
  const [sourceHint, setSourceHint] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vaultState, setVaultState] = useState("idle");

  const { addLearnedWords, vocabularyVault } = useMemolandumStore();
  const isPremium = useMemolandumStore((s) => s.isPremium);
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const uid = useMemolandumStore((s) => s.uid);
  const translationCount = useMemolandumStore((s) => s.translationCount) || 0;
  const incrementTranslationCount = useMemolandumStore((s) => s.incrementTranslationCount);

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

  const handleTargetChange = (e) => {
    const v = e.target.value;
    setTargetLang(v);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, v);
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
          ? `Ücretsiz ${FREE_TRANSLATION_QUOTA} AI çeviri hakkınız doldu.`
          : `Misafir hakkınız (${GUEST_TRANSLATION_QUOTA}) doldu.`
      );
      if (typeof onOpenPremium === "function") onOpenPremium();
      return false;
    }
    return true;
  }, [onOpenPremium]);

  const runTranslation = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setTranslation("");
        setSourceHint("");
        setContextNotes("");
        setStatus("idle");
        setError("");
        setVaultState("idle");
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
        setContextNotes(res.contextNotes || "");
        setStatus("idle");
        await consumeQuota();
      } catch (err) {
        setStatus("error");
        setError(err?.message || "Çeviri başarısız.");
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
        console.warn("Silence monitor error:", err?.message || err);
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
          if (res.transcript) setInputText(res.transcript);
          setTranslation(res.translation || "");
          setSourceHint(res.sourceLang ? String(res.sourceLang).toUpperCase() : "");
          setContextNotes(res.contextNotes || "");
          setStatus("idle");
          await consumeQuota();
        } catch (err) {
          setStatus("error");
          setError(err?.message || "Sesli çeviri başarısız.");
        }
      };

      recorder.start();
      setIsRecording(true);
      setError("");
      setStatus("idle");
      startSilenceMonitor(stream);
    } catch {
      setStatus("error");
      setError("Mikrofon izni alınamadı.");
    }
  }, [targetLang, checkFreeQuota, consumeQuota, clearSilenceMonitor, startSilenceMonitor]);

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (textToSpeak) => {
    if (!textToSpeak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleAddToVault = async () => {
    if (!inputText.trim() || !translation.trim()) return;
    const item = buildVaultWordFromTranslation({
      sourceText: inputText.trim(),
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

    const currentUid = uid || auth?.currentUser?.uid;
    if (currentUid) {
      await saveWordToCloud(currentUid, item.id, item);
    }

    setVaultState("saved");
    setTimeout(() => setVaultState("idle"), 2500);
  };

  if (!mounted) return null;

  return (
    <div className="bg-slate-900/90 border-y border-cyan-500/20 py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5" /> Gemini Hızlı Çeviri:
          </div>
          <select
            value={targetLang}
            onChange={handleTargetChange}
            className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
          >
            {TRANSLATE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-cyan-500/50">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runTranslation(inputText);
              }
            }}
            placeholder="Kelime veya cümle yazın..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-1 rounded bg-red-500/20 text-red-400 animate-pulse text-[10px] font-bold"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => runTranslation(inputText)}
            disabled={status === "loading" || !inputText.trim()}
            className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 transition-colors disabled:opacity-40"
          >
            {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Çevir"}
          </button>
        </div>

        {translation && (
          <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-cyan-200">
            <span className="font-bold">{translation}</span>
            <button onClick={() => handleSpeak(translation)} className="text-slate-400 hover:text-cyan-400">
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCopy} className="text-slate-400 hover:text-cyan-400">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleAddToVault}
              className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] hover:bg-cyan-500/30"
            >
              {vaultState === "saved" ? "Eklendi" : "+ Kasa"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
