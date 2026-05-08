import type { Bundle, SpecMetadata } from '@fixedcode/engine';
import type { Context } from '@fixedcode/engine';
import { enrich } from './enrich/index.js';

const schema = {
  type: 'object',
  required: ['name', 'resources'],
  properties: {
    name: { type: 'string' },
    resources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'fields'],
        properties: {
          name: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type'],
              properties: {
                name: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['uuid', 'string', 'number', 'integer', 'boolean', 'date'],
                },
                required: { type: 'boolean' },
                isId: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
};

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}

function or(...args: unknown[]): boolean {
  return args.slice(0, -1).some(Boolean);
}

export const bundle: Bundle = {
  kind: 'crud-api',
  specSchema: schema as Bundle['specSchema'],
  enrich: enrich as unknown as (spec: Record<string, unknown>, metadata: SpecMetadata) => Context,
  templates: 'templates',
  helpers: { eq, or },
};

export default bundle;
