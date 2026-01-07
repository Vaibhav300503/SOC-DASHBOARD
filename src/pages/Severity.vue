<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black title-gradient tracking-tight">Severity-Based Logs</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Organize and analyze logs by severity level</p>
      </div>
    </div>

    <!-- Severity Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <button
        v-for="severity in severities"
        :key="severity.name"
        @click="selectedSeverity = severity.name"
        :class="[
          'stat-card cursor-pointer transition-all duration-300 hover:scale-[1.02] text-center-left',
          severity.name === 'Critical' ? 'card-accent-red' : 
          severity.name === 'High' ? 'card-accent-orange' :
          severity.name === 'Medium' ? 'card-accent-purple' : 'card-accent-green',
          selectedSeverity === severity.name ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-primary' : ''
        ]"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value" :style="{ color: severity.color }">{{ severity.count }}</div>
            <div class="stat-label">{{ severity.name }}</div>
          </div>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5">
            <i :class="severity.icon" :style="{ color: severity.color }"></i>
          </div>
        </div>
      </button>
    </div>

    <!-- Severity Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="severity in severities"
        :key="severity.name"
        @click="selectedSeverity = severity.name"
        :class="[
          'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
          selectedSeverity === severity.name
            ? 'text-white border'
            : 'bg-slate-dark-800 text-slate-dark-300 border border-slate-dark-700 hover:border-cyber-500'
        ]"
        :style="selectedSeverity === severity.name ? {
          backgroundColor: severity.color + '20',
          borderColor: severity.color,
          color: severity.color
        } : {}"
      >
        {{ severity.name }}
      </button>
    </div>

    <!-- Filters -->
    <div class="card-glass p-4 rounded-xl">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Log Type</label>
          <select v-model="filterLogType" class="input-cyber w-full">
            <option value="">All Types</option>
            <option value="Firewall">Firewall</option>
            <option value="IDS">IDS</option>
            <option value="Authentication">Authentication</option>
            <option value="App">App</option>
            <option value="System">System</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Time Range</label>
          <select v-model="filterTimeRange" class="input-cyber w-full">
            <option value="all">All Time</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-dark-300 mb-2">Source IP</label>
          <div class="relative">
            <input v-model="filterSourceIP" type="text" placeholder="Filter by IP..." class="input-cyber w-full pr-10" />
            <button 
              v-if="filterSourceIP" 
              @click="filterSourceIP = ''" 
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-dark-400 hover:text-slate-dark-300"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="flex items-end">
          <button @click="fetchSeverityLogs(selectedSeverity, true)" class="btn-cyber w-full">
            <i class="fas fa-search mr-2"></i>Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Dropdown Menu Portal (rendered at body level to avoid overflow issues) -->
    <Teleport to="body">
      <Transition
        name="glassmorphic-popup"
        @enter="onPopupEnter"
        @leave="onPopupLeave"
      >
        <div v-if="activeMenuId !== null" key="popup-container" class="fixed inset-0 pointer-events-none" style="z-index: 99998;">
          <!-- Backdrop with blur effect -->
          <div 
            class="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            @click="closeDropdown"
          ></div>
          
          <!-- Glassmorphic Dropdown Menu -->
          <div 
            ref="dropdownRef"
            class="absolute min-w-56 overflow-hidden rounded-2xl shadow-2xl pointer-events-auto"
            :style="dropdownStyle"
            @click.stop
          >
            <!-- Glassmorphic background with multiple layers -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20"></div>
            <div class="absolute inset-0 bg-gradient-to-b from-slate-dark-700/40 to-slate-dark-800/60 rounded-2xl"></div>
            
            <!-- Content with relative positioning -->
            <div class="relative divide-y divide-white/10">
              <button 
                @click="executeAction('block')" 
                class="w-full text-left px-5 py-4 text-sm hover:bg-white/10 flex items-center gap-3 transition-all duration-200 text-slate-dark-100 group rounded-t-xl"
              >
                <i class="fas fa-ban text-red-400 w-4 group-hover:scale-110 transition-transform duration-200"></i>
                <span class="group-hover:translate-x-0.5 transition-transform duration-200">Block IP</span>
              </button>
              <button 
                @click="executeAction('alert')" 
                class="w-full text-left px-5 py-4 text-sm hover:bg-white/10 flex items-center gap-3 transition-all duration-200 text-slate-dark-100 group"
              >
                <i class="fas fa-exclamation-triangle text-orange-400 w-4 group-hover:scale-110 transition-transform duration-200"></i>
                <span class="group-hover:translate-x-0.5 transition-transform duration-200">Create Alert</span>
              </button>
              <button 
                @click="executeAction('investigate')" 
                class="w-full text-left px-5 py-4 text-sm hover:bg-white/10 flex items-center gap-3 transition-all duration-200 text-slate-dark-100 group"
              >
                <i class="fas fa-search text-yellow-400 w-4 group-hover:scale-110 transition-transform duration-200"></i>
                <span class="group-hover:translate-x-0.5 transition-transform duration-200">Investigate</span>
              </button>
              <button 
                @click="executeAction('export')" 
                class="w-full text-left px-5 py-4 text-sm hover:bg-white/10 flex items-center gap-3 transition-all duration-200 text-slate-dark-100 group"
              >
                <i class="fas fa-download text-blue-400 w-4 group-hover:scale-110 transition-transform duration-200"></i>
                <span class="group-hover:translate-x-0.5 transition-transform duration-200">Export Log</span>
              </button>
              <button 
                @click="executeAction('details')" 
                class="w-full text-left px-5 py-4 text-sm hover:bg-white/10 flex items-center gap-3 transition-all duration-200 text-slate-dark-100 group rounded-b-xl"
              >
                <i class="fas fa-info-circle text-cyan-400 w-4 group-hover:scale-110 transition-transform duration-200"></i>
                <span class="group-hover:translate-x-0.5 transition-transform duration-200">View Details</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Logs Table -->
      <div class="lg:col-span-2">
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black title-gradient">{{ selectedSeverity }} Severity Logs</h3>
            <span class="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded">{{ displayLogs.length }} TOTAL</span>
          </div>

          <div class="overflow-x-auto overflow-y-visible">
            <table class="table-cyber w-full">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>Destination</th>
                  <th>Log Type</th>
                  <th class="w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="displayLogs.length === 0">
                  <td colspan="5" class="text-center py-12">
                    <div class="text-slate-500">
                      <i class="fas fa-inbox text-4xl mb-3 block opacity-50"></i>
                      <p class="text-sm">Data will be updated soon</p>
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="log in displayLogs" :key="log.id">
                  <td class="text-slate-dark-400 text-sm">{{ formatTime(log.timestamp) }}</td>
                  <td>
                    <code class="text-cyber-400 font-mono text-sm">{{ log.source_ip }}</code>
                  </td>
                  <td class="text-slate-dark-300">{{ log.endpoint }}</td>
                  <td>
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-dark-900/50 text-slate-dark-300">
                      {{ log.log_type }}
                    </span>
                  </td>
                  <td class="relative">
                    <button 
                      @click.stop="openDropdown($event, log)"
                      class="text-cyber-400 hover:text-cyber-300 p-2 rounded transition-colors"
                      :class="{ 'text-cyber-300 bg-slate-dark-700': activeMenuId === log.id }"
                    >
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-slate-dark-400">
              Showing {{ displayLogs.length }} logs
            </div>
            <button 
              v-if="hasMore"
              @click="loadMore"
              :disabled="isLoading"
              class="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 text-sm font-medium group relative overflow-hidden disabled:opacity-50"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <i class="fas fa-chevron-down mr-2"></i>
              <span class="relative">{{ isLoading ? 'Loading...' : 'Load More' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Statistics -->
      <div class="space-y-6">
        <!-- Pie Chart Alternative -->
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-secondary/10">
          <h3 class="text-lg font-black title-gradient mb-6">Distribution</h3>
          <div class="space-y-4">
            <div v-for="item in severityDistribution" :key="item.name" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-dark-300">{{ item.name }}</span>
                <span class="text-sm font-bold text-slate-dark-50">{{ item.value }}</span>
              </div>
              <div class="w-full bg-slate-dark-900/50 rounded-full h-2 overflow-hidden border border-slate-dark-700/50">
                <div
                  class="h-full rounded-full"
                  :style="{
                    width: `${(item.value / totalLogs) * 100}%`,
                    backgroundColor: item.color,
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Top IPs for this severity -->
        <div class="card-glass p-6 rounded-xl border-t border-t-accent-cyan/10">
          <h3 class="text-lg font-black title-gradient mb-6">Top Source IPs</h3>
          <div class="space-y-3">
            <div v-if="topIPsForSeverity.length === 0" class="text-center py-8 text-slate-500">
              <i class="fas fa-network-wired text-3xl mb-3 block opacity-50"></i>
              <p class="text-sm">Data will be updated soon</p>
            </div>
            <div v-else v-for="(ip, idx) in topIPsForSeverity.slice(0, 5)" :key="idx" class="bg-slate-dark-900/50 rounded-lg p-3 border border-slate-dark-700/50">
              <div class="flex items-center justify-between">
                <code class="text-cyber-400 font-mono text-sm">{{ ip.ip }}</code>
                <span class="font-bold text-slate-dark-50">{{ ip.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed View -->
    <div class="card-glass p-6 rounded-xl border-t border-t-accent-primary/10">
      <h3 class="text-lg font-black title-gradient mb-6">Detailed Events</h3>
      <div class="space-y-4">
        <div v-if="displayLogs.length === 0" class="text-center py-12 text-slate-500">
          <i class="fas fa-list-alt text-4xl mb-3 block opacity-50"></i>
          <p class="text-sm">Data will be updated soon</p>
        </div>
        <div v-else v-for="log in displayLogs.slice(0, 5)" :key="log.id" class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-sm font-semibold text-slate-dark-50">{{ log.log_type }} - {{ log.endpoint }}</p>
              <p class="text-xs text-slate-dark-400 mt-1">
                <i class="fas fa-map-pin mr-1"></i>
                {{ log.source_ip }} → {{ log.dest_ip }}
              </p>
            </div>
            <span :class="['badge-' + log.severity.toLowerCase()]">
              {{ log.severity }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4 text-xs text-slate-dark-400 pt-3 border-t border-slate-dark-700/50">
            <div>
              <span class="text-slate-dark-500">Protocol:</span>
              <span class="text-slate-dark-300 ml-2">{{ log.raw?.protocol || log.protocol || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-slate-dark-500">Port:</span>
              <span class="text-slate-dark-300 ml-2">{{ log.raw?.port || log.port || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-slate-dark-500">Action:</span>
              <span :class="(log.raw?.action || log.action) === 'ALLOW' ? 'text-neon-green' : 'text-neon-red'" class="ml-2">
                {{ log.raw?.action || log.action || 'N/A' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Details Modal -->
    <Teleport to="body">
      <Transition
        name="modal-glassmorphic"
        @enter="onModalEnter"
        @leave="onModalLeave"
      >
        <div v-if="showLogModal" class="fixed inset-0 flex items-center justify-center z-[99999] p-4">
          <!-- Backdrop with enhanced blur -->
          <div 
            class="absolute inset-0 bg-black/40 backdrop-blur-md"
            @click="closeLogModal"
          ></div>
          
          <!-- Glassmorphic Modal Container -->
          <div class="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl transform transition-all duration-300 ease-out">
            <!-- Multiple glassmorphic layers for depth -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl"></div>
            <div class="absolute inset-0 bg-gradient-to-b from-slate-dark-700/60 to-slate-dark-800/80 rounded-2xl"></div>
            <div class="absolute inset-0 border border-white/20 rounded-2xl"></div>
            
            <!-- Content with relative positioning and scrolling -->
            <div class="relative bg-slate-dark-800/20 backdrop-blur-sm rounded-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <!-- Modal Header -->
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 class="text-xl font-bold text-slate-dark-50 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-cyber-400/20 flex items-center justify-center">
                    <i class="fas fa-info-circle text-cyber-400 text-sm"></i>
                  </div>
                  Log Details
                </h3>
                <button 
                  @click="closeLogModal" 
                  class="text-slate-dark-400 hover:text-slate-dark-300 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                >
                  <i class="fas fa-times text-lg group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              
              <div v-if="selectedLogDetails" class="space-y-6">
                <!-- Basic Information -->
                <div class="glassmorphic-card rounded-xl p-5 border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                  <h4 class="text-lg font-bold text-cyber-400 mb-4 flex items-center gap-2">
                    <i class="fas fa-database text-sm"></i>
                    Basic Information
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">ID</span>
                      <div class="text-sm text-slate-dark-300 mt-1 font-mono">{{ selectedLogDetails.basic.id }}</div>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Timestamp</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.basic.timestamp }}</div>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Severity</span>
                      <div class="mt-1">
                        <span :class="['badge-' + selectedLogDetails.basic.severity.toLowerCase(), 'text-xs px-2 py-1 rounded-full font-medium']">
                          {{ selectedLogDetails.basic.severity }}
                        </span>
                      </div>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Log Type</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.basic.logType }}</div>
                    </div>
                    <div class="md:col-span-2 bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Endpoint</span>
                      <div class="text-sm text-slate-dark-300 mt-1 break-all">{{ selectedLogDetails.basic.endpoint }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Network Information -->
                <div class="glassmorphic-card rounded-xl p-5 border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                  <h4 class="text-lg font-bold text-cyber-400 mb-4 flex items-center gap-2">
                    <i class="fas fa-network-wired text-sm"></i>
                    Network Information
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Source IP</span>
                      <code class="text-sm text-cyber-400 mt-1 font-mono block">{{ selectedLogDetails.network.sourceIP }}</code>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Destination IP</span>
                      <code class="text-sm text-cyber-400 mt-1 font-mono block">{{ selectedLogDetails.network.destinationIP }}</code>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Protocol</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.network.protocol }}</div>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Port</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.network.port }}</div>
                    </div>
                    <div class="md:col-span-2 bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Action</span>
                      <div class="mt-1">
                        <span :class="selectedLogDetails.network.action === 'ALLOW' ? 'text-neon-green' : 'text-neon-red'" class="font-medium text-sm">
                          {{ selectedLogDetails.network.action }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Additional Details -->
                <div class="glassmorphic-card rounded-xl p-5 border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                  <h4 class="text-lg font-bold text-cyber-400 mb-4 flex items-center gap-2">
                    <i class="fas fa-list-alt text-sm"></i>
                    Additional Details
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2 bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Description</span>
                      <p class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.additional.description }}</p>
                    </div>
                    <div class="md:col-span-2 bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">User Agent</span>
                      <p class="text-sm text-slate-dark-300 mt-1 font-mono break-all">{{ selectedLogDetails.additional.userAgent }}</p>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Bytes</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.additional.bytes }}</div>
                    </div>
                    <div class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Packets</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.additional.packets }}</div>
                    </div>
                    <div class="md:col-span-2 bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30">
                      <span class="text-xs text-slate-dark-500 uppercase tracking-wide font-medium">Duration</span>
                      <div class="text-sm text-slate-dark-300 mt-1">{{ selectedLogDetails.additional.duration }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                <button 
                  @click="copyLogDetails" 
                  class="btn-cyber-outline flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-400/30 text-cyber-400 hover:bg-cyber-400/10 transition-all duration-200 group"
                >
                  <i class="fas fa-copy group-hover:scale-110 transition-transform duration-200"></i>
                  Copy Details
                </button>
                <button 
                  @click="exportLogDetails" 
                  class="btn-cyber flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-400/20 border border-cyber-400/50 text-cyber-400 hover:bg-cyber-400/30 transition-all duration-200 group"
                >
                  <i class="fas fa-download group-hover:scale-110 transition-transform duration-200"></i>
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-slate-dark-800 border border-slate-dark-600 rounded-lg p-6 max-w-sm mx-4">
        <div class="flex items-center gap-3">
          <div class="animate-spin">
            <i class="fas fa-spinner text-cyber-400 text-xl"></i>
          </div>
          <div>
            <p class="text-slate-dark-50 font-medium">{{ loadingAction }}</p>
            <p class="text-slate-dark-400 text-sm">Please wait...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast.js'
import { formatTimestamp } from '../utils/timestampFormatter.js'
import { logsAPI } from '../api/logs'
import axios from 'axios'

const apiStore = useAPIStore()
const authStore = useAuthStore()
const { addToast } = useToast()
const selectedSeverity = ref('Critical')
const filterLogType = ref('')
const filterTimeRange = ref('all')
const filterSourceIP = ref('')
const activeMenuId = ref(null)
const activeLog = ref(null)
const dropdownRef = ref(null)
const dropdownStyle = ref({})
const isLoading = ref(false)
const loadingAction = ref('')
const showLogModal = ref(false)
const selectedLogDetails = ref(null)

// Severity-specific logs fetched from backend
const severityLogs = ref([])

onMounted(async () => {
  await apiStore.fetchDashboardStats()
  await apiStore.fetchRecentLogs()
  // Also fetch severity-specific logs for better accuracy
  await fetchSeverityLogs(selectedSeverity.value, true)
})

// Pagination state
const currentPage = ref(1)
const hasMore = ref(true)

// Fetch logs for a specific severity from backend
const fetchSeverityLogs = async (severity, reset = false) => {
  if (reset) {
    currentPage.value = 1
    severityLogs.value = []
    hasMore.value = true
  }
  
  isLoading.value = true
  loadingAction.value = `Fetching ${severity} logs...`
  
  try {
    // Use the unified getAll endpoint which supports proper pagination and filtering
    const response = await logsAPI.getAll({
      severity: severity,
      limit: 50,
      page: currentPage.value,
      logType: filterLogType.value || null,
      sourceIp: filterSourceIP.value || null,
      timeRange: filterTimeRange.value
    })

    if (response && response.data) {
      if (reset) {
        severityLogs.value = response.data
      } else {
        severityLogs.value = [...severityLogs.value, ...response.data]
      }
      
      // Update hasMore based on response
      if (response.total !== undefined) {
         hasMore.value = severityLogs.value.length < response.total
      } else {
         hasMore.value = response.data.length === 50
      }
    }
  } catch (error) {
    console.error('Error fetching severity logs:', error)
    addToast('Failed to fetch logs', 'error')
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

// Watch for severity changes and fetch new logs
watch([selectedSeverity, filterLogType, filterTimeRange, filterSourceIP], () => {
  fetchSeverityLogs(selectedSeverity.value, true)
}, { debounce: 500 }) // Add some debounce if filters change rapidly

const loadMore = () => {
  if (!isLoading.value && hasMore.value) {
    currentPage.value++
    fetchSeverityLogs(selectedSeverity.value, false)
  }
}

const severities = computed(() => {
  // Use backend severity breakdown like Dashboard does
  const getCriticalCount = () => apiStore.severityBreakdown.find(s => s._id === 'Critical')?.count || 0
  const getHighCount = () => apiStore.severityBreakdown.find(s => s._id === 'High')?.count || 0
  const getMediumCount = () => apiStore.severityBreakdown.find(s => s._id === 'Medium')?.count || 0
  const getLowCount = () => apiStore.severityBreakdown.find(s => s._id === 'Low')?.count || 0
  
  return [
    { name: 'Critical', count: getCriticalCount(), icon: 'fas fa-exclamation-circle', color: '#ff0055' },
    { name: 'High', count: getHighCount(), icon: 'fas fa-alert', color: '#ff6b35' },
    { name: 'Medium', count: getMediumCount(), icon: 'fas fa-info-circle', color: '#ffd700' },
    { name: 'Low', count: getLowCount(), icon: 'fas fa-check-circle', color: '#00ff88' },
  ]
})

// Helper function to normalize severity for comparison
const normalizeSeverity = (severity) => {
  if (!severity) return 'Low'
  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 'Critical'
  if (s.includes('high')) return 'High'
  if (s.includes('medium')) return 'Medium'
  return 'Low'
}

// Normalized logs are just the server fetched logs now
// We assume server handles filtering correctly
const filteredLogs = computed(() => severityLogs.value)

// For SOC trustworthiness: Show ALL logs for the selected severity
const allLogsForSeverity = computed(() => severityLogs.value)

// Use this for display
const displayLogs = computed(() => severityLogs.value)


const severityDistribution = computed(() => {
  // Use backend severity breakdown like Dashboard does
  const getCriticalCount = () => apiStore.severityBreakdown.find(s => s._id === 'Critical')?.count || 0
  const getHighCount = () => apiStore.severityBreakdown.find(s => s._id === 'High')?.count || 0
  const getMediumCount = () => apiStore.severityBreakdown.find(s => s._id === 'Medium')?.count || 0
  const getLowCount = () => apiStore.severityBreakdown.find(s => s._id === 'Low')?.count || 0
  
  return [
    { name: 'Critical', value: getCriticalCount(), color: '#ff0055' },
    { name: 'High', value: getHighCount(), color: '#ff6b35' },
    { name: 'Medium', value: getMediumCount(), color: '#ffd700' },
    { name: 'Low', value: getLowCount(), color: '#00ff88' },
  ]
})

const totalLogs = computed(() => apiStore.total || 0)

const topIPsForSeverity = computed(() => {
  // First try to get IPs from the displayed logs for the selected severity
  const ips = {}
  const logs = displayLogs.value || []
  
  logs.forEach(log => {
    if (log && log.source_ip && log.source_ip !== '0.0.0.0' && log.source_ip !== 'Unknown') {
      ips[log.source_ip] = (ips[log.source_ip] || 0) + 1
    }
  })
  
  const calculatedIPs = Object.entries(ips)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
  
  // If we have calculated IPs from logs, use them
  if (calculatedIPs.length > 0) {
    return calculatedIPs
  }
  
  // Fallback: Use backend's topSourceIPs if available (for overall view)
  const backendIPs = apiStore.topSourceIPs || []
  if (backendIPs.length > 0) {
    return backendIPs
      .filter(item => item._id && item._id !== '0.0.0.0' && item._id !== 'Unknown')
      .map(item => ({ ip: item._id, count: item.count }))
      .slice(0, 10)
  }
  
  return []
})

const formatTime = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

// Open dropdown and position it relative to the clicked button
const openDropdown = (event, log) => {
  // If clicking the same button, close the dropdown
  if (activeMenuId.value === log.id) {
    closeDropdown()
    return
  }
  
  // Store the log and its ID
  activeMenuId.value = log.id
  activeLog.value = log
  
  // Use nextTick to ensure dropdown is rendered before positioning
  import.meta.env && nextTick(() => {
    if (!dropdownRef.value) return
    
    // Get button position (getBoundingClientRect gives viewport-relative coords)
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    
    // Get actual dropdown dimensions
    const dropdownHeight = dropdownRef.value.offsetHeight || 280
    const dropdownWidth = dropdownRef.value.offsetWidth || 224
    const gap = 8
    
    // Calculate horizontal position - align right side of dropdown with button right side
    let left = rect.right - dropdownWidth
    
    // Constrain horizontally
    const minLeft = 8
    const maxLeft = window.innerWidth - dropdownWidth - 8
    left = Math.max(minLeft, Math.min(left, maxLeft))
    
    // Calculate vertical position - below button by default
    let top = rect.bottom + gap
    
    // If dropdown would go off bottom of screen, position above button instead
    if (top + dropdownHeight > window.innerHeight) {
      top = rect.top - dropdownHeight - gap
    }
    
    // Ensure top doesn't go negative
    top = Math.max(8, top)
    
    dropdownStyle.value = {
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 99999
    }
  })
}

// Close dropdown
const closeDropdown = () => {
  activeMenuId.value = null
  activeLog.value = null
}

// Execute action on the active log
const executeAction = async (action) => {
  const log = activeLog.value
  if (!log) return
  
  // Close dropdown immediately
  closeDropdown()
  
  // Route to appropriate action handler
  switch (action) {
    case 'block':
      await blockIP(log)
      break
    case 'alert':
      await createAlert(log)
      break
    case 'investigate':
      await investigateLog(log)
      break
    case 'export':
      exportLog(log)
      break
    case 'details':
      showLogDetails(log)
      break
    default:
      addToast(`Unknown action: ${action}`, 'warning')
  }
}



const blockIP = async (log) => {
  if (!log || !log.source_ip) {
    addToast('Cannot block IP: Invalid log data', 'error')
    return
  }
  
  isLoading.value = true
  loadingAction.value = 'Blocking IP...'
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  
  try {
    const response = await axios.post(`${API_BASE}/ip/block`, 
      { 
        ip: log.source_ip, 
        reason: `Manually blocked from ${log.log_type} log: ${log.endpoint}`,
        log_id: log.id,
        severity: log.severity
      },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    )
    
    if (response.data.success) {
      addToast(`IP ${log.source_ip} blocked successfully!`, 'success')
    } else {
      addToast(`IP ${log.source_ip} was not blocked: ${response.data.message || 'Unknown reason'}`, 'warning')
    }
  } catch (error) {
    let errorMessage = 'Unknown error occurred'
    
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = error.response.data.error || 'IP already blocked or invalid request'
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - please login again'
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied - insufficient privileges'
      } else if (error.response.status === 500) {
        errorMessage = 'Server error - please try again later'
      } else {
        errorMessage = error.response.data.error || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      errorMessage = 'Network error - please check connection'
    } else {
      errorMessage = error.message || 'Unknown error'
    }
    
    addToast(`Failed to block IP ${log.source_ip}: ${errorMessage}`, 'error')
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

const createAlert = async (log) => {
  if (!log || !log.source_ip) {
    addToast('Cannot create alert: Invalid log data', 'error')
    return
  }
  
  isLoading.value = true
  loadingAction.value = 'Creating alert...'
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
  
  try {
    const title = `Security Alert: ${log.severity} ${log.log_type} Event`
    const description = `${log.log_type} activity detected from ${log.source_ip}${log.dest_ip ? ` to ${log.dest_ip}` : ''}${log.endpoint ? ` at ${log.endpoint}` : ''}`
    
    const response = await axios.post(`${API_BASE}/alerts/events`,
      {
        title,
        description,
        severity: log.severity,
        source_ip: log.source_ip,
        dest_ip: log.dest_ip,
        log_id: log.id
      },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    )
    
    if (response.data.success) {
      addToast(`Alert created successfully for ${log.source_ip}!`, 'success')
    } else {
      addToast(`Alert was not created: ${response.data.message || 'Unknown reason'}`, 'warning')
    }
  } catch (error) {
    let errorMessage = 'Unknown error occurred'
    
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = error.response.data.message || 'Invalid alert data or missing required fields'
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - please login again'
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied - admin privileges required'
      } else if (error.response.status === 500) {
        errorMessage = 'Server error - please try again later'
      } else {
        errorMessage = error.response.data.message || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      errorMessage = 'Network error - please check connection'
    } else {
      errorMessage = error.message || 'Unknown error'
    }
    
    addToast(`Failed to create alert for ${log.source_ip}: ${errorMessage}`, 'error')
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

const investigateLog = async (log) => {
  isLoading.value = true
  loadingAction.value = 'Investigating IP...'
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  
  try {
    const [whoisResponse, geoResponse] = await Promise.all([
      axios.get(`${API_BASE}/lookup/whois/${log.source_ip}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }),
      axios.get(`${API_BASE}/lookup/geoip/${log.source_ip}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ])
    
    if (!whoisResponse.data.success || !geoResponse.data.success) {
      throw new Error('Investigation services returned invalid data')
    }
    
    const investigationData = {
      log: log,
      whois: whoisResponse.data.data,
      geo: geoResponse.data.data,
      timestamp: new Date().toISOString(),
      investigationStatus: 'completed'
    }
    
    const jsonString = JSON.stringify(investigationData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `investigation-${log.source_ip}-${Date.now()}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    addToast(`Investigation completed for ${log.source_ip}!`, 'success')
  } catch (error) {
    let errorMessage = 'Unknown error occurred'
    
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = 'Invalid IP address or lookup failed'
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - please login again'
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied - insufficient privileges'
      } else if (error.response.status === 500) {
        errorMessage = 'Investigation service error - please try again later'
      } else {
        errorMessage = error.response.data.error || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      errorMessage = 'Network error - please check connection'
    } else {
      errorMessage = error.message || 'Investigation service unavailable'
    }
    
    addToast(`Investigation failed for ${log.source_ip}: ${errorMessage}`, 'error')
    showLogDetails(log)
  } finally {
    isLoading.value = false
    loadingAction.value = ''
  }
}

const exportLog = (log) => {
  activeMenuId.value = null // Close menu first
  
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      log: log,
      severity: log.severity,
      exportedBy: 'manual_action',
      exportStatus: 'completed'
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `log-${log.id}-${Date.now()}.json`)
    linkElement.click()
    URL.revokeObjectURL(url)
    
    addToast(`Log ${log.id} exported successfully! File: log-${log.id}-${Date.now()}.json`, 'success')
  } catch (error) {
    console.error('Export failed:', error)
    addToast(`Failed to export log ${log.id}: ${error.message || 'Export error'}`, 'error')
  }
}

const showLogDetails = (log) => {
  activeMenuId.value = null // Close menu first
  
  try {
    // Create a detailed log information object
    const logDetails = {
      basic: {
        id: log.id || 'N/A',
        timestamp: log.timestamp ? formatTimestamp(log.timestamp, 'datetime') : 'N/A',
        severity: log.severity || 'N/A',
        logType: log.log_type || 'N/A',
        endpoint: log.endpoint || 'N/A'
      },
      network: {
        sourceIP: log.source_ip || 'N/A',
        destinationIP: log.dest_ip || 'N/A',
        protocol: log.raw?.protocol || 'N/A',
        port: log.raw?.port || 'N/A',
        action: log.raw?.action || 'N/A'
      },
      additional: {
        description: log.raw?.description || 'N/A',
        userAgent: log.raw?.user_agent || 'N/A',
        bytes: log.raw?.bytes || 'N/A',
        packets: log.raw?.packets || 'N/A',
        duration: log.raw?.duration || 'N/A'
      }
    }
    
    // Set modal data and show modal
    selectedLogDetails.value = logDetails
    showLogModal.value = true
    
    addToast(`Showing detailed information for ${log.log_type} from ${log.source_ip}`, 'info')
  } catch (error) {
    console.error('Error showing log details:', error)
    addToast(`Failed to show log details: ${error.message}`, 'error')
  }
}

const closeLogModal = () => {
  showLogModal.value = false
  selectedLogDetails.value = null
}

const copyLogDetails = async () => {
  if (!selectedLogDetails.value) return
  
  try {
    const details = JSON.stringify(selectedLogDetails.value, null, 2)
    await navigator.clipboard.writeText(details)
    addToast('Log details copied to clipboard', 'success')
  } catch (error) {
    console.error('Failed to copy:', error)
    addToast('Failed to copy log details', 'error')
  }
}

const exportLogDetails = () => {
  if (!selectedLogDetails.value) return
  
  try {
    const jsonString = JSON.stringify(selectedLogDetails.value, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `log-details-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    addToast('Log details exported successfully', 'success')
  } catch (error) {
    console.error('Export failed:', error)
    addToast('Failed to export log details', 'error')
  }
}

const handleSeveritySearch = () => {
  const hasFilters = filterLogType.value || filterSourceIP.value
  
  if (hasFilters) {
    addToast(`Search applied: ${filteredLogs.value.length} logs found`, 'success')
  } else {
    addToast('Please enter search criteria', 'warning')
  }
}

// Modal transition handlers
const onModalEnter = (el) => {
  el.style.transform = 'scale(0.9)'
  el.style.opacity = '0'
  
  requestAnimationFrame(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    el.style.transform = 'scale(1)'
    el.style.opacity = '1'
  })
}

const onModalLeave = (el) => {
  el.style.transition = 'all 0.2s ease-in'
  el.style.transform = 'scale(0.95)'
  el.style.opacity = '0'
}

// Glassmorphic popup animation handlers
const onPopupEnter = (el) => {
  el.style.opacity = '0'
  el.style.transform = 'scale(0.95) translateY(-10px)'
  
  requestAnimationFrame(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    el.style.opacity = '1'
    el.style.transform = 'scale(1) translateY(0)'
  })
}

const onPopupLeave = (el) => {
  el.style.transition = 'all 0.2s ease-out'
  el.style.opacity = '0'
  el.style.transform = 'scale(0.95) translateY(-10px)'
}
</script>

<style scoped>
/* Glassmorphic popup transition animations */
.glassmorphic-popup-enter-active,
.glassmorphic-popup-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.glassmorphic-popup-enter-from,
.glassmorphic-popup-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.glassmorphic-popup-enter-to,
.glassmorphic-popup-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Enhanced action button styling */
:deep(.action-btn) {
  transition: all 0.2s ease;
}

:deep(.action-btn:hover) {
  color: rgb(6, 182, 212);
  background-color: rgba(6, 182, 212, 0.1);
}
</style>
