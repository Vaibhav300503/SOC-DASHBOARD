import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, guestGuard } from './guards'
import { useAuthStore } from '../stores/authStore'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/DashboardNew.vue'
import GeoAnalytics from '../pages/GeoAnalytics.vue'
import IpAnalytics from '../pages/IpAnalytics.vue'
import LogTypes from '../pages/LogTypes.vue'
import Endpoints from '../pages/Endpoints.vue'
import Severity from '../pages/Severity.vue'
import Tailscale from '../pages/Tailscale.vue'
import LogViewer from '../pages/LogViewer.vue'
import NetworkTopology from '../pages/NetworkTopology.vue'
import Profile from '../pages/Profile.vue'

const routes = [
  { path: '/login', component: Login, name: 'Login', beforeEnter: guestGuard },
  { path: '/dashboard', component: Dashboard, name: 'Dashboard', beforeEnter: authGuard },
  { path: '/', redirect: '/dashboard' },
  { path: '/geo-analytics', component: GeoAnalytics, name: 'GeoAnalytics', beforeEnter: authGuard },
  { path: '/ip-analytics', component: IpAnalytics, name: 'IpAnalytics', beforeEnter: authGuard },
  { path: '/log-types', component: LogTypes, name: 'LogTypes', beforeEnter: authGuard },
  { path: '/endpoints', component: Endpoints, name: 'Endpoints', beforeEnter: authGuard },
  { path: '/severity', component: Severity, name: 'Severity', beforeEnter: authGuard },
  { path: '/tailscale', component: Tailscale, name: 'Tailscale', beforeEnter: authGuard },
  { path: '/log-viewer', component: LogViewer, name: 'LogViewer', beforeEnter: authGuard },
  { path: '/network-topology', component: NetworkTopology, name: 'NetworkTopology', beforeEnter: authGuard },
  { path: '/profile', component: Profile, name: 'Profile', beforeEnter: authGuard },
  { path: '/user-profile', redirect: '/profile' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
