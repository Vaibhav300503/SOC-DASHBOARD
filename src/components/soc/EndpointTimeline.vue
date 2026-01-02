<template>
  <div class="card-glass p-6 rounded-xl">
    <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Activity Timeline</h3>

    <div class="space-y-4">
      <div v-for="(event, idx) in timelineEvents" :key="idx" class="flex gap-4">
        <!-- Timeline marker -->
        <div class="flex flex-col items-center">
          <div
            class="w-3 h-3 rounded-full mt-2"
            :style="{ backgroundColor: getSeverityColor(event.severity) }"
          />
          <div v-if="idx < timelineEvents.length - 1" class="w-0.5 h-12 bg-slate-dark-700/50 my-1" />
        </div>

        <!-- Event content -->
        <div class="flex-1 pb-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-dark-50">{{ event.title }}</p>
              <p class="text-xs text-slate-dark-400 mt-1">{{ event.description }}</p>
            </div>
            <span :class="['badge-' + event.severity.toLowerCase()]">
              {{ event.severity }}
            </span>
          </div>
          <div class="text-xs text-slate-dark-500 mt-2">
            <i class="fas fa-clock mr-1"></i>{{ formatTime(event.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAPIStore } from '../../stores/apiStore'

const apiStore = useAPIStore()

onMounted(async () => {
  await apiStore.fetchRecentLogs(100)
})

const timelineEvents = computed(() => {
  return apiStore.logs.slice(0, 10).map(log => ({
    title: `${log.log_type} Event`,
    description: `${log.raw.action} from ${log.source_ip} to ${log.endpoint}`,
    severity: log.severity,
    timestamp: log.timestamp
  }))
})

const getSeverityColor = (severity) => {
  const colors = {
    'Critical': '#ff0055',
    'High': '#ff6b35',
    'Medium': '#ffd700',
    'Low': '#00ff88'
  }
  return colors[severity] || '#6b7280'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}
</script>
          
