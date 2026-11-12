"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Volume2,
  Flame,
  Heart,
  ShieldCheck,
  UserPlus,
  Edit3,
  Copy,
  Check,
  Mail,
  ExternalLink,
  AlertTriangle,
  Shuffle,
  School,
  Bell,
  Send,
} from "lucide-react";
import {
  calculateParentReportData,
  downloadCertificateImage,
  downloadPrintableFridgeSheet,
  getWhatsAppShareUrl,
  getWhatsAppParentBondMessage,
  getParentDigestMailto,
  getParentFeedbackMailto,
} from "../../lib/reports/reportGenerator";
import {
  submitParentFeedbackTicket,
  fetchMyParentFeedbackTickets,
} from "../../lib/reports/feedbackService";
import { shareContent } from "../../utils/platform";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import WeakWordsModal from "../learning/WeakWordsModal";

const GRADE_OPTIONS = [
  { id: "meb-1-sinif-kelimeleri", label: "1. Sınıf İngilizce", path: "/learn/en-tr/meb-1-sinif-kelimeleri/" },
  { id: "meb-2-sinif-kelimeleri", label: "2. Sınıf İngilizce", path: "/learn/en-tr/meb-2-sinif-kelimeleri/" },
  { id: "meb-3-sinif-kelimeleri", label: "3. Sınıf İngilizce", path: "/learn/en-tr/meb-3-sinif-kelimeleri/" },
  { id: "meb-4-sinif-kelimeleri", label: "4. Sınıf İngilizce", path: "/learn/en-tr/meb-4-sinif-kelimeleri/" },
  { id: "meb-5-sinif-kelimeleri", label: "5. Sınıf Ortaokul İngilizce", path: "/learn/en-tr/meb-5-sinif-kelimeleri/" },
  { id: "meb-6-sinif-kelimeleri", label: "6. Sınıf Ortaokul İngilizce", path: "/learn/en-tr/meb-6-sinif-kelimeleri/" },
  { id: "meb-7-sinif-kelimeleri", label: "7. Sınıf Ortaokul İngilizce", path: "/learn/en-tr/meb-7-sinif-kelimeleri/" },
  { id: "meb-8-sinif-kelimeleri", label: "8. Sınıf & LGS İngilizce", path: "/learn/en-tr/meb-8-sinif-kelimeleri/" },
  { id: "genel-sinav", label: "YDS & YÖKDİL Sınav Hazırlık", path: "/learn/en-tr/ingilizce-yds-kelimeleri-yds-top500-master/" },
];

export default function ParentReportModal({
  isOpen,
  onClose,
  reportData: externalReportData,
  initialTab = "report",
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "report");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCustomizeBar, setShowCustomizeBar] = useState(false);
  const [customStudentName, setCustomStudentName] = useState("");
  const [customGradeId, setCustomGradeId] = useState("meb-2-sinif-kelimeleri");
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Evde 3 Kelime Sor (Aile Etkinliği) state'leri
  const [quizOffset, setQuizOffset] = useState(0);
  const [knownQuizWords, setKnownQuizWords] = useState({});

  // WhatsApp & İletişim Şablonları state'leri
  const [selectedTone, setSelectedTone] = useState("praise");
  const [customBondMessage, setCustomBondMessage] = useState("");
  const [copiedBond, setCopiedBond] = useState(false);

  // Veli Geri Bildirim state'leri
  const [feedbackTopic, setFeedbackTopic] = useState("Müfredat / Ünite Talebi");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessTicket, setFeedbackSuccessTicket] = useState(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [myTickets, setMyTickets] = useState([]);

  // Zayıf Kelime Modalı
  const [weakModalOpen, setWeakModalOpen] = useState(false);

  const audioRef = useRef(null);

  // Store bağlantıları
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const globalStats = useMemolandumStore((s) => s.globalStats);
  const profile = useMemolandumStore((s) => s.profile);
  const activeStudyProfile = useMemolandumStore((s) => s.getActiveStudyProfile?.() || null);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const childrenProfiles = useMemolandumStore((s) => s.childrenProfiles) || [];
  const activeChildId = useMemolandumStore((s) => s.activeChildId);
  const setActiveChild = useMemolandumStore((s) => s.setActiveChild);
  const addChildProfile = useMemolandumStore((s) => s.addChildProfile);
  const parentEmailDigest = useMemolandumStore((s) => s.parentEmailDigest);
  const setParentEmailDigest = useMemolandumStore((s) => s.setParentEmailDigest);
  const joinedClassroom = useMemolandumStore((s) => s.joinedClassroom);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
    if (isOpen) {
      fetchMyParentFeedbackTickets()
        .then((list) => setMyTickets(list))
        .catch(() => {});
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onBack = (e) => {
      e.preventDefault();
      onClose?.();
    };
    window.addEventListener("mm:hardware-back", onBack);
    return () => window.removeEventListener("mm:hardware-back", onBack);
  }, [isOpen, onClose]);

  const activeChild = useMemo(() => {
    return (
      childrenProfiles.find((c) => c && c.id === activeChildId) ||
      childrenProfiles[0] ||
      null
    );
  }, [childrenProfiles, activeChildId]);

  // Canlı karne verisi (hem store'dan hem de anlık isim/sınıf düzenlemesinden beslenir)
  const reportData = useMemo(() => {
    const selectedGradeObj = GRADE_OPTIONS.find((g) => g.id === customGradeId);
    const effectiveChild = customStudentName.trim()
      ? {
          ...(activeChild || {}),
          name: customStudentName.trim(),
          grade: customGradeId,
          gradeLabel: selectedGradeObj?.label || activeChild?.gradeLabel || "İlkokul İngilizce",
        }
      : activeChild;

    const computed = calculateParentReportData({
      vocabularyVault,
      quizHistory,
      globalStats,
      profile,
      activeStudyProfile,
      lastPlayedLevel: effectiveChild?.grade || lastPlayedLevel || "meb-2-sinif-kelimeleri",
      selectedChild: effectiveChild,
      joinedClassroom,
    });

    if (externalReportData && !customStudentName.trim() && !activeChild) {
      return {
        ...computed,
        ...externalReportData,
        dailyActivity7: externalReportData.dailyActivity7 || computed.dailyActivity7,
        masteredWordsList: externalReportData.masteredWordsList || computed.masteredWordsList,
        weakWordsList: externalReportData.weakWordsList || computed.weakWordsList,
        familyQuizPool: externalReportData.familyQuizPool || computed.familyQuizPool,
        joinedClassroom: externalReportData.joinedClassroom || computed.joinedClassroom,
      };
    }
    return computed;
  }, [
    vocabularyVault,
    quizHistory,
    globalStats,
    profile,
    activeStudyProfile,
    lastPlayedLevel,
    activeChild,
    joinedClassroom,
    customStudentName,
    customGradeId,
    externalReportData,
  ]);

  // Şablon mesajını güncelle
  useEffect(() => {
    if (!reportData) return;
    setCustomBondMessage(getWhatsAppParentBondMessage(reportData, selectedTone));
  }, [reportData, selectedTone]);

  if (!isOpen || !reportData) return null;

  // Sesli telaffuz çalma (Normal ve Yavaş Heceleme Modu)
  const playWordAudio = (wordObj, slow = false) => {
    if (!wordObj) return;
    if (!slow && wordObj.audioUrl && audioRef.current) {
      audioRef.current.src = wordObj.audioUrl;
      audioRef.current.playbackRate = 1.0;
      audioRef.current.play().catch(() => {});
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window && wordObj.english) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(wordObj.english);
      u.lang = "en-US";
      u.rate = slow ? 0.58 : 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  // Evde 3 Kelime Sor listesi
  const pool = Array.isArray(reportData.familyQuizPool) ? reportData.familyQuizPool : [];
  const currentQuizTrio = [];
  if (pool.length > 0) {
    for (let i = 0; i < Math.min(3, pool.length); i++) {
      currentQuizTrio.push(pool[(quizOffset + i) % pool.length]);
    }
  }
  const knownCount = currentQuizTrio.filter((w) => knownQuizWords[w.english]).length;

  // Sınıfın doğrudan ders linki
  const targetGradeOption =
    GRADE_OPTIONS.find((g) => g.id === (activeChild?.grade || customGradeId)) ||
    GRADE_OPTIONS.find((g) => g.label === reportData.curriculumName) ||
    GRADE_OPTIONS[1];

  const handleSaveAsChildProfile = (e) => {
    e?.preventDefault?.();
    const nameToSave = (customStudentName.trim() || reportData.studentName || "Öğrenci").trim();
    const matchedGrade = GRADE_OPTIONS.find((g) => g.id === customGradeId) || GRADE_OPTIONS[1];
    addChildProfile({
      name: nameToSave,
      grade: matchedGrade.id,
      gradeLabel: matchedGrade.label,
      dailyTarget: 15,
    });
    setCustomStudentName("");
    setShowCustomizeBar(false);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

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

  const handleDownloadFridgeSheet = () => {
    try {
      downloadPrintableFridgeSheet(reportData);
    } catch (e) {
      console.error("Buzdolabı fişi indirilirken hata:", e);
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(reportData);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendBondWhatsApp = () => {
    const text = customBondMessage || getWhatsAppParentBondMessage(reportData, selectedTone);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyBondMessage = async () => {
    const text = customBondMessage || getWhatsAppParentBondMessage(reportData, selectedTone);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBond(true);
      setTimeout(() => setCopiedBond(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const handleNativeShare = async () => {
    const title = reportData.isSample
      ? `Memolandum Örnek Karnesi - ${reportData.studentName}`
      : `Memolandum Başarı Karnesi - ${reportData.studentName}`;
    const text = reportData.isSample
      ? `Örnek karne önizlemesi: ${reportData.studentName} için henüz ölçülebilir çalışma kaydı yok. Pratik sonrası gerçek karne oluşur.`
      : `Öğrencimiz ${reportData.studentName}, ${reportData.curriculumName} kapsamındaki kelimeleri %${reportData.accuracyRate} başarıyla tamamladı!`;

    const result = await shareContent({
      title,
      text,
      url: "https://memolandum.com",
      dialogTitle: "Veli Başarı Karnesini Paylaş",
    });

    if (!result.shared && !result.cancelled) {
      handleWhatsApp();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <audio ref={audioRef} className="hidden" />
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[94vh]">
        {/* Modal Üst Başlık Barı */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-800 bg-slate-950/90 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-lg font-black text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="truncate">Veli Başarı Karnesi & Aile İletişim Merkezi</span>
                {reportData.isSample ? (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Örnek Önizleme
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Canlı Veri
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {reportData.isSample
                  ? "Çocuğunuzun adını ve sınıfını seçerek karneyi kişiselleştirin veya 5 dk pratikle gerçek metrikleri başlatın."
                  : "Memolandum Pedagojik Ölçme, Aralıklı Tekrar ve Aile İletişim Sistemi"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="/veli-rehberi/"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-bold transition-colors"
              title="1 Dakikalık Basit Veli Rehberini Aç"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Rehber</span>
              <span className="hidden sm:inline">1 Dk Veli Rehberi</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Çocuk Seçici & Hızlı Karne Kişiselleştirme Şeridi */}
        <div className="px-3.5 sm:px-6 py-2.5 bg-slate-900/95 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              👦 Öğrenci:
            </span>
            {childrenProfiles.length > 0 ? (
              childrenProfiles.map((child) => {
                const isSelected = activeChild?.id === child.id && !customStudentName.trim();
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setCustomStudentName("");
                      setActiveChild(child.id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                        : "bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <span>{child.name}</span>
                    <span className="text-[10px] opacity-75">
                      ({child.gradeLabel?.split(" ")[0] || "Okul"})
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs font-extrabold text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
                {reportData.studentName} · {reportData.curriculumName}
              </span>
            )}

            {profileSavedToast && (
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                ✓ Çocuk profili kaydedildi!
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomizeBar((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
          >
            {childrenProfiles.length === 0 ? (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Çocuğumun Adını & Sınıfını Gir</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Yeni Çocuk / Sınıf Seç</span>
              </>
            )}
          </button>
        </div>

        {/* Açılır Hızlı Öğrenci & Sınıf Kişiselleştirme Formu */}
        {showCustomizeBar && (
          <form
            onSubmit={handleSaveAsChildProfile}
            className="px-3.5 sm:px-6 py-3.5 bg-indigo-950/40 border-b border-amber-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 print:hidden"
          >
            <div className="flex-1">
              <input
                type="text"
                value={customStudentName}
                onChange={(e) => setCustomStudentName(e.target.value)}
                placeholder="Çocuğunuzun adı veya rumuzu (Örn: Zeynep, Kerem)..."
                maxLength={36}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none"
              />
            </div>
            <div className="sm:w-56">
              <select
                value={customGradeId}
                onChange={(e) => setCustomGradeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/20"
              >
                ✓ Karnede Uygula & Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizeBar(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </form>
        )}

        {/* 3 Ana Sekme Navigasyonu (Mobil Tam Uyumlu) */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 px-1.5 sm:px-6 pt-2 gap-1 sm:gap-1.5 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-t-xl text-[11px] sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeTab === "report"
                ? "border-amber-400 text-amber-300 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 hidden xs:inline sm:inline" />
            <span className="sm:hidden">📜 Karne</span>
            <span className="hidden sm:inline truncate">📜 Başarı Karnesi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bond")}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-t-xl text-[11px] sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeTab === "bond"
                ? "border-emerald-400 text-emerald-300 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 hidden xs:inline sm:inline" />
            <span className="sm:hidden">💬 3 Kelime</span>
            <span className="hidden sm:inline truncate">💬 Evde 3 Kelime & Mesaj</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("club")}
            className={`relative flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-t-xl text-[11px] sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeTab === "club"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 hidden xs:inline sm:inline" />
            <span className="sm:hidden">🤝 İletişim</span>
            <span className="hidden sm:inline truncate">🤝 Aile Kulübü & İletişim</span>
            {myTickets.some((t) => t.adminReply) && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-500 text-slate-950 animate-pulse">
                Yanıt Var
              </span>
            )}
          </button>
        </div>

        {/* Sekme İçerik Alanı */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-6 print:p-0 flex-1">
          {/* ============================================================== */}
          {/* SEKME 1: RESMİ BAŞARI KARNESİ & DETAYLI KELİME ANALİZİ         */}
          {/* ============================================================== */}
          {activeTab === "report" && (
            <>
              <div className="relative p-5 sm:p-7 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-950 shadow-inner">
                {/* Arka Plan Mührü */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-10 pointer-events-none">
                  <Award className="w-32 h-32 text-amber-400" />
                </div>

                {/* Üst Küçük Başlık */}
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />{" "}
                    {reportData.isSample
                      ? "Örnek Önizleme — 5 Dk Oyun Sonrası Canlı Veri Oluşur"
                      : "2026-2027 Okul Müfredatına Uyumlu Başarı Belgesi"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-amber-400">
                    MEMOLANDUM AKADEMİ
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5 tracking-wider uppercase">
                    {reportData.isSample
                      ? "Örnek Gelişim Karnesi"
                      : "Öğrenci Gelişim ve Kalıcı Hafıza Belgesi"}
                  </p>
                </div>

                {/* Öğrenci & Sınıf Bilgisi */}
                <div className="text-center my-4 py-4 px-4 rounded-xl bg-slate-950/70 border border-slate-800/90">
                  <p className="text-xs sm:text-sm text-slate-400 italic">
                    Bu başarı belgesi, düzenli İngilizce pratikleri ve kelime ezber refleksleriyle üstün gayret gösteren
                  </p>
                  <h4 className="text-xl sm:text-2xl font-black text-cyan-400 uppercase tracking-wide my-1">
                    {reportData.studentName}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-300">
                    adına,{" "}
                    <span className="font-bold text-amber-300">
                      {reportData.curriculumName}
                    </span>{" "}
                    çalışmalarının takdiri için tanzim edilmiştir.
                  </p>

                  {/* Kayıtlı Okul Sınıfı Varsa Göster */}
                  {reportData.joinedClassroom?.className && (
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs font-bold">
                      <School className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sınıf: {reportData.joinedClassroom.className}</span>
                      {reportData.joinedClassroom.teacherName && (
                        <span>· Öğretmen: {reportData.joinedClassroom.teacherName}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* İstatistik Metrikleri (4'lü Kart) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-emerald-500/40 flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400">
                      {reportData.permanentWords}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      Kalıcı Hafızada
                    </div>
                    <div className="text-[10px] text-slate-400">
                      SM-2 ile pekiştirildi
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-amber-500/40 flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-amber-400">
                      %{reportData.accuracyRate}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      Başarı & Doğruluk
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Test & oyun başarısı
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-cyan-500/40 flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-1">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-cyan-400">
                      {reportData.totalWords}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      Aktif Dağarcık
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Toplam çalışılan kelime
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-violet-500/40 flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 mb-1">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-violet-400">
                      {reportData.activeDaysLast7 || 0}/7
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      Haftalık Ritim
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Bugün: {reportData.todayStudied || 0}/{reportData.dailyTarget || 15} kelime
                    </div>
                  </div>
                </div>

                {/* Son 7 Günlük Çalışma Zinciri */}
                {Array.isArray(reportData.dailyActivity7) && reportData.dailyActivity7.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-800/90 mb-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Son 7 Günlük Çalışma Ritmi</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {reportData.dueReviewCount > 0
                          ? `⚡ ${reportData.dueReviewCount} kelime tekrar vadesinde`
                          : "✓ Günlük tekrarlar güncel"}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {reportData.dailyActivity7.map((d) => (
                        <div
                          key={d.dateKey}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            d.active
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                              : "bg-slate-900/60 border-slate-800 text-slate-500"
                          }`}
                        >
                          <div className="text-[10px] font-bold">{d.label}</div>
                          <div className="text-xs font-black mt-0.5">
                            {d.active ? `✓ ${d.count}` : "·"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gerçek Kelime Vitrini: Öğrendiği & Zorlandığı Kelimeler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4">
                  {/* Kalıcı Hafızaya Alınan / Hedef Kelimeler */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {reportData.masteredWordsList?.length > 0
                          ? "Öğrendiği Kelimelerden Örnekler"
                          : "Bu Sınıfın Hedef Kelime Örnekleri"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        🔊 Dinlemek için dokunun
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(reportData.masteredWordsList?.length > 0
                        ? reportData.masteredWordsList
                        : reportData.familyQuizPool || []
                      )
                        .slice(0, 6)
                        .map((w, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => playWordAudio(w)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-200 transition-colors cursor-pointer"
                            title="Telaffuzu dinle"
                          >
                            <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="font-bold text-white">{w.english}</span>
                            {w.turkish && (
                              <span className="text-emerald-300/90 text-[11px]">
                                ({w.turkish})
                              </span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Zorlandığı / Tekrar Bekleyen Kelimeler & Hızlı Aksiyon */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Pekiştirme & Hata Defteri</span>
                        </span>
                        <span className="text-[10px] font-mono text-amber-200/80">
                          {reportData.weakWordsList?.length || 0} kelime
                        </span>
                      </div>

                      {reportData.weakWordsList?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {reportData.weakWordsList.slice(0, 4).map((w, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => playWordAudio(w)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-200 cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="font-bold text-white">{w.english}</span>
                              {w.turkish && (
                                <span className="text-[11px] text-amber-300/90">
                                  ({w.turkish})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {reportData.isSample
                            ? "Çocuğunuz oyun oynadıkça takıldığı kelimeler otomatik olarak Hata Defteri'nde toplanır."
                            : "Harika! Şu anda hata yapılan veya gecikmiş zayıf kelime bulunmuyor."}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {reportData.weakWordsList?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setWeakModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                        >
                          🎯 Hataları Şimdi Pekiştir ({reportData.weakWordsList.length})
                        </button>
                      )}
                      <a
                        href={targetGradeOption.path}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs transition-all"
                      >
                        <span>🚀 {reportData.curriculumName} Oyununu Başlat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Pedagojik Veli Notu */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Pedagojik Gelişim Notu & Veliye Tavsiye:
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("bond")}
                      className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer print:hidden"
                    >
                      💬 Evde 3 Kelime Sor & Tebrik Mesajı Gönder →
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {reportData.pedagogicalNote}
                  </p>
                </div>

                {/* Karne Alt Bilgisi */}
                <div className="mt-5 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div>
                    <span className="font-semibold text-slate-300">Rapor Tarihi:</span>{" "}
                    {reportData.reportDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">
                      Memolandum Pedagoji Kurulu Onaylı · memolandum.com
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SEKME 2: EVDE İLETİŞİM & 1 DAKİKALIK AİLE OYUNU                */}
          {/* ============================================================== */}
          {activeTab === "bond" && (
            <div className="space-y-6">
              {/* 1. Akşam Yemeğinde / Serviste Sorabileceğiniz 3 Kelime */}
              <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🍽️ 1 Dakikalık Aile Etkinliği
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                      Bugün {reportData.studentName} İle Oynayabileceğiniz “3 Kelime” Oyunu
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      İngilizce bilmenize gerek yok! Hoparlöre basıp okunuşu dinleyin ve akşam yemeğinde çocuğunuza bu 3 kelimeyi sorun:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQuizOffset((prev) => prev + 3);
                      setKnownQuizWords({});
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Yeni 3 Kelime Getir</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentQuizTrio.map((item, idx) => {
                    const isMarkedKnown = !!knownQuizWords[item.english];
                    return (
                      <div
                        key={`${item.english}-${idx}`}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isMarkedKnown
                            ? "bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/10"
                            : "bg-slate-950/80 border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Soru {idx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => playWordAudio(item, false)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold cursor-pointer"
                                title="Normal hızda dinle"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Dinle</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => playWordAudio(item, true)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                                title="Yavaş ve tane tane dinle (Veli & Çocuk Telaffuz Koçu)"
                              >
                                <span>🐢 Yavaş</span>
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 text-xl font-black text-white tracking-wide">
                            {item.english}
                          </div>
                          {item.phonetic && (
                            <div className="text-[11px] text-amber-300/90 font-mono mt-0.5">
                              Okunuşu: “{item.phonetic}”
                            </div>
                          )}
                          <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                            Anlamı:{" "}
                            <strong className="text-emerald-300">{item.turkish}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setKnownQuizWords((prev) => ({
                              ...prev,
                              [item.english]: !prev[item.english],
                            }))
                          }
                          className={`w-full py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            isMarkedKnown
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                          }`}
                        >
                          {isMarkedKnown ? "🎉 Bildi! (Harika)" : "👍 Çocuğum Bildi İşaretle"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {knownCount === 3 && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between gap-3">
                    <span>
                      🏆 Muhteşem! {reportData.studentName} 3’te 3 yaptı! Şimdi aşağıdan ona gurur mesajı göndererek bu anı taçlandırın.
                    </span>
                  </div>
                )}

                {/* Ekransız Aile Tekrarı: Buzdolabı & Çalışma Masası Kelime Fişi */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-cyan-300">
                      🧲 Ekransız Aile Tekrarı: Buzdolabı & Çalışma Masası Kelime Fişi
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Çocuğunuzun bu haftaki 10 hedef kelimesini (İngilizce, Türkçe okunuş ve anlamlarıyla) + 7 günlük tik atma çizelgesini tek tıkla indirip yazdırın veya telefonunuzda saklayın.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadFridgeSheet}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer shrink-0 shadow-md shadow-cyan-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>🧲 Buzdolabı Fişini İndir</span>
                  </button>
                </div>
              </div>

              {/* 2. Tek Tıkla WhatsApp İletişim & Gurur Mesajı Şablonları */}
              <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-slate-950/80 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    💌 Aile İçi Motivasyon Köprüsü
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    Çocuğunuza veya Aile Grubunuza Hazır Tebrik Mesajı Gönderin
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ebeveyn takdiri, çocuğun öğrenme motivasyonunu %300 artırır. Mesaj tonunu seçin, dilerseniz düzenleyip WhatsApp ile gönderin:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTone("praise")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTone === "praise"
                        ? "bg-amber-500/20 border-amber-400 text-amber-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-black">🌟 Çocuğuma Gurur Mesajı</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Çabasını ve öğrendiği kelimeleri takdir edin
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTone("challenge")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTone === "challenge"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-black">🎮 Akşam Yarışma Daveti</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      5 dk pratik ve akşamki 3 kelime oyununa davet
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTone("family")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTone === "family"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-black">👨‍👩‍👧 Aile Grubu & Öğretmen</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Aile WhatsApp grubunda başarı tablosunu paylaşın
                    </div>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={customBondMessage}
                  onChange={(e) => setCustomBondMessage(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 p-3.5 text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSendBondWhatsApp}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp ile Hemen Gönder</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBondMessage}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    {copiedBond ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Mesaj Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Metni Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Veliye 3 Altın Pedagojik Rehber */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs font-black text-amber-300 mb-1">
                    ⏱️ 1. Günde 10 Dakika Kuralı
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Haftada bir gün 1 saat çalışmak yerine, her gün 10 dakikalık oyunlu tekrar beynin kalıcı sinaps bağlarını 4 kat daha hızlı kurar.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs font-black text-cyan-300 mb-1">
                    🧠 2. Yanlışlar Öğrenme Fırsatıdır
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Çocuğunuz hata yaptığında Memolandum Pulse™ o kelimeyi Hata Defteri'ne alır ve tam unutacağı gün tekrar karşısına çıkarır.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs font-black text-emerald-300 mb-1">
                    💬 3. Merak Eden Ebeveyn Etkisi
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    “Ders çalıştın mı?” yerine “Bugün Memolandum'da bana hangi İngilizce kelimeyi öğreteceksin?” diye sormak çocuğu öğretmen rolüne geçirir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SEKME 3: MEMOLANDUM AİLE KULÜBÜ, GÜVENCE & BİZE YAZIN          */}
          {/* ============================================================== */}
          {activeTab === "club" && (
            <div className="space-y-6">
              {/* 1. Velilere 4 Maddelik Güven Sözümüz */}
              <div className="p-5 sm:p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-950 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Memolandum Veli Güven & Pedagoji Sözleşmesi
                    </h3>
                    <p className="text-xs text-slate-300">
                      Çocuğunuzun ekran başında geçirdiği her saniyenin güvenli, reklamsız ve okul başarısına odaklı olması için tasarlandı.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs font-black text-emerald-300">
                      🛡️ %100 Reklamsız & Çocuk Güvenli Alan
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Oyun ortasında dikkat dağıtan harici reklamlar, pop-up pencereler veya yabancı sohbet odaları asla yer almaz.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs font-black text-amber-300">
                      🎓 1–8. Sınıf (LGS), Lise ve YDS Ücretsiz
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Okul ünite kelimeleri, sesli cümleler ve 8 eğitici oyun her aile için ücretsizdir; kredi kartı bilgisi istenmez.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs font-black text-cyan-300">
                      🔒 KVKK & Sıfır Kişisel Veri Zorunluluğu
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Çocuğunuzun gerçek soyadını, telefonunu veya TC kimlik numarasını girmeniz gerekmez; yalnızca rumuzla güvenle kullanılır.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs font-black text-violet-300">
                      🏫 Okul Öğretmeniyle Entegre Takip
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      İngilizce öğretmeni sınıf kodu verdiğinde çocuğunuzun ödevleri otomatik tanımlanır ve gelişimi hem sizin hem öğretmeninin ekranına yansır.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Haftalık Veli Özeti & Tam Veli Paneline Geçiş */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300 uppercase">
                    <Bell className="w-4 h-4" />
                    <span>Haftalık Veli E-posta Özeti & Kardeş Profilleri</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Birden fazla çocuğunuz için ayrı profil açmak, günlük kelime hedeflerini ayarlamak veya e-posta özeti almak için Veli Takip Merkezi'ni kullanabilirsiniz.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!parentEmailDigest}
                      onChange={(e) => setParentEmailDigest(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>Haftalık E-posta Özeti</span>
                  </label>

                  <a
                    href={getParentDigestMailto({
                      reportData,
                      recipientEmail: profile?.email || "",
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-bold transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>E-posta Özeti Al</span>
                  </a>

                  <a
                    href="/profile"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all"
                  >
                    <span>Veli Takip Merkezi'ni Aç</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 3. Doğrudan Veli İletişim & Müfredat İsteği Formu */}
              <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-slate-950/90 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    📣 Sesinizi Duyuyoruz · Doğrudan İletişim
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    Memolandum Pedagoji Ekibine Doğrudan Yazın
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Çocuğunuzun okul kitabındaki özel bir kelime listesini, görmek istediğiniz yeni bir özelliği veya görüşlerinizi hiçbir e-posta programına gerek kalmadan doğrudan buradan iletin:
                  </p>
                </div>

                {feedbackSuccessTicket ? (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Mesajınız Pedagoji Ekibimize Ulaştı!</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono text-xs font-bold">
                        #{feedbackSuccessTicket}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Talebiniz <strong>#{feedbackSuccessTicket}</strong> kayıt numarasıyla yönetim panelimize kaydedildi. İlgili sınıf/ünite çalışmalarımızda öncelikle değerlendireceğiz.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFeedbackSuccessTicket(null)}
                      className="text-xs font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                    >
                      + Yeni bir mesaj daha gönder
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Müfredat / Ünite Talebi",
                        "Veli Karnesi Önerisi",
                        "Teşekkür & Deneyim",
                        "Teknik Destek",
                      ].map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setFeedbackTopic(topic)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            feedbackTopic === topic
                              ? "bg-amber-500/20 border-amber-400 text-amber-300"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => {
                        setFeedbackText(e.target.value);
                        if (feedbackError) setFeedbackError("");
                      }}
                      placeholder={`Örn: Merhaba, çocuğum ${reportData.curriculumName} öğrencisi. Okulda şu üniteye geçtik, kelime listesini ekleyebilir misiniz?...`}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 p-3.5 text-xs sm:text-sm text-white focus:outline-none"
                    />

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Size geri dönüş yapabilmemiz için E-posta veya Telefon (İsteğe Bağlı):
                      </label>
                      <input
                        type="text"
                        value={feedbackContact}
                        onChange={(e) => setFeedbackContact(e.target.value)}
                        placeholder={profile?.email || "Örn: veli@eposta.com veya 05xx... (Boş bırakabilirsiniz)"}
                        maxLength={120}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {feedbackError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                        {feedbackError}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <a
                        href={getParentFeedbackMailto({
                          parentName: profile?.displayName || "",
                          studentName: reportData.studentName,
                          curriculumName: reportData.curriculumName,
                          topic: feedbackTopic,
                          message: feedbackText,
                        })}
                        className="text-[11px] text-slate-400 hover:text-amber-300 underline"
                      >
                        Alternatif: E-posta uygulamasıyla gönder (info@memolandum.com)
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                `[${feedbackTopic} - ${reportData.studentName} / ${reportData.curriculumName}]\n${feedbackText}`
                              );
                              setFeedbackCopied(true);
                              setTimeout(() => setFeedbackCopied(false), 2500);
                            } catch {
                              /* ignore */
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                        >
                          {feedbackCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopyala</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isSubmittingFeedback}
                          onClick={async () => {
                            const trimmed = feedbackText.trim();
                            if (trimmed.length < 5) {
                              setFeedbackError("Lütfen en az birkaç kelimelik mesajınızı yazın.");
                              return;
                            }
                            setIsSubmittingFeedback(true);
                            setFeedbackError("");
                            try {
                              const res = await submitParentFeedbackTicket({
                                topic: feedbackTopic,
                                message: trimmed,
                                contactInfo: feedbackContact.trim() || profile?.email || "",
                                parentName: profile?.displayName || "",
                                studentName: reportData.studentName,
                                curriculumName: reportData.curriculumName,
                                gradeKey: reportData.gradeKey || "",
                                classCode: reportData.joinedClassroom?.classCode || "",
                                sourcePage: "parent_report_modal",
                                metricsSnapshot: {
                                  totalWords: reportData.totalWords || 0,
                                  permanentWords: reportData.permanentWords || 0,
                                  accuracyRate: reportData.accuracyRate || 0,
                                  activeDaysLast7: reportData.activeDaysLast7 || 0,
                                  isSample: !!reportData.isSample,
                                },
                              });
                              setFeedbackSuccessTicket(res?.ticketCode || "ML-KAYIT");
                              setFeedbackText("");
                              fetchMyParentFeedbackTickets()
                                .then((list) => setMyTickets(list))
                                .catch(() => {});
                            } catch (err) {
                              setFeedbackError(
                                err?.message ||
                                  "Mesaj gönderilirken bir bağlantı sorunu oluştu. Lütfen tekrar deneyin."
                              );
                            } finally {
                              setIsSubmittingFeedback(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSubmittingFeedback ? "Gönderiliyor..." : "Doğrudan Ekibe Gönder"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Gönderilen Talepler ve Memolandum Pedagoji Ekibi Yanıtları */}
                {myTickets.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-1.5">
                        <span>📬 Gönderdiğiniz Talepler & Ekip Yanıtları</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Son {myTickets.length} kayıt
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {myTickets.map((t) => (
                        <div
                          key={t.ticketCode}
                          className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[11px] font-bold text-amber-300">
                                #{t.ticketCode}
                              </span>
                              <span className="text-xs font-bold text-slate-200">
                                {t.topic}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                t.adminReply
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                                  : t.status === "in_progress"
                                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                              }`}
                            >
                              {t.adminReply
                                ? "✅ Yanıtlandı"
                                : t.status === "in_progress"
                                ? "🔍 İnceleniyor"
                                : "📩 Ekibe İletildi"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 whitespace-pre-wrap">
                            {t.message}
                          </p>

                          {t.adminReply && (
                            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-1">
                              <div className="text-[11px] font-black text-emerald-300">
                                🦉 Memolandum Pedagoji Ekibi Yanıtı:
                              </div>
                              <p className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed">
                                {t.adminReply}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Eylem Butonları (Mobil Kompakt 2x2 Izgara & Masaüstü Esnek) */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-t border-slate-800 bg-slate-950/95 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2 sm:gap-2.5 print:hidden">
          <button
            onClick={handleNativeShare}
            className="sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Karnemi Paylaş</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
            <span className="truncate">WhatsApp Karne Özeti</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{isDownloading ? "İndiriliyor..." : "PNG Karne İndir"}</span>
          </button>

          <button
            onClick={handleDownloadFridgeSheet}
            className="sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-200 font-bold text-xs sm:text-sm transition-all hover:text-white active:scale-95 cursor-pointer"
            title="10 Hedef Kelime + 7 Günlük Çizelgeyi Buzdolabı Fişi Olarak İndir"
          >
            <span className="truncate">🧲 Buzdolabı Fişi</span>
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all hover:text-white cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* Zayıf Kelime / Hata Defteri Modalı */}
      <WeakWordsModal
        isOpen={weakModalOpen}
        onClose={() => setWeakModalOpen(false)}
      />
    </div>
  );
}

