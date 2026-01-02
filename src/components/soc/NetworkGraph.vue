<template>
  <div class="network-graph-container">
    <!-- Controls -->
    <div class="graph-controls">
      <div class="control-group">
        <label>Time Range:</label>
        <select v-model="timeRange" @change="loadTopology" class="control-select">
          <option value="1h">Last 1 Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div class="control-group">
        <label>Min Flows:</label>
        <input v-model.number="minFlows" type="number" min="1" max="100" class="control-input" />
        <button @click="loadTopology" class="control-button">
          <i class="fas fa-sync"></i> Refresh
        </button>
      </div>

      <div class="control-group">
        <button @click="zoomIn" class="control-button" title="Zoom In">
          <i class="fas fa-search-plus"></i>
        </button>
        <button @click="zoomOut" class="control-button" title="Zoom Out">
          <i class="fas fa-search-minus"></i>
        </button>
        <button @click="resetZoom" class="control-button" title="Reset View">
          <i class="fas fa-expand"></i>
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="graph-legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #10b981;"></span>
        <span>Low (Green)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #f59e0b;"></span>
        <span>Medium (Yellow)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #f97316;"></span>
        <span>High (Orange)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ef4444;"></span>
        <span>Critical (Red)</span>
      </div>
      <div class="legend-item">
        <span class="legend-node inside"></span>
        <span>Internal</span>
      </div>
      <div class="legend-item">
        <span class="legend-node outside"></span>
        <span>External</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading topology...</p>
    </div>

    <!-- Graph container -->
    <div ref="graphContainer" class="graph-canvas"></div>

    <!-- Node details panel -->
    <div v-if="selectedNode" class="node-details-panel">
      <button @click="selectedNode = null" class="close-button">
        <i class="fas fa-times"></i>
      </button>

      <div class="panel-header">
        <h3>{{ selectedNode.id }}</h3>
        <span class="node-type" :class="selectedNode.type">{{ selectedNode.type }}</span>
      </div>

      <div class="panel-content">
        <div class="stat-item">
          <span class="stat-label">Type:</span>
          <span class="stat-value">{{ selectedNode.type === 'inside' ? 'Internal' : 'External' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Inbound Flows:</span>
          <span class="stat-value">{{ selectedNode.inbound }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Outbound Flows:</span>
          <span class="stat-value">{{ selectedNode.outbound }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Bytes:</span>
          <span class="stat-value">{{ formatBytes(selectedNode.totalBytes) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Alerts:</span>
          <span class="stat-value alert-count" :class="{ critical: selectedNode.alerts > 0 }">
            {{ selectedNode.alerts }}
          </span>
        </div>
      </div>

      <div class="panel-actions">
        <button @click="viewNodeLogs" class="action-button">
          <i class="fas fa-list"></i> View Logs
        </button>
        <button @click="viewNodeAlerts" class="action-button">
          <i class="fas fa-bell"></i> View Alerts
        </button>
        <button @click="viewNodeGeo" class="action-button">
          <i class="fas fa-globe"></i> GeoIP
        </button>
      </div>
    </div>

    <!-- Stats panel -->
    <div class="stats-panel">
      <div class="stat-box">
        <div class="stat-number">{{ stats.totalNodes }}</div>
        <div class="stat-label">Nodes</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">{{ stats.totalEdges }}</div>
        <div class="stat-label">Connections</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">{{ stats.totalFlows }}</div>
        <div class="stat-label">Flows</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">{{ formatBytes(stats.totalBytes) }}</div>
        <div class="stat-label">Traffic</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as d3 from 'd3'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const graphContainer = ref(null)
const loading = ref(false)
const timeRange = ref('24h')
const minFlows = ref(1)
const selectedNode = ref(null)

const stats = ref({
  totalNodes: 0,
  totalEdges: 0,
  totalFlows: 0,
  totalBytes: 0
})

let simulation = null
let svg = null
let g = null
let zoom = null

/**
 * Load topology data
 */
const loadTopology = async () => {
  loading.value = true
  try {
    // Check if we're in the Tailscale page context
    const isTailscalePage = window.location.pathname.includes('/tailscale')
    
    let response
    if (isTailscalePage) {
      // Use Tailscale topology endpoint
      response = await axios.get(`${API_BASE}/tailscale/topology`)
    } else {
      // Use regular topology topology endpoint
      response = await axios.get(`${API_BASE}/topology`, {
        params: {
          timeRange: timeRange.value,
          minFlows: minFlows.value
        }
      })
    }

    if (response.data.success) {
      const isTailscalePage = window.location.pathname.includes('/tailscale')
      
      if (isTailscalePage) {
        // Handle Tailscale topology data structure
        stats.value = {
          totalNodes: response.data.data.totalNodes,
          totalEdges: response.data.data.edges.length,
          onlineNodes: response.data.data.onlineNodes,
          offlineNodes: response.data.data.offlineNodes
        }
        await nextTick()
        renderGraph(response.data.data.nodes, response.data.data.edges)
      } else {
        // Handle regular topology data structure
        stats.value = response.data.stats
        await nextTick()
        renderGraph(response.data.nodes, response.data.edges)
      }
    }
  } catch (error) {
    console.error('Failed to load topology:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Render D3 graph
 */
const renderGraph = (nodes, edges) => {
  if (!graphContainer.value) return

  // Clear previous graph
  d3.select(graphContainer.value).selectAll('*').remove()

  const width = graphContainer.value.clientWidth
  const height = graphContainer.value.clientHeight

  // Create SVG
  svg = d3.select(graphContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', 'rgba(15, 23, 42, 0.5)')

  // Add zoom behavior
  zoom = d3.zoom()
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // Create group for zooming
  g = svg.append('g')

  // Create simulation
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges)
      .id(d => d.id)
      .distance(100)
      .strength(0.5))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40))

  // Create links
  const link = g.append('g')
    .selectAll('line')
    .data(edges)
    .enter()
    .append('line')
    .attr('stroke', d => getSeverityColor(d.severity))
    .attr('stroke-width', d => Math.log(d.flows) + 1)
    .attr('opacity', 0.6)
    .attr('marker-end', 'url(#arrowhead)')

  // Add arrow marker
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .attr('refX', 25)
    .attr('refY', 3)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', '0 0, 10 3, 0 6')
    .attr('fill', '#00d9ff')

  // Create nodes
  const node = g.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', d => 15 + (d.alerts > 0 ? 5 : 0))
    .attr('fill', d => d.type === 'inside' ? '#0099cc' : '#ff6b6b')
    .attr('stroke', d => d.alerts > 0 ? '#ff006e' : '#00d9ff')
    .attr('stroke-width', d => d.alerts > 0 ? 3 : 2)
    .attr('opacity', 0.8)
    .on('click', (event, d) => {
      event.stopPropagation()
      selectedNode.value = d
    })
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 25)
        .attr('opacity', 1)

      // Show tooltip
      showTooltip(event, d)
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', d => 15 + (d.alerts > 0 ? 5 : 0))
        .attr('opacity', 0.8)

      hideTooltip()
    })
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded))

  // Add labels
  const labels = g.append('g')
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.3em')
    .attr('font-size', '11px')
    .attr('fill', '#cbd5e1')
    .attr('pointer-events', 'none')
    .text(d => d.id.split('.').slice(-2).join('.'))

  // Update positions on simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    labels
      .attr('x', d => d.x)
      .attr('y', d => d.y)
  })

  // Drag functions
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
}

/**
 * Get severity color
 */
const getSeverityColor = (severity) => {
  const colors = {
    'green': '#10b981',
    'yellow': '#f59e0b',
    'orange': '#f97316',
    'red': '#ef4444'
  }
  return colors[severity] || '#64748b'
}

/**
 * Format bytes
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Zoom controls
 */
const zoomIn = () => {
  svg.transition().call(zoom.scaleBy, 1.3)
}

const zoomOut = () => {
  svg.transition().call(zoom.scaleBy, 0.7)
}

const resetZoom = () => {
  const width = graphContainer.value.clientWidth
  const height = graphContainer.value.clientHeight
  svg.transition().call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
}

/**
 * Node actions
 */
const viewNodeLogs = () => {
  router.push({
    name: 'LogViewer',
    query: { ip: selectedNode.value.id }
  })
}

const viewNodeAlerts = () => {
  router.push({
    name: 'Alerts',
    query: { ip: selectedNode.value.id }
  })
}

const viewNodeGeo = () => {
  router.push({
    name: 'GeoAnalytics',
    query: { ip: selectedNode.value.id }
  })
}

/**
 * Tooltip functions
 */
const showTooltip = (event, d) => {
  // Implement tooltip if needed
}

const hideTooltip = () => {
  // Implement tooltip if needed
}

onMounted(() => {
  loadTopology()
})
</script>

<style scoped>
.network-graph-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 217, 255, 0.1);
}

.graph-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  display: flex;
  gap: 16px;
  background: rgba(15, 23, 42, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 217, 255, 0.2);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 600;
  text-transform: uppercase;
}

.control-select,
.control-input {
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
}

.control-select:focus,
.control-input:focus {
  outline: none;
  border-color: #00d9ff;
}

.control-button {
  padding: 6px 12px;
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 4px;
  color: #00d9ff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: rgba(0, 217, 255, 0.2);
  border-color: #00d9ff;
}

.graph-legend {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  gap: 16px;
  background: rgba(15, 23, 42, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 217, 255, 0.2);
  flex-wrap: wrap;
  max-width: 400px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #00d9ff;
}

.legend-node.inside {
  background: #0099cc;
}

.legend-node.outside {
  background: #ff6b6b;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 217, 255, 0.2);
  border-top-color: #00d9ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.node-details-panel {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 100;
  width: 280px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 217, 255, 0.1);
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 16px;
}

.close-button:hover {
  color: #00d9ff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 217, 255, 0.1);
}

.panel-header h3 {
  font-size: 14px;
  color: #e2e8f0;
  margin: 0;
  font-weight: 600;
}

.node-type {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.node-type.inside {
  background: rgba(0, 153, 204, 0.2);
  color: #0099cc;
}

.node-type.outside {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #94a3b8;
}

.stat-value {
  color: #00d9ff;
  font-weight: 600;
}

.alert-count {
  color: #ff006e;
}

.alert-count.critical {
  font-weight: 700;
}

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-button {
  padding: 8px 12px;
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 4px;
  color: #00d9ff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: rgba(0, 217, 255, 0.2);
  border-color: #00d9ff;
}

.stats-panel {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 100;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-box {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #00d9ff;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .graph-controls {
    flex-direction: column;
    gap: 8px;
  }

  .graph-legend {
    display: none;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }
}
</style>
