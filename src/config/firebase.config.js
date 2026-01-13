/**
 * Firebase Configuration
 * Environment-based configuration with fallback for development
 */

// Environment-based configuration
export const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fallback config ONLY for development/testing
// IMPORTANT: In production, always use environment variables
export const fallbackConfig = {
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
const isProduction = import.meta.env.MODE === "production";

if (isProduction && !hasAllEnv) {
  throw new Error(
    "Missing Firebase environment variables. Please configure them in your deployment environment."
  );
}

// Use environment config if available, otherwise fallback
export const firebaseConfig = hasAllEnv ? envConfig : fallbackConfig;

// Log which configuration is being used (only in development)
if (import.meta.env.DEV) {
  console.log(
    `Using ${hasAllEnv ? "environment" : "fallback"} Firebase configuration`
  );
}
