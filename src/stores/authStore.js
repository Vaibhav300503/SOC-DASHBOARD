import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

// Demo users for testing
const DEMO_USERS = {
  'admin@soc.local': {
    id: '1',
    email: 'admin@soc.local',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin'
  },
  'analyst@soc.local': {
    id: '2',
    email: 'analyst@soc.local',
    name: 'Security Analyst',
    password: 'analyst123',
    role: 'analyst'
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const loading = ref(false)
  const error = ref(null)
  const demoMode = ref(DEMO_MODE)

  // Initialize user and token from localStorage
  const initializeUser = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    
    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
        console.log('Restored user from localStorage:', user.value.email)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
  }

  // Initialize immediately
  initializeUser()

  /**
   * Login user
   */
  const login = async (credentials) => {
    loading.value = true
    error.value = null

    try {
      // Try demo mode first if enabled
      if (demoMode.value && DEMO_USERS[credentials.email]) {
        const demoUser = DEMO_USERS[credentials.email]
        if (demoUser.password === credentials.password) {
          const userData = {
            _id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
          }
          
          // Create demo token
          const demoToken = btoa(JSON.stringify({ 
            userId: demoUser.id, 
            email: demoUser.email,
            role: demoUser.role,
            demo: true 
          }))
          
          // Store user data and token
          user.value = userData
          token.value = demoToken
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('token', demoToken)
          
          // Set session data
          const now = Date.now()
          localStorage.setItem('demoMode', 'true')
          localStorage.setItem('loginTime', now.toString())
          localStorage.setItem('lastActionTime', now.toString())
          localStorage.setItem('activityCount', '0')

          return {
            success: true,
            message: 'Demo login successful'
          }
        } else {
          error.value = 'Invalid credentials'
          return {
            success: false,
            message: error.value
          }
        }
      }

      // Try backend API
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      })

      if (response.data.success) {
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        localStorage.removeItem('demoMode')
        
        // Set session data
        const now = Date.now()
        localStorage.setItem('loginTime', now.toString())
        localStorage.setItem('lastActionTime', now.toString())
        localStorage.setItem('activityCount', '0')

        return {
          success: true,
          message: 'Login successful'
        }
      } else {
        error.value = response.data.message || 'Login failed'
        return {
          success: false,
          message: error.value
        }
      }
    } catch (err) {
      // If API fails and demo mode is enabled, try demo login
      if (demoMode.value && DEMO_USERS[credentials.email]) {
        const demoUser = DEMO_USERS[credentials.email]
        if (demoUser.password === credentials.password) {
          const userData = {
            _id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
          }
          
          // Create demo token
          const demoToken = btoa(JSON.stringify({ 
            userId: demoUser.id, 
            email: demoUser.email,
            role: demoUser.role,
            demo: true 
          }))
          
          user.value = userData
          token.value = demoToken
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('token', demoToken)
          localStorage.setItem('demoMode', 'true')
          return {
            success: true,
            message: 'Demo login successful (backend unavailable)'
          }
        }
      }

      error.value = err.response?.data?.message || err.message || 'Login failed'
      return {
        success: false,
        message: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Register new user
   */
  const register = async (credentials) => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        role: credentials.role || 'analyst'
      })

      if (response.data.success) {
        // Store user data and token from registration response
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        localStorage.removeItem('demoMode')
        
        // Set session data
        const now = Date.now()
        localStorage.setItem('loginTime', now.toString())
        localStorage.setItem('lastActionTime', now.toString())
        localStorage.setItem('activityCount', '0')

        return {
          success: true,
          message: 'Registration successful'
        }
      } else {
        error.value = response.data.message || 'Registration failed'
        return {
          success: false,
          message: error.value
        }
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Registration failed'
      return {
        success: false,
        message: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get current user info
   */
  const fetchUser = async () => {
    // Check localStorage first
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
        return true
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    
    // If no stored user but we have a session, try to fetch from server
    try {
      const response = await axios.get(`${API_BASE}/auth/me`)
      if (response.data.success) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to fetch user:', err)
      error.value = 'Failed to fetch user info'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   */
  const logout = () => {
    // Clear user data
    user.value = null
    token.value = null
    
    // Clear local storage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('demoMode')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('lastActionTime')
    localStorage.removeItem('activityCount')
    
    // Redirect to login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /**
   * Check if user has role
   */
  const hasRole = (role) => {
    return user.value?.role === role
  }

  /**
   * Check if user has any of the roles
   */
  const hasAnyRole = (roles = []) => {
    return roles.includes(user.value?.role)
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    error,
    demoMode,
    
    // Actions
    login,
    register,
    logout,
    fetchUser,
    hasRole,
    hasAnyRole
  }
})
