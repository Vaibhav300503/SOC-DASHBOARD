import mongoose from 'mongoose'
import Log from '../models/Log.js'

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/soc-platform'

async function createTestLogs() {
  try {
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Create test logs with different severities
    const testLogs = [
      // Critical logs
      ...Array(5).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        severity: 'Critical',
        source_ip: `192.168.1.${100 + i}`,
        dest_ip: '10.0.0.1',
        endpoint: `endpoint-${i + 1}`,
        log_type: 'security',
        metadata: {
          log_source: 'Critical Alert System',
          endpoint_name: `endpoint-${i + 1}`,
          os_type: 'Windows'
        },
        raw_data: {
          message: 'Critical security breach detected',
          description: 'Unauthorized access attempt - Critical',
          status: 'BLOCKED'
        },
        geo: {
          country: 'US',
          city: 'New York'
        }
      })),
      
      // High logs
      ...Array(10).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        severity: 'High',
        source_ip: `192.168.2.${100 + i}`,
        dest_ip: '10.0.0.2',
        endpoint: `endpoint-${i + 6}`,
        log_type: 'firewall',
        metadata: {
          log_source: 'Security Firewall',
          endpoint_name: `endpoint-${i + 6}`,
          os_type: 'Linux'
        },
        raw_data: {
          message: 'Intrusion attempt detected',
          description: 'Malware signature matched',
          status: 'DENIED'
        },
        geo: {
          country: 'US',
          city: 'Los Angeles'
        }
      })),
      
      // Medium logs
      ...Array(15).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        severity: 'Medium',
        source_ip: `192.168.3.${100 + i}`,
        dest_ip: '10.0.0.3',
        endpoint: `endpoint-${i + 16}`,
        log_type: 'system',
        metadata: {
          log_source: 'System Error Log',
          endpoint_name: `endpoint-${i + 16}`,
          os_type: 'Windows'
        },
        raw_data: {
          message: 'Error: Connection timeout',
          description: 'Failed to establish connection',
          status: 'ERROR'
        },
        geo: {
          country: 'US',
          city: 'Chicago'
        }
      })),
      
      // Low logs
      ...Array(20).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        severity: 'Low',
        source_ip: `192.168.4.${100 + i}`,
        dest_ip: '10.0.0.4',
        endpoint: `endpoint-${i + 31}`,
        log_type: 'application',
        metadata: {
          log_source: 'Application Log',
          endpoint_name: `endpoint-${i + 31}`,
          os_type: 'Linux'
        },
        raw_data: {
          message: 'User login successful',
          description: 'Normal user activity',
          status: 'SUCCESS'
        },
        geo: {
          country: 'US',
          city: 'Seattle'
        }
      }))
    ]

    // Insert test logs
    const result = await Log.insertMany(testLogs)
    console.log(`✅ Created ${result.length} test logs`)

    // Show distribution
    const distribution = await Log.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    console.log('\n📊 Log Distribution:')
    distribution.forEach(item => {
      console.log(`  ${item._id}: ${item.count} logs`)
    })

    await mongoose.connection.close()
    console.log('\n✅ Done')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createTestLogs()
