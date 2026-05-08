/**
 * Adapter that maps spring-domain's EnrichedContext into the OpenAPI generator's input contract.
 */
import type { Context } from '@fixedcode/engine';
import type {
  OpenApiInput,
  OpenApiOperation,
  OpenApiSchema,
  OpenApiParam,
} from '@fixedcode/generator-openapi';

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

function mapType(kotlinType: string): { type: string; format?: string } {
  return OPENAPI_TYPE_MAP[kotlinType] ?? { type: 'string' };
}

export function toOpenApi(ctx: Context): OpenApiInput {
  const boundedContext = ctx.boundedContext as string;
  const aggregates = ctx.aggregates as any[];

  const operations: OpenApiOperation[] = [];
  const schemas: OpenApiSchema[] = [];

  for (const agg of aggregates) {
    const attrTypeMap = buildAttrTypeMap(agg.attributes);
    // Entity schema
    schemas.push(mapSchema(agg));

    // Commands → operations
    for (const cmd of agg.commands ?? []) {
      operations.push(mapCommand(cmd, agg.names.pascal, attrTypeMap));
    }

    // Queries → operations
    for (const q of agg.queries ?? []) {
      operations.push(mapQuery(q, agg.names.pascal, attrTypeMap));
    }

    // Child entities
    for (const entity of agg.entities ?? []) {
      const entityAttrTypeMap = buildAttrTypeMap(entity.attributes);
      schemas.push(mapSchema(entity));
      for (const cmd of entity.commands ?? []) {
        operations.push(mapCommand(cmd, entity.names.pascal, entityAttrTypeMap));
      }
      for (const q of entity.queries ?? []) {
        operations.push(mapQuery(q, entity.names.pascal, entityAttrTypeMap));
      }
    }
  }

  return {
    title: `${boundedContext} Domain API`,
    version: 'v1',
    description: `API for the ${boundedContext} bounded context`,
    operations,
    schemas,
  };
}

function mapSchema(entity: any): OpenApiSchema {
  return {
    name: entity.names.pascal,
    properties: (entity.attributes ?? []).map((attr: any) => {
      const mapped = mapType(attr.kotlinType);
      return {
        name: attr.names.camel,
        type: mapped.type,
        format: mapped.format,
        required: attr.required,
      };
    }),
  };
}

function mapCommand(
  cmd: any,
  entityName: string,
  attrTypeMap: Map<string, string>,
): OpenApiOperation {
  return {
    name: cmd.names.pascal,
    operationId: cmd.names.camel,
    method: cmd.http.method,
    path: cmd.http.path,
    statusCode: cmd.http.statusCode,
    tag: entityName,
    params: {
      path: (cmd.params.path ?? []).map((p: any) => mapParam(p, attrTypeMap)),
      body: (cmd.params.body ?? []).map((p: any) => mapParam(p, attrTypeMap)),
      query: (cmd.params.query ?? []).map((p: any) => mapParam(p, attrTypeMap)),
    },
    response: {
      type: cmd.response.type,
      schemaRef: entityName,
    },
  };
}

function mapQuery(q: any, entityName: string, attrTypeMap: Map<string, string>): OpenApiOperation {
  return {
    name: q.names.pascal,
    operationId: q.names.camel,
    method: q.http.method,
    path: q.http.path,
    statusCode: q.http.statusCode,
    tag: entityName,
    params: {
      path: (q.params.path ?? []).map((p: any) => mapParam(p, attrTypeMap)),
      body: [],
      query: (q.params.query ?? []).map((p: any) => mapParam(p, attrTypeMap)),
    },
    response: {
      type: q.response.type,
      schemaRef: entityName,
    },
  };
}

function buildAttrTypeMap(attributes: any[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const attr of attributes ?? []) {
    map.set(attr.name, attr.kotlinType);
  }
  return map;
}

function mapParam(p: any, attrTypeMap: Map<string, string>): OpenApiParam {
  const kotlinType = attrTypeMap.get(p.name);
  if (kotlinType) {
    const mapped = OPENAPI_TYPE_MAP[kotlinType];
    if (mapped)
      return {
        name: p.names.camel,
        type: mapped.type,
        format: mapped.format,
        required: p.required,
      };
  }
  return {
    name: p.names.camel,
    type: 'string',
    format: p.names?.camel?.endsWith('Id') ? 'uuid' : undefined,
    required: p.required,
  };
}
