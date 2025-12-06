import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './routes' 

import { registerSW } from 'virtual:pwa-register'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

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

const app = createApp(App)

app.use(Toast, {
  position: 'bottom-right',
  timeout: 5000,
  closeOnClick: false,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
})

createApp(App).use(router).mount('#app')