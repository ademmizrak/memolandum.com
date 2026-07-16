"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  X,
  CreditCard,
  Sparkles,
  CheckCircle2,
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
import { useT } from "../lib/i18n/LocaleProvider";
import { assertAllowed, commitAbuse, AbuseError } from "../lib/security";

const DEBOUNCE_MS = 650;
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
};

export default function QuickTranslateBar() {
  const t = useT();
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && TRANSLATE_LANGUAGES.some((l) => l.code === saved)) return saved;
    } catch {
      /* ignore */
    }
    return "";
  });
  const [translation, setTranslation] = useState("");
  const [sourceHint, setSourceHint] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vaultState, setVaultState] = useState("idle"); // idle | saving | saved | exists
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { addLearnedWords, vocabularyVault } = useMemolandumStore();
  const isPremium = useMemolandumStore((state) => state.isPremium);
  const translationCount = useMemolandumStore((state) => state.translationCount) || 0;
  const incrementTranslationCount = useMemolandumStore((state) => state.incrementTranslationCount);
  const setPremium = useMemolandumStore((state) => state.setPremium);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [checkoutProvider, setCheckoutProvider] = useState(null); // null | 'stripe' | 'iyzico'
  const [paymentStep, setPaymentStep] = useState('select'); // select | form | processing | success
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const isPremiumRef = useRef(isPremium);
  const translationCountRef = useRef(translationCount);

  useEffect(() => {
    isPremiumRef.current = isPremium;
    translationCountRef.current = translationCount;
  }, [isPremium, translationCount]);

  const handleStartPayment = (provider) => {
    setCheckoutProvider(provider);
    setPaymentStep('form');
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      setPremium(true);
    }, 2200);
  };

  const handleCloseModal = () => {
    setShowPremiumModal(false);
    setCheckoutProvider(null);
    setPaymentStep('select');
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
  };

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    stopSpeaking();
  }, [translation, targetLang, stopSpeaking]);

  const runTranslate = useCallback(async (value, lang) => {
    const trimmed = (value || "").trim();
    if (!trimmed || !lang) return;

    if (!isPremiumRef.current && translationCountRef.current >= 10) {
      setShowPremiumModal(true);
      setStatus("error");
      setError("AI Çeviri limitine ulaştınız. Devam etmek için Premium'a yükseltin!");
      return;
    }

    const reqId = ++requestIdRef.current;
    setStatus("loading");
    setError("");

    try {
      const result = await translateText(trimmed, lang);
      if (reqId !== requestIdRef.current) return;

      incrementTranslationCount();

      setTranslation(result.translation);
      setSourceHint(result.sourceLang || "");
      setVaultState("idle");
      setStatus("idle");
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      console.error("Translate error:", err);
      setStatus("error");
      setError(humanizeAiError(err));
      setTranslation("");
      setVaultState("idle");
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (!trimmed || !targetLang) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      runTranslate(trimmed, targetLang);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, targetLang, runTranslate]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!targetLang) {
      setStatus("error");
      setError("Önce hedef dili seçin.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("Tarayıcınız ses kaydını desteklemiyor.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];

        if (!isPremiumRef.current && translationCountRef.current >= 10) {
          setShowPremiumModal(true);
          setStatus("error");
          setError("Sesli AI Çeviri limitine ulaştınız. Devam etmek için Premium'a yükseltin!");
          return;
        }

        const reqId = ++requestIdRef.current;
        setStatus("loading");
        setError("");

        try {
          const result = await translateAudioBlob(blob, targetLang);
          if (reqId !== requestIdRef.current) return;

          incrementTranslationCount();

          if (result.transcript) setText(result.transcript);
          setTranslation(result.translation || "");
          setSourceHint(result.sourceLang || "");
          setVaultState("idle");
          setStatus("idle");
        } catch (err) {
          if (reqId !== requestIdRef.current) return;
          console.error("Voice translate error:", err);
          setStatus("error");
          setError(humanizeAiError(err));
          setVaultState("idle");
        }
      };

      recorder.start();
      setIsRecording(true);
      setError("");
      setStatus("idle");
    } catch (err) {
      console.error("Mic error:", err);
      setStatus("error");
      setError("Mikrofon izni gerekli. Lütfen izin verip tekrar deneyin.");
    }
  }, [targetLang]);

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleCopy = async () => {
    if (!translation) return;
    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleSpeak = () => {
    if (!translation.trim()) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setStatus("error");
      setError("Tarayıcınız sesli okumayı desteklemiyor.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = TTS_LANG_MAP[targetLang] || "en-US";
    utterance.rate = 0.95;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices?.() || [];
      return (
        voices.find((v) => v.lang === utterance.lang) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith((targetLang || "en").toLowerCase())) ||
        null
      );
    };

    const match = pickVoice();
    if (match) utterance.voice = match;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);

    // iOS Safari: cancel sonrası hemen speak bazen sessiz kalır; kısa gecikme + resume
    const start = () => {
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
    };

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setTimeout(start, 50);
    } else {
      start();
    }
  };

  const handleSaveToVault = async () => {
    if (!text.trim() || !translation.trim() || !targetLang) return;
    if (vaultState === "saving" || vaultState === "saved") return;

    try {
      const isAuthenticated = !!auth.currentUser;
      const ticket = assertAllowed({
        action: "vault_add",
        text: `${text} ${translation}`,
        isAuthenticated,
        uid: auth.currentUser?.uid || null,
      });

      const word = buildVaultWordFromTranslation({
        sourceText: text,
        translation,
        targetLang,
        sourceLang: sourceHint,
      });

      if (vocabularyVault?.[word.id]) {
        setVaultState("exists");
        return;
      }

      setVaultState("saving");
      addLearnedWords([word], word.language);

      const uid = auth.currentUser?.uid;
      if (uid) {
        await saveWordToCloud(uid, word.id, word);
      }

      commitAbuse(ticket);
      setVaultState("saved");
    } catch (err) {
      console.error("Vault save error:", err);
      setVaultState("idle");
      setStatus("error");
      setError(
        err instanceof AbuseError
          ? err.message
          : err?.message || "Kasaya eklenemedi."
      );
    }
  };

  return (
    <div className="quick-translate-bar" role="region" aria-label={t("translate.region")}>
      <div className="qt-inner">
        <div className="qt-row qt-row-primary">
          <div className="qt-label" title="Google Gemini ile anlık çeviri">
            <Languages size={15} strokeWidth={2.2} />
            <span className="qt-label-text">{t("translate.label")}</span>
            <span className="premium-badge ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
              {isPremium ? "⭐ PREMIUM" : `${Math.max(0, 10 - translationCount)}/10 FREE`}
            </span>
          </div>

          <button
            type="button"
            className={`qt-mic${isRecording ? " recording" : ""}`}
            onClick={handleMicClick}
            aria-label={isRecording ? t("translate.micStop") : t("translate.micStart")}
            title={isRecording ? t("translate.micStop") : t("translate.micStart")}
          >
            {isRecording ? <Square size={14} /> : <Mic size={15} />}
          </button>

          <input
            type="text"
            className="qt-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setVaultState("idle");
            }}
            placeholder={t("translate.placeholder")}
            aria-label="Çevrilecek metin"
            maxLength={280}
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <select
            className="qt-select"
            value={targetLang}
            onChange={(e) => {
              const code = e.target.value;
              setTargetLang(code);
              setVaultState("idle");
              try {
                localStorage.setItem(LANG_STORAGE_KEY, code);
              } catch {
                /* ignore */
              }
            }}
            aria-label="Hedef dil"
          >
            <option value="" disabled>
              Dil?
            </option>
            {TRANSLATE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="qt-row qt-row-result">
          <div className="qt-result" aria-live="polite">
            {status === "loading" ? (
              <span className="qt-loading">
                <Loader2 size={14} className="qt-spin" />
                {isRecording ? t("translate.listening") : t("translate.translating")}
              </span>
            ) : error ? (
              <span className="qt-error">{error}</span>
            ) : translation ? (
              <>
                <p
                  className="qt-translation"
                  title={sourceHint ? `Kaynak: ${sourceHint}` : undefined}
                >
                  {translation}
                </p>
                <div className="qt-actions">
                  <button
                    type="button"
                    className={`qt-speak${isSpeaking ? " active" : ""}`}
                    onClick={handleSpeak}
                    aria-label={isSpeaking ? "Okumayı durdur" : "Çeviriyi sesli dinle"}
                    title={isSpeaking ? t("translate.stop") : t("translate.listen")}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span className="qt-action-label">{isSpeaking ? "Durdur" : "Dinle"}</span>
                  </button>
                  <button
                    type="button"
                    className={`qt-vault${vaultState === "saved" || vaultState === "exists" ? " done" : ""}`}
                    onClick={handleSaveToVault}
                    disabled={vaultState === "saving"}
                    aria-label="Kelime kasasına ekle"
                    title={
                      vaultState === "saved"
                        ? "Kasaya eklendi"
                        : vaultState === "exists"
                          ? "Zaten kasada"
                          : "Kelime Kasasına ekle"
                    }
                  >
                    {vaultState === "saving" ? (
                      <Loader2 size={13} className="qt-spin" />
                    ) : vaultState === "saved" || vaultState === "exists" ? (
                      <Check size={13} />
                    ) : (
                      <BookmarkPlus size={14} />
                    )}
                    <span className="qt-action-label">{t("translate.vault")}</span>
                  </button>
                  <button
                    type="button"
                    className="qt-copy"
                    onClick={handleCopy}
                    aria-label="Çeviriyi kopyala"
                    title="Kopyala"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span className="qt-action-label">{t("translate.copy")}</span>
                  </button>
                </div>
              </>
            ) : (
              <span className="qt-placeholder">
                {targetLang ? t("translate.placeholderResult") : t("translate.pickLangFirst")}
              </span>
            )}
          </div>
        </div>
      </div>

      {showPremiumModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal">
            <button className="premium-modal-close" onClick={handleCloseModal}>
              <X size={18} />
            </button>

            {paymentStep === 'select' && (
              <div className="premium-modal-content">
                <div className="premium-modal-header animate-pulse-glow">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                  <h2>MEMOLANDUM PREMIUM</h2>
                  <p>AI Çeviri Limitine Ulaştınız</p>
                </div>
                
                <p className="premium-modal-desc">
                  Deneme sürümündeki ilk 10 ücretsiz çeviri hakkınızı tamamladınız. 
                  Devam etmek ve tüm özellikleri sınırsız kullanmak için premium üyeliğe yükseltin.
                </p>

                <div className="premium-features">
                  <div className="feature-item">
                    <span className="bullet">⚡</span>
                    <div>
                      <strong>Sınırsız Yapay Zeka Çevirisi</strong>
                      <p>Gemini destekli anlık ve kesintisiz çeviri motoru</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="bullet">🎙️</span>
                    <div>
                      <strong>Sınırsız Sesli Arama & Telaffuz</strong>
                      <p>Doğal ses algılama ve telaffuz mekanizmaları</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="bullet">🎮</span>
                    <div>
                      <strong>Reklamsız Arcade Deneyimi</strong>
                      <p>Kelimeleri kesintisiz, odaklanmış ve akıcı öğrenin</p>
                    </div>
                  </div>
                </div>

                <div className="premium-pricing-options">
                  <button 
                    onClick={() => handleStartPayment('iyzico')}
                    className="pay-btn iyzico-btn"
                  >
                    <span>🇹🇷 iyzico ile Güvenli Öde</span>
                    <strong>99 TL / Ay</strong>
                  </button>
                  <button 
                    onClick={() => handleStartPayment('stripe')}
                    className="pay-btn stripe-btn"
                  >
                    <span>💳 Stripe ile Güvenli Öde</span>
                    <strong>$2.99 / Ay</strong>
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'form' && (
              <div className="premium-modal-content">
                <div className="premium-checkout-header">
                  <CreditCard className="w-6 h-6 text-cyan-400" />
                  <h3>{checkoutProvider === 'iyzico' ? 'iyzico Sanal POS' : 'Stripe Secure Checkout'}</h3>
                  <p className="price">
                    {checkoutProvider === 'iyzico' ? '99.00 TL / Aylık' : '$2.99 / Monthly'}
                  </p>
                </div>

                <form onSubmit={handleProcessPayment} className="checkout-form">
                  <div className="form-group">
                    <label>Kart Üzerindeki İsim</label>
                    <input 
                      type="text" 
                      required 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)} 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Kart Numarası</label>
                    <input 
                      type="text" 
                      required 
                      maxLength="19"
                      value={cardNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }} 
                      placeholder="4355 1200 4599 8812" 
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Son Kullanma Tarihi</label>
                      <input 
                        type="text" 
                        required 
                        maxLength="5"
                        value={cardExpiry} 
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2);
                          setCardExpiry(val);
                        }} 
                        placeholder="MM/YY" 
                      />
                    </div>
                    <div className="form-group w-24">
                      <label>CVC</label>
                      <input 
                        type="password" 
                        required 
                        maxLength="3"
                        value={cardCvc} 
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))} 
                        placeholder="***" 
                      />
                    </div>
                  </div>

                  <div className="checkout-actions">
                    <button 
                      type="button" 
                      onClick={() => setPaymentStep('select')}
                      className="checkout-back"
                    >
                      Geri
                    </button>
                    <button type="submit" className="checkout-submit">
                      Güvenli Öde
                    </button>
                  </div>
                </form>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="premium-modal-content flex flex-col items-center py-12 justify-center">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                <h4 className="text-lg font-mono font-bold tracking-wider text-slate-200">
                  {checkoutProvider === 'iyzico' ? "iyzico POS'a Bağlanılıyor..." : "Stripe POS'a Bağlanılıyor..."}
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-2">
                  Lütfen tarayıcınızı kapatmayın veya yenilemeyin.
                </p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="premium-modal-content flex flex-col items-center text-center py-6 justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
                <h3 className="text-xl font-mono font-bold text-emerald-400 tracking-widest">
                  ÖDEME BAŞARILI!
                </h3>
                <p className="text-sm font-mono text-slate-300 mt-2 max-w-xs">
                  Memolandum Premium üyeliğiniz aktif edildi. Tüm limitler kaldırıldı!
                </p>
                <button 
                  onClick={handleCloseModal}
                  className="checkout-success-btn"
                >
                  Kullanmaya Başla 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
.quick-translate-bar {
  width: 100%;
  border-top: 1px solid rgba(56, 189, 248, 0.12);
  background: linear-gradient(90deg, rgba(8, 15, 30, 0.95) 0%, rgba(15, 23, 42, 0.92) 50%, rgba(30, 27, 75, 0.9) 100%);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.qt-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 8px 24px 10px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  box-sizing: border-box;
}
.qt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}
.qt-row-primary {
  flex: none;
}
.qt-row-result {
  flex: none;
}
.qt-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #67e8f9;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}
.qt-mic {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(6, 182, 212, 0.12);
  color: #67e8f9;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.qt-mic:hover { background: rgba(6, 182, 212, 0.25); }
.qt-mic.recording {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(248, 113, 113, 0.6);
  color: #fca5a5;
  animation: qtPulse 1.2s ease-in-out infinite;
}
.qt-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
  padding: 0 12px;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}
.qt-input::placeholder { color: #64748b; font-size: 13px; }
.qt-input:focus {
  border-color: rgba(34, 211, 238, 0.55);
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.12);
}
.qt-select {
  flex-shrink: 0;
  height: 36px;
  min-width: 96px;
  max-width: 130px;
  border-radius: 8px;
  border: 1px solid rgba(167, 139, 250, 0.35);
  background: rgba(49, 46, 129, 0.45);
  color: #e9d5ff;
  font-size: 13px;
  font-weight: 700;
  padding: 0 8px;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  touch-action: manipulation;
}
.qt-select:focus { border-color: rgba(196, 181, 253, 0.7); }
.qt-result {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 40px;
  padding: 8px 10px 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(2, 6, 23, 0.45);
  box-sizing: border-box;
}
.qt-translation {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  color: #a7f3d0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-height: min(40vh, 220px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 2px;
}
.qt-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 0;
}
.qt-action-label { display: none; }
.qt-placeholder, .qt-loading {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.qt-error {
  color: #fca5a5;
  font-size: 12px;
  font-weight: 600;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
}
.qt-copy, .qt-vault, .qt-speak {
  flex-shrink: 0;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.qt-copy {
  background: transparent;
  color: #94a3b8;
}
.qt-copy:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.06);
}
.qt-speak {
  background: rgba(56, 189, 248, 0.12);
  color: #7dd3fc;
}
.qt-speak:hover {
  background: rgba(56, 189, 248, 0.22);
  color: #bae6fd;
}
.qt-speak.active {
  background: rgba(56, 189, 248, 0.28);
  color: #e0f2fe;
}
.qt-vault {
  background: rgba(52, 211, 153, 0.12);
  color: #6ee7b7;
}
.qt-vault:hover {
  background: rgba(52, 211, 153, 0.22);
  color: #a7f3d0;
}
.qt-vault.done {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}
.qt-vault:disabled {
  opacity: 0.7;
  cursor: wait;
}
.qt-spin { animation: qtSpin 0.8s linear infinite; }
@keyframes qtSpin { to { transform: rotate(360deg); } }
@keyframes qtPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(248, 113, 113, 0); }
}

@media (max-width: 1100px) {
  .qt-inner { padding: 8px 16px 10px; }
  .qt-label-text { display: none; }
}

@media (max-width: 768px) {
  .qt-inner { padding: 8px 12px 10px; gap: 8px; }
  .qt-row-primary {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 92px;
    gap: 8px;
    align-items: center;
  }
  .qt-label { display: none; }
  .qt-mic { width: 40px; height: 40px; }
  .qt-input {
    width: 100%;
    height: 40px;
    font-size: 16px;
  }
  .qt-input::placeholder { font-size: 14px; }
  .qt-select {
    width: 100%;
    max-width: none;
    min-width: 0;
    height: 40px;
    font-size: 13px;
    padding: 0 6px;
  }
  .qt-result {
    min-height: 44px;
    padding: 8px 8px 8px 12px;
  }
  .qt-translation {
    font-size: 15px;
    max-height: min(45vh, 260px);
  }
  .qt-actions { gap: 6px; }
  .qt-copy, .qt-vault, .qt-speak {
    min-width: 44px;
    height: 40px;
    padding: 0 10px;
  }
  .qt-action-label {
    display: inline;
    font-size: 11px;
    font-weight: 700;
  }
}

@media (max-width: 380px) {
  .qt-row-primary {
    grid-template-columns: 40px minmax(0, 1fr) 78px;
    gap: 6px;
  }
  .qt-action-label { display: none; }
  .qt-inner { padding: 8px 10px 10px; }
}

.premium-badge {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.2);
}

.premium-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 5, 16, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.premium-modal {
  background: #0b0f19;
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  padding: 32px 24px;
  position: relative;
  box-shadow: 0 0 50px rgba(6, 182, 212, 0.15);
  box-sizing: border-box;
}

.premium-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.premium-modal-close:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.05);
}

.premium-modal-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.premium-modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.premium-modal-header h2 {
  font-family: monospace;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.1em;
  background: linear-gradient(135deg, #fbbf24 0%, #d946ef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.premium-modal-header p {
  color: #f43f5e;
  font-size: 11px;
  font-family: monospace;
  font-weight: bold;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}

.premium-modal-desc {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.premium-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 12px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.feature-item .bullet {
  font-size: 16px;
  line-height: 1;
}

.feature-item strong {
  display: block;
  color: #f1f5f9;
  font-size: 13px;
  margin-bottom: 2px;
}

.feature-item p {
  color: #64748b;
  font-size: 11px;
  margin: 0;
}

.premium-pricing-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pay-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
}

.iyzico-btn {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #f59e0b;
}

.iyzico-btn:hover {
  background: #f59e0b;
  color: #000000;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
}

.stripe-btn {
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.35);
  color: #06b6d4;
}

.stripe-btn:hover {
  background: #06b6d4;
  color: #000000;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
}

.premium-checkout-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  text-align: center;
}

.premium-checkout-header h3 {
  font-size: 16px;
  font-family: monospace;
  font-weight: bold;
  color: #f1f5f9;
  margin: 0;
}

.premium-checkout-header .price {
  color: #34d399;
  font-size: 18px;
  font-family: monospace;
  font-weight: bold;
  margin: 0;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #64748b;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: bold;
  font-family: monospace;
}

.form-group input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  font-family: monospace;
}

.form-group input:focus {
  border-color: rgba(6, 182, 212, 0.5);
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.15);
}

.form-row {
  display: flex;
  gap: 12px;
}

.checkout-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.checkout-back {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.checkout-back:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

.checkout-submit {
  flex: 2;
  background: #06b6d4;
  border: none;
  color: #000000;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.checkout-submit:hover {
  background: #22d3ee;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.35);
}

.checkout-success-btn {
  background: #10b981;
  border: none;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-family: monospace;
  margin-top: 16px;
  transition: all 0.2s;
}

.checkout-success-btn:hover {
  background: #34d399;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.35);
}
          `,
        }}
      />
    </div>
  );
}

function humanizeAiError(err) {
  if (err instanceof AbuseError || err?.name === "AbuseError") {
    return err.message;
  }
  const message = String(err?.message || err || "");
  if (/permission|PERMISSION|403|API_KEY|not enabled|AI Logic|Vertex/i.test(message)) {
    return "AI servisi henüz aktif değil (Firebase AI Logic).";
  }
  if (/quota|429|resource.exhausted/i.test(message)) {
    return "Kota aşıldı, biraz sonra deneyin.";
  }
  if (/network|Failed to fetch|offline/i.test(message)) {
    return "Ağ hatası — bağlantıyı kontrol edin.";
  }
  return message.slice(0, 80) || "Çeviri başarısız.";
}
