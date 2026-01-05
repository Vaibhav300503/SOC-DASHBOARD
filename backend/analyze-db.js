import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function analyzeDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections:', collections.map(c => c.name));
    
    // Analyze logs collection
    const db = mongoose.connection.db;
    const logsCollection = db.collection('logs');
    const rawLogsCollection = db.collection('raw_logs');
    
    // Get total count for both collections
    const totalCount = await logsCollection.countDocuments();
    const rawTotalCount = await rawLogsCollection.countDocuments();
    console.log('📊 Total logs in "logs" collection:', totalCount);
    console.log('📊 Total logs in "raw_logs" collection:', rawTotalCount);
    
    // Use the collection that has data
    const activeCollection = totalCount > 0 ? logsCollection : rawLogsCollection;
    const collectionName = totalCount > 0 ? 'logs' : 'raw_logs';
    console.log('🎯 Using collection:', collectionName);
    
    if (rawTotalCount === 0 && totalCount === 0) {
      console.log('❌ No logs found in either collection');
      await mongoose.disconnect();
      return;
    }
    
    // Sample document to understand schema
    const sampleLog = await activeCollection.findOne();
    console.log('📄 Sample log structure:');
    console.log(JSON.stringify(sampleLog, null, 2));
    
    // Check severity field values
    const severityValues = await activeCollection.distinct('severity');
    console.log('🎯 Distinct severity values:', severityValues);
    
    // Check severity distribution
    const severityStats = await activeCollection.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    console.log('📈 Severity distribution:', severityStats);
    
    // Check timestamp field
    const timestampSample = await activeCollection.findOne({}, { timestamp: 1, ingested_at: 1, created_at: 1, createdAt: 1 });
    console.log('⏰ Timestamp fields sample:', timestampSample);
    
    // Check log_type distribution
    const logTypeStats = await activeCollection.aggregate([
      { $group: { _id: '$log_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    console.log('📝 Log type distribution (top 10):', logTypeStats);
    
    await mongoose.disconnect();
    console.log('✅ Analysis complete');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeDB();