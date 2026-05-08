import { describe, it, expect } from 'vitest';
import bundle from '../src/index.js';

const enrich = bundle.enrich;

describe('spring-library enrichment', () => {
  it('enriches a core library spec correctly', () => {
    const ctx = enrich(
      {
        library: { name: 'gap-workspace-core', description: 'Workspace domain library' },
        features: { database: { enabled: true, type: 'postgresql' } },
        service: { port: 8081 },
      },
      { name: 'workspace', apiVersion: '1.0' },
    );

    expect(ctx.LibraryName).toBe('gap-workspace-core');
    expect(ctx.PackageName).toBe('workspace');
    expect(ctx.DomainPackage).toBe('workspace');
    expect(ctx.DomainNamePascal).toBe('Workspace');
    expect(ctx.BoundedContextLower).toBe('workspace');
    expect(ctx.ServerPort).toBe(8081);
    expect(ctx.DatabaseEnabled).toBe(true);
    expect(ctx.IsFeatureLibrary).toBe(false);
    expect(ctx.PropertyPrefix).toBe('gap.workspace');
    expect(ctx.SchemaName).toBe('workspace');
  });

  it('enriches a feature library spec correctly', () => {
    const ctx = enrich(
      {
        library: { name: 'gap-compliance-risk', description: 'Risk assessment feature' },
        featureLibrary: { coreDomain: 'compliance', featureName: 'risk' },
        service: { port: 8082 },
      },
      { name: 'compliance-risk', apiVersion: '1.0' },
    );

    expect(ctx.IsFeatureLibrary).toBe(true);
    expect(ctx.CoreDomain).toBe('compliance');
    expect(ctx.FeatureName).toBe('risk');
    expect(ctx.FeatureNamePascal).toBe('Risk');
    expect(ctx.CoreLibraryName).toBe('gap-compliance-core');
    expect(ctx.PackageName).toBe('compliance.risk');
    expect(ctx.DomainPackage).toBe('compliance');
  });

  it('applies defaults correctly', () => {
    const ctx = enrich(
      {
        library: { name: 'gap-workspace-core', description: 'Test' },
      },
      { name: 'workspace', apiVersion: '1.0' },
    );

    expect(ctx.DatabaseEnabled).toBe(true);
    expect(ctx.DatabaseType).toBe('postgresql');
    expect(ctx.DatabasePort).toBe(5433);
    expect(ctx.KafkaEnabled).toBe(false);
    expect(ctx.ServerPort).toBe(8080);
    expect(ctx.Version).toBe('0.1.0');
    expect(ctx.Group).toBe('com.example');
  });

  it('computes DatabaseReadPort deterministically', () => {
    const ctx1 = enrich(
      {
        library: { name: 'gap-workspace-core', description: 'Test' },
      },
      { name: 'workspace', apiVersion: '1.0' },
    );
    const ctx2 = enrich(
      {
        library: { name: 'gap-workspace-core', description: 'Test' },
      },
      { name: 'workspace', apiVersion: '1.0' },
    );

    expect(ctx1.DatabaseReadPort).toBe(ctx2.DatabaseReadPort);
    expect(ctx1.DatabaseReadPort).toBeGreaterThanOrEqual(15432);
    expect(ctx1.DatabaseReadPort).toBeLessThanOrEqual(25432);
  });
});
