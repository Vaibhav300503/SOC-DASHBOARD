<template>
  <div class="relative inline-block w-full">
    <button
      @click="isOpen = !isOpen"
      @blur="closeDropdown"
      class="w-full bg-gradient-to-r from-slate-800/50 to-slate-900/50 text-slate-300 px-4 py-2.5 rounded-lg border border-slate-700/50 text-sm hover:border-cyan-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 backdrop-blur-sm flex items-center justify-between"
      :class="{ 'border-cyan-500/50 ring-2 ring-cyan-500/30': isOpen }"
    >
      <span>{{ selectedLabel }}</span>
      <i :class="['fas fa-chevron-down', { 'rotate-180': isOpen }]" class="text-xs transition-transform duration-300"></i>
    </button>

    <!-- Glassmorphic Dropdown Menu -->
    <Transition
      name="dropdown-menu"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="isOpen"
        class="absolute top-full left-0 right-0 mt-2 z-50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-lg shadow-2xl backdrop-blur-xl overflow-hidden"
        :style="{ minWidth: '100%' }"
        @mousedown.prevent="onDropdownMouseDown"
      >
        <!-- Glassmorphic Background Blur Enhancement -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-900/20 pointer-events-none"></div>
        
        <!-- Border Glow Effect -->
        <div class="absolute inset-0 border border-cyan-500/20 rounded-lg pointer-events-none"></div>

        <!-- Menu Items Container -->
        <div class="relative z-10 max-h-60 overflow-y-auto custom-scrollbar">
          <div
            v-for="(option, index) in options"
            :key="index"
            @click="selectOption(option)"
            class="px-4 py-3 text-sm text-slate-300 hover:text-cyan-300 cursor-pointer transition-all duration-200 border-b border-slate-700/30 last:border-b-0 group relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-300 border-l-2 border-l-cyan-500': modelValue === option.value,
              'hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-cyan-500/5': modelValue !== option.value
            }"
          >
            <!-- Highlight Background Animation -->
            <div v-if="modelValue === option.value" class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <!-- Text Content -->
            <div class="relative z-10 flex items-center gap-2">
              <i v-if="modelValue === option.value" class="fas fa-check text-xs text-cyan-400"></i>
              <span v-else class="w-4"></span>
              {{ option.label }}
            </div>
          </div>
        </div>

        <!-- Top Border Glow -->
        <div class="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 blur-sm"></div>
      </div>
    </Transition>

    <!-- Backdrop Enhancement Overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'all'
  },
  options: {
    type: Array,
    required: true,
    validator: (arr) => arr.every(opt => opt.value && opt.label)
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : props.modelValue
})

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const closeDropdown = () => {
  // Small delay to allow click to register
  setTimeout(() => {
    isOpen.value = false
  }, 100)
}

const onDropdownMouseDown = (e) => {
  // Prevent blur from closing dropdown when clicking inside it
  e.preventDefault()
}

const onEnter = (el) => {
  el.style.opacity = '0'
  el.style.transform = 'translateY(-8px)'
  el.offsetHeight // Trigger reflow
  el.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
  el.style.opacity = '1'
  el.style.transform = 'translateY(0)'
}

const onLeave = (el) => {
  el.style.transition = 'all 0.15s ease-in'
  el.style.opacity = '0'
  el.style.transform = 'translateY(-8px)'
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 240, 255, 0.4) rgba(30, 41, 59, 0.2);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(0, 240, 255, 0.4), rgba(0, 240, 255, 0.2));
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(0, 240, 255, 0.6), rgba(0, 240, 255, 0.4));
}

.dropdown-menu-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-menu-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-menu-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-menu-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-menu-leave-active {
  transition: all 0.15s ease-in;
}
</style>