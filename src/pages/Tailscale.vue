<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-dark-50">Tailscale Integration</h1>
        <p class="text-slate-dark-400 mt-2">Monitor Tailscale network activity and connections</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div :class="[
            'w-3 h-3 rounded-full',
            isLive ? 'bg-neon-green animate-pulse' : 'bg-neon-red'
          ]"></div>
          <span class="text-sm text-slate-dark-400">
            {{ isLive ? 'Live Streaming' : 'Disconnected' }}
          </span>
        </div>
        <button @click="syncTailscaleData" class="btn-cyber-outline" :disabled="isSyncing">
          <i :class="['fas', 'fa-sync-alt', 'mr-2', { 'fa-spin': isSyncing }]"></i>{{ isSyncing ? 'Syncing...' : 'Sync' }}
        </button>
        <button @click="importHistoricalLogs" class="btn-cyber-outline" :disabled="isSyncing">
          <i :class="['fas', 'fa-history', 'mr-2', { 'fa-spin': isSyncing }]"></i>{{ isSyncing ? 'Importing...' : 'Import Historical' }}
        </button>
        <button @click="exportTailscaleData" class="btn-cyber">
          <i class="fas fa-download mr-2"></i>Export
        </button>
      </div>
    </div>

    <!-- Tailscale Stats -->
    <TailscaleStats :stats="tailscaleStats" />

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Devices List -->
      <div class="lg:col-span-2">
        <div class="card-glass p-6 rounded-xl">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-slate-dark-50">Connected Devices</h3>
            <div class="flex gap-2">
              <div class="relative">
                <input v-model="searchDevice" type="text" placeholder="Search devices..." class="input-cyber text-sm pr-10" />
                <button 
                  v-if="searchDevice" 
                  @click="searchDevice = ''" 
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-dark-400 hover:text-slate-dark-300"
                >
                  <i class="fas fa-times text-sm"></i>
                </button>
              </div>
              <button @click="handleDeviceSearch" class="btn-cyber-outline">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table-cyber">
              <thead>
                <tr>
                  <th>Device Name</th>
                  <th>IP Address</th>
                  <th>OS</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in devices" :key="device.id">
                  <td class="font-semibold text-slate-dark-50">{{ device.name }}</td>
                  <td>
                    <code class="text-cyber-400 font-mono text-sm">{{ device.ip }}</code>
                  </td>
                  <td class="text-slate-dark-400">{{ device.os }}</td>
                  <td>
                    <span :class="[
                      'px-2 py-1 rounded-full text-xs font-semibold',
                      device.status === 'online' || device.status === 'Online'
                        ? 'bg-neon-green/20 text-neon-green'
                        : 'bg-slate-dark-700/50 text-slate-dark-400'
                    ]">
                      {{ device.status }}
                    </span>
                  </td>
                  <td class="text-slate-dark-400 text-sm">{{ device.lastSeen }}</td>
                  <td class="text-slate-dark-300">{{ device.user }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Status Overview -->
      <div class="space-y-6">
        <div class="card-glass p-6 rounded-xl">
          <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Network Status</h3>
          <div class="space-y-4">
            <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-dark-400">Network Health</span>
                <span class="text-2xl font-bold text-neon-green">{{ networkHealth }}%</span>
              </div>
              <div class="w-full bg-slate-dark-900 rounded-full h-2 mt-2 overflow-hidden">
                <div :style="`width: ${networkHealth}%`" class="h-full bg-neon-green rounded-full transition-all duration-500"></div>
              </div>
            </div>
            <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-dark-400">Avg Latency</span>
                <span class="text-2xl font-bold text-cyber-400">{{ avgLatency }}ms</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-glass p-6 rounded-xl">
          <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Quick Stats</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
              <span class="text-sm text-slate-dark-400">Online Devices</span>
              <span class="font-bold text-neon-green">{{ tailscaleStats.activeDevices }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
              <span class="text-sm text-slate-dark-400">Active Sessions</span>
              <span class="font-bold text-cyber-400">{{ tailscaleStats.activeSessions }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
              <span class="text-sm text-slate-dark-400">Peer Connections</span>
              <span class="font-bold text-neon-blue">{{ tailscaleStats.peerConnections }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-dark-900/50 rounded-lg border border-slate-dark-700/50">
              <span class="text-sm text-slate-dark-400">Exit Nodes</span>
              <span class="font-bold text-neon-orange">{{ tailscaleStats.exitNodes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Sessions -->
    <div class="card-glass p-6 rounded-xl">
      <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">User Sessions</h3>
      <div class="overflow-x-auto">
        <table class="table-cyber">
          <thead>
            <tr>
              <th>User</th>
              <th>Device</th>
              <th>IP Address</th>
              <th>Login Time</th>
              <th>Last Activity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in userSessions" :key="session.id">
              <td class="font-semibold text-slate-dark-50">{{ session.user }}</td>
              <td class="text-slate-dark-300">{{ session.device }}</td>
              <td>
                <code class="text-cyber-400 font-mono text-sm">{{ session.ip }}</code>
              </td>
              <td class="text-slate-dark-400 text-sm">{{ session.loginTime }}</td>
              <td class="text-slate-dark-400 text-sm">{{ session.lastActivity }}</td>
              <td>
                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-neon-green/20 text-neon-green">
                  Active
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Peer Connections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="card-glass p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Peer Connections</h3>
        <div class="space-y-3">
          <div v-for="peer in peerConnections" :key="peer.id" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold text-slate-dark-50">{{ peer.name }}</span>
              <span :class="[
                'px-2 py-1 rounded text-xs font-semibold',
                peer.status === 'Connected' ? 'bg-neon-green/20 text-neon-green' : 'bg-slate-dark-700/50 text-slate-dark-400'
              ]">
                {{ peer.status }}
              </span>
            </div>
            <div class="text-xs text-slate-dark-400">
              <div><i class="fas fa-network-wired mr-2"></i>{{ peer.ip }}</div>
              <div class="mt-1"><i class="fas fa-tachometer-alt mr-2"></i>Latency: {{ peer.latency }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-glass p-6 rounded-xl">
        <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Subnet Routers</h3>
        <div class="space-y-3">
          <div v-for="router in subnetRouters" :key="router.id" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold text-slate-dark-50">{{ router.name }}</span>
              <span class="px-2 py-1 rounded text-xs font-semibold bg-cyber-600/20 text-cyber-400">
                {{ router.subnets.length }} subnets
              </span>
            </div>
            <div class="text-xs text-slate-dark-400">
              <div><i class="fas fa-sitemap mr-2"></i>{{ router.subnets.join(', ') }}</div>
              <div class="mt-1"><i class="fas fa-check-circle mr-2"></i>Status: Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tailscale Logs -->
    <div class="card-glass p-6 rounded-xl">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-slate-dark-50">Tailscale Events</h3>
        <div class="flex gap-2">
          <select class="input-cyber text-sm">
            <option>All Events</option>
            <option>Connections</option>
            <option>Authentications</option>
            <option>Errors</option>
          </select>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="event in tailscaleEvents" :key="event.id" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-dark-50">{{ event.title }}</p>
              <p class="text-xs text-slate-dark-400 mt-1">{{ event.description }}</p>
            </div>
            <span :class="[
              'px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2',
              event.type === 'success' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-orange/20 text-neon-orange'
            ]">
              {{ event.type }}
            </span>
          </div>
          <div class="text-xs text-slate-dark-500 mt-2">
            <i class="fas fa-clock mr-1"></i>{{ event.timestamp }}
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Stream -->
    <div class="card-glass p-6 rounded-xl">
      <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Real-time Events Stream</h3>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50 font-mono text-xs text-slate-dark-300 h-48 overflow-y-auto">
        <div v-for="(log, idx) in realtimeEvents" :key="idx" class="mb-2 pb-2 border-b border-slate-dark-700/50">
          <span class="text-slate-dark-500">[{{ log.timestamp }}]</span>
          <span class="text-cyber-400 ml-2">{{ log.type }}</span>
          <span class="text-slate-dark-400 ml-2">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TailscaleStats from '../components/soc/TailscaleStats.vue'
import NetworkTopology from '../components/soc/NetworkTopology.vue'
import { tailscaleStreamService } from '../services/tailscaleStreamService'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const tailscaleStats = ref({
  activeDevices: 0,
  activeSessions: 0,
  peerConnections: 0,
  exitNodes: 0,
})

const devices = ref([])
const userSessions = ref([])
const peerConnections = ref([])
const subnetRouters = ref([])
const tailscaleEvents = ref([])
const realtimeEvents = ref([])
const searchDevice = ref('')
const loading = ref(true)
const isLive = ref(false)
const isSyncing = ref(false)
const streamUnsubscribers = ref([])

// Network status computed values
const networkHealth = computed(() => {
  if (!devices.value.length) return 0
  
  const onlineDevices = devices.value.filter(d => d.status === 'online').length
  const totalDevices = devices.value.length
  
  // Calculate health based on online devices and recent activity
  const deviceHealth = (onlineDevices / totalDevices) * 100
  
  // Factor in recent activity (if there are recent logs, network is healthier)
  const recentActivity = tailscaleEvents.value.filter(
    e => new Date(e.ts) > new Date(Date.now() - 5 * 60 * 1000)
  ).length
  
  const activityBonus = Math.min(recentActivity * 5, 20) // Max 20% bonus
  
  return Math.min(Math.round(deviceHealth + activityBonus), 100)
})

const avgLatency = computed(() => {
  // Calculate based on actual device ping times if available
  if (!devices.value.length) return 0
  
  // Check if devices have last_seen or ping data
  const devicesWithPing = devices.value.filter(d => d.last_seen || d.ping)
  
  if (devicesWithPing.length > 0) {
    // Use actual ping data if available
    const pings = devicesWithPing.map(d => {
      if (d.ping) return d.ping
      if (d.last_seen) {
        // Calculate latency from last_seen timestamp
        const lastSeen = new Date(d.last_seen)
        const now = new Date()
        const diffMinutes = (now - lastSeen) / (1000 * 60)
        return Math.max(1, Math.round(diffMinutes * 2)) // Rough estimate
      }
      return 15
    })
    return Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)
  }
  
  // Fallback: Use device status
  const onlineDevices = devices.value.filter(d => d.status === 'online').length
  const baseLatency = 15 + (devices.value.length - onlineDevices) * 2
  
  return Math.round(baseLatency)
})

// Connect to SSE stream for real-time Tailscale logs
const connectStream = () => {
  try {
    console.log('Connecting to Tailscale SSE stream...')
    
    // Subscribe to connection events
    const unsubConnect = tailscaleStreamService.on('connected', (data) => {
      console.log('Connected to Tailscale stream:', data)
      isLive.value = true
    })
    
    // Subscribe to log events
    const unsubLog = tailscaleStreamService.on('log', (log) => {
      addRealtimeEvent(log)
      updateStats(log)
    })
    
    // Subscribe to stats updates
    const unsubStats = tailscaleStreamService.on('stats', (stats) => {
      console.log('Received Tailscale stats update:', stats)
      // Update stats from server
      if (stats.total) {
        tailscaleStats.value.activeDevices = stats.total
      }
    })
    
    // Subscribe to error events
    const unsubError = tailscaleStreamService.on('error', (error) => {
      console.error('Stream error:', error)
      isLive.value = false
    })
    
    // Subscribe to disconnection events
    const unsubDisconnect = tailscaleStreamService.on('disconnected', () => {
      console.log('Disconnected from Tailscale stream')
      isLive.value = false
    })
    
    // Store unsubscribers
    streamUnsubscribers.value = [unsubConnect, unsubLog, unsubStats, unsubError, unsubDisconnect]
    
    // Connect to stream
    tailscaleStreamService.connect()
  } catch (error) {
    console.error('Failed to connect to stream:', error)
    isLive.value = false
  }
}

// Disconnect from stream
const disconnectStream = () => {
  try {
    // Unsubscribe from all events
    streamUnsubscribers.value.forEach(unsub => unsub())
    streamUnsubscribers.value = []
    
    // Disconnect from stream
    tailscaleStreamService.disconnect()
    isLive.value = false
  } catch (error) {
    console.error('Error disconnecting from stream:', error)
  }
}

// Add real-time event to the stream
const addRealtimeEvent = (log) => {
  const event = {
    timestamp: new Date(log.ts).toLocaleTimeString(),
    type: log.type.toUpperCase(),
    message: log.event || `${log.type} from ${log.user || 'unknown'}`
  }
  
  realtimeEvents.value.unshift(event)
  if (realtimeEvents.value.length > 50) {
    realtimeEvents.value.pop()
  }
  
  // Also add to events list
  tailscaleEvents.value.unshift({
    id: log._id,
    title: formatEventTitle(log.type),
    description: log.event || `${log.type} event`,
    type: log.type.includes('failed') || log.type.includes('denied') ? 'warning' : 'success',
    timestamp: formatTimeAgo(log.ts)
  })
  
  if (tailscaleEvents.value.length > 20) {
    tailscaleEvents.value.pop()
  }
}

// Update stats based on new log
const updateStats = (log) => {
  if (log.type === 'peer_connected') {
    tailscaleStats.value.peerConnections++
  }
  
  if (log.node_id && log.user) {
    // Update devices list
    const existingDevice = devices.value.find(d => d.id === log.node_id)
    if (!existingDevice) {
      devices.value.push({
        id: log.node_id,
        name: log.user.split('@')[0] || 'Unknown Device',
        ip: log.src || 'Unknown IP',
        os: 'Unknown',
        status: 'Online',
        lastSeen: 'just now',
        user: log.user
      })
      tailscaleStats.value.activeDevices++
    } else {
      existingDevice.lastSeen = 'just now'
    }
    
    // Update user sessions
    const sessionKey = `${log.user}-${log.src}`
    const existingSession = userSessions.value.find(s => s.id === sessionKey)
    if (!existingSession && log.src) {
      userSessions.value.unshift({
        id: sessionKey,
        user: log.user,
        device: log.user.split('@')[0] || 'Unknown Device',
        ip: log.src,
        loginTime: new Date(log.ts).toLocaleTimeString(),
        lastActivity: 'just now'
      })
      
      if (userSessions.value.length > 10) {
        userSessions.value.pop()
      }
      
      tailscaleStats.value.activeSessions++
    }
  }
}

// Process recent logs from WebSocket
const processRecentLogs = (logs) => {
  const deviceMap = new Map()
  const sessionMap = new Map()
  
  logs.forEach(log => {
    // Process devices
    if (log.node_id && log.user) {
      if (!deviceMap.has(log.node_id)) {
        deviceMap.set(log.node_id, {
          id: log.node_id,
          name: log.user.split('@')[0] || 'Unknown Device',
          ip: log.src || 'Unknown IP',
          os: 'Unknown',
          status: 'Online',
          lastSeen: formatTimeAgo(log.ts),
          user: log.user
        })
      }
    }
    
    // Process sessions
    if (log.user && log.src) {
      const key = `${log.user}-${log.src}`
      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          id: key,
          user: log.user,
          device: log.user.split('@')[0] || 'Unknown Device',
          ip: log.src,
          loginTime: new Date(log.ts).toLocaleTimeString(),
          lastActivity: formatTimeAgo(log.ts)
        })
      }
    }
    
    // Add to real-time events
    addRealtimeEvent(log)
  })
  
  devices.value = Array.from(deviceMap.values())
  userSessions.value = Array.from(sessionMap.values()).slice(0, 10)
  
  // Update stats
  tailscaleStats.value.activeDevices = devices.value.length
  tailscaleStats.value.activeSessions = userSessions.value.length
}

// Fetch initial data
const fetchTailscaleData = async () => {
  try {
    // Get stats and devices in parallel
    const [statsResponse, devicesResponse] = await Promise.all([
      axios.get(
        `${API_BASE}/tailscale/stats`,
        { headers: getAuthHeaders() }
      ),
      axios.get(
        `${API_BASE}/tailscale/devices`,
        { headers: getAuthHeaders() }
      )
    ])
    
    // Update stats
    if (statsResponse.data) {
      tailscaleStats.value = {
        activeDevices: statsResponse.data.activeDevices || devicesResponse.data?.total || 0,
        activeSessions: statsResponse.data.activeUsers || 0,
        peerConnections: statsResponse.data.peerConnections || 0,
        exitNodes: 3, // Default value
      }
    }
    
    // Update devices list with live data
    if (devicesResponse.data && devicesResponse.data.data) {
      // Backend already provides transformed data, just use it directly
      devices.value = devicesResponse.data.data
    }
  } catch (error) {
    console.error('Failed to fetch Tailscale data:', error)
    // Add user-facing error message
    if (window.addToast) {
      window.addToast('Failed to fetch Tailscale data. Please check your connection and try again.', 'error')
    }
  } finally {
    loading.value = false
  }
}

const syncTailscaleData = async () => {
  try {
    isSyncing.value = true
    
    // Re-fetch all data
    await fetchTailscaleData()
    
    // Reconnect stream if disconnected
    if (!isLive.value) {
      connectStream()
    }
    
    // Clear and refresh recent events
    realtimeEvents.value = []
    
    // Show success message
    if (window.addToast) {
      window.addToast('Tailscale data synced successfully', 'success')
    }
  } catch (error) {
    console.error('Sync failed:', error)
    if (window.addToast) {
      window.addToast('Failed to sync Tailscale data', 'error')
    }
  } finally {
    isSyncing.value = false
  }
}

const importHistoricalLogs = async (daysBack = 7) => {
  try {
    isSyncing.value = true
    
    const response = await axios.post(
      `${API_BASE}/tailscale/import-historical`,
      { daysBack: daysBack }, // Ensure we send an object with daysBack property
      { headers: getAuthHeaders() }
    )
    
    if (response.data.success) {
      // Re-fetch data after import
      await fetchTailscaleData()
      
      if (window.addToast) {
        window.addToast(
          `Imported ${response.data.imported} historical logs from ${response.data.total} available`,
          'success'
        )
      }
    }
  } catch (error) {
    console.error('Import failed:', error)
    if (window.addToast) {
      window.addToast('Failed to import historical logs', 'error')
    }
  } finally {
    isSyncing.value = false
  }
}

const formatEventTitle = (type) => {
  const titles = {
    'peer_connected': 'Device Connected',
    'peer_disconnected': 'Device Disconnected',
    'auth_success': 'Authentication Success',
    'auth_failed': 'Authentication Failed',
    'subnet_route_added': 'Subnet Route Added',
    'exit_node_used': 'Exit Node Used',
    'device_updated': 'Device Updated',
    'user_login': 'User Login',
    'user_logout': 'User Logout',
    'dns_query': 'DNS Query'
  }
  return titles[type] || 'Unknown Event'
}

const formatTimeAgo = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = Math.floor((now - time) / 1000) // seconds
  
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}

const exportTailscaleData = async () => {
  try {
    // Get real data from backend API
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    
    // Fetch comprehensive tailscale data
    const [statsResponse, logsResponse] = await Promise.all([
      axios.get(`${API_BASE}/tailscale/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }),
      axios.get(`${API_BASE}/export/logs`, {
        params: { 
          format: 'json', 
          log_type: 'Tailscale',
          timeRange: '24h',
          limit: 5000
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    ])
    
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: statsResponse.data || tailscaleStats.value,
      devices: devices.value.map(device => ({
        id: device.id,
        name: device.name,
        ip: device.ip,
        os: device.os,
        status: device.status,
        lastSeen: device.lastSeen,
        user: device.user
      })),
      sessions: userSessions.value.map(session => ({
        id: session.id,
        user: session.user,
        device: session.device,
        ip: session.ip,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity
      })),
      recentEvents: realtimeEvents.value.slice(0, 100),
      logs: logsResponse.data?.data || [],
      exportMetadata: {
        devicesCount: devices.value.length,
        sessionsCount: userSessions.value.length,
        eventsCount: realtimeEvents.value.length,
        logsCount: logsResponse.data?.count || 0,
        timeRange: '24h'
      }
    }
    
    // Convert to JSON and download
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `tailscale-export-${new Date().toISOString().split('T')[0]}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    // Show success message
    if (window.addToast) {
      window.addToast('Tailscale data exported successfully', 'success')
    }
  } catch (error) {
    console.error('Export failed:', error)
    
    // Show user-facing error message
    if (window.addToast) {
      window.addToast('Failed to export Tailscale data via server. Trying fallback export...', 'warning')
    }
    
    // Fallback to client-side export if backend fails
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: tailscaleStats.value,
      devices: devices.value,
      sessions: userSessions.value,
      recentEvents: realtimeEvents.value.slice(0, 100),
      exportMetadata: {
        devicesCount: devices.value.length,
        sessionsCount: userSessions.value.length,
        eventsCount: realtimeEvents.value.length,
        timeRange: '24h'
      }
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `tailscale-export-${new Date().toISOString().split('T')[0]}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    // Show success message
    if (window.addToast) {
      window.addToast('Tailscale data exported successfully (fallback mode)', 'success')
    }
  }
}

onMounted(() => {
  fetchTailscaleData()
  connectStream()
})

onUnmounted(() => {
  disconnectStream()
})

const handleDeviceSearch = () => {
  if (searchDevice.value.trim()) {
    const searchTerm = searchDevice.value.toLowerCase()
    const filteredDevices = devices.value.filter(device => 
      device.name.toLowerCase().includes(searchTerm) ||
      device.ip.includes(searchTerm) ||
      device.os.toLowerCase().includes(searchTerm)
    )
    console.log('Filtered devices:', filteredDevices)
    if (filteredDevices.length === 0) {
      window.addToast(`No devices found matching "${searchDevice.value}"`, 'info')
    }
  } else {
    if (window.addToast) {
      window.addToast('Please enter a device name or IP to search', 'warning')
    }
  }
}

const refreshTopology = () => {
  // Trigger a refresh of the NetworkTopology component
  // The component will automatically detect it's on the Tailscale page
  // window.location.reload() // Disabled to prevent constant page refresh
}
</script>
