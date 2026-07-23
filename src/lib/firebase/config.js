import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC0DInTuffWT5x6DcbUqk7jlOP_kmM5fkw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "memolandum.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "memolandum-33dc4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "memolandum-33dc4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "539033091302",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:539033091302:web:1e4c4763aff1da0c2bcf27"
};

let app, auth, db, cloudFuncs, syncProgressCall, googleProvider, ai, appCheck = null, analytics;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyDummyKeyForTestingPurposesOnly123") {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    auth = getAuth(app);
    if (typeof window !== "undefined") {
      setPersistence(auth, browserLocalPersistence).catch((e) => {
        console.warn("Auth persistence:", e?.message || e);
      });
    }
    db = getFirestore(app);
    cloudFuncs = getFunctions(app, 'us-central1');
    syncProgressCall = httpsCallable(cloudFuncs, 'syncProgress');
    googleProvider = new GoogleAuthProvider();
    ai = getAI(app, { backend: new GoogleAIBackend() });

    if (typeof window !== "undefined") {
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
