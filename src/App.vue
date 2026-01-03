<template>
  <div class="min-h-screen relative">
    <!-- Left Sidebar Navigation -->
    <LeftSidebar v-if="authStore.isAuthenticated" />

    <!-- Main Content Area with proper offset -->
    <div
      v-if="authStore.isAuthenticated"
      :class="[
        'transition-all duration-sidebar',
        sidebarStore.isCollapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar-expanded'
      ]"
    >
      <MainContent>
        <router-view />
      </MainContent>
    </div>

    <!-- Fallback for non-authenticated pages -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import LeftSidebar from './components/layout/LeftSidebar.vue'
import MainContent from './components/layout/MainContent.vue'
import { useUserStore } from './stores/userStore.js'
import { useAuthStore } from './stores/authStore.js'
import { useSidebarStore } from './stores/sidebarStore.js'
import { setupInterceptors } from './api/interceptors'

const userStore = useUserStore()
const authStore = useAuthStore()
const sidebarStore = useSidebarStore()

// Setup axios interceptors
setupInterceptors()

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

// Initialize user on app startup
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await userStore.initializeUser()
    await userStore.loadStats()
  }
})
</script>

