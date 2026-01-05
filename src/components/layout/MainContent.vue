<template>
  <div class="min-h-screen bg-app-primary">
    <!-- Top Navigation Bar -->
    <nav
      v-if="authStore.isAuthenticated"
      class="sticky top-0 z-30 bg-app-primary/80 backdrop-blur-xl border-b border-card-border-default"
    >
      <div class="px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold text-text-primary-headings">{{ pageTitle }}</h1>
        </div>

        <div class="flex items-center gap-4">
          <!-- Notification Dropdown -->
          <div class="relative notification-dropdown">
            <button
              @click="toggleNotifications"
              class="p-2 rounded hover:bg-hover-overlay text-icon-default hover:text-icon-active relative transition-colors"
              title="Notifications"
            >
              <i class="fas fa-bell text-sm"></i>
              <span
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
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
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="px-6 py-8 relative z-10">
      <slot></slot>
    </main>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'px-4 py-3 rounded shadow-lg border transition-all duration-300 transform',
          toast.type === 'success' ? 'bg-green-600/20 border-green-600 text-green-400' :
          toast.type === 'error' ? 'bg-red-600/20 border-red-600 text-red-400' :
          toast.type === 'warning' ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' :
          'bg-card-primary border-card-border-default text-accent-primary'
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NotificationCenter from '../soc/NotificationCenter.vue'
import LoadingScreen from '../LoadingScreen.vue'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const authStore = useAuthStore()
const { toasts, addToast, removeToast } = useToast()

const showNotifications = ref(false)
const notifications = ref([])
const showLoadingScreen = ref(false)
const loadingMessage = ref('Loading')
const loadingSubMessage = ref('process your request')

const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

const pageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard',
    '/geo-analytics': 'Geo Analytics',
    '/ip-analytics': 'IP Analytics',
    '/log-types': 'Log Viewer',
    '/endpoints': 'Endpoints',
    '/severity': 'Severity',
    '/tailscale': 'Tailscale',
    '/log-viewer': 'Raw Logs',
  }
  return titles[route.path] || 'Dashboard'
})

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const closeNotifications = (event) => {
  if (!event.target.closest('.notification-dropdown')) {
    showNotifications.value = false
  }
}

// Make loading functions available globally
window.showLoading = (message = 'Loading', subMessage = 'process your request') => {
  loadingMessage.value = message
  loadingSubMessage.value = subMessage
  showLoadingScreen.value = true
}

window.hideLoading = () => {
  showLoadingScreen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeNotifications)
})

onUnmounted(() => {
  document.removeEventListener('click', closeNotifications)
})
</script>

<style scoped>
.dropdown-cyber {
  background-color: var(--bg-card-primary);
  border: 1px solid var(--border-card-default);
  border-radius: 6px;
  box-shadow: var(--shadow-card);
}
</style>
