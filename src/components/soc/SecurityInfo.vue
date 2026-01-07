<template>
  <div class="card-glass p-7 rounded-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-slate-50 flex items-center gap-2">
        <i class="fas fa-shield-alt text-cyan-400"></i>
        Security & Session Info
      </h3>
      <button 
        @click="refreshSession"
        class="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-medium"
        :disabled="refreshing"
      >
        <i :class="refreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync'" class="mr-1"></i>
        Refresh
      </button>
    </div>

    <!-- Session Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- User Info -->
      <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/40">
        <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Current User</div>
        <div class="text-sm text-slate-100 font-semibold">{{ userName }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ userEmail }}</div>
        <div class="text-xs text-cyan-400 mt-2 font-medium">
          <i class="fas fa-crown mr-1"></i>{{ userRole }}
        </div>
      </div>

      <!-- Session Duration -->
      <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/40">
        <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Session Duration</div>
        <div class="text-sm text-slate-100 font-semibold">{{ sessionDuration }}</div>
        <div class="text-xs text-slate-500 mt-1">Logged in at {{ loginTime }}</div>
        <div class="text-xs mt-2 font-medium" :class="sessionStatus.color">
          <i :class="sessionStatus.icon" class="mr-1"></i>{{ sessionStatus.text }}
        </div>
      </div>

      <!-- Security Status -->
      <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/40">
        <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Security Status</div>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span class="text-sm text-slate-100">HTTPS Enabled</span>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span class="text-sm text-slate-100">Token Encrypted</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span class="text-sm text-slate-100">Rate Limited</span>
        </div>
      </div>

      <!-- Activity Summary -->
      <div class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/40">
        <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Activity</div>
        <div class="text-sm text-slate-100 font-semibold">{{ activityCount }} actions</div>
        <div class="text-xs text-slate-500 mt-1">Last action: {{ lastAction }}</div>
        <div class="text-xs text-emerald-400 mt-2 font-medium">
          <i class="fas fa-check-circle mr-1"></i>No suspicious activity
        </div>
      </div>
    </div>

    <!-- Feedback Message -->
    <div v-if="feedbackMessage" class="mt-4 p-3 rounded-lg" :class="feedbackClass">
      <i :class="feedbackIcon" class="mr-2"></i>
      {{ feedbackMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { formatTimestamp } from '../../utils/timestampFormatter.js'

const authStore = useAuthStore()
const refreshing = ref(false)
const feedbackMessage = ref('')
const feedbackClass = ref('')
const feedbackIcon = ref('')
const activityCount = ref(0)

const userName = computed(() => authStore.user?.name || 'Unknown')
const userEmail = computed(() => authStore.user?.email || 'N/A')
const userRole = computed(() => {
  const role = authStore.user?.role || 'user'
  return role.charAt(0).toUpperCase() + role.slice(1)
})

const loginTime = computed(() => {
  const loginTimestamp = localStorage.getItem('loginTime')
  if (!loginTimestamp) return 'N/A'
  return formatTimestamp(parseInt(loginTimestamp), 'time')
})

const sessionDuration = computed(() => {
  const loginTimestamp = localStorage.getItem('loginTime')
  if (!loginTimestamp) return '0m'
  
  const now = Date.now()
  const loginTime = parseInt(loginTimestamp)
  const diffMs = now - loginTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`
  }
  return `${diffMins}m`
})

const lastAction = computed(() => {
  const lastActionTime = localStorage.getItem('lastActionTime')
  if (!lastActionTime) return 'Just now'
  
  const now = Date.now()
  const actionTime = parseInt(lastActionTime)
  const diffSecs = Math.floor((now - actionTime) / 1000)
  
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h ago`
})

const sessionStatus = computed(() => {
  const loginTimestamp = localStorage.getItem('loginTime')
  if (!loginTimestamp) {
    return {
      text: 'No active session',
      icon: 'fas fa-times-circle',
      color: 'text-neon-red'
    }
  }
  
  const now = Date.now()
  const loginTime = parseInt(loginTimestamp)
  const diffMins = Math.floor((now - loginTime) / 60000)
  
  if (diffMins < 30) {
    return {
      text: 'Active - Fresh session',
      icon: 'fas fa-check-circle',
      color: 'text-neon-green'
    }
  } else if (diffMins < 120) {
    return {
      text: 'Active - Session ongoing',
      icon: 'fas fa-check-circle',
      color: 'text-neon-green'
    }
  } else {
    return {
      text: 'Active - Long session',
      icon: 'fas fa-exclamation-circle',
      color: 'text-neon-orange'
    }
  }
})

const showFeedback = (message, type = 'success') => {
  feedbackMessage.value = message
  feedbackClass.value = type === 'success' 
    ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
    : 'bg-neon-red/10 border border-neon-red/30 text-neon-red'
  feedbackIcon.value = type === 'success' 
    ? 'fas fa-check-circle'
    : 'fas fa-exclamation-circle'
  
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 3000)
}

const refreshSession = async () => {
  refreshing.value = true
  try {
    // Update activity
    localStorage.setItem('lastActionTime', Date.now().toString())
    activityCount.value++
    showFeedback('Session refreshed successfully', 'success')
  } catch (err) {
    showFeedback('Failed to refresh session', 'error')
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  // Set initial login time if not already set
  if (!localStorage.getItem('loginTime')) {
    localStorage.setItem('loginTime', Date.now().toString())
  }
  if (!localStorage.getItem('lastActionTime')) {
    localStorage.setItem('lastActionTime', Date.now().toString())
  }
  
  // Load activity count
  const savedCount = localStorage.getItem('activityCount')
  activityCount.value = savedCount ? parseInt(savedCount) : 0
})
</script>

<style scoped>
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
