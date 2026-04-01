import Ajv from 'ajv';
import { SpecValidationError } from '../errors.js';

const ajv = new Ajv.default({ allErrors: true, verbose: true });

export function validateBody(spec: unknown, schema: Record<string, unknown>): void {
  const validate = ajv.compile(schema);
  const valid = validate(spec);

  if (!valid && validate.errors) {
    const errors = validate.errors.map((err: unknown) => {
      const errObj = err as { instancePath?: string; message?: string };
      const path = errObj.instancePath || 'root';
      return `${path}: ${errObj.message}`;
    }).join('; ');

    throw new SpecValidationError(`Spec validation failed: ${errors}`);
  }
}