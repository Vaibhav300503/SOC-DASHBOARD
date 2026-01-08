// Test direct MongoDB case query
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Case from './models/Case.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'

async function testCaseQuery() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Test the exact query used in the service
    const mongoCases = await Case.find()
      .sort({ created_at: -1 })
      .limit(10)
      .lean()

    console.log(`Found ${mongoCases.length} cases in MongoDB`)

    if (mongoCases.length > 0) {
      console.log('Cases:')
      mongoCases.forEach((caseItem, index) => {
        console.log(`${index + 1}. ${caseItem.title} (Severity: ${caseItem.severity})`)
      })

      // Test the mapping used in the service
      const mappedCases = mongoCases.map(mongoCase => ({
        ...mongoCase,
        source: 'MongoDB',
        id: mongoCase._id,
        createdAt: mongoCase.created_at,
        _createdAt: mongoCase.created_at
      }))

      console.log('\nMapped cases (first one):')
      console.log(JSON.stringify(mappedCases[0], null, 2))
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

testCaseQuery()