/**
 * Cross-Functional Requirements (CFR) framework.
 *
 * CFRs are the non-functional requirements every service needs:
 * auth, audit, logging, observability, error handling, etc.
 *
 * Bundles declare which CFRs they provide. Specs configure which are enabled.
 * Verify checks they're present. The framework makes the invisible visible.
 */

/**
 * Standard CFR categories. Bundles declare which they implement.
 * This list serves as a discovery aid — "here's what you should consider baking in."
 */
export const CFR_CATALOG: CfrDefinition[] = [
  // Security
  { id: 'auth', category: 'security', name: 'Authentication', description: 'JWT/OAuth2 bearer token validation on all endpoints' },
  { id: 'authorization', category: 'security', name: 'Authorization', description: 'Role-based or policy-based access control per operation' },
  { id: 'cors', category: 'security', name: 'CORS', description: 'Cross-origin resource sharing configuration' },
  { id: 'input-validation', category: 'security', name: 'Input Validation', description: 'Request body and parameter validation with error responses' },
  { id: 'rate-limiting', category: 'security', name: 'Rate Limiting', description: 'Request rate throttling per client/endpoint' },

  // Observability
  { id: 'logging', category: 'observability', name: 'Structured Logging', description: 'JSON-structured logs with correlation IDs' },
  { id: 'metrics', category: 'observability', name: 'Metrics', description: 'Prometheus/Micrometer metrics for requests, errors, latency' },
  { id: 'health-check', category: 'observability', name: 'Health Check', description: 'Liveness and readiness probe endpoints' },
  { id: 'tracing', category: 'observability', name: 'Distributed Tracing', description: 'OpenTelemetry trace propagation across services' },
  { id: 'audit-log', category: 'observability', name: 'Audit Log', description: 'Immutable record of who did what and when' },

  // Resilience
  { id: 'error-handling', category: 'resilience', name: 'Error Handling', description: 'Consistent error response format with problem details (RFC 7807)' },
  { id: 'retry', category: 'resilience', name: 'Retry', description: 'Automatic retry with exponential backoff for transient failures' },
  { id: 'circuit-breaker', category: 'resilience', name: 'Circuit Breaker', description: 'Fail-fast when downstream services are unhealthy' },
  { id: 'optimistic-locking', category: 'resilience', name: 'Optimistic Locking', description: 'Version-based conflict detection on concurrent updates' },
  { id: 'dead-letter', category: 'resilience', name: 'Dead Letter Queue', description: 'Failed messages captured for investigation and replay' },

  // Data
  { id: 'pagination', category: 'data', name: 'Pagination', description: 'Consistent page/size/sort/direction on list endpoints' },
  { id: 'filtering', category: 'data', name: 'Filtering', description: 'Query parameter-based filtering with AND/OR logic' },
  { id: 'migration', category: 'data', name: 'Database Migration', description: 'Flyway/Liquibase versioned schema migrations' },
  { id: 'soft-delete', category: 'data', name: 'Soft Delete', description: 'Logical deletion with audit trail instead of physical delete' },

  // Events
  { id: 'domain-events', category: 'events', name: 'Domain Events', description: 'Event publishing on aggregate state changes' },
  { id: 'outbox', category: 'events', name: 'Transactional Outbox', description: 'Guaranteed event delivery via database outbox pattern' },
  { id: 'event-schema', category: 'events', name: 'Event Schema', description: 'Versioned event schemas with backward compatibility' },

  // Testing
  { id: 'unit-tests', category: 'testing', name: 'Unit Tests', description: 'Generated test stubs for every operation' },
  { id: 'integration-tests', category: 'testing', name: 'Integration Tests', description: 'End-to-end tests against running service' },
  { id: 'contract-tests', category: 'testing', name: 'Contract Tests', description: 'API contract verification against OpenAPI spec' },

  // DevOps
  { id: 'docker', category: 'devops', name: 'Docker', description: 'Dockerfile and docker-compose for local development' },
  { id: 'ci-cd', category: 'devops', name: 'CI/CD', description: 'Pipeline configuration for build, test, deploy' },
  { id: 'openapi', category: 'devops', name: 'OpenAPI Spec', description: 'Auto-generated OpenAPI 3.0 specification' },
];

export interface CfrDefinition {
  id: string;
  category: string;
  name: string;
  description: string;
}

/**
 * A bundle declares which CFRs it provides and what files implement each one.
 * This goes in the bundle's package metadata or export.
 */
export interface BundleCfrManifest {
  /** CFR IDs this bundle provides */
  provides: string[];
  /** Map of CFR ID → files that implement it (for verification) */
  files?: Record<string, string[]>;
}

/**
 * A spec can enable/disable CFRs. Unmentioned CFRs use bundle defaults.
 */
export interface SpecCfrConfig {
  [cfrId: string]: boolean | Record<string, unknown>;
}

/**
 * Verify that all enabled CFRs have their implementing files present.
 */
export interface CfrVerifyResult {
  passed: boolean;
  cfrs: Array<{
    id: string;
    name: string;
    enabled: boolean;
    present: boolean;
    missingFiles: string[];
  }>;
}

export function verifyCfrs(
  bundleCfrs: BundleCfrManifest,
  specCfrs: SpecCfrConfig | undefined,
  outputDir: string
): CfrVerifyResult {
  const { existsSync } = require('node:fs') as typeof import('node:fs');
  const { resolve } = require('node:path') as typeof import('node:path');

  const results: CfrVerifyResult['cfrs'] = [];

  for (const cfrId of bundleCfrs.provides) {
    const def = CFR_CATALOG.find(c => c.id === cfrId);
    const enabled = specCfrs?.[cfrId] !== false; // enabled by default
    const expectedFiles = bundleCfrs.files?.[cfrId] ?? [];
    const missingFiles = enabled
      ? expectedFiles.filter(f => !existsSync(resolve(outputDir, f)))
      : [];

    results.push({
      id: cfrId,
      name: def?.name ?? cfrId,
      enabled,
      present: missingFiles.length === 0,
      missingFiles,
    });
  }

  return {
    passed: results.every(r => !r.enabled || r.present),
    cfrs: results,
  };
}

/**
 * Suggest CFRs that a bundle doesn't yet provide.
 * Useful for bundle authors to see what they could add.
 */
export function suggestCfrs(bundleCfrs: BundleCfrManifest): CfrDefinition[] {
  return CFR_CATALOG.filter(c => !bundleCfrs.provides.includes(c.id));
}

/**
 * Generate a CFR compliance report for a generated service.
 */
export function generateCfrReport(
  bundleCfrs: BundleCfrManifest,
  specCfrs: SpecCfrConfig | undefined,
  outputDir: string
): string {
  const result = verifyCfrs(bundleCfrs, specCfrs, outputDir);
  const lines: string[] = [];

  lines.push('# CFR Compliance Report');
  lines.push('');

  const categories = [...new Set(CFR_CATALOG.map(c => c.category))];
  for (const category of categories) {
    const catCfrs = result.cfrs.filter(r => {
      const def = CFR_CATALOG.find(c => c.id === r.id);
      return def?.category === category;
    });
    if (catCfrs.length === 0) continue;

    lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    lines.push('');
    for (const cfr of catCfrs) {
      const status = !cfr.enabled ? 'DISABLED' : cfr.present ? 'PASS' : 'MISSING';
      const icon = status === 'PASS' ? '[x]' : status === 'DISABLED' ? '[-]' : '[ ]';
      lines.push(`- ${icon} **${cfr.name}** — ${status}`);
      if (cfr.missingFiles.length > 0) {
        for (const f of cfr.missingFiles) {
          lines.push(`  - Missing: ${f}`);
        }
      }
    }
    lines.push('');
  }

  // Suggestions
  const missing = suggestCfrs(bundleCfrs);
  if (missing.length > 0) {
    lines.push('## Not Yet Covered');
    lines.push('');
    lines.push('These CFRs are not provided by the current bundle. Consider adding them:');
    lines.push('');
    for (const cfr of missing) {
      lines.push(`- **${cfr.name}** (${cfr.category}) — ${cfr.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
