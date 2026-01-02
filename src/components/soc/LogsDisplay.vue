<template>
  <div class="card-glass p-6 rounded-xl">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold text-slate-dark-50">Security Logs</h3>
      <div class="flex gap-2">
        <select v-model="selectedSeverity" class="bg-slate-dark-700 text-slate-dark-200 px-3 py-1 rounded-lg border border-slate-dark-600 text-sm">
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select v-model="selectedLogType" class="bg-slate-dark-700 text-slate-dark-200 px-3 py-1 rounded-lg border border-slate-dark-600 text-sm">
          <option value="all">All Types</option>
          <option value="Firewall">Firewall</option>
          <option value="IDS">IDS</option>
          <option value="Authentication">Authentication</option>
          <option value="App">Application</option>
          <option value="System">System</option>
        </select>
        <button @click="refreshLogs" class="bg-slate-dark-600 hover:bg-slate-dark-500 text-white px-3 py-1 rounded-lg text-sm">
          Refresh
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-slate-dark-800 p-3 rounded-lg">
        <div class="text-2xl font-bold text-slate-dark-50">{{ totalLogs }}</div>
        <div class="text-xs text-slate-dark-400">Total Logs</div>
      </div>
      <div class="bg-red-900/20 p-3 rounded-lg border border-red-800/30">
        <div class="text-2xl font-bold text-red-400">{{ criticalLogs }}</div>
        <div class="text-xs text-red-300">Critical</div>
      </div>
      <div class="bg-orange-900/20 p-3 rounded-lg border border-orange-800/30">
        <div class="text-2xl font-bold text-orange-400">{{ highLogs }}</div>
        <div class="text-xs text-orange-300">High</div>
      </div>
      <div class="bg-yellow-900/20 p-3 rounded-lg border border-yellow-800/30">
        <div class="text-2xl font-bold text-yellow-400">{{ mediumLogs }}</div>
        <div class="text-xs text-yellow-300">Medium</div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-dark-700">
            <th class="text-left py-3 px-4 text-slate-dark-300">Timestamp</th>
            <th class="text-left py-3 px-4 text-slate-dark-300">Severity</th>
            <th class="text-left py-3 px-4 text-slate-dark-300">Type</th>
            <th class="text-left py-3 px-4 text-slate-dark-300">Source IP</th>
            <th class="text-left py-3 px-4 text-slate-dark-300">Destination</th>
            <th class="text-left py-3 px-4 text-slate-dark-300">Action</th>
            <th class="text-left py-3 px-4 text-slate-dark-300">Location</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log._id" class="border-b border-slate-dark-800 hover:bg-slate-dark-800/50">
            <td class="py-3 px-4 text-slate-dark-200">
              {{ formatDate(log.timestamp) }}
            </td>
            <td class="py-3 px-4">
              <span :class="getSeverityClass(log.severity)" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ log.severity }}
              </span>
            </td>
            <td class="py-3 px-4 text-slate-dark-200">
              {{ log.log_type }}
            </td>
            <td class="py-3 px-4 text-slate-dark-200 font-mono text-xs">
              {{ log.source_ip }}
            </td>
            <td class="py-3 px-4 text-slate-dark-200">
              {{ log.dest_ip }}:{{ log.raw?.port }}
            </td>
            <td class="py-3 px-4 text-slate-dark-200">
              {{ log.raw?.action }}
            </td>
            <td class="py-3 px-4 text-slate-dark-200 text-xs">
              {{ log.geo?.city }}, {{ log.geo?.country }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="filteredLogs.length === 0" class="text-center py-8 text-slate-dark-400">
      No logs found
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
  
  return logs.slice(0, 50) // Limit to 50 for performance
})

const totalLogs = computed(() => apiStore.logs?.length || 0)
const criticalLogs = computed(() => apiStore.logs?.filter(log => log.severity === 'Critical').length || 0)
const highLogs = computed(() => apiStore.logs?.filter(log => log.severity === 'High').length || 0)
const mediumLogs = computed(() => apiStore.logs?.filter(log => log.severity === 'Medium').length || 0)

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
  await apiStore.fetchRecentLogs(100)
}

onMounted(async () => {
  await refreshLogs()
})
</script>