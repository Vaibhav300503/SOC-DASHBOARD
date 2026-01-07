import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

/**
 * Setup axios interceptors for authentication
 */
export const setupInterceptors = () => {
  // Request interceptor - add token to headers
  axios.interceptors.request.use(
    (config) => {
      // Get fresh auth store instance for each request
      const authStore = useAuthStore()
      
      // Check if we're in demo mode
      const demoMode = localStorage.getItem('demoMode') === 'true'
      
      if (demoMode && authStore.user) {
        // For demo mode, create a simple token from user data
        const demoToken = btoa(JSON.stringify({ 
          userId: authStore.user._id, 
          email: authStore.user.email,
          role: authStore.user.role,
          demo: true 
        }))
        config.headers.Authorization = `Bearer ${demoToken}`
        console.log('Demo mode: Using demo token for request:', config.url)
      } else if (authStore.token) {
        // For real backend authentication
        config.headers.Authorization = `Bearer ${authStore.token}`
        console.log('Real mode: Using JWT token for request:', config.url)
      } else {
        console.warn('No token available for request to:', config.url)
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - handle token expiration
  axios.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const authStore = useAuthStore()
      const originalRequest = error.config
      const demoMode = localStorage.getItem('demoMode') === 'true'

      // If in demo mode and we get 401, just continue (backend might not be configured for demo)
      if (demoMode && error.response?.status === 401) {
        console.warn('Demo mode: Ignoring 401 error, backend might not support demo tokens')
        // Return a mock successful response for demo mode
        return Promise.resolve({
          data: { success: true, data: [], message: 'Demo mode - no backend data' },
          status: 200,
          statusText: 'OK'
        })
      }

      // If token expired, try to refresh
      if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
        if (!originalRequest._retry) {
          originalRequest._retry = true

          try {
            const success = await authStore.refreshToken()
            if (success) {
              // Retry original request with new token
              return axios(originalRequest)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            // Don't automatically logout, let user decide
            // Just show a message and let them continue
            if (window.addToast) {
              window.addToast('Session expired. Please login again.', 'warning', 10000)
            }
            // Remove the expired token to prevent further issues
            await authStore.logout()
            // Only redirect if not on login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }
      }

      // If unauthorized and not a retry, logout (but not in demo mode)
      if (error.response?.status === 401 && !originalRequest._retry && !demoMode) {
        console.error('Unauthorized access, logging out')
        await authStore.logout()
        // Only redirect if not on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )
}
