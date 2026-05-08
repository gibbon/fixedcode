import { describe, it, expect } from 'vitest';
import { enrichQuery } from '../../src/enrich/query.js';

const aggCtx = {
  names: { pluralKebab: 'orders', pascal: 'Order' },
  identityField: 'orderId',
};

describe('enrichQuery', () => {
  it('GetOrder → GET /orders/{orderId} 200', () => {
    const q = enrichQuery({ name: 'GetOrder', returns: 'Order' }, aggCtx as any);
    expect(q.http.method).toBe('GET');
    expect(q.http.path).toBe('/orders/{orderId}');
    expect(q.response.type).toBe('entity');
  });

  it('SearchOrder → GET /orders 200 paged', () => {
    const q = enrichQuery(
      { name: 'SearchOrder', returns: 'PagedOrderList' },
      aggCtx as any,
    );
    expect(q.http.path).toBe('/orders');
    expect(q.response.type).toBe('paged');
  });

  it('FindBySubscriber with explicit query param', () => {
    const q = enrichQuery(
      { name: 'FindWorkspacesBySubscriber', query: ['subscriberId'], returns: 'OrderList' },
      aggCtx as any,
    );
    expect(q.params.query[0].name).toBe('subscriberId');
  });
});
