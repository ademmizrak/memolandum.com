import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Resolves authDomain dynamically: When running on exact canonical "memolandum.com", uses same-origin
// to eliminate Chrome/Safari third-party cookie restrictions and popup cross-origin blocks.
// For localhost, www, preview environments or Capacitor WebView, always uses the official Firebase domain.
const resolveAuthDomain = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "memolandum.com") {
      return "memolandum.com";
    }
    return "memolandum-33dc4.firebaseapp.com";
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "memolandum-33dc4.firebaseapp.com";
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCKo6V0QHsatNJ0_CnFArfl6HBE2SS-MRE",
  authDomain: resolveAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "memolandum-33dc4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "memolandum-33dc4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "539033091302",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:539033091302:web:1e4c4763aff1da0c2bcf27"
};

let app, auth, db, cloudFuncs, syncProgressCall, googleProvider, ai = null, appCheck = null, analytics;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyDummyKeyForTestingPurposesOnly123") {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    auth = getAuth(app);

    if (typeof window !== "undefined") {
      setPersistence(auth, browserLocalPersistence).catch((e) => {
        console.warn("Auth persistence:", e?.message || e);
      });
    }
    if (typeof window !== "undefined") {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } else {
      db = getFirestore(app);
    }
    cloudFuncs = getFunctions(app, 'us-central1');
    syncProgressCall = httpsCallable(cloudFuncs, 'syncProgress');
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });

    if (typeof window !== "undefined") {
      // App Check: Yalnızca açıkça etkinleştirildiğinde ve React 19 hidrasyonu tamamlandıktan sonra başlat.
      // Hidrasyon sırasında document.body'ye enjekte edilen #fire_app_check_[DEFAULT] div'i React #418 hatasıyla
      // silinerek reCAPTCHA'nın kilitlenmesine ve Auth/Firestore isteklerinin düşmesine yol açar.
      const enableAppCheck = process.env.NEXT_PUBLIC_ENABLE_APP_CHECK === "true";
      const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
      if (enableAppCheck && recaptchaKey) {
        const initDeferredAppCheck = () => {
          setTimeout(() => {
            try {
              appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
                isTokenAutoRefreshEnabled: true,
              });
            } catch (e) {
              console.warn("AppCheck init warning:", e?.message || e);
            }
          }, 1500);
        };
        if (document.readyState === "complete") {
          initDeferredAppCheck();
        } else {
          window.addEventListener("load", initDeferredAppCheck, { once: true });
        }
      }
      isAnalyticsSupported()
        .then((ok) => {
          if (ok) analytics = getAnalytics(app);
        })
        .catch(() => {});
    }
  } else {
    console.warn("Firebase API Key is missing or dummy. Firebase services will be disabled.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, auth, db, cloudFuncs, syncProgressCall, googleProvider, ai, appCheck, analytics };
