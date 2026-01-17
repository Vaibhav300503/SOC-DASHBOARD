import Log from '../models/Log.js';
import LogTypeClassifier from '../utils/logTypeClassifier.js';

const classifier = new LogTypeClassifier();
let isRunning = false;

/**
 * Run the cleanup process for unclassified/unknown logs
 */
export const cleanupLogs = async () => {
    if (isRunning) {
        console.log('⚠️  Log cleanup already in progress, skipping...');
        return;
    }

    isRunning = true;
    const startTime = Date.now();
    let fixedCount = 0;
    let errorCount = 0;

    try {
        // Find logs that need fixing
        // 1. log_type is null, undefined, or 'Unknown'
        // 2. severity is null or undefined (we default to Info now, but old logs might be null)
        const logsToFix = await Log.find({
            $or: [
                { log_type: null },
                { log_type: { $exists: false } },
                { log_type: 'Unknown' },
                { log_type: 'system' }, // Re-check default 'system' logs too, to be safe
                { severity: null },
                { severity: { $exists: false } }
            ]
        }).limit(1000); // Process in batches of 1000 to avoid blocking

        if (logsToFix.length === 0) {
            // No logs to fix
            isRunning = false;
            return;
        }

        console.log(`🧹 Log Cleanup: Found ${logsToFix.length} potential logs to fix`);

        const bulkOps = [];

        logsToFix.forEach(log => {
            try {
                let updates = {};
                let needsUpdate = false;

                // 1. Fix Log Type
                const currentType = log.log_type;
                // Check ALL sources including top-level log_source
                const logSource = log.toObject().log_source || log.metadata?.log_source || log.raw_data?.log_source;

                // Re-classify
                const newType = classifier.classify(log.toObject());

                // If the current type is invalid OR the new classification is better (e.g. 'Network' vs 'System')
                if (!currentType || currentType === 'Unknown' || (currentType === 'System' && newType !== 'System') || (currentType === 'system' && newType !== 'system')) {
                    updates.log_type = newType;
                    updates.original_log_type = logSource || log.log_type || 'unknown';
                    const meta = classifier.getClassificationMetadata();
                    Object.assign(updates, meta);
                    needsUpdate = true;
                }

                // 2. Fix Severity
                if (!log.severity) {
                    updates.severity = 'Info';
                    needsUpdate = true;
                }

                // 3. Fix missing source_ip/dest_ip if available in other fields
                // This handles cases where ingestion might have missed mapping
                if (!log.source_ip && (log.src_ip || log.ip_address)) {
                    updates.source_ip = log.src_ip || log.ip_address;
                    needsUpdate = true;
                }
                if (!log.dest_ip && log.dst_ip) {
                    updates.dest_ip = log.dst_ip;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: log._id },
                            update: { $set: updates }
                        }
                    });
                }
            } catch (err) {
                errorCount++;
            }
        });

        if (bulkOps.length > 0) {
            const result = await Log.bulkWrite(bulkOps, { ordered: false });
            fixedCount = result.modifiedCount;
            console.log(`✅ Log Cleanup: Fixed ${fixedCount} logs in ${(Date.now() - startTime)}ms`);
        } else {
            // console.log('🧹 Log Cleanup: No changes needed for checked logs');
        }

    } catch (error) {
        console.error('❌ Log Cleanup Error:', error.message);
    } finally {
        isRunning = false;
    }
};

/**
 * Start the periodic cleanup schedule
 * @param {number} intervalMs - Interval in milliseconds (default 3 mins)
 */
export const startCleanupSchedule = (intervalMs = 3 * 60 * 1000) => {
    console.log('⏰ Starting automatic log cleanup service (every 3 mins)...');

    // Run once immediately after a short delay to let server start up
    setTimeout(cleanupLogs, 10000);

    // Set interval
    setInterval(cleanupLogs, intervalMs);
};
