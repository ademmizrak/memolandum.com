import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updatePassword,
  updateProfile,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, googleProvider, cloudFuncs } from "./config";
import {
  useMemolandumStore,
  clearMemolandumPersistedStorage,
} from "../../store/useMemolandumStore";
import { resetRevenueCatSession } from "../premium/revenueCat";
import GlobalStateSync from "./GlobalStateSync";
import {
  isNativePlatform as checkNativePlatform,
  platformGoogleSignIn,
  platformGoogleReauthenticate,
  signOutNativeGoogleIfAny,
} from "../../utils/platformAuth";

const REDIRECT_FLAG = "mm_auth_redirect";
const OPEN_MODAL_FLAG = "mm_auth_open_modal";

export const isNativePlatform = () => checkNativePlatform();

/**
 * Yalnızca ana ekrana eklenmiş PWA (standalone) modunda doğrudan redirect kullan.
 * Standart mobil tarayıcılarda (iOS Safari, Android Chrome vb.) önce signInWithPopup
 * denenir; açılır pencere engellenirse platformGoogleSignIn otomatik olarak redirect'e düşer.
 * Bu sayede mobil tarayıcılardaki 3. parti çerez / ITP (Storage Partitioning) engeli aşılır.
 */
export function shouldUseGoogleRedirect() {
  if (typeof window === "undefined") return false;
  if (isNativePlatform()) return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator.standalone === true) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export const requestAuthModalOpen = (view = "username") => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(OPEN_MODAL_FLAG, view);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent("mm:open-auth-modal", { detail: { view } })
    );
  } catch {
    /* ignore */
  }
};

export const signInWithGoogle = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth yapılandırılmadı.");
    }

    const user = await platformGoogleSignIn(auth, googleProvider, {
      shouldUseRedirect: shouldUseGoogleRedirect(),
      onBeforeRedirect: () => {
        try {
          sessionStorage.setItem(REDIRECT_FLAG, "google");
          sessionStorage.setItem(
            "mm_auth_return",
            `${window.location.pathname}${window.location.search}` || "/"
          );
        } catch {
          /* ignore */
        }
      },
    });

    if (user) {
      useMemolandumStore.getState().setAuthUser?.(user);
      await syncUserProgress(user).catch((e) => {
        console.warn("Background sync warning after Google login:", e);
      });
      return user;
    }

    return null;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    if (!auth) throw new Error("Firebase Auth yapılandırılmadı.");

    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Apple ile Giriş yalnızca mobil uygulamada desteklenir.");
    }

    const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
    const result = await SignInWithApple.authorize({
      clientId: "com.memolandum.app",
      redirectURI: "https://memolandum-33dc4.firebaseapp.com/__/auth/handler",
      scopes: "email name",
    });

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: result.response.identityToken,
    });

    const authResult = await signInWithCredential(auth, credential);
    useMemolandumStore.getState().setAuthUser?.(authResult.user);
    await syncUserProgress(authResult.user);
    return authResult.user;
  } catch (error) {
    console.error("Apple Sign-In Error:", error);
    throw error;
  }
};

/**
 * Uygulama açılışında bir kez çağır — redirect dönüşünü tamamlar.
 */
export const completeGoogleRedirectIfAny = async () => {
  if (!auth) return null;
  const hadPendingFlag = isGoogleRedirectPending();
  try {
    const result = await getRedirectResult(auth);
    try {
      sessionStorage.removeItem(REDIRECT_FLAG);
    } catch {
      /* ignore */
    }
    const resolvedUser = result?.user || (hadPendingFlag ? auth.currentUser : null);
    if (resolvedUser) {
      useMemolandumStore.getState().setAuthUser?.(resolvedUser);
      await syncUserProgress(resolvedUser);
      const currentProfile = useMemolandumStore.getState().profile;
      if (!currentProfile?.username) {
        requestAuthModalOpen("username");
      }
      return resolvedUser;
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

/**
 * Firebase e-posta linkleri önce authDomain üzerindeki /__/auth/action handler’ına gider;
 * işlem bitince bu continue URL’ye yönlendirilir. Domain Authorized Domains listesinde olmalı.
 */
export const getEmailActionCodeSettings = (flow = "verifyEmail") => {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://memolandum.com";
  const safeFlow = String(flow || "verifyEmail").replace(/[^a-zA-Z]/g, "") || "verifyEmail";
  return {
    url: `${origin}/auth/action?flow=${safeFlow}`,
    handleCodeInApp: false,
  };
};

export const sendVerificationEmail = async (user = auth?.currentUser) => {
  if (!user) throw new Error("Oturum bulunamadı.");
  await sendEmailVerification(user, getEmailActionCodeSettings("verifyEmail"));
  try {
    await logAccountSecurityEvent(user.uid, "verification_email_sent");
  } catch {
    /* ignore */
  }
  return true;
};

export const registerWithEmail = async (email, password) => {
  try {
    if (!auth) {
      const err = new Error("Firebase Auth yapılandırılmadı.");
      err.code = "auth/not-configured";
      throw err;
    }
    const trimmedEmail = String(email || "").trim();
    const result = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    useMemolandumStore.getState().setAuthUser?.(result.user);
    
    // E-posta doğrulama linkini güvenli ve arka planda gönder
    sendVerificationEmail(result.user).catch((verifyErr) => {
      console.warn("Verification email dispatch warning:", verifyErr);
    });

    syncUserProgress(result.user).catch((syncErr) => {
      console.warn("User progress sync warning:", syncErr);
    });

    return result.user;
  } catch (error) {
    console.error("Email Registration Error:", error);
    throw error;
  }
};

const normalizeUsernameKey = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/\u0307/g, "")
    .replace(/[\/\\]+/g, "")
    .replace(/^\.+|\.+$/g, "");
};

export const checkUsernameAvailability = async (username) => {
  const key = normalizeUsernameKey(username);
  if (!key || key.length < 3) return false;
  try {
    const usernameRef = doc(db, "usernames", key);
    const docSnap = await getDoc(usernameRef);
    if (!docSnap.exists()) return true;
    const currentUid = auth?.currentUser?.uid;
    if (currentUid && docSnap.data()?.uid === currentUid) return true;
    return false;
  } catch (error) {
    console.error("Check Username Error:", error);
    return false;
  }
};

export const setUsername = async (user, username, avatarUrl = null) => {
  const cleanDisplay = String(username || "").trim().replace(/\s+/g, " ");
  const lowerUsername = normalizeUsernameKey(cleanDisplay);
  if (!user || lowerUsername.length < 3) {
    const err = new Error("Kullanıcı adı en az 3 karakter olmalıdır.");
    err.code = "username/too-short";
    throw err;
  }

  const usernameRef = doc(db, "usernames", lowerUsername);
  const existingSnap = await getDoc(usernameRef);
  if (existingSnap.exists() && existingSnap.data()?.uid !== user.uid) {
    const err = new Error("Kullanıcı adı alınmış.");
    err.code = "username/already-in-use";
    throw err;
  }

  try {
    const batch = writeBatch(db);
    if (!existingSnap.exists()) {
      batch.set(usernameRef, {
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    }
    batch.set(
      doc(db, "users", user.uid),
      {
        displayName: cleanDisplay,
        username: lowerUsername,
        email: user.email || null,
        updatedAt: serverTimestamp(),
        ...(avatarUrl ? { photoURL: avatarUrl } : {}),
      },
      { merge: true }
    );
    batch.set(
      doc(db, "users", user.uid, "stats", "global"),
      {
        displayName: cleanDisplay,
        ...(avatarUrl ? { photoURL: avatarUrl } : {}),
      },
      { merge: true }
    );
    await batch.commit();

    const profileUpdates = { displayName: cleanDisplay };
    if (avatarUrl) profileUpdates.photoURL = avatarUrl;
    await updateProfile(user, profileUpdates);

    const store = useMemolandumStore.getState();
    store.setAuthUser({
      ...user,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
      displayName: cleanDisplay,
      username: lowerUsername,
      photoURL: avatarUrl || user.photoURL || store.profile?.photoURL || null,
    });
    await logAccountSecurityEvent(user.uid, "username_set", { username: lowerUsername });

    return true;
  } catch (error) {
    console.error("Set Username Error:", error);
    throw error;
  }
};

export const changeUsername = async (user, oldUsername, newUsername) => {
  const cleanDisplay = String(newUsername || "").trim().replace(/\s+/g, " ");
  const lowerNewUsername = normalizeUsernameKey(cleanDisplay);
  if (!user || lowerNewUsername.length < 3) {
    const err = new Error("Kullanıcı adı en az 3 karakter olmalıdır.");
    err.code = "username/too-short";
    throw err;
  }

  const lowerOldUsername = normalizeUsernameKey(
    oldUsername || useMemolandumStore.getState().profile?.username || ""
  );

  if (lowerOldUsername && lowerOldUsername === lowerNewUsername) {
    return true;
  }

  const newUsernameRef = doc(db, "usernames", lowerNewUsername);
  const newSnap = await getDoc(newUsernameRef);
  if (newSnap.exists() && newSnap.data()?.uid !== user.uid) {
    const err = new Error("Bu kullanıcı adı alınmış.");
    err.code = "username/already-in-use";
    throw err;
  }

  try {
    const batch = writeBatch(db);
    if (!newSnap.exists()) {
      batch.set(newUsernameRef, {
        uid: user.uid,
        updatedAt: serverTimestamp(),
      });
    }
    if (lowerOldUsername && lowerOldUsername !== lowerNewUsername) {
      try {
        const oldRef = doc(db, "usernames", lowerOldUsername);
        const oldSnap = await getDoc(oldRef);
        if (oldSnap.exists() && oldSnap.data()?.uid === user.uid) {
          batch.delete(oldRef);
        }
      } catch {
        /* ignore if old username doc was not in usernames collection */
      }
    }
    batch.set(
      doc(db, "users", user.uid),
      {
        displayName: cleanDisplay,
        username: lowerNewUsername,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      doc(db, "users", user.uid, "stats", "global"),
      { displayName: cleanDisplay },
      { merge: true }
    );
    await batch.commit();

    await updateProfile(user, { displayName: cleanDisplay });

    const store = useMemolandumStore.getState();
    store.setAuthUser({
      ...user,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
      displayName: cleanDisplay,
      username: lowerNewUsername,
      photoURL: store.profile?.photoURL || user.photoURL || null,
    });
    await logAccountSecurityEvent(user.uid, "username_changed", {
      username: lowerNewUsername,
    });

    return true;
  } catch (error) {
    console.error("Change Username Error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    if (!auth) {
      const err = new Error("Firebase Auth yapılandırılmadı.");
      err.code = "auth/not-configured";
      throw err;
    }
    const trimmedEmail = String(email || "").trim();
    const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    useMemolandumStore.getState().setAuthUser?.(result.user);
    await syncUserProgress(result.user).catch((syncErr) => {
      console.warn("User progress sync warning on login:", syncErr);
    });
    logAccountSecurityEvent(result.user.uid, "login_email").catch(() => {});
    return result.user;
  } catch (error) {
    console.error("Email Login Error:", error);
    throw error;
  }
};

/**
 * Giriş yapılmamış kullanıcı — “şifremi unuttum” e-postası.
 * Güvenlik: e-posta yoksa da genel başarı mesajı dönülür (enumeration azaltma).
 */
export const requestPasswordReset = async (email) => {
  const trimmed = String(email || "").trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    const err = new Error("invalid-email");
    err.code = "auth/invalid-email";
    throw err;
  }
  if (!auth) throw new Error("Firebase Auth yapılandırılmadı.");

  try {
    await sendPasswordResetEmail(
      auth,
      trimmed,
      getEmailActionCodeSettings("passwordReset")
    );
  } catch (error) {
    // Enumeration azaltma: user-not-found / invalid-credential için sessiz başarı
    const code = error?.code || "";
    if (
      code !== "auth/user-not-found" &&
      code !== "auth/invalid-email" &&
      code !== "auth/missing-email"
    ) {
      console.error("Password reset email error:", error);
      throw error;
    }
    if (code === "auth/invalid-email" || code === "auth/missing-email") {
      throw error;
    }
  }

  // Oturum açıksa ve e-posta eşleşiyorsa Firestore’a işaret bırak
  try {
    const uid = auth.currentUser?.uid;
    if (uid && auth.currentUser?.email?.toLowerCase() === trimmed) {
      await logAccountSecurityEvent(uid, "password_reset_requested", { email: trimmed });
    }
  } catch {
    /* ignore */
  }

  return true;
};

/**
 * Oturum açıkken mevcut şifre ile yeni şifre (e-posta/şifre hesapları).
 */
export const changeAccountPassword = async (currentPassword, newPassword) => {
  const user = auth?.currentUser;
  if (!user?.email) throw new Error("Oturum bulunamadı.");

  const providers = (user.providerData || []).map((p) => p.providerId);
  if (!providers.includes("password")) {
    const err = new Error("password-provider-missing");
    err.code = "password-provider-missing";
    throw err;
  }

  if (!currentPassword || !newPassword) {
    const err = new Error("missing-fields");
    err.code = "missing-fields";
    throw err;
  }
  if (newPassword.length < 6) {
    const err = new Error("weak-password");
    err.code = "auth/weak-password";
    throw err;
  }
  if (currentPassword === newPassword) {
    const err = new Error("same-password");
    err.code = "same-password";
    throw err;
  }

  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
  await logAccountSecurityEvent(user.uid, "password_changed");
  return true;
};

/**
 * E-posta linkindeki oobCode ile yeni şifre belirleme.
 */
export const completePasswordReset = async (oobCode, newPassword) => {
  if (!auth) throw new Error("Firebase Auth yapılandırılmadı.");
  if (!oobCode || !newPassword) throw new Error("Eksik parametre.");
  if (newPassword.length < 6) {
    const err = new Error("weak-password");
    err.code = "auth/weak-password";
    throw err;
  }

  const email = await verifyPasswordResetCode(auth, oobCode);
  await confirmPasswordReset(auth, oobCode, newPassword);

  // Kod doğrulandıktan sonra kullanıcı henüz oturumda olmayabilir;
  // e-posta bilgisini meta’ya yazamayız. Başarı UI’da yeter.
  return { email };
};

/**
 * Hesap güvenlik olayları — users/{uid}/meta/security
 */
export const logAccountSecurityEvent = async (uid, eventType, extra = {}) => {
  if (!uid || !db || !eventType) return;
  try {
    const ref = doc(db, "users", uid, "meta", "security");
    const entry = {
      type: String(eventType).slice(0, 64),
      at: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(extra)
          .filter(([, v]) => v != null && typeof v !== "object")
          .map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 120) : v])
      ),
    };
    const snap = await getDoc(ref);
    const prev = snap.exists() ? snap.data()?.recentEvents || [] : [];
    const recentEvents = [entry, ...prev].slice(0, 20);

    await setDoc(
      ref,
      {
        lastEventType: entry.type,
        lastEventAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        recentEvents,
        ...(eventType === "password_changed"
          ? { lastPasswordChangedAt: serverTimestamp() }
          : {}),
        ...(eventType === "password_reset_requested"
          ? { lastPasswordResetRequestedAt: serverTimestamp() }
          : {}),
        ...(eventType === "login_email"
          ? { lastEmailLoginAt: serverTimestamp() }
          : {}),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "users", uid),
      {
        securityUpdatedAt: serverTimestamp(),
        ...(eventType === "password_changed"
          ? { passwordUpdatedAt: serverTimestamp() }
          : {}),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("Security event log skipped:", e?.message || e);
  }
};

/** E-posta/şifre provider’ı var mı? */
export const userHasPasswordProvider = (user = auth?.currentUser) => {
  if (!user) return false;
  return (user.providerData || []).some((p) => p.providerId === "password");
};

export const logoutUser = async () => {
  try {
    await signOutNativeGoogleIfAny();
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  } finally {
    const store = useMemolandumStore.getState();
    store.setAuthUser(null);
    if (store.setIsEmailVerified) store.setIsEmailVerified(false);
    store.clearForAccountSwitch?.();
    resetRevenueCatSession();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
      await clearMemolandumPersistedStorage();
    }
  }
};

/**
 * Privacy Policy / Play Store — hesabı, Kelime Kasası'nı, Öğretmen Masası sınıflarını ve bulut verisini kalıcı siler.
 * Önce yeniden kimlik doğrulama (5 dk kuralı), sonra Firestore temizliği, Cloud Function (Admin) ve deleteUser.
 * @param {{ password?: string }} [opts] — e-posta/şifre hesapları için zorunlu
 */
export const deleteUserAccount = async (opts = {}) => {
  const user = auth?.currentUser;
  if (!user) throw new Error("Oturum bulunamadı.");

  const uid = user.uid;
  const providers = (user.providerData || []).map((p) => p.providerId);
  const isGoogle = providers.includes("google.com");
  const isPassword = providers.includes("password");

  try {
    if (isGoogle) {
      await platformGoogleReauthenticate(user, googleProvider);
    } else if (isPassword) {
      if (!opts.password || !user.email) {
        const err = new Error("password-required");
        err.code = "password-required";
        throw err;
      }
      const cred = EmailAuthProvider.credential(user.email, opts.password);
      await reauthenticateWithCredential(user, cred);
    } else {
      if (googleProvider) {
        await platformGoogleReauthenticate(user, googleProvider);
      } else {
        throw new Error("Yeniden doğrulama desteklenmiyor. info@memolandum.com");
      }
    }
  } catch (error) {
    if (error?.code === "password-required") throw error;
    console.error("Reauth before delete failed:", error);
    throw error;
  }

  // Öğretmen Masası (Teacher Desk) sınıflarını temizle
  if (db && uid) {
    try {
      const classesQuery = query(collection(db, "classrooms"), where("teacherUid", "==", uid));
      const classSnaps = await getDocs(classesQuery);
      for (const classDoc of classSnaps.docs) {
        try {
          const studentsSnap = await getDocs(collection(db, "classrooms", classDoc.id, "students"));
          const batch = writeBatch(db);
          studentsSnap.docs.forEach((sDoc) => batch.delete(sDoc.ref));
          batch.delete(classDoc.ref);
          await batch.commit();
        } catch (subErr) {
          console.warn("Classroom cleanup warning:", subErr?.message || subErr);
        }
      }
    } catch (e) {
      console.warn("Teacher Desk cleanup skipped:", e?.message || e);
    }
  }

  // Cloud Function ile tam hesap ve Firestore temizliği + istemci tarafı deleteUser yedeği
  let cloudDeleted = false;
  if (cloudFuncs) {
    try {
      const callDelete = httpsCallable(cloudFuncs, "deleteUserAccount");
      await callDelete({});
      cloudDeleted = true;
    } catch (cloudErr) {
      console.warn("Cloud deleteUserAccount warning, falling back to client deleteUser:", cloudErr);
    }
  }

  if (!cloudDeleted) {
    if (db && uid) {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        const uname = userSnap.exists() ? userSnap.data()?.username : null;
        const vaultSnap = await getDocs(collection(db, "users", uid, "vault"));
        const batch = writeBatch(db);
        vaultSnap.docs.slice(0, 400).forEach((vDoc) => batch.delete(vDoc.ref));
        if (uname) batch.delete(doc(db, "usernames", String(uname).toLowerCase()));
        batch.delete(doc(db, "users", uid, "stats", "global"));
        batch.delete(doc(db, "users", uid, "meta", "security"));
        batch.delete(doc(db, "users", uid));
        await batch.commit();
      } catch (e) {
        console.warn("Client Firestore cleanup warning:", e);
      }
    }
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
  }

  try {
    await signOutNativeGoogleIfAny();
    const store = useMemolandumStore.getState();
    store.setAuthUser(null);
    store.clearForAccountSwitch?.();
    resetRevenueCatSession();
    await clearMemolandumPersistedStorage();
  } catch {
    /* ignore */
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

    // Önce kullanıcının Firestore'daki mevcut profilini (username, displayName, photoURL) oku
    // Böylece yeni cihazdan veya tekrar giriş yapan mevcut üyelerin rumuz ve sanal avatarları ezilmez.
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    const existingUserData = userSnap.exists() ? userSnap.data() : {};

    const resolvedUsername =
      existingUserData.username || store.profile?.username || null;
    const resolvedDisplayName =
      existingUserData.displayName ||
      resolvedUsername ||
      store.profile?.displayName ||
      user.displayName ||
      "Siber Kadet";

    const existingPhoto = existingUserData.photoURL || store.profile?.photoURL || null;
    const isExistingCustomPhoto =
      existingPhoto &&
      !existingPhoto.includes("googleusercontent.com") &&
      !existingPhoto.includes("apple");
    const rawPhotoURL = isExistingCustomPhoto
      ? existingPhoto
      : existingPhoto || user.photoURL || null;

    const providers = (user.providerData || []).map((p) => p.providerId);

    // Gizlilik: Liderlik tablosunda Google/Apple harici profil fotoğraflarını ifşa etme
    const isExternalPhoto =
      rawPhotoURL &&
      (rawPhotoURL.includes("googleusercontent.com") || rawPhotoURL.includes("apple"));
    const safePublicPhotoURL = isExternalPhoto
      ? "https://api.dicebear.com/9.x/bottts/svg?seed=Felix"
      : rawPhotoURL || "https://api.dicebear.com/9.x/bottts/svg?seed=Felix";

    // Store'u Firestore'daki gerçek rumuz ve avatarla hemen senkronla
    useMemolandumStore.getState().setAuthUser?.({
      ...user,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
      displayName: resolvedDisplayName,
      username: resolvedUsername,
      photoURL: isExistingCustomPhoto ? existingPhoto : safePublicPhotoURL,
    });

    await setDoc(
      globalStatsRef,
      {
        displayName: resolvedDisplayName,
        photoURL: safePublicPhotoURL,
      },
      { merge: true }
    );

    await setDoc(
      userDocRef,
      {
        email: user.email || null,
        emailVerified: !!user.emailVerified,
        providers,
        lastSyncedAt: serverTimestamp(),
        ...(resolvedDisplayName ? { displayName: resolvedDisplayName } : {}),
        ...(resolvedUsername ? { username: resolvedUsername } : {}),
        ...(safePublicPhotoURL ? { photoURL: safePublicPhotoURL } : {}),
      },
      { merge: true }
    );

    // Sync guest vocabulary vault if any exists
    if (localVault && Object.keys(localVault).length > 0) {
      await syncVaultToCloud(user.uid, localVault);
    }

    // --- LEGACY MIGRATION ---
    // If the user has old 'totalXp' on their users/{uid} document, migrate it to the new system
    if (userSnap.exists()) {
      const userData = existingUserData;
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

      // --- Veli ve Çocuk Profilleri Senkronizasyonu ---
      const currentStore = useMemolandumStore.getState();
      if (userData.isParentAccount || (Array.isArray(userData.childrenProfiles) && userData.childrenProfiles.length > 0)) {
        useMemolandumStore.setState({
          isParentAccount: !!userData.isParentAccount,
          parentEmailDigest: !!userData.parentEmailDigest,
          childrenProfiles: userData.childrenProfiles || currentStore.childrenProfiles || [],
          activeChildId: userData.activeChildId || currentStore.activeChildId || (userData.childrenProfiles?.[0]?.id ?? null),
          ...(Array.isArray(userData.parentActivityLog) && userData.parentActivityLog.length > 0
            ? { parentActivityLog: userData.parentActivityLog.slice(0, 50) }
            : {}),
        });
      } else if (currentStore.isParentAccount && currentStore.childrenProfiles?.length > 0) {
        await setDoc(userDocRef, {
          isParentAccount: currentStore.isParentAccount,
          parentEmailDigest: !!currentStore.parentEmailDigest,
          childrenProfiles: currentStore.childrenProfiles,
          activeChildId: currentStore.activeChildId,
          parentActivityLog: (currentStore.parentActivityLog || []).slice(0, 50),
          parentUpdatedAt: serverTimestamp(),
        }, { merge: true });
      }

      // --- Sınıf Katılımı (Joined Classroom) Senkronizasyonu ---
      if (userData.joinedClassCode) {
        if (!currentStore.joinedClassroom || currentStore.joinedClassroom.classCode !== userData.joinedClassCode) {
          try {
            const { fetchMyClassroom } = await import("../schools/schoolService");
            const result = await fetchMyClassroom(userData.joinedClassCode);
            if (result?.classroom) {
              const ownSeat = result?.ownSeat || result?.classroom?.students?.[result?.studentId] || null;
              useMemolandumStore.setState({
                joinedClassroom: {
                  ...result.classroom,
                  studentId: result.studentId,
                  ownSeat,
                  studentName: ownSeat?.name || undefined,
                  studentAvatar: ownSeat?.avatar || undefined,
                  joinedAt: Date.now(),
                },
              });
            }
          } catch (classErr) {
            console.warn("Joined classroom cloud fetch warning:", classErr?.message || classErr);
          }
        }
      } else if (currentStore.joinedClassroom?.classCode) {
        await setDoc(userDocRef, {
          joinedClassCode: currentStore.joinedClassroom.classCode,
        }, { merge: true });
      }
    }

  } catch (error) {
    const msg = String(error?.message || "");
    if (msg.includes("offline") || msg.includes("could not reach")) {
      console.warn("Progress sync offline — state preserved locally.");
    } else {
      console.error("Progress Sync Error:", error);
    }
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

export const deleteWordFromCloud = async (uid, wordId) => {
  if (!uid || !wordId) return;
  try {
    const docRef = doc(db, 'users', uid, 'vault', wordId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error("Error deleting word from cloud:", e);
  }
};

/**
 * Veli ve Öğrenci Profillerini Firestore'a senkronize eder
 */
export const syncParentDataToCloud = async (uid, parentData) => {
  if (!uid || !db || !parentData) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...parentData,
      parentUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn("Parent data cloud sync warning:", err?.message || err);
  }
};

/**
 * Çocuğun çalışma aktivitesini veli takip günlüğüne ve Firestore'a işler
 */
export const logParentActivityToCloud = async (uid, activityEntry, childUpdates) => {
  if (!uid || !db) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    const updates = {
      lastChildActivity: {
        ...activityEntry,
        loggedAt: serverTimestamp(),
      },
      ...(childUpdates ? { activeChildLastStudied: childUpdates } : {}),
    };
    await setDoc(userDocRef, updates, { merge: true });
  } catch (err) {
    console.warn("Child activity log cloud warning:", err?.message || err);
  }
};

/**
 * Öğrencinin katıldığı sınıf kodunu Firestore'a kaydeder (tüm cihazlar için kalıcılık)
 */
export const syncStudentClassToCloud = async (uid, classCode) => {
  if (!uid || !db) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      joinedClassCode: classCode || null,
      classUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn("Student class cloud sync warning:", err?.message || err);
  }
};

/**
 * Kullanıcıyı öğretmen olarak işaretler
 */
export const markUserAsTeacher = async (uid) => {
  if (!uid || !db) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      isTeacher: true,
      teacherUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn("Teacher flag sync warning:", err?.message || err);
  }
};


