// ============================================================
// src/main.js
// Application entry point
// ============================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'

import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

// setup Pinia
const pinia = createPinia()
app.use(pinia)

// setup Router
app.use(router)

// wait for auth before mounting
async function startApp() {
  const authStore = useAuthStore()
  await authStore.init()
  app.mount('#app')
}

startApp()