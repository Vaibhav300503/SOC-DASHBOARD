<template>
  <div class="card-glass p-6 rounded-xl h-full border-t border-t-accent-primary/10">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-black title-gradient">{{ title }}</h3>
      <span class="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded">TOP ACTIVITES</span>
    </div>
    <div class="overflow-x-auto">
      <table class="table-cyber text-xs">
        <thead>
          <tr>
            <th class="w-1/2">IP Address</th>
            <th class="w-1/4 text-right">Events</th>
            <th class="w-1/4 text-right">Severity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in normalizedData" :key="idx" :class="['ip-row', 'severity-' + row.severityClass]">
            <td>
              <code class="text-cyber-400 font-mono text-xs">{{ row.ip }}</code>
            </td>
            <td class="text-right text-slate-dark-300">
              {{ row.count }}
            </td>
            <td class="text-right">
              <span :class="['severity-pill', 'severity-' + row.severityClass]">
                {{ row.severityLabel }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="normalizedData.length === 0" class="empty-table-state">
  <i class='fas fa-shield-alt muted-icon'></i>
        No IP data available
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'IP Analysis'
  },
  data: {
    type: Array,
    default: () => []
  }
})

const normalizedData = computed(() => {
  return (props.data || []).map(item => {
    const ip = item.ip || item._id || 'Unknown'
    const count = item.count || item.value || 0

    let severityClass = 'low'
    let severityLabel = 'Low'
    if (count > 100) {
      severityClass = 'critical'
      severityLabel = 'Critical'
    } else if (count > 50) {
      severityClass = 'high'
      severityLabel = 'High'
    } else if (count > 20) {
      severityClass = 'medium'
      severityLabel = 'Medium'
    }

    return { ip, count, severityClass, severityLabel }
  })
})
</script>
