<template>
  <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar bg-app-secondary">
    <!-- Navigation Items -->
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :class="[
        'flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200',
        'text-text-secondary hover:text-accent-primary hover:bg-hover-overlay',
        isActive(item.path) && 'bg-active-bg text-accent-primary border border-active-border'
      ]"
      :title="isCollapsed ? item.label : ''"
    >
      <i :class="item.icon" class="w-5 text-center flex-shrink-0"></i>
      <span v-if="!isCollapsed" class="text-sm font-medium whitespace-nowrap">{{ item.label }}</span>
      <span
        v-if="item.badge && !isCollapsed"
        class="ml-auto text-xs font-semibold bg-red-600/30 text-red-400 px-2 py-0.5 rounded-full"
      >
        {{ item.badge }}
      </span>
    </router-link>


  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'fas fa-chart-line' },
  { path: '/log-viewer', label: 'Raw Logs', icon: 'fas fa-file-code' },
  { path: '/geo-analytics', label: 'Geo Analytics', icon: 'fas fa-globe' },
  { path: '/ip-analytics', label: 'IP Analytics', icon: 'fas fa-network-wired' },
  { path: '/log-types', label: 'Log Viewer', icon: 'fas fa-list' },
  { path: '/endpoints', label: 'Endpoints', icon: 'fas fa-server' },
  { path: '/severity', label: 'Severity', icon: 'fas fa-exclamation-triangle' },
  { path: '/tailscale', label: 'Tailscale', icon: 'fas fa-link' },
]

const isActive = (path) => {
  return route.path === path
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: 2px;
  opacity: 0.2;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  opacity: 0.4;
}
</style>
