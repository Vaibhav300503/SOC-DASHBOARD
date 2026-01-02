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
    source_ip: Joi.string().ip().required(),
    dest_ip: Joi.string().ip().required(),
    endpoint: Joi.string().required(),
    severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').required(),
    log_type: Joi.string().valid('Firewall', 'IDS', 'Authentication', 'App', 'System').required(),
    geo: Joi.object({
      country: Joi.string(),
      city: Joi.string(),
      lat: Joi.number(),
      lon: Joi.number(),
      asn: Joi.string(),
      isp: Joi.string()
    }),
    raw: Joi.object(),
    source: Joi.string()
  })

  return schema.validate(data)
}

export const validateLogArray = (data) => {
  const schema = Joi.array().items(
    Joi.object({
      timestamp: Joi.date().required(),
      source_ip: Joi.string().ip().required(),
      dest_ip: Joi.string().ip().required(),
      endpoint: Joi.string().required(),
      severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').required(),
      log_type: Joi.string().valid('Firewall', 'IDS', 'Authentication', 'App', 'System').required(),
      geo: Joi.object(),
      raw: Joi.object(),
      source: Joi.string()
    })
  ).min(1).max(10000)

  return schema.validate(data)
}
