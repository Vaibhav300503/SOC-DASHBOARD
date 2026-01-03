import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const isCollapsed = ref(false)

  // Load sidebar state from localStorage on initialization
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      isCollapsed.value = saved === 'true'
    }
  }

  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebarCollapsed', isCollapsed.value)
  }

  const setCollapsed = (value) => {
    isCollapsed.value = value
    localStorage.setItem('sidebarCollapsed', value)
  }

  return {
    isCollapsed,
    toggleSidebar,
    setCollapsed
  }
})
