/**
 * Severity Classifier
 * Centralized logic for determining log severity
 * Ensures consistent severity mapping across ingestion, migration, and analysis
 */

class SeverityClassifier {
    constructor() {
        this.rules = [
            {
                severity: 'Critical',
                regex: /critical|alert|emergency|severe|attack|breach|malicious/i
            },
            {
                severity: 'High',
                regex: /security|intrusion|malware|warning|unauthorized|denied|blocked/i
            },
            {
                severity: 'Medium',
                regex: /error|fail|medium|kernel|exception|timeout/i
            },
            {
                severity: 'Low',
                regex: /low|info|debug|trace|system/i // Explicit low matches
            }
        ]
        this.defaultSeverity = 'Low'
    }

    /**
     * Determine severity from log data
     * @param {Object} log - The log object
     * @returns {string} - Standardized severity (Critical, High, Medium, Low)
     */
    classify(log) {
        // 1. Check if valid severity already exists in known fields
        if (this._isValidSeverity(log.severity)) return this._normalize(log.severity)
        if (this._isValidSeverity(log.metadata?.severity)) return this._normalize(log.metadata.severity)
        if (this._isValidSeverity(log.raw_data?.severity)) return this._normalize(log.raw_data.severity)

        // 2. Derive from log sources or message content
        const inputs = [
            log.metadata?.log_source,
            log.raw_data?.log_source,
            log.log_type,
            log.message,
            JSON.stringify(log.raw_data || {}) // Deep scan as fallback
        ].filter(Boolean)

        for (const input of inputs) {
            const match = this._matchSeverity(input)
            if (match) return match
        }

        return this.defaultSeverity
    }

    _isValidSeverity(val) {
        if (!val) return false
        const s = String(val).toLowerCase().trim()
        return ['critical', 'high', 'medium', 'low', 'info'].includes(s)
    }

    _normalize(val) {
        const s = String(val).toLowerCase().trim()
        if (s.includes('critical')) return 'Critical'
        if (s.includes('high')) return 'High'
        if (s.includes('medium')) return 'Medium'
        return 'Low'
    }

    _matchSeverity(text) {
        const s = String(text)
        for (const rule of this.rules) {
            if (rule.regex.test(s)) {
                return rule.severity
            }
        }
        return null
    }
}

export default new SeverityClassifier()
