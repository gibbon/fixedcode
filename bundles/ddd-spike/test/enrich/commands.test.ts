import { describe, it, expect } from 'vitest';
import { enrichCommand } from '../../src/enrich/commands.js';

describe('enrichCommand', () => {
  it('enriches a create command', () => {
    const result = enrichCommand(
      {
        name: 'CreateOrder',
        params: [{ name: 'customerId', type: 'uuid', required: true }],
        emits: 'OrderCreated',
      },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.names.pascal).toBe('CreateOrder');
    expect(result.isCreate).toBe(true);
    expect(result.httpMethod).toBe('POST');
    expect(result.httpPath).toBe('');
    expect(result.params).toHaveLength(1);
    expect(result.params[0].names.camel).toBe('customerId');
    expect(result.event.names.pascal).toBe('OrderCreated');
  });

  it('enriches an update command', () => {
    const result = enrichCommand(
      {
        name: 'UpdateStatus',
        params: [{ name: 'status', type: 'string', required: true }],
        emits: 'OrderStatusUpdated',
      },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.isCreate).toBe(false);
    expect(result.httpMethod).toBe('PUT');
    expect(result.httpPath).toBe('/{orderId}');
    expect(result.event.names.pascal).toBe('OrderStatusUpdated');
  });
});
