<template>
  <div class="space-y-6 relative z-10">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-2xl font-bold text-slate-50 tracking-tight">Security Operations Center</h1>
        <p class="text-slate-400 mt-1 text-sm">Real-time threat monitoring and analysis</p>
      </div>
      <div class="flex gap-3">
        <button 
          @click="handleRefresh"
          class="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all text-sm font-medium"
          :disabled="isRefreshing"
        >
          <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" class="mr-2 text-xs"></i>
          {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button 
          @click="handleExport"
          class="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all text-sm font-medium"
          :disabled="isExporting"
        >
          <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'" class="mr-2 text-xs"></i>
          {{ isExporting ? 'Exporting...' : 'Export' }}
        </button>
      </div>
    </div>

    <!-- Key Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Events</div>
          <div class="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <i class="fas fa-file-alt text-cyan-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-50">{{ apiStore.total.toLocaleString() }}</div>
        <div class="text-xs font-medium text-emerald-400 mt-2 flex items-center gap-1">
          <i class="fas fa-arrow-up text-[10px]"></i>
          12% vs last hour
        </div>
      </div>

      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical</div>
          <div class="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
            <i class="fas fa-exclamation-circle text-red-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-red-400">{{ getCriticalCount() }}</div>
        <div class="text-xs font-medium text-slate-500 mt-2">
          Requires immediate attention
        </div>
      </div>

      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">High Priority</div>
          <div class="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <i class="fas fa-radiation text-orange-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-orange-400">{{ getHighCount() }}</div>
        <div class="text-xs font-medium text-slate-500 mt-2">
          Under investigation
        </div>
      </div>

      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Hosts</div>
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <i class="fas fa-server text-emerald-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-emerald-400">{{ apiStore.uniqueHosts }}</div>
        <div class="text-xs font-medium text-slate-500 mt-2">
          Monitored endpoints
        </div>
      </div>
    </div>

    <!-- Alert & Case Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Alerts</div>
          <div class="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <i class="fas fa-bell text-purple-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-purple-400">{{ apiStore.totalAlerts }}</div>
        <div class="text-xs font-medium text-slate-500 mt-2">
          System generated alerts
        </div>
      </div>

      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical Alerts</div>
          <div class="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
            <i class="fas fa-radiation-alt text-red-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-red-400">{{ apiStore.criticalAlerts }}</div>
        <div class="text-xs font-medium text-slate-500 mt-2">
          Potential security breaches
        </div>
      </div>

      <div class="card-glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Analyzed Alerts</div>
          <div class="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <i class="fas fa-microscope text-cyan-400 text-sm"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-cyan-400">{{ apiStore.analyzedAlerts }}</div>
        <div class="text-xs font-medium text-slate-500 mt-2">
          Verified security threats
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Network Topology -->
      <div class="lg:col-span-2">
        <div class="card-glass p-7 rounded-xl h-full">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-slate-50">Network Topology</h3>
            <div class="flex gap-2">
              <span class="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-md border border-cyan-500/20">LIVE</span>
            </div>
          </div>
          <NetworkGraphLight />
        </div>
      </div>

      <!-- Right Column: Severity Chart -->
      <div>
        <div class="card-glass p-7 rounded-xl h-full">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-slate-50">Severity Distribution</h3>
          </div>
          <SeverityChart />
        </div>
      </div>
    </div>

    <!-- Log Type Distribution -->
    <div class="card-glass p-7 rounded-xl">
      <h3 class="text-lg font-semibold text-slate-50 mb-6">Log Types Distribution</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div v-for="item in getLogTypeDistribution()" :key="item.name" class="bg-slate-800/30 rounded-lg p-4 border border-slate-700/40 text-center hover:bg-slate-800/50 transition-colors">
          <div class="text-2xl font-bold text-cyan-400">{{ item.value }}</div>
          <div class="text-xs text-slate-400 mt-2 font-medium">{{ item.name }}</div>
        </div>
      </div>
    </div>

    <!-- Security & Session Info -->
    <SecurityInfo />

    <!-- IP Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <IpTable title="Top 10 Source IPs" :data="getTopSourceIPs()" />
      <IpTable title="Top 10 Destination IPs" :data="getTopDestinationIPs()" />
    </div>

    <!-- Network Activity Summary -->
    <div class="card-glass p-7 rounded-xl">
      <h3 class="text-lg font-semibold text-slate-50 mb-6">Network Activity Summary</h3>
      <TailscaleStats />
    </div>

    <!-- Security Logs & Cases Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="card-glass p-7 rounded-xl h-full">
          <h3 class="text-lg font-semibold text-slate-50 mb-6">Real-time Logs</h3>
          <LogsDisplay />
        </div>
      </div>
      <div>
        <!-- Recent TheHive Cases -->
        <div class="card-glass p-7 rounded-xl h-full">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-slate-50">Recent Cases</h3>
            <span class="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-md border border-purple-500/20 font-medium">
              {{ apiStore.hiveCases.length }} active
            </span>
          </div>
          
          <div v-if="apiStore.hiveCases.length === 0" class="text-center py-12 opacity-50">
            <i class="fas fa-folder-open text-4xl mb-3 block text-slate-600"></i>
            <p class="text-sm text-slate-500">No recent cases found</p>
          </div>
          
          <div v-else class="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div 
              v-for="hCase in apiStore.hiveCases" 
              :key="hCase.id || hCase._id"
              class="p-4 bg-slate-800/30 rounded-lg border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/50 transition-all group"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
                    {{ hCase.title }}
                  </div>
                  <div class="text-xs text-slate-400 mt-1 line-clamp-2">
                    {{ hCase.description }}
                  </div>
                </div>
                <div 
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
                    hCase.severity === 4 ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                    hCase.severity === 3 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  ]"
                >
                  {{ hCase.severity === 4 ? 'CRITICAL' : hCase.severity === 3 ? 'HIGH' : 'MED' }}
                </div>
              </div>
              
              <div class="flex items-center justify-between mt-3 text-[10px] text-slate-500">
                <div class="flex items-center gap-2">
                  <span class="flex items-center gap-1">
                    <i class="fas fa-user text-[9px]"></i>
                    {{ hCase.owner || 'Unassigned' }}
                  </span>
                  <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
                  <span>{{ formatTime(hCase.createdAt || hCase._createdAt) }}</span>
                </div>
                <div class="px-2 py-0.5 bg-slate-700/50 rounded text-slate-400 text-[10px] font-medium">
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
