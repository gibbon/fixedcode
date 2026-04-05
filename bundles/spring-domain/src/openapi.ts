/**
 * Programmatic OpenAPI 3.0.3 spec generator.
 * Reads the enriched context from spring-domain and outputs a valid OpenAPI YAML string.
 */
import type { EnrichedContext } from './index.js';

// OpenAPI type mapping from our Kotlin types
const OPENAPI_TYPE_MAP: Record<string, { type: string; format?: string }> = {
  UUID: { type: 'string', format: 'uuid' },
  String: { type: 'string' },
  Int: { type: 'integer', format: 'int32' },
  Long: { type: 'integer', format: 'int64' },
  Boolean: { type: 'boolean' },
  BigDecimal: { type: 'number', format: 'double' },
  LocalDate: { type: 'string', format: 'date' },
  OffsetDateTime: { type: 'string', format: 'date-time' },
  'Map<String, Any>': { type: 'object' },
};

function openApiType(kotlinType: string): { type: string; format?: string } {
  return OPENAPI_TYPE_MAP[kotlinType] ?? { type: 'string' };
}

function toWords(pascal: string): string {
  return pascal.replace(/([a-z])([A-Z])/g, '$1 $2');
}

interface EnrichedAggregate {
  name: string;
  names: { pascal: string; camel: string; kebab: string; pluralKebab: string; snake: string };
  identityField: string;
  attributes: Array<{ name: string; names: { camel: string }; kotlinType: string; required: boolean; isIdentity: boolean }>;
  commands: Array<{
    name: string;
    names: { pascal: string; camel: string };
    pattern: string;
    http: { method: string; path: string; statusCode: number };
    params: { path: Array<{ name: string; names: { camel: string }; required: boolean }>;
              body: Array<{ name: string; names: { camel: string }; required: boolean }>;
              query: Array<{ name: string; names: { camel: string }; required: boolean }> };
    response: { type: string; returnType: string };
  }>;
  queries: Array<{
    name: string;
    names: { pascal: string; camel: string };
    pattern: string;
    http: { method: string; path: string; statusCode: number };
    params: { path: Array<{ name: string; names: { camel: string }; required: boolean }>;
              query: Array<{ name: string; names: { camel: string }; required: boolean }> };
    response: { type: string; returnType: string };
  }>;
  entities: Array<EnrichedAggregate>;
  enumDefaults: Record<string, string[]>;
}

export function generateOpenApiSpec(ctx: EnrichedContext): string {
  const lines: string[] = [];

  lines.push(`openapi: 3.0.3`);
  lines.push(`info:`);
  lines.push(`  title: ${ctx.boundedContext} Domain API`);
  lines.push(`  version: v1`);
  lines.push(`  description: API for the ${ctx.boundedContext} bounded context`);
  lines.push(`paths:`);

  // Collect all operations grouped by path
  const pathOps = new Map<string, string[]>();

  for (const agg of ctx.aggregates as unknown as EnrichedAggregate[]) {
    collectOperations(agg, pathOps);
    for (const entity of agg.entities ?? []) {
      collectOperations(entity, pathOps);
    }
  }

  // Sort paths and emit
  const sortedPaths = [...pathOps.keys()].sort();
  for (const path of sortedPaths) {
    lines.push(`  ${path}:`);
    for (const op of pathOps.get(path)!) {
      lines.push(op);
    }
  }

  // Schemas
  lines.push(`components:`);
  lines.push(`  securitySchemes:`);
  lines.push(`    bearerAuth:`);
  lines.push(`      type: http`);
  lines.push(`      scheme: bearer`);
  lines.push(`      bearerFormat: JWT`);
  lines.push(`  schemas:`);

  // Pagination schemas
  lines.push(sortSchema());
  lines.push(pageableSchema());

  for (const agg of ctx.aggregates as unknown as EnrichedAggregate[]) {
    lines.push(entitySchema(agg));
    if (hasPagedQuery(agg)) lines.push(pagedListSchema(agg.names.pascal));
    if (hasListQuery(agg)) lines.push(listSchema(agg.names.pascal));
    for (const cmd of agg.commands) {
      if (cmd.params.body.length > 0) lines.push(requestSchema(cmd));
    }
    for (const entity of agg.entities ?? []) {
      lines.push(entitySchema(entity));
      if (hasPagedQuery(entity)) lines.push(pagedListSchema(entity.names.pascal));
      for (const cmd of entity.commands) {
        if (cmd.params.body.length > 0) lines.push(requestSchema(cmd));
      }
    }
  }

  lines.push(`security:`);
  lines.push(`  - bearerAuth: []`);

  return lines.join('\n') + '\n';
}

function collectOperations(
  agg: EnrichedAggregate,
  pathOps: Map<string, string[]>
): void {
  for (const cmd of agg.commands) {
    const method = cmd.http.method.toLowerCase();
    const op = buildOperation(method, cmd.names, cmd.http, cmd.params, cmd.response, agg.names.pascal, true);
    const existing = pathOps.get(cmd.http.path) ?? [];
    existing.push(op);
    pathOps.set(cmd.http.path, existing);
  }
  for (const q of agg.queries) {
    const method = q.http.method.toLowerCase();
    const op = buildOperation(method, q.names, q.http, { ...q.params, body: [] }, q.response, agg.names.pascal, false);
    const existing = pathOps.get(q.http.path) ?? [];
    existing.push(op);
    pathOps.set(q.http.path, existing);
  }
}

function buildOperation(
  method: string,
  names: { pascal: string; camel: string },
  http: { method: string; path: string; statusCode: number },
  params: { path: Array<{ name: string; names: { camel: string }; required: boolean }>;
            body: Array<{ name: string; names: { camel: string }; required: boolean }>;
            query: Array<{ name: string; names: { camel: string }; required: boolean }> },
  response: { type: string; returnType: string },
  entityName: string,
  isCommand: boolean
): string {
  const lines: string[] = [];
  lines.push(`    ${method}:`);
  lines.push(`      summary: ${toWords(names.pascal)}`);
  lines.push(`      operationId: ${names.camel}`);
  lines.push(`      tags:`);
  lines.push(`        - ${entityName}`);

  // Parameters
  const hasParams = params.path.length > 0 || params.query.length > 0 ||
    (response.type === 'paged');
  if (hasParams) {
    lines.push(`      parameters:`);
    for (const p of params.path) {
      lines.push(`        - name: ${p.names.camel}`);
      lines.push(`          in: path`);
      lines.push(`          required: true`);
      lines.push(`          schema:`);
      lines.push(`            type: string`);
      lines.push(`            format: uuid`);
    }
    for (const p of params.query) {
      lines.push(`        - name: ${p.names.camel}`);
      lines.push(`          in: query`);
      lines.push(`          required: ${p.required}`);
      lines.push(`          schema:`);
      lines.push(`            type: string`);
    }
    // Add standard pagination params for search/paged queries
    if (response.type === 'paged') {
      for (const p of ['page', 'size', 'sort', 'direction']) {
        lines.push(`        - name: ${p}`);
        lines.push(`          in: query`);
        lines.push(`          required: false`);
        lines.push(`          schema:`);
        if (p === 'page' || p === 'size') {
          lines.push(`            type: integer`);
        } else if (p === 'direction') {
          lines.push(`            type: string`);
          lines.push(`            enum: [ASC, DESC]`);
        } else {
          lines.push(`            type: string`);
        }
      }
    }
  }

  // Request body
  if (isCommand && params.body.length > 0) {
    lines.push(`      requestBody:`);
    lines.push(`        required: true`);
    lines.push(`        content:`);
    lines.push(`          application/json:`);
    lines.push(`            schema:`);
    lines.push(`              $ref: '#/components/schemas/${names.pascal}Request'`);
  }

  // Responses
  lines.push(`      responses:`);
  const status = http.statusCode;
  if (status === 201) {
    lines.push(`        '201':`);
    lines.push(`          description: Created successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/${entityName}'`);
  } else if (status === 204) {
    lines.push(`        '204':`);
    lines.push(`          description: Deleted`);
  } else if (response.type === 'paged') {
    lines.push(`        '200':`);
    lines.push(`          description: Retrieved successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/Paged${entityName}List'`);
  } else if (response.type === 'void') {
    lines.push(`        '200':`);
    lines.push(`          description: Success`);
  } else {
    lines.push(`        '200':`);
    lines.push(`          description: Retrieved successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/${entityName}'`);
  }
  lines.push(`        '400':`);
  lines.push(`          description: Bad request`);
  lines.push(`        '404':`);
  lines.push(`          description: Not found`);
  lines.push(`        '500':`);
  lines.push(`          description: Internal server error`);

  return lines.join('\n');
}

function hasPagedQuery(agg: EnrichedAggregate): boolean {
  return agg.queries.some(q => q.response.type === 'paged');
}

function hasListQuery(agg: EnrichedAggregate): boolean {
  return agg.queries.some(q => q.response.returnType.endsWith('List') && q.response.type !== 'paged');
}

function entitySchema(agg: EnrichedAggregate): string {
  const lines: string[] = [];
  lines.push(`    ${agg.names.pascal}:`);
  lines.push(`      type: object`);
  lines.push(`      properties:`);
  for (const attr of agg.attributes) {
    const oaType = openApiType(attr.kotlinType);
    lines.push(`        ${attr.names.camel}:`);
    lines.push(`          type: ${oaType.type}`);
    if (oaType.format) lines.push(`          format: ${oaType.format}`);
    if (!attr.required) lines.push(`          nullable: true`);
  }
  return lines.join('\n');
}

function requestSchema(cmd: {
  names: { pascal: string };
  params: { body: Array<{ name: string; names: { camel: string }; required: boolean }> };
}): string {
  const lines: string[] = [];
  const required = cmd.params.body.filter(p => p.required);
  lines.push(`    ${cmd.names.pascal}Request:`);
  lines.push(`      type: object`);
  if (required.length > 0) {
    lines.push(`      required:`);
    for (const r of required) lines.push(`        - ${r.names.camel}`);
  }
  lines.push(`      properties:`);
  for (const p of cmd.params.body) {
    lines.push(`        ${p.names.camel}:`);
    lines.push(`          type: string`);
    if (!p.required) lines.push(`          nullable: true`);
  }
  return lines.join('\n');
}

function pagedListSchema(entityName: string): string {
  return `    Paged${entityName}List:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/${entityName}'
        pageable:
          $ref: '#/components/schemas/Pageable'
        totalElements:
          type: integer
          format: int64
        totalPages:
          type: integer
        size:
          type: integer
        number:
          type: integer
        sort:
          $ref: '#/components/schemas/Sort'
        last:
          type: boolean
        first:
          type: boolean
        empty:
          type: boolean`;
}

function listSchema(entityName: string): string {
  return `    ${entityName}List:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/${entityName}'
        totalElements:
          type: integer
          format: int64`;
}

function sortSchema(): string {
  return `    Sort:
      type: object
      properties:
        sorted:
          type: boolean
        unsorted:
          type: boolean
        empty:
          type: boolean`;
}

function pageableSchema(): string {
  return `    Pageable:
      type: object
      properties:
        pageNumber:
          type: integer
        pageSize:
          type: integer
        sort:
          $ref: '#/components/schemas/Sort'
        offset:
          type: integer
          format: int64
        paged:
          type: boolean
        unpaged:
          type: boolean`;
}
