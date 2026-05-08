import type { QueryContext, FilterContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';

interface RawQuery {
  name: string;
  returns: string;
  filters?: Array<{ name: string; type: string }>;
}

interface IdentityInfo {
  name: string;
  type: string;
}

function enrichFilter(raw: { name: string; type: string }): FilterContext {
  return {
    names: toNameVariants(raw.name),
    type: toTypeMapping(raw.type, false),
  };
}

export function enrichQuery(raw: RawQuery, identity: IdentityInfo): QueryContext {
  const isList = raw.returns === 'list';
  const identityNames = toNameVariants(identity.name);

  return {
    names: toNameVariants(raw.name),
    returns: raw.returns,
    isList,
    httpPath: isList ? '' : `/{${identityNames.camel}}`,
    filters: (raw.filters ?? []).map(enrichFilter),
  };
}
