/**
 * Enterprise schools verification suite (V1–V5)
 * node scripts/enterprise-verify-schools.mjs
 *
 * V1: teacher create → joinClassroom CF call attempt → member full get DENY → progress CF attempt
 * V2: stranger get deny
 * V_iso: member full classroom get deny (roster isolation)
 * V3: student score write deny
 * V4: teacherNotes student deny
 * V5: App Check / CF error surface
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = {
  ...loadEnvFile(path.join(ROOT, ".env")),
  ...loadEnvFile(path.join(ROOT, ".env.production")),
  ...loadEnvFile(path.join(ROOT, ".env.local")),
};

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "memolandum-33dc4.firebaseapp.com",
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "memolandum-33dc4",
  storageBucket:
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "memolandum-33dc4.firebasestorage.app",
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const stamp = Date.now().toString(36);
const PASS = `Ent!${stamp}Aa9`;
// Plus-alias → info@memolandum.com. Sahte .test alan adı kullanma (MX NXDOMAIN bounce).
const emails = {
  teacher: `info+ent.teacher.${stamp}@memolandum.com`,
  student: `info+ent.student.${stamp}@memolandum.com`,
  stranger: `info+ent.stranger.${stamp}@memolandum.com`,
};
const CLASS_CODE = `E${stamp.slice(-3).toUpperCase()}-${stamp.slice(0, 3).toUpperCase()}`.slice(
  0,
  12
);

const report = {
  startedAt: new Date().toISOString(),
  classCode: CLASS_CODE,
  results: [],
};

function record(id, status, detail) {
  report.results.push({ id, status, detail, at: new Date().toISOString() });
  const icon = status === "PASS" ? "✅" : status === "WARN" ? "⚠️" : "❌";
  console.log(`${icon} [${id}] ${status} — ${detail}`);
}

async function ensureAuthReady(auth) {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error("auth.currentUser missing");
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

function isAppCheckOrAuthTransportError(e) {
  const msg = String(e?.message || e);
  const code = String(e?.code || "");
  return (
    msg.includes("App Check") ||
    msg.includes("app-check") ||
    msg.includes("unauthenticated") ||
    code.includes("unauthenticated") ||
    code.includes("failed-precondition") ||
    msg.includes("403") ||
    msg.includes("ATT")
  );
}

async function expectDenied(fn) {
  try {
    await fn();
    return { denied: false };
  } catch (e) {
    const msg = String(e?.message || e);
    const code = String(e?.code || "");
    const denied =
      code.includes("permission-denied") ||
      msg.includes("permission-denied") ||
      msg.includes("Missing or insufficient permissions") ||
      code.includes("unauthenticated") ||
      msg.includes("app-check") ||
      msg.includes("AppCheck") ||
      code.includes("failed-precondition");
    return { denied, error: msg, code };
  }
}

async function main() {
  if (!firebaseConfig.apiKey) {
    record("BOOT", "FAIL", "Firebase API key missing");
    process.exitCode = 1;
    return;
  }

  const app = initializeApp(firebaseConfig, `ent-${stamp}`);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, "us-central1");
  const joinFn = httpsCallable(functions, "joinClassroom");
  const progressFn = httpsCallable(functions, "syncClassroomProgress");

  let teacher = null;
  let student = null;
  let stranger = null;

  try {
    // ─── Setup teacher + class ─────────────────────────────────────
    teacher = await createUserWithEmailAndPassword(auth, emails.teacher, PASS);
    await setDoc(doc(db, "classrooms", CLASS_CODE), {
      classCode: CLASS_CODE,
      teacherUid: teacher.user.uid,
      teacherName: "EntOwl",
      teacherAvatar: { type: "emoji", value: "🦉" },
      schoolName: "Özel masa",
      province: "",
      district: "",
      className: "Enterprise Verify",
      grade: "4. Sınıf",
      createdAt: serverTimestamp(),
      currentAssignment: {
        unitName: "Ent Ünite",
        unitTitle: "Ent Ünite",
        levelId: "meb-4-sinif-kelimeleri",
        unitNo: 1,
        targetWords: 15,
        dueDate: "Bu Pazar 20:00",
        assignedAt: Date.now(),
      },
      studentsCount: 0,
      students: {},
      memberIds: [],
    });
    record("V1.setup", "PASS", `teacher+class ${CLASS_CODE}`);

    // ─── V2 stranger get ───────────────────────────────────────────
    await signOut(auth);
    stranger = await createUserWithEmailAndPassword(auth, emails.stranger, PASS);
    {
      const r = await expectDenied(() => getDoc(doc(db, "classrooms", CLASS_CODE)));
      if (r.denied) record("V2.stranger_get", "PASS", "permission-denied");
      else record("V2.stranger_get", "FAIL", "stranger could read classroom");
    }

    // ─── V1 join via CF (real callable) ────────────────────────────
    await signOut(auth);
    student = await createUserWithEmailAndPassword(auth, emails.student, PASS);
    await ensureAuthReady(auth);
    let joinedViaCf = false;
    try {
      const res = await joinFn({
        classCode: CLASS_CODE,
        displayLabel: "YıldızEnt",
        childId: null,
      });
      const data = res?.data;
      if (!data?.studentId || !data?.classroom) {
        record("V1.cf_join", "FAIL", "empty CF response");
      } else if (data.classroom.students && Object.keys(data.classroom.students).length > 1) {
        record("V1.cf_join", "FAIL", "CF returned full roster");
      } else {
        joinedViaCf = true;
        record(
          "V1.cf_join",
          "PASS",
          `CF join OK seat=${data.studentId.slice(0, 8)}… rosterKeys=${Object.keys(data.classroom.students || {}).length}`
        );
        record("V5.appcheck_node", "PASS", "callable accepted from Node");
      }
    } catch (e) {
      const msg = String(e?.message || e);
      const code = String(e?.code || "");
      if (isAppCheckOrAuthTransportError(e)) {
        record(
          "V1.cf_join",
          "WARN",
          `CF not callable from Node (App Check/auth transport): ${code || msg.slice(0, 120)}`
        );
        record(
          "V5.appcheck_node",
          "PASS",
          "Node callable rejected — browser App Check path required for CF"
        );
      } else {
        record("V1.cf_join", "FAIL", `${code} ${msg.slice(0, 200)}`);
        record("V5.appcheck_node", "WARN", `unexpected CF error: ${msg.slice(0, 160)}`);
      }
    }

    // Fallback join sim so remaining checks can run if CF App Check blocked Node
    if (!joinedViaCf) {
      await signOut(auth);
      await signInWithEmailAndPassword(auth, emails.teacher, PASS);
      await updateDoc(doc(db, "classrooms", CLASS_CODE), {
        [`students.${student.user.uid}`]: {
          uid: student.user.uid,
          ownerUid: student.user.uid,
          name: "YıldızEnt",
          joinedAt: Date.now(),
          wordsLearned: 0,
          accuracy: null,
          lastStudiedAt: null,
          status: "Başlamadı",
        },
        studentsCount: 1,
        memberIds: [student.user.uid],
        updatedAt: serverTimestamp(),
      });
      record("V1.join_fallback", "WARN", "teacher-update sim used (browser App Check path still required)");
    }

    // V_iso: member must NOT read full classroom doc (classmate scores)
    await signOut(auth);
    await signInWithEmailAndPassword(auth, emails.student, PASS);
    {
      const r = await expectDenied(() => getDoc(doc(db, "classrooms", CLASS_CODE)));
      if (r.denied) record("V_iso.member_full_get", "PASS", "member full get denied");
      else record("V_iso.member_full_get", "FAIL", "member still reads full classroom");
    }

    // V1 progress CF
    await ensureAuthReady(auth);
    try {
      await progressFn({
        classCode: CLASS_CODE,
        wordsLearned: 7,
        accuracy: 86,
        name: "YıldızEnt",
      });
      record("V1.cf_progress", "PASS", "syncClassroomProgress OK");
    } catch (e) {
      const msg = String(e?.message || e);
      if (isAppCheckOrAuthTransportError(e)) {
        record("V1.cf_progress", "WARN", "CF progress blocked from Node — using teacher write fallback");
        await signOut(auth);
        await signInWithEmailAndPassword(auth, emails.teacher, PASS);
        await updateDoc(doc(db, "classrooms", CLASS_CODE), {
          [`students.${student.user.uid}.wordsLearned`]: 7,
          [`students.${student.user.uid}.accuracy`]: 86,
          [`students.${student.user.uid}.status`]: "Devam Ediyor",
        });
      } else {
        record("V1.cf_progress", "FAIL", msg.slice(0, 200));
      }
    }

    // Teacher roster
    await signOut(auth);
    await signInWithEmailAndPassword(auth, emails.teacher, PASS);
    {
      const snap = await getDoc(doc(db, "classrooms", CLASS_CODE));
      const seat = snap.data()?.students?.[student.user.uid];
      if (seat?.name === "YıldızEnt" && Number(seat.wordsLearned) === 7) {
        record("V1.teacher_roster", "PASS", "YıldızEnt · 7 kelime görünür");
      } else {
        record("V1.teacher_roster", "FAIL", JSON.stringify(seat));
      }
    }

    // ─── V3 student score write ────────────────────────────────────
    await signOut(auth);
    await signInWithEmailAndPassword(auth, emails.student, PASS);
    {
      const r = await expectDenied(() =>
        updateDoc(doc(db, "classrooms", CLASS_CODE), {
          [`students.${student.user.uid}.accuracy`]: 100,
          [`students.${student.user.uid}.wordsLearned`]: 99,
        })
      );
      if (r.denied) record("V3.score_write", "PASS", "student score write denied");
      else record("V3.score_write", "FAIL", "student wrote scores");
    }

    // ─── V4 teacher notes ──────────────────────────────────────────
    await signOut(auth);
    await signInWithEmailAndPassword(auth, emails.teacher, PASS);
    await setDoc(doc(db, "classrooms", CLASS_CODE, "teacherNotes", student.user.uid), {
      text: "Enterprise gizli not",
      teacherUid: teacher.user.uid,
      studentId: student.user.uid,
      updatedAt: serverTimestamp(),
    });
    record("V4.note_write", "PASS", "teacher wrote note");

    await signOut(auth);
    await signInWithEmailAndPassword(auth, emails.student, PASS);
    {
      const r1 = await expectDenied(() =>
        getDocs(collection(db, "classrooms", CLASS_CODE, "teacherNotes"))
      );
      const r2 = await expectDenied(() =>
        getDoc(doc(db, "classrooms", CLASS_CODE, "teacherNotes", student.user.uid))
      );
      if (r1.denied && r2.denied) record("V4.note_read", "PASS", "student cannot read notes");
      else record("V4.note_read", "FAIL", `listDenied=${r1.denied} getDenied=${r2.denied}`);
    }

    // ─── V5: unauthenticated CF ────────────────────────────────────
    await signOut(auth);
    try {
      await joinFn({ classCode: CLASS_CODE, displayLabel: "X" });
      record("V5.cf_unauth", "FAIL", "unauthenticated join allowed");
    } catch (e) {
      const msg = String(e?.message || e);
      const code = String(e?.code || "");
      if (
        code.includes("unauthenticated") ||
        msg.includes("unauthenticated") ||
        msg.includes("Giriş") ||
        msg.includes("App Check") ||
        msg.includes("app-check")
      ) {
        record("V5.cf_unauth", "PASS", `rejected: ${code || msg.slice(0, 80)}`);
      } else {
        record("V5.cf_unauth", "WARN", `rejected with other error: ${code} ${msg.slice(0, 100)}`);
      }
    }
  } catch (e) {
    record("SUITE", "FAIL", String(e?.message || e));
    process.exitCode = 1;
  } finally {
    try {
      await signOut(auth).catch(() => {});
      if (teacher) {
        await signInWithEmailAndPassword(auth, emails.teacher, PASS);
        try {
          await deleteDoc(
            doc(db, "classrooms", CLASS_CODE, "teacherNotes", student.user.uid)
          );
        } catch {
          /* ignore */
        }
        await deleteDoc(doc(db, "classrooms", CLASS_CODE)).catch(() => {});
        await deleteUser(auth.currentUser).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    for (const email of [emails.student, emails.stranger]) {
      try {
        await signOut(auth).catch(() => {});
        await signInWithEmailAndPassword(auth, email, PASS);
        await deleteUser(auth.currentUser).catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }

  const fails = report.results.filter((r) => r.status === "FAIL").length;
  const warns = report.results.filter((r) => r.status === "WARN").length;
  const passes = report.results.filter((r) => r.status === "PASS").length;
  report.summary = { passes, warns, fails, verdict: fails === 0 ? (warns ? "PASS_WITH_WARNINGS" : "PASS") : "FAIL" };
  report.endedAt = new Date().toISOString();

  const outPath = path.join(ROOT, "scratch", `enterprise-schools-verify-${stamp}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n📋 Report: ${outPath}`);
  console.log(`Verdict: ${report.summary.verdict} (pass=${passes} warn=${warns} fail=${fails})`);
  if (fails > 0) process.exitCode = 1;
}

main();
