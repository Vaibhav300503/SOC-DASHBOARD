<template>
  <div class="card-glass p-6 rounded-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-slate-dark-50">Network Topology</h3>
      <div class="flex gap-2">
        <button 
          @click="resetView"
          class="px-3 py-1 text-xs rounded-lg bg-cyber-600/20 text-cyber-400 border border-cyber-500/50 hover:bg-cyber-600/30"
        >
          <i class="fas fa-search-minus mr-1"></i>Reset
        </button>
        <select 
          v-model="timeRangeLocal"
          class="px-3 py-1 text-xs rounded-lg bg-cyber-600/20 text-cyber-400 border border-cyber-500/50 hover:bg-cyber-600/30"
        >
          <option value="1h">1 Hour</option>
          <option value="6h">6 Hours</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
        </select>
      </div>
    </div>

    <!-- Canvas-based lightweight topology -->
    <div class="relative w-full h-96 bg-slate-dark-900/50 rounded-lg overflow-hidden border border-slate-dark-700/50">
      <canvas 
        ref="canvas"
        class="w-full h-full"
        @wheel.prevent="handleZoom"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      ></canvas>

      <!-- Tooltip -->
      <div 
        v-if="hoveredNode"
        class="absolute bg-slate-dark-800 border border-slate-dark-700 rounded-lg p-3 text-xs z-50 pointer-events-none"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >
        <div class="font-semibold text-cyber-400">{{ hoveredNode.id }}</div>
        <div class="text-slate-dark-400 mt-1">
          <div>Flows: {{ hoveredNode.outbound + hoveredNode.inbound }}</div>
          <div>Alerts: {{ hoveredNode.alerts }}</div>
          <div>Type: {{ hoveredNode.type }}</div>
        </div>
      </div>

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 bg-slate-dark-800/80 backdrop-blur-sm border border-slate-dark-700 rounded-lg p-3 text-xs">
        <div class="font-semibold text-slate-dark-200 mb-2">Legend</div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-neon-red"></div>
            <span class="text-slate-dark-400">Critical</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-neon-orange"></div>
            <span class="text-slate-dark-400">High</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-cyber-400"></div>
            <span class="text-slate-dark-400">Normal</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="absolute top-4 right-4 bg-slate-dark-800/80 backdrop-blur-sm border border-slate-dark-700 rounded-lg p-3 text-xs">
        <div class="text-slate-dark-200 font-semibold">{{ stats.nodes }} Nodes</div>
        <div class="text-slate-dark-400">{{ stats.edges }} Connections</div>
      </div>
    </div>

    <!-- Stats below topology -->
    <div class="grid grid-cols-4 gap-4 mt-6">
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-neon-red">{{ stats.critical }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">Critical Connections</div>
      </div>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-neon-orange">{{ stats.high }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">High Severity</div>
      </div>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-cyber-400">{{ stats.total }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">Total Connections</div>
      </div>
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-2xl font-bold text-neon-green">{{ stats.unique }}</div>
        <div class="text-xs text-slate-dark-400 mt-1">Unique IPs</div>
      </div>
    </div>

    <!-- Node Details Panel -->
    <div 
      v-if="selectedNode"
      class="mt-6 bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-semibold text-slate-dark-50">Node Details: {{ selectedNode.id }}</h4>
        <button 
          @click="selectedNode = null"
          class="text-slate-dark-400 hover:text-slate-dark-200"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div class="text-slate-dark-400">Type</div>
          <div class="text-slate-dark-200 font-semibold">{{ selectedNode.type }}</div>
        </div>
        <div>
          <div class="text-slate-dark-400">Alerts</div>
          <div class="text-neon-red font-semibold">{{ selectedNode.alerts }}</div>
        </div>
        <div>
          <div class="text-slate-dark-400">Outbound Flows</div>
          <div class="text-cyber-400 font-semibold">{{ selectedNode.outbound }}</div>
        </div>
        <div>
          <div class="text-slate-dark-400">Inbound Flows</div>
          <div class="text-cyber-400 font-semibold">{{ selectedNode.inbound }}</div>
        </div>
        <div>
          <div class="text-slate-dark-400">Total Bytes</div>
          <div class="text-slate-dark-200 font-semibold">{{ formatBytes(selectedNode.totalBytes) }}</div>
        </div>
      </div>

      <button 
        @click="investigateNode"
        class="mt-4 w-full px-3 py-2 rounded-lg bg-cyber-600/20 text-cyber-400 border border-cyber-500/50 hover:bg-cyber-600/30 text-xs font-semibold transition-all"
      >
        <i class="fas fa-search mr-2"></i>Investigate Node
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineProps, nextTick } from 'vue'
import axios from 'axios'

const props = defineProps({
  modelValue: {
    type: String,
    default: '24h'
  },
  indiaCentric: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Local ref for the time range that we can modify
const timeRangeLocal = ref(props.modelValue)

// Watch for changes from parent
watch(() => props.modelValue, (newVal) => {
  timeRangeLocal.value = newVal
})

// Emit updates when local value changes
watch(timeRangeLocal, (newVal) => {
  emit('update:modelValue', newVal)
})

const canvas = ref(null)
const ctx = ref(null)
const nodes = ref({})
const edges = ref([])
const hoveredNode = ref(null)
const selectedNode = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const loading = ref(true)
let animationFrameId = null
let isMounted = true

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

// India-centric defaults
const INDIA_CENTER = {
  lat: 20.5937,
  lng: 78.9629,
  zoom: 4
}

const INDIA_TIMEZONE = 'Asia/Kolkata'

// Compute static layout (concentric rings by severity)
const computeStaticLayout = (nodeMap) => {
  const nodeArray = Object.entries(nodeMap)
  const width = 800
  const height = 600
  const centerX = width / 2
  const centerY = height / 2

  const criticalNodes = []
  const highNodes = []
  const normalNodes = []

  nodeArray.forEach(([ip, node]) => {
    if (node.severity === 'red') criticalNodes.push([ip, node])
    else if (node.severity === 'orange') highNodes.push([ip, node])
    else normalNodes.push([ip, node])
  })

  // Place critical nodes in center cluster
  criticalNodes.forEach((entry, i) => {
    const angle = (i / Math.max(criticalNodes.length, 1)) * Math.PI * 2
    const radius = 80
    entry[1].x = centerX + Math.cos(angle) * radius
    entry[1].y = centerY + Math.sin(angle) * radius
  })

  // Place high severity nodes in middle ring
  highNodes.forEach((entry, i) => {
    const angle = (i / Math.max(highNodes.length, 1)) * Math.PI * 2
    const radius = 180
    entry[1].x = centerX + Math.cos(angle) * radius
    entry[1].y = centerY + Math.sin(angle) * radius
  })

  // Place normal nodes in outer ring
  normalNodes.forEach((entry, i) => {
    const angle = (i / Math.max(normalNodes.length, 1)) * Math.PI * 2
    const radius = 280
    entry[1].x = centerX + Math.cos(angle) * radius
    entry[1].y = centerY + Math.sin(angle) * radius
  })
}

// Fetch topology data from backend
const fetchTopology = async () => {
  console.log('Fetching topology data...')
  try {
    loading.value = true
    
    const response = await axios.get(`${API_BASE}/events/topology`, {
      params: { 
        timeRange: timeRangeLocal.value,
        limit: 1000
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.data && response.data.connections) {
      const nodeMap = {}
      
      // Build node map from nodes data
      response.data.nodes.forEach(node => {
        nodeMap[node.id] = {
          id: node.id,
          type: 'Node',
          outbound: node.connections,
          inbound: node.connections,
          alerts: node.severity === 'Critical' ? 15 : node.severity === 'High' ? 8 : 2,
          totalBytes: node.bytes,
          severity: getSeverityColor(node.severity),
          x: 0,
          y: 0
        }
      })

      // Transform connections to edges format
      const transformedEdges = response.data.connections.map(conn => ({
        source: conn.source,
        target: conn.target,
        flows: conn.value || 1,
        severity: conn.severity === 'Critical' ? 'red' : conn.severity === 'High' ? 'orange' : 'blue'
      }))

      // Compute static layout
      computeStaticLayout(nodeMap)
      nodes.value = nodeMap
      edges.value = transformedEdges
    }
  } catch (error) {
    console.error('Failed to fetch topology:', error)
    // Use sample data for demonstration
    console.log('Using sample topology data...')
    
    // Sample nodes with various severity levels
    const sampleNodes = [
      { id: '192.168.1.1', type: 'Server', outbound: 45, inbound: 32, alerts: 15, totalBytes: 1048576000 },
      { id: '10.0.0.1', type: 'Firewall', outbound: 120, inbound: 98, alerts: 3, totalBytes: 2147483648 },
      { id: '172.16.0.1', type: 'Router', outbound: 89, inbound: 76, alerts: 8, totalBytes: 1073741824 },
      { id: '203.197.200.1', type: 'External', outbound: 23, inbound: 45, alerts: 12, totalBytes: 536870912 },
      { id: '8.8.8.8', type: 'DNS', outbound: 67, inbound: 54, alerts: 2, totalBytes: 268435456 },
      { id: '192.168.1.100', type: 'Workstation', outbound: 34, inbound: 28, alerts: 6, totalBytes: 134217728 },
      { id: '10.0.0.50', type: 'Database', outbound: 156, inbound: 134, alerts: 18, totalBytes: 4294967296 },
      { id: '172.16.0.25', type: 'Switch', outbound: 78, inbound: 65, alerts: 4, totalBytes: 322122547 },
      { id: '203.197.200.100', type: 'Web Server', outbound: 92, inbound: 87, alerts: 9, totalBytes: 1610612736 },
      { id: '192.168.1.200', type: 'Workstation', outbound: 12, inbound: 18, alerts: 1, totalBytes: 67108864 },
      { id: '10.0.0.10', type: 'Application Server', outbound: 203, inbound: 187, alerts: 22, totalBytes: 6442450944 },
      { id: '172.16.0.50', type: 'Backup Server', outbound: 56, inbound: 48, alerts: 5, totalBytes: 858993459 }
    ]
    
    // Sample edges with connections and severity
    const sampleEdges = [
      { source: '192.168.1.1', target: '10.0.0.1', flows: 25, severity: 'red' },
      { source: '10.0.0.1', target: '172.16.0.1', flows: 40, severity: 'orange' },
      { source: '172.16.0.1', target: '203.197.200.1', flows: 15, severity: 'blue' },
      { source: '192.168.1.1', target: '8.8.8.8', flows: 8, severity: 'blue' },
      { source: '192.168.1.100', target: '192.168.1.1', flows: 12, severity: 'orange' },
      { source: '10.0.0.50', target: '10.0.0.1', flows: 35, severity: 'red' },
      { source: '172.16.0.25', target: '172.16.0.1', flows: 28, severity: 'blue' },
      { source: '203.197.200.100', target: '203.197.200.1', flows: 20, severity: 'orange' },
      { source: '192.168.1.200', target: '192.168.1.1', flows: 6, severity: 'blue' },
      { source: '10.0.0.10', target: '10.0.0.50', flows: 45, severity: 'red' },
      { source: '172.16.0.50', target: '172.16.0.25', flows: 18, severity: 'blue' },
      { source: '192.168.1.100', target: '10.0.0.10', flows: 22, severity: 'orange' },
      { source: '203.197.200.100', target: '192.168.1.1', flows: 30, severity: 'orange' },
      { source: '8.8.8.8', target: '172.16.0.1', flows: 10, severity: 'blue' },
      { source: '10.0.0.50', target: '203.197.200.100', flows: 38, severity: 'red' }
    ]
    
    const nodeMap = {}
    
    // Build node map with severity colors
    sampleNodes.forEach(node => {
      nodeMap[node.id] = {
        ...node,
        severity: getSeverityColor(node.alerts),
        x: 0,
        y: 0
      }
    })
    
    // Compute static layout
    computeStaticLayout(nodeMap)
    nodes.value = nodeMap
    edges.value = sampleEdges
  } finally {
    loading.value = false
  }
}

const getSeverityColor = (alerts) => {
  if (alerts > 10) return 'red'
  if (alerts > 5) return 'orange'
  return 'blue'
}

const getColorRGB = (severity) => {
  const colors = {
    red: [255, 0, 85],
    orange: [255, 107, 53],
    blue: [91, 109, 255]
  }
  return colors[severity] || [91, 109, 255]
}

// Canvas rendering
const render = () => {
  if (!ctx.value || !isMounted) return
  
  const canvas = ctx.value.canvas
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas with dark background
  ctx.value.fillStyle = 'rgba(15, 23, 42, 1)'
  ctx.value.fillRect(0, 0, width, height)
  
  // If no nodes, show loading or empty state
  if (Object.keys(nodes.value).length === 0) {
    ctx.value.fillStyle = '#64748b'
    ctx.value.textAlign = 'center'
    ctx.value.font = '14px Arial'
    ctx.value.fillText('Loading network data...', width / 2, height / 2)
    return
  }

  // Draw edges
  edges.value.forEach(edge => {
    const source = nodes.value[edge.source]
    const target = nodes.value[edge.target]

    if (source && target) {
      const x1 = source.x * zoom.value + pan.value.x
      const y1 = source.y * zoom.value + pan.value.y
      const x2 = target.x * zoom.value + pan.value.x
      const y2 = target.y * zoom.value + pan.value.y

      const [r, g, b] = getColorRGB(edge.severity)
      ctx.value.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.4)`
      ctx.value.lineWidth = Math.max(1, edge.flows / 10)

      ctx.value.beginPath()
      ctx.value.moveTo(x1, y1)
      ctx.value.lineTo(x2, y2)
      ctx.value.stroke()

      // Draw arrow
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const arrowSize = 8
      ctx.value.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
      ctx.value.beginPath()
      ctx.value.moveTo(x2, y2)
      ctx.value.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6))
      ctx.value.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6))
      ctx.value.closePath()
      ctx.value.fill()
    }
  })

  // Draw nodes
  Object.entries(nodes.value).forEach(([ip, node]) => {
    const x = node.x * zoom.value + pan.value.x
    const y = node.y * zoom.value + pan.value.y
    const radius = Math.min(15, 6 + Math.sqrt(node.outbound + node.inbound) * 0.5)

    const [r, g, b] = getColorRGB(node.severity)
    ctx.value.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`
    ctx.value.beginPath()
    ctx.value.arc(x, y, radius, 0, Math.PI * 2)
    ctx.value.fill()

    // Highlight if hovered or selected
    if (hoveredNode.value?.id === ip || selectedNode.value?.id === ip) {
      ctx.value.strokeStyle = `rgba(${r}, ${g}, ${b}, 1)`
      ctx.value.lineWidth = 3
      ctx.value.beginPath()
      ctx.value.arc(x, y, radius + 3, 0, Math.PI * 2)
      ctx.value.stroke()
    }

    // Draw label for important nodes
    if (node.alerts > 5 || hoveredNode.value?.id === ip) {
      ctx.value.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.value.font = 'bold 10px Arial'
      ctx.value.textAlign = 'center'
      ctx.value.fillText(ip.split('.').slice(-2).join('.'), x, y + 25)
    }
  })
}

// Animation loop
const animate = () => {
  try {
    if (!isMounted) return
    render()
    animationFrameId = requestAnimationFrame(animate)
  } catch (error) {
    console.error('Animation error:', error)
    // Stop animation on error
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
}

// Mouse handlers
const handleMouseDown = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // Check if clicked on a node
  Object.entries(nodes.value).forEach(([ip, node]) => {
    const nodeX = node.x * zoom.value + pan.value.x
    const nodeY = node.y * zoom.value + pan.value.y
    const radius = 15

    if (Math.hypot(x - nodeX, y - nodeY) < radius) {
      selectedNode.value = node
      return
    }
  })

  isDragging.value = true
  dragStart.value = { x, y }
}

const handleMouseMove = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  tooltipPos.value = { x: x + 10, y: y + 10 }

  // Check hover
  hoveredNode.value = null
  Object.entries(nodes.value).forEach(([ip, node]) => {
    const nodeX = node.x * zoom.value + pan.value.x
    const nodeY = node.y * zoom.value + pan.value.y
    const radius = 15

    if (Math.hypot(x - nodeX, y - nodeY) < radius) {
      hoveredNode.value = node
    }
  })

  if (!isDragging.value) return

  const dx = x - dragStart.value.x
  const dy = y - dragStart.value.y
  pan.value.x += dx
  pan.value.y += dy
  dragStart.value = { x, y }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleZoom = (e) => {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  zoom.value *= delta
  zoom.value = Math.max(0.5, Math.min(3, zoom.value))
}

const resetView = () => {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
  selectedNode.value = null
}

const investigateNode = () => {
  if (selectedNode.value) {
    localStorage.setItem('investigatingIP', selectedNode.value.id)
    // Could emit event or navigate here
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const stats = computed(() => ({
  nodes: Object.keys(nodes.value).length,
  edges: edges.value.length,
  critical: edges.value.filter(e => e.severity === 'red').length,
  high: edges.value.filter(e => e.severity === 'orange').length,
  total: edges.value.length,
  unique: Object.keys(nodes.value).length
}))

// Watch for time range changes
watch(timeRangeLocal, () => {
  fetchTopology()
})

onMounted(async () => {
  // Wait for canvas to be available
  await nextTick()
  
  if (!canvas.value) {
    console.error('Canvas element not found')
    return
  }
  
  ctx.value = canvas.value.getContext('2d')
  
  // Set canvas size
  const rect = canvas.value.parentElement.getBoundingClientRect()
  canvas.value.width = rect.width
  canvas.value.height = rect.height
  
  // Initial fetch
  await fetchTopology()
  
  // Start rendering loop
  animate()
  
  // Add window resize handler
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  console.log('Cleaning up NetworkGraphLight component')
  
  // Mark as unmounted to prevent further rendering
  isMounted = false
  
  // Clean up animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // Remove window resize listener
  window.removeEventListener('resize', handleResize)
  
  // Clean up canvas
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    }
    // Remove all event listeners
    canvas.value.removeEventListener('wheel', handleZoom)
    canvas.value.removeEventListener('mousedown', handleMouseDown)
    canvas.value.removeEventListener('mousemove', handleMouseMove)
    canvas.value.removeEventListener('mouseup', handleMouseUp)
    canvas.value.removeEventListener('mouseleave', handleMouseUp)
  }
  
  // Reset refs
  nodes.value = {}
  edges.value = []
  hoveredNode.value = null
  selectedNode.value = null
  
  console.log('NetworkGraphLight cleanup complete')
})

const handleResize = () => {
  if (canvas.value) {
    const canvas = canvas.value
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    render()
  }
}
</script>

<style scoped>
canvas {
  cursor: grab;
  display: block;
  width: 100%;
  height: 100%;
}

canvas:active {
  cursor: grabbing;
}
</style>
