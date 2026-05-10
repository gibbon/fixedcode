import { describe, it, expect } from 'vitest';
import {
  detectPattern,
  deriveHttp,
  deriveAuth,
  deriveResponse,
} from '../../src/enrich/conventions.js';

describe('detectPattern', () => {
  it('detects Create', () => expect(detectPattern('CreateOrder')).toBe('Create'));
  it('detects Update', () => expect(detectPattern('UpdateOrderStatus')).toBe('Update'));
  it('detects Delete', () => expect(detectPattern('DeleteOrder')).toBe('Delete'));
  it('detects Archive', () => expect(detectPattern('ArchiveOrder')).toBe('Archive'));
  it('detects Add (entity)', () => expect(detectPattern('AddLineItem')).toBe('Add'));
  it('detects Remove (entity)', () => expect(detectPattern('RemoveLineItem')).toBe('Remove'));
  it('detects Get', () => expect(detectPattern('GetOrder')).toBe('Get'));
  it('detects Search', () => expect(detectPattern('SearchOrder')).toBe('Search'));
  it('detects List', () => expect(detectPattern('ListOrders')).toBe('Search'));
  it('detects Find', () => expect(detectPattern('FindOrdersByStatus')).toBe('Find'));
});

describe('deriveHttp', () => {
  it('Create → POST /orders 201', () => {
    const h = deriveHttp('Create', 'orders', false);
    expect(h.method).toBe('POST');
    expect(h.path).toBe('/orders');
    expect(h.statusCode).toBe(201);
  });
  it('Update with id → PUT /orders/{orderId} 200', () => {
    const h = deriveHttp('Update', 'orders', true, 'orderId');
    expect(h.method).toBe('PUT');
    expect(h.path).toBe('/orders/{orderId}');
    expect(h.statusCode).toBe(200);
  });
  it('Delete with id → DELETE /orders/{orderId} 204', () => {
    const h = deriveHttp('Delete', 'orders', true, 'orderId');
    expect(h.method).toBe('DELETE');
    expect(h.path).toBe('/orders/{orderId}');
    expect(h.statusCode).toBe(204);
  });
  it('Archive → PUT /orders/{id}/archive 200', () => {
    const h = deriveHttp('Archive', 'orders', true, 'orderId');
    expect(h.path).toBe('/orders/{orderId}/archive');
  });
  it('Get with id → GET /orders/{orderId} 200', () => {
    const h = deriveHttp('Get', 'orders', true, 'orderId');
    expect(h.method).toBe('GET');
    expect(h.path).toBe('/orders/{orderId}');
  });
  it('Search → GET /orders 200', () => {
    const h = deriveHttp('Search', 'orders', false);
    expect(h.method).toBe('GET');
    expect(h.path).toBe('/orders');
  });
  it('Find with suffix → GET /orders/by-status 200', () => {
    const h = deriveHttp('Find', 'orders', false, undefined, '', 'FindOrdersByStatus');
    expect(h.method).toBe('GET');
    expect(h.path).toBe('/orders/by-status');
  });
  it('Find with multi-word suffix → GET /orders/by-date-range', () => {
    const h = deriveHttp('Find', 'orders', false, undefined, '', 'FindOrdersByDateRange');
    expect(h.path).toBe('/orders/by-date-range');
  });
  it('Find with explicit path param uses withId', () => {
    const h = deriveHttp(
      'Find',
      'orders',
      true,
      'subscriberId',
      '',
      'FindOrdersBySubscriber',
    );
    expect(h.path).toBe('/orders/{subscriberId}');
  });
});

describe('deriveAuth', () => {
  it('Create → CREATE', () => expect(deriveAuth('Create').action).toBe('CREATE'));
  it('Update → UPDATE', () => expect(deriveAuth('Update').action).toBe('UPDATE'));
  it('Delete → DELETE', () => expect(deriveAuth('Delete').action).toBe('DELETE'));
  it('Get → READ', () => expect(deriveAuth('Get').action).toBe('READ'));
  it('Search → READ', () => expect(deriveAuth('Search').action).toBe('READ'));
});

describe('deriveResponse', () => {
  it('Create → entity 201', () =>
    expect(deriveResponse('Create', 'Order').type).toBe('entity'));
  it('Delete → void 204', () => expect(deriveResponse('Delete', 'Order').type).toBe('void'));
  it('Get → entity 200', () => expect(deriveResponse('Get', 'Order').type).toBe('entity'));
  it('Search → paged 200', () => expect(deriveResponse('Search', 'Order').type).toBe('paged'));
});
