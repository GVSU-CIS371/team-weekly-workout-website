<template>
  <!-- ========================================================
    ProfileView.vue
    Lets the signed-in user view and edit their PUBLIC profile
    document stored in the "users" Firestore collection.

    The "users" collection is SHARED data — the displayName and
    bio are readable by all authenticated users (e.g. community
    feed shows the author's name from this collection).

    Also shows a read-only summary of their private data counts.
  ======================================================== -->
  <div class="page">
    <PageHeader title="My Profile" subtitle="Manage your account details and public profile." />

    <!-- ── PROFILE EDIT CARD ─────────────────────────────── -->
    <AppCard title="Public Profile">
      <p class="field-hint">
        Your display name and bio are visible to other community members.
      </p>

      <!-- Avatar preview -->
      <div class="avatar-row">
        <div class="profile-avatar">{{ initials }}</div>
        <div>
          <p class="avatar-name">{{ authStore.displayName }}</p>
          <p class="avatar-email">{{ authStore.user?.email }}</p>
        </div>
      </div>

      <div class="form-group">
        <label>Display Name</label>
        <input v-model="profileForm.displayName" placeholder="Your Name" />
      </div>
      <div class="form-group">
        <label>Bio <span class="optional">(optional)</span></label>
        <textarea v-model="profileForm.bio" rows="3"
                  placeholder="Tell the community a bit about yourself…"></textarea>
      </div>

      <div v-if="saveMsg" class="alert" :class="saveMsg.type">{{ saveMsg.text }}</div>

      <button class="btn btn-primary" :disabled="saving" @click="saveProfile">
        {{ saving ? 'Saving…' : 'Save Profile' }}
      </button>
    </AppCard>

    <!-- ── ACTIVITY SUMMARY ───────────────────────────────── -->
    <AppCard title="My Activity">
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-val">{{ counts.workouts }}</span>
          <span class="summary-label">Workouts</span>
        </div>
        <div class="summary-item">
          <span class="summary-val">{{ counts.meals }}</span>
          <span class="summary-label">Meals Logged</span>
        </div>
        <div class="summary-item">
          <span class="summary-val">{{ counts.stats }}</span>
          <span class="summary-label">Stat Entries</span>
        </div>
        <div class="summary-item">
          <span class="summary-val">{{ counts.posts }}</span>
          <span class="summary-label">Community Posts</span>
        </div>
      </div>
    </AppCard>

    <!-- ── DANGER ZONE ────────────────────────────────────── -->
    <AppCard title="Account">
      <p class="field-hint" style="margin-bottom:1rem">
        Signing out will return you to the login screen.
      </p>
      <button class="btn btn-danger" @click="handleSignOut">Sign Out</button>
    </AppCard>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { updateProfile }                       from 'firebase/auth'
import {
  doc, getDoc, setDoc, getDocs,
  collection, query, where, serverTimestamp
} from 'firebase/firestore'
import { useRouter }    from 'vue-router'
import { auth, db, COL } from '@/firebase.js'
import { useAuthStore }  from '@/stores/auth.js'
import PageHeader        from '@/components/PageHeader.vue'
import AppCard           from '@/components/AppCard.vue'

const authStore = useAuthStore()
const router    = useRouter()

// ── STATE ──────────────────────────────────────────────────
const saving  = ref(false)
const saveMsg = ref(null)   // { text, type: 'alert-success' | 'alert-error' }

// Counts for the activity summary section
const counts = reactive({ workouts: 0, meals: 0, stats: 0, posts: 0 })

// Form model — pre-filled from Firestore "users" doc
const profileForm = reactive({ displayName: '', bio: '' })

// Initials chip for the avatar
const initials = computed(() => {
  const name = authStore.displayName
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
})

// ── LOAD PROFILE ────────────────────────────────────────────
// Reads the PUBLIC "users" document for this UID
async function loadProfile() {
  const snap = await getDoc(doc(db, COL.users, authStore.user?.uid))
  if (snap.exists()) {
    const data = snap.data()
    profileForm.displayName = data.displayName || authStore.displayName
    profileForm.bio         = data.bio || ''
  } else {
    // First time — pre-fill from Firebase Auth profile
    profileForm.displayName = authStore.displayName
  }
}

// ── LOAD ACTIVITY COUNTS ────────────────────────────────────
// Reads counts from the three PRIVATE collections
async function loadCounts() {
  let uid = authStore.user?.uid

  // wait for auth to load
  while (!uid) {
    await new Promise(r => setTimeout(r, 50))
    uid = authStore.user?.uid
  }

  const [wSnap, mSnap, sSnap, pSnap] = await Promise.all([
    getDocs(query(collection(db, COL.workouts),  where('userId', '==', uid))),
    getDocs(query(collection(db, COL.meals),     where('userId', '==', uid))),
    getDocs(query(collection(db, COL.stats),     where('userId', '==', uid))),
    getDocs(query(collection(db, COL.posts),     where('userId', '==', uid)))
  ])

  counts.workouts = wSnap.size
  counts.meals    = mSnap.size
  counts.stats    = sSnap.size
  counts.posts    = pSnap.size
}

// ── SAVE PROFILE ────────────────────────────────────────────
// Updates BOTH the Firebase Auth profile AND the public "users" doc
async function saveProfile() {
  if (!profileForm.displayName.trim()) return
  saving.value = true
  try {
    // Update Firebase Auth display name
    await updateProfile(auth.currentUser, {
      displayName: profileForm.displayName.trim()
    })

    // Update / create the PUBLIC Firestore user document
    await setDoc(doc(db, COL.users, authStore.user?.uid), {
      uid:         authStore.uid,
      displayName: profileForm.displayName.trim(),
      email:       authStore.user?.email || '',
      bio:         profileForm.bio.trim(),
      updatedAt:   serverTimestamp(),
      isPublic:    true   // community feed uses this flag
    }, { merge: true })   // merge: true so we don't overwrite joinedAt

    // Sync the Pinia store's display name
    authStore.user.displayName = profileForm.displayName.trim()

    saveMsg.value = { text: 'Profile saved!', type: 'alert-success' }
    setTimeout(() => { saveMsg.value = null }, 3000)
  } catch (err) {
    console.error('saveProfile:', err)
    saveMsg.value = { text: 'Failed to save. Please try again.', type: 'alert-error' }
  } finally {
    saving.value = false
  }
}

async function handleSignOut() {
  await authStore.logout()
  router.push({ name: 'Login' })
}

onMounted(() => {
  loadProfile()
  loadCounts()
})
</script>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 3rem 2rem; }

.field-hint { font-size: .85rem; color: var(--muted); margin-bottom: 1.25rem; }

/* Avatar + name row */
.avatar-row {
  display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
}
.profile-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--accent2); color: var(--bg);
  font-size: 1.1rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatar-name  { font-weight: 600; font-size: 1rem; }
.avatar-email { font-size: .82rem; color: var(--muted); font-family: var(--font-mono); }

.form-group { margin-bottom: 1.1rem; }
label {
  display: block; font-size: .78rem; font-weight: 500;
  color: var(--muted); text-transform: uppercase; letter-spacing: .06em;
  margin-bottom: .45rem;
}
.optional { text-transform: none; font-weight: 400; }
input, textarea {
  width: 100%; padding: .7rem 1rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text);
  font-family: var(--font-body); font-size: .95rem;
  transition: border-color .2s;
}
input:focus, textarea:focus { outline: none; border-color: var(--accent); }
textarea { resize: vertical; }

.btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .6rem 1.4rem; border-radius: 7px; border: none;
  font-family: var(--font-body); font-size: .88rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s, transform .1s;
}
.btn:active  { transform: scale(.97); }
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-primary:hover { opacity: .88; }
.btn-danger  { background: var(--danger); color: #fff; }
.btn-danger:hover { opacity: .85; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.alert {
  padding: .7rem 1rem; border-radius: 7px;
  margin-bottom: 1rem; font-size: .87rem;
}
.alert-success { background: rgba(74,222,128,.12); border: 1px solid rgba(74,222,128,.3); color: var(--success); }
.alert-error   { background: rgba(255,92,92,.12);  border: 1px solid rgba(255,92,92,.3);  color: var(--danger); }

/* Activity summary 4-column grid */
.summary-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
}
.summary-item {
  text-align: center;
  background: var(--surface2); border-radius: 8px; padding: 1.1rem .75rem;
}
.summary-val {
  display: block;
  font-family: var(--font-display); font-size: 2rem; color: var(--accent);
}
.summary-label {
  font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; color: var(--muted);
  margin-top: .2rem;
}

@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
}
</style>
