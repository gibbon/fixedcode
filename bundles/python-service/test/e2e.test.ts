import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(join(__dirname, 'fixtures/basic-service.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

describe('python-service e2e', () => {
  it('generates all expected files from basic service spec', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    expect(paths).toContain('pyproject.toml');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('docker-compose.yml');
    expect(paths).toContain('src/ops_agent/__init__.py');
    expect(paths).toContain('src/ops_agent/main.py');
    expect(paths).toContain('src/ops_agent/config.py');
    expect(paths).toContain('src/ops_agent/routes/health.py');
    expect(paths).toContain('src/ops_agent/defaults/custom_routes.py');
    expect(paths).toContain('tests/conftest.py');
  });

  it('excludes Docker files when docker is disabled', () => {
    const ctx = enrich(
      { service: { package: 'no_docker' }, features: { docker: false } },
      { name: 'no-docker', apiVersion: '1.0' }
    );
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);
    expect(paths).not.toContain('Dockerfile');
    expect(paths).not.toContain('docker-compose.yml');
  });

  it('marks extension points with overwrite false', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const extensionPoints = files.filter(f => f.overwrite === false);
    expect(extensionPoints).toHaveLength(1);
    expect(extensionPoints[0].output).toBe('src/ops_agent/defaults/custom_routes.py');
  });

  it('includes __init__.py files for Python packages', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);
    expect(paths).toContain('src/ops_agent/__init__.py');
    expect(paths).toContain('src/ops_agent/routes/__init__.py');
    expect(paths).toContain('src/ops_agent/defaults/__init__.py');
  });

  it('uses packageName in output paths', () => {
    const ctx = enrich(
      { service: { package: 'custom_pkg' } },
      { name: 'custom-pkg', apiVersion: '1.0' }
    );
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);
    expect(paths).toContain('src/custom_pkg/__init__.py');
    expect(paths).toContain('src/custom_pkg/main.py');
    expect(paths).toContain('src/custom_pkg/config.py');
    expect(paths).toContain('src/custom_pkg/routes/health.py');
    expect(paths).toContain('src/custom_pkg/defaults/custom_routes.py');
  });
});
