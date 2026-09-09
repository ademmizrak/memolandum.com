"use client";

import React, { useState, useEffect } from "react";
import {
  School,
  Users,
  BookOpen,
  Award,
  Sparkles,
  Plus,
  Copy,
  Check,
  Smartphone,
  Printer,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  createClassroom,
  getTeacherClassrooms,
  assignHomework,
} from "../../lib/schools/schoolService";
import { TURKEY_PROVINCES, getDistrictsForProvince } from "../../lib/schools/turkeyLocations";
import { useMemolandumStore } from "../../store/useMemolandumStore";

const MEB_UNITS = [
  { levelId: "meb-1-sinif-kelimeleri", label: "1. Sınıf - Temel 100 Kelime (Görsel & Sesli)" },
  { levelId: "meb-2-sinif-kelimeleri", label: "2. Sınıf Ünite 1: Words & Greetings" },
  { levelId: "meb-2-sinif-kelimeleri", label: "2. Sınıf Ünite 2: Friends & Colors" },
  { levelId: "meb-2-sinif-kelimeleri", label: "2. Sınıf Ünite 3: In The Classroom" },
  { levelId: "meb-2-sinif-kelimeleri", label: "2. Sınıf Ünite 4: Numbers" },
  { levelId: "meb-2-sinif-cumleleri", label: "2. Sınıf - 100 MEB Kalıp Cümlesi" },
  { levelId: "meb-3-sinif-kelimeleri", label: "3. Sınıf Ünite 1: Greetings" },
  { levelId: "meb-3-sinif-kelimeleri", label: "3. Sınıf Ünite 2: My Family" },
  { levelId: "meb-3-sinif-kelimeleri", label: "3. Sınıf Ünite 3: People I Love" },
  { levelId: "meb-4-sinif-kelimeleri", label: "4. Sınıf Ünite 1: Classroom Rules" },
  { levelId: "meb-4-sinif-kelimeleri", label: "4. Sınıf Ünite 2: Nationality" },
  { levelId: "meb-4-sinif-kelimeleri", label: "4. Sınıf Ünite 3: Free Time" },
];

export default function TeacherDashboard() {
  const profile = useMemolandumStore((s) => s.profile);
  const uid = useMemolandumStore((s) => s.uid);

  const [classrooms, setClassrooms] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal: Yeni Sınıf
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newProvince, setNewProvince] = useState("İstanbul");
  const [newDistrict, setNewDistrict] = useState("Kadıköy");
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("4. Sınıf");

  const handleProvinceChange = (prov) => {
    setNewProvince(prov);
    const dists = getDistrictsForProvince(prov);
    setNewDistrict(dists[0] || "");
  };

  // Modal: Ödev Değiştir
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(MEB_UNITS[0]);
  const [assignDueDate, setAssignDueDate] = useState("Bu Pazar 20:00");
  const [assignTarget, setAssignTarget] = useState(15);

  const teacherName = profile?.displayName || "İngilizce Öğretmeni";

  // Sınıfları yükle
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!uid) {
        // Misafir veya ilk öğretmen oturumu için demo sınıf verisi
        const demoClass = {
          classCode: "M4-8K2",
          className: "4-A İngilizce",
          schoolName: "Örnek İlkokul",
          province: "İstanbul",
          district: "Kadıköy",
          teacherName,
          grade: "4. Sınıf",
          currentAssignment: {
            unitName: "4. Sınıf Ünite 2: Nationality",
            levelId: "meb-4-sinif-kelimeleri",
            targetWords: 15,
            dueDate: "Bu Pazar 20:00",
          },
          studentsCount: 6,
          students: {
            s1: { uid: "s1", name: "Kerem Yılmaz", wordsLearned: 15, accuracy: 96, lastStudiedAt: Date.now() - 15 * 60000, status: "Tamamlandı" },
            s2: { uid: "s2", name: "Zeynep Kaya", wordsLearned: 14, accuracy: 92, lastStudiedAt: Date.now() - 60 * 60000, status: "Tamamlandı" },
            s3: { uid: "s3", name: "Ali Demir", wordsLearned: 10, accuracy: 88, lastStudiedAt: Date.now() - 3 * 3600000, status: "Devam Ediyor" },
            s4: { uid: "s4", name: "Elif Çelik", wordsLearned: 8, accuracy: 85, lastStudiedAt: Date.now() - 5 * 3600000, status: "Devam Ediyor" },
            s5: { uid: "s5", name: "Burak Şahin", wordsLearned: 0, accuracy: 0, lastStudiedAt: null, status: "Başlamadı" },
            s6: { uid: "s6", name: "Merve Koç", wordsLearned: 15, accuracy: 94, lastStudiedAt: Date.now() - 24 * 3600000, status: "Tamamlandı" },
          },
        };
        if (isMounted) {
          setClassrooms([demoClass]);
          setActiveClass(demoClass);
          setLoading(false);
        }
        return;
      }

      try {
        const list = await getTeacherClassrooms(uid);
        if (isMounted) {
          if (list.length > 0) {
            setClassrooms(list);
            setActiveClass(list[0]);
          }
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [uid, teacherName]);

  const handleCopyCode = () => {
    if (!activeClass) return;
    navigator.clipboard.writeText(activeClass.classCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateNewClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const created = await createClassroom(uid || "teacher_guest", {
        className: newClassName.trim(),
        schoolName: newSchoolName.trim() || "İlkokul",
        province: newProvince,
        district: newDistrict,
        grade: newClassGrade,
        teacherName,
      });

      const nextList = [created, ...classrooms];
      setClassrooms(nextList);
      setActiveClass(created);
      setShowCreateModal(false);
      setNewClassName("");
      setNewSchoolName("");
    } catch (err) {
      alert(err.message || "Sınıf oluşturulamadı.");
    }
  };

  const handleAssignHomework = async (e) => {
    e.preventDefault();
    if (!activeClass) return;

    const newAssignment = {
      unitName: selectedUnit.label,
      levelId: selectedUnit.levelId,
      targetWords: Number(assignTarget) || 15,
      dueDate: assignDueDate || "Bu Pazar 20:00",
    };

    try {
      await assignHomework(activeClass.classCode, newAssignment);
      const updated = {
        ...activeClass,
        currentAssignment: newAssignment,
      };
      setActiveClass(updated);
      setClassrooms(classrooms.map((c) => (c.classCode === updated.classCode ? updated : c)));
      setShowAssignModal(false);
    } catch (err) {
      alert("Ödev atanamadı.");
    }
  };

  const handleWhatsAppShare = () => {
    if (!activeClass) return;
    const text = `📢 *${activeClass.className} İngilizce Ödev Duyurusu* 📢
Sayın Velilerimiz ve Sevgili Öğrenciler,

Bu haftaki İngilizce MEB kelime ödevimiz *Memolandum* üzerinde tanımlanmıştır:
📚 *Ödev:* ${activeClass.currentAssignment?.unitName || "MEB Kelimeleri"}
🎯 *Hedef:* ${activeClass.currentAssignment?.targetWords || 15} Kelime
⏱️ *Son Teslim:* ${activeClass.currentAssignment?.dueDate || "Pazar 20:00"}

Öğrencilerimiz sisteme girip sınıf kodumuz olan *${activeClass.classCode}* ile doğrudan sınıfa bağlanabilirler.
Giriş: https://memolandum.com/schools/`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const studentList = activeClass?.students ? Object.values(activeClass.students) : [];
  const completedCount = studentList.filter((s) => s.status === "Tamamlandı").length;
  const avgAccuracy = studentList.length > 0
    ? Math.round(studentList.reduce((acc, s) => acc + (s.accuracy || 0), 0) / studentList.length)
    : 90;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Sınıf Seçici & Üst Kontrol Barı */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {teacherName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Öğretmen Paneli
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sınıflarınızı yönetin, ödev atayın ve öğrenci kelime hafızasını canlı izleyin.
            </p>
          </div>
        </div>

        {/* Sınıf Sekmeleri ve Yeni Sınıf Aç Butonu */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {classrooms.map((cls) => (
            <button
              key={cls.classCode}
              onClick={() => setActiveClass(cls)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeClass?.classCode === cls.classCode
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {cls.className} ({cls.classCode})
            </button>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sınıf Aç</span>
          </button>
        </div>
      </div>

      {activeClass && (
        <>
          {/* Aktif Sınıf Başlık Kartı & Akıllı Tahta Kodu */}
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              {/* Sol: Sınıf ve Okul Detayı */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeClass.grade || "MEB İngilizce"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeClass.schoolName}
                    {activeClass.district && activeClass.province && ` · ${activeClass.district} / ${activeClass.province}`}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeClass.className}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <strong className="text-white">{studentList.length}</strong> Öğrenci Kayıtlı
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <strong className="text-white">{completedCount}</strong> Ödevi Tamamladı
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <strong className="text-white">%{avgAccuracy}</strong> Sınıf Başarısı
                  </span>
                </div>
              </div>

              {/* Sağ: 6 Haneli Sınıf Katılım Kodu (Akıllı Tahta Kartı) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border-2 border-amber-400/40 flex flex-col items-center text-center shadow-lg w-full lg:w-auto">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                  Öğrenci Sınıf Katılım Kodu
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-widest my-1">
                  {activeClass.classCode}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Kopyalandı!" : "Kodu Kopyala"}</span>
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="Veli grubuna ödev hatırlatması gönder"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Duyuru</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Atanan Güncel Ödev Şeridi */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Sınıfın Güncel MEB Ödevi
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    {activeClass.currentAssignment?.unitName || "MEB Kelimeleri"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Hedef: {activeClass.currentAssignment?.targetWords || 15} Kelime • Son Teslim: {activeClass.currentAssignment?.dueDate || "Pazar 20:00"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Yeni Ödev Tanımla</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Sınıf Raporunu Yazdır / PDF İndir"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Canlı Öğrenci İlerleme Tablosu (Gradebook) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Öğrenci Çalışma & Hafıza Takip Listesi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrenciler Memolandum'da çalıştıkça sonuçlar anlık olarak bu tabloya yansır.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Canlı Eşitleme
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Öğrenci Adı</th>
                    <th className="p-4">Tamamlanan Kelime</th>
                    <th className="p-4">Hafıza Başarısı</th>
                    <th className="p-4">Son Çalışma</th>
                    <th className="p-4 text-right">Ödev Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentList.map((student, idx) => {
                    const isCompleted = student.status === "Tamamlandı";
                    const isStarted = student.wordsLearned > 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-300">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-white">{student.wordsLearned}</span>
                          <span className="text-slate-500"> / {activeClass.currentAssignment?.targetWords || 15} Kelime</span>
                        </td>
                        <td className="p-4 font-bold">
                          {student.accuracy > 0 ? (
                            <span className={student.accuracy >= 90 ? "text-emerald-400" : "text-amber-400"}>
                              %{student.accuracy}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">
                          {student.lastStudiedAt ? (
                            <span>{new Date(student.lastStudiedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                          ) : (
                            <span className="text-slate-600">Henüz girmedi</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                            </span>
                          ) : isStarted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Devam Ediyor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Başlamadı
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Yeni Sınıf Açma */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <School className="w-5 h-5 text-cyan-400" />
                Yeni İngilizce Sınıfı Aç
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClass} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sınıf / Şube Adı:
                </label>
                <input
                  type="text"
                  placeholder="Örn: 4-A İngilizce, 3-B İlkokul"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              {/* İl & İlçe Seçimi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    İl:
                  </label>
                  <select
                    value={newProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                  >
                    {TURKEY_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    İlçe:
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                  >
                    {getDistrictsForProvince(newProvince).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Okul Adı:
                </label>
                <input
                  type="text"
                  placeholder="Örn: Atatürk İlkokulu, Bahçeşehir Koleji..."
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Sınıf Seviyesi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf"].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setNewClassGrade(g)}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        newClassGrade === g
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 disabled:opacity-50"
                >
                  Sınıfı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Yeni Ödev Atama */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Sınıfa MEB Ünite Ödevi Ata
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignHomework} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  MEB Ünite Seçimi:
                </label>
                <select
                  value={selectedUnit.label}
                  onChange={(e) => {
                    const u = MEB_UNITS.find((m) => m.label === e.target.value);
                    if (u) setSelectedUnit(u);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                >
                  {MEB_UNITS.map((u, i) => (
                    <option key={i} value={u.label}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Hedef Kelime:
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={assignTarget}
                    onChange={(e) => setAssignTarget(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Son Teslim Tarihi:
                  </label>
                  <input
                    type="text"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                    placeholder="Bu Pazar 20:00"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  Ödevi Sınıfa Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
