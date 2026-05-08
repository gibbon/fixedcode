import type { TypeMapping } from '../context.js';

interface TypeDef {
  kotlin: string;
  sql: string;
  needsImport?: string;
}

const TYPE_MAP: Record<string, TypeDef> = {
  uuid: { kotlin: 'UUID', sql: 'UUID', needsImport: 'java.util.UUID' },
  string: { kotlin: 'String', sql: 'VARCHAR(255)' },
  int: { kotlin: 'Int', sql: 'INT' },
  long: { kotlin: 'Long', sql: 'BIGINT' },
  boolean: { kotlin: 'Boolean', sql: 'BOOLEAN' },
  decimal: { kotlin: 'BigDecimal', sql: 'DECIMAL(19,2)', needsImport: 'java.math.BigDecimal' },
  date: { kotlin: 'LocalDate', sql: 'DATE', needsImport: 'java.time.LocalDate' },
  datetime: { kotlin: 'LocalDateTime', sql: 'TIMESTAMP', needsImport: 'java.time.LocalDateTime' },
  object: { kotlin: 'Map<String, Any?>', sql: 'JSONB' },
};

export function toTypeMapping(specType: string, required: boolean): TypeMapping {
  const def = TYPE_MAP[specType];
  if (!def) {
    throw new Error(`Unknown type: ${specType}`);
  }

  const nullable = !required;
  return {
    spec: specType,
    kotlin: def.kotlin,
    sql: def.sql,
    nullable,
    kotlinDecl: nullable ? `${def.kotlin}?` : def.kotlin,
    needsImport: def.needsImport,
  };
}
