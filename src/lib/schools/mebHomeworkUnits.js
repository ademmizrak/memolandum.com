import { findLevelContext } from "../learning/studyContext.js";

/**
 * MEB 1–12. sınıf, LGS, YKS-DİL, YDS/YÖKDİL ve Genel İngilizce ödev hedefleri — levelId + unitNo (WordCard ile uyumlu).
 * unitNo:null = tüm paket (kelime/cümle seti).
 */
export const MEB_HOMEWORK_UNITS = [
  // 1. Sınıf
  { id: "meb1-all", levelId: "meb-1-sinif-kelimeleri", unitNo: null, label: "1. Sınıf — Tüm Temel Kelimeler" },
  { id: "meb1-u1", levelId: "meb-1-sinif-kelimeleri", unitNo: 1, label: "1. Sınıf Ünite 1: Alphabets & Phonics" },
  { id: "meb1-u2", levelId: "meb-1-sinif-kelimeleri", unitNo: 2, label: "1. Sınıf Ünite 2: Numbers" },
  { id: "meb1-u3", levelId: "meb-1-sinif-kelimeleri", unitNo: 3, label: "1. Sınıf Ünite 3: Primary Colors" },
  { id: "meb1-u4", levelId: "meb-1-sinif-kelimeleri", unitNo: 4, label: "1. Sınıf Ünite 4: Basic Greetings" },
  { id: "meb1-u5", levelId: "meb-1-sinif-kelimeleri", unitNo: 5, label: "1. Sınıf Ünite 5: Animals & Pets" },
  { id: "meb1-u6", levelId: "meb-1-sinif-kelimeleri", unitNo: 6, label: "1. Sınıf Ünite 6: Classroom Objects" },

  // 2. Sınıf
  { id: "meb2-u1", levelId: "meb-2-sinif-kelimeleri", unitNo: 1, label: "2. Sınıf Ünite 1: Words & Greetings" },
  { id: "meb2-u2", levelId: "meb-2-sinif-kelimeleri", unitNo: 2, label: "2. Sınıf Ünite 2: Friends" },
  { id: "meb2-u3", levelId: "meb-2-sinif-kelimeleri", unitNo: 3, label: "2. Sınıf Ünite 3: In The Classroom" },
  { id: "meb2-u4", levelId: "meb-2-sinif-kelimeleri", unitNo: 4, label: "2. Sınıf Ünite 4: Numbers" },
  { id: "meb2-u5", levelId: "meb-2-sinif-kelimeleri", unitNo: 5, label: "2. Sınıf Ünite 5: Colors" },
  { id: "meb2-u6", levelId: "meb-2-sinif-kelimeleri", unitNo: 6, label: "2. Sınıf Ünite 6: At the Playground" },
  { id: "meb2-u7", levelId: "meb-2-sinif-kelimeleri", unitNo: 7, label: "2. Sınıf Ünite 7: Body Parts" },
  { id: "meb2-u8", levelId: "meb-2-sinif-kelimeleri", unitNo: 8, label: "2. Sınıf Ünite 8: Pets" },
  { id: "meb2-u9", levelId: "meb-2-sinif-kelimeleri", unitNo: 9, label: "2. Sınıf Ünite 9: Fruit" },
  { id: "meb2-u10", levelId: "meb-2-sinif-kelimeleri", unitNo: 10, label: "2. Sınıf Ünite 10: Animals" },
  { id: "meb2-sent", levelId: "meb-2-sinif-cumleleri", unitNo: null, label: "2. Sınıf — Kalıp Cümleler" },

  // 3. Sınıf
  { id: "meb3-u1", levelId: "meb-3-sinif-kelimeleri", unitNo: 1, label: "3. Sınıf Ünite 1: Greetings" },
  { id: "meb3-u2", levelId: "meb-3-sinif-kelimeleri", unitNo: 2, label: "3. Sınıf Ünite 2: My Family" },
  { id: "meb3-u3", levelId: "meb-3-sinif-kelimeleri", unitNo: 3, label: "3. Sınıf Ünite 3: People I Love" },
  { id: "meb3-u4", levelId: "meb-3-sinif-kelimeleri", unitNo: 4, label: "3. Sınıf Ünite 4: Feelings" },
  { id: "meb3-u5", levelId: "meb-3-sinif-kelimeleri", unitNo: 5, label: "3. Sınıf Ünite 5: Toys and Games" },
  { id: "meb3-u6", levelId: "meb-3-sinif-kelimeleri", unitNo: 6, label: "3. Sınıf Ünite 6: My House" },
  { id: "meb3-u7", levelId: "meb-3-sinif-kelimeleri", unitNo: 7, label: "3. Sınıf Ünite 7: In My City" },
  { id: "meb3-u8", levelId: "meb-3-sinif-kelimeleri", unitNo: 8, label: "3. Sınıf Ünite 8: Transportation" },
  { id: "meb3-u9", levelId: "meb-3-sinif-kelimeleri", unitNo: 9, label: "3. Sınıf Ünite 9: Weather" },
  { id: "meb3-u10", levelId: "meb-3-sinif-kelimeleri", unitNo: 10, label: "3. Sınıf Ünite 10: Nature" },
  { id: "meb3-sent", levelId: "meb-3-sinif-cumleleri", unitNo: null, label: "3. Sınıf — Kalıp Cümleler" },

  // 4. Sınıf
  { id: "meb4-u1", levelId: "meb-4-sinif-kelimeleri", unitNo: 1, label: "4. Sınıf Ünite 1: Classroom Rules" },
  { id: "meb4-u2", levelId: "meb-4-sinif-kelimeleri", unitNo: 2, label: "4. Sınıf Ünite 2: Nationality" },
  { id: "meb4-u3", levelId: "meb-4-sinif-kelimeleri", unitNo: 3, label: "4. Sınıf Ünite 3: Free Time" },
  { id: "meb4-u4", levelId: "meb-4-sinif-kelimeleri", unitNo: 4, label: "4. Sınıf Ünite 4: My Day" },
  { id: "meb4-u5", levelId: "meb-4-sinif-kelimeleri", unitNo: 5, label: "4. Sınıf Ünite 5: Jobs" },
  { id: "meb4-u6", levelId: "meb-4-sinif-kelimeleri", unitNo: 6, label: "4. Sınıf Ünite 6: Fun with Science" },
  { id: "meb4-u7", levelId: "meb-4-sinif-kelimeleri", unitNo: 7, label: "4. Sınıf Ünite 7: Clothes" },
  { id: "meb4-u8", levelId: "meb-4-sinif-kelimeleri", unitNo: 8, label: "4. Sınıf Ünite 8: My Friends" },
  { id: "meb4-u9", levelId: "meb-4-sinif-kelimeleri", unitNo: 9, label: "4. Sınıf Ünite 9: Food and Drinks" },
  { id: "meb4-u10", levelId: "meb-4-sinif-kelimeleri", unitNo: 10, label: "4. Sınıf Ünite 10: Food and Daily Routines" },
  { id: "meb4-sent", levelId: "meb-4-sinif-cumleleri", unitNo: null, label: "4. Sınıf — Kalıp Cümleler" },

  // Ortaokul (5–8. Sınıf & LGS)
  { id: "meb5-u1", levelId: "meb-5-sinif-kelimeleri", unitNo: 1, label: "5. Sınıf Ünite 1: School Life" },
  { id: "meb6-u1", levelId: "meb-6-sinif-kelimeleri", unitNo: 1, label: "6. Sınıf Ünite 1: School Life" },
  { id: "meb7-u1", levelId: "meb-7-sinif-kelimeleri", unitNo: 1, label: "7. Sınıf Ünite 1: School Life & Education" },
  { id: "meb7-u2", levelId: "meb-7-sinif-kelimeleri", unitNo: 2, label: "7. Sınıf Ünite 2: Classroom Life & Learning" },
  { id: "meb8-u1", levelId: "meb-8-sinif-kelimeleri", unitNo: 1, label: "8. Sınıf / LGS Ünite 1: School Life & Education" },

  // Lise (9–12. Sınıf & Genel İngilizce CEFR)
  { id: "lise9-a1", levelId: "ingilizce-genel-words-a1-vocabulary", unitNo: null, label: "9. Sınıf / Genel İngilizce (A1): Başlangıç Kelimeleri" },
  { id: "lise10-a2", levelId: "ingilizce-genel-words-a2-vocabulary", unitNo: null, label: "10. Sınıf / Genel İngilizce (A2): Temel Kelimeler" },
  { id: "lise11-b1", levelId: "ingilizce-genel-words-b1-vocabulary", unitNo: null, label: "11. Sınıf / Genel İngilizce (B1): Orta Düzey Kelimeler" },
  { id: "lise12-b2", levelId: "ingilizce-genel-words-b2-vocabulary", unitNo: null, label: "12. Sınıf / Genel İngilizce (B2): Orta Üstü Kelimeler" },
  { id: "genel-c1", levelId: "ingilizce-genel-words-c1-vocabulary", unitNo: null, label: "İleri İngilizce (C1): Advanced Kelimeler" },
  { id: "genel-c2", levelId: "ingilizce-genel-words-c2-vocabulary", unitNo: null, label: "Yetkin İngilizce (C2): Proficient Kelimeler" },

  // YKS-DİL & YDS / YÖKDİL Sınav Hazırlık
  { id: "yks-g1", levelId: "ingilizce-yks-kelimeleri-yks-dil-group1-en-tr-v2", unitNo: null, label: "YKS-DİL (11-12. Sınıf) — Grup 1 Kelimeleri" },
  { id: "yks-g2", levelId: "ingilizce-yks-kelimeleri-yks-dil-group2-en-tr-v2", unitNo: null, label: "YKS-DİL (11-12. Sınıf) — Grup 2 Kelimeleri" },
  { id: "yds-top500", levelId: "ingilizce-yds-kelimeleri-yds-top500-master", unitNo: null, label: "YDS / YÖKDİL — Top 500 Master Kelimeler" },
  { id: "yds-g1", levelId: "ingilizce-yds-kelimeleri-yds-grup1-en-tr-v2", unitNo: null, label: "YDS / YÖKDİL — Grup 1 Akademik Kelimeler" },
  { id: "yds-awl1", levelId: "ingilizce-sinav-ozel-en-academic-word-list-001-100", unitNo: null, label: "YDS / Akademik — Academic Word List (1–100)" },
  { id: "yds-conj1", levelId: "ingilizce-sinav-ozel-en-baglaclar-001-100", unitNo: null, label: "YDS / YKS-DİL — Kritik Bağlaçlar (1–100)" },
];

export function findHomeworkUnit(levelId, unitNo) {
  return (
    MEB_HOMEWORK_UNITS.find(
      (u) =>
        u.levelId === levelId &&
        (unitNo == null || unitNo === ""
          ? u.unitNo == null
          : Number(u.unitNo) === Number(unitNo))
    ) || null
  );
}

export function defaultAssignmentForGrade(gradeLabel = "2. Sınıf") {
  const g = String(gradeLabel || "").toLowerCase();
  // Önce çift haneli sınıflar ve özel sınav kategorileri kontrol edilmeli ("10" içinde "1" geçtiği için!)
  if (g.includes("yds") || g.includes("yökdil") || g.includes("yokdil")) {
    return MEB_HOMEWORK_UNITS.find((u) => u.id === "yds-top500") || MEB_HOMEWORK_UNITS[0];
  }
  if (g.includes("yks")) {
    return MEB_HOMEWORK_UNITS.find((u) => u.id === "yks-g1") || MEB_HOMEWORK_UNITS[0];
  }
  if (g.includes("lgs")) {
    return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb8-u1") || MEB_HOMEWORK_UNITS[0];
  }
  if (/\b12\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "lise12-b2");
  if (/\b11\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "lise11-b1");
  if (/\b10\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "lise10-a2");
  if (/\b9\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "lise9-a1");
  if (/\b8\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb8-u1");
  if (/\b7\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb7-u1");
  if (/\b6\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb6-u1");
  if (/\b5\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb5-u1");
  if (/\b4\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb4-u1");
  if (/\b3\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb3-u1");
  if (/\b2\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb2-u1");
  if (/\b1\b/.test(g)) return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb1-all");
  if (g.includes("genel") || g.includes("özel") || g.includes("ozel")) {
    return MEB_HOMEWORK_UNITS.find((u) => u.id === "lise9-a1");
  }
  return MEB_HOMEWORK_UNITS.find((u) => u.id === "meb2-u1");
}

/** WordCard sessionStorage key — oyun motoru ile aynı. */
export function wordCardUnitStorageKey(levelId) {
  return `word-card-unit:${levelId || "default"}`;
}

export function seedWordCardUnit(levelId, unitNo) {
  if (typeof window === "undefined" || unitNo == null || unitNo === "") return;
  try {
    const val = String(unitNo);
    sessionStorage.setItem(wordCardUnitStorageKey(levelId), val);
    const ctx = findLevelContext(levelId);
    if (ctx?.levelId) {
      sessionStorage.setItem(wordCardUnitStorageKey(ctx.levelId), val);
    }
    if (ctx?.level?.slug) {
      sessionStorage.setItem(wordCardUnitStorageKey(ctx.level.slug), val);
    }
  } catch {
    /* ignore */
  }
}

export function buildHomeworkStartHref(assignment) {
  if (!assignment?.levelId) return "/learn/en-tr/";
  const ctx = findLevelContext(assignment.levelId);
  const slug = ctx?.level?.slug || assignment.levelId;
  const base = `/learn/en-tr/${slug}/`;
  if (assignment.unitNo != null && assignment.unitNo !== "") {
    return `${base}?unit=${encodeURIComponent(assignment.unitNo)}`;
  }
  return base;
}

