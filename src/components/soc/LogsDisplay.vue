<template>
  <div>
    <!-- Enhanced Filter Controls -->
    <div class="flex justify-between items-center mb-5">
      <div class="flex gap-3">
        <!-- Severity Filter -->
        <div class="relative">
          <select 
            v-model="selectedSeverity" 
            @change="applyFilters"
            class="bg-gradient-to-r from-slate-800/50 to-slate-900/50 text-slate-300 px-4 py-2.5 rounded-lg border border-slate-700/50 text-sm hover:border-cyan-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 backdrop-blur-sm min-w-[140px]"
          >
            <option value="all">All Severities</option>
            <option v-for="severity in availableSeverities" :key="severity" :value="severity">
              {{ severity }}
            </option>
          </select>
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
        </div>

        <!-- Log Type Filter -->
        <div class="relative">
          <select 
            v-model="selectedLogType" 
            @change="applyFilters"
            class="bg-gradient-to-r from-slate-800/50 to-slate-900/50 text-slate-300 px-4 py-2.5 rounded-lg border border-slate-700/50 text-sm hover:border-cyan-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 backdrop-blur-sm min-w-[140px]"
          >
            <option value="all">All Types</option>
            <option v-for="logType in availableLogTypes" :key="logType" :value="logType">
              {{ getDisplayName(logType) }}
            </option>
          </select>
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
        </div>

        <!-- Filter Status -->
        <div v-if="isFiltered" class="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm">
          <i class="fas fa-filter text-xs"></i>
          <span>{{ filteredLogs.length }} of {{ totalAvailableLogs }} logs</span>
          <button @click="clearFilters" class="ml-2 hover:text-cyan-300 transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      <button 
        @click="refreshLogs" 
        :disabled="isRefreshing"
        class="bg-gradient-to-r from-cyan-500/10 to-cyan-500/20 hover:from-cyan-500/20 hover:to-cyan-500/30 text-cyan-400 px-4 py-2.5 rounded-lg text-sm border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 font-medium group relative overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" class="mr-2 text-xs"></i>
        <span class="relative">{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4 rounded-lg border border-slate-700/40 backdrop-blur-sm">
        <div class="text-2xl font-bold text-slate-100">{{ filteredLogs.length }}</div>
        <div class="text-xs text-slate-400 mt-1 font-medium">{{ isFiltered ? 'Filtered' : 'Total' }} Logs</div>
      </div>
      <div class="bg-gradient-to-br from-red-500/10 to-red-500/20 p-4 rounded-lg border border-red-500/30 backdrop-blur-sm">
        <div class="text-2xl font-bold text-red-400">{{ getFilteredSeverityCount('Critical') }}</div>
        <div class="text-xs text-red-400 mt-1 font-medium">Critical</div>
      </div>
      <div class="bg-gradient-to-br from-orange-500/10 to-orange-500/20 p-4 rounded-lg border border-orange-500/30 backdrop-blur-sm">
        <div class="text-2xl font-bold text-orange-400">{{ getFilteredSeverityCount('High') }}</div>
        <div class="text-xs text-orange-400 mt-1 font-medium">High</div>
      </div>
      <div class="bg-gradient-to-br from-yellow-500/10 to-yellow-500/20 p-4 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
        <div class="text-2xl font-bold text-yellow-400">{{ getFilteredSeverityCount('Medium') }}</div>
        <div class="text-xs text-yellow-400 mt-1 font-medium">Medium</div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg border border-slate-700/40 overflow-hidden backdrop-blur-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-700/50 bg-gradient-to-r from-slate-800/40 to-slate-900/40">
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Timestamp</th>
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Severity</th>
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Type</th>
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Source IP</th>
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Destination</th>
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Action</th>
              <th class="text-left py-4 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Location</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(log, index) in displayedLogs" 
              :key="log._id" 
              class="border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-800/40 hover:to-slate-900/40 transition-all duration-300 group"
              :class="{ 'animate-slide-in-up': index < 5 }"
              :style="{ 'animation-delay': `${index * 50}ms` }"
            >
              <td class="py-4 px-4 text-slate-300 text-xs font-mono">
                {{ formatDate(log.timestamp) }}
              </td>
              <td class="py-4 px-4">
                <span :class="getSeverityClass(log.severity)" class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 group-hover:shadow-lg">
                  {{ log.severity || 'Unknown' }}
                </span>
              </td>
              <td class="py-4 px-4 text-slate-300 text-xs">
                <span :class="getLogTypeClass(log.log_type)" :title="`Original: ${log.original_log_type || 'Unknown'}`">
                  {{ getDisplayName(log.log_type || 'system') }}
                </span>
              </td>
              <td class="py-4 px-4 text-slate-300 font-mono text-xs">
                {{ log.source_ip || 'N/A' }}
              </td>
              <td class="py-4 px-4 text-slate-300 text-xs font-mono">
                {{ log.dest_ip || 'N/A' }}{{ log.raw?.port ? ':' + log.raw.port : '' }}
              </td>
              <td class="py-4 px-4 text-slate-300 text-xs">
                <span v-if="log.raw?.action" class="px-2 py-1 bg-slate-600/30 rounded text-[10px]">
                  {{ log.raw.action }}
                </span>
                <span v-else class="text-slate-500">N/A</span>
              </td>
              <td class="py-4 px-4 text-slate-400 text-xs">
                {{ formatLocation(log.geo) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="displayedLogs.length === 0" class="text-center py-16 text-slate-500">
        <i class="fas fa-search text-5xl mb-4 block text-slate-600 opacity-50"></i>
        <p class="text-lg font-medium mb-2">{{ isFiltered ? 'No logs match current filters' : 'No logs found' }}</p>
        <p class="text-sm text-slate-600">
          {{ isFiltered ? 'Try adjusting your filter criteria' : 'Logs will appear here when available' }}
        </p>
        <button 
          v-if="isFiltered" 
          @click="clearFilters"
          class="mt-4 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-sm border border-cyan-500/30 transition-all duration-300"
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import { STANDARD_LOG_TYPES, getDisplayName, getCategoryColors } from '../../utils/logTypeConstants'

const apiStore = useAPIStore()
const selectedSeverity = ref('all')
const selectedLogType = ref('all')
const isRefreshing = ref(false)

// Reactive data
const allLogs = ref([])
const filteredLogs = ref([])

// Available filter options - now using standardized types
const availableSeverities = computed(() => {
  const severities = [...new Set(allLogs.value.map(log => log.severity).filter(Boolean))]
  return severities.sort((a, b) => {
    const order = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
    return (order[b] || 0) - (order[a] || 0)
  })
})

// Use standardized log types instead of dynamic loading
const availableLogTypes = computed(() => {
  // Get actual log types present in the data
  const presentTypes = [...new Set(allLogs.value.map(log => log.log_type).filter(Boolean))]
  
  // Filter standardized types to only show those that have data
  return STANDARD_LOG_TYPES.filter(type => presentTypes.includes(type))
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))
})

// Filter state
const isFiltered = computed(() => {
  return selectedSeverity.value !== 'all' || selectedLogType.value !== 'all'
})

const totalAvailableLogs = computed(() => allLogs.value.length)

// Display only first 15 logs for performance
const displayedLogs = computed(() => filteredLogs.value.slice(0, 15))

// Apply filters without mutating global state
const applyFilters = () => {
  let logs = [...allLogs.value]
  
  if (selectedSeverity.value !== 'all') {
    logs = logs.filter(log => log.severity === selectedSeverity.value)
  }
  
  if (selectedLogType.value !== 'all') {
    logs = logs.filter(log => log.log_type === selectedLogType.value)
  }
  
  filteredLogs.value = logs
}

// Clear all filters
const clearFilters = () => {
  selectedSeverity.value = 'all'
  selectedLogType.value = 'all'
  applyFilters()
}

// Get filtered severity counts
const getFilteredSeverityCount = (severity) => {
  return filteredLogs.value.filter(log => log.severity === severity).length
}

// Styling functions
const getSeverityClass = (severity) => {
  const classes = {
    'Critical': 'bg-gradient-to-r from-red-900/60 to-red-800/60 text-red-300 border border-red-700/50 shadow-red-500/20',
    'High': 'bg-gradient-to-r from-orange-900/60 to-orange-800/60 text-orange-300 border border-orange-700/50 shadow-orange-500/20',
    'Medium': 'bg-gradient-to-r from-yellow-900/60 to-yellow-800/60 text-yellow-300 border border-yellow-700/50 shadow-yellow-500/20',
    'Low': 'bg-gradient-to-r from-blue-900/60 to-blue-800/60 text-blue-300 border border-blue-700/50 shadow-blue-500/20'
  }
  return classes[severity] || 'bg-gradient-to-r from-gray-900/60 to-gray-800/60 text-gray-300 border border-gray-700/50'
}

// Get log type styling with standardized colors
const getLogTypeClass = (logType) => {
  const colors = getCategoryColors(logType)
  return `${colors.bg} ${colors.border} ${colors.text} px-2 py-1 rounded text-[10px] font-medium`
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatLocation = (geo) => {
  if (!geo) return 'Unknown'
  if (geo.city && geo.country) {
    return `${geo.city}, ${geo.country}`
  }
  return geo.country || geo.city || 'Unknown'
}

const refreshLogs = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await apiStore.fetchRecentLogs(100) // Fetch more logs for better filtering
    await apiStore.fetchDashboardStats()
    
    // Update local logs and reapply filters
    allLogs.value = [...(apiStore.logs || [])]
    applyFilters()
  } catch (error) {
    console.error('Failed to refresh logs:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Watch for changes in apiStore.logs
watch(() => apiStore.logs, (newLogs) => {
  if (newLogs && newLogs.length > 0) {
    allLogs.value = [...newLogs]
    applyFilters()
  }
}, { immediate: true })

// Watch filter changes
watch([selectedSeverity, selectedLogType], () => {
  applyFilters()
})

onMounted(async () => {
  await refreshLogs()
})
</script>

<style scoped>
/* Enhanced animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-up {
  animation: slideInUp 0.4s ease-out forwards;
  opacity: 0;
}

/* Custom scrollbar for table */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 225, 255, 0.3);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 225, 255, 0.5);
}

/* Enhanced hover effects */
select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 225, 255, 0.15);
}

select:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 225, 255, 0.25);
}

/* Table row hover animation */
tbody tr:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 225, 255, 0.1);
}
</style>