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

describe('ts-agent e2e (single mode)', () => {
  it('generates all expected files for a single agent', () => {
    const ctx = enrich(singleSpec.spec, {
      name: singleSpec.metadata.name,
      apiVersion: singleSpec.apiVersion,
    });
    const files = generateFiles(ctx);
    const paths = files.map((f) => f.output);

    expect(paths).toContain('agent.yaml');
    expect(paths).toContain('src/agent.ts');
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/server.ts');
    expect(paths).toContain('src/config.ts');
    expect(paths).toContain('src/logger.ts');

    expect(paths).toContain('src/tools/read-file.ts');
    expect(paths).toContain('src/tools/write-file.ts');
    expect(paths).toContain('src/tools/web-search.ts');

    expect(paths).toContain('tests/tools/read-file.test.ts');
    expect(paths).toContain('tests/tools/write-file.test.ts');
    expect(paths).toContain('tests/tools/web-search.test.ts');

    expect(paths).toContain('src/defaults/custom-agent.ts');
    const extPoint = files.find((f) => f.output === 'src/defaults/custom-agent.ts');
    expect(extPoint?.overwrite).toBe(false);
  });

  it('uses provider-specific template for agent.ts', () => {
    const ctx = enrich(singleSpec.spec, {
      name: singleSpec.metadata.name,
      apiVersion: singleSpec.apiVersion,
    });
    const files = generateFiles(ctx);
    const agentFile = files.find((f) => f.output === 'src/agent.ts');
    expect(agentFile?.template).toBe('providers/vercel-ai/agent.ts.hbs');
  });

  it('uses tool-type-specific templates for tool files', () => {
    const ctx = enrich(singleSpec.spec, {
      name: singleSpec.metadata.name,
      apiVersion: singleSpec.apiVersion,
    });
    const files = generateFiles(ctx);

    const readFile = files.find((f) => f.output === 'src/tools/read-file.ts');
    expect(readFile?.template).toBe('tools/cli.ts.hbs');

    const writeFile = files.find((f) => f.output === 'src/tools/write-file.ts');
    expect(writeFile?.template).toBe('tools/function.ts.hbs');

    const webSearch = files.find((f) => f.output === 'src/tools/web-search.ts');
    expect(webSearch?.template).toBe('tools/http.ts.hbs');
  });
});

describe('ts-agent e2e (orchestrator mode)', () => {
  it('generates orchestrator + per-agent files', () => {
    const ctx = enrich(orchSpec.spec, {
      name: orchSpec.metadata.name,
      apiVersion: orchSpec.apiVersion,
    });
    const files = generateFiles(ctx);
    const paths = files.map((f) => f.output);

    expect(paths).toContain('src/orchestrator.ts');

    expect(paths).toContain('src/agents/planner/agent.ts');
    expect(paths).toContain('src/agents/planner/default-planner.ts');
    expect(paths).toContain('src/agents/coder/agent.ts');
    expect(paths).toContain('src/agents/coder/default-coder.ts');
    expect(paths).toContain('src/agents/reviewer/agent.ts');
    expect(paths).toContain('src/agents/reviewer/default-reviewer.ts');

    const orchExtPoints = files.filter(
      (f) => f.overwrite === false && f.output.includes('agents/'),
    );
    expect(orchExtPoints).toHaveLength(3);
  });

  it('marks non-critical agents in context', () => {
    const ctx = enrich(orchSpec.spec, {
      name: orchSpec.metadata.name,
      apiVersion: orchSpec.apiVersion,
    });
    const reviewer = ctx.agents?.find((a) => a.name.kebab === 'reviewer');
    expect(reviewer?.critical).toBe(false);

    const planner = ctx.agents?.find((a) => a.name.kebab === 'planner');
    expect(planner?.critical).toBe(true);
  });
});
