import mongoose from 'mongoose';
import TailscaleDevice from '../models/TailscaleDevice.js';
import { validateDeviceBatch } from '../middleware/tailscaleValidation.js';
import geoip from 'geoip-lite';
import tailscaleService from './tailscale.js';
import secureLogger from '../middleware/secureLogger.js';
import websocketBroadcaster from '../routes/tailscale-websocket-protected.js';

class AtomicTailscaleSyncService {
  constructor() {
    this.session = null;
  }

  // Atomic device sync (without transactions for standalone MongoDB)
  async syncDevicesAtomic() {
    try {
      console.log('🔒 Starting atomic Tailscale device sync...');
      
      // Get current devices from API
      const devices = await this.fetchDevicesFromAPI();
      
      // Validate all devices before any writes
      const validation = validateDeviceBatch(devices);
      
      if (validation.invalidCount > 0) {
        console.warn(`⚠️  ${validation.invalidCount} invalid devices rejected`);
        validation.invalidDevices.forEach(invalid => {
          console.error('Invalid device:', invalid.errors.map(e => e.message));
        });
      }
      
      if (validation.validCount === 0) {
        throw new Error('No valid devices to sync');
      }
      
      // Process devices in batches (without transactions)
      const batchSize = 50;
      const batches = this.chunkArray(validation.validDevices, batchSize);
      
      let totalCreated = 0;
      let totalUpdated = 0;
      
      for (const batch of batches) {
        const batchResult = await this.processBatchAtomic(batch);
        totalCreated += batchResult.created;
        totalUpdated += batchResult.updated;
      }
      
      // Mark devices as offline if they haven't been seen in API response
      const offlineResult = await this.markOfflineDevicesAtomic(
        validation.validDevices.map(d => d.id)
      );
      
      console.log(`✅ Atomic sync completed: ${totalCreated} created, ${totalUpdated} updated, ${offlineResult.offline} marked offline`);
      
      // Broadcast sync completion to WebSocket clients
      await websocketBroadcaster.broadcastSyncStatus({
        status: 'success',
        lastSyncTime: new Date(),
        syncInProgress: false,
        created: totalCreated,
        updated: totalUpdated,
        offline: offlineResult.offline,
        invalid: validation.invalidCount
      });
      
      // Broadcast device updates
      if (totalCreated > 0 || totalUpdated > 0) {
        await websocketBroadcaster.broadcastDeviceUpdate('sync_completed', {
          created: totalCreated,
          updated: totalUpdated,
          totalDevices: validation.validCount
        });
      }
      
      // Also sync audit logs
      await this.syncAuditLogs();
      
      return {
        success: true,
        created: totalCreated,
        updated: totalUpdated,
        offline: offlineResult.offline,
        invalid: validation.invalidCount
      };
      
    } catch (error) {
      console.error('❌ Atomic sync failed:', error);
      
      // Broadcast sync failure to WebSocket clients
      try {
        await websocketBroadcaster.broadcastSyncStatus({
          status: 'error',
          lastSyncTime: null,
          syncInProgress: false,
          errors: error.message
        });
      } catch (broadcastError) {
        console.error('Failed to broadcast sync failure:', broadcastError.message);
      }
      
      throw error;
    }
  }

  // Process a batch of devices atomically
  async processBatchAtomic(devices) {
    const bulkOps = devices.map(device => {
      const enrichedDevice = this.enrichDeviceData(device);
      
      return {
        updateOne: {
          filter: { deviceId: device.id },
          update: { 
            $set: enrichedDevice,
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      };
    });

    const result = await TailscaleDevice.bulkWrite(bulkOps, { 
      ordered: false // Continue on errors
    });

    return {
      created: result.upsertedCount || 0,
      updated: result.modifiedCount || 0
    };
  }

  // Mark devices as offline if they're not in current API response
  async markOfflineDevicesAtomic(currentDeviceIds) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const result = await TailscaleDevice.updateMany(
      { 
        deviceId: { $nin: currentDeviceIds },
        lastSeen: { $gte: thirtyMinutesAgo },
        status: { $ne: 'offline' }
      },
      { 
        $set: { 
          status: 'offline', 
          updatedAt: new Date(),
          lastSeen: new Date()
        }
      }
    );

    return { offline: result.modifiedCount };
  }

  // Enrich device data with location and risk assessment
  enrichDeviceData(device) {
    const location = this.getDeviceLocation(device.addresses);
    const riskLevel = this.calculateRiskLevel(device, location);
    const status = this.determineDeviceStatus(device.lastSeen);

    return {
      deviceId: device.id,
      name: device.name,
      user: device.user,
      hostname: device.hostname,
      os: device.os,
      created: new Date(device.created),
      lastSeen: new Date(device.lastSeen),
      ipAddresses: device.addresses || [],
      tags: device.tags || [],
      authorized: device.authorized || false,
      isExternal: device.isExternal || false,
      expires: device.expires ? new Date(device.expires) : null,
      clientVersion: device.clientVersion,
      location,
      status,
      riskLevel,
      updatedAt: new Date()
    };
  }

  // Helper methods (reuse from existing service)
  getDeviceLocation(ipAddresses) {
    if (!ipAddresses || ipAddresses.length === 0) return null;
    
    const publicIp = ipAddresses.find(ip => !this.isPrivateIP(ip));
    if (!publicIp) return null;
    
    const geo = geoip.lookup(publicIp);
    if (!geo) return null;
    
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
      /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./,
      /^127\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/
    ];
    return privateRanges.some(range => range.test(ip));
  }

  calculateRiskLevel(device, location) {
    let riskScore = 0;
    
    if (device.isExternal) riskScore += 2;
    if (!device.authorized) riskScore += 3;
    if (device.expires && new Date(device.expires) < new Date()) riskScore += 4;
    if (!location) riskScore += 1;
    if (device.os && ['unknown', 'custom'].includes(device.os.toLowerCase())) riskScore += 1;
    
    if (riskScore >= 4) return 'critical';
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }

  determineDeviceStatus(lastSeen) {
    if (!lastSeen) return 'unknown';
    
    const diffMinutes = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60);
    
    if (diffMinutes <= 5) return 'online';
    if (diffMinutes <= 60) return 'offline'; // Changed from 30 to 60 minutes
    return 'offline'; // Changed from 'unknown' to 'offline' for older devices
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Actual API fetch from Tailscale
  async fetchDevicesFromAPI() {
    try {
      secureLogger.info('Fetching devices from Tailscale API...');
      
      const devices = await tailscaleService.getDevices();
      
      if (!Array.isArray(devices)) {
        throw new Error('Invalid response from Tailscale API - expected array');
      }
      
      secureLogger.info('Tailscale API response received', {
        deviceCount: devices.length,
        timestamp: new Date().toISOString()
      });
      
      return devices;
      
    } catch (error) {
      secureLogger.error('Failed to fetch devices from Tailscale API', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Re-throw with more context
      throw new Error(`Tailscale API fetch failed: ${error.message}`);
    }
  }

  // Sync audit logs from Tailscale API
  async syncAuditLogs() {
    try {
      secureLogger.info('Fetching audit logs from Tailscale API...');
      
      const logs = await tailscaleService.getHistoricalLogs(1); // Fetch last day's logs
      
      if (!Array.isArray(logs) || logs.length === 0) {
        secureLogger.info('No audit logs found');
        return { fetched: 0, inserted: 0 };
      }
      
      // Normalize logs for storage
      const normalizedLogs = logs.map(log => ({
        ...log,
        ts: log.timestamp ? new Date(log.timestamp) : new Date(),
        source: 'sync_audit',
        ingested_at: new Date()
      }));
      
      // Check for existing logs to avoid duplicates
      const existingTimestamps = await TailscaleLog.distinct('timestamp', {
        source: 'sync_audit'
      });
      
      const newLogs = normalizedLogs.filter(log => 
        !existingTimestamps.includes(log.timestamp)
      );
      
      if (newLogs.length > 0) {
        await TailscaleLog.insertMany(newLogs, { ordered: false });
        secureLogger.info(`Inserted ${newLogs.length} new audit logs`);
      } else {
        secureLogger.info('No new audit logs to insert');
      }
      
      return { fetched: logs.length, inserted: newLogs.length };
      
    } catch (error) {
      secureLogger.error('Failed to sync audit logs', {
        error: error.message
      });
      // Don't throw - audit log sync failure shouldn't break device sync
      return { fetched: 0, inserted: 0, error: error.message };
    }
  }
}

export default new AtomicTailscaleSyncService();
