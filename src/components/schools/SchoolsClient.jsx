"use client";

import React, { useState, useEffect } from "react";
import Header from "../Header";
import TeacherDashboard from "./TeacherDashboard";
import TeacherTrustGuide from "./TeacherTrustGuide";
import JoinClassModal from "./JoinClassModal";
import AuthModal from "../AuthModal";
import { submitB2BLead } from "../../lib/schools/schoolService";
import { TURKEY_PROVINCES, getDistrictsForProvince } from "../../lib/schools/turkeyLocations";
import {
  School,
  Users,
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  Building2,
  Phone,
  Mail,
  Gamepad2,
  Brain,
} from "lucide-react";

export default function SchoolsClient({ initialTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview', 'dashboard', 'guide'
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Sync tab with URL query parameter (?tab=dashboard, ?tab=guide, or ?tab=overview)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "dashboard" || tabParam === "teacher") {
        setActiveTab("dashboard");
      } else if (tabParam === "guide" || tabParam === "rehber" || tabParam === "security") {
        setActiveTab("guide");
      } else if (tabParam === "overview") {
        setActiveTab("overview");
      }
    } catch {
      // ignore query parsing errors
    }
  }, []);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.history?.replaceState) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", newTab);
          window.history.replaceState({}, "", url.toString());
        } catch {
          // ignore
        }
      }
    }
  };

  // B2B Lead Form State
  const [province, setProvince] = useState("İstanbul");
  const [district, setDistrict] = useState("Kadıköy");
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [role, setRole] = useState("İngilizce Zümre Başkanı");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentCount, setStudentCount] = useState("100-250");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleProvinceChange = (prov) => {
    setProvince(prov);
    const dists = getDistrictsForProvince(prov);
    setDistrict(dists[0] || "");
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      setSubmitting(true);
      await submitB2BLead({
        schoolName,
        province,
        district,
        contactName,
        role,
        email,
        phone,
        studentCount: parseInt(studentCount, 10) || 150,
        note,
      });
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err?.message || "Talebiniz kaydedilirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Üst Sekmeler (Görünüm Seçici) */}
        <div className="flex items-center justify-center gap-2 mb-8 sm:mb-12">
          <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-center gap-1 shadow-xl">
            <button
              onClick={() => handleTabChange("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <School className="w-4 h-4" />
              <span>Okullar İçin (B2B)</span>
            </button>

            <button
              onClick={() => handleTabChange("dashboard")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Öğretmen & Sınıf Paneli</span>
            </button>

            <button
              onClick={() => handleTabChange("guide")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "guide"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Öğretmen Güvencesi & Rehber</span>
            </button>

            <button
              onClick={() => setJoinModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sınıf Koduna Katıl</span>
            </button>
          </div>
        </div>

        {/* 1. Görünüm: Öğretmen Dashboard'u */}
        {activeTab === "dashboard" && (
          <TeacherDashboard
            onRequestAuth={() => setAuthOpen(true)}
            onOpenGuide={() => handleTabChange("guide")}
          />
        )}

        {/* 1.5. Görünüm: Öğretmen Güvenlik, Mahremiyet ve Kullanım Rehberi */}
        {activeTab === "guide" && (
          <TeacherTrustGuide onOpenDashboard={() => handleTabChange("dashboard")} />
        )}

        {/* 2. Görünüm: B2B Okullar İçin Tanıtım & Teklif Alma */}
        {activeTab === "overview" && (
          <div className="space-y-16">
            
            {/* Hero Bölümü */}
            <div className="text-center max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" /> 2026-2027 Eğitim Öğretim Yılı
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Okullar, Kolejler ve İngilizce Öğretmenleri İçin{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300">
                  Memolandum for Schools
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Evden veya okuldan sınıf açın: rumuz ve avatar yeterli, gerçek ad zorunlu değil.
                6 haneli kodla öğrencileri toplayın, ünite ödevi atayıp ilerlemeyi izleyin.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => handleTabChange("dashboard")}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all cursor-pointer"
                >
                  Ücretsiz Öğretmen Masasını Aç
                </button>
                <button
                  onClick={() => handleTabChange("guide")}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-sm border border-emerald-500/40 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Öğretmen Güvenlik & Kullanım Rehberi</span>
                </button>
                <a
                  href="#b2b-form"
                  className="px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
                >
                  Okulunuz İçin Kurumsal Teklif Alın
                </a>
              </div>
            </div>

            {/* 3 Temel Sütun (Okul Yöneticisi & Öğretmen Avantajları) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  %100 Okul Müfredatına Uygun (1–12. Sınıf, LGS & YDS)
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Okul ders kitaplarındaki tüm ünitelerin kelimeleri ve kalıp cümleleri hazır. 
                  Öğretmen ekstra materyal hazırlamadan haftalık ünite ödevini tek tıkla tanımlar.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Akıllı Tahta & Retro Arcade
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ders içinde akıllı tahtada Space Invaders, Word Snake ve Breakout gibi oyunlarla 
                  öğrenciler takım halinde yarışır; dersler sıkıcı ezberden yüksek dopaminli oyuna dönüşür.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Sınıf Listesi & Ödev Takibi
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Kim ödeve başladı, kim tamamladı — sınıf tablosunda görünür. WhatsApp ile veli
                  duyurusu paylaşabilirsiniz. Detaylı zümre ısı haritası sonraki sürümde.
                </p>
              </div>

            </div>

            {/* B2B Demo & Kurumsal Lisans Talep Formu */}
            <div
              id="b2b-form"
              className="rounded-3xl border-2 border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Okulunuz / Kolejiniz İçin Demo & Teklif İsteyin
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Özel okul zümreleri ve yöneticileri için toplu lisans (50–500+ öğrenci) teklifi.
                    Ücretsiz öğretmen masası için yukarıdaki paneli kullanın — orada gerçek ad zorunlu değil.
                  </p>
                </div>

                {submitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">
                      Talebiniz Başarıyla Alındı!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Kurumsal eğitim danışmanımız en kısa sürede okulunuz ({schoolName}) için demo hesabı ve özel teklifle sizinle iletişime geçecektir.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} className="space-y-4">
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
                        {errorMsg}
                      </div>
                    )}

                    {/* İl, İlçe ve Okul Adı */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          İl:
                        </label>
                        <select
                          value={province}
                          onChange={(e) => handleProvinceChange(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        >
                          {TURKEY_PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          İlçe:
                        </label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        >
                          {getDistrictsForProvince(province).map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Okul Adı:
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Atatürk İlkokulu, TED Koleji..."
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Yetkili iletişim adı:
                      </label>
                      <input
                        type="text"
                        placeholder="Teklif için iletişim adı (kurumsal)"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        required
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Bu form kurumsal satış içindir; öğretmen paneli ayrı ve gizlilik önceliklidir.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Göreviniz / Unvan:
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="İngilizce Zümre Başkanı">Zümre Başkanı</option>
                          <option value="İngilizce Öğretmeni">İngilizce Öğretmeni</option>
                          <option value="Okul Müdürü / Yöneticisi">Okul Yöneticisi</option>
                          <option value="Kurucu / İşletmeci">Kurucu / Temsilci</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Kurumsal E-posta:
                        </label>
                        <input
                          type="email"
                          placeholder="adiniz@okulunuz.k12.tr"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          İletişim Telefonu:
                        </label>
                        <input
                          type="tel"
                          placeholder="05XX XXX XX XX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Tahmini İlkokul Öğrenci Sayısı:
                        </label>
                        <select
                          value={studentCount}
                          onChange={(e) => setStudentCount(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="50-100">50 - 100 Öğrenci</option>
                          <option value="100-250">100 - 250 Öğrenci</option>
                          <option value="250-500">250 - 500 Öğrenci</option>
                          <option value="500+">500+ Öğrenci (Kampüs / Çoklu Şube)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Varsa Notunuz / Sorunuz:
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: 2 ve 3. sınıflar için demo istiyoruz..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? "Gönderiliyor..." : "Demo ve Teklif Talebini İlet"}</span>
                      </button>
                      <p className="text-[11px] text-slate-500 text-center mt-2">
                        KVKK kapsamında verileriniz yalnızca kurumsal teklif iletişimi amacıyla korunmaktadır.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Sınıf Koduna Katılma Modalı */}
      <JoinClassModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialView="login"
      />
    </div>
  );
}
