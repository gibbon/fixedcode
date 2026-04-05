import { generateVariants, type NamingVariants } from './naming.js';

export interface RawTool {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface EnrichedTool {
  name: NamingVariants;
  type: string;
  config: Record<string, unknown>;
  templatePath: string;
}

export function enrichTool(raw: RawTool): EnrichedTool {
  return {
    name: generateVariants(raw.name),
    type: raw.type,
    config: raw.config ?? {},
    templatePath: `tools/${raw.type}.ts.hbs`,
  };
}
