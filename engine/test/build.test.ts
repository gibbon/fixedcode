import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let specDir: string;
let outputDir: string;

beforeEach(() => {
  specDir = mkdtempSync(join(tmpdir(), 'build-spec-'));
  outputDir = mkdtempSync(join(tmpdir(), 'build-out-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(specDir, { recursive: true, force: true });
  rmSync(outputDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.doUnmock('../src/engine/pipeline.js');
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function writeSpec(dir: string, filename: string, kind: string): string {
  const path = join(dir, filename);
  writeFileSync(
    path,
    `apiVersion: "1.0"\nkind: ${kind}\nmetadata:\n  name: test\nspec: {}`,
    'utf-8',
  );
  return path;
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('build — error handling', () => {
  it('throws when no spec files found in directory', async () => {
    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockResolvedValue({ files: [] }),
    }));

    const { build } = await import('../src/engine/build.js');

    await expect(build({ specDir, outputDir })).rejects.toThrow(/No spec files found/);
  });
});

// ---------------------------------------------------------------------------
// Ordering: library specs before domain specs
// ---------------------------------------------------------------------------

describe('build — spec ordering', () => {
  it('processes library specs before domain specs', async () => {
    const callOrder: string[] = [];

    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockImplementation((specPath: string) => {
        callOrder.push(specPath as string);
        return Promise.resolve({ files: [] });
      }),
    }));

    // Write domain spec first so filesystem order would put it first
    writeSpec(specDir, 'domain-spec.yaml', 'spring-domain');
    writeSpec(specDir, 'library-spec.yaml', 'spring-library');

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir });

    expect(callOrder).toHaveLength(2);
    // Library spec must be called first
    expect(callOrder[0]).toContain('library-spec.yaml');
    expect(callOrder[1]).toContain('domain-spec.yaml');
  });
});

// ---------------------------------------------------------------------------
// configPath forwarding
// ---------------------------------------------------------------------------

describe('build — configPath forwarding', () => {
  it('forwards configPath to generate() when provided', async () => {
    const generateMock = vi.fn().mockResolvedValue({ files: [] });

    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: generateMock,
    }));

    writeSpec(specDir, 'test-spec.yaml', 'spring-domain');

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir, configPath: '/custom/config.yaml' });

    expect(generateMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ configPath: '/custom/config.yaml' }),
    );
  });
});

// ---------------------------------------------------------------------------
// Dotfile skipping
// ---------------------------------------------------------------------------

describe('build — dotfile skipping', () => {
  it('skips files starting with a dot', async () => {
    const generateMock = vi.fn().mockResolvedValue({ files: [] });

    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: generateMock,
    }));

    // Write a hidden dotfile YAML that should be ignored
    writeFileSync(
      join(specDir, '.hidden.yaml'),
      `apiVersion: "1.0"\nkind: spring-domain\nmetadata:\n  name: hidden\nspec: {}`,
      'utf-8',
    );
    // Write a real spec that should be processed
    writeSpec(specDir, 'real-spec.yaml', 'spring-domain');

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir });

    // generate() should only be called once (for real-spec.yaml)
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(generateMock).toHaveBeenCalledWith(
      expect.stringContaining('real-spec.yaml'),
      expect.any(Object),
    );
  });
});

// ---------------------------------------------------------------------------
// Migration consolidation
// ---------------------------------------------------------------------------

describe('build — migration consolidation', () => {
  it('consolidates multiple V001 migrations into a single V002 file', async () => {
    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockResolvedValue({ files: [] }),
    }));

    writeSpec(specDir, 'domain-spec.yaml', 'spring-domain');

    // Pre-create migration dir and V001 files
    const migDir = join(outputDir, 'src', 'main', 'resources', 'db', 'migration');
    mkdirSync(migDir, { recursive: true });

    writeFileSync(
      join(migDir, 'V001__create_workspace_table.sql'),
      [
        '-- workspace table',
        'CREATE TABLE workspace (id UUID PRIMARY KEY);',
        'ALTER TABLE workspace ADD CONSTRAINT fk_workspace_owner FOREIGN KEY (owner_id) REFERENCES owners(id);',
      ].join('\n') + '\n',
      'utf-8',
    );

    writeFileSync(
      join(migDir, 'V001__create_party_table.sql'),
      ['-- party table', 'CREATE TABLE party (id UUID PRIMARY KEY);'].join('\n') + '\n',
      'utf-8',
    );

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir });

    const v002Path = join(migDir, 'V002__create_all_aggregate_tables.sql');
    expect(existsSync(v002Path)).toBe(true);

    const content = readFileSync(v002Path, 'utf-8');
    expect(content).toContain('CREATE TABLE workspace');
    expect(content).toContain('CREATE TABLE party');
    expect(content).toContain(
      'ALTER TABLE workspace ADD CONSTRAINT fk_workspace_owner FOREIGN KEY',
    );
  });

  it('moves FK constraints after CREATE TABLE statements', async () => {
    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockResolvedValue({ files: [] }),
    }));

    writeSpec(specDir, 'domain-spec.yaml', 'spring-domain');

    const migDir = join(outputDir, 'src', 'main', 'resources', 'db', 'migration');
    mkdirSync(migDir, { recursive: true });

    // Both files have FK constraints mixed in with CREATE TABLE
    writeFileSync(
      join(migDir, 'V001__create_alpha_table.sql'),
      'CREATE TABLE alpha (id UUID PRIMARY KEY);\nALTER TABLE alpha ADD CONSTRAINT fk_alpha FOREIGN KEY (beta_id) REFERENCES beta(id);\n',
      'utf-8',
    );

    writeFileSync(
      join(migDir, 'V001__create_beta_table.sql'),
      'CREATE TABLE beta (id UUID PRIMARY KEY);\n',
      'utf-8',
    );

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir });

    const v002Path = join(migDir, 'V002__create_all_aggregate_tables.sql');
    const content = readFileSync(v002Path, 'utf-8');

    // FK constraint must appear after CREATE TABLE lines
    const createAlphaPos = content.indexOf('CREATE TABLE alpha');
    const createBetaPos = content.indexOf('CREATE TABLE beta');
    const fkPos = content.indexOf('ALTER TABLE alpha ADD CONSTRAINT');

    expect(createAlphaPos).toBeGreaterThan(-1);
    expect(createBetaPos).toBeGreaterThan(-1);
    expect(fkPos).toBeGreaterThan(-1);

    // FK must come after both CREATE TABLE statements
    expect(fkPos).toBeGreaterThan(createAlphaPos);
    expect(fkPos).toBeGreaterThan(createBetaPos);
  });

  it('does not create V002 when there is only one V001 file', async () => {
    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockResolvedValue({ files: [] }),
    }));

    writeSpec(specDir, 'domain-spec.yaml', 'spring-domain');

    const migDir = join(outputDir, 'src', 'main', 'resources', 'db', 'migration');
    mkdirSync(migDir, { recursive: true });

    writeFileSync(
      join(migDir, 'V001__create_workspace_table.sql'),
      'CREATE TABLE workspace (id UUID PRIMARY KEY);\n',
      'utf-8',
    );

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir });

    const v002Path = join(migDir, 'V002__create_all_aggregate_tables.sql');
    expect(existsSync(v002Path)).toBe(false);
  });

  it('skips migration consolidation in dryRun mode', async () => {
    vi.resetModules();
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockResolvedValue({ files: [] }),
    }));

    writeSpec(specDir, 'domain-spec.yaml', 'spring-domain');

    const migDir = join(outputDir, 'src', 'main', 'resources', 'db', 'migration');
    mkdirSync(migDir, { recursive: true });

    writeFileSync(
      join(migDir, 'V001__create_alpha_table.sql'),
      'CREATE TABLE alpha (id UUID PRIMARY KEY);\n',
      'utf-8',
    );
    writeFileSync(
      join(migDir, 'V001__create_beta_table.sql'),
      'CREATE TABLE beta (id UUID PRIMARY KEY);\n',
      'utf-8',
    );

    const { build } = await import('../src/engine/build.js');

    await build({ specDir, outputDir, dryRun: true });

    const v002Path = join(migDir, 'V002__create_all_aggregate_tables.sql');
    expect(existsSync(v002Path)).toBe(false);
  });
});
