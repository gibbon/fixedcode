export interface ProviderConfig {
  providerImport: string;
  providerDependency: string;
  providerClientInit: string;
  providerToolDecorator: string;
}

const providers: Record<string, ProviderConfig> = {
  strands: {
    providerImport: 'from strands import Agent, tool',
    providerDependency: 'strands-agents>=1.0.0',
    providerClientInit:
      'Agent(model=model, tools=tools, system_prompt=system_prompt, conversation_manager=conversation_manager)',
    providerToolDecorator: '@tool',
  },
  'claude-agent-sdk': {
    providerImport: 'import anthropic',
    providerDependency: 'anthropic>=0.40.0',
    providerClientInit: 'anthropic.Anthropic()',
    providerToolDecorator: '',
  },
  openai: {
    providerImport: 'from openai import OpenAI',
    providerDependency: 'openai>=1.0.0',
    providerClientInit: 'OpenAI()',
    providerToolDecorator: '',
  },
  ollama: {
    providerImport: 'from openai import OpenAI',
    providerDependency: 'openai>=1.0.0',
    providerClientInit: 'OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")',
    providerToolDecorator: '',
  },
};

export function enrichProvider(provider: string): ProviderConfig {
  const config = providers[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  return config;
}
