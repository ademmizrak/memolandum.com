"use client";

import React, { useState, useEffect } from "react";
import {
  School,
  Users,
  BookOpen,
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
  X,
  StickyNote,
  UserPlus,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Pencil,
} from "lucide-react";
import {
  createClassroom,
  subscribeTeacherClassrooms,
  assignHomework,
  setTeacherNote,
  subscribeTeacherNotes,
  addStudentToClassroom,
  updateStudentInClassroom,
  removeStudentFromClassroom,
  deleteClassroom,
  updateStudentExamScores,
  toggleExamScoresPrivacy,
  toggleClassroomLock,
} from "../../lib/schools/schoolService";
import { MEB_HOMEWORK_UNITS, defaultAssignmentForGrade, findHomeworkUnit } from "../../lib/schools/mebHomeworkUnits";
import { TURKEY_PROVINCES, getDistrictsForProvince } from "../../lib/schools/turkeyLocations";
import {
  TEACHER_AVATAR_PRESETS,
  STUDENT_AVATAR_PRESETS,
  DEFAULT_SCHOOL_LABEL,
  suggestTeacherDisplayLabel,
  resolveTeacherAvatar,
  formatSchoolLine,
} from "../../lib/schools/teacherIdentity";
import { getTeacherParentGroupBulletinUrl } from "../../lib/reports/reportGenerator";
import { useMemolandumStore } from "../../store/useMemolandumStore";

function TeacherAvatarBadge({ avatar, label, size = "md" }) {
  const dim = size === "lg" ? "w-12 h-12 text-xl" : "w-9 h-9 text-base";
  if (avatar?.type === "url" && avatar?.value) {
    return (
      <img
        src={avatar.value}
        alt=""
        className={`${dim} rounded-xl object-cover border border-cyan-500/30 bg-slate-900`}
      />
    );
  }
  const emoji = avatar?.value || "🦉";
  return (
    <div
      className={`${dim} rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center`}
      title={label || ""}
      aria-hidden
    >
      {emoji}
    </div>
  );
}

export default function TeacherDashboard({ onRequestAuth, onOpenGuide }) {
  const profile = useMemolandumStore((s) => s.profile);
  const uid = useMemolandumStore((s) => s.uid);
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);

  const [classrooms, setClassrooms] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sınıf / Okul Oluşturma State'i
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCreationType, setNewCreationType] = useState("school_and_class"); // 'school_and_class' | 'class_only' | 'school_only'
  const [newClassName, setNewClassName] = useState("");
  const [newTeacherLabel, setNewTeacherLabel] = useState("");
  const [newAvatarId, setNewAvatarId] = useState("owl");
  const [newSchoolLabel, setNewSchoolLabel] = useState("");
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [newCustomCode, setNewCustomCode] = useState("");
  const [shareExamScores, setShareExamScores] = useState(false);
  const [gradeCategory, setGradeCategory] = useState("ilkokul");
  const [showLocation, setShowLocation] = useState(false);
  const [newProvince, setNewProvince] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("2. Sınıf");

  const openCreateModal = (presetType = "school_and_class") => {
    if (!uid || !isAuthenticated) {
      onRequestAuth?.();
      return;
    }
    setNewCreationType(presetType);
    setNewTeacherLabel(suggestTeacherDisplayLabel(profile));
    setNewAvatarId(profile?.photoURL ? "photo" : "owl");
    setNewSchoolLabel("");
    setUseCustomCode(false);
    setNewCustomCode("");
    setShareExamScores(false);
    setGradeCategory("ilkokul");
    setShowLocation(false);
    setNewProvince("");
    setNewDistrict("");
    setNewClassName("");
    setNewClassGrade("2. Sınıf");
    setShowCreateModal(true);
  };

  const handleProvinceChange = (prov) => {
    setNewProvince(prov);
    const dists = getDistrictsForProvince(prov);
    setNewDistrict(dists[0] || "");
  };

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(MEB_HOMEWORK_UNITS[1]);
  const [assignDueDate, setAssignDueDate] = useState("Bu Pazar 20:00");
  const [assignTarget, setAssignTarget] = useState(15);
  const [teacherNotes, setTeacherNotes] = useState({});
  const [noteModalStudent, setNoteModalStudent] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTag, setNoteTag] = useState("Genel Gözlem");
  const [noteSaving, setNoteSaving] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Öğretmen manuel roster yönetimi (Rumuz + Avatar + Opsiyonel No)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAvatar, setNewStudentAvatar] = useState(STUDENT_AVATAR_PRESETS[0].emoji);
  const [newStudentNo, setNewStudentNo] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setNewStudentName("");
    setNewStudentAvatar(
      STUDENT_AVATAR_PRESETS[studentList.length % STUDENT_AVATAR_PRESETS.length]?.emoji || "🦁"
    );
    setNewStudentNo("");
    setShowAddStudentModal(true);
  };

  const openEditStudentModal = (student) => {
    if (!student) return;
    setEditingStudent(student);
    setNewStudentName(student.name || "");
    setNewStudentAvatar(student.avatar || "🦁");
    setNewStudentNo(student.studentNo || "");
    setShowAddStudentModal(true);
  };

  // Sınav Notları Yönetimi (1. Yazılı, 2. Yazılı, Quiz / Sözlü)
  const [examModalStudent, setExamModalStudent] = useState(null);
  const [exam1Input, setExam1Input] = useState("");
  const [exam2Input, setExam2Input] = useState("");
  const [quizInput, setQuizInput] = useState("");
  const [examSaving, setExamSaving] = useState(false);

  const openExamModal = (student) => {
    setExamModalStudent(student);
    const scores = student?.examScores || {};
    setExam1Input(scores.exam1 != null ? String(scores.exam1) : "");
    setExam2Input(scores.exam2 != null ? String(scores.exam2) : "");
    setQuizInput(scores.quiz != null ? String(scores.quiz) : "");
  };

  const handleToggleExamPrivacy = async () => {
    if (!activeClass?.classCode) return;
    const nextVal = !activeClass.shareExamScoresWithStudents;
    try {
      await toggleExamScoresPrivacy(activeClass.classCode, nextVal);
      setActiveClass((prev) =>
        prev ? { ...prev, shareExamScoresWithStudents: nextVal } : prev
      );
      setClassrooms((prev) =>
        prev.map((c) =>
          c.classCode === activeClass.classCode
            ? { ...c, shareExamScoresWithStudents: nextVal }
            : c
        )
      );
    } catch (err) {
      alert(err?.message || "Sınav gizlilik tercihi güncellenemedi.");
    }
  };

  const handleToggleClassLock = async () => {
    if (!activeClass?.classCode) return;
    const nextLocked = !activeClass.isLocked;
    try {
      await toggleClassroomLock(activeClass.classCode, nextLocked);
      setActiveClass((prev) => (prev ? { ...prev, isLocked: nextLocked } : prev));
      setClassrooms((prev) =>
        prev.map((c) =>
          c.classCode === activeClass.classCode ? { ...c, isLocked: nextLocked } : c
        )
      );
    } catch (err) {
      alert(err?.message || "Sınıf kilidi güncellenemedi.");
    }
  };

  const handleSaveExamScores = async (e) => {
    e.preventDefault();
    if (!examModalStudent?.uid || !activeClass?.classCode) return;
    try {
      setExamSaving(true);
      const res = await updateStudentExamScores(activeClass.classCode, examModalStudent.uid, {
        exam1: exam1Input,
        exam2: exam2Input,
        quiz: quizInput,
      });
      // Anlık arayüz güncellemesi (Gecikmesiz)
      if (res?.students) {
        setActiveClass((prev) => (prev ? { ...prev, students: res.students } : prev));
        setClassrooms((prev) =>
          prev.map((c) =>
            c.classCode === activeClass.classCode ? { ...c, students: res.students } : c
          )
        );
      }
      setExamModalStudent(null);
    } catch (err) {
      alert(err?.message || "Sınav notları kaydedilemedi.");
    } finally {
      setExamSaving(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeClass?.classCode) return;
    try {
      setAddingStudent(true);
      if (editingStudent?.uid) {
        const res = await updateStudentInClassroom(activeClass.classCode, editingStudent.uid, {
          name: newStudentName.trim(),
          avatar: newStudentAvatar || "🦁",
          studentNo: newStudentNo.trim(),
        });
        if (res?.students) {
          setActiveClass((prev) => (prev ? { ...prev, students: res.students } : prev));
        }
      } else {
        const res = await addStudentToClassroom(activeClass.classCode, {
          name: newStudentName.trim(),
          avatar: newStudentAvatar || "🦁",
          studentNo: newStudentNo.trim(),
        });
        if (res?.students) {
          setActiveClass((prev) =>
            prev
              ? { ...prev, students: res.students, studentsCount: res.studentsCount }
              : prev
          );
        }
      }
      setEditingStudent(null);
      setNewStudentName("");
      setNewStudentNo("");
      setShowAddStudentModal(false);
    } catch (err) {
      alert(err?.message || "Öğrenci kaydedilemedi.");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!deleteConfirmStudent?.uid || !activeClass?.classCode) return;
    try {
      setRemovingStudent(true);
      await removeStudentFromClassroom(activeClass.classCode, deleteConfirmStudent.uid);
      setDeleteConfirmStudent(null);
    } catch (err) {
      alert(err?.message || "Öğrenci listeden silinemedi.");
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!activeClass?.classCode) return;
    try {
      setDeletingClass(true);
      await deleteClassroom(activeClass.classCode);
      setShowDeleteClassModal(false);
      setActiveClass(null);
    } catch (err) {
      alert(err?.message || "Sınıf silinemedi.");
    } finally {
      setDeletingClass(false);
    }
  };

  const formatStudentLastStudied = (ts) => {
    if (!ts) return null;
    const ms = ts?.seconds ? ts.seconds * 1000 : Number(ts);
    if (!ms || isNaN(ms)) return null;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  const deskLabel =
    activeClass?.teacherName ||
    suggestTeacherDisplayLabel(profile) ||
    "Öğretmen masası";
  const deskAvatar = activeClass?.teacherAvatar || {
    type: "emoji",
    value: "🦉",
  };

  useEffect(() => {
    if (!uid || !isAuthenticated) {
      setClassrooms([]);
      setActiveClass(null);
      setLoading(false);
      setLiveConnected(false);
      return undefined;
    }

    setLoading(true);
    const storageKey = `memolandum_active_teacher_class:${uid}`;
    const unsub = subscribeTeacherClassrooms(uid, (list) => {
      setClassrooms(list);
      setLiveConnected(true);
      setLoading(false);
      setActiveClass((prev) => {
        if (!list.length) return null;
        if (prev) {
          const match = list.find((c) => c.classCode === prev.classCode);
          if (match) return match;
        }
        try {
          const savedCode = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
          if (savedCode) {
            const savedMatch = list.find((c) => c.classCode === savedCode);
            if (savedMatch) return savedMatch;
          }
        } catch {
          /* ignore */
        }
        return list[0];
      });
    });
    return () => unsub();
  }, [uid, isAuthenticated]);

  useEffect(() => {
    if (!activeClass?.classCode || !uid) {
      setTeacherNotes({});
      return undefined;
    }
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`memolandum_active_teacher_class:${uid}`, activeClass.classCode);
      }
    } catch {
      /* ignore */
    }
    const currentUnit = activeClass.currentAssignment
      ? findHomeworkUnit(activeClass.currentAssignment.levelId, activeClass.currentAssignment.unitNo)
      : null;
    const fallbackUnit = defaultAssignmentForGrade(activeClass.grade);
    if (currentUnit || fallbackUnit) {
      setSelectedUnit(currentUnit || fallbackUnit);
    }
    return subscribeTeacherNotes(activeClass.classCode, setTeacherNotes);
  }, [activeClass?.classCode, activeClass?.grade, uid]);

  const buildInviteText = () => {
    if (!activeClass) return "";
    const teacher = activeClass.teacherName || deskLabel;
    return `📚 Memolandum sınıf daveti
Öğretmen: ${teacher}
Sınıf: ${activeClass.className}
Kod: *${activeClass.classCode}*

Katılım: https://memolandum.com/schools/
Gerçek ad veya okul kimliği gerekmez — takma ad yeterli.
Ödev ve ilerleme yalnızca sınıf öğretmeni ile kodla katılan hesaplar arasında kalır.`;
  };

  const handleCopyInvite = async () => {
    const text = buildInviteText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleCopyCode = () => {
    if (!activeClass) return;
    navigator.clipboard.writeText(activeClass.classCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateNewClass = async (e) => {
    e.preventDefault();
    if (newCreationType === "class_only" && !newClassName.trim()) {
      alert("Lütfen sınıf / grup adını girin (Örn: 10-B veya Özel Ders).");
      return;
    }
    if (newCreationType === "school_only" && !newSchoolLabel.trim()) {
      alert("Lütfen okul adını girin (Örn: Atatürk Anadolu Lisesi).");
      return;
    }
    if (newCreationType === "school_and_class" && !newClassName.trim()) {
      alert("Lütfen sınıf veya şube adını girin (Örn: 4-A).");
      return;
    }
    if (!uid || !isAuthenticated) {
      onRequestAuth?.();
      return;
    }

    const label = newTeacherLabel.trim() || "Öğretmen";
    const avatar = resolveTeacherAvatar(newAvatarId, profile?.photoURL);

    try {
      const created = await createClassroom(uid, {
        creationType: newCreationType,
        className: newClassName.trim(),
        schoolName: newSchoolLabel.trim(),
        schoolLabel: newSchoolLabel.trim(),
        province: showLocation ? newProvince : "",
        district: showLocation ? newDistrict : "",
        grade: newClassGrade,
        teacherDisplayLabel: label,
        teacherAvatar: avatar,
        customCode: useCustomCode && newCustomCode.trim() ? newCustomCode.trim() : null,
        shareExamScoresWithStudents: shareExamScores,
      });

      setActiveClass(created);
      setShowCreateModal(false);
      setNewClassName("");
      setNewSchoolLabel("");
      setNewCustomCode("");
      setUseCustomCode(false);
    } catch (err) {
      alert(err?.message || "Sınıf oluşturulamadı.");
    }
  };

  const handleAssignHomework = async (e) => {
    e.preventDefault();
    if (!activeClass || !uid) return;

    try {
      const payload = await assignHomework(activeClass.classCode, {
        unitName: selectedUnit.label,
        unitTitle: selectedUnit.label,
        levelId: selectedUnit.levelId,
        unitNo: selectedUnit.unitNo,
        targetWords: Number(assignTarget) || 15,
        dueDate: assignDueDate || "Bu Pazar 20:00",
      });
      const updated = {
        ...activeClass,
        currentAssignment: payload,
      };
      setActiveClass(updated);
      setShowAssignModal(false);
    } catch (err) {
      alert(err?.message || "Ödev atanamadı.");
    }
  };

  const handleWhatsAppShare = () => {
    if (!activeClass) return;
    const homeworkBit = activeClass.currentAssignment
      ? `\n\n📌 Ödev: ${activeClass.currentAssignment.unitName || "Haftalık Kelimeler"} (${activeClass.currentAssignment.targetWords || 15} kelime, ${activeClass.currentAssignment.dueDate || "Pazar"})`
      : "";
    const text = `${buildInviteText()}${homeworkBit}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openNoteModal = (student) => {
    const sid = student.uid;
    setNoteModalStudent(student);
    const existing = teacherNotes[sid] || {};
    setNoteDraft(existing.text || "");
    setNoteTag(existing.tag || "Genel Gözlem");
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteModalStudent?.uid || !activeClass?.classCode || !uid) return;
    try {
      setNoteSaving(true);
      const payload = await setTeacherNote(
        activeClass.classCode,
        noteModalStudent.uid,
        { text: noteDraft, tag: noteTag },
        uid
      );
      // Anlık arayüz güncellemesi
      setTeacherNotes((prev) => ({
        ...prev,
        [noteModalStudent.uid]: payload,
      }));
      setNoteModalStudent(null);
    } catch (err) {
      alert(err?.message || "Not kaydedilemedi.");
    } finally {
      setNoteSaving(false);
    }
  };

  const studentList =
    activeClass?.students && typeof activeClass.students === "object"
      ? Object.values(activeClass.students).filter(Boolean)
      : [];
  const completedCount = studentList.filter((s) => s?.status === "Tamamlandı").length;
  const scored = studentList.filter(
    (s) => s?.accuracy != null && !isNaN(Number(s.accuracy)) && Number(s.accuracy) > 0
  );
  const avgAccuracy =
    scored.length > 0
      ? Math.round(
          scored.reduce((acc, s) => acc + (Number(s?.accuracy) || 0), 0) / scored.length
        )
      : null;

  if (!uid || !isAuthenticated) {
    return (
      <div className="p-8 rounded-3xl border-2 border-cyan-500/30 bg-slate-900/80 text-center space-y-4">
        <School className="w-12 h-12 text-cyan-400 mx-auto" />
        <h2 className="text-xl font-black text-white">Öğretmen paneli için giriş gerekli</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Sınıf oluşturmak için Memolandum hesabınız yeterli. Gerçek ad veya okul kimliği zorunlu değil;
          rumuz ve avatar ile çalışabilirsiniz. Demo öğrenci listesi gösterilmez.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => onRequestAuth?.()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm cursor-pointer"
          >
            Giriş Yap / Üye Ol
          </button>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verileriniz Nasıl Korunur? (Rehber)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 text-center text-slate-400 text-sm">
        Sınıflar yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <TeacherAvatarBadge avatar={deskAvatar} label={deskLabel} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {deskLabel}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Öğretmen Masası
              </span>
              {onOpenGuide ? (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" /> Güvenlik & Kullanım Rehberi →
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Roster kodsuzlara kapalı
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evden veya okuldan — rumuz / avatar ile sınıf açın. Liste yalnızca sizde; katılım güvenli kod ile.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {classrooms.map((cls) => {
            const isSchoolOnly = cls.creationType === "school_only";
            const isClassOnly = cls.creationType === "class_only";
            const icon = isSchoolOnly ? "🏛️ " : isClassOnly ? "👥 " : "🏫 ";
            return (
              <button
                key={cls.classCode}
                onClick={() => setActiveClass(cls)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeClass?.classCode === cls.classCode
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <span>{icon}</span>
                <span>{cls.className || cls.schoolName}</span>
                <span className="text-[10px] font-mono opacity-80 font-normal">({cls.classCode})</span>
              </button>
            );
          })}

          <button
            onClick={() => openCreateModal("school_and_class")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sınıf / Okul Aç</span>
          </button>
        </div>
      </div>

      {/* Profil Mahremiyeti Güvence Şeridi */}
      <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-emerald-300">Profil Mahremiyeti Aktif:</strong> Girdiğiniz sınav puanları ve pedagojik gözlem notlarınız siz izin vermedikçe öğrenci veya veliyle kesinlikle paylaşılmaz.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap hidden sm:inline">
          🔒 Tam Gizli
        </span>
      </div>

      {!activeClass && (
        <div className="p-8 rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 text-center space-y-4">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Masanız henüz boş — İhtiyacınıza göre 1 dakikada başlatın</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            İster sadece bir okul, ister okul ve sınıfınızı, ister özel ders veya kurs grubunuzu hemen tanımlayın. Kodlama zorunluluğu olmadan dilediğiniz gibi öğrenci ekleyin ve not alın.
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
            <button
              type="button"
              onClick={() => openCreateModal("school_and_class")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-cyan-600/20"
            >
              <School className="w-4 h-4" />
              <span>🏫 Okul + Sınıf Aç</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateModal("class_only")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>👥 Sadece Sınıf / Grup Aç</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateModal("school_only")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
            >
              <School className="w-4 h-4" />
              <span>🏛️ Sadece Okul Tanımla</span>
            </button>
          </div>
        </div>
      )}

      {activeClass && (
        <>
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeClass.grade || "Genel İngilizce"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {activeClass.creationType === "school_only"
                      ? "🏛️ Kurumsal Okul Masası"
                      : activeClass.creationType === "class_only"
                      ? "👥 Bağımsız Sınıf / Grup"
                      : "🏫 Okul + Sınıf"}
                  </span>
                  <span className="text-xs text-slate-400">{formatSchoolLine(activeClass)}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeClass.className}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
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
                    <strong className="text-white">
                      {avgAccuracy != null ? `%${avgAccuracy}` : "—"}
                    </strong>{" "}
                    Sınıf Başarısı
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border-2 border-amber-400/40 flex flex-col items-center text-center shadow-lg w-full lg:w-auto">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                  Öğrenci Sınıf Katılım Kodu
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-widest my-1">
                  {activeClass.classCode}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? "Kopyalandı!" : "Kodu Kopyala"}</span>
                  </button>
                  <button
                    onClick={handleCopyInvite}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    {inviteCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{inviteCopied ? "Davet kopyalandı" : "Davet metni"}</span>
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="Veli / öğrenci grubuna davet gönder"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Davet</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleClassLock}
                    title={
                      activeClass.isLocked
                        ? "Yeni öğrenci katılımı kilitli (Açmak için tıklayın)"
                        : "Sınıf mevcudu tamamlandıysa dışarıdan yeni katılımları kilitleyin"
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      activeClass.isLocked
                        ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{activeClass.isLocked ? "🔒 Katılım Kilitli" : "🔓 Katılım Açık"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Sınıfın Güncel Ödevi
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    {activeClass.currentAssignment?.unitName || "Haftalık Kelimeler"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Hedef: {activeClass.currentAssignment?.targetWords || 15} Kelime • Son Teslim:{" "}
                    {activeClass.currentAssignment?.dueDate || "Pazar 20:00"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <a
                  href={getTeacherParentGroupBulletinUrl(activeClass)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-black transition-all cursor-pointer"
                  title="Veli WhatsApp grubuna haftalık ödev bülteni, sınıf kodu ve 1 dk Veli Rehberi linkini tek tıkla gönderin"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>📲 Veli Grubuna Haftalık Bülten</span>
                </a>
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
                <button
                  type="button"
                  onClick={() => setShowDeleteClassModal(true)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                  title="Bu sınıfı kalıcı olarak sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Öğrenci Çalışma & Hafıza Takip Listesi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Öğrencilerinizi tek sefer ekleyin veya 6 haneli kodla katılsınlar. Veriler güvenle korunur.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={openAddStudentModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Öğrenci Ekle</span>
                </button>
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                    liveConnected
                      ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
                      : "text-slate-400 bg-slate-800 border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      liveConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                    }`}
                  />
                  {liveConnected ? "Canlı dinleme" : "Bağlanıyor"}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Öğrenci (Rumuz & Avatar)</th>
                    <th className="p-4">Tamamlanan Kelime</th>
                    <th className="p-4">Hafıza Başarısı</th>
                    <th className="p-4">Sınav Notları (1 / 2 / Q)</th>
                    <th className="p-4 text-center">Ortalama</th>
                    <th className="p-4">Son Çalışma</th>
                    <th className="p-4">Özel not</th>
                    <th className="p-4 text-right">Ödev Durumu</th>
                    <th className="p-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentList.map((student, idx) => {
                    const isCompleted = student?.status === "Tamamlandı";
                    const displayName = student?.name || "Öğrenci";
                    const studentAvatar = student?.avatar || null;
                    const lastStudied = formatStudentLastStudied(student?.lastStudiedAt);
                    return (
                      <tr
                        key={student?.uid || idx}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-white flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openEditStudentModal(student)}
                            title="Öğrenci rumuzunu ve avatarını düzenle"
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 flex items-center justify-center text-sm font-bold text-cyan-300 transition-colors cursor-pointer shrink-0"
                          >
                            {studentAvatar || displayName.charAt(0)}
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditStudentModal(student)}
                                className="hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer text-left"
                                title="Rumuz / Avatar / No düzenle"
                              >
                                <span>{displayName}</span>
                                <Pencil className="w-2.5 h-2.5 text-slate-500 opacity-70" />
                              </button>
                              {student?.isManual && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                                  Roster
                                </span>
                              )}
                            </div>
                            {student?.studentNo && (
                              <div className="text-[10px] text-slate-500 font-mono font-normal">
                                No: {student.studentNo}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-white">{student?.wordsLearned ?? 0}</span>
                          <span className="text-slate-500">
                            {" "}
                            / {activeClass.currentAssignment?.targetWords || 15} Kelime
                          </span>
                        </td>
                        <td className="p-4 font-bold">
                          {student?.accuracy > 0 ? (
                            <span
                              className={
                                student.accuracy >= 90 ? "text-emerald-400" : "text-amber-400"
                              }
                            >
                              %{student.accuracy}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => openExamModal(student)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white transition-all group cursor-pointer"
                            title="Sınav notlarını düzenle"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span className="font-mono">
                              1.S: <strong className={student?.examScores?.exam1 != null ? "text-cyan-300 font-bold" : "text-slate-500 font-normal"}>{student?.examScores?.exam1 != null ? student.examScores.exam1 : "-"}</strong>
                              {" "}|{" "}
                              2.S: <strong className={student?.examScores?.exam2 != null ? "text-cyan-300 font-bold" : "text-slate-500 font-normal"}>{student?.examScores?.exam2 != null ? student.examScores.exam2 : "-"}</strong>
                              {" "}|{" "}
                              Q: <strong className={student?.examScores?.quiz != null ? "text-cyan-300 font-bold" : "text-slate-500 font-normal"}>{student?.examScores?.quiz != null ? student.examScores.quiz : "-"}</strong>
                            </span>
                          </button>
                        </td>
                        <td className="p-4 text-center font-bold">
                          {student?.examScores?.avg != null ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md font-mono text-xs ${
                                student.examScores.avg >= 85
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : student.examScores.avg >= 70
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : student.examScores.avg >= 50
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {student.examScores.avg}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono">-</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">
                          {lastStudied ? (
                            <span>{lastStudied}</span>
                          ) : (
                            <span className="text-slate-600">Henüz girmedi</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => openNoteModal(student)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-300 border border-amber-500/30 cursor-pointer"
                          >
                            <StickyNote className="w-3 h-3" />
                            {teacherNotes[student?.uid]?.text ? "Düzenle" : "Not ekle"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                            </span>
                          ) : (student?.wordsLearned || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Devam Ediyor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Başlamadı
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmStudent(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Öğrenciyi sınıftan kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {studentList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 space-y-3">
                        <p>Henüz katılan veya eklenen öğrenci yok.</p>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={openAddStudentModal}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Öğrenci Ekle</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyInvite}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Davet Kodunu Kopyala</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <School className="w-5 h-5 text-cyan-400" />
                <span>Yeni Alan Oluştur</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Yapı Seçici (3 Mod) */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Oluşturmak İstediğiniz Yapı:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewCreationType("school_and_class")}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newCreationType === "school_and_class"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🏫 Okul + Sınıf
                </button>
                <button
                  type="button"
                  onClick={() => setNewCreationType("class_only")}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newCreationType === "class_only"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  👥 Sadece Sınıf
                </button>
                <button
                  type="button"
                  onClick={() => setNewCreationType("school_only")}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newCreationType === "school_only"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🏛️ Sadece Okul
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateNewClass} className="mt-4 space-y-4">
              {/* Dinamik Alanlar */}
              {newCreationType === "school_and_class" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Okul veya Masa Adı <span className="font-normal text-slate-500">(İsteğe bağlı — gerçek okul zorunlu değil)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Gazi Anadolu Lisesi veya boş bırakın (Özel Masa)"
                      value={newSchoolLabel}
                      onChange={(e) => setNewSchoolLabel(e.target.value.slice(0, 100))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Sınıf / Şube Adı <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 4-A, 7/C, 10-B İngilizce"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value.slice(0, 80))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>
                </>
              )}

              {newCreationType === "class_only" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Sınıf / Çalışma Grubu Adı <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 10-C, LGS Kamp Grubu, Özel Ders - Kerem"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value.slice(0, 80))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Masa / Not Etiketi <span className="font-normal text-slate-500">(İsteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Hafta Sonu Kursu, Bağımsız Masa"
                      value={newSchoolLabel}
                      onChange={(e) => setNewSchoolLabel(e.target.value.slice(0, 80))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {newCreationType === "school_only" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Okul / Kurum Adı <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Cumhuriyet Fen Lisesi, Özel Bilfen Koleji"
                      value={newSchoolLabel}
                      onChange={(e) => setNewSchoolLabel(e.target.value.slice(0, 100))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Okul Masası Tanımı <span className="font-normal text-slate-500">(İsteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Tüm Okul Zümresi, Yabancı Diller Bölümü"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value.slice(0, 80))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Kademe & Sınıf Seviyesi Seçimi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Sınıf / Kademe Seviyesi</label>
                  <span className="text-[11px] font-bold text-cyan-300">{newClassGrade}</span>
                </div>
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px] font-bold">
                  {[
                    { id: "ilkokul", label: "İlkokul (1-4)" },
                    { id: "ortaokul", label: "Ortaokul (5-8)" },
                    { id: "lise", label: "Lise (9-12)" },
                    { id: "sinav", label: "Sınav & Özel" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setGradeCategory(tab.id)}
                      className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        gradeCategory === tab.id
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {gradeCategory === "ilkokul" &&
                    ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setNewClassGrade(g)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                          newClassGrade === g
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  {gradeCategory === "ortaokul" &&
                    ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setNewClassGrade(g)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                          newClassGrade === g
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  {gradeCategory === "lise" &&
                    ["9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setNewClassGrade(g)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                          newClassGrade === g
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  {gradeCategory === "sinav" &&
                    ["YDS / YÖKDİL", "LGS Kampı", "Özel Ders", "Genel İngilizce"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setNewClassGrade(g)}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center cursor-pointer truncate ${
                          newClassGrade === g
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                        }`}
                        title={g}
                      >
                        {g}
                      </button>
                    ))}
                </div>
              </div>

              {/* Katılım Kodu Tercihi */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Sınıf Katılım Kodu</span>
                  <label className="flex items-center gap-1.5 text-[11px] text-cyan-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomCode}
                      onChange={(e) => setUseCustomCode(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    Özel Kod Belirle
                  </label>
                </div>
                {useCustomCode ? (
                  <div>
                    <input
                      type="text"
                      value={newCustomCode}
                      onChange={(e) =>
                        setNewCustomCode(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16)
                        )
                      }
                      placeholder="Örn: ATA4A, BILFEN3, 10B-ING"
                      className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Öğrencilerinize duyuracağınız kolay bir kod seçebilirsiniz (3-16 karakter).
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    🎲 Sistemin üreteceği <strong className="text-slate-200">temiz 6 haneli PIN</strong> (örn: 682410) otomatik atanır. Kodsuz da öğrencileri manuel ekleyebilirsiniz.
                  </p>
                )}
              </div>

              {/* Öğretmen Rumuzu & Avatar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Görünecek Öğretmen Adı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: İngilizce Öğretmeni, Zümre"
                    value={newTeacherLabel}
                    onChange={(e) => setNewTeacherLabel(e.target.value.slice(0, 40))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:border-cyan-400 focus:outline-none"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Avatar</label>
                  <div className="flex items-center gap-1.5">
                    {TEACHER_AVATAR_PRESETS.slice(0, 5).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNewAvatarId(p.id)}
                        className={`w-8 h-8 rounded-lg text-base border transition-all cursor-pointer ${
                          newAvatarId === p.id
                            ? "border-cyan-400 bg-cyan-500/20 scale-105"
                            : "border-slate-700 bg-slate-800/60"
                        }`}
                      >
                        {p.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profil Mahremiyeti Rozeti */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-emerald-300">Profil Mahremiyeti:</strong> Öğrencilerle ilgili girdiğiniz sınav puanları ve özel pedagojik fikir notları siz açıkça izin vermedikçe öğrenci veya veliyle kesinlikle paylaşılmaz; yalnızca öğretmen masanızda korunur.
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 cursor-pointer"
                >
                  Alanı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noteModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Öğretmen Fikir & Gözlem Defteri
                  </h3>
                  <p className="text-xs text-amber-300 font-medium">
                    {noteModalStudent.name || "Öğrenci"} için kişisel kanaat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profil Mahremiyeti Rozeti */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                <strong>%100 Mahrem & Güvenli:</strong> Bu not yalnızca sizin öğretmen ekranınızda saklanır. Öğrenci veya veli asla görüntüleyemez.
              </p>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              {/* Not Kategorisi / Etiket Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Not / Gözlem Türü:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Genel Gözlem",
                    "Kelime Refleksi",
                    "Derse Katılım",
                    "Veli İletişimi",
                    "Özel Destek",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNoteTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        noteTag === tag
                          ? "bg-amber-500/20 border-amber-400 text-amber-300"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Kişisel Görüş ve Değerlendirmeniz:
                </label>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value.slice(0, 3000))}
                  rows={5}
                  maxLength={3000}
                  placeholder="Örn: Kelime refleksleri ve telaffuzu çok iyi. Ancak yazılıda çekim eklerinde zorlanıyor; motive edilmeli..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:border-amber-400 focus:outline-none resize-y"
                  autoFocus
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>* İstediğiniz an düzenleyebilir veya güncelleyebilirsiniz.</span>
                  <span>{noteDraft.length} / 3000</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteModalStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={noteSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {noteSaving ? "Kaydediliyor…" : "Notu Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Sınıfa Ünite Ödevi Ata
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
                  Müfredat Ünite Seçimi:
                </label>
                <select
                  value={selectedUnit.id}
                  onChange={(e) => {
                    const u = MEB_HOMEWORK_UNITS.find((m) => m.id === e.target.value);
                    if (u) setSelectedUnit(u);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                >
                  {MEB_HOMEWORK_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hedef Kelime:</label>
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
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  Ödevi Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Öğretmen Öğrenci Ekleme / Rumuz & Avatar Düzenleme (Roster Kalıcılığı) */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingStudent ? (
                  <>
                    <Pencil className="w-5 h-5 text-cyan-400" />
                    <span>Öğrenci Rumuz & Avatar Düzenle</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 text-cyan-400" />
                    <span>Sınıfa Öğrenci Ekle</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setShowAddStudentModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Öğrenci için gerçek ad/soyad zorunlu değildir; dilediğiniz bir rumuz (takma ad) ve avatar tanımlayabilirsiniz. Bilgiler yalnızca öğretmen masanızda saklanır.
            </p>

            <form onSubmit={handleAddStudent} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Öğrenci Adı veya Rumuzu <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Y., Zeynep, Yıldız 4B"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value.slice(0, 40))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Öğrenci Avatarı Tanımla:
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {STUDENT_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNewStudentAvatar(preset.emoji)}
                      title={preset.label}
                      className={`h-9 rounded-xl text-base border transition-all flex items-center justify-center cursor-pointer ${
                        newStudentAvatar === preset.emoji
                          ? "border-cyan-400 bg-cyan-500/20 scale-105 shadow-sm shadow-cyan-500/20"
                          : "border-slate-700/80 bg-slate-800/60 hover:bg-slate-800"
                      }`}
                    >
                      {preset.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Okul / Sınıf Numarası <span className="font-normal text-slate-500">(İsteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: 248, 12-A"
                  value={newStudentNo}
                  onChange={(e) => setNewStudentNo(e.target.value.slice(0, 20))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setShowAddStudentModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addingStudent || !newStudentName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {addingStudent
                    ? "Kaydediliyor…"
                    : editingStudent
                    ? "Değişiklikleri Kaydet"
                    : "Öğrenciyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Öğrenci Silme Onayı */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Öğrenciyi Sınıftan Kaldır</h4>
              <p className="text-xs text-slate-400 mt-1">
                <strong className="text-white">{deleteConfirmStudent.name || "Öğrenci"}</strong> isimli
                öğrenci bu sınıftan silinecektir.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={removingStudent}
                onClick={handleRemoveStudent}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {removingStudent ? "Siliniyor…" : "Evet, Kaldır"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sınıf Silme Onayı */}
      {showDeleteClassModal && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Sınıfı Kalıcı Olarak Sil</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                <strong className="text-white">{activeClass.className}</strong> ({activeClass.classCode})
                sınıfını silmek üzeresiniz. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteClassModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={deletingClass}
                onClick={handleDeleteClass}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {deletingClass ? "Siliniyor…" : "Sınıfı Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sınav Notları Girişi */}
      {examModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sınav ve Quiz Notları</h4>
                  <p className="text-xs text-slate-400">
                    <strong className="text-cyan-300">{examModalStudent.name || "Öğrenci"}</strong> için not girişi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExamModalStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamScores} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    1. Yazılı (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={exam1Input}
                    onChange={(e) => setExam1Input(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    2. Yazılı (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={exam2Input}
                    onChange={(e) => setExam2Input(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    Quiz / Sözlü
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Ortalama Önizleme */}
              {(() => {
                const s1 = parseFloat(exam1Input);
                const s2 = parseFloat(exam2Input);
                const sq = parseFloat(quizInput);
                const valid = [s1, s2, sq].filter((n) => !isNaN(n) && n >= 0 && n <= 100);
                const currentAvg =
                  valid.length > 0
                    ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
                    : null;
                return (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Hesaplanan Sınav Ortalaması:</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {currentAvg !== null ? `${currentAvg} / 100` : "Not girilmedi"}
                    </span>
                  </div>
                );
              })()}

              {/* Profil Mahremiyeti Kilidi (Değiştirilebilir) */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sınav Notları Mahremiyeti</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleExamPrivacy}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 transition-colors cursor-pointer"
                >
                  {activeClass?.shareExamScoresWithStudents
                    ? "🔓 Kendi Öğrencisine Açık (Gizle)"
                    : "🔒 Tamamen Gizli / Yalnızca Sizde"}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * Boş bırakılan alanlar ortalamaya katılmaz. Notlar girildikçe öğrencinin başarı ortalaması anlık hesaplanır ve profil mahremiyetiyle saklanır.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExamModalStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={examSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-900/30"
                >
                  {examSaving ? "Kaydediliyor…" : "Notları Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
