"use client";

import React, { useState } from "react";
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
import { getWhatsAppParentDigestUrl } from "../../lib/reports/reportGenerator";
import JoinClassModal from "../schools/JoinClassModal";
import WeakWordsModal from "../learning/WeakWordsModal";
import { getWeakWords } from "../../lib/learning/weakWordsService";

const GRADE_PRESETS = [
  { id: "meb-1-sinif-kelimeleri", label: "🎒 1. Sınıf İngilizce", path: "/learn/en-tr/meb-1-sinif-kelimeleri/" },
  { id: "meb-2-sinif-kelimeleri", label: "🎒 2. Sınıf İngilizce", path: "/learn/en-tr/meb-2-sinif-kelimeleri/" },
  { id: "meb-3-sinif-kelimeleri", label: "🎒 3. Sınıf İngilizce", path: "/learn/en-tr/meb-3-sinif-kelimeleri/" },
  { id: "meb-4-sinif-kelimeleri", label: "🎒 4. Sınıf İngilizce", path: "/learn/en-tr/meb-4-sinif-kelimeleri/" },
  { id: "ortaokul-5", label: "🎓 5. Sınıf Ortaokul", path: "/learn/en-tr/" },
  { id: "genel-sinav", label: "🎯 Sınav & Genel Hazırlık", path: "/learn/en-tr/" },
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

  const weakWords = React.useMemo(() => {
    return getWeakWords(vocabularyVault, quizHistory);
  }, [vocabularyVault, quizHistory]);

  const activeChild =
    childrenProfiles.find((c) => c.id === activeChildId) ||
    childrenProfiles[0] ||
    null;

  // Çocuğun son oturum bilgileri
  const childRecentLogs = parentActivityLog.filter(
    (l) => !activeChild || l.childId === activeChild.id
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
      studentName: activeChild.name,
      curriculumName: activeChild.gradeLabel || "İlkokul İngilizce",
      activitySummary: latestLog?.summary || activeChild.lastStudiedTopic || "Ders tamamlandı",
      accuracyRate: 95,
      wordsCount: latestLog?.wordsCount || activeChild.dailyTarget || 15,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatTimeAgo = (ts) => {
    if (!ts) return "Henüz aktivite yok";
    const diffMin = Math.floor((Date.now() - Number(ts)) / 60000);
    if (diffMin < 1) return "Az önce";
    if (diffMin < 60) return `${diffMin} dakika önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  };

  // Eğer kullanıcı veli modunu açmamışsa ve hiç çocuk profili yoksa davet kartı göster
  if (!isParentAccount && childrenProfiles.length === 0) {
    return (
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
                Çocuğunuz sitemizde çalıştığında anında haberdar olun, sınıfına (1, 2, 3, 4. Sınıf) özel kelimeleri pekiştirmesini sağlayın ve tek tıkla resmi başarı karnesi indirin.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Çocuğum İçin Profil Oluştur</span>
          </button>
        </div>

        {/* Modal: İlk Çocuk Oluşturma */}
        {showAddModal && renderAddChildModal()}
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
                Çocuğun Adı / Rumuzu:
              </label>
              <input
                type="text"
                placeholder="Örn: Kerem, Zeynep..."
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                required
                autoFocus
              />
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
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                👨‍👩‍👧 Veli & Öğrenci Takip Paneli
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Canlı Takip Aktif
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Öğrenci Gelişimi & Aile Bilgilendirme
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Çocuğunuz sitemizde çalıştığında anlık bildirim alın, gelişimini WhatsApp'tan takip edin.
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

                {/* Eylem Butonları */}
                <div className="flex items-center gap-3 pt-1 flex-wrap justify-center sm:justify-start">
                  <button
                    onClick={() => onOpenReport && onOpenReport(activeChild)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs tracking-wide shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Öğrenci Karnesini Aç</span>
                  </button>

                  <button
                    onClick={handleWhatsAppDigest}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="WhatsApp Veli Özeti Gönder"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp Bildirimi</span>
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
                    Haftalık Başarı Karnesi E-postası
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Her Pazar 20:00'de {activeChild.name} için gelişim özeti gönder
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
                        : "Öğrencinin zorlandığı kelime bulunmuyor (%100 başarı)."}
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
                    {joinedClassroom.schoolName} · Öğretmen: {joinedClassroom.teacherName}
                  </div>
                  {joinedClassroom.currentAssignment && (
                    <div className="text-[11px] text-amber-300 mt-1 flex items-center gap-1.5 font-medium">
                      <span>📌 Güncel Ödev:</span>
                      <span className="underline">{joinedClassroom.currentAssignment.unitTitle}</span>
                      <span className="text-slate-400">({joinedClassroom.currentAssignment.dueDate})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {joinedClassroom.currentAssignment?.levelId && (
                  <a
                    href={`/learn/en-tr/${joinedClassroom.currentAssignment.levelId}/`}
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
                    Öğretmeninizin Sınıfına Katılın
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    İngilizce öğretmeninizin verdiği 6 haneli kodla sınıfa katılın, ev ödevlerinizi ve üniteleri doğrudan takip edin.
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
