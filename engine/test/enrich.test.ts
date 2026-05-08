import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findNeighbours, buildEnrichPrompt, extractCode, enrich } from '../src/engine/enrich.js';
import { writeManifest, type Manifest } from '../src/engine/manifest.js';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('findNeighbours', () => {
  const manifest: Manifest = {
    generatedAt: '2026-01-01',
    engine: '0.1.0',
    bundles: { 'spring-domain': '0.1.0' },
    files: {
      'src/domain/order/Order.kt': {
        hash: 'a',
        bundle: 'spring-domain',
        overwrite: true,
        specFile: '../spec.yaml',
      },
      'src/domain/order/OrderBusinessService.kt': {
        hash: 'b',
        bundle: 'spring-domain',
        overwrite: true,
        specFile: '../spec.yaml',
      },
      'src/domain/order/OrderEvents.kt': {
        hash: 'c',
        bundle: 'spring-domain',
        overwrite: true,
        specFile: '../spec.yaml',
      },
      'src/domain/order/DefaultOrderBusinessService.kt': {
        hash: 'd',
        bundle: 'spring-domain',
        overwrite: false,
        specFile: '../spec.yaml',
      },
      'src/application/order/OrderCommandService.kt': {
        hash: 'e',
        bundle: 'spring-domain',
        overwrite: true,
        specFile: '../spec.yaml',
      },
      'src/domain/OrderRepository.kt': {
        hash: 'f',
        bundle: 'spring-domain',
        overwrite: true,
        specFile: '../spec.yaml',
      },
      'src/config/SecurityConfig.kt': {
        hash: 'g',
        bundle: 'spring-domain',
        overwrite: true,
        specFile: '../spec.yaml',
      },
    },
  };

  it('finds same-directory neighbours', () => {
    const neighbours = findNeighbours(
      'src/domain/order/DefaultOrderBusinessService.kt',
      manifest,
    );
    expect(neighbours).toContain('src/domain/order/Order.kt');
    expect(neighbours).toContain('src/domain/order/OrderBusinessService.kt');
    expect(neighbours).toContain('src/domain/order/OrderEvents.kt');
  });

  it('excludes other extension points', () => {
    const neighbours = findNeighbours(
      'src/domain/order/DefaultOrderBusinessService.kt',
      manifest,
    );
    // Should not include itself or other overwrite:false files
    expect(neighbours).not.toContain('src/domain/order/DefaultOrderBusinessService.kt');
  });

  it('includes parent-directory files with name affinity', () => {
    const neighbours = findNeighbours(
      'src/domain/order/DefaultOrderBusinessService.kt',
      manifest,
    );
    // Parent dir file with name affinity (contains "Order") should be included
    expect(neighbours).toContain('src/domain/OrderRepository.kt');
    // Far-away file should not be included
    expect(neighbours).not.toContain('src/config/SecurityConfig.kt');
  });

  it('respects maxFiles limit', () => {
    const neighbours = findNeighbours(
      'src/domain/order/DefaultOrderBusinessService.kt',
      manifest,
      2,
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
      neighbours: [{ path: 'src/Interface.kt', content: 'interface Foo {}' }],
    });
    expect(result.user).toContain('src/Interface.kt');
    expect(result.user).toContain('interface Foo {}');
  });
});

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
    writeFileSync(
      join(domainDir, 'FooService.kt'),
      'interface FooService {\n  fun doThing(): String\n}',
    );

    // Write an extension point stub
    writeFileSync(
      join(domainDir, 'DefaultFooService.kt'),
      'class DefaultFooService : FooService {\n  override fun doThing(): String {\n    // TODO: implement\n    throw NotImplementedError()\n  }\n}',
    );

    // Write a spec file
    writeFileSync(
      join(tmpDir, 'spec.yaml'),
      'apiVersion: "1.0"\nkind: test\nmetadata:\n  name: foo\nspec:\n  name: Foo',
    );

    // Write manifest
    writeManifest(tmpDir, {
      generatedAt: '2026-01-01',
      engine: '0.1.0',
      bundles: { test: '0.1.0' },
      files: {
        'src/domain/FooService.kt': {
          hash: 'abc',
          bundle: 'test',
          overwrite: true,
          specFile: 'spec.yaml',
        },
        'src/domain/DefaultFooService.kt': {
          hash: 'def',
          bundle: 'test',
          overwrite: false,
          specFile: 'spec.yaml',
        },
      },
    });

    // Mock LLM response
    const enrichedCode =
      'class DefaultFooService : FooService {\n  override fun doThing(): String {\n    return "Hello from Foo"\n  }\n}';
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
      force: true, // skip git check in test
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
