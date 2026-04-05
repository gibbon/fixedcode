export interface RawTsAgentSpec {
  mode: 'single' | 'orchestrator';
  provider: string;
  streaming?: boolean;
  model?: { tier?: string };
  prompt?: string;
  tools?: Array<{ name: string; type: string; config?: Record<string, unknown> }>;
  agents?: Array<{ name: string; prompt: string; tools?: string[]; critical?: boolean }>;
  routing?: string;
  server?: { port?: number };
}

export function parseSpec(raw: Record<string, unknown>): RawTsAgentSpec {
  const spec = raw as RawTsAgentSpec;
  return {
    mode: spec.mode ?? 'single',
    provider: spec.provider ?? 'vercel-ai',
    streaming: spec.streaming ?? true,
    model: { tier: spec.model?.tier ?? 'balanced' },
    prompt: spec.prompt,
    tools: spec.tools ?? [],
    agents: spec.agents,
    routing: spec.routing ?? 'sequential',
    server: { port: spec.server?.port ?? 3100 },
  };
}
