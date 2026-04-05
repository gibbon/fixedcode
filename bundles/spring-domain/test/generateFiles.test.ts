import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';

const rawSpec = {
  boundedContext: 'Order',
  service: { port: 8081, package: 'io.example.order' },
  aggregates: {
    Order: {
      attributes: { orderId: 'uuid', status: 'string' },
      commands: [
        { name: 'CreateOrder', body: ['status'] },
        { name: 'UpdateOrderStatus', body: ['status'] },
      ],
      queries: [{ name: 'GetOrder', returns: 'Order' }],
      events: { OrderCreated: { fields: ['orderId'] } },
      entities: {
        LineItem: {
          attributes: { lineItemId: 'uuid' },
          commands: [{ name: 'AddLineItem', body: ['productSku'] }],
        },
      },
    },
  },
};

describe('generateFiles', () => {
  it('produces correct file paths for all expansion types', () => {
    const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Once per bounded context
    expect(paths).toContain('src/main/kotlin/io/example/order/domain/shared/DomainEvent.kt');

    // Per aggregate
    expect(paths).toContain('src/main/kotlin/io/example/order/domain/order/Order.kt');
    expect(paths).toContain('src/main/kotlin/io/example/order/application/order/OrderCommandService.kt');
    expect(paths).toContain('src/main/kotlin/io/example/order/api/order/OrderApiDelegateImpl.kt');

    // Per command
    expect(paths).toContain('src/main/kotlin/io/example/order/domain/order/commands/CreateOrderCommand.kt');
    expect(paths).toContain('src/main/kotlin/io/example/order/domain/order/commands/UpdateOrderStatusCommand.kt');

    // Per entity
    expect(paths).toContain('src/main/kotlin/io/example/order/domain/order/entities/LineItem.kt');

    // Per entity command
    expect(paths).toContain('src/main/kotlin/io/example/order/domain/order/entities/commands/AddLineItemCommand.kt');

    // Tests
    expect(paths).toContain('src/test/kotlin/io/example/order/domain/order/OrderTest.kt');
  });

  it('passes correct context to each file', () => {
    const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
    const files = generateFiles(ctx);
    const cmdFile = files.find(f => f.output.includes('CreateOrderCommand.kt'));
    expect(cmdFile?.ctx).toHaveProperty('cmd');
    expect((cmdFile?.ctx as any).cmd.name).toBe('CreateOrder');
  });

  it('every file entry includes packagePath in its context', () => {
    const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
    const files = generateFiles(ctx);
    for (const f of files) {
      expect(f.ctx).toHaveProperty('packagePath');
    }
  });
});
