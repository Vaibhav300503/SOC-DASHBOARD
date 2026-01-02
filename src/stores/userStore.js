import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { profileAPI } from '../api/profile.js'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const stats = ref(null)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const fullName = computed(() => user.value?.fullName || 'Unknown User')
  const role = computed(() => user.value?.role || 'viewer')
  const avatar = computed(() => user.value?.avatar || null)
  const profileCompletion = computed(() => user.value?.profileCompletion || 0)

  // Initialize user from token
  const initializeUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      isLoading.value = true
      const response = await profileAPI.getProfile()
      if (response.success) {
        user.value = response.data
      }
    } catch (error) {
      console.error('Failed to initialize user:', error)
      // Clear invalid token
      localStorage.removeItem('token')
    } finally {
      isLoading.value = false
    }
  }

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      const response = await profileAPI.updateProfile(profileData)
      if (response.success) {
        user.value = response.data
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message }
    } catch (error) {
      console.error('Failed to update profile:', error)
      return { success: false, message: error.response?.data?.message || 'Failed to update profile' }
    } finally {
      isLoading.value = false
    }
  }

  // Upload avatar
  const uploadAvatar = async (file) => {
    try {
      isLoading.value = true
      const response = await profileAPI.uploadAvatar(file)
      if (response.success) {
        user.value.avatar = response.data.avatar
        user.value.profileCompletion = response.data.profileCompletion
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      return { success: false, message: error.response?.data?.message || 'Failed to upload avatar' }
    } finally {
      isLoading.value = false
    }
  }

  // Load user stats
  const loadStats = async () => {
    try {
      const response = await profileAPI.getProfileStats()
      if (response.success) {
        stats.value = response.data
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  // Logout
  const logout = async () => {
    try {
      await profileAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local data
      user.value = null
      stats.value = null
      localStorage.removeItem('token')
    }
  }

  // Delete account
  const deleteAccount = async () => {
    try {
      const response = await profileAPI.deleteAccount()
      if (response.success) {
        user.value = null
        stats.value = null
        localStorage.removeItem('token')
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message }
    } catch (error) {
      console.error('Failed to delete account:', error)
      return { success: false, message: error.response?.data?.message || 'Failed to delete account' }
    }
  }

  // Generate mock user for development
  const generateMockUser = () => {
    user.value = {
      id: 'user-123',
      username: 'john.doe',
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: 'analyst',
      avatar: null,
      department: 'Security Operations',
      phone: '+1-555-0123',
      bio: 'Senior Security Analyst with 5+ years of experience in threat detection and incident response.',
      is_active: true,
      last_login: new Date(),
      loginCount: 127,
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          browser: true,
          alerts: true
        },
        dashboard: {
          defaultView: 'overview',
          itemsPerPage: 20
        }
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      },
      activity: {
        loginsViewed: 127,
        alertsCreated: 45,
        reportsGenerated: 23,
        lastActivity: new Date()
      },
      profileCompletion: 85,
      created_at: new Date('2022-01-15')
    }

    stats.value = {
      loginCount: 127,
      lastLogin: new Date(),
      lastActivity: new Date(),
      activity: user.value.activity,
      alertsCreated: 45,
      logsViewed: 2847,
      reportsGenerated: 23,
      profileCompletion: 85,
      joinDate: new Date('2022-01-15')
    }
  }

  return {
    // State
    user,
    isLoading,
    stats,
    
    // Computed
    isAuthenticated,
    fullName,
    role,
    avatar,
    profileCompletion,
    
    // Actions
    initializeUser,
    updateProfile,
    uploadAvatar,
    loadStats,
    logout,
    deleteAccount,
    generateMockUser
  }
})
