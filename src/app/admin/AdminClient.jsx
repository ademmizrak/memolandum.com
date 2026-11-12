"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Clock,
  Inbox,
  School,
  Search,
  Mail,
  MessageCircle,
  Trash2,
  Save,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Archive,
  Sparkles,
} from "lucide-react";
import { auth } from "../../lib/firebase/config";
import { signInWithGoogle } from "../../lib/firebase/authService";
import {
  fetchAdminFeedbackDashboard,
  updateAdminFeedbackTicket,
} from "../../lib/reports/feedbackService";

const STATUS_META = {
  new: {
    label: "Yeni",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
  },
  in_progress: {
    label: "İnceleniyor",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
  },
  resolved: {
    label: "Çözüldü",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  },
  archived: {
    label: "Arşiv",
    badgeClass: "bg-slate-700/40 text-slate-300 border-slate-600",
  },
};

function formatDateTr(ms) {
  if (!ms) return "-";
  try {
    return new Date(ms).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function extractPhoneDigits(str) {
  if (!str) return null;
  const digits = String(str).replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 13 && !String(str).includes("@")) {
    if (digits.startsWith("05") && digits.length === 11) {
      return `9${digits}`;
    }
    if (digits.startsWith("5") && digits.length === 10) {
      return `90${digits}`;
    }
    return digits;
  }
  return null;
}

export default function AdminClient() {
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [b2bLeads, setB2bLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    b2bCount: 0,
  });

  const [activeTab, setActiveTab] = useState("feedback");
  const [statusFilter, setStatusFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [noteDrafts, setNoteDrafts] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminFeedbackDashboard();
      setItems(Array.isArray(res?.items) ? res.items : []);
      setB2bLeads(Array.isArray(res?.b2bLeads) ? res.b2bLeads : []);
      if (res?.stats) setStats(res.stats);
      const drafts = {};
      const replies = {};
      for (const item of res?.items || []) {
        drafts[item.id] = item.adminNote || "";
        replies[item.id] = item.adminReply || "";
      }
      setNoteDrafts(drafts);
      setReplyDrafts(replies);
    } catch (err) {
      setError(
        err?.message ||
          "Yönetici verileri alınamadı. Hesabınızın yönetici yetkisi olduğundan emin olun."
      );
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authReady && authUser) {
      loadDashboard();
    }
  }, [authReady, authUser, loadDashboard]);

  const handleStatusChange = async (id, nextStatus, collection = "parentFeedback") => {
    setSavingId(id);
    try {
      await updateAdminFeedbackTicket({ id, status: nextStatus, collection });
      if (collection === "b2bLeads") {
        setB2bLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: nextStatus } : lead))
        );
      } else {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
        );
      }
    } catch (err) {
      alert(err?.message || "Durum güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNote = async (id) => {
    setSavingId(id);
    try {
      const adminNote = noteDrafts[id] || "";
      await updateAdminFeedbackTicket({ id, adminNote, collection: "parentFeedback" });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, adminNote } : item))
      );
    } catch (err) {
      alert(err?.message || "Not kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSendReply = async (id) => {
    setSavingId(id);
    try {
      const adminReply = (replyDrafts[id] || "").trim();
      const res = await updateAdminFeedbackTicket({
        id,
        adminReply,
        collection: "parentFeedback",
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                adminReply,
                repliedAtMs: adminReply ? Date.now() : 0,
                status: res?.updates?.status || item.status,
              }
            : item
        )
      );
    } catch (err) {
      alert(err?.message || "Yanıt gönderilemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id, collection = "parentFeedback") => {
    if (!window.confirm("Bu iletişim kaydını kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }
    setSavingId(id);
    try {
      await updateAdminFeedbackTicket({ id, action: "delete", collection });
      if (collection === "b2bLeads") {
        setB2bLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      alert(err?.message || "Silme işlemi başarısız.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (topicFilter !== "all" && item.topic !== topicFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${item.ticketCode} ${item.studentName} ${item.curriculumName} ${item.message} ${item.contactInfo} ${item.authEmail} ${item.parentName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, topicFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Üst Başlık */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white">
                  MEMOLANDUM YÖNETİCİ & VELİ İLETİŞİM MERKEZİ
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Enterprise Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Veli karnesinden gelen müfredat talepleri, pedagojik öneriler ve kurumsal okul başvuruları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/profile/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Profile Dön</span>
            </Link>
            {authUser && (
              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Yenile</span>
              </button>
            )}
          </div>
        </div>

        {/* Giriş Yapılmamışsa */}
        {authReady && !authUser && (
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
            <Lock className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-lg font-black text-white">Yönetici Girişi Gerekli</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Veli mesajlarını ve müfredat taleplerini görüntülemek için yetkili yönetici Google hesabınızla giriş yapın.
            </p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer"
            >
              <span>Google ile Yönetici Girişi Yap</span>
            </button>
          </div>
        )}

        {/* Yetki Hatası */}
        {authUser && error && (
          <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Erişim Engellendi veya Bağlantı Hatası</span>
            </div>
            <p className="text-xs text-rose-200/90">{error}</p>
            <p className="text-[11px] text-slate-400">
              Aktif oturum: <strong>{authUser.email || authUser.uid}</strong>
            </p>
          </div>
        )}

        {/* Yetkili İçerik */}
        {authUser && !error && (
          <>
            {/* KPI Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Toplam Veli Mesajı</div>
                <div className="text-2xl font-black text-white mt-1">{ items.length }</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                <div className="text-[11px] font-bold text-amber-300 uppercase">Yeni / Bekleyen</div>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {items.filter((i) => i.status === "new").length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                <div className="text-[11px] font-bold text-cyan-300 uppercase">İnceleniyor</div>
                <div className="text-2xl font-black text-cyan-300 mt-1">
                  {items.filter((i) => i.status === "in_progress").length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-[11px] font-bold text-emerald-300 uppercase">Çözüldü</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">
                  {items.filter((i) => i.status === "resolved").length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-500/30 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold text-violet-300 uppercase">Okul Başvuruları</div>
                <div className="text-2xl font-black text-violet-300 mt-1">{b2bLeads.length}</div>
              </div>
            </div>

            {/* Sekme Seçici */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("feedback")}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "feedback"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Inbox className="w-4 h-4 shrink-0" />
                <span>Veli & Müfredat ({items.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("b2b")}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "b2b"
                    ? "bg-violet-500 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <School className="w-4 h-4 shrink-0" />
                <span>Okul Talepleri ({b2bLeads.length})</span>
              </button>
            </div>

            {activeTab === "feedback" ? (
              <div className="space-y-4">
                {/* Filtre Barı */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "all", label: "Tümü" },
                      { id: "new", label: "Yeni" },
                      { id: "in_progress", label: "İnceleniyor" },
                      { id: "resolved", label: "Çözüldü" },
                      { id: "archived", label: "Arşiv" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          statusFilter === st.id
                            ? "bg-amber-500/20 border-amber-400 text-amber-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-none">
                    <select
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="all">Tüm Konular</option>
                      <option value="Müfredat / Ünite Talebi">Müfredat / Ünite Talebi</option>
                      <option value="Veli Karnesi Önerisi">Veli Karnesi Önerisi</option>
                      <option value="Teşekkür & Deneyim">Teşekkür & Deneyim</option>
                      <option value="Teknik Destek">Teknik Destek</option>
                    </select>

                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Talep no, sınıf veya mesaj ara..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Liste */}
                {loading ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    Mesajlar yükleniyor...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-sm font-bold text-white">Görüntülenecek talep bulunamadı</div>
                    <p className="text-xs text-slate-400">
                      Veliler karne ekranındaki &ldquo;Aile Kulübü &amp; İletişim&rdquo; sekmesinden mesaj gönderdiğinde anında burada listelenir.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => {
                      const stMeta = STATUS_META[item.status] || STATUS_META.new;
                      const contactTarget = item.contactInfo || item.authEmail || "";
                      const phoneDigits = extractPhoneDigits(contactTarget);
                      const isEmailContact = contactTarget.includes("@");

                      return (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs font-bold text-amber-300">
                                #{item.ticketCode}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${stMeta.badgeClass}`}
                              >
                                {stMeta.label}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {item.topic}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDateTr(item.createdAtMs)}
                              </span>
                            </div>

                            {/* Durum Butonları */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {["new", "in_progress", "resolved", "archived"].map((stKey) => (
                                <button
                                  key={stKey}
                                  type="button"
                                  disabled={savingId === item.id || item.status === stKey}
                                  onClick={() => handleStatusChange(item.id, stKey)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                    item.status === stKey
                                      ? "bg-amber-500 text-slate-950 border-amber-400"
                                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                                  }`}
                                >
                                  {STATUS_META[stKey].label}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, "parentFeedback")}
                                className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 cursor-pointer"
                                title="Kaydı Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Öğrenci & Bağlam Satırı */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800/80">
                            <span>
                              👦 <strong>Öğrenci:</strong> {item.studentName}
                            </span>
                            <span>
                              📚 <strong>Müfredat:</strong> {item.curriculumName}
                            </span>
                            {item.classCode && (
                              <span>
                                🏫 <strong>Sınıf Kodu:</strong> {item.classCode}
                              </span>
                            )}
                            {item.metricsSnapshot && (
                              <span className="text-slate-400">
                                📊 Kalıcı: {item.metricsSnapshot.permanentWords || 0} kelime · Başarı: %
                                {item.metricsSnapshot.accuracyRate || 0} · Son 7 Gün:{" "}
                                {item.metricsSnapshot.activeDaysLast7 || 0}/7
                              </span>
                            )}
                          </div>

                          {/* Mesaj Metni */}
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {item.message}
                          </div>

                          {/* Veliye Uygulama İçi Resmi Yanıt (Kişisel Numaranız Görünmez) */}
                          <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-black text-emerald-300">
                                📬 Veliye Uygulama İçi Doğrudan Yanıt (Telefon Numaranız Görünmez — Veli Karnesinde Açılır)
                              </span>
                              {item.adminReply && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                                  ✅ Yanıtlandı ({formatDateTr(item.repliedAtMs)})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <textarea
                                rows={2}
                                value={replyDrafts[item.id] ?? ""}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                placeholder={`Merhaba, #${item.ticketCode} numaralı mesajınız için teşekkür ederiz. Talebinizi inceledik...`}
                                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                              />
                              <button
                                type="button"
                                disabled={savingId === item.id}
                                onClick={() => handleSendReply(item.id)}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black cursor-pointer shrink-0"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {item.adminReply ? "Yanıtı Güncelle" : "Veliye Yanıt Gönder"}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* İletişim & Yönetici Notu */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-slate-400">
                                👤 <strong>Veli / İletişim:</strong>{" "}
                                {item.parentName ? `${item.parentName} · ` : ""}
                                {contactTarget || "Belirtilmedi"}
                              </span>

                              {isEmailContact && (
                                <a
                                  href={`mailto:${encodeURIComponent(contactTarget)}?subject=${encodeURIComponent(
                                    `Re: [Memolandum #${item.ticketCode}] ${item.topic}`
                                  )}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>E-posta Yanıtla</span>
                                </a>
                              )}

                              {phoneDigits && (
                                <a
                                  href={`https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(
                                    `Merhaba, Memolandum Veli Karnesi üzerinden ilettiğiniz #${item.ticketCode} numaralı (${item.topic}) mesajınız için teşekkür ederiz.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp Yanıtla</span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={noteDrafts[item.id] ?? ""}
                                onChange={(e) =>
                                  setNoteDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                placeholder="Ekip içi gizli yönetici notu..."
                                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                              <button
                                type="button"
                                disabled={savingId === item.id}
                                onClick={() => handleSaveNote(item.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Notu Kaydet</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Kurumsal Okul Başvuruları (b2bLeads) */
              <div className="space-y-3">
                {b2bLeads.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                    Henüz kurumsal okul başvurusu bulunmuyor.
                  </div>
                ) : (
                  b2bLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-black text-white">
                          🏫 {lead.schoolName} {lead.city ? `(${lead.city})` : ""}
                        </div>
                        <div className="text-xs text-slate-300">
                          Yetkili: <strong>{lead.contactName}</strong> · E-posta:{" "}
                          {lead.email || "-"} · Tel: {lead.phone || "-"} · Öğrenci:{" "}
                          {lead.studentCount || "-"}
                        </div>
                        {lead.notes && (
                          <div className="text-xs text-slate-400 mt-1">{lead.notes}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id, "b2bLeads")}
                        className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
