import type { FixedCodeConfig, LlmConfig } from '../types.js';
import { LlmError } from '../errors.js';

const DEFAULT_BASE_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434/v1',
};

const ALLOWED_LLM_HOSTS = new Set([
  'openrouter.ai',
  'api.openai.com',
  'api.anthropic.com',
  'localhost',
  '127.0.0.1',
  '[::1]',
]);

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Validate that a configured LLM baseUrl points at a known provider (or loopback).
 *
 * Why: enrich/draft send project file contents and the API key as Bearer auth to
 * this URL. An unconstrained baseUrl lets a malicious .fixedcode.yaml exfiltrate
 * source and credentials. Loopback (localhost / 127.0.0.1) is allowed for Ollama
 * and similar local model servers.
 */
export function validateBaseUrl(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new LlmError(`Invalid LLM baseUrl: ${baseUrl}`);
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new LlmError(
      `Invalid LLM baseUrl protocol: ${url.protocol}. Must be https or http on loopback.`,
    );
  }

  // Node's WHATWG URL keeps IPv6 brackets in hostname; older parsers strip them.
  // Normalise so set-membership comparison works either way.
  const hostname =
    url.hostname.includes(':') && !url.hostname.startsWith('[')
      ? `[${url.hostname}]`
      : url.hostname;
  const isLoopback = LOOPBACK_HOSTS.has(hostname);
  if (url.protocol === 'http:' && !isLoopback) {
    throw new LlmError(
      `Invalid LLM baseUrl: must be https unless host is loopback (got ${baseUrl})`,
    );
  }

  if (!ALLOWED_LLM_HOSTS.has(hostname)) {
    throw new LlmError(
      `LLM baseUrl host ${hostname} is not on the LLM allowlist (${[...ALLOWED_LLM_HOSTS].join(', ')}). ` +
        `If you need to add a provider, edit ALLOWED_LLM_HOSTS in engine/src/engine/llm.ts and rebuild.`,
    );
  }

  return baseUrl;
}

export interface ResolvedLlmConfig {
  provider: 'openrouter' | 'ollama' | 'openai';
  model: string;
  baseUrl: string;
  apiKey?: string;
}

export type ChatContent = string | ChatContentPart[];

export interface ChatContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: ChatContent;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export function resolveLlmConfig(
  config: FixedCodeConfig,
  overrides?: { provider?: string; model?: string },
): ResolvedLlmConfig {
  const provider =
    overrides?.provider ?? process.env.FIXEDCODE_LLM_PROVIDER ?? config.llm?.provider;

  if (!provider) {
    throw new LlmError(
      'No LLM provider configured. Set `llm.provider` in .fixedcode.yaml, set FIXEDCODE_LLM_PROVIDER env var, or use --provider flag.',
    );
  }

  const validProviders = ['openrouter', 'ollama', 'openai'];
  if (!validProviders.includes(provider)) {
    throw new LlmError(
      `Invalid LLM provider '${provider}'. Must be one of: ${validProviders.join(', ')}`,
    );
  }

  const model = overrides?.model ?? process.env.FIXEDCODE_LLM_MODEL ?? config.llm?.model;

  if (!model) {
    throw new LlmError(
      'No LLM model configured. Set `llm.model` in .fixedcode.yaml, set FIXEDCODE_LLM_MODEL env var, or use --model flag.',
    );
  }

  const rawBaseUrl =
    process.env.FIXEDCODE_LLM_BASE_URL ?? config.llm?.baseUrl ?? DEFAULT_BASE_URLS[provider];
  const baseUrl = validateBaseUrl(rawBaseUrl);
  const apiKey =
    process.env.FIXEDCODE_LLM_API_KEY ??
    (config.llm?.apiKeyEnv ? process.env[config.llm.apiKeyEnv] : undefined);

  if (provider !== 'ollama' && !apiKey) {
    throw new LlmError(
      `No API key found for provider '${provider}'. Configure llm.apiKeyEnv in .fixedcode.yaml and set the corresponding env var, or set FIXEDCODE_LLM_API_KEY directly.`,
    );
  }

  return { provider: provider as ResolvedLlmConfig['provider'], model, baseUrl, apiKey };
}

export async function chatCompletion(
  config: ResolvedLlmConfig,
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<string> {
  const url = `${config.baseUrl}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const body = JSON.stringify({
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 4096,
  });

  const LLM_TIMEOUT_MS = 120_000; // 2 minutes
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new LlmError(`LLM request timed out after ${LLM_TIMEOUT_MS / 1000}s`);
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new LlmError(`LLM request failed (network error): ${message}`);
  }

  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text().catch(() => 'No response body');
    throw new LlmError(`LLM request failed (${response.status}): ${text}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new LlmError('LLM request failed: response is not valid JSON');
  }

  const choices = (data as { choices?: Array<{ message?: { content?: string } }> })?.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new LlmError('LLM request failed: empty choices in response');
  }

  const content = choices[0]?.message?.content;
  if (content === null || content === undefined) {
    throw new LlmError('LLM request failed: null content in response (possibly content-filtered)');
  }

  return content;
}
