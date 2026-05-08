import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildDraftPrompt, extractYaml, draft } from '../src/engine/draft.js';
import { parse as parseYaml } from 'yaml';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('extractYaml', () => {
  it('returns trimmed plain YAML when no fences', () => {
    const yaml = 'apiVersion: "1.0"\nkind: test\n';
    expect(extractYaml(yaml)).toBe('apiVersion: "1.0"\nkind: test');
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
    writeFileSync(
      join(bundleDir, 'schema.json'),
      JSON.stringify({
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      }),
    );
    writeFileSync(
      join(bundleDir, 'package.json'),
      JSON.stringify({ name: 'test-bundle', type: 'module', main: 'index.js' }),
    );
    // Minimal bundle index that exports the required shape
    mkdirSync(join(bundleDir, 'src'), { recursive: true });
    writeFileSync(
      join(bundleDir, 'index.js'),
      `
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
    `,
    );

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

  it('retries when enrich() rejects the spec', async () => {
    // Set up a bundle where enrich() rejects specs missing a "required" field
    const bundleDir = join(tmpDir, 'strict-bundle');
    mkdirSync(join(bundleDir, 'templates'), { recursive: true });
    writeFileSync(
      join(bundleDir, 'schema.json'),
      JSON.stringify({
        type: 'object',
        properties: { name: { type: 'string' } },
      }),
    );
    writeFileSync(
      join(bundleDir, 'package.json'),
      JSON.stringify({ name: 'strict-bundle', type: 'module', main: 'index.js' }),
    );
    writeFileSync(
      join(bundleDir, 'index.js'),
      `
      import { readFileSync } from 'node:fs';
      import { fileURLToPath } from 'node:url';
      import { dirname, join } from 'node:path';
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const schema = JSON.parse(readFileSync(join(__dirname, 'schema.json'), 'utf-8'));
      export default {
        kind: 'strict-bundle',
        specSchema: schema,
        enrich: (spec) => {
          if (!spec.name) throw new Error('spec.name is required');
          if (!spec.name.includes('-')) throw new Error('spec.name must contain a hyphen');
          return spec;
        },
        templates: 'templates',
      };
    `,
    );

    const configPath = join(tmpDir, '.fixedcode-strict.yaml');
    writeFileSync(configPath, `bundles:\n  strict-bundle: "${bundleDir}"\n`);

    // First response: schema-valid but enrich() rejects (no hyphen in name)
    const badYaml =
      'apiVersion: "1.0"\nkind: strict-bundle\nmetadata:\n  name: test\nspec:\n  name: nohyphen';
    // Second response (retry): passes both schema and enrich()
    const goodYaml =
      'apiVersion: "1.0"\nkind: strict-bundle\nmetadata:\n  name: test\nspec:\n  name: has-hyphen';

    let callCount = 0;
    fetchSpy.mockImplementation(async () => {
      callCount++;
      const content = callCount === 1 ? badYaml : goodYaml;
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content } }] }),
      };
    });

    const result = await draft({
      kind: 'strict-bundle',
      description: 'test service',
      configPath,
      retry: true,
    });

    // Should have retried and returned the good spec
    expect(callCount).toBe(2);
    expect(result).toContain('has-hyphen');
  });
});

describe('draft round-trip with spring-domain', () => {
  it('example spec survives enrich()', async () => {
    // Load the actual example spec and verify it passes through spring-domain enrich()
    const examplePath = join(
      process.cwd(),
      '..',
      'bundles',
      'spring-domain',
      'examples',
      'workspace-domain.yaml',
    );
    if (!existsSync(examplePath)) {
      // Skip if running from a different cwd
      return;
    }

    const yaml = readFileSync(examplePath, 'utf-8');
    const parsed = parseYaml(yaml) as any;

    // Dynamically import the spring-domain bundle
    const bundlePath = join(process.cwd(), '..', 'bundles', 'spring-domain');
    const bundleMod = await import(join(bundlePath, 'dist', 'index.js'));
    const bundle = bundleMod.default ?? bundleMod;

    // This is what draft's tryValidate does — schema check + enrich()
    expect(() => {
      bundle.enrich(parsed.spec, { name: parsed.metadata.name, apiVersion: parsed.apiVersion });
    }).not.toThrow();
  });
});
