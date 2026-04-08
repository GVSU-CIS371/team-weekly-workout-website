// ============================================================
//  src/router/index.js
//  Client-side routing via Vue Router 4.
//  Routes are lazy-loaded (import()) for faster initial load.
//
//  NAVIGATION GUARD:
//    Routes with meta.requiresAuth: true redirect to /login
//    when no user is signed in.
// ============================================================

import { createRouter, createWebHistory } from 'vue-router'
import { getAuth }                         from 'firebase/auth'

// Lazy-loaded view components — each maps to a page
const LoginView     = () => import('@/views/LoginView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const StatsView     = () => import('@/views/StatsView.vue')
const MealsView     = () => import('@/views/MealsView.vue')
const WorkoutsView  = () => import('@/views/WorkoutsView.vue')
const CommunityView = () => import('@/views/CommunityView.vue')
const ProfileView   = () => import('@/views/ProfileView.vue')
const NotFound      = () => import('@/views/NotFound.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'   // root always goes to dashboard
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true }  // redirect to dashboard if already signed in
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/meals',
    name: 'Meals',
    component: MealsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/workouts',
    name: 'Workouts',
    component: WorkoutsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/community',
    name: 'Community',
    component: CommunityView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Scroll to top on every navigation
  scrollBehavior: () => ({ top: 0 })
})

// ── NAVIGATION GUARD ─────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const auth        = getAuth()
  const isSignedIn  = !!auth.currentUser

  if (to.meta.requiresAuth && !isSignedIn) {
    // Protected route — send to login
    return next({ name: 'Login' })
  }

  if (to.meta.guestOnly && isSignedIn) {
    // Already signed in — send to dashboard
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
