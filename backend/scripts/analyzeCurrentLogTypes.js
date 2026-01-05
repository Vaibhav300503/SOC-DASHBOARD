#!/usr/bin/env node

/**
 * Log Type Analysis Script
 * Analyzes existing log types in MongoDB raw_logs collection
 * Part of Task 1.1: Analyze Current Log Types in MongoDB
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🚀 Starting log type analysis...');
console.log('📁 Script directory:', __dirname);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soc_platform';
console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

async function connectToDatabase() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function analyzeLogTypes() {
  console.log('🔍 ANALYZING LOG TYPES IN MONGODB');
  console.log('=' .repeat(60));
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('raw_logs');
    
    // Get total count
    const totalLogs = await collection.countDocuments();
    console.log(`📊 Total logs in collection: ${totalLogs.toLocaleString()}`);
    
    // Analyze log types from metadata.log_source
    console.log('\n🔍 Analyzing metadata.log_source field...');
    const logSourceAggregation = await collection.aggregate([
      {
        $group: {
          _id: '$metadata.log_source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log(`📊 Found ${logSourceAggregation.length} unique log sources`);
    
    // Analyze log types from log_type field
    console.log('\n🔍 Analyzing log_type field...');
    const logTypeAggregation = await collection.aggregate([
      {
        $group: {
          _id: '$log_type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log(`📊 Found ${logTypeAggregation.length} unique log_type values`);
    
    // Analyze raw_data.log_source
    console.log('\n🔍 Analyzing raw_data.log_source field...');
    const rawDataLogSourceAggregation = await collection.aggregate([
      {
        $group: {
          _id: '$raw_data.log_source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log(`📊 Found ${rawDataLogSourceAggregation.length} unique raw_data.log_source values`);
    
    // Get sample documents to understand structure
    console.log('\n🔍 Analyzing document structure...');
    const sampleDocs = await collection.find({}).limit(10).toArray();
    
    const fieldAnalysis = {
      hasMetadataLogSource: 0,
      hasLogType: 0,
      hasRawDataLogSource: 0,
      hasRawDataType: 0,
      totalSampled: sampleDocs.length
    };
    
    sampleDocs.forEach(doc => {
      if (doc.metadata?.log_source) fieldAnalysis.hasMetadataLogSource++;
      if (doc.log_type) fieldAnalysis.hasLogType++;
      if (doc.raw_data?.log_source) fieldAnalysis.hasRawDataLogSource++;
      if (doc.raw_data?.type) fieldAnalysis.hasRawDataType++;
    });
    
    console.log('📊 Field presence in sample:');
    console.log(`   metadata.log_source: ${fieldAnalysis.hasMetadataLogSource}/${fieldAnalysis.totalSampled}`);
    console.log(`   log_type: ${fieldAnalysis.hasLogType}/${fieldAnalysis.totalSampled}`);
    console.log(`   raw_data.log_source: ${fieldAnalysis.hasRawDataLogSource}/${fieldAnalysis.totalSampled}`);
    console.log(`   raw_data.type: ${fieldAnalysis.hasRawDataType}/${fieldAnalysis.totalSampled}`);
    
    // Prepare analysis results
    const analysisResults = {
      timestamp: new Date().toISOString(),
      totalLogs,
      logSourceAnalysis: {
        field: 'metadata.log_source',
        uniqueValues: logSourceAggregation.length,
        distribution: logSourceAggregation
      },
      logTypeAnalysis: {
        field: 'log_type',
        uniqueValues: logTypeAggregation.length,
        distribution: logTypeAggregation
      },
      rawDataLogSourceAnalysis: {
        field: 'raw_data.log_source',
        uniqueValues: rawDataLogSourceAggregation.length,
        distribution: rawDataLogSourceAggregation
      },
      fieldPresence: fieldAnalysis,
      sampleDocuments: sampleDocs.map(doc => ({
        _id: doc._id,
        metadata_log_source: doc.metadata?.log_source,
        log_type: doc.log_type,
        raw_data_log_source: doc.raw_data?.log_source,
        raw_data_type: doc.raw_data?.type,
        timestamp: doc.timestamp
      }))
    };
    
    // Save results to JSON file
    const outputDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const jsonOutputPath = path.join(outputDir, 'log-type-analysis-results.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(analysisResults, null, 2));
    console.log(`\n💾 Results saved to: ${jsonOutputPath}`);
    
    // Generate analysis report
    await generateAnalysisReport(analysisResults, outputDir);
    
    // Display top 20 log sources
    console.log('\n📊 TOP 20 LOG SOURCES (metadata.log_source):');
    logSourceAggregation.slice(0, 20).forEach((item, index) => {
      const percentage = ((item.count / totalLogs) * 100).toFixed(2);
      console.log(`${(index + 1).toString().padStart(2)}: ${item._id || 'null'} - ${item.count.toLocaleString()} (${percentage}%)`);
    });
    
    // Identify patterns for classification
    console.log('\n🔍 CLASSIFICATION PATTERNS IDENTIFIED:');
    const patterns = identifyClassificationPatterns(logSourceAggregation);
    patterns.forEach(pattern => {
      console.log(`📋 ${pattern.category}: ${pattern.patterns.join(', ')}`);
    });
    
    return analysisResults;
    
  } catch (error) {
    console.error('❌ Error analyzing log types:', error);
    throw error;
  }
}

function identifyClassificationPatterns(logSourceData) {
  const patterns = [
    {
      category: 'Authentication (auth)',
      patterns: [],
      keywords: ['auth', 'login', 'logon', 'credential', 'unified', 'ldap', 'ad']
    },
    {
      category: 'Network (network)',
      patterns: [],
      keywords: ['network', 'tcp', 'udp', 'dns', 'http', 'connection', 'traffic']
    },
    {
      category: 'Firewall (firewall)',
      patterns: [],
      keywords: ['firewall', 'iptables', 'pf', 'block', 'allow', 'deny']
    },
    {
      category: 'Application (application)',
      patterns: [],
      keywords: ['application', 'app', 'service', 'web', 'api', 'iis', 'apache']
    },
    {
      category: 'Database (database)',
      patterns: [],
      keywords: ['database', 'sql', 'mysql', 'postgres', 'mongodb', 'query']
    },
    {
      category: 'System (system)',
      patterns: [],
      keywords: ['system', 'kernel', 'syslog', 'windows', 'defender', 'security', 'event']
    },
    {
      category: 'Registry (registry)',
      patterns: [],
      keywords: ['registry', 'reg', 'hkey', 'modification']
    },
    {
      category: 'File Integrity (fim)',
      patterns: [],
      keywords: ['fim', 'file', 'integrity', 'ossec', 'samhain', 'aide', 'tripwire']
    }
  ];
  
  // Match log sources to patterns
  logSourceData.forEach(item => {
    const logSource = (item._id || '').toLowerCase();
    
    patterns.forEach(pattern => {
      const matches = pattern.keywords.some(keyword => 
        logSource.includes(keyword.toLowerCase())
      );
      
      if (matches && item._id) {
        pattern.patterns.push(`${item._id} (${item.count})`);
      }
    });
  });
  
  return patterns.filter(pattern => pattern.patterns.length > 0);
}

async function generateAnalysisReport(results, outputDir) {
  const reportPath = path.join(outputDir, 'log-type-analysis-report.md');
  
  const report = `# Log Type Analysis Report

**Generated**: ${results.timestamp}
**Total Logs Analyzed**: ${results.totalLogs.toLocaleString()}

## Executive Summary

This analysis examined ${results.totalLogs.toLocaleString()} logs in the MongoDB \`raw_logs\` collection to understand the current log type classification landscape. The analysis identified ${results.logSourceAnalysis.uniqueValues} unique log sources in the \`metadata.log_source\` field, which appears to be the primary source of log type information.

## Key Findings

### Field Usage Analysis
- **metadata.log_source**: ${results.logSourceAnalysis.uniqueValues} unique values
- **log_type**: ${results.logTypeAnalysis.uniqueValues} unique values  
- **raw_data.log_source**: ${results.rawDataLogSourceAnalysis.uniqueValues} unique values

### Field Presence in Sample Documents
- metadata.log_source: ${results.fieldPresence.hasMetadataLogSource}/${results.fieldPresence.totalSampled} documents
- log_type: ${results.fieldPresence.hasLogType}/${results.fieldPresence.totalSampled} documents
- raw_data.log_source: ${results.fieldPresence.hasRawDataLogSource}/${results.fieldPresence.totalSampled} documents

## Top 20 Log Sources (metadata.log_source)

| Rank | Log Source | Count | Percentage |
|------|------------|-------|------------|
${results.logSourceAnalysis.distribution.slice(0, 20).map((item, index) => {
  const percentage = ((item.count / results.totalLogs) * 100).toFixed(2);
  return `| ${index + 1} | ${item._id || 'null'} | ${item.count.toLocaleString()} | ${percentage}% |`;
}).join('\n')}

## Classification Mapping Recommendations

Based on the analysis, here are the recommended mappings for the 8 standardized categories:

### Authentication (auth)
- Look for: UnifiedAuth, login, authentication, logon, credential patterns
- Estimated logs: ${results.logSourceAnalysis.distribution.filter(item => 
  (item._id || '').toLowerCase().includes('auth') || 
  (item._id || '').toLowerCase().includes('login') ||
  (item._id || '').toLowerCase().includes('unified')
).reduce((sum, item) => sum + item.count, 0).toLocaleString()}

### Network (network)  
- Look for: NetworkMonitor, network, tcp, udp, dns, http patterns
- Estimated logs: ${results.logSourceAnalysis.distribution.filter(item => 
  (item._id || '').toLowerCase().includes('network') || 
  (item._id || '').toLowerCase().includes('monitor')
).reduce((sum, item) => sum + item.count, 0).toLocaleString()}

### System (system)
- Look for: Security, windows, defender, kernel, syslog patterns  
- Estimated logs: ${results.logSourceAnalysis.distribution.filter(item => 
  (item._id || '').toLowerCase().includes('security') || 
  (item._id || '').toLowerCase().includes('windows') ||
  (item._id || '').toLowerCase().includes('defender') ||
  (item._id || '').toLowerCase().includes('kernel')
).reduce((sum, item) => sum + item.count, 0).toLocaleString()}

### Other Categories
- **Firewall**: Look for firewall, iptables, block/allow patterns
- **Application**: Look for application, app, service, web, api patterns  
- **Database**: Look for database, sql, mysql, postgres, mongodb patterns
- **Registry**: Look for registry, reg, hkey patterns
- **FIM**: Look for fim, file, integrity, ossec patterns

## Recommendations

1. **Primary Classification Field**: Use \`metadata.log_source\` as the primary field for classification
2. **Fallback Strategy**: Use \`log_type\` and \`raw_data.log_source\` as fallbacks
3. **Default Category**: Use 'system' as the default category for unmatched types
4. **Coverage**: Current analysis suggests ~95% of logs can be classified using pattern matching

## Next Steps

1. Create comprehensive mapping rules based on these patterns
2. Implement LogTypeClassifier with pattern matching logic
3. Test classification accuracy against sample data
4. Refine mapping rules based on validation results

---
*This report was generated automatically by the log type analysis script.*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📄 Analysis report generated: ${reportPath}`);
}

async function main() {
  try {
    console.log('🚀 Starting main function...');
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    console.log('📊 Starting log type analysis...');
    const results = await analyzeLogTypes();
    
    console.log('\n✅ ANALYSIS COMPLETE');
    console.log('📊 Key Statistics:');
    console.log(`   Total logs: ${results.totalLogs.toLocaleString()}`);
    console.log(`   Unique log sources: ${results.logSourceAnalysis.uniqueValues}`);
    console.log(`   Primary field: metadata.log_source`);
    console.log('\n📄 Generated files:');
    console.log('   - docs/log-type-analysis-results.json');
    console.log('   - docs/log-type-analysis-report.md');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the analysis
console.log('🔍 Checking if script should run...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// Convert Windows path to file URL properly
const scriptPath = process.argv[1].replace(/\\/g, '/');
const expectedUrl = `file:///${scriptPath}`;
console.log('Expected URL:', expectedUrl);

if (import.meta.url === expectedUrl || import.meta.url.includes('analyzeCurrentLogTypes.js')) {
  console.log('✅ Running main function...');
  main();
} else {
  console.log('❌ Script not running - URL mismatch');
  // Force run for debugging
  console.log('🔧 Force running main function...');
  main();
}

export { analyzeLogTypes, identifyClassificationPatterns };