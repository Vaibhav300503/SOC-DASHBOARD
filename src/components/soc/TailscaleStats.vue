<template>
  <div class="card-glass p-6 rounded-xl">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-slate-dark-50">Tailscale Network Status</h3>
        <div class="flex items-center gap-2 text-xs">
          <div :class="[
            'w-2 h-2 rounded-full',
            dashboardData.syncStatus?.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
          ]"></div>
          <span class="text-slate-dark-400">
            {{ dashboardData.syncStatus?.status === 'success' ? 'Connected' : 'Sample Data' }}
          </span>
        </div>
      </div>
      <button 
        @click="refreshData" 
        :disabled="loading"
        class="px-3 py-1 bg-cyber-500/20 text-cyber-400 rounded-lg hover:bg-cyber-500/30 transition-colors text-sm"
      >
        <i class="fas fa-sync-alt mr-2" :class="{ 'animate-spin': loading }"></i>
        Refresh
      </button>
    </div>
    
    <!-- Configuration Notice -->
    <div v-if="!isConfigured" class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
        <div>
          <div class="text-sm font-medium text-yellow-500">Tailscale API Not Configured</div>
          <div class="text-xs text-slate-dark-400 mt-1">
            To get live data, configure TAILSCALE_API_KEY in your backend .env file
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ dashboardData.deviceStats?.totalDevices || 0 }}</div>
            <div class="stat-label">Total Devices</div>
          </div>
          <i class="fas fa-server text-cyber-500 text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value text-green-400">{{ dashboardData.deviceStats?.onlineDevices || 0 }}</div>
            <div class="stat-label">Online Now</div>
          </div>
          <i class="fas fa-wifi text-neon-green text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value text-red-400">{{ dashboardData.deviceStats?.criticalRisk || 0 }}</div>
            <div class="stat-label">Critical Risk</div>
          </div>
          <i class="fas fa-exclamation-triangle text-neon-red text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ dashboardData.geoDistribution?.length || 0 }}</div>
            <div class="stat-label">Countries</div>
          </div>
          <i class="fas fa-globe text-neon-purple text-3xl opacity-20"></i>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-2">High Risk Devices</div>
        <div class="text-2xl font-bold text-neon-orange">{{ dashboardData.deviceStats?.highRisk || 0 }}</div>
        <div class="text-xs text-slate-dark-500 mt-1">Require attention</div>
      </div>

      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-2">Offline Devices</div>
        <div class="text-2xl font-bold text-slate-dark-400">{{ dashboardData.deviceStats?.offlineDevices || 0 }}</div>
        <div class="text-xs text-slate-dark-500 mt-1">Not connected</div>
      </div>

      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-2">Last Sync</div>
        <div class="text-sm font-bold text-cyber-400">{{ formatLastSync(dashboardData.syncStatus?.lastSyncTime) }}</div>
        <div class="text-xs text-slate-dark-500 mt-1">Auto-sync enabled</div>
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
  return new Date(timestamp).toLocaleTimeString()
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
