/**
 * Verify pipeline: checks that all expected files from a domain spec
 * were actually generated in the build output.
 */
import { resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

export interface VerifyOptions {
  /** Path to the domain spec YAML */
  specPath: string;
  /** Build output directory to check */
  outputDir: string;
}

export interface VerifyResult {
  passed: boolean;
  checks: Array<{ file: string; exists: boolean; category: string }>;
  missing: string[];
  total: number;
}

export function verify(options: VerifyOptions): VerifyResult {
  const specContent = readFileSync(resolve(options.specPath), 'utf-8');
  const spec = parseYaml(specContent);
  const outputDir = resolve(options.outputDir);

  const checks: VerifyResult['checks'] = [];
  const kind = spec.kind as string;

  if (kind === 'spring-domain') {
    verifyDomainSpec(spec.spec, outputDir, checks);
  } else if (kind === 'spring-library') {
    verifyLibrarySpec(outputDir, checks);
  } else {
    console.warn(`Warning: no verification rules for bundle kind '${kind}'. Skipping.`);
  }

  const missing = checks.filter(c => !c.exists).map(c => c.file);

  return {
    passed: missing.length === 0,
    checks,
    missing,
    total: checks.length,
  };
}

interface DomainService { package: string }
interface DomainCommand { name: string }
interface DomainAggregate {
  commands?: DomainCommand[];
  entities?: Record<string, DomainAggregate>;
}

function verifyDomainSpec(
  spec: Record<string, unknown>,
  outputDir: string,
  checks: VerifyResult['checks']
): void {
  const service = spec.service as DomainService | undefined;
  const pkg = service?.package?.replace(/\./g, '/') ?? '';
  const aggregates = (spec.aggregates ?? {}) as Record<string, DomainAggregate>;

  // Shared files
  check(checks, outputDir, `src/main/kotlin/${pkg}/domain/shared/DomainEvent.kt`, 'shared');
  check(checks, outputDir, `src/main/kotlin/${pkg}/domain/shared/ValidationResult.kt`, 'shared');

  for (const [aggName, agg] of Object.entries(aggregates)) {
    const kebab = toKebab(aggName);
    const pascal = aggName;

    // Per-aggregate files
    check(checks, outputDir, `src/main/kotlin/${pkg}/domain/${kebab}/${pascal}.kt`, 'aggregate');
    check(checks, outputDir, `src/main/kotlin/${pkg}/domain/${kebab}/${pascal}Events.kt`, 'aggregate');
    check(checks, outputDir, `src/main/kotlin/${pkg}/application/${kebab}/${pascal}CommandService.kt`, 'aggregate');
    check(checks, outputDir, `src/main/kotlin/${pkg}/application/${kebab}/${pascal}QueryService.kt`, 'aggregate');
    check(checks, outputDir, `src/main/kotlin/${pkg}/api/${kebab}/${pascal}ApiDelegateImpl.kt`, 'aggregate');
    check(checks, outputDir, `src/main/kotlin/${pkg}/infrastructure/${kebab}/${pascal}ReadRepositoryImpl.kt`, 'aggregate');
    check(checks, outputDir, `src/main/kotlin/${pkg}/infrastructure/${kebab}/${pascal}WriteRepositoryImpl.kt`, 'aggregate');

    // Tests
    check(checks, outputDir, `src/test/kotlin/${pkg}/domain/${kebab}/${pascal}Test.kt`, 'test');
    check(checks, outputDir, `src/test/kotlin/${pkg}/application/${kebab}/${pascal}CommandServiceTest.kt`, 'test');
    check(checks, outputDir, `src/test/kotlin/${pkg}/api/${kebab}/${pascal}ApiDelegateImplTest.kt`, 'test');

    // Per-command files
    for (const cmd of agg.commands ?? []) {
      const cmdPascal = cmd.name;
      check(checks, outputDir, `src/main/kotlin/${pkg}/domain/${kebab}/commands/${cmdPascal}Command.kt`, 'command');
    }

    // Per-entity files
    for (const [entityName, entity] of Object.entries(agg.entities ?? {})) {
      const entityPascal = entityName;
      check(checks, outputDir, `src/main/kotlin/${pkg}/domain/${kebab}/entities/${entityPascal}.kt`, 'entity');
      check(checks, outputDir, `src/main/kotlin/${pkg}/domain/${kebab}/entities/${entityPascal}Events.kt`, 'entity');

      // Entity commands
      for (const cmd of entity.commands ?? []) {
        const cmdPascal = cmd.name;
        check(checks, outputDir, `src/main/kotlin/${pkg}/domain/${kebab}/entities/commands/${cmdPascal}Command.kt`, 'entity-command');
      }
    }
  }

  // OpenAPI spec
  const rootFiles = existsSync(outputDir) ? readdirSync(outputDir) : [];
  const hasOpenapi = rootFiles.some(f => f.includes('openapi') && f.endsWith('.yaml'));
  checks.push({ file: '*-openapi.yaml', exists: hasOpenapi, category: 'openapi' });
}

function verifyLibrarySpec(outputDir: string, checks: VerifyResult['checks']): void {
  // Key library files that should always exist
  check(checks, outputDir, 'build.gradle.kts', 'project');
  check(checks, outputDir, 'settings.gradle.kts', 'project');
  check(checks, outputDir, 'gradle.properties', 'project');
  check(checks, outputDir, 'gradlew', 'project');
  check(checks, outputDir, 'docker-compose.yml', 'project');
  check(checks, outputDir, 'src/main/resources/application.yml', 'config');
  check(checks, outputDir, 'src/main/resources/logback-spring.xml', 'config');
}

function check(
  checks: VerifyResult['checks'],
  outputDir: string,
  relPath: string,
  category: string
): void {
  checks.push({
    file: relPath,
    exists: existsSync(resolve(outputDir, relPath)),
    category,
  });
}

function toKebab(pascal: string): string {
  return pascal.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
