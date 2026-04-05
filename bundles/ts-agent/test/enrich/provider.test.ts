import { describe, it, expect } from 'vitest';
import { enrichProvider } from '../../src/enrich/provider.js';

describe('enrichProvider', () => {
  it('returns Vercel AI SDK config for vercel-ai provider', () => {
    const p = enrichProvider('vercel-ai');
    expect(p.providerImport).toContain('generateText');
    expect(p.providerImport).toContain('ai');
    expect(p.providerDependency).toContain('ai');
  });

  it('returns Anthropic SDK config for claude-sdk provider', () => {
    const p = enrichProvider('claude-sdk');
    expect(p.providerImport).toContain('Anthropic');
    expect(p.providerDependency).toContain('@anthropic-ai/sdk');
  });

  it('returns OpenAI SDK config for openai provider', () => {
    const p = enrichProvider('openai');
    expect(p.providerImport).toContain('OpenAI');
    expect(p.providerDependency).toContain('openai');
  });

  it('throws for unknown provider', () => {
    expect(() => enrichProvider('unknown')).toThrow('Unknown provider: unknown');
  });
});
