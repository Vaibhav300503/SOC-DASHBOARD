import mongoose from 'mongoose';
import TailscaleLog from '../models/TailscaleLog.js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath, URL } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTailscaleLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read the exported logs file
    const filePath = path.join(__dirname, '../../tusharyadav9813@gmail.com-logs-2025-12-08T09-12-23-043Z.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      console.log('Please place the exported logs file in the project root directory');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle different JSON structures
    let logsData = [];
    if (data.logs && Array.isArray(data.logs)) {
      logsData = data.logs;
    } else if (Array.isArray(data)) {
      logsData = data;
    } else {
      console.error('Invalid JSON structure. Expected array or object with "logs" property');
      console.log('File structure:', Object.keys(data));
      process.exit(1);
    }
    
    console.log(`Found ${logsData.length} logs in the exported file`);

    // Clear existing imported logs
    await TailscaleLog.deleteMany({ source: 'exported_logs' });
    console.log('Cleared existing exported logs');

    // Normalize logs for storage
    const normalizedLogs = logsData.map(log => {
      // Handle Tailscale audit log structure
      let timestamp = log.eventTime || log.ts || log.timestamp || new Date();
      if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp);
      }

      return {
        ts: timestamp,
        timestamp: timestamp.toISOString(),
        type: log.type || log.action || 'unknown',
        user: log.actor?.loginName || log.user || 'unknown',
        node_id: log.target?.id || log.node_id || log.id || 'unknown',
        message: `${log.action || 'Unknown'}: ${log.target?.name || 'Unknown target'}`,
        src: log.src || log.source_ip,
        dst: log.dst || log.dest_ip,
        event: log.event,
        status: log.status || 'success',
        device_name: log.target?.name || log.device_name || log.name,
        device_os: log.device_os || log.os,
        ip_address: log.ip_address || log.ip,
        tailnet: log.tailnet || 'tusharyadav9813@gmail.com',
        version: log.version || 1,
        action: log.action,
        actor: log.actor,
        target: log.target,
        origin: log.origin,
        eventGroupID: log.eventGroupID,
        raw: log,
        source: 'exported_logs',
        ingested_at: new Date()
      };
    });

    // Insert in batches to avoid timeouts
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < normalizedLogs.length; i += batchSize) {
      const batch = normalizedLogs.slice(i, i + batchSize);
      const result = await TailscaleLog.insertMany(batch, { ordered: false });
      totalInserted += result.length;
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${result.length} logs`);
    }

    console.log(`\n✅ Import completed!`);
    console.log(`Total logs imported: ${totalInserted}`);
    console.log(`Source file: ${filePath}`);
    
    // Show some stats
    const stats = await TailscaleLog.aggregate([
      { $match: { source: 'exported_logs' } },
      { $group: {
        _id: '$type',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Log types breakdown:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error importing logs:', error);
    process.exit(1);
  }
}

importTailscaleLogs();
