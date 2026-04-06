# AI Sandwich CLI Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `fixedcode draft` and `fixedcode enrich` commands to cement the AI sandwich as a first-class product feature — AI creates specs (top slice) and AI fills extension points (bottom slice).

**Architecture:** A shared LLM client (`engine/src/engine/llm.ts`) talks to OpenAI-compatible APIs (OpenRouter, OpenAI, Ollama) via `fetch()`. Two new CLI commands delegate to pipeline modules (`draft.ts`, `enrich.ts`) that orchestrate schema loading, prompt construction, LLM calls, and validation/writing. Config lives in `.fixedcode.yaml` with env var and CLI flag overrides.

**Tech Stack:** TypeScript, Vitest, Commander (CLI), Node.js built-in `fetch()`, existing ajv/yaml/manifest infrastructure.

**Spec:** `docs/superpowers/specs/2026-04-06-ai-sandwich-commands-design.md`

---

## File Structure

### New files

```
engine/src/
├── engine/
│   ├── llm.ts                    # Shared LLM client: resolveLlmConfig(), chatCompletion()
│   ├── draft.ts                  # Draft pipeline: load schema → build prompt → call LLM → validate → output
│   └── enrich.ts                 # Enrich pipeline: read manifest → gather neighbours → call LLM → write
├── cli/
│   ├── draft-cmd.ts              # CLI command: fixedcode draft <kind> <description>
│   └── enrich-cmd.ts             # CLI command: fixedcode enrich <outputDir>
engine/test/
├── llm.test.ts                   # LLM client unit tests (mock fetch)
├── draft.test.ts                 # Draft pipeline tests (mock LLM, real validation)
└── enrich.test.ts                # Enrich pipeline tests (mock LLM, real manifest)
```

### Modified files

```
engine/src/types.ts               # Add llm? to FixedCodeConfig
engine/src/engine/config.ts       # Parse llm field in loadConfig()
engine/src/engine/manifest.ts     # Add specFile? to ManifestEntry
engine/src/engine/pipeline.ts     # Write specFile to manifest entries during generate()
engine/src/cli/index.ts           # Register draft + enrich commands
engine/src/errors.ts              # Add LlmError, DraftError, EnrichError
```

---

### Task 1: Add `llm` to FixedCodeConfig and parse it in config loader

**Files:**
- Modify: `engine/src/types.ts:110-115`
- Modify: `engine/src/engine/config.ts:44-53`

- [ ] **Step 1: Add LlmConfig type and llm field to FixedCodeConfig**

In `engine/src/types.ts`, add before the closing of the file:

```typescript
export interface LlmConfig {
  provider: 'openrouter' | 'ollama' | 'openai';
  model: string;
  baseUrl?: string;
  apiKeyEnv?: string;
}
```

And add to `FixedCodeConfig`:

```typescript
export interface FixedCodeConfig {
  bundles: Record<string, string>;
  generators?: Record<string, string>;
  /** Directory the config was loaded from — used to resolve relative bundle paths */
  configDir: string;
  /** Optional LLM configuration for draft and enrich commands */
  llm?: LlmConfig;
}
```

- [ ] **Step 2: Update loadConfig() to parse the llm field**

In `engine/src/engine/config.ts`, update the parsed type and return:

```typescript
const parsed = parseYaml(content) as {
  bundles?: Record<string, string>;
  generators?: Record<string, string>;
  llm?: {
    provider?: string;
    model?: string;
    baseUrl?: string;
    apiKeyEnv?: string;
  };
};
const configDir = resolve(configPath, '..');

return {
  bundles: parsed.bundles ?? {},
  generators: parsed.generators ?? {},
  llm: parsed.llm as FixedCodeConfig['llm'],
  configDir,
};
```

- [ ] **Step 3: Commit**

```bash
git add engine/src/types.ts engine/src/engine/config.ts
git commit -m "feat: add llm config to FixedCodeConfig and config loader"
```

---

### Task 2: Add specFile to ManifestEntry and write it during generate

**Files:**
- Modify: `engine/src/engine/manifest.ts:12-16`
- Modify: `engine/src/engine/pipeline.ts:67-93`

- [ ] **Step 1: Add specFile to ManifestEntry**

In `engine/src/engine/manifest.ts`, update the interface:

```typescript
export interface ManifestEntry {
  hash: string;
  bundle: string;
  overwrite: boolean;
  /** Path to the spec that generated this file (relative to outputDir) */
  specFile?: string;
}
```

- [ ] **Step 2: Pass specFile through writeWithManifest in pipeline.ts**

In `engine/src/engine/pipeline.ts`, update the `writeWithManifest` closure to accept and store `specFile`:

```typescript
const writeWithManifest = (relPath: string, content: string, overwrite: boolean, bundleKind: string, specFile?: string) => {
  if (isIgnored(relPath, ignorePatterns)) {
    skipped++;
    return;
  }

  const action = shouldWrite(relPath, overwrite, outputDir, existingManifest);
  if (action === 'skip') {
    skipped++;
    return;
  }
  if (action === 'warn-overwrite') {
    console.warn(`  Warning: overwriting user-modified file: ${relPath}`);
    warned++;
  }

  writeSingleFile(resolve(outputDir, relPath), content, {
    dryRun: options.dryRun,
    diff: options.diff,
  });

  newManifestFiles[relPath] = {
    hash: hashContent(content),
    bundle: bundleKind,
    overwrite,
    specFile,
  };
};
```

- [ ] **Step 3: Compute relative specFile and pass it to writeWithManifest calls**

At the top of `generate()`, after `outputDir` is resolved, add:

```typescript
const relativeSpecFile = relative(outputDir, resolve(specPath));
```

Then update all `writeWithManifest` calls to pass `relativeSpecFile` as the last argument:

```typescript
// In the generateFiles branch (line ~105):
writeWithManifest(entry.output, content, entry.overwrite !== false, rawSpec.kind, relativeSpecFile);

// In the renderTemplates branch (line ~115):
writeWithManifest(file.path, file.content, true, rawSpec.kind, relativeSpecFile);

// In the generators branch (line ~129):
writeWithManifest(file.path, file.content, true, `generator:${gen.name}`, relativeSpecFile);
```

You'll need to add `relative` to the import from `node:path` at the top of `pipeline.ts`:

```typescript
import { resolve, relative } from 'node:path';
```

- [ ] **Step 4: Commit**

```bash
git add engine/src/engine/manifest.ts engine/src/engine/pipeline.ts
git commit -m "feat: track specFile per manifest entry for enrich command"
```

---

### Task 3: Add error classes for LLM, Draft, and Enrich

**Files:**
- Modify: `engine/src/errors.ts`

- [ ] **Step 1: Add three new error classes**

Append to `engine/src/errors.ts`:

```typescript
export class LlmError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'LLM_ERROR');
    this.name = 'LlmError';
  }
}

export class DraftError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'DRAFT_ERROR');
    this.name = 'DraftError';
  }
}

export class EnrichError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'ENRICH_ERROR');
    this.name = 'EnrichError';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add engine/src/errors.ts
git commit -m "feat: add LlmError, DraftError, EnrichError classes"
```

---

### Task 4: Implement shared LLM client

**Files:**
- Create: `engine/src/engine/llm.ts`
- Create: `engine/test/llm.test.ts`

- [ ] **Step 1: Write the failing test**

Create `engine/test/llm.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveLlmConfig, chatCompletion } from '../src/engine/llm.js';
import type { FixedCodeConfig } from '../src/types.js';

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
    const result = resolveLlmConfig(config);
    expect(result.model).toBe('new-model');
  });

  it('CLI overrides override everything', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openrouter', model: 'old-model' },
    };
    process.env.FIXEDCODE_LLM_MODEL = 'env-model';
    const result = resolveLlmConfig(config, { model: 'cli-model' });
    expect(result.model).toBe('cli-model');
  });

  it('derives default baseUrl for openrouter', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openrouter', model: 'test' },
    };
    const result = resolveLlmConfig(config);
    expect(result.baseUrl).toBe('https://openrouter.ai/api/v1');
  });

  it('derives default baseUrl for ollama', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'ollama', model: 'llama3' },
    };
    const result = resolveLlmConfig(config);
    expect(result.baseUrl).toBe('http://localhost:11434/v1');
  });

  it('derives default baseUrl for openai', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openai', model: 'gpt-4o' },
    };
    const result = resolveLlmConfig(config);
    expect(result.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('throws when no provider configured', () => {
    expect(() => resolveLlmConfig(baseConfig)).toThrow(/No LLM provider configured/);
  });

  it('throws when no model configured', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'openrouter' } as any,
    };
    expect(() => resolveLlmConfig(config)).toThrow(/No LLM model configured/);
  });

  it('does not require API key for ollama', () => {
    const config: FixedCodeConfig = {
      ...baseConfig,
      llm: { provider: 'ollama', model: 'llama3' },
    };
    const result = resolveLlmConfig(config);
    expect(result.apiKey).toBeUndefined();
  });
});

describe('chatCompletion', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends correct request shape', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'response text' } }],
      }),
    });

    const config = {
      provider: 'openrouter' as const,
      model: 'test-model',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'test-key',
    };

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
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const config = {
      provider: 'openrouter' as const,
      model: 'test-model',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'bad-key',
    };

    await expect(chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }]))
      .rejects.toThrow(/LLM request failed.*401/);
  });

  it('throws on empty choices', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const config = {
      provider: 'openrouter' as const,
      model: 'test-model',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'key',
    };

    await expect(chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }]))
      .rejects.toThrow(/empty choices/i);
  });

  it('throws on null content', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: null } }],
      }),
    });

    const config = {
      provider: 'openrouter' as const,
      model: 'test-model',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'key',
    };

    await expect(chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }]))
      .rejects.toThrow(/null content/i);
  });

  it('skips auth header for ollama', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
      }),
    });

    const config = {
      provider: 'ollama' as const,
      model: 'llama3',
      baseUrl: 'http://localhost:11434/v1',
    };

    await chatCompletion(config, [{ role: 'user' as const, content: 'Hi' }]);

    const [, opts] = fetchSpy.mock.calls[0];
    expect(opts.headers['Authorization']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd engine && npx vitest run test/llm.test.ts`
Expected: FAIL — module `../src/engine/llm.js` does not exist

- [ ] **Step 3: Implement llm.ts**

Create `engine/src/engine/llm.ts`:

```typescript
import type { FixedCodeConfig, LlmConfig } from '../types.js';
import { LlmError } from '../errors.js';

const DEFAULT_BASE_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434/v1',
};

export interface ResolvedLlmConfig {
  provider: 'openrouter' | 'ollama' | 'openai';
  model: string;
  baseUrl: string;
  apiKey?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Resolve LLM config from .fixedcode.yaml + env vars + CLI overrides.
 * Priority: CLI flags > env vars > .fixedcode.yaml
 */
export function resolveLlmConfig(
  config: FixedCodeConfig,
  overrides?: { provider?: string; model?: string }
): ResolvedLlmConfig {
  const provider = overrides?.provider
    ?? process.env.FIXEDCODE_LLM_PROVIDER
    ?? config.llm?.provider;

  if (!provider) {
    throw new LlmError(
      'No LLM provider configured. Set `llm.provider` in .fixedcode.yaml, set FIXEDCODE_LLM_PROVIDER env var, or use --provider flag.'
    );
  }

  const validProviders = ['openrouter', 'ollama', 'openai'];
  if (!validProviders.includes(provider)) {
    throw new LlmError(
      `Invalid LLM provider '${provider}'. Must be one of: ${validProviders.join(', ')}`
    );
  }

  const model = overrides?.model
    ?? process.env.FIXEDCODE_LLM_MODEL
    ?? config.llm?.model;

  if (!model) {
    throw new LlmError(
      'No LLM model configured. Set `llm.model` in .fixedcode.yaml, set FIXEDCODE_LLM_MODEL env var, or use --model flag.'
    );
  }

  const baseUrl = process.env.FIXEDCODE_LLM_BASE_URL
    ?? config.llm?.baseUrl
    ?? DEFAULT_BASE_URLS[provider];

  // Resolve API key: direct env var > named env var from config > undefined
  const apiKey = process.env.FIXEDCODE_LLM_API_KEY
    ?? (config.llm?.apiKeyEnv ? process.env[config.llm.apiKeyEnv] : undefined);

  return {
    provider: provider as ResolvedLlmConfig['provider'],
    model,
    baseUrl,
    apiKey,
  };
}

/**
 * Send a chat completion request to an OpenAI-compatible API.
 * Returns the response text content.
 */
export async function chatCompletion(
  config: ResolvedLlmConfig,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<string> {
  const url = `${config.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const body = JSON.stringify({
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 4096,
  });

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new LlmError(`LLM request failed (network error): ${message}`);
  }

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

  const choices = (data as any)?.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new LlmError('LLM request failed: empty choices in response');
  }

  const content = choices[0]?.message?.content;
  if (content === null || content === undefined) {
    throw new LlmError('LLM request failed: null content in response (possibly content-filtered)');
  }

  return content;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && npx vitest run test/llm.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/engine/llm.ts engine/test/llm.test.ts
git commit -m "feat: add shared LLM client with OpenAI-compatible fetch API"
```

---

### Task 5: Implement `draft` pipeline

**Files:**
- Create: `engine/src/engine/draft.ts`
- Create: `engine/test/draft.test.ts`

- [ ] **Step 1: Write the failing test**

Create `engine/test/draft.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildDraftPrompt, extractYaml, draft } from '../src/engine/draft.js';

describe('extractYaml', () => {
  it('returns plain YAML as-is', () => {
    const yaml = 'apiVersion: "1.0"\nkind: test\n';
    expect(extractYaml(yaml)).toBe(yaml);
  });

  it('strips markdown yaml fences', () => {
    const input = '```yaml\napiVersion: "1.0"\nkind: test\n```';
    expect(extractYaml(input)).toBe('apiVersion: "1.0"\nkind: test');
  });

  it('strips markdown plain fences', () => {
    const input = '```\napiVersion: "1.0"\nkind: test\n```';
    expect(extractYaml(input)).toBe('apiVersion: "1.0"\nkind: test');
  });

  it('handles fences with leading/trailing whitespace', () => {
    const input = '\n```yaml\napiVersion: "1.0"\n```\n\n';
    expect(extractYaml(input).trim()).toBe('apiVersion: "1.0"');
  });
});

describe('buildDraftPrompt', () => {
  it('includes schema in system prompt', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: { type: 'object', properties: { name: { type: 'string' } } },
    });
    expect(result.system).toContain('test-bundle');
    expect(result.system).toContain('"type": "object"');
    expect(result.user).toBe('a test service');
  });

  it('includes conventions when provided', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: {},
      conventions: 'Use ? suffix for optional fields',
    });
    expect(result.system).toContain('? suffix for optional fields');
  });

  it('includes example when provided', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: {},
      example: 'apiVersion: "1.0"\nkind: test-bundle\nmetadata:\n  name: demo\nspec:\n  name: demo',
    });
    expect(result.system).toContain('demo');
  });

  it('omits conventions section when not provided', () => {
    const result = buildDraftPrompt({
      kind: 'test-bundle',
      description: 'a test service',
      schema: {},
    });
    expect(result.system).not.toContain('## Conventions');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd engine && npx vitest run test/draft.test.ts`
Expected: FAIL — module `../src/engine/draft.js` does not exist

- [ ] **Step 3: Implement draft.ts**

Create `engine/src/engine/draft.ts`:

```typescript
import { resolve, dirname } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { loadConfig } from './config.js';
import { resolveBundle } from './resolve.js';
import { validateBody } from './validate.js';
import { resolveLlmConfig, chatCompletion } from './llm.js';
import { DraftError } from '../errors.js';
import type { FixedCodeConfig } from '../types.js';

export interface DraftOptions {
  kind: string;
  description: string;
  output?: string;
  retry?: boolean;
  configPath?: string;
  llmOverrides?: { provider?: string; model?: string };
}

export interface PromptParts {
  system: string;
  user: string;
}

interface BuildPromptInput {
  kind: string;
  description: string;
  schema: Record<string, unknown>;
  conventions?: string;
  example?: string;
}

/**
 * Extract YAML content from LLM response, stripping markdown fences if present.
 */
export function extractYaml(raw: string): string {
  const trimmed = raw.trim();
  // Match ```yaml ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:ya?ml)?\s*\n([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) {
    return fenceMatch[1];
  }
  return trimmed;
}

/**
 * Build the system and user prompts for the draft command.
 */
export function buildDraftPrompt(input: BuildPromptInput): PromptParts {
  let system = `You are a code generation spec author for FixedCode.

Given a natural language description, produce a YAML spec that conforms to the following schema and conventions.

## Spec Envelope

Every spec has this structure:
\`\`\`yaml
apiVersion: "1.0"
kind: ${input.kind}
metadata:
  name: <derived-from-description>
  description: <one-line summary>
spec:
  <body conforming to schema below>
\`\`\`

## Schema

\`\`\`json
${JSON.stringify(input.schema, null, 2)}
\`\`\``;

  if (input.conventions) {
    system += `\n\n## Conventions\n\n${input.conventions}`;
  }

  if (input.example) {
    system += `\n\n## Example\n\n\`\`\`yaml\n${input.example}\n\`\`\``;
  }

  system += `\n\n## Rules

- Output ONLY the YAML spec. No explanation, no markdown fences, no commentary.
- The spec MUST validate against the schema above.
- Use the conventions for naming if provided.
- Prefer explicit over implicit — include all fields rather than relying on defaults.`;

  return { system, user: input.description };
}

/**
 * Load example specs from a bundle's examples/ directory.
 * Returns the first .yaml file (sorted alphabetically), or undefined.
 */
function loadBundleExample(bundleDir: string): string | undefined {
  const examplesDir = resolve(bundleDir, 'examples');
  if (!existsSync(examplesDir)) return undefined;

  const files = readdirSync(examplesDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  if (files.length === 0) return undefined;
  return readFileSync(resolve(examplesDir, files[0]), 'utf-8');
}

/**
 * Extract spec conventions from CLAUDE.md if it exists.
 * Looks for the section about spec conventions (command naming, field syntax, etc.)
 */
function loadConventions(configDir: string, kind: string): string | undefined {
  const claudeMdPath = resolve(configDir, 'CLAUDE.md');
  if (!existsSync(claudeMdPath)) return undefined;

  const content = readFileSync(claudeMdPath, 'utf-8');

  // Look for a kind-specific conventions section (e.g. "### spring-domain spec conventions")
  const kindRegex = new RegExp(`### ${kind} spec conventions\\n([\\s\\S]*?)(?=\\n## |\\n### |$)`);
  const kindMatch = content.match(kindRegex);
  if (kindMatch) {
    return kindMatch[1].trim();
  }

  // Fallback: look for a generic "Spec Format" section
  const specFormatMatch = content.match(/## Spec Format\n([\s\S]*?)(?=\n## |$)/);
  if (specFormatMatch) {
    return specFormatMatch[1].trim();
  }

  return undefined;
}

/**
 * Draft a YAML spec from a natural language description.
 */
export async function draft(options: DraftOptions): Promise<string> {
  const config = loadConfig(process.cwd(), options.configPath);
  const llmConfig = resolveLlmConfig(config, options.llmOverrides);

  // Resolve bundle to get schema
  const bundle = await resolveBundle(options.kind, config);

  // Resolve bundle directory for examples
  const bundlePath = config.bundles[bundle.kind];
  const bundleDir = bundlePath.startsWith('@')
    ? resolve(config.configDir, 'node_modules', ...bundlePath.split('/'))
    : resolve(config.configDir, bundlePath);

  // Build prompt
  const example = loadBundleExample(bundleDir);
  const conventions = loadConventions(config.configDir, options.kind);
  const prompt = buildDraftPrompt({
    kind: options.kind,
    description: options.description,
    schema: bundle.specSchema,
    conventions,
    example,
  });

  // Call LLM
  const response = await chatCompletion(llmConfig, [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user },
  ]);

  let yaml = extractYaml(response);

  // Validate
  let validationError = tryValidate(yaml, bundle.specSchema);

  // Retry once if invalid and retry is enabled (default true)
  if (validationError && options.retry !== false) {
    const retryResponse = await chatCompletion(llmConfig, [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
      { role: 'assistant', content: response },
      { role: 'user', content: `The YAML spec has validation errors:\n${validationError}\n\nPlease fix the errors and output the corrected YAML spec only.` },
    ]);

    yaml = extractYaml(retryResponse);
    validationError = tryValidate(yaml, bundle.specSchema);
  }

  if (validationError) {
    console.warn(`Warning: generated spec has validation errors:\n${validationError}`);
  }

  // Write output
  if (options.output) {
    const outputPath = resolve(options.output);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, yaml + '\n', 'utf-8');
    console.log(`Spec written to ${options.output}`);
  }

  return yaml;
}

/**
 * Try to validate a YAML string against a bundle schema.
 * Returns error message if invalid, undefined if valid.
 */
function tryValidate(yaml: string, schema: Record<string, unknown>): string | undefined {
  try {
    const parsed = parseYaml(yaml);
    if (!parsed || typeof parsed !== 'object') {
      return 'Invalid YAML: not an object';
    }

    const spec = (parsed as any).spec;
    if (!spec) {
      return 'Missing spec: field in YAML';
    }

    validateBody(spec, schema);
    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : 'Validation failed';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && npx vitest run test/draft.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/engine/draft.ts engine/test/draft.test.ts
git commit -m "feat: add draft pipeline — schema-guided YAML spec generation via LLM"
```

---

### Task 6: Implement `enrich` pipeline

**Files:**
- Create: `engine/src/engine/enrich.ts`
- Create: `engine/test/enrich.test.ts`

- [ ] **Step 1: Write the failing test**

Create `engine/test/enrich.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findNeighbours, buildEnrichPrompt, extractCode } from '../src/engine/enrich.js';
import type { Manifest } from '../src/engine/manifest.js';

describe('findNeighbours', () => {
  const manifest: Manifest = {
    generatedAt: '2026-01-01',
    engine: '0.1.0',
    bundles: { 'spring-domain': '0.1.0' },
    files: {
      'src/domain/workspace/Workspace.kt': {
        hash: 'a', bundle: 'spring-domain', overwrite: true, specFile: '../spec.yaml',
      },
      'src/domain/workspace/WorkspaceBusinessService.kt': {
        hash: 'b', bundle: 'spring-domain', overwrite: true, specFile: '../spec.yaml',
      },
      'src/domain/workspace/WorkspaceEvents.kt': {
        hash: 'c', bundle: 'spring-domain', overwrite: true, specFile: '../spec.yaml',
      },
      'src/domain/workspace/DefaultWorkspaceBusinessService.kt': {
        hash: 'd', bundle: 'spring-domain', overwrite: false, specFile: '../spec.yaml',
      },
      'src/application/workspace/WorkspaceCommandService.kt': {
        hash: 'e', bundle: 'spring-domain', overwrite: true, specFile: '../spec.yaml',
      },
      'src/domain/WorkspaceRepository.kt': {
        hash: 'f', bundle: 'spring-domain', overwrite: true, specFile: '../spec.yaml',
      },
      'src/config/SecurityConfig.kt': {
        hash: 'g', bundle: 'spring-domain', overwrite: true, specFile: '../spec.yaml',
      },
    },
  };

  it('finds same-directory neighbours', () => {
    const neighbours = findNeighbours(
      'src/domain/workspace/DefaultWorkspaceBusinessService.kt',
      manifest
    );
    expect(neighbours).toContain('src/domain/workspace/Workspace.kt');
    expect(neighbours).toContain('src/domain/workspace/WorkspaceBusinessService.kt');
    expect(neighbours).toContain('src/domain/workspace/WorkspaceEvents.kt');
  });

  it('excludes other extension points', () => {
    const neighbours = findNeighbours(
      'src/domain/workspace/DefaultWorkspaceBusinessService.kt',
      manifest
    );
    // Should not include itself or other overwrite:false files
    expect(neighbours).not.toContain('src/domain/workspace/DefaultWorkspaceBusinessService.kt');
  });

  it('includes parent-directory files with name affinity', () => {
    const neighbours = findNeighbours(
      'src/domain/workspace/DefaultWorkspaceBusinessService.kt',
      manifest
    );
    // Parent dir file with name affinity (contains "Workspace") should be included
    expect(neighbours).toContain('src/domain/WorkspaceRepository.kt');
    // Far-away file should not be included
    expect(neighbours).not.toContain('src/config/SecurityConfig.kt');
  });

  it('respects maxFiles limit', () => {
    const neighbours = findNeighbours(
      'src/domain/workspace/DefaultWorkspaceBusinessService.kt',
      manifest,
      2
    );
    expect(neighbours.length).toBeLessThanOrEqual(2);
  });
});

describe('extractCode', () => {
  it('returns plain code as-is', () => {
    const code = 'class Foo {\n  fun bar() {}\n}';
    expect(extractCode(code)).toBe(code);
  });

  it('strips kotlin fences', () => {
    const input = '```kotlin\nclass Foo {}\n```';
    expect(extractCode(input)).toBe('class Foo {}');
  });

  it('strips python fences', () => {
    const input = '```python\ndef foo():\n    pass\n```';
    expect(extractCode(input)).toBe('def foo():\n    pass');
  });

  it('strips plain fences', () => {
    const input = '```\nsome code\n```';
    expect(extractCode(input)).toBe('some code');
  });
});

describe('buildEnrichPrompt', () => {
  it('includes spec YAML', () => {
    const result = buildEnrichPrompt({
      specYaml: 'kind: test\nspec:\n  name: demo',
      stubPath: 'src/Default.kt',
      stubContent: '// TODO: implement',
      neighbours: [],
    });
    expect(result.system).toContain('extension point');
    expect(result.user).toContain('kind: test');
  });

  it('includes stub content', () => {
    const result = buildEnrichPrompt({
      specYaml: 'kind: test',
      stubPath: 'src/Default.kt',
      stubContent: 'class Default { /* TODO */ }',
      neighbours: [],
    });
    expect(result.user).toContain('class Default');
    expect(result.user).toContain('src/Default.kt');
  });

  it('includes neighbour files', () => {
    const result = buildEnrichPrompt({
      specYaml: 'kind: test',
      stubPath: 'src/Default.kt',
      stubContent: '// TODO',
      neighbours: [
        { path: 'src/Interface.kt', content: 'interface Foo {}' },
      ],
    });
    expect(result.user).toContain('src/Interface.kt');
    expect(result.user).toContain('interface Foo {}');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd engine && npx vitest run test/enrich.test.ts`
Expected: FAIL — module `../src/engine/enrich.js` does not exist

- [ ] **Step 3: Implement enrich.ts**

Create `engine/src/engine/enrich.ts`:

```typescript
import { resolve, dirname, relative, basename } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadConfig } from './config.js';
import { readManifest, type Manifest } from './manifest.js';
import { resolveLlmConfig, chatCompletion } from './llm.js';
import { EnrichError } from '../errors.js';
import type { FixedCodeConfig } from '../types.js';

export interface EnrichOptions {
  outputDir: string;
  specFile?: string;
  file?: string;
  force?: boolean;
  configPath?: string;
  llmOverrides?: { provider?: string; model?: string };
}

export interface EnrichResult {
  enriched: string[];
  skipped: string[];
  errors: string[];
}

interface PromptParts {
  system: string;
  user: string;
}

interface NeighbourFile {
  path: string;
  content: string;
}

/**
 * Extract code from LLM response, stripping markdown fences if present.
 */
export function extractCode(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) {
    return fenceMatch[1];
  }
  return trimmed;
}

/**
 * Find neighbouring generated files relevant to an extension point.
 * Prioritises: same directory > parent directory > name affinity.
 * Only includes overwrite:true files (generated, not other extension points).
 */
export function findNeighbours(
  extensionPointPath: string,
  manifest: Manifest,
  maxFiles: number = 10
): string[] {
  const dir = dirname(extensionPointPath);
  const parentDir = dirname(dir);
  const baseName = basename(extensionPointPath).replace(/^Default/, '').replace(/\.\w+$/, '');

  const candidates: Array<{ path: string; score: number }> = [];

  for (const [filePath, entry] of Object.entries(manifest.files)) {
    // Skip extension points and the file itself
    if (!entry.overwrite || filePath === extensionPointPath) continue;

    const fileDir = dirname(filePath);

    if (fileDir === dir) {
      // Same directory — highest relevance
      candidates.push({ path: filePath, score: 3 });
    } else if (fileDir === parentDir || dirname(fileDir) === parentDir) {
      // Parent directory or sibling directory — check name affinity
      const fileBase = basename(filePath).replace(/\.\w+$/, '');
      if (fileBase.includes(baseName) || baseName.includes(fileBase)) {
        candidates.push({ path: filePath, score: 2 });
      }
    }
    // Files further away are not included
  }

  // Sort by score (descending), then alphabetically for stability
  candidates.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  return candidates.slice(0, maxFiles).map(c => c.path);
}

/**
 * Build the prompt for enriching an extension point.
 */
export function buildEnrichPrompt(input: {
  specYaml: string;
  stubPath: string;
  stubContent: string;
  neighbours: NeighbourFile[];
}): PromptParts {
  const system = `You are implementing business logic for a generated extension point file.

The file was generated by FixedCode as a stub with TODOs. Your job is to implement the business logic based on the original spec and the related generated files.

Rules:
- Implement all TODO stubs with working business logic based on the spec and related files.
- Preserve all existing signatures, class names, and imports.
- Follow the patterns established in the related files.
- Do not add features beyond what the spec describes.
- Output ONLY the complete file. No explanation, no markdown fences, no commentary.`;

  let user = `## Original Spec\n\n\`\`\`yaml\n${input.specYaml}\n\`\`\`\n\n`;
  user += `## Extension Point (file to implement)\n\nPath: ${input.stubPath}\n\n\`\`\`\n${input.stubContent}\n\`\`\`\n`;

  if (input.neighbours.length > 0) {
    user += '\n## Related Generated Files\n';
    for (const n of input.neighbours) {
      user += `\nPath: ${n.path}\n\n\`\`\`\n${n.content}\n\`\`\`\n`;
    }
  }

  return { system, user };
}

/**
 * Check if files have uncommitted changes.
 * Returns list of dirty file paths.
 */
function checkGitDirty(outputDir: string, files: string[]): string[] {
  const dirty: string[] = [];
  for (const file of files) {
    const absPath = resolve(outputDir, file);
    if (!existsSync(absPath)) continue;

    try {
      const status = execFileSync('git', ['status', '--porcelain', absPath], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      if (status.length > 0) {
        dirty.push(file);
      }
    } catch {
      // git not available or not a repo — skip check
    }
  }
  return dirty;
}

/**
 * Enrich extension point files with AI-generated business logic.
 */
export async function enrich(options: EnrichOptions): Promise<EnrichResult> {
  const outputDir = resolve(options.outputDir);
  const config = loadConfig(process.cwd(), options.configPath);
  const llmConfig = resolveLlmConfig(config, options.llmOverrides);

  // Read manifest
  const manifest = readManifest(outputDir);
  if (!manifest) {
    throw new EnrichError(`No .fixedcode-manifest.json found in ${outputDir}`);
  }

  // Find extension points (overwrite: false)
  let extensionPoints = Object.entries(manifest.files)
    .filter(([, entry]) => !entry.overwrite)
    .map(([path, entry]) => ({ path, entry }));

  if (extensionPoints.length === 0) {
    console.log('No extension points found.');
    return { enriched: [], skipped: [], errors: [] };
  }

  // Filter to specific file if --file provided
  if (options.file) {
    extensionPoints = extensionPoints.filter(ep => ep.path === options.file);
    if (extensionPoints.length === 0) {
      throw new EnrichError(`File '${options.file}' is not an extension point in the manifest`);
    }
  }

  // Git safety check
  if (!options.force) {
    const dirty = checkGitDirty(outputDir, extensionPoints.map(ep => ep.path));
    if (dirty.length > 0) {
      throw new EnrichError(
        `Extension point files have uncommitted changes. Commit first or use --force.\nDirty files:\n  ${dirty.join('\n  ')}`
      );
    }
  }

  const result: EnrichResult = { enriched: [], skipped: [], errors: [] };

  // Group by specFile for efficient spec loading
  const bySpec = new Map<string, typeof extensionPoints>();
  for (const ep of extensionPoints) {
    const specKey = options.specFile ?? ep.entry.specFile ?? '__unknown__';
    if (!bySpec.has(specKey)) bySpec.set(specKey, []);
    bySpec.get(specKey)!.push(ep);
  }

  for (const [specKey, eps] of bySpec) {
    // Load spec YAML
    let specYaml: string;
    if (specKey === '__unknown__') {
      if (options.specFile) {
        specYaml = readFileSync(resolve(options.specFile), 'utf-8');
      } else {
        console.warn('Warning: no specFile recorded in manifest. Use --spec to provide one.');
        for (const ep of eps) result.skipped.push(ep.path);
        continue;
      }
    } else {
      const specPath = options.specFile
        ? resolve(options.specFile)
        : resolve(outputDir, specKey);
      if (!existsSync(specPath)) {
        console.warn(`Warning: spec file not found: ${specPath}`);
        for (const ep of eps) result.skipped.push(ep.path);
        continue;
      }
      specYaml = readFileSync(specPath, 'utf-8');
    }

    // Process each extension point sequentially
    for (const ep of eps) {
      const absPath = resolve(outputDir, ep.path);
      if (!existsSync(absPath)) {
        result.skipped.push(ep.path);
        continue;
      }

      try {
        const stubContent = readFileSync(absPath, 'utf-8');

        // Gather neighbours
        const neighbourPaths = findNeighbours(ep.path, manifest);
        const neighbours: NeighbourFile[] = neighbourPaths
          .map(p => {
            const nPath = resolve(outputDir, p);
            if (!existsSync(nPath)) return null;
            return { path: p, content: readFileSync(nPath, 'utf-8') };
          })
          .filter((n): n is NeighbourFile => n !== null);

        // Build prompt
        const prompt = buildEnrichPrompt({
          specYaml,
          stubPath: ep.path,
          stubContent,
          neighbours,
        });

        // Call LLM
        const response = await chatCompletion(llmConfig, [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ], { maxTokens: 8192 });

        const code = extractCode(response);

        // Write in place
        writeFileSync(absPath, code, 'utf-8');
        result.enriched.push(ep.path);
        console.log(`  Enriched: ${ep.path}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(ep.path);
        console.error(`  Error enriching ${ep.path}: ${message}`);
      }
    }
  }

  if (result.enriched.length > 0) {
    console.log(`\nEnriched ${result.enriched.length} extension point(s). Run \`git diff ${options.outputDir}\` to review.`);
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && npx vitest run test/enrich.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/engine/enrich.ts engine/test/enrich.test.ts
git commit -m "feat: add enrich pipeline — AI fills extension point stubs with business logic"
```

---

### Task 7: Implement `draft` CLI command

**Files:**
- Create: `engine/src/cli/draft-cmd.ts`
- Modify: `engine/src/cli/index.ts`

- [ ] **Step 1: Create draft-cmd.ts**

Create `engine/src/cli/draft-cmd.ts`:

```typescript
import { Command } from 'commander';
import { draft } from '../engine/draft.js';

export function createDraftCommand() {
  return new Command('draft')
    .description('Generate a YAML spec from a natural language description using AI')
    .argument('<kind>', 'Bundle kind (e.g. spring-domain, ts-agent)')
    .argument('<description>', 'Natural language description of the service/agent')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option('-c, --config <path>', 'Explicit path to .fixedcode.yaml config')
    .option('--provider <provider>', 'LLM provider (openrouter, ollama, openai)')
    .option('--model <model>', 'LLM model name')
    .option('--no-retry', 'Disable auto-retry on validation failure')
    .action(async (kind: string, description: string, opts) => {
      try {
        const yaml = await draft({
          kind,
          description,
          output: opts.output,
          retry: opts.retry,
          configPath: opts.config,
          llmOverrides: {
            provider: opts.provider,
            model: opts.model,
          },
        });

        // Print to stdout if no output file specified
        if (!opts.output) {
          process.stdout.write(yaml + '\n');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Draft failed: ${message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 2: Register in index.ts**

In `engine/src/cli/index.ts`, add the import and registration:

```typescript
import { createDraftCommand } from './draft-cmd.js';
```

And in `createProgram()`, add:

```typescript
program.addCommand(createDraftCommand());
```

- [ ] **Step 3: Commit**

```bash
git add engine/src/cli/draft-cmd.ts engine/src/cli/index.ts
git commit -m "feat: add fixedcode draft CLI command"
```

---

### Task 8: Implement `enrich` CLI command

**Files:**
- Create: `engine/src/cli/enrich-cmd.ts`
- Modify: `engine/src/cli/index.ts`

- [ ] **Step 1: Create enrich-cmd.ts**

Create `engine/src/cli/enrich-cmd.ts`:

```typescript
import { Command } from 'commander';
import { enrich } from '../engine/enrich.js';

export function createEnrichCommand() {
  return new Command('enrich')
    .description('Fill extension point stubs with AI-generated business logic')
    .argument('<outputDir>', 'Generated output directory (contains .fixedcode-manifest.json)')
    .option('--spec <path>', 'Path to the original spec YAML')
    .option('--file <path>', 'Enrich only this specific extension point file (relative to outputDir)')
    .option('--force', 'Skip git safety check (allow enriching uncommitted files)')
    .option('-c, --config <path>', 'Explicit path to .fixedcode.yaml config')
    .option('--provider <provider>', 'LLM provider (openrouter, ollama, openai)')
    .option('--model <model>', 'LLM model name')
    .action(async (outputDir: string, opts) => {
      try {
        const result = await enrich({
          outputDir,
          specFile: opts.spec,
          file: opts.file,
          force: opts.force,
          configPath: opts.config,
          llmOverrides: {
            provider: opts.provider,
            model: opts.model,
          },
        });

        if (result.errors.length > 0) {
          process.exit(1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Enrich failed: ${message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 2: Register in index.ts**

In `engine/src/cli/index.ts`, add the import:

```typescript
import { createEnrichCommand } from './enrich-cmd.js';
```

And in `createProgram()`, add:

```typescript
program.addCommand(createEnrichCommand());
```

- [ ] **Step 3: Commit**

```bash
git add engine/src/cli/enrich-cmd.ts engine/src/cli/index.ts
git commit -m "feat: add fixedcode enrich CLI command"
```

---

### Task 9: Export new functions from the public API

**Files:**
- Modify: `engine/src/cli/index.ts`

- [ ] **Step 1: Add exports**

In `engine/src/cli/index.ts`, add the public API exports:

```typescript
export { draft } from '../engine/draft.js';
export { enrich } from '../engine/enrich.js';
export { resolveLlmConfig, chatCompletion } from '../engine/llm.js';
```

- [ ] **Step 2: Commit**

```bash
git add engine/src/cli/index.ts
git commit -m "feat: export draft, enrich, and LLM client from public API"
```

---

### Task 10: Integration test — draft with mocked LLM

**Files:**
- Modify: `engine/test/draft.test.ts`

- [ ] **Step 1: Add integration test**

Add to `engine/test/draft.test.ts`:

```typescript
import { draft } from '../src/engine/draft.js';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('draft integration', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let tmpDir: string;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    tmpDir = mkdtempSync(join(tmpdir(), 'draft-test-'));

    process.env.FIXEDCODE_LLM_PROVIDER = 'openrouter';
    process.env.FIXEDCODE_LLM_MODEL = 'test-model';
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.FIXEDCODE_LLM_PROVIDER;
    delete process.env.FIXEDCODE_LLM_MODEL;
    delete process.env.FIXEDCODE_LLM_API_KEY;
  });

  it('drafts a spec and writes to file', async () => {
    // Set up a minimal test bundle
    const bundleDir = join(tmpDir, 'test-bundle');
    mkdirSync(join(bundleDir, 'templates'), { recursive: true });
    writeFileSync(join(bundleDir, 'schema.json'), JSON.stringify({
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string' } },
    }));
    writeFileSync(join(bundleDir, 'package.json'), JSON.stringify({ name: 'test-bundle', type: 'module' }));
    // Minimal bundle index that exports the required shape
    mkdirSync(join(bundleDir, 'src'), { recursive: true });
    writeFileSync(join(bundleDir, 'index.js'), `
      import { readFileSync } from 'node:fs';
      import { fileURLToPath } from 'node:url';
      import { dirname, join } from 'node:path';
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const schema = JSON.parse(readFileSync(join(__dirname, 'schema.json'), 'utf-8'));
      export default {
        kind: 'test-bundle',
        specSchema: schema,
        enrich: (spec) => spec,
        templates: 'templates',
      };
    `);

    // Write test config
    const configPath = join(tmpDir, '.fixedcode.yaml');
    writeFileSync(configPath, `bundles:\n  test-bundle: "${bundleDir}"\n`);

    // Mock LLM response with valid YAML
    const mockYaml = `apiVersion: "1.0"\nkind: test-bundle\nmetadata:\n  name: user-service\nspec:\n  name: user-service`;
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockYaml } }],
      }),
    });

    const outputPath = join(tmpDir, 'user-service.yaml');

    const result = await draft({
      kind: 'test-bundle',
      description: 'user management service',
      output: outputPath,
      configPath,
    });

    expect(result).toContain('apiVersion');
    expect(result).toContain('user-service');

    // Verify file was written
    const written = readFileSync(outputPath, 'utf-8');
    expect(written).toContain('apiVersion');
  });
});
```

- [ ] **Step 2: Run the full draft test suite**

Run: `cd engine && npx vitest run test/draft.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add engine/test/draft.test.ts
git commit -m "test: add draft integration test with mocked LLM"
```

---

### Task 11: Integration test — enrich with mocked LLM

**Files:**
- Modify: `engine/test/enrich.test.ts`

- [ ] **Step 1: Add integration test**

Add to `engine/test/enrich.test.ts`:

```typescript
import { enrich } from '../src/engine/enrich.js';
import { writeManifest } from '../src/engine/manifest.js';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('enrich integration', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let tmpDir: string;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    tmpDir = mkdtempSync(join(tmpdir(), 'enrich-test-'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.FIXEDCODE_LLM_PROVIDER;
    delete process.env.FIXEDCODE_LLM_MODEL;
    delete process.env.FIXEDCODE_LLM_API_KEY;
  });

  it('enriches an extension point file', async () => {
    // Set up output directory with manifest and files
    const domainDir = join(tmpDir, 'src', 'domain');
    mkdirSync(domainDir, { recursive: true });

    // Write a generated interface file
    writeFileSync(join(domainDir, 'FooService.kt'), 'interface FooService {\n  fun doThing(): String\n}');

    // Write an extension point stub
    writeFileSync(join(domainDir, 'DefaultFooService.kt'), 'class DefaultFooService : FooService {\n  override fun doThing(): String {\n    // TODO: implement\n    throw NotImplementedError()\n  }\n}');

    // Write a spec file
    writeFileSync(join(tmpDir, 'spec.yaml'), 'apiVersion: "1.0"\nkind: test\nmetadata:\n  name: foo\nspec:\n  name: Foo');

    // Write manifest
    writeManifest(tmpDir, {
      generatedAt: '2026-01-01',
      engine: '0.1.0',
      bundles: { test: '0.1.0' },
      files: {
        'src/domain/FooService.kt': {
          hash: 'abc', bundle: 'test', overwrite: true, specFile: 'spec.yaml',
        },
        'src/domain/DefaultFooService.kt': {
          hash: 'def', bundle: 'test', overwrite: false, specFile: 'spec.yaml',
        },
      },
    });

    // Mock LLM response
    const enrichedCode = 'class DefaultFooService : FooService {\n  override fun doThing(): String {\n    return "Hello from Foo"\n  }\n}';
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: enrichedCode } }],
      }),
    });

    process.env.FIXEDCODE_LLM_PROVIDER = 'openrouter';
    process.env.FIXEDCODE_LLM_MODEL = 'test-model';
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';

    const result = await enrich({
      outputDir: tmpDir,
      force: true,  // skip git check in test
    });

    expect(result.enriched).toContain('src/domain/DefaultFooService.kt');
    expect(result.errors).toHaveLength(0);

    // Verify file was written
    const content = readFileSync(join(domainDir, 'DefaultFooService.kt'), 'utf-8');
    expect(content).toContain('Hello from Foo');
    expect(content).not.toContain('TODO');
  });

  it('reports when no extension points found', async () => {
    writeManifest(tmpDir, {
      generatedAt: '2026-01-01',
      engine: '0.1.0',
      bundles: { test: '0.1.0' },
      files: {
        'src/Foo.kt': { hash: 'abc', bundle: 'test', overwrite: true },
      },
    });

    process.env.FIXEDCODE_LLM_PROVIDER = 'openrouter';
    process.env.FIXEDCODE_LLM_MODEL = 'test-model';
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';

    const result = await enrich({ outputDir: tmpDir, force: true });
    expect(result.enriched).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the full enrich test suite**

Run: `cd engine && npx vitest run test/enrich.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add engine/test/enrich.test.ts
git commit -m "test: add enrich integration test with mocked LLM"
```

---

### Task 12: Build and verify all tests pass

**Files:**
- No new files

- [ ] **Step 1: Build the engine**

Run: `cd engine && npx tsc`
Expected: No type errors

- [ ] **Step 2: Run all engine tests**

Run: `cd engine && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Verify CLI commands are registered**

Run: `node engine/bin/fixedcode.js --help`
Expected: Output includes `draft` and `enrich` commands in the list

Run: `node engine/bin/fixedcode.js draft --help`
Expected: Shows usage for draft command with `<kind>`, `<description>`, `--output`, `--provider`, `--model`, `--no-retry`

Run: `node engine/bin/fixedcode.js enrich --help`
Expected: Shows usage for enrich command with `<outputDir>`, `--spec`, `--file`, `--force`, `--provider`, `--model`

- [ ] **Step 4: Commit any fixes**

If any build or test failures were found and fixed:

```bash
git add -A
git commit -m "fix: resolve build and test issues for draft/enrich commands"
```

---

### Task 13: Update CLAUDE.md with new commands

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add draft and enrich command documentation**

In `CLAUDE.md`, add to the CLI Commands section after the existing commands:

```markdown
### Draft a spec from natural language (AI-assisted)
```bash
fixedcode draft <kind> "<description>" -o <output.yaml>
fixedcode draft spring-domain "workspace service with CRUD" -o workspace-domain.yaml
```
Uses AI to generate a YAML spec from a description. Validates against the bundle's schema. Auto-retries once on validation failure.

### Enrich extension points with AI
```bash
fixedcode enrich <outputDir>                    # fill all extension points
fixedcode enrich <outputDir> --file <path>      # fill one specific file
fixedcode enrich <outputDir> --force            # skip git safety check
```
Reads the manifest, finds extension point stubs (overwrite: false), sends them to an LLM with neighbouring files for context, writes AI-generated business logic in place. Requires committed extension point files (use --force to skip).
```

Also add to the AI Sandwich Workflow section to show how draft and enrich fit:

```markdown
### Full AI Sandwich Workflow
```bash
# Top slice — AI creates the spec
fixedcode draft spring-domain "workspace service with workspaces and parties" -o workspace-domain.yaml
fixedcode validate workspace-domain.yaml

# Middle — deterministic generation
fixedcode generate workspace-domain.yaml -o build

# Bottom slice — AI fills extension points
fixedcode enrich build/
git diff build/    # review AI additions
```
```

- [ ] **Step 2: Add LLM configuration documentation**

In `CLAUDE.md`, add a Configuration section:

```markdown
### LLM Configuration (for draft and enrich commands)

Add to `.fixedcode.yaml`:
```yaml
llm:
  provider: openrouter          # openrouter | ollama | openai
  model: google/gemini-2.5-flash
  baseUrl: https://openrouter.ai/api/v1
  apiKeyEnv: OPENROUTER_API_KEY  # env var name holding the API key
```

Override with env vars: `FIXEDCODE_LLM_PROVIDER`, `FIXEDCODE_LLM_MODEL`, `FIXEDCODE_LLM_BASE_URL`, `FIXEDCODE_LLM_API_KEY`
Override with CLI flags: `--provider`, `--model`
Priority: CLI flags > env vars > .fixedcode.yaml
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add draft, enrich, and LLM config to CLAUDE.md"
```
