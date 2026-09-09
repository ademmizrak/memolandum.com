import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Benzersiz 6 karakterli sınıf katılım kodu üretir (örn: MEMO-4A, MEM-782)
 */
export function generateClassCode(prefix = "MEM") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Öğretmen için yeni bir sınıf oluşturur
 */
export async function createClassroom(teacherUid, { className, schoolName, province, district, grade, teacherName }) {
  if (!db) throw new Error("Veritabanı bağlantısı hazır değil.");
  if (!teacherUid) throw new Error("Öğretmen oturumu bulunamadı.");

  let attempts = 0;
  let classCode = "";
  let exists = true;

  // Çakışmayan kod bulana kadar dene
  while (exists && attempts < 5) {
    classCode = generateClassCode(grade ? `M${grade.charAt(0)}` : "MEM");
    const snap = await getDoc(doc(db, "classrooms", classCode));
    exists = snap.exists();
    attempts++;
  }

  const classroomData = {
    classCode,
    teacherUid,
    teacherName: teacherName || "Öğretmen",
    schoolName: schoolName || "Okul",
    province: province || "",
    district: district || "",
    className: className || "İngilizce Sınıfı",
    grade: grade || "2. Sınıf",
    createdAt: serverTimestamp(),
    currentAssignment: {
      unitName: "Ünite 1: Words & Greetings",
      levelId: "meb-2-sinif-kelimeleri",
      targetWords: 15,
      dueDate: "Her Pazar 20:00",
      assignedAt: Date.now(),
    },
    studentsCount: 0,
    students: {},
  };

  await setDoc(doc(db, "classrooms", classCode), classroomData);
  return classroomData;
}

/**
 * Sınıf koduna göre sınıf bilgilerini çeker
 */
export async function getClassroom(classCode) {
  if (!db || !classCode) return null;
  try {
    const cleanCode = classCode.trim().toUpperCase();
    const snap = await getDoc(doc(db, "classrooms", cleanCode));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error("Get classroom error:", err);
    return null;
  }
}

/**
 * Öğretmenin açtığı sınıfları getirir
 */
export async function getTeacherClassrooms(teacherUid) {
  if (!db || !teacherUid) return [];
  try {
    const q = query(
      collection(db, "classrooms"),
      where("teacherUid", "==", teacherUid)
    );
    const snap = await getDocs(q);
    const classes = [];
    snap.forEach((d) => classes.push(d.data()));
    return classes;
  } catch (err) {
    console.error("Get teacher classrooms error:", err);
    return [];
  }
}

/**
 * Sınıfa yeni bir MEB ünite ödevi tanımlar
 */
export async function assignHomework(classCode, assignmentData) {
  if (!db || !classCode) throw new Error("Sınıf kodu gerekli.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);

  await setDoc(
    classRef,
    {
      currentAssignment: {
        ...assignmentData,
        assignedAt: Date.now(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return true;
}

/**
 * Öğrencinin sınıf kodu ile sınıfa katılması
 */
export async function joinClassroom(studentUid, studentName, classCode) {
  if (!db || !classCode) throw new Error("Geçerli bir sınıf kodu giriniz.");
  const cleanCode = classCode.trim().toUpperCase();
  const classRef = doc(db, "classrooms", cleanCode);
  const snap = await getDoc(classRef);

  if (!snap.exists()) {
    throw new Error("Bu kodla eşleşen bir sınıf bulunamadı. Lütfen öğretmeninizden kodu kontrol etmesini isteyin.");
  }

  const classData = snap.data();
  const sId = studentUid || `student_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const studentEntry = {
    uid: sId,
    name: studentName || "Öğrenci",
    joinedAt: Date.now(),
    wordsLearned: 0,
    accuracy: 92,
    lastStudiedAt: Date.now(),
    status: "Devam Ediyor",
  };

  const updatedStudents = {
    ...(classData.students || {}),
    [sId]: studentEntry,
  };

  await setDoc(
    classRef,
    {
      students: updatedStudents,
      studentsCount: Object.keys(updatedStudents).length,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    classroom: classData,
    studentId: sId,
  };
}

/**
 * Öğrencinin ders çalışmasını sınıf tablosuna senkronize eder
 */
export async function updateStudentClassProgress(classCode, studentUid, progressData) {
  if (!db || !classCode || !studentUid) return;
  try {
    const cleanCode = classCode.trim().toUpperCase();
    const classRef = doc(db, "classrooms", cleanCode);
    const snap = await getDoc(classRef);
    if (!snap.exists()) return;

    const classData = snap.data();
    const existing = (classData.students && classData.students[studentUid]) || {};

    const updatedEntry = {
      ...existing,
      ...progressData,
      lastStudiedAt: Date.now(),
    };

    await setDoc(
      classRef,
      {
        students: {
          ...(classData.students || {}),
          [studentUid]: updatedEntry,
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Class progress sync warning:", err);
  }
}

/**
 * Kurumsal Okul & Kolej B2B Demo / Lisans Talebi Formu Kaydı
 */
export async function submitB2BLead({ schoolName, province, district, contactName, role, email, phone, studentCount, note }) {
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
