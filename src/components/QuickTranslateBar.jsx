"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Volume2,
  Copy,
  Check,
  Loader2,
  Sparkles,
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
  const isTranslatingRef = useRef(false);

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
      if (isTranslatingRef.current) return;
      if (!checkFreeQuota()) return;

      isTranslatingRef.current = true;
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
      } finally {
        isTranslatingRef.current = false;
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
        if (ctx.state === "suspended") {
          ctx.resume();
        }
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
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        if (isTranslatingRef.current) return;
        isTranslatingRef.current = true;
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
        } finally {
          isTranslatingRef.current = false;
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
    utterance.lang = TTS_LANG_MAP[targetLang] || "en-US";
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
    <div className="mm-qtb">
      <div className="mm-qtb__inner">
        <div className="mm-qtb__row">
          <div className="mm-qtb__label">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Gemini Hızlı Çeviri</span>
            <select
              value={targetLang}
              onChange={handleTargetChange}
              className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
              aria-label="Hedef dil"
            >
              {TRANSLATE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mm-qtb__field">
            <input
              type="text"
              name="mm-quick-translate"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setError("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runTranslation(inputText);
                }
              }}
              placeholder="Kelime veya cümle yazın..."
              className="mm-qtb__input placeholder-slate-500"
              style={{ pointerEvents: "auto", minWidth: 0, flex: 1 }}
            />

            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="p-1 rounded bg-red-500/20 text-red-400 animate-pulse shrink-0"
                aria-label="Kaydı durdur"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                aria-label="Sesli çeviri"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => runTranslation(inputText)}
              disabled={status === "loading" || !inputText.trim()}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 transition-colors disabled:opacity-40 shrink-0"
            >
              {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Çevir"}
            </button>
          </div>

          {translation ? (
            <div className="mm-qtb__result">
              <span className="mm-qtb__result-text" title={translation}>
                {translation}
              </span>
              <button
                type="button"
                onClick={() => handleSpeak(translation)}
                className="text-slate-400 hover:text-cyan-400 shrink-0"
                aria-label="Sesli oku"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-400 hover:text-cyan-400 shrink-0"
                aria-label="Kopyala"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleAddToVault}
                className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] hover:bg-cyan-500/30 shrink-0"
              >
                {vaultState === "saved"
                  ? "Eklendi"
                  : vaultState === "exists"
                    ? "Var"
                    : "+ Kasa"}
              </button>
            </div>
          ) : null}
        </div>

        {status === "error" && error && (
          <div className="text-xs text-red-400 font-semibold bg-red-950/40 border border-red-500/20 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 min-w-0">
            <span className="min-w-0 break-words">⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300 font-bold px-1 cursor-pointer shrink-0"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
