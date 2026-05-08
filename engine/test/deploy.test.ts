import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deploy } from '../src/engine/deploy.js';

let buildDir: string;
let targetDir: string;

beforeEach(() => {
  buildDir = mkdtempSync(join(tmpdir(), 'deploy-build-'));
  targetDir = mkdtempSync(join(tmpdir(), 'deploy-target-'));
});

afterEach(() => {
  rmSync(buildDir, { recursive: true, force: true });
  rmSync(targetDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Basic file copy
// ---------------------------------------------------------------------------

describe('deploy — basic file copy', () => {
  it('copies files from build to target', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'src', 'main'), { recursive: true });
    writeFileSync(join(buildDir, 'src', 'main', 'App.kt'), 'class App {}');
    writeFileSync(join(buildDir, 'README.md'), '# Hello');

    const result = deploy({ buildDir, targetDir });

    expect(result.filesCopied).toBe(2);
    expect(result.filesSkipped).toBe(0);
    expect(result.targetDir).toBe(targetDir);

    expect(existsSync(join(targetDir, 'src', 'main', 'App.kt'))).toBe(true);
    expect(existsSync(join(targetDir, 'README.md'))).toBe(true);
  });

  it('preserves file content exactly', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const content = 'data class Foo(val id: String)';
    writeFileSync(join(buildDir, 'Foo.kt'), content);

    deploy({ buildDir, targetDir });

    expect(readFileSync(join(targetDir, 'Foo.kt'), 'utf8')).toBe(content);
  });

  it('creates nested target directories as needed', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'a', 'b', 'c'), { recursive: true });
    writeFileSync(join(buildDir, 'a', 'b', 'c', 'deep.txt'), 'deep');

    deploy({ buildDir, targetDir });

    expect(existsSync(join(targetDir, 'a', 'b', 'c', 'deep.txt'))).toBe(true);
  });

  it('returns the resolved targetDir path', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    writeFileSync(join(buildDir, 'file.txt'), 'x');

    const result = deploy({ buildDir, targetDir });

    expect(result.targetDir).toBe(targetDir);
  });
});

// ---------------------------------------------------------------------------
// Migration skip logic
// ---------------------------------------------------------------------------

describe('deploy — migration skip logic', () => {
  it('skips an existing versioned SQL migration in a migration path', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'db', 'migration'), { recursive: true });
    mkdirSync(join(targetDir, 'db', 'migration'), { recursive: true });

    writeFileSync(join(buildDir, 'db', 'migration', 'V001__init.sql'), 'CREATE TABLE foo;');
    // Target already has this migration
    writeFileSync(join(targetDir, 'db', 'migration', 'V001__init.sql'), 'CREATE TABLE foo;');

    const result = deploy({ buildDir, targetDir });

    expect(result.filesSkipped).toBe(1);
    expect(result.filesCopied).toBe(0);
  });

  it('copies a versioned SQL migration when the target does NOT already have it', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'db', 'migration'), { recursive: true });
    writeFileSync(
      join(buildDir, 'db', 'migration', 'V002__add_col.sql'),
      'ALTER TABLE foo ADD COLUMN bar;',
    );

    const result = deploy({ buildDir, targetDir });

    expect(result.filesCopied).toBe(1);
    expect(result.filesSkipped).toBe(0);
    expect(existsSync(join(targetDir, 'db', 'migration', 'V002__add_col.sql'))).toBe(true);
  });

  it('does NOT skip a versioned SQL file when path does not contain "migration"', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'sql'), { recursive: true });
    mkdirSync(join(targetDir, 'sql'), { recursive: true });

    writeFileSync(join(buildDir, 'sql', 'V001__init.sql'), 'CREATE TABLE foo;');
    writeFileSync(join(targetDir, 'sql', 'V001__init.sql'), 'old content');

    const result = deploy({ buildDir, targetDir });

    expect(result.filesCopied).toBe(1);
    expect(result.filesSkipped).toBe(0);
    // File should be overwritten since the skip rule didn't apply
    expect(readFileSync(join(targetDir, 'sql', 'V001__init.sql'), 'utf8')).toBe(
      'CREATE TABLE foo;',
    );
  });

  it('does NOT skip a .sql file that does not start with V0', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'db', 'migration'), { recursive: true });
    mkdirSync(join(targetDir, 'db', 'migration'), { recursive: true });

    writeFileSync(join(buildDir, 'db', 'migration', 'seed.sql'), 'INSERT INTO foo VALUES (1);');
    writeFileSync(join(targetDir, 'db', 'migration', 'seed.sql'), 'old seed');

    const result = deploy({ buildDir, targetDir });

    expect(result.filesCopied).toBe(1);
    expect(result.filesSkipped).toBe(0);
  });

  it('does NOT skip a non-.sql file in a migration path', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    mkdirSync(join(buildDir, 'db', 'migration'), { recursive: true });
    mkdirSync(join(targetDir, 'db', 'migration'), { recursive: true });

    writeFileSync(join(buildDir, 'db', 'migration', 'V001__init.xml'), '<changelog/>');
    writeFileSync(join(targetDir, 'db', 'migration', 'V001__init.xml'), 'old');

    const result = deploy({ buildDir, targetDir });

    expect(result.filesCopied).toBe(1);
    expect(result.filesSkipped).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Dry run mode
// ---------------------------------------------------------------------------

describe('deploy — dry run mode', () => {
  it('does not write files in dry run mode', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    writeFileSync(join(buildDir, 'App.kt'), 'class App {}');

    deploy({ buildDir, targetDir, dryRun: true });

    expect(existsSync(join(targetDir, 'App.kt'))).toBe(false);
  });

  it('still counts files as copied in dry run mode', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    writeFileSync(join(buildDir, 'App.kt'), 'class App {}');
    writeFileSync(join(buildDir, 'Config.kt'), 'class Config {}');

    const result = deploy({ buildDir, targetDir, dryRun: true });

    expect(result.filesCopied).toBe(2);
    expect(result.filesSkipped).toBe(0);
  });

  it('defaults dryRun to false when not specified', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    writeFileSync(join(buildDir, 'App.kt'), 'class App {}');

    deploy({ buildDir, targetDir });

    expect(existsSync(join(targetDir, 'App.kt'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('deploy — error handling', () => {
  it('throws when build directory does not exist', () => {
    const missingDir = join(tmpdir(), 'nonexistent-build-dir-xyz-12345');

    expect(() => deploy({ buildDir: missingDir, targetDir })).toThrow(/Build directory not found/);
  });
});
