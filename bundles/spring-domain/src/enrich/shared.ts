import { generateVariants, type NamingVariants } from './naming.js';

export interface EnrichedParam {
  name: string;
  names: NamingVariants;
  required: boolean;
}

export interface AggCtx {
  names: { pluralKebab: string; pascal: string };
  identityField: string;
}

export function parseParam(raw: string): EnrichedParam {
  const optional = raw.endsWith('?');
  const name = optional ? raw.slice(0, -1) : raw;
  return { name, names: generateVariants(name), required: !optional };
}
