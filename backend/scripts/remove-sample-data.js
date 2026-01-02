import mongoose from 'mongoose';
import TailscaleLog from '../models/TailscaleLog.js';
import { config } from 'dotenv';

config();

async function removeSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Remove sample data
    const result = await TailscaleLog.deleteMany({ source: 'sample_data' });
    console.log('Removed sample data:', result.deletedCount, 'logs');
    
    // Check remaining data
    const total = await TailscaleLog.countDocuments();
    const exported = await TailscaleLog.countDocuments({ source: 'exported_logs' });
    const webhook = await TailscaleLog.countDocuments({ source: 'audit_stream' });
    
    console.log('\nRemaining data:');
    console.log('- Total logs:', total);
    console.log('- Exported logs:', exported);
    console.log('- Webhook logs:', webhook);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeSampleData();
