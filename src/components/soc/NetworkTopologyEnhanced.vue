<template>
  <DashboardCard title="Network Topology" subtitle="Static 2D star topology with endpoint data from logs" size="large">
    <template #header-action>
      <div class="flex gap-2">
        <div class="px-3 py-1 text-xs rounded-lg bg-slate-800/50 text-slate-400 border border-slate-700/30">
          <i class="fas fa-clock mr-1"></i>
          Updated: {{ lastUpdated }}
        </div>
        <input
          v-model="searchQuery"
          placeholder="Search agents..."
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/30 focus:border-cyan-500/50 focus:outline-none w-32"
        />
        <button
          @click="resetZoom"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Reset view"
        >
          <i class="fas fa-redo mr-1"></i>Reset
        </button>
        <button
          @click="toggleFilters"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Toggle filters"
        >
          <i class="fas fa-filter mr-1"></i>Filter
        </button>
      </div>
    </template>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
      <div class="grid grid-cols-3 gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-400">
          <input v-model="filterOnline" type="checkbox" class="rounded" />
          <span>Online</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400">
          <input v-model="filterOffline" type="checkbox" class="rounded" />
          <span>Offline</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400">
          <input v-model="filterDegraded" type="checkbox" class="rounded" />
          <span>Degraded</span>
        </label>
      </div>
    </div>

    <!-- SVG Canvas -->
    <div class="relative w-full h-96 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
      <!-- Loading Spinner -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-50">
        <div class="text-center">
          <div class="inline-block">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          </div>
          <div class="text-slate-300 font-medium">Loading Topology...</div>
          <div class="text-xs text-slate-500 mt-2">
            <span v-if="totalLogs === 0">Connecting to database...</span>
            <span v-else>Fetching {{ totalLogs }} logs from database</span>
          </div>
          <div class="text-xs text-slate-600 mt-3">This may take 1-2 minutes for large datasets</div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredAgents.length === 0" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-slate-400">
          <div class="text-4xl mb-4">🔍</div>
          <div class="text-lg font-medium mb-2">
            {{ agents.length === 0 ? 'No Endpoints in Logs' : 'No Endpoints Match Filters' }}
          </div>
          <div class="text-sm">
            {{ agents.length === 0 
              ? 'Waiting for log data with endpoint information...' 
              : 'Adjust filters to see endpoints' }}
          </div>
          <div class="text-xs mt-2 opacity-75">
            Last updated: {{ lastUpdated || 'Never' }}
          </div>
          <div v-if="agents.length === 0" class="text-xs mt-3 text-cyan-400">
            <button @click="retryFetch" class="hover:text-cyan-300 underline">
              Retry Fetch
            </button>
          </div>
        </div>
      </div>

      <svg
        v-else
        ref="svgElement"
        class="w-full h-full cursor-grab active:cursor-grabbing"
        @wheel.prevent="handleZoom"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <defs>
          <!-- Glow filters -->
          <filter id="glow-server">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-online">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-offline">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Transform group for zoom/pan -->
        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <!-- Connection lines from center to agents -->
          <line
            v-for="agent in filteredAgents"
            :key="`connection-${agent._id}`"
            :x1="centerNode.x"
            :y1="centerNode.y"
            :x2="agent.x"
            :y2="agent.y"
            :stroke="getConnectionColor(agent.status)"
            stroke-width="1.5"
            opacity="0.4"
            class="transition-all duration-300"
            :class="{ 'opacity-80': hoveredAgent === agent._id }"
          />

          <!-- Central server node -->
          <g
            :transform="`translate(${centerNode.x}, ${centerNode.y})`"
            class="cursor-pointer"
            @mouseenter="hoveredAgent = 'server'"
            @mouseleave="hoveredAgent = null"
          >
            <!-- Server circle with strong glow -->
            <circle
              :r="30"
              fill="#0EA5E9"
              stroke="#38BDF8"
              stroke-width="3"
              filter="url(#glow-server)"
              class="transition-all duration-300"
              :opacity="hoveredAgent === 'server' ? 1 : 0.9"
            />
            <!-- Server icon -->
            <text
              x="0"
              y="6"
              text-anchor="middle"
              class="text-lg fill-white font-bold pointer-events-none"
            >
              🖥️
            </text>
            <!-- Server label -->
            <text
              x="0"
              y="50"
              text-anchor="middle"
              class="text-sm fill-white font-semibold pointer-events-none"
            >
              Main Server
            </text>
          </g>

          <!-- Agent nodes -->
          <g
            v-for="agent in filteredAgents"
            :key="agent._id"
            :transform="`translate(${agent.x}, ${agent.y})`"
            class="cursor-pointer"
            @mouseenter="hoveredAgent = agent._id"
            @mouseleave="hoveredAgent = null"
            @click="selectAgent(agent._id)"
          >
            <!-- Agent circle with status-based glow -->
            <circle
              :r="15"
              :fill="getAgentColor(agent.status)"
              :stroke="getAgentStroke(agent.status)"
              stroke-width="2"
              :filter="getAgentFilter(agent.status)"
              class="transition-all duration-300"
              :opacity="hoveredAgent === agent._id ? 1 : 0.8"
            />
            
            <!-- Status indicator dot -->
            <circle
              :cx="12"
              :cy="-12"
              :r="4"
              :fill="getStatusDotColor(agent.status)"
              class="transition-all duration-300"
            />

            <!-- Agent name -->
            <text
              x="0"
              y="30"
              text-anchor="middle"
              class="text-xs fill-white font-medium pointer-events-none"
            >
              {{ getAgentDisplayName(agent) }}
            </text>

            <!-- Agent IP/hostname -->
            <text
              x="0"
              y="45"
              text-anchor="middle"
              class="text-2xs fill-slate-400 pointer-events-none"
            >
              {{ getAgentSubtext(agent) }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700/30 rounded-lg p-3 text-xs space-y-2">
        <div class="font-semibold text-slate-200 mb-2">Agent Status</div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span class="text-slate-400">Online</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="text-slate-400">Offline</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-amber-500"></div>
          <span class="text-slate-400">Degraded</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700/30 rounded-lg p-3 text-xs space-y-1">
        <div class="text-slate-200 font-semibold">{{ filteredAgents.length }} Agents</div>
        <div class="text-slate-400">{{ onlineCount }} Online</div>
        <div class="text-slate-400">{{ offlineCount }} Offline</div>
      </div>

      <!-- Agent tooltip -->
      <div
        v-if="hoveredAgent && hoveredAgent !== 'server' && getAgentById(hoveredAgent)"
        class="absolute bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 text-xs pointer-events-none z-20"
        :style="tooltipStyle"
      >
        <div class="font-semibold text-slate-200 mb-2">{{ getAgentById(hoveredAgent).endpoint_name }}</div>
        <div class="space-y-1 text-slate-400">
          <div><span class="text-slate-500">ID:</span> {{ getAgentById(hoveredAgent).agent_id }}</div>
          <div><span class="text-slate-500">Hostname:</span> {{ getAgentById(hoveredAgent).hostname || 'N/A' }}</div>
          <div><span class="text-slate-500">IP:</span> {{ getAgentById(hoveredAgent).ip_address || 'N/A' }}</div>
          <div><span class="text-slate-500">OS:</span> {{ getAgentById(hoveredAgent).os_type || 'N/A' }}</div>
          <div><span class="text-slate-500">Status:</span> 
            <span :class="getStatusTextClass(getAgentById(hoveredAgent).status)">
              {{ getAgentById(hoveredAgent).status }}
            </span>
          </div>
          <div><span class="text-slate-500">Last Seen:</span> {{ formatLastSeen(getAgentById(hoveredAgent).last_seen) }}</div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <template #footer>
      <div class="grid grid-cols-4 gap-3">
        <div class="text-center">
          <div class="text-lg font-bold text-emerald-400">{{ onlineCount }}</div>
          <div class="text-xs text-slate-500">Online</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-red-400">{{ offlineCount }}</div>
          <div class="text-xs text-slate-500">Offline</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-amber-400">{{ degradedCount }}</div>
          <div class="text-xs text-slate-500">Degraded</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-cyan-400">{{ totalAgents }}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardCard from '../common/DashboardCard.vue'
import { useAPIStore } from '../../stores/apiStore'
import axios from 'axios'

// Reactive state
const agents = ref([])
const hoveredAgent = ref(null)
const selectedAgent = ref(null)
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const showFilters = ref(false)
const filterOnline = ref(true)
const filterOffline = ref(true)
const filterDegraded = ref(true)
const searchQuery = ref('')
const lastUpdated = ref('')
const centerNode = ref({ x: 400, y: 300 })
const isLoading = ref(false)
const totalLogs = ref(0)
let refreshInterval = null

// Fetch agents from logs
const fetchAgents = async () => {
  try {
    isLoading.value = true
    console.log('🚀 Fetching aggregated endpoints from logs...')
    
    // Create a timeout promise (increased to 60 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch timeout after 60 seconds')), 60000)
    )
    
    // Fetch aggregated endpoints directly (much faster than fetching all logs)
    const fetchPromise = axios.get('http://localhost:3002/api/logs/endpoints/aggregated')
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise])
    
    // Use response data directly
    const endpoints = response?.data?.data || []
    totalLogs.value = response?.data?.total || 0
    
    console.log(`📊 Total unique endpoints: ${totalLogs.value}`)
    console.log(`📊 Response type: ${typeof response.data}`)
    console.log(`📊 Is array: ${Array.isArray(endpoints)}`)
    
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      console.error('❌ No endpoints available', { response: response.data, endpoints })
      agents.value = []
      isLoading.value = false
      return
    }
    
    // Map endpoints to agents format
    agents.value = endpoints.map(ep => ({
      _id: ep._id,
      agent_id: ep.endpoint_name,
      endpoint_name: ep.endpoint_name,
      hostname: ep.hostname,
      ip_address: ep.ip_address,
      os_type: ep.os_type,
      status: ep.status || 'active',
      last_seen: ep.last_seen || new Date().toISOString(),
      eventCount: ep.eventCount,
      criticalCount: ep.criticalCount
    }))
    
    console.log(`✅ Extracted ${agents.value.length} unique endpoints from logs`)
    
    // Log all extracted endpoints
    agents.value.forEach(agent => {
      console.log(`  - ${agent.endpoint_name}: ${agent.eventCount} events, ${agent.criticalCount} critical`)
    })
    
    // Sync endpoints to agents collection
    await syncEndpointsToAgents(agents.value)
    
    computeStarLayout()
    updateLastUpdated()
    isLoading.value = false
  } catch (error) {
    console.error('❌ Failed to fetch endpoints from logs:', error.message, error)
    agents.value = []
    isLoading.value = false
  }
}

// Sync endpoints to agents collection in MongoDB
const syncEndpointsToAgents = async (endpointsList) => {
  try {
    console.log('🔄 Syncing endpoints to agents collection...')
    
    const response = await axios.post('http://localhost:3002/api/agents/sync', {
      endpoints: endpointsList
    })
    
    console.log('✅ Endpoints synced to agents collection:', response.data)
  } catch (error) {
    console.warn('⚠️ Failed to sync endpoints to agents collection:', error.message)
    // Don't fail the entire operation if sync fails
  }
}

// Retry fetch function
const retryFetch = async () => {
  console.log('🔄 Retrying fetch...')
  await fetchAgents()
}

// Compute static star layout positions
const computeStarLayout = () => {
  const agentList = agents.value
  const totalAgents = agentList.length
  
  if (totalAgents === 0) return

  // Calculate positions in a circle around the center
  const radius = Math.min(250, 150 + totalAgents * 8) // Dynamic radius based on agent count
  
  agentList.forEach((agent, index) => {
    const angle = (index / totalAgents) * Math.PI * 2
    agent.x = centerNode.value.x + Math.cos(angle) * radius
    agent.y = centerNode.value.y + Math.sin(angle) * radius
  })
}

// Filter agents based on status and search
const filteredAgents = computed(() => {
  return agents.value.filter(agent => {
    // Status filter
    const statusMatch = 
      (agent.status === 'active' && filterOnline.value) ||
      (agent.status === 'inactive' && filterOffline.value) ||
      (agent.status === 'degraded' && filterDegraded.value)
    
    // Search filter
    const searchMatch = !searchQuery.value || 
      agent.endpoint_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      agent.hostname?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      agent.ip_address?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      agent.agent_id?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return statusMatch && searchMatch
  })
})

// Status counts
const onlineCount = computed(() => agents.value.filter(a => a.status === 'active').length)
const offlineCount = computed(() => agents.value.filter(a => a.status === 'inactive').length)
const degradedCount = computed(() => agents.value.filter(a => a.status === 'degraded').length)
const totalAgents = computed(() => agents.value.length)

// Agent color based on status
const getAgentColor = (status) => {
  switch (status) {
    case 'active': return '#10B981' // emerald-500
    case 'inactive': return '#6B7280' // gray-500
    case 'degraded': return '#F59E0B' // amber-500
    default: return '#6B7280'
  }
}

// Agent stroke color
const getAgentStroke = (status) => {
  switch (status) {
    case 'active': return '#34D399' // emerald-400
    case 'inactive': return '#9CA3AF' // gray-400
    case 'degraded': return '#FBBF24' // amber-400
    default: return '#9CA3AF'
  }
}

// Connection line color
const getConnectionColor = (status) => {
  switch (status) {
    case 'active': return 'rgba(16, 185, 129, 0.6)' // emerald with opacity
    case 'inactive': return 'rgba(107, 114, 128, 0.3)' // gray with opacity
    case 'degraded': return 'rgba(245, 158, 11, 0.6)' // amber with opacity
    default: return 'rgba(107, 114, 128, 0.3)'
  }
}

// Status dot color
const getStatusDotColor = (status) => {
  switch (status) {
    case 'active': return '#22C55E' // green-500
    case 'inactive': return '#EF4444' // red-500
    case 'degraded': return '#EAB308' // yellow-500
    default: return '#EF4444'
  }
}

// Agent filter for glow effect
const getAgentFilter = (status) => {
  switch (status) {
    case 'active': return 'url(#glow-online)'
    case 'inactive': return 'url(#glow-offline)'
    case 'degraded': return 'url(#glow-online)'
    default: return 'url(#glow-offline)'
  }
}

// Get agent display name
const getAgentDisplayName = (agent) => {
  return agent.endpoint_name || agent.agent_id?.substring(0, 12) || 'Unknown'
}

// Get agent subtext (IP or hostname)
const getAgentSubtext = (agent) => {
  return agent.ip_address || agent.hostname || 'N/A'
}

// Get agent by ID for tooltip
const getAgentById = (agentId) => {
  return agents.value.find(a => a._id === agentId)
}

// Format last seen date
const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never'
  const date = new Date(lastSeen)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

// Status text class for tooltip
const getStatusTextClass = (status) => {
  switch (status) {
    case 'active': return 'text-emerald-400'
    case 'inactive': return 'text-red-400'
    case 'degraded': return 'text-amber-400'
    default: return 'text-gray-400'
  }
}

// Update last updated timestamp
const updateLastUpdated = () => {
  const now = new Date()
  lastUpdated.value = now.toLocaleTimeString()
}

// Tooltip positioning
const tooltipStyle = computed(() => {
  if (!hoveredAgent.value) return {}
  
  return {
    left: '50%',
    top: '20px',
    transform: 'translateX(-50%)'
  }
})

// Zoom and pan handlers
const handleZoom = (e) => {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  zoom.value *= delta
  zoom.value = Math.max(0.5, Math.min(3, zoom.value))
}

const handleMouseDown = (e) => {
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  pan.value.x += dx
  pan.value.y += dy
  dragStart.value = { x: e.clientX, y: e.clientY }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const resetZoom = () => {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const selectAgent = (agentId) => {
  selectedAgent.value = selectedAgent.value === agentId ? null : agentId
}

// Lifecycle
onMounted(() => {
  console.log('🚀 NetworkTopologyEnhanced: Component mounted')
  console.log('📡 Data Source: Logs (endpoint names)')
  console.log('🔄 Auto-refresh interval: 30 seconds')
  
  // Initial fetch
  fetchAgents()
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing endpoints from logs...')
    fetchAgents()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    console.log('⏹️  Cleared refresh interval')
  }
})
</script>

<style scoped>
.text-2xs {
  font-size: 0.625rem;
}
</style>
