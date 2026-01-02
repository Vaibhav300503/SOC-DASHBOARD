import express from 'express';
import TailscaleDevice from '../models/TailscaleDevice.js';
import TailscaleLog from '../models/TailscaleLog.js';
import authMiddleware from '../middleware/authMiddleware.js';
import lockedSyncService from '../services/tailscaleSyncLocked.js';
import secureLogger from '../middleware/secureLogger.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

/**
 * GET /api/tailscale/dashboard
 * Protected dashboard endpoint - requires viewer role
 */
router.get('/dashboard', authMiddleware.requireRole('viewer'), async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Device stats with aggregation - show all devices for admin, user's devices for others
    const deviceMatch = req.user.role === 'admin' ? {} : { user: req.user.email };
    
    const deviceStats = await TailscaleDevice.aggregate([
      { $match: deviceMatch },
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
          },
          mediumRisk: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] }
          },
          lowRisk: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] }
          }
        }
      }
    ]);

    // Recent activity for user's devices (or all for admin)
    const activityMatch = req.user.role === 'admin' 
      ? { ts: { $gte: since } }
      : { 
          $or: [
            { user: req.user.email, ts: { $gte: since } },
            { 'device.user': req.user.email, ts: { $gte: since } }
          ]
        };

    const recentActivity = await TailscaleLog.find(activityMatch)
      .sort({ ts: -1 })
      .limit(10);

    // Geographic distribution (user's devices only, or all for admin)
    const geoMatch = req.user.role === 'admin' 
      ? { 'location.country': { $exists: true } }
      : { 
          user: req.user.email,
          'location.country': { $exists: true } 
        };

    const geoDistribution = await TailscaleDevice.aggregate([
      { $match: geoMatch },
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 },
          devices: { $push: { name: '$name', status: '$status', riskLevel: '$riskLevel' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get sync status
    const syncStatus = await lockedSyncService.getSyncStatus();

    const dashboardData = {
      deviceStats: deviceStats[0] || {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        criticalRisk: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0
      },
      recentActivity,
      geoDistribution,
      syncStatus,
      userRole: req.user.role,
      permissions: req.user.permissions
    };

    secureLogger.info('Dashboard data retrieved', {
      userId: req.user.id,
      deviceCount: dashboardData.deviceStats.totalDevices,
      timeRange
    });

    res.json(dashboardData);

  } catch (error) {
    secureLogger.error('Dashboard fetch failed', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      code: 'DASHBOARD_FETCH_FAILED'
    });
  }
});

/**
 * GET /api/tailscale/devices
 * Protected devices endpoint - requires analyst role
 */
router.get('/devices', authMiddleware.requireRole('analyst'), async (req, res) => {
  try {
    const { status, riskLevel, user, limit = 100, skip = 0 } = req.query;
    
    // Build query with user filtering
    let query = {};
    
    // Non-admin users can only see their own devices
    if (req.user.role !== 'admin') {
      query.user = req.user.email;
    }
    
    // Apply filters
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;
    if (user && req.user.role === 'admin') query.user = user;

    const devices = await TailscaleDevice.find(query)
      .sort({ lastSeen: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v'); // Exclude version field

    const total = await TailscaleDevice.countDocuments(query);

    // Statistics
    const stats = await TailscaleDevice.aggregate([
      { $match: query },
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
          highRiskDevices: {
            $sum: { $cond: [{ $in: ['$riskLevel', ['high', 'critical']] }, 1, 0] }
          }
        }
      }
    ]);

    secureLogger.info('Devices retrieved', {
      userId: req.user.id,
      query,
      resultCount: devices.length,
      total
    });

    res.json({
      data: devices,
      total,
      stats: stats[0] || {},
      query,
      userRole: req.user.role
    });
    
  } catch (error) {
    secureLogger.error('Devices fetch failed', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to fetch devices',
      code: 'DEVICES_FETCH_FAILED'
    });
  }
});

/**
 * GET /api/tailscale/devices/:id
 * Get specific device - requires device ownership or admin role
 */
router.get('/devices/:id', async (req, res) => {
  try {
    const device = await TailscaleDevice.findOne({ deviceId: req.params.id });
    
    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        code: 'DEVICE_NOT_FOUND'
      });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && device.user !== req.user.email) {
      secureLogger.logSecurityEvent('Unauthorized device access attempt', {
        userId: req.user.id,
        deviceId: req.params.id,
        deviceOwner: device.user,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    secureLogger.info('Device retrieved', {
      userId: req.user.id,
      deviceId: req.params.id,
      deviceName: device.name
    });
    
    res.json(device);
    
  } catch (error) {
    secureLogger.error('Device fetch failed', {
      userId: req.user.id,
      deviceId: req.params.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to fetch device',
      code: 'DEVICE_FETCH_FAILED'
    });
  }
});

/**
 * POST /api/tailscale/sync
 * Manual sync - requires analyst role
 */
router.post('/sync', authMiddleware.requireRole('analyst'), async (req, res) => {
  try {
    secureLogger.info('Manual sync initiated', {
      userId: req.user.id,
      role: req.user.role
    });
    
    const results = await lockedSyncService.manualSync();
    
    if (results.success) {
      secureLogger.info('Manual sync completed', {
        userId: req.user.id,
        results: {
          created: results.created,
          updated: results.updated,
          offline: results.offline,
          invalid: results.invalid
        }
      });
      
      res.json({
        success: true,
        message: 'Tailscale sync completed successfully',
        results: {
          created: results.created,
          updated: results.updated,
          offline: results.offline,
          invalid: results.invalid,
          lockId: results.lockId
        },
        syncType: 'manual'
      });
    } else {
      secureLogger.warn('Manual sync failed', {
        userId: req.user.id,
        reason: results.reason,
        error: results.error
      });
      
      res.status(400).json({
        success: false,
        message: results.reason || 'Sync failed',
        error: results.error,
        code: 'SYNC_FAILED'
      });
    }
    
  } catch (error) {
    secureLogger.error('Manual sync error', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal sync error',
      error: error.message,
      code: 'SYNC_INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/tailscale/sync-status
 * Get sync status - requires viewer role
 */
router.get('/sync-status', authMiddleware.requireRole('viewer'), async (req, res) => {
  try {
    const status = await lockedSyncService.getSyncStatus();
    
    secureLogger.info('Sync status retrieved', {
      userId: req.user.id,
      syncInProgress: status.syncInProgress,
      canStartSync: status.canStartSync
    });
    
    res.json(status);
    
  } catch (error) {
    secureLogger.error('Sync status fetch failed', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to fetch sync status',
      code: 'SYNC_STATUS_FAILED'
    });
  }
});

/**
 * POST /api/tailscale/force-unlock
 * Force unlock sync - requires admin role
 */
router.post('/force-unlock', authMiddleware.requireRole('admin'), async (req, res) => {
  try {
    secureLogger.logSecurityEvent('Force sync unlock initiated', {
      userId: req.user.id,
      role: req.user.role,
      ip: req.ip
    });
    
    const result = await lockedSyncService.forceUnlock();
    
    if (result.success) {
      secureLogger.info('Force sync unlock completed', {
        userId: req.user.id,
        unlockedLock: result.unlockedLock
      });
      
      res.json({
        success: true,
        message: 'Sync lock force-released',
        unlockedLock: result.unlockedLock
      });
    } else {
      secureLogger.warn('Force unlock failed', {
        userId: req.user.id,
        reason: result.reason
      });
      
      res.status(400).json({
        success: false,
        message: result.reason || 'Force unlock failed',
        code: 'FORCE_UNLOCK_FAILED'
      });
    }
    
  } catch (error) {
    secureLogger.error('Force unlock error', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal error during force unlock',
      error: error.message,
      code: 'FORCE_UNLOCK_INTERNAL_ERROR'
    });
  }
});

export default router;
