<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Log Viewer</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Universal JSON log viewer with advanced search and filtering</p>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="card-glass p-6 rounded-xl">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Search Logs</label>
          <input
            :value="searchQuery"
            @input="performSearch($event.target.value)"
            type="text"
            placeholder="Search by IP, endpoint, timestamp, or any field..."
            class="input-cyber w-full"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-dark-300 mb-2">Severity</label>
            <select 
              :value="filters.severity"
              @change="updateFilter('severity', $event.target.value)"
              class="input-cyber w-full"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-dark-300 mb-2">Log Type</label>
            <select 
              :value="filters.logType"
              @change="updateFilter('logType', $event.target.value)"
              class="input-cyber w-full"
            >
              <option value="">All Types</option>
              <option value="Firewall">Firewall</option>
              <option value="IDS">IDS</option>
              <option value="Authentication">Authentication</option>
              <option value="App">App</option>
              <option value="System">System</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-dark-300 mb-2">Time Range</label>
            <select 
              :value="filters.timeRange"
              @change="updateFilter('timeRange', $event.target.value)"
              class="input-cyber w-full"
            >
              <option value="7d">Last 7 Days</option>
              <option value="24h">Last 24 Hours</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div class="flex items-end">
            <button @click="handleSearch" class="btn-cyber w-full" :disabled="!searchQuery && !filters.severity && !filters.logType">
              <i class="fas fa-search mr-2"></i>Search
            </button>
          </div>
        </div>


      </div>
    </div>

    <!-- Raw Log Viewer -->
    <div class="space-y-4">
      <h2 class="text-2xl font-black title-gradient tracking-tight">Raw Log Viewer</h2>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="stat-card text-center">
          <div class="stat-value text-cyber-400">{{ apiStore.totalLogs }}</div>
          <div class="stat-label">Total Logs</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-value text-neon-red">{{ criticalInResults }}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-value text-neon-orange">{{ highInResults }}</div>
          <div class="stat-label">High</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-value text-neon-yellow">{{ mediumInResults }}</div>
          <div class="stat-label">Medium</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-value text-neon-green">{{ lowInResults }}</div>
          <div class="stat-label">Low</div>
        </div>
      </div>
    </div>

    <!-- Logs List -->
    <div class="card-glass p-6 rounded-xl relative">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-slate-dark-50">Logs</h3>
        <div class="flex gap-2">
          <button @click="exportLogs" class="btn-cyber-outline">
            <i class="fas fa-download mr-1"></i>Export
          </button>
          <button @click="copyLogs" class="btn-cyber-outline" :disabled="isCopying">
            <i :class="['fas', isCopying ? 'fa-spinner fa-spin' : 'fa-copy', 'mr-1']"></i>
            {{ getCopyButtonText() }}
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isSearching" class="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
        <div class="bg-slate-dark-800 border border-slate-dark-600 rounded-lg p-8 flex flex-col items-center gap-4">
          <div class="animate-spin">
            <i class="fas fa-spinner text-cyber-400 text-3xl"></i>
          </div>
          <div class="text-center">
            <p class="text-slate-dark-50 font-semibold">Filtering Logs...</p>
            <p class="text-slate-dark-400 text-sm mt-1">Please wait while we process your filters</p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="(log, idx) in displayedLogs"
          :key="idx"
          class="bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50 overflow-hidden"
        >
          <div
            class="p-4 cursor-pointer hover:bg-slate-dark-800/50 transition-colors"
            @click="toggleLogExpanded(idx)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <span :class="['badge-' + getSeverityClass(log.severity)]">
                    {{ getSeverityLabel(log.severity) }}
                  </span>
                  <span class="text-sm font-mono text-cyber-400">{{ log.source_ip }}</span>
                  <span class="text-slate-dark-500">→</span>
                  <span class="text-sm font-mono text-cyber-400">{{ log.dest_ip }}</span>
                  <span class="text-xs text-slate-dark-500 ml-auto">{{ formatTime(log.timestamp) }}</span>
                </div>
                <div class="text-xs text-slate-dark-400 mt-2">
                  <i class="fas fa-tag mr-1"></i>{{ log.log_type }} • {{ log.endpoint }}
                </div>
              </div>
              <i :class="['fas', expandedLogs.includes(idx) ? 'fa-chevron-up' : 'fa-chevron-down']" class="text-slate-dark-500 ml-4"></i>
            </div>
          </div>

          <!-- Expanded JSON View -->
          <div v-if="expandedLogs.includes(idx)" class="bg-slate-dark-900 border-t border-slate-dark-700/50 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-slate-dark-400 uppercase">JSON Payload</span>
              <button @click="copyLogJSON(log)" class="text-xs text-cyber-400 hover:text-cyber-300" :disabled="isCopyingIndividual === log.id">
                <i :class="['fas', isCopyingIndividual === log.id ? 'fa-spinner fa-spin' : 'fa-copy', 'mr-1']"></i>
                {{ getIndividualCopyButtonText(log.id) }}
              </button>
            </div>
            <pre class="bg-slate-dark-800/50 rounded p-3 text-xs text-slate-dark-300 overflow-x-auto font-mono">{{ JSON.stringify(log, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between">
        <span class="text-sm text-slate-dark-400">
          Showing {{ (currentPage - 1) * 10 + 1 }} to {{ Math.min(currentPage * 10, filteredLogs.length) }} of {{ filteredLogs.length }}
        </span>
        <div class="flex gap-2">
          <button
            @click="prevPage"
            :disabled="!canPrevPage"
            class="btn-cyber-outline disabled:opacity-50"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="px-3 py-2 text-sm text-slate-dark-300">{{ currentPage }} / {{ totalPages }}</span>
          <button
            @click="nextPage"
            :disabled="!canNextPage"
            class="btn-cyber-outline disabled:opacity-50"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Log Statistics -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="card-glass p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Top Source IPs</h3>
        <div class="space-y-3">
          <div v-for="(ip, idx) in topSourceIPsInResults.slice(0, 8)" :key="idx" class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
            <code class="text-cyber-400 font-mono text-sm">{{ ip.ip }}</code>
            <span class="font-bold text-slate-dark-50">{{ ip.count }}</span>
          </div>
        </div>
      </div>

      <div class="card-glass p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Top Endpoints</h3>
        <div class="space-y-3">
          <div v-for="(ep, idx) in topEndpointsInResults.slice(0, 8)" :key="idx" class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
            <span class="text-slate-dark-300 text-sm">{{ ep.name }}</span>
            <span class="font-bold text-slate-dark-50">{{ ep.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import { formatTimestamp } from '../utils/timestampFormatter.js'
import { useSearch } from '../composables/useSearch'
import axios from 'axios'

const apiStore = useAPIStore()
const {
  performSearch,
  updateFilter,
  clearAllSearch,
  filteredLogs,
  paginatedResults,
  currentPage,
  totalPages,
  canNextPage,
  canPrevPage,
  nextPage,
  prevPage,
  getSeverityCounts,
  getTopSourceIPs,
  getTopEndpoints,
  searchQuery,
  filters,
  isSearching,
  fetchData
} = useSearch({ pageSize: 10, serverSide: true })

const expandedLogs = ref([])
const isCopying = ref(false)
const isCopyingIndividual = ref(null)
const copyButtonState = ref('idle')
const copiedIndividualId = ref(null)

onMounted(async () => {
  await fetchData() // Trigger server-side fetch
  await apiStore.fetchDashboardStats()
  
  // Debug: Log severity breakdown
  console.log('📊 Severity Breakdown:', apiStore.severityBreakdown)
})

const displayedLogs = computed(() => paginatedResults.value)

// Count severity from backend severity breakdown (same as Dashboard)
// CRITICAL: All pages must use the same source for consistency
const criticalInResults = computed(() => {
  return apiStore.severityBreakdown.find(s => s._id === 'Critical')?.count || 0
})
const highInResults = computed(() => {
  return apiStore.severityBreakdown.find(s => s._id === 'High')?.count || 0
})
const mediumInResults = computed(() => {
  return apiStore.severityBreakdown.find(s => s._id === 'Medium')?.count || 0
})
const lowInResults = computed(() => {
  return apiStore.severityBreakdown.find(s => s._id === 'Low')?.count || 0
})

const topSourceIPsInResults = computed(() => getTopSourceIPs.value)
const topEndpointsInResults = computed(() => getTopEndpoints.value)

const toggleLogExpanded = (idx) => {
  const actualIdx = (currentPage.value - 1) * 10 + idx
  if (expandedLogs.value.includes(actualIdx)) {
    expandedLogs.value = expandedLogs.value.filter(i => i !== actualIdx)
  } else {
    expandedLogs.value.push(actualIdx)
  }
}

const formatTime = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

const getSeverityClass = (severity) => {
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

const getCopyButtonText = () => {
  if (isCopying.value) return 'Copying...'
  if (copyButtonState.value === 'copied') return 'Copied!'
  return 'Copy'
}

const getIndividualCopyButtonText = (logId) => {
  if (isCopyingIndividual.value === logId) return 'Copying...'
  if (copiedIndividualId.value === logId) return 'Copied!'
  return 'Copy'
}

const exportLogs = async () => {
  try {
    // Get real data from backend API
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    // Build query parameters based on current filters
    const params = {
      format: 'csv',
      timeRange: filterTimeRange.value || '24h',
      limit: 10000
    }
    
    if (filterSeverity.value) {
      params.severity = filterSeverity.value
    }
    
    if (filterLogType.value) {
      params.log_type = filterLogType.value
    }
    
    // Fetch filtered logs from backend
    const response = await axios.get(`${API_BASE}/export/logs`, { params })
    
    if (response.data) {
      // Create blob from backend response
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', url)
      linkElement.setAttribute('download', `logviewer-logs-${new Date().toISOString().split('T')[0]}.csv`)
      linkElement.click()
      URL.revokeObjectURL(url)
      
      // Show success message
      if (window.addToast) {
        window.addToast('LogViewer search results exported successfully', 'success')
      }
    }
  } catch (error) {
    console.error('Export failed:', error)
    
    // Fallback to client-side export if backend fails
    const logsToExport = filteredLogs.value.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      severity: log.severity,
      log_type: log.log_type,
      source_ip: log.source_ip,
      dest_ip: log.dest_ip,
      endpoint: log.endpoint,
      action: log.raw?.action,
      protocol: log.raw?.protocol,
      description: log.raw?.description,
      geo_country: log.geo?.country || '',
      geo_city: log.geo?.city || ''
    }))
    
    // Create CSV
    const headers = ['ID', 'Timestamp', 'Severity', 'Log Type', 'Source IP', 'Destination IP', 'Endpoint', 'Action', 'Protocol', 'Description', 'Country', 'City']
    const csvContent = [
      headers.join(','),
      ...logsToExport.map(log => [
        log.id,
        log.timestamp,
        log.severity,
        log.log_type,
        log.source_ip,
        log.dest_ip,
        log.endpoint || '',
        log.action || '',
        log.protocol || '',
        log.description || '',
        log.geo_country,
        log.geo_city
      ].map(field => `"${field}"`).join(','))
    ].join('\n')
    
    // Download CSV
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent)
    const exportFileDefaultName = `logviewer-logs-${new Date().toISOString().split('T')[0]}.csv`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    // Show success message
    if (window.addToast) {
      window.addToast(`Exported ${logsToExport.length} logs to ${exportFileDefaultName}`, 'success')
    }
  }
}

const copyLogs = async () => {
  try {
    isCopying.value = true
    copyButtonState.value = 'idle'
    
    // Prepare logs data for copying
    const logsToCopy = filteredLogs.value.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      severity: log.severity,
      log_type: log.log_type,
      source_ip: log.source_ip,
      dest_ip: log.dest_ip,
      endpoint: log.endpoint,
      action: log.raw?.action,
      protocol: log.raw?.protocol,
      description: log.raw?.description,
      geo_country: log.geo?.country || '',
      geo_city: log.geo?.city || ''
    }))
    
    // Create formatted text for copying
    const headers = ['ID', 'Timestamp', 'Severity', 'Type', 'Source IP', 'Destination IP', 'Endpoint', 'Action', 'Protocol', 'Description', 'Country', 'City']
    const tabSeparatedContent = [
      headers.join('\t'),
      ...logsToCopy.map(log => [
        log.id,
        log.timestamp,
        log.severity,
        log.log_type,
        log.source_ip,
        log.dest_ip,
        log.endpoint || '',
        log.action || '',
        log.protocol || '',
        log.description || '',
        log.geo_country,
        log.geo_city
      ].join('\t'))
    ].join('\n')
    
    // Copy to clipboard
    await navigator.clipboard.writeText(tabSeparatedContent)
    
    // Show copied state
    copyButtonState.value = 'copied'
    
    if (window.addToast) {
      window.addToast(`Copied ${logsToCopy.length} logs to clipboard`, 'success')
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      copyButtonState.value = 'idle'
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
    
    // Fallback: create temporary textarea
    const textarea = document.createElement('textarea')
    textarea.value = JSON.stringify(filteredLogs.value, null, 2)
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    
    // Show copied state
    copyButtonState.value = 'copied'
    
    if (window.addToast) {
      window.addToast('Copied logs to clipboard (fallback)', 'success')
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      copyButtonState.value = 'idle'
    }, 2000)
  } finally {
    isCopying.value = false
  }
}

const copyLogJSON = async (log) => {
  try {
    isCopyingIndividual.value = log.id
    copiedIndividualId.value = null
    
    // Copy formatted JSON to clipboard
    const jsonString = JSON.stringify(log, null, 2)
    await navigator.clipboard.writeText(jsonString)
    
    // Show copied state
    copiedIndividualId.value = log.id
    
    if (window.addToast) {
      window.addToast('Log JSON copied to clipboard', 'success')
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      copiedIndividualId.value = null
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
    
    // Fallback: create temporary textarea
    const textarea = document.createElement('textarea')
    textarea.value = JSON.stringify(log, null, 2)
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    
    // Show copied state
    copiedIndividualId.value = log.id
    
    if (window.addToast) {
      window.addToast('Log JSON copied to clipboard (fallback)', 'success')
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      copiedIndividualId.value = null
    }, 2000)
  } finally {
    isCopyingIndividual.value = null
  }
}

const handleSearch = () => {
  // Search is now reactive via composable
  // No need for manual trigger
}

const clearSearch = () => {
  clearAllSearch()
  if (window.addToast) {
    window.addToast('Search cleared', 'info')
  }
}
</script>
