const axios = require('axios');
require('dotenv').config();

async function testTailscaleAPI() {
  try {
    const apiKey = process.env.TAILSCALE_API_KEY;
    const tailnet = process.env.TAILSCALE_TAILNET;
    
    console.log('Testing Tailscale API...');
    console.log('API Key:', apiKey ? 'Present' : 'Missing');
    console.log('Tailnet:', tailnet);
    
    const response = await axios.get(
      `https://api.tailscale.com/api/v2/tailnet/${tailnet}/devices`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Success! Found', response.data.devices?.length || 0, 'devices');
    console.log('First device:', response.data.devices?.[0]?.name || 'None');
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}

testTailscaleAPI();
