import { createRouter, createWebHistory,type RouteRecordRaw } from 'vue-router'
import Home from '../views/Landing/Home.vue'
import Auth from '../views/Auth/Auth.vue'
import Dashboard from '../views/Dashboard/Dashboard.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => Auth
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => Dashboard
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router