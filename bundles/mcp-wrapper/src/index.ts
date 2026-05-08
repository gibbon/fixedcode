import type { Bundle, SpecMetadata } from '@fixedcode/engine';
import type { Context } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

export interface McpWrapperSpec {
  boundedContext: string;
  mcpWrapper: {
    name: string;
    description: string;
    image: string;
    port?: number;
    env?: Record<string, string>;
    healthPath?: string;
  };
}

function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/[\s_]+/g, '-');
}

function enrich(spec: McpWrapperSpec, _metadata: SpecMetadata): Context {
  const mcp = spec.mcpWrapper;

  return {
    Name: mcp.name,
    NameKebab: toKebabCase(mcp.name),
    Description: mcp.description,
    Image: mcp.image,
    Port: mcp.port ?? 8080,
    Env: mcp.env ?? {},
    HealthPath: mcp.healthPath ?? '',
    BoundedContext: spec.boundedContext,
  };
}

export const bundle: Bundle = {
  kind: 'mcp-wrapper',
  specSchema: schema as Bundle['specSchema'],
  enrich: enrich as unknown as (spec: Record<string, unknown>, metadata: SpecMetadata) => Context,
  templates: 'templates',
};

export default bundle;
