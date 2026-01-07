<template>
  <div class="min-h-screen bg-slate-dark-900 p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header with Tabs -->
      <div class="mb-8">
        <h1 class="text-3xl font-black title-gradient tracking-tight">User Profile</h1>
        <p class="text-slate-dark-400 mt-2 font-medium opacity-80">Manage your profile information and preferences</p>
        
        <!-- Navigation Tabs -->
        <div class="flex space-x-1 bg-slate-dark-800 p-1 rounded-lg">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-cyber-600 text-white'
                : 'text-slate-dark-300 hover:text-slate-dark-100 hover:bg-slate-dark-700'
            ]"
          >
            <i :class="tab.icon" class="mr-2"></i>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Profile Tab -->
      <div v-if="activeTab === 'profile'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Card -->
        <div class="lg:col-span-1">
          <div class="card-glass p-6">
            <!-- Avatar Section -->
            <div class="text-center mb-6">
              <div class="relative inline-block">
                <img
                  v-if="userStore.avatar"
                  :src="userStore.avatar"
                  :alt="userStore.fullName"
                  class="w-24 h-24 rounded-full object-cover ring-4 ring-cyber-400 mx-auto"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-white font-bold text-2xl mx-auto"
                >
                  {{ getInitials() }}
                </div>
                
                <!-- Avatar Upload -->
                <label class="absolute bottom-0 right-0 bg-cyber-400 text-white p-2 rounded-full cursor-pointer hover:bg-cyber-300 transition-colors">
                  <i class="fas fa-camera text-xs"></i>
                  <input type="file" class="hidden" accept="image/*" @change="handleAvatarUpload" />
                </label>
              </div>
              
              <h2 class="text-xl font-semibold text-slate-dark-100 mt-4">{{ userStore.fullName }}</h2>
              <p class="text-slate-dark-400">{{ userStore.user?.email }}</p>
              <div class="flex items-center justify-center gap-2 mt-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                      :class="getRoleBadgeClass()">
                  {{ userStore.role }}
                </span>
                <span class="text-xs text-slate-dark-500">{{ userStore.user?.department }}</span>
              </div>
            </div>

            <!-- Profile Completion -->
            <div class="mb-6">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-slate-dark-300">Profile Completion</span>
                <span class="text-cyber-400 font-medium">{{ userStore.profileCompletion }}%</span>
              </div>
              <div class="w-full bg-slate-dark-700 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-cyber-400 to-cyber-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${userStore.profileCompletion}%` }"
                ></div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-slate-dark-800/50 rounded-lg">
                <div class="text-lg font-bold text-cyber-400">{{ userStore.stats?.loginCount || 0 }}</div>
                <div class="text-xs text-slate-dark-400">Total Logins</div>
              </div>
              <div class="text-center p-3 bg-slate-dark-800/50 rounded-lg">
                <div class="text-lg font-bold text-neon-green">{{ userStore.stats?.alertsCreated || 0 }}</div>
                <div class="text-xs text-slate-dark-400">Alerts Created</div>
              </div>
              <div class="text-center p-3 bg-slate-dark-800/50 rounded-lg">
                <div class="text-lg font-bold text-purple-400">{{ userStore.stats?.reportsGenerated || 0 }}</div>
                <div class="text-xs text-slate-dark-400">Reports Generated</div>
              </div>
              <div class="text-center p-3 bg-slate-dark-800/50 rounded-lg">
                <div class="text-lg font-bold text-yellow-400">{{ userStore.stats?.logsViewed || 0 }}</div>
                <div class="text-xs text-slate-dark-400">Logs Viewed</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="lg:col-span-2">
          <div class="card-glass p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-slate-dark-100">Edit Profile</h3>
              <button
                @click="isEditing = !isEditing"
                class="btn-cyber-outline"
                :disabled="isLoading"
              >
                <i :class="isEditing ? 'fas fa-times' : 'fas fa-edit'" class="mr-2"></i>
                {{ isEditing ? 'Cancel' : 'Edit' }}
              </button>
            </div>

            <form @submit.prevent="handleUpdateProfile" class="space-y-6">
              <!-- Personal Information -->
              <div>
                <h4 class="text-sm font-medium text-slate-dark-300 mb-4 flex items-center">
                  <i class="fas fa-user mr-2 text-cyber-400"></i>
                  Personal Information
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">First Name</label>
                    <input
                      v-model="profileForm.firstName"
                      type="text"
                      class="input-cyber w-full"
                      :disabled="!isEditing"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Last Name</label>
                    <input
                      v-model="profileForm.lastName"
                      type="text"
                      class="input-cyber w-full"
                      :disabled="!isEditing"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Email</label>
                    <input
                      v-model="profileForm.email"
                      type="email"
                      class="input-cyber w-full"
                      disabled
                      required
                    />
                    <p class="text-xs text-slate-dark-500 mt-1">Email cannot be changed here</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Username</label>
                    <input
                      v-model="profileForm.username"
                      type="text"
                      class="input-cyber w-full"
                      disabled
                      required
                    />
                    <p class="text-xs text-slate-dark-500 mt-1">Username cannot be changed here</p>
                  </div>
                </div>
              </div>

              <!-- Work Information -->
              <div>
                <h4 class="text-sm font-medium text-slate-dark-300 mb-4 flex items-center">
                  <i class="fas fa-building mr-2 text-cyber-400"></i>
                  Work Information
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Department</label>
                    <select
                      v-model="profileForm.department"
                      class="input-cyber w-full"
                      :disabled="!isEditing"
                    >
                      <option value="Security Operations">Security Operations</option>
                      <option value="IT Department">IT Department</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Phone</label>
                    <input
                      v-model="profileForm.phone"
                      type="tel"
                      class="input-cyber w-full"
                      :disabled="!isEditing"
                      placeholder="+1-555-0123"
                    />
                  </div>
                </div>
              </div>

              <!-- Bio -->
              <div>
                <h4 class="text-sm font-medium text-slate-dark-300 mb-4 flex items-center">
                  <i class="fas fa-info-circle mr-2 text-cyber-400"></i>
                  About
                </h4>
                <textarea
                  v-model="profileForm.bio"
                  class="input-cyber w-full"
                  :disabled="!isEditing"
                  rows="4"
                  maxlength="500"
                  placeholder="Tell us about yourself..."
                ></textarea>
                <p class="text-xs text-slate-dark-500 mt-1">
                  {{ profileForm.bio?.length || 0 }}/500 characters
                </p>
              </div>

              <!-- Preferences -->
              <div>
                <h4 class="text-sm font-medium text-slate-dark-300 mb-4 flex items-center">
                  <i class="fas fa-cog mr-2 text-cyber-400"></i>
                  Preferences
                </h4>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Theme</label>
                    <select
                      v-model="profileForm.preferences.theme"
                      class="input-cyber w-full"
                      :disabled="!isEditing"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-dark-400 mb-2">Notifications</label>
                    <div class="space-y-2">
                      <label class="flex items-center">
                        <input
                          v-model="profileForm.preferences.notifications.email"
                          type="checkbox"
                          class="mr-2"
                          :disabled="!isEditing"
                        />
                        <span class="text-sm text-slate-dark-300">Email notifications</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          v-model="profileForm.preferences.notifications.browser"
                          type="checkbox"
                          class="mr-2"
                          :disabled="!isEditing"
                        />
                        <span class="text-sm text-slate-dark-300">Browser notifications</span>
                      </label>
                      <label class="flex items-center">
                        <input
                          v-model="profileForm.preferences.notifications.alerts"
                          type="checkbox"
                          class="mr-2"
                          :disabled="!isEditing"
                        />
                        <span class="text-sm text-slate-dark-300">Security alerts</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Save Button -->
              <div v-if="isEditing" class="flex justify-end gap-3">
                <button
                  type="button"
                  @click="resetForm"
                  class="btn-cyber-outline"
                  :disabled="isLoading"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  class="btn-cyber"
                  :disabled="isLoading"
                >
                  <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
                  {{ isLoading ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 'settings'" class="space-y-6">
        <!-- Account Settings -->
        <div class="card-glass p-6">
          <h3 class="text-lg font-semibold text-slate-dark-100 mb-6 flex items-center">
            <i class="fas fa-user-cog mr-3 text-cyber-400"></i>
            Account Settings
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Language -->
            <div>
              <label class="block text-sm font-medium text-slate-dark-300 mb-2">Language</label>
              <select v-model="settings.language" class="input-cyber w-full">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            <!-- Timezone -->
            <div>
              <label class="block text-sm font-medium text-slate-dark-300 mb-2">Timezone</label>
              <select v-model="settings.timezone" class="input-cyber w-full">
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time (EST)</option>
                <option value="CST">Central Time (CST)</option>
                <option value="MST">Mountain Time (MST)</option>
                <option value="PST">Pacific Time (PST)</option>
              </select>
            </div>
            <!-- Date Format -->
            <div>
              <label class="block text-sm font-medium text-slate-dark-300 mb-2">Date Format</label>
              <select v-model="settings.dateFormat" class="input-cyber w-full">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <!-- Time Format -->
            <div>
              <label class="block text-sm font-medium text-slate-dark-300 mb-2">Time Format</label>
              <select v-model="settings.timeFormat" class="input-cyber w-full">
                <option value="12h">12-Hour (AM/PM)</option>
                <option value="24h">24-Hour</option>
              </select>
            </div>
          </div>
        </div>



        <!-- Notification Settings -->
        <div class="card-glass p-6">
          <h3 class="text-lg font-semibold text-slate-dark-100 mb-6 flex items-center">
            <i class="fas fa-bell mr-3 text-cyber-400"></i>
            Notification Settings
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Email Notifications</label>
                <p class="text-xs text-slate-dark-500">Receive updates via email</p>
              </div>
              <input v-model="settings.notifications.email" type="checkbox" class="w-5 h-5" />
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Browser Notifications</label>
                <p class="text-xs text-slate-dark-500">Desktop notifications</p>
              </div>
              <input v-model="settings.notifications.browser" type="checkbox" class="w-5 h-5" />
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Security Alerts</label>
                <p class="text-xs text-slate-dark-500">Critical security notifications</p>
              </div>
              <input v-model="settings.notifications.alerts" type="checkbox" class="w-5 h-5" />
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Weekly Digest</label>
                <p class="text-xs text-slate-dark-500">Summary of your activity</p>
              </div>
              <input v-model="settings.notifications.digest" type="checkbox" class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- Privacy Settings -->
        <div class="card-glass p-6">
          <h3 class="text-lg font-semibold text-slate-dark-100 mb-6 flex items-center">
            <i class="fas fa-lock mr-3 text-cyber-400"></i>
            Privacy Settings
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Profile Visibility</label>
                <p class="text-xs text-slate-dark-500">Allow others to see your profile</p>
              </div>
              <select v-model="settings.privacy.profileVisibility" class="input-cyber w-32">
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="team">Team Only</option>
              </select>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Activity Tracking</label>
                <p class="text-xs text-slate-dark-500">Allow tracking of your activities</p>
              </div>
              <input v-model="settings.privacy.activityTracking" type="checkbox" class="w-5 h-5" />
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-dark-800/30 rounded-lg">
              <div>
                <label class="text-sm font-medium text-slate-dark-300">Analytics</label>
                <p class="text-xs text-slate-dark-500">Help us improve with usage data</p>
              </div>
              <input v-model="settings.privacy.analytics" type="checkbox" class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- Save Settings Button -->
        <div class="flex justify-end gap-3">
          <button @click="resetSettings" class="btn-cyber-outline">
            <i class="fas fa-undo mr-2"></i>Reset
          </button>
          <button @click="saveSettings" class="btn-cyber" :disabled="isLoading">
            <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
            {{ isLoading ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>

      <!-- Activity Tab -->
      <div v-else-if="activeTab === 'activity'" class="space-y-6">
        <!-- Activity Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card-glass p-6 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-sign-in-alt text-xl text-cyan-400"></i>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-800/50 px-2 py-1 rounded">Last 30 days</span>
            </div>
            <div class="text-3xl font-bold text-slate-dark-100 mb-1">{{ userStore.stats?.loginCount || 0 }}</div>
            <div class="text-sm text-slate-dark-400">Total Logins</div>
            <div class="mt-3 pt-3 border-t border-slate-dark-700/50">
              <p class="text-xs text-slate-dark-500">Average: {{ Math.round((userStore.stats?.loginCount || 0) / 30) }} per day</p>
            </div>
          </div>
          
          <div class="card-glass p-6 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-xl text-green-400"></i>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-800/50 px-2 py-1 rounded">Created</span>
            </div>
            <div class="text-3xl font-bold text-slate-dark-100 mb-1">{{ userStore.stats?.alertsCreated || 0 }}</div>
            <div class="text-sm text-slate-dark-400">Alerts Created</div>
            <div class="mt-3 pt-3 border-t border-slate-dark-700/50">
              <p class="text-xs text-slate-dark-500">Status: <span class="text-green-400">Active</span></p>
            </div>
          </div>
          
          <div class="card-glass p-6 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-file-alt text-xl text-purple-400"></i>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-800/50 px-2 py-1 rounded">Generated</span>
            </div>
            <div class="text-3xl font-bold text-slate-dark-100 mb-1">{{ userStore.stats?.reportsGenerated || 0 }}</div>
            <div class="text-sm text-slate-dark-400">Reports Generated</div>
            <div class="mt-3 pt-3 border-t border-slate-dark-700/50">
              <p class="text-xs text-slate-dark-500">Last: {{ formatDate(userStore.stats?.lastReportDate) }}</p>
            </div>
          </div>
          
          <div class="card-glass p-6 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-eye text-xl text-yellow-400"></i>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-800/50 px-2 py-1 rounded">Viewed</span>
            </div>
            <div class="text-3xl font-bold text-slate-dark-100 mb-1">{{ userStore.stats?.logsViewed || 0 }}</div>
            <div class="text-sm text-slate-dark-400">Logs Viewed</div>
            <div class="mt-3 pt-3 border-t border-slate-dark-700/50">
              <p class="text-xs text-slate-dark-500">Today: {{ Math.round((userStore.stats?.logsViewed || 0) / 30) }}</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity Timeline -->
        <div class="card-glass p-6">
          <h3 class="text-lg font-semibold text-slate-dark-100 mb-6 flex items-center">
            <i class="fas fa-history mr-3 text-cyber-400"></i>
            Recent Activity Timeline
          </h3>
          <div class="space-y-4">
            <div class="flex items-start gap-4 p-4 bg-slate-dark-800/30 rounded-lg hover:bg-slate-dark-800/50 transition-colors">
              <div class="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-sign-in-alt text-cyan-400"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-dark-200">Last Login</div>
                <div class="text-xs text-slate-dark-500">{{ formatDate(userStore.stats?.lastLogin) }}</div>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-700/50 px-2 py-1 rounded whitespace-nowrap">Just now</span>
            </div>

            <div class="flex items-start gap-4 p-4 bg-slate-dark-800/30 rounded-lg hover:bg-slate-dark-800/50 transition-colors">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-check-circle text-green-400"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-dark-200">Last Activity</div>
                <div class="text-xs text-slate-dark-500">{{ formatDate(userStore.stats?.lastActivity) }}</div>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-700/50 px-2 py-1 rounded whitespace-nowrap">5 mins ago</span>
            </div>

            <div class="flex items-start gap-4 p-4 bg-slate-dark-800/30 rounded-lg hover:bg-slate-dark-800/50 transition-colors">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-calendar text-purple-400"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-dark-200">Member Since</div>
                <div class="text-xs text-slate-dark-500">{{ formatDate(userStore.user?.created_at) }}</div>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-700/50 px-2 py-1 rounded whitespace-nowrap">{{ getDaysSinceMember() }} days</span>
            </div>

            <div class="flex items-start gap-4 p-4 bg-slate-dark-800/30 rounded-lg hover:bg-slate-dark-800/50 transition-colors">
              <div class="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-lock text-yellow-400"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-dark-200">Last Password Change</div>
                <div class="text-xs text-slate-dark-500">{{ formatDate(userStore.user?.security?.lastPasswordChange) }}</div>
              </div>
              <span class="text-xs text-slate-dark-500 bg-slate-dark-700/50 px-2 py-1 rounded whitespace-nowrap">{{ getDaysSincePasswordChange() }} days ago</span>
            </div>
          </div>
        </div>

        <!-- Activity Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card-glass p-6">
            <h4 class="text-md font-semibold text-slate-dark-100 mb-4 flex items-center">
              <i class="fas fa-chart-bar mr-2 text-cyber-400"></i>
              Activity Summary
            </h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Total Sessions</span>
                <span class="text-lg font-bold text-cyan-400">{{ userStore.stats?.totalSessions || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Active Sessions</span>
                <span class="text-lg font-bold text-green-400">{{ userStore.stats?.activeSessions || 1 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Failed Logins</span>
                <span class="text-lg font-bold text-red-400">{{ userStore.user?.security?.failedLoginAttempts || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Account Status</span>
                <span class="text-lg font-bold text-green-400">Active</span>
              </div>
            </div>
          </div>

          <div class="card-glass p-6">
            <h4 class="text-md font-semibold text-slate-dark-100 mb-4 flex items-center">
              <i class="fas fa-shield-alt mr-2 text-cyber-400"></i>
              Security Status
            </h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">2FA Status</span>
                <span class="text-xs font-semibold px-2 py-1 rounded" :class="userStore.user?.security?.twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'">
                  {{ userStore.user?.security?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Account Locked</span>
                <span class="text-xs font-semibold px-2 py-1 rounded" :class="userStore.user?.security?.lockedUntil ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'">
                  {{ userStore.user?.security?.lockedUntil ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Last Security Audit</span>
                <span class="text-sm text-slate-dark-300">{{ formatDate(userStore.stats?.lastSecurityAudit) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-dark-400">Risk Level</span>
                <span class="text-xs font-semibold px-2 py-1 rounded bg-green-500/20 text-green-400">Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Tab -->
      <div v-else-if="activeTab === 'security'" class="card-glass p-6">
        <h3 class="text-lg font-semibold text-slate-dark-100 mb-6">Security Settings</h3>
        <div class="space-y-6">
          <!-- Two-Factor Authentication -->
          <div class="flex items-center justify-between p-4 bg-slate-dark-800/50 rounded-lg">
            <div>
              <h4 class="text-md font-medium text-slate-dark-200">Two-Factor Authentication</h4>
              <p class="text-sm text-slate-dark-400">Add an extra layer of security to your account</p>
            </div>
            <button
              class="btn-cyber-outline"
              :disabled="!userStore.user"
            >
              {{ userStore.user?.security?.twoFactorEnabled ? 'Manage' : 'Enable' }}
            </button>
          </div>

          <!-- Password -->
          <div class="flex items-center justify-between p-4 bg-slate-dark-800/50 rounded-lg">
            <div>
              <h4 class="text-md font-medium text-slate-dark-200">Password</h4>
              <p class="text-sm text-slate-dark-400">Last changed {{ formatDate(userStore.user?.security?.lastPasswordChange) }}</p>
            </div>
            <button class="btn-cyber-outline" disabled>Change Password</button>
          </div>

          <!-- Login Activity -->
          <div class="p-4 bg-slate-dark-800/50 rounded-lg">
            <h4 class="text-md font-medium text-slate-dark-200 mb-3">Login Activity</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-dark-400">Failed Login Attempts:</span>
                <span class="text-slate-dark-200">{{ userStore.user?.security?.failedLoginAttempts || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-dark-400">Account Locked:</span>
                <span class="text-slate-dark-200">{{ userStore.user?.security?.lockedUntil ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>

          <!-- Logout All Devices -->
          <div class="flex items-center justify-between p-4 bg-slate-dark-800/50 rounded-lg">
            <div>
              <h4 class="text-md font-medium text-slate-dark-200">Logout All Devices</h4>
              <p class="text-sm text-slate-dark-400">Sign out from all active sessions</p>
            </div>
            <button
              @click="handleLogoutAllDevices"
              class="btn-cyber-outline bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30"
              :disabled="!userStore.user || isLoggingOut"
            >
              <i v-if="isLoggingOut" class="fas fa-spinner fa-spin mr-2"></i>
              {{ isLoggingOut ? 'Logging out...' : 'Logout All Devices' }}
            </button>
          </div>

          <!-- Danger Zone -->
          <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <h4 class="text-md font-medium text-red-400 mb-2">Danger Zone</h4>
            <p class="text-sm text-slate-dark-400 mb-4">Irreversible actions for your account</p>
            <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm" disabled>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/userStore.js'
import { useToast } from '../composables/useToast.js'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const { addToast } = useToast()
const route = useRoute()

const isEditing = ref(false)
const isLoading = ref(false)
const isLoggingOut = ref(false)
const activeTab = ref('profile')

const tabs = [
  { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
  { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  { id: 'activity', label: 'Activity', icon: 'fas fa-chart-line' },
  { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' }
]

const settings = ref({
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notifications: {
    email: true,
    browser: true,
    alerts: true,
    digest: true
  },
  privacy: {
    profileVisibility: 'team',
    activityTracking: true,
    analytics: true
  }
})

const profileForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  department: '',
  phone: '',
  bio: '',
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      browser: true,
      alerts: true
    }
  }
})

// Set active tab based on query parameter
watch(() => route.query, (query) => {
  if (query.tab && tabs.find(t => t.id === query.tab)) {
    activeTab.value = query.tab
  }
}, { immediate: true })

// Initialize form with user data
const initializeForm = () => {
  if (userStore.user) {
    profileForm.value = {
      firstName: userStore.user.firstName || '',
      lastName: userStore.user.lastName || '',
      email: userStore.user.email || '',
      username: userStore.user.username || '',
      department: userStore.user.department || 'Security Operations',
      phone: userStore.user.phone || '',
      bio: userStore.user.bio || '',
      preferences: {
        theme: userStore.user.preferences?.theme || 'dark',
        notifications: {
          email: userStore.user.preferences?.notifications?.email ?? true,
          browser: userStore.user.preferences?.notifications?.browser ?? true,
          alerts: userStore.user.preferences?.notifications?.alerts ?? true
        }
      }
    }
  }
}

// Watch for user data changes
watch(() => userStore.user, initializeForm, { immediate: true })

onMounted(async () => {
  if (!userStore.user) {
    await userStore.initializeUser()
  }
  await userStore.loadStats()
  initializeForm()
})

const getInitials = () => {
  if (!userStore.user) return 'U'
  const first = userStore.user.firstName?.[0] || 'U'
  const last = userStore.user.lastName?.[0] || ''
  return (first + last).toUpperCase()
}

const getRoleBadgeClass = () => {
  const role = userStore.role
  switch (role) {
    case 'admin':
      return 'bg-red-500/20 text-red-400'
    case 'analyst':
      return 'bg-blue-500/20 text-blue-400'
    case 'viewer':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  const fallback = parent.querySelector('div')
  if (fallback) fallback.style.display = 'flex'
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    addToast('File size must be less than 5MB', 'error')
    return
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    addToast('Only image files are allowed', 'error')
    return
  }

  try {
    const result = await userStore.uploadAvatar(file)
    if (result.success) {
      addToast(result.message, 'success')
    } else {
      addToast(result.message, 'error')
    }
  } catch (error) {
    addToast('Failed to upload avatar', 'error')
  }

  // Reset file input
  event.target.value = ''
}

const handleUpdateProfile = async () => {
  try {
    isLoading.value = true
    const result = await userStore.updateProfile(profileForm.value)
    
    if (result.success) {
      addToast(result.message, 'success')
      isEditing.value = false
      await userStore.loadStats()
    } else {
      addToast(result.message, 'error')
    }
  } catch (error) {
    addToast('Failed to update profile', 'error')
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  initializeForm()
}

const handleLogoutAllDevices = async () => {
  try {
    isLoggingOut.value = true
    
    // Simulate API call to logout all devices
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clear all sessions and session-related data
    localStorage.removeItem('token')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('lastActionTime')
    localStorage.removeItem('activityCount')
    
    // Clear any session cookies if they exist
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    addToast('Logged out from all devices successfully', 'success')
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login'
    }, 1000)
  } catch (error) {
    addToast('Failed to logout from all devices', 'error')
  } finally {
    isLoggingOut.value = false
  }
}

const saveSettings = async () => {
  try {
    isLoading.value = true
    // Simulate API call to save settings
    await new Promise(resolve => setTimeout(resolve, 1000))
    addToast('Settings saved successfully', 'success')
  } catch (error) {
    addToast('Failed to save settings', 'error')
  } finally {
    isLoading.value = false
  }
}

const resetSettings = () => {
  settings.value = {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    notifications: {
      email: true,
      browser: true,
      alerts: true,
      digest: true
    },
    privacy: {
      profileVisibility: 'team',
      activityTracking: true,
      analytics: true
    }
  }
  addToast('Settings reset to defaults', 'info')
}

const getDaysSinceMember = () => {
  if (!userStore.user?.created_at) return 0
  const created = new Date(userStore.user.created_at)
  const now = new Date()
  const diff = now - created
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const getDaysSincePasswordChange = () => {
  if (!userStore.user?.security?.lastPasswordChange) return 'Never'
  const lastChange = new Date(userStore.user.security.lastPasswordChange)
  const now = new Date()
  const diff = now - lastChange
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days
}
</script>
