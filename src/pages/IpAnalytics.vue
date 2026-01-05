<template>
  <div class="space-y-8">
    <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black title-gradient tracking-tight">IP Analytics</h1>
          <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Detailed IP-based threat analysis and patterns</p>
        </div>
      </div>

    <!-- IP Lookup -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <h3 class="text-lg font-black title-gradient mb-4">IP Lookup</h3>
      <div class="flex gap-3">
        <input
          v-model="searchIP"
          type="text"
          placeholder="Enter IP address (e.g., 192.168.1.1)"
          class="input-cyber flex-1"
        />
        <button class="btn-cyber" @click="handleIPSearch" :disabled="!searchIP || loading">
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-search', 'mr-2']"></i>{{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>
    </div>

    <!-- Time Range Selection -->
    <div class="flex gap-3">
      <button
        v-for="range in timeRanges"
        :key="range"
        @click="selectedTimeRange = range"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-all duration-200',
          selectedTimeRange === range
            ? 'bg-cyber-600 text-white border border-cyber-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-cyber-500'
        ]"
      >
        {{ range }}
      </button>
    </div>

    <!-- IP Search Results -->
    <div v-if="showResults && searchResults" class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/20">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black title-gradient">Search Results: {{ searchResults.ip }}</h3>
        <button @click="showResults = false" class="text-slate-dark-400 hover:text-slate-dark-300">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card card-accent-cyan">
          <div class="stat-value text-accent-primary">{{ searchResults.totalEvents }}</div>
          <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-card card-accent-red">
          <div class="stat-value text-neon-red">{{ searchResults.criticalCount }}</div>
          <div class="stat-label">Critical Events</div>
        </div>
        <div class="stat-card card-accent-orange">
          <div class="stat-value text-neon-orange">{{ searchResults.riskScore }}</div>
          <div class="stat-label">Risk Score</div>
        </div>
        <div class="stat-card card-accent-purple">
          <div :class="['stat-value', 'badge-' + searchResults.riskLevel.toLowerCase()]">{{ searchResults.riskLevel }}</div>
          <div class="stat-label">Risk Level</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 class="text-md font-semibold text-slate-dark-50 mb-3">Activity Summary</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-dark-400">Source Events:</span>
              <span class="text-slate-dark-300 font-mono">{{ searchResults.sourceEvents }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-dark-400">Destination Events:</span>
              <span class="text-slate-dark-300 font-mono">{{ searchResults.destEvents }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-dark-400">First Seen:</span>
              <span class="text-slate-dark-300">{{ searchResults.firstSeen ? new Date(searchResults.firstSeen).toLocaleString() : 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-dark-400">Last Seen:</span>
              <span class="text-slate-dark-300">{{ searchResults.lastSeen ? new Date(searchResults.lastSeen).toLocaleString() : 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-md font-semibold text-slate-dark-50 mb-3">Endpoints & Types</h4>
          <div class="space-y-2">
            <div>
              <span class="text-xs text-slate-dark-400">Endpoints:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span v-for="endpoint in searchResults.endpoints.slice(0, 5)" :key="endpoint" 
                      class="text-xs px-2 py-1 bg-cyber-600/20 text-cyber-400 rounded">
                  {{ endpoint }}
                </span>
                <span v-if="searchResults.endpoints.length > 5" 
                      class="text-xs px-2 py-1 bg-slate-dark-700 text-slate-dark-400 rounded">
                  +{{ searchResults.endpoints.length - 5 }} more
                </span>
              </div>
            </div>
            <div>
              <span class="text-xs text-slate-dark-400">Log Types:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span v-for="type in searchResults.logTypes" :key="type" 
                      class="text-xs px-2 py-1 bg-slate-dark-700 text-slate-dark-300 rounded">
                  {{ type }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="searchResults.recentLogs.length > 0" class="mt-6">
        <h4 class="text-md font-semibold text-slate-dark-50 mb-3">Recent Activity</h4>
        <div class="space-y-2">
          <div v-for="log in searchResults.recentLogs.slice(0, 5)" :key="log.id" 
               class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span :class="['badge-' + log.severity.toLowerCase()]">{{ log.severity }}</span>
                <span class="text-sm font-mono text-cyber-400">{{ log.source_ip }}</span>
                <span class="text-slate-dark-500">→</span>
                <span class="text-sm font-mono text-cyber-400">{{ log.dest_ip }}</span>
              </div>
              <span class="text-xs text-slate-dark-500">{{ new Date(log.timestamp).toLocaleString() }}</span>
            </div>
            <div class="text-xs text-slate-dark-400 mt-1">
              {{ log.log_type }} • {{ log.endpoint }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- IP Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card card-accent-cyan">
        <div class="stat-value text-accent-primary">{{ uniqueIPs }}</div>
        <div class="stat-label">Unique IPs</div>
      </div>
      <div class="stat-card card-accent-red">
        <div class="stat-value text-neon-red">{{ criticalIPs }}</div>
        <div class="stat-label">Critical IPs</div>
      </div>
      <div class="stat-card card-accent-orange">
        <div class="stat-value text-neon-orange">{{ avgAlertsPerIP }}</div>
        <div class="stat-label">Avg Alerts/IP</div>
      </div>
      <div class="stat-card card-accent-green">
        <div class="stat-value text-neon-green text-sm font-mono truncate">{{ topIP.ip || 'N/A' }}</div>
        <div class="stat-label">Most Active IP</div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: IP Table -->
      <div class="lg:col-span-2">
        <IpTable title="Source IP Analysis" :data="apiStore.aggregatedSourceIPs" />
      </div>

      <!-- Right: Severity Distribution -->
      <div>
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
          <h3 class="text-lg font-black title-gradient mb-6">Severity Distribution</h3>
          <div class="space-y-4">
            <div v-for="item in severityStats" :key="item.name" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-dark-300">{{ item.name }}</span>
                <span class="text-sm font-bold text-slate-dark-50">{{ item.count }}</span>
              </div>
              <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
                <div
                  class="h-full rounded-full"
                  :style="{
                    width: `${(item.count / totalLogs) * 100}%`,
                    backgroundColor: item.color,
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Destination IPs -->
    <IpTable title="Destination IP Analysis" :data="apiStore.aggregatedDestinationIPs" />

    <!-- IP Trends -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <h3 class="text-lg font-black title-gradient mb-6">IP Activity Trends</h3>
      <div v-if="apiStore.aggregatedSourceIPs.length > 0" class="space-y-4">
        <div v-for="(ip, idx) in apiStore.aggregatedSourceIPs.slice(0, 5)" :key="idx" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="font-mono text-cyber-400 font-semibold">{{ ip.ip }}</p>
              <p class="text-xs text-slate-dark-400 mt-1">
                <i class="fas fa-clock mr-1"></i>
                Last seen: {{ formatTimeAgo(ip.lastSeen) }}
              </p>
            </div>
            <span :class="['badge-' + getSeverityClass(ip.severity)]">
              {{ getSeverityLabel(ip.severity) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-dark-400">
            <span>{{ ip.count }} events</span>
            <span v-if="ip.endpoints.length > 0" class="text-slate-dark-500">
              {{ ip.endpoints.length }} endpoint{{ ip.endpoints.length > 1 ? 's' : '' }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-slate-dark-500">
        <i class="fas fa-inbox text-4xl mb-3 block text-slate-dark-600"></i>
        <p class="text-sm">No IP activity data available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import IpTable from '../components/soc/IpTable.vue'
import { normalizeSeverity } from '../utils/severityNormalization'

const apiStore = useAPIStore()
const searchIP = ref('')
const selectedTimeRange = ref('24h')
const timeRanges = ['24h', '7d', '30d', '90d']
const loading = ref(false)
const searchResults = ref(null)
const showResults = ref(false)

onMounted(async () => {
  await apiStore.fetchRecentLogs()
})

const uniqueIPs = computed(() => {
  const ips = new Set(apiStore.logs.map(l => l.source_ip))
  return ips.size
})

const criticalIPs = computed(() => {
  const criticalLogs = apiStore.logs.filter(l => l.severity === 'Critical')
  const ips = new Set(criticalLogs.map(l => l.source_ip))
  return ips.size
})

const avgAlertsPerIP = computed(() => {
  if (uniqueIPs.value === 0) return 0
  return (apiStore.logs.length / uniqueIPs.value).toFixed(1)
})

const topIP = computed(() => apiStore.aggregatedSourceIPs[0] || {})

const severityStats = computed(() => {
  // Use aggregated source IPs to calculate severity distribution
  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  }
  
  apiStore.aggregatedSourceIPs.forEach(ip => {
    const severity = ip.severity || 'Low'
    if (severity in severityCounts) {
      severityCounts[severity] += ip.count
    }
  })
  
  return [
    { name: 'Critical', count: severityCounts.Critical, color: '#ff0055' },
    { name: 'High', count: severityCounts.High, color: '#ff6b35' },
    { name: 'Medium', count: severityCounts.Medium, color: '#ffd700' },
    { name: 'Low', count: severityCounts.Low, color: '#00ff88' },
  ]
})

const totalLogs = computed(() => {
  return apiStore.aggregatedSourceIPs.reduce((sum, ip) => sum + ip.count, 0)
})

const getSeverityClass = (severity) => {
  const normalized = normalizeSeverity(severity)
  return normalized.toLowerCase()
}

const getSeverityLabel = (severity) => {
  return normalizeSeverity(severity)
}

const formatTimeAgo = (date) => {
  if (!date) return 'N/A'
  
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return new Date(date).toLocaleDateString()
}

const handleIPSearch = async () => {
  if (!searchIP.value.trim()) return
  
  try {
    loading.value = true
    
    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(searchIP.value.trim())) {
      if (window.addToast) {
        window.addToast('Please enter a valid IP address', 'error')
      }
      return
    }
    
    const ip = searchIP.value.trim()
    
    // Call real API instead of local filtering
    const response = await apiStore.fetchLogsByIP(ip, selectedTimeRange.value)
    const ipLogs = response.logs || []
    const stats = response.stats || { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    
    // Calculate risk score
    const riskScore = Math.min(100, (stats.critical * 25) + (stats.high * 10) + (stats.total * 2))
    
    // Determine risk level
    let riskLevel = 'Low'
    if (riskScore > 75) riskLevel = 'Critical'
    else if (riskScore > 50) riskLevel = 'High'
    else if (riskScore > 25) riskLevel = 'Medium'
    
    searchResults.value = {
      ip,
      totalEvents: stats.total,
      sourceEvents: ipLogs.filter(l => l.source_ip === ip).length,
      destEvents: ipLogs.filter(l => l.dest_ip === ip).length,
      criticalCount: stats.critical,
      highCount: stats.high,
      riskScore,
      riskLevel,
      firstSeen: ipLogs.length > 0 ? new Date(Math.min(...ipLogs.map(l => new Date(l.timestamp)))) : null,
      lastSeen: ipLogs.length > 0 ? new Date(Math.max(...ipLogs.map(l => new Date(l.timestamp)))) : null,
      endpoints: [...new Set(ipLogs.map(l => l.endpoint))],
      logTypes: [...new Set(ipLogs.map(l => l.log_type))],
      recentLogs: ipLogs
    }
    
    showResults.value = true
    
    if (window.addToast) {
      window.addToast(`Found ${ipLogs.length} events for IP ${ip}`, 'success')
    }
    
  } catch (error) {
    console.error('IP search error:', error)
    if (window.addToast) {
      window.addToast('Failed to search IP', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>
