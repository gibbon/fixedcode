import { describe, it, expect } from 'vitest';
import { toNameVariants } from '../../src/enrich/names.js';

describe('toNameVariants', () => {
  it('converts PascalCase input', () => {
    const result = toNameVariants('OrderItem');
    expect(result).toEqual({
      pascal: 'OrderItem',
      camel: 'orderItem',
      snake: 'order_item',
      kebab: 'order-item',
      upper: 'ORDER_ITEM',
      plural: 'OrderItems',
      camelPlural: 'orderItems',
      snakePlural: 'order_items',
      kebabPlural: 'order-items',
    });
  });

  it('converts single word', () => {
    const result = toNameVariants('Order');
    expect(result.pascal).toBe('Order');
    expect(result.camel).toBe('order');
    expect(result.snake).toBe('order');
    expect(result.plural).toBe('Orders');
  });

  it('converts camelCase input', () => {
    const result = toNameVariants('orderId');
    expect(result.pascal).toBe('OrderId');
    expect(result.camel).toBe('orderId');
    expect(result.snake).toBe('order_id');
  });

  it('handles acronyms in names', () => {
    const result = toNameVariants('HTMLParser');
    expect(result.camel).toBe('htmlParser');
    expect(result.snake).toBe('html_parser');
  });
});