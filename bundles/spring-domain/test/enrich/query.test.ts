import { describe, it, expect } from 'vitest';
import { enrichQuery } from '../../src/enrich/query.js';

const aggCtx = {
  names: { pluralKebab: 'workspaces', pascal: 'Workspace' },
  identityField: 'workspaceId',
};

describe('enrichQuery', () => {
  it('GetWorkspace → GET /workspaces/{workspaceId} 200', () => {
    const q = enrichQuery({ name: 'GetWorkspace', returns: 'Workspace' }, aggCtx as any);
    expect(q.http.method).toBe('GET');
    expect(q.http.path).toBe('/workspaces/{workspaceId}');
    expect(q.response.type).toBe('entity');
  });

  it('SearchWorkspace → GET /workspaces 200 paged', () => {
    const q = enrichQuery(
      { name: 'SearchWorkspace', returns: 'PagedWorkspaceList' },
      aggCtx as any,
    );
    expect(q.http.path).toBe('/workspaces');
    expect(q.response.type).toBe('paged');
  });

  it('FindBySubscriber with explicit query param', () => {
    const q = enrichQuery(
      { name: 'FindWorkspacesBySubscriber', query: ['subscriberId'], returns: 'WorkspaceList' },
      aggCtx as any,
    );
    expect(q.params.query[0].name).toBe('subscriberId');
  });
});
