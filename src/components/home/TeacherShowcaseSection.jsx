"use client";

import React from "react";
import Link from "next/link";
import {
  School,
  Users,
  ShieldCheck,
  Lock,
  Sparkles,
  Award,
  Gamepad2,
  CheckCircle2,
  ArrowRight,
  PenTool,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function TeacherShowcaseSection() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <section className="mb-14 relative" aria-labelledby="teacher-showcase-title">
      {/* Arka plan ışıması */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/20 via-indigo-950/30 to-purple-950/20 rounded-3xl blur-2xl -z-10 pointer-events-none" />

      <div className="p-6 sm:p-10 rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 shadow-2xl backdrop-blur-xl space-y-8">
        {/* Üst Başlık ve Rozet */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />{" "}
              <span>
                {isEn
                  ? "Memolandum for Teachers & Schools"
                  : "Öğretmenler & Okullar İçin Memolandum"}
              </span>
            </div>
            <h2
              id="teacher-showcase-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight"
            >
              {isEn ? "Set Up Your Class in 30 Seconds," : "Sınıfınızı 30 Saniyede Kurun,"}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300">
                {isEn
                  ? "Manage Student Progress & Grades"
                  : "Öğrenci Gelişimini ve Notları"}
              </span>{" "}
              {isEn ? "in One Place" : "Tek Yerden Yönetin"}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {isEn
                ? "No complex alphanumeric codes or bureaucracy. Open a class immediately with a memorable 6-digit PIN for your school, single classroom, or private study group."
                : "Karmaşık harf-rakam kodları veya bürokrasi yok. İster resmi okulunuz, ister sadece tek sınıfınız veya özel etüt grubunuz için akılda kalıcı 6 haneli PIN ile hemen sınıf açın."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/schools?tab=dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              <span>{isEn ? "Open Teacher Desk" : "Öğretmen Masasına Başla"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>{" "}
            <Link
              href="/schools/rehber/"
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-sm transition-all whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? "Teacher Security & Guide" : "Güvenlik & Kullanım Rehberi"}</span>
            </Link>
          </div>
        </div>

        {/* %100 Öğretmen Mahremiyeti Güvence Kutusu */}
        <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  {isEn
                    ? "100% Teacher Privacy Guarantee"
                    : "%100 Öğretmen Mahremiyeti Garantisi"}
                </span>{" "}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isEn ? "Privacy Protected" : "Gizlilik Korumalı"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {isEn ? (
                  <>
                    Personal observation notes and exam scores you keep about your students are stored{" "}
                    <strong className="text-white">exclusively on the teacher screen</strong>. They are never shared with parents or students unless you explicitly enable sharing.
                  </>
                ) : (
                  <>
                    Öğrenciniz hakkında tuttuğunuz kişisel gözlem/fikir notları ve yazılı sınav puanları{" "}
                    <strong className="text-white">yalnızca öğretmen ekranında</strong> saklanır. Siz paylaşımı açmadığınız sürece veli veya öğrenciyle asla paylaşılmaz.
                  </>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/schools/rehber/"
            className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 px-3.5 py-2 rounded-xl border border-emerald-500/30 whitespace-nowrap self-end sm:self-center transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{" "}
            <span>{isEn ? "Read Security Guide →" : "Nasıl Koruyoruz? İncele →"}</span>
          </Link>
        </div>

        {/* 4 Ana Özellik Kartı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kart 1: Esnek Kurulum */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <School className="w-5 h-5" />
              </div>
              <h3 className="font-black text-white text-base group-hover:text-cyan-300 transition-colors">
                {isEn ? "1-Minute Flexible Setup" : "1 Dakikada Esnek Kurulum"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isEn
                  ? "Whether School + Class, single Classroom, or Independent Study Group — create instantly with a clean 6-digit PIN or custom code."
                  : "İster Okul + Sınıf, ister sadece Sınıf ya da Bağımsız Grup. Sade 6 haneli PIN veya kendi belirleyeceğiniz özel kod ile anında oluşturun."}
              </p>
            </div>
            <div className="text-[11px] font-mono text-cyan-400/90 font-bold flex items-center gap-1 pt-2 border-t border-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5" />{" "}
              <span>{isEn ? "Zero code confusion" : "Harf karmaşası yok"}</span>
            </div>
          </div>

          {/* Kart 2: Fikir Defteri */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="font-black text-white text-base group-hover:text-purple-300 transition-colors">
                {isEn ? "Teacher Observation Journal" : "Öğretmen Fikir Defteri"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isEn
                  ? "Keep private pedagogical notes up to 3,000 characters per student tagged with 'Word Reflex', 'Class Participation', or 'Parent Contact'."
                  : "Her öğrenci için \"Kelime Refleksi\", \"Derse Katılım\" veya \"Veli İletişimi\" etiketli 3.000 karaktere kadar kişisel pedagojik notlar alın."}
              </p>
            </div>
            <div className="text-[11px] font-mono text-purple-400/90 font-bold flex items-center gap-1 pt-2 border-t border-slate-900">
              <Lock className="w-3.5 h-3.5" />{" "}
              <span>{isEn ? "Visible only to you" : "Sadece siz görürsünüz"}</span>
            </div>
          </div>

          {/* Kart 3: Sınav & Not Takibi */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-black text-white text-base group-hover:text-amber-300 transition-colors">
                {isEn ? "Exam & Quiz Gradebook" : "1. & 2. Yazılı ve Quiz Notları"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isEn
                  ? "Enter school exam scores, quizzes, and unit completion reflexes in a single table. You control one-click parent sharing."
                  : "Okul sınav puanlarını, quizleri ve ünite tamamlama reflekslerini tek tabloda girin. İhtiyaç halinde tek tıkla veliyle paylaşma kontrolü sizde."}
              </p>
            </div>
            <div className="text-[11px] font-mono text-amber-400/90 font-bold flex items-center gap-1 pt-2 border-t border-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5" />{" "}
              <span>{isEn ? "Fast grade entry" : "Hızlı not girişi"}</span>
            </div>
          </div>

          {/* Kart 4: Akıllı Tahta Arcade */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-white text-base group-hover:text-emerald-300 transition-colors">
                {isEn ? "Smartboard & Arcade Games" : "Akıllı Tahta & Arcade Oyunlar"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isEn
                  ? "Launch Memolandum retro games on a projector or smartboard; turn lessons into an engaging classroom tournament."
                  : "Projeksiyonda veya akıllı tahtada Memolandum retro oyunlarını açın; sınıf içi tatlı bir yarış başlatarak dersi eğlence şölenine dönüştürün."}
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400/90 font-bold flex items-center gap-1 pt-2 border-t border-slate-900">
              <Sparkles className="w-3.5 h-3.5" />{" "}
              <span>{isEn ? "Smartboard ready" : "Projeksiyon uyumlu"}</span>
            </div>
          </div>
        </div>

        {/* Canlı Önizleme / Mockup Görünümü */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-inner space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg">
                🦉
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {isEn ? "Atatürk Primary / Middle School" : "Atatürk İlkokulu / Ortaokulu"}
                  </span>{" "}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {isEn ? "4-B English" : "4-B İngilizce"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {isEn ? "Teacher Desk Sample View" : "Öğretmen Masası Örnek Görünümü"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400">
                {isEn ? "Class PIN Code: " : "Sınıf PIN Kodu: "}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/40 tracking-widest shadow-sm">
                682419
              </span>
            </div>
          </div>

          {/* Örnek Öğrenci Tablosu */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                  <th className="py-2 px-3 font-semibold">{isEn ? "Student" : "Öğrenci"}</th>
                  <th className="py-2 px-3 font-semibold text-center">{isEn ? "Exam 1" : "1. Yazılı"}</th>
                  <th className="py-2 px-3 font-semibold text-center">{isEn ? "Exam 2" : "2. Yazılı"}</th>
                  <th className="py-2 px-3 font-semibold text-center">Quiz</th>
                  <th className="py-2 px-3 font-semibold">
                    {isEn ? "Teacher Private Journal" : "Öğretmen Özel Fikir Defteri"}
                  </th>
                  <th className="py-2 px-3 font-semibold text-right">{isEn ? "Status" : "Durum"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                        AY
                      </span>{" "}
                      <span className="font-bold text-white">Ali Yılmaz</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      95
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      92
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      100
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/30 text-purple-200 text-[11px] max-w-xs truncate">
                      <Lock className="w-3 h-3 text-purple-400 shrink-0" />{" "}
                      <span className="truncate">
                        {isEn
                          ? "\"Excellent pronunciation speed, ready for contests.\""
                          : "\"Kelime telaffuz hızı fevkalade, yarışmalara hazır.\""}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {isEn ? "Active" : "Aktif"}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-xs border border-pink-500/30">
                        ZK
                      </span>{" "}
                      <span className="font-bold text-white">Zeynep Kaya</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      88
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      85
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      90
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/30 text-purple-200 text-[11px] max-w-xs truncate">
                      <Lock className="w-3 h-3 text-purple-400 shrink-0" />{" "}
                      <span className="truncate">
                        {isEn
                          ? "\"Reviewed Unit 3 key sentence patterns.\""
                          : "\"Ünite 3 kalıp cümleleri tekrar edildi.\""}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {isEn ? "Active" : "Aktif"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isEn
                  ? "Teacher Desk Live & Cloud Synced"
                  : "Öğretmen Masası Canlı & Bulut Senkronize"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/profile"
                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
              >
                {isEn ? "Manage from Profile →" : "Profilinizden Yönetin →"}
              </Link>{" "}
              <Link
                href="/schools?tab=dashboard"
                className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
              >
                {isEn ? "Open Your Class Now →" : "Sınıfınızı Şimdi Açın →"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
