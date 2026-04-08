// ============================================================
//  src/main.js
//  Application entry point.
//  Registers Vue Router and Pinia, then mounts the app.
// ============================================================

import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import App              from './App.vue'
import router           from './router/index.js'
import './assets/main.css'   // global styles

const app = createApp(App)

app.use(createPinia())  // global state management
app.use(router)         // client-side routing

app.mount('#app')
