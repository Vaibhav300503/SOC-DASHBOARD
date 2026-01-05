#!/usr/bin/env node

/**
 * Log Type Migration Script
 * Migrates existing logs to use standardized log type classification
 * Part of Task 2.4: Create Data Migration Scripts
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import LogTypeClassifier from '../utils/logTypeClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soc_platform';

// Migration configuration
const BATCH_SIZE = 1000;
const PROGRESS_INTERVAL = 5000;

async function connectToDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function migrateLogTypes() {
  console.log('🚀 STARTING LOG TYPE MIGRATION');
  console.log('=' .repeat(60));
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('raw_logs');
    const classifier = new LogTypeClassifier();
    
    // Get total count
    const totalLogs = await collection.countDocuments();
    console.log(`📊 Total logs to migrate: ${totalLogs.toLocaleString()}`);
    
    if (totalLogs === 0) {
      console.log('⚠️  No logs found to migrate');
      return { success: true, migrated: 0, errors: 0 };
    }
    
    // Check if migration already started
    const alreadyMigrated = await collection.countDocuments({ 
      classification_version: { $exists: true } 
    });
    
    if (alreadyMigrated > 0) {
      console.log(`⚠️  Found ${alreadyMigrated.toLocaleString()} already migrated logs`);
      console.log('   This migration will update all logs to ensure consistency');
    }
    
    // Migration statistics
    let processed = 0;
    let migrated = 0;
    let errors = 0;
    let skipped = 0;
    
    const migrationStats = {
      auth: 0,
      network: 0,
      firewall: 0,
      application: 0,
      database: 0,
      system: 0,
      registry: 0,
      fim: 0
    };
    
    const startTime = Date.now();
    
    console.log(`🔄 Starting migration in batches of ${BATCH_SIZE}...`);
    
    // Process logs in batches
    const cursor = collection.find({});
    
    while (await cursor.hasNext()) {
      const batch = [];
      
      // Collect batch
      for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
        const log = await cursor.next();
        batch.push(log);
      }
      
      if (batch.length === 0) break;
      
      // Process batch
      const bulkOps = [];
      
      batch.forEach(log => {
        try {
          // Classify the log
          const standardizedType = classifier.classify(log);
          const originalType = log.metadata?.log_source || log.log_type || 'unknown';
          const classificationMetadata = classifier.getClassificationMetadata();
          
          // Prepare bulk update operation
          bulkOps.push({
            updateOne: {
              filter: { _id: log._id },
              update: {
                $set: {
                  log_type: standardizedType,
                  original_log_type: originalType,
                  ...classificationMetadata
                }
              }
            }
          });
          
          // Update statistics
          migrationStats[standardizedType]++;
          migrated++;
          
        } catch (error) {
          console.error(`❌ Error processing log ${log._id}:`, error.message);
          errors++;
        }
      });
      
      // Execute bulk operations
      if (bulkOps.length > 0) {
        try {
          await collection.bulkWrite(bulkOps, { ordered: false });
        } catch (bulkError) {
          console.error('❌ Bulk write error:', bulkError.message);
          errors += bulkOps.length;
        }
      }
      
      processed += batch.length;
      
      // Progress reporting
      if (processed % PROGRESS_INTERVAL === 0 || processed === totalLogs) {
        const percentage = ((processed / totalLogs) * 100).toFixed(2);
        const elapsed = Date.now() - startTime;
        const rate = processed / (elapsed / 1000);
        const eta = totalLogs > processed ? ((totalLogs - processed) / rate) : 0;
        
        console.log(`📊 Progress: ${processed.toLocaleString()}/${totalLogs.toLocaleString()} (${percentage}%) - ${rate.toFixed(0)} logs/sec - ETA: ${Math.round(eta)}s`);
      }
    }
    
    await cursor.close();
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n✅ MIGRATION COMPLETE');
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📊 Processed: ${processed.toLocaleString()} logs`);
    console.log(`✅ Migrated: ${migrated.toLocaleString()} logs`);
    console.log(`❌ Errors: ${errors.toLocaleString()} logs`);
    console.log(`⏭️  Skipped: ${skipped.toLocaleString()} logs`);
    
    console.log('\n📊 CLASSIFICATION BREAKDOWN:');
    Object.entries(migrationStats).forEach(([category, count]) => {
      const percentage = ((count / migrated) * 100).toFixed(2);
      console.log(`   ${category}: ${count.toLocaleString()} (${percentage}%)`);
    });
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const verificationResult = await verifyMigration(collection);
    
    // Save migration report
    const migrationReport = {
      timestamp: new Date().toISOString(),
      totalLogs,
      processed,
      migrated,
      errors,
      skipped,
      migrationStats,
      totalTime,
      verification: verificationResult
    };
    
    await saveMigrationReport(migrationReport);
    
    return {
      success: errors === 0,
      totalLogs,
      processed,
      migrated,
      errors,
      skipped,
      migrationStats,
      totalTime
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function verifyMigration(collection) {
  try {
    console.log('🔍 Running migration verification...');
    
    // Check total logs with classification
    const totalWithClassification = await collection.countDocuments({
      classification_version: { $exists: true }
    });
    
    // Check logs without classification
    const totalWithoutClassification = await collection.countDocuments({
      classification_version: { $exists: false }
    });
    
    // Get classification breakdown
    const classificationBreakdown = await collection.aggregate([
      {
        $match: {
          classification_version: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$log_type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Check for any null or undefined log_type values
    const nullLogTypes = await collection.countDocuments({
      $or: [
        { log_type: null },
        { log_type: { $exists: false } }
      ]
    });
    
    const verification = {
      totalWithClassification,
      totalWithoutClassification,
      classificationBreakdown,
      nullLogTypes,
      success: totalWithoutClassification === 0 && nullLogTypes === 0
    };
    
    console.log('📊 Verification Results:');
    console.log(`   Logs with classification: ${totalWithClassification.toLocaleString()}`);
    console.log(`   Logs without classification: ${totalWithoutClassification.toLocaleString()}`);
    console.log(`   Null log types: ${nullLogTypes.toLocaleString()}`);
    
    if (verification.success) {
      console.log('✅ Migration verification PASSED');
    } else {
      console.log('❌ Migration verification FAILED');
    }
    
    return verification;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  }
}

async function saveMigrationReport(report) {
  try {
    const outputDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save JSON report
    const jsonPath = path.join(outputDir, 'migration-execution-log.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Save markdown report
    const mdPath = path.join(outputDir, 'migration-execution-log.md');
    const mdContent = `# Log Type Migration Execution Log

**Executed**: ${report.timestamp}
**Status**: ${report.verification?.success ? '✅ SUCCESS' : '❌ FAILED'}

## Migration Summary

- **Total Logs**: ${report.totalLogs.toLocaleString()}
- **Processed**: ${report.processed.toLocaleString()}
- **Migrated**: ${report.migrated.toLocaleString()}
- **Errors**: ${report.errors.toLocaleString()}
- **Skipped**: ${report.skipped.toLocaleString()}
- **Total Time**: ${report.totalTime.toFixed(2)} seconds

## Classification Breakdown

| Category | Count | Percentage |
|----------|-------|------------|
${Object.entries(report.migrationStats).map(([category, count]) => {
  const percentage = ((count / report.migrated) * 100).toFixed(2);
  return `| ${category} | ${count.toLocaleString()} | ${percentage}% |`;
}).join('\n')}

## Verification Results

- **Logs with Classification**: ${report.verification?.totalWithClassification?.toLocaleString() || 'N/A'}
- **Logs without Classification**: ${report.verification?.totalWithoutClassification?.toLocaleString() || 'N/A'}
- **Null Log Types**: ${report.verification?.nullLogTypes?.toLocaleString() || 'N/A'}
- **Verification Status**: ${report.verification?.success ? '✅ PASSED' : '❌ FAILED'}

## Performance Metrics

- **Processing Rate**: ${(report.processed / report.totalTime).toFixed(0)} logs/second
- **Migration Rate**: ${(report.migrated / report.totalTime).toFixed(0)} logs/second
- **Success Rate**: ${((report.migrated / report.processed) * 100).toFixed(2)}%

---
*This report was generated automatically by the migration script.*
`;
    
    fs.writeFileSync(mdPath, mdContent);
    
    console.log(`💾 Migration report saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Markdown: ${mdPath}`);
    
  } catch (error) {
    console.error('❌ Failed to save migration report:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting log type migration...');
    
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    // Confirm migration
    console.log('\n⚠️  WARNING: This will modify all logs in the database');
    console.log('   - Original log types will be preserved in original_log_type field');
    console.log('   - New standardized log types will be applied');
    console.log('   - Classification metadata will be added');
    
    // In production, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    const result = await migrateLogTypes();
    
    if (result.success) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n❌ MIGRATION COMPLETED WITH ERRORS');
      console.log(`   ${result.errors} logs had errors during migration`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
console.log('🚀 Starting log type migration script...');
main();