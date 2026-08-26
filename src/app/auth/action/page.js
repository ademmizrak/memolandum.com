'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../../lib/firebase/config';
import { completePasswordReset, logAccountSecurityEvent } from '../../../lib/firebase/authService';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import Link from 'next/link';

function AuthActionContent() {
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');
  const flow = searchParams.get('flow'); // continueUrl işaretçisi: verifyEmail | passwordReset

  const [status, setStatus] = useState('loading');
  // loading | welcome | resetForm | resetDone | continueOk | error
  const [errorMsg, setErrorMsg] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [continueKind, setContinueKind] = useState(flow || 'verifyEmail');

  useEffect(() => {
    const run = async () => {
      // Firebase varsayılan handler (/__/auth/action) işlemi bitirip continueUrl’ye yönlendirdiğinde
      // genelde mode/oobCode yoktur; sadece ?flow= gelir.
      if (!mode && !actionCode && flow) {
        setContinueKind(flow);
        if (flow === 'passwordReset') {
          setStatus('continueOk');
          return;
        }
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
            const store = useMemolandumStore.getState();
            store.setAuthUser(auth.currentUser);
            store.setIsEmailVerified(!!auth.currentUser.emailVerified);
            if (auth.currentUser.emailVerified) {
              await logAccountSecurityEvent(auth.currentUser.uid, 'email_verified');
            }
          } catch {
            /* ignore */
          }
        }
        setStatus(auth.currentUser?.emailVerified ? 'welcome' : 'continueOk');
        return;
      }

      if (mode === 'resetPassword') {
        if (!actionCode) {
          setErrorMsg('Geçersiz veya eksik sıfırlama bağlantısı.');
          setStatus('error');
          return;
        }
        setStatus('resetForm');
        return;
      }

      // verifyEmail — doğrudan oobCode ile gelindiyse (özel action URL)
      try {
        if (actionCode && (mode === 'verifyEmail' || mode === 'recoverEmail' || !mode)) {
          await applyActionCode(auth, actionCode);
        }

        if (auth.currentUser) {
          await auth.currentUser.reload();
          const store = useMemolandumStore.getState();
          store.setAuthUser(auth.currentUser);
          store.setIsEmailVerified(!!auth.currentUser.emailVerified);
          if (auth.currentUser.emailVerified) {
            await logAccountSecurityEvent(auth.currentUser.uid, 'email_verified');
          }
        }
        setStatus('welcome');
      } catch (error) {
        console.warn('Email verification note:', error?.code || error);
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
          } catch {
            /* ignore */
          }
          const store = useMemolandumStore.getState();
          store.setAuthUser(auth.currentUser);
          store.setIsEmailVerified(!!auth.currentUser.emailVerified);
          if (auth.currentUser.emailVerified) {
            setStatus('welcome');
            return;
          }
        }
        const code = error?.code || '';
        if (code === 'auth/expired-action-code') {
          setErrorMsg('Doğrulama bağlantısının süresi dolmuş. Giriş yapıp e-postayı yeniden isteyin.');
        } else if (code === 'auth/invalid-action-code') {
          setErrorMsg('Bağlantı geçersiz veya daha önce kullanılmış.');
        } else {
          setErrorMsg('Doğrulama tamamlanamadı. Giriş yapıp tekrar deneyin.');
        }
        setStatus('error');
      }
    };

    run();
  }, [mode, actionCode, flow]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Şifreler eşleşmiyor.');
      return;
    }
    try {
      setSaving(true);
      const result = await completePasswordReset(actionCode, newPassword);
      setResetEmail(result?.email || '');
      setStatus('resetDone');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/expired-action-code') {
        setErrorMsg('Bağlantının süresi dolmuş. Profil veya giriş ekranından yeniden isteyin.');
      } else if (code === 'auth/invalid-action-code') {
        setErrorMsg('Bağlantı geçersiz veya daha önce kullanılmış.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Şifre çok zayıf. En az 6 karakter kullanın.');
      } else {
        setErrorMsg(err?.message || 'Şifre güncellenemedi. Tekrar deneyin.');
      }
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b101a] via-slate-950 to-[#0b101a] flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl shadow-[0_0_80px_rgba(34,197,94,0.25)] w-full max-w-lg p-8 md:p-10 text-center relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {status === 'loading' && (
          <div className="py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-400 mx-auto mb-6 shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
            <h2 className="text-xl font-bold text-white mb-2">İŞLEM DOĞRULANIYOR...</h2>
            <p className="text-sm text-gray-400">Lütfen bekleyin.</p>
          </div>
        )}

        {status === 'continueOk' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-400/60 rounded-3xl flex items-center justify-center text-4xl">
              ✅
            </div>
            <h1 className="text-2xl font-black text-white">
              {continueKind === 'passwordReset' ? 'Şifre işlemi tamam' : 'E-posta işlemi tamam'}
            </h1>
            <p className="text-sm text-gray-400">
              {continueKind === 'passwordReset'
                ? 'Yeni şifreniz kaydedildiyse artık giriş yapabilirsiniz.'
                : 'E-posta bağlantısı işlendi. Gerekirse sayfayı yenileyip giriş yapın.'}
            </p>
            <Link
              href="/profile/"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm rounded-2xl text-center"
            >
              Profile git
            </Link>
          </div>
        )}

        {status === 'resetForm' && (
          <div className="text-left">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyan-500/15 border border-cyan-400/40 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🔐
              </div>
              <h1 className="text-2xl font-black text-white">Yeni Şifre Belirle</h1>
              <p className="text-sm text-gray-400 mt-2">
                E-postanızdaki bağlantı doğrulandı. Hesabınız için yeni bir şifre seçin.
              </p>
            </div>
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-300 p-3 rounded-xl text-sm mb-4 text-center">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleResetSubmit} className="space-y-3">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Yeni şifre (min. 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                required
                minLength={6}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Yeni şifre (tekrar)"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm rounded-2xl disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        )}

        {status === 'resetDone' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-400/60 rounded-3xl flex items-center justify-center text-4xl">
              ✅
            </div>
            <h1 className="text-2xl font-black text-white">Şifreniz güncellendi</h1>
            <p className="text-sm text-gray-400">
              {resetEmail
                ? `${resetEmail} hesabınız için yeni şifre kaydedildi. Şimdi giriş yapabilirsiniz.`
                : 'Yeni şifreniz kaydedildi. Şimdi giriş yapabilirsiniz.'}
            </p>
            <Link
              href="/profile/"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm rounded-2xl text-center"
            >
              Profil / Giriş
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-400/40 rounded-2xl flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h1 className="text-xl font-black text-white">İşlem tamamlanamadı</h1>
            <p className="text-sm text-red-300">{errorMsg || 'Bağlantı geçersiz.'}</p>
            <Link
              href="/profile/"
              className="w-full py-3 bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-sm rounded-2xl text-center"
            >
              Profile dön / yeniden iste
            </Link>
          </div>
        )}

        {status === 'welcome' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-400/60 rounded-3xl flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              🎉
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
              ✨ MEMOLANDUM SİBER ÜYELİK AKTİF
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
              MEMOLANDUM.COM&apos;A <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                HOŞ GELDİNİZ!
              </span>
            </h1>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left w-full text-xs leading-relaxed text-slate-300 flex flex-col gap-2">
              <p className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                👏 TEBRİKLER! ÜYELİĞİNİZ BAŞARIYLA ONAYLANDI.
              </p>
              <p className="text-gray-400">
                Aramıza katıldığınız için tebrik ederiz! Artık tüm dillerdeki kelime dağarcığı geliştirme kasası, arcade oyun modları ve siber analitik paneliniz hizmetinizdedir.
              </p>
              <p className="text-cyan-400 text-[11px]">
                🔒 Hesabınız bu cihazda kalıcı olarak açık kalacaktır. Kendi isteğinizle çıkış yapmadığınız sürece sistemden atılmazsınız.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
              <Link
                href="/vocabulary"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-sm rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
              >
                <span>🚀 KELİME KASASINA GİT</span>
              </Link>
              <Link
                href="/"
                className="w-full py-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-gray-300 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <span>🏠 ANASAYFA</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b101a] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500" />
        </div>
      }
    >
      <AuthActionContent />
    </Suspense>
  );
}
