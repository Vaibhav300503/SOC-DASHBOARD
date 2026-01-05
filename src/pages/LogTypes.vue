<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Log Types Analysis</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Categorized security logs by type</p>
      </div>
    </div>

    <!-- Log Type Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="logType in logTypes"
        :key="logType"
        @click="selectedLogType = logType"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          selectedLogType === logType
            ? 'bg-cyber-600 text-white border border-cyber-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-cyber-500'
        ]"
      >
        {{ logType }}
      </button>
    </div>

    <!-- Severity Filter Buttons -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        @click="filterSeverity = ''"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          filterSeverity === ''
            ? 'bg-cyber-600 text-white border border-cyber-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-cyber-500'
        ]"
      >
        All Severities
      </button>
      <button
        @click="filterSeverity = 'Critical'"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          filterSeverity === 'Critical'
            ? 'bg-red-600 text-white border border-red-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-red-500'
        ]"
      >
        Critical
      </button>
      <button
        @click="filterSeverity = 'High'"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          filterSeverity === 'High'
            ? 'bg-orange-600 text-white border border-orange-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-orange-500'
        ]"
      >
        High
      </button>
      <button
        @click="filterSeverity = 'Medium'"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          filterSeverity === 'Medium'
            ? 'bg-yellow-600 text-white border border-yellow-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-yellow-500'
        ]"
      >
        Medium
      </button>
      <button
        @click="filterSeverity = 'Low'"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          filterSeverity === 'Low'
            ? 'bg-green-600 text-white border border-green-500'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-green-500'
        ]"
      >
        Low
      </button>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="stat-card card-accent-cyan">
        <div class="stat-value text-accent-primary">{{ totalFilteredCount }}</div>
        <div class="stat-label">{{ selectedLogType }} Logs</div>
      </div>
      <div class="stat-card card-accent-red">
        <div class="stat-value text-neon-red">{{ criticalCount }}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat-card card-accent-orange">
        <div class="stat-value text-neon-orange">{{ highCount }}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="stat-card card-accent-yellow">
        <div class="stat-value text-neon-yellow">{{ mediumCount }}</div>
        <div class="stat-label">Medium</div>
      </div>
      <div class="stat-card card-accent-green">
        <div class="stat-value text-neon-green">{{ lowCount }}</div>
        <div class="stat-label">Low</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card-glass p-4 rounded-xl">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Log Type</label>
          <select v-model="selectedLogType" class="input-cyber w-full">
            <option v-for="logType in logTypes" :key="logType" :value="logType">
              {{ logType }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Severity</label>
          <select v-model="filterSeverity" class="input-cyber w-full">
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Time Range</label>
          <select v-model="filterTimeRange" class="input-cyber w-full">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Source IP</label>
          <div class="relative">
            <input v-model="filterSourceIP" type="text" placeholder="Filter by IP..." class="input-cyber w-full pr-10">
            <button v-if="filterSourceIP" @click="filterSourceIP = ''" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="flex items-end">
          <button @click="handleLogTypesSearch" :disabled="isLoading" class="btn-cyber w-full">
            <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else class="fas fa-search mr-2"></i>
            {{ isLoading ? 'Searching...' : 'Apply Filters' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black title-gradient">
          {{ selectedLogType }} 
          {{ filterSeverity ? `${filterSeverity} ` : '' }}
          Logs
        </h3>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded">
            {{ filteredLogs.length }} TOTAL
          </span>
          <div v-if="isLoading" class="text-cyber-400 text-sm">
            <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
          </div>
          <button @click="exportLogs" class="btn-cyber-outline">
            <i class="fas fa-download mr-1"></i>Export
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table-cyber">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Computer</th>
              <th v-if="selectedLogType === 'Registry' || selectedLogType === 'All'">Registry Path</th>
              <th v-if="selectedLogType === 'Registry' || selectedLogType === 'All'">Key Name</th>
              <th v-if="selectedLogType !== 'Registry'">Source IP</th>
              <th v-if="selectedLogType !== 'Registry'">Destination IP</th>
              <th v-if="selectedLogType !== 'Registry'">Endpoint</th>
              <th>Log Type</th>
              <th>Severity</th>
              <th>Action</th>
              <th class="text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredLogs.length === 0">
              <td :colspan="selectedLogType === 'Registry' || selectedLogType === 'All' ? 9 : 10" class="text-center py-12">
                <div class="text-slate-500">
                  <i class="fas fa-inbox text-4xl mb-3 block opacity-50"></i>
                  <p class="text-sm">No logs available</p>
                  <p class="text-xs text-slate-600 mt-1">Data will be updated when available</p>
                </div>
              </td>
            </tr>
            <tr v-else v-for="log in filteredLogs.slice(0, displayLimit)" :key="log.id">
              <td class="text-slate-dark-400 text-sm">{{ formatTime(log.timestamp) }}</td>
              <td>
                <code class="text-cyber-400 font-mono text-sm">{{ log.computer || log.source_ip }}</code>
              </td>
              <td v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" class="text-slate-dark-300 text-sm font-mono">{{ log.registry_path || 'N/A' }}</td>
              <td v-if="selectedLogType === 'Registry' || selectedLogType === 'All'" class="text-slate-dark-300 text-sm font-mono">{{ log.key_name || 'N/A' }}</td>
              <td v-if="selectedLogType !== 'Registry'">
                <code class="text-cyber-400 font-mono text-sm">{{ log.source_ip }}</code>
              </td>
              <td v-if="selectedLogType !== 'Registry'">
                <code class="text-cyber-400 font-mono text-sm">{{ log.dest_ip }}</code>
              </td>
              <td v-if="selectedLogType !== 'Registry'" class="text-slate-dark-300">{{ log.endpoint }}</td>
              <td>
                <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-dark-700 text-slate-dark-300">
                  {{ getDisplayName(log.log_type) || 'Unknown' }}
                </span>
              </td>
              <td>
                <span :class="['badge-' + getSeverityClass(log.severity)]">
                  {{ getSeverityLabel(log.severity) }}
                </span>
              </td>
              <td>
                <span :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  selectedLogType === 'Registry' ? (
                    log.raw?.action === 'CREATE' ? 'bg-green-500/20 text-green-400' :
                    log.raw?.action === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                    log.raw?.action === 'MODIFY' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  ) : (
                    log.raw?.action === 'ALLOW' ? 'bg-neon-green/20 text-neon-green' :
                    'bg-neon-red/20 text-neon-red'
                  )
                ]">
                  {{ log.raw?.action || 'N/A' }}
                </span>
              </td>
              <td class="text-center">
                <button 
                  @click="showLogDetails(log)"
                  class="inline-flex items-center justify-center w-8 h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200"
                  title="View Details"
                >
                  <i class="fas fa-eye text-sm"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-slate-dark-400">
          Showing {{ Math.min(displayLimit, filteredLogs.length) }} of {{ filteredLogs.length }} logs
        </div>
        <button 
          v-if="displayLimit < filteredLogs.length"
          @click="displayLimit += 20"
          class="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 text-sm font-medium group relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <i class="fas fa-chevron-down mr-2"></i>
          <span class="relative">Load More</span>
        </button>
      </div>
    </div>

    <!-- Log Details Modal -->
    <div 
      v-if="selectedLog"
      class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeLogDetails"
    >
      <div class="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30 rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-xl group relative">
        <!-- Animated gradient background on hover -->
        <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/5 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>

        <!-- Top accent line -->
        <div class="h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 group-hover:via-cyan-500/50 transition-all duration-300 rounded-t-2xl"></div>

        <!-- Modal Header - Sticky -->
        <div class="sticky top-0 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-6 z-20 shadow-lg">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <h3 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Log Details</h3>
              <p class="text-xs text-slate-400 mt-1">{{ selectedLog.log_type }} • {{ formatFullTime(selectedLog.timestamp) }}</p>
            </div>
            <button 
              @click="closeLogDetails"
              class="text-slate-400 hover:text-cyan-400 transition-colors p-2 hover:bg-cyan-500/10 rounded-lg"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6 relative z-10">
          <!-- Quick Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-2 font-medium">Severity</div>
                <div :class="['badge-' + (selectedLog.severity || 'low').toLowerCase()]">
                  {{ selectedLog.severity || 'Low' }}
                </div>
              </div>
            </div>
            <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-2 font-medium">Action</div>
                <div class="text-lg font-semibold" :class="(selectedLog.raw?.action || selectedLog.raw_data?.action) === 'ALLOW' ? 'text-emerald-400' : 'text-red-400'">
                  {{ selectedLog.raw?.action || selectedLog.raw_data?.action || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-2 font-medium">Timestamp</div>
                <div class="text-sm text-slate-300">{{ formatFullTime(selectedLog.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- Registry Information -->
          <div v-if="selectedLog.log_type === 'Registry'" class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <h4 class="text-sm font-semibold text-slate-50 mb-4 flex items-center relative z-10">
              <i class="fas fa-database mr-2 text-cyan-400"></i>
              Registry Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Computer</div>
                <div class="text-slate-300">{{ selectedLog.computer || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">User</div>
                <div class="text-slate-300">{{ selectedLog.user || 'Unknown' }}</div>
              </div>
              <div class="md:col-span-2">
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Registry Path</div>
                <div class="text-cyan-400 font-mono bg-slate-900/50 px-3 py-2 rounded-lg text-sm break-all border border-slate-700/30">
                  {{ selectedLog.registry_path || 'N/A' }}
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Key Name</div>
                <div class="text-slate-300 font-mono text-sm">{{ selectedLog.key_name || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Value Type</div>
                <div class="text-slate-300">{{ selectedLog.value_type || 'N/A' }}</div>
              </div>
              <div v-if="selectedLog.old_value">
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Previous Value</div>
                <div class="text-slate-300 font-mono text-sm">{{ selectedLog.old_value }}</div>
              </div>
              <div v-if="selectedLog.new_value">
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">New Value</div>
                <div class="text-slate-300 font-mono text-sm">{{ selectedLog.new_value }}</div>
              </div>
            </div>
          </div>

          <!-- Network Information (for non-Registry logs) -->
          <div v-if="selectedLog.log_type !== 'Registry'" class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <h4 class="text-sm font-semibold text-slate-50 mb-4 flex items-center relative z-10">
              <i class="fas fa-network-wired mr-2 text-cyan-400"></i>
              Network Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Source IP</div>
                <div class="flex items-center gap-2">
                  <code class="text-cyan-400 font-mono bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/30">
                    {{ selectedLog.source_ip }}
                  </code>
                  <button 
                    @click="lookupIP(selectedLog.source_ip)"
                    class="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 rounded-lg transition-all text-sm"
                    title="Lookup IP"
                  >
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Destination IP</div>
                <div class="flex items-center gap-2">
                  <code class="text-cyan-400 font-mono bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/30">
                    {{ selectedLog.dest_ip }}
                  </code>
                  <button 
                    @click="lookupIP(selectedLog.dest_ip)"
                    class="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 rounded-lg transition-all text-sm"
                    title="Lookup IP"
                  >
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Endpoint</div>
                <div class="text-slate-300">{{ selectedLog.endpoint || selectedLog.metadata?.endpoint_name || 'N/A' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Protocol</div>
                <div class="text-slate-300">{{ selectedLog.raw?.protocol || selectedLog.raw_data?.protocol || selectedLog.protocol || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <!-- Geo Location (if available) -->
          <div v-if="selectedLog.geo" class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <h4 class="text-sm font-semibold text-slate-50 mb-4 flex items-center relative z-10">
              <i class="fas fa-globe mr-2 text-cyan-400"></i>
              Geographic Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Country</div>
                <div class="text-slate-300">{{ selectedLog.geo?.country || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">City</div>
                <div class="text-slate-300">{{ selectedLog.geo?.city || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 uppercase tracking-wide mb-1 font-medium">Organization</div>
                <div class="text-slate-300">{{ selectedLog.geo?.org || 'Unknown' }}</div>
              </div>
            </div>
          </div>

          <!-- Raw Log Data -->
          <div class="rounded-xl border border-slate-700/30 backdrop-blur-sm p-5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group/card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <h4 class="text-sm font-semibold text-slate-50 flex items-center">
                <i class="fas fa-code mr-2 text-cyan-400"></i>
                Raw Log Data
              </h4>
              <button 
                @click="copyRawLog"
                class="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg text-sm transition-all font-medium"
                title="Copy to clipboard"
              >
                <i class="fas fa-copy mr-1"></i>Copy
              </button>
            </div>
            <pre class="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-xs text-slate-300 font-mono border border-slate-700/30 relative z-10">{{ JSON.stringify(selectedLog.raw || selectedLog.raw_data || selectedLog, null, 2) }}</pre>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-slate-700/30 relative z-10">
            <button 
              @click="blockIP(selectedLog.source_ip)"
              :disabled="isLoading"
              class="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 text-red-400 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 text-sm font-medium group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-ban mr-2"></i>
              <span class="relative">{{ isLoading ? 'Blocking...' : 'Block Source IP' }}</span>
            </button>
            <button 
              @click="createAlert(selectedLog)"
              :disabled="isLoading"
              class="px-4 py-2.5 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 text-sm font-medium group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-exclamation-triangle mr-2"></i>
              <span class="relative">{{ isLoading ? 'Creating...' : 'Create Alert' }}</span>
            </button>
            <button 
              @click="exportLog(selectedLog)"
              class="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 text-sm font-medium group relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <i class="fas fa-download mr-2"></i>
              <span class="relative">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Type Distribution Chart -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-black title-gradient">Distribution by Severity</h3>
        <span class="px-2 py-0.5 bg-accent-secondary/10 text-accent-secondary text-[10px] font-bold rounded">
          {{ severityDistribution.reduce((sum, item) => sum + item.value, 0) }} TOTAL
        </span>
      </div>
      <div v-if="severityDistribution.length === 0 || severityDistribution.every(item => item.value === 0)" class="text-center py-8 text-slate-500">
        <i class="fas fa-chart-bar text-3xl mb-3 block opacity-50"></i>
        <p class="text-sm">No severity data available</p>
        <p class="text-xs text-slate-600 mt-1">Data will be updated when available</p>
      </div>
      <div v-else class="space-y-4">
        <div v-for="item in severityDistribution" :key="item.name" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-dark-300">{{ item.name }}</span>
            <span class="text-sm font-bold text-slate-dark-50">{{ item.value }}</span>
          </div>
          <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{
                width: `${item.value > 0 ? Math.max((item.value / Math.max(...severityDistribution.map(s => s.value))) * 100, 2) : 0}%`,
                backgroundColor: item.color,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="[
          'p-4 rounded-lg shadow-lg transform transition-all duration-300 max-w-sm',
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i :class="[
              'mr-2',
              toast.type === 'success' ? 'fas fa-check-circle' :
              toast.type === 'error' ? 'fas fa-exclamation-circle' :
              'fas fa-info-circle'
            ]"></i>
            <span>{{ toast.message }}</span>
          </div>
          <button 
            @click="removeToast(toast.id)"
            class="ml-4 hover:opacity-75"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLogStore } from '../stores/logStore'
import { useAPIStore } from '../stores/apiStore'
import { useToast } from '../composables/useToast'
import { normalizeSeverity, getSeverityClass, getSeverityLabel } from '../utils/severityNormalization'
import { STANDARD_LOG_TYPES, getDisplayName } from '../utils/logTypeConstants'
import { logsAPI } from '../api/logs'
import axios from 'axios'

const logStore = useLogStore()
const apiStore = useAPIStore()
const { addToast, toasts, removeToast } = useToast()
const logTypes = ref(['All', ...STANDARD_LOG_TYPES.map(type => getDisplayName(type))])
const selectedLogType = ref('All')
const filterSeverity = ref('')
const filterTimeRange = ref('24h')
const filterAction = ref('')
const filterSourceIP = ref('')
const selectedLog = ref(null)
const isLoading = ref(false)
const displayLimit = ref(20)

onMounted(async () => {
  console.log('LogTypes component mounted')
  
  // Fetch logs from backend
  await apiStore.fetchRecentLogs()
  console.log('Logs fetched:', {
    totalLogs: (apiStore.logs || []).length,
    sampleLogTypes: (apiStore.logs || []).slice(0, 5).map(l => l.log_type)
  })
  
  // Fetch dashboard stats
  await apiStore.fetchDashboardStats()
  
  console.log('Using standardized log types:', logTypes.value)
})

// Watch for filter changes and apply them
watch([selectedLogType, filterSeverity, filterTimeRange, filterAction, filterSourceIP], (newValues, oldValues) => {
  console.log('Filter changed:', { 
    selectedLogType: newValues[0], 
    filterSeverity: newValues[1], 
    filterTimeRange: newValues[2], 
    filterAction: newValues[3], 
    filterSourceIP: newValues[4] 
  })
  
  // Log sample of available logs for debugging
  const sampleLogs = (apiStore.logs || []).slice(0, 3)
  console.log('Sample logs for debugging:', sampleLogs.map(log => ({
    log_type: log.log_type,
    severity: log.severity,
    source_ip: log.source_ip,
    timestamp: log.timestamp
  })))
  
  // Reset display limit when filters change
  displayLimit.value = 20
})

const logsOfSelectedType = computed(() => {
  let logs = []
  
  if (selectedLogType.value === 'All') {
    // Use the fetched logs from apiStore
    logs = apiStore.logs || []
  } else {
    // Convert display name back to internal log type for filtering
    const internalLogType = STANDARD_LOG_TYPES.find(type => getDisplayName(type) === selectedLogType.value) || selectedLogType.value
    
    // Filter logs by exact log type match
    logs = (apiStore.logs || []).filter(log => {
      const logType = log.log_type || 'system'
      return logType === internalLogType
    })
  }
  
  console.log('Logs of selected type:', { 
    selectedType: selectedLogType.value, 
    totalLogs: (apiStore.logs || []).length,
    filteredLogs: logs.length,
    sampleLogTypes: logs.slice(0, 5).map(l => l.log_type),
    uniqueLogTypes: [...new Set((apiStore.logs || []).map(l => l.log_type))]
  })
  
  return logs
})

const filteredLogs = computed(() => {
  let logs = logsOfSelectedType.value
  console.log('Filtering logs:', { 
    totalLogs: logs.length, 
    filterSeverity: filterSeverity.value,
    selectedLogType: selectedLogType.value 
  })
  
  // Apply severity filter
  if (filterSeverity.value) {
    logs = logs.filter(log => {
      const normalizedSeverity = normalizeSeverity(log.severity)
      return normalizedSeverity === filterSeverity.value
    })
    console.log('After severity filter:', logs.length)
  }
  
  // Apply action filter
  if (filterAction.value) {
    logs = logs.filter(log => {
      const action = log.raw?.action || log.raw_data?.action || log.action
      return action === filterAction.value
    })
  }
  
  // Apply source IP filter
  if (filterSourceIP.value) {
    logs = logs.filter(log => {
      const sourceIP = log.source_ip || log.ip_address
      return sourceIP && sourceIP.toLowerCase().includes(filterSourceIP.value.toLowerCase())
    })
  }
  
  return logs
})

const criticalCount = computed(() => {
  // Count critical logs from currently filtered logs (by log type)
  return logsOfSelectedType.value.filter(log => {
    const normalizedSeverity = normalizeSeverity(log.severity)
    return normalizedSeverity === 'Critical'
  }).length
})

const highCount = computed(() => {
  // Count high logs from currently filtered logs (by log type)
  return logsOfSelectedType.value.filter(log => {
    const normalizedSeverity = normalizeSeverity(log.severity)
    return normalizedSeverity === 'High'
  }).length
})

const mediumCount = computed(() => {
  // Count medium logs from currently filtered logs (by log type)
  return logsOfSelectedType.value.filter(log => {
    const normalizedSeverity = normalizeSeverity(log.severity)
    return normalizedSeverity === 'Medium'
  }).length
})

const lowCount = computed(() => {
  // Count low logs from currently filtered logs (by log type)
  return logsOfSelectedType.value.filter(log => {
    const normalizedSeverity = normalizeSeverity(log.severity)
    return normalizedSeverity === 'Low'
  }).length
})

const totalFilteredCount = computed(() => {
  // Total count of logs for selected log type
  return logsOfSelectedType.value.length
})

const severityDistribution = computed(() => [
  { name: 'Critical', value: criticalCount.value, color: '#ff0055' },
  { name: 'High', value: highCount.value, color: '#ff6b35' },
  { name: 'Medium', value: mediumCount.value, color: '#ffd700' },
  { name: 'Low', value: lowCount.value, color: '#00ff88' },
])

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const formatFullTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Log details modal functions
const showLogDetails = (log) => {
  selectedLog.value = log
}

const closeLogDetails = () => {
  selectedLog.value = null
}

const handleLogTypesSearch = async () => {
  isLoading.value = true
  try {
    // Convert display name back to internal log type if needed
    let internalLogType = null
    if (selectedLogType.value !== 'All') {
      internalLogType = STANDARD_LOG_TYPES.find(type => getDisplayName(type) === selectedLogType.value) || selectedLogType.value
    }
    
    // Use the logsAPI to fetch filtered logs
    const response = await logsAPI.getRecent(1000, filterSeverity.value, internalLogType)
    
    if (response && response.data) {
      // Update the apiStore with filtered results
      apiStore.logs = response.data
      console.log('Filtered logs fetched:', {
        total: response.total,
        returned: response.data.length,
        filters: {
          logType: selectedLogType.value,
          severity: filterSeverity.value,
          timeRange: filterTimeRange.value
        }
      })
      
      addToast({
        type: 'success',
        message: `Found ${response.data.length} logs matching your filters`
      })
    }
  } catch (error) {
    console.error('Error fetching filtered logs:', error)
    addToast({
      type: 'error',
      message: 'Failed to fetch logs. Please try again.'
    })
  } finally {
    isLoading.value = false
  }
}

const copyRawLog = async () => {
  if (selectedLog.value) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedLog.value.raw, null, 2))
      addToast('Log copied to clipboard', 'success')
    } catch (err) {
      console.error('Failed to copy log:', err)
      addToast('Failed to copy log', 'error')
    }
  }
}

const lookupIP = async (ip) => {
  try {
    // Try to get IP details from the backend
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/lookup/whois/${ip}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('IP lookup result:', data)
      // You could show this data in a modal or new tab
      const info = `
IP: ${ip}
Country: ${data.country || 'Unknown'}
City: ${data.city || 'Unknown'}
ISP: ${data.org || data.isp || 'Unknown'}
ASN: ${data.asn || 'Unknown'}
      `.trim()
      alert(info)
    } else {
      // Fallback to external service
      window.open(`https://www.virustotal.com/gui/ip-address/${ip}`, '_blank')
    }
  } catch (error) {
    console.error('IP lookup failed:', error)
    // Fallback to external service
    window.open(`https://www.virustotal.com/gui/ip-address/${ip}`, '_blank')
  }
}

const blockIP = async (ip) => {
  if (confirm(`Are you sure you want to block IP ${ip}?`)) {
    isLoading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/ip/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          ip, 
          reason: 'Blocked from log details',
          duration: null 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addToast(`IP ${ip} has been blocked successfully`, 'success')
      } else {
        addToast(`Failed to block IP: ${result.error || result.message}`, 'error')
      }
    } catch (error) {
      console.error('Failed to block IP:', error)
      addToast('Failed to block IP - please check your connection', 'error')
    } finally {
      isLoading.value = false
    }
  }
}

const createAlert = async (log) => {
  if (!log) {
    addToast('Cannot create alert: No log selected', 'error')
    return
  }
  
  const title = `Security Alert: ${log.severity} ${log.log_type} Event`
  const action = log.raw?.action || log.log_type || 'Unknown'
  const description = `${action} event detected from ${log.source_ip} to ${log.dest_ip}${log.endpoint ? ` at ${log.endpoint}` : ''}`
  
  isLoading.value = true
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'}/alerts/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title,
        description,
        severity: log.severity,
        source_ip: log.source_ip,
        dest_ip: log.dest_ip,
        log_id: log.id
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      addToast(`Alert created successfully: ${title}`, 'success')
    } else {
      addToast(`Failed to create alert: ${result.error || result.message}`, 'error')
    }
  } catch (error) {
    console.error('Failed to create alert:', error)
    addToast('Failed to create alert - please check your connection', 'error')
  } finally {
    isLoading.value = false
  }
}

const exportLog = (log) => {
  // Export single log
  const dataStr = JSON.stringify(log, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `log-${log.id}-${new Date().toISOString()}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const exportLogs = async () => {
  try {
    // Get real data from backend API - FIXED: Use correct port 3002
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    
    // Build query parameters based on current filters
    const params = {
      format: 'csv',
      timeRange: filterTimeRange.value || '24h',
      limit: 10000
    }
    
    if (filterSeverity.value) {
      params.severity = filterSeverity.value
    }
    
    if (selectedLogType.value) {
      params.log_type = selectedLogType.value
    }
    
    // Fetch filtered logs from backend
    const response = await axios.get(`${API_BASE}/export/logs`, { params })
    
    if (response.data) {
      // Create blob from backend response
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', url)
      linkElement.setAttribute('download', `${selectedLogType.value}-logs-${new Date().toISOString().split('T')[0]}.csv`)
      linkElement.click()
      URL.revokeObjectURL(url)
      
      // Show success message
      if (window.addToast) {
        window.addToast(`Exported ${selectedLogType.value} logs successfully`, 'success')
      }
    }
  } catch (error) {
    console.error('Export failed:', error)
    
    // Fallback to client-side export if backend fails
    const logsToExport = filteredLogs.value.map(log => {
      if (log.log_type === 'Registry') {
        return {
          id: log.id,
          timestamp: log.timestamp,
          log_type: log.log_type,
          severity: log.severity,
          computer: log.computer,
          user: log.user,
          registry_path: log.registry_path,
          key_name: log.key_name,
          value_type: log.value_type,
          old_value: log.old_value,
          new_value: log.new_value,
          action: log.raw?.action
        }
      } else {
        return {
          id: log.id,
          timestamp: log.timestamp,
          log_type: log.log_type,
          severity: log.severity,
          source_ip: log.source_ip,
          dest_ip: log.dest_ip,
          endpoint: log.endpoint,
          action: log.raw?.action,
          protocol: log.raw?.protocol,
          description: log.raw?.description,
          geo: log.geo
        }
      }
    })
    
    // Create CSV format with dynamic headers
    let headers, csvContent
    
    if (selectedLogType.value === 'Registry') {
      headers = ['ID', 'Timestamp', 'Log Type', 'Severity', 'Computer', 'User', 'Registry Path', 'Key Name', 'Value Type', 'Previous Value', 'New Value', 'Action']
      csvContent = [
        headers.join(','),
        ...logsToExport.map(log => [
          log.id,
          log.timestamp,
          log.log_type,
          log.severity,
          log.computer || '',
          log.user || '',
          log.registry_path || '',
          log.key_name || '',
          log.value_type || '',
          log.old_value || '',
          log.new_value || '',
          log.action || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
    } else {
      headers = ['ID', 'Timestamp', 'Log Type', 'Severity', 'Source IP', 'Destination IP', 'Endpoint', 'Action', 'Protocol', 'Description', 'Country', 'City']
      csvContent = [
        headers.join(','),
        ...logsToExport.map(log => [
          log.id,
          log.timestamp,
          log.log_type,
          log.severity,
          log.source_ip,
          log.dest_ip,
          log.endpoint || '',
          log.action || '',
          log.protocol || '',
          log.description || '',
          log.geo?.country || '',
          log.geo?.city || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
    }
    
    // Download CSV
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent)
    const exportFileDefaultName = `${selectedLogType.value}-logs-${new Date().toISOString().split('T')[0]}.csv`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    // Show success message
    if (window.addToast) {
      window.addToast(`Exported ${logsToExport.length} logs to ${exportFileDefaultName}`, 'success')
    }
  }
}
</script>
