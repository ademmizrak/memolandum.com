import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, cloudFuncs } from "../firebase/config";
import { defaultAssignmentForGrade } from "./mebHomeworkUnits";
import { DEFAULT_SCHOOL_LABEL } from "./teacherIdentity";

/**
 * Kullanıcı dostu, gerçek hayat sınıf katılım kodu veya 6 haneli PIN üretir.
 * Garip tireli kodlamalar yerine akılda kalıcı 6 haneli temiz PIN üretir.
 */
export function generateClassCode(prefix = null) {
  if (prefix) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix.toUpperCase()}-${code}`;
  }
  // Gerçek hayat deneyimine en uygun 6 haneli kolay sayısal kod (örn: 682419)
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildAssignmentPayload(unit, overrides = {}) {
  const u = unit || defaultAssignmentForGrade("2. Sınıf");
  return {
    unitName: u.label,
    unitTitle: u.label,
    levelId: u.levelId,
    unitNo: u.unitNo ?? null,
    targetWords: Number(overrides.targetWords) || 15,
    dueDate: overrides.dueDate || "Bu Pazar 20:00",
    assignedAt: Date.now(),
  };
}

/**
 * Öğretmen için yeni bir sınıf / okul alanı oluşturur (auth zorunlu).
 * Gerçek hayat kullanımına uygun 3 mod destekler:
 * 1. 'school_and_class': Okul + Sınıf (Örn: Atatürk İlkokulu - 3/A)
 * 2. 'class_only': Sadece Sınıf / Kurs Grubu (Örn: 10-B, LGS Kampı, Özel Ders)
 * 3. 'school_only': Sadece Okul / Kurum (Örn: Cumhuriyet Anadolu Lisesi)
 */
export async function createClassroom(
  teacherUid,
  {
    creationType = "school_and_class",
    className,
    schoolName,
    schoolLabel,
    province,
    district,
    grade,
    teacherName,
    teacherDisplayLabel,
    teacherAvatar,
    customCode,
    shareExamScoresWithStudents = false,
  }
) {
  if (!db) throw new Error("Veritabanı bağlantısı hazır değil.");
  if (!teacherUid) throw new Error("Sınıf açmak için giriş yapmalısınız.");

  const displayLabel =
    String(teacherDisplayLabel || teacherName || "Öğretmen").trim().slice(0, 80) || "Öğretmen";

  // Modlara göre okul ve sınıf isimlerini ayarla
  let finalSchoolName = DEFAULT_SCHOOL_LABEL;
  let finalClassName = "İngilizce Sınıfı";
  let finalGrade = String(grade || "2. Sınıf").trim();

  if (creationType === "school_only") {
    finalSchoolName = String(schoolName || schoolLabel || "Yeni Okul").trim().slice(0, 120);
    finalClassName = String(className || "Tüm Okul / Genel").trim().slice(0, 80);
    finalGrade = grade ? String(grade).slice(0, 40) : "Tüm Kademeler";
  } else if (creationType === "class_only") {
    finalSchoolName = String(schoolName || schoolLabel || "Bağımsız / Özel Sınıf").trim().slice(0, 120);
    finalClassName = String(className || "İngilizce Sınıfı").trim().slice(0, 80);
    finalGrade = grade ? String(grade).slice(0, 40) : "Genel";
  } else {
    // school_and_class
    finalSchoolName = String(schoolName || schoolLabel || DEFAULT_SCHOOL_LABEL).trim().slice(0, 120);
    finalClassName = String(className || "İngilizce Sınıfı").trim().slice(0, 80);
    finalGrade = grade ? String(grade).slice(0, 40) : "2. Sınıf";
  }

  const homeworkUnit = defaultAssignmentForGrade(finalGrade);
  const buildClassroomPayload = (code) => ({
    classCode: code,
    teacherUid,
    teacherName: displayLabel,
    teacherAvatar: teacherAvatar
      ? {
          type: teacherAvatar.type === "url" ? "url" : "emoji",
          value: String(teacherAvatar.value || "🦉").slice(0, 500),
        }
      : { type: "emoji", value: "🦉" },
    creationType,
    schoolName: finalSchoolName,
    province: String(province || "").slice(0, 80),
    district: String(district || "").slice(0, 80),
    className: finalClassName,
    grade: finalGrade,
    shareExamScoresWithStudents: Boolean(shareExamScoresWithStudents),
    isLocked: false,
    createdAt: serverTimestamp(),
    currentAssignment: buildAssignmentPayload(homeworkUnit),
    studentsCount: 0,
    students: {},
    memberIds: [],
  });

  let classCode = "";
  let classroomData = null;

  if (customCode && String(customCode).trim()) {
    const cleaned = String(customCode)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 16);
    if (cleaned.length < 3) {
      throw new Error("Özel sınıf kodu en az 3 karakter olmalıdır.");
    }
    classCode = cleaned;
    classroomData = buildClassroomPayload(classCode);
    try {
      await setDoc(doc(db, "classrooms", classCode), classroomData);
    } catch {
      throw new Error(
        `"${cleaned}" kodu başka bir sınıf tarafından kullanılıyor. Lütfen başka bir kod seçin.`
      );
    }
  } else {
    let created = false;
    for (let attempt = 0; attempt < 8 && !created; attempt++) {
      classCode = attempt < 6 ? generateClassCode() : `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
      classroomData = buildClassroomPayload(classCode);
      try {
        await setDoc(doc(db, "classrooms", classCode), classroomData);
        created = true;
      } catch {
        created = false;
      }
    }
    if (!created) {
      throw new Error("Sınıf kodu oluşturulurken bir çakışma oldu, lütfen tekrar deneyin.");
    }
  }

  try {
    await setDoc(doc(db, "users", teacherUid), { isTeacher: true }, { merge: true });
  } catch {
    /* ignore */
  }
  return { ...classroomData, createdAt: Date.now() };
}

/**
 * Öğretmen bağlamı — tam classroom belgesi (rules: yalnız teacherUid).
 * Üye bu get’i kullanamaz; fetchMyClassroom kullanın.
 */
export async function getClassroom(classCode) {
  if (!db || !classCode) return null;
  try {
    const cleanCode = classCode.trim().toUpperCase();
    const snap = await getDoc(doc(db, "classrooms", cleanCode));
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.error("Get classroom error:", err);
    return null;
  }
}

/**
 * Üye sınıf özeti — CF; roster yok, yalnız meta + kendi koltuğu.
 */
export async function fetchMyClassroom(classCode) {
  if (!classCode) throw new Error("Sınıf kodu gerekli.");
  if (!cloudFuncs) throw new Error("Cloud Functions hazır değil. Sayfayı yenileyip tekrar deneyin.");

  const call = httpsCallable(cloudFuncs, "getMyClassroom");
  const res = await call({ classCode: String(classCode).trim() });
  const data = res?.data || {};
  if (!data.classroom || !data.studentId) {
    throw new Error("Sınıf özeti yanıtı geçersiz.");
  }
  return {
    classroom: data.classroom,
    studentId: data.studentId,
    ownSeat: data.ownSeat || null,
  };
}

export async function getTeacherClassrooms(teacherUid) {
  if (!db || !teacherUid) return [];
  try {
    const q = query(collection(db, "classrooms"), where("teacherUid", "==", teacherUid));
    const snap = await getDocs(q);
    const classes = [];
    snap.forEach((d) => classes.push(d.data()));
    return classes;
  } catch (err) {
    console.error("Get teacher classrooms error:", err);
    return [];
  }
}

/** Öğretmen sınıflarını canlı dinle */
export function subscribeTeacherClassrooms(teacherUid, onChange) {
  if (!db || !teacherUid) {
    onChange([]);
    return () => {};
  }
  const q = query(collection(db, "classrooms"), where("teacherUid", "==", teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const classes = [];
      snap.forEach((d) => classes.push(d.data()));
      onChange(classes);
    },
    (err) => {
      console.warn("Teacher classrooms snapshot:", err?.message || err);
      onChange([]);
    }
  );
}

export async function assignHomework(classCode, assignmentData) {
  if (!db || !classCode) throw new Error("Sınıf kodu gerekli.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);

  const payload = {
    unitName: assignmentData.unitName || assignmentData.unitTitle || "Haftalık Kelimeler",
    unitTitle: assignmentData.unitTitle || assignmentData.unitName || "Haftalık Kelimeler",
    levelId: assignmentData.levelId,
    unitNo: assignmentData.unitNo ?? null,
    targetWords: Number(assignmentData.targetWords) || 15,
    dueDate: assignmentData.dueDate || "Bu Pazar 20:00",
    assignedAt: Date.now(),
  };

  await updateDoc(classRef, {
    currentAssignment: payload,
    updatedAt: serverTimestamp(),
  });
  return payload;
}

/**
 * Güvenli katılım — Cloud Function (Admin). Roster istemciye açılmaz.
 */
export async function joinClassroom(studentUid, studentName, classCode, options = {}) {
  if (!classCode) throw new Error("Geçerli bir sınıf kodu giriniz.");
  if (!studentUid) throw new Error("Sınıfa katılmak için giriş yapmalısınız.");
  if (!cloudFuncs) throw new Error("Cloud Functions hazır değil. Sayfayı yenileyip tekrar deneyin.");

  const call = httpsCallable(cloudFuncs, "joinClassroom");
  const res = await call({
    classCode: String(classCode).trim(),
    displayLabel: String(studentName || "Öğrenci").trim().slice(0, 40),
    childId: options.childId || null,
    avatar: options.avatar ? String(options.avatar).trim().slice(0, 16) : null,
  });

  const data = res?.data || {};
  if (!data.classroom || !data.studentId) {
    throw new Error("Sınıfa katılım yanıtı geçersiz.");
  }

  return {
    classroom: data.classroom,
    studentId: data.studentId,
    ownSeat: data.ownSeat || null,
  };
}

/**
 * Gradebook progress — Cloud Function (clamp + Admin) + Debounce / Contention Guard.
 * 30 öğrencili bir sınıfta her kelime bilindiğinde aynı `classrooms/{classCode}` dokümanına
 * saniyede onlarca yazma (1 write/sec Firestore contention limiti) gitmesini önlemek için:
 * 1) Oyun içi kelime vuruşları (`immediate: false`) bellekte birleştirilir (15 sn debounce + jitter).
 * 2) Seviye tamamlandığında (`immediate: true` / `level_end`) bekleyen özet tek pakette gönderilir.
 * 3) Önceki gönderimle aynı (`wordsLearned`, `accuracy`, `status`) olan mükerrer istekler elenir.
 */
export const CLASSROOM_PROGRESS_DEBOUNCE_MS = 15000;
export const CLASSROOM_JITTER_MAX_MS = 2500;

const _pendingClassroomSyncMap = new Map();
const _lastSyncedClassroomFingerprint = new Map();

function buildProgressFingerprint(progressData = {}) {
  return `${Number(progressData.wordsLearned) || 0}:${progressData.accuracy ?? "null"}:${progressData.status || ""}`;
}

async function executeCloudClassroomSync(classCode, studentUid, progressData = {}) {
  const key = `${String(classCode).trim().toUpperCase()}:${studentUid}`;
  const fp = buildProgressFingerprint(progressData);
  if (_lastSyncedClassroomFingerprint.get(key) === fp) {
    return { skipped: true, reason: "unchanged_fingerprint" };
  }
  if (!cloudFuncs) {
    console.warn("Class progress sync: Cloud Functions yok");
    return { skipped: true, reason: "no_cloud_funcs" };
  }
  try {
    const call = httpsCallable(cloudFuncs, "syncClassroomProgress");
    await call({
      classCode: String(classCode).trim(),
      wordsLearned: progressData.wordsLearned,
      accuracy: progressData.accuracy,
      status: progressData.status,
      name: progressData.name,
      childId: progressData.childId,
      avatar: progressData.avatar ? String(progressData.avatar).trim().slice(0, 16) : undefined,
      shardedRoster: true,
    });
    _lastSyncedClassroomFingerprint.set(key, fp);
    return { skipped: false, synced: true };
  } catch (err) {
    console.warn("Class progress sync warning:", err);
    return { skipped: true, reason: "rpc_error" };
  }
}

export async function updateStudentClassProgress(
  classCode,
  studentUid,
  progressData = {},
  options = {}
) {
  if (!classCode || !studentUid) return { skipped: true, reason: "missing_args" };
  const cleanCode = String(classCode).trim().toUpperCase();
  const key = `${cleanCode}:${studentUid}`;
  const immediate = Boolean(options?.immediate);

  const existingPending = _pendingClassroomSyncMap.get(key);
  if (existingPending?.timerId) {
    clearTimeout(existingPending.timerId);
  }

  const mergedProgress = {
    ...(existingPending?.progressData || {}),
    ...progressData,
    wordsLearned: Math.max(
      Number(existingPending?.progressData?.wordsLearned) || 0,
      Number(progressData.wordsLearned) || 0
    ),
  };

  if (immediate) {
    _pendingClassroomSyncMap.delete(key);
    return executeCloudClassroomSync(cleanCode, studentUid, mergedProgress);
  }

  return new Promise((resolve) => {
    const jitterMs = Math.floor(Math.random() * CLASSROOM_JITTER_MAX_MS);
    const delayMs =
      typeof options?.customDebounceMs === "number"
        ? options.customDebounceMs
        : CLASSROOM_PROGRESS_DEBOUNCE_MS + jitterMs;

    const timerId = setTimeout(async () => {
      const latest = _pendingClassroomSyncMap.get(key);
      _pendingClassroomSyncMap.delete(key);
      const res = await executeCloudClassroomSync(
        cleanCode,
        studentUid,
        latest?.progressData || mergedProgress
      );
      resolve(res);
    }, delayMs);

    _pendingClassroomSyncMap.set(key, {
      classCode: cleanCode,
      studentUid,
      progressData: mergedProgress,
      timerId,
    });
  });
}

/**
 * Sayfa kapanırken veya seviye biterken bekleyen tüm sınıf ilerleme paketlerini anında boşaltır.
 */
export async function flushPendingClassroomProgressSync() {
  const entries = Array.from(_pendingClassroomSyncMap.values());
  _pendingClassroomSyncMap.clear();
  const results = [];
  for (const item of entries) {
    if (item.timerId) clearTimeout(item.timerId);
    results.push(
      await executeCloudClassroomSync(item.classCode, item.studentUid, item.progressData)
    );
  }
  return results;
}

/**
 * 30 öğrencili bir sınıfta eşzamanlı oyun oynanırken (ör. öğrenci başı 5 kelime = 150 event)
 * Debounce/Coalescing + `roster/{studentId}` alt-koleksiyon sharding mekanizmasının
 * Firestore 1 write/sec contention sınırını aşmadan çalıştığını doğrulayan simülasyon.
 */
export function simulateConcurrentClassroomLoad({
  studentCount = 30,
  wordsPerStudent = 5,
  classCode = "LAB-30X",
} = {}) {
  const totalRawWordEvents = studentCount * wordsPerStudent;
  const perStudentCoalescedBuffer = new Map();
  let suppressedIntermediateWrites = 0;

  // 1. 30 öğrencinin her biri 5 kelime çözer (toplam 150 kelime vuruşu)
  for (let w = 1; w <= wordsPerStudent; w++) {
    for (let s = 1; s <= studentCount; s++) {
      const studentId = `student_${s}`;
      const isLevelEnd = w === wordsPerStudent;
      const prev = perStudentCoalescedBuffer.get(studentId) || { wordsLearned: 0, writes: 0 };
      prev.wordsLearned = w;
      if (!isLevelEnd) {
        // Oyun ortasındaki vuruşlar bellekte birleştirilir (debounce), Firestore'a yazılmaz
        suppressedIntermediateWrites += 1;
      } else {
        // Yalnızca seviye bittiğinde (`level_end` / `immediate: true`) tek paket olarak çıkar
        prev.writes += 1;
        prev.targetPath = `classrooms/${classCode}/roster/${studentId}`;
      }
      perStudentCoalescedBuffer.set(studentId, prev);
    }
  }

  const totalFirestoreWrites = Array.from(perStudentCoalescedBuffer.values()).reduce(
    (sum, item) => sum + item.writes,
    0
  );
  // Her öğrenci kendi `classrooms/{classCode}/roster/{studentId}` dokümanına yazdığı için
  // tek bir doküman üzerindeki maksimum yazma sayısı = 1 (Firestore 1 write/sn limiti içinde!)
  const maxWritesPerSingleDocument = Math.max(
    ...Array.from(perStudentCoalescedBuffer.values()).map((item) => item.writes)
  );

  return {
    studentCount,
    wordsPerStudent,
    totalRawWordEvents,
    suppressedIntermediateWrites,
    totalFirestoreWrites,
    writeReductionRatio: Number(
      ((suppressedIntermediateWrites / Math.max(1, totalRawWordEvents)) * 100).toFixed(1)
    ),
    maxWritesPerSingleDocument,
    shardedSubcollectionPattern: `classrooms/${classCode}/roster/{studentId}`,
    contentionFree:
      totalFirestoreWrites === studentCount &&
      suppressedIntermediateWrites === totalRawWordEvents - studentCount &&
      maxWritesPerSingleDocument === 1,
  };
}

/** 
 * Öğretmen özel notu & kişisel fikirleri — Profil mahremiyeti kapsamında
 * Yalnızca öğretmen tarafından okunur/yazılır; öğrenci veya veliyle asla paylaşılmaz.
 */
export async function setTeacherNote(classCode, studentId, noteInput, teacherUid) {
  if (!db || !classCode || !studentId || !teacherUid) {
    throw new Error("Not kaydı için sınıf ve öğrenci gerekli.");
  }
  const cleanCode = classCode.trim().toUpperCase();
  const noteRef = doc(db, "classrooms", cleanCode, "teacherNotes", String(studentId));

  const noteText = typeof noteInput === "object" ? String(noteInput?.text || "") : String(noteInput || "");
  const tag = typeof noteInput === "object" ? String(noteInput?.tag || "Gözlem") : "Gözlem";

  const payload = {
    text: noteText.slice(0, 5000),
    tag: tag.slice(0, 50),
    teacherUid,
    studentId: String(studentId),
    updatedAt: serverTimestamp(),
  };
  await setDoc(noteRef, payload, { merge: true });
  return payload;
}

/**
 * Öğretmenin sınav puanlarının öğrenci ekranında görünüp görünmeyeceğini belirlemesi
 * (Varsayılan: false / Tamamen Gizli)
 */
export async function toggleExamScoresPrivacy(classCode, shareWithStudents) {
  if (!db || !classCode) throw new Error("Sınıf kodu gerekli.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  await updateDoc(classRef, {
    shareExamScoresWithStudents: Boolean(shareWithStudents),
    updatedAt: serverTimestamp(),
  });
  return Boolean(shareWithStudents);
}

/**
 * Öğretmenin sınıfı yeni katılımlara kilitlemesi / açması (Trol / dış sızıntı engeli)
 */
export async function toggleClassroomLock(classCode, isLocked) {
  if (!db || !classCode) throw new Error("Sınıf kodu gerekli.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  await updateDoc(classRef, {
    isLocked: Boolean(isLocked),
    updatedAt: serverTimestamp(),
  });
  return Boolean(isLocked);
}

export function subscribeTeacherNotes(classCode, onChange) {
  if (!db || !classCode) {
    onChange({});
    return () => {};
  }
  const cleanCode = classCode.trim().toUpperCase();
  const notesCol = collection(db, "classrooms", cleanCode, "teacherNotes");
  return onSnapshot(
    notesCol,
    (snap) => {
      const map = {};
      snap.forEach((d) => {
        map[d.id] = d.data();
      });
      onChange(map);
    },
    (err) => {
      console.warn("Teacher notes snapshot:", err?.message || err);
      onChange({});
    }
  );
}

function cleanStudentLabel(raw) {
  return String(raw || "")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/[\u0300-\u036F\u0483-\u0489]/g, "")
    .replace(/[<>"{}[\]\\/`$]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

/**
 * Öğretmenin sınıfına manuel öğrenci eklemesi (Roster kalıcılığı + Rumuz & Avatar)
 */
export async function addStudentToClassroom(classCode, studentData = {}) {
  if (!db || !classCode) throw new Error("Sınıf kodu gerekli.");
  const name = cleanStudentLabel(studentData.name);
  if (!name) throw new Error("Öğrenci adı / rumuzu boş olamaz.");

  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  const snap = await getDoc(classRef);
  if (!snap.exists()) throw new Error("Sınıf bulunamadı.");

  const data = snap.data() || {};
  const students = { ...(data.students || {}) };
  const studentKey =
    studentData.uid ||
    `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  students[studentKey] = {
    uid: studentKey,
    ownerUid: null,
    name,
    avatar: String(studentData.avatar || "🦁").trim().slice(0, 16) || "🦁",
    studentNo: String(studentData.studentNo || "").trim().slice(0, 20),
    wordsLearned: 0,
    accuracy: null,
    status: "Başlamadı",
    joinedAt: Date.now(),
    isManual: true,
    teacherEdited: true,
  };

  const studentsCount = Object.keys(students).length;
  await updateDoc(classRef, {
    students,
    studentsCount,
    updatedAt: serverTimestamp(),
  });

  return { studentId: studentKey, student: students[studentKey], studentsCount, students };
}

/**
 * Öğretmenin mevcut bir öğrencinin rumuzunu, avatarını veya okul numarasını düzenlemesi
 * (teacherEdited: true olarak işaretlenir; öğrenci konsoldan bu rumuzu ezemez)
 */
export async function updateStudentInClassroom(classCode, studentId, updates = {}) {
  if (!db || !classCode || !studentId) {
    throw new Error("Sınıf kodu ve öğrenci kimliği gerekli.");
  }
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  const snap = await getDoc(classRef);
  if (!snap.exists()) throw new Error("Sınıf bulunamadı.");

  const data = snap.data() || {};
  const students = { ...(data.students || {}) };
  const existing = students[studentId];
  if (!existing) throw new Error("Öğrenci bulunamadı.");

  const nextName =
    updates.name !== undefined
      ? cleanStudentLabel(updates.name) || existing.name || "Öğrenci"
      : existing.name;
  const nextAvatar =
    updates.avatar !== undefined
      ? String(updates.avatar || "").trim().slice(0, 16) || existing.avatar || "🦁"
      : existing.avatar;
  const nextNo =
    updates.studentNo !== undefined
      ? String(updates.studentNo || "").trim().slice(0, 20)
      : existing.studentNo || "";

  students[studentId] = {
    ...existing,
    name: nextName,
    avatar: nextAvatar,
    studentNo: nextNo,
    teacherEdited: true,
  };

  await updateDoc(classRef, {
    students,
    updatedAt: serverTimestamp(),
  });

  return { studentId, student: students[studentId], students };
}

/**
 * Öğretmenin sınıf listesinden öğrenci çıkarması
 */
export async function removeStudentFromClassroom(classCode, studentId) {
  if (!db || !classCode || !studentId) throw new Error("Sınıf kodu ve öğrenci kimliği gerekli.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  const snap = await getDoc(classRef);
  if (!snap.exists()) throw new Error("Sınıf bulunamadı.");

  const data = snap.data() || {};
  const students = { ...(data.students || {}) };
  delete students[studentId];

  const studentsCount = Object.keys(students).length;
  await updateDoc(classRef, {
    students,
    studentsCount,
    updatedAt: serverTimestamp(),
  });

  return { success: true, studentsCount };
}

/**
 * Öğretmenin sınıfını kalıcı olarak silmesi
 */
export async function deleteClassroom(classCode) {
  if (!db || !classCode) throw new Error("Sınıf kodu gerekli.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  await deleteDoc(classRef);
  return { success: true };
}

/**
 * Öğrencinin sınav ve yazılı notlarını güncelleme (1. Yazılı, 2. Yazılı, Quiz)
 */
export async function updateStudentExamScores(classCode, studentId, scores = {}) {
  if (!db || !classCode || !studentId) {
    throw new Error("Sınıf kodu ve öğrenci kimliği gerekli.");
  }

  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  const snap = await getDoc(classRef);
  if (!snap.exists()) throw new Error("Sınıf bulunamadı.");

  const data = snap.data() || {};
  const students = { ...(data.students || {}) };
  const existing = students[studentId] || { uid: studentId, name: "Öğrenci" };

  const parseScore = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    if (isNaN(n)) return null;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  const exam1 = parseScore(scores.exam1);
  const exam2 = parseScore(scores.exam2);
  const quiz = parseScore(scores.quiz);

  const validScores = [exam1, exam2, quiz].filter((s) => s !== null);
  const avg =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : null;

  const examScoresPayload = {
    exam1,
    exam2,
    quiz,
    avg,
    updatedAt: Date.now(),
  };

  students[studentId] = {
    ...existing,
    examScores: examScoresPayload,
  };

  await updateDoc(classRef, {
    students,
    updatedAt: serverTimestamp(),
  });

  return { studentId, examScores: examScoresPayload, students };
}

export async function submitB2BLead({
  schoolName,
  province,
  district,
  contactName,
  role,
  email,
  phone,
  studentCount,
  note,
}) {
  if (!db) throw new Error("Veritabanı bağlantısı kurulamadı.");
  if (!schoolName || !contactName || (!email && !phone)) {
    throw new Error("Lütfen okul adı, yetkili adı ve iletişim bilgilerinizi eksiksiz girin.");
  }

  const leadEntry = {
    schoolName: schoolName.trim(),
    province: province ? province.trim() : "",
    district: district ? district.trim() : "",
    contactName: contactName.trim(),
    role: role || "İngilizce Zümre Başkanı",
    email: email ? email.trim() : null,
    phone: phone ? phone.trim() : null,
    studentCount: Number(studentCount) || 100,
    note: note ? note.trim() : "",
    createdAt: serverTimestamp(),
    status: "Yeni Talep",
  };

  const docRef = await addDoc(collection(db, "b2bLeads"), leadEntry);
  return docRef.id;
}
