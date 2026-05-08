import { generateVariants, type NamingVariants } from './naming.js';
import type { RawMiddlewareEntry } from './spec.js';

export interface EnrichedMiddleware {
  name: NamingVariants;
  type: string;
  config: Record<string, unknown>;
  hasAuth: boolean;
  templatePath: string;
}

const middlewareTypeMap: Record<string, string> = {
  'correlation-id': 'correlation_id',
  auth: 'auth',
  'feature-toggles': 'feature_toggles',
};

export function enrichMiddleware(raw: RawMiddlewareEntry): EnrichedMiddleware {
  const snakeType = middlewareTypeMap[raw.type] ?? raw.type.replace(/-/g, '_');
  return {
    name: generateVariants(raw.type),
    type: raw.type,
    config: raw.config,
    hasAuth: raw.type === 'auth',
    templatePath: `middleware/${snakeType}.py.hbs`,
  };
}
