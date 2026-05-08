import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveLlmConfig, chatCompletion, validateBaseUrl } from '../src/engine/llm.js';
import type { FixedCodeConfig } from '../src/types.js';

describe('validateBaseUrl', () => {
  it('accepts the openrouter default', () => {
    expect(() => validateBaseUrl('https://openrouter.ai/api/v1')).not.toThrow();
  });

  it('accepts the openai default', () => {
    expect(() => validateBaseUrl('https://api.openai.com/v1')).not.toThrow();
  });

  it('accepts the anthropic api', () => {
    expect(() => validateBaseUrl('https://api.anthropic.com/v1')).not.toThrow();
  });

  it('accepts http://localhost (ollama)', () => {
    expect(() => validateBaseUrl('http://localhost:11434/v1')).not.toThrow();
  });

  it('accepts http://127.0.0.1', () => {
    expect(() => validateBaseUrl('http://127.0.0.1:11434/v1')).not.toThrow();
  });

  it('accepts http://[::1] (IPv6 loopback)', () => {
    expect(() => validateBaseUrl('http://[::1]:11434/v1')).not.toThrow();
  });

  it('rejects an IPv6 non-loopback address', () => {
    expect(() => validateBaseUrl('http://[2001:db8::1]:11434/v1')).toThrow(/loopback/i);
  });

  it('rejects an attacker-hosted https URL', () => {
    expect(() => validateBaseUrl('https://attacker.example.com/api/v1')).toThrow(
      /not on the LLM allowlist/i,
    );
  });

  it('rejects http on a non-loopback host', () => {
    expect(() => validateBaseUrl('http://api.openai.com/v1')).toThrow(/must be https/i);
  });

  it('rejects malformed URLs', () => {
    expect(() => validateBaseUrl('not-a-url')).toThrow();
  });

  it('rejects javascript: URLs', () => {
    expect(() => validateBaseUrl('javascript:alert(1)')).toThrow();
  });

  it('rejects file: URLs', () => {
    expect(() => validateBaseUrl('file:///etc/passwd')).toThrow();
  });
});

describe('resolveLlmConfig', () => {
  const baseConfig: FixedCodeConfig = {
    bundles: {},
    configDir: '/tmp',
  };

  afterEach(() => {
    delete process.env.FIXEDCODE_LLM_PROVIDER;
    delete process.env.FIXEDCODE_LLM_MODEL;
    delete process.env.FIXEDCODE_LLM_BASE_URL;
    delete process.env.FIXEDCODE_LLM_API_KEY;
  });

  it('resolves from .fixedcode.yaml config', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: {
        provider: 'openrouter',
        model: 'google/gemini-2.5-flash',
        apiKeyEnv: 'OPENROUTER_API_KEY',
      },
    };
    process.env.OPENROUTER_API_KEY = 'test-key';
    const result = resolveLlmConfig(config);
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('google/gemini-2.5-flash');
    expect(result.baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(result.apiKey).toBe('test-key');
  });

  it('env vars override config', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openrouter', model: 'old-model' },
    };
    process.env.FIXEDCODE_LLM_MODEL = 'new-model';
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';
    const result = resolveLlmConfig(config);
    expect(result.model).toBe('new-model');
  });

  it('CLI overrides override everything', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openrouter', model: 'old-model' },
    };
    process.env.FIXEDCODE_LLM_MODEL = 'env-model';
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';
    const result = resolveLlmConfig(config, { model: 'cli-model' });
    expect(result.model).toBe('cli-model');
  });

  it('derives default baseUrl for openrouter', () => {
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';
    const config: FixedCodeConfig = { ...baseConfig, llm: { provider: 'openrouter', model: 'test' } };
    expect(resolveLlmConfig(config).baseUrl).toBe('https://openrouter.ai/api/v1');
  });

  it('derives default baseUrl for ollama', () => {
    const config: FixedCodeConfig = { ...baseConfig, llm: { provider: 'ollama', model: 'llama3' } };
    expect(resolveLlmConfig(config).baseUrl).toBe('http://localhost:11434/v1');
  });

  it('derives default baseUrl for openai', () => {
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';
    const config: FixedCodeConfig = { ...baseConfig, llm: { provider: 'openai', model: 'gpt-4o' } };
    expect(resolveLlmConfig(config).baseUrl).toBe('https://api.openai.com/v1');
  });

  it('throws when no provider configured', () => {
    expect(() => resolveLlmConfig(baseConfig)).toThrow(/No LLM provider configured/);
  });

  it('throws when no model configured', () => {
    const config: FixedCodeConfig = { ...baseConfig, llm: { provider: 'openrouter' } as any };
    expect(() => resolveLlmConfig(config)).toThrow(/No LLM model configured/);
  });

  it('does not require API key for ollama', () => {
    const config: FixedCodeConfig = { ...baseConfig, llm: { provider: 'ollama', model: 'llama3' } };
    expect(resolveLlmConfig(config).apiKey).toBeUndefined();
  });

  it('throws when no API key for non-ollama provider', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openrouter', model: 'test' },
    };
    expect(() => resolveLlmConfig(config)).toThrow(/No API key found/);
  });
});

describe('chatCompletion', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('sends correct request shape', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'response text' } }] }),
    });
    const config = { provider: 'openrouter' as const, model: 'test-model', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'test-key' };
    const result = await chatCompletion(config, [
      { role: 'system' as const, content: 'You are helpful' },
      { role: 'user' as const, content: 'Hello' },
    ]);
    expect(result).toBe('response text');
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('test-model');
    expect(body.messages).toHaveLength(2);
    expect(opts.headers['Authorization']).toBe('Bearer test-key');
  });

  it('throws on non-200 response', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });
    const config = { provider: 'openrouter' as const, model: 'test-model', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'bad-key' };
    await expect(chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }])).rejects.toThrow(/LLM request failed.*401/);
  });

  it('throws on empty choices', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) });
    const config = { provider: 'openrouter' as const, model: 'test-model', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'key' };
    await expect(chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }])).rejects.toThrow(/empty choices/i);
  });

  it('throws on null content', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: null } }] }) });
    const config = { provider: 'openrouter' as const, model: 'test-model', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'key' };
    await expect(chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }])).rejects.toThrow(/null content/i);
  });

  it('skips auth header for ollama', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) });
    const config = { provider: 'ollama' as const, model: 'llama3', baseUrl: 'http://localhost:11434/v1' };
    await chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }]);
    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers['Authorization']).toBeUndefined();
  });
});
