import { describe, it, expect } from 'vitest';
import { enrich } from '../src/index.js';

describe('python-service enrich', () => {
  it('enriches a basic service spec', () => {
    const ctx = enrich(
      { service: { port: 8000, package: 'ops_agent' }, features: { docker: true } },
      { name: 'ops-agent', apiVersion: '1.0' },
    );
    expect(ctx.serviceName.pascal).toBe('OpsAgent');
    expect(ctx.serviceName.kebab).toBe('ops-agent');
    expect(ctx.serviceName.snake).toBe('ops_agent');
    expect(ctx.packageName).toBe('ops_agent');
    expect(ctx.port).toBe(8000);
    expect(ctx.hasDocker).toBe(true);
    expect(ctx.hasDatabase).toBe(false);
  });

  it('applies defaults', () => {
    const ctx = enrich({ service: { package: 'my_svc' } }, { name: 'my-svc', apiVersion: '1.0' });
    expect(ctx.port).toBe(8000);
    expect(ctx.hasDocker).toBe(true);
    expect(ctx.hasDatabase).toBe(false);
  });

  it('enables database feature', () => {
    const ctx = enrich(
      {
        service: { package: 'db_svc' },
        features: { database: { enabled: true, type: 'postgres' } },
      },
      { name: 'db-svc', apiVersion: '1.0' },
    );
    expect(ctx.hasDatabase).toBe(true);
    expect(ctx.databaseType).toBe('postgres');
  });

  it('derives serviceName from metadata.name', () => {
    const ctx = enrich(
      { service: { package: 'my_service' } },
      { name: 'my-cool-service', apiVersion: '1.0' },
    );
    expect(ctx.serviceName.pascal).toBe('MyCoolService');
    expect(ctx.serviceName.kebab).toBe('my-cool-service');
    expect(ctx.serviceName.snake).toBe('my_cool_service');
  });
});
