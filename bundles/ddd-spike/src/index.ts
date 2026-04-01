import type { Bundle, SpecMetadata } from '@fixedcode/engine';
import type { Context } from '@fixedcode/engine';
import { enrich } from './enrich/index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, 'schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

export const bundle: Bundle = {
  kind: 'ddd-domain',
  specSchema: schema as Bundle['specSchema'],
  enrich: enrich as unknown as (spec: Record<string, unknown>, metadata: SpecMetadata) => Context,
  templates: 'templates',
};

export default bundle;