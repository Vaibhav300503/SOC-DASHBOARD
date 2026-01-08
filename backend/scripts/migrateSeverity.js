import mongoose from 'mongoose'
import 'dotenv/config'
import Log from '../models/Log.js'
import severityClassifier from '../utils/severityClassifier.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

const migrateSeverity = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected.')

        console.log('🔍 Finding logs with missing or invalid severity...')
        // Find logs where severity is null, undefined, or not one of the standard values
        const query = {
            $or: [
                { severity: { $exists: false } },
                { severity: null },
                { severity: '' },
                // Optional: also re-check existing ones if we want to enforce standardization
                // { severity: { $nin: ['Critical', 'High', 'Medium', 'Low'] } } 
            ]
        }

        const totalLogs = await Log.countDocuments(query)
        console.log(`📊 Found ${totalLogs} logs to migrate.`)

        if (totalLogs === 0) {
            console.log('🎉 No logs need migration.')
            process.exit(0)
        }

        const batchSize = 1000
        let processed = 0

        // Process in batches using cursor
        const cursor = Log.find(query).cursor()

        const bulkOps = []

        for await (const doc of cursor) {
            // Use the classifier to determine severity
            const severity = severityClassifier.classify(doc)

            bulkOps.push({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { severity: severity } }
                }
            })

            if (bulkOps.length >= batchSize) {
                await Log.bulkWrite(bulkOps)
                processed += bulkOps.length
                process.stdout.write(`\r🚀 Migrated ${processed} / ${totalLogs} logs...`)
                bulkOps.length = 0 // Clear array
            }
        }

        // Process remaining
        if (bulkOps.length > 0) {
            await Log.bulkWrite(bulkOps)
            processed += bulkOps.length
        }

        console.log(`\n✅ Migration complete! Processed ${processed} logs.`)
        process.exit(0)

    } catch (error) {
        console.error('❌ Migration failed:', error)
        process.exit(1)
    }
}

migrateSeverity()
