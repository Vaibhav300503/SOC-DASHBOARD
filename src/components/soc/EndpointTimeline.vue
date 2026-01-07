<template>
  <div class="card-glass p-6 rounded-xl">
    <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Activity Timeline</h3>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Recent Timeline Events (2/3 width) -->
      <div class="lg:col-span-2">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8 text-slate-500">
          <i class="fas fa-spinner fa-spin text-2xl mb-3 block opacity-50"></i>
          <p class="text-sm">Loading timeline...</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8 text-red-400">
          <i class="fas fa-exclamation-triangle text-2xl mb-3 block opacity-50"></i>
          <p class="text-sm">Error: {{ error }}</p>
          <button @click="$emit('retry')" class="text-xs text-cyan-400 hover:text-cyan-300 mt-2">
            Retry
          </button>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="recentTimelineEvents.length === 0" class="text-center py-8 text-slate-500">
          <i class="fas fa-clock text-2xl mb-3 block opacity-50"></i>
          <p class="text-sm">No recent activity</p>
          <p class="text-xs text-slate-600 mt-1">Events will appear here when detected</p>
        </div>
        
        <!-- Timeline Events (Compact) -->
        <div v-else class="space-y-3">
          <div v-for="(event, idx) in recentTimelineEvents" :key="idx" class="flex gap-3">
            <!-- Timeline marker (smaller) -->
            <div class="flex flex-col items-center">
              <div
                class="w-2.5 h-2.5 rounded-full mt-1.5"
                :style="{ backgroundColor: getSeverityColor(event.severity) }"
              />
              <div v-if="idx < recentTimelineEvents.length - 1" class="w-0.5 h-8 bg-slate-dark-700/50 my-1" />
            </div>

            <!-- Event content (compact) -->
            <div class="flex-1 pb-2">
              <div class="flex items-start justify-between">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-dark-50 truncate">{{ event.title }}</p>
                  <p class="text-xs text-slate-dark-400 mt-0.5 truncate">{{ event.description }}</p>
                </div>
                <div class="flex items-center gap-2 ml-3">
                  <span :class="['badge-' + event.severity.toLowerCase(), 'text-xs px-2 py-0.5']">
                    {{ event.severity }}
                  </span>
                </div>
              </div>
              <div class="text-xs text-slate-dark-500 mt-1">
                <i class="fas fa-clock mr-1"></i>{{ formatTimeAgo(event.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Activity Summary (1/3 width) -->
      <div class="space-y-4">
        <!-- Activity Stats -->
        <div class="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-lg p-4 border border-slate-700/40">
          <h4 class="text-sm font-semibold text-slate-300 mb-3 flex items-center">
            <i class="fas fa-chart-line mr-2 text-cyan-400"></i>
            Activity Stats
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400">Last Hour</span>
              <span class="text-sm font-bold text-cyan-400">{{ activityStats.lastHour }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400">Today</span>
              <span class="text-sm font-bold text-slate-300">{{ activityStats.today }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400">Critical Events</span>
              <span class="text-sm font-bold text-red-400">{{ activityStats.critical }}</span>
            </div>
          </div>
        </div>

        <!-- Top Event Types -->
        <div class="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-lg p-4 border border-slate-700/40">
          <h4 class="text-sm font-semibold text-slate-300 mb-3 flex items-center">
            <i class="fas fa-list mr-2 text-purple-400"></i>
            Top Event Types
          </h4>
          <div class="space-y-2">
            <div v-for="(type, idx) in topEventTypes" :key="idx" class="flex justify-between items-center">
              <span class="text-xs text-slate-400 truncate">{{ type.name }}</span>
              <div class="flex items-center gap-2">
                <div class="w-8 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    :style="{ width: `${(type.count / topEventTypes[0]?.count || 1) * 100}%` }"
                  />
                </div>
                <span class="text-xs font-medium text-slate-300 w-6 text-right">{{ type.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Endpoints -->
        <div class="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-lg p-4 border border-slate-700/40">
          <h4 class="text-sm font-semibold text-slate-300 mb-3 flex items-center">
            <i class="fas fa-server mr-2 text-green-400"></i>
            Active Endpoints
          </h4>
          <div class="space-y-2">
            <div v-for="(endpoint, idx) in activeEndpoints" :key="idx" class="flex justify-between items-center">
              <span class="text-xs text-slate-400 truncate font-mono">{{ endpoint.name }}</span>
              <div class="flex items-center gap-1">
                <div 
                  :class="[
                    'w-2 h-2 rounded-full',
                    endpoint.status === 'active' ? 'bg-green-400' : 'bg-slate-500'
                  ]"
                />
                <span class="text-xs text-slate-500">{{ endpoint.events }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import { formatTimestamp } from '../../utils/timestampFormatter.js'

const apiStore = useAPIStore()
const isLoading = ref(true)
const error = ref(null)

onMounted(async () => {
  console.log('EndpointTimeline: Component mounted')
  try {
    // Fetch recent logs if not already loaded
    if (!apiStore.logs || apiStore.logs.length === 0) {
      console.log('EndpointTimeline: Fetching logs...')
      await apiStore.fetchRecentLogs(100)
    }
    console.log('EndpointTimeline: Logs loaded:', apiStore.logs?.length || 0)
  } catch (err) {
    console.error('EndpointTimeline: Error loading logs:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  console.log('EndpointTimeline: Component unmounted')
})

// Watch for changes in logs to update timeline
watch(() => apiStore.logs, (newLogs) => {
  if (newLogs && newLogs.length > 0) {
    console.log('EndpointTimeline: Timeline updated with', newLogs.length, 'logs')
    error.value = null // Clear any previous errors
  }
}, { immediate: true })

// Show only 5 most recent events
const recentTimelineEvents = computed(() => {
  if (isLoading.value) {
    return []
  }
  
  if (!apiStore.logs || apiStore.logs.length === 0) {
    console.log('EndpointTimeline: No logs available for timeline')
    return []
  }
  
  const events = apiStore.logs
    .slice(0, 5) // Only show 5 most recent
    .map(log => {
      // Ensure we have valid data
      const logType = log.log_type || log.metadata?.log_source || 'System'
      const action = log.raw?.action || log.raw_data?.action || log.action || 'Activity'
      const sourceIp = log.source_ip || log.ip_address || 'Unknown'
      const endpoint = log.endpoint || log.metadata?.endpoint_name || 'Unknown'
      const severity = log.severity || log.metadata?.severity || 'Low'
      const timestamp = log.timestamp || log.ingested_at || log.created_at || new Date()
      
      return {
        title: `${logType} Event`,
        description: `${action} from ${sourceIp} to ${endpoint}`,
        severity: severity,
        timestamp: timestamp
      }
    })
    .filter(event => event.title && event.description) // Filter out invalid events
  
  console.log('EndpointTimeline: Generated', events.length, 'timeline events')
  return events
})

// Activity statistics for the right panel
const activityStats = computed(() => {
  if (!apiStore.logs || apiStore.logs.length === 0) {
    return { lastHour: 0, today: 0, critical: 0 }
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const lastHour = apiStore.logs.filter(log => {
    const logTime = new Date(log.timestamp || log.ingested_at)
    return logTime >= oneHourAgo
  }).length

  const today = apiStore.logs.filter(log => {
    const logTime = new Date(log.timestamp || log.ingested_at)
    return logTime >= todayStart
  }).length

  const critical = apiStore.logs.filter(log => 
    (log.severity || '').toLowerCase().includes('critical')
  ).length

  return { lastHour, today, critical }
})

// Top event types for the right panel
const topEventTypes = computed(() => {
  if (!apiStore.logs || apiStore.logs.length === 0) {
    return []
  }

  const typeCount = {}
  apiStore.logs.forEach(log => {
    const type = log.log_type || log.metadata?.log_source || 'Unknown'
    typeCount[type] = (typeCount[type] || 0) + 1
  })

  return Object.entries(typeCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4) // Top 4 event types
})

// Active endpoints for the right panel
const activeEndpoints = computed(() => {
  if (!apiStore.logs || apiStore.logs.length === 0) {
    return []
  }

  const endpointCount = {}
  const recentLogs = apiStore.logs.filter(log => {
    const logTime = new Date(log.timestamp || log.ingested_at)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return logTime >= oneHourAgo
  })

  recentLogs.forEach(log => {
    const endpoint = log.endpoint || log.metadata?.endpoint_name || 'Unknown'
    endpointCount[endpoint] = (endpointCount[endpoint] || 0) + 1
  })

  return Object.entries(endpointCount)
    .map(([name, events]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      events, 
      status: 'active' 
    }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 5) // Top 5 active endpoints
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
  if (!timestamp) return 'Unknown time'
  try {
    return formatTimestamp(timestamp, 'datetime')
  } catch (err) {
    console.error('EndpointTimeline: Error formatting time:', err)
    return 'Invalid time'
  }
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown'
  try {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return time.toLocaleDateString()
  } catch (err) {
    return 'Unknown'
  }
}
</script>
          
