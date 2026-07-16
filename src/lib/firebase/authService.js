import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, writeBatch } from "firebase/firestore";
import { auth, db, googleProvider } from "./config";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import GlobalStateSync from "./GlobalStateSync";

const REDIRECT_FLAG = "mm_auth_redirect";
const OPEN_MODAL_FLAG = "mm_auth_open_modal";

/** Mobil / iOS / PWA: popup sıkça kapanır veya auth tamamlanmaz */
export function shouldUseGoogleRedirect() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator.standalone) return true;
  } catch {
    /* ignore */
  }
  // Dar ekran: masaüstü gibi davranan telefonlar
  if (window.innerWidth > 0 && window.innerWidth < 768) return true;
  return false;
}

export const signInWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      throw new Error("Firebase Auth yapılandırılmadı.");
    }

    if (shouldUseGoogleRedirect()) {
      try {
        sessionStorage.setItem(REDIRECT_FLAG, "google");
        sessionStorage.setItem(
          "mm_auth_return",
          `${window.location.pathname}${window.location.search}` || "/"
        );
      } catch {
        /* ignore */
      }
      await signInWithRedirect(auth, googleProvider);
      return null; // sayfa Google'a yönlenir
    }

    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProgress(result.user);
    return result.user;
  } catch (error) {
    // Popup engellendiyse mobilde redirect'e düş
    if (
      error?.code === "auth/popup-blocked" ||
      error?.code === "auth/popup-closed-by-user" ||
      error?.code === "auth/cancelled-popup-request"
    ) {
      try {
        sessionStorage.setItem(REDIRECT_FLAG, "google");
      } catch {
        /* ignore */
      }
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

/**
 * Uygulama açılışında bir kez çağır — redirect dönüşünü tamamlar.
 */
export const completeGoogleRedirectIfAny = async () => {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    try {
      sessionStorage.removeItem(REDIRECT_FLAG);
    } catch {
      /* ignore */
    }
    if (result?.user) {
      await syncUserProgress(result.user);
      if (!result.user.displayName) {
        try {
          sessionStorage.setItem(OPEN_MODAL_FLAG, "username");
        } catch {
          /* ignore */
        }
      }
      return result.user;
    }
    return null;
  } catch (error) {
    console.warn("Google redirect result:", error?.code || error?.message || error);
    try {
      sessionStorage.removeItem(REDIRECT_FLAG);
    } catch {
      /* ignore */
    }
    throw error;
  }
};

export const peekAuthOpenModal = () => {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(OPEN_MODAL_FLAG);
    if (v) sessionStorage.removeItem(OPEN_MODAL_FLAG);
    return v;
  } catch {
    return null;
  }
};

export const isGoogleRedirectPending = () => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(REDIRECT_FLAG) === "google";
  } catch {
    return false;
  }
};

export const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // E-posta doğrulama linki gönder ve siteye geri dönmesi için ayar ekle
    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    };
    await sendEmailVerification(result.user, actionCodeSettings);
    await syncUserProgress(result.user);
    return result.user;
  } catch (error) {
    console.error("Email Registration Error:", error);
    throw error;
  }
};

export const checkUsernameAvailability = async (username) => {
  if (!username || username.trim().length < 3) return false;
  try {
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const docSnap = await getDoc(usernameRef);
    return !docSnap.exists();
  } catch (error) {
    console.error("Check Username Error:", error);
    return false;
  }
};

export const setUsername = async (user, username) => {
  if (!user || !username) throw new Error("Invalid parameters");
  
  const lowerUsername = username.toLowerCase();
  const isAvailable = await checkUsernameAvailability(lowerUsername);
  
  if (!isAvailable) {
    throw new Error("Kullanıcı adı alınmış.");
  }
  
  try {
    // 1. usernames koleksiyonuna ayır (Benzersizliği sağlamak için)
    await setDoc(doc(db, 'usernames', lowerUsername), { uid: user.uid });
    
    // 2. Firebase Auth Profile güncelle
    await updateProfile(user, { displayName: username });
    
    // 3. users koleksiyonuna username yaz (Eğer users/{uid} dökümanı varsa)
    await setDoc(doc(db, 'users', user.uid), { 
      displayName: username,
      username: lowerUsername 
    }, { merge: true });

    // Store update (trigger re-render)
    const store = useMemolandumStore.getState();
    store.setAuthUser({ ...user, displayName: username });

    return true;
  } catch (error) {
    console.error("Set Username Error:", error);
    throw error;
  }
};

export const changeUsername = async (user, oldUsername, newUsername) => {
  if (!user || !newUsername) throw new Error("Gerekli parametreler eksik.");
  
  const lowerNewUsername = newUsername.toLowerCase();
  
  if (oldUsername && oldUsername.toLowerCase() === lowerNewUsername) {
    return true;
  }
  
  const isAvailable = await checkUsernameAvailability(lowerNewUsername);
  if (!isAvailable) {
    throw new Error("Bu kullanıcı adı alınmış.");
  }
  
  try {
    // 1. Yeni username dökümanını oluştur
    await setDoc(doc(db, 'usernames', lowerNewUsername), { uid: user.uid });
    
    // 2. Eski username dökümanını sil
    if (oldUsername) {
      await deleteDoc(doc(db, 'usernames', oldUsername.toLowerCase()));
    }
    
    // 3. Auth Profile güncelle
    await updateProfile(user, { displayName: newUsername });
    
    // 4. users koleksiyonunu güncelle
    await setDoc(doc(db, 'users', user.uid), { 
      displayName: newUsername,
      username: lowerNewUsername 
    }, { merge: true });

    // 5. Liderlik tablosunda görünen stats/global adını da güncelle
    await setDoc(doc(db, 'users', user.uid, 'stats', 'global'), {
      displayName: newUsername
    }, { merge: true });

    // State'i güncelle
    const store = useMemolandumStore.getState();
    store.setAuthUser({ ...user, displayName: newUsername });

    return true;
  } catch (error) {
    console.error("Change Username Error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserProgress(result.user);
    return result.user;
  } catch (error) {
    console.error("Email Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};

export const updateUserAvatarInFirebase = async (avatarUrl) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");
  
  await updateProfile(user, { photoURL: avatarUrl });
  
  // Ayrıca users + liderlik stats dokümanına kaydet
  try {
    await setDoc(doc(db, 'users', user.uid), { 
      photoURL: avatarUrl 
    }, { merge: true });
    await setDoc(doc(db, 'users', user.uid, 'stats', 'global'), {
      photoURL: avatarUrl
    }, { merge: true });
  } catch (e) {
    console.error("Firestore user profile update error (photoURL):", e);
  }
  
  return user;
};

/**
 * Misafir (localStorage) ilerlemesini buluta birleştirir.
 * ÖNEMLİ: Tam tutarı tekrar yazmaz; yalnızca cloud'dan yüksek olan farkı (delta) ekler.
 * Böylece sayfa yenileme / yeniden giriş skorları ikiye katlamaz.
 */
export const syncUserProgress = async (user) => {
  if (!user) return;

  const store = useMemolandumStore.getState();
  const localStats = store.globalStats;
  const localVault = store.vocabularyVault;
  const shouldMergeGuest = !!store.guestProgressPending;

  try {
    const globalStatsRef = doc(db, 'users', user.uid, 'stats', 'global');
    const globalSnap = await getDoc(globalStatsRef);
    const cloud = globalSnap.exists()
      ? globalSnap.data()
      : { total_score: 0, total_xp: 0, gems: 0, game_breakdown: {} };

    // Yalnızca misafirken oynanan ve henüz senkronlanmamış ilerlemeyi birleştir.
    // Sayfa yenileme / yeniden girişte şişmiş localStorage değerlerini cloud'a basmaz.
    if (shouldMergeGuest && localStats) {
      const localBreakdown = localStats.game_breakdown || {};
      const cloudBreakdown = cloud.game_breakdown || {};
      const gameIds = new Set(Object.keys(localBreakdown));

      let pushedDelta = false;

      for (const gameId of gameIds) {
        const localG = localBreakdown[gameId] || {};
        const cloudG = cloudBreakdown[gameId] || {};
        const dScore = Math.max(0, (Number(localG.score) || 0) - (Number(cloudG.score) || 0));
        const dXp = Math.max(0, (Number(localG.xp) || 0) - (Number(cloudG.xp) || 0));
        const dGems = Math.max(0, (Number(localG.gems) || 0) - (Number(cloudG.gems) || 0));

        if (dScore > 0 || dXp > 0 || dGems > 0) {
          pushedDelta = true;
          await GlobalStateSync.updateProgress(user.uid, gameId, {
            score: dScore,
            xp: dXp,
            gems: dGems
          });
        }
      }

      if (!pushedDelta) {
        const scoreDelta = Math.max(0, (Number(localStats.total_score) || 0) - (Number(cloud.total_score) || 0));
        const xpDelta = Math.max(0, (Number(localStats.total_xp) || 0) - (Number(cloud.total_xp) || 0));
        const gemsDelta = Math.max(0, (Number(localStats.gems) || 0) - (Number(cloud.gems) || 0));

        if (scoreDelta > 0 || xpDelta > 0 || gemsDelta > 0) {
          await GlobalStateSync.updateProgress(user.uid, 'guest_merge', {
            score: scoreDelta,
            xp: xpDelta,
            gems: gemsDelta
          });
          pushedDelta = true;
        }
      }

      if (pushedDelta) {
        await GlobalStateSync.forceFlush(user.uid);
      }

      useMemolandumStore.getState().clearGuestProgressPending();
    }

    // Profil bilgisini liderlik dokümanına yaz (sıralama adları için)
    const displayName = user.displayName || store.profile?.displayName || null;
    const photoURL = user.photoURL || store.profile?.photoURL || null;
    if (displayName || photoURL) {
      await setDoc(globalStatsRef, {
        ...(displayName ? { displayName } : {}),
        ...(photoURL ? { photoURL } : {}),
      }, { merge: true });
    }

    // Sync guest vocabulary vault if any exists
    if (localVault && Object.keys(localVault).length > 0) {
      await syncVaultToCloud(user.uid, localVault);
    }

    // --- LEGACY MIGRATION ---
    // If the user has old 'totalXp' on their users/{uid} document, migrate it to the new system
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.totalXp && userData.totalXp > 0) {
        const latestSnap = await getDoc(globalStatsRef);
        const latest = latestSnap.exists() ? latestSnap.data() : {};

        // If they don't have meaningful new stats yet, migrate the old XP once
        if (!latestSnap.exists() || ((latest.total_xp || 0) === 0 && (latest.total_score || 0) === 0)) {
          await GlobalStateSync.updateProgress(user.uid, 'legacy_migration', {
            score: userData.totalXp * 10,
            xp: userData.totalXp,
            gems: 0
          });
          await GlobalStateSync.forceFlush(user.uid);
          // Prevent re-migration loops
          await setDoc(userDocRef, { totalXp: 0, legacyXpMigrated: true }, { merge: true });
          console.log("🔥 Legacy XP migrated successfully!");
        }
      }
    }

  } catch (error) {
    console.error("Progress Sync Error:", error);
  }
};

export const saveWordToCloud = async (uid, wordId, wordData) => {
  if (!uid || !wordId) return;
  try {
    const docRef = doc(db, 'users', uid, 'vault', wordId);
    await setDoc(docRef, wordData, { merge: true });
  } catch (e) {
    console.error("Error saving word to cloud:", e);
  }
};

export const syncVaultToCloud = async (uid, localVault) => {
  if (!uid || !localVault || Object.keys(localVault).length === 0) return;
  try {
    const batch = writeBatch(db);
    let count = 0;
    
    for (const [wordId, wordData] of Object.entries(localVault)) {
      const docRef = doc(db, 'users', uid, 'vault', wordId);
      batch.set(docRef, wordData, { merge: true });
      count++;
      
      if (count >= 400) {
        await batch.commit();
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
    console.log("🔥 Successfully synced local guest vocabulary vault to Firestore!");
  } catch (e) {
    console.error("Error syncing local vault to cloud:", e);
  }
};
