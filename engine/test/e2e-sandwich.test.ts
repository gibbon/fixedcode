/**
 * End-to-end AI Sandwich test: draft → generate → enrich
 *
 * Uses the real spring-domain bundle with a mocked LLM.
 * The mock returns the actual example spec (for draft) and a simple
 * implementation (for enrich), proving the full pipeline works.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { draft } from '../src/engine/draft.js';
import { generate } from '../src/engine/pipeline.js';
import { enrich } from '../src/engine/enrich.js';
import { readManifest } from '../src/engine/manifest.js';
import { mkdtempSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SPRING_DOMAIN_BUNDLE = resolve(process.cwd(), '..', 'bundles', 'spring-domain');
const SPRING_DOMAIN_BUILT = join(SPRING_DOMAIN_BUNDLE, 'dist', 'index.js');

// Skip entire suite if spring-domain isn't built
const canRun = existsSync(SPRING_DOMAIN_BUILT);

describe.skipIf(!canRun)('e2e AI sandwich: draft → generate → enrich', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let tmpDir: string;
  const configPath = resolve(process.cwd(), '..', '.fixedcode.yaml');

  // The example spec that we know works with spring-domain
  const exampleSpec = readFileSync(
    join(SPRING_DOMAIN_BUNDLE, 'examples', 'workspace-domain.yaml'),
    'utf-8'
  );

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    tmpDir = mkdtempSync(join(tmpdir(), 'sandwich-e2e-'));

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

  it('full pipeline: draft spec → generate code → enrich extension points', async () => {
    const specPath = join(tmpDir, 'workspace-domain.yaml');
    const buildDir = join(tmpDir, 'build');

    // --- Step 1: Draft ---
    // Mock LLM returns the known-good example spec
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: exampleSpec } }],
      }),
    });

    const yamlResult = await draft({
      kind: 'spring-domain',
      description: 'workspace service with workspaces and parties',
      output: specPath,
      configPath,
      retry: false,
    });

    expect(yamlResult).toContain('boundedContext');
    expect(yamlResult).toContain('Workspace');
    expect(existsSync(specPath)).toBe(true);

    // --- Step 2: Generate ---
    // No LLM needed — this is deterministic
    vi.unstubAllGlobals(); // generate doesn't use fetch

    await generate(specPath, {
      outputDir: buildDir,
      configPath,
    });

    // Verify files were generated
    const manifest = readManifest(buildDir);
    expect(manifest).not.toBeNull();

    const allFiles = Object.keys(manifest!.files);
    expect(allFiles.length).toBeGreaterThan(15);

    // Check key files exist
    const hasAggregate = allFiles.some(f => f.includes('Workspace.kt'));
    const hasCommands = allFiles.some(f => f.includes('CreateWorkspaceCommand.kt'));
    const hasApi = allFiles.some(f => f.includes('WorkspaceApiDelegateImpl.kt'));
    const hasTest = allFiles.some(f => f.includes('WorkspaceTest.kt'));
    expect(hasAggregate).toBe(true);
    expect(hasCommands).toBe(true);
    expect(hasApi).toBe(true);
    expect(hasTest).toBe(true);

    // Verify extension points exist
    const extensionPoints = allFiles.filter(f => !manifest!.files[f].overwrite);
    expect(extensionPoints.length).toBeGreaterThan(0);
    expect(extensionPoints.some(f => f.includes('DefaultWorkspaceBusinessService'))).toBe(true);
    expect(extensionPoints.some(f => f.includes('DefaultWorkspaceValidator'))).toBe(true);

    // Verify specFile is tracked in manifest entries
    for (const ep of extensionPoints) {
      expect(manifest!.files[ep].specFile).toBeDefined();
    }

    // --- Step 3: Enrich ---
    // Mock LLM returns a simple implementation for each extension point
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    process.env.FIXEDCODE_LLM_PROVIDER = 'openrouter';
    process.env.FIXEDCODE_LLM_MODEL = 'test-model';
    process.env.FIXEDCODE_LLM_API_KEY = 'test-key';

    fetchSpy.mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '// AI-enriched business logic\nclass Implemented {}' } }],
        }),
      };
    });

    const enrichResult = await enrich({
      outputDir: buildDir,
      force: true, // skip git check in test
    });

    // Every extension point should have been enriched
    expect(enrichResult.enriched.length).toBe(extensionPoints.length);
    expect(enrichResult.errors).toHaveLength(0);
    expect(enrichResult.skipped).toHaveLength(0);

    // Verify files were actually written
    for (const ep of enrichResult.enriched) {
      const content = readFileSync(join(buildDir, ep), 'utf-8');
      expect(content).toContain('AI-enriched');
    }
  });
});
