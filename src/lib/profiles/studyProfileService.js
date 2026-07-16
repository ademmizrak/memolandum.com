import { doc, setDoc, getDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/** UI’da yeni profil oluştururken önerilen dil yolları */
export const STUDY_LANG_PRESETS = [
  { langPair: "en-tr", label: "İngilizce", manifestHint: "en-tr" },
  { langPair: "de-tr", label: "Almanca", manifestHint: "de-tr" },
  { langPair: "fr-tr", label: "Fransızca", manifestHint: "fr-tr" },
  { langPair: "es-tr", label: "İspanyolca", manifestHint: "es-tr" },
  { langPair: "ru-tr", label: "Rusça", manifestHint: "ru-tr" },
  { langPair: "ko-tr", label: "Korece", manifestHint: "ko-tr" },
  { langPair: "pt-en", label: "Portekizce", manifestHint: "pt-en" },
  { langPair: "el-tr", label: "Yunanca", manifestHint: "el-tr" },
  { langPair: "it-tr", label: "İtalyanca", manifestHint: "it-tr" },
  { langPair: "ja-tr", label: "Japonca", manifestHint: "ja-tr" },
  { langPair: "ar-tr", label: "Arapça", manifestHint: "ar-tr" },
  { langPair: "zh-tr", label: "Çince", manifestHint: "zh-tr" },
];

export function emptyProfileStats() {
  return {
    total_score: 0,
    total_xp: 0,
    gems: 0,
    level: 1,
    game_breakdown: {},
    lastPlayedLang: null,
    lastPlayedLevel: null,
  };
}

export function makeStudyProfileId(langPair) {
  const raw = String(langPair || "en-tr")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return raw || "en-tr";
}

export function buildStudyProfile({ langPair, label, id } = {}) {
  const pair = langPair || "en-tr";
  const preset = STUDY_LANG_PRESETS.find((p) => p.langPair === pair);
  return {
    id: id || makeStudyProfileId(pair),
    langPair: pair,
    label: (label || preset?.label || pair).slice(0, 40),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function fetchStudyProfiles(uid) {
  if (!uid || !db) return [];
  const snap = await getDocs(collection(db, "users", uid, "studyProfiles"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchProfileStats(uid, profileId) {
  if (!uid || !profileId || !db) return emptyProfileStats();
  const snap = await getDoc(doc(db, "users", uid, "profileStats", profileId));
  if (!snap.exists()) return emptyProfileStats();
  const data = snap.data() || {};
  return {
    ...emptyProfileStats(),
    total_score: Number(data.total_score) || 0,
    total_xp: Number(data.total_xp) || 0,
    gems: Number(data.gems) || 0,
    level: Number(data.level) || 1,
    game_breakdown: data.game_breakdown && typeof data.game_breakdown === "object" ? data.game_breakdown : {},
    lastPlayedLang: data.lastPlayedLang || null,
    lastPlayedLevel: data.lastPlayedLevel || null,
  };
}

export async function saveStudyProfileCloud(uid, profile) {
  if (!uid || !profile?.id || !db) return;
  await setDoc(
    doc(db, "users", uid, "studyProfiles", profile.id),
    {
      id: profile.id,
      langPair: profile.langPair,
      label: profile.label,
      createdAt: profile.createdAt || Date.now(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveActiveProfileMeta(uid, profileId) {
  if (!uid || !profileId || !db) return;
  await setDoc(
    doc(db, "users", uid, "meta", "settings"),
    { activeStudyProfileId: profileId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function fetchActiveProfileMeta(uid) {
  if (!uid || !db) return null;
  const snap = await getDoc(doc(db, "users", uid, "meta", "settings"));
  if (!snap.exists()) return null;
  return snap.data()?.activeStudyProfileId || null;
}

/**
 * İlk giriş / eski hesap: en az bir dil profili oluştur.
 */
export async function ensureCloudStudyProfiles(uid, { langPair, label } = {}) {
  if (!uid || !db) return [];
  let profiles = await fetchStudyProfiles(uid);
  if (profiles.length === 0) {
    const profile = buildStudyProfile({
      langPair: langPair || "en-tr",
      label: label || "İngilizce",
    });
    await saveStudyProfileCloud(uid, profile);
    await saveActiveProfileMeta(uid, profile.id);
    // Mevcut global stats → bu profile taşı (migration)
    const globalSnap = await getDoc(doc(db, "users", uid, "stats", "global"));
    if (globalSnap.exists()) {
      const g = globalSnap.data() || {};
      await setDoc(
        doc(db, "users", uid, "profileStats", profile.id),
        {
          total_score: Number(g.total_score) || 0,
          total_xp: Number(g.total_xp) || 0,
          gems: Number(g.gems) || 0,
          level: Number(g.level) || 1,
          game_breakdown: g.game_breakdown || {},
          lastPlayedLang: null,
          lastPlayedLevel: null,
          migratedFromGlobal: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    profiles = [profile];
  }
  return profiles;
}
