<template>
  <div
    :class="[
      'rounded-xl border border-slate-700/30 backdrop-blur-sm',
      'bg-gradient-to-br from-slate-800/40 to-slate-900/40',
      'transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50',
      'overflow-hidden group relative',
      sizeClasses
    ]"
  >
    <!-- Animated gradient background on hover -->
    <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

    <!-- Top accent line with animation -->
    <div class="h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 group-hover:via-cyan-500/100 transition-all duration-300"></div>

    <!-- Card Content -->
    <div class="p-6 relative z-10">
      <!-- Header -->
      <div v-if="title || $slots.header" class="mb-4">
        <slot name="header">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-sm font-semibold text-slate-50 group-hover:text-cyan-400 transition-colors duration-300">{{ title }}</h3>
              <p v-if="subtitle" class="text-xs text-slate-400 mt-1">{{ subtitle }}</p>
            </div>
            <slot name="header-action"></slot>
          </div>
        </slot>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div class="h-8 bg-gradient-to-r from-slate-700/30 via-slate-600/30 to-slate-700/30 rounded animate-shimmer"></div>
        <div class="h-4 bg-gradient-to-r from-slate-700/30 via-slate-600/30 to-slate-700/30 rounded w-3/4 animate-shimmer"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <i class="fas fa-exclamation-circle text-red-400 text-3xl mb-2 block animate-pulse"></i>
        <p class="text-sm text-red-400">{{ error }}</p>
      </div>

      <!-- Main Content -->
      <div v-else>
        <slot></slot>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="border-t border-slate-700/30 px-6 py-3 bg-slate-900/20 relative z-10">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'full'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const sizeClasses = computed(() => {
  const sizes = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
    full: 'col-span-full'
  }
  return sizes[props.size] || sizes.medium
})
</script>

<style scoped>
/* Smooth hover effect */
:deep(.group:hover) {
  --tw-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 225, 255, 0.15);
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  background-size: 1000px 100%;
}
</style>
