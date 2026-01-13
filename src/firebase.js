import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Environment-based configuration
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fallback config ONLY for development/testing
// IMPORTANT: In production, always use environment variables
const fallbackConfig = {
  apiKey: "AIzaSyCwJkKEwN30jEc79lATosunwtwcsL_SWmY",
  authDomain: "school-transport-62e24.firebaseapp.com",
  projectId: "school-transport-62e24",
  storageBucket: "school-transport-62e24.firebasestorage.app",
  messagingSenderId: "120408329322",
  appId: "1:120408329322:web:6757d0436242c875438e13",
};

// Check if all environment variables are set
const hasAllEnv = Object.values(envConfig).every(Boolean);

// In production, require environment variables
if (import.meta.env.PROD && !hasAllEnv) {
  throw new Error(
    'Firebase configuration missing! Please set all VITE_FIREBASE_* environment variables for production.'
  );
}

// Use env config if available, otherwise fallback (dev only)
const firebaseConfig = hasAllEnv ? envConfig : fallbackConfig;

if (!hasAllEnv && import.meta.env.DEV) {
  // Only warn in development mode
  console.warn("Using fallback Firebase config. Ensure your .env is set and restart the dev server.");
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);