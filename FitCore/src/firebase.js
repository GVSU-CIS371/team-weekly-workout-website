import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "weekly-workout-website.firebaseapp.com",
  projectId: "weekly-workout-website",
  storageBucket: "weekly-workout-website.firebasestorage.app",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const COL = {
  users: "users",
  workouts: "workouts",
  meals: "meals",
  posts: "posts"
};