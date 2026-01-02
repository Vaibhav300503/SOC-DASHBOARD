import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

/**
 * Setup axios interceptors for authentication
 */
export const setupInterceptors = () => {
  // Request interceptor - add token to headers
  axios.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore()
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
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

      // If unauthorized and not a retry, logout
      if (error.response?.status === 401 && !originalRequest._retry) {
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
