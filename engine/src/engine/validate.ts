import Ajv from 'ajv';
import { SpecValidationError } from '../errors.js';

const ajv = new Ajv.default({ allErrors: true, verbose: true, strict: false });

export function validateBody(spec: unknown, schema: Record<string, unknown>): void {
  const validate = ajv.compile(schema);
  const valid = validate(spec);

  if (!valid && validate.errors) {
    const errors = validate.errors.map((err: unknown) => {
      const errObj = err as { instancePath?: string; message?: string; params?: Record<string, unknown> };
      let path = errObj.instancePath?.replace('/', '.').replace(/\//g, '.') || 'root';
      if (path.startsWith('.')) path = path.slice(1);
      
      let msg = errObj.message || 'invalid';
      if (errObj.params) {
        if ('allowedValues' in errObj.params) {
          msg += ` (allowed: ${(errObj.params.allowedValues as string[]).join(', ')})`;
        }
      }
      
      return `${path || 'root'}: ${msg}`;
    }).join('\n  ');

    throw new SpecValidationError(`Spec validation failed:\n  ${errors}`);
  }
}