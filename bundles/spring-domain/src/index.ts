import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export function enrich(_spec: Record<string, unknown>, _metadata: SpecMetadata): Context {
  throw new Error('Not implemented');
}

export function generateFiles(_ctx: Context): FileEntry[] {
  throw new Error('Not implemented');
}

export const bundle: Bundle = {
  kind: 'spring-domain',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles,
  templates: 'templates',
};

export default bundle;
