import { describe, it, expect } from 'vitest';
import { enrichCommand } from '../../src/enrich/command.js';

const aggCtx = {
  names: {
    kebab: 'orders',
    pascal: 'Order',
    camel: 'order',
    plural: 'orders',
    pluralKebab: 'orders',
  },
  identityField: 'orderId',
};

describe('enrichCommand', () => {
  it('CreateOrder → POST /orders 201 CREATE', () => {
    const cmd = enrichCommand(
      { name: 'CreateOrder', body: ['channel', 'currency', 'placedAt?'] },
      aggCtx as any,
    );
    expect(cmd.http.method).toBe('POST');
    expect(cmd.http.path).toBe('/orders');
    expect(cmd.http.statusCode).toBe(201);
    expect(cmd.auth.action).toBe('CREATE');
    expect(cmd.params.body).toHaveLength(3);
    expect(cmd.params.body[2].required).toBe(false); // placedAt?
    expect(cmd.params.path).toHaveLength(0);
  });

  it('UpdateOrderStatus → PUT /orders/{orderId} 200', () => {
    const cmd = enrichCommand({ name: 'UpdateOrderStatus', body: ['status'] }, aggCtx as any);
    expect(cmd.http.method).toBe('PUT');
    expect(cmd.http.path).toBe('/orders/{orderId}');
    expect(cmd.params.path).toHaveLength(1);
    expect(cmd.params.path[0].name).toBe('orderId');
  });

  it('explicit path override takes precedence over convention', () => {
    const cmd = enrichCommand(
      { name: 'GetOrdersBySubscriber', path: ['subscriberId'], returns: 'OrderList' },
      aggCtx as any,
    );
    expect(cmd.params.path[0].name).toBe('subscriberId');
    expect(cmd.http.path).toBe('/orders/{subscriberId}');
  });
});
