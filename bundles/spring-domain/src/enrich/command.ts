import { generateVariants } from './naming.js';
import { detectPattern, deriveHttp, deriveAuth, deriveResponse, type OperationPattern } from './conventions.js';
import { parseParam, type EnrichedParam, type AggCtx } from './shared.js';

export type { EnrichedParam };

export interface EnrichedCommand {
  name: string;
  names: ReturnType<typeof generateVariants>;
  pattern: OperationPattern;
  http: { method: string; path: string; statusCode: number };
  auth: { action: string; expression: string };
  response: { type: string; returnType: string };
  params: { path: EnrichedParam[]; body: EnrichedParam[]; query: EnrichedParam[] };
  emits?: string;
  methodSignature: string;
}

export function enrichCommand(raw: {
  name: string;
  body?: string[];
  path?: string[];
  query?: string[];
  emits?: string;
  returns?: string;
}, agg: AggCtx): EnrichedCommand {
  const names = generateVariants(raw.name);
  const pattern = detectPattern(raw.name);
  const needsId = ['Update', 'Delete', 'Archive', 'Get', 'Remove'].includes(pattern);

  // Path params: explicit override OR convention (identity field for mutating patterns)
  const pathParams: EnrichedParam[] = raw.path
    ? raw.path.map(parseParam)
    : needsId
      ? [{ name: agg.identityField, names: generateVariants(agg.identityField), required: true }]
      : [];

  const bodyParams = (raw.body ?? []).map(parseParam);
  const queryParams = (raw.query ?? []).map(parseParam);

  const hasIdParam = pathParams.length > 0;
  const idParamName = pathParams[0]?.name;
  const http = deriveHttp(pattern, agg.names.pluralKebab, hasIdParam, idParamName, '', raw.name);
  const auth = deriveAuth(pattern, agg.names.pascal);
  const response = deriveResponse(pattern, agg.names.pascal);

  const allParams = [...pathParams, ...bodyParams].map(p => `${p.names.camel}: ${p.required ? 'String' : 'String?'}`).join(', ');
  const methodSignature = `fun ${names.camel}(${allParams}): ${response.returnType}`;

  return {
    name: raw.name,
    names,
    pattern,
    http,
    auth,
    response,
    params: { path: pathParams, body: bodyParams, query: queryParams },
    emits: raw.emits,
    methodSignature,
  };
}
