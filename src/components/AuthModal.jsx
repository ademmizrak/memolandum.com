'use client';

import { useState, useEffect } from 'react';
import {
  signInWithGoogle,
  signInWithApple,
  registerWithEmail,
  loginWithEmail,
  setUsername,
  requestPasswordReset,
  sendVerificationEmail,
} from '../lib/firebase/authService';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { useAnalytics } from '../hooks/useAnalytics';

const PARENT_GRADE_OPTIONS = [
  { id: "meb-1-sinif-kelimeleri", label: "🎒 1. Sınıf MEB" },
  { id: "meb-2-sinif-kelimeleri", label: "🎒 2. Sınıf MEB" },
  { id: "meb-3-sinif-kelimeleri", label: "🎒 3. Sınıf MEB" },
  { id: "meb-4-sinif-kelimeleri", label: "🎒 4. Sınıf MEB" },
  { id: "ortaokul-5", label: "🎓 5. Sınıf Ortaokul" },
  { id: "genel-sinav", label: "🎯 Sınav & Genel" },
];

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  // 'login', 'register', 'verify', 'username', 'forgot'
  const [view, setView] = useState(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const { trackSignUp, trackLogin } = useAnalytics();

  // Veli ve Öğrenci Bilgisi Girişi
  const [isParentAccountChecked, setIsParentAccountChecked] = useState(false);
  const [childNameInput, setChildNameInput] = useState('');
  const [childGradeInput, setChildGradeInput] = useState('meb-2-sinif-kelimeleri');
  const [childGradeLabel, setChildGradeLabel] = useState('2. Sınıf MEB İngilizce');
  const [parentEmailDigestChecked, setParentEmailDigestChecked] = useState(true);
  
  const { profile, isAuthenticated, isEmailVerified } = useMemolandumStore();
  const [isIosApp, setIsIosApp] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      setIsIosApp(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialView === 'login' || initialView === 'register' || initialView === 'forgot') {
      setView(initialView);
      setError(null);
      setSuccessMsg(null);
    }
  }, [initialView, isOpen]);

  // When auth state changes, decide next step
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      if (!isEmailVerified) {
        setView('verify');
      } else if (!profile?.displayName) {
        setView('username');
      } else {
        // All good, close modal
        onClose();
      }
    }
  }, [isAuthenticated, isEmailVerified, profile, isOpen, onClose]);

  if (!isOpen) return null;

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg('Apple hesabınız doğrulanıyor…');
      const user = await signInWithApple();
      if (!user) return;
      trackLogin('apple');
    } catch (err) {
      setError(err?.message || 'Apple ile giriş başarısız.');
      setSuccessMsg(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg('Google hesabına yönlendiriliyorsunuz…');
      const user = await signInWithGoogle();
      if (!user) return;
      trackLogin('google');
    } catch (err) {
      const code = err?.code || '';
      let msg = err?.message || 'Google ile giriş başarısız.';
      if (code === 'auth/network-request-failed') {
        msg = 'Ağ hatası. Bağlantınızı kontrol edip tekrar deneyin.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = 'Bu domain Google girişine kapalı. Destek ile iletişime geçin.';
      }
      setError(msg);
      setSuccessMsg(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (view === 'login') {
        await loginWithEmail(email, password);
        trackLogin('email'); // ← Conversion: Email giriş
      } else {
        await registerWithEmail(email, password);
        trackSignUp('email'); // ← Conversion: Yeni kayıt
      }
      // useEffect will handle routing to 'verify' or 'username'
    } catch (err) {
      console.error("Auth submit error:", err);
      const code = err?.code || '';
      let msg = err?.message || 'Bir hata oluştu.';
      if (code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi ile zaten bir hesap kayıtlı. Lütfen "Giriş Yapın" veya şifrenizi sıfırlayın.';
      } else if (code === 'auth/weak-password') {
        msg = 'Şifreniz çok zayıf. Lütfen en az 6 karakterli daha güçlü bir şifre girin.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Lütfen geçerli bir e-posta adresi girin.';
      } else if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        msg = 'E-posta adresi veya şifre hatalı.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await requestPasswordReset(email);
      setSuccessMsg(
        'Varsa bu e-postaya şifre sıfırlama bağlantısı gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.'
      );
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-email') {
        setError('Lütfen geçerli bir e-posta adresi girin.');
      } else if (code === 'auth/too-many-requests') {
        setError('Çok fazla deneme. Bir süre sonra tekrar deneyin.');
      } else {
        setError(err?.message || 'Sıfırlama e-postası gönderilemedi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetUsername = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const { auth } = require('../lib/firebase/config');
      if (!auth.currentUser) throw new Error("Giriş yapılmış hesap bulunamadı.");
      
      await setUsername(auth.currentUser, usernameInput);

      if (isParentAccountChecked && childNameInput.trim()) {
        const store = useMemolandumStore.getState();
        store.setIsParentAccount?.(true);
        store.setParentEmailDigest?.(parentEmailDigestChecked);
        store.addChildProfile?.({
          name: childNameInput.trim(),
          grade: childGradeInput,
          gradeLabel: childGradeLabel,
          emailDigest: parentEmailDigestChecked,
        });
        if (childGradeInput.startsWith("meb-")) {
          store.setLastPlayed?.("en-tr", childGradeInput, "word-card");
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Kullanıcı adı ayarlanamadı.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await sendVerificationEmail();
      setSuccessMsg("Doğrulama e-postası tekrar gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.");
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') {
        setError('Çok fazla deneme. Bir süre sonra tekrar deneyin.');
      } else {
        setError(err?.message || 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-y-auto max-h-[92vh]"
        style={{ width: '100%', maxWidth: '480px' }}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg text-sm mb-6 text-center">
            {successMsg}
          </div>
        )}

        {/* View: Login or Register */}
        {(view === 'login' || view === 'register') && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {view === 'login' ? 'Hoş Geldiniz' : 'Hesap Oluşturun'}
              </h2>
              <p className="text-gray-400 text-sm">
                İlerlemeni buluta kaydetmek için giriş yap.
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors mb-4 disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53(7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google ile Devam Et
            </button>

            {isIosApp && (
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3 px-4 rounded-xl hover:bg-black/90 border border-gray-700 transition-colors mb-4 disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z"/>
                </svg>
                Apple ile Devam Et
              </button>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gray-700 flex-1"></div>
              <span className="text-gray-500 text-sm">VEYA</span>
              <div className="h-px bg-gray-700 flex-1"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="E-posta Adresi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'İşleniyor...' : (view === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
              </button>
            </form>

            {view === 'login' && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-cyan-400/90 hover:text-cyan-300 text-sm font-medium"
                >
                  Şifremi unuttum
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-gray-400 text-sm">
              {view === 'login' ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
              <button 
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {view === 'login' ? 'Hemen Oluşturun' : 'Giriş Yapın'}
              </button>
            </div>
          </>
        )}

        {/* View: Forgot password */}
        {view === 'forgot' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Şifremi Unuttum</h2>
              <p className="text-gray-400 text-sm">
                Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderelim.
              </p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="E-posta Adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>
            <div className="mt-6 text-center text-gray-400 text-sm">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                ← Giriş ekranına dön
              </button>
            </div>
          </>
        )}

        {/* View: Verify Email */}
        {view === 'verify' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">E-posta Onayı Gerekli</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Hesabınızı güvene almak ve liderlik tablosuna girebilmek için e-postanıza gönderdiğimiz onay linkine tıklayın. 
              Onaylamadan da misafir olarak oynamaya devam edebilirsiniz.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                Onay E-postasını Tekrar Gönder
              </button>
              <button
                onClick={onClose}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Oynamaya Devam Et
              </button>
            </div>
          </div>
        )}

        {/* View: Set Username & Optional Parent Onboarding */}
        {view === 'username' && (
          <div>
            <div className="text-center mb-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                {isParentAccountChecked ? "Veli ve Öğrenci Kaydı" : "Sizi Nasıl Çağıralım?"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                {isParentAccountChecked 
                  ? "Çocuğunuzun İngilizce gelişimini takip etmek için bilgilerinizi tamamlayın."
                  : "Liderlik tablosunda görünecek eşsiz kullanıcı adınızı belirleyin."}
              </p>
            </div>
            <form onSubmit={handleSetUsername} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {isParentAccountChecked ? "Veli Kullanıcı Adı / Hitap" : "Kullanıcı Adı"}
                </label>
                <input
                  type="text"
                  placeholder={isParentAccountChecked ? "Örn: Selin Hanım, Ahmet Bey..." : "Kullanıcı Adı"}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_ çÇğĞıİöÖşŞüÜ.-]/g, ''))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-[11px] text-gray-500 mt-1">Sadece harf, rakam ve alt çizgi (_) kullanabilirsiniz.</p>
              </div>

              {/* Veli Modu Seçim Kartı */}
              <div 
                onClick={() => setIsParentAccountChecked(!isParentAccountChecked)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isParentAccountChecked 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10' 
                    : 'bg-gray-800/40 border-gray-700/80 hover:border-gray-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={isParentAccountChecked} 
                  onChange={(e) => setIsParentAccountChecked(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 w-4 h-4 rounded text-amber-500 accent-amber-500 shrink-0 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white">
                    <span>👨‍👩‍👧 Veli Olarak Kaydoluyorum</span>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Çocuğum İçin
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-snug">
                    Çocuğumun sınıfına uygun kelimeleri takip etmek, haftalık karne ve bildirim almak istiyorum.
                  </p>
                </div>
              </div>

              {/* Veli Seçildiyse Açılan Çocuk Bilgi Alanı */}
              {isParentAccountChecked && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Öğrenci / Çocuk Adı:
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Kerem, Zeynep..."
                      value={childNameInput}
                      onChange={(e) => setChildNameInput(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      required={isParentAccountChecked}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Öğrencinin Sınıfı / Düzeyi:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PARENT_GRADE_OPTIONS.map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => {
                            setChildGradeInput(g.id);
                            setChildGradeLabel(g.label);
                          }}
                          className={`p-2 rounded-lg text-xs font-bold border transition-all text-left flex items-center justify-between ${
                            childGradeInput === g.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                              : 'bg-gray-800/60 border-gray-700/80 text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <span className="truncate">{g.label}</span>
                          {childGradeInput === g.id && <span className="text-[10px] shrink-0 ml-1">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={parentEmailDigestChecked}
                      onChange={(e) => setParentEmailDigestChecked(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300">
                      Haftalık başarı karnesi ve çalışma bildirimlerini e-posta ile al
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || usernameInput.length < 3 || (isParentAccountChecked && !childNameInput.trim())}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? 'İşleniyor...' : (isParentAccountChecked ? '👨‍👩‍👧 Veli & Öğrenci Profilini Başlat' : 'Kaydet ve Başla')}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
