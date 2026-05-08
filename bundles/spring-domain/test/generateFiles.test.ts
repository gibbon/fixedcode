import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';

const rawSpec = {
  boundedContext: 'Workspace',
  service: { port: 8081, package: 'io.example.workspace' },
  aggregates: {
    Workspace: {
      attributes: { workspaceId: 'uuid', status: 'string' },
      commands: [
        { name: 'CreateWorkspace', body: ['status'] },
        { name: 'UpdateWorkspaceStatus', body: ['status'] },
      ],
      queries: [{ name: 'GetWorkspace', returns: 'Workspace' }],
      events: { WorkspaceCreated: { fields: ['workspaceId'] } },
      entities: {
        Party: {
          attributes: { partyId: 'uuid' },
          commands: [{ name: 'AddParty', body: ['partyType'] }],
        },
      },
    },
  },
};

describe('generateFiles', () => {
  it('produces correct file paths for all expansion types', () => {
    const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
    const files = generateFiles(ctx);
    const paths = files.map((f) => f.output);

    // Once per bounded context
    expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/shared/DomainEvent.kt');

    // Per aggregate
    expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/workspace/Workspace.kt');
    expect(paths).toContain(
      'src/main/kotlin/io/example/workspace/application/workspace/WorkspaceCommandService.kt',
    );
    expect(paths).toContain(
      'src/main/kotlin/io/example/workspace/api/workspace/WorkspaceApiDelegateImpl.kt',
    );

    // Per command
    expect(paths).toContain(
      'src/main/kotlin/io/example/workspace/domain/workspace/commands/CreateWorkspaceCommand.kt',
    );
    expect(paths).toContain(
      'src/main/kotlin/io/example/workspace/domain/workspace/commands/UpdateWorkspaceStatusCommand.kt',
    );

    // Per entity
    expect(paths).toContain(
      'src/main/kotlin/io/example/workspace/domain/workspace/entities/Party.kt',
    );

    // Per entity command
    expect(paths).toContain(
      'src/main/kotlin/io/example/workspace/domain/workspace/entities/commands/AddPartyCommand.kt',
    );

    // Tests
    expect(paths).toContain(
      'src/test/kotlin/io/example/workspace/domain/workspace/WorkspaceTest.kt',
    );
  });

  it('passes correct context to each file', () => {
    const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
    const files = generateFiles(ctx);
    const cmdFile = files.find((f) => f.output.includes('CreateWorkspaceCommand.kt'));
    expect(cmdFile?.ctx).toHaveProperty('cmd');
    expect((cmdFile?.ctx as any).cmd.name).toBe('CreateWorkspace');
  });

  it('every file entry includes packagePath in its context', () => {
    const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
    const files = generateFiles(ctx);
    for (const f of files) {
      expect(f.ctx).toHaveProperty('packagePath');
    }
  });
});
