import express from 'express'
import TailscaleLog from '../models/TailscaleLog.js'
import TailscaleDevice from '../models/TailscaleDevice.js'
import { verifyTailscaleSignature } from '../middleware/hmac.js'
import { validateTailscaleLog } from '../middleware/validation.js'
import lockedSyncService from '../services/tailscaleSyncLocked.js'
import tailscaleService from '../services/tailscale.js'

const router = express.Router()

/**
 * POST /api/tailscale/ingest
 * Accept Tailscale audit log stream
 */
router.post('/ingest', verifyTailscaleSignature, async (req, res) => {
  try {
    console.log('=== Tailscale Webhook Received ===')
    console.log('Headers:', req.headers)
    console.log('Body:', JSON.stringify(req.body, null, 2))
    console.log('Body type:', typeof req.body)
    console.log('Is array?', Array.isArray(req.body))

    const logs = Array.isArray(req.body) ? req.body : [req.body]
    console.log('Number of logs:', logs.length)

    // TEMPORARILY SKIP VALIDATION TO SEE RAW DATA
    const normalizedLogs = logs.map((log, index) => {
      // Convert Tailscale timestamp to our ts field
      if (log.timestamp && !log.ts) {
        log.ts = new Date(log.timestamp)
      }

      console.log(`Log ${index}:`, JSON.stringify(log, null, 2))
      return {
        ...log,
        source: 'audit_stream',
        ingested_at: new Date()
      }
    })

    if (normalizedLogs.length === 0) {
      console.log('No logs to process')
      return res.status(400).json({ error: 'No valid logs' })
    }

    // Insert into MongoDB
    console.log('Inserting', normalizedLogs.length, 'logs into MongoDB...')
    const result = await TailscaleLog.insertMany(normalizedLogs)
    console.log('Successfully inserted', result.length, 'logs')

    res.json({
      success: true,
      inserted: result.length,
      ids: result.map(r => r._id)
    })
  } catch (error) {
    console.error('Tailscale ingest error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/tailscale/agent
 * Accept logs from local Tailscale agent
 */
router.post('/agent', async (req, res) => {
  try {
    const logs = Array.isArray(req.body) ? req.body : [req.body]

    const normalizedLogs = logs.map(log => ({
      ts: new Date(log.ts || Date.now()),
      type: log.type || 'device_updated',
      node_id: log.node_id,
      user: log.user,
      src: log.src,
      dst: log.dst,
      event: log.event,
      raw: log.raw,
      source: 'local_agent',
      ingested_at: new Date()
    }))

    const result = await TailscaleLog.insertMany(normalizedLogs)

    res.json({
      success: true,
      inserted: result.length
    })
  } catch (error) {
    console.error('Tailscale agent error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/tailscale/recent
 * Get recent Tailscale logs
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const type = req.query.type

    let query = {}
    if (type) query.type = type

    const logs = await TailscaleLog.find(query)
      .sort({ ts: -1 })
      .limit(limit)

    res.json({ data: logs, total: logs.length })
  } catch (error) {
    console.error('Error fetching recent logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/tailscale/stats
 * Get Tailscale statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    // Active devices
    const activeDevices = await TailscaleLog.distinct('node_id', {
      ts: { $gte: since },
      type: { $in: ['peer_connected', 'device_updated'] }
    })

    // Active users
    const activeUsers = await TailscaleLog.distinct('user', {
      ts: { $gte: since }
    })

    // Peer connections
    const peerConnections = await TailscaleLog.countDocuments({
      ts: { $gte: since },
      type: 'peer_connected'
    })

    // Allowed/Denied events
    const allowedEvents = await TailscaleLog.countDocuments({
      ts: { $gte: since },
      status: 'success'
    })

    const deniedEvents = await TailscaleLog.countDocuments({
      ts: { $gte: since },
      status: 'failed'
    })

    // Events per hour
    const eventsPerHour = await TailscaleLog.aggregate([
      {
        $match: { ts: { $gte: since } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$ts' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Event types distribution
    const eventTypes = await TailscaleLog.aggregate([
      {
        $match: { ts: { $gte: since } }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      activeDevices: activeDevices.length,
      activeUsers: activeUsers.length,
      peerConnections,
      allowedEvents,
      deniedEvents,
      eventsPerHour,
      eventTypes
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/tailscale/events/:type
 * Get events by type
 */
router.get('/events/:type', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const { type } = req.params

    const logs = await TailscaleLog.find({ type })
      .sort({ ts: -1 })
      .limit(limit)

    res.json({ data: logs })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: error.message })
  }
})

// Test endpoint to verify MongoDB connectivity and data retrieval
router.get('/test-db', async (req, res) => {
  try {
    // Test connection by counting documents
    const count = await TailscaleLog.countDocuments();

    // Get some sample data
    const sampleData = await TailscaleLog.find().limit(5).sort({ ts: -1 }).lean();

    // Get collection stats
    const stats = await TailscaleLog.collection.stats();

    res.json({
      success: true,
      message: 'MongoDB connection successful!',
      stats: {
        totalDocuments: count,
        collectionStats: {
          size: stats.size,
          count: stats.count,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize
        }
      },
      sampleData,
      indexes: await TailscaleLog.collection.indexes()
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/tailscale/devices
 * Get all Tailscale devices from live API
 */
router.get('/devices', async (req, res) => {
  try {
    const { status, riskLevel, user, limit = 100, skip = 0 } = req.query;

    // Fetch devices from live Tailscale API
    const liveDevices = await tailscaleService.getDevices();

    // Transform live API data to match expected format
    const devices = liveDevices.map(device => ({
      id: device.id,
      name: device.name || device.hostname,
      ip: device.addresses?.[0] || 'Unknown IP',
      os: device.os || 'Unknown',
      status: device.connectedToControl ? 'online' : 'offline',
      lastSeen: device.lastSeen || 'Unknown',
      user: device.user || 'Unknown',
      nodeId: device.nodeId,
      hostname: device.hostname,
      clientVersion: device.clientVersion,
      authorized: device.authorized,
      isExternal: device.isExternal,
      tags: device.tags || [],
      location: device.location || null,
      riskLevel: 'low' // Default since API doesn't provide risk levels
    }));

    // Apply filters if specified
    let filteredDevices = devices;
    if (status) {
      filteredDevices = filteredDevices.filter(d => d.status === status);
    }
    if (riskLevel) {
      filteredDevices = filteredDevices.filter(d => d.riskLevel === riskLevel);
    }
    if (user) {
      filteredDevices = filteredDevices.filter(d => d.user.includes(user));
    }

    // Apply pagination
    const startIndex = parseInt(skip);
    const endIndex = startIndex + parseInt(limit);
    const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

    res.json({
      data: paginatedDevices,
      total: filteredDevices.length,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tailscale/devices/:id
 * Get a specific Tailscale device
 */
router.get('/devices/:id', async (req, res) => {
  try {
    const device = await TailscaleDevice.findOne({ deviceId: req.params.id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tailscale/sync
 * Manually trigger Tailscale sync
 */
router.post('/sync', async (req, res) => {
  try {
    const results = await lockedSyncService.manualSync();
    res.json({
      success: true,
      message: 'Tailscale sync completed',
      results
    });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tailscale/import-historical
 * Import historical logs from Tailscale API
 */
router.post('/import-historical', async (req, res) => {
  try {
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    console.log('Request body type:', typeof req.body);

    // Handle both number and object input
    let daysBack = 7;
    if (typeof req.body === 'number') {
      daysBack = req.body;
    } else if (req.body && typeof req.body.daysBack === 'number') {
      daysBack = req.body.daysBack;
    } else if (req.body && typeof req.body === 'object') {
      // Extract from object if sent incorrectly
      console.log('Parsing daysBack from object:', req.body);
      daysBack = parseInt(req.body) || 7;
      if (isNaN(daysBack)) {
        daysBack = 7;
      }
    }

    console.log(`Starting historical log import for last ${daysBack} days...`);

    // Fetch historical logs from Tailscale API
    const historicalLogs = await tailscaleService.getHistoricalLogs(daysBack);

    if (!historicalLogs || historicalLogs.length === 0) {
      return res.json({
        success: true,
        message: 'No historical logs found',
        imported: 0
      });
    }

    // Normalize logs for storage
    const normalizedLogs = historicalLogs.map(log => {
      // Convert Tailscale timestamp to our ts field
      if (log.timestamp && !log.ts) {
        log.ts = new Date(log.timestamp);
      }

      return {
        ...log,
        source: 'historical_import',
        ingested_at: new Date()
      };
    });

    // Check for duplicates to avoid re-inserting
    const existingIds = await TailscaleLog.distinct('timestamp', {
      source: 'historical_import'
    });

    const newLogs = normalizedLogs.filter(log =>
      !existingIds.includes(log.timestamp)
    );

    if (newLogs.length === 0) {
      return res.json({
        success: true,
        message: 'All logs already imported',
        imported: 0,
        total: historicalLogs.length
      });
    }

    // Insert in batches to avoid timeouts
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < newLogs.length; i += batchSize) {
      const batch = newLogs.slice(i, i + batchSize);
      const result = await TailscaleLog.insertMany(batch, { ordered: false });
      totalInserted += result.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.length} logs`);
    }

    console.log(`Historical import completed: ${totalInserted} new logs inserted`);

    res.json({
      success: true,
      message: 'Historical logs imported successfully',
      imported: totalInserted,
      total: historicalLogs.length,
      skipped: historicalLogs.length - totalInserted
    });

  } catch (error) {
    console.error('Historical import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tailscale/sync-status
 * Get sync status
 */
router.get('/sync-status', async (req, res) => {
  try {
    const status = lockedSyncService.getSyncStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tailscale/dashboard
 * Get dashboard summary data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Device stats
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

    // Recent activity
    const recentActivity = await TailscaleLog.find({
      ts: { $gte: since }
    })
      .sort({ ts: -1 })
      .limit(10);

    // Geographic distribution
    const geoDistribution = await TailscaleDevice.aggregate([
      { $match: { 'location.country': { $exists: true } } },
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 },
          devices: { $push: { name: '$name', status: '$status', riskLevel: '$riskLevel' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // OS distribution
    const osDistribution = await TailscaleDevice.aggregate([
      { $match: { os: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$os',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      deviceStats: deviceStats[0] || {},
      recentActivity,
      geoDistribution,
      osDistribution,
      syncStatus: {
        ...lockedSyncService.getSyncStatus(),
        status: 'success', // Add status field for frontend
        lastSyncTime: lockedSyncService.getSyncStatus().lastSyncTime || new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tailscale/dashboard-live
 * Get dashboard data directly from Tailscale API (no MongoDB cache)
 */
// Get network topology from Tailscale devices
router.get('/topology', async (req, res) => {
  try {
    const devices = await tailscaleService.getDevices();

    // Transform Tailscale devices into network nodes
    const nodes = devices.map(device => ({
      id: device.nodeId || device.name || device.addresses?.[0] || 'unknown',
      name: device.name || device.hostname || 'Unknown',
      ip: device.addresses?.[0] || 'unknown',
      status: device.connectedToControl ? 'online' : 'offline',
      os: device.os || 'unknown',
      lastSeen: device.lastSeen || new Date().toISOString(),
      clientVersion: device.clientVersion || 'unknown',
      tags: device.tags || [],
      capabilities: device.capabilities || [],
      // Add geo data if available (Tailscale doesn't provide this by default)
      geo: {
        country: 'Unknown',
        city: 'Unknown',
        lat: 0,
        lon: 0
      }
    }));

    // Create connections between nodes based on Tailscale network
    const edges = [];
    const onlineNodes = nodes.filter(node => node.status === 'online');

    // Connect all online nodes in a mesh pattern (simplified)
    for (let i = 0; i < onlineNodes.length - 1; i++) {
      for (let j = i + 1; j < onlineNodes.length; j++) {
        edges.push({
          source: onlineNodes[i].id,
          target: onlineNodes[j].id,
          type: 'tailscale_connection',
          severity: 'Normal', // All Tailscale connections are secure
          count: 1
        });
      }
    }

    res.json({
      success: true,
      data: {
        nodes,
        edges,
        totalNodes: nodes.length,
        onlineNodes: onlineNodes.length,
        offlineNodes: nodes.length - onlineNodes.length
      }
    });
  } catch (error) {
    console.error('Error fetching Tailscale topology:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network topology'
    });
  }
});

router.get('/dashboard-live', async (req, res) => {
  try {
    console.log('Fetching live data from Tailscale API...');

    // Fetch devices directly from Tailscale API
    const devices = await tailscaleService.getDevices();

    // Calculate device stats from live data
    const deviceStats = {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.connectedToControl).length,
      offlineDevices: devices.filter(d => !d.connectedToControl).length,
      criticalRisk: 0, // Tailscale API doesn't provide risk levels
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0
    };

    // Get recent logs from MongoDB (since Tailscale API doesn't provide activity logs)
    const recentActivity = await TailscaleLog.find({
      ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .sort({ ts: -1 })
      .limit(10);

    // Geographic distribution - use cached data since live API doesn't provide locations
    const cachedDevices = await TailscaleDevice.find({}).lean();
    const geoDistribution = cachedDevices
      .filter(d => d.location && d.location.country)
      .reduce((acc, device) => {
        const country = device.location.country;
        if (!acc[country]) {
          acc[country] = { _id: country, count: 0, devices: [] };
        }
        acc[country].count++;
        acc[country].devices.push({
          name: device.name,
          status: device.status,
          riskLevel: device.riskLevel || 'low'
        });
        return acc;
      }, {});

    // OS distribution from live devices
    const osDistribution = devices
      .filter(d => d.os)
      .reduce((acc, device) => {
        const os = device.os;
        acc[os] = (acc[os] || 0) + 1;
        return acc;
      }, {});

    const osDistributionArray = Object.entries(osDistribution).map(([os, count]) => ({
      _id: os,
      count
    }));

    res.json({
      deviceStats,
      recentActivity,
      geoDistribution: Object.values(geoDistribution),
      osDistribution: osDistributionArray,
      syncStatus: {
        status: 'success',
        lastSyncTime: new Date(),
        source: 'live_api'
      },
      source: 'live_tailscale_api'
    });
  } catch (error) {
    console.error('Error fetching live Tailscale data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router
