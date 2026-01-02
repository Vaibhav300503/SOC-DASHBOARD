<template>
  <div class="card-glass p-6 rounded-xl">
    <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Severity Distribution</h3>

    <div class="space-y-4">
      <div v-for="item in severityData" :key="item.name" class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
            <span class="text-sm font-medium text-slate-dark-300">{{ item.name }}</span>
          </div>
          <span class="text-sm font-bold text-slate-dark-50">{{ item.value }}</span>
        </div>
        <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{
              width: `${(item.value / totalLogs) * 100}%`,
              backgroundColor: item.color,
              boxShadow: `0 0 10px ${item.color}`,
            }"
          />
        </div>
        <div class="text-xs text-slate-dark-400">
          {{ ((item.value / totalLogs) * 100).toFixed(1) }}% of total
        </div>
      </div>
    </div>

    <div class="mt-6 pt-6 border-t border-slate-dark-700/50">
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-dark-400">Total Events</span>
        <span class="text-2xl font-bold text-cyber-400">{{ totalLogs }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAPIStore } from '../../stores/apiStore'

const apiStore = useAPIStore()

const severityData = computed(() => {
  const severityMap = {
    'Critical': { name: 'Critical', color: '#ff0055' },
    'High': { name: 'High', color: '#ff6b35' },
    'Medium': { name: 'Medium', color: '#ffd700' },
    'Low': { name: 'Low', color: '#00ff88' }
  }
  
  return apiStore.severityBreakdown.map(item => ({
    name: severityMap[item._id]?.name || item._id,
    value: item.count,
    color: severityMap[item._id]?.color || '#5b6dff'
  }))
})

const totalLogs = computed(() => apiStore.total)
</script>
