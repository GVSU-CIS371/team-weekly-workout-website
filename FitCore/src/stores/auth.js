// ============================================================
//  src/stores/auth.js
//  Pinia store for Firebase Authentication state.
//  Exposes: user, isLoggedIn, login, register, logout
// ============================================================

import { defineStore }    from 'pinia'
import { ref, computed }  from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, COL } from '@/firebase.js'

export const useAuthStore = defineStore('auth', () => {

  // ── STATE ──────────────────────────────────────────────────
  const user        = ref(null)   // Firebase User object (or null)
  const loading     = ref(true)   // true while onAuthStateChanged hasn't fired yet
  const authError   = ref('')     // last auth error message

  // ── GETTERS ────────────────────────────────────────────────
  const isLoggedIn   = computed(() => !!user.value)
  const displayName  = computed(() => user.value?.displayName || user.value?.email || '')
  const uid          = computed(() => user.value?.uid || '')

  // ── INIT — listen for auth state changes ───────────────────
  // Call once at app startup (in App.vue) to restore sessions.
  function init() {
    return new Promise(resolve => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value    = firebaseUser
        loading.value = false
        resolve(firebaseUser)
      })
    })
  }

  // ── LOGIN ──────────────────────────────────────────────────
  async function login(email, password) {
    authError.value = ''
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      user.value  = cred.user
    } catch (err) {
      authError.value = friendlyError(err.code)
      throw err
    }
  }

  // ── REGISTER ───────────────────────────────────────────────
  async function register(email, password, displayName) {
    authError.value = ''
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      // Set display name on the Auth profile
      await updateProfile(cred.user, { displayName })
      user.value = cred.user

      // Create a PUBLIC user document in the "users" collection.
      // This is the SHARED data — visible to all authenticated users.
      await setDoc(doc(db, COL.users, cred.user.uid), {
        uid:         cred.user.uid,
        displayName: displayName,
        email:       email,
        bio:         '',            // user can edit later in Profile
        joinedAt:    serverTimestamp(),
        isPublic:    true           // flag so community feed can show username
      })
    } catch (err) {
      authError.value = friendlyError(err.code)
      throw err
    }
  }

  // ── LOGOUT ─────────────────────────────────────────────────
  async function logout() {
    await signOut(auth)
    user.value = null
  }

  // ── HELPER — human-readable Firebase error messages ────────
  function friendlyError(code) {
    const map = {
      'auth/user-not-found':       'No account found with that email.',
      'auth/wrong-password':       'Incorrect password.',
      'auth/email-already-in-use': 'That email is already registered.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/too-many-requests':    'Too many attempts — try again later.'
    }
    return map[code] || 'An error occurred. Please try again.'
  }

  return { user, loading, authError, isLoggedIn, displayName, uid, init, login, register, logout }
})
