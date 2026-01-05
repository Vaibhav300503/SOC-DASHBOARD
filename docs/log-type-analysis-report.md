# Log Type Analysis Report

**Generated**: 2026-01-04T17:27:47.878Z
**Total Logs Analyzed**: 74,901

## Executive Summary

This analysis examined 74,901 logs in the MongoDB `raw_logs` collection to understand the current log type classification landscape. The analysis identified 22 unique log sources in the `metadata.log_source` field, which appears to be the primary source of log type information.

## Key Findings

### Field Usage Analysis
- **metadata.log_source**: 22 unique values
- **log_type**: 1 unique values  
- **raw_data.log_source**: 22 unique values

### Field Presence in Sample Documents
- metadata.log_source: 10/10 documents
- log_type: 0/10 documents
- raw_data.log_source: 10/10 documents

## Top 20 Log Sources (metadata.log_source)

| Rank | Log Source | Count | Percentage |
|------|------------|-------|------------|
| 1 | /var/log/syslog | 42,702 | 57.01% |
| 2 | network_snapshot | 22,914 | 30.59% |
| 3 | windows_Security | 5,357 | 7.15% |
| 4 | kernel | 1,562 | 2.09% |
| 5 | NetworkMonitor | 1,122 | 1.50% |
| 6 | nginx-access | 234 | 0.31% |
| 7 | Security | 212 | 0.28% |
| 8 | windows_authentication | 209 | 0.28% |
| 9 | windows_System | 138 | 0.18% |
| 10 | windows_Application | 95 | 0.13% |
| 11 | windows_Microsoft-Windows-Windows Firewall With Advanced Security/Firewall | 95 | 0.13% |
| 12 | windows_Microsoft-Windows-Windows Defender/Operational | 95 | 0.13% |
| 13 | tailscale | 83 | 0.11% |
| 14 | authentication | 33 | 0.04% |
| 15 | web-api | 14 | 0.02% |
| 16 | apache-access | 10 | 0.01% |
| 17 | linux-audit | 6 | 0.01% |
| 18 | FIM | 5 | 0.01% |
| 19 | sudoers | 5 | 0.01% |
| 20 | UnifiedAuth | 4 | 0.01% |

## Classification Mapping Recommendations

Based on the analysis, here are the recommended mappings for the 8 standardized categories:

### Authentication (auth)
- Look for: UnifiedAuth, login, authentication, logon, credential patterns
- Estimated logs: 246

### Network (network)  
- Look for: NetworkMonitor, network, tcp, udp, dns, http patterns
- Estimated logs: 24,036

### System (system)
- Look for: Security, windows, defender, kernel, syslog patterns  
- Estimated logs: 7,765

### Other Categories
- **Firewall**: Look for firewall, iptables, block/allow patterns
- **Application**: Look for application, app, service, web, api patterns  
- **Database**: Look for database, sql, mysql, postgres, mongodb patterns
- **Registry**: Look for registry, reg, hkey patterns
- **FIM**: Look for fim, file, integrity, ossec patterns

## Recommendations

1. **Primary Classification Field**: Use `metadata.log_source` as the primary field for classification
2. **Fallback Strategy**: Use `log_type` and `raw_data.log_source` as fallbacks
3. **Default Category**: Use 'system' as the default category for unmatched types
4. **Coverage**: Current analysis suggests ~95% of logs can be classified using pattern matching

## Next Steps

1. Create comprehensive mapping rules based on these patterns
2. Implement LogTypeClassifier with pattern matching logic
3. Test classification accuracy against sample data
4. Refine mapping rules based on validation results

---
*This report was generated automatically by the log type analysis script.*
