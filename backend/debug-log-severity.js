import 'dotenv/config'
import mongoose from 'mongoose'
import Log from './models/Log.js'

const mongoUri = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

async function debugLogSeverity() {
  try {
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Get sample logs to see what metadata they have
    const sampleLogs = await Log.find().limit(10).lean()

    console.log('\n📋 Sample Logs (first 10):')
    sampleLogs.forEach((log, idx) => {
      console.log(`\n[${idx + 1}]`)
      console.log('  severity:', log.severity)
      console.log('  metadata.log_source:', log.metadata?.log_source)
      console.log('  raw_data.log_source:', log.raw_data?.log_source)
      console.log('  log_type:', log.log_type)
      console.log('  endpoint:', log.endpoint)
    })

    // Get unique log sources
    const uniqueSources = await Log.aggregate([
      {
        $group: {
          _id: '$metadata.log_source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ])

    console.log('\n\n📊 Unique Log Sources (top 20):')
    uniqueSources.forEach(item => {
      console.log(`  "${item._id}": ${item.count} logs`)
    })

    // Check severity distribution
    const severityDist = await Log.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    console.log('\n\n🎯 Current Severity Distribution:')
    severityDist.forEach(item => {
      console.log(`  ${item._id || 'null'}: ${item.count} logs`)
    })

    // Total logs
    const totalLogs = await Log.countDocuments()
    console.log(`\n📈 Total Logs: ${totalLogs}`)

    await mongoose.connection.close()
    console.log('\n✅ Done')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

debugLogSeverity()
