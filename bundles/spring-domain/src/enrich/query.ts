import { generateVariants } from './naming.js';
import {
  detectPattern,
  deriveHttp,
  deriveAuth,
  deriveResponse,
  type OperationPattern,
} from './conventions.js';
import { parseParam, type EnrichedParam, type AggCtx } from './shared.js';

export interface EnrichedQuery {
  name: string;
  names: ReturnType<typeof generateVariants>;
  pattern: OperationPattern;
  http: { method: string; path: string; statusCode: number };
  auth: { action: string; expression: string };
  response: { type: string; returnType: string };
  params: { path: EnrichedParam[]; query: EnrichedParam[] };
}

export function enrichQuery(
  raw: {
    name: string;
    path?: string[];
    query?: string[];
    returns: string;
  },
  agg: AggCtx,
): EnrichedQuery {
  const names = generateVariants(raw.name);
  const pattern = detectPattern(raw.name);
  const needsId = pattern === 'Get';

  const pathParams: EnrichedParam[] = raw.path
    ? raw.path.map(parseParam)
    : needsId
      ? [{ name: agg.identityField, names: generateVariants(agg.identityField), required: true }]
      : [];

  const queryParams = (raw.query ?? []).map(parseParam);

  const hasIdParam = pathParams.length > 0;
  const idParamName = pathParams[0]?.name;
  const http = deriveHttp(pattern, agg.names.pluralKebab, hasIdParam, idParamName, '', raw.name);
  const auth = deriveAuth(pattern, agg.names.pascal);
  const response = deriveResponse(pattern, agg.names.pascal);

  return {
    name: raw.name,
    names,
    pattern,
    http,
    auth,
    response,
    params: { path: pathParams, query: queryParams },
  };
}
