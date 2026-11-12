"use client";

import React, { useState, useEffect } from "react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import {
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Brain,
  MessageCircle,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Bell,
  ShieldCheck,
  User,
  ExternalLink,
  X,
  Smartphone,
  School,
  AlertTriangle,
} from "lucide-react";
import { getWhatsAppParentDigestUrl, getParentDigestMailto, calculateParentReportData } from "../../lib/reports/reportGenerator";
import { isClientAdminEmail } from "../../lib/reports/feedbackService";
import JoinClassModal from "../schools/JoinClassModal";
import WeakWordsModal from "../learning/WeakWordsModal";
import { getWeakWords, countDueWords, countTodayStudiedWords } from "../../lib/learning/weakWordsService";
import { buildHomeworkStartHref, seedWordCardUnit } from "../../lib/schools/mebHomeworkUnits";
import { formatSchoolLine } from "../../lib/schools/teacherIdentity";

const GRADE_PRESETS = [
  { id: "meb-1-sinif-kelimeleri", label: "🎒 1. Sınıf İngilizce", path: "/learn/en-tr/meb-1-sinif-kelimeleri/", playlist: "1sınıf" },
  { id: "meb-2-sinif-kelimeleri", label: "🎒 2. Sınıf İngilizce", path: "/learn/en-tr/meb-2-sinif-kelimeleri/", playlist: "2sınıf" },
  { id: "meb-3-sinif-kelimeleri", label: "🎒 3. Sınıf İngilizce", path: "/learn/en-tr/meb-3-sinif-kelimeleri/", playlist: "3sınıf" },
  { id: "meb-4-sinif-kelimeleri", label: "🎒 4. Sınıf İngilizce", path: "/learn/en-tr/meb-4-sinif-kelimeleri/", playlist: "4sınıf" },
  { id: "meb-5-sinif-kelimeleri", label: "🎓 5. Sınıf Ortaokul", path: "/learn/en-tr/meb-5-sinif-kelimeleri/", playlist: "5sınıf" },
  { id: "meb-6-sinif-kelimeleri", label: "🎓 6. Sınıf Ortaokul", path: "/learn/en-tr/meb-6-sinif-kelimeleri/", playlist: "6sınıf" },
  { id: "meb-7-sinif-kelimeleri", label: "🎓 7. Sınıf Ortaokul", path: "/learn/en-tr/meb-7-sinif-kelimeleri/", playlist: "7sınıf" },
  { id: "meb-8-sinif-kelimeleri", label: "🎓 8. Sınıf Ortaokul (LGS)", path: "/learn/en-tr/meb-8-sinif-kelimeleri/", playlist: "8sınıf" },
  { id: "genel-sinav", label: "🎯 Sınav & Genel Hazırlık", path: "/learn/en-tr/", playlist: "yds" },
];

export default function ParentStudentHub({ onOpenReport }) {
  const isParentAccount = useMemolandumStore((s) => s.isParentAccount);
  const parentEmailDigest = useMemolandumStore((s) => s.parentEmailDigest);
  const childrenProfiles = useMemolandumStore((s) => s.childrenProfiles) || [];
  const activeChildId = useMemolandumStore((s) => s.activeChildId);
  const parentActivityLog = useMemolandumStore((s) => s.parentActivityLog) || [];
  const profile = useMemolandumStore((s) => s.profile);
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const joinedClassroom = useMemolandumStore((s) => s.joinedClassroom);
  const uid = useMemolandumStore((s) => s.uid);
  const refreshJoinedClassroom = useMemolandumStore((s) => s.refreshJoinedClassroom);

  const setIsParentAccount = useMemolandumStore((s) => s.setIsParentAccount);
  const setParentEmailDigest = useMemolandumStore((s) => s.setParentEmailDigest);
  const addChildProfile = useMemolandumStore((s) => s.addChildProfile);
  const removeChildProfile = useMemolandumStore((s) => s.removeChildProfile);
  const setActiveChild = useMemolandumStore((s) => s.setActiveChild);

  const [showAddModal, setShowAddModal] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [weakWordsModalOpen, setWeakWordsModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildGrade, setNewChildGrade] = useState("meb-2-sinif-kelimeleri");
  const [newChildDailyTarget, setNewChildDailyTarget] = useState(15);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!uid || !joinedClassroom?.classCode) return;
    refreshJoinedClassroom?.();
  }, [uid, joinedClassroom?.classCode, refreshJoinedClassroom]);

  const globalStats = useMemolandumStore((s) => s.globalStats);
  const activeStudyProfile = useMemolandumStore((s) => s.getActiveStudyProfile?.() || null);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);

  const weakWords = React.useMemo(() => {
    return getWeakWords(vocabularyVault, quizHistory, {
      childId: activeChildId || undefined,
    });
  }, [vocabularyVault, quizHistory, activeChildId]);

  const activeChild =
    childrenProfiles.find((c) => c.id === activeChildId) ||
    childrenProfiles[0] ||
    null;

  const todayProgress = React.useMemo(() => {
    const childId = activeChild?.id || activeChildId || undefined;
    const studied = countTodayStudiedWords(quizHistory, { childId });
    const due = countDueWords(vocabularyVault, { childId });
    const target = Number(activeChild?.dailyTarget) || 0;
    return { studied, due, target };
  }, [quizHistory, vocabularyVault, activeChild, activeChildId]);

  const childReportData = React.useMemo(() => {
    return calculateParentReportData({
      vocabularyVault,
      quizHistory,
      globalStats,
      profile,
      activeStudyProfile,
      lastPlayedLevel: activeChild?.grade || lastPlayedLevel,
      selectedChild: activeChild,
    });
  }, [
    vocabularyVault,
    quizHistory,
    globalStats,
    profile,
    activeStudyProfile,
    lastPlayedLevel,
    activeChild,
  ]);

  // Çocuğun son oturum bilgileri
  const childRecentLogs = (Array.isArray(parentActivityLog) ? parentActivityLog : []).filter(
    (l) => l && (!activeChild || l.childId === activeChild.id)
  );
  const latestLog = childRecentLogs[0] || null;

  const handleCreateChild = (e) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    const matchedPreset = GRADE_PRESETS.find((g) => g.id === newChildGrade);
    addChildProfile({
      name: newChildName.trim(),
      grade: newChildGrade,
      gradeLabel: matchedPreset ? matchedPreset.label : "İlkokul İngilizce",
      dailyTarget: Number(newChildDailyTarget) || 15,
    });

    setNewChildName("");
    setShowAddModal(false);
  };

  const handleWhatsAppDigest = () => {
    if (!activeChild) return;
    const url = getWhatsAppParentDigestUrl({
      reportData: childReportData,
      activitySummary:
        latestLog?.summary || activeChild.lastStudiedTopic || "Son çalışma kaydı",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmailDigest = () => {
    if (!activeChild || !childReportData) return;
    const mailto = getParentDigestMailto({
      reportData: childReportData,
      recipientEmail: profile?.email || "",
    });
    if (mailto) window.location.href = mailto;
  };

  const formatTimeAgo = (ts) => {
    if (!ts) return "Henüz aktivite yok";
    const rawMs = ts?.seconds ? ts.seconds * 1000 : Number(ts);
    if (!rawMs || isNaN(rawMs)) return "Henüz aktivite yok";
    const diffMin = Math.floor((Date.now() - rawMs) / 60000);
    if (isNaN(diffMin) || diffMin < 0) return "Az önce";
    if (diffMin < 1) return "Az önce";
    if (diffMin < 60) return `${diffMin} dakika önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  };

  // Eğer kullanıcı veli modunu açmamışsa ve hiç çocuk profili yoksa:
  if (!isParentAccount && childrenProfiles.length === 0) {
    return (
      <div className="space-y-4">
        {/* Eğer öğrenci bir sınıfa katılmışsa sınıf ve ödev kartı */}
        {joinedClassroom ? (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-950 border-2 border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-md">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-white">
                    Kayıtlı Sınıfım: {joinedClassroom.className}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-200 font-mono font-bold">
                    {joinedClassroom.classCode}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {formatSchoolLine(joinedClassroom)}
                  {joinedClassroom.teacherName ? ` · Öğretmen: ${joinedClassroom.teacherName}` : ""}
                </div>
                {joinedClassroom.currentAssignment && (
                  <div className="text-xs text-amber-300 mt-1.5 flex items-center gap-1.5 font-bold">
                    <span>📌 Güncel Ödev:</span>
                    <span className="underline">
                      {joinedClassroom.currentAssignment.unitName ||
                        joinedClassroom.currentAssignment.unitTitle ||
                        "Haftalık Ödev"}
                    </span>
                    <span className="text-slate-400 font-normal">
                      ({joinedClassroom.currentAssignment.dueDate || "Pazar 20:00"})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {joinedClassroom.currentAssignment?.levelId && (
                <a
                  href={buildHomeworkStartHref(joinedClassroom.currentAssignment)}
                  onClick={() => {
                    const a = joinedClassroom.currentAssignment;
                    if (a?.unitNo != null && a?.levelId) {
                      seedWordCardUnit(a.levelId, a.unitNo);
                    }
                  }}
                  className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Ödeve Git
                </a>
              )}
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                Sınıfı Değiştir
              </button>
            </div>
          </div>
        ) : (
          /* Sınıfı olmayan öğrenci için hızlı katılım butonu */
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-dashed border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Öğretmenimin Sınıfına Katıl
                </h4>
                <p className="text-[11px] text-slate-400">
                  Öğretmeninizin verdiği 6 haneli kodla katılın; ödevlerinizi ve kelime hedeflerinizi anında görün.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              🏫 Sınıf Kodunu Gir
            </button>
          </div>
        )}

        {/* Veli Takip Daveti Banner'ı */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shrink-0 shadow-lg">
                👨‍👩‍👧
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                  <Sparkles className="w-3 h-3" /> Veli & Öğrenci Takip Ekosistemi
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Veli Misiniz? Çocuğunuzun İngilizce İlerlemesini Takip Edin
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                  Çocuğunuz için profil oluşturun (rumuz yeterli), çalışma özetini WhatsApp veya e-posta ile
                  paylaşın ve başarı karnesi indirin. Gerçek soyad veya okul kimliği zorunlu değil.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <a
                href="/veli-rehberi/"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-xs sm:text-sm transition-all whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>1 Dk Veli Rehberi</span>
              </a>
              {isClientAdminEmail(profile?.email) && (
                <a
                  href="/admin/"
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-400/40 font-bold text-xs sm:text-sm transition-all whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🛡️ Yönetici Gelen Kutusu</span>
                </a>
              )}
              {onOpenReport && (
                <button
                  type="button"
                  onClick={() => onOpenReport(null, "report")}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Örnek Karne & 3 Kelime Oyunu</span>
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Çocuğum İçin Profil Oluştur</span>
              </button>
            </div>
          </div>

          {/* Modal: İlk Çocuk Oluşturma */}
          {showAddModal && renderAddChildModal()}
          <JoinClassModal
            isOpen={joinModalOpen}
            onClose={() => setJoinModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  function renderAddChildModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 text-slate-100">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                👶
              </span>
              <h3 className="text-lg font-bold text-white">
                Yeni Çocuk / Öğrenci Profili
              </h3>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateChild} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Çocuğun görünen adı / rumuzu:
              </label>
              <input
                type="text"
                placeholder="Örn: Kerem, Zeynep, Yıldız..."
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                required
                autoFocus
                maxLength={40}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Gerçek soyad zorunlu değil. Karnede ve sınıfta bu ad görünür.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Sınıfı & Müfredat Düzeyi:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GRADE_PRESETS.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setNewChildGrade(g.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      newChildGrade === g.id
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                        : "bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>{g.label}</span>
                    {newChildGrade === g.id && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Günlük Hedef: <span className="text-amber-400">{newChildDailyTarget} Kelime</span>
              </label>
              <input
                type="range"
                min={5}
                max={40}
                step={5}
                value={newChildDailyTarget}
                onChange={(e) => setNewChildDailyTarget(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                <span>5 (Rahat)</span>
                <span>15 (Önerilen)</span>
                <span>40 (İleri)</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!newChildName.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                Profili Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Veli Takip Merkezi Ana Kartı */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 p-6 sm:p-8 shadow-2xl">
        
        {/* Üst Başlık & Çoklu Çocuk (Kardeş) Sekmeleri */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                👨‍👩‍👧 Veli & Öğrenci Takip Paneli
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Veli paneli hazır
              </span>
              <a
                href="/veli-rehberi/"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
              >
                📖 1 Dk Veli Rehberi →
              </a>
              {isClientAdminEmail(profile?.email) && (
                <a
                  href="/admin/"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-violet-200 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/40 transition-colors"
                >
                  🛡️ Yönetici Gelen Kutusu →
                </a>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Öğrenci Gelişimi & Aile Bilgilendirme
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Çalışma özetini WhatsApp veya e-posta ile paylaşın; karne metrikleri gerçek veriden üretilir.
            </p>
          </div>

          {/* Kardeş / Çocuk Profili Sekmeleri */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {childrenProfiles.map((child) => {
              const isSelected = activeChild?.id === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setActiveChild(child.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10 scale-105"
                      : "bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <img
                    src={child.avatar}
                    alt={child.name}
                    className="w-5 h-5 rounded-full bg-slate-900 border border-amber-400/50"
                  />
                  <span>{child.name}</span>
                  <span className="text-[10px] opacity-70">
                    ({child.gradeLabel?.split(" ")[0] || "İlkokul"})
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/30 hover:border-amber-400 transition-colors cursor-pointer"
              title="Yeni kardeş veya öğrenci ekle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Çocuk</span>
            </button>
          </div>
        </div>

        {/* Aktif Öğrenci Kartı & Durum Bilgileri */}
        {activeChild && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Sol Sütun: Öğrenci Kimliği ve Hızlı Eylemler */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative">
                <img
                  src={activeChild.avatar}
                  alt={activeChild.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-amber-400 bg-slate-950 p-1 shadow-xl shadow-amber-500/10"
                />
                <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 border border-amber-500/40">
                  {activeChild.gradeLabel?.split(" ")[0] || "İlkokul"}
                </span>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h3 className="text-2xl font-black text-white tracking-wide">
                    {activeChild.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-cyan-300 border border-cyan-500/40">
                    {activeChild.gradeLabel || "İlkokul İngilizce"}
                  </span>
                </div>

                {/* Anne-Babayı Haberdar Etme Göstergesi (Canlı Takip) */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Son Aktivite:</span>
                    <span className="text-emerald-400">
                      {formatTimeAgo(activeChild.lastStudiedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {latestLog?.summary || activeChild.lastStudiedTopic || "Henüz ders oturumu kaydı bulunmuyor."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-violet-500/25 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-200">
                    <span className="inline-flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-violet-300" />
                      Bugünkü çalışma
                    </span>
                    {todayProgress.target > 0 ? (
                      <span className="text-violet-300 font-mono">
                        {todayProgress.studied}/{todayProgress.target} kelime
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">
                        {todayProgress.studied} kelime
                      </span>
                    )}
                  </div>
                  {todayProgress.target > 0 && (
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (todayProgress.studied / todayProgress.target) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 m-0">
                    {todayProgress.due > 0
                      ? `${todayProgress.due} kelime tekrar bekliyor (Pulse).`
                      : "Şu an vadesi gelmiş kelime yok."}
                  </p>
                </div>

                {/* Eylem Butonları */}
                <div className="flex items-center gap-2.5 pt-1 flex-wrap justify-center sm:justify-start">
                  <button
                    onClick={() => onOpenReport && onOpenReport(activeChild, "report")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs tracking-wide shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Öğrenci Karnesini Aç</span>
                  </button>

                  <button
                    onClick={() => onOpenReport && onOpenReport(activeChild, "bond")}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-xs font-bold transition-all cursor-pointer"
                    title="Akşam yemeğinde sorabileceğiniz 3 kelime ve hazır tebrik mesajları"
                  >
                    <MessageCircle className="w-4 h-4 text-indigo-300" />
                    <span>💬 Evde 3 Kelime Sor & Tebrik</span>
                  </button>

                  <button
                    onClick={handleWhatsAppDigest}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="Gerçek metriklerle WhatsApp özeti hazırla"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp Özeti</span>
                  </button>

                  <button
                    onClick={handleEmailDigest}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="Bu haftanın özetini e-posta taslağı olarak aç"
                  >
                    <Bell className="w-4 h-4 text-sky-400" />
                    <span>E-posta Özeti Hazırla</span>
                  </button>

                  {childrenProfiles.length > 1 && (
                    <button
                      onClick={() => setShowDeleteConfirm(activeChild.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Bu profili kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ Sütun: Veli Bildirim & E-posta Ayarları */}
            <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Veli Bildirim Tercihleri
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {profile?.email ? "Kayıtlı E-posta" : "Hesap Gerekli"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Haftalık karne e-posta tercihi
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Tercih kaydedilir. Otomatik Pazar gönderimi henüz aktif değil — şimdilik “E-posta Özeti Hazırla” kullanın.
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parentEmailDigest}
                    onChange={(e) => setParentEmailDigest(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Hızlı Ders Başlatma Kısayolu */}
              {GRADE_PRESETS.find((g) => g.id === activeChild.grade)?.path && (
                <div className="space-y-2">
                  <a
                    href={GRADE_PRESETS.find((g) => g.id === activeChild.grade).path}
                    className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-500/30 text-cyan-300 text-xs font-bold transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>{activeChild.name} İçin {activeChild.gradeLabel?.split(" ")[0]} Kelimelerini Başlat</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  {GRADE_PRESETS.find((g) => g.id === activeChild.grade)?.playlist && (
                    <a
                      href={`/videos?playlist=${encodeURIComponent(
                        GRADE_PRESETS.find((g) => g.id === activeChild.grade).playlist
                      )}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-red-950/25 hover:bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-bold transition-all group"
                    >
                      <span>Video ile çalış</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  )}
                </div>
              )}

              {/* Zayıf Kelime & Hata Defteri Aksiyon Çubuğu */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      Hata Defteri & Zayıf Kelime Takibi
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {weakWords.length > 0 
                        ? `${weakWords.length} kelimede takıldı veya pekiştirme zamanı geldi.`
                        : "Bu çocuk için şu an zayıf kelime kaydı yok."}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWeakWordsModalOpen(true)}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-amber-500/20"
                >
                  {weakWords.length > 0 ? `🎯 Hataları Pekiştir (${weakWords.length})` : "📖 Hata Defteri"}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Okul & Öğretmen Sınıfı Bağlantısı */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          {joinedClassroom ? (
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">
                      Kayıtlı Sınıf: {joinedClassroom.className}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-200 font-mono">
                      {joinedClassroom.classCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {formatSchoolLine(joinedClassroom)}
                    {joinedClassroom.teacherName
                      ? ` · Öğretmen: ${joinedClassroom.teacherName}`
                      : ""}
                  </div>
                  {joinedClassroom.currentAssignment && (
                    <div className="text-[11px] text-amber-300 mt-1 flex items-center gap-1.5 font-medium">
                      <span>📌 Güncel Ödev:</span>
                      <span className="underline">
                        {joinedClassroom.currentAssignment.unitName ||
                          joinedClassroom.currentAssignment.unitTitle ||
                          "Haftalık ödev"}
                      </span>
                      <span className="text-slate-400">({joinedClassroom.currentAssignment.dueDate})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {joinedClassroom.currentAssignment?.levelId && (
                  <a
                    href={buildHomeworkStartHref(joinedClassroom.currentAssignment)}
                    onClick={() => {
                      const a = joinedClassroom.currentAssignment;
                      if (a?.unitNo != null && a?.levelId) {
                        seedWordCardUnit(a.levelId, a.unitNo);
                      }
                    }}
                    className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 transition-all"
                  >
                    Ödeve Git
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Sınıfı Değiştir
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Öğretmen sınıfına katılın
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    6 haneli kod yeterli. Sınıfta görünecek ad için takma ad kullanabilirsiniz;
                    gerçek kimlik paylaşmak zorunda değilsiniz.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                🏫 Sınıf Kodunu Gir
              </button>
            </div>
          )}
        </div>

        {/* Canlı Aktivite Geçmişi Akışı (Activity Stream) */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Son Çalışma Oturumları & Hafıza Geçmişi</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Son {Math.min(childRecentLogs.length, 3)} oturum
            </span>
          </div>

          {childRecentLogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {childRecentLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-300 truncate">
                      {log.childName || activeChild?.name || "Öğrenci"}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {formatTimeAgo(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 line-clamp-2">
                    {log.summary}
                  </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-900 text-[10px] text-slate-400">
                    <span>📚 {log.wordsCount || 1} Kelime</span>
                    {log.score > 0 && <span>• ⭐ +{log.score} XP</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400">
              {activeChild?.name || "Öğrenciniz"} henüz ders oturumu tamamlamadı. Yukarıdaki butondan sınıfının kelimelerini başlatabilirsiniz.
            </div>
          )}
        </div>

      </div>

      {/* Modal: Yeni Çocuk Ekleme */}
      {showAddModal && renderAddChildModal()}

      {/* Modal: Profil Silme Onayı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center text-slate-100">
            <h4 className="text-base font-bold text-white mb-2">
              Çocuk Profilini Kaldır
            </h4>
            <p className="text-xs text-slate-400 mb-6">
              Bu profili kaldırmak istediğinizden emin misiniz? Öğrencinin bu cihazdaki profili silinecektir.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  removeChildProfile(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sınıfa Katıl Modalı */}
      <JoinClassModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      {/* Hata Defteri Modalı */}
      <WeakWordsModal
        isOpen={weakWordsModalOpen}
        onClose={() => setWeakWordsModalOpen(false)}
      />
    </div>
  );
}
