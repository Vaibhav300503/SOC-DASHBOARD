<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-r border-cyan-500/20',
      'transition-all duration-sidebar z-40',
      isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar-expanded',
      'flex flex-col overflow-hidden backdrop-blur-sm'
    ]"
  >
    <!-- Logo Section -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
      <div
        v-if="!isCollapsed"
        class="flex items-center gap-3 flex-1"
      >
        <div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <i class="fas fa-shield-alt text-white text-sm"></i>
        </div>
        <span class="text-sm font-bold text-slate-50 tracking-tight whitespace-nowrap">SOC</span>
      </div>
      <button
        @click="toggleSidebar"
        class="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'" class="text-xs"></i>
      </button>
    </div>

    <!-- Navigation Section -->
    <SidebarNavigation :isCollapsed="isCollapsed" />

    <!-- User Section -->
    <div class="border-t border-cyan-500/20 p-3 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
      <button
        @click="toggleUserMenu"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-600/10 transition-all duration-200 text-slate-400 hover:text-cyan-300'
        ]"
      >
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20 relative">
          <i class="fas fa-user text-white text-xs"></i>
          <!-- Online indicator -->
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-800"></div>
        </div>
        <div v-if="!isCollapsed" class="flex-1 text-left min-w-0">
          <div class="text-xs font-medium text-cyan-300 truncate">{{ userName }}</div>
          <div class="text-xs text-slate-500 truncate">{{ userRole }}</div>
        </div>
        <i v-if="!isCollapsed" class="fas fa-chevron-down text-xs flex-shrink-0 text-cyan-400"></i>
      </button>

      <!-- User Menu Dropdown -->
      <div
        v-if="showUserMenu && !isCollapsed"
        class="mt-2 bg-gradient-to-r from-slate-800/70 to-slate-700/70 rounded-lg border border-cyan-500/20 overflow-hidden backdrop-blur-sm"
      >
        <!-- Profile Stats (Mini Version) -->
        <div class="px-3 py-2 border-b border-cyan-500/20">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <div class="text-xs font-bold text-cyan-400">24</div>
              <div class="text-xs text-slate-500">Logins</div>
            </div>
            <div>
              <div class="text-xs font-bold text-green-400">12</div>
              <div class="text-xs text-slate-500">Alerts</div>
            </div>
            <div>
              <div class="text-xs font-bold text-purple-400">8</div>
              <div class="text-xs text-slate-500">Reports</div>
            </div>
          </div>
        </div>

        <button
          @click="handleProfile"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
        >
          <i class="fas fa-user-circle"></i>
          <span>View Profile</span>
        </button>
        <button
          @click="handleSettings"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
        >
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </button>
        <button
          @click="handleActivity"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
        >
          <i class="fas fa-chart-line"></i>
          <span>Activity</span>
        </button>
        <button
          @click="handleSecurity"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
        >
          <i class="fas fa-shield-alt"></i>
          <span>Security</span>
          <span class="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">2FA</span>
        </button>
        <div class="border-t border-cyan-500/20"></div>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useSidebarStore } from '../../stores/sidebarStore'
import SidebarNavigation from './SidebarNavigation.vue'

const router = useRouter()
const authStore = useAuthStore()
const sidebarStore = useSidebarStore()

const isCollapsed = computed({
  get: () => sidebarStore.isCollapsed,
  set: (value) => sidebarStore.setCollapsed(value)
})

const showUserMenu = ref(false)

const userName = computed(() => authStore.user?.name || 'User')
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
  background: rgba(0, 225, 255, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 225, 255, 0.4);
}
</style>
