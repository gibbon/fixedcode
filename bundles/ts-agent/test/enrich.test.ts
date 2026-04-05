import { describe, it, expect } from 'vitest';
import { enrich } from '../src/index.js';

describe('ts-agent enrich', () => {
  it('enriches a single agent spec', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'vercel-ai',
        model: { tier: 'balanced' },
        prompt: 'You are a coding agent...',
        tools: [
          { name: 'read-file', type: 'cli', config: { command: 'cat' } },
          { name: 'write-file', type: 'function', config: { handler: 'write-file' } },
        ],
        server: { port: 3100 },
      },
      { name: 'coder-agent', apiVersion: '1.0' }
    );

    expect(ctx.mode).toBe('single');
    expect(ctx.provider).toBe('vercel-ai');
    expect(ctx.packageName).toBe('coder-agent');
    expect(ctx.moduleName).toBe('coderAgent');
    expect(ctx.providerImport).toContain('generateText');
    expect(ctx.tools).toHaveLength(2);
    expect(ctx.tools[0].name.pascal).toBe('ReadFile');
    expect(ctx.tools[1].name.pascal).toBe('WriteFile');
    expect(ctx.prompt).toBe('You are a coding agent...');
    expect(ctx.serverPort).toBe(3100);
  });

  it('applies defaults', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'vercel-ai',
        prompt: 'You are an agent',
        tools: [{ name: 'search', type: 'http' }],
      },
      { name: 'basic-agent', apiVersion: '1.0' }
    );
    expect(ctx.serverPort).toBe(3100);
    expect(ctx.modelTier).toBe('balanced');
    expect(ctx.streaming).toBe(true);
  });

  it('enriches orchestrator agents', () => {
    const ctx = enrich(
      {
        mode: 'orchestrator',
        provider: 'vercel-ai',
        agents: [
          { name: 'planner', prompt: 'Plan things', tools: ['search'], critical: true },
          { name: 'reviewer', prompt: 'Review things', critical: false },
        ],
        tools: [{ name: 'search', type: 'http' }],
        routing: 'sequential',
      },
      { name: 'orch', apiVersion: '1.0' }
    );
    expect(ctx.agents).toHaveLength(2);
    expect(ctx.agents![0].name.pascal).toBe('Planner');
    expect(ctx.agents![0].critical).toBe(true);
    expect(ctx.agents![1].name.pascal).toBe('Reviewer');
    expect(ctx.agents![1].critical).toBe(false);
    expect(ctx.routing).toBe('sequential');
  });
});
