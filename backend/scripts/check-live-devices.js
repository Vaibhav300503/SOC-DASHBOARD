import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import tailscaleService from '../services/tailscale.js';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

async function checkLiveDevices() {
  try {
    console.log('Fetching devices from live Tailscale API...');
    console.log('API Key from env:', process.env.TAILSCALE_API_KEY);
    console.log('Using API key:', process.env.TAILSCALE_API_KEY ? 'Found' : 'Not found');
    console.log('Using tailnet:', process.env.TAILNET || 'Not configured');
    
    // Test direct API call
    const axios = await import('axios');
    const response = await axios.default.get(`https://api.tailscale.com/api/v2/tailnet/${process.env.TAILNET}/devices`, {
      headers: {
        'Authorization': `Bearer ${process.env.TAILSCALE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const devices = response.data.devices;
    
    console.log('\n=== Live Tailscale Device Status ===');
    console.log('Total devices:', devices.length);
    console.log('Online devices:', devices.filter(d => d.connectedToControl).length);
    console.log('Offline devices:', devices.filter(d => !d.connectedToControl).length);
    
    console.log('\nDevice Details:');
    devices.forEach((device, index) => {
      console.log(`${index + 1}. ${device.name || device.id}:`);
      console.log(`   Status: ${device.connectedToControl ? 'ONLINE' : 'OFFLINE'}`);
      console.log(`   OS: ${device.os || 'Unknown'}`);
      console.log(`   Last seen: ${device.lastSeen || 'Unknown'}`);
      console.log(`   Connected to control: ${device.connectedToControl}`);
      if (device.location) {
        console.log(`   Location: ${device.location.country || 'Unknown'}`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error fetching live devices:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

checkLiveDevices();
