#!/usr/bin/env node

/**
 * Classification Rollback Script
 * Rolls back log type classification to original state
 * Part of Task 2.4: Create Data Migration Scripts
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin';

// Rollback configuration
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

async function rollbackClassification() {
  console.log('🔄 STARTING CLASSIFICATION ROLLBACK');
  console.log('='.repeat(60));

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('raw_logs');

    // Check if there are logs to rollback
    const logsWithClassification = await collection.countDocuments({
      classification_version: { $exists: true }
    });

    console.log(`📊 Logs with classification: ${logsWithClassification.toLocaleString()}`);

    if (logsWithClassification === 0) {
      console.log('⚠️  No classified logs found to rollback');
      return { success: true, rolledBack: 0, errors: 0 };
    }

    // Rollback statistics
    let processed = 0;
    let rolledBack = 0;
    let errors = 0;

    const startTime = Date.now();

    console.log(`🔄 Starting rollback in batches of ${BATCH_SIZE}...`);

    // Process logs in batches
    const cursor = collection.find({
      classification_version: { $exists: true }
    });

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
          // Prepare rollback operation
          const updateDoc = {
            $unset: {
              classification_version: "",
              classified_at: "",
              classifier: ""
            }
          };

          // Restore original log_type if it exists and is different from current
          if (log.original_log_type && log.original_log_type !== log.log_type) {
            updateDoc.$set = {
              log_type: log.original_log_type
            };
          } else {
            // Remove log_type field entirely if no original exists
            updateDoc.$unset.log_type = "";
          }

          // Remove original_log_type field as it's no longer needed
          updateDoc.$unset.original_log_type = "";

          bulkOps.push({
            updateOne: {
              filter: { _id: log._id },
              update: updateDoc
            }
          });

          rolledBack++;

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
      if (processed % PROGRESS_INTERVAL === 0 || processed === logsWithClassification) {
        const percentage = ((processed / logsWithClassification) * 100).toFixed(2);
        const elapsed = Date.now() - startTime;
        const rate = processed / (elapsed / 1000);
        const eta = logsWithClassification > processed ? ((logsWithClassification - processed) / rate) : 0;

        console.log(`📊 Progress: ${processed.toLocaleString()}/${logsWithClassification.toLocaleString()} (${percentage}%) - ${rate.toFixed(0)} logs/sec - ETA: ${Math.round(eta)}s`);
      }
    }

    await cursor.close();

    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n✅ ROLLBACK COMPLETE');
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📊 Processed: ${processed.toLocaleString()} logs`);
    console.log(`✅ Rolled back: ${rolledBack.toLocaleString()} logs`);
    console.log(`❌ Errors: ${errors.toLocaleString()} logs`);

    // Verify rollback
    console.log('\n🔍 Verifying rollback...');
    const verificationResult = await verifyRollback(collection);

    // Save rollback report
    const rollbackReport = {
      timestamp: new Date().toISOString(),
      logsWithClassification,
      processed,
      rolledBack,
      errors,
      totalTime,
      verification: verificationResult
    };

    await saveRollbackReport(rollbackReport);

    return {
      success: errors === 0,
      logsWithClassification,
      processed,
      rolledBack,
      errors,
      totalTime
    };

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

async function verifyRollback(collection) {
  try {
    console.log('🔍 Running rollback verification...');

    // Check logs still with classification
    const stillClassified = await collection.countDocuments({
      classification_version: { $exists: true }
    });

    // Check logs with original_log_type field (should be 0)
    const withOriginalType = await collection.countDocuments({
      original_log_type: { $exists: true }
    });

    // Check logs with classifier field (should be 0)
    const withClassifier = await collection.countDocuments({
      classifier: { $exists: true }
    });

    // Check logs with classified_at field (should be 0)
    const withClassifiedAt = await collection.countDocuments({
      classified_at: { $exists: true }
    });

    const verification = {
      stillClassified,
      withOriginalType,
      withClassifier,
      withClassifiedAt,
      success: stillClassified === 0 && withOriginalType === 0 && withClassifier === 0 && withClassifiedAt === 0
    };

    console.log('📊 Verification Results:');
    console.log(`   Logs still classified: ${stillClassified.toLocaleString()}`);
    console.log(`   Logs with original_log_type: ${withOriginalType.toLocaleString()}`);
    console.log(`   Logs with classifier field: ${withClassifier.toLocaleString()}`);
    console.log(`   Logs with classified_at field: ${withClassifiedAt.toLocaleString()}`);

    if (verification.success) {
      console.log('✅ Rollback verification PASSED');
    } else {
      console.log('❌ Rollback verification FAILED');
    }

    return verification;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  }
}

async function saveRollbackReport(report) {
  try {
    const outputDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(outputDir, 'rollback-execution-log.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save markdown report
    const mdPath = path.join(outputDir, 'rollback-execution-log.md');
    const mdContent = `# Classification Rollback Execution Log

**Executed**: ${report.timestamp}
**Status**: ${report.verification?.success ? '✅ SUCCESS' : '❌ FAILED'}

## Rollback Summary

- **Logs with Classification**: ${report.logsWithClassification.toLocaleString()}
- **Processed**: ${report.processed.toLocaleString()}
- **Rolled Back**: ${report.rolledBack.toLocaleString()}
- **Errors**: ${report.errors.toLocaleString()}
- **Total Time**: ${report.totalTime.toFixed(2)} seconds

## Verification Results

- **Logs Still Classified**: ${report.verification?.stillClassified?.toLocaleString() || 'N/A'}
- **Logs with original_log_type**: ${report.verification?.withOriginalType?.toLocaleString() || 'N/A'}
- **Logs with classifier field**: ${report.verification?.withClassifier?.toLocaleString() || 'N/A'}
- **Logs with classified_at field**: ${report.verification?.withClassifiedAt?.toLocaleString() || 'N/A'}
- **Verification Status**: ${report.verification?.success ? '✅ PASSED' : '❌ FAILED'}

## Performance Metrics

- **Processing Rate**: ${(report.processed / report.totalTime).toFixed(0)} logs/second
- **Rollback Rate**: ${(report.rolledBack / report.totalTime).toFixed(0)} logs/second
- **Success Rate**: ${((report.rolledBack / report.processed) * 100).toFixed(2)}%

## What Was Rolled Back

1. **Removed Fields**:
   - \`classification_version\`
   - \`classified_at\`
   - \`classifier\`
   - \`original_log_type\`

2. **Restored Fields**:
   - \`log_type\` restored to original value (if different)
   - \`log_type\` removed entirely (if no original value)

---
*This report was generated automatically by the rollback script.*
`;

    fs.writeFileSync(mdPath, mdContent);

    console.log(`💾 Rollback report saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Markdown: ${mdPath}`);

  } catch (error) {
    console.error('❌ Failed to save rollback report:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting classification rollback...');

    const connected = await connectToDatabase();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Confirm rollback
    console.log('\n⚠️  WARNING: This will rollback all log type classifications');
    console.log('   - Standardized log types will be removed');
    console.log('   - Original log types will be restored');
    console.log('   - Classification metadata will be removed');

    // In production, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically

    const result = await rollbackClassification();

    if (result.success) {
      console.log('\n🎉 ROLLBACK COMPLETED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n❌ ROLLBACK COMPLETED WITH ERRORS');
      console.log(`   ${result.errors} logs had errors during rollback`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the rollback
console.log('🔄 Starting classification rollback script...');
main();