import { ref } from 'vue'
import axios from 'axios'

export function useSearch() {
  const searchQuery = ref('')
  const searchResults = ref([])
  const isSearching = ref(false)
  const searchError = ref('')
  let debounceTimer = null

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  })

  const performSearch = async (query, searchType = 'ip') => {
    if (!query || query.length < 2) {
      searchResults.value = []
      return
    }

    try {
      isSearching.value = true
      searchError.value = ''

      let endpoint = ''
      switch (searchType) {
        case 'ip':
          endpoint = `/logs?source_ip=${query}&limit=20`
          break
        case 'domain':
          endpoint = `/lookup/dns?domain=${query}`
          break
        case 'endpoint':
          endpoint = `/logs?endpoint=${query}&limit=20`
          break
        default:
          endpoint = `/logs?source_ip=${query}&limit=20`
      }

      const response = await axios.get(
        `${API_BASE}${endpoint}`,
        { headers: getAuthHeaders() }
      )

      if (response.data.success || response.data.data) {
        searchResults.value = response.data.data || response.data
      } else {
        searchResults.value = []
      }
    } catch (error) {
      console.error('Search error:', error)
      searchError.value = error.response?.data?.message || 'Search failed'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  const debouncedSearch = (query, searchType) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      performSearch(query, searchType)
    }, 300) // 300ms debounce
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchError.value = ''
  }

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    debouncedSearch,
    clearSearch,
    performSearch
  }
}
