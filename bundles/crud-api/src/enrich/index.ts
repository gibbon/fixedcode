import type { Context } from '@fixedcode/engine';
import type { SpecMetadata } from '@fixedcode/engine';
import type { CrudContext, ResourceContext, NameVariants, FieldContext, TypeMapping, EndpointContext } from '../context.js';

function toNameVariants(name: string): NameVariants {
  const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean);
  const pascal = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  const snake = words.map(w => w.toLowerCase()).join('_');
  const kebab = words.map(w => w.toLowerCase()).join('-');
  const plural = pascal + (pascal.endsWith('s') ? 'es' : 's');
  const camelPlural = camel + (camel.endsWith('s') ? 'es' : 's');
  return { pascal, camel, snake, kebab, plural, camelPlural };
}

const TYPE_MAP: Record<string, { typescript: string; sql: string }> = {
  uuid: { typescript: 'string', sql: 'UUID' },
  string: { typescript: 'string', sql: 'VARCHAR(255)' },
  number: { typescript: 'number', sql: 'REAL' },
  integer: { typescript: 'number', sql: 'INTEGER' },
  boolean: { typescript: 'boolean', sql: 'BOOLEAN' },
  date: { typescript: 'string', sql: 'DATE' },
};

function toTypeMapping(specType: string, required: boolean): TypeMapping {
  const def = TYPE_MAP[specType] || { typescript: 'any', sql: 'TEXT' };
  return {
    spec: specType,
    typescript: def.typescript,
    sql: def.sql,
    nullable: !required,
  };
}

function enrichResource(name: string, fields: Array<{ name: string; type: string; required?: boolean; isId?: boolean }>): ResourceContext {
  const names = toNameVariants(name);
  const fieldCtxs: FieldContext[] = fields.map(f => ({
    names: toNameVariants(f.name),
    type: toTypeMapping(f.type, f.required ?? false),
    required: f.required ?? false,
    isId: f.isId ?? false,
  }));

  const idField = fieldCtxs.find(f => f.isId);
  const idParam = idField ? `/:${idField.names.camel}` : '';
  const idType = idField?.type.typescript || 'string';

  const endpoints: EndpointContext[] = [
    { method: 'GET', path: `/${names.kebab}s`, handlerName: `get${names.plural}`, hasBody: false },
    { method: 'GET', path: `/${names.kebab}s${idParam}`, handlerName: `get${names.pascal}`, hasBody: false },
    { method: 'POST', path: `/${names.kebab}s`, handlerName: `create${names.pascal}`, hasBody: true },
    { method: 'PUT', path: `/${names.kebab}s${idParam}`, handlerName: `update${names.pascal}`, hasBody: true },
    { method: 'DELETE', path: `/${names.kebab}s${idParam}`, handlerName: `delete${names.pascal}`, hasBody: false },
  ];

  return { names, fields: fieldCtxs, endpoints };
}

export function enrich(spec: Record<string, unknown>, _metadata: SpecMetadata): Context {
  const name = spec.name as string;
  const resources = (spec.resources as Array<{ name: string; fields: Array<{ name: string; type: string; required?: boolean; isId?: boolean }> }>) || [];
  
  return {
    name,
    resources: resources.map(r => enrichResource(r.name, r.fields)),
  } as unknown as Context;
}