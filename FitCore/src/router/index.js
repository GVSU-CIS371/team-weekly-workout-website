// ============================================================
//  src/router/index.js
// ============================================================

import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged }    from 'firebase/auth'

// Lazy-loaded views
const LoginView     = () => import('@/views/LoginView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const StatsView     = () => import('@/views/StatsView.vue')
const MealsView     = () => import('@/views/MealsView.vue')
const WorkoutsView  = () => import('@/views/WorkoutsView.vue')
const CommunityView = () => import('@/views/CommunityView.vue')
const ProfileView   = () => import('@/views/ProfileView.vue')
const NotFound      = () => import('@/views/NotFound.vue')

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: LoginView, meta: { guestOnly: true } },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/stats', name: 'Stats', component: StatsView, meta: { requiresAuth: true } },
  { path: '/meals', name: 'Meals', component: MealsView, meta: { requiresAuth: true } },
  { path: '/workouts', name: 'Workouts', component: WorkoutsView, meta: { requiresAuth: true } },
  { path: '/community', name: 'Community', component: CommunityView, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// ── AUTH STATE HANDLING ──────────────────────────────────────
const auth = getAuth()

let authReady = false
let currentUser = null

onAuthStateChanged(auth, (user) => {
  currentUser = user
  authReady = true
})

// Helper to wait until Firebase finishes loading auth
function waitForAuth() {
  return new Promise((resolve) => {
    const check = () => {
      if (authReady) return resolve()
      setTimeout(check, 50)
    }
    check()
  })
}

// ── NAVIGATION GUARD (FIXED) ─────────────────────────────────
router.beforeEach(async (to, _from, next) => {
  await waitForAuth()  

  const isSignedIn = !!currentUser

  if (to.meta.requiresAuth && !isSignedIn) {
    return next({ name: 'Login' })
  }

  if (to.meta.guestOnly && isSignedIn) {
    return next({ name: 'Dashboard' })
  }

  next()
})


export default router