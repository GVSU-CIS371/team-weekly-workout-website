// ============================================================
//  src/main.js
//  Application entry point.
//  Registers Vue Router and Pinia, then mounts the app.
// ============================================================

import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import App              from './App.vue'
import router           from './router/index.js'
import './assets/main.css'

import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
authStore.init()

app.mount('#app')