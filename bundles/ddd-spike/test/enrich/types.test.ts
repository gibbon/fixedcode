import { describe, it, expect } from 'vitest';
import { toTypeMapping } from '../../src/enrich/types.js';

describe('toTypeMapping', () => {
  it('maps uuid type', () => {
    const result = toTypeMapping('uuid', true);
    expect(result).toEqual({
      spec: 'uuid',
      kotlin: 'UUID',
      sql: 'UUID',
      nullable: false,
      kotlinDecl: 'UUID',
      needsImport: 'java.util.UUID',
    });
  });

  it('maps string type (required)', () => {
    const result = toTypeMapping('string', true);
    expect(result.kotlin).toBe('String');
    expect(result.sql).toBe('VARCHAR(255)');
    expect(result.nullable).toBe(false);
    expect(result.kotlinDecl).toBe('String');
    expect(result.needsImport).toBeUndefined();
  });

  it('maps string type (optional)', () => {
    const result = toTypeMapping('string', false);
    expect(result.nullable).toBe(true);
    expect(result.kotlinDecl).toBe('String?');
  });

  it('maps decimal type', () => {
    const result = toTypeMapping('decimal', false);
    expect(result.kotlin).toBe('BigDecimal');
    expect(result.sql).toBe('DECIMAL(19,2)');
    expect(result.kotlinDecl).toBe('BigDecimal?');
    expect(result.needsImport).toBe('java.math.BigDecimal');
  });

  it('maps int type', () => {
    const result = toTypeMapping('int', true);
    expect(result.kotlin).toBe('Int');
    expect(result.sql).toBe('INT');
  });

  it('maps long type', () => {
    const result = toTypeMapping('long', true);
    expect(result.kotlin).toBe('Long');
    expect(result.sql).toBe('BIGINT');
  });

  it('maps boolean type', () => {
    const result = toTypeMapping('boolean', true);
    expect(result.kotlin).toBe('Boolean');
    expect(result.sql).toBe('BOOLEAN');
  });

  it('maps date type', () => {
    const result = toTypeMapping('date', true);
    expect(result.kotlin).toBe('LocalDate');
    expect(result.needsImport).toBe('java.time.LocalDate');
  });

  it('maps datetime type', () => {
    const result = toTypeMapping('datetime', true);
    expect(result.kotlin).toBe('LocalDateTime');
    expect(result.needsImport).toBe('java.time.LocalDateTime');
  });

  it('throws on unknown type', () => {
    expect(() => toTypeMapping('foo', true)).toThrow('Unknown type: foo');
  });
});
