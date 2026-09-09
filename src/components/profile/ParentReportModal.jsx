"use client";

import React, { useState } from "react";
import {
  X,
  Share2,
  Download,
  Printer,
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Brain,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  downloadCertificateImage,
  getWhatsAppShareUrl,
} from "../../lib/reports/reportGenerator";

export default function ParentReportModal({ isOpen, onClose, reportData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !reportData) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      downloadCertificateImage(reportData);
    } catch (e) {
      console.error("Karne indirilirken hata:", e);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(reportData);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Memolandum Başarı Karnesi - ${reportData.studentName}`,
          text: `Öğrencimiz ${reportData.studentName}, ${reportData.curriculumName} kapsamındaki kelimeleri %${reportData.accuracyRate} başarıyla tamamladı!`,
          url: "https://memolandum.com",
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          handleWhatsApp();
        }
      }
    } else {
      handleWhatsApp();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Üst Başlık Barı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Öğrenci Başarı Karnesi & Veli Raporu
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Resmi Format
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Memolandum Pedagojik Ölçme ve Değerlendirme Sistemi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Karne İçerik Alanı (Görsel Kart) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0">
          {/* Sertifika / Karne Çerçevesi */}
          <div className="relative p-6 sm:p-8 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-950 shadow-inner">
            {/* Arka Plan Mührü */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-10 pointer-events-none">
              <Award className="w-36 h-36 text-amber-400" />
            </div>

            {/* Üst Küçük Başlık */}
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> 2026-2027 MEB Müfredatına Uyumlu
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-amber-400">
                MEMOLANDUM AKADEMİ
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5 tracking-wider uppercase">
                Gelişim ve Kalıcı Hafıza Belgesi
              </p>
            </div>

            {/* Öğrenci Bilgisi */}
            <div className="text-center my-6 py-4 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-xs sm:text-sm text-slate-400 italic">
                Bu başarı belgesi, düzenli İngilizce pratikleri ve kelime ezber refleksleriyle üstün gayret gösteren
              </p>
              <h4 className="text-xl sm:text-2xl font-black text-cyan-400 uppercase tracking-wide my-1.5">
                {reportData.studentName}
              </h4>
              <p className="text-xs sm:text-sm font-medium text-slate-300">
                adına, <span className="font-bold text-amber-300">{reportData.curriculumName}</span> çalışmalarının takdiri için tanzim edilmiştir.
              </p>
            </div>

            {/* İstatistik Metrikleri (3'lü Kart) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {reportData.permanentWords}
                </div>
                <div className="text-xs font-bold text-white mt-0.5">Kalıcı Hafızada</div>
                <div className="text-[10px] text-slate-400">Aralıklı tekrarla pekiştirildi</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-1">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  %{reportData.accuracyRate}
                </div>
                <div className="text-xs font-bold text-white mt-0.5">Başarı & Doğruluk</div>
                <div className="text-[10px] text-slate-400">Test & oyun başarı yüzdesi</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-1">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400">
                  {reportData.totalWords}
                </div>
                <div className="text-xs font-bold text-white mt-0.5">Toplam Kelime</div>
                <div className="text-[10px] text-slate-400">Aktif öğrenme havuzunda</div>
              </div>
            </div>

            {/* Pedagojik Veli Notu */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono uppercase mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Pedagojik Gelişim Notu & Veliye Tavsiye:
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {reportData.pedagogicalNote}
              </p>
            </div>

            {/* Karne Alt Bilgisi */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
              <div>
                <span className="font-semibold text-slate-300">Rapor Tarihi:</span> {reportData.reportDate}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">Memolandum Pedagoji Kurulu Onaylı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Alt Eylem Butonları */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            WhatsApp ile Paylaş
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "İndiriliyor..." : "Görsel Olarak İndir (PNG)"}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all hover:text-white cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Yazdır / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
