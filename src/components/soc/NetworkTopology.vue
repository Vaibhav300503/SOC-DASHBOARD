<template>
  <div class="card-glass p-6 rounded-xl">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-slate-dark-50">Network Topology</h3>
      <div class="flex gap-2">
        <button 
          @click="toggleAutoLayout"
          class="px-3 py-1 text-xs rounded-lg bg-cyber-600/20 text-cyber-400 border border-cyber-500/50 hover:bg-cyber-600/30"
        >
          <i class="fas fa-sitemap mr-1"></i>{{ autoLayout ? 'Stop' : 'Auto' }} Layout
        </button>
        <button 
          @click="resetZoom"
          class="px-3 py-1 text-xs rounded-lg bg-cyber-600/20 text-cyber-400 border border-cyber-500/50 hover:bg-cyber-600/30"
        >
          <i class="fas fa-search-minus mr-1"></i>Reset
        </button>
      </div>
    </div>

    <div class="relative w-full h-96 bg-slate-dark-900/50 rounded-lg overflow-hidden border border-slate-dark-700/50">
      <svg 
        ref="svgElement"
        class="w-full h-full"
        @wheel.prevent="handleZoom"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <!-- Define arrow marker for edges -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(91, 109, 255, 0.6)" />
          </marker>
          <marker id="arrowhead-critical" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 0, 85, 0.8)" />
          </marker>
          <marker id="arrowhead-high" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 107, 53, 0.8)" />
          </marker>
        </defs>

        <!-- Transform group for zoom/pan -->
        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <!-- Edges/Links -->
          <line
            v-for="edge in edges"
            :key="`edge-${edge.source}-${edge.target}`"
            :x1="nodes[edge.source]?.x || 0"
            :y1="nodes[edge.source]?.y || 0"
            :x2="nodes[edge.target]?.x || 0"
            :y2="nodes[edge.target]?.y || 0"
            :stroke="getEdgeColor(edge.severity)"
            stroke-width="2"
            :marker-end="getMarkerUrl(edge.severity)"
            opacity="0.6"
          />

          <!-- Nodes -->
          <g v-for="(node, nodeId) in nodes" :key="nodeId" :transform="`translate(${node.x}, ${node.y})`">
            <circle 
              :r="getNodeRadius(node.connections || 0)" 
              :fill="node.status === 'online' ? '#4CAF50' : '#F44336'"
              :stroke="getNodeStroke(node.severity)"
              stroke-width="2"
              @mouseenter="hoveredNode = nodeId"
              @mouseleave="hoveredNode = null"
              class="cursor-pointer transition-all duration-200"
            />
            <text 
              x="0" 
              y="25" 
              text-anchor="middle" 
              class="text-xs fill-current text-white font-medium"
            >
              {{ node.name || nodeId }}
            </text>
            <text 
              x="0" 
              y="40" 
              text-anchor="middle" 
              class="text-2xs fill-current text-gray-400"
            >
              {{ node.ip }}
            </text>
            <text 
              x="0" 
              y="52" 
              text-anchor="middle" 
              class="text-2xs fill-current text-gray-500"
            >
              {{ node.os }} • {{ node.status }}
            </text>
            <!-- Show tags if available -->
            <text 
              v-if="node.tags && node.tags.length > 0"
              x="0" 
              y="64" 
              text-anchor="middle" 
              class="text-2xs fill-current text-cyber-400"
            >
              {{ node.tags.slice(0, 2).join(', ') }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 bg-slate-dark-800/80 backdrop-blur-sm border border-slate-dark-700 rounded-lg p-3 text-xs">
        <div class="font-semibold text-slate-dark-200 mb-2">Connection Severity</div>
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

      <!-- Stats info -->
      <div class="absolute top-4 right-4 bg-slate-dark-800/80 backdrop-blur-sm border border-slate-dark-700 rounded-lg p-3 text-xs">
        <div class="text-slate-dark-200 font-semibold">{{ Object.keys(nodes).length }} Nodes</div>
        <div class="text-slate-dark-400">{{ edges.length }} Connections</div>
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
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useLogStore } from '../../stores/logStore'
import axios from 'axios'

const logStore = useLogStore()
const svgElement = ref(null)
const hoveredNode = ref(null)
const autoLayout = ref(true)
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const nodes = ref({})
const edges = ref([])
let refreshInterval = null

// Lightweight static layout computation (no physics simulation)
const computeStaticLayout = (nodeMap) => {
  const nodeArray = Object.entries(nodeMap)
  const width = 800
  const height = 600
  const centerX = width / 2
  const centerY = height / 2

  // Categorize nodes
  const criticalNodes = []
  const highNodes = []
  const normalNodes = []

  nodeArray.forEach(([ip, node]) => {
    if (node.severity === 'Critical') criticalNodes.push([ip, node])
    else if (node.severity === 'High') highNodes.push([ip, node])
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

// Fetch Tailscale topology data
const fetchTailscaleTopology = async () => {
  try {
    const response = await axios.get('/api/tailscale/topology');
    if (response.data.success) {
      const topologyData = response.data.data;
      
      // Convert nodes array to object format expected by the component
      const nodeMap = {};
      topologyData.nodes.forEach(node => {
        nodeMap[node.id] = {
          ...node,
          x: 0,
          y: 0,
          connections: 0,
          severity: node.status === 'online' ? 'Normal' : 'Low'
        };
      });
      
      // Count connections for each node
      topologyData.edges.forEach(edge => {
        if (nodeMap[edge.source]) nodeMap[edge.source].connections++;
        if (nodeMap[edge.target]) nodeMap[edge.target].connections++;
      });
      
      nodes.value = nodeMap;
      edges.value = topologyData.edges;
      
      // Apply layout
      computeStaticLayout(nodes.value);
      
      console.log('Tailscale topology loaded:', {
        nodes: Object.keys(nodes.value).length,
        edges: edges.value.length,
        online: topologyData.onlineNodes,
        offline: topologyData.offlineNodes
      });
    }
  } catch (error) {
    console.error('Failed to fetch Tailscale topology:', error);
    // Fallback to mock data from logStore
    if (logStore.logs.length === 0) {
      logStore.initializeLogs();
    }
    buildTopology();
  }
};

// Build network topology from logs (static layout, no physics)
const buildTopology = () => {
  const nodeMap = {}
  const edgeMap = {}

  logStore.logs.forEach(log => {
    const src = log.source_ip
    const dst = log.dest_ip

    // Initialize nodes with static positions (no velocity)
    if (!nodeMap[src]) {
      nodeMap[src] = {
        x: 0,
        y: 0,
        connections: 0,
        severity: 'Low',
      }
    }
    if (!nodeMap[dst]) {
      nodeMap[dst] = {
        x: 0,
        y: 0,
        connections: 0,
        severity: 'Low',
      }
    }

    // Update severity
    if (log.severity === 'Critical') {
      nodeMap[src].severity = 'Critical'
      nodeMap[dst].severity = 'Critical'
    } else if (log.severity === 'High' && nodeMap[src].severity !== 'Critical') {
      nodeMap[src].severity = 'High'
      nodeMap[dst].severity = 'High'
    }

    // Count connections
    nodeMap[src].connections++
    nodeMap[dst].connections++

    // Create edges
    const edgeKey = `${src}-${dst}`
    if (!edgeMap[edgeKey]) {
      edgeMap[edgeKey] = {
        source: src,
        target: dst,
        count: 0,
        severity: 'Low',
      }
    }
    edgeMap[edgeKey].count++

    // Update edge severity
    if (log.severity === 'Critical') {
      edgeMap[edgeKey].severity = 'Critical'
    } else if (log.severity === 'High' && edgeMap[edgeKey].severity !== 'Critical') {
      edgeMap[edgeKey].severity = 'High'
    }
  })

  // Compute static layout once
  computeStaticLayout(nodeMap)

  nodes.value = nodeMap
  edges.value = Object.values(edgeMap)
}

// Minimal animation - just a no-op placeholder for compatibility
const simulateLayout = () => {
  // Static layout - no simulation needed
  // This function is kept for compatibility with animation loop
}

// Color helpers
const getNodeColor = (severity) => {
  if (severity === 'Critical') return '#ff0055'
  if (severity === 'High') return '#ff6b35'
  return '#5b6dff'
}

const getNodeStroke = (severity) => {
  if (severity === 'Critical') return '#ff0055'
  if (severity === 'High') return '#ff6b35'
  return '#00ff88'
}

const getEdgeColor = (severity) => {
  if (severity === 'Critical') return 'rgba(255, 0, 85, 0.8)'
  if (severity === 'High') return 'rgba(255, 107, 53, 0.8)'
  return 'rgba(91, 109, 255, 0.6)'
}

const getMarkerUrl = (severity) => {
  if (severity === 'Critical') return 'url(#arrowhead-critical)'
  if (severity === 'High') return 'url(#arrowhead-high)'
  return 'url(#arrowhead)'
}

const getNodeRadius = (connections) => {
  return Math.min(25, 8 + Math.sqrt(connections) * 2)
}

// Stats
const stats = computed(() => ({
  critical: edges.value.filter(e => e.severity === 'Critical').length,
  high: edges.value.filter(e => e.severity === 'High').length,
  total: edges.value.length,
  unique: Object.keys(nodes.value).length,
}))

// Interaction handlers
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

const toggleAutoLayout = () => {
  autoLayout.value = !autoLayout.value
}

// Initialize topology (no continuous animation loop)
onMounted(() => {
  fetchTailscaleTopology();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(fetchTailscaleTopology, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch for log changes (for fallback mode)
watch(() => logStore.logs, () => {
  if (Object.keys(nodes.value).length === 0) {
    buildTopology();
  }
}, { deep: true })

// Rebuild topology when logs change
watch(() => logStore.logs.length, () => {
  buildTopology()
})
</script>

<style scoped>
svg {
  cursor: grab;
}

svg:active {
  cursor: grabbing;
}
</style>
