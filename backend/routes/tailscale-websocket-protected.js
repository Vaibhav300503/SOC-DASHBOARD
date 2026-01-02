import websocketManager from '../services/websocketManager.js';
import secureLogger from '../middleware/secureLogger.js';
import TailscaleDevice from '../models/TailscaleDevice.js';
import TailscaleLog from '../models/TailscaleLog.js';

class TailscaleWebSocketBroadcaster {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize with WebSocket manager
  initialize(wss) {
    if (this.isInitialized) return;
    
    this.wss = wss;
    this.isInitialized = true;
    
    secureLogger.info('Tailscale WebSocket broadcaster initialized');
  }

  // Broadcast device updates to all connected clients
  async broadcastDeviceUpdate(updateType, deviceData) {
    try {
      if (!this.wss) {
        secureLogger.warn('WebSocket server not initialized, skipping broadcast');
        return;
      }

      const message = {
        type: 'device_update',
        timestamp: new Date().toISOString(),
        updateType, // 'created', 'updated', 'deleted', 'status_change'
        device: deviceData,
        stats: await this.getCurrentDeviceStats()
      };

      // Broadcast to all connected clients
      if (this.wss.clients) {
        let sentCount = 0;
        this.wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
            sentCount++;
          }
        });

        secureLogger.info('Device update broadcasted', {
          updateType,
          deviceId: deviceData.deviceId || deviceData.id,
          sentCount
        });
      }

    } catch (error) {
      secureLogger.error('Failed to broadcast device update', {
        updateType,
        error: error.message,
        deviceData: deviceData.deviceId || deviceData.id
      });
    }
  }

  // Broadcast sync status updates
  async broadcastSyncStatus(syncData) {
    try {
      if (!this.wss) return;

      const message = {
        type: 'sync_status',
        timestamp: new Date().toISOString(),
        syncData: {
          status: syncData.status,
          lastSyncTime: syncData.lastSyncTime,
          syncInProgress: syncData.syncInProgress,
          created: syncData.created || 0,
          updated: syncData.updated || 0,
          errors: syncData.errors || null
        }
      };

      let sentCount = 0;
      if (this.wss.clients) {
        this.wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
            sentCount++;
          }
        });
      }

      secureLogger.info('Sync status broadcasted', {
        status: syncData.status,
        syncInProgress: syncData.syncInProgress,
        sentCount
      });

    } catch (error) {
      secureLogger.error('Failed to broadcast sync status', {
        error: error.message
      });
    }
  }

  // Broadcast new activity/log entries
  async broadcastActivity(activityData) {
    try {
      if (!this.wss) return;

      const message = {
        type: 'activity',
        timestamp: new Date().toISOString(),
        activity: activityData
      };

      let sentCount = 0;
      if (this.wss.clients) {
        this.wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
            sentCount++;
          }
        });
      }

      secureLogger.info('Activity broadcasted', {
        activityType: activityData.type,
        user: activityData.user,
        sentCount
      });

    } catch (error) {
      secureLogger.error('Failed to broadcast activity', {
        error: error.message,
        activityType: activityData.type
      });
    }
  }

  // Broadcast dashboard data updates
  async broadcastDashboardUpdate(dashboardData) {
    try {
      if (!this.wss) return;

      const message = {
        type: 'dashboard_update',
        timestamp: new Date().toISOString(),
        data: dashboardData
      };

      let sentCount = 0;
      if (this.wss.clients) {
        this.wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
            sentCount++;
          }
        });
      }

      secureLogger.info('Dashboard update broadcasted', {
        deviceCount: dashboardData.deviceStats?.totalDevices || 0,
        sentCount
      });

    } catch (error) {
      secureLogger.error('Failed to broadcast dashboard update', {
        error: error.message
      });
    }
  }

  // Get current device statistics for broadcasting
  async getCurrentDeviceStats() {
    try {
      const stats = await TailscaleDevice.aggregate([
        {
          $group: {
            _id: null,
            totalDevices: { $sum: 1 },
            onlineDevices: {
              $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
            },
            offlineDevices: {
              $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
            },
            criticalRisk: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] }
            },
            highRisk: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        criticalRisk: 0,
        highRisk: 0
      };

    } catch (error) {
      secureLogger.error('Failed to get current device stats', {
        error: error.message
      });
      
      return {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        criticalRisk: 0,
        highRisk: 0
      };
    }
  }

  // Get recent activity for broadcasting
  async getRecentActivity(limit = 5) {
    try {
      const activity = await TailscaleLog.find({})
        .sort({ ts: -1 })
        .limit(limit)
        .select('type user ts status device_name')
        .lean();

      return activity;

    } catch (error) {
      secureLogger.error('Failed to get recent activity', {
        error: error.message
      });
      
      return [];
    }
  }

  // Send periodic updates to connected clients
  startPeriodicUpdates(interval = 30000) { // 30 seconds
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const stats = await this.getCurrentDeviceStats();
        const activity = await this.getRecentActivity();

        await this.broadcastDashboardUpdate({
          deviceStats: stats,
          recentActivity: activity,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        secureLogger.error('Periodic update failed', {
          error: error.message
        });
      }
    }, interval);

    secureLogger.info('Periodic WebSocket updates started', {
      interval: `${interval / 1000}s`
    });
  }

  // Stop periodic updates
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      
      secureLogger.info('Periodic WebSocket updates stopped');
    }
  }

  // Get broadcasting statistics
  getBroadcastStats() {
    return {
      isInitialized: this.isInitialized,
      hasUpdateInterval: !!this.updateInterval,
      connectedClients: this.wss?.getStats()?.activeConnections || 0
    };
  }
}

export default new TailscaleWebSocketBroadcaster();
