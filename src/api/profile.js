import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const profileAPI = {
  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await axios.get(`${API_BASE}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${API_BASE}/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await axios.post(`${API_BASE}/profile/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  },

  /**
   * Get user activity statistics
   */
  async getProfileStats() {
    try {
      const response = await axios.get(`${API_BASE}/profile/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching profile stats:', error)
      throw error
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await axios.post(`${API_BASE}/profile/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount() {
    try {
      const response = await axios.delete(`${API_BASE}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }
}
