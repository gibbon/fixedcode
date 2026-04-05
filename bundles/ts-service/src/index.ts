import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
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
