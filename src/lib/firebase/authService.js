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
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, googleProvider, cloudFuncs } from "./config";
import {
  useMemolandumStore,
  clearMemolandumPersistedStorage,
} from "../../store/useMemolandumStore";
import { resetRevenueCatSession } from "../premium/revenueCat";
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

let googleAuthInitialized = false;

const initGoogleAuth = async () => {
  if (googleAuthInitialized) return;
  try {
    const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
    // Web OAuth client (type 3) — Android/iOS native Google Sign-In serverClientId
    const webClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "539033091302-qu7mf8412emdeaihhemt1qku4fvuai3n.apps.googleusercontent.com";
    await GoogleAuth.initialize({
      clientId: webClientId,
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
    googleAuthInitialized = true;
  } catch (e) {
    console.warn("Google Auth Native Initialization failed:", e?.message || e);
  }
};

export const signInWithGoogle = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth yapılandırılmadı.");
    }

    const { Capacitor } = await import("@capacitor/core");

    if (Capacitor.isNativePlatform()) {
      await initGoogleAuth();
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      const user = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(user.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      await syncUserProgress(result.user);
      return result.user;
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
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // E-posta doğrulama linkini güvenli şekilde gönder (ağ aksamalarında kayıt iptal olmasın)
    try {
      await sendVerificationEmail(result.user);
    } catch (verifyErr) {
      console.warn("Verification email dispatch warning:", verifyErr);
    }

    try {
      await syncUserProgress(result.user);
    } catch (syncErr) {
      console.warn("User progress sync warning:", syncErr);
    }

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
    const batch = writeBatch(db);
    batch.set(doc(db, "usernames", lowerUsername), {
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
    batch.set(
      doc(db, "users", user.uid),
      {
        displayName: username,
        username: lowerUsername,
        email: user.email || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      doc(db, "users", user.uid, "stats", "global"),
      { displayName: username },
      { merge: true }
    );
    await batch.commit();

    await updateProfile(user, { displayName: username });

    const store = useMemolandumStore.getState();
    store.setAuthUser({ ...user, displayName: username });
    await logAccountSecurityEvent(user.uid, "username_set", { username: lowerUsername });

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
    const batch = writeBatch(db);
    batch.set(doc(db, "usernames", lowerNewUsername), {
      uid: user.uid,
      updatedAt: serverTimestamp(),
    });
    if (oldUsername) {
      batch.delete(doc(db, "usernames", oldUsername.toLowerCase()));
    }
    batch.set(
      doc(db, "users", user.uid),
      {
        displayName: newUsername,
        username: lowerNewUsername,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      doc(db, "users", user.uid, "stats", "global"),
      { displayName: newUsername },
      { merge: true }
    );
    await batch.commit();

    await updateProfile(user, { displayName: newUsername });

    const store = useMemolandumStore.getState();
    store.setAuthUser({ ...user, displayName: newUsername });
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
    const result = await signInWithEmailAndPassword(auth, email, password);
    try {
      await syncUserProgress(result.user);
      await logAccountSecurityEvent(result.user.uid, "login_email");
    } catch (syncErr) {
      console.warn("User progress sync warning on login:", syncErr);
    }
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
 * Privacy Policy / Play Store — hesabı ve bulut verisini kalıcı siler.
 * Önce yeniden kimlik doğrulama (5 dk kuralı), sonra Cloud Function (Admin).
 * @param {{ password?: string }} [opts] — e-posta/şifre hesapları için zorunlu
 */
export const deleteUserAccount = async (opts = {}) => {
  const user = auth?.currentUser;
  if (!user) throw new Error("Oturum bulunamadı.");
  if (!cloudFuncs) throw new Error("Cloud Functions yapılandırılmadı.");

  const providers = (user.providerData || []).map((p) => p.providerId);
  const isGoogle = providers.includes("google.com");
  const isPassword = providers.includes("password");

  try {
    if (isGoogle) {
      await reauthenticateWithPopup(user, googleProvider);
    } else if (isPassword) {
      if (!opts.password || !user.email) {
        const err = new Error("password-required");
        err.code = "password-required";
        throw err;
      }
      const cred = EmailAuthProvider.credential(user.email, opts.password);
      await reauthenticateWithCredential(user, cred);
    } else {
      // Diğer provider: Google popup ile dene veya şifre yoksa hata
      if (googleProvider) {
        await reauthenticateWithPopup(user, googleProvider);
      } else {
        throw new Error("Yeniden doğrulama desteklenmiyor. info@memolandum.com");
      }
    }
  } catch (error) {
    if (error?.code === "password-required") throw error;
    console.error("Reauth before delete failed:", error);
    throw error;
  }

  const callDelete = httpsCallable(cloudFuncs, "deleteUserAccount");
  await callDelete({});

  try {
    useMemolandumStore.getState().clearForAccountSwitch?.();
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

    // Profil bilgisini liderlik + users kök dokümanına yaz
    const displayName = user.displayName || store.profile?.displayName || null;
    const photoURL = user.photoURL || store.profile?.photoURL || null;
    const providers = (user.providerData || []).map((p) => p.providerId);
    if (displayName || photoURL) {
      await setDoc(globalStatsRef, {
        ...(displayName ? { displayName } : {}),
        ...(photoURL ? { photoURL } : {}),
      }, { merge: true });
    }
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email || null,
        emailVerified: !!user.emailVerified,
        providers,
        lastSyncedAt: serverTimestamp(),
        ...(displayName ? { displayName } : {}),
        ...(photoURL ? { photoURL } : {}),
      },
      { merge: true }
    );

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

      // --- Veli ve Çocuk Profilleri Senkronizasyonu ---
      const currentStore = useMemolandumStore.getState();
      if (userData.isParentAccount || (Array.isArray(userData.childrenProfiles) && userData.childrenProfiles.length > 0)) {
        useMemolandumStore.setState({
          isParentAccount: !!userData.isParentAccount,
          parentEmailDigest: userData.parentEmailDigest !== false,
          childrenProfiles: userData.childrenProfiles || currentStore.childrenProfiles || [],
          activeChildId: userData.activeChildId || currentStore.activeChildId || (userData.childrenProfiles?.[0]?.id ?? null),
        });
      } else if (currentStore.isParentAccount && currentStore.childrenProfiles?.length > 0) {
        await setDoc(userDocRef, {
          isParentAccount: currentStore.isParentAccount,
          parentEmailDigest: currentStore.parentEmailDigest !== false,
          childrenProfiles: currentStore.childrenProfiles,
          activeChildId: currentStore.activeChildId,
          parentUpdatedAt: serverTimestamp(),
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


