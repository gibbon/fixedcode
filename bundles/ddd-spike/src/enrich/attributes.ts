import type { AttributeContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';

interface RawAttribute {
  name: string;
  type: string;
  required?: boolean;
  identity?: boolean;
  default?: string;
}

export function enrichAttribute(raw: RawAttribute): AttributeContext {
  const names = toNameVariants(raw.name);
  const required = raw.required ?? false;
  const type = toTypeMapping(raw.type, required);
  const hasDefault = raw.default !== undefined;

  let kotlinDefault = '';
  if (hasDefault) {
    kotlinDefault = type.kotlin === 'String' ? ` = "${raw.default}"` : ` = ${raw.default}`;
  }

  let sqlColumn = `${names.snake} ${type.sql}`;
  if (required) {
    sqlColumn += ' NOT NULL';
  }
  if (hasDefault) {
    const sqlDefault = type.kotlin === 'String' ? `'${raw.default}'` : raw.default;
    sqlColumn += ` DEFAULT ${sqlDefault}`;
  }

  return {
    names,
    type,
    required,
    identity: raw.identity ?? false,
    default: raw.default,
    hasDefault,
    kotlinDefault,
    sqlColumn,
  };
}