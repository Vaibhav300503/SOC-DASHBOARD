<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Network Topology</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Interactive network graph visualization</p>
      </div>
      <div class="flex gap-3">
        <button @click="refreshData" class="btn-cyber-outline">
          <i class="fas fa-redo mr-2"></i>Refresh
        </button>
        <button @click="exportData" class="btn-cyber">
          <i class="fas fa-download mr-2"></i>Export
        </button>
      </div>
    </div>

    <!-- Network Graph -->
    <div class="card-glass p-6 rounded-xl" style="height: 600px;">
      <NetworkGraph ref="networkGraph" />
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ topologyStats.internalNodes }}</div>
            <div class="stat-label">Internal Nodes</div>
          </div>
          <i class="fas fa-network-wired text-cyber-500 text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ topologyStats.externalNodes }}</div>
            <div class="stat-label">External Nodes</div>
          </div>
          <i class="fas fa-globe text-neon-orange text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ topologyStats.alertedNodes }}</div>
            <div class="stat-label">Alerted Nodes</div>
          </div>
          <i class="fas fa-exclamation-circle text-neon-red text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ formatBytes(topologyStats.totalTraffic) }}</div>
            <div class="stat-label">Total Traffic</div>
          </div>
          <i class="fas fa-arrow-right text-neon-green text-3xl opacity-20"></i>
        </div>
      </div>
    </div>

    <!-- Top Connections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Top Source IPs -->
      <div class="card-glass p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-slate-dark-50 mb-4">Top Source IPs</h3>
        <div class="space-y-3">
          <div
            v-for="(ip, idx) in topologyStats.topSources"
            :key="idx"
            class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50 hover:border-cyber-400/50 cursor-pointer transition"
            @click="selectIP(ip.ip)"
          >
            <div class="flex items-center gap-3">
              <span class="text-cyber-400 font-mono text-sm">{{ ip.ip }}</span>
              <span class="text-xs text-slate-dark-400">{{ ip.flows }} flows</span>
            </div>
            <div class="text-xs text-slate-dark-400">{{ formatBytes(ip.bytes) }}</div>
          </div>
        </div>
      </div>

      <!-- Top Destination IPs -->
      <div class="card-glass p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-slate-dark-50 mb-4">Top Destination IPs</h3>
        <div class="space-y-3">
          <div
            v-for="(ip, idx) in topologyStats.topDestinations"
            :key="idx"
            class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50 hover:border-cyber-400/50 cursor-pointer transition"
            @click="selectIP(ip.ip)"
          >
            <div class="flex items-center gap-3">
              <span class="text-cyber-400 font-mono text-sm">{{ ip.ip }}</span>
              <span class="text-xs text-slate-dark-400">{{ ip.flows }} flows</span>
            </div>
            <div class="text-xs text-slate-dark-400">{{ formatBytes(ip.bytes) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Protocols -->
    <div class="card-glass p-6 rounded-xl">
      <h3 class="text-lg font-semibold text-slate-dark-50 mb-4">Top Protocols</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          v-for="proto in topologyStats.topProtocols"
          :key="proto._id"
          class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50 text-center"
        >
          <div class="text-2xl font-bold text-cyber-400">{{ proto.count }}</div>
          <div class="text-xs text-slate-dark-400 mt-2">{{ proto._id || 'Unknown' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import NetworkGraph from '../components/soc/NetworkGraph.vue'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const networkGraph = ref(null)

const topologyStats = ref({
  internalNodes: 0,
  externalNodes: 0,
  alertedNodes: 0,
  totalTraffic: 0,
  topSources: [],
  topDestinations: [],
  topProtocols: []
})

/**
 * Format bytes
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Load topology statistics
 */
const loadStats = async () => {
  try {
    const response = await axios.get(`${API_BASE}/topology/stats`, {
      params: { timeRange: '24h' }
    })

    if (response.data.success) {
      const stats = response.data.stats
      topologyStats.value = {
        internalNodes: 0,
        externalNodes: 0,
        alertedNodes: 0,
        totalTraffic: stats.totalBytes || 0,
        topSources: [],
        topDestinations: [],
        topProtocols: stats.topProtocols || []
      }
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

/**
 * Refresh data
 */
const refreshData = async () => {
  await loadStats()
  if (networkGraph.value) {
    networkGraph.value.loadTopology()
  }
}

/**
 * Export data
 */
const exportData = async () => {
  try {
    // Get real topology data from backend
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    // Fetch comprehensive topology data
    const [logsResponse, eventsResponse] = await Promise.all([
      axios.get(`${API_BASE}/export/logs/json`, {
        params: { timeRange: '24h', limit: 1000 }
      }),
      axios.get(`${API_BASE}/export/events/json`, {
        params: { timeRange: '24h', limit: 1000 }
      })
    ])
    
    const data = {
      timestamp: new Date().toISOString(),
      stats: topologyStats.value,
      logs: logsResponse.data.data || [],
      events: eventsResponse.data.data || [],
      exportMetadata: {
        logsCount: logsResponse.data.count || 0,
        eventsCount: eventsResponse.data.count || 0,
        timeRange: '24h'
      }
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `topology-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    // Show success message
    if (window.addToast) {
      window.addToast('Topology data exported successfully', 'success')
    }
  } catch (error) {
    console.error('Export failed:', error)
    if (window.addToast) {
      window.addToast('Failed to export topology data', 'error')
    }
  }
}

/**
 * Select IP
 */
const selectIP = (ip) => {
  router.push({
    name: 'LogViewer',
    query: { ip }
  })
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.05) 0%, rgba(131, 56, 236, 0.05) 100%);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: rgba(0, 217, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 217, 255, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #00d9ff;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
