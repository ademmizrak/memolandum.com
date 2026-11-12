import { httpsCallable } from "firebase/functions";
import { cloudFuncs } from "../firebase/config";

const CLIENT_ADMIN_EMAILS = new Set([
  "ademmizrak@gmail.com",
  "info@memolandum.com",
]);

const LOCAL_TICKETS_KEY = "mm_parent_feedback_tickets";

/**
 * Kullanıcı e-postasının yönetici kısayolunu gösterip göstermeyeceğini belirler.
 * Gerçek güvenlik kontrolü %100 sunucu tarafında (Cloud Functions) yapılır.
 */
export function isClientAdminEmail(email) {
  if (!email) return false;
  return CLIENT_ADMIN_EMAILS.has(String(email).trim().toLowerCase());
}

export function getSavedLocalTicketCodes() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveLocalTicketCode(ticketCode) {
  if (typeof window === "undefined" || !ticketCode) return;
  try {
    const existing = getSavedLocalTicketCodes();
    const updated = [ticketCode, ...existing.filter((c) => c !== ticketCode)].slice(0, 10);
    window.localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

/**
 * Uygulama içinden doğrudan Veli / Müfredat / Destek mesajı gönderir.
 */
export async function submitParentFeedbackTicket(payload) {
  if (!cloudFuncs) {
    throw new Error("Bulut bağlantısı hazır değil. Lütfen internet bağlantınızı kontrol edin.");
  }
  const fn = httpsCallable(cloudFuncs, "submitParentFeedback");
  const res = await fn(payload);
  if (res.data?.ticketCode) {
    saveLocalTicketCode(res.data.ticketCode);
  }
  return res.data;
}

/**
 * Velinin kendi gönderdiği talepleri ve Pedagoji Ekibi yanıtlarını getirir.
 */
export async function fetchMyParentFeedbackTickets() {
  if (!cloudFuncs) return [];
  try {
    const ticketCodes = getSavedLocalTicketCodes();
    const fn = httpsCallable(cloudFuncs, "getMyParentFeedbackTickets");
    const res = await fn({ ticketCodes });
    return Array.isArray(res.data?.tickets) ? res.data.tickets : [];
  } catch {
    return [];
  }
}

/**
 * Yalnızca yetkili yöneticiler için gelen kutusunu ve B2B okul taleplerini getirir.
 */
export async function fetchAdminFeedbackDashboard() {
  if (!cloudFuncs) {
    throw new Error("Bulut servisi başlatılamadı.");
  }
  const fn = httpsCallable(cloudFuncs, "getAdminFeedbackDashboard");
  const res = await fn({});
  return res.data;
}

/**
 * Yönetici tarafından talep durumunu (new / in_progress / resolved / archived),
 * ekip içi notu veya veliye doğrudan yanıtı günceller / kaydı siler.
 */
export async function updateAdminFeedbackTicket(payload) {
  if (!cloudFuncs) {
    throw new Error("Bulut servisi başlatılamadı.");
  }
  const fn = httpsCallable(cloudFuncs, "updateAdminFeedbackItem");
  const res = await fn(payload);
  return res.data;
}
