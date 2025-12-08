import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './routes' 

import { registerSW } from 'virtual:pwa-register'
import { subscribeToPush } from './services/pushNotifications'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

registerSW({
  onNeedRefresh() {
    console.log('Nueva versión disponible. Recarga para actualizar.')
  },
  onOfflineReady() {
    console.log('App lista para funcionar offline.')
  },
  onRegistered(registration) {
    console.log('Service Worker registrado:', registration)
    console.log('Iniciando proceso de suscripción push...')
    
    navigator.serviceWorker.ready
      .then((reg) => {
        console.log('SW ready, llamando a subscribeToPush...')
        const userString = localStorage.getItem('user')
        const userId = userString ? JSON.parse(userString).id_user : undefined
        return subscribeToPush(reg, userId)
      })
      .then(() => {
        console.log('subscribeToPush completado exitosamente')
      })
      .catch((err) => {
        console.error('Error en el proceso de suscripción:', err)
      })
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

app.use(router).mount('#app')