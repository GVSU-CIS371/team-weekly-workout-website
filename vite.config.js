import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Allows you to import with '@/...' instead of relative paths
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
