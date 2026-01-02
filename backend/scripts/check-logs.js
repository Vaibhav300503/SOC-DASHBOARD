import mongoose from 'mongoose';
import TailscaleLog from '../models/TailscaleLog.js';
import { config } from 'dotenv';

config();

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const logs = await TailscaleLog.find({ source: 'exported_logs' }).lean();
    console.log('Total exported logs:', logs.length);
    console.log('\nLog types found:');
    const types = {};
    logs.forEach(log => {
      types[log.type] = (types[log.type] || 0) + 1;
    });
    Object.entries(types).forEach(([type, count]) => {
      console.log('- ' + type + ': ' + count);
    });
    
    console.log('\nSample logs:');
    logs.slice(0, 5).forEach((log, i) => {
      console.log(`${i+1}. Type: ${log.type}, Action: ${log.action}, Message: ${log.message}`);
    });
    
    console.log('\nChecking for specific log types:');
    const peerConnections = logs.filter(log => log.type === 'peer_connected' || log.type === 'peer_disconnected');
    const subnetRouters = logs.filter(log => log.type === 'subnet_route_added' || log.type === 'subnet_route_removed');
    const userSessions = logs.filter(log => log.type === 'auth_success' || log.type === 'auth_failed' || log.type === 'user_login' || log.type === 'user_logout');
    
    console.log('- Peer connections:', peerConnections.length);
    console.log('- Subnet routers:', subnetRouters.length);
    console.log('- User sessions:', userSessions.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLogs();
