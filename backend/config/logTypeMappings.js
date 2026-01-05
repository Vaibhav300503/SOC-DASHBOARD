/**
 * Log Type Mapping Rules
 * Based on analysis of 74,901 logs in MongoDB raw_logs collection
 * Maps existing log sources to 8 standardized categories
 * Part of Task 1.2: Create Comprehensive Mapping Rules
 */

export const LOG_TYPE_MAPPINGS = {
  // Authentication logs - 246 logs (0.33%)
  'auth': {
    exactMatches: [
      'UnifiedAuth',
      'windows_authentication',
      'authentication'
    ],
    patterns: [
      /unified.*auth/i,
      /windows.*auth/i,
      /login/i,
      /logon/i,
      /logoff/i,
      /credential/i,
      /ldap/i,
      /active.*directory/i,
      /kerberos/i,
      /oauth/i,
      /saml/i
    ],
    keywords: [
      'auth',
      'login',
      'authentication',
      'logon',
      'logoff',
      'credential',
      'password',
      'token',
      'session'
    ],
    sources: [
      'UnifiedAuth',
      'ActiveDirectory',
      'LDAP',
      'OAuth',
      'SAML'
    ]
  },

  // Network logs - 24,036 logs (32.09%)
  'network': {
    exactMatches: [
      'network_snapshot',
      'NetworkMonitor',
      'tailscale'
    ],
    patterns: [
      /network.*snapshot/i,
      /network.*monitor/i,
      /tcp/i,
      /udp/i,
      /dns/i,
      /http/i,
      /https/i,
      /connection/i,
      /traffic/i,
      /packet/i,
      /tailscale/i,
      /vpn/i
    ],
    keywords: [
      'network',
      'tcp',
      'udp',
      'dns',
      'http',
      'https',
      'connection',
      'traffic',
      'packet',
      'router',
      'switch',
      'vpn',
      'tailscale'
    ],
    sources: [
      'NetworkMonitor',
      'Wireshark',
      'Netflow',
      'Tailscale',
      'pfSense'
    ]
  },

  // Firewall logs - 95 logs (0.13%)
  'firewall': {
    exactMatches: [
      'windows_Microsoft-Windows-Windows Firewall With Advanced Security/Firewall'
    ],
    patterns: [
      /firewall/i,
      /iptables/i,
      /pf/i,
      /windows.*firewall/i,
      /ufw/i,
      /block/i,
      /allow/i,
      /deny/i,
      /drop/i
    ],
    keywords: [
      'firewall',
      'iptables',
      'pf',
      'ufw',
      'block',
      'allow',
      'deny',
      'drop',
      'rule',
      'policy'
    ],
    sources: [
      'WindowsFirewall',
      'iptables',
      'pfSense',
      'UFW',
      'Cisco ASA'
    ]
  },

  // Application logs - 353 logs (0.47%)
  'application': {
    exactMatches: [
      'windows_Application',
      'nginx-access',
      'web-api',
      'apache-access'
    ],
    patterns: [
      /application/i,
      /app/i,
      /service/i,
      /web.*api/i,
      /nginx/i,
      /apache/i,
      /iis/i,
      /tomcat/i,
      /jetty/i
    ],
    keywords: [
      'application',
      'app',
      'service',
      'web',
      'api',
      'nginx',
      'apache',
      'iis',
      'tomcat',
      'error',
      'exception'
    ],
    sources: [
      'IIS',
      'Apache',
      'Nginx',
      'Tomcat',
      'Jetty',
      'Node.js'
    ]
  },

  // Database logs - 0 logs identified (but pattern ready)
  'database': {
    exactMatches: [],
    patterns: [
      /database/i,
      /sql/i,
      /mysql/i,
      /postgres/i,
      /postgresql/i,
      /mongodb/i,
      /oracle/i,
      /mssql/i,
      /sqlite/i,
      /redis/i
    ],
    keywords: [
      'database',
      'sql',
      'mysql',
      'postgres',
      'postgresql',
      'mongodb',
      'oracle',
      'mssql',
      'sqlite',
      'redis',
      'query',
      'table',
      'insert',
      'update',
      'delete',
      'select'
    ],
    sources: [
      'MySQL',
      'PostgreSQL',
      'MongoDB',
      'Oracle',
      'MSSQL',
      'SQLite',
      'Redis'
    ]
  },

  // System logs - 50,107 logs (66.87%)
  'system': {
    exactMatches: [
      '/var/log/syslog',
      'windows_Security',
      'kernel',
      'Security',
      'windows_System',
      'windows_Microsoft-Windows-Windows Defender/Operational',
      'linux-audit',
      'sudoers'
    ],
    patterns: [
      /\/var\/log\/syslog/i,
      /windows.*security/i,
      /kernel/i,
      /security/i,
      /windows.*system/i,
      /windows.*defender/i,
      /syslog/i,
      /eventlog/i,
      /audit/i,
      /sudo/i,
      /cron/i,
      /systemd/i,
      /boot/i,
      /shutdown/i
    ],
    keywords: [
      'system',
      'kernel',
      'syslog',
      'security',
      'windows',
      'defender',
      'eventlog',
      'audit',
      'sudo',
      'cron',
      'systemd',
      'boot',
      'shutdown',
      'process',
      'service'
    ],
    sources: [
      'WindowsDefender',
      'Syslog',
      'EventLog',
      'Security',
      'Audit',
      'Systemd'
    ]
  },

  // Registry logs - 0 logs identified (but pattern ready)
  'registry': {
    exactMatches: [],
    patterns: [
      /registry/i,
      /reg/i,
      /hkey/i,
      /windows.*registry/i,
      /regmon/i,
      /modification/i
    ],
    keywords: [
      'registry',
      'reg',
      'hkey',
      'hklm',
      'hkcu',
      'modification',
      'key',
      'value',
      'regmon'
    ],
    sources: [
      'WindowsRegistry',
      'RegMon',
      'ProcessMonitor'
    ]
  },

  // File Integrity Monitoring logs - 5 logs (0.01%)
  'fim': {
    exactMatches: [
      'FIM'
    ],
    patterns: [
      /fim/i,
      /file.*integrity/i,
      /ossec/i,
      /samhain/i,
      /aide/i,
      /tripwire/i,
      /file.*monitor/i,
      /checksum/i
    ],
    keywords: [
      'fim',
      'file',
      'integrity',
      'ossec',
      'samhain',
      'aide',
      'tripwire',
      'checksum',
      'hash',
      'modification',
      'monitor'
    ],
    sources: [
      'OSSEC',
      'Samhain',
      'AIDE',
      'Tripwire',
      'Wazuh'
    ]
  }
};

/**
 * Get user-friendly display names for categories
 */
export const CATEGORY_DISPLAY_NAMES = {
  'auth': 'Authentication',
  'network': 'Network',
  'firewall': 'Firewall',
  'application': 'Application',
  'database': 'Database',
  'system': 'System',
  'registry': 'Registry',
  'fim': 'File Integrity'
};

/**
 * Get category descriptions
 */
export const CATEGORY_DESCRIPTIONS = {
  'auth': 'Authentication and authorization events',
  'network': 'Network traffic, connections, and protocols',
  'firewall': 'Firewall rules, blocks, allows, and denies',
  'application': 'Application-specific logs and events',
  'database': 'Database operations and queries',
  'system': 'Operating system events and processes',
  'registry': 'Windows registry modifications',
  'fim': 'File Integrity Monitoring events'
};

/**
 * Get all standardized categories
 */
export const STANDARD_LOG_TYPES = Object.keys(LOG_TYPE_MAPPINGS);

/**
 * Default category for unmatched log types
 */
export const DEFAULT_LOG_TYPE = 'system';