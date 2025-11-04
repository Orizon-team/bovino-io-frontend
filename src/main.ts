import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './routes' 

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('✅ Nueva versión disponible. Recarga para actualizar.')
  },
  onOfflineReady() {
    console.log('✅ App lista para funcionar offline.')
  },
  onRegistered(registration) {
    console.log('✅ Service Worker registrado:', registration)
  }
})

createApp(App).use(router).mount('#app')