<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Log Types</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Categorized security logs by type</p>
      </div>
    </div>

    <!-- Log Type Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="logType in logTypes"
        :key="logType"
        @click="selectedLogType = logType"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          selectedLogType === logType
            ? 'bg-cyber-600 text-white border border-cyber-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-cyber-500'
        ]"
      >
        {{ logType }}
      </button>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card card-accent-cyan">
        <div class="stat-value text-accent-primary">{{ logsOfSelectedType.length }}</div>
        <div class="stat-label">{{ selectedLogType }} Logs</div>
      </div>
      <div class="stat-card card-accent-red">
        <div class="stat-value text-neon-red">{{ criticalCount }}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat-card card-accent-orange">
        <div class="stat-value text-neon-orange">{{ highCount }}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="stat-card card-accent-green">
        <div class="stat-value text-neon-green">{{ lowCount }}</div>
        <div class="stat-label">Low</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card-glass p-4 rounded-xl">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Severity</label>
          <select v-model="filterSeverity" class="input-cyber w-full">
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Time Range</label>
          <select v-model="filterTimeRange" class="input-cyber w-full">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Action</label>
          <select v-model="filterAction" class="input-cyber w-full">
            <option value="">All Actions</option>
            <option v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" value="CREATE">Create Key</option>
            <option v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" value="DELETE">Delete Key</option>
            <option v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" value="MODIFY">Modify Key</option>
            <option v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" value="READ">Read Key</option>
            <option v-if="selectedLogType !== 'Registry'" value="ALLOW">Allow</option>
            <option v-if="selectedLogType !== 'Registry'" value="DENY">Deny</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="handleLogTypesSearch" class="btn-cyber w-full">
            <i class="fas fa-search mr-2"></i>Apply Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black title-gradient">{{ selectedLogType }} Logs</h3>
        <div class="flex items-center gap-2">
          <div v-if="selectedLogType === 'All' && isLoading" class="text-cyber-400 text-sm">
            <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
          </div>
          <button @click="exportLogs" class="btn-cyber-outline">
            <i class="fas fa-download mr-1"></i>Export
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table-cyber">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Computer</th>
              <th v-if="selectedLogType === 'Registry' || selectedLogType === 'All'">Registry Path</th>
              <th v-if="selectedLogType === 'Registry' || selectedLogType === 'All'">Key Name</th>
              <th v-if="selectedLogType !== 'Registry'">Source IP</th>
              <th v-if="selectedLogType !== 'Registry'">Destination IP</th>
              <th v-if="selectedLogType !== 'Registry'">Endpoint</th>
              <th>Log Type</th>
              <th>Severity</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs.slice(0, 20)" :key="log.id">
              <td class="text-slate-dark-400 text-sm">{{ formatTime(log.timestamp) }}</td>
              <td>
                <code class="text-cyber-400 font-mono text-sm">{{ log.computer || log.source_ip }}</code>
              </td>
              <td v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" class="text-slate-dark-300 text-sm font-mono">{{ log.registry_path || 'N/A' }}</td>
              <td v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" class="text-slate-dark-300 text-sm font-mono">{{ log.key_name || 'N/A' }}</td>
              <td v-if="selectedLogType !== 'Registry'">
                <code class="text-cyber-400 font-mono text-sm">{{ log.source_ip }}</code>
              </td>
              <td v-if="selectedLogType !== 'Registry'">
                <code class="text-cyber-400 font-mono text-sm">{{ log.dest_ip }}</code>
              </td>
              <td v-if="selectedLogType !== 'Registry'" class="text-slate-dark-300">{{ log.endpoint }}</td>
              <td>
                <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-dark-700 text-slate-dark-300">
                  {{ log.log_type || 'Unknown' }}
                </span>
              </td>
              <td>
                <span :class="['badge-' + log.severity.toLowerCase()]">
                  {{ log.severity }}
                </span>
              </td>
              <td>
                <span :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  selectedLogType === 'Registry' ? (
                    log.raw?.action === 'CREATE' ? 'bg-green-500/20 text-green-400' :
                    log.raw?.action === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                    log.raw?.action === 'MODIFY' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  ) : (
                    log.raw?.action === 'ALLOW' ? 'bg-neon-green/20 text-neon-green' :
                    'bg-neon-red/20 text-neon-red'
                  )
                ]">
                  {{ log.raw?.action || 'N/A' }}
                </span>
              </td>
              <td>
                <button 
                  @click="showLogDetails(log)"
                  class="text-cyber-400 hover:text-cyber-300 transition-colors"
                  title="View Details"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 text-sm text-slate-dark-400">
        Showing {{ Math.min(20, filteredLogs.length) }} of {{ filteredLogs.length }} logs
      </div>
    </div>

    <!-- Log Details Modal -->
    <div 
      v-if="selectedLog"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="closeLogDetails"
    >
      <div class="bg-bg-secondary border border-glass-border/20 rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl backdrop-blur-xl">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-bg-secondary/80 backdrop-blur-md border-b border-glass-border/20 p-6 z-10">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-black title-gradient">Log Details</h3>
            <button 
              @click="closeLogDetails"
              class="text-slate-dark-400 hover:text-slate-dark-300 transition-colors"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <!-- Quick Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
              <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Severity</div>
              <div :class="['badge-' + (selectedLog.severity || 'low').toLowerCase()]">
                {{ selectedLog.severity || 'Low' }}
              </div>
            </div>
            <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
              <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Action</div>
              <div class="text-lg font-semibold" :class="(selectedLog.raw?.action || selectedLog.raw_data?.action) === 'ALLOW' ? 'text-neon-green' : 'text-neon-red'">
                {{ selectedLog.raw?.action || selectedLog.raw_data?.action || 'N/A' }}
              </div>
            </div>
            <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
              <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Timestamp</div>
              <div class="text-sm text-slate-dark-300">{{ formatFullTime(selectedLog.timestamp) }}</div>
            </div>
          </div>

          <!-- Registry Information -->
          <div v-if="selectedLog.log_type === 'Registry'" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <h4 class="text-sm font-semibold text-slate-dark-300 mb-3 flex items-center">
              <i class="fas fa-database mr-2 text-cyber-400"></i>
              Registry Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Computer</div>
                <div class="text-slate-dark-300">{{ selectedLog.computer || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">User</div>
                <div class="text-slate-dark-300">{{ selectedLog.user || 'Unknown' }}</div>
              </div>
              <div class="md:col-span-2">
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Registry Path</div>
                <div class="text-cyber-400 font-mono bg-slate-dark-800 px-2 py-1 rounded text-sm break-all">
                  {{ selectedLog.registry_path || 'N/A' }}
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Key Name</div>
                <div class="text-slate-dark-300 font-mono text-sm">{{ selectedLog.key_name || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Value Type</div>
                <div class="text-slate-dark-300">{{ selectedLog.value_type || 'N/A' }}</div>
              </div>
              <div v-if="selectedLog.old_value">
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Previous Value</div>
                <div class="text-slate-dark-300 font-mono text-sm">{{ selectedLog.old_value }}</div>
              </div>
              <div v-if="selectedLog.new_value">
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">New Value</div>
                <div class="text-slate-dark-300 font-mono text-sm">{{ selectedLog.new_value }}</div>
              </div>
            </div>
          </div>

          <!-- Network Information (for non-Registry logs) -->
          <div v-if="selectedLog.log_type !== 'Registry'" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <h4 class="text-sm font-semibold text-slate-dark-300 mb-3 flex items-center">
              <i class="fas fa-network-wired mr-2 text-cyber-400"></i>
              Network Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Source IP</div>
                <div class="flex items-center gap-2">
                  <code class="text-cyber-400 font-mono bg-slate-dark-800 px-2 py-1 rounded">
                    {{ selectedLog.source_ip }}
                  </code>
                  <button 
                    @click="lookupIP(selectedLog.source_ip)"
                    class="text-cyber-400 hover:text-cyber-300 text-sm"
                    title="Lookup IP"
                  >
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Destination IP</div>
                <div class="flex items-center gap-2">
                  <code class="text-cyber-400 font-mono bg-slate-dark-800 px-2 py-1 rounded">
                    {{ selectedLog.dest_ip }}
                  </code>
                  <button 
                    @click="lookupIP(selectedLog.dest_ip)"
                    class="text-cyber-400 hover:text-cyber-300 text-sm"
                    title="Lookup IP"
                  >
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Endpoint</div>
                <div class="text-slate-dark-300">{{ selectedLog.endpoint || selectedLog.metadata?.endpoint_name || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Protocol</div>
                <div class="text-slate-dark-300">{{ selectedLog.raw?.protocol || selectedLog.raw_data?.protocol || selectedLog.protocol || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <!-- Geo Location (if available) -->
          <div v-if="selectedLog.geo" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <h4 class="text-sm font-semibold text-slate-dark-300 mb-3 flex items-center">
              <i class="fas fa-globe mr-2 text-cyber-400"></i>
              Geographic Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Country</div>
                <div class="text-slate-dark-300">{{ selectedLog.geo?.country || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">City</div>
                <div class="text-slate-dark-300">{{ selectedLog.geo?.city || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-1">Organization</div>
                <div class="text-slate-dark-300">{{ selectedLog.geo?.org || 'Unknown' }}</div>
              </div>
            </div>
          </div>

          <!-- Raw Log Data -->
          <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-slate-dark-300 flex items-center">
                <i class="fas fa-code mr-2 text-cyber-400"></i>
                Raw Log Data
              </h4>
              <button 
                @click="copyRawLog"
                class="text-cyber-400 hover:text-cyber-300 text-sm"
                title="Copy to clipboard"
              >
                <i class="fas fa-copy mr-1"></i>Copy
              </button>
            </div>
            <pre class="bg-slate-dark-800 p-4 rounded-lg overflow-x-auto text-xs text-slate-dark-300 font-mono">{{ JSON.stringify(selectedLog.raw || selectedLog.raw_data || selectedLog, null, 2) }}</pre>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-slate-dark-700">
            <button 
              @click="blockIP(selectedLog.source_ip)"
              :disabled="isLoading"
              class="btn-cyber-outline bg-neon-red/20 text-neon-red border-neon-red/50 hover:bg-neon-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-ban mr-2"></i>
              {{ isLoading ? 'Blocking...' : 'Block Source IP' }}
            </button>
            <button 
              @click="createAlert(selectedLog)"
              :disabled="isLoading"
              class="btn-cyber-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-exclamation-triangle mr-2"></i>
              {{ isLoading ? 'Creating...' : 'Create Alert' }}
            </button>
            <button 
              @click="exportLog(selectedLog)"
              class="btn-cyber-outline"
            >
              <i class="fas fa-download mr-2"></i>Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Type Distribution Chart -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
      <h3 class="text-lg font-black title-gradient mb-6">Distribution by Severity</h3>
      <div class="space-y-4">
        <div v-for="item in severityDistribution" :key="item.name" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-dark-300">{{ item.name }}</span>
            <span class="text-sm font-bold text-slate-dark-50">{{ item.value }}</span>
          </div>
          <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
            <div
              class="h-full rounded-full"
              :style="{
                width: `${(item.value / logsOfSelectedType.length) * 100}%`,
                backgroundColor: item.color,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="[
          'p-4 rounded-lg shadow-lg transform transition-all duration-300 max-w-sm',
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i :class="[
              'mr-2',
              toast.type === 'success' ? 'fas fa-check-circle' :
              toast.type === 'error' ? 'fas fa-exclamation-circle' :
              'fas fa-info-circle'
            ]"></i>
            <span>{{ toast.message }}</span>
          </div>
          <button 
            @click="removeToast(toast.id)"
            class="ml-4 hover:opacity-75"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLogStore } from '../stores/logStore'
import { useToast } from '../composables/useToast'
import axios from 'axios'

const logStore = useLogStore()
const { addToast, toasts, removeToast } = useToast()
const logTypes = ['All', 'Firewall', 'IDS', 'Authentication', 'App', 'System', 'Registry']
const selectedLogType = ref('All')
const filterSeverity = ref('')
const filterTimeRange = ref('24h')
const filterAction = ref('')
const selectedLog = ref(null)
const isLoading = ref(false)

onMounted(() => {
  if (logStore.logs.length === 0) {
    logStore.initializeLogs()
  }
  // Fetch all logs for the "All" tab
  fetchAllLogsData()
})

// Watch for log type changes to fetch data accordingly
const fetchAllLogsData = async () => {
  if (selectedLogType.value === 'All') {
    isLoading.value = true
    try {
      await logStore.fetchAllLogs({
        timeRange: filterTimeRange.value,
        severity: filterSeverity.value,
        action: filterAction.value
      })
    } catch (error) {
      console.error('Failed to fetch all logs:', error)
      addToast('Failed to fetch all logs', 'error')
    } finally {
      isLoading.value = false
    }
  }
}

// Watch for filter changes
watch([filterTimeRange, filterSeverity, filterAction], () => {
  if (selectedLogType.value === 'All') {
    fetchAllLogsData()
  }
})

// Watch for log type changes
watch(selectedLogType, () => {
  if (selectedLogType.value === 'All') {
    fetchAllLogsData()
  }
})

const logsOfSelectedType = computed(() => {
  if (selectedLogType.value === 'All') {
    // Use the fetched allLogs from the store
    return logStore.allLogs.length > 0 ? logStore.allLogs : [...logStore.logs, ...(logStore.registryLogs || [])]
  }
  if (selectedLogType.value === 'Registry') {
    return logStore.registryLogs
  }
  return logStore.logs.filter(l => l.log_type === selectedLogType.value)
})

const filteredLogs = computed(() => {
  return logsOfSelectedType.value.filter(log => {
    if (filterSeverity.value && log.severity !== filterSeverity.value) return false
    const action = log.raw?.action || log.raw_data?.action || log.action
    if (filterAction.value && action !== filterAction.value) return false
    return true
  })
})

const criticalCount = computed(() => logsOfSelectedType.value.filter(l => l.severity === 'Critical').length)
const highCount = computed(() => logsOfSelectedType.value.filter(l => l.severity === 'High').length)
const lowCount = computed(() => logsOfSelectedType.value.filter(l => l.severity === 'Low').length)

const severityDistribution = computed(() => [
  { name: 'Critical', value: criticalCount.value, color: '#ff0055' },
  { name: 'High', value: highCount.value, color: '#ff6b35' },
  { name: 'Medium', value: logsOfSelectedType.value.filter(l => l.severity === 'Medium').length, color: '#ffd700' },
  { name: 'Low', value: lowCount.value, color: '#00ff88' },
])

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const formatFullTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Log details modal functions
const showLogDetails = (log) => {
  selectedLog.value = log
}

const closeLogDetails = () => {
  selectedLog.value = null
}

const handleLogTypesSearch = async () => {
  if (selectedLogType.value === 'All') {
    await fetchAllLogsData()
  }
  // For other log types, filters are already applied via computed properties
  addToast('Filters applied', 'success')
}

const copyRawLog = async () => {
  if (selectedLog.value) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedLog.value.raw, null, 2))
      addToast('Log copied to clipboard', 'success')
    } catch (err) {
      console.error('Failed to copy log:', err)
      addToast('Failed to copy log', 'error')
    }
  }
}

const lookupIP = async (ip) => {
  try {
    // Try to get IP details from the backend
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/lookup/whois/${ip}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('IP lookup result:', data)
      // You could show this data in a modal or new tab
      const info = `
IP: ${ip}
Country: ${data.country || 'Unknown'}
City: ${data.city || 'Unknown'}
ISP: ${data.org || data.isp || 'Unknown'}
ASN: ${data.asn || 'Unknown'}
      `.trim()
      alert(info)
    } else {
      // Fallback to external service
      window.open(`https://www.virustotal.com/gui/ip-address/${ip}`, '_blank')
    }
  } catch (error) {
    console.error('IP lookup failed:', error)
    // Fallback to external service
    window.open(`https://www.virustotal.com/gui/ip-address/${ip}`, '_blank')
  }
}

const blockIP = async (ip) => {
  if (confirm(`Are you sure you want to block IP ${ip}?`)) {
    isLoading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/ip/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          ip, 
          reason: 'Blocked from log details',
          duration: null 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addToast(`IP ${ip} has been blocked successfully`, 'success')
      } else {
        addToast(`Failed to block IP: ${result.error || result.message}`, 'error')
      }
    } catch (error) {
      console.error('Failed to block IP:', error)
      addToast('Failed to block IP - please check your connection', 'error')
    } finally {
      isLoading.value = false
    }
  }
}

const createAlert = async (log) => {
  const title = `Security Alert: ${log.severity} ${log.log_type} Event`
  const description = `${log.raw.action} event detected from ${log.source_ip} to ${log.dest_ip}${log.endpoint ? ` at ${log.endpoint}` : ''}`
  
  isLoading.value = true
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/alerts/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title,
        description,
        severity: log.severity,
        source_ip: log.source_ip,
        dest_ip: log.dest_ip,
        log_id: log.id
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      addToast(`Alert created successfully: ${title}`, 'success')
    } else {
      addToast(`Failed to create alert: ${result.error || result.message}`, 'error')
    }
  } catch (error) {
    console.error('Failed to create alert:', error)
    addToast('Failed to create alert - please check your connection', 'error')
  } finally {
    isLoading.value = false
  }
}

const exportLog = (log) => {
  // Export single log
  const dataStr = JSON.stringify(log, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `log-${log.id}-${new Date().toISOString()}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
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
    
    if (selectedLogType.value) {
      params.log_type = selectedLogType.value
    }
    
    // Fetch filtered logs from backend
    const response = await axios.get(`${API_BASE}/export/logs`, { params })
    
    if (response.data) {
      // Create blob from backend response
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', url)
      linkElement.setAttribute('download', `${selectedLogType.value}-logs-${new Date().toISOString().split('T')[0]}.csv`)
      linkElement.click()
      URL.revokeObjectURL(url)
      
      // Show success message
      if (window.addToast) {
        window.addToast(`Exported ${selectedLogType.value} logs successfully`, 'success')
      }
    }
  } catch (error) {
    console.error('Export failed:', error)
    
    // Fallback to client-side export if backend fails
    const logsToExport = filteredLogs.value.map(log => {
      if (log.log_type === 'Registry') {
        return {
          id: log.id,
          timestamp: log.timestamp,
          log_type: log.log_type,
          severity: log.severity,
          computer: log.computer,
          user: log.user,
          registry_path: log.registry_path,
          key_name: log.key_name,
          value_type: log.value_type,
          old_value: log.old_value,
          new_value: log.new_value,
          action: log.raw?.action
        }
      } else {
        return {
          id: log.id,
          timestamp: log.timestamp,
          log_type: log.log_type,
          severity: log.severity,
          source_ip: log.source_ip,
          dest_ip: log.dest_ip,
          endpoint: log.endpoint,
          action: log.raw?.action,
          protocol: log.raw?.protocol,
          description: log.raw?.description,
          geo: log.geo
        }
      }
    })
    
    // Create CSV format with dynamic headers
    let headers, csvContent
    
    if (selectedLogType.value === 'Registry') {
      headers = ['ID', 'Timestamp', 'Log Type', 'Severity', 'Computer', 'User', 'Registry Path', 'Key Name', 'Value Type', 'Previous Value', 'New Value', 'Action']
      csvContent = [
        headers.join(','),
        ...logsToExport.map(log => [
          log.id,
          log.timestamp,
          log.log_type,
          log.severity,
          log.computer || '',
          log.user || '',
          log.registry_path || '',
          log.key_name || '',
          log.value_type || '',
          log.old_value || '',
          log.new_value || '',
          log.action || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
    } else {
      headers = ['ID', 'Timestamp', 'Log Type', 'Severity', 'Source IP', 'Destination IP', 'Endpoint', 'Action', 'Protocol', 'Description', 'Country', 'City']
      csvContent = [
        headers.join(','),
        ...logsToExport.map(log => [
          log.id,
          log.timestamp,
          log.log_type,
          log.severity,
          log.source_ip,
          log.dest_ip,
          log.endpoint || '',
          log.action || '',
          log.protocol || '',
          log.description || '',
          log.geo?.country || '',
          log.geo?.city || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
    }
    
    // Download CSV
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent)
    const exportFileDefaultName = `${selectedLogType.value}-logs-${new Date().toISOString().split('T')[0]}.csv`
    
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
</script>
