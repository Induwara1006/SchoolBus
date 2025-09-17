import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fallback config (for local debugging if .env is missing or not loaded)
const fallbackConfig = {
  apiKey: "AIzaSyCwJkKEwN30jEc79lATosunwtwcsL_SWmY",
  authDomain: "school-transport-62e24.firebaseapp.com",
  projectId: "school-transport-62e24",
  storageBucket: "school-transport-62e24.firebasestorage.app",
  messagingSenderId: "120408329322",
  appId: "1:120408329322:web:6757d0436242c875438e13",
};

const hasAllEnv = Object.values(envConfig).every(Boolean);
const firebaseConfig = hasAllEnv ? envConfig : fallbackConfig;
if (!hasAllEnv) {
  // eslint-disable-next-line no-console
  console.warn("Using fallback Firebase config. Ensure your .env is set and restart the dev server.");
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);