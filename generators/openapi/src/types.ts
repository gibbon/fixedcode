/**
 * Input contract for the OpenAPI generator.
 * Any bundle can feed this generator by providing an adapter that maps
 * its enriched context into this shape.
 */

export interface OpenApiParam {
  name: string;
  type: string;
  format?: string;
  required: boolean;
}

export interface OpenApiOperation {
  name: string;
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  statusCode: number;
  tag: string;
  description?: string;
  params: {
    path: OpenApiParam[];
    body: OpenApiParam[];
    query: OpenApiParam[];
  };
  response: {
    type: 'entity' | 'paged' | 'list' | 'void';
    schemaRef: string;
  };
}

export interface OpenApiSchema {
  name: string;
  properties: Array<{
    name: string;
    type: string;
    format?: string;
    required: boolean;
  }>;
}

export interface OpenApiInput {
  title: string;
  version?: string;
  description?: string;
  operations: OpenApiOperation[];
  schemas: OpenApiSchema[];
}
