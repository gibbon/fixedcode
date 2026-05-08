import type { Bundle, Context, FileEntry, SpecMetadata } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface PythonServiceContext extends Context {
  serviceName: NamingVariants;
  packageName: string;
  port: number;
  hasDatabase: boolean;
  databaseType: string;
  hasDocker: boolean;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): PythonServiceContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(metadata.name);

  return {
    serviceName,
    packageName: spec.service.package,
    port: spec.service.port ?? 8000,
    hasDatabase: spec.features?.database?.enabled ?? false,
    databaseType: spec.features?.database?.type ?? 'postgres',
    hasDocker: spec.features?.docker ?? true,
  };
}

export function generateFiles(ctx: PythonServiceContext): FileEntry[] {
  const c = ctx as unknown as Record<string, unknown>;
  const files: FileEntry[] = [
    { template: 'pyproject.toml.hbs', output: 'pyproject.toml', ctx: c },
    { template: 'src/__init__.py.hbs', output: `src/${ctx.packageName}/__init__.py`, ctx: c },
    {
      template: 'src/__init__.py.hbs',
      output: `src/${ctx.packageName}/routes/__init__.py`,
      ctx: c,
    },
    {
      template: 'src/__init__.py.hbs',
      output: `src/${ctx.packageName}/defaults/__init__.py`,
      ctx: c,
    },
    { template: 'src/main.py.hbs', output: `src/${ctx.packageName}/main.py`, ctx: c },
    { template: 'src/config.py.hbs', output: `src/${ctx.packageName}/config.py`, ctx: c },
    {
      template: 'src/routes/health.py.hbs',
      output: `src/${ctx.packageName}/routes/health.py`,
      ctx: c,
    },
    {
      template: 'src/defaults/custom_routes.py.hbs',
      output: `src/${ctx.packageName}/defaults/custom_routes.py`,
      ctx: c,
      overwrite: false,
    },
    { template: 'tests/conftest.py.hbs', output: 'tests/conftest.py', ctx: c },
  ];

  if (ctx.hasDocker) {
    files.push(
      { template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: c },
      { template: 'docker-compose.yml.hbs', output: 'docker-compose.yml', ctx: c },
    );
  }

  return files;
}

export const bundle: Bundle = {
  kind: 'python-service',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  cfrs: {
    provides: ['logging', 'health-check', 'error-handling', 'docker'],
    files: {
      'health-check': ['src/*/routes/health.py'],
      docker: ['Dockerfile', 'docker-compose.yml'],
    },
  },
};
export default bundle;
