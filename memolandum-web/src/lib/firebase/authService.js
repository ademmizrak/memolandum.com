import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db, googleProvider, syncProgressCall } from "./config";
import { useMemolandumStore } from "../../store/useMemolandumStore";

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
 * Senkronizasyon mantığı (Merge Logic):
 * LocalStorage'da tutulan misafir (Guest) verileri ile Firebase (Cloud) verilerini kıyaslar.
 * Not: httpsCallable kullandığımız için Authorization (Bearer token) arka planda Firebase SDK tarafından otomatik olarak gönderilir.
 */
export const syncUserProgress = async (user) => {
  if (!user) return;

  const store = useMemolandumStore.getState();
  const localXp = store.totalXp;
  // TODO: Add localGems, localLevel when added to store

  try {
    // syncProgress cloud function'ı çağırıyoruz.
    // Fonksiyon, kullanıcının cloud'daki mevcut XP'sini dönecektir (veya güncellenmiş halini).
    const result = await syncProgressCall({
      totalXp: localXp,
      // gems: localGems, vs.
    });

    const cloudData = result.data;

    // Eğer Cloud'daki XP, yereldekinden daha büyükse (veya eşitse), 
    // Cloud verisi LocalStorage'ı (Zustand) ezmelidir.
    // Cloud Function backend tarafında zaten "localXp > cloudXp ise db'yi güncelle, değilse db'dekini dön" 
    // mantığını uyguluyorsa (ki genelde böyledir), gelen güncel veriyi store'a yazıyoruz.
    if (cloudData && cloudData.totalXp !== undefined) {
      if (cloudData.totalXp > localXp) {
        store.setTotalXp(cloudData.totalXp);
      }
    }

  } catch (error) {
    console.error("Progress Sync Error:", error);
  }
};
