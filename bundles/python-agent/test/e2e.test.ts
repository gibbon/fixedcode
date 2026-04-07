import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const singleYaml = readFileSync(join(__dirname, 'fixtures/single-agent.yaml'), 'utf-8');
const singleSpec = parseYaml(singleYaml);

const orchYaml = readFileSync(join(__dirname, 'fixtures/orchestrator.yaml'), 'utf-8');
const orchSpec = parseYaml(orchYaml);

describe('python-agent e2e (single mode)', () => {
  it('generates all expected files for a single agent', () => {
    const ctx = enrich(singleSpec.spec, { name: singleSpec.metadata.name, apiVersion: singleSpec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Infrastructure files
    expect(paths).toContain('pyproject.toml');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('src/ops_agent/settings.py');
    expect(paths).toContain('tests/conftest.py');

    // __init__.py files
    expect(paths).toContain('src/ops_agent/__init__.py');
    expect(paths).toContain('src/ops_agent/tools/__init__.py');
    expect(paths).toContain('src/ops_agent/defaults/__init__.py');
    expect(paths).toContain('src/ops_agent/middleware/__init__.py');

    // Provider-specific files
    expect(paths).toContain('src/ops_agent/app.py');
    expect(paths).toContain('src/ops_agent/shared.py');

    // Per-tool files
    expect(paths).toContain('src/ops_agent/tools/query_database_tools.py');
    expect(paths).toContain('src/ops_agent/tools/call_api_tools.py');
    expect(paths).toContain('src/ops_agent/tools/run_script_tools.py');

    // Per-middleware files
    expect(paths).toContain('src/ops_agent/middleware/correlation_id.py');
    expect(paths).toContain('src/ops_agent/middleware/auth.py');
    expect(paths).toContain('src/ops_agent/middleware/feature_toggles.py');

    // Extension point
    expect(paths).toContain('src/ops_agent/defaults/default_agent.py');
    const extPoint = files.find(f => f.output === 'src/ops_agent/defaults/default_agent.py');
    expect(extPoint?.overwrite).toBe(false);
  });

  it('uses provider-specific template for app.py', () => {
    const ctx = enrich(singleSpec.spec, { name: singleSpec.metadata.name, apiVersion: singleSpec.apiVersion });
    const files = generateFiles(ctx);
    const appFile = files.find(f => f.output === 'src/ops_agent/app.py');
    expect(appFile?.template).toBe('providers/strands/app.py.hbs');
  });

  it('uses tool-type-specific templates for tool files', () => {
    const ctx = enrich(singleSpec.spec, { name: singleSpec.metadata.name, apiVersion: singleSpec.apiVersion });
    const files = generateFiles(ctx);

    const dbTool = files.find(f => f.output === 'src/ops_agent/tools/query_database_tools.py');
    expect(dbTool?.template).toBe('tools/database.py.hbs');

    const httpTool = files.find(f => f.output === 'src/ops_agent/tools/call_api_tools.py');
    expect(httpTool?.template).toBe('tools/http.py.hbs');

    const cliTool = files.find(f => f.output === 'src/ops_agent/tools/run_script_tools.py');
    expect(cliTool?.template).toBe('tools/cli.py.hbs');
  });

  it('uses middleware-type-specific templates', () => {
    const ctx = enrich(singleSpec.spec, { name: singleSpec.metadata.name, apiVersion: singleSpec.apiVersion });
    const files = generateFiles(ctx);

    const corrId = files.find(f => f.output === 'src/ops_agent/middleware/correlation_id.py');
    expect(corrId?.template).toBe('middleware/correlation_id.py.hbs');

    const auth = files.find(f => f.output === 'src/ops_agent/middleware/auth.py');
    expect(auth?.template).toBe('middleware/auth.py.hbs');

    const toggles = files.find(f => f.output === 'src/ops_agent/middleware/feature_toggles.py');
    expect(toggles?.template).toBe('middleware/feature_toggles.py.hbs');
  });

  it('does not generate orchestrator files in single mode', () => {
    const ctx = enrich(singleSpec.spec, { name: singleSpec.metadata.name, apiVersion: singleSpec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    expect(paths).not.toContain('src/ops_agent/main.py');
    expect(paths.filter(p => p.includes('orchestrator/'))).toHaveLength(0);
    expect(paths.filter(p => p.includes('agents/'))).toHaveLength(0);
  });

  it('omits middleware __init__.py when no middleware', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'strands',
        prompt: 'Agent',
        tools: [{ name: 'search', type: 'http' }],
      },
      { name: 'no-mw-agent', apiVersion: '1.0' }
    );
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);
    expect(paths).not.toContain('src/no_mw_agent/middleware/__init__.py');
  });
});

describe('python-agent e2e (orchestrator mode)', () => {
  it('generates orchestrator module files', () => {
    const ctx = enrich(orchSpec.spec, { name: orchSpec.metadata.name, apiVersion: orchSpec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Main app
    expect(paths).toContain('src/ops_orchestrator/main.py');

    // Orchestrator module
    expect(paths).toContain('src/ops_orchestrator/orchestrator/__init__.py');
    expect(paths).toContain('src/ops_orchestrator/orchestrator/app.py');
    expect(paths).toContain('src/ops_orchestrator/orchestrator/service.py');
    expect(paths).toContain('src/ops_orchestrator/orchestrator/routing.py');
    expect(paths).toContain('src/ops_orchestrator/orchestrator/schemas.py');
    expect(paths).toContain('src/ops_orchestrator/orchestrator/context.py');
    expect(paths).toContain('src/ops_orchestrator/orchestrator/discovery.py');

    // Per-agent files (3 agents: planner, enricher, executor)
    expect(paths).toContain('src/ops_orchestrator/agents/__init__.py');
    expect(paths).toContain('src/ops_orchestrator/agents/planner/__init__.py');
    expect(paths).toContain('src/ops_orchestrator/agents/planner/agent.py');
    expect(paths).toContain('src/ops_orchestrator/agents/planner/default_planner.py');
    expect(paths).toContain('src/ops_orchestrator/agents/enricher/__init__.py');
    expect(paths).toContain('src/ops_orchestrator/agents/enricher/agent.py');
    expect(paths).toContain('src/ops_orchestrator/agents/enricher/default_enricher.py');
    expect(paths).toContain('src/ops_orchestrator/agents/executor/__init__.py');
    expect(paths).toContain('src/ops_orchestrator/agents/executor/agent.py');
    expect(paths).toContain('src/ops_orchestrator/agents/executor/default_executor.py');

    // Extension points for orchestrator agents
    const orchExtPoints = files.filter(f => f.overwrite === false && f.output.includes('agents/'));
    expect(orchExtPoints).toHaveLength(3);
  });

  it('uses provider-agnostic orchestrator templates', () => {
    const ctx = enrich(orchSpec.spec, { name: orchSpec.metadata.name, apiVersion: orchSpec.apiVersion });
    const files = generateFiles(ctx);

    const mainFile = files.find(f => f.output === 'src/ops_orchestrator/main.py');
    expect(mainFile?.template).toBe('orchestrator/main.py.hbs');

    const appFile = files.find(f => f.output === 'src/ops_orchestrator/orchestrator/app.py');
    expect(appFile?.template).toBe('orchestrator/app.py.hbs');

    const routingFile = files.find(f => f.output === 'src/ops_orchestrator/orchestrator/routing.py');
    expect(routingFile?.template).toBe('orchestrator/routing.py.hbs');
  });

  it('marks non-critical agents in context', () => {
    const ctx = enrich(orchSpec.spec, { name: orchSpec.metadata.name, apiVersion: orchSpec.apiVersion });
    const enricher = ctx.agents?.find(a => a.name.kebab === 'enricher');
    expect(enricher?.critical).toBe(false);

    const planner = ctx.agents?.find(a => a.name.kebab === 'planner');
    expect(planner?.critical).toBe(true);
  });

  it('still generates common files alongside orchestrator files', () => {
    const ctx = enrich(orchSpec.spec, { name: orchSpec.metadata.name, apiVersion: orchSpec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    expect(paths).toContain('pyproject.toml');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('src/ops_orchestrator/app.py');
    expect(paths).toContain('src/ops_orchestrator/shared.py');
    expect(paths).toContain('src/ops_orchestrator/settings.py');
    expect(paths).toContain('src/ops_orchestrator/defaults/default_agent.py');
  });
});
