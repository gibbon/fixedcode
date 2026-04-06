import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildDraftPrompt, extractYaml, draft } from '../src/engine/draft.js';

describe('extractYaml', () => {
  it('returns plain YAML as-is', () => {
    const yaml = 'apiVersion: "1.0"\nkind: test\n';
    expect(extractYaml(yaml)).toBe(yaml);
  });

  it('strips markdown yaml fences', () => {
    const input = '```yaml\napiVersion: "1.0"\nkind: test\n```';
    expect(extractYaml(input)).toBe('apiVersion: "1.0"\nkind: test');
  });

  it('strips markdown plain fences', () => {
    const input = '```\napiVersion: "1.0"\nkind: test\n```';
    expect(extractYaml(input)).toBe('apiVersion: "1.0"\nkind: test');
  });

  it('handles fences with leading/trailing whitespace', () => {
    const input = '\n```yaml\napiVersion: "1.0"\n```\n\n';
    expect(extractYaml(input).trim()).toBe('apiVersion: "1.0"');
  });
});

describe('buildDraftPrompt', () => {
  it('includes schema in system prompt', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: { type: 'object', properties: { name: { type: 'string' } } },
    });
    expect(result.system).toContain('test-bundle');
    expect(result.system).toContain('"type": "object"');
    expect(result.user).toBe('a test service');
  });

  it('includes conventions when provided', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: {},
      conventions: 'Use ? suffix for optional fields',
    });
    expect(result.system).toContain('? suffix for optional fields');
  });

  it('includes example when provided', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: {},
      example: 'apiVersion: "1.0"\nkind: test-bundle\nmetadata:\n  name: demo\nspec:\n  name: demo',
    });
    expect(result.system).toContain('demo');
  });

  it('omits conventions section when not provided', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: {},
    });
    expect(result.system).not.toContain('## Conventions');
  });
});
