import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { setupInterceptors } from './api/interceptors'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize auth store after pinia is installed
const authStore = useAuthStore()

// Setup axios interceptors
setupInterceptors()

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler:', err)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

// Mount the app
app.use(router)
app.mount('#app')
