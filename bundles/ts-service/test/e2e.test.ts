import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(join(__dirname, 'fixtures/basic-service.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

describe('ts-service e2e', () => {
  it('generates all expected files from basic service spec', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map((f) => f.output);

    expect(paths).toContain('package.json');
    expect(paths).toContain('tsconfig.json');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('docker-compose.yml');
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/config.ts');
    expect(paths).toContain('src/server.ts');
    expect(paths).toContain('src/logger.ts');
    expect(paths).toContain('src/routes/health.ts');
    expect(paths).toContain('src/defaults/custom-routes.ts');
    expect(paths).toContain('tests/health.test.ts');
  });

  it('excludes Docker files when docker is disabled', () => {
    const ctx = enrich(
      { service: { package: 'no-docker' }, features: { docker: false } },
      { name: 'no-docker', apiVersion: '1.0' },
    );
    const files = generateFiles(ctx);
    const paths = files.map((f) => f.output);
    expect(paths).not.toContain('Dockerfile');
    expect(paths).not.toContain('docker-compose.yml');
  });

  it('marks extension points with overwrite false', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const extensionPoints = files.filter((f) => f.overwrite === false);
    expect(extensionPoints).toHaveLength(1);
    expect(extensionPoints[0].output).toBe('src/defaults/custom-routes.ts');
  });
});
