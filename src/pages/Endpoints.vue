<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Endpoint Activity</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Monitor and analyze endpoint-specific security events</p>
      </div>
    </div>

    <!-- Endpoint Search -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10 relative z-10">
      <h3 class="text-lg font-black title-gradient mb-4">Endpoint Search</h3>
      <div class="relative">
        <div class="flex gap-3">
          <div class="relative flex-1">
            <input
              v-model="searchEndpoint"
              @input="updateSuggestions"
              @focus="showSuggestions = true"
              @blur="hideSuggestions"
              @keydown.down.prevent="highlightNext"
              @keydown.up.prevent="highlightPrev"
              @keydown.enter.prevent="selectHighlighted"
              @keydown.escape="showSuggestions = false"
              type="text"
              placeholder="Search by endpoint name (e.g., endpoint-1, endpoint-25)"
              class="input-cyber flex-1 relative z-20 pr-10"
            />
            <button 
              v-if="searchEndpoint" 
              @click="clearSearch"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-dark-400 hover:text-slate-dark-300 z-30"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <button class="btn-cyber" @click="performSearch">
            <i class="fas fa-search mr-2"></i>Search
          </button>
        </div>
        
        <!-- Auto-complete Suggestions -->
        <div 
          v-if="showSuggestions && filteredSuggestions.length > 0" 
          class="absolute top-full left-0 right-0 mt-1 bg-slate-dark-800 border border-slate-dark-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
          style="z-index: 9999;"
        >
          <div
            v-for="(suggestion, index) in filteredSuggestions"
            :key="suggestion"
            @click="selectSuggestion(suggestion)"
            @mousedown.prevent
            :class="[
              'px-4 py-2 cursor-pointer transition-colors',
              highlightedIndex === index 
                ? 'bg-cyber-500/20 text-cyber-300' 
                : 'hover:bg-slate-dark-700 text-slate-dark-300'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="font-mono text-sm">{{ suggestion }}</span>
              <span class="text-xs text-slate-dark-500">
                {{ getEndpointCount(suggestion) }} events
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="mt-4 p-4 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
        <h4 class="text-sm font-semibold text-slate-dark-400 mb-3">Search Results ({{ searchResults.length }})</h4>
        <div class="space-y-2">
          <div
            v-for="result in searchResults.slice(0, 5)"
            :key="result.name"
            class="flex items-center justify-between p-2 bg-slate-dark-800/50 rounded border border-slate-dark-700/50"
          >
            <div>
              <span class="font-mono text-cyber-400">{{ result.name }}</span>
              <span class="text-xs text-slate-dark-500 ml-2">
                {{ result.totalEvents }} events, {{ result.critical }} critical
              </span>
            </div>
            <button 
              @click="viewEndpointDetails(result.name)"
              class="text-xs px-2 py-1 bg-cyber-500/20 text-cyber-300 rounded hover:bg-cyber-500/30"
            >
              View Details
            </button>
          </div>
        </div>
        <div v-if="searchResults.length > 5" class="text-center mt-3">
          <button class="text-xs text-cyber-400 hover:text-cyber-300">
            Show all {{ searchResults.length }} results
          </button>
        </div>
      </div>
    </div>

    <!-- Endpoint Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card card-accent-cyan text-center-left">
        <div class="stat-value text-accent-primary">{{ uniqueEndpoints }}</div>
        <div class="stat-label">Total Endpoints</div>
      </div>
      <div class="stat-card card-accent-red text-center-left">
        <div class="stat-value text-neon-red">{{ criticalEndpoints }}</div>
        <div class="stat-label">Critical Endpoints</div>
      </div>
      <div class="stat-card card-accent-orange text-center-left">
        <div class="stat-value text-neon-orange">{{ avgErrorRate }}%</div>
        <div class="stat-label">Avg Error Rate</div>
      </div>
      <div class="stat-card card-accent-green text-center-left">
        <div class="stat-value text-neon-green text-lg truncate">{{ mostActiveEndpoint }}</div>
        <div class="stat-label">Most Active</div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-1 gap-8">
      <!-- Timeline (Full Width) -->
      <div>
        <EndpointTimeline />
      </div>
    </div>

    <!-- Endpoints Table and Top Attacking IPs Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Endpoint Details Table (2 columns) -->
      <div class="lg:col-span-2 card-glass p-6 rounded-xl border-t border-t-accent-cyan/10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-black title-gradient">Endpoint Details</h3>
          <button @click="exportEndpoints" class="btn-cyber-outline">
            <i class="fas fa-download mr-1"></i>Export
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="table-cyber">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Total Events</th>
                <th>Critical</th>
                <th>Error Rate</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="endpoint in endpointList.slice(0, 15)" :key="endpoint.name">
                <td class="font-semibold text-slate-dark-50">{{ endpoint.name }}</td>
                <td class="text-cyber-400 font-bold">{{ endpoint.totalEvents }}</td>
                <td>
                  <span class="text-neon-red font-semibold">{{ endpoint.critical }}</span>
                </td>
                <td>
                  <span :class="[
                    'font-semibold',
                    endpoint.errorRate > 20 ? 'text-neon-red' : endpoint.errorRate > 10 ? 'text-neon-orange' : 'text-neon-green'
                  ]">
                    {{ endpoint.errorRate }}%
                  </span>
                </td>
                <td class="text-slate-dark-400 text-sm">{{ endpoint.lastActivity }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Top Attacking IPs -->
      <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
        <h3 class="text-lg font-black title-gradient mb-6">Top Attacking IPs</h3>
        <div class="space-y-3">
          <div v-if="topAttackingIPs.length === 0" class="text-center py-8 text-slate-500">
            <i class="fas fa-shield-alt text-3xl mb-3 block opacity-50"></i>
            <p class="text-sm">No attacking IPs detected</p>
            <p class="text-xs text-slate-600 mt-1">Data will be updated when threats are identified</p>
            <button @click="refreshData" class="text-xs text-cyan-400 hover:text-cyan-300 mt-2 block">
              Refresh Data
            </button>
          </div>
          
          <div v-else v-for="(ip, idx) in topAttackingIPs" :key="idx" class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
            <div class="flex items-center justify-between mb-2">
              <code class="text-cyber-400 font-mono text-sm">{{ ip.ip }}</code>
              <span :class="['badge-' + getSeverityClass(ip.count)]">
                {{ ip.count }}
              </span>
            </div>
            <div class="w-full bg-slate-dark-900 rounded-full h-1 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-cyber-500 to-neon-purple"
                :style="{ width: `${(ip.count / (topAttackingIPs[0]?.count || 1)) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Logs -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-purple/10">
      <h3 class="text-lg font-black title-gradient mb-6">Recent Related Logs</h3>
      <div class="space-y-3">
        <div v-if="recentLogs.length === 0" class="text-center py-8 text-slate-500">
          <i class="fas fa-file-alt text-3xl mb-3 block opacity-50"></i>
          <p class="text-sm">No recent logs available</p>
          <p class="text-xs text-slate-600 mt-1">Logs will appear here when activity is detected</p>
        </div>
        
        <div v-else v-for="log in recentLogs.slice(0, 5)" :key="log.id" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-dark-50">{{ log.endpoint }}</p>
              <p class="text-xs text-slate-dark-400 mt-1">
                <i class="fas fa-map-pin mr-1"></i>
                {{ log.source_ip }} → {{ log.dest_ip }}
              </p>
            </div>
            <span :class="['badge-' + getSeverityClassFromSeverity(log.severity)]">
              {{ getSeverityLabel(log.severity) }}
            </span>
          </div>
          <div class="text-xs text-slate-dark-500 mt-2">
            {{ formatTime(log.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAPIStore } from '../stores/apiStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast.js'
import { formatTimestamp } from '../utils/timestampFormatter.js'
import EndpointTimeline from '../components/soc/EndpointTimeline.vue'

const apiStore = useAPIStore()
const authStore = useAuthStore()
const { addToast } = useToast()
const searchEndpoint = ref('')
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)
const searchResults = ref([])
const aggregatedEndpoints = ref([])

onMounted(async () => {
  try {
    // Fetch aggregated endpoints from optimized endpoint
    const response = await axios.get('http://localhost:3002/api/logs/endpoints/aggregated')
    aggregatedEndpoints.value = response.data?.data || []
    console.log(`✅ Loaded ${aggregatedEndpoints.value.length} endpoints from aggregated endpoint`)
  } catch (error) {
    console.error('❌ Failed to fetch aggregated endpoints:', error)
    addToast('Failed to load endpoints', 'error')
  }
  
  // Fetch recent logs for the "Recent Related Logs" section
  try {
    await apiStore.fetchRecentLogs(100)
  } catch (error) {
    console.error('Failed to fetch recent logs:', error)
  }
  
  // Also fetch dashboard stats for other metrics
  await apiStore.fetchDashboardStats()
})

// Refresh data function
const refreshData = async () => {
  console.log('Refreshing data...')
  try {
    const response = await axios.get('http://localhost:3002/api/logs/endpoints/aggregated')
    aggregatedEndpoints.value = response.data?.data || []
    await apiStore.fetchRecentLogs(100)
    await apiStore.fetchDashboardStats()
    console.log('Data refreshed successfully')
    addToast('Data refreshed successfully', 'success')
  } catch (error) {
    console.error('Error refreshing data:', error)
    addToast('Failed to refresh data', 'error')
  }
}

// Search functionality
const performSearch = () => {
  if (!searchEndpoint.value.trim()) {
    searchResults.value = []
    addToast('Please enter an endpoint name to search', 'warning')
    return
  }
  
  const searchTerm = searchEndpoint.value.toLowerCase()
  searchResults.value = endpointList.value.filter(endpoint => 
    endpoint.name.toLowerCase().includes(searchTerm)
  )
  
  if (searchResults.value.length === 0) {
    addToast(`No endpoints found matching "${searchEndpoint.value}"`, 'info')
  } else {
    addToast(`Found ${searchResults.value.length} endpoint(s) matching "${searchEndpoint.value}"`, 'success')
  }
  
  showSuggestions.value = false
}

// Auto-complete functions
const updateSuggestions = () => {
  highlightedIndex.value = -1
  if (searchEndpoint.value.trim()) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
    searchResults.value = []
  }
}

const selectSuggestion = (suggestion) => {
  searchEndpoint.value = suggestion
  showSuggestions.value = false
  performSearch()
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && filteredSuggestions.value[highlightedIndex.value]) {
    selectSuggestion(filteredSuggestions.value[highlightedIndex.value])
  }
}

const highlightNext = () => {
  if (filteredSuggestions.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value + 1) % filteredSuggestions.value.length
}

const highlightPrev = () => {
  if (filteredSuggestions.value.length === 0) return
  highlightedIndex.value = highlightedIndex.value <= 0 
    ? filteredSuggestions.value.length - 1 
    : highlightedIndex.value - 1
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200) // Delay to allow click on suggestions
}

const clearSearch = () => {
  searchEndpoint.value = ''
  searchResults.value = []
  showSuggestions.value = false
  highlightedIndex.value = -1
  addToast('Search cleared', 'info')
}

const getEndpointCount = (endpoint) => {
  const endpointData = endpointList.value.find(ep => ep.name === endpoint)
  return endpointData ? endpointData.totalEvents : 0
}

const viewEndpointDetails = (endpointName) => {
  const endpointData = aggregatedEndpoints.value.find(ep => ep.endpoint === endpointName)
  if (endpointData) {
    addToast(`Viewing details for ${endpointName} (${endpointData.total_count} logs)`, 'info')
    console.log(`Endpoint ${endpointName} data:`, endpointData)
  } else {
    addToast(`Endpoint ${endpointName} not found`, 'warning')
  }
}

const uniqueEndpoints = computed(() => {
  return aggregatedEndpoints.value.length
})

const criticalEndpoints = computed(() => {
  return aggregatedEndpoints.value.filter(ep => ep.critical_count > 0).length
})

const avgErrorRate = computed(() => {
  if (!aggregatedEndpoints.value || aggregatedEndpoints.value.length === 0) return '0.0'
  const totalEvents = aggregatedEndpoints.value.reduce((sum, ep) => sum + (ep.total_count || 0), 0)
  const totalErrors = aggregatedEndpoints.value.reduce((sum, ep) => sum + (ep.error_count || 0), 0)
  if (totalEvents === 0) return '0.0'
  return ((totalErrors / totalEvents) * 100).toFixed(1)
})

const mostActiveEndpoint = computed(() => {
  if (!aggregatedEndpoints.value || aggregatedEndpoints.value.length === 0) return 'N/A'
  const sorted = [...aggregatedEndpoints.value].sort((a, b) => (b.total_count || 0) - (a.total_count || 0))
  return sorted.length > 0 ? sorted[0].endpoint : 'N/A'
})

const topAttackingIPs = computed(() => {
  // First try to use the dashboard stats data
  if (apiStore.topSourceIPs && apiStore.topSourceIPs.length > 0) {
    return apiStore.topSourceIPs.slice(0, 5).map(item => ({
      ip: item._id,
      count: item.count
    }))
  }
  
  // Fallback: Calculate from recent logs if dashboard stats not available
  if (apiStore.logs && apiStore.logs.length > 0) {
    const ipCount = {}
    
    // Count occurrences of each source IP
    apiStore.logs.forEach(log => {
      const ip = log.source_ip || log.ip_address
      if (ip && ip !== '0.0.0.0' && ip !== 'Unknown') {
        ipCount[ip] = (ipCount[ip] || 0) + 1
      }
    })
    
    // Convert to array and sort by count
    return Object.entries(ipCount)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }
  
  return []
})

const endpointList = computed(() => {
  // Map aggregated endpoint data to display format
  return aggregatedEndpoints.value.map(ep => ({
    name: ep.endpoint || 'Unknown',
    totalEvents: ep.total_count || 0,
    critical: ep.critical_count || 0,
    errorRate: ep.total_count > 0 ? ((ep.error_count || 0) / ep.total_count * 100).toFixed(1) : '0.0',
    lastActivity: ep.last_timestamp ? formatTimestamp(ep.last_timestamp, 'time') : 'N/A',
    status: 'Active',
  }))
})

const recentLogs = computed(() => {
  // Use apiStore logs for recent logs display
  // These are fetched separately for the "Recent Related Logs" section
  return [...(apiStore.logs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// Get all unique endpoints for suggestions
const allEndpoints = computed(() => {
  return aggregatedEndpoints.value.map(ep => ep.endpoint).sort()
})

// Filter suggestions based on search input
const filteredSuggestions = computed(() => {
  if (!searchEndpoint.value) return []
  return allEndpoints.value.filter(endpoint => 
    endpoint.toLowerCase().includes(searchEndpoint.value.toLowerCase())
  ).slice(0, 8) // Limit to 8 suggestions
})

const getSeverityClass = (count) => {
  if (count > 100) return 'critical'
  if (count > 50) return 'high'
  if (count > 20) return 'medium'
  return 'low'
}

const formatTime = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

const getSeverityClassFromSeverity = (severity) => {
  if (!severity) return 'low'
  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 'critical'
  if (s.includes('high')) return 'high'
  if (s.includes('medium')) return 'medium'
  return 'low'
}

const getSeverityLabel = (severity) => {
  if (!severity) return 'Low'
  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 'Critical'
  if (s.includes('high')) return 'High'
  if (s.includes('medium')) return 'Medium'
  return 'Low'
}

const exportEndpoints = () => {
  try {
    // Prepare export data
    const exportData = {
      timestamp: new Date().toISOString(),
      exportedBy: 'manual_action',
      exportType: 'endpoints',
      statistics: {
        totalEndpoints: uniqueEndpoints.value,
        criticalEndpoints: criticalEndpoints.value,
        avgErrorRate: avgErrorRate.value,
        mostActiveEndpoint: mostActiveEndpoint.value
      },
      endpoints: endpointList.value.map(ep => ({
        name: ep.name,
        totalEvents: ep.totalEvents,
        critical: ep.critical,
        errorRate: ep.errorRate,
        lastActivity: ep.lastActivity,
        status: ep.status
      })),
      topAttackingIPs: topAttackingIPs.value.map(ip => ({
        ip: ip.ip,
        count: ip.count,
        severity: getSeverityClass(ip.count)
      })),
      recentLogs: recentLogs.value.slice(0, 20).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        endpoint: log.endpoint,
        source_ip: log.source_ip,
        dest_ip: log.dest_ip,
        severity: log.severity,
        log_type: log.log_type,
        action: log.raw?.action || 'N/A'
      }))
    }
    
    // Create and download file
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `endpoints-export-${Date.now()}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    addToast(`Endpoints exported successfully! File: endpoints-export-${Date.now()}.json`, 'success')
  } catch (error) {
    console.error('Export failed:', error)
    addToast(`Failed to export endpoints: ${error.message || 'Export error'}`, 'error')
  }
}
</script>
