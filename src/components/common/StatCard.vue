<template>
  <div
    :class="[
      'rounded-xl border backdrop-blur-sm p-5',
      'bg-gradient-to-br from-slate-800/40 to-slate-900/40',
      'transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20',
      'border-slate-700/30 hover:border-cyan-500/50',
      'group relative overflow-hidden',
      accentClass
    ]"
  >
    <!-- Animated gradient background on hover -->
    <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

    <!-- Top accent line -->
    <div :class="['h-0.5 -mx-5 -mt-5 mb-4 transition-all duration-300', accentLineClass]"></div>

    <!-- Header -->
    <div class="flex items-start justify-between mb-3 relative z-10">
      <div>
        <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">{{ label }}</p>
        <p v-if="sublabel" class="text-xs text-slate-500 mt-0.5">{{ sublabel }}</p>
      </div>
      <div
        v-if="icon"
        :class="[
          'w-9 h-9 rounded-lg flex items-center justify-center',
          'transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
          iconBgClass
        ]"
      >
        <i :class="[icon, iconColorClass, 'text-sm transition-all duration-300']"></i>
      </div>
    </div>

    <!-- Value -->
    <div class="mb-2 relative z-10">
      <div :class="['text-3xl font-bold transition-all duration-300 group-hover:scale-105 origin-left', valueColorClass]">
        {{ formattedValue }}
      </div>
    </div>

    <!-- Change indicator -->
    <div v-if="change !== null" class="flex items-center gap-1 relative z-10">
      <i
        :class="[
          'text-xs transition-all duration-300',
          change >= 0 ? 'fas fa-arrow-up text-emerald-400 group-hover:translate-y-[-2px]' : 'fas fa-arrow-down text-red-400 group-hover:translate-y-[2px]'
        ]"
      ></i>
      <span
        :class="[
          'text-xs font-medium transition-all duration-300',
          change >= 0 ? 'text-emerald-400' : 'text-red-400'
        ]"
      >
        {{ Math.abs(change) }}% {{ change >= 0 ? 'increase' : 'decrease' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  sublabel: {
    type: String,
    default: ''
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    default: 'normal',
    validator: (value) => ['critical', 'high', 'medium', 'low', 'normal', 'info'].includes(value)
  },
  change: {
    type: Number,
    default: null
  },
  format: {
    type: String,
    default: 'number',
    validator: (value) => ['number', 'percent', 'bytes'].includes(value)
  }
})

const severityColors = {
  critical: {
    value: 'text-red-400',
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    line: 'bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0'
  },
  high: {
    value: 'text-orange-400',
    bg: 'bg-orange-500/10',
    icon: 'text-orange-400',
    line: 'bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0'
  },
  medium: {
    value: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    line: 'bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0'
  },
  low: {
    value: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    line: 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0'
  },
  normal: {
    value: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-400',
    line: 'bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0'
  },
  info: {
    value: 'text-purple-400',
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    line: 'bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0'
  }
}

const valueColorClass = computed(() => severityColors[props.severity].value)
const iconBgClass = computed(() => severityColors[props.severity].bg)
const iconColorClass = computed(() => severityColors[props.severity].icon)
const accentLineClass = computed(() => severityColors[props.severity].line)
const accentClass = computed(() => {
  const colors = {
    critical: 'border-l-4 border-l-red-500/50',
    high: 'border-l-4 border-l-orange-500/50',
    medium: 'border-l-4 border-l-yellow-500/50',
    low: 'border-l-4 border-l-emerald-500/50',
    normal: 'border-l-4 border-l-cyan-500/50',
    info: 'border-l-4 border-l-purple-500/50'
  }
  return colors[props.severity] || colors.normal
})

const formattedValue = computed(() => {
  if (props.format === 'percent') {
    return `${props.value}%`
  } else if (props.format === 'bytes') {
    const bytes = Number(props.value)
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
  return Number(props.value).toLocaleString()
})
</script>
