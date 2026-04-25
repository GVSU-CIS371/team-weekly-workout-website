import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, COL } from '@/firebase.js'

export const useAuthStore = defineStore('auth', () => {

  // ── STATE ─────────────────────────────────────
  const user      = ref(null)
  const loading   = ref(true)
  const authError = ref('')

  // ── GETTERS ───────────────────────────────────
  const isLoggedIn  = computed(() => !!user.value)
  const displayName = computed(() =>
    user.value?.displayName || user.value?.email || ''
  )
  const uid = computed(() => user.value?.uid || '')

  // ── INIT (IMPORTANT) ──────────────────────────
  function init() {
    return new Promise(resolve => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value    = firebaseUser
        loading.value = false
        resolve(firebaseUser)
      })
    })
  }

  // ── LOGIN ─────────────────────────────────────
  async function login(email, password) {
    authError.value = ''
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      user.value = cred.user
      return cred.user // ✅ FIXED
    } catch (err) {
      console.error("LOGIN ERROR:", err) // ✅ DEBUG
      authError.value = friendlyError(err.code)
      throw err
    }
  }

  // ── REGISTER ──────────────────────────────────
  async function register(email, password, displayName) {
    authError.value = ''
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      // set display name in Firebase Auth
      await updateProfile(cred.user, { displayName })

      user.value = cred.user

      // save user to Firestore
      await setDoc(doc(db, COL.users, cred.user.uid), {
        uid:         cred.user.uid,
        displayName: displayName,
        email:       email,
        bio:         '',
        joinedAt:    serverTimestamp(),
        isPublic:    true
      })

      return cred.user // ✅ ADDED
    } catch (err) {
      console.error("REGISTER ERROR:", err) // ✅ DEBUG
      authError.value = friendlyError(err.code)
      throw err
    }
  }

  // ── LOGOUT ────────────────────────────────────
  async function logout() {
    await signOut(auth)
    user.value = null
  }

  // ── ERROR HANDLER ─────────────────────────────
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

  return {
    user,
    loading,
    authError,
    isLoggedIn,
    displayName,
    uid,
    init,
    login,
    register,
    logout
  }
})