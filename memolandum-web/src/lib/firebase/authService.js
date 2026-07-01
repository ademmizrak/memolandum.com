import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./config";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import GlobalStateSync from "./GlobalStateSync";

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Google ile giriş yapanın e-postası zaten onaylıdır (genelde), username vb kontrol edilebilir.
    await syncUserProgress(result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
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
  
  // Ayrıca users koleksiyonuna da kaydedelim ki senkronize kalsın
  try {
    await setDoc(doc(db, 'users', user.uid), { 
      photoURL: avatarUrl 
    }, { merge: true });
  } catch (e) {
    console.error("Firestore user profile update error (photoURL):", e);
  }
  
  return user;
};

/**
 * Senkronizasyon mantığı:
 * LocalStorage'da tutulan misafir (Guest) verilerini giriş yapıldığında Cloud'a yazar.
 */
export const syncUserProgress = async (user) => {
  if (!user) return;

  const store = useMemolandumStore.getState();
  const localStats = store.globalStats;

  try {
    // If the guest user had accumulated any progress, we sync it to their new auth account.
    if (localStats && (localStats.total_score > 0 || localStats.total_xp > 0 || localStats.gems > 0)) {
      // Loop over game breakdown and push individually or push total directly
      const promises = [];
      if (localStats.game_breakdown) {
        for (const [gameId, stats] of Object.entries(localStats.game_breakdown)) {
          if (stats.score > 0 || stats.xp > 0 || stats.gems > 0) {
            promises.push(
              GlobalStateSync.updateProgress(user.uid, gameId, {
                score: stats.score || 0,
                xp: stats.xp || 0,
                gems: stats.gems || 0
              })
            );
          }
        }
      }
      
      await Promise.all(promises);
      
      // Force flush so it's written immediately
      await GlobalStateSync.forceFlush(user.uid);
      
      // After syncing local progress to cloud, clear the local progression offsets
      useMemolandumStore.setState({
         globalStats: {
            total_score: 0,
            total_xp: 0,
            gems: 0,
            level: 1,
            game_breakdown: {}
         }
      });
    }

    // --- LEGACY MIGRATION ---
    // If the user has old 'totalXp' on their users/{uid} document, migrate it to the new system
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.totalXp && userData.totalXp > 0) {
        // Check if the new global stats doc exists
        const globalStatsRef = doc(db, 'users', user.uid, 'stats', 'global');
        const globalSnap = await getDoc(globalStatsRef);
        
        // If they don't have the new stats doc yet, migrate the old XP
        if (!globalSnap.exists() || (globalSnap.data().total_xp === 0 && globalSnap.data().total_score === 0)) {
          // In the old system, totalXp was just the score. We'll map it to total_score and total_xp
          await GlobalStateSync.updateProgress(user.uid, 'legacy_migration', {
            score: userData.totalXp * 10, // Assuming score is roughly 10x XP
            xp: userData.totalXp,
            gems: 0
          });
          await GlobalStateSync.forceFlush(user.uid);
          console.log("🔥 Legacy XP migrated successfully!");
        }
      }
    }

  } catch (error) {
    console.error("Progress Sync Error:", error);
  }
};
