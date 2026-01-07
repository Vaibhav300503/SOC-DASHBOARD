<template>
  <div class="card-glass p-7 h-full">
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-lg font-semibold text-[var(--text-primary-headings)]">{{ title }}</h3>
      <span class="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded-md border border-blue-500/20 uppercase tracking-wider">TOP ACTIVITIES</span>
    </div>
    <div class="bg-[var(--bg-card-secondary)] rounded-lg border border-[var(--border-card-default)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-[var(--border-card-default)] bg-[var(--bg-card-inner)]">
              <th class="w-1/2 text-left py-3 px-4 text-[var(--text-secondary)] font-medium uppercase tracking-wider">IP Address</th>
              <th class="w-1/4 text-right py-3 px-4 text-[var(--text-secondary)] font-medium uppercase tracking-wider">Events</th>
              <th class="w-1/4 text-right py-3 px-4 text-[var(--text-secondary)] font-medium uppercase tracking-wider">Severity</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in normalizedData" :key="idx" class="border-b border-[var(--border-card-default)] hover:bg-[var(--hover-overlay)] transition-colors">
              <td class="py-3 px-4">
                <code class="text-blue-400 font-mono text-xs">{{ row.ip }}</code>
              </td>
              <td class="text-right py-3 px-4 text-[var(--text-primary)] font-semibold">
                {{ row.count }}
              </td>
              <td class="text-right py-3 px-4">
                <span 
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                    row.severityClass === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                    row.severityClass === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                    row.severityClass === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  ]"
                >
                  {{ row.severityLabel }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="normalizedData.length === 0" class="text-center py-12 text-[var(--text-muted)]">
        <i class="fas fa-shield-alt text-4xl mb-3 block text-[var(--text-disabled)]"></i>
        <p class="text-sm">No IP data available</p>
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
    
    // Use real severity from aggregated data if available, otherwise default to Low
    let severityClass = 'low'
    let severityLabel = 'Low'
    
    if (item.severity) {
      // Use actual severity from log aggregation
      const severity = String(item.severity).toLowerCase()
      if (severity.includes('critical')) {
        severityClass = 'critical'
        severityLabel = 'Critical'
      } else if (severity.includes('high')) {
        severityClass = 'high'
        severityLabel = 'High'
      } else if (severity.includes('medium')) {
        severityClass = 'medium'
        severityLabel = 'Medium'
      } else {
        severityClass = 'low'
        severityLabel = 'Low'
      }
    }

    return { ip, count, severityClass, severityLabel }
  })
})
</script>
