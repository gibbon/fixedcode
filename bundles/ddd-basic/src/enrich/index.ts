export interface Attribute {
  name: string;
  type: string;
  identity?: boolean;
  required?: boolean;
  default?: string;
}

export interface Command {
  name: string;
  params: Attribute[];
  emits: string;
}

export interface Query {
  name: string;
  returns: 'single' | 'list';
  filters: Attribute[];
}

export interface EventField {
  name: string;
  type: string;
}

export interface Event {
  name: string;
  fields: EventField[];
}

export interface Aggregate {
  name: string;
  attributes: Attribute[];
  commands: Command[];
  queries: Query[];
  events: Event[];
}

export interface DddBasicSpec {
  package: string;
  boundedContext?: string;
  aggregates: Record<string, Aggregate>;
}

export interface AggregateContext {
  name: string;
  namePascal: string;
  nameCamel: string;
  nameSnake: string;
  nameKebab: string;
  attributes: AttributeContext[];
  commands: CommandContext[];
  queries: QueryContext[];
  events: EventContext[];
}

export interface AttributeContext {
  name: string;
  namePascal: string;
  nameCamel: string;
  type: string;
  javaType: string;
  isIdentity: boolean;
  isRequired: boolean;
  defaultValue?: string;
}

export interface CommandContext {
  name: string;
  namePascal: string;
  nameCamel: string;
  nameKebab: string;
  httpMethod: string;
  httpPath: string;
  operationId: string;
  params: AttributeContext[];
  emits: string;
  emitPascal: string;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  returnsEntity: boolean;
  returnsId: boolean;
  returnsNothing: boolean;
}

export interface QueryContext {
  name: string;
  namePascal: string;
  nameCamel: string;
  nameKebab: string;
  httpMethod: string;
  httpPath: string;
  operationId: string;
  returns: 'single' | 'list';
  filters: AttributeContext[];
  isSearch: boolean;
}

export interface EventContext {
  name: string;
  namePascal: string;
  fields: AttributeContext[];
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
    index === 0 ? word.toUpperCase() : word.toUpperCase()
  ).replace(/[\s_-]+/g, '');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[\s-]+/g, '_');
}

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/[\s_]+/g, '-');
}

function mapTypeToJava(specType: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'UUID',
    string: 'String',
    int: 'Integer',
    long: 'Long',
    boolean: 'Boolean',
    decimal: 'BigDecimal',
    date: 'LocalDate',
    datetime: 'LocalDateTime',
    object: 'Object'
  };
  return typeMap[specType] || 'Object';
}

function enrichAttribute(attr: Attribute): AttributeContext {
  let defaultValue = attr.default;
  if (defaultValue && attr.type === 'string') {
    defaultValue = `"${defaultValue}"`;
  }
  
  return {
    name: attr.name,
    namePascal: toPascalCase(attr.name),
    nameCamel: toCamelCase(attr.name),
    type: attr.type,
    javaType: mapTypeToJava(attr.type),
    isIdentity: attr.identity ?? false,
    isRequired: attr.required ?? attr.identity ?? false,
    defaultValue
  };
}

function enrichAggregate(name: string, agg: Aggregate): AggregateContext {
  const namePascal = toPascalCase(name);
  
  return {
    name,
    namePascal,
    nameCamel: toCamelCase(name),
    nameSnake: toSnakeCase(name),
    nameKebab: toKebabCase(name),
    attributes: agg.attributes.map(enrichAttribute),
    commands: agg.commands.map(cmd => ({
      name: cmd.name,
      namePascal: toPascalCase(cmd.name),
      params: cmd.params.map(enrichAttribute),
      emits: cmd.emits,
      emitPascal: toPascalCase(cmd.emits)
    })),
    queries: agg.queries.map(q => ({
      name: q.name,
      namePascal: toPascalCase(q.name),
      returns: q.returns || 'single',
      filters: (q.filters || []).map(enrichAttribute)
    })),
    events: (agg.events || []).map(evt => ({
      name: evt.name,
      namePascal: toPascalCase(evt.name),
      fields: (evt.fields || []).map(f => ({
        name: f.name,
        namePascal: toPascalCase(f.name),
        nameCamel: toCamelCase(f.name),
        type: f.type,
        javaType: mapTypeToJava(f.type),
        isIdentity: false,
        isRequired: true
      }))
    }))
  };
}

export function enrich(spec: DddBasicSpec): AggregateContext[] {
  return Object.entries(spec.aggregates).map(([name, agg]) =>
    enrichAggregate(name, agg)
  );
}