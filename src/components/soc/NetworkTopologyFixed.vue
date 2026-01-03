<template>
  <DashboardCard title="Network Topology" subtitle="Real-time network connections and threat visualization" size="full">
    <template #header-action>
      <div class="flex gap-2">
        <button
          @click="toggleFilters"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Toggle filters"
        >
          <i class="fas fa-filter mr-1"></i>Filter
        </button>
        <button
          @click="resetZoom"
          class="px-3 py-1 text-xs rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
          title="Reset view"
        >
          <i class="fas fa-redo mr-1"></i>Reset
        </button>
      </div>
    </template>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
      <div class="grid grid-cols-3 gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterCritical" type="checkbox" class="rounded" />
          <span>Critical</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterHigh" type="checkbox" class="rounded" />
          <span>High</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          <input v-model="filterNormal" type="checkbox" class="rounded" />
          <span>Normal</span>
        </label>
      </div>
    </div>

    <!-- SVG Canvas -->
    <div class="relative w-full h-96 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
      <svg
        ref="svgElement"
        class="w-full h-full cursor-grab active:cursor-grabbing"
        @wheel.prevent="handleZoom"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <defs>
          <!-- Arrow markers for edges -->
          <marker id="arrowhead-normal" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(0, 225, 255, 0.6)" />
          </marker>
          <marker id="arrowhead-high" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 139, 94, 0.8)" />
          </marker>
          <marker id="arrowhead-critical" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 45, 120, 0.8)" />
          </marker>

          <!-- Glow filters -->
          <filter id="glow-normal">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-critical">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Transform group for zoom/pan -->
        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <!-- Edges/Links -->
          <line
            v-for="edge in filteredEdges"
            :key="`edge-${edge.source}-${edge.target}`"
            :x1="nodes[edge.source]?.x || 0"
            :y1="nodes[edge.source]?.y || 0"
            :x2="nodes[edge.target]?.x || 0"
            :y2="nodes[edge.target]?.y || 0"
            :stroke="getEdgeColor(edge.severity)"
            stroke-width="2"
            :marker-end="getMarkerUrl(edge.severity)"
            opacity="0.6"
            class="transition-opacity duration-200"
            @mouseenter="hoveredEdge = `${edge.source}-${edge.target}`"
            @mouseleave="hoveredEdge = null"
          />

          <!-- Nodes -->
          <g
            v-for="(node, nodeId) in filteredNodes"
            :key="nodeId"
            :transform="`translate(${node.x}, ${node.y})`"
            class="cursor-pointer"
            @mouseenter="hoveredNode = nodeId"
            @mouseleave="hoveredNode = null"
            @click="selectNode(nodeId)"
          >
            <!-- Node circle with glow -->
            <circle
              :r="getNodeRadius(node.connections || 0)"
              :fill="getNodeColor(node.status)"
              :stroke="getNodeStroke(node.severity)"
              stroke-width="2"
              :filter="node.severity === 'Critical' ? 'url(#glow-critical)' : 'url(#glow-normal)'"
              class="transition-all duration-200"
              :opacity="hoveredNode === nodeId ? 1 : 0.8"
            />

            <!-- Node label -->
            <text
              x="0"
              y="25"
              text-anchor="middle"
              class="text-xs fill-white font-medium pointer-events-none"
            >
              {{ node.name || nodeId.substring(0, 8) }}
            </text>

            <!-- Node IP -->
            <text
              x="0"
              y="40"
              text-anchor="middle"
              class="text-2xs fill-slate-400 pointer-events-none"
            >
              {{ node.ip }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700/30 rounded-lg p-3 text-xs space-y-2">
        <div class="font-semibold text-slate-200 mb-2">Severity</div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="text-slate-400">Critical</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-orange-500"></div>
          <span class="text-slate-400">High</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-cyan-500"></div>
          <span class="text-slate-400">Normal</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700/30 rounded-lg p-3 text-xs space-y-1">
        <div class="text-slate-200 font-semibold">{{ Object.keys(filteredNodes).length }} Nodes</div>
        <div class="text-slate-400">{{ filteredEdges.length }} Connections</div>
      </div>
    </div>

    <!-- Stats Grid -->
    <template #footer>
      <div class="grid grid-cols-4 gap-3">
        <div class="text-center">
          <div class="text-lg font-bold text-red-400">{{ stats.critical }}</div>
          <div class="text-xs text-slate-500">Critical</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-orange-400">{{ stats.high }}</div>
          <div class="text-xs text-slate-500">High</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-cyan-400">{{ stats.total }}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-emerald-400">{{ stats.unique }}</div>
          <div class="text-xs text-slate-500">Unique IPs</div>
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import DashboardCard from '../common/DashboardCard.vue'

const apiStore = useAPIStore()
const svgElement = ref(null)
const hoveredNode = ref(null)
const hoveredEdge = ref(null)
const selectedNode = ref(null)
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const nodes = ref({})
const edges = ref([])
const showFilters = ref(false)
const filterCritical = ref(true)
const filterHigh = ref(true)
const filterNormal = ref(true)
let refreshInterval = null

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
    if (node.severity === 'Critical') criticalNodes.push([ip, node])
    else if (node.severity === 'High') highNodes.push([ip, node])
    else normalNodes.push([ip, node])
  })

  // Critical nodes in center circle
  criticalNodes.forEach((entry, i) => {
    const angle = (i / Math.max(criticalNodes.length, 1)) * Math.PI * 2
    const radius = 80
    entry[1].x = centerX + Math.cos(angle) * radius
    entry[1].y = centerY + Math.sin(angle) * radius
  })

  // High nodes in middle circle
  highNodes.forEach((entry, i) => {
    const angle = (i / Math.max(highNodes.length, 1)) * Math.PI * 2
    const radius = 180
    entry[1].x = centerX + Math.cos(angle) * radius
    entry[1].y = centerY + Math.sin(angle) * radius
  })

  // Normal nodes in outer circle
  normalNodes.forEach((entry, i) => {
    const angle = (i / Math.max(normalNodes.length, 1)) * Math.PI * 2
    const radius = 280
    entry[1].x = centerX + Math.cos(angle) * radius
    entry[1].y = centerY + Math.sin(angle) * radius
  })
}

const buildTopology = () => {
  const nodeMap = {}
  const edgeMap = {}

  // Get logs from API store
  const logs = apiStore.recentEvents || []

  logs.forEach(log => {
    const src = log.source_ip || log.src_ip
    const dst = log.dest_ip || log.dst_ip

    if (!src || !dst) return

    if (!nodeMap[src]) {
      nodeMap[src] = {
        x: 0,
        y: 0,
        connections: 0,
        severity: 'Low',
        status: 'online',
        ip: src,
        name: src.split('.').slice(-2).join('.')
      }
    }
    if (!nodeMap[dst]) {
      nodeMap[dst] = {
        x: 0,
        y: 0,
        connections: 0,
        severity: 'Low',
        status: 'online',
        ip: dst,
        name: dst.split('.').slice(-2).join('.')
      }
    }

    // Update severity based on log severity
    const logSeverity = log.severity || 'Low'
    if (logSeverity === 'Critical') {
      nodeMap[src].severity = 'Critical'
      nodeMap[dst].severity = 'Critical'
    } else if (logSeverity === 'High' && nodeMap[src].severity !== 'Critical') {
      nodeMap[src].severity = 'High'
      nodeMap[dst].severity = 'High'
    }

    nodeMap[src].connections++
    nodeMap[dst].connections++

    const edgeKey = `${src}-${dst}`
    if (!edgeMap[edgeKey]) {
      edgeMap[edgeKey] = { source: src, target: dst, count: 0, severity: 'Low' }
    }
    edgeMap[edgeKey].count++

    if (logSeverity === 'Critical') {
      edgeMap[edgeKey].severity = 'Critical'
    } else if (logSeverity === 'High' && edgeMap[edgeKey].severity !== 'Critical') {
      edgeMap[edgeKey].severity = 'High'
    }
  })

  computeStaticLayout(nodeMap)
  nodes.value = nodeMap
  edges.value = Object.values(edgeMap)
}

const getNodeColor = (status) => {
  return status === 'online' ? '#10B981' : '#EF4444'
}

const getNodeStroke = (severity) => {
  if (severity === 'Critical') return '#FF2D78'
  if (severity === 'High') return '#FF8B5E'
  return '#00E1FF'
}

const getEdgeColor = (severity) => {
  if (severity === 'Critical') return 'rgba(255, 45, 120, 0.8)'
  if (severity === 'High') return 'rgba(255, 139, 94, 0.8)'
  return 'rgba(0, 225, 255, 0.6)'
}

const getMarkerUrl = (severity) => {
  if (severity === 'Critical') return 'url(#arrowhead-critical)'
  if (severity === 'High') return 'url(#arrowhead-high)'
  return 'url(#arrowhead-normal)'
}

const getNodeRadius = (connections) => {
  return Math.min(25, 8 + Math.sqrt(connections) * 2)
}

const filteredNodes = computed(() => {
  return Object.fromEntries(
    Object.entries(nodes.value).filter(([_, node]) => {
      if (node.severity === 'Critical') return filterCritical.value
      if (node.severity === 'High') return filterHigh.value
      return filterNormal.value
    })
  )
})

const filteredEdges = computed(() => {
  return edges.value.filter(edge => {
    if (edge.severity === 'Critical') return filterCritical.value
    if (edge.severity === 'High') return filterHigh.value
    return filterNormal.value
  })
})

const stats = computed(() => ({
  critical: filteredEdges.value.filter(e => e.severity === 'Critical').length,
  high: filteredEdges.value.filter(e => e.severity === 'High').length,
  total: filteredEdges.value.length,
  unique: Object.keys(filteredNodes.value).length
}))

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

const selectNode = (nodeId) => {
  selectedNode.value = selectedNode.value === nodeId ? null : nodeId
}

const refreshTopology = () => {
  buildTopology()
}

onMounted(() => {
  buildTopology()
  refreshInterval = setInterval(refreshTopology, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.text-2xs {
  font-size: 0.625rem;
}
</style>
