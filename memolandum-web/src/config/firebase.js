import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "memolandum-33dc4",
  appId: "1:539033091302:web:1e4c4763aff1da0c2bcf27",
  storageBucket: "memolandum-33dc4.firebasestorage.app",
  apiKey: "AIzaSyC0DInTuffWT5x6DcbUqk7jlOP_kmM5fkw",
  authDomain: "memolandum.com",
  messagingSenderId: "539033091302",
  measurementId: "G-0YNLGTPW3R"
};

// Next.js (SSR) ortamında Firebase uygulamasının birden çok kez başlatılmasını önlemek için:
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
