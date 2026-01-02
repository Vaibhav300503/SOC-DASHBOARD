<template>
  <div class="min-h-screen">
    <!-- Navigation - Only show when authenticated -->
    <nav v-if="authStore.isAuthenticated" class="sticky top-0 z-50 card-glass rounded-none border-b border-white/5 shadow-none pb-px">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center shadow-lg shadow-accent-primary/20">
              <i class="fas fa-shield-alt text-black text-sm"></i>
            </div>
            <span class="text-xl font-black bg-gradient-to-r from-white via-accent-primary to-accent-secondary bg-clip-text text-transparent tracking-tight">
              SOC DASHBOARD
            </span>
          </div>

          <div class="hidden md:flex items-center gap-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                $route.path === item.path
                  ? 'nav-item-active'
                  : 'text-slate-dark-300 hover:text-accent-primary hover:bg-white/5'
              ]"
            >
              <i :class="item.icon" class="mr-2"></i>{{ item.label }}
            </router-link>
          </div>

          <div class="flex items-center gap-4">
            <!-- Notification Dropdown -->
            <div class="relative notification-dropdown">
              <button 
                @click="toggleNotifications"
                class="p-2 rounded-lg hover:bg-slate-dark-700/50 text-slate-dark-300 hover:text-cyber-400 relative"
                title="Notifications"
              >
                <i class="fas fa-bell"></i>
                <span 
                  v-if="unreadCount > 0"
                  class="absolute -top-1 -right-1 bg-neon-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {{ unreadCount }}
                </span>
              </button>
              
              <!-- Notification Dropdown -->
              <div 
                v-if="showNotifications"
                class="absolute right-0 mt-2 w-80 dropdown-cyber z-50"
              >
                <NotificationCenter 
                  @close="showNotifications = false" 
                  @update:notifications="notifications = $event"
                />
              </div>
            </div>
            
            <!-- Profile Dropdown -->
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
    
    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform',
          toast.type === 'success' ? 'bg-green-500/20 border-green-500 text-green-300' :
          toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-300' :
          toast.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' :
          'bg-blue-500/20 border-blue-500 text-blue-300'
        ]"
      >
        <div class="flex items-center gap-2">
          <i 
            :class="[
              toast.type === 'success' ? 'fas fa-check-circle' :
              toast.type === 'error' ? 'fas fa-exclamation-circle' :
              toast.type === 'warning' ? 'fas fa-exclamation-triangle' :
              'fas fa-info-circle'
            ]"
          ></i>
          <span class="text-sm font-medium">{{ toast.message }}</span>
          <button 
            @click="removeToast(toast.id)"
            class="ml-auto text-current/60 hover:text-current"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading Screen -->
    <LoadingScreen 
      v-if="showLoadingScreen"
      :message="loadingMessage"
      :sub-message="loadingSubMessage"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import NotificationCenter from './components/soc/NotificationCenter.vue'
import ProfileDropdown from './components/ProfileDropdown.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import { useUserStore } from './stores/userStore.js'
import { useAuthStore } from './stores/authStore.js'
import { useToast } from './composables/useToast.js'

const userStore = useUserStore()
const authStore = useAuthStore()
const { toasts, addToast, removeToast } = useToast()

// Loading screen state
const showLoadingScreen = ref(false)
const loadingMessage = ref('Loading')
const loadingSubMessage = ref('process your request')

// Show loading screen helper
const showLoading = (message = 'Loading', subMessage = 'process your request') => {
  loadingMessage.value = message
  loadingSubMessage.value = subMessage
  showLoadingScreen.value = true
}

// Hide loading screen helper
const hideLoading = () => {
  showLoadingScreen.value = false
}

// Make loading functions available globally
window.showLoading = showLoading
window.hideLoading = hideLoading

// Initialize user on app startup
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await userStore.initializeUser()
    await userStore.loadStats()
  }
})

const showNotifications = ref(false)
const notifications = ref([])

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const closeNotifications = (event) => {
  if (!event.target.closest('.notification-dropdown')) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeNotifications)
})

onUnmounted(() => {
  document.removeEventListener('click', closeNotifications)
})

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'fas fa-chart-line' },
  { path: '/geo-analytics', label: 'Geo Analytics', icon: 'fas fa-globe' },
  { path: '/ip-analytics', label: 'IP Analytics', icon: 'fas fa-network-wired' },
  { path: '/log-types', label: 'Log Types', icon: 'fas fa-list' },
  { path: '/endpoints', label: 'Endpoints', icon: 'fas fa-server' },
  { path: '/severity', label: 'Severity', icon: 'fas fa-exclamation-triangle' },
  { path: '/tailscale', label: 'Tailscale', icon: 'fas fa-link' },
  { path: '/log-viewer', label: 'Log Viewer', icon: 'fas fa-file-code' },
]
</script>
