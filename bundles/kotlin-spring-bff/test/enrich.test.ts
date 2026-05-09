import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';

const md = { name: 'my-bff', apiVersion: '1.0' };

describe('kotlin-spring-bff enrich', () => {
  it('applies sensible defaults', () => {
    const ctx = enrich({ appName: 'my-bff', groupId: 'com.example' }, md);
    expect(ctx.appName.pascal).toBe('MyBff');
    expect(ctx.appName.kebab).toBe('my-bff');
    expect(ctx.appName.snake).toBe('my_bff');
    expect(ctx.packageName).toBe('com.example.mybff');
    expect(ctx.packagePath).toBe('com/example/mybff');
    expect(ctx.groupId).toBe('com.example');
    expect(ctx.groupIdPath).toBe('com/example');
    expect(ctx.appPackageSegment).toBe('mybff');
    expect(ctx.port).toBe(8080);
    expect(ctx.javaVersion).toBe(21);
    expect(ctx.services).toEqual([]);
    expect(ctx.hasServices).toBe(false);
    expect(ctx.features).toEqual({ auth: 'none', database: false, cache: false, docker: true });
    expect(ctx.authEnabled).toBe(false);
    expect(ctx.authJwt).toBe(false);
    expect(ctx.authOauth2).toBe(false);
  });

  it('honours all features off (even docker disabled)', () => {
    const ctx = enrich(
      {
        appName: 'lean-bff',
        groupId: 'io.acme',
        features: { auth: 'none', database: false, cache: false, docker: false },
      },
      md,
    );
    expect(ctx.features.docker).toBe(false);
    const files = generateFiles(ctx);
    expect(files.some((f) => f.output === 'Dockerfile')).toBe(false);
    expect(files.some((f) => f.output.endsWith('CacheConfig.kt'))).toBe(false);
    expect(files.some((f) => f.output.endsWith('SecurityConfig.kt'))).toBe(false);
  });

  it('expands one client file per composed service', () => {
    const ctx = enrich(
      {
        appName: 'aggregator',
        groupId: 'com.example',
        services: [
          { name: 'catalog', baseUrl: 'http://catalog:8080' },
          { name: 'pricing-engine', baseUrl: 'http://pricing:8080' },
        ],
      },
      md,
    );
    expect(ctx.hasServices).toBe(true);
    expect(ctx.services).toHaveLength(2);
    expect(ctx.services[0].naming.pascal).toBe('Catalog');
    expect(ctx.services[0].envVar).toBe('CATALOG_BASE_URL');
    expect(ctx.services[1].naming.pascal).toBe('PricingEngine');
    expect(ctx.services[1].beanName).toBe('pricingEngineClient');
    expect(ctx.services[1].envVar).toBe('PRICING_ENGINE_BASE_URL');

    const files = generateFiles(ctx);
    const clientFiles = files.filter((f) => f.output.includes('/clients/'));
    expect(clientFiles).toHaveLength(2);
    expect(clientFiles.map((f) => f.output)).toEqual([
      'src/main/kotlin/com/example/aggregator/clients/CatalogClient.kt',
      'src/main/kotlin/com/example/aggregator/clients/PricingEngineClient.kt',
    ]);
  });

  it('enables jwt auth and emits SecurityConfig', () => {
    const ctx = enrich(
      { appName: 'auth-bff', groupId: 'com.example', features: { auth: 'jwt' } },
      md,
    );
    expect(ctx.authEnabled).toBe(true);
    expect(ctx.authJwt).toBe(true);
    expect(ctx.authOauth2).toBe(false);
    const files = generateFiles(ctx);
    expect(files.some((f) => f.output.endsWith('SecurityConfig.kt'))).toBe(true);
  });
});
