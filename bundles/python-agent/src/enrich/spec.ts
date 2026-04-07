export interface RawMiddlewareEntry {
  type: string;
  config: Record<string, unknown>;
}

export interface OutputSchemaField {
  name: string;
  type: 'string' | 'int' | 'bool' | 'list';
  description?: string;
  required?: boolean;
}

export interface RawPythonAgentSpec {
  mode: 'single' | 'orchestrator';
  provider: string;
  streaming?: boolean;
  prompt?: string;
  middleware?: Array<string | Record<string, Record<string, unknown>>>;
  session?: {
    dev?: string;
    prod?: { provider?: string; bucket?: string };
  };
  tools?: Array<{ name: string; type: string; config?: Record<string, unknown> }>;
  agents?: Array<{ name: string; prompt: string; tools?: string[]; critical?: boolean }>;
  routing?: string;
  outputSchema?: OutputSchemaField[];
  cfrs?: Record<string, boolean>;
}

export function parseMiddleware(raw: Array<string | Record<string, Record<string, unknown>>> | undefined): RawMiddlewareEntry[] {
  if (!raw) return [];

  return raw.map(entry => {
    if (typeof entry === 'string') {
      return { type: entry, config: {} };
    }
    const key = Object.keys(entry)[0];
    return { type: key, config: entry[key] ?? {} };
  });
}

export function parseSpec(raw: Record<string, unknown>): RawPythonAgentSpec {
  const spec = raw as unknown as RawPythonAgentSpec;
  return {
    mode: spec.mode ?? 'single',
    provider: spec.provider ?? 'strands',
    streaming: spec.streaming ?? true,
    prompt: spec.prompt,
    middleware: spec.middleware,
    session: spec.session,
    tools: spec.tools ?? [],
    agents: spec.agents,
    routing: spec.routing ?? 'sequential',
    outputSchema: spec.outputSchema,
    cfrs: spec.cfrs,
  };
}
