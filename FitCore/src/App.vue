<template>
  <!-- Loading screen while Firebase restores the auth session -->
  <div v-if="authStore.loading" class="splash">
    <span class="splash-logo">FitCore</span>
  </div>

  <div v-else>
    <!-- ── NAVIGATION BAR ─────────────────────────────────── -->
    <nav v-if="authStore.isLoggedIn" class="navbar">
      <RouterLink to="/dashboard" class="nav-logo">FitCore</RouterLink>

      <div class="nav-links">
        <RouterLink to="/dashboard"  class="nav-btn">Dashboard</RouterLink>
        <RouterLink to="/stats"      class="nav-btn">Body Stats</RouterLink>
        <RouterLink to="/meals"      class="nav-btn">Meals</RouterLink>
        <RouterLink to="/workouts"   class="nav-btn">Workouts</RouterLink>
        <!-- Community is SHARED data — visible to all users -->
        <RouterLink to="/community"  class="nav-btn">Community</RouterLink>
      </div>

      <div class="nav-right">
        <RouterLink to="/profile" class="nav-avatar" :title="authStore.displayName">
          {{ initials }}
        </RouterLink>
        <button class="btn btn-outline btn-sm" @click="handleLogout">Sign out</button>
      </div>
    </nav>

    <!-- ── PAGE CONTENT with fade transition ─────────────── -->
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>
  </div>
    <router-view :key="$route.fullPath" />
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router    = useRouter()
const authStore = useAuthStore()

// Build initials from display name for the avatar chip
const initials = computed(() => {
  const name = authStore.displayName
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
/* ── SPLASH SCREEN ────────────────────────────────────────── */
.splash {
  height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg);
}
.splash-logo {
  font-family: var(--font-display);
  font-size: 3rem; letter-spacing: .1em;
  color: var(--accent);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}

/* ── NAVBAR ───────────────────────────────────────────────── */
.navbar {
  position: sticky; top: 0; z-index: 100;
  height: var(--nav-h);
  background: rgba(13,15,20,.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center;
  padding: 0 2rem; gap: 2rem;
}

.nav-logo {
  font-family: var(--font-display);
  font-size: 1.7rem; letter-spacing: .05em;
  color: var(--accent); flex-shrink: 0;
  text-decoration: none;
}

.nav-links {
  display: flex; gap: .25rem; flex: 1;
}

/* Individual nav tabs — RouterLink applies .router-link-active */
.nav-btn {
  padding: .45rem 1rem; border-radius: 6px;
  font-size: .82rem; font-weight: 500;
  text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted);
  text-decoration: none;
  transition: color .2s, background .2s;
}
.nav-btn:hover { color: var(--text); background: var(--surface2); }
.nav-btn.router-link-active {
  color: var(--bg); background: var(--accent); font-weight: 600;
}

.nav-right {
  display: flex; align-items: center; gap: .75rem; flex-shrink: 0;
}

/* Avatar initials chip */
.nav-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--accent2);
  color: var(--bg);
  font-size: .75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; flex-shrink: 0;
  transition: opacity .2s;
}
.nav-avatar:hover { opacity: .8; }

/* ── SHARED BUTTON UTILITIES ──────────────────────────────── */
/* These are defined here so they're available app-wide via
   the global style tag in each component when not scoped. */
.btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .6rem 1.4rem; border-radius: 7px; border: none;
  font-family: var(--font-body); font-size: .88rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s, transform .1s;
}
.btn:active { transform: scale(.97); }
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-primary:hover { opacity: .88; }
.btn-outline {
  background: transparent; border: 1px solid var(--border); color: var(--text);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); }
.btn-danger  { background: var(--danger); color: #fff; }
.btn-danger:hover { opacity: .85; }
.btn-sm      { padding: .32rem .85rem; font-size: .78rem; }

@media (max-width: 768px) {
  .navbar    { padding: 0 1rem; gap: 1rem; }
  .nav-btn   { padding: .35rem .55rem; font-size: .72rem; }
}
</style>
