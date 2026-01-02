import { ref } from 'vue'

// Simple toast notification utility
export function useToast() {
  const toasts = ref([])
  
  const addToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    toasts.value.push(toast)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  return {
    toasts,
    addToast,
    removeToast
  }
}
