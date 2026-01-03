import { ref, computed, watch } from 'vue'
import { useSearchStore } from '../stores/searchStore'
import { useAPIStore } from '../stores/apiStore'
import { filterLogs } from '../utils/searchFiltering'

/**
 * UNIFIED SEARCH COMPOSABLE
 * Provides consistent search behavior across all pages
 * 
 * CRITICAL: All pages should use this composable
 * Handles:
 * - Debounced search
 * - Filtering with correct order
 * - Pagination
 * - Loading states
 * - Error handling
 */
export const useSearch = (options = {}) => {
  const searchStore = useSearchStore()
  const apiStore = useAPIStore()
  
  const {
    debounceMs = 300,
    pageSize = 50,
    autoFetch = true
  } = options
  
  // Local state
  const debounceTimer = ref(null)
  const isSearching = ref(false)
  
  /**
   * Debounced search function
   * Prevents excessive filtering on every keystroke
   */
  const debouncedSearch = (callback) => {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }
    
    debounceTimer.value = setTimeout(() => {
      callback()
      debounceTimer.value = null
    }, debounceMs)
  }
  
  /**
   * Perform search with debouncing
   */
  const performSearch = (query) => {
    debouncedSearch(() => {
      searchStore.setSearchQuery(query)
      isSearching.value = false
    })
    isSearching.value = true
  }
  
  /**
   * Update filter with debouncing
   */
  const updateFilter = (filterName, value) => {
    debouncedSearch(() => {
      searchStore.setFilter(filterName, value)
      isSearching.value = false
    })
    isSearching.value = true
  }
  
  /**
   * Update multiple filters
   */
  const updateFilters = (newFilters) => {
    debouncedSearch(() => {
      searchStore.setFilters(newFilters)
      isSearching.value = false
    })
    isSearching.value = true
  }
  
  /**
   * Clear all search and filters
   */
  const clearAllSearch = () => {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }
    searchStore.clearSearch()
    isSearching.value = false
  }
  
  /**
   * Filtered logs computed property
   * CRITICAL: Uses unified filtering function
   */
  const filteredLogs = computed(() => {
    return filterLogs(apiStore.logs, {
      searchQuery: searchStore.searchQuery,
      filters: searchStore.filters
    })
  })
  
  /**
   * Total results count
   */
  const totalResults = computed(() => filteredLogs.value.length)
  
  /**
   * Paginated results
   */
  const paginatedResults = computed(() => {
    const start = searchStore.offset
    const end = start + searchStore.pagination.limit
    return filteredLogs.value.slice(start, end)
  })
  
  /**
   * Total pages
   */
  const totalPages = computed(() => {
    return Math.ceil(totalResults.value / searchStore.pagination.limit)
  })
  
  /**
   * Current page
   */
  const currentPage = computed(() => searchStore.pagination.page)
  
  /**
   * Can go to next page
   */
  const canNextPage = computed(() => currentPage.value < totalPages.value)
  
  /**
   * Can go to previous page
   */
  const canPrevPage = computed(() => currentPage.value > 1)
  
  /**
   * Go to next page
   */
  const nextPage = () => {
    if (canNextPage.value) {
      searchStore.setPage(currentPage.value + 1)
    }
  }
  
  /**
   * Go to previous page
   */
  const prevPage = () => {
    if (canPrevPage.value) {
      searchStore.setPage(currentPage.value - 1)
    }
  }
  
  /**
   * Go to specific page
   */
  const goToPage = (page) => {
    searchStore.setPage(page)
  }
  
  /**
   * Set page size
   */
  const setPageSize = (size) => {
    searchStore.setLimit(size)
  }
  
  /**
   * Get severity counts in filtered results
   */
  const getSeverityCounts = computed(() => {
    const counts = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0
    }
    
    filteredLogs.value.forEach(log => {
      const severity = log.severity || 'Low'
      if (severity in counts) {
        counts[severity]++
      }
    })
    
    return counts
  })
  
  /**
   * Get log type counts in filtered results
   */
  const getLogTypeCounts = computed(() => {
    const counts = {}
    
    filteredLogs.value.forEach(log => {
      const type = log.log_type || 'Unknown'
      counts[type] = (counts[type] || 0) + 1
    })
    
    return counts
  })
  
  /**
   * Get top source IPs in filtered results
   */
  const getTopSourceIPs = computed(() => {
    const ips = {}
    
    filteredLogs.value.forEach(log => {
      const ip = log.source_ip
      if (ip) {
        ips[ip] = (ips[ip] || 0) + 1
      }
    })
    
    return Object.entries(ips)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })
  
  /**
   * Get top destination IPs in filtered results
   */
  const getTopDestinationIPs = computed(() => {
    const ips = {}
    
    filteredLogs.value.forEach(log => {
      const ip = log.dest_ip
      if (ip) {
        ips[ip] = (ips[ip] || 0) + 1
      }
    })
    
    return Object.entries(ips)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })
  
  /**
   * Get top endpoints in filtered results
   */
  const getTopEndpoints = computed(() => {
    const endpoints = {}
    
    filteredLogs.value.forEach(log => {
      const endpoint = log.endpoint || 'Unknown'
      endpoints[endpoint] = (endpoints[endpoint] || 0) + 1
    })
    
    return Object.entries(endpoints)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })
  
  /**
   * Export filtered results as CSV
   */
  const exportAsCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Log Type', 'Source IP', 'Destination IP', 'Endpoint', 'Action', 'Description']
    const rows = filteredLogs.value.map(log => [
      log.timestamp,
      log.severity,
      log.log_type,
      log.source_ip,
      log.dest_ip,
      log.endpoint,
      log.action,
      log.raw?.description || ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  /**
   * Export filtered results as JSON
   */
  const exportAsJSON = () => {
    const json = JSON.stringify(filteredLogs.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return {
    // State
    searchQuery: computed(() => searchStore.searchQuery),
    filters: computed(() => searchStore.filters),
    isSearching,
    
    // Search actions
    performSearch,
    updateFilter,
    updateFilters,
    clearAllSearch,
    
    // Results
    filteredLogs,
    totalResults,
    paginatedResults,
    
    // Pagination
    currentPage,
    totalPages,
    canNextPage,
    canPrevPage,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    
    // Analytics
    getSeverityCounts,
    getLogTypeCounts,
    getTopSourceIPs,
    getTopDestinationIPs,
    getTopEndpoints,
    
    // Export
    exportAsCSV,
    exportAsJSON,
    
    // Store access
    searchStore
  }
}

export default useSearch
