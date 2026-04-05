import { describe, it, expect } from 'vitest';
import { generateVariants } from '../../src/enrich/naming.js';

describe('generateVariants', () => {
  it('generates all case variants for a simple word', () => {
    const v = generateVariants('Workspace');
    expect(v.pascal).toBe('Workspace');
    expect(v.camel).toBe('workspace');
    expect(v.snake).toBe('workspace');
    expect(v.kebab).toBe('workspace');
    expect(v.plural).toBe('workspaces');
    expect(v.pluralKebab).toBe('workspaces');
    expect(v.pluralPascal).toBe('Workspaces');
  });

  it('handles multi-word PascalCase input', () => {
    const v = generateVariants('WorkspaceReference');
    expect(v.pascal).toBe('WorkspaceReference');
    expect(v.camel).toBe('workspaceReference');
    expect(v.kebab).toBe('workspace-reference');
    expect(v.snake).toBe('workspace_reference');
  });

  it('handles irregular plurals', () => {
    const v = generateVariants('Party');
    expect(v.plural).toBe('parties');
    expect(v.pluralKebab).toBe('parties');
  });

  it('accepts a plural override', () => {
    const v = generateVariants('Person', 'people');
    expect(v.plural).toBe('people');
    expect(v.pluralKebab).toBe('people');
    expect(v.pluralPascal).toBe('People');
  });

  it('handles command-style input (verb + noun)', () => {
    const v = generateVariants('CreateWorkspace');
    expect(v.pascal).toBe('CreateWorkspace');
    expect(v.camel).toBe('createWorkspace');
    expect(v.kebab).toBe('create-workspace');
  });
});
