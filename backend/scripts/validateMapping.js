#!/usr/bin/env node

/**
 * Mapping Validation Script
 * Tests classification accuracy against sample data
 * Part of Task 1.3: Validate Mapping Against Sample Data
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

async function validateMapping() {
  console.log('🧪 VALIDATING LOG TYPE MAPPING RULES');
  console.log('=' .repeat(60));
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('raw_logs');
    const classifier = new LogTypeClassifier();
    
    // Get sample logs for validation (1000 logs)
    console.log('📊 Extracting sample logs for validation...');
    const sampleLogs = await collection.aggregate([
      { $sample: { size: 1000 } }
    ]).toArray();
    
    console.log(`📊 Retrieved ${sampleLogs.length} sample logs`);
    
    // Classify sample logs
    console.log('🔍 Classifying sample logs...');
    const classificationResults = [];
    let classificationStats = {
      total: sampleLogs.length,
      auth: 0,
      network: 0,
      firewall: 0,
      application: 0,
      database: 0,
      system: 0,
      registry: 0,
      fim: 0
    };
    
    sampleLogs.forEach((log, index) => {
      const originalType = log.metadata?.log_source || log.log_type || 'unknown';
      const standardizedType = classifier.classify(log);
      
      classificationResults.push({
        _id: log._id,
        original_type: originalType,
        standardized_type: standardizedType,
        timestamp: log.timestamp
      });
      
      classificationStats[standardizedType]++;
      
      if ((index + 1) % 100 === 0) {
        console.log(`   Processed ${index + 1}/${sampleLogs.length} logs...`);
      }
    });
    
    console.log('✅ Classification complete');
    
    // Analyze classification accuracy
    console.log('\n📊 CLASSIFICATION RESULTS:');
    Object.entries(classificationStats).forEach(([category, count]) => {
      if (category !== 'total') {
        const percentage = ((count / classificationStats.total) * 100).toFixed(2);
        console.log(`   ${category}: ${count} logs (${percentage}%)`);
      }
    });
    
    // Get overall log source statistics for comparison
    console.log('\n🔍 Analyzing overall log source distribution...');
    const logSourceStats = await collection.aggregate([
      {
        $group: {
          _id: '$metadata.log_source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Validate rules against all known log sources
    console.log('\n🧪 Validating rules against all known log sources...');
    const validation = classifier.validateRules(logSourceStats);
    
    console.log('📊 VALIDATION RESULTS:');
    console.log(`   Total log sources: ${validation.totalSources}`);
    console.log(`   Total logs: ${validation.totalLogs.toLocaleString()}`);
    console.log(`   Coverage by volume: ${validation.coverageByVolume}%`);
    
    console.log('\n📊 CATEGORY BREAKDOWN:');
    Object.entries(validation.categoryStats).forEach(([category, stats]) => {
      const percentage = ((stats.logs / validation.totalLogs) * 100).toFixed(2);
      console.log(`   ${category}: ${stats.sources} sources, ${stats.logs.toLocaleString()} logs (${percentage}%)`);
    });
    
    // Show unclassified sources
    if (validation.unclassifiedSources.length > 0) {
      console.log('\n⚠️  UNCLASSIFIED SOURCES:');
      validation.unclassifiedSources.forEach(item => {
        console.log(`   ${item.source}: ${item.count} logs`);
      });
    }
    
    // Manual accuracy assessment for top log sources
    console.log('\n🎯 MANUAL ACCURACY ASSESSMENT:');
    const topSources = logSourceStats.slice(0, 10);
    let accurateClassifications = 0;
    let totalAssessed = 0;
    
    const manualAssessment = [];
    
    topSources.forEach(sourceData => {
      const source = sourceData._id;
      const count = sourceData.count;
      const classifiedAs = classifier.matchCategory(source) || 'system';
      
      // Manual assessment based on known patterns
      let expectedCategory = 'system'; // default
      let isAccurate = false;
      
      if (source === '/var/log/syslog' || source === 'kernel' || source.includes('Security') || source.includes('windows_System')) {
        expectedCategory = 'system';
        isAccurate = classifiedAs === 'system';
      } else if (source === 'network_snapshot' || source === 'NetworkMonitor') {
        expectedCategory = 'network';
        isAccurate = classifiedAs === 'network';
      } else if (source.includes('authentication') || source === 'UnifiedAuth') {
        expectedCategory = 'auth';
        isAccurate = classifiedAs === 'auth';
      } else if (source.includes('Application') || source.includes('nginx') || source.includes('apache') || source.includes('web-api')) {
        expectedCategory = 'application';
        isAccurate = classifiedAs === 'application';
      } else if (source.includes('Firewall')) {
        expectedCategory = 'firewall';
        isAccurate = classifiedAs === 'firewall';
      } else if (source === 'FIM') {
        expectedCategory = 'fim';
        isAccurate = classifiedAs === 'fim';
      } else {
        expectedCategory = 'system';
        isAccurate = classifiedAs === 'system';
      }
      
      if (isAccurate) accurateClassifications++;
      totalAssessed++;
      
      manualAssessment.push({
        source,
        count,
        expected: expectedCategory,
        classified: classifiedAs,
        accurate: isAccurate
      });
      
      const status = isAccurate ? '✅' : '❌';
      console.log(`   ${status} ${source} -> ${classifiedAs} (expected: ${expectedCategory}) [${count.toLocaleString()} logs]`);
    });
    
    const accuracyPercentage = ((accurateClassifications / totalAssessed) * 100).toFixed(2);
    console.log(`\n📊 ACCURACY: ${accurateClassifications}/${totalAssessed} (${accuracyPercentage}%)`);
    
    // Prepare validation report
    const validationReport = {
      timestamp: new Date().toISOString(),
      sampleSize: sampleLogs.length,
      classificationStats,
      overallValidation: validation,
      manualAssessment,
      accuracyPercentage: parseFloat(accuracyPercentage),
      recommendations: generateRecommendations(validation, manualAssessment)
    };
    
    // Save validation results
    const outputDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const jsonOutputPath = path.join(outputDir, 'mapping-validation-results.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(validationReport, null, 2));
    console.log(`\n💾 Validation results saved to: ${jsonOutputPath}`);
    
    // Generate validation report
    await generateValidationReport(validationReport, outputDir);
    
    return validationReport;
    
  } catch (error) {
    console.error('❌ Error validating mapping:', error);
    throw error;
  }
}

function generateRecommendations(validation, manualAssessment) {
  const recommendations = [];
  
  // Check coverage
  if (parseFloat(validation.coverageByVolume) < 95) {
    recommendations.push({
      type: 'coverage',
      message: `Coverage is ${validation.coverageByVolume}%, consider adding rules for unclassified sources`,
      priority: 'high'
    });
  }
  
  // Check for misclassifications
  const inaccurate = manualAssessment.filter(item => !item.accurate);
  if (inaccurate.length > 0) {
    recommendations.push({
      type: 'accuracy',
      message: `${inaccurate.length} misclassifications found in top sources`,
      priority: 'medium',
      details: inaccurate.map(item => `${item.source}: classified as ${item.classified}, expected ${item.expected}`)
    });
  }
  
  // Check for unclassified high-volume sources
  const highVolumeUnclassified = validation.unclassifiedSources.filter(item => item.count > 100);
  if (highVolumeUnclassified.length > 0) {
    recommendations.push({
      type: 'high_volume_unclassified',
      message: `${highVolumeUnclassified.length} high-volume sources are unclassified`,
      priority: 'high',
      details: highVolumeUnclassified.map(item => `${item.source}: ${item.count} logs`)
    });
  }
  
  return recommendations;
}

async function generateValidationReport(results, outputDir) {
  const reportPath = path.join(outputDir, 'mapping-validation-report.md');
  
  const report = `# Mapping Validation Report

**Generated**: ${results.timestamp}
**Sample Size**: ${results.sampleSize.toLocaleString()} logs
**Overall Accuracy**: ${results.accuracyPercentage}%

## Executive Summary

This validation tested the log type classification rules against ${results.sampleSize.toLocaleString()} sample logs and all known log sources. The classification achieved ${results.accuracyPercentage}% accuracy on top log sources and ${results.overallValidation.coverageByVolume}% coverage by volume.

## Classification Results (Sample)

| Category | Count | Percentage |
|----------|-------|------------|
${Object.entries(results.classificationStats)
  .filter(([key]) => key !== 'total')
  .map(([category, count]) => {
    const percentage = ((count / results.classificationStats.total) * 100).toFixed(2);
    return `| ${category} | ${count} | ${percentage}% |`;
  }).join('\n')}

## Overall Validation Results

- **Total Log Sources**: ${results.overallValidation.totalSources}
- **Total Logs**: ${results.overallValidation.totalLogs.toLocaleString()}
- **Coverage by Volume**: ${results.overallValidation.coverageByVolume}%

### Category Breakdown (All Logs)

| Category | Sources | Logs | Percentage |
|----------|---------|------|------------|
${Object.entries(results.overallValidation.categoryStats).map(([category, stats]) => {
  const percentage = ((stats.logs / results.overallValidation.totalLogs) * 100).toFixed(2);
  return `| ${category} | ${stats.sources} | ${stats.logs.toLocaleString()} | ${percentage}% |`;
}).join('\n')}

## Manual Accuracy Assessment

| Source | Expected | Classified | Accurate | Log Count |
|--------|----------|------------|----------|-----------|
${results.manualAssessment.map(item => {
  const status = item.accurate ? '✅' : '❌';
  return `| ${item.source} | ${item.expected} | ${item.classified} | ${status} | ${item.count.toLocaleString()} |`;
}).join('\n')}

**Accuracy**: ${results.accuracyPercentage}% (${results.manualAssessment.filter(item => item.accurate).length}/${results.manualAssessment.length})

## Recommendations

${results.recommendations.map(rec => `
### ${rec.type.toUpperCase()} (${rec.priority.toUpperCase()} Priority)
${rec.message}
${rec.details ? rec.details.map(detail => `- ${detail}`).join('\n') : ''}
`).join('\n')}

## Unclassified Sources

${results.overallValidation.unclassifiedSources.length > 0 ? 
  results.overallValidation.unclassifiedSources.map(item => 
    `- ${item.source}: ${item.count.toLocaleString()} logs`
  ).join('\n') : 
  'All sources are classified ✅'
}

## Next Steps

1. **Address High Priority Recommendations**: Focus on coverage and high-volume unclassified sources
2. **Refine Mapping Rules**: Update rules based on misclassifications identified
3. **Test Again**: Re-run validation after rule updates
4. **Proceed to Implementation**: If accuracy > 95%, proceed with backend implementation

---
*This report was generated automatically by the mapping validation script.*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📄 Validation report generated: ${reportPath}`);
}

async function main() {
  try {
    console.log('🚀 Starting mapping validation...');
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    const results = await validateMapping();
    
    console.log('\n✅ VALIDATION COMPLETE');
    console.log(`📊 Sample accuracy: ${results.accuracyPercentage}%`);
    console.log(`📊 Overall coverage: ${results.overallValidation.coverageByVolume}%`);
    console.log('\n📄 Generated files:');
    console.log('   - docs/mapping-validation-results.json');
    console.log('   - docs/mapping-validation-report.md');
    
    if (results.accuracyPercentage >= 95) {
      console.log('\n🎉 VALIDATION PASSED - Ready for implementation!');
    } else {
      console.log('\n⚠️  VALIDATION NEEDS IMPROVEMENT - Check recommendations');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the validation
console.log('🧪 Starting mapping validation script...');
main();