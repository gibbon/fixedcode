import { describe, it, expect } from 'vitest';
import { enrichAggregate } from '../../src/enrich/aggregate.js';

describe('enrichAggregate', () => {
  it('enriches a simple aggregate', () => {
    const agg = enrichAggregate('Order', {
      attributes: { orderId: 'uuid', status: 'string' },
      commands: [{ name: 'CreateOrder', body: ['status'] }],
      queries: [{ name: 'GetOrder', returns: 'Order' }],
      events: { OrderCreated: { fields: ['orderId'] } },
    });

    expect(agg.identityField).toBe('orderId');
    expect(agg.names.pascal).toBe('Order');
    expect(agg.names.pluralKebab).toBe('orders');
    expect(agg.commands[0].http.method).toBe('POST');
    expect(agg.queries[0].http.method).toBe('GET');
    expect(agg.events[0].name).toBe('OrderCreated');
  });

  it('enriches nested entities', () => {
    const agg = enrichAggregate('Order', {
      attributes: { orderId: 'uuid' },
      entities: {
        LineItem: {
          attributes: { lineItemId: 'uuid', orderId: 'uuid' },
          commands: [{ name: 'AddLineItem', body: ['productSku'] }],
        },
      },
    });

    expect(agg.entities).toHaveLength(1);
    expect(agg.entities[0].name).toBe('LineItem');
    expect(agg.entities[0].parentIdentityField).toBe('orderId');
    expect(agg.entities[0].commands[0].http.method).toBe('POST');
  });
});
