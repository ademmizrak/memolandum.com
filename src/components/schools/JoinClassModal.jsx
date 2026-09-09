"use client";

import React, { useState } from "react";
import { X, School, Sparkles, CheckCircle2, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { joinClassroom } from "../../lib/schools/schoolService";
import { useMemolandumStore } from "../../store/useMemolandumStore";

export default function JoinClassModal({ isOpen, onClose }) {
  const profile = useMemolandumStore((s) => s.profile);
  const uid = useMemolandumStore((s) => s.uid);
  const childrenProfiles = useMemolandumStore((s) => s.childrenProfiles) || [];
  const activeChildId = useMemolandumStore((s) => s.activeChildId);
  const setJoinedClassroom = useMemolandumStore((s) => s.setJoinedClassroom);
  const joinedClassroom = useMemolandumStore((s) => s.joinedClassroom);

  const activeChild = childrenProfiles.find((c) => c.id === activeChildId) || childrenProfiles[0];
  const defaultStudentName = activeChild?.name || profile?.displayName || "";

  const [classCodeInput, setClassCodeInput] = useState("");
  const [studentNameInput, setStudentNameInput] = useState(defaultStudentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinedData, setJoinedData] = useState(null);

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!classCodeInput.trim()) {
      setError("Lütfen öğretmeninizin verdiği 6 haneli sınıf kodunu girin.");
      return;
    }
    if (!studentNameInput.trim()) {
      setError("Lütfen öğrenci adını girin.");
      return;
    }

    try {
      setLoading(true);
      const studentId = activeChild?.id || uid || `guest_${Date.now()}`;
      const result = await joinClassroom(studentId, studentNameInput.trim(), classCodeInput.trim());
      setJoinedClassroom(result.classroom);
      setJoinedData(result.classroom);
    } catch (err) {
      setError(err?.message || "Sınıfa katılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartHomework = () => {
    const assignment = joinedData?.currentAssignment || joinedClassroom?.currentAssignment;
    onClose();
    if (assignment?.levelId) {
      window.location.href = `/learn/en-tr/${assignment.levelId}/`;
    } else {
      window.location.href = "/learn/en-tr/";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 sm:p-7">
        
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!joinedData ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-lg shadow-cyan-500/10">
                <School className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-1">
                <Sparkles className="w-3 h-3" /> Memolandum for Schools
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Öğretmenimin Sınıfına Katıl
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                İngilizce öğretmeninizin tahtaya yazdığı veya veli grubuna ilettiği 6 haneli sınıf kodunu girin.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  6 Haneli Sınıf Kodu:
                </label>
                <input
                  type="text"
                  placeholder="Örn: M3-7X9 veya MEM-4A"
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-400 text-white rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest uppercase transition-colors"
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Öğrenci Adı ve Soyadı:
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kerem Yılmaz"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-cyan-400 text-white rounded-xl px-4 py-2.5 text-sm transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !classCodeInput.trim() || !studentNameInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sınıf Aranıyor..." : "Sınıfa Katıl"}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-2 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                Tebrikler, Sınıftasınız!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                <span className="font-bold text-amber-300">{joinedData.schoolName || "Okul"}</span> bünyesindeki{" "}
                <span className="font-bold text-cyan-300">{joinedData.className || "İngilizce"}</span> sınıfına katıldınız.
              </p>
              <div className="mt-1 text-[11px] text-slate-400">
                Öğretmeniniz: <span className="text-white font-semibold">{joinedData.teacherName}</span>
              </div>
            </div>

            {/* Atanan Ödev Kartı */}
            {joinedData.currentAssignment && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Öğretmeninizin Güncel Ödevi:
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>{joinedData.currentAssignment.unitName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Hedef: {joinedData.currentAssignment.targetWords} MEB Kelimesi</span>
                  <span>Bitiş: {joinedData.currentAssignment.dueDate}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleStartHomework}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:scale-105 transition-all cursor-pointer"
            >
              <span>Ödeve Hemen Başla</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
