<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center">
    <!-- Blurred Background Overlay -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl"></div>
    
    <!-- Loading Content -->
    <div class="relative z-10 flex flex-col items-center space-y-6">
      <!-- Animated Logo/Icon -->
      <div class="relative">
        <div class="w-20 h-20 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center animate-pulse">
          <i class="fas fa-shield-alt text-black text-3xl"></i>
        </div>
        
        <!-- Rotating Ring -->
        <div class="absolute inset-0 border-4 border-accent-primary/20 border-t-accent-primary rounded-2xl animate-spin"></div>
      </div>
      
      <!-- Loading Text -->
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-black text-white tracking-widest uppercase">
          {{ message }}
        </h2>
        <p class="text-slate-400 text-xs font-mono">
          SYSTEM_BUSY: {{ subMessage }}...
        </p>
      </div>
      
      <!-- Progress Dots -->
      <div class="flex space-x-2">
        <div class="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style="animation-delay: 0ms"></div>
        <div class="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style="animation-delay: 150ms"></div>
        <div class="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style="animation-delay: 300ms"></div>
      </div>
      
      <!-- Optional Progress Bar -->
      <div v-if="showProgress" class="w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          class="h-full bg-gradient-to-r from-accent-primary via-accent-blue to-accent-secondary rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,240,255,0.5)]"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: 'Loading'
  },
  subMessage: {
    type: String,
    default: 'process your request'
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}
</style>
