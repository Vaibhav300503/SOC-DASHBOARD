import mongoose from 'mongoose'
import Log from '../models/Log.js'

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/soc-platform'

// Helper to assign severity based on log content
function assignSeverity(log) {
  const logSource = (log.metadata?.log_source || log.raw_data?.log_source || '').toLowerCase()
  const logType = (log.log_type || '').toLowerCase()
  const endpoint = (log.endpoint || '').toLowerCase()
  const rawMsg = (log.raw_data?.message || log.raw_data?.description || '').toLowerCase()

  // Check for critical patterns
  if (logSource.includes('critical') || logSource.includes('alert') || 
      logSource.includes('emergency') || logSource.includes('severe') ||
      logSource.includes('attack') || logSource.includes('breach') ||
      rawMsg.includes('critical') || rawMsg.includes('attack') ||
      rawMsg.includes('breach') || rawMsg.includes('malicious')) {
    return 'Critical'
  }

  // Check for high patterns
  if (logSource.includes('security') || logSource.includes('intrusion') || 
      logSource.includes('malware') || logSource.includes('warning') ||
      logType.includes('security') || logType.includes('firewall') ||
      rawMsg.includes('security') || rawMsg.includes('intrusion') ||
      rawMsg.includes('malware') || rawMsg.includes('unauthorized')) {
    return 'High'
  }

  // Check for medium patterns
  if (logSource.includes('error') || logSource.includes('fail') || 
      logSource.includes('medium') || logSource.includes('kernel') ||
      logType.includes('error') || logType.includes('fail') ||
      rawMsg.includes('error') || rawMsg.includes('failed') ||
      rawMsg.includes('failure')) {
    return 'Medium'
  }

  // Default to Low
  return 'Low'
}

async function populateSeverity() {
  try {
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Get all logs
    const logs = await Log.find().lean()
    console.log(`📋 Found ${logs.length} logs to process`)

    if (logs.length === 0) {
      console.log('⚠️  No logs found in database')
      await mongoose.connection.close()
      return
    }

    // Process logs in batches
    const batchSize = 100
    let updated = 0
    let skipped = 0

    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize)
      const operations = []

      batch.forEach(log => {
        const newSeverity = assignSeverity(log)
        
        // Only update if severity is missing or different
        if (!log.severity || log.severity !== newSeverity) {
          operations.push({
            updateOne: {
              filter: { _id: log._id },
              update: { $set: { severity: newSeverity } }
            }
          })
          updated++
        } else {
          skipped++
        }
      })

      if (operations.length > 0) {
        await Log.bulkWrite(operations)
        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(logs.length / batchSize)}`)
      }
    }

    console.log(`\n📊 Results:`)
    console.log(`  Updated: ${updated} logs`)
    console.log(`  Skipped: ${skipped} logs`)

    // Show severity distribution
    const severityDist = await Log.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    console.log(`\n🎯 New Severity Distribution:`)
    severityDist.forEach(item => {
      console.log(`  ${item._id || 'null'}: ${item.count} logs`)
    })

    await mongoose.connection.close()
    console.log('\n✅ Done')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

populateSeverity()
