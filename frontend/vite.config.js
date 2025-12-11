import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'vuex', 'vue-i18n', 'axios'],
          'ionic': ['@ionic/vue', '@ionic/vue-router', 'ionicons'],
          'leaflet': ['leaflet'],
          'socket': ['socket.io-client']
        }
      }
    }
  }
})
