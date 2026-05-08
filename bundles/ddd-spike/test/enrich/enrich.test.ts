import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { enrich } from '../../src/enrich/index.js';
import type { DddContext } from '../../src/context.js';

function loadFixture(): {
  spec: Record<string, unknown>;
  metadata: { name: string; apiVersion: string };
} {
  const raw = parse(readFileSync(new URL('../fixtures/order-spec.yaml', import.meta.url), 'utf-8'));
  return { spec: raw.spec, metadata: { name: raw.metadata.name, apiVersion: raw.apiVersion } };
}

describe('enrich (full pipeline)', () => {
  it('produces correct top-level structure', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;

    expect(ctx.package).toBe('com.example.order');
    expect(ctx.aggregates).toHaveLength(1);
  });

  it('enriches aggregate names and identity', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.names.pascal).toBe('Order');
    expect(order.names.snake).toBe('order');
    expect(order.identity.names.camel).toBe('orderId');
    expect(order.identity.type.kotlin).toBe('UUID');
    expect(order.tableName).toBe('orders');
    expect(order.endpoint).toBe('/orders');
  });

  it('enriches all attributes', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.allAttributes).toHaveLength(4);
    expect(order.attributes).toHaveLength(3); // excludes identity

    const status = order.attributes.find((a) => a.names.camel === 'status')!;
    expect(status.hasDefault).toBe(true);
    expect(status.kotlinDefault).toBe(' = "CREATED"');
  });

  it('enriches commands with http metadata', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.commands).toHaveLength(2);
    expect(order.commands[0].isCreate).toBe(true);
    expect(order.commands[0].httpMethod).toBe('POST');
    expect(order.commands[1].httpMethod).toBe('PUT');
    expect(order.commands[1].httpPath).toBe('/{orderId}');
  });

  it('enriches queries', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.queries).toHaveLength(2);
    expect(order.queries[0].isList).toBe(false);
    expect(order.queries[1].isList).toBe(true);
    expect(order.queries[1].filters).toHaveLength(1);
  });

  it('computes imports from types used', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.imports).toContain('java.util.UUID');
    expect(order.imports).toContain('java.math.BigDecimal');
    // No duplicates
    const unique = [...new Set(order.imports)];
    expect(order.imports).toEqual(unique);
  });

  it('computes boolean flags', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.hasCommands).toBe(true);
    expect(order.hasQueries).toBe(true);
  });
});
