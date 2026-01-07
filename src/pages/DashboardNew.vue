<template>
  <div class="space-y-6">
    <!-- Page Header with Animated Gradient -->
    <div class="mb-8 animate-fade-in">
      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative">
          <h1 class="text-3xl font-black title-gradient tracking-tight mb-2 animate-slide-in-left">
            Security Operations Center
          </h1>
          <p class="text-slate-dark-400 mt-2 font-medium opacity-80 animate-slide-in-left" style="animation-delay: 100ms">
            Real-time threat monitoring and analysis
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons with Enhanced Styling -->
    <div class="flex gap-3 animate-slide-in-up" style="animation-delay: 200ms">
      <button
        @click="handleRefresh"
        class="px-6 py-2.5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 text-slate-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 text-sm font-medium group relative overflow-hidden"
        :disabled="isRefreshing"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <i :class="isRefreshing ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" class="mr-2 text-xs"></i>
        <span class="relative">{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
      </button>
      <button
        @click="handleExport"
        class="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 text-sm font-medium group relative overflow-hidden"
        :disabled="isExporting"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-cyan-500/30 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'" class="mr-2 text-xs"></i>
        <span class="relative">{{ isExporting ? 'Exporting...' : 'Export' }}</span>
      </button>
    </div>

    <!-- Key Stats Grid with Staggered Animation -->
    <div class="my-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="animate-slide-in-up" style="animation-delay: 300ms">
        <StatCard
          label="Total Events"
          :value="apiStore.total || 0"
          icon="fas fa-file-alt"
          severity="normal"
          :change="calculateLogGrowth()"
        />
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 400ms">
        <StatCard
          label="Critical"
          :value="getCriticalCount()"
          icon="fas fa-exclamation-circle"
          severity="critical"
        />
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 500ms">
        <StatCard
          label="High Priority"
          :value="getHighCount()"
          icon="fas fa-radiation"
          severity="high"
        />
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 600ms">
        <StatCard
          label="Active Hosts"
          :value="apiStore.uniqueHosts || 0"
          icon="fas fa-server"
          severity="low"
        />
      </div>
    </div>
    </div>

    <!-- Alert Metrics with Staggered Animation -->
    <div class="my-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="animate-slide-in-up" style="animation-delay: 700ms">
        <StatCard
          label="Total Alerts"
          :value="apiStore.totalAlerts || 0"
          icon="fas fa-bell"
          severity="info"
        />
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 800ms">
        <StatCard
          label="Critical Alerts"
          :value="apiStore.criticalAlerts || 0"
          icon="fas fa-radiation-alt"
          severity="critical"
        />
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 900ms">
        <StatCard
          label="Analyzed Alerts"
          :value="apiStore.analyzedAlerts || 0"
          icon="fas fa-microscope"
          severity="normal"
        />
      </div>
    </div>
    </div>

    <!-- Main Visualizations with Animations -->
    <div class="my-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style="animation-delay: 1000ms">
      <!-- Network Topology -->
      <div class="lg:col-span-2 group">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
        <NetworkTopologyEnhanced />
      </div>

      <!-- Severity Distribution -->
      <div class="group">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-cyan-500/5 rounded-2xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
        <DashboardCard title="Severity Distribution" size="large">
          <SeverityChart />
        </DashboardCard>
      </div>
    </div>
    </div>

    <!-- Log Type Distribution with Enhanced Styling -->
    <div class="my-8">
      <DashboardCard title="Log Types Distribution" size="full" class="animate-slide-in-up" style="animation-delay: 1100ms">
        <div v-if="getLogTypeDistribution().length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div
            v-for="(item, index) in getLogTypeDistribution()"
            :key="item.name"
            class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-slate-700/40 text-center hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group relative overflow-hidden animate-slide-in-up"
            :style="{ 'animation-delay': `${1200 + index * 50}ms` }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{{ item.value }}</div>
              <div class="text-xs text-slate-400 mt-2 font-medium">{{ item.name }}</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-slate-500">
          <i class="fas fa-inbox text-3xl mb-3 block opacity-50"></i>
          <p class="text-sm">No log type data available</p>
        </div>
      </DashboardCard>
    </div>

    <!-- IP Tables with Staggered Animation -->
    <div class="my-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="animate-slide-in-up" style="animation-delay: 1400ms">
        <IpTable title="Top 10 Source IPs" :data="getTopSourceIPs()" />
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 1500ms">
        <IpTable title="Top 10 Destination IPs" :data="getTopDestinationIPs()" />
      </div>
    </div>
    </div>

    <!-- Network Activity Summary with Animation -->
    <div class="my-8">
      <div class="animate-slide-in-up" style="animation-delay: 1600ms">
        <DashboardCard title="Network Activity Summary" size="full">
          <TailscaleStats />
        </DashboardCard>
      </div>
    </div>

    <!-- Security Logs & Cases with Staggered Animation -->
    <div class="my-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 animate-slide-in-up" style="animation-delay: 1700ms">
        <DashboardCard title="Real-time Logs" size="full">
          <LogsDisplay />
        </DashboardCard>
      </div>
      <div class="animate-slide-in-up" style="animation-delay: 1800ms">
        <!-- Recent Cases -->
        <DashboardCard title="Recent Cases" size="large">
          <!-- Loading State -->
          <div v-if="casesLoading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl mb-3 block text-cyan-400"></i>
            <p class="text-sm text-slate-400">Loading cases...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="casesError" class="text-center py-12 text-red-400">
            <i class="fas fa-exclamation-triangle text-4xl mb-3 block text-red-500"></i>
            <p class="text-sm font-medium mb-2">Failed to load cases</p>
            <p class="text-xs text-slate-500 mb-4">{{ casesError }}</p>
            <button 
              @click="retryCases" 
              class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30 transition-all duration-300"
            >
              <i class="fas fa-redo mr-2"></i>
              Retry
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="displayedCases.length === 0" class="text-center py-12 opacity-50">
            <i class="fas fa-folder-open text-4xl mb-3 block text-slate-600"></i>
            <p class="text-sm text-slate-500 font-medium mb-2">No cases available</p>
            <p class="text-xs text-slate-600">Cases from TheHive or MongoDB will appear here</p>
          </div>

          <!-- Cases List -->
          <div v-else class="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div
              v-for="(hCase, index) in displayedCases"
              :key="hCase.id || hCase._id"
              class="p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-lg border border-slate-700/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group relative overflow-hidden animate-slide-in-up"
              :style="{ 'animation-delay': `${1900 + index * 50}ms` }"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
                      {{ hCase.title }}
                    </div>
                    <div class="text-xs text-slate-400 mt-1 line-clamp-2">
                      {{ hCase.description || 'No description available' }}
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <div
                      :class="[
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300',
                        getSeverityClass(hCase.severity)
                      ]"
                    >
                      {{ getSeverityLabel(hCase.severity) }}
                    </div>
                    <div class="px-2 py-0.5 bg-slate-600/30 rounded text-[10px] font-medium text-slate-400">
                      {{ hCase.source || 'Unknown' }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between mt-3 text-[10px] text-slate-500">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center gap-1">
                      <i class="fas fa-user text-[9px]"></i>
                      {{ hCase.owner || 'Unassigned' }}
                    </span>
                    <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>{{ formatTime(hCase.createdAt || hCase._createdAt || hCase.created_at) }}</span>
                  </div>
                  <div class="px-2 py-0.5 bg-slate-700/50 rounded text-slate-400 text-[10px] font-medium">
                    {{ hCase.status || 'Open' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cases Summary -->
          <div v-if="displayedCases.length > 0" class="mt-4 pt-4 border-t border-slate-700/40">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>{{ displayedCases.length }} cases shown</span>
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  {{ getCaseSeverityCount(4) + getCaseSeverityCount(3) }} High Priority
                </span>
                <span class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  {{ getCaseSeverityCount(2) + getCaseSeverityCount(1) }} Normal
                </span>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '../stores/apiStore'
import { useToast } from '../composables/useToast'
import { formatTimestamp } from '../utils/timestampFormatter.js'
import { getDisplayName } from '../utils/logTypeConstants'

// Components
import DashboardCard from '../components/common/DashboardCard.vue'
import StatCard from '../components/common/StatCard.vue'
import NetworkTopologyEnhanced from '../components/soc/NetworkTopologyEnhanced.vue'
import GeoMapEnhanced from '../components/soc/GeoMapEnhanced.vue'
import SeverityChart from '../components/soc/SeverityChart.vue'
import IpTable from '../components/soc/IpTable.vue'
import TailscaleStats from '../components/soc/TailscaleStats.vue'
import LogsDisplay from '../components/soc/LogsDisplay.vue'

const apiStore = useAPIStore()
const router = useRouter()
const { addToast } = useToast()

const isRefreshing = ref(false)
const isExporting = ref(false)
const lastRefreshAt = ref(0)

// Cases state management
const casesLoading = ref(false)
const casesError = ref(null)
const displayedCases = computed(() => apiStore.hiveCases || [])

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return formatTimestamp(timestamp, 'datetime')
}

const getSeverityClass = (severity) => {
  // Handle both numeric and string severities
  const numericSeverity = typeof severity === 'string' ? 
    ({ 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }[severity] || 1) : 
    (severity || 1)

  switch (numericSeverity) {
    case 4:
      return 'bg-red-500/20 text-red-400 border border-red-500/50 group-hover:shadow-lg group-hover:shadow-red-500/30'
    case 3:
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/50 group-hover:shadow-lg group-hover:shadow-orange-500/30'
    case 2:
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 group-hover:shadow-lg group-hover:shadow-yellow-500/30'
    case 1:
    default:
      return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 group-hover:shadow-lg group-hover:shadow-cyan-500/30'
  }
}

const getSeverityLabel = (severity) => {
  // Handle both numeric and string severities
  if (typeof severity === 'string') return severity.toUpperCase()
  
  const numericSeverity = severity || 1
  switch (numericSeverity) {
    case 4: return 'CRITICAL'
    case 3: return 'HIGH'
    case 2: return 'MEDIUM'
    case 1: return 'LOW'
    default: return 'LOW'
  }
}

const getCaseSeverityCount = (severity) => {
  return displayedCases.value.filter(c => {
    const caseSeverity = typeof c.severity === 'string' ? 
      ({ 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }[c.severity] || 1) : 
      (c.severity || 1)
    return caseSeverity === severity
  }).length
}

const retryCases = async () => {
  casesError.value = null
  await fetchCasesWithErrorHandling()
}

const fetchCasesWithErrorHandling = async () => {
  casesLoading.value = true
  casesError.value = null
  
  try {
    await apiStore.fetchRecentCases(10)
    if (displayedCases.value.length === 0) {
      console.log('No cases returned from API')
    }
  } catch (error) {
    console.error('Failed to fetch cases:', error)
    casesError.value = error.message || 'Failed to load cases'
  } finally {
    casesLoading.value = false
  }
}

const getCriticalCount = () => {
  return apiStore.severityBreakdown?.find(s => s._id === 'Critical')?.count || 0
}

const getHighCount = () => {
  return apiStore.severityBreakdown?.find(s => s._id === 'High')?.count || 0
}

const getLogTypeDistribution = () => {
  return (apiStore.logTypeBreakdown || []).map(item => ({
    name: getDisplayName(item._id) || item._id,
    value: item.count
  }))
}

const getTopSourceIPs = () => {
  return (apiStore.topSourceIPs || []).map(item => ({
    ip: item._id,
    count: item.count
  }))
}

const getTopDestinationIPs = () => {
  return (apiStore.topDestinationIPs || []).map(item => ({
    ip: item._id,
    count: item.count
  }))
}

const calculateLogGrowth = () => {
  // Calculate growth based on recent logs vs older logs
  const recentLogs = apiStore.logs || []
  if (recentLogs.length === 0) return null // Return null to hide change indicator
  
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  const recentCount = recentLogs.filter(log => {
    const logTime = new Date(log.timestamp)
    return logTime >= oneHourAgo
  }).length
  
  const olderCount = recentLogs.filter(log => {
    const logTime = new Date(log.timestamp)
    return logTime < oneHourAgo
  }).length
  
  if (olderCount === 0) return null // Return null if no comparison data
  
  const growthPercent = Math.round(((recentCount - olderCount) / olderCount) * 100)
  return growthPercent
}

onMounted(async () => {
  const autoRefreshed = sessionStorage.getItem('dashboardAutoRefreshed')
  if (!autoRefreshed) {
    await handleRefresh()
    sessionStorage.setItem('dashboardAutoRefreshed', '1')
  } else {
    // Still fetch cases on subsequent visits
    await fetchCasesWithErrorHandling()
  }
})

const handleRefresh = async () => {
  try {
    const now = Date.now()
    if (now - lastRefreshAt.value < 5000) {
      return
    }
    lastRefreshAt.value = now
    isRefreshing.value = true
    await Promise.all([
      apiStore.fetchDashboardStats(),
      apiStore.fetchRecentLogs(), // Add logs for growth calculation
      apiStore.fetchTailscaleStats(),
      apiStore.fetchRecentEvents(),
      apiStore.fetchAlertMetrics(),
      apiStore.fetchRecentAlerts(20),
      fetchCasesWithErrorHandling() // Use error handling wrapper
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

    const exportData = {
      timestamp: new Date().toISOString(),
      dashboardStats: {
        totalEvents: apiStore.total || 0,
        criticalCount: getCriticalCount(),
        highCount: getHighCount(),
        activeHosts: apiStore.uniqueHosts || 0
      },
      severityBreakdown: apiStore.severityBreakdown || [],
      logTypeBreakdown: apiStore.logTypeBreakdown || [],
      topSourceIPs: getTopSourceIPs(),
      topDestinationIPs: getTopDestinationIPs(),
      recentEvents: apiStore.recentEvents?.slice(0, 100) || []
    }

    const jsonString = JSON.stringify(exportData, null, 2)
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

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 225, 255, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 225, 255, 0.4);
}

/* Enhanced Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

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

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 225, 255, 0.6);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 0.6s ease-out forwards;
}

.animate-slide-in-up {
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
}

.animate-slide-in-right {
  animation: slideInRight 0.6s ease-out forwards;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-shimmer {
  animation: shimmer 2s infinite;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  background-size: 1000px 100%;
}

/* Smooth transitions for interactive elements */
.group {
  position: relative;
}

.group:hover {
  z-index: 10;
}

/* Enhanced card hover effects */
.group:hover > * {
  transition: all 0.3s ease-out;
}

/* Gradient text animation */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}
</style>
