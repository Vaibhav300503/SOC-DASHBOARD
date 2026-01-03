<template>
  <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar bg-gradient-to-r from-slate-800/30 to-slate-700/30">
    <!-- Navigation Items -->
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :class="[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'text-slate-400 hover:text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-600/10',
        isActive(item.path) && 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
      ]"
      :title="isCollapsed ? item.label : ''"
    >
      <i :class="item.icon" class="w-5 text-center flex-shrink-0"></i>
      <span v-if="!isCollapsed" class="text-base font-medium whitespace-nowrap">{{ item.label }}</span>
      <span
        v-if="item.badge && !isCollapsed"
        class="ml-auto text-xs font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full"
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
  { path: '/geo-analytics', label: 'Geo Analytics', icon: 'fas fa-globe' },
  { path: '/ip-analytics', label: 'IP Analytics', icon: 'fas fa-network-wired' },
  { path: '/log-types', label: 'Log Types', icon: 'fas fa-list' },
  { path: '/endpoints', label: 'Endpoints', icon: 'fas fa-server' },
  { path: '/severity', label: 'Severity', icon: 'fas fa-exclamation-triangle' },
  { path: '/tailscale', label: 'Tailscale', icon: 'fas fa-link' },
  { path: '/log-viewer', label: 'Log Viewer', icon: 'fas fa-file-code' },
]

const isActive = (path) => {
  return route.path === path
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
