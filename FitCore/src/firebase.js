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

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const COL = {
  users: "users",
  workouts: "workouts",
  meals: "meals",
  posts: "posts"
};