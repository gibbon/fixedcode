import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';
import { enrichTool, type EnrichedTool } from './enrich/tool.js';
import { enrichProvider, type ProviderConfig } from './enrich/provider.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface EnrichedAgent {
  name: NamingVariants;
  prompt: string;
  toolRefs: string[];
  critical: boolean;
}

export interface TsAgentContext extends Context {
  packageName: string;
  moduleName: string;
  serviceName: NamingVariants;
  mode: 'single' | 'orchestrator';
  provider: string;
  streaming: boolean;
  modelTier: string;
  providerImport: string;
  providerDependency: string;
  providerClientInit: string;
  tools: EnrichedTool[];
  prompt?: string;
  agents?: EnrichedAgent[];
  routing?: string;
  serverPort: number;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): TsAgentContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(metadata.name);
  const providerConfig = enrichProvider(spec.provider);
  const tools = (spec.tools ?? []).map(t => enrichTool(t));

  const agents = spec.agents?.map(a => ({
    name: generateVariants(a.name),
    prompt: a.prompt,
    toolRefs: a.tools ?? [],
    critical: a.critical ?? true,
  }));

  return {
    packageName: serviceName.kebab,
    moduleName: serviceName.camel,
    serviceName,
    mode: spec.mode,
    provider: spec.provider,
    streaming: spec.streaming ?? true,
    modelTier: spec.model?.tier ?? 'balanced',
    ...providerConfig,
    tools,
    prompt: spec.prompt,
    agents,
    routing: spec.routing,
    serverPort: spec.server?.port ?? 3100,
  };
}

export function generateFiles(ctx: TsAgentContext): FileEntry[] {
  const files: FileEntry[] = [];
  const baseCtx = ctx as unknown as Record<string, unknown>;

  // Common files
  files.push({ template: 'agent.yaml.hbs', output: 'agent.yaml', ctx: baseCtx });
  files.push({ template: 'src/index.ts.hbs', output: 'src/index.ts', ctx: baseCtx });
  files.push({ template: 'src/server.ts.hbs', output: 'src/server.ts', ctx: baseCtx });
  files.push({ template: 'src/config.ts.hbs', output: 'src/config.ts', ctx: baseCtx });
  files.push({ template: 'src/logger.ts.hbs', output: 'src/logger.ts', ctx: baseCtx });

  // Provider-specific agent loop
  files.push({
    template: `providers/${ctx.provider}/agent.ts.hbs`,
    output: 'src/agent.ts',
    ctx: baseCtx,
  });

  // Per-tool files
  for (const tool of ctx.tools) {
    const toolCtx = { ...baseCtx, tool } as Record<string, unknown>;
    files.push({
      template: tool.templatePath,
      output: `src/tools/${tool.name.kebab}.ts`,
      ctx: toolCtx,
    });
    files.push({
      template: 'tests/tool.test.ts.hbs',
      output: `tests/tools/${tool.name.kebab}.test.ts`,
      ctx: toolCtx,
    });
  }

  // Extension point
  files.push({
    template: 'defaults/custom-agent.ts.hbs',
    output: 'src/defaults/custom-agent.ts',
    ctx: baseCtx,
    overwrite: false,
  });

  // Orchestrator mode
  if (ctx.mode === 'orchestrator' && ctx.agents) {
    files.push({
      template: `providers/${ctx.provider}/orchestrator.ts.hbs`,
      output: 'src/orchestrator.ts',
      ctx: baseCtx,
    });

    for (const agent of ctx.agents) {
      const agentCtx = { ...baseCtx, agent } as Record<string, unknown>;
      files.push({
        template: 'agents/agent.ts.hbs',
        output: `src/agents/${agent.name.kebab}/agent.ts`,
        ctx: agentCtx,
      });
      files.push({
        template: 'agents/default-agent.ts.hbs',
        output: `src/agents/${agent.name.kebab}/default-${agent.name.kebab}.ts`,
        ctx: agentCtx,
        overwrite: false,
      });
    }
  }

  return files;
}

export const bundle: Bundle = {
  kind: 'ts-agent',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  cfrs: {
    provides: ['tracing', 'metrics', 'unit-tests', 'health-check'],
    files: {
      'health-check': ['src/server.ts'],
      'unit-tests': ['tests/**/*.test.ts'],
    },
  },
};
export default bundle;
