// Check existing indexes on cases collection
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

async function checkIndexes() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('cases')

    // Get all indexes
    const indexes = await collection.indexes()
    console.log('Existing indexes on cases collection:')
    indexes.forEach((index, i) => {
      console.log(`${i + 1}.`, JSON.stringify(index, null, 2))
    })

    // Get existing documents
    const existingCases = await collection.find({}).toArray()
    console.log(`\nExisting cases count: ${existingCases.length}`)

    if (existingCases.length > 0) {
      console.log('First few cases:')
      existingCases.slice(0, 3).forEach((caseItem, i) => {
        console.log(`${i + 1}. ${caseItem.title} (ID: ${caseItem._id})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

checkIndexes()