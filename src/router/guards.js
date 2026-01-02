import { useAuthStore } from '../stores/authStore'

/**
 * Authentication guard - redirect to login if not authenticated
 */
export const authGuard = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (authStore.isAuthenticated) {
    next()
    return
  }
  
  // If not authenticated, try to restore from localStorage
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser)
      authStore.user = userData
      next()
      return
    } catch (e) {
      console.error('Failed to parse stored user:', e)
      localStorage.removeItem('user')
    }
  }
  
  // If we get here, user is not authenticated
  next('/login')
}

/**
 * Guest guard - redirect to dashboard if already authenticated
 */
export const guestGuard = (to, from, next) => {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  // Also check localStorage for stored user
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser)
      authStore.user = userData
      next('/dashboard')
      return
    } catch (e) {
      console.error('Failed to parse stored user:', e)
      localStorage.removeItem('user')
    }
  }

  next()
}

/**
 * Role guard - check if user has required role
 */
export const roleGuard = (requiredRoles = []) => {
  return async (to, from, next) => {
    const authStore = useAuthStore()
    
    // First ensure we have an authenticated user
    if (!authStore.isAuthenticated) {
      // Try to restore from localStorage
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          authStore.user = userData
        } catch (e) {
          console.error('Failed to parse stored user:', e)
          localStorage.removeItem('user')
          next('/login')
          return
        }
      } else {
        next('/login')
        return
      }
    }

    // Now check roles if any are required
    if (requiredRoles.length > 0 && !requiredRoles.includes(authStore.user.role)) {
      next('/unauthorized')
      return
    }

    next()
  }
}
