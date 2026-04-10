<template>
  <!-- ========================================================
    LoginView.vue
    Handles both Sign In and Register.
    Firebase Auth is called via the useAuthStore.
  ======================================================== -->
  <div class="login-wrap">
    <div class="login-box">

      <div class="login-logo">FitCore</div>
      <!-- Change this tagline text to rebrand -->
      <p class="login-tagline">Track your body. Own your progress.</p>

      <!-- Alert banner (success or error) -->
      <div v-if="alertMsg" class="alert" :class="alertType">{{ alertMsg }}</div>

      <!-- ── SIGN IN FORM ───────────────────────────────── -->
      <div v-if="!showRegister">
        <p class="form-section-label">Sign In</p>

        <div class="form-group">
          <label>Email</label>
          <input v-model="loginForm.email" type="email"
                 placeholder="you@email.com" @keyup.enter="doLogin" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="loginForm.password" type="password"
                 placeholder="••••••••" @keyup.enter="doLogin" />
        </div>

        <button class="btn btn-primary btn-full" :disabled="busy" @click="doLogin">
          {{ busy ? 'Signing in…' : 'Sign In →' }}
        </button>

        <hr class="divider" />
        <p class="switch-line">
          No account?
          <button class="link-btn" @click="showRegister = true">Create one</button>
        </p>
      </div>

      <!-- ── REGISTER FORM ──────────────────────────────── -->
      <div v-else>
        <p class="form-section-label">Create Account</p>

        <div class="form-group">
          <label>Display Name</label>
          <input v-model="regForm.displayName" placeholder="Your Name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="regForm.email" type="email" placeholder="you@email.com" />
        </div>
        <div class="row-2">
          <div class="form-group">
            <label>Password</label>
            <input v-model="regForm.password" type="password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label>Confirm</label>
            <input v-model="regForm.confirm" type="password" placeholder="••••••••" />
          </div>
        </div>

        <button class="btn btn-primary btn-full" :disabled="busy" @click="doRegister">
          {{ busy ? 'Creating…' : 'Create Account' }}
        </button>

        <hr class="divider" />
        <p class="switch-line">
          Have an account?
          <button class="link-btn" @click="showRegister = false">Sign in</button>
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { db, COL } from '@/firebase.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, reactive } from 'vue'
import { useRouter }     from 'vue-router'
import { useAuthStore }  from '@/stores/auth.js'

const router    = useRouter()
const authStore = useAuthStore()

const showRegister = ref(false)
const busy         = ref(false)
const alertMsg     = ref('')
const alertType    = ref('alert-error')  // 'alert-error' | 'alert-success'

// Forms
const loginForm = reactive({ email: '', password: '' })
const regForm   = reactive({ displayName: '', email: '', password: '', confirm: '' })

function showAlert(msg, type = 'alert-error', ms = 4000) {
  alertMsg.value  = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, ms)
}

// ── SIGN IN ────────────────────────────────────────────────
async function doLogin() {
  authStore.authError = null  // clear old errors

  if (!loginForm.email || !loginForm.password) {
    return showAlert('Please enter your email and password.')
  }

  busy.value = true

  try {
    const user = await authStore.login(
      loginForm.email,
      loginForm.password
    )

    if (!user) throw new Error('Login failed')

    // SUCCESS
    showAlert('Login successful!', 'alert-success', 2000)

    router.push({ name: 'Dashboard' })

  } catch (err) {
    console.error(err)

    const msg =
      err?.code ||
      err?.message ||
      authStore.authError ||
      'Sign-in failed.'

    showAlert(msg)
  } finally {
    busy.value = false
  }
}

// ── REGISTER ───────────────────────────────────────────────
async function doRegister() {
  authStore.authError = null  // clear old errors

  if (!regForm.displayName || !regForm.email || !regForm.password) {
    return showAlert('All fields are required.')
  }

  if (regForm.password !== regForm.confirm) {
    return showAlert('Passwords do not match.')
  }

  busy.value = true

  try {
    // 1. Create user
    const user = await authStore.register(
      regForm.email,
      regForm.password,
      regForm.displayName
    )

    console.log('User created:', user)

    if (!user || !user.uid) {
      throw new Error('User creation failed')
    }

    // 2. Save to Firestore
    await setDoc(doc(db, COL.users, user.uid), {
      displayName: regForm.displayName,
      email: regForm.email,
      createdAt: serverTimestamp()
    })

    console.log('Firestore write successful')

    // ✅ SUCCESS
    showAlert('Account created!', 'alert-success', 2000)

    // 3. Redirect
    router.push({ name: 'Dashboard' })

  } catch (err) {
    console.error(err)

    const msg =
      err?.code ||
      err?.message ||
      authStore.authError ||
      'Registration failed.'

    showAlert(msg)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem; background: var(--bg);
}
.login-box {
  width: 100%; max-width: 440px;    /* login card width — change here */
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2.75rem 2.5rem;
}
.login-logo {
  font-family: var(--font-display);
  font-size: 2.6rem; letter-spacing: .08em;
  color: var(--accent); margin-bottom: .3rem;
}
.login-tagline { color: var(--muted); font-size: .88rem; margin-bottom: 2rem; }

.form-section-label {
  font-size: .7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted); margin-bottom: 1.2rem;
}
.form-group { margin-bottom: 1.1rem; }
label {
  display: block; font-size: .78rem; font-weight: 500;
  color: var(--muted); text-transform: uppercase; letter-spacing: .06em;
  margin-bottom: .45rem;
}
input {
  width: 100%; padding: .7rem 1rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text);
  font-family: var(--font-body); font-size: .95rem;
  transition: border-color .2s;
}
input:focus { outline: none; border-color: var(--accent); }
input::placeholder { color: var(--muted); }

.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

/* Button fills full width on login card */
.btn-full { width: 100%; justify-content: center; margin-top: .5rem; }
.btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .65rem 1.4rem; border-radius: 7px; border: none;
  font-family: var(--font-body); font-size: .9rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s, transform .1s;
}
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-primary:hover { opacity: .88; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.divider { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
.switch-line { text-align: center; font-size: .85rem; color: var(--muted); }
.link-btn {
  background: none; border: none; cursor: pointer;
  color: var(--accent2); font-size: .85rem; font-weight: 600;
  margin-left: .3rem;
}

.alert {
  padding: .75rem 1rem; border-radius: 7px;
  margin-bottom: 1.2rem; font-size: .87rem;
}
.alert-error   { background: rgba(255,92,92,.12);  border: 1px solid rgba(255,92,92,.3);   color: var(--danger); }
.alert-success { background: rgba(74,222,128,.12); border: 1px solid rgba(74,222,128,.3);  color: var(--success); }

@media (max-width: 480px) {
  .login-box { padding: 2rem 1.5rem; }
  .row-2     { grid-template-columns: 1fr; }
}
</style>
