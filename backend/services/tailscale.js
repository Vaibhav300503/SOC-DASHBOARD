import axios from 'axios';

class TailscaleService {
  constructor() {
    this.apiKey = process.env.TAILSCALE_API_KEY;
    this.tailnet = process.env.TAILNET || process.env.TAILSCALE_TAILNET || 'default';
    this.baseURL = 'https://api.tailscale.com/api/v2';
    this.timeout = 30000; // 30 seconds timeout
    
    if (!this.apiKey) {
      console.warn('TAILSCALE_API_KEY not found in environment variables');
    }
    
    // Create axios instance with timeout and retry config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add retry interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const config = error.config;
        
        // Retry on network errors or 5xx responses
        if (!config.retryCount && 
            (error.code === 'ECONNRESET' || 
             error.code === 'ETIMEDOUT' || 
             (error.response && error.response.status >= 500))) {
          
          config.retryCount = config.retryCount || 0;
          
          if (config.retryCount < 3) {
            config.retryCount++;
            
            // Exponential backoff
            const delay = Math.pow(2, config.retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.client(config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async getDevices() {
    try {
      const startTime = Date.now();
      const response = await this.client.get(`/tailnet/${this.tailnet}/devices`);
      const duration = Date.now() - startTime;
      
      console.log(`Tailscale API: getDevices completed in ${duration}ms`);
      
      // Validate response structure
      if (!response.data || !Array.isArray(response.data.devices)) {
        throw new Error('Invalid response structure from Tailscale API');
      }
      
      return response.data.devices;
    } catch (error) {
      console.error('Error fetching Tailscale devices:', error.response?.data || error.message);
      
      // Add more specific error information
      if (error.response) {
        throw new Error(`Tailscale API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Tailscale API request timeout');
      } else {
        throw error;
      }
    }
  }

  async getDevice(deviceId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/device/${deviceId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Tailscale device:', error.response?.data || error.message);
      throw error;
    }
  }

  async getACL() {
    try {
      const response = await axios.get(
        `${this.baseURL}/tailnet/${this.tailnet}/acl`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Tailscale ACL:', error.response?.data || error.message);
      throw error;
    }
  }

  async getDNS() {
    try {
      const response = await axios.get(
        `${this.baseURL}/tailnet/${this.tailnet}/dns`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Tailscale DNS:', error.response?.data || error.message);
      throw error;
    }
  }

  async getRoutes() {
    try {
      const response = await axios.get(
        `${this.baseURL}/tailnet/${this.tailnet}/routes`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Tailscale routes:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAuditLogs(limit = 100, since = null) {
    try {
      const params = { limit };
      if (since) {
        params.since = since.toISOString();
      }
      
      const response = await this.client.get(`/tailnet/${this.tailnet}/audit/logs`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error.response?.data || error.message);
      throw error;
    }
  }

  async getHistoricalLogs(daysBack = 7) {
    try {
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      console.log(`Fetching logs from last ${daysBack} days since ${since.toISOString()}`);
      
      // Fetch in batches to handle large datasets
      const allLogs = [];
      let offset = 0;
      const batchSize = 100;
      
      while (true) {
        const response = await this.client.get(`/tailnet/${this.tailnet}/audit/logs`, {
          params: { 
            limit: batchSize,
            offset: offset,
            since: since.toISOString()
          }
        });
        
        if (!response.data || response.data.length === 0) {
          break;
        }
        
        allLogs.push(...response.data);
        offset += batchSize;
        
        // Stop if we have enough logs
        if (response.data.length < batchSize) {
          break;
        }
      }
      
      console.log(`Fetched ${allLogs.length} historical logs from Tailscale`);
      return allLogs;
    } catch (error) {
      console.error('Error fetching historical logs:', error.response?.data || error.message);
      throw error;
    }
  }

  async getKeys() {
    try {
      const response = await axios.get(
        `${this.baseURL}/tailnet/${this.tailnet}/keys`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.keys;
    } catch (error) {
      console.error('Error fetching Tailscale keys:', error.response?.data || error.message);
      throw error;
    }
  }
}

export { TailscaleService };

export default new TailscaleService();
