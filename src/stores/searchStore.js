import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { normalizeSeverity } from '../utils/severityNormalization'

/**
 * GLOBAL SEARCH STORE
 * Single source of truth for all search state across the SOC dashboard
 * 
 * CRITICAL: This is the ONLY place search state should be managed
 * All pages must use this store for consistent search behavior
 */
export const useSearchStore = defineStore('search', () => {
  // ============================================
  // SEARCH STATE (Single Source of Truth)
  // ============================================
  
  const searchQuery = ref('')
  const filters = ref({
    severity: '',
    logType: '',
    timeRange: '24h',
    action: '',
    sourceIP: '',
    destIP: '',
    endpoint: '',
    country: '',
    city: ''
  })
  
  const pagination = ref({
    page: 1,
    limit: 50
  })
  
  const isLoading = ref(false)
  const error = ref(null)
  
  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Set search query
   * CRITICAL: This is the ONLY way to set search query
   */
  const setSearchQuery = (query) => {
    searchQuery.value = query.trim()
    // Reset to page 1 when search changes
    pagination.value.page = 1
  }
  
  /**
   * Set individual filter
   * CRITICAL: Use this for all filter changes
   */
  const setFilter = (filterName, value) => {
    if (filterName in filters.value) {
      filters.value[filterName] = value
      // Reset to page 1 when filters change
      pagination.value.page = 1
    }
  }
  
  /**
   * Set multiple filters at once
   */
  const setFilters = (newFilters) => {
    Object.keys(newFilters).forEach(key => {
      if (key in filters.value) {
        filters.value[key] = newFilters[key]
      }
    })
    pagination.value.page = 1
  }
  
  /**
   * Clear all search and filters
   */
  const clearSearch = () => {
    searchQuery.value = ''
    filters.value = {
      severity: '',
      logType: '',
      timeRange: '24h',
      action: '',
      sourceIP: '',
      destIP: '',
      endpoint: '',
      country: '',
      city: ''
    }
    pagination.value.page = 1
    error.value = null
  }
  
  /**
   * Set pagination
   */
  const setPage = (page) => {
    pagination.value.page = Math.max(1, page)
  }
  
  const setLimit = (limit) => {
    pagination.value.limit = Math.max(10, Math.min(100, limit))
    pagination.value.page = 1
  }
  
  /**
   * Set loading state
   */
  const setLoading = (loading) => {
    isLoading.value = loading
  }
  
  /**
   * Set error
   */
  const setError = (err) => {
    error.value = err
  }
  
  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  
  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return searchQuery.value.length > 0 ||
           Object.values(filters.value).some(v => v && v !== '24h')
  })
  
  /**
   * Get active filter count
   */
  const activeFilterCount = computed(() => {
    let count = searchQuery.value.length > 0 ? 1 : 0
    Object.entries(filters.value).forEach(([key, value]) => {
      if (key === 'timeRange') {
        if (value && value !== '24h') count++
      } else if (value) {
        count++
      }
    })
    return count
  })
  
  /**
   * Get pagination offset
   */
  const offset = computed(() => {
    return (pagination.value.page - 1) * pagination.value.limit
  })
  
  return {
    // State
    searchQuery,
    filters,
    pagination,
    isLoading,
    error,
    
    // Actions
    setSearchQuery,
    setFilter,
    setFilters,
    clearSearch,
    setPage,
    setLimit,
    setLoading,
    setError,
    
    // Computed
    hasActiveFilters,
    activeFilterCount,
    offset
  }
})
