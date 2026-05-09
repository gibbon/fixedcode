import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  validateSaasVerticalName,
  buildSaasVerticalScaffold,
  createInitCommand,
} from '../src/cli/init.js';

describe('validateSaasVerticalName', () => {
  it('accepts kebab-case names', () => {
    expect(() => validateSaasVerticalName('jobs')).not.toThrow();
    expect(() => validateSaasVerticalName('my-vertical')).not.toThrow();
    expect(() => validateSaasVerticalName('jobs2024')).not.toThrow();
  });

  it('rejects empty', () => {
    expect(() => validateSaasVerticalName('')).toThrow(/empty/i);
  });

  it('rejects names starting with a digit', () => {
    expect(() => validateSaasVerticalName('2jobs')).toThrow(/invalid/i);
  });

  it('rejects names with uppercase letters', () => {
    expect(() => validateSaasVerticalName('Jobs')).toThrow(/invalid/i);
  });

  it('rejects names with underscores', () => {
    expect(() => validateSaasVerticalName('my_vertical')).toThrow(/invalid/i);
  });

  it('rejects names with slashes (path traversal guard)', () => {
    expect(() => validateSaasVerticalName('../evil')).toThrow(/invalid/i);
    expect(() => validateSaasVerticalName('a/b')).toThrow(/invalid/i);
  });
});

describe('buildSaasVerticalScaffold', () => {
  it('produces a stable file list with the expected paths', () => {
    const { files } = buildSaasVerticalScaffold('jobs');
    const paths = files.map((f) => f.path).sort();
    expect(paths).toEqual([
      '.fixedcode.yaml',
      'README.md',
      'specs/jobs-app.yaml',
      'specs/jobs-bff.yaml',
      'specs/jobs-domain.yaml',
      'specs/jobs-marketing.yaml',
    ]);
  });

  it('derives brand and package names from the kebab-case input', () => {
    const { scaffold } = buildSaasVerticalScaffold('find-jobs');
    expect(scaffold.brandName).toBe('FindJobs');
    expect(scaffold.flatName).toBe('findjobs');
    expect(scaffold.packageName).toBe('com.example.findjobs');
  });

  it('emits valid YAML for every spec file', () => {
    const { files } = buildSaasVerticalScaffold('jobs');
    const specs = files.filter((f) => f.path.endsWith('.yaml'));
    expect(specs).toHaveLength(5); // 4 specs + .fixedcode.yaml
    for (const spec of specs) {
      expect(() => parseYaml(spec.content)).not.toThrow();
    }
  });

  it('cross-wires the BFF spec to the domain spec via service entry', () => {
    const { files } = buildSaasVerticalScaffold('jobs');
    const bff = files.find((f) => f.path === 'specs/jobs-bff.yaml')!;
    const parsed = parseYaml(bff.content) as {
      spec: { services: Array<{ name: string }> };
    };
    expect(parsed.spec.services.some((s) => s.name === 'jobs-domain')).toBe(true);
  });

  it('points the admin-screen recipe at the domain spec path', () => {
    const { files } = buildSaasVerticalScaffold('jobs');
    const app = files.find((f) => f.path === 'specs/jobs-app.yaml')!;
    const parsed = parseYaml(app.content) as {
      spec: { adminScreen: { domainSpec: string }; recipes: string[] };
    };
    expect(parsed.spec.adminScreen.domainSpec).toBe('specs/jobs-domain.yaml');
    expect(parsed.spec.recipes).toEqual(
      expect.arrayContaining(['admin-screen', 'users-management', 'dashboard', 'image-upload']),
    );
  });

  it('includes the pricing-page recipe with three sample tiers in the marketing spec', () => {
    const { files } = buildSaasVerticalScaffold('jobs');
    const marketing = files.find((f) => f.path === 'specs/jobs-marketing.yaml')!;
    const parsed = parseYaml(marketing.content) as {
      spec: { recipes: string[]; pricing: { tiers: Array<{ name: string }> } };
    };
    expect(parsed.spec.recipes).toContain('pricing-page');
    expect(parsed.spec.pricing.tiers).toHaveLength(3);
  });

  it('does not include any banned private-name references', () => {
    const { files } = buildSaasVerticalScaffold('jobs');
    const blob = files.map((f) => f.content).join('\n');
    expect(blob.toLowerCase()).not.toContain('example');
    expect(blob.toLowerCase()).not.toContain(' gap ');
    expect(blob.toLowerCase()).not.toContain('supabase');
  });

  it('rejects invalid names', () => {
    expect(() => buildSaasVerticalScaffold('Bad-Name')).toThrow(/invalid/i);
  });
});

describe('init saas-vertical CLI sub-command', () => {
  let tmpDir: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'init-saas-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code ?? 0}`);
    }) as never);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('happy path: creates the directory tree with all expected files', async () => {
    const cmd = createInitCommand();
    await cmd.parseAsync(['saas-vertical', 'demo-vertical', '-o', tmpDir], {
      from: 'user',
    });

    const root = join(tmpDir, 'demo-vertical');
    expect(existsSync(root)).toBe(true);
    expect(existsSync(join(root, '.fixedcode.yaml'))).toBe(true);
    expect(existsSync(join(root, 'README.md'))).toBe(true);
    expect(existsSync(join(root, 'specs', 'demo-vertical-domain.yaml'))).toBe(true);
    expect(existsSync(join(root, 'specs', 'demo-vertical-bff.yaml'))).toBe(true);
    expect(existsSync(join(root, 'specs', 'demo-vertical-app.yaml'))).toBe(true);
    expect(existsSync(join(root, 'specs', 'demo-vertical-marketing.yaml'))).toBe(true);

    // Spec files round-trip through the YAML parser.
    const domain = readFileSync(join(root, 'specs', 'demo-vertical-domain.yaml'), 'utf-8');
    expect(() => parseYaml(domain)).not.toThrow();
  });

  it('rejects an invalid (non-kebab-case) name', async () => {
    const cmd = createInitCommand();
    // Commander wraps action errors and re-throws after exiting; the test
    // mock turns that exit into a throw. We just want to confirm it bailed.
    await expect(
      cmd.parseAsync(['saas-vertical', 'Bad_Name', '-o', tmpDir], { from: 'user' }),
    ).rejects.toThrow(/invalid/i);
  });

  it('rejects when the target directory already exists', async () => {
    mkdirSync(join(tmpDir, 'jobs'));
    const cmd = createInitCommand();
    await expect(
      cmd.parseAsync(['saas-vertical', 'jobs', '-o', tmpDir], { from: 'user' }),
    ).rejects.toThrow(/process\.exit:1/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
