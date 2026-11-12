/**
 * Memolandum — Enterprise Veli & Okul İletişim Merkezi (Admin SDK)
 * - submitParentFeedback: Uygulama içi doğrudan mesaj/müfredat talebi gönderimi (XSS/Zalgo temizliği + Rate-Limit)
 * - getAdminFeedbackDashboard: Yalnızca yetkili yöneticilere açık gelen kutusu + B2B okul talepleri
 * - updateAdminFeedbackItem: Talep durumu (new / in_progress / resolved / archived) ve yönetici notu güncelleme
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const DEFAULT_ADMIN_EMAILS = new Set([
  "ademmizrak@gmail.com",
  "info@memolandum.com",
]);

const ALLOWED_TOPICS = new Set([
  "Müfredat / Ünite Talebi",
  "Veli Karnesi Önerisi",
  "Teşekkür & Deneyim",
  "Teknik Destek",
  "Okul / Öğretmen İletişimi",
]);

const ALLOWED_STATUSES = new Set(["new", "in_progress", "resolved", "archived"]);

/**
 * Zalgo, kontrol karakterleri ve HTML/XSS etiketlerini temizler.
 * Çok satırlı mesajlar için \n korunur (allowNewlines = true).
 */
function sanitizeText(raw, maxLen = 500, allowNewlines = false) {
  let str = String(raw || "")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/[\u0300-\u036F\u0483-\u0489]/g, "")
    .replace(/[<>`]/g, "");

  if (allowNewlines) {
    str = str
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } else {
    str = str.replace(/\s+/g, " ").trim();
  }
  return str.slice(0, maxLen);
}

function clampInt(n, min, max, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

// Instance-level rate-limiter (UID veya IP bazlı)
const feedbackRateBuckets = new Map();
function enforceFeedbackRateLimit(key, maxCount = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const safeKey = String(key || "anon").slice(0, 120);
  const entry = feedbackRateBuckets.get(safeKey) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  feedbackRateBuckets.set(safeKey, entry);

  if (feedbackRateBuckets.size > 5000) {
    for (const [k, v] of feedbackRateBuckets.entries()) {
      if (now > v.resetAt) feedbackRateBuckets.delete(k);
    }
  }

  if (entry.count > maxCount) {
    throw new HttpsError(
      "resource-exhausted",
      "Çok sık mesaj gönderildi. Lütfen birkaç dakika bekleyip tekrar deneyin."
    );
  }
}

function generateTicketCode() {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ML-${yy}${mm}${dd}-${rand}`;
}

async function isAdminUser(auth, db) {
  if (!auth?.uid) return false;
  if (auth.token?.admin === true) return true;

  const email = String(auth.token?.email || "").trim().toLowerCase();
  if (email && DEFAULT_ADMIN_EMAILS.has(email)) return true;

  const envEmails = String(process.env.MEMOLANDUM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (email && envEmails.includes(email)) return true;

  try {
    const adminDoc = await db.collection("admins").doc(auth.uid).get();
    if (adminDoc.exists && adminDoc.data()?.role === "admin") {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * 1. Veli / Öğrenci / Öğretmen İletişim ve Müfredat Talebi Gönderimi
 */
exports.submitParentFeedback = onCall(
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    const uid = request.auth?.uid || null;
    const rawIp =
      request.rawRequest?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      request.rawRequest?.ip ||
      "unknown-ip";

    const rateKey = uid ? `uid:${uid}` : `ip:${rawIp}`;
    enforceFeedbackRateLimit(rateKey, 5, 10 * 60 * 1000);

    const rawTopic = sanitizeText(request.data?.topic, 60, false);
    const topic = ALLOWED_TOPICS.has(rawTopic) ? rawTopic : "Müfredat / Ünite Talebi";
    const message = sanitizeText(request.data?.message, 2000, true);

    if (!message || message.length < 5) {
      throw new HttpsError(
        "invalid-argument",
        "Lütfen en az 5 karakterden oluşan mesajınızı yazın."
      );
    }

    const parentName = sanitizeText(request.data?.parentName, 80, false);
    const contactInfo = sanitizeText(request.data?.contactInfo, 120, false);
    const studentName = sanitizeText(request.data?.studentName, 60, false) || "Öğrenci";
    const curriculumName = sanitizeText(request.data?.curriculumName, 80, false) || "Genel İngilizce";
    const gradeKey = sanitizeText(request.data?.gradeKey, 32, false);
    const classCode = sanitizeText(request.data?.classCode, 20, false);
    const sourcePage = sanitizeText(request.data?.sourcePage, 40, false) || "parent_report_modal";

    const rawMetrics = request.data?.metricsSnapshot || {};
    const metricsSnapshot = {
      totalWords: clampInt(rawMetrics.totalWords, 0, 100000, 0),
      permanentWords: clampInt(rawMetrics.permanentWords, 0, 100000, 0),
      accuracyRate: clampInt(rawMetrics.accuracyRate, 0, 100, 0),
      activeDaysLast7: clampInt(rawMetrics.activeDaysLast7, 0, 7, 0),
      isSample: !!rawMetrics.isSample,
    };

    const ticketCode = generateTicketCode();
    const nowMs = Date.now();

    const db = getFirestore();
    const docRef = db.collection("parentFeedback").doc();

    await docRef.set({
      id: docRef.id,
      ticketCode,
      topic,
      message,
      parentName: parentName || null,
      contactInfo: contactInfo || null,
      studentName,
      curriculumName,
      gradeKey: gradeKey || null,
      classCode: classCode || null,
      sourcePage,
      metricsSnapshot,
      uid,
      authEmail: request.auth?.token?.email || null,
      status: "new",
      adminNote: "",
      adminReply: "",
      repliedAtMs: 0,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    });

    return {
      ok: true,
      id: docRef.id,
      ticketCode,
      createdAtMs: nowMs,
    };
  }
);

/**
 * 2. Yönetici Gelen Kutusu (Yalnızca Admin Yetkili Hesaplar)
 */
exports.getAdminFeedbackDashboard = onCall(
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Yönetici paneline erişmek için giriş yapmalısınız.");
    }

    const db = getFirestore();
    const authorized = await isAdminUser(request.auth, db);
    if (!authorized) {
      throw new HttpsError(
        "permission-denied",
        "Bu sayfayı görüntüleme yetkiniz bulunmuyor."
      );
    }

    const [feedbackSnap, b2bSnap] = await Promise.all([
      db.collection("parentFeedback").orderBy("createdAtMs", "desc").limit(150).get(),
      db.collection("b2bLeads").limit(100).get(),
    ]);

    const items = feedbackSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ticketCode: d.ticketCode || `ML-${doc.id.slice(0, 6).toUpperCase()}`,
        topic: d.topic || "Müfredat / Ünite Talebi",
        message: d.message || "",
        parentName: d.parentName || "",
        contactInfo: d.contactInfo || "",
        studentName: d.studentName || "Öğrenci",
        curriculumName: d.curriculumName || "",
        gradeKey: d.gradeKey || "",
        classCode: d.classCode || "",
        sourcePage: d.sourcePage || "",
        metricsSnapshot: d.metricsSnapshot || null,
        uid: d.uid || null,
        authEmail: d.authEmail || "",
        status: d.status || "new",
        adminNote: d.adminNote || "",
        adminReply: d.adminReply || "",
        repliedAtMs: d.repliedAtMs || 0,
        createdAtMs: d.createdAtMs || 0,
        updatedAtMs: d.updatedAtMs || 0,
      };
    });

    const b2bLeads = b2bSnap.docs
      .map((doc) => {
        const d = doc.data();
        const createdMs =
          typeof d.createdAt?.toMillis === "function"
            ? d.createdAt.toMillis()
            : Number(d.createdAtMs) || 0;
        return {
          id: doc.id,
          schoolName: d.schoolName || "",
          contactName: d.contactName || "",
          email: d.email || "",
          phone: d.phone || "",
          city: d.city || "",
          studentCount: d.studentCount || "",
          notes: d.notes || "",
          status: d.status || "new",
          createdAtMs: createdMs,
        };
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    const stats = {
      total: items.length,
      newCount: items.filter((i) => i.status === "new").length,
      inProgressCount: items.filter((i) => i.status === "in_progress").length,
      resolvedCount: items.filter((i) => i.status === "resolved").length,
      b2bCount: b2bLeads.length,
    };

    return {
      ok: true,
      adminEmail: request.auth.token?.email || "",
      items,
      b2bLeads,
      stats,
    };
  }
);

/**
 * 3. Yönetici Mesaj Durumu, Ekip Notu & Veliye Doğrudan Yanıt Güncelleme / Silme
 */
exports.updateAdminFeedbackItem = onCall(
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş yapmalısınız.");
    }

    const db = getFirestore();
    const authorized = await isAdminUser(request.auth, db);
    if (!authorized) {
      throw new HttpsError("permission-denied", "Yetkisiz işlem.");
    }

    const id = sanitizeText(request.data?.id, 80, false);
    const collectionName =
      request.data?.collection === "b2bLeads" ? "b2bLeads" : "parentFeedback";
    if (!id) {
      throw new HttpsError("invalid-argument", "Geçerli bir kayıt ID'si gerekli.");
    }

    const ref = db.collection(collectionName).doc(id);
    const action = sanitizeText(request.data?.action, 20, false);

    if (action === "delete") {
      await ref.delete();
      return { ok: true, deleted: true, id };
    }

    const updates = {
      updatedAtMs: Date.now(),
      updatedByEmail: request.auth.token?.email || null,
    };

    if (request.data?.status !== undefined) {
      const nextStatus = sanitizeText(request.data.status, 24, false);
      if (!ALLOWED_STATUSES.has(nextStatus)) {
        throw new HttpsError("invalid-argument", "Geçersiz durum değeri.");
      }
      updates.status = nextStatus;
    }

    if (request.data?.adminNote !== undefined) {
      updates.adminNote = sanitizeText(request.data.adminNote, 1000, true);
    }

    if (request.data?.adminReply !== undefined) {
      const cleanReply = sanitizeText(request.data.adminReply, 2000, true);
      updates.adminReply = cleanReply;
      updates.repliedAtMs = cleanReply ? Date.now() : 0;
      if (cleanReply && !updates.status) {
        updates.status = "resolved";
      }
    }

    await ref.set(updates, { merge: true });
    return { ok: true, id, updates };
  }
);

/**
 * 4. Velinin Kendi Gönderdiği Talepleri ve Pedagoji Ekibi Yanıtlarını Görüntülemesi
 * (Kişisel telefon numarası paylaşmadan uygulama içi iki yönlü güvenli iletişim)
 */
exports.getMyParentFeedbackTickets = onCall(
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    const uid = request.auth?.uid || null;
    const rawIp =
      request.rawRequest?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      request.rawRequest?.ip ||
      "unknown-ip";

    enforceFeedbackRateLimit(uid ? `my:${uid}` : `myip:${rawIp}`, 25, 60 * 1000);

    const rawCodes = Array.isArray(request.data?.ticketCodes)
      ? request.data.ticketCodes
      : [];
    const safeCodes = [
      ...new Set(
        rawCodes
          .map((c) => sanitizeText(c, 24, false).toUpperCase())
          .filter((c) => /^ML-\d{6}-\d{4}$/.test(c))
      ),
    ].slice(0, 10);

    if (!uid && safeCodes.length === 0) {
      return { ok: true, tickets: [] };
    }

    const db = getFirestore();
    const collected = new Map();

    if (uid) {
      const uidSnap = await db
        .collection("parentFeedback")
        .where("uid", "==", uid)
        .limit(20)
        .get();
      for (const doc of uidSnap.docs) {
        collected.set(doc.id, doc.data());
      }
    }

    if (safeCodes.length > 0) {
      const codeSnap = await db
        .collection("parentFeedback")
        .where("ticketCode", "in", safeCodes)
        .limit(10)
        .get();
      for (const doc of codeSnap.docs) {
        collected.set(doc.id, doc.data());
      }
    }

    const tickets = Array.from(collected.values())
      .map((d) => ({
        ticketCode: d.ticketCode || "",
        topic: d.topic || "Müfredat / Ünite Talebi",
        message: d.message || "",
        studentName: d.studentName || "Öğrenci",
        curriculumName: d.curriculumName || "",
        status: d.status || "new",
        adminReply: d.adminReply || "",
        repliedAtMs: d.repliedAtMs || 0,
        createdAtMs: d.createdAtMs || 0,
      }))
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, 15);

    return {
      ok: true,
      tickets,
    };
  }
);

// Test süiti için yardımcı dışa aktarımlar
exports._internal = {
  sanitizeText,
  generateTicketCode,
  ALLOWED_TOPICS,
  ALLOWED_STATUSES,
  DEFAULT_ADMIN_EMAILS,
};
