'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle, registerWithEmail, loginWithEmail, setUsername, checkUsernameAvailability } from '../lib/firebase/authService';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { sendEmailVerification } from 'firebase/auth';
import { useAnalytics } from '../hooks/useAnalytics';

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  // 'login', 'register', 'verify', 'username'
  const [view, setView] = useState(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const { trackSignUp, trackLogin } = useAnalytics();
  
  const { profile, isAuthenticated, isEmailVerified } = useMemolandumStore();

  useEffect(() => {
    if (initialView === 'login' || initialView === 'register') {
      setView(initialView);
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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg('Google hesabına yönlendiriliyorsunuz…');
      const user = await signInWithGoogle();
      // Redirect akışında user null döner — sayfa Google'a gider
      if (!user) return;
      // Google ile başarılı giriş/kayıt conversion event
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
      setError(err.message || 'Bir hata oluştu.');
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
      const { auth } = require('../lib/firebase/config');
      if (auth.currentUser) {
        const actionCodeSettings = {
          url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        };
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setSuccessMsg("Doğrulama e-postası tekrar gönderildi.");
      }
    } catch (err) {
      setError("E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden"
        style={{ width: '100%', maxWidth: '450px' }}
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
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors mb-6 disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google ile Devam Et
            </button>

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

        {/* View: Set Username */}
        {view === 'username' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Sizi Nasıl Çağıralım?</h2>
              <p className="text-gray-400 text-sm">
                Liderlik tablosunda görünecek eşsiz kullanıcı adınızı belirleyin.
              </p>
            </div>
            <form onSubmit={handleSetUsername} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Kullanıcı Adı"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_ çÇğĞıİöÖşŞüÜ.-]/g, ''))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-2">Sadece harf, rakam ve alt çizgi (_) kullanabilirsiniz.</p>
              </div>
              <button
                type="submit"
                disabled={loading || usernameInput.length < 3}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Kontrol Ediliyor...' : 'Kaydet ve Başla'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
