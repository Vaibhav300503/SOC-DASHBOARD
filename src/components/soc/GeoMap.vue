<template>
  <div class="card-glass p-6 rounded-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-slate-dark-50">Global Activity Heatmap</h3>
      <div class="flex gap-2">
        <button class="px-3 py-1 text-xs rounded-lg bg-cyber-600/20 text-cyber-400 border border-cyber-500/50 hover:bg-cyber-600/30">
          <i class="fas fa-globe mr-1"></i>World
        </button>
      </div>
    </div>

    <div class="relative w-full h-96 bg-slate-dark-900/50 rounded-lg overflow-hidden border border-slate-dark-700/50">
      <!-- SVG World Map Background -->
      <svg class="w-full h-full" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet">
        <!-- Simple world map outline -->
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(91, 109, 255, 0.05)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="960" height="600" fill="url(#grid)" />

        <!-- Continents (simplified) -->
        <g fill="rgba(30, 41, 59, 0.5)" stroke="rgba(91, 109, 255, 0.2)" stroke-width="1">
          <!-- North America -->
          <ellipse cx="200" cy="150" rx="80" ry="100" />
          <!-- South America -->
          <ellipse cx="280" cy="350" rx="50" ry="80" />
          <!-- Europe -->
          <ellipse cx="480" cy="120" rx="60" ry="50" />
          <!-- Africa -->
          <ellipse cx="520" cy="300" rx="70" ry="100" />
          <!-- Asia -->
          <ellipse cx="680" cy="200" rx="120" ry="100" />
          <!-- Australia -->
          <ellipse cx="780" cy="420" rx="40" ry="50" />
        </g>
      </svg>

      <!-- Heat points overlay -->
      <div class="absolute inset-0">
        <div
          v-for="point in heatPoints"
          :key="point.id"
          class="absolute rounded-full animate-pulse-glow"
          :style="{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: `${point.size}px`,
            height: `${point.size}px`,
            backgroundColor: point.color,
            boxShadow: `0 0 ${point.size}px ${point.color}`,
            transform: 'translate(-50%, -50%)',
          }"
        />
      </div>

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 bg-slate-dark-800/80 backdrop-blur-sm border border-slate-dark-700 rounded-lg p-3 text-xs">
        <div class="font-semibold text-slate-dark-200 mb-2">Activity Intensity</div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-neon-red"></div>
            <span class="text-slate-dark-400">Critical</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-neon-orange"></div>
            <span class="text-slate-dark-400">High</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span class="text-slate-dark-400">Medium</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats below map -->
    <div class="grid grid-cols-4 gap-4 mt-6">
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-neon-red">{{ stats.critical }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">Critical Events</div>
      </div>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-neon-orange">{{ stats.high }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">High Events</div>
      </div>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-yellow-500">{{ stats.medium }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">Medium Events</div>
      </div>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-neon-green">{{ stats.low }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">Low Events</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLogStore } from '../../stores/logStore'

const logStore = useLogStore()

const stats = computed(() => ({
  critical: logStore.criticalCount,
  high: logStore.highCount,
  medium: logStore.mediumCount,
  low: logStore.lowCount,
}))

const heatPoints = computed(() => {
  return logStore.geoHeatmap.map((point, idx) => ({
    id: idx,
    x: ((point.lon + 180) / 360) * 100,
    y: ((90 - point.lat) / 180) * 100,
    size: Math.min(20, 5 + Math.log(point.count + 1) * 3),
    color: point.count > 100 ? '#ff0055' : point.count > 50 ? '#ff6b35' : point.count > 20 ? '#ffd700' : '#00ff88',
  }))
})
</script>
