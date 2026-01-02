import mongoose from 'mongoose'
import Log from '../models/Log.js'
import Event from '../models/Event.js'
import BlockedIP from '../models/BlockedIP.js'
import SafeIP from '../models/SafeIP.js'
import AlertRule from '../models/AlertRule.js'
import AlertEvent from '../models/AlertEvent.js'
import User from '../models/User.js'

const MONGODB_URI = 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

const seedData = {
  logs: [
    {
      timestamp: new Date('2025-01-01T12:00:00Z'),
      source_ip: '192.168.1.10',
      dest_ip: '8.8.8.8',
      severity: 'LOW',
      log_type: 'DNS',
      endpoint: 'dns-server-1',
      geo: { country: 'IN', city: 'Delhi', lat: 28.6139, lon: 77.2090 },
      raw: { query: 'example.com' }
    },
    {
      timestamp: new Date('2025-01-01T13:00:00Z'),
      source_ip: '192.168.1.20',
      dest_ip: '1.1.1.1',
      severity: 'MEDIUM',
      log_type: 'HTTP',
      endpoint: 'web-server-1',
      geo: { country: 'IN', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      raw: { method: 'GET', path: '/api/data' }
    },
    {
      timestamp: new Date('2025-01-01T14:00:00Z'),
      source_ip: '192.168.1.30',
      dest_ip: '203.197.200.1',
      severity: 'HIGH',
      log_type: 'FIREWALL',
      endpoint: 'firewall-1',
      geo: { country: 'IN', city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      raw: { action: 'BLOCKED', reason: 'Port scan detected' }
    }
  ],
  events: [
    {
      '@timestamp': new Date('2025-01-01T12:00:00Z'),
      host: { name: 'server-1', ip: '192.168.1.10' },
      source: { ip: '192.168.1.10', port: 49434 },
      destination: { ip: '8.8.8.8', port: 53 },
      event: { action: 'network_flow', severity: 'Low', category: 'network' },
      network: { transport: 'udp', bytes: 256 }
    },
    {
      '@timestamp': new Date('2025-01-01T13:00:00Z'),
      host: { name: 'server-2', ip: '192.168.1.20' },
      source: { ip: '192.168.1.20', port: 50000 },
      destination: { ip: '1.1.1.1', port: 443 },
      event: { action: 'connection_established', severity: 'Medium', category: 'network' },
      network: { transport: 'tcp', bytes: 1024 }
    }
  ],
  topologyCoords: [
    {
      node: '192.168.1.10',
      type: 'internal',
      coords: { x: 100, y: 250 },
      alerts: 1,
      meta: { hostname: 'server-1', os: 'Linux' }
    },
    {
      node: '8.8.8.8',
      type: 'external',
      coords: { x: 400, y: 250 },
      alerts: 0,
      meta: { hostname: 'google-dns', provider: 'Google' }
    }
  ],
  topologyEdges: [
    {
      source: '192.168.1.10',
      target: '8.8.8.8',
      bytes: 120000,
      flows: 15,
      severity: 'LOW'
    }
  ],
  blockedIPs: [
    {
      ip: '203.197.200.100',
      reason: 'Suspicious activity detected',
      severity: 'High',
      notes: 'Multiple failed login attempts'
    },
    {
      ip: '192.168.1.999',
      reason: 'Malware communication',
      severity: 'Critical',
      notes: 'C2 server communication detected'
    }
  ],
  safeIPs: [
    {
      ip: '8.8.8.8',
      notes: 'Google DNS server',
      confidence: 'High',
      tags: ['dns', 'google', 'trusted']
    },
    {
      ip: '1.1.1.1',
      notes: 'Cloudflare DNS',
      confidence: 'High',
      tags: ['dns', 'cloudflare', 'trusted']
    }
  ],
  alertRules: [
    {
      name: 'High Traffic Alert',
      description: 'Alert when IP generates high traffic',
      condition: {
        type: 'traffic_threshold',
        threshold: 1000
      },
      actions: [
        { type: 'notification', severity: 'Medium' }
      ],
      severity: 'Medium'
    }
  ],
  alertEvents: [
    {
      title: 'Suspicious Activity Detected',
      description: 'IP 203.197.200.100 showing unusual behavior',
      severity: 'High',
      source_ip: '203.197.200.100',
      dest_ip: '192.168.1.10'
    }
  ]
}

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✓ Connected to MongoDB')

    // Seed logs
    const logCount = await Log.countDocuments()
    if (logCount === 0) {
      await Log.insertMany(seedData.logs)
      console.log('✓ Seeded logs collection with', seedData.logs.length, 'entries')
    } else {
      console.log('✓ Logs collection already has data:', logCount, 'documents')
    }

    // Seed events
    const eventCount = await Event.countDocuments()
    if (eventCount === 0) {
      await Event.insertMany(seedData.events)
      console.log('✓ Seeded events collection with', seedData.events.length, 'entries')
    } else {
      console.log('✓ Events collection already has data:', eventCount, 'documents')
    }

    // Seed topology_coords
    const db = mongoose.connection.db
    const topologyCoordsColl = db.collection('topology_coords')
    const coordCount = await topologyCoordsColl.countDocuments()
    if (coordCount === 0) {
      await topologyCoordsColl.insertMany(seedData.topologyCoords)
      console.log('✓ Seeded topology_coords collection with', seedData.topologyCoords.length, 'entries')
    } else {
      console.log('✓ topology_coords collection already has data:', coordCount, 'documents')
    }

    // Seed topology_edges
    const topologyEdgesColl = db.collection('topology_edges')
    const edgeCount = await topologyEdgesColl.countDocuments()
    if (edgeCount === 0) {
      await topologyEdgesColl.insertMany(seedData.topologyEdges)
      console.log('✓ Seeded topology_edges collection with', seedData.topologyEdges.length, 'entries')
    } else {
      console.log('✓ topology_edges collection already has data:', edgeCount, 'documents')
    }

    // Seed blocked_ips
    const blockedCount = await BlockedIP.countDocuments()
    if (blockedCount === 0) {
      // Add created_by field (use first user or create a default)
      const defaultUser = await User.findOne()
      const createdBy = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId()
      
      const blockedIPsWithUser = seedData.blockedIPs.map(ip => ({
        ...ip,
        created_by: createdBy
      }))
      
      await BlockedIP.insertMany(blockedIPsWithUser)
      console.log('✓ Seeded blocked_ips collection with', blockedIPsWithUser.length, 'entries')
    } else {
      console.log('✓ blocked_ips collection already has data:', blockedCount, 'documents')
    }

    // Seed safe_ips (using SafeIP model)
    const safeCount = await SafeIP.countDocuments()
    if (safeCount === 0) {
      const defaultUser = await User.findOne()
      const createdBy = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId()
      
      const safeIPsWithUser = seedData.safeIPs.map(ip => ({
        ...ip,
        created_by: createdBy
      }))
      
      await SafeIP.insertMany(safeIPsWithUser)
      console.log('✓ Seeded safe_ips collection with', safeIPsWithUser.length, 'entries')
    } else {
      console.log('✓ safe_ips collection already has data:', safeCount, 'documents')
    }

    // Seed alert_rules
    const alertRulesCount = await AlertRule.countDocuments()
    if (alertRulesCount === 0) {
      const defaultUser = await User.findOne()
      const createdBy = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId()
      
      const alertRulesWithUser = seedData.alertRules.map(rule => ({
        ...rule,
        created_by: createdBy
      }))
      
      await AlertRule.insertMany(alertRulesWithUser)
      console.log('✓ Seeded alert_rules collection with', alertRulesWithUser.length, 'entries')
    } else {
      console.log('✓ alert_rules collection already has data:', alertRulesCount, 'documents')
    }

    // Seed alert_events
    const alertEventsCount = await AlertEvent.countDocuments()
    if (alertEventsCount === 0) {
      const defaultUser = await User.findOne()
      const createdBy = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId()
      
      const alertEventsWithUser = seedData.alertEvents.map(event => ({
        ...event,
        created_by: createdBy
      }))
      
      await AlertEvent.insertMany(alertEventsWithUser)
      console.log('✓ Seeded alert_events collection with', alertEventsWithUser.length, 'entries')
    } else {
      console.log('✓ alert_events collection already has data:', alertEventsCount, 'documents')
    }

    console.log('\n✅ Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error.message)
    process.exit(1)
  }
}

seedDatabase()
