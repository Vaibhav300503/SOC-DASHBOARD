<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Security Operations Center</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Real-time threat monitoring and analysis</p>
      </div>
      <div class="flex gap-3">
        <button 
          @click="handleRefresh"
          class="btn-cyber-outline"
          :disabled="isRefreshing"
        >
          <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" class="mr-2"></i>
          {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button 
          @click="handleExport"
          class="btn-cyber"
          :disabled="isExporting"
        >
          <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'" class="mr-2"></i>
          {{ isExporting ? 'Exporting...' : 'Export' }}
        </button>
      </div>
    </div>

    <!-- Key Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat-card card-accent-cyan">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">Total Events</div>
          <div class="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <i class="fas fa-file-alt text-accent-primary text-xs"></i>
          </div>
        </div>
        <div class="stat-value">{{ apiStore.total.toLocaleString() }}</div>
        <div class="text-[10px] font-bold text-neon-red mt-2 flex items-center gap-1">
          <i class="fas fa-arrow-up"></i>
          12% vs last hour
        </div>
      </div>

      <div class="stat-card card-accent-red">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">Critical</div>
          <div class="w-8 h-8 rounded-lg bg-neon-red/10 flex items-center justify-center">
            <i class="fas fa-exclamation-circle text-neon-red text-xs"></i>
          </div>
        </div>
        <div class="stat-value kpi-critical text-neon-red">{{ getCriticalCount() }}</div>
        <div class="text-[10px] font-medium text-slate-dark-400 mt-2">
          Requires immediate attention
        </div>
      </div>

      <div class="stat-card card-accent-orange">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">High Priority</div>
          <div class="w-8 h-8 rounded-lg bg-neon-orange/10 flex items-center justify-center">
            <i class="fas fa-radiation text-neon-orange text-xs"></i>
          </div>
        </div>
        <div class="stat-value kpi-high text-neon-orange">{{ getHighCount() }}</div>
        <div class="text-[10px] font-medium text-slate-dark-400 mt-2">
          Under investigation
        </div>
      </div>

      <div class="stat-card card-accent-green">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">Active Hosts</div>
          <div class="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center">
            <i class="fas fa-server text-neon-green text-xs"></i>
          </div>
        </div>
        <div class="stat-value kpi-green text-neon-green">{{ apiStore.uniqueHosts }}</div>
        <div class="text-[10px] font-medium text-slate-dark-400 mt-2">
          Monitored endpoints
        </div>
      </div>
    </div>

    <!-- Alert & Case Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat-card card-accent-purple">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">Total Alerts</div>
          <div class="w-8 h-8 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
            <i class="fas fa-bell text-accent-secondary text-xs"></i>
          </div>
        </div>
        <div class="stat-value kpi-normal text-accent-secondary">{{ apiStore.totalAlerts }}</div>
        <div class="text-[10px] font-medium text-slate-dark-400 mt-2">
          System generated alerts
        </div>
      </div>

      <div class="stat-card card-accent-red">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">Critical Alerts</div>
          <div class="w-8 h-8 rounded-lg bg-neon-red/10 flex items-center justify-center">
            <i class="fas fa-radiation-alt text-neon-red text-xs"></i>
          </div>
        </div>
        <div class="stat-value kpi-critical text-neon-red">{{ apiStore.criticalAlerts }}</div>
        <div class="text-[10px] font-medium text-slate-dark-400 mt-2">
          Potential security breaches
        </div>
      </div>

      <div class="stat-card card-accent-cyan">
        <div class="flex items-center justify-between mb-2">
          <div class="stat-label kpi-label">Analyzed Alerts</div>
          <div class="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <i class="fas fa-microscope text-accent-primary text-xs"></i>
          </div>
        </div>
        <div class="stat-value kpi-cyan text-accent-primary">{{ apiStore.analyzedAlerts }}</div>
        <div class="text-[10px] font-medium text-slate-dark-400 mt-2">
          Verified security threats
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Network Topology (Lightweight Canvas-based) -->
      <div class="lg:col-span-2">
        <div class="card-glass p-6 rounded-xl h-full border-t border-t-accent-primary/20">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black title-gradient">Network Topology</h3>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded">LIVE</span>
            </div>
          </div>
          <NetworkGraphLight />
        </div>
      </div>

      <!-- Right Column: Severity Chart -->
      <div>
        <div class="card-glass p-6 rounded-xl h-full border-t border-t-accent-secondary/20">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black title-gradient">Severity Distribution</h3>
          </div>
          <SeverityChart />
        </div>
      </div>
    </div>

    <!-- Log Type Distribution -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <h3 class="text-lg font-black title-gradient mb-6">Log Types Distribution</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div v-for="item in getLogTypeDistribution()" :key="item.name" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50 text-center">
          <div class="text-2xl font-bold text-cyber-400">{{ item.value }}</div>
          <div class="text-xs text-slate-dark-400 mt-2">{{ item.name }}</div>
        </div>
      </div>
    </div>

    <!-- Security & Session Info -->
    <SecurityInfo />

    <!-- IP Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <IpTable title="Top 10 Source IPs" :data="getTopSourceIPs()" />
      <IpTable title="Top 10 Destination IPs" :data="getTopDestinationIPs()" />
    </div>

    <!-- Network Activity Summary -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-cyan/10">
      <h3 class="text-lg font-black title-gradient mb-6">Network Activity Summary</h3>
      <TailscaleStats />
    </div>

    <!-- Security Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <div class="card-glass p-6 rounded-xl h-full border-t border-t-accent-primary/10">
          <h3 class="text-lg font-black title-gradient mb-6">Real-time Logs</h3>
          <LogsDisplay />
        </div>
      </div>
      <div>
        <!-- Recent TheHive Cases -->
        <div class="card-glass p-6 rounded-xl h-full border-t border-t-accent-purple/10">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black title-gradient">Recent TheHive Cases</h3>
            <span class="px-2 py-1 bg-cyber-500/10 text-cyber-400 text-xs rounded border border-cyber-500/20">
              {{ apiStore.hiveCases.length }} active
            </span>
          </div>
          
          <div v-if="apiStore.hiveCases.length === 0" class="text-center py-10 opacity-50">
            <i class="fas fa-folder-open text-3xl mb-3 block"></i>
            <p class="text-sm">No recent cases found</p>
          </div>
          
          <div v-else class="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div 
              v-for="hCase in apiStore.hiveCases" 
              :key="hCase.id || hCase._id"
              class="p-4 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50 hover:border-cyber-500/30 transition-all group"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-bold text-slate-dark-50 truncate group-hover:text-cyber-400 transition-colors">
                    {{ hCase.title }}
                  </div>
                  <div class="text-xs text-slate-dark-400 mt-1 line-clamp-2">
                    {{ hCase.description }}
                  </div>
                </div>
                <div 
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider whitespace-nowrap',
                    hCase.severity === 4 ? 'bg-neon-red/10 text-neon-red border border-neon-red/20' :
                    hCase.severity === 3 ? 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20' :
                    'bg-cyber-500/10 text-cyber-400 border border-cyber-500/20'
                  ]"
                >
                  {{ hCase.severity === 4 ? 'CRITICAL' : hCase.severity === 3 ? 'HIGH' : 'MED' }}
                </div>
              </div>
              
              <div class="flex items-center justify-between mt-4 text-[10px] text-slate-dark-500">
                <div class="flex items-center gap-2">
                  <span class="flex items-center gap-1">
                    <i class="fas fa-user text-[8px]"></i>
                    {{ hCase.owner || 'Unassigned' }}
                  </span>
                  <span class="w-1 h-1 bg-slate-dark-700 rounded-full"></span>
                  <span>{{ formatTime(hCase.createdAt || hCase._createdAt) }}</span>
                </div>
                <div class="px-1.5 py-0.5 bg-slate-dark-800 rounded text-slate-dark-300">
                  {{ hCase.status || 'Open' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '../stores/apiStore'
import NetworkGraphLight from '../components/soc/NetworkGraphLight.vue'
import SeverityChart from '../components/soc/SeverityChart.vue'
import IpTable from '../components/soc/IpTable.vue'
import TailscaleStats from '../components/soc/TailscaleStats.vue'
import LogsDisplay from '../components/soc/LogsDisplay.vue'
import SecurityInfo from '../components/soc/SecurityInfo.vue'
import { useToast } from '../composables/useToast.js'

const apiStore = useAPIStore()
const router = useRouter()
const { addToast } = useToast()

const isRefreshing = ref(false)
const isExporting = ref(false)
const lastRefreshAt = ref(0)
 
const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleString()
}

const getCriticalCount = () => {
  return apiStore.severityBreakdown.find(s => s._id === 'Critical')?.count || 0
}

const getHighCount = () => {
  return apiStore.severityBreakdown.find(s => s._id === 'High')?.count || 0
}

const getLogTypeDistribution = () => {
  return apiStore.logTypeBreakdown
}

const getTopSourceIPs = () => {
  return apiStore.topSourceIPs.map(item => ({
    ip: item._id,
    count: item.count
  }))
}

const getTopDestinationIPs = () => {
  return apiStore.topDestinationIPs.map(item => ({
    ip: item._id,
    count: item.count
  }))
}

onMounted(async () => {
  // Auto-refresh only once per browser session
  const autoRefreshed = sessionStorage.getItem('dashboardAutoRefreshed')
  if (!autoRefreshed) {
    await handleRefresh()
    sessionStorage.setItem('dashboardAutoRefreshed', '1')
  }
})

const handleRefresh = async () => {
  try {
    // Cooldown: prevent refresh spamming within 5 seconds
    const now = Date.now()
    if (now - lastRefreshAt.value < 5000) {
      return
    }
    lastRefreshAt.value = now
    isRefreshing.value = true
    await Promise.all([
      apiStore.fetchDashboardStats(),
      apiStore.fetchTailscaleStats(),
      apiStore.fetchRecentEvents(),
      apiStore.fetchAlertMetrics(),
      apiStore.fetchRecentAlerts(20),
      apiStore.fetchRecentCases(10) // Added fetch for TheHive cases
    ])
    addToast('Dashboard data refreshed successfully', 'success')
  } catch (error) {
    console.error('Failed to refresh data:', error)
    addToast('Failed to refresh dashboard data', 'error')
  } finally {
    isRefreshing.value = false
  }
}

const handleExport = async () => {
  try {
    isExporting.value = true
    
    // Get dashboard stats from backend
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    
    // Create export data with real backend data
    const exportData = {
      timestamp: new Date().toISOString(),
      dashboardStats: {
        totalEvents: apiStore.total,
        criticalCount: getCriticalCount(),
        highCount: getHighCount(),
        activeHosts: apiStore.uniqueHosts
      },
      severityBreakdown: apiStore.severityBreakdown,
      logTypeBreakdown: apiStore.logTypeBreakdown,
      topSourceIPs: getTopSourceIPs(),
      topDestinationIPs: getTopDestinationIPs(),
      recentEvents: apiStore.recentEvents?.slice(0, 100) || []
    }
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2)
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `soc-dashboard-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    addToast('Dashboard exported successfully', 'success')
  } catch (error) {
    console.error('Export failed:', error)
    addToast('Failed to export dashboard data', 'error')
  } finally {
    isExporting.value = false
  }
}
</script>
