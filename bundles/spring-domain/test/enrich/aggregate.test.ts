import { describe, it, expect } from 'vitest';
import { enrichAggregate } from '../../src/enrich/aggregate.js';

describe('enrichAggregate', () => {
  it('enriches a simple aggregate', () => {
    const agg = enrichAggregate('Workspace', {
      attributes: { workspaceId: 'uuid', status: 'string' },
      commands: [{ name: 'CreateWorkspace', body: ['status'] }],
      queries: [{ name: 'GetWorkspace', returns: 'Workspace' }],
      events: { WorkspaceCreated: { fields: ['workspaceId'] } },
    });

    expect(agg.identityField).toBe('workspaceId');
    expect(agg.names.pascal).toBe('Workspace');
    expect(agg.names.pluralKebab).toBe('workspaces');
    expect(agg.commands[0].http.method).toBe('POST');
    expect(agg.queries[0].http.method).toBe('GET');
    expect(agg.events[0].name).toBe('WorkspaceCreated');
  });

  it('enriches nested entities', () => {
    const agg = enrichAggregate('Workspace', {
      attributes: { workspaceId: 'uuid' },
      entities: {
        Party: {
          attributes: { partyId: 'uuid', workspaceId: 'uuid' },
          commands: [{ name: 'AddParty', body: ['partyType'] }],
        },
      },
    });

    expect(agg.entities).toHaveLength(1);
    expect(agg.entities[0].name).toBe('Party');
    expect(agg.entities[0].parentIdentityField).toBe('workspaceId');
    expect(agg.entities[0].commands[0].http.method).toBe('POST');
  });
});
