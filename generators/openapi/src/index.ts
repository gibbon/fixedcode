import type { Generator, RenderedFile } from '@fixedcode/engine';
import type { OpenApiInput, OpenApiOperation, OpenApiSchema } from './types.js';

export type { OpenApiInput, OpenApiOperation, OpenApiSchema, OpenApiParam } from './types.js';

function toWords(pascal: string): string {
  return pascal.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function generate(input: Record<string, unknown>): RenderedFile[] {
  const api = input as unknown as OpenApiInput;
  const title = api.title ?? 'API';
  const version = api.version ?? 'v1';
  const description = api.description ?? `API specification for ${title}`;

  const lines: string[] = [];
  lines.push(`openapi: 3.0.3`);
  lines.push(`info:`);
  lines.push(`  title: ${title}`);
  lines.push(`  version: ${version}`);
  lines.push(`  description: ${description}`);
  lines.push(`paths:`);

  // Group operations by path
  const pathOps = new Map<string, OpenApiOperation[]>();
  for (const op of api.operations) {
    const existing = pathOps.get(op.path) ?? [];
    existing.push(op);
    pathOps.set(op.path, existing);
  }

  for (const path of [...pathOps.keys()].sort()) {
    lines.push(`  ${path}:`);
    for (const op of pathOps.get(path)!) {
      lines.push(buildOperation(op));
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
  lines.push(sortSchema());
  lines.push(pageableSchema());

  // Collect which paged/list schemas are needed
  const pagedSchemas = new Set<string>();
  const listSchemas = new Set<string>();
  for (const op of api.operations) {
    if (op.response.type === 'paged') pagedSchemas.add(op.response.schemaRef);
    if (op.response.type === 'list') listSchemas.add(op.response.schemaRef);
  }

  for (const schema of api.schemas) {
    lines.push(buildSchema(schema));
    if (pagedSchemas.has(schema.name)) lines.push(pagedListSchema(schema.name));
    if (listSchemas.has(schema.name)) lines.push(listResponseSchema(schema.name));
  }

  // Request schemas for operations with body params
  for (const op of api.operations) {
    if (op.params.body.length > 0) {
      lines.push(buildRequestSchema(op));
    }
  }

  lines.push(`security:`);
  lines.push(`  - bearerAuth: []`);

  const content = lines.join('\n') + '\n';
  const fileName = title.toLowerCase().replace(/\s+/g, '-') + '-openapi.yaml';

  return [{ path: fileName, content }];
}

function buildOperation(op: OpenApiOperation): string {
  const lines: string[] = [];
  const method = op.method.toLowerCase();
  lines.push(`    ${method}:`);
  lines.push(`      summary: ${toWords(op.name)}`);
  lines.push(`      operationId: ${op.operationId}`);
  lines.push(`      tags:`);
  lines.push(`        - ${op.tag}`);
  if (op.description) {
    lines.push(`      description: ${op.description}`);
  }

  // Parameters
  const hasParams =
    op.params.path.length > 0 || op.params.query.length > 0 || op.response.type === 'paged';
  if (hasParams) {
    lines.push(`      parameters:`);
    for (const p of op.params.path) {
      lines.push(`        - name: ${p.name}`);
      lines.push(`          in: path`);
      lines.push(`          required: true`);
      lines.push(`          schema:`);
      lines.push(`            type: ${p.type}`);
      if (p.format) lines.push(`            format: ${p.format}`);
    }
    for (const p of op.params.query) {
      lines.push(`        - name: ${p.name}`);
      lines.push(`          in: query`);
      lines.push(`          required: ${p.required}`);
      lines.push(`          schema:`);
      lines.push(`            type: ${p.type}`);
      if (p.format) lines.push(`            format: ${p.format}`);
    }
    if (op.response.type === 'paged') {
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
  if (op.params.body.length > 0) {
    lines.push(`      requestBody:`);
    lines.push(`        required: true`);
    lines.push(`        content:`);
    lines.push(`          application/json:`);
    lines.push(`            schema:`);
    lines.push(`              $ref: '#/components/schemas/${op.name}Request'`);
  }

  // Responses
  lines.push(`      responses:`);
  if (op.statusCode === 201) {
    lines.push(`        '201':`);
    lines.push(`          description: Created successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/${op.response.schemaRef}'`);
  } else if (op.statusCode === 204) {
    lines.push(`        '204':`);
    lines.push(`          description: Deleted`);
  } else if (op.response.type === 'paged') {
    lines.push(`        '200':`);
    lines.push(`          description: Retrieved successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/Paged${op.response.schemaRef}List'`);
  } else if (op.response.type === 'list') {
    lines.push(`        '200':`);
    lines.push(`          description: Retrieved successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/${op.response.schemaRef}List'`);
  } else if (op.response.type === 'void') {
    lines.push(`        '200':`);
    lines.push(`          description: Success`);
  } else {
    lines.push(`        '200':`);
    lines.push(`          description: Retrieved successfully`);
    lines.push(`          content:`);
    lines.push(`            application/json:`);
    lines.push(`              schema:`);
    lines.push(`                $ref: '#/components/schemas/${op.response.schemaRef}'`);
  }
  lines.push(`        '400':`);
  lines.push(`          description: Bad request`);
  lines.push(`        '404':`);
  lines.push(`          description: Not found`);
  lines.push(`        '500':`);
  lines.push(`          description: Internal server error`);

  return lines.join('\n');
}

function buildSchema(schema: OpenApiSchema): string {
  const lines: string[] = [];
  lines.push(`    ${schema.name}:`);
  lines.push(`      type: object`);
  lines.push(`      properties:`);
  for (const prop of schema.properties) {
    lines.push(`        ${prop.name}:`);
    lines.push(`          type: ${prop.type}`);
    if (prop.format) lines.push(`          format: ${prop.format}`);
    if (!prop.required) lines.push(`          nullable: true`);
  }
  return lines.join('\n');
}

function buildRequestSchema(op: OpenApiOperation): string {
  const lines: string[] = [];
  const required = op.params.body.filter((p) => p.required);
  lines.push(`    ${op.name}Request:`);
  lines.push(`      type: object`);
  if (required.length > 0) {
    lines.push(`      required:`);
    for (const r of required) lines.push(`        - ${r.name}`);
  }
  lines.push(`      properties:`);
  for (const p of op.params.body) {
    lines.push(`        ${p.name}:`);
    lines.push(`          type: ${p.type}`);
    if (p.format) lines.push(`          format: ${p.format}`);
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

function listResponseSchema(entityName: string): string {
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

export const generator: Generator = {
  name: 'openapi',
  generate,
};

export default generator;
