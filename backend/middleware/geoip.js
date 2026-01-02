import geoip from 'geoip-lite'

/**
 * Enrich log with geolocation data based on IP
 */
export const enrichGeoData = (log) => {
  if (!log.source_ip) return log

  const geo = geoip.lookup(log.source_ip)

  if (geo) {
    log.geo = {
      country: geo.country,
      city: geo.city || 'Unknown',
      lat: geo.ll ? geo.ll[0] : 0,
      lon: geo.ll ? geo.ll[1] : 0,
      asn: geo.as || 'Unknown',
      isp: geo.as ? geo.as.split(' ')[1] : 'Unknown'
    }
  }

  return log
}

/**
 * Enrich multiple logs with geolocation data
 */
export const enrichGeoDataBatch = (logs) => {
  return logs.map(log => enrichGeoData(log))
}
