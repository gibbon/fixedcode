import { describe, it, expect } from 'vitest';
import { enrichCommand } from '../../src/enrich/command.js';

const aggCtx = {
  names: { kebab: 'workspaces', pascal: 'Workspace', camel: 'workspace', plural: 'workspaces', pluralKebab: 'workspaces' },
  identityField: 'workspaceId',
};

describe('enrichCommand', () => {
  it('CreateWorkspace → POST /workspaces 201 CREATE', () => {
    const cmd = enrichCommand({ name: 'CreateWorkspace', body: ['transactionType', 'jurisdiction', 'completionDate?'] }, aggCtx as any);
    expect(cmd.http.method).toBe('POST');
    expect(cmd.http.path).toBe('/workspaces');
    expect(cmd.http.statusCode).toBe(201);
    expect(cmd.auth.action).toBe('CREATE');
    expect(cmd.params.body).toHaveLength(3);
    expect(cmd.params.body[2].required).toBe(false); // completionDate?
    expect(cmd.params.path).toHaveLength(0);
  });

  it('UpdateWorkspaceStatus → PUT /workspaces/{workspaceId} 200', () => {
    const cmd = enrichCommand({ name: 'UpdateWorkspaceStatus', body: ['status'] }, aggCtx as any);
    expect(cmd.http.method).toBe('PUT');
    expect(cmd.http.path).toBe('/workspaces/{workspaceId}');
    expect(cmd.params.path).toHaveLength(1);
    expect(cmd.params.path[0].name).toBe('workspaceId');
  });

  it('explicit path override takes precedence over convention', () => {
    const cmd = enrichCommand(
      { name: 'GetWorkspacesBySubscriber', path: ['subscriberId'], returns: 'WorkspaceList' },
      aggCtx as any
    );
    expect(cmd.params.path[0].name).toBe('subscriberId');
    expect(cmd.http.path).toBe('/workspaces/{subscriberId}');
  });
});
