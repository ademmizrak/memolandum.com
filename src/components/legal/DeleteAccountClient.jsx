"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../Header";
import AuthModal from "../AuthModal";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { auth } from "../../lib/firebase/config";
import { deleteUserAccount, signInWithGoogle } from "../../lib/firebase/authService";

export default function DeleteAccountClient() {
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const profile = useMemolandumStore((s) => s.profile);

  const [mounted, setMounted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [error, setError] = useState("");

  const [reqEmail, setReqEmail] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [reqSent, setReqSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const needsPassword = () => {
    const user = auth?.currentUser;
    if (!user) return false;
    return (
      (user.providerData || []).some((p) => p.providerId === "password") &&
      !(user.providerData || []).some((p) => p.providerId === "google.com")
    );
  };

  const handleInstantDelete = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!deleteAck) {
      setError("Devam etmek için kalıcı silme onay kutusunu işaretleyin.");
      return;
    }
    if (needsPassword() && !password) {
      setError("E-posta/şifre hesabınızı doğrulamak için mevcut şifrenizi girin.");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteUserAccount(needsPassword() ? { password } : {});
      setDeletedSuccess(true);
    } catch (err) {
      const code = String(err?.code || err?.message || "");
      if (code.includes("password-required")) {
        setError("Lütfen hesap şifrenizi girin.");
      } else if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Girdiğiniz şifre hatalı.");
      } else if (code.includes("recent-login")) {
        setError("Güvenlik gereği yeniden giriş yapıp tekrar deneyin.");
      } else if (code.includes("popup-closed") || code.includes("cancelled")) {
        setError("Kimlik doğrulama işlemi iptal edildi.");
      } else {
        setError(
          err?.message ||
            "Hesap silme işlemi tamamlanamadı. Aşağıdaki e-posta formu ile info@memolandum.com üzerinden talep gönderebilirsiniz."
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmailRequest = (e) => {
    e.preventDefault();
    const targetEmail = (reqEmail || profile?.email || "").trim();
    if (!targetEmail) return;
    const subject = encodeURIComponent("Memolandum Hesap ve Veri Silme Talebi (Account Deletion Request)");
    const body = encodeURIComponent(
      `Merhaba Memolandum Ekibi,\n\nAşağıdaki e-posta adresine bağlı Memolandum hesabımın ve tüm kişisel verilerimin (Kelime Kasası, XP/skor ilerlemesi, Öğretmen Masası sınıfları ve kimlik doğrulama kayıtları) kalıcı olarak silinmesini talep ediyorum.\n\nHesap E-postası: ${targetEmail}\nEk Not: ${reqReason || "-"}\n`
    );
    window.location.href = `mailto:info@memolandum.com?subject=${subject}&body=${body}`;
    setReqSent(true);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest bg-red-500/15 text-red-300 border border-red-500/30 mb-3">
            Google Play Veri Güvenliği & KVKK / GDPR
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white m-0 mb-3 tracking-tight">
            Hesabımı ve Verilerimi Sil (Account & Data Deletion)
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed m-0">
            <strong className="text-slate-200">Memolandum (`com.memolandum.app`)</strong> kullanıcıları,
            hesaplarını ve ilişkili tüm bulut verilerini uygulama içinden (<em>Profil → Hesabımı ve Verilerimi Sil</em>)
            veya doğrudan bu sayfa üzerinden kalıcı olarak silebilirler.
          </p>
        </div>

        {/* Silinecek Veriler Özeti */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 mb-6">
          <h2 className="text-base font-black text-white m-0 mb-3">
            Silinen ve Saklanan Veri Kapsamı
          </h2>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-2 pl-5 m-0 list-disc leading-relaxed">
            <li>
              <strong>Anında Silinen Veriler:</strong> Firebase Authentication kimlik kaydınız (e-posta, Google/Apple UID),
              kullanıcı adı kaydınız (<code>usernames</code>), profil bilgileriniz (<code>users/&#123;uid&#125;</code>),
              <strong> Kelime Kasası (Word Vault)</strong> ve My Lexicon özel kelimeleriniz, XP / skor / liderlik tablosu
              verileriniz ve <strong>Öğretmen Masası (Teacher Desk)</strong> sınıflarınız.
            </li>
            <li>
              <strong>Yerel Cihaz Verileri:</strong> Oturum kapatıldığında tarayıcı/uygulama önbelleğindeki yerel çalışma
              kayıtları temizlenir.
            </li>
            <li>
              <strong>Saklama Süresi:</strong> Silme onayı verdiğiniz anda bulut verileriniz gerçek zamanlı olarak silinir;
              e-posta ile yapılan talepler en geç <strong>7 iş günü</strong> içinde sonuçlandırılır.
            </li>
          </ul>
        </section>

        {/* Yöntem 1: Oturum Açarak Anında Silme */}
        <section className="rounded-2xl border border-red-500/35 bg-gradient-to-b from-red-950/30 to-slate-950/90 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-black text-red-300 m-0 mb-2">
            1. Yöntem: Giriş Yaparak Hesabı Anında Sil
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0 mb-4">
            Hesabınıza giriş yaparak destek ekibini beklemeden tüm verilerinizi ve hesabınızı hemen silebilirsiniz.
          </p>

          {deletedSuccess ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-emerald-200 text-sm font-semibold">
              ✓ Hesabınız ve ilişkili tüm bulut verileriniz kalıcı olarak silindi.{" "}
              <Link href="/" className="underline text-white ml-1">
                Ana sayfaya dön
              </Link>
            </div>
          ) : !mounted ? (
            <div className="text-xs text-slate-400">Yükleniyor…</div>
          ) : !isAuthenticated ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm transition-colors cursor-pointer"
              >
                E-posta ile Giriş Yap ve Sil
              </button>
              <button
                type="button"
                onClick={() => {
                  signInWithGoogle().catch((e) => setError(e?.message || "Google girişi başarısız."));
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Google ile Giriş Yap ve Sil
              </button>
            </div>
          ) : (
            <form onSubmit={handleInstantDelete} className="space-y-4">
              <div className="rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-xs sm:text-sm text-slate-300">
                Aktif Oturum:{" "}
                <strong className="text-white">
                  {profile?.displayName || profile?.email || auth?.currentUser?.email || "Kullanıcı"}
                </strong>
              </div>

              {needsPassword() && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Güvenlik doğrulaması için mevcut şifreniz:
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Mevcut şifreniz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              )}

              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-red-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteAck}
                  onChange={(e) => setDeleteAck(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Anlıyorum: tüm ilerlemem, Kelime Kasası (Word Vault), Öğretmen Masası sınıflarım ve kişisel verilerim kalıcı olarak silinecek ve bu işlem geri alınamaz.
                </span>
              </label>

              {error && (
                <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 m-0">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isDeleting || !deleteAck}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isDeleting ? "Hesap ve Veriler Siliniyor…" : "Hesabımı ve Verilerimi Kalıcı Olarak Sil"}
              </button>
            </form>
          )}
        </section>

        {/* Yöntem 2: E-posta ile Silme Talebi (info@memolandum.com) */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-black text-white m-0 mb-2">
            2. Yöntem: E-posta ile Hesap Silme Talebi Gönder (`info@memolandum.com`)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed m-0 mb-4">
            Uygulamaya erişiminiz yoksa veya giriş yapamıyorsanız, hesabınıza kayıtlı e-posta adresini belirterek{" "}
            <a href="mailto:info@memolandum.com" className="text-cyan-400 underline">
              info@memolandum.com
            </a>{" "}
            adresine doğrudan silme talebi gönderebilirsiniz.
          </p>

          <form onSubmit={handleEmailRequest} className="space-y-3 max-w-md">
            <input
              type="email"
              required
              placeholder="Hesabınıza kayıtlı e-posta adresi"
              value={reqEmail}
              onChange={(e) => setReqEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
            />
            <textarea
              rows={2}
              placeholder="Ek açıklama (isteğe bağlı)"
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-colors cursor-pointer"
            >
              info@memolandum.com Adresine Silme Talebi Gönder
            </button>
            {reqSent && (
              <p className="text-xs text-emerald-300 m-0">
                E-posta istemciniz açıldı. Ayrıca doğrudan <strong>info@memolandum.com</strong> adresine e-posta gönderebilirsiniz.
              </p>
            )}
          </form>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <Link href="/legal/privacy/" className="hover:text-cyan-400 underline">
            Gizlilik Politikası
          </Link>
          <Link href="/legal/terms/" className="hover:text-cyan-400 underline">
            Kullanım Koşulları
          </Link>
          <Link href="/profile" className="hover:text-cyan-400 underline">
            Profil Sayfası
          </Link>
          <Link href="/" className="hover:text-cyan-400 underline">
            Ana Sayfa
          </Link>
        </div>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialView="login" />
    </div>
  );
}
