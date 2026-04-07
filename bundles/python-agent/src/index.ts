import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec, parseMiddleware, type OutputSchemaField } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';
import { enrichTool, type EnrichedTool } from './enrich/tool.js';
import { enrichProvider, type ProviderConfig } from './enrich/provider.js';
import { enrichMiddleware, type EnrichedMiddleware } from './enrich/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface EnrichedAgent {
  name: NamingVariants;
  prompt: string;
  toolRefs: string[];
  critical: boolean;
}

export interface SessionConfig {
  hasSession: boolean;
  sessionDevFile: boolean;
  sessionProdS3: boolean;
  prodBucket: string;
}

export interface PythonAgentContext extends Context {
  packageName: string;
  serviceName: NamingVariants;
  mode: 'single' | 'orchestrator';
  provider: string;
  streaming: boolean;
  providerImport: string;
  providerDependency: string;
  providerClientInit: string;
  providerToolDecorator: string;
  tools: EnrichedTool[];
  middleware: EnrichedMiddleware[];
  hasAuth: boolean;
  hasCorrelationId: boolean;
  hasFeatureToggles: boolean;
  prompt?: string;
  agents?: EnrichedAgent[];
  routing?: string;
  outputSchema?: OutputSchemaField[];
  hasOutputSchema: boolean;
  port: number;
  session: SessionConfig;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): PythonAgentContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(metadata.name);
  const providerConfig = enrichProvider(spec.provider);
  const tools = (spec.tools ?? []).map(t => enrichTool(t));
  const rawMiddleware = parseMiddleware(spec.middleware);
  const middleware = rawMiddleware.map(m => enrichMiddleware(m));

  const agents = spec.agents?.map(a => ({
    name: generateVariants(a.name),
    prompt: a.prompt,
    toolRefs: a.tools ?? [],
    critical: a.critical ?? true,
  }));

  const hasSession = !!spec.session;
  const sessionDevFile = spec.session?.dev === 'file' || (hasSession && !spec.session?.dev);
  const sessionProdS3 = spec.session?.prod?.provider === 's3';
  const prodBucket = (spec.session?.prod?.bucket as string) ?? '';

  return {
    packageName: serviceName.snake,
    serviceName,
    mode: spec.mode,
    provider: spec.provider,
    streaming: spec.streaming ?? true,
    ...providerConfig,
    tools,
    middleware,
    hasAuth: middleware.some(m => m.type === 'auth'),
    hasCorrelationId: middleware.some(m => m.type === 'correlation-id'),
    hasFeatureToggles: middleware.some(m => m.type === 'feature-toggles'),
    prompt: spec.prompt,
    agents,
    routing: spec.routing,
    outputSchema: spec.outputSchema,
    hasOutputSchema: !!spec.outputSchema && spec.outputSchema.length > 0,
    port: 8000,
    session: {
      hasSession,
      sessionDevFile,
      sessionProdS3,
      prodBucket,
    },
  };
}

export function generateFiles(ctx: PythonAgentContext): FileEntry[] {
  const files: FileEntry[] = [];
  const baseCtx = ctx as unknown as Record<string, unknown>;
  const pkg = ctx.packageName;

  // Common infrastructure files
  files.push({ template: 'pyproject.toml.hbs', output: 'pyproject.toml', ctx: baseCtx });
  files.push({ template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: baseCtx });
  files.push({ template: 'README.md.hbs', output: 'README.md', ctx: baseCtx });
  files.push({ template: 'settings.py.hbs', output: `src/${pkg}/settings.py`, ctx: baseCtx });
  files.push({ template: 'tests/conftest.py.hbs', output: 'tests/conftest.py', ctx: baseCtx });

  // __init__.py files for Python packages
  files.push({ template: '__init__.py.hbs', output: `src/${pkg}/__init__.py`, ctx: baseCtx });
  files.push({ template: '__init__.py.hbs', output: `src/${pkg}/tools/__init__.py`, ctx: baseCtx });
  files.push({ template: '__init__.py.hbs', output: `src/${pkg}/defaults/__init__.py`, ctx: baseCtx });

  if (ctx.middleware.length > 0) {
    files.push({ template: '__init__.py.hbs', output: `src/${pkg}/middleware/__init__.py`, ctx: baseCtx });
  }

  // Provider-specific app.py (FastAPI endpoints + agent wiring)
  files.push({
    template: `providers/${ctx.provider}/app.py.hbs`,
    output: `src/${pkg}/app.py`,
    ctx: baseCtx,
  });

  // Provider-specific shared.py (agent factory + query loop)
  files.push({
    template: `providers/${ctx.provider}/shared.py.hbs`,
    output: `src/${pkg}/shared.py`,
    ctx: baseCtx,
  });

  // Per-tool files
  for (const tool of ctx.tools) {
    const toolCtx = { ...baseCtx, tool } as Record<string, unknown>;
    files.push({
      template: tool.templatePath,
      output: `src/${pkg}/tools/${tool.name.snake}_tools.py`,
      ctx: toolCtx,
    });
  }

  // Per-middleware files
  for (const mw of ctx.middleware) {
    const mwCtx = { ...baseCtx, middleware: mw } as Record<string, unknown>;
    files.push({
      template: mw.templatePath,
      output: `src/${pkg}/middleware/${mw.name.snake}.py`,
      ctx: mwCtx,
    });
  }

  // Extension point: default agent customization
  files.push({
    template: 'defaults/default_agent.py.hbs',
    output: `src/${pkg}/defaults/default_agent.py`,
    ctx: baseCtx,
    overwrite: false,
  });

  // Orchestrator mode
  if (ctx.mode === 'orchestrator' && ctx.agents) {
    files.push({
      template: `providers/${ctx.provider}/orchestrator.py.hbs`,
      output: `src/${pkg}/orchestrator.py`,
      ctx: baseCtx,
    });

    files.push({ template: '__init__.py.hbs', output: `src/${pkg}/agents/__init__.py`, ctx: baseCtx });

    for (const agent of ctx.agents) {
      const agentCtx = { ...baseCtx, agent } as Record<string, unknown>;
      files.push({
        template: 'agents/agent.py.hbs',
        output: `src/${pkg}/agents/${agent.name.snake}/agent.py`,
        ctx: agentCtx,
      });
      files.push({ template: '__init__.py.hbs', output: `src/${pkg}/agents/${agent.name.snake}/__init__.py`, ctx: agentCtx });
      files.push({
        template: 'agents/default_agent.py.hbs',
        output: `src/${pkg}/agents/${agent.name.snake}/default_${agent.name.snake}.py`,
        ctx: agentCtx,
        overwrite: false,
      });
    }
  }

  return files;
}

export const bundle: Bundle = {
  kind: 'python-agent',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  helpers: {
    eq: (a: unknown, b: unknown) => a === b,
    neq: (a: unknown, b: unknown) => a !== b,
    or: (a: unknown, b: unknown) => a || b,
    and: (a: unknown, b: unknown) => a && b,
  },
  cfrs: {
    provides: ['tracing', 'metrics', 'unit-tests', 'health-check'],
    files: {
      'health-check': ['src/*/app.py'],
      'unit-tests': ['tests/**/*.py'],
      'tracing': ['src/*/middleware/correlation_id.py'],
    },
  },
};
export default bundle;
