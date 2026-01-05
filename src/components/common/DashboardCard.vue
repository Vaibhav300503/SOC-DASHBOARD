<template>
  <div
    :class="[
      'rounded-lg border backdrop-blur-sm',
      'bg-card-primary',
      'transition-all duration-300 hover:shadow-card-hover hover:border-card-border-hover',
      'overflow-hidden group relative',
      sizeClasses
    ]"
  >
    <!-- Animated gradient background on hover -->
    <div class="absolute inset-0 bg-hover-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

    <!-- Top accent line with animation -->
    <div class="h-px bg-gradient-to-r from-accent-primary/0 via-accent-primary/30 to-accent-primary/0 group-hover:via-accent-primary/50 transition-all duration-300"></div>

    <!-- Card Content -->
    <div class="p-6 relative z-10">
      <!-- Header -->
      <div v-if="title || $slots.header" class="mb-4">
        <slot name="header">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-sm font-semibold text-text-primary-headings group-hover:text-accent-primary transition-colors duration-300">{{ title }}</h3>
              <p v-if="subtitle" class="text-xs text-text-muted mt-1">{{ subtitle }}</p>
            </div>
            <slot name="header-action"></slot>
          </div>
        </slot>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div class="h-8 bg-card-secondary rounded animate-shimmer"></div>
        <div class="h-4 bg-card-secondary rounded w-3/4 animate-shimmer"></div>
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
    <div v-if="$slots.footer" class="border-t border-card-border-default px-6 py-3 bg-card-secondary relative z-10">
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
  box-shadow: var(--shadow-card-hover);
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
  background: linear-gradient(90deg, transparent, var(--hover-overlay), transparent);
  background-size: 1000px 100%;
}
</style>
