import { describe, it, expect } from 'vitest';
import { enrich } from '../src/index.js';

describe('python-agent enrich', () => {
  it('enriches a single agent spec', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'strands',
        streaming: true,
        prompt: 'You are an operations assistant...',
        middleware: [
          'correlation-id',
          { auth: { provider: 'auth0', permission: 'admin:query' } },
        ],
        tools: [
          { name: 'query-database', type: 'database', config: { readOnly: true, databases: ['ops-db'] } },
          { name: 'call-api', type: 'http', config: { baseUrl: 'https://api.internal' } },
        ],
        session: { dev: 'file', prod: { provider: 's3', bucket: '${ENV}-sessions' } },
      },
      { name: 'ops-agent', apiVersion: '1.0' }
    );

    expect(ctx.mode).toBe('single');
    expect(ctx.provider).toBe('strands');
    expect(ctx.packageName).toBe('ops_agent');
    expect(ctx.serviceName.pascal).toBe('OpsAgent');
    expect(ctx.serviceName.kebab).toBe('ops-agent');
    expect(ctx.providerImport).toContain('strands');
    expect(ctx.providerToolDecorator).toBe('@tool');
    expect(ctx.tools).toHaveLength(2);
    expect(ctx.tools[0].name.snake).toBe('query_database');
    expect(ctx.tools[1].name.snake).toBe('call_api');
    expect(ctx.middleware).toHaveLength(2);
    expect(ctx.hasAuth).toBe(true);
    expect(ctx.hasCorrelationId).toBe(true);
    expect(ctx.prompt).toBe('You are an operations assistant...');
    expect(ctx.streaming).toBe(true);
    expect(ctx.session.hasSession).toBe(true);
    expect(ctx.session.sessionDevFile).toBe(true);
    expect(ctx.session.sessionProdS3).toBe(true);
    expect(ctx.session.prodBucket).toBe('${ENV}-sessions');
  });

  it('applies defaults', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'strands',
        prompt: 'You are an agent',
        tools: [{ name: 'search', type: 'http' }],
      },
      { name: 'basic-agent', apiVersion: '1.0' }
    );
    expect(ctx.port).toBe(8000);
    expect(ctx.streaming).toBe(true);
    expect(ctx.middleware).toHaveLength(0);
    expect(ctx.hasAuth).toBe(false);
    expect(ctx.hasCorrelationId).toBe(false);
    expect(ctx.hasFeatureToggles).toBe(false);
    expect(ctx.session.hasSession).toBe(false);
  });

  it('enriches tool template paths by type', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'strands',
        prompt: 'Agent',
        tools: [
          { name: 'db', type: 'database' },
          { name: 'api', type: 'http' },
          { name: 'cmd', type: 'cli' },
          { name: 'ext', type: 'mcp' },
        ],
      },
      { name: 'tool-agent', apiVersion: '1.0' }
    );
    expect(ctx.tools[0].templatePath).toBe('tools/database.py.hbs');
    expect(ctx.tools[1].templatePath).toBe('tools/http.py.hbs');
    expect(ctx.tools[2].templatePath).toBe('tools/cli.py.hbs');
    expect(ctx.tools[3].templatePath).toBe('tools/mcp.py.hbs');
  });

  it('enriches orchestrator agents', () => {
    const ctx = enrich(
      {
        mode: 'orchestrator',
        provider: 'strands',
        agents: [
          { name: 'planner', prompt: 'Plan things', tools: ['search'], critical: true },
          { name: 'enricher', prompt: 'Enrich data', critical: false },
          { name: 'executor', prompt: 'Execute plan' },
        ],
        tools: [{ name: 'search', type: 'http' }],
        routing: 'sequential',
      },
      { name: 'orch', apiVersion: '1.0' }
    );
    expect(ctx.agents).toHaveLength(3);
    expect(ctx.agents![0].name.pascal).toBe('Planner');
    expect(ctx.agents![0].critical).toBe(true);
    expect(ctx.agents![1].name.pascal).toBe('Enricher');
    expect(ctx.agents![1].critical).toBe(false);
    expect(ctx.agents![2].name.pascal).toBe('Executor');
    expect(ctx.agents![2].critical).toBe(true); // default
    expect(ctx.routing).toBe('sequential');
  });

  it('enriches middleware with correct types', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'strands',
        prompt: 'Agent',
        tools: [{ name: 'search', type: 'http' }],
        middleware: [
          'correlation-id',
          { auth: { provider: 'auth0', permission: 'admin:query' } },
          { 'feature-toggles': { toggleName: 'myToggle' } },
        ],
      },
      { name: 'mw-agent', apiVersion: '1.0' }
    );
    expect(ctx.middleware).toHaveLength(3);
    expect(ctx.middleware[0].type).toBe('correlation-id');
    expect(ctx.middleware[0].templatePath).toBe('middleware/correlation_id.py.hbs');
    expect(ctx.middleware[1].type).toBe('auth');
    expect(ctx.middleware[1].hasAuth).toBe(true);
    expect(ctx.middleware[1].config.permission).toBe('admin:query');
    expect(ctx.middleware[2].type).toBe('feature-toggles');
    expect(ctx.middleware[2].templatePath).toBe('middleware/feature_toggles.py.hbs');
    expect(ctx.hasAuth).toBe(true);
    expect(ctx.hasCorrelationId).toBe(true);
    expect(ctx.hasFeatureToggles).toBe(true);
  });

  it('supports all providers', () => {
    for (const provider of ['strands', 'claude-agent-sdk', 'openai', 'ollama']) {
      const ctx = enrich(
        {
          mode: 'single',
          provider,
          prompt: 'Agent',
          tools: [{ name: 'search', type: 'http' }],
        },
        { name: `${provider}-agent`, apiVersion: '1.0' }
      );
      expect(ctx.provider).toBe(provider);
      expect(ctx.providerImport).toBeTruthy();
      expect(ctx.providerDependency).toBeTruthy();
    }
  });

  it('throws on unknown provider', () => {
    expect(() => enrich(
      {
        mode: 'single',
        provider: 'unknown-provider',
        prompt: 'Agent',
        tools: [{ name: 'search', type: 'http' }],
      },
      { name: 'bad-agent', apiVersion: '1.0' }
    )).toThrow('Unknown provider: unknown-provider');
  });
});
