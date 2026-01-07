<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-app-secondary border-r border-card-border-default',
      'transition-all duration-sidebar z-40',
      isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar-expanded',
      'flex flex-col overflow-hidden backdrop-blur-sm'
    ]"
  >
    <!-- Logo Section -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-card-border-default bg-card-primary">
      <div
        v-if="!isCollapsed"
        class="flex items-center gap-3 flex-1"
      >
        <div class="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
          <i class="fas fa-shield-alt text-app-primary text-sm"></i>
        </div>
        <span class="text-sm font-bold text-text-primary-headings tracking-tight whitespace-nowrap">SOC</span>
      </div>
      <button
        @click="toggleSidebar"
        class="p-2 hover:bg-hover-overlay rounded transition-colors text-icon-default hover:text-icon-active"
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'" class="text-xs"></i>
      </button>
    </div>

    <!-- Navigation Section -->
    <SidebarNavigation :isCollapsed="isCollapsed" />

    <!-- User Section -->
    <div class="border-t border-card-border-default p-3 bg-card-primary">
      <button
        @click="toggleUserMenu"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded',
          'hover:bg-hover-overlay transition-all duration-200 text-text-secondary hover:text-accent-primary'
        ]"
      >
        <div class="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center flex-shrink-0 relative">
          <i class="fas fa-user text-app-primary text-xs"></i>
          <!-- Online indicator -->
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-app-secondary"></div>
        </div>
        <div v-if="!isCollapsed" class="flex-1 text-left min-w-0">
          <div class="text-xs font-medium text-accent-primary truncate">{{ userName }}</div>
          <div class="text-xs text-text-muted truncate">{{ userRole }}</div>
        </div>
        <i v-if="!isCollapsed" class="fas fa-chevron-down text-xs flex-shrink-0 text-accent-primary"></i>
      </button>

      <!-- User Menu Dropdown -->
      <div
        v-if="showUserMenu && !isCollapsed"
        class="mt-2 bg-card-secondary rounded border border-card-border-default overflow-hidden backdrop-blur-sm"
      >
        <!-- Profile Stats (Mini Version) -->
        <div class="px-3 py-2 border-b border-card-border-default">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <div class="text-xs font-bold text-accent-primary">{{ userStore.stats?.loginCount || 0 }}</div>
              <div class="text-xs text-text-muted">Logins</div>
            </div>
            <div>
              <div class="text-xs font-bold text-green-500">{{ userStore.stats?.alertsCreated || 0 }}</div>
              <div class="text-xs text-text-muted">Alerts</div>
            </div>
            <div>
              <div class="text-xs font-bold text-purple-400">{{ userStore.stats?.reportsGenerated || 0 }}</div>
              <div class="text-xs text-text-muted">Reports</div>
            </div>
          </div>
        </div>

        <button
          @click="handleProfile"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-accent-primary hover:bg-hover-overlay transition-colors"
        >
          <i class="fas fa-user-circle"></i>
          <span>View Profile</span>
        </button>
        <button
          @click="handleSettings"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-accent-primary hover:bg-hover-overlay transition-colors"
        >
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </button>
        <button
          @click="handleActivity"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-accent-primary hover:bg-hover-overlay transition-colors"
        >
          <i class="fas fa-chart-line"></i>
          <span>Activity</span>
        </button>
        <button
          @click="handleSecurity"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-accent-primary hover:bg-hover-overlay transition-colors"
        >
          <i class="fas fa-shield-alt"></i>
          <span>Security</span>
          <span class="ml-auto text-xs bg-yellow-600/30 text-yellow-500 px-1.5 py-0.5 rounded">2FA</span>
        </button>
        <div class="border-t border-card-border-default"></div>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useSidebarStore } from '../../stores/sidebarStore'
import { useUserStore } from '../../stores/userStore'
import SidebarNavigation from './SidebarNavigation.vue'

const router = useRouter()
const authStore = useAuthStore()
const sidebarStore = useSidebarStore()
const userStore = useUserStore()

onMounted(async () => {
  // Ensure user data is loaded for first name
  if (!userStore.user) {
    await userStore.initializeUser()
  }
  // Ensure stats are loaded
  if (!userStore.stats) {
    await userStore.loadStats()
  }
})

const isCollapsed = computed({
  get: () => sidebarStore.isCollapsed,
  set: (value) => sidebarStore.setCollapsed(value)
})

const showUserMenu = ref(false)

const userName = computed(() => {
  if (userStore.user?.firstName) return userStore.user.firstName
  if (authStore.user?.name) return authStore.user.name.split(' ')[0]
  return 'User'
})
const userRole = computed(() => authStore.user?.role || 'Analyst')

const toggleSidebar = () => {
  sidebarStore.toggleSidebar()
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const handleProfile = () => {
  console.log('Profile clicked')
  router.push('/profile?tab=profile')
  showUserMenu.value = false
}

const handleSettings = () => {
  console.log('Settings clicked')
  router.push('/profile?tab=settings')
  showUserMenu.value = false
}

const handleActivity = () => {
  console.log('Activity clicked')
  router.push('/profile?tab=activity')
  showUserMenu.value = false
}

const handleSecurity = () => {
  console.log('Security clicked')
  router.push('/profile?tab=security')
  showUserMenu.value = false
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: 3px;
  opacity: 0.3;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  opacity: 0.6;
}
</style>
