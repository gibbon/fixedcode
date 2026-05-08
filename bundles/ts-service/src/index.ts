import type { Bundle, Context, FileEntry, SpecMetadata } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface TsServiceContext extends Context {
  serviceName: NamingVariants;
  packageName: string;
  port: number;
  hasDatabase: boolean;
  databaseType: string;
  hasDocker: boolean;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): TsServiceContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(spec.service.package);

  return {
    serviceName,
    packageName: spec.service.package,
    port: spec.service.port ?? 3000,
    hasDatabase: spec.features?.database?.enabled ?? false,
    databaseType: spec.features?.database?.type ?? 'postgres',
    hasDocker: spec.features?.docker ?? true,
  };
}

export function generateFiles(ctx: TsServiceContext): FileEntry[] {
  const c = ctx as unknown as Record<string, unknown>;
  const files: FileEntry[] = [
    { template: 'package.json.hbs', output: 'package.json', ctx: c },
    { template: 'tsconfig.json.hbs', output: 'tsconfig.json', ctx: c },
    { template: 'src/index.ts.hbs', output: 'src/index.ts', ctx: c },
    { template: 'src/config.ts.hbs', output: 'src/config.ts', ctx: c },
    { template: 'src/server.ts.hbs', output: 'src/server.ts', ctx: c },
    { template: 'src/logger.ts.hbs', output: 'src/logger.ts', ctx: c },
    { template: 'src/routes/health.ts.hbs', output: 'src/routes/health.ts', ctx: c },
    {
      template: 'defaults/custom-routes.ts.hbs',
      output: 'src/defaults/custom-routes.ts',
      ctx: c,
      overwrite: false,
    },
    { template: 'tests/health.test.ts.hbs', output: 'tests/health.test.ts', ctx: c },
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
  kind: 'ts-service',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  cfrs: {
    provides: ['logging', 'health-check', 'error-handling', 'docker'],
    files: {
      'health-check': ['src/routes/health.ts'],
      docker: ['Dockerfile', 'docker-compose.yml'],
    },
  },
};
export default bundle;
