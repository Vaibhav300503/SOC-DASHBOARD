<template>
  <div class="relative" ref="dropdownRef">
    <!-- Profile Button -->
    <button
      @click="toggleDropdown"
      class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
      :class="{ 'bg-white/5': isOpen }"
    >
      <div class="relative">
        <img
          v-if="userStore.avatar"
          :src="userStore.avatar"
          :alt="userStore.fullName"
          class="w-8 h-8 rounded-full object-cover ring-2 ring-cyber-400"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-white font-semibold text-sm"
        >
          {{ getInitials() }}
        </div>
        <!-- Online indicator -->
        <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-dark-800"></div>
      </div>
      
      <div class="hidden md:block text-left">
        <div class="text-sm font-medium text-slate-dark-100">{{ userStore.fullName }}</div>
        <div class="text-xs text-slate-dark-400 capitalize">{{ userStore.role }}</div>
      </div>
      
      <i class="fas fa-chevron-down text-slate-dark-400 text-xs transition-transform" 
         :class="{ 'rotate-180': isOpen }"></i>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 dropdown-cyber z-50"
      >
        <!-- Profile Header -->
        <div class="p-4 border-b border-slate-dark-700">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img
                v-if="userStore.avatar"
                :src="userStore.avatar"
                :alt="userStore.fullName"
                class="w-12 h-12 rounded-full object-cover ring-2 ring-cyber-400"
                @error="handleImageError"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-white font-bold"
              >
                {{ getInitials() }}
              </div>
              <!-- Online indicator -->
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-dark-800"></div>
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-slate-dark-100 truncate">{{ userStore.fullName }}</h3>
              <p class="text-xs text-slate-dark-400 truncate">{{ userStore.user?.email }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getRoleBadgeClass()">
                  {{ userStore.role }}
                </span>
                <span class="text-xs text-slate-dark-500">{{ userStore.user?.department }}</span>
              </div>
            </div>
          </div>
          
          <!-- Profile Completion -->
          <div class="mt-3">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-slate-dark-400">Profile Completion</span>
              <span class="text-cyber-400 font-medium">{{ userStore.profileCompletion }}%</span>
            </div>
            <div class="w-full bg-slate-dark-700 rounded-full h-1.5">
              <div
                class="bg-gradient-to-r from-cyber-400 to-cyber-600 h-1.5 rounded-full transition-all duration-300"
                :style="{ width: `${userStore.profileCompletion}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="p-4 border-b border-slate-dark-700">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-lg font-bold text-cyber-400">{{ formatNumber(userStore.stats?.loginCount || 0) }}</div>
              <div class="text-xs text-slate-dark-400">Logins</div>
            </div>
            <div>
              <div class="text-lg font-bold text-neon-green">{{ formatNumber(userStore.stats?.alertsCreated || 0) }}</div>
              <div class="text-xs text-slate-dark-400">Alerts</div>
            </div>
            <div>
              <div class="text-lg font-bold text-purple-400">{{ formatNumber(userStore.stats?.reportsGenerated || 0) }}</div>
              <div class="text-xs text-slate-dark-400">Reports</div>
            </div>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="p-2">
          <!-- View Profile -->
    <button
            @click="viewProfile"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <i class="fas fa-user text-slate-dark-400 w-4"></i>
            <span class="text-sm text-slate-dark-200">View Profile</span>
          </button>

          <!-- Update Profile -->
          <button
            @click="updateProfile"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <i class="fas fa-edit text-slate-dark-400 w-4"></i>
            <span class="text-sm text-slate-dark-200">Update Profile</span>
          </button>

          <!-- Settings -->
          <button
            @click="openSettings"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <i class="fas fa-cog text-slate-dark-400 w-4"></i>
            <span class="text-sm text-slate-dark-200">Settings</span>
          </button>

          <!-- Activity Monitor -->
          <button
            @click="openActivity"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <i class="fas fa-chart-line text-slate-dark-400 w-4"></i>
            <span class="text-sm text-slate-dark-200">Activity Monitor</span>
          </button>

          <!-- Security -->
          <button
            @click="openSecurity"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <i class="fas fa-shield-alt text-slate-dark-400 w-4"></i>
            <span class="text-sm text-slate-dark-200">Security</span>
            <span v-if="!userStore.user?.security?.twoFactorEnabled" 
                  class="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
              2FA Off
            </span>
          </button>

          <div class="border-t border-slate-dark-700 my-2"></div>

          <!-- Logout -->
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 transition-colors text-left group"
          >
            <i class="fas fa-sign-out-alt text-slate-dark-400 group-hover:text-red-400 w-4 transition-colors"></i>
            <span class="text-sm text-slate-dark-200 group-hover:text-red-400 transition-colors">Logout</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { useToast } from '../composables/useToast.js'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const { addToast } = useToast()

const isOpen = ref(false)
const dropdownRef = ref(null)

// Initialize user on mount
onMounted(async () => {
  if (authStore.isAuthenticated && !userStore.user) {
    // Try to initialize from API first
    await userStore.initializeUser()
    
    // If still no user, generate mock data for development
    if (!userStore.user) {
      userStore.generateMockUser()
    }
    
    await userStore.loadStats()
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

const getInitials = () => {
  if (!userStore.user) return 'U'
  const first = userStore.user.firstName?.[0] || 'U'
  const last = userStore.user.lastName?.[0] || ''
  return (first + last).toUpperCase()
}

const getRoleBadgeClass = () => {
  const role = userStore.role
  switch (role) {
    case 'admin':
      return 'bg-red-500/20 text-red-400'
    case 'analyst':
      return 'bg-blue-500/20 text-blue-400'
    case 'viewer':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const handleImageError = (event) => {
  // Fallback to initials if image fails to load
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  const fallback = parent.querySelector('div')
  if (fallback) fallback.style.display = 'flex'
}

const viewProfile = () => {
  isOpen.value = false
  router.push('/profile?tab=profile')
}

const updateProfile = () => {
  isOpen.value = false
  router.push('/profile?tab=profile')
}

const openSettings = () => {
  isOpen.value = false
  router.push('/profile?tab=settings')
}

const openActivity = () => {
  isOpen.value = false
  router.push('/profile?tab=activity')
}

const openSecurity = () => {
  isOpen.value = false
  router.push('/profile?tab=security')
}

const handleLogout = async () => {
  isOpen.value = false
  
  // Show loading screen
  if (window.showLoading) {
    window.showLoading('Logging Out', 'secure your session')
  }
  
  try {
    // Add a small delay to show the loading screen
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Logout from both stores
    await Promise.all([
      userStore.logout(),
      authStore.logout()
    ])
    
    // Clear all session-related localStorage data
    localStorage.removeItem('token')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('lastActionTime')
    localStorage.removeItem('activityCount')
    
    // Clear any session cookies if they exist
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    addToast('Logged out successfully', 'success')
    router.push('/login')
  } catch (error) {
    addToast('Logout failed', 'error')
  } finally {
    // Hide loading screen
    if (window.hideLoading) {
      window.hideLoading()
    }
  }
}
</script>
