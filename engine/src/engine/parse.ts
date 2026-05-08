import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import type { RawSpec } from '../types.js';
import { SpecParseError, EnvelopeError } from '../errors.js';

export function parseSpec(filePath: string): RawSpec {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = parseYaml(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new SpecParseError(`${filePath} is empty or not a valid YAML object`);
    }
    return parsed as RawSpec;
  } catch (err) {
    if (err instanceof SpecParseError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new SpecParseError(`Failed to parse ${filePath}: ${message}`);
  }
}

export function validateEnvelope(spec: RawSpec): void {
  const errors: string[] = [];

  if (!spec.apiVersion) {
    errors.push("Missing required field 'apiVersion'");
  }

  if (!spec.kind) {
    errors.push("Missing required field 'kind'");
  }

  if (!spec.metadata?.name) {
    errors.push("Missing required field 'metadata.name'");
  }

  if (!spec.spec) {
    errors.push("Missing required field 'spec'");
  }

  if (errors.length > 0) {
    throw new EnvelopeError(errors.join('; '));
  }
}
