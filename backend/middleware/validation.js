import Joi from 'joi'

export const validateTailscaleLog = (data) => {
  const schema = Joi.object({
    timestamp: Joi.date().optional(), // Tailscale sends 'timestamp' not 'ts'
    ts: Joi.date().optional(), // Keep for backward compatibility
    version: Joi.number().optional(),
    type: Joi.string().required(),
    tailnet: Joi.string().optional(),
    message: Joi.string().optional(),
    node_id: Joi.string().optional(),
    user: Joi.string().optional(),
    src: Joi.string().optional(),
    dst: Joi.string().optional(),
    event: Joi.string().optional(),
    status: Joi.string().optional(),
    device_name: Joi.string().optional(),
    device_os: Joi.string().optional(),
    ip_address: Joi.string().optional(),
    raw: Joi.object().optional()
  })

  return schema.validate(data)
}

export const validateLog = (data) => {
  const schema = Joi.object({
    timestamp: Joi.date().required(),
    // Allow basic string for IPs to support ranges or special values, though IP validation is best practice
    source_ip: Joi.string().allow('', null).optional(),
    dest_ip: Joi.string().allow('', null).optional(),
    endpoint: Joi.string().allow('', null).optional(),
    // Update severity to allow 'Info'
    severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low', 'Info').allow(null, '').optional(),
    // Update log_type to allow new standardized types
    log_type: Joi.string().valid(
      'Firewall', 'IDS', 'Authentication', 'App', 'System',
      'Network', 'Database', 'Registry', 'File Integrity',
      'auth', 'network', 'firewall', 'application', 'database', 'system', 'registry', 'fim'
    ).allow(null, '').optional(),
    geo: Joi.object({
      country: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      lat: Joi.number().allow(null),
      lon: Joi.number().allow(null),
      asn: Joi.string().allow('', null),
      isp: Joi.string().allow('', null)
    }).unknown(true).optional(),
    raw: Joi.object().unknown(true).optional(),
    source: Joi.string().allow('', null).optional(),
    // Explicitly allow new fields
    protocol: Joi.string().allow('', null).optional(),
    port: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
    src_port: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
    dst_port: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
    status: Joi.string().allow('', null).optional(),
    original_log_type: Joi.string().allow('', null).optional(),
    classification_version: Joi.string().allow('', null).optional(),
    classified_at: Joi.date().allow(null).optional(),
    log_source: Joi.string().allow('', null).optional(), // Agent field
    src_ip: Joi.string().allow('', null).optional(), // Agent field
    dst_ip: Joi.string().allow('', null).optional()  // Agent field
  }).unknown(true) // Allow any other fields to pass through (important!)

  return schema.validate(data)
}

export const validateLogArray = (data) => {
  const schema = Joi.array().items(
    Joi.object({
      timestamp: Joi.date().required(),
      source_ip: Joi.string().allow('', null).optional(),
      dest_ip: Joi.string().allow('', null).optional(),
      endpoint: Joi.string().allow('', null).optional(),
      severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low', 'Info').allow(null, '').optional(),
      log_type: Joi.string().valid(
        'Firewall', 'IDS', 'Authentication', 'App', 'System',
        'Network', 'Database', 'Registry', 'File Integrity',
        'auth', 'network', 'firewall', 'application', 'database', 'system', 'registry', 'fim'
      ).allow(null, '').optional(),
      geo: Joi.object().unknown(true).optional(),
      raw: Joi.object().unknown(true).optional(),
      source: Joi.string().allow('', null).optional(),
      protocol: Joi.string().allow('', null).optional(),
      port: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
      src_port: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
      dst_port: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
      status: Joi.string().allow('', null).optional(),
      original_log_type: Joi.string().allow('', null).optional(),
      classification_version: Joi.string().allow('', null).optional(),
      classified_at: Joi.date().allow(null).optional(),
      log_source: Joi.string().allow('', null).optional(),
      src_ip: Joi.string().allow('', null).optional(),
      dst_ip: Joi.string().allow('', null).optional()
    }).unknown(true)
  ).min(1).max(10000)

  return schema.validate(data)
}
