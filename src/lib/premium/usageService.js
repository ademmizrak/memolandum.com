import { doc, getDoc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Üye çeviri kotası — Firestore’da; localStorage sıfırlanarak bypass edilemez.
 * Yazma kuralı: yalnızca artış (rules).
 */
export async function fetchCloudTranslationCount(uid) {
  if (!uid || !db) return null;
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid, "billing", "usage"));
    if (!snap.exists()) return 0;
    return Number(snap.data()?.translationCount) || 0;
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("offline") || msg.includes("could not reach")) {
      return null;
    }
    console.warn("fetchCloudTranslationCount:", msg || e);
    return null;
  }
}

export async function incrementCloudTranslationCount(uid) {
  if (!uid || !db) return null;
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;
  const ref = doc(db, "users", uid, "billing", "usage");
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        translationCount: 1,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      return 1;
    }
    await setDoc(
      ref,
      {
        translationCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return (Number(snap.data()?.translationCount) || 0) + 1;
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("offline") || msg.includes("could not reach")) {
      return null;
    }
    console.warn("incrementCloudTranslationCount:", msg || e);
    return null;
  }
}
