import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(join(__dirname, 'fixtures/order.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

describe('spring-domain e2e', () => {
  it('generates all expected files from order spec', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Shared
    expect(paths.some(p => p.endsWith('DomainEvent.kt'))).toBe(true);
    expect(paths.some(p => p.endsWith('ValidationResult.kt'))).toBe(true);

    // Aggregate
    expect(paths.some(p => p.endsWith('Order.kt') && p.includes('/domain/'))).toBe(true);
    expect(paths.some(p => p.endsWith('OrderEvents.kt'))).toBe(true);
    expect(paths.some(p => p.endsWith('OrderCommandService.kt'))).toBe(true);
    expect(paths.some(p => p.endsWith('OrderApiDelegateImpl.kt'))).toBe(true);
    expect(paths.some(p => p.endsWith('WorkspaceReadRepositoryImpl.kt'))).toBe(true);

    // Commands
    expect(paths.some(p => p.endsWith('CreateOrderCommand.kt'))).toBe(true);
    expect(paths.some(p => p.endsWith('UpdateOrderStatusCommand.kt'))).toBe(true);

    // Entity
    expect(paths.some(p => p.endsWith('LineItem.kt'))).toBe(true);
    expect(paths.some(p => p.endsWith('AddLineItemCommand.kt'))).toBe(true);

    // Tests
    expect(paths.some(p => p.includes('/test/') && p.endsWith('OrderTest.kt'))).toBe(true);

    console.log(`Total files generated: ${files.length}`);
  });
});
