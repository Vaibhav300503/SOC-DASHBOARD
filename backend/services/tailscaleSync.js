import tailscaleService from './tailscale.js';
import TailscaleDevice from '../models/TailscaleDevice.js';
import geoip from 'geoip-lite';
import { broadcastDashboardUpdate } from '../routes/tailscale-websocket.js';

class TailscaleSyncService {
  constructor() {
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.isRunning = false;
    this.lastSyncTime = null;
  }

  async syncDevices() {
    if (this.isRunning) {
      console.log('Tailscale sync already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting Tailscale device sync...');

    try {
      const devices = await tailscaleService.getDevices();
      const syncResults = {
        updated: 0,
        created: 0,
        errors: 0,
        total: devices.length
      };

      for (const device of devices) {
        try {
          // Add location data based on IP
          const location = this.getDeviceLocation(device.addresses);
          
          // Determine device status
          const status = this.determineDeviceStatus(device);
          
          // Calculate risk level
          const riskLevel = this.calculateRiskLevel(device, location);

          const deviceData = {
            deviceId: device.id,
            name: device.name,
            user: device.user,
            hostname: device.hostname,
            os: device.os,
            created: new Date(device.created),
            lastSeen: new Date(device.lastSeen),
            ipAddresses: device.addresses || [],
            tags: device.tags || [],
            nodeKey: device.nodeKey,
            addresses: device.addresses || [],
            apiVersion: device.apiVersion,
            clientVersion: device.clientVersion,
            updateAvailable: device.updateAvailable || false,
            authorized: device.authorized || false,
            isExternal: device.isExternal || false,
            blocksIncomingConnections: device.blocksIncomingConnections || false,
            keyExpiryDisabled: device.keyExpiryDisabled || false,
            expires: device.expires ? new Date(device.expires) : null,
            enabledRoutes: device.enabledRoutes || [],
            advertisedRoutes: device.advertisedRoutes || [],
            clientConnectivity: device.clientConnectivity || {},
            location,
            status,
            riskLevel,
            updatedAt: new Date()
          };

          const result = await TailscaleDevice.findOneAndUpdate(
            { deviceId: device.id },
            deviceData,
            { upsert: true, new: true }
          );

          if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            syncResults.created++;
          } else {
            syncResults.updated++;
          }

        } catch (error) {
          console.error(`Error syncing device ${device.id}:`, error.message);
          syncResults.errors++;
        }
      }

      this.lastSyncTime = new Date();
      console.log(`Tailscale sync completed: ${syncResults.created} created, ${syncResults.updated} updated, ${syncResults.errors} errors`);
      
      // Broadcast update to all connected clients
      try {
        const deviceStats = await TailscaleDevice.aggregate([
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
        
        broadcastDashboardUpdate('device_update', {
          deviceStats: deviceStats[0] || {},
          syncStatus: {
            lastSyncTime: this.lastSyncTime,
            status: 'success'
          }
        });
      } catch (broadcastError) {
        console.error('Failed to broadcast update:', broadcastError);
      }
      
      return syncResults;

    } catch (error) {
      console.error('Tailscale sync failed:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  getDeviceLocation(ipAddresses) {
    if (!ipAddresses || ipAddresses.length === 0) {
      return null;
    }

    // Use the first non-private IP for geolocation
    const publicIp = ipAddresses.find(ip => !this.isPrivateIP(ip));
    if (!publicIp) {
      return null;
    }

    const geo = geoip.lookup(publicIp);
    if (!geo) {
      return null;
    }

    return {
      country: geo.country,
      country_code: geo.country,
      city: geo.city,
      region: geo.region,
      latitude: geo.ll[0],
      longitude: geo.ll[1]
    };
  }

  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  determineDeviceStatus(device) {
    if (!device.lastSeen) return 'unknown';
    
    const lastSeen = new Date(device.lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes <= 5) return 'online';
    if (diffMinutes <= 30) return 'offline';
    return 'unknown';
  }

  calculateRiskLevel(device, location) {
    let riskScore = 0;

    // External device increases risk
    if (device.isExternal) riskScore += 2;

    // Unauthorized device is high risk
    if (!device.authorized) riskScore += 3;

    // Expired key is critical
    if (device.expires && new Date(device.expires) < new Date()) riskScore += 4;

    // Unknown location increases risk
    if (!location) riskScore += 1;

    // Certain OS types might be higher risk
    if (device.os && ['unknown', 'custom'].includes(device.os.toLowerCase())) riskScore += 1;

    // Convert score to risk level
    if (riskScore >= 4) return 'critical';
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }

  startAutoSync() {
    // Initial sync
    this.syncDevices();

    // Set up recurring sync
    setInterval(() => {
      this.syncDevices();
    }, this.syncInterval);

    console.log(`Tailscale auto-sync started (interval: ${this.syncInterval / 1000} seconds)`);
  }

  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval
    };
  }
}

export default new TailscaleSyncService();
