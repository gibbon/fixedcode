import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(join(__dirname, 'fixtures/workspace.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

describe('spring-domain e2e', () => {
  it('generates all expected files from workspace spec', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map((f) => f.output);

    // Shared
    expect(paths.some((p) => p.endsWith('DomainEvent.kt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('ValidationResult.kt'))).toBe(true);

    // Aggregate
    expect(paths.some((p) => p.endsWith('Workspace.kt') && p.includes('/domain/'))).toBe(true);
    expect(paths.some((p) => p.endsWith('WorkspaceEvents.kt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('WorkspaceCommandService.kt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('WorkspaceApiDelegateImpl.kt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('WorkspaceReadRepositoryImpl.kt'))).toBe(true);

    // Commands
    expect(paths.some((p) => p.endsWith('CreateWorkspaceCommand.kt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('UpdateWorkspaceStatusCommand.kt'))).toBe(true);

    // Entity
    expect(paths.some((p) => p.endsWith('Party.kt'))).toBe(true);
    expect(paths.some((p) => p.endsWith('AddPartyCommand.kt'))).toBe(true);

    // Tests
    expect(paths.some((p) => p.includes('/test/') && p.endsWith('WorkspaceTest.kt'))).toBe(true);

    console.log(`Total files generated: ${files.length}`);
  });
});
