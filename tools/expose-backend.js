import ngrok from 'ngrok';
import { config } from 'dotenv';

config();

async function exposeBackend() {
  try {
    console.log('Exposing backend to the internet...');
    
    // Start ngrok tunnel
    const url = await ngrok.connect({
      addr: 3002, // Your backend port
      authtoken: process.env.NGROK_AUTH_TOKEN // Optional: get from ngrok dashboard
    });
    
    console.log('Backend is now publicly available at:', url);
    console.log('Configure this webhook URL in Tailscale:', `${url}/api/tailscale/ingest`);
    
    // Keep the tunnel open
    console.log('Press Ctrl+C to stop...');
    
  } catch (error) {
    console.error('Error exposing backend:', error);
  }
}

exposeBackend();
