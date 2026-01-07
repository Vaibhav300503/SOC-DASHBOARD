<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs">
          <div :class="[
            'w-2 h-2 rounded-full',
            dashboardData.syncStatus?.status === 'success' ? 'bg-emerald-500' : 'bg-yellow-500'
          ]"></div>
          <span class="text-slate-400 font-medium">
            {{ dashboardData.syncStatus?.status === 'success' ? 'Connected' : 'Sample Data' }}
          </span>
        </div>
      </div>
      <button 
        @click="refreshData" 
        :disabled="loading"
        class="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors text-sm border border-cyan-500/30 font-medium"
      >
        <i class="fas fa-sync-alt mr-1.5 text-xs" :class="{ 'animate-spin': loading }"></i>
        Refresh
      </button>
    </div>
    
    <!-- Configuration Notice -->
    <div v-if="!isConfigured" class="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
        <div>
          <div class="text-sm font-semibold text-yellow-500">Tailscale API Not Configured</div>
          <div class="text-xs text-slate-400 mt-1">
            To get live data, configure TAILSCALE_API_KEY in your backend .env file
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group relative overflow-hidden transform scale-90 origin-top-left">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="flex items-center justify-between relative z-10">
          <div>
            <div class="text-2xl font-bold text-slate-100">{{ dashboardData.deviceStats?.totalDevices || 0 }}</div>
            <div class="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Total Devices</div>
          </div>
          <i class="fas fa-server text-cyan-500 text-2xl opacity-20 group-hover:opacity-40 transition-opacity"></i>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group relative overflow-hidden transform scale-90 origin-top-left">
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="flex items-center justify-between relative z-10">
          <div>
            <div class="text-2xl font-bold text-emerald-400">{{ dashboardData.deviceStats?.onlineDevices || 0 }}</div>
            <div class="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Online Now</div>
          </div>
          <i class="fas fa-wifi text-emerald-500 text-2xl opacity-20 group-hover:opacity-40 transition-opacity"></i>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 group relative overflow-hidden transform scale-90 origin-top-left">
        <div class="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="flex items-center justify-between relative z-10">
          <div>
            <div class="text-2xl font-bold text-red-400">{{ dashboardData.deviceStats?.criticalRisk || 0 }}</div>
            <div class="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Critical Risk</div>
          </div>
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl opacity-20 group-hover:opacity-40 transition-opacity"></i>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group relative overflow-hidden transform scale-90 origin-top-left">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="flex items-center justify-between relative z-10">
          <div>
            <div class="text-2xl font-bold text-purple-400">{{ dashboardData.geoDistribution?.length || 0 }}</div>
            <div class="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Countries</div>
          </div>
          <i class="fas fa-globe text-purple-500 text-2xl opacity-20 group-hover:opacity-40 transition-opacity"></i>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative z-10">
          <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">High Risk Devices</div>
          <div class="text-2xl font-bold text-orange-400">{{ dashboardData.deviceStats?.highRisk || 0 }}</div>
          <div class="text-xs text-slate-500 mt-1">Require attention</div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300 group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-500/0 via-slate-500/10 to-slate-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative z-10">
          <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Offline Devices</div>
          <div class="text-2xl font-bold text-slate-400">{{ dashboardData.deviceStats?.offlineDevices || 0 }}</div>
          <div class="text-xs text-slate-500 mt-1">Not connected</div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative z-10">
          <div class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Last Sync</div>
          <div class="text-sm font-bold text-cyan-400">{{ formatLastSync(dashboardData.syncStatus?.lastSyncTime) }}</div>
          <div class="text-xs text-slate-500 mt-1">Auto-sync enabled</div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="mt-6" v-if="dashboardData.recentActivity?.length">
      <h4 class="text-sm font-medium text-slate-dark-400 mb-3">Recent Activity</h4>
      <div class="space-y-2">
        <div 
          v-for="activity in dashboardData.recentActivity.slice(0, 3)" 
          :key="activity._id"
          class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i class="fas fa-terminal text-cyber-400 text-sm"></i>
              <div>
                <div class="text-sm text-slate-dark-200">{{ activity.type }}</div>
                <div class="text-xs text-slate-dark-500">{{ activity.user || 'system' }}</div>
              </div>
            </div>
            <div class="text-xs text-slate-dark-500">
              {{ formatTime(activity.ts) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import { useTailscaleWebSocket } from '../../services/tailscaleWebSocket'
import { formatTimestamp } from '../../utils/timestampFormatter.js'

const apiStore = useAPIStore()
const { connect, disconnect, subscribe } = useTailscaleWebSocket()
const loading = ref(false)
const dashboardData = ref({})
const isConfigured = ref(false) // Will be updated based on API response
let unsubscribe = null
let refreshIntervalId = null

const refreshData = async () => {
  loading.value = true
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    
    // Try live endpoint first, fallback to cached endpoint
    let response = await fetch(`${apiBase}/tailscale/dashboard-live`)
    
    if (!response.ok) {
      console.log('Live endpoint failed, trying cached endpoint...')
      response = await fetch(`${apiBase}/tailscale/dashboard`)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Tailscale endpoint not found, using sample data')
          dashboardData.value = getSampleTailscaleData()
          isConfigured.value = false
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
    }
    
    const data = await response.json()
    
    // If no data from API, use sample data
    if (!data || !data.deviceStats) {
      console.log('No Tailscale data available, using sample data')
      dashboardData.value = getSampleTailscaleData()
      isConfigured.value = false
    } else {
      dashboardData.value = data
      isConfigured.value = true
      
      // Show data source indicator
      if (data.source === 'live_tailscale_api') {
        console.log('Using live Tailscale API data')
      } else {
        console.log('Using cached MongoDB data')
      }
    }
  } catch (error) {
    console.error('Error fetching Tailscale dashboard data:', error)
    // Use sample data on error
    dashboardData.value = getSampleTailscaleData()
    isConfigured.value = false
  } finally {
    loading.value = false
  }
}

// Sample Tailscale data for fallback
const getSampleTailscaleData = () => {
  return {
    deviceStats: {
      totalDevices: 12,
      onlineDevices: 8,
      offlineDevices: 4,
      criticalRisk: 2,
      highRisk: 3
    },
    geoDistribution: [
      { country: 'India', city: 'Mumbai', count: 3 },
      { country: 'India', city: 'Bangalore', count: 2 },
      { country: 'United States', city: 'New York', count: 2 },
      { country: 'United Kingdom', city: 'London', count: 1 },
      { country: 'Singapore', city: 'Singapore', count: 1 },
      { country: 'Australia', city: 'Sydney', count: 1 }
    ],
    recentActivity: [
      {
        _id: '1',
        type: 'Device Connected',
        user: 'john.doe@example.com',
        ts: new Date(Date.now() - 5 * 60000).toISOString(),
        details: 'Laptop-John connected from Mumbai'
      },
      {
        _id: '2',
        type: 'Device Disconnected',
        user: 'jane.smith@example.com',
        ts: new Date(Date.now() - 15 * 60000).toISOString(),
        details: 'Phone-Jane disconnected'
      },
      {
        _id: '3',
        type: 'New Device',
        user: 'admin@example.com',
        ts: new Date(Date.now() - 30 * 60000).toISOString(),
        details: 'Server-Prod-01 added to network'
      }
    ],
    syncStatus: {
      lastSyncTime: new Date(Date.now() - 2 * 60000).toISOString(),
      status: 'success'
    }
  }
}

const formatLastSync = (timestamp) => {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / 60000)
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
  return date.toLocaleDateString()
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return formatTimestamp(timestamp, 'time')
}

onMounted(() => {
  // Initial data fetch
  refreshData()
  
  // Connect to WebSocket for real-time updates
  connect()
  
  // Subscribe to real-time updates
  unsubscribe = subscribe('update', (data) => {
    console.log('Received Tailscale update:', data)
    
    // Update dashboard data based on the type of update
    if (data.type === 'device_update') {
      // Update device stats
      if (data.deviceStats) {
        dashboardData.value.deviceStats = { ...dashboardData.value.deviceStats, ...data.deviceStats }
      }
    } else if (data.type === 'activity') {
      // Add new activity to the beginning of the array
      if (data.activity) {
        dashboardData.value.recentActivity = [
          data.activity,
          ...(dashboardData.value.recentActivity || []).slice(0, 9)
        ]
      }
    } else if (data.type === 'sync_status') {
      // Update sync status
      if (data.syncStatus) {
        dashboardData.value.syncStatus = { ...dashboardData.value.syncStatus, ...data.syncStatus }
      }
    }
    
    // Update configuration status
    isConfigured.value = true
  })
  
  // Auto-refresh every 30 seconds as fallback
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
  refreshIntervalId = setInterval(refreshData, 30000)
})

onUnmounted(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
    refreshIntervalId = null
  }
  if (unsubscribe) {
    unsubscribe()
  }
  disconnect()
})
</script>
