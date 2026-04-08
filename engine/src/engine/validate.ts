import Ajv, { type ErrorObject } from 'ajv';
import { SpecValidationError } from '../errors.js';

const ajv = new Ajv.default({ allErrors: true, verbose: true, strict: false });
const schemaCache = new Map<string, ReturnType<typeof ajv.compile>>();

export function validateBody(spec: unknown, schema: Record<string, unknown>): void {
  // Cache compiled schemas to avoid recompilation on repeated calls (e.g. during build)
  const schemaKey = JSON.stringify(schema);
  let validate = schemaCache.get(schemaKey);
  if (!validate) {
    validate = ajv.compile(schema);
    schemaCache.set(schemaKey, validate);
  }
  const valid = validate(spec);

  if (!valid && validate.errors) {
    const errors = validate.errors.map((err: ErrorObject) => {
      let path = err.instancePath?.replace('/', '.').replace(/\//g, '.') || 'root';
      if (path.startsWith('.')) path = path.slice(1);

      let msg = err.message || 'invalid';
      if (err.params) {
        if ('allowedValues' in err.params) {
          msg += ` (allowed: ${(err.params.allowedValues as string[]).join(', ')})`;
        }
      }

      return `${path || 'root'}: ${msg}`;
    }).join('\n  ');

    throw new SpecValidationError(`Spec validation failed:\n  ${errors}`);
  }
}