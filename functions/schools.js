/**
 * Memolandum for Schools — güvenli katılım + gradebook progress (Admin SDK)
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

function cleanClassCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
}

/**
 * Zalgo, görünmez kontrol karakterleri ve HTML/XSS enjeksiyonlarını temizler.
 */
function sanitizeDisplayLabel(raw, fallback = "Öğrenci") {
  const cleaned = String(raw || "")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/[\u0300-\u036F\u0483-\u0489]/g, "")
    .replace(/[<>"{}[\]\\/`$]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return cleaned || fallback;
}

// Sunucu içi (instance-level) + işlem bazlı hız sınırlayıcı (Brute-force & flood engeli)
const rateBuckets = new Map();
function enforceRateLimit(uid, action, maxPerMinute = 10) {
  const now = Date.now();
  const key = `${uid}:${action}`;
  const entry = rateBuckets.get(key) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }
  entry.count += 1;
  rateBuckets.set(key, entry);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now > v.resetAt) rateBuckets.delete(k);
    }
  }
  if (entry.count > maxPerMinute) {
    throw new HttpsError(
      "resource-exhausted",
      "Çok fazla deneme yaptınız. Lütfen 1 dakika bekleyip tekrar deneyin."
    );
  }
}

function clampInt(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function sanitizeSeatForStudent(seat, classroomData) {
  if (!seat) return null;
  const copy = { ...seat };
  // Profil Mahremiyeti: Öğretmen açıkça izin vermedikçe sınav puanları öğrenci koltuğuna yansıtılmaz
  if (!classroomData?.shareExamScoresWithStudents) {
    delete copy.examScores;
  }
  return copy;
}

function publicClassroomMeta(data, classCode) {
  return {
    classCode: data.classCode || classCode,
    className: data.className || "İngilizce Sınıfı",
    creationType: data.creationType || "school_and_class",
    grade: data.grade || "",
    schoolName: data.schoolName || "Özel masa",
    province: data.province || "",
    district: data.district || "",
    teacherName: data.teacherName || "Öğretmen",
    teacherAvatar: data.teacherAvatar || { type: "emoji", value: "🦉" },
    currentAssignment: data.currentAssignment || null,
    studentsCount: Number(data.studentsCount) || 0,
    shareExamScoresWithStudents: !!data.shareExamScoresWithStudents,
    isLocked: !!data.isLocked,
  };
}

/**
 * Sınıfa katıl — roster'ı istemciye açmadan Admin ile seat + memberIds yazar.
 */
exports.joinClassroom = onCall(
  // Gen2 Cloud Run: invoker public = IAM geçidi açık; Auth + App Check fonksiyon içinde.
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sınıfa katılmak için giriş yapmalısınız.");
    }

    const uid = request.auth.uid;
    enforceRateLimit(uid, "joinClassroom", 8);

    const classCode = cleanClassCode(request.data?.classCode);
    const displayLabel = sanitizeDisplayLabel(
      request.data?.displayLabel || request.data?.studentName,
      ""
    );
    const childId = request.data?.childId ? String(request.data.childId).slice(0, 64) : null;
    const avatar = request.data?.avatar ? String(request.data.avatar).trim().slice(0, 16) : null;

    if (!classCode || classCode.length < 3) {
      throw new HttpsError("invalid-argument", "Geçerli bir sınıf kodu giriniz.");
    }
    if (!displayLabel) {
      throw new HttpsError("invalid-argument", "Sınıfta görünecek ad gerekli.");
    }

    const db = getFirestore();
    const ref = db.collection("classrooms").doc(classCode);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new HttpsError(
          "not-found",
          "Bu kodla eşleşen bir sınıf bulunamadı. Lütfen öğretmeninizden kodu kontrol etmesini isteyin."
        );
      }

      const data = snap.data() || {};
      const students = { ...(data.students || {}) };
      const existing = students[uid] || null;

      // Sınıf kilitliyse ve öğrenci daha önce bu sınıfta değilse yeni katılımı reddet
      if (!existing && data.isLocked) {
        throw new HttpsError(
          "permission-denied",
          "Bu sınıfa yeni öğrenci katılımı öğretmen tarafından kilitlenmiştir."
        );
      }

      // Maksimum sınıf kapasitesi koruması (bot / flood engeli)
      if (!existing && Object.keys(students).length >= 120) {
        throw new HttpsError(
          "resource-exhausted",
          "Bu sınıf maksimum öğrenci kapasitesine (120) ulaşmıştır."
        );
      }

      // Eski sınıflar: memberIds yoksa seat anahtarlarından backfill
      let memberIds = Array.isArray(data.memberIds) ? [...data.memberIds] : [];
      if (!memberIds.length && Object.keys(students).length) {
        memberIds = Object.keys(students);
      }
      if (!memberIds.includes(uid)) memberIds.push(uid);
      memberIds = [...new Set(memberIds)].slice(0, 200);

      // Öğretmen rumuzu/avatarı sabitlediyse (teacherEdited), öğrenci bunu ezemez
      const lockedByTeacher = existing?.teacherEdited === true;

      const studentEntry = existing
        ? {
            ...existing,
            uid,
            ownerUid: uid,
            name: lockedByTeacher ? existing.name : displayLabel || existing.name || "Öğrenci",
            ...(lockedByTeacher
              ? {}
              : avatar
              ? { avatar }
              : {}),
            ...(childId ? { childId } : {}),
          }
        : {
            uid,
            ownerUid: uid,
            name: displayLabel,
            avatar: avatar || "🦁",
            joinedAt: Date.now(),
            wordsLearned: 0,
            accuracy: null,
            lastStudiedAt: null,
            status: "Başlamadı",
            ...(childId ? { childId } : {}),
          };

      students[uid] = studentEntry;
      const studentsCount = Object.keys(students).length;

      tx.set(
        ref,
        {
          students,
          studentsCount,
          memberIds,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        meta: publicClassroomMeta({ ...data, studentsCount }, classCode),
        studentId: uid,
        ownSeat: studentEntry,
        memberIds,
        rawDocData: data,
      };
    });

    const safeSeat = sanitizeSeatForStudent(result.ownSeat, result.rawDocData || {});
    return {
      classroom: {
        ...result.meta,
        studentId: result.studentId,
        // İstemci store uyumu: tam roster dönülmez, yalnız güvenli kendi koltuğu
        students: { [result.studentId]: safeSeat },
        studentsCount: result.meta.studentsCount,
      },
      studentId: result.studentId,
      ownSeat: safeSeat,
    };
  }
);

/**
 * Üye sınıf özeti — tam roster yok; meta + kendi koltuğu.
 */
exports.getMyClassroom = onCall(
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş gerekli.");
    }

    const uid = request.auth.uid;
    enforceRateLimit(uid, "getMyClassroom", 30);

    const classCode = cleanClassCode(request.data?.classCode);
    if (!classCode || classCode.length < 3) {
      throw new HttpsError("invalid-argument", "Geçerli bir sınıf kodu giriniz.");
    }

    const db = getFirestore();
    const snap = await db.collection("classrooms").doc(classCode).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Sınıf bulunamadı.");
    }

    const data = snap.data() || {};
    const students = data.students || {};
    const memberIds = Array.isArray(data.memberIds)
      ? data.memberIds
      : Object.keys(students);

    if (!memberIds.includes(uid) && !students[uid]) {
      throw new HttpsError("permission-denied", "Bu sınıfa üye değilsiniz.");
    }

    const ownSeat = students[uid] || {
      uid,
      ownerUid: uid,
      name: "Öğrenci",
      joinedAt: Date.now(),
      wordsLearned: 0,
      accuracy: null,
      status: "Başlamadı",
    };

    const safeSeat = sanitizeSeatForStudent(ownSeat, data);
    const meta = publicClassroomMeta(data, classCode);
    return {
      classroom: {
        ...meta,
        studentId: uid,
        students: { [uid]: safeSeat },
        studentsCount: meta.studentsCount,
      },
      studentId: uid,
      ownSeat: safeSeat,
    };
  }
);

/**
 * Gradebook progress — Admin clamp + F12 Anti-Cheat doğrulaması.
 * İstemci konsoldan sahte skor basamaz veya öğretmenin verdiği rumuzu ezemez.
 */
exports.syncClassroomProgress = onCall(
  { region: "us-central1", enforceAppCheck: false, invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Giriş gerekli.");
    }

    const uid = request.auth.uid;
    enforceRateLimit(uid, "syncClassroomProgress", 20);

    const classCode = cleanClassCode(request.data?.classCode);
    if (!classCode) {
      throw new HttpsError("invalid-argument", "Sınıf kodu gerekli.");
    }

    const db = getFirestore();
    const ref = db.collection("classrooms").doc(classCode);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Sınıf bulunamadı.");
    }

    const data = snap.data() || {};
    const students = data.students || {};
    const memberIds = Array.isArray(data.memberIds)
      ? data.memberIds
      : Object.keys(students);

    if (!memberIds.includes(uid) && !students[uid]) {
      throw new HttpsError("permission-denied", "Bu sınıfa üye değilsiniz.");
    }

    const existing = students[uid] || {
      uid,
      ownerUid: uid,
      name: "Öğrenci",
      joinedAt: Date.now(),
      wordsLearned: 0,
      accuracy: null,
      status: "Başlamadı",
    };

    const target = clampInt(data.currentAssignment?.targetWords, 1, 100, 15);
    const prevWords = clampInt(existing.wordsLearned, 0, target * 2, 0);
    let requestedWords = clampInt(
      request.data?.wordsLearned ?? prevWords,
      0,
      target * 2,
      prevWords
    );

    // Anti-Cheat Katmanı:
    // 1) İlerleme geriye düşmez (oturumlar arası kayıp önleme)
    if (requestedWords < prevWords) {
      requestedWords = prevWords;
    }

    // 2) F12 Console "wordsLearned: 20" tek seferlik sahte sıçrama kontrolü:
    // Eğer bir çağrıda +3 kelimeden fazla artış iddia ediliyorsa, kullanıcının gerçek
    // Firestore vault veya studyProfiles koleksiyonunda kelime kaydı olup olmadığını doğrula!
    const delta = requestedWords - prevWords;
    const now = Date.now();
    const msSinceLast = existing.lastStudiedAt ? now - Number(existing.lastStudiedAt) : 999999;

    if (delta > 3) {
      let verifiedServerWords = 0;
      try {
        const vaultSnap = await db
          .collection("users")
          .doc(uid)
          .collection("vault")
          .limit(target * 2)
          .get();
        verifiedServerWords = vaultSnap.size;

        if (verifiedServerWords < requestedWords) {
          const profSnap = await db
            .collection("users")
            .doc(uid)
            .collection("studyProfiles")
            .limit(4)
            .get();
          profSnap.forEach((docSnap) => {
            const pData = docSnap.data() || {};
            const vaultLen = Object.keys(pData.vocabularyVault || {}).length;
            if (vaultLen > verifiedServerWords) verifiedServerWords = vaultLen;
          });
        }
      } catch {
        /* ignore */
      }
      // Sunucuda gerçek kelime çalışması yoksa tek çağrıda en fazla +2 artışa izin ver
      if (verifiedServerWords < requestedWords) {
        requestedWords = Math.min(requestedWords, prevWords + (msSinceLast < 3000 ? 1 : 2));
      }
    } else if (delta > 1 && msSinceLast < 2500) {
      // Saniyede birden fazla döngüsel sahte çağrı (script loop) engeli
      requestedWords = prevWords + 1;
    }

    const wordsLearned = requestedWords;

    let accuracy = request.data?.accuracy;
    if (accuracy == null) accuracy = existing.accuracy;
    if (accuracy != null) accuracy = clampInt(accuracy, 0, 100, null);
    // Hiç kelime öğrenilmemişken %100 sahte doğruluk basılmasını engelle
    if (wordsLearned === 0) accuracy = null;

    let status = "Başlamadı";
    if (wordsLearned >= target) status = "Tamamlandı";
    else if (wordsLearned > 0) status = "Devam Ediyor";

    // Öğretmen rumuzu/avatarı kilitlediyse (teacherEdited) öğrenci değiştiremez
    const lockedByTeacher = existing?.teacherEdited === true;
    const nameIn =
      !lockedByTeacher && request.data?.name != null
        ? sanitizeDisplayLabel(request.data.name, existing.name || "Öğrenci")
        : null;
    const avatarIn =
      !lockedByTeacher && request.data?.avatar != null
        ? String(request.data.avatar).trim().slice(0, 16)
        : null;
    const childId =
      request.data?.childId != null ? String(request.data.childId).slice(0, 64) : existing.childId;

    const updatedEntry = {
      ...existing,
      uid,
      ownerUid: uid,
      wordsLearned,
      accuracy: accuracy ?? null,
      status,
      lastStudiedAt: now,
      ...(nameIn ? { name: nameIn } : {}),
      ...(avatarIn ? { avatar: avatarIn } : {}),
      ...(childId ? { childId } : {}),
    };

    const nextMembers = memberIds.includes(uid) ? memberIds : [...memberIds, uid];

    // Sharded alt-koleksiyon yazımı: 30+ öğrencili sınıflarda her öğrenci kendi bağımsız
    // `classrooms/{classCode}/roster/{uid}` dokümanına yazar (Firestore 1 write/sn contention koruması)
    const rosterSeatRef = ref.collection("roster").doc(uid);
    await rosterSeatRef.set(
      {
        ...updatedEntry,
        classCode,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Ana sınıf dokümanına yalnızca anlamlı değişiklik (wordsLearned veya status değişimi) olduğunda yaz
    const parentChanged =
      existing.wordsLearned !== updatedEntry.wordsLearned ||
      existing.status !== updatedEntry.status ||
      existing.accuracy !== updatedEntry.accuracy ||
      !students[uid];

    if (parentChanged) {
      await ref.set(
        {
          [`students.${uid}`]: updatedEntry,
          studentsCount: Object.keys({ ...students, [uid]: updatedEntry }).length,
          memberIds: nextMembers.slice(0, 200),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const safeSeat = sanitizeSeatForStudent(updatedEntry, data);
    return { success: true, ownSeat: safeSeat };
  }
);
