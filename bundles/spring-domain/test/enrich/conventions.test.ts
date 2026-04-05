import { describe, it, expect } from 'vitest';
import { detectPattern, deriveHttp, deriveAuth, deriveResponse } from '../../src/enrich/conventions.js';

describe('detectPattern', () => {
  it('detects Create', () => expect(detectPattern('CreateWorkspace')).toBe('Create'));
  it('detects Update', () => expect(detectPattern('UpdateWorkspaceStatus')).toBe('Update'));
  it('detects Delete', () => expect(detectPattern('DeleteWorkspace')).toBe('Delete'));
  it('detects Archive', () => expect(detectPattern('ArchiveWorkspace')).toBe('Archive'));
  it('detects Add (entity)', () => expect(detectPattern('AddParty')).toBe('Add'));
  it('detects Remove (entity)', () => expect(detectPattern('RemoveParty')).toBe('Remove'));
  it('detects Get', () => expect(detectPattern('GetWorkspace')).toBe('Get'));
  it('detects Search', () => expect(detectPattern('SearchWorkspace')).toBe('Search'));
  it('detects List', () => expect(detectPattern('ListWorkspaces')).toBe('Search'));
  it('detects Find', () => expect(detectPattern('FindWorkspacesByStatus')).toBe('Find'));
});

describe('deriveHttp', () => {
  it('Create → POST /workspaces 201', () => {
    const h = deriveHttp('Create', 'workspaces', false);
    expect(h.method).toBe('POST');
    expect(h.path).toBe('/workspaces');
    expect(h.statusCode).toBe(201);
  });
  it('Update with id → PUT /workspaces/{workspaceId} 200', () => {
    const h = deriveHttp('Update', 'workspaces', true, 'workspaceId');
    expect(h.method).toBe('PUT');
    expect(h.path).toBe('/workspaces/{workspaceId}');
    expect(h.statusCode).toBe(200);
  });
  it('Delete with id → DELETE /workspaces/{workspaceId} 204', () => {
    const h = deriveHttp('Delete', 'workspaces', true, 'workspaceId');
    expect(h.method).toBe('DELETE');
    expect(h.path).toBe('/workspaces/{workspaceId}');
    expect(h.statusCode).toBe(204);
  });
  it('Archive → PUT /workspaces/{id}/archive 200', () => {
    const h = deriveHttp('Archive', 'workspaces', true, 'workspaceId');
    expect(h.path).toBe('/workspaces/{workspaceId}/archive');
  });
  it('Get with id → GET /workspaces/{workspaceId} 200', () => {
    const h = deriveHttp('Get', 'workspaces', true, 'workspaceId');
    expect(h.method).toBe('GET');
    expect(h.path).toBe('/workspaces/{workspaceId}');
  });
  it('Search → GET /workspaces 200', () => {
    const h = deriveHttp('Search', 'workspaces', false);
    expect(h.method).toBe('GET');
    expect(h.path).toBe('/workspaces');
  });
  it('Find with suffix → GET /workspaces/by-status 200', () => {
    const h = deriveHttp('Find', 'workspaces', false, undefined, '', 'FindWorkspacesByStatus');
    expect(h.method).toBe('GET');
    expect(h.path).toBe('/workspaces/by-status');
  });
  it('Find with multi-word suffix → GET /workspaces/by-date-range', () => {
    const h = deriveHttp('Find', 'workspaces', false, undefined, '', 'FindWorkspacesByDateRange');
    expect(h.path).toBe('/workspaces/by-date-range');
  });
  it('Find with explicit path param uses withId', () => {
    const h = deriveHttp('Find', 'workspaces', true, 'subscriberId', '', 'FindWorkspacesBySubscriber');
    expect(h.path).toBe('/workspaces/{subscriberId}');
  });
});

describe('deriveAuth', () => {
  it('Create → CREATE', () => expect(deriveAuth('Create').action).toBe('CREATE'));
  it('Update → UPDATE', () => expect(deriveAuth('Update').action).toBe('UPDATE'));
  it('Delete → DELETE', () => expect(deriveAuth('Delete').action).toBe('DELETE'));
  it('Get → READ',    () => expect(deriveAuth('Get').action).toBe('READ'));
  it('Search → READ', () => expect(deriveAuth('Search').action).toBe('READ'));
});

describe('deriveResponse', () => {
  it('Create → entity 201', () => expect(deriveResponse('Create', 'Workspace').type).toBe('entity'));
  it('Delete → void 204',   () => expect(deriveResponse('Delete', 'Workspace').type).toBe('void'));
  it('Get → entity 200',    () => expect(deriveResponse('Get', 'Workspace').type).toBe('entity'));
  it('Search → paged 200',  () => expect(deriveResponse('Search', 'Workspace').type).toBe('paged'));
});
