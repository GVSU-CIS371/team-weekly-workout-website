import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyARLBJnGD8t5MjMR0w1d0CZwkXasxbun8g",
  authDomain: "weekly-workout-website.firebaseapp.com",
  projectId: "weekly-workout-website",
  storageBucket: "weekly-workout-website.firebasestorage.app",
  messagingSenderId: "23019660585",
  appId: "1:23019660585:web:394704e4ddf733f1bd0338",
  measurementId: "G-6C0QE1YXZQ"
};

let app, db, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error(`Firebase initialization failed: ${e.code ?? "unknown-error"} — ${e.message}`);
  throw e;
}

export { db, auth };

/**
 * Maps a Firebase error code to a human-readable message.
 * Use this in catch blocks: getFirebaseErrorMessage(error)
 */
export function getFirebaseErrorMessage(error) {
  const code = error?.code ?? "";

  const messages = {
    // --- Auth: sign-in ---
    "auth/invalid-email":                "The email address is not valid.",
    "auth/user-disabled":                "This account has been disabled. Contact support for help.",
    "auth/user-not-found":               "No account found with that email. Please check the address or sign up.",
    "auth/wrong-password":               "Incorrect password. Please try again or reset your password.",
    "auth/invalid-credential":           "Invalid email or password. Please check your credentials and try again.",
    "auth/too-many-requests":            "Too many failed login attempts. Your account is temporarily locked — wait a few minutes or reset your password.",

    // --- Auth: sign-up ---
    "auth/email-already-in-use":         "An account with that email already exists. Try logging in instead.",
    "auth/weak-password":                "Password is too weak. Use at least 6 characters.",
    "auth/operation-not-allowed":        "This sign-in method is not enabled. Contact the site administrator.",

    // --- Auth: session / token ---
    "auth/requires-recent-login":        "This action requires a recent login. Please sign out and sign back in.",
    "auth/id-token-expired":             "Your session has expired. Please sign in again.",
    "auth/network-request-failed":       "A network error occurred. Check your internet connection and try again.",
    

    // --- Auth: password reset ---
    "auth/expired-action-code":          "This password reset link has expired. Request a new one.",
    "auth/invalid-action-code":          "This password reset link is invalid or has already been used.",

    // --- Firestore ---
    "permission-denied":                 "You don't have permission to perform this action.",
    "not-found":                         "The requested document was not found.",
    "already-exists":                    "A document with this ID already exists.",
    "unavailable":                       "The database is temporarily unavailable. Check your connection and try again.",
    "deadline-exceeded":                 "The request took too long. Please try again.",
    "resource-exhausted":                "Too many requests. Please slow down and try again shortly.",
    "unauthenticated":                   "You must be logged in to perform this action.",
    "cancelled":                         "The operation was cancelled.",
    "data-loss":                         "Unrecoverable data loss or corruption occurred.",
    "internal":                          "An internal server error occurred. Please try again later.",
    "invalid-argument":                  "Invalid data was provided. Check your inputs and try again.",
  };

  if (messages[code]) {
    return messages[code];
  }

  // Fall back to the raw Firebase message if the code isn't mapped
  if (error?.message) {
    return `An unexpected error occurred (${code}): ${error.message}`;
  }

  return "An unknown error occurred. Please try again.";
}

export const COL = {
  users: "users",
  workouts: "workouts",
  meals: "meals",
  posts: "posts",
  stats: "stats"
};