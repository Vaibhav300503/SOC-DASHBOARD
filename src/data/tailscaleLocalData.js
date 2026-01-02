// Local Tailscale data service for demo without backend
import logsData from '../../tusharyadav9813@gmail.com-logs-2025-12-08T09-12-23-043Z.json' assert { type: 'json' }

// Parse CSV data for devices
const devicesCSV = `Device name,Device ID,Managed by,Creator,OS,OS Version,Domain,Tailscale version,Tags,Created,Last seen,Key expiry,Tailscale IPs,Endpoints,Subnet router,Approved subnet routes,Unapproved subnet routes,Exit node,Ephemeral,Shared in,Tailscale SSH,Funnel
cyberpi,nWMTMRPr9u11CNTRL,,tusharyadav9813@gmail.com,linux,6.12.34+rpt-rpi-v8,cyberpi.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,tag:sshable,2025-10-13T19:57:28Z,2025-12-07T12:54:24Z,2026-04-14T09:39:22Z,"100.120.2.66,fd7a:115c:a1e0::a133:242",,,true,,,true
afhsan-linux,njgfJwzTjP11CNTRL,,soccyartteam@gmail.com,linux,5.15.0-139-generic,afhsan-linux.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,tag:sshable,2025-10-30T08:05:04Z,2025-12-06T18:34:20Z,2026-04-28T08:05:04Z,"100.127.217.22,fd7a:115c:a1e0::2f01:d917",,true,"192.168.118.0/24",,,,,true
manjira-ubuntu,nG69Xe4rYN11CNTRL,,soccyartteam@gmail.com,linux,6.8.0-87-generic,manjira-ubuntu.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,tag:sshable,2025-12-02T14:10:56Z,2025-12-08T11:46:55Z,2026-05-31T14:10:56Z,"100.68.123.13,fd7a:115c:a1e0::1101:7b13",,true,"192.168.1.0/24",,,,,true
raven,nWxpDh97oa11CNTRL,,sudarsonmv2002@gmail.com,windows,10.0.26200.7309,raven.tail4c43e.ts.net,1.90.8-tedc9d2245-ged5c52ee2,tag:sshable,2025-10-15T12:30:05Z,2025-12-05T19:11:20Z,2026-04-13T19:50:33Z,"100.75.36.39,fd7a:115c:a1e0::bb01:242a",,,,,,,,
shamaaila,nVTnHmnPJ221CNTRL,,soccyartteam@gmail.com,windows,10.0.26100.7462,shamaaila.tail4c43e.ts.net,1.88.4-tc18ddfa3d-g1ae3b1c43,tag:sshable,2025-10-16T17:35:19Z,2025-12-12T14:00:02Z,2026-04-14T17:35:19Z,"100.114.141.67,fd7a:115c:a1e0::f401:8d69",,,,,,,,
tushar-window,nJJxFwEi4j11CNTRL,,tusharyadav9813@gmail.com,windows,10.0.26200.7462,tushar-window.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,tag:sshable,2025-10-13T10:14:41Z,,2026-04-13T18:16:09Z,"100.77.133.107,fd7a:115c:a1e0::a633:856b",,,,,,,,
vaibhav-windows,ngaxnBtXMA21CNTRL,,soccyartteam@gmail.com,windows,10.0.19045.6456,vaibhav-windows.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,tag:sshable,2025-11-28T17:17:15Z,,2026-05-27T17:17:15Z,"100.100.83.123,fd7a:115c:a1e0::b801:5382",,,,,,,,
wsl-ubuntu,nZssZbmymE11CNTRL,,tusharyadav9813@gmail.com,linux,6.6.87.2-microsoft-standard-WSL2,wsl-ubuntu.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,tag:sshable,2025-11-25T18:36:10Z,2025-12-07T12:53:47Z,2026-05-24T18:36:10Z,"100.108.227.68,fd7a:115c:a1e0::fd01:e37e",,,,,,,true
afshan-windows,njvDNiXAra11CNTRL,soccyartteam@gmail.com,soccyartteam@gmail.com,windows,10.0.26200.7309,afshan-windows.tail4c43e.ts.net,1.90.9-t6e8a4f2de-g19196f361,,2025-11-27T15:24:16Z,2025-12-07T15:30:35Z,2026-05-26T15:53:35Z,"100.71.32.57,fd7a:115c:a1e0::9e01:203e",,,,,,,,
angel,ngoHvMyk8r11CNTRL,soccyartteam@gmail.com,soccyartteam@gmail.com,windows,10.0.26200.7171,angel.tail4c43e.ts.net,1.90.4-t0d7298602-g1c96c3ed9,,2025-10-30T15:40:52Z,2025-12-12T08:30:06Z,2026-04-28T15:40:52Z,"100.113.140.2,fd7a:115c:a1e0::5201:8c02",,,,,,,,
arunkasthuri-m,nWG3CWkjJz11CNTRL,soccyartteam@gmail.com,soccyartteam@gmail.com,windows,10.0.26200.7309,arunkasthuri-m.tail4c43e.ts.net,1.90.4-t0d7298602-g1c96c3ed9,,2025-10-30T14:13:30Z,2025-12-11T16:58:13Z,2026-04-28T15:37:55Z,"100.79.213.122,fd7a:115c:a1e0::e301:d57b",,,,,,,,
gokul-windows,nt1XMbskmm11CNTRL,soccyartteam@gmail.com,soccyartteam@gmail.com,windows,10.0.26200.7171,gokul-windows.tail4c43e.ts.net,1.90.4-t0d7298602-g1c96c3ed9,,2025-10-30T20:40:34Z,2025-11-20T15:47:50Z,2026-04-28T20:40:34Z,"100.104.253.90,fd7a:115c:a1e0::f501:fd5a",,,,,,,,
sandhya-vapt,niGSdU6JaT11CNTRL,soccyartteam@gmail.com,soccyartteam@gmail.com,windows,10.0.26200.7462,sandhya-vapt.tail4c43e.ts.net,1.90.6-t0238943bb-g1851f6203,,2025-11-05T09:55:09Z,2025-12-12T14:10:09Z,2026-05-04T09:55:09Z,"100.102.114.64,fd7a:115c:a1e0::fe01:7265",,,,,,,,`

// Parse CSV to get device data
function parseCSV(csv) {
  const lines = csv.split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, ''))
    const device = {}
    headers.forEach((header, index) => {
      device[header] = values[index]
    })
    return device
  })
}

const devices = parseCSV(devicesCSV)

// Calculate device statistics
function calculateDeviceStats() {
  const totalDevices = devices.length
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Make only vaibhav-windows online, others offline
  const onlineDevices = devices.filter(device => {
    return device['Device name'] === 'vaibhav-windows'
  }).length
  
  const offlineDevices = totalDevices - onlineDevices
  
  // Determine critical risk based on old versions or offline status
  const criticalRisk = devices.filter(device => {
    const isOffline = device['Device name'] !== 'vaibhav-windows'
    const hasOldVersion = device['Tailscale version'] && 
      device['Tailscale version'].startsWith('1.88.') || 
      device['Tailscale version'].startsWith('1.90.4')
    return isOffline || hasOldVersion
  }).length
  
  const highRisk = devices.filter(device => {
    const isOffline = device['Device name'] !== 'vaibhav-windows'
    const hasOldVersion = device['Tailscale version'] && 
      device['Tailscale version'].startsWith('1.90.6')
    return isOffline && !hasOldVersion
  }).length
  
  return {
    totalDevices,
    onlineDevices,
    offlineDevices,
    criticalRisk,
    highRisk
  }
}

// Calculate geographic distribution
function calculateGeoDistribution() {
  const geoMap = {}
  devices.forEach(device => {
    // Extract country from domain or use default
    const domain = device['Domain'] || ''
    let country = 'Unknown'
    
    if (domain.includes('.ts.net')) {
      // This is a Tailscale domain, we'll simulate some geographic distribution
      const creators = ['tusharyadav9813@gmail.com', 'soccyartteam@gmail.com', 'sudarsonmv2002@gmail.com']
      if (device['Creator'] === 'tusharyadav9813@gmail.com') {
        country = 'India'
      } else if (device['Creator'] === 'soccyartteam@gmail.com') {
        country = 'India'
      } else if (device['Creator'] === 'sudarsonmv2002@gmail.com') {
        country = 'United States'
      }
    }
    
    geoMap[country] = (geoMap[country] || 0) + 1
  })
  
  return Object.entries(geoMap).map(([country, count]) => ({
    country,
    count,
    city: country === 'India' ? 'Multiple Cities' : 'Unknown'
  }))
}

// Process recent activity from logs
function getRecentActivity() {
  const recentLogs = logsData.logs.slice(-10).reverse().map(log => ({
    _id: log.eventGroupID || Math.random().toString(),
    type: `${log.action} ${log.type}`,
    user: log.actor?.displayName || log.actor?.loginName || 'system',
    ts: log.eventTime,
    details: `${log.action} on ${log.target?.name || log.target?.type || 'system'}`
  }))
  
  return recentLogs
}

// Main data object
const tailscaleLocalData = {
  deviceStats: calculateDeviceStats(),
  geoDistribution: calculateGeoDistribution(),
  recentActivity: getRecentActivity(),
  syncStatus: {
    lastSyncTime: new Date().toISOString(),
    status: 'success'
  },
  source: 'local_data'
}

export default tailscaleLocalData
