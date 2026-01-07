<template>
  <div class="notification-center">
    <div class="header">
      <h3>Notifications</h3>
      <button 
        v-if="unreadCount > 0"
        @click="markAllRead"
        class="btn-small"
      >
        Mark all read
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="notifications.length === 0" class="empty-state">
      <i class="fas fa-bell-slash"></i>
      <p>No notifications to show</p>
      <small>You're all caught up!</small>
    </div>

    <!-- Notifications List -->
    <div v-else class="notifications-list">
      <div
        v-for="notif in notifications"
        :key="notif._id"
        :class="['notification-item', { unread: !notif.read }]"
        @click="handleNotificationClick(notif)"
      >
        <div class="notification-header">
          <span :class="['severity-badge', notif.severity.toLowerCase()]">
            {{ notif.severity }}
          </span>
          <span class="timestamp">{{ formatTime(notif.created_at) }}</span>
        </div>
        <p class="notification-title">{{ notif.title }}</p>
        <p class="notification-description">{{ notif.description }}</p>
      </div>
    </div>

    <!-- Unread Badge -->
    <div v-if="unreadCount > 0" class="unread-badge">
      {{ unreadCount }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import { formatTimestamp } from '../../utils/timestampFormatter.js'

const apiStore = useAPIStore()
const notifications = ref([])
const loading = ref(false)
const eventSource = ref(null)

const emit = defineEmits(['update:notifications'])

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

const fetchNotifications = async () => {
  try {
    loading.value = true
    
    // Use real alerts API
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_BASE}/alerts/events?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        // Transform alert events to notification format
        notifications.value = data.data.map(alert => ({
          _id: alert._id,
          severity: alert.severity || 'Medium',
          title: alert.title,
          description: alert.description,
          created_at: alert.created_at,
          read: alert.read,
          source_ip: alert.source_ip,
          dest_ip: alert.dest_ip,
          type: 'alert'
        }))
      } else {
        throw new Error(data.message)
      }
    } else {
      throw new Error('Failed to fetch alerts')
    }
    
    // Emit notifications to parent
    emit('update:notifications', notifications.value)
    // Synchronize with apiStore if needed
    apiStore.notifications = notifications.value
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    // Fallback to events if alerts API fails
    if (apiStore.events.length > 0) {
      notifications.value = apiStore.events.slice(0, 20).map(event => ({
        _id: event._id,
        severity: event.event?.severity || 'Medium',
        title: `Event: ${event.event?.action || 'Unknown'}`,
        description: `${event.host?.name || 'Unknown host'} - ${event.event?.category || 'System event'}`,
        created_at: event['@timestamp'] || new Date().toISOString(),
        read: false,
        type: 'event'
      }))
    } else {
      notifications.value = []
    }
    emit('update:notifications', notifications.value)
  } finally {
    loading.value = false
  }
}

const markAllRead = async () => {
  try {
    // Mark all as read on backend
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_BASE}/alerts/events/mark-all-read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      // Update local state
      notifications.value.forEach(n => n.read = true)
      emit('update:notifications', notifications.value)
    }
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    // Still update local state even if API fails
    notifications.value.forEach(n => n.read = true)
    emit('update:notifications', notifications.value)
  }
}

const handleNotificationClick = async (notif) => {
  if (!notif.read) {
    try {
      // Mark as read on backend
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE}/alerts/events/${notif._id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        notif.read = true
        emit('update:notifications', notifications.value)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Still update local state even if API fails
      notif.read = true
      emit('update:notifications', notifications.value)
    }
  }
}

// Setup real-time alert streaming
const setupAlertStream = () => {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'
    const token = localStorage.getItem('token')
    
    eventSource.value = new EventSource(`${API_BASE}/alerts/stream?token=${token}`)
    
    eventSource.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_alert' && data.data) {
          const newAlert = {
            _id: data.data._id,
            severity: data.data.severity || 'Medium',
            title: data.data.title,
            description: data.data.description,
            created_at: data.data.created_at,
            read: false,
            source_ip: data.data.source_ip,
            dest_ip: data.data.dest_ip,
            type: 'alert',
            analysis_status: data.data.analysis_status,
            thehive_alert_id: data.data.thehive_alert_id,
            thehive_case_id: data.data.thehive_case_id
          }

          notifications.value.unshift(newAlert)

          if (notifications.value.length > 20) {
            notifications.value = notifications.value.slice(0, 20)
          }

          emit('update:notifications', notifications.value)
        } else if ((data.type === 'analysis_update' || data.type === 'thehive_update') && data.data) {
          const updated = data.data
          const idx = notifications.value.findIndex(n => n._id === updated._id)
          if (idx !== -1) {
            notifications.value[idx] = {
              ...notifications.value[idx],
              severity: updated.severity || notifications.value[idx].severity,
              title: updated.title || notifications.value[idx].title,
              description: updated.description || notifications.value[idx].description,
              created_at: updated.created_at || notifications.value[idx].created_at,
              analysis_status: updated.analysis_status || notifications.value[idx].analysis_status,
              thehive_alert_id: updated.thehive_alert_id || notifications.value[idx].thehive_alert_id,
              thehive_case_id: updated.thehive_case_id || notifications.value[idx].thehive_case_id
            }

            emit('update:notifications', notifications.value)
          }
        }
      } catch (error) {
        console.error('Error parsing alert stream data:', error)
      }
    }
    
    eventSource.value.onerror = (error) => {
      console.error('Alert stream error:', error)
      eventSource.value?.close()
    }
  } catch (error) {
    console.error('Failed to setup alert stream:', error)
  }
}

const formatTime = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}

onMounted(() => {
  fetchNotifications()
  setupAlertStream()
})

onUnmounted(() => {
  if (eventSource.value) {
    eventSource.value.close()
  }
})
</script>

<style scoped>
.notification-center {
  background: transparent;
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
}

.header h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--accent-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-small {
  padding: 4px 10px;
  font-size: 11px;
  background: rgba(0, 240, 255, 0.1);
  color: var(--accent-primary);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-small:hover {
  background: var(--accent-primary);
  color: black;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 40px;
  margin-bottom: 16px;
  color: var(--accent-blue);
  opacity: 0.3;
  display: block;
}

.empty-state p {
  margin: 8px 0;
  font-size: 13px;
  font-weight: 500;
}

.empty-state small {
  display: block;
  font-size: 11px;
  opacity: 0.6;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 8px 8px 8px;
}

.notification-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.notification-item:hover {
  background: rgba(0, 240, 255, 0.05);
  border-color: rgba(0, 240, 255, 0.2);
}

.notification-item.unread {
  background: rgba(0, 240, 255, 0.08);
  border-left: 2px solid var(--accent-primary);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.severity-badge.critical {
  background: rgba(255, 0, 85, 0.1);
  color: #FF2D78;
  border: 1px solid rgba(255, 0, 85, 0.3);
}

.severity-badge.high {
  background: rgba(255, 107, 53, 0.1);
  color: #FF8B5E;
  border: 1px solid rgba(255, 107, 53, 0.3);
}

.severity-badge.medium {
  background: rgba(255, 199, 0, 0.1);
  color: #FFD700;
  border: 1px solid rgba(255, 199, 0, 0.3);
}

.severity-badge.low {
  background: rgba(0, 255, 136, 0.1);
  color: #33FF99;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.timestamp {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: monospace;
}

.notification-title {
  margin: 4px 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.notification-description {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--critical);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(255, 0, 85, 0.3);
}

/* Custom scrollbar for cyber look */
.notifications-list::-webkit-scrollbar {
  width: 4px;
}

.notifications-list::-webkit-scrollbar-track {
  background: transparent;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: rgba(0, 240, 255, 0.2);
  border-radius: 2px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 240, 255, 0.4);
}
</style>
