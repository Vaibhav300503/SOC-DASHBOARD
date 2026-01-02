<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Severity-Based Logs</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Organize and analyze logs by severity level</p>
      </div>
    </div>

    <!-- Severity Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <button
        v-for="severity in severities"
        :key="severity.name"
        @click="selectedSeverity = severity.name"
        :class="[
          'stat-card cursor-pointer transition-all duration-300 hover:scale-[1.02]',
          severity.name === 'Critical' ? 'card-accent-red' : 
          severity.name === 'High' ? 'card-accent-orange' :
          severity.name === 'Medium' ? 'card-accent-purple' : 'card-accent-green',
          selectedSeverity === severity.name ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-primary' : ''
        ]"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value" :style="{ color: severity.color }">{{ severity.count }}</div>
            <div class="stat-label">{{ severity.name }}</div>
          </div>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5">
            <i :class="severity.icon" :style="{ color: severity.color }"></i>
          </div>
        </div>
      </button>
    </div>

    <!-- Severity Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="severity in severities"
        :key="severity.name"
        @click="selectedSeverity = severity.name"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          selectedSeverity === severity.name
            ? 'text-white border'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-cyber-500'
        ]"
        :style="selectedSeverity === severity.name ? {
          backgroundColor: severity.color + '20',
          borderColor: severity.color,
          color: severity.color
        } : {}"
      >
        {{ severity.name }}
      </button>
    </div>

    <!-- Filters -->
    <div class="card-glass p-4 rounded-xl">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Log Type</label>
          <select v-model="filterLogType" class="input-cyber w-full">
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
          <select v-model="filterTimeRange" class="input-cyber w-full">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Source IP</label>
          <div class="relative">
            <input v-model="filterSourceIP" type="text" placeholder="Filter by IP..." class="input-cyber w-full pr-10" />
            <button 
              v-if="filterSourceIP" 
              @click="filterSourceIP = ''" 
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-dark-400 hover:text-slate-dark-300"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="flex items-end">
          <button @click="handleSeveritySearch" class="btn-cyber w-full">
            <i class="fas fa-search mr-2"></i>Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Logs Table -->
      <div class="lg:col-span-2">
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black title-gradient">{{ selectedSeverity }} Severity Logs</h3>
            <span class="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded">{{ filteredLogs.length }} TOTAL</span>
          </div>

          <div class="overflow-x-auto">
            <table class="table-cyber">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>Destination</th>
                  <th>Log Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in filteredLogs.slice(0, 20)" :key="log.id">
                  <td class="text-slate-dark-400 text-sm">{{ formatTime(log.timestamp) }}</td>
                  <td>
                    <code class="text-cyber-400 font-mono text-sm">{{ log.source_ip }}</code>
                  </td>
                  <td class="text-slate-dark-300">{{ log.endpoint }}</td>
                  <td>
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-dark-900/50 text-slate-dark-300">
                      {{ log.log_type }}
                    </span>
                  </td>
                  <td>
                    <div class="relative" @click.stop>
                      <button @click="toggleActionMenu(log.id)" class="text-cyber-400 hover:text-cyber-300">
                        <i class="fas fa-chevron-right"></i>
                      </button>
                      
                      <!-- Dropdown Menu -->
                      <div v-if="showActionMenu === log.id" class="absolute right-0 top-6 bg-slate-dark-800 border border-slate-dark-700 rounded-lg shadow-lg z-50 min-w-48">
                        <button @click="blockIP(log)" class="w-full text-left px-4 py-2 text-sm hover:bg-slate-dark-700 flex items-center gap-2">
                          <i class="fas fa-ban text-red-400"></i>
                          <span>Block IP</span>
                        </button>
                        <button @click="createAlert(log)" class="w-full text-left px-4 py-2 text-sm hover:bg-slate-dark-700 flex items-center gap-2">
                          <i class="fas fa-exclamation-triangle text-orange-400"></i>
                          <span>Create Alert</span>
                        </button>
                        <button @click="investigateLog(log)" class="w-full text-left px-4 py-2 text-sm hover:bg-slate-dark-700 flex items-center gap-2">
                          <i class="fas fa-search text-yellow-400"></i>
                          <span>Investigate</span>
                        </button>
                        <button @click="exportLog(log)" class="w-full text-left px-4 py-2 text-sm hover:bg-slate-dark-700 flex items-center gap-2">
                          <i class="fas fa-download text-blue-400"></i>
                          <span>Export Log</span>
                        </button>
                        <button @click="showLogDetails(log)" class="w-full text-left px-4 py-2 text-sm hover:bg-slate-dark-700 flex items-center gap-2">
                          <i class="fas fa-info-circle text-gray-400"></i>
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Statistics -->
      <div class="space-y-6">
        <!-- Pie Chart Alternative -->
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
          <h3 class="text-lg font-black title-gradient mb-6">Distribution</h3>
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
                    width: `${(item.value / totalLogs) * 100}%`,
                    backgroundColor: item.color,
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Top IPs for this severity -->
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-cyan/10">
          <h3 class="text-lg font-black title-gradient mb-6">Top Source IPs</h3>
          <div class="space-y-3">
            <div v-for="(ip, idx) in topIPsForSeverity.slice(0, 5)" :key="idx" class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
              <div class="flex items-center justify-between">
                <code class="text-cyber-400 font-mono text-sm">{{ ip.ip }}</code>
                <span class="font-bold text-slate-dark-50">{{ ip.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed View -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <h3 class="text-lg font-black title-gradient mb-6">Detailed Events</h3>
      <div class="space-y-4">
        <div v-for="log in filteredLogs.slice(0, 5)" :key="log.id" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-sm font-semibold text-slate-dark-50">{{ log.log_type }} - {{ log.endpoint }}</p>
              <p class="text-xs text-slate-dark-400 mt-1">
                <i class="fas fa-map-pin mr-1"></i>
                {{ log.source_ip }} → {{ log.dest_ip }}
              </p>
            </div>
            <span :class="['badge-' + log.severity.toLowerCase()]">
              {{ log.severity }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4 text-xs text-slate-dark-400 pt-3 border-t border-slate-dark-700/50">
            <div>
              <span class="text-slate-dark-500">Protocol:</span>
              <span class="text-slate-dark-300 ml-2">{{ log.raw.protocol }}</span>
            </div>
            <div>
              <span class="text-slate-dark-500">Port:</span>
              <span class="text-slate-dark-300 ml-2">{{ log.raw.port }}</span>
            </div>
            <div>
              <span class="text-slate-dark-500">Action:</span>
              <span :class="log.raw.action === 'ALLOW' ? 'text-neon-green' : 'text-neon-red'" class="ml-2">
                {{ log.raw.action }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Details Modal -->
    <div v-if="showLogModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-slate-dark-800 border border-slate-dark-600 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto mx-4">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-slate-dark-50">Log Details</h3>
          <button @click="closeLogModal" class="text-slate-dark-400 hover:text-slate-dark-300">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div v-if="selectedLogDetails" class="space-y-6">
          <!-- Basic Information -->
          <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <h4 class="text-lg font-medium text-cyber-400 mb-4">Basic Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-slate-dark-500">ID:</span>
                <span class="text-sm text-slate-dark-300 ml-2 font-mono">{{ selectedLogDetails.basic.id }}</span>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Timestamp:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.basic.timestamp }}</span>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Severity:</span>
                <span :class="['badge-' + selectedLogDetails.basic.severity.toLowerCase(), 'ml-2']">
                  {{ selectedLogDetails.basic.severity }}
                </span>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Log Type:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.basic.logType }}</span>
              </div>
              <div class="md:col-span-2">
                <span class="text-sm text-slate-dark-500">Endpoint:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.basic.endpoint }}</span>
              </div>
            </div>
          </div>
          
          <!-- Network Information -->
          <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <h4 class="text-lg font-medium text-cyber-400 mb-4">Network Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-slate-dark-500">Source IP:</span>
                <code class="text-sm text-cyber-400 ml-2 font-mono">{{ selectedLogDetails.network.sourceIP }}</code>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Destination IP:</span>
                <code class="text-sm text-cyber-400 ml-2 font-mono">{{ selectedLogDetails.network.destinationIP }}</code>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Protocol:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.network.protocol }}</span>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Port:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.network.port }}</span>
              </div>
              <div class="md:col-span-2">
                <span class="text-sm text-slate-dark-500">Action:</span>
                <span :class="selectedLogDetails.network.action === 'ALLOW' ? 'text-neon-green' : 'text-neon-red'" class="ml-2 font-medium">
                  {{ selectedLogDetails.network.action }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Additional Details -->
          <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <h4 class="text-lg font-medium text-cyber-400 mb-4">Additional Details</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <span class="text-sm text-slate-dark-500">Description:</span>
                <p class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.additional.description }}</p>
              </div>
              <div class="md:col-span-2">
                <span class="text-sm text-slate-dark-500">User Agent:</span>
                <p class="text-sm text-slate-dark-300 mt-1 font-mono break-all">{{ selectedLogDetails.additional.userAgent }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Bytes:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.additional.bytes }}</span>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Packets:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.additional.packets }}</span>
              </div>
              <div>
                <span class="text-sm text-slate-dark-500">Duration:</span>
                <span class="text-sm text-slate-dark-300 ml-2">{{ selectedLogDetails.additional.duration }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="copyLogDetails" class="btn-cyber-outline">
            <i class="fas fa-copy mr-2"></i>Copy Details
          </button>
          <button @click="exportLogDetails" class="btn-cyber">
            <i class="fas fa-download mr-2"></i>Export
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-slate-dark-800 border border-slate-dark-600 rounded-lg p-6 max-w-sm mx-4">
        <div class="flex items-center gap-3">
          <div class="animate-spin">
            <i class="fas fa-spinner text-cyber-400 text-xl"></i>
          </div>
          <div>
            <p class="text-slate-dark-50 font-medium">{{ loadingAction }}</p>
            <p class="text-slate-dark-400 text-sm">Please wait...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast.js'
import axios from 'axios'

const apiStore = useAPIStore()
const authStore = useAuthStore()
const { addToast } = useToast()
const selectedSeverity = ref('Critical')
const filterLogType = ref('')
const filterTimeRange = ref('24h')
const filterSourceIP = ref('')
const showActionMenu = ref(null)
const isLoading = ref(false)
const loadingAction = ref('')
const showLogModal = ref(false)
const selectedLogDetails = ref(null)

onMounted(async () => {
  await apiStore.fetchRecentLogs(1000)
})

const severities = computed(() => {
  const criticalCount = apiStore.logs.filter(l => l.severity === 'Critical').length
  const highCount = apiStore.logs.filter(l => l.severity === 'High').length
  const mediumCount = apiStore.logs.filter(l => l.severity === 'Medium').length
  const lowCount = apiStore.logs.filter(l => l.severity === 'Low').length
  
  return [
    { name: 'Critical', count: criticalCount, icon: 'fas fa-exclamation-circle', color: '#ff0055' },
    { name: 'High', count: highCount, icon: 'fas fa-alert', color: '#ff6b35' },
    { name: 'Medium', count: mediumCount, icon: 'fas fa-info-circle', color: '#ffd700' },
    { name: 'Low', count: lowCount, icon: 'fas fa-check-circle', color: '#00ff88' },
  ]
})

const filteredLogs = computed(() => {
  return apiStore.logs.filter(log => {
    if (log.severity !== selectedSeverity.value) return false
    if (filterLogType.value && log.log_type !== filterLogType.value) return false
    if (filterSourceIP.value && !log.source_ip?.includes(filterSourceIP.value)) return false
    return true
  })
})

const severityDistribution = computed(() => {
  const criticalCount = apiStore.logs.filter(l => l.severity === 'Critical').length
  const highCount = apiStore.logs.filter(l => l.severity === 'High').length
  const mediumCount = apiStore.logs.filter(l => l.severity === 'Medium').length
  const lowCount = apiStore.logs.filter(l => l.severity === 'Low').length
  
  return [
    { name: 'Critical', value: criticalCount, color: '#ff0055' },
    { name: 'High', value: highCount, color: '#ff6b35' },
    { name: 'Medium', value: mediumCount, color: '#ffd700' },
    { name: 'Low', value: lowCount, color: '#00ff88' },
  ]
})

const totalLogs = computed(() => apiStore.logs.length)

const topIPsForSeverity = computed(() => {
  const ips = {}
  filteredLogs.value.forEach(log => {
    ips[log.source_ip] = (ips[log.source_ip] || 0) + 1
  })
  return Object.entries(ips)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const toggleActionMenu = (logId) => {
  showActionMenu.value = showActionMenu.value === logId ? null : logId
}

// Close menu when clicking outside
document.addEventListener('click', () => {
  showActionMenu.value = null
})

const blockIP = async (log) => {
  showActionMenu.value = null // Close menu first
  isLoading.value = true
  loadingAction.value = 'Blocking IP...'
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  
  try {
    const response = await axios.post(`${API_BASE}/ip/block`, 
      { 
        ip: log.source_ip, 
        reason: `Manually blocked from ${log.log_type} log: ${log.endpoint}` 
      },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    )
    
    // Check if IP was actually blocked
    if (response.data.success) {
      addToast(`IP ${log.source_ip} blocked successfully! Reason: ${response.data.message || 'Manual block'}`, 'success')
    } else {
      addToast(`IP ${log.source_ip} was not blocked: ${response.data.message || 'Unknown reason'}`, 'warning')
    }
  } catch (error) {
    console.error('Failed to block IP:', error)
    let errorMessage = 'Unknown error occurred'
    
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 400) {
        errorMessage = error.response.data.error || 'IP already blocked or invalid request'
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - please login again'
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied - insufficient privileges'
      } else if (error.response.status === 500) {
        errorMessage = 'Server error - please try again later'
      } else {
        errorMessage = error.response.data.error || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - please check connection'
    } else {
      errorMessage = error.message || 'Unknown error'
    }
    
    addToast(`Failed to block IP ${log.source_ip}: ${errorMessage}`, 'error')
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

const createAlert = async (log) => {
  showActionMenu.value = null // Close menu first
  isLoading.value = true
  loadingAction.value = 'Creating alert...'
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  
  try {
    const response = await axios.post(`${API_BASE}/alerts/rules`,
      {
        name: `Alert: ${log.log_type} from ${log.source_ip}`,
        condition: `source_ip == '${log.source_ip}' AND log_type == '${log.log_type}'`,
        severity: log.severity,
        description: `Manual alert for ${log.log_type} activity targeting ${log.endpoint}`,
        enabled: true
      },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    )
    
    // Check if alert was actually created
    if (response.data.success) {
      addToast(`Alert created successfully for ${log.source_ip}! Rule: ${response.data.data?.name || 'New alert rule'}`, 'success')
    } else {
      addToast(`Alert was not created: ${response.data.message || 'Unknown reason'}`, 'warning')
    }
  } catch (error) {
    console.error('Failed to create alert:', error)
    let errorMessage = 'Unknown error occurred'
    
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 400) {
        errorMessage = error.response.data.message || 'Invalid alert data or missing required fields'
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - please login again'
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied - admin privileges required'
      } else if (error.response.status === 500) {
        errorMessage = 'Server error - please try again later'
      } else {
        errorMessage = error.response.data.message || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - please check connection'
    } else {
      errorMessage = error.message || 'Unknown error'
    }
    
    addToast(`Failed to create alert for ${log.source_ip}: ${errorMessage}`, 'error')
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

const investigateLog = async (log) => {
  showActionMenu.value = null // Close menu first
  isLoading.value = true
  loadingAction.value = 'Investigating IP...'
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  
  try {
    const [whoisResponse, geoResponse] = await Promise.all([
      axios.get(`${API_BASE}/lookup/whois/${log.source_ip}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }),
      axios.get(`${API_BASE}/lookup/geoip/${log.source_ip}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ])
    
    // Verify we got valid data
    if (!whoisResponse.data.success || !geoResponse.data.success) {
      throw new Error('Investigation services returned invalid data')
    }
    
    const investigationData = {
      log: log,
      whois: whoisResponse.data.data,
      geo: geoResponse.data.data,
      timestamp: new Date().toISOString(),
      investigationStatus: 'completed'
    }
    
    // Download investigation report
    const jsonString = JSON.stringify(investigationData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `investigation-${log.source_ip}-${Date.now()}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    addToast(`Investigation completed for ${log.source_ip}! Report downloaded successfully.`, 'success')
  } catch (error) {
    console.error('Investigation failed:', error)
    let errorMessage = 'Unknown error occurred'
    
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 400) {
        errorMessage = 'Invalid IP address or lookup failed'
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - please login again'
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied - insufficient privileges'
      } else if (error.response.status === 500) {
        errorMessage = 'Investigation service error - please try again later'
      } else {
        errorMessage = error.response.data.error || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - please check connection'
    } else {
      errorMessage = error.message || 'Investigation service unavailable'
    }
    
    addToast(`Investigation failed for ${log.source_ip}: ${errorMessage}`, 'error')
    // Fallback: show basic log details
    showLogDetails(log)
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

const exportLog = (log) => {
  showActionMenu.value = null // Close menu first
  
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      log: log,
      severity: log.severity,
      exportedBy: 'manual_action',
      exportStatus: 'completed'
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `log-${log.id}-${Date.now()}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    addToast(`Log ${log.id} exported successfully! File: log-${log.id}-${Date.now()}.json`, 'success')
  } catch (error) {
    console.error('Export failed:', error)
    addToast(`Failed to export log ${log.id}: ${error.message || 'Export error'}`, 'error')
  }
}

const showLogDetails = (log) => {
  showActionMenu.value = null // Close menu first
  
  try {
    // Create a detailed log information object
    const logDetails = {
      basic: {
        id: log.id || 'N/A',
        timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
        severity: log.severity || 'N/A',
        logType: log.log_type || 'N/A',
        endpoint: log.endpoint || 'N/A'
      },
      network: {
        sourceIP: log.source_ip || 'N/A',
        destinationIP: log.dest_ip || 'N/A',
        protocol: log.raw?.protocol || 'N/A',
        port: log.raw?.port || 'N/A',
        action: log.raw?.action || 'N/A'
      },
      additional: {
        description: log.raw?.description || 'N/A',
        userAgent: log.raw?.user_agent || 'N/A',
        bytes: log.raw?.bytes || 'N/A',
        packets: log.raw?.packets || 'N/A',
        duration: log.raw?.duration || 'N/A'
      }
    }
    
    // Set modal data and show modal
    selectedLogDetails.value = logDetails
    showLogModal.value = true
    
    addToast(`Showing detailed information for ${log.log_type} from ${log.source_ip}`, 'info')
  } catch (error) {
    console.error('Error showing log details:', error)
    addToast(`Failed to show log details: ${error.message}`, 'error')
  }
}

const closeLogModal = () => {
  showLogModal.value = false
  selectedLogDetails.value = null
}

const copyLogDetails = async () => {
  if (!selectedLogDetails.value) return
  
  try {
    const details = JSON.stringify(selectedLogDetails.value, null, 2)
    await navigator.clipboard.writeText(details)
    addToast('Log details copied to clipboard', 'success')
  } catch (error) {
    console.error('Failed to copy:', error)
    addToast('Failed to copy log details', 'error')
  }
}

const exportLogDetails = () => {
  if (!selectedLogDetails.value) return
  
  try {
    const jsonString = JSON.stringify(selectedLogDetails.value, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `log-details-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    addToast('Log details exported successfully', 'success')
  } catch (error) {
    console.error('Export failed:', error)
    addToast('Failed to export log details', 'error')
  }
}

const handleSeveritySearch = () => {
  const hasFilters = filterLogType.value || filterSourceIP.value
  
  if (hasFilters) {
    addToast(`Search applied: ${filteredLogs.value.length} logs found`, 'success')
  } else {
    addToast('Please enter search criteria', 'warning')
  }
}
</script>
