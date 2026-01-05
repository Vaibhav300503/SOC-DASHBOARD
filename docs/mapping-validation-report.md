# Mapping Validation Report

**Generated**: 2026-01-04T17:30:29.881Z
**Sample Size**: 1,000 logs
**Overall Accuracy**: 100%

## Executive Summary

This validation tested the log type classification rules against 1,000 sample logs and all known log sources. The classification achieved 100% accuracy on top log sources and 99.99% coverage by volume.

## Classification Results (Sample)

| Category | Count | Percentage |
|----------|-------|------------|
| auth | 3 | 0.30% |
| network | 314 | 31.40% |
| firewall | 1 | 0.10% |
| application | 1 | 0.10% |
| database | 0 | 0.00% |
| system | 681 | 68.10% |
| registry | 0 | 0.00% |
| fim | 0 | 0.00% |

## Overall Validation Results

- **Total Log Sources**: 22
- **Total Logs**: 74,901
- **Coverage by Volume**: 99.99%

### Category Breakdown (All Logs)

| Category | Sources | Logs | Percentage |
|----------|---------|------|------------|
| auth | 3 | 246 | 0.33% |
| network | 3 | 24,119 | 32.20% |
| firewall | 1 | 95 | 0.13% |
| application | 4 | 353 | 0.47% |
| database | 0 | 0 | 0.00% |
| system | 10 | 50,083 | 66.87% |
| registry | 0 | 0 | 0.00% |
| fim | 1 | 5 | 0.01% |

## Manual Accuracy Assessment

| Source | Expected | Classified | Accurate | Log Count |
|--------|----------|------------|----------|-----------|
| /var/log/syslog | system | system | ✅ | 42,702 |
| network_snapshot | network | network | ✅ | 22,914 |
| windows_Security | system | system | ✅ | 5,357 |
| kernel | system | system | ✅ | 1,562 |
| NetworkMonitor | network | network | ✅ | 1,122 |
| nginx-access | application | application | ✅ | 234 |
| Security | system | system | ✅ | 212 |
| windows_authentication | auth | auth | ✅ | 209 |
| windows_System | system | system | ✅ | 138 |
| windows_Application | application | application | ✅ | 95 |

**Accuracy**: 100% (10/10)

## Recommendations



## Unclassified Sources

- test-script: 4 logs

## Next Steps

1. **Address High Priority Recommendations**: Focus on coverage and high-volume unclassified sources
2. **Refine Mapping Rules**: Update rules based on misclassifications identified
3. **Test Again**: Re-run validation after rule updates
4. **Proceed to Implementation**: If accuracy > 95%, proceed with backend implementation

---
*This report was generated automatically by the mapping validation script.*
