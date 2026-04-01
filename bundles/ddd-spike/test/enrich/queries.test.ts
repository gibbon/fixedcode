import { describe, it, expect } from 'vitest';
import { enrichQuery } from '../../src/enrich/queries.js';

describe('enrichQuery', () => {
  it('enriches a single-return query', () => {
    const result = enrichQuery(
      { name: 'GetOrder', returns: 'single' },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.names.pascal).toBe('GetOrder');
    expect(result.returns).toBe('single');
    expect(result.isList).toBe(false);
    expect(result.httpPath).toBe('/{orderId}');
    expect(result.filters).toHaveLength(0);
  });

  it('enriches a list query with filters', () => {
    const result = enrichQuery(
      {
        name: 'SearchOrders',
        returns: 'list',
        filters: [{ name: 'status', type: 'string' }],
      },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.isList).toBe(true);
    expect(result.httpPath).toBe('');
    expect(result.filters).toHaveLength(1);
    expect(result.filters[0].names.camel).toBe('status');
  });
});