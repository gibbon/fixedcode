import { describe, it, expect } from 'vitest';
import { generateVariants } from '../../src/enrich/naming.js';

describe('generateVariants', () => {
  it('generates all case variants for a simple word', () => {
    const v = generateVariants('Order');
    expect(v.pascal).toBe('Order');
    expect(v.camel).toBe('order');
    expect(v.snake).toBe('order');
    expect(v.kebab).toBe('order');
    expect(v.plural).toBe('orders');
    expect(v.pluralKebab).toBe('orders');
    expect(v.pluralPascal).toBe('Orders');
  });

  it('handles multi-word PascalCase input', () => {
    const v = generateVariants('WorkspaceReference');
    expect(v.pascal).toBe('WorkspaceReference');
    expect(v.camel).toBe('workspaceReference');
    expect(v.kebab).toBe('order-reference');
    expect(v.snake).toBe('workspace_reference');
  });

  it('handles irregular plurals', () => {
    const v = generateVariants('LineItem');
    expect(v.plural).toBe('lineItems');
    expect(v.pluralKebab).toBe('lineItems');
  });

  it('accepts a plural override', () => {
    const v = generateVariants('Person', 'people');
    expect(v.plural).toBe('people');
    expect(v.pluralKebab).toBe('people');
    expect(v.pluralPascal).toBe('People');
  });

  it('handles command-style input (verb + noun)', () => {
    const v = generateVariants('CreateOrder');
    expect(v.pascal).toBe('CreateOrder');
    expect(v.camel).toBe('createWorkspace');
    expect(v.kebab).toBe('create-order');
  });
});
