import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { isNativeApp, IS_NATIVE_APP } from "./platform";

export { IS_NATIVE_APP };

const DEFAULT_WEB_CLIENT_ID =
  "539033091302-qu7mf8412emdeaihhemt1qku4fvuai3n.apps.googleusercontent.com";

let googleAuthInitialized = false;

export function isNativePlatform() {
  return isNativeApp();
}

export async function initNativeGoogleAuth() {
  if (googleAuthInitialized) return;
  try {
    const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
    const webClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_WEB_CLIENT_ID;
    await GoogleAuth.initialize({
      clientId: webClientId,
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
    googleAuthInitialized = true;
  } catch (e) {
    console.warn("Google Auth Native Initialization warning:", e?.message || e);
  }
}

/**
 * Triggers the native Android/iOS Google Sign-In dialog and returns the Google ID token.
 */
export async function getNativeGoogleIdToken() {
  await initNativeGoogleAuth();
  const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
  const googleUser = await GoogleAuth.signIn();
  const idToken =
    googleUser?.authentication?.idToken || googleUser?.idToken || null;
  if (!idToken) {
    const err = new Error("Google kimlik doğrulama jetonu (idToken) alınamadı.");
    err.code = "auth/missing-id-token";
    throw err;
  }
  return idToken;
}

/**
 * Detects embedded in-app WebViews (Instagram, Facebook, TikTok, LinkedIn, etc.)
 * where Google OAuth 2.0 blocks requests with 403 disallowed_useragent.
 */
export function isInAppWebView() {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform() || isNativeApp()) return false;
  const ua = navigator.userAgent || "";
  return /(Instagram|FBAN|FBAV|FB_IAB|BytedanceWebview|TikTok|Musical_ly|Line\/|LinkedInApp|Snapchat)/i.test(
    ua
  );
}

/**
 * Unified Google Sign-In helper for Capacitor Native (Android/iOS) and Web:
 * - Native (`Capacitor.isNativePlatform() === true`): Native Google Sign-In -> `signInWithCredential`
 * - Web (`Capacitor.isNativePlatform() === false`): Standard `signInWithPopup` (with redirect fallback)
 *
 * Supports both calling conventions:
 *   platformGoogleSignIn(auth, googleProvider, { shouldUseRedirect, onBeforeRedirect })
 *   platformGoogleSignIn({ auth, googleProvider, shouldUseRedirect, onBeforeRedirect })
 */
export async function platformGoogleSignIn(
  authOrOptions,
  googleProviderArg,
  optionsArg = {}
) {
  let auth = authOrOptions;
  let googleProvider = googleProviderArg;
  let opts = optionsArg || {};

  // Support object-style invocation: platformGoogleSignIn({ auth, googleProvider, ... })
  if (
    authOrOptions &&
    typeof authOrOptions === "object" &&
    ("auth" in authOrOptions || "googleProvider" in authOrOptions) &&
    !googleProviderArg
  ) {
    auth = authOrOptions.auth;
    googleProvider = authOrOptions.googleProvider;
    opts = authOrOptions;
  }

  if (!auth) {
    throw new Error("Firebase Auth yapılandırılmadı.");
  }

  const provider = googleProvider || new GoogleAuthProvider();

  if (Capacitor.isNativePlatform() || isNativeApp()) {
    const idToken = await getNativeGoogleIdToken();
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result?.user || null;
  }

  if (isInAppWebView()) {
    const err = new Error(
      "Uygulama içi tarayıcılar (Instagram, Facebook, TikTok vb.) güvenlik nedeniyle Google girişini engeller. Lütfen sağ üst menüden 'Tarayıcıda Aç' (Chrome / Safari) seçeneğini kullanın veya E-posta/Şifre ile giriş yapın."
    );
    err.code = "auth/in-app-browser-unsupported";
    throw err;
  }

  const shouldRedirect =
    typeof opts.shouldUseRedirect === "function"
      ? opts.shouldUseRedirect()
      : !!opts.shouldUseRedirect;
  const onBeforeRedirect = opts.onBeforeRedirect;

  const triggerRedirect = async () => {
    if (typeof onBeforeRedirect === "function") {
      try {
        onBeforeRedirect();
      } catch {
        /* ignore */
      }
    }
    await signInWithRedirect(auth, provider);
    return null;
  };

  if (shouldRedirect) {
    return await triggerRedirect();
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return result?.user || null;
  } catch (popupErr) {
    const code = popupErr?.code || "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment" ||
      code === "auth/web-storage-unsupported"
    ) {
      console.warn("Popup blocked or unsupported, falling back to redirect:", code);
      return await triggerRedirect();
    }
    throw popupErr;
  }
}

/**
 * Unified Google Re-authentication for sensitive actions (e.g. Account Deletion):
 * - Native: Uses native Google Sign-In bridge + `reauthenticateWithCredential`
 * - Web: Uses `reauthenticateWithPopup`
 */
export async function platformGoogleReauthenticate(user, googleProvider) {
  if (!user) throw new Error("Oturum bulunamadı.");

  if (Capacitor.isNativePlatform() || isNativeApp()) {
    const idToken = await getNativeGoogleIdToken();
    const credential = GoogleAuthProvider.credential(idToken);
    return await reauthenticateWithCredential(user, credential);
  }

  return await reauthenticateWithPopup(user, googleProvider);
}

/**
 * Signs out of the native Google Auth bridge if running on Android/iOS.
 */
export async function signOutNativeGoogleIfAny() {
  if (!Capacitor.isNativePlatform() && !isNativeApp()) return;
  try {
    await initNativeGoogleAuth();
    const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
    await GoogleAuth.signOut();
  } catch {
    /* ignore if not signed in via Google */
  }
}
