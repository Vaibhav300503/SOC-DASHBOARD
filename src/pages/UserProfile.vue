<template>
  <div class="user-profile-page">
    <div class="container">
      <h1>User Profile</h1>
      
      <!-- Profile Card -->
      <div class="card-glass p-8 rounded-xl mb-8">
        <h2 class="text-2xl font-semibold text-slate-dark-50 mb-6">Account Information</h2>
        
        <!-- Profile Info Section -->
        <div class="profile-section mb-8">
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-slate-dark-200 mb-2">Email</label>
            <input 
              v-model="user.email" 
              type="email" 
              disabled 
              class="w-full px-4 py-2 bg-slate-dark-800 text-slate-dark-400 border border-slate-dark-700 rounded-lg cursor-not-allowed"
            />
            <small class="text-slate-dark-400">Email cannot be changed</small>
          </div>
          
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-slate-dark-200 mb-2">Name</label>
            <input 
              v-model="profileForm.name" 
              type="text" 
              class="w-full px-4 py-2 bg-slate-dark-800 text-slate-dark-50 border border-slate-dark-700 rounded-lg focus:border-cyber-500 focus:outline-none transition-colors"
              placeholder="Your name"
            />
          </div>

          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-slate-dark-200 mb-2">Role</label>
            <input 
              v-model="user.role" 
              type="text" 
              disabled 
              class="w-full px-4 py-2 bg-slate-dark-800 text-slate-dark-400 border border-slate-dark-700 rounded-lg cursor-not-allowed"
            />
          </div>

          <button 
            @click="updateProfile" 
            :disabled="updating"
            class="btn-primary"
          >
            <i class="fas fa-save mr-2"></i>{{ updating ? 'Updating...' : 'Update Profile' }}
          </button>
        </div>

        <!-- Change Password Section -->
        <div class="border-t border-slate-dark-700 pt-8">
          <h3 class="text-lg font-semibold text-slate-dark-50 mb-6">Change Password</h3>
          
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-slate-dark-200 mb-2">Current Password</label>
            <input 
              v-model="passwordForm.current" 
              type="password" 
              class="w-full px-4 py-2 bg-slate-dark-800 text-slate-dark-50 border border-slate-dark-700 rounded-lg focus:border-cyber-500 focus:outline-none transition-colors"
              placeholder="Enter current password"
            />
          </div>

          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-slate-dark-200 mb-2">New Password</label>
            <input 
              v-model="passwordForm.new" 
              type="password" 
              class="w-full px-4 py-2 bg-slate-dark-800 text-slate-dark-50 border border-slate-dark-700 rounded-lg focus:border-cyber-500 focus:outline-none transition-colors"
              placeholder="Enter new password"
            />
          </div>

          <div class="form-group mb-6">
            <label class="block text-sm font-medium text-slate-dark-200 mb-2">Confirm Password</label>
            <input 
              v-model="passwordForm.confirm" 
              type="password" 
              class="w-full px-4 py-2 bg-slate-dark-800 text-slate-dark-50 border border-slate-dark-700 rounded-lg focus:border-cyber-500 focus:outline-none transition-colors"
              placeholder="Confirm new password"
            />
          </div>

          <button 
            @click="changePassword"
            :disabled="changingPassword"
            class="btn-primary"
          >
            <i class="fas fa-key mr-2"></i>{{ changingPassword ? 'Changing...' : 'Change Password' }}
          </button>
        </div>
      </div>

      <!-- Feedback Message -->
      <div v-if="message" :class="['feedback-message', messageType]">
        <i :class="['fas', messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const user = ref({})
const profileForm = ref({ name: '' })
const passwordForm = ref({ current: '', new: '', confirm: '' })
const message = ref('')
const messageType = ref('success')
const updating = ref(false)
const changingPassword = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const fetchUser = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/auth/me`,
      { headers: getAuthHeaders() }
    )
    
    if (response.data.success) {
      user.value = response.data.user
      profileForm.value.name = response.data.user.name
    }
  } catch (error) {
    showMessage('Failed to load profile', 'error')
  }
}

const updateProfile = async () => {
  if (!profileForm.value.name.trim()) {
    showMessage('Name cannot be empty', 'error')
    return
  }

  try {
    updating.value = true
    const response = await axios.patch(
      `${API_BASE}/auth/me`,
      { name: profileForm.value.name },
      { headers: getAuthHeaders() }
    )
    
    if (response.data.success) {
      showMessage('Profile updated successfully', 'success')
      user.value.name = profileForm.value.name
    }
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to update profile', 'error')
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  if (!passwordForm.value.current || !passwordForm.value.new || !passwordForm.value.confirm) {
    showMessage('All password fields are required', 'error')
    return
  }

  if (passwordForm.value.new !== passwordForm.value.confirm) {
    showMessage('New passwords do not match', 'error')
    return
  }

  if (passwordForm.value.new.length < 6) {
    showMessage('Password must be at least 6 characters', 'error')
    return
  }

  try {
    changingPassword.value = true
    const response = await axios.post(
      `${API_BASE}/auth/change-password`,
      {
        currentPassword: passwordForm.value.current,
        newPassword: passwordForm.value.new
      },
      { headers: getAuthHeaders() }
    )
    
    if (response.data.success) {
      showMessage('Password changed successfully', 'success')
      passwordForm.value = { current: '', new: '', confirm: '' }
    }
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to change password', 'error')
  } finally {
    changingPassword.value = false
  }
}

const showMessage = (msg, type) => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.user-profile-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 32px;
}

h2 {
  color: #e2e8f0;
}

h3 {
  color: #cbd5e1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #cbd5e1;
  font-weight: 500;
}

.form-group input {
  padding: 10px 12px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  box-shadow: 0 0 0 3px rgba(91, 109, 255, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #5b6dff 0%, #b026ff 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 16px rgba(91, 109, 255, 0.3);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.feedback-message {
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  margin-top: 24px;
}

.feedback-message.success {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.feedback-message.error {
  background: rgba(255, 0, 85, 0.1);
  color: #ff0055;
  border: 1px solid rgba(255, 0, 85, 0.3);
}

.feedback-message i {
  font-size: 18px;
}
</style>
