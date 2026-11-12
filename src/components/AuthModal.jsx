'use client';

import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase/config';
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
import { useLocale } from '../lib/i18n/LocaleProvider';

const PRESET_AVATARS = [
  { id: 'neo', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Neo', label: 'Neo' },
  { id: 'cosmo', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Cosmo', label: 'Cosmo' },
  { id: 'luna', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Luna', label: 'Luna' },
  { id: 'felix', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Felix', label: 'Felix' },
  { id: 'nova', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Nova', label: 'Nova' },
  { id: 'pixel', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Pixel', label: 'Pixel' },
  { id: 'spark', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Spark', label: 'Spark' },
  { id: 'aegis', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Aegis', label: 'Aegis' },
];

const NICK_ADJECTIVES = [
  "Kozmik", "Siber", "Piksel", "Hizli", "Gizemli", 
  "Cesur", "Parlak", "Super", "Mega", "Yildiz", 
  "Astro", "Turbo", "Kuantum", "Matrix", "Kripto"
];
const NICK_NOUNS = [
  "Kadet", "Avci", "Kasif", "Kedi", "Sampiyon", 
  "Yolcu", "Dahi", "Usta", "Kaptan", "Kahraman", 
  "Ninja", "Kurt", "Pilot", "Savasci", "Gezgin"
];
const NICK_ADJECTIVES_EN = [
  "Cosmic", "Cyber", "Pixel", "Swift", "Mystic",
  "Brave", "Bright", "Super", "Mega", "Star",
  "Astro", "Turbo", "Quantum", "Matrix", "Nova"
];
const NICK_NOUNS_EN = [
  "Cadet", "Hunter", "Explorer", "Falcon", "Champ",
  "Voyager", "Genius", "Master", "Captain", "Hero",
  "Ninja", "Wolf", "Pilot", "Ranger", "Nomad"
];

const generateRandomNickname = (isEn = false) => {
  const adjs = isEn ? NICK_ADJECTIVES_EN : NICK_ADJECTIVES;
  const nouns = isEn ? NICK_NOUNS_EN : NICK_NOUNS;
  const adj = adjs[Math.floor(Math.random() * adjs.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}_${noun}_${num}`;
};

const PARENT_GRADE_OPTIONS = [
  { id: "meb-1-sinif-kelimeleri", label: "🎒 1. Sınıf İngilizce", labelEn: "🎒 Grade 1 English" },
  { id: "meb-2-sinif-kelimeleri", label: "🎒 2. Sınıf İngilizce", labelEn: "🎒 Grade 2 English" },
  { id: "meb-3-sinif-kelimeleri", label: "🎒 3. Sınıf İngilizce", labelEn: "🎒 Grade 3 English" },
  { id: "meb-4-sinif-kelimeleri", label: "🎒 4. Sınıf İngilizce", labelEn: "🎒 Grade 4 English" },
  { id: "meb-5-sinif-kelimeleri", label: "🎓 5. Sınıf Ortaokul", labelEn: "🎓 Grade 5 Middle School" },
  { id: "meb-6-sinif-kelimeleri", label: "🎓 6. Sınıf Ortaokul", labelEn: "🎓 Grade 6 Middle School" },
  { id: "meb-7-sinif-kelimeleri", label: "🎓 7. Sınıf Ortaokul", labelEn: "🎓 Grade 7 Middle School" },
  { id: "meb-8-sinif-kelimeleri", label: "🎓 8. Sınıf Ortaokul (LGS)", labelEn: "🎓 Grade 8 (LGS Prep)" },
  { id: "genel-sinav", label: "🎯 Sınav & Genel", labelEn: "🎯 Exams & General" },
];

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const { locale } = useLocale();
  const isEn = locale !== 'tr';
  // 'login', 'register', 'verify', 'username', 'forgot'
  const [view, setView] = useState(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(null); // 'google' | 'apple' | 'email' | 'forgot' | 'username' | 'resend'
  const isBusy = !!loadingMethod || loading;
  const [successMsg, setSuccessMsg] = useState(null);
  const { trackSignUp, trackLogin } = useAnalytics();

  // Veli ve Öğrenci Bilgisi Girişi
  const [isParentAccountChecked, setIsParentAccountChecked] = useState(false);
  const [childNameInput, setChildNameInput] = useState('');
  const [childGradeInput, setChildGradeInput] = useState('meb-2-sinif-kelimeleri');
  const [childGradeLabel, setChildGradeLabel] = useState('2. Sınıf İngilizce');
  const [parentEmailDigestChecked, setParentEmailDigestChecked] = useState(false);
  
  const { profile, isAuthenticated, isEmailVerified } = useMemolandumStore();
  const [isIosApp, setIsIosApp] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      setIsIosApp(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (
      initialView === 'login' ||
      initialView === 'register' ||
      initialView === 'forgot' ||
      initialView === 'verify' ||
      initialView === 'username'
    ) {
      setView(initialView);
      setError(null);
      setSuccessMsg(null);
    }
  }, [initialView, isOpen]);

  // When auth state changes outside an active button submission (e.g. redirect return or direct modal open):
  // If user explicitly opened 'verify', show 'verify'.
  // If user has no username yet, prompt for username & avatar setup.
  useEffect(() => {
    if (!isOpen || isBusy) return;
    if (isAuthenticated) {
      if (initialView === 'verify' && !isEmailVerified) {
        setView('verify');
      } else if (!profile?.username) {
        setView('username');
      } else if (view !== 'username' && view !== 'verify') {
        onClose();
      }
    }
  }, [isAuthenticated, isEmailVerified, profile, isOpen, onClose, initialView, isBusy, view]);

  if (!isOpen) return null;

  const handleAppleSignIn = async () => {
    try {
      setLoadingMethod('apple');
      setLoading(true);
      setError(null);
      setSuccessMsg(isEn ? 'Verifying your Apple account…' : 'Apple hesabınız doğrulanıyor…');
      const user = await signInWithApple();
      if (!user) return;
      trackLogin('apple');

      const syncedProfile = useMemolandumStore.getState().profile;
      if (!syncedProfile?.username) {
        setView('username');
      } else {
        onClose();
      }
    } catch (err) {
      setError(err?.message || (isEn ? 'Apple Sign-In failed.' : 'Apple ile giriş başarısız.'));
      setSuccessMsg(null);
    } finally {
      setLoadingMethod(null);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoadingMethod('google');
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      if (!user) return; // Redirect akışına geçildiyse sayfa yönlenir
      const isNew = user?.metadata?.creationTime && user?.metadata?.lastSignInTime &&
        Math.abs(new Date(user.metadata.creationTime).getTime() - new Date(user.metadata.lastSignInTime).getTime()) < 5000;
      if (isNew) {
        trackSignUp('google'); // ← Conversion: Google ile yeni kayıt
      } else {
        trackLogin('google');
      }

      // Gizlilik İlkesi: Google gerçek adını ifşa etmemek için kullanıcı adı kontrolü
      const syncedProfile = useMemolandumStore.getState().profile;
      if (!syncedProfile?.username) {
        setView('username');
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Google Sign-In caught in modal:", err);
      const code = err?.code || '';
      const rawMsg = String(err?.message || '');
      let msg = rawMsg || (isEn ? 'Google Sign-In failed.' : 'Google ile giriş başarısız.');
      if (code === 'auth/in-app-browser-unsupported' || /disallowed_useragent/i.test(rawMsg)) {
        msg = isEn
          ? 'In-app browsers (Instagram, Facebook, TikTok, etc.) block Google Sign-In for security. Please use "Open in Browser" (Chrome / Safari) from the top-right menu, or sign in with Email below.'
          : 'Uygulama içi tarayıcılar (Instagram, Facebook, TikTok vb.) güvenlik nedeniyle Google girişini engeller. Lütfen sağ üst menüden "Tarayıcıda Aç" (Chrome / Safari) seçeneğini kullanın veya aşağıdan E-posta ile giriş yapın.';
      } else if (code === 'auth/popup-blocked') {
        msg = isEn
          ? 'Your browser blocked the sign-in popup. Please allow popups and try again.'
          : 'Tarayıcınız açılır pencereyi engelledi. Lütfen açılır pencerelere izin verip tekrar deneyin.';
      } else if (code === 'auth/popup-timeout') {
        msg = isEn
          ? 'Google sign-in window timed out. Please check your connection and try again.'
          : 'Google giriş penceresi zaman aşımına uğradı. Bağlantınızı kontrol edip tekrar deneyin.';
      } else if (code === 'auth/popup-closed-by-user') {
        msg = isEn ? 'Sign-in window was closed.' : 'Giriş penceresi kapatıldı.';
      } else if (code === 'auth/cancelled-popup-request') {
        msg = isEn ? 'Previous sign-in request was cancelled.' : 'Önceki giriş isteği iptal edildi.';
      } else if (code === 'auth/network-request-failed') {
        msg = isEn
          ? 'Network error. Please check your connection and try again.'
          : 'Ağ hatası. Bağlantınızı kontrol edip tekrar deneyin.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = isEn
          ? 'This domain is not authorized for Google Sign-In. Please contact support.'
          : 'Bu domain Google girişine kapalı. Destek ile iletişime geçin.';
      }
      setError(msg);
      setSuccessMsg(null);
    } finally {
      setLoadingMethod(null);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoadingMethod('email');
      setLoading(true);
      setError(null);
      if (view === 'login') {
        const user = await loginWithEmail(email, password);
        trackLogin('email'); // ← Conversion: Email giriş
        if (user) {
          const syncedProfile = useMemolandumStore.getState().profile;
          if (!syncedProfile?.username && !user.displayName) {
            setView('username');
          } else {
            onClose();
          }
        }
      } else {
        const user = await registerWithEmail(email, password);
        trackSignUp('email'); // ← Conversion: Yeni kayıt
        if (user) {
          setView('username');
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      const code = err?.code || '';
      let msg = isEn ? 'An error occurred. Please try again.' : 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (code === 'auth/email-already-in-use') {
        msg = isEn
          ? 'An account already exists with this email. Please log in or reset your password.'
          : 'Bu e-posta adresi ile zaten bir hesap kayıtlı. Lütfen "Giriş Yapın" veya şifrenizi sıfırlayın.';
      } else if (code === 'auth/weak-password') {
        msg = isEn
          ? 'Password is too weak. Please enter at least 6 characters.'
          : 'Şifreniz çok zayıf. Lütfen en az 6 karakterli daha güçlü bir şifre girin.';
      } else if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
        msg = isEn ? 'Please enter a valid email address.' : 'Lütfen geçerli bir e-posta adresi girin.';
      } else if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        msg = isEn ? 'Invalid email or password.' : 'E-posta adresi veya şifre hatalı.';
      } else if (code === 'auth/too-many-requests') {
        msg = isEn
          ? 'Too many attempts. Please wait a moment and try again.'
          : 'Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.';
      } else if (code === 'auth/network-request-failed') {
        msg = isEn
          ? 'Network error. Please check your internet connection and try again.'
          : 'Ağ bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.';
      } else if (code === 'auth/user-disabled') {
        msg = isEn
          ? 'This account has been disabled. Please contact support.'
          : 'Bu hesap devre dışı bırakılmış. Destek ile iletişime geçin.';
      } else if (code === 'auth/operation-not-allowed') {
        msg = isEn
          ? 'Email/password sign-in is currently unavailable. Please continue with Google.'
          : 'E-posta/şifre girişi şu anda kullanılamıyor. Lütfen Google ile devam edin.';
      } else if (err?.message && !String(err.message).startsWith('Firebase:')) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoadingMethod(null);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      setLoadingMethod('forgot');
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await requestPasswordReset(email);
      setSuccessMsg(
        isEn
          ? 'If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.'
          : 'Varsa bu e-postaya şifre sıfırlama bağlantısı gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.'
      );
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-email') {
        setError(isEn ? 'Please enter a valid email address.' : 'Lütfen geçerli bir e-posta adresi girin.');
      } else if (code === 'auth/too-many-requests') {
        setError(isEn ? 'Too many attempts. Please try again later.' : 'Çok fazla deneme. Bir süre sonra tekrar deneyin.');
      } else {
        setError(err?.message || (isEn ? 'Could not send reset email.' : 'Sıfırlama e-postası gönderilemedi.'));
      }
    } finally {
      setLoadingMethod(null);
      setLoading(false);
    }
  };

  const handleSetUsername = async (e) => {
    e.preventDefault();
    try {
      setLoadingMethod('username');
      setLoading(true);
      setError(null);
      
      if (!auth?.currentUser) throw new Error(isEn ? "No signed-in account found." : "Giriş yapılmış hesap bulunamadı.");
      
      await setUsername(auth.currentUser, usernameInput, selectedAvatar);

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
      const code = err?.code || '';
      if (code === 'username/already-in-use') {
        setError(isEn ? 'This username is already taken. Please try another one.' : 'Bu kullanıcı adı alınmış. Lütfen başka bir rumuz seçin.');
      } else if (code === 'username/too-short') {
        setError(isEn ? 'Username must be at least 3 characters.' : 'Kullanıcı adı en az 3 karakter olmalıdır.');
      } else if (code === 'permission-denied') {
        setError(isEn ? 'This username is unavailable. Please choose another one.' : 'Bu kullanıcı adı kullanılamıyor. Lütfen başka bir rumuz seçin.');
      } else {
        setError(err?.message && !String(err.message).startsWith('Firebase:') ? err.message : (isEn ? 'Could not save username.' : 'Kullanıcı adı ayarlanamadı.'));
      }
    } finally {
      setLoadingMethod(null);
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      setLoadingMethod('resend');
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await sendVerificationEmail();
      setSuccessMsg(
        isEn
          ? "Verification email resent. Please check your inbox and spam folder."
          : "Doğrulama e-postası tekrar gönderildi. Gelen kutusu ve spam klasörünü kontrol edin."
      );
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') {
        setError(isEn ? 'Too many attempts. Please try again later.' : 'Çok fazla deneme. Bir süre sonra tekrar deneyin.');
      } else {
        setError(err?.message || (isEn ? 'Could not send email. Please try again later.' : 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.'));
      }
    } finally {
      setLoadingMethod(null);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
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
                {view === 'login'
                  ? isEn ? 'Welcome Back' : 'Hoş Geldiniz'
                  : isEn ? 'Create Account' : 'Hesap Oluşturun'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isEn
                  ? 'Sign in to sync your learning progress to the cloud.'
                  : 'İlerlemeni buluta kaydetmek için giriş yap.'}
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors mb-4 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {loadingMethod === 'google' ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-gray-800 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>{isEn ? 'Connecting with Google...' : 'Google ile bağlanılıyor...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>{isEn ? 'Continue with Google' : 'Google ile Devam Et'}</span>
                </>
              )}
            </button>

            {isIosApp && (
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isBusy}
                className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3 px-4 rounded-xl hover:bg-black/90 border border-gray-700 transition-colors mb-4 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingMethod === 'apple' ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{isEn ? 'Connecting with Apple...' : 'Apple ile bağlanılıyor...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z"/>
                    </svg>
                    <span>{isEn ? 'Continue with Apple' : 'Apple ile Devam Et'}</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gray-700 flex-1"></div>
              <span className="text-gray-500 text-sm">{isEn ? 'OR' : 'VEYA'}</span>
              <div className="h-px bg-gray-700 flex-1"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder={isEn ? 'Email Address' : 'E-posta Adresi'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={isEn ? 'Password' : 'Şifre'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isBusy}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMethod === 'email' ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{isEn ? 'Processing...' : 'İşleniyor...'}</span>
                  </>
                ) : (
                  view === 'login'
                    ? isEn ? 'Log In' : 'Giriş Yap'
                    : isEn ? 'Sign Up' : 'Kayıt Ol'
                )}
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
                  {isEn ? 'Forgot password?' : 'Şifremi unuttum'}
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-gray-400 text-sm">
              {view === 'login'
                ? isEn ? "Don't have an account? " : 'Hesabınız yok mu? '
                : isEn ? 'Already have an account? ' : 'Zaten hesabınız var mı? '}
              <button 
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {view === 'login'
                  ? isEn ? 'Sign Up Now' : 'Hemen Oluşturun'
                  : isEn ? 'Log In' : 'Giriş Yapın'}
              </button>
            </div>
          </>
        )}

        {/* View: Forgot password */}
        {view === 'forgot' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {isEn ? 'Reset Password' : 'Şifremi Unuttum'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isEn
                  ? 'Enter your registered email address to receive a password reset link.'
                  : 'Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderelim.'}
              </p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder={isEn ? 'Email Address' : 'E-posta Adresi'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isBusy}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMethod === 'forgot' ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{isEn ? 'Sending...' : 'Gönderiliyor...'}</span>
                  </>
                ) : (
                  isEn ? 'Send Reset Link' : 'Sıfırlama Bağlantısı Gönder'
                )}
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
                {isEn ? '← Back to Log In' : '← Giriş ekranına dön'}
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
            <h2 className="text-2xl font-bold text-white mb-4">
              {isEn ? 'Email Verification Required' : 'E-posta Onayı Gerekli'}
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {isEn
                ? 'Click the verification link sent to your email to secure your account and join the leaderboard. You can also continue playing right away.'
                : 'Hesabınızı güvene almak ve liderlik tablosuna girebilmek için e-postanıza gönderdiğimiz onay linkine tıklayın. Onaylamadan da misafir olarak oynamaya devam edebilirsiniz.'}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isBusy}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMethod === 'resend' ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{isEn ? 'Sending...' : 'Gönderiliyor...'}</span>
                  </>
                ) : (
                  isEn ? 'Resend Verification Email' : 'Onay E-postasını Tekrar Gönder'
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                {isEn ? 'Continue Playing' : 'Oynamaya Devam Et'}
              </button>
            </div>
          </div>
        )}

        {/* View: Set Username & Optional Parent Onboarding */}
        {view === 'username' && (
          <div>
            <div className="text-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {isParentAccountChecked
                  ? isEn ? 'Parent & Student Setup' : 'Veli ve Öğrenci Kaydı'
                  : isEn ? 'Choose Your Player Identity' : 'Oyun Kimliğini Belirle'}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                {isParentAccountChecked 
                  ? isEn
                    ? "Complete your details to track your child's English progress."
                    : "Çocuğunuzun İngilizce gelişimini takip etmek için bilgilerinizi tamamlayın."
                  : isEn
                    ? 'You will appear on the platform and leaderboard with this virtual avatar and nickname.'
                    : 'Platformda ve liderlik tablosunda bu sanal avatar ve rumuzunla yer alacaksın.'}
              </p>
            </div>

            {/* Gizlilik Güvencesi Rozeti */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2.5 mb-4 flex items-center gap-2.5 text-xs text-cyan-300">
              <span className="text-base shrink-0">🛡️</span>
              <span>
                {isEn ? (
                  <>
                    <strong>Privacy First:</strong> Your real name or photo is never required. Only your chosen nickname and virtual avatar are shown.
                  </>
                ) : (
                  <>
                    <strong>Gizlilik Önceliğimizdir:</strong> Gerçek adınız veya fotoğrafınız gerekmez. Platformda sadece seçtiğin rumuz ve sanal avatar görünür.
                  </>
                )}
              </span>
            </div>

            <form onSubmit={handleSetUsername} className="space-y-4">
              {/* Avatar Seçim Alanı */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  {isEn ? 'Pick Your Virtual Avatar:' : 'Sanal Avatarını Seç:'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative rounded-xl p-1 border-2 transition-all cursor-pointer bg-gray-800/80 hover:bg-gray-700/80 ${
                        selectedAvatar === av.url
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20 scale-105'
                          : 'border-gray-700 hover:border-gray-500 opacity-75 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img 
                        src={av.url} 
                        alt={av.label} 
                        className="w-10 h-10 mx-auto rounded-lg"
                      />
                      {selectedAvatar === av.url && (
                        <div className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">
                    {isParentAccountChecked
                      ? isEn ? 'Parent Username / Title' : 'Veli Kullanıcı Adı / Hitap'
                      : isEn ? 'Username (Nickname)' : 'Kullanıcı Adı (Rumuz)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nick = generateRandomNickname(isEn);
                      setUsernameInput(nick);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>🎲</span>
                    <span>{isEn ? 'Random Suggest' : 'Rastgele Öner'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      isParentAccountChecked
                        ? isEn ? 'e.g. Sarah, Alex...' : 'Örn: Selin Hanım, Ahmet Bey...'
                        : isEn ? 'e.g. Cosmic_Cadet_42' : 'Örn: Kozmik_Kadet_42'
                    }
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/[^\p{L}\p{M}\p{N}_ .-]/gu, ''))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {isEn
                    ? 'Letters, numbers, and underscores (_) allowed. Real name is not required.'
                    : 'Harf, rakam ve alt çizgi (_) kullanabilirsiniz. Gerçek ad zorunlu değildir.'}
                </p>
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
                    <span>{isEn ? '👨‍👩‍👧 I am registering as a Parent' : '👨‍👩‍👧 Veli Olarak Kaydoluyorum'}</span>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isEn ? 'For My Child' : 'Çocuğum İçin'}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-snug">
                    {isEn
                      ? "I want to track grade-appropriate vocabulary and get progress report cards. A nickname is enough for the child; real surname is not required."
                      : 'Çocuğumun sınıfına uygun kelimeleri takip etmek ve karne almak istiyorum. Çocuk için rumuz yeterli; gerçek soyad zorunlu değil.'}
                  </p>
                </div>
              </div>

              {/* Veli Seçildiyse Açılan Çocuk Bilgi Alanı */}
              {isParentAccountChecked && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {isEn
                        ? 'Student / Child Game Nickname (No real name needed):'
                        : 'Öğrenci / Çocuk Oyun Rumuzu (Gerçek ad gerekmez):'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEn ? 'e.g. Space Explorer, Little Cat, Rocket...' : 'Örn: Uzay Kaşifi, Minik Kedi, Roket...'}
                      value={childNameInput}
                      onChange={(e) => setChildNameInput(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      required={isParentAccountChecked}
                      maxLength={40}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      {isEn
                        ? 'Leaderboards and homework tracking only use this nickname.'
                        : 'Liderlik ve ödev takipleri yalnızca bu rumuzla yapılır, gerçek isim istenmez.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {isEn ? "Student's Grade / Level:" : 'Öğrencinin Sınıfı / Düzeyi:'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PARENT_GRADE_OPTIONS.map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => {
                            setChildGradeInput(g.id);
                            setChildGradeLabel(isEn ? g.labelEn : g.label);
                          }}
                          className={`p-2 rounded-lg text-xs font-bold border transition-all text-left flex items-center justify-between ${
                            childGradeInput === g.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                              : 'bg-gray-800/60 border-gray-700/80 text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <span className="truncate">{isEn ? g.labelEn : g.label}</span>
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
                      {isEn
                        ? 'Weekly report card email preference (manual sharing available anytime from Parent Hub)'
                        : 'Haftalık karne e-posta tercihi (otomatik gönderim yakında; şimdilik veli panelinden manuel paylaşım)'}
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy || usernameInput.trim().length < 3 || (isParentAccountChecked && !childNameInput.trim())}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMethod === 'username' ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{isEn ? 'Saving...' : 'Kaydediliyor...'}</span>
                  </>
                ) : (
                  isParentAccountChecked
                    ? isEn ? '👨‍👩‍👧 Start Parent & Student Profile' : '👨‍👩‍👧 Veli & Öğrenci Profilini Başlat'
                    : isEn ? '🚀 Create Identity & Start' : '🚀 Kimliğimi Oluştur ve Başla'
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
