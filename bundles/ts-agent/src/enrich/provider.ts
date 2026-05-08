export interface ProviderConfig {
  providerImport: string;
  providerDependency: string;
  providerClientInit: string;
}

const providers: Record<string, ProviderConfig> = {
  'vercel-ai': {
    providerImport: "import { generateText, tool } from 'ai';",
    providerDependency: '"ai": "^6.0.0"',
    providerClientInit: 'generateText({ model, tools, maxSteps, messages })',
  },
  'claude-sdk': {
    providerImport: "import Anthropic from '@anthropic-ai/sdk';",
    providerDependency: '"@anthropic-ai/sdk": "^0.80.0"',
    providerClientInit: 'new Anthropic()',
  },
  openai: {
    providerImport: "import OpenAI from 'openai';",
    providerDependency: '"openai": "^4.0.0"',
    providerClientInit: 'new OpenAI()',
  },
};

export function enrichProvider(provider: string): ProviderConfig {
  const config = providers[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  return config;
}
