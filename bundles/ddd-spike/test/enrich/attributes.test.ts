import { describe, it, expect } from 'vitest';
import { enrichAttribute } from '../../src/enrich/attributes.js';

describe('enrichAttribute', () => {
  it('enriches a required uuid identity field', () => {
    const result = enrichAttribute({
      name: 'orderId',
      type: 'uuid',
      required: true,
      identity: true,
    });
    expect(result.names.pascal).toBe('OrderId');
    expect(result.names.camel).toBe('orderId');
    expect(result.type.kotlin).toBe('UUID');
    expect(result.type.nullable).toBe(false);
    expect(result.required).toBe(true);
    expect(result.identity).toBe(true);
    expect(result.hasDefault).toBe(false);
    expect(result.kotlinDefault).toBe('');
    expect(result.sqlColumn).toBe('order_id UUID NOT NULL');
  });

  it('enriches an optional string field with default', () => {
    const result = enrichAttribute({
      name: 'status',
      type: 'string',
      default: 'CREATED',
    });
    expect(result.required).toBe(false);
    expect(result.type.kotlinDecl).toBe('String?');
    expect(result.hasDefault).toBe(true);
    expect(result.kotlinDefault).toBe(' = "CREATED"');
    expect(result.sqlColumn).toBe("status VARCHAR(255) DEFAULT 'CREATED'");
  });

  it('enriches an optional decimal field', () => {
    const result = enrichAttribute({
      name: 'totalAmount',
      type: 'decimal',
    });
    expect(result.type.kotlinDecl).toBe('BigDecimal?');
    expect(result.sqlColumn).toBe('total_amount DECIMAL(19,2)');
  });
});
