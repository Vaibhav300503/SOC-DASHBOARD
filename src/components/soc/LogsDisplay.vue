<template>
  <div>
    <div class="flex justify-between items-center mb-5">
      <div class="flex gap-2">
        <select v-model="selectedSeverity" class="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/50 text-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select v-model="selectedLogType" class="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/50 text-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
          <option value="all">All Types</option>
          <option value="Firewall">Firewall</option>
          <option value="IDS">IDS</option>
          <option value="Authentication">Authentication</option>
          <option value="App">Application</option>
          <option value="System">System</option>
        </select>
      </div>
      <button @click="refreshLogs" class="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg text-sm border border-cyan-500/30 transition-all font-medium">
        <i class="fas fa-redo mr-1.5 text-xs"></i>
        Refresh
      </button>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-4 gap-3 mb-5">
      <div class="bg-slate-800/30 p-3 rounded-lg border border-slate-700/40">
        <div class="text-2xl font-bold text-slate-100">{{ totalLogs }}</div>
        <div class="text-xs text-slate-400 mt-1 font-medium">Total Logs</div>
      </div>
      <div class="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
        <div class="text-2xl font-bold text-red-400">{{ criticalLogs }}</div>
        <div class="text-xs text-red-400 mt-1 font-medium">Critical</div>
      </div>
      <div class="bg-orange-500/10 p-3 rounded-lg border border-orange-500/30">
        <div class="text-2xl font-bold text-orange-400">{{ highLogs }}</div>
        <div class="text-xs text-orange-400 mt-1 font-medium">High</div>
      </div>
      <div class="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
        <div class="text-2xl font-bold text-yellow-400">{{ mediumLogs }}</div>
        <div class="text-xs text-yellow-400 mt-1 font-medium">Medium</div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-slate-800/20 rounded-lg border border-slate-700/40 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-700/50 bg-slate-800/30">
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Timestamp</th>
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Severity</th>
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Type</th>
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Source IP</th>
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Destination</th>
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Action</th>
              <th class="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Location</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log._id" class="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors">
              <td class="py-3 px-4 text-slate-300 text-xs">
                {{ formatDate(log.timestamp) }}
              </td>
              <td class="py-3 px-4">
                <span :class="getSeverityClass(log.severity)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {{ log.severity }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-300 text-xs">
                {{ log.log_type }}
              </td>
              <td class="py-3 px-4 text-slate-300 font-mono text-xs">
                {{ log.source_ip }}
              </td>
              <td class="py-3 px-4 text-slate-300 text-xs">
                {{ log.dest_ip }}:{{ log.raw?.port }}
              </td>
              <td class="py-3 px-4 text-slate-300 text-xs">
                {{ log.raw?.action }}
              </td>
              <td class="py-3 px-4 text-slate-400 text-xs">
                {{ log.geo?.city }}, {{ log.geo?.country }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredLogs.length === 0" class="text-center py-12 text-slate-500">
        <i class="fas fa-inbox text-4xl mb-3 block text-slate-600"></i>
        <p class="text-sm">No logs found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAPIStore } from '../../stores/apiStore'

const apiStore = useAPIStore()
const selectedSeverity = ref('all')
const selectedLogType = ref('all')

const filteredLogs = computed(() => {
  let logs = apiStore.logs || []
  
  if (selectedSeverity.value !== 'all') {
    logs = logs.filter(log => log.severity === selectedSeverity.value)
  }
  
  if (selectedLogType.value !== 'all') {
    logs = logs.filter(log => log.log_type === selectedLogType.value)
  }
  
  return logs.slice(0, 10) // Show only 10 recent logs
})

const totalLogs = computed(() => apiStore.totalLogs || 0)
const criticalLogs = computed(() => apiStore.criticalLogs || 0)
const highLogs = computed(() => apiStore.highLogs || 0)
const mediumLogs = computed(() => apiStore.mediumLogs || 0)

const getSeverityClass = (severity) => {
  const classes = {
    'Critical': 'bg-red-900/50 text-red-300 border border-red-800/50',
    'High': 'bg-orange-900/50 text-orange-300 border border-orange-800/50',
    'Medium': 'bg-yellow-900/50 text-yellow-300 border border-yellow-800/50',
    'Low': 'bg-blue-900/50 text-blue-300 border border-blue-800/50'
  }
  return classes[severity] || 'bg-gray-900/50 text-gray-300 border border-gray-800/50'
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const refreshLogs = async () => {
  await apiStore.fetchRecentLogs(10)
  await apiStore.fetchDashboardStats()
}

onMounted(async () => {
  await refreshLogs()
})
</script>