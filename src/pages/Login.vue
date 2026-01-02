<template>
  <div class="login-container">
    <!-- Animated background -->
    <div class="background-animation">
      <div class="gradient-orb gradient-orb-1"></div>
      <div class="gradient-orb gradient-orb-2"></div>
      <div class="gradient-orb gradient-orb-3"></div>
    </div>

    <!-- Login card -->
    <div class="login-card">
      <div class="card-header">
        <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 to-neon-purple">
          SOC Dashboard
        </h1>
        <p class="text-slate-dark-400 mt-2">Security Operations Center</p>
      </div>

      <!-- Tabs -->
      <div class="tabs-container mb-6">
        <button 
          @click="activeTab = 'login'"
          :class="['tab-button', { 'tab-active': activeTab === 'login' }]"
        >
          <i class="fas fa-sign-in-alt mr-2"></i>Sign In
        </button>
        <button 
          @click="activeTab = 'register'"
          :class="['tab-button', { 'tab-active': activeTab === 'register' }]"
        >
          <i class="fas fa-user-plus mr-2"></i>Register
        </button>
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-banner">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="success" class="success-banner">
        <i class="fas fa-check-circle"></i>
        {{ success }}
      </div>

      <!-- Login form -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="login-form">
        <!-- Email input -->
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope input-icon"></i>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="admin@soc.local"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Password input -->
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon"></i>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="form-input"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :disabled="loading"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>


        <!-- Login button -->
        <button
          type="submit"
          class="login-button"
          :disabled="loading"
          :class="{ 'is-loading': loading }"
        >
          <span v-if="!loading" class="button-text">
            <i class="fas fa-sign-in-alt"></i>
            Sign In
          </span>
          <span v-else class="button-text">
            <i class="fas fa-spinner fa-spin"></i>
            Signing in...
          </span>
        </button>
      </form>

      <!-- Register form -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="login-form">
        <!-- Name input -->
        <div class="form-group">
          <label for="name" class="form-label">Full Name</label>
          <div class="input-wrapper">
            <i class="fas fa-user input-icon"></i>
            <input
              id="name"
              v-model="registerForm.name"
              type="text"
              placeholder="John Doe"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Email input -->
        <div class="form-group">
          <label for="reg-email" class="form-label">Email Address</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope input-icon"></i>
            <input
              id="reg-email"
              v-model="registerForm.email"
              type="email"
              placeholder="user@soc.local"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Password input -->
        <div class="form-group">
          <label for="reg-password" class="form-label">Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon"></i>
            <input
              id="reg-password"
              v-model="registerForm.password"
              :type="showRegPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="form-input"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showRegPassword = !showRegPassword"
              :disabled="loading"
            >
              <i :class="showRegPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <!-- Confirm Password input -->
        <div class="form-group">
          <label for="reg-confirm" class="form-label">Confirm Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon"></i>
            <input
              id="reg-confirm"
              v-model="registerForm.confirmPassword"
              :type="showRegPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="form-input"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Register button -->
        <button
          type="submit"
          class="login-button"
          :disabled="loading"
          :class="{ 'is-loading': loading }"
        >
          <span v-if="!loading" class="button-text">
            <i class="fas fa-user-plus"></i>
            Create Account
          </span>
          <span v-else class="button-text">
            <i class="fas fa-spinner fa-spin"></i>
            Creating...
          </span>
        </button>
      </form>

      <!-- Footer -->
      <div class="card-footer">
        <p class="text-slate-dark-500 text-sm">
          Demo credentials:
          <br />
          <code class="text-cyber-400">admin@soc.local</code> / <code class="text-cyber-400">admin123</code>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')

const form = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const showRegPassword = ref(false)

const handleLogin = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    // Validate inputs
    if (!form.value.email || !form.value.password) {
      error.value = 'Please enter email and password'
      loading.value = false
      return
    }

    // Show loading screen
    if (window.showLoading) {
      window.showLoading('Signing In', 'authenticate your credentials')
    }

    // Call auth store login
    const result = await authStore.login({
      email: form.value.email,
      password: form.value.password
    })

    if (result.success) {
      success.value = 'Login successful! Redirecting...'
      // Clear form
      form.value = { email: '', password: '' }
      
      // Ensure user is set in the store
      if (!authStore.user) {
        await authStore.fetchUser()
      }
      
      // Redirect after 800ms
      setTimeout(() => {
        if (window.hideLoading) {
          window.hideLoading()
        }
        // Force reload to ensure all auth state is properly set
        window.location.href = '/dashboard'
      }, 800)
    } else {
      error.value = result.message || 'Login failed'
      // Keep form data so user doesn't have to re-enter
      loading.value = false
      if (window.hideLoading) {
        window.hideLoading()
      }
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during login'
    console.error('Login error:', err)
    loading.value = false
    if (window.hideLoading) {
      window.hideLoading()
    }
  }
}

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    // Validate inputs
    if (!registerForm.value.name || !registerForm.value.email || !registerForm.value.password) {
      error.value = 'Please fill in all fields'
      loading.value = false
      return
    }

    // Validate password match
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
      error.value = 'Passwords do not match'
      loading.value = false
      return
    }

    // Validate password strength
    if (registerForm.value.password.length < 6) {
      error.value = 'Password must be at least 6 characters'
      loading.value = false
      return
    }

    // Show loading screen
    if (window.showLoading) {
      window.showLoading('Creating Account', 'set up your new profile')
    }

    // Call auth store register
    console.log('Calling register with:', {
      name: registerForm.value.name,
      email: registerForm.value.email,
      password: '***',
      role: 'analyst'
    })
    const result = await authStore.register({
      name: registerForm.value.name,
      email: registerForm.value.email,
      password: registerForm.value.password,
      role: 'analyst'
    })
    console.log('Register result:', result)

    if (result.success) {
      success.value = 'Registration successful! Redirecting...'
      // Clear form
      registerForm.value = { name: '', email: '', password: '', confirmPassword: '' }
      // Redirect after 800ms
      setTimeout(() => {
        if (window.hideLoading) {
          window.hideLoading()
        }
        // Force reload to ensure all auth state is properly set
        window.location.href = '/dashboard'
      }, 800)
    } else {
      error.value = result.message || 'Registration failed'
      loading.value = false
      if (window.hideLoading) {
        window.hideLoading()
      }
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during registration'
    console.error('Registration error:', err)
    loading.value = false
    if (window.hideLoading) {
      window.hideLoading()
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Animated background */
.background-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

.gradient-orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #00d9ff 0%, transparent 70%);
  top: -50px;
  left: -50px;
  animation-delay: 0s;
}

.gradient-orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #ff006e 0%, transparent 70%);
  bottom: 50px;
  right: 100px;
  animation-delay: 5s;
}

.gradient-orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #8338ec 0%, transparent 70%);
  top: 50%;
  right: -50px;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(30px, -30px);
  }
  50% {
    transform: translate(-20px, 20px);
  }
  75% {
    transform: translate(20px, 30px);
  }
}

/* Login card */
.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 217, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.card-header h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.card-header p {
  font-size: 14px;
  margin-top: 8px;
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 217, 255, 0.1);
  padding-bottom: 12px;
}

.tab-button {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tab-button:hover {
  color: #cbd5e1;
}

.tab-button.tab-active {
  color: #00d9ff;
  border-bottom-color: #00d9ff;
}

/* Messages */
.error-banner,
.success-banner {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-banner {
  background: rgba(255, 0, 110, 0.1);
  border: 1px solid rgba(255, 0, 110, 0.3);
  color: #ff006e;
}

.success-banner {
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid rgba(0, 217, 255, 0.3);
  color: #00d9ff;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #64748b;
  font-size: 16px;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(0, 217, 255, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #00d9ff;
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 0 12px rgba(0, 217, 255, 0.2);
}

.form-input::placeholder {
  color: #64748b;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s ease;
}

.toggle-password:hover:not(:disabled) {
  color: #00d9ff;
}

.toggle-password:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Checkbox */
.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #00d9ff;
}

.checkbox-label {
  font-size: 14px;
  color: #cbd5e1;
  cursor: pointer;
  font-weight: 500;
}

/* Login button */
.login-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #00d9ff 0%, #0099cc 100%);
  border: none;
  border-radius: 8px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 10px;
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.login-button:hover:not(:disabled)::before {
  left: 100%;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 217, 255, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled,
.login-button.is-loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Footer */
.card-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 217, 255, 0.1);
}

.card-footer p {
  font-size: 12px;
  line-height: 1.6;
}

code {
  background: rgba(0, 217, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 640px) {
  .login-card {
    margin: 20px;
    padding: 30px 20px;
  }

  .card-header h1 {
    font-size: 24px;
  }

  .gradient-orb {
    filter: blur(60px);
  }
}
</style>
