export interface CrudContext {
  name: string;
  resources: ResourceContext[];
}

export interface ResourceContext {
  names: NameVariants;
  fields: FieldContext[];
  endpoints: EndpointContext[];
}

export interface NameVariants {
  pascal: string;
  camel: string;
  snake: string;
  kebab: string;
  plural: string;
  camelPlural: string;
}

export interface FieldContext {
  names: NameVariants;
  type: TypeMapping;
  required: boolean;
  isId: boolean;
}

export interface TypeMapping {
  spec: string;
  typescript: string;
  sql: string;
  nullable: boolean;
}

export interface EndpointContext {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handlerName: string;
  hasBody: boolean;
}
