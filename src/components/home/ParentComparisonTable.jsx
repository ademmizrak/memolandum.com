"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const COMPARISON_ROWS_TR = [
  {
    feature: "1–8. Sınıf (İlkokul & Ortaokul / LGS) Müfredat Uyumu",
    desc: "Okul dersleri, yazılı sınavlar ve LGS ile birebir uyumlu ünite kelimeleri ve kalıp cümleleri.",
    memolandum: { status: "yes", text: "%100 Tam Uyumlu — 1–8. Sınıf (İlkokul & Ortaokul / LGS)" },
    courses: { status: "partial", text: "Genel İngilizce, okul sınavlarına tam odaklanmaz" },
    apps: { status: "no", text: "Okul müfredatından tamamen bağımsız yabancı içerik" },
  },
  {
    feature: "Haftalık Pedagojik Veli Karnesi",
    desc: "Öğrencinin ezberlediği kalıcı kelimeleri ve başarı oranını gösteren resmi karne.",
    memolandum: { status: "yes", text: "Tek tıkla başarı karnesi + WhatsApp/e-posta paylaşımı" },
    courses: { status: "partial", text: "Yalnızca dönem sonlarında sınırlı öğretmen geri bildirimi" },
    apps: { status: "no", text: "Veli takip paneli ve resmi başarı karnesi yok" },
  },
  {
    feature: "Stüdyo Telaffuz & Çocuk Fonetiği",
    desc: "Çocukların duyduğunu doğru telaffuz etmesini sağlayan net ve yavaş seslendirmeler.",
    memolandum: { status: "yes", text: "+10.000 Stüdyo Ses Kaydı (Çocuk Dostu Yavaş Ton)" },
    courses: { status: "partial", text: "Öğretmen telaffuzu (kalabalık sınıflarda sınırlı)" },
    apps: { status: "partial", text: "Hızlı, mekanik ve yapay robotik sesler" },
  },
  {
    feature: "Reklamsız & Güvenli Çocuk Ortamı",
    desc: "Çocuğun dikkatini dağıtmayan, harici reklam ve link içermeyen korunaklı platform.",
    memolandum: { status: "yes", text: "Reklamsız öğrenme deneyimi · KVKK odaklı tasarım" },
    courses: { status: "yes", text: "Fiziki sınıf ortamı" },
    apps: { status: "no", text: "Oyun ortası dikkat dağıtan reklamlar ve harici pop-up'lar" },
  },
  {
    feature: "Aralıklı Tekrar (Memolandum Pulse™)",
    desc: "Ebbinghaus unutma eğrisini kırarak kelimeleri refleks halinde kalıcı hafızaya aktarma.",
    memolandum: { status: "yes", text: "Bilimsel SM-2 Hafıza Algoritması" },
    courses: { status: "no", text: "Sınav sonrası unutulan klasik defter ezberi" },
    apps: { status: "partial", text: "Rastgele ve algoritmasız soru tekrarları" },
  },
  {
    feature: "Oyunlaştırılmış Dopamin Seviyeleri",
    desc: "Çocuğu ekrana zorla değil, eğlenerek kendi isteğiyle oturtan retro arcade formatı.",
    memolandum: { status: "yes", text: "8 Retro Arcade Oyunu & Kelime Kartları" },
    courses: { status: "no", text: "Sıkıcı test kağıtları ve ödev baskısı" },
    apps: { status: "partial", text: "Tekdüze ve çabuk sıkıcılaşan çoktan seçmeli testler" },
  },
  {
    feature: "Maliyet & Aile Bütçesi Uyumu",
    desc: "Kaliteli İngilizce eğitiminin her aile için ulaşılabilir olması.",
    memolandum: { status: "yes", text: "Premium ile AI çeviri; oyunlar ve seviyeler ücretsiz" },
    courses: { status: "no", text: "Aylık 4.000 TL - 10.000 TL Özel Ders / Kurs Masrafı" },
    apps: { status: "partial", text: "Pahalı döviz bazlı aylık abonelikler" },
  },
];

const COMPARISON_ROWS_EN = [
  {
    feature: "Grades 1–8 (Primary & Middle School / LGS) Curriculum Fit",
    desc: "Unit vocabulary and core phrases aligned directly with school classes, exams, and LGS.",
    memolandum: { status: "yes", text: "100% Aligned — Grades 1–8 (Primary & Middle School / LGS)" },
    courses: { status: "partial", text: "General English, not focused on school unit exams" },
    apps: { status: "no", text: "Generic foreign content unrelated to school curriculum" },
  },
  {
    feature: "Weekly Pedagogical Parent Report Card",
    desc: "Official report card showing mastered words, retention rate, and study streaks.",
    memolandum: { status: "yes", text: "One-click report card + WhatsApp/email sharing" },
    courses: { status: "partial", text: "Limited teacher feedback only at end of term" },
    apps: { status: "no", text: "No parent dashboard or official report card" },
  },
  {
    feature: "Studio Pronunciation & Child Phonetics",
    desc: "Clear, natural audio recordings that help students pronounce what they hear accurately.",
    memolandum: { status: "yes", text: "+10,000 Studio Audio Recordings (Child-Friendly Tone)" },
    courses: { status: "partial", text: "Teacher pronunciation (limited in crowded classes)" },
    apps: { status: "partial", text: "Fast, mechanical, and synthetic robotic voices" },
  },
  {
    feature: "Ad-Free & Child-Safe Environment",
    desc: "Protected platform with zero external ads, pop-ups, or distracting third-party links.",
    memolandum: { status: "yes", text: "Ad-free learning experience · Privacy-first design" },
    courses: { status: "yes", text: "Physical classroom environment" },
    apps: { status: "no", text: "Mid-game ads and distracting external pop-ups" },
  },
  {
    feature: "Spaced Repetition (Memolandum Pulse™)",
    desc: "Defeats Ebbinghaus's forgetting curve by moving vocabulary into reflex long-term memory.",
    memolandum: { status: "yes", text: "Scientific SM-2 Memory Algorithm" },
    courses: { status: "no", text: "Rote notebook memorization forgotten after exams" },
    apps: { status: "partial", text: "Random question repeats without spaced scheduling" },
  },
  {
    feature: "Gamified Dopamine Levels",
    desc: "Retro arcade format that motivates students to practice voluntarily with joy.",
    memolandum: { status: "yes", text: "8 Retro Arcade Games & Flashcards" },
    courses: { status: "no", text: "Tedious worksheets and homework pressure" },
    apps: { status: "partial", text: "Repetitive multiple-choice quizzes that get boring fast" },
  },
  {
    feature: "Cost & Family Budget Fit",
    desc: "Making high-quality language education accessible to every family.",
    memolandum: { status: "yes", text: "AI translate with Premium; all games & levels are free" },
    courses: { status: "no", text: "High monthly private tutoring / course fees" },
    apps: { status: "partial", text: "Expensive monthly subscriptions" },
  },
];

export default function ParentComparisonTable({ onOpenReport }) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const rows = isEn ? COMPARISON_ROWS_EN : COMPARISON_ROWS_TR;

  const renderStatus = (status, text) => {
    if (status === "yes") {
      return (
        <div className="flex items-start gap-2 text-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm font-bold text-emerald-300 leading-snug">
            {text}
          </span>
        </div>
      );
    }
    if (status === "partial") {
      return (
        <div className="flex items-start gap-2 text-start opacity-85">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-xs text-slate-300 leading-snug">
            {text}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 text-start opacity-70">
        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <span className="text-xs text-slate-400 leading-snug">
          {text}
        </span>
      </div>
    );
  };

  return (
    <section className="mb-14 scroll-mt-24">
      {/* Üst Başlık */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5" />{" "}
          <span>{isEn ? "Why Memolandum?" : "Neden Memolandum?"}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          {isEn
            ? "The Smartest Choice for Your Child's English Success"
            : "Çocuğunuzun İngilizce Başarısı İçin En Doğru Karar"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          {isEn
            ? "Compare our curriculum-aligned, parent-tracked learning ecosystem against expensive traditional courses and generic apps unrelated to school exams."
            : "Aylık binlerce liralık klasik kurslar veya okul sınavlarıyla ilgisi olmayan yabancı uygulamalar yerine; okul müfredatına tam uyumlu ve veli takipli yeni nesil eğitim ekosistemimizi karşılaştırın."}
        </p>
      </div>

      {/* Karşılaştırma Tablo Kartı */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md">
        {/* Tablo Başlık Satırı */}
        <div className="grid grid-cols-12 border-b border-slate-800 text-xs sm:text-sm font-black uppercase tracking-wider">
          <div className="col-span-5 sm:col-span-4 p-4 sm:p-5 bg-slate-900/60 text-slate-400 flex items-center">
            {isEn ? "Education & Tracking Criteria" : "Eğitim ve Takip Kriteri"}
          </div>
          <div className="col-span-4 sm:col-span-4 p-4 sm:p-5 bg-amber-500/10 border-x border-amber-500/30 text-amber-400 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Memolandum</span>
            </span>{" "}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              {isEn ? "2026-2027 Curriculum" : "2026-2027 Müfredat"}
            </span>
          </div>
          <div className="col-span-3 sm:col-span-2 p-3 sm:p-5 bg-slate-900/40 text-slate-400 flex items-center justify-center sm:justify-start text-center sm:text-left">
            <span>{isEn ? "Traditional Courses" : "Klasik Kurslar"}</span>
          </div>
          <div className="hidden sm:flex col-span-2 p-5 bg-slate-900/30 text-slate-400 items-center">
            {isEn ? "Other Apps" : "Diğer Uygulamalar"}
          </div>
        </div>

        {/* Karşılaştırma Satırları */}
        <div className="divide-y divide-slate-800/70">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 transition-colors hover:bg-slate-900/40 ${
                idx % 2 === 0 ? "bg-slate-950/40" : "bg-slate-900/20"
              }`}
            >
              {/* Kriter Adı & Açıklaması */}
              <div className="col-span-5 sm:col-span-4 p-3.5 sm:p-5 flex flex-col justify-center">
                <div className="text-xs sm:text-sm font-bold text-white">
                  {row.feature}
                </div>{" "}
                <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                  {row.desc}
                </p>
              </div>

              {/* Memolandum Sütunu (Vurgulu) */}
              <div className="col-span-4 sm:col-span-4 p-3.5 sm:p-5 bg-amber-500/5 border-x border-amber-500/20 flex items-center">
                {renderStatus(row.memolandum.status, row.memolandum.text)}
              </div>

              {/* Klasik Kurslar */}
              <div className="col-span-3 sm:col-span-2 p-3 sm:p-5 flex items-center justify-center sm:justify-start">
                {renderStatus(row.courses.status, row.courses.text)}
              </div>

              {/* Diğer Uygulamalar */}
              <div className="hidden sm:flex col-span-2 p-5 items-center">
                {renderStatus(row.apps.status, row.apps.text)}
              </div>
            </div>
          ))}
        </div>

        {/* Tablo Altı Veli Güven & Çağrı Çubuğu */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                {isEn
                  ? "Your Child Is Safe with Memolandum"
                  : "Memolandum ile Çocuğunuz Güvende"}
              </h4>
              <p className="text-xs text-slate-400">
                {isEn
                  ? "Start free without a credit card and track your child's progress every week with report cards."
                  : "Kredi kartı gerekmeden ücretsiz başlayın, çocuğunuzun başarısını her hafta karneyle izleyin."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center">
            <Link
              href="/veli-rehberi/"
              className="px-4 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all whitespace-nowrap"
            >
              {isEn ? "📖 1-Min Parent Guide" : "📖 1 Dk Veli Rehberi"}
            </Link>{" "}
            {onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                {isEn ? "📜 View Sample Report" : "📜 Örnek Karneyi Gör"}
              </button>
            )}{" "}
            <a
              href="#ilkokul-grades"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{isEn ? "Pick Grade & Start" : "Sınıfını Seç ve Başla"}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
