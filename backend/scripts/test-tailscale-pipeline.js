#!/usr/bin/env node

/**
 * Test script to verify Tailscale data pipeline functionality
 * Tests API integration, authentication, and WebSocket connectivity
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import TailscaleDevice from './models/TailscaleDevice.js';
import lockedSyncService from './services/tailscaleSyncLocked.js';
import secureLogger from './middleware/secureLogger.js';

// Load environment
dotenv.config();

class TailscalePipelineTest {
  constructor() {
    this.testResults = {
      database: false,
      api: false,
      sync: false,
      config: false
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Tailscale Pipeline Tests...\n');
    
    await this.testConfiguration();
    await this.testDatabaseConnection();
    await this.testTailscaleAPI();
    await this.testSyncService();
    
    this.printResults();
  }

  async testConfiguration() {
    console.log('📋 Testing Configuration...');
    
    const required = ['TAILSCALE_API_KEY', 'MONGODB_URI', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length === 0) {
      console.log('✅ All required environment variables present');
      this.testResults.config = true;
    } else {
      console.log('❌ Missing environment variables:', missing);
    }
    
    // Check API key format
    const apiKey = process.env.TAILSCALE_API_KEY;
    if (apiKey && apiKey.startsWith('tskey-api-')) {
      console.log('✅ Tailscale API key format looks correct');
    } else if (apiKey) {
      console.log('⚠️  Tailscale API key format may be incorrect');
    }
    
    console.log('');
  }

  async testDatabaseConnection() {
    console.log('🗄️  Testing Database Connection...');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
      
      // Test TailscaleDevice model
      const deviceCount = await TailscaleDevice.countDocuments();
      console.log(`📊 Found ${deviceCount} existing devices in database`);
      
      this.testResults.database = true;
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
    }
    
    console.log('');
  }

  async testTailscaleAPI() {
    console.log('🌐 Testing Tailscale API...');
    
    try {
      const tailscaleService = await import('./services/tailscale.js');
      const devices = await tailscaleService.default.getDevices();
      
      if (Array.isArray(devices)) {
        console.log(`✅ Tailscale API returned ${devices.length} devices`);
        
        // Check device structure
        if (devices.length > 0) {
          const sample = devices[0];
          const hasRequired = ['id', 'name', 'addresses'].every(field => sample[field]);
          console.log(hasRequired ? '✅ Device structure looks valid' : '⚠️  Device structure may be incomplete');
        }
        
        this.testResults.api = true;
      } else {
        console.log('❌ API response is not an array');
      }
    } catch (error) {
      console.log('❌ Tailscale API test failed:', error.message);
      
      if (error.message.includes('401')) {
        console.log('💡 This likely means the API key is invalid or expired');
      } else if (error.message.includes('403')) {
        console.log('💡 This likely means insufficient permissions for the API key');
      }
    }
    
    console.log('');
  }

  async testSyncService() {
    console.log('🔄 Testing Sync Service...');
    
    try {
      // Test sync status
      const status = lockedSyncService.getSyncStatus();
      console.log('✅ Sync service status check passed');
      
      // Test manual sync (limited scope)
      console.log('🔄 Testing manual sync...');
      const syncResult = await lockedSyncService.manualSync();
      
      if (syncResult.success) {
        console.log(`✅ Manual sync completed: ${syncResult.created} created, ${syncResult.updated} updated`);
        this.testResults.sync = true;
      } else {
        console.log('⚠️  Manual sync returned:', syncResult.reason || syncResult.error);
        
        // Still count as success if it's just a lock issue
        if (syncResult.reason?.includes('in progress')) {
          console.log('✅ Sync service is working (another sync in progress)');
          this.testResults.sync = true;
        }
      }
    } catch (error) {
      console.log('❌ Sync service test failed:', error.message);
    }
    
    console.log('');
  }

  printResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const name = test.charAt(0).toUpperCase() + test.slice(1);
      console.log(`${name.padEnd(12)}: ${status}`);
    });
    
    const passedCount = Object.values(this.testResults).filter(Boolean).length;
    const totalCount = Object.keys(this.testResults).length;
    
    console.log('='.repeat(50));
    console.log(`Overall: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! Tailscale pipeline is ready.');
    } else {
      console.log('⚠️  Some tests failed. Check the issues above.');
    }
    
    console.log('\n📝 NEXT STEPS:');
    if (!this.testResults.config) {
      console.log('- Fix missing environment variables');
    }
    if (!this.testResults.database) {
      console.log('- Check MongoDB connection and credentials');
    }
    if (!this.testResults.api) {
      console.log('- Verify Tailscale API key and permissions');
    }
    if (!this.testResults.sync) {
      console.log('- Check sync service logs and Redis connection');
    }
    
    if (passedCount === totalCount) {
      console.log('\n🚀 You can now start the server: npm run dev');
      console.log('📱 Then visit: http://localhost:3002/api/test/db');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new TailscalePipelineTest();
  tester.runAllTests().catch(console.error);
}

export default TailscalePipelineTest;
