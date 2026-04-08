import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  hashContent,
  readManifest,
  writeManifest,
  shouldWrite,
  loadIgnorePatterns,
  isIgnored,
  type Manifest,
} from '../src/engine/manifest.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'manifest-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// hashContent
// ---------------------------------------------------------------------------

describe('hashContent', () => {
  it('returns a 16-char hex string', () => {
    const h = hashContent('hello world');
    expect(h).toHaveLength(16);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });

  it('is deterministic — same input, same output', () => {
    expect(hashContent('abc')).toBe(hashContent('abc'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashContent('foo')).not.toBe(hashContent('bar'));
  });
});

// ---------------------------------------------------------------------------
// readManifest / writeManifest
// ---------------------------------------------------------------------------

describe('readManifest', () => {
  it('returns null when no manifest file exists', () => {
    expect(readManifest(tmpDir)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    writeFileSync(join(tmpDir, '.fixedcode-manifest.json'), 'not json');
    expect(readManifest(tmpDir)).toBeNull();
  });
});

describe('writeManifest / readManifest round-trip', () => {
  it('round-trips a manifest correctly', () => {
    const manifest: Manifest = {
      generatedAt: '2026-04-08T00:00:00.000Z',
      engine: '1.0.0',
      bundles: { 'spring-domain': '1.2.3' },
      files: {
        'src/Foo.kt': {
          hash: 'abc123',
          bundle: 'spring-domain',
          overwrite: true,
          specFile: 'foo-domain.yaml',
        },
        'src/DefaultFooBusinessService.kt': {
          hash: 'def456',
          bundle: 'spring-domain',
          overwrite: false,
        },
      },
    };

    writeManifest(tmpDir, manifest);
    const read = readManifest(tmpDir);

    expect(read).toEqual(manifest);
  });

  it('creates the output directory if it does not exist', () => {
    const nestedDir = join(tmpDir, 'a', 'b', 'c');
    const manifest: Manifest = {
      generatedAt: '2026-04-08T00:00:00.000Z',
      engine: '1.0.0',
      bundles: {},
      files: {},
    };
    writeManifest(nestedDir, manifest);
    expect(readManifest(nestedDir)).toEqual(manifest);
  });
});

// ---------------------------------------------------------------------------
// shouldWrite
// ---------------------------------------------------------------------------

describe('shouldWrite', () => {
  const makeManifest = (files: Manifest['files'] = {}): Manifest => ({
    generatedAt: '2026-04-08T00:00:00.000Z',
    engine: '1.0.0',
    bundles: {},
    files,
  });

  it("returns 'write' when the file does not exist", () => {
    const result = shouldWrite('src/NewFile.kt', true, tmpDir, null);
    expect(result).toBe('write');
  });

  it("returns 'skip' when file exists and overwrite is false", () => {
    writeFileSync(join(tmpDir, 'Extension.kt'), 'user code');
    const result = shouldWrite('Extension.kt', false, tmpDir, makeManifest());
    expect(result).toBe('skip');
  });

  it("returns 'write' when file exists, overwrite true, and manifest has an entry", () => {
    writeFileSync(join(tmpDir, 'Generated.kt'), 'generated');
    const manifest = makeManifest({
      'Generated.kt': { hash: 'aabbcc', bundle: 'spring-domain', overwrite: true },
    });
    const result = shouldWrite('Generated.kt', true, tmpDir, manifest);
    expect(result).toBe('write');
  });

  it("returns 'warn-overwrite' when file exists, overwrite true, manifest exists but has no entry for the file", () => {
    writeFileSync(join(tmpDir, 'Unknown.kt'), 'user-created');
    const manifest = makeManifest(); // empty files
    const result = shouldWrite('Unknown.kt', true, tmpDir, manifest);
    expect(result).toBe('warn-overwrite');
  });

  it("returns 'write' when file exists, overwrite true, and no manifest at all", () => {
    writeFileSync(join(tmpDir, 'AnyFile.kt'), 'content');
    const result = shouldWrite('AnyFile.kt', true, tmpDir, null);
    expect(result).toBe('write');
  });
});

// ---------------------------------------------------------------------------
// loadIgnorePatterns
// ---------------------------------------------------------------------------

describe('loadIgnorePatterns', () => {
  it('returns empty array when no .fixedcodeignore exists', () => {
    expect(loadIgnorePatterns(tmpDir)).toEqual([]);
  });

  it('reads patterns and skips comments and blank lines', () => {
    writeFileSync(
      join(tmpDir, '.fixedcodeignore'),
      [
        '# this is a comment',
        '',
        '*.log',
        '  # indented comment',
        'build/**',
        '',
        'secrets.yaml',
      ].join('\n'),
    );
    const patterns = loadIgnorePatterns(tmpDir);
    expect(patterns).toEqual(['*.log', 'build/**', 'secrets.yaml']);
  });

  it('handles a file with only comments and blanks', () => {
    writeFileSync(join(tmpDir, '.fixedcodeignore'), '# comment\n\n# another\n');
    expect(loadIgnorePatterns(tmpDir)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isIgnored
// ---------------------------------------------------------------------------

describe('isIgnored', () => {
  it('matches a simple glob pattern (*.log)', () => {
    expect(isIgnored('app.log', ['*.log'])).toBe(true);
  });

  it('does not match a different extension with *.log', () => {
    expect(isIgnored('app.kt', ['*.log'])).toBe(false);
  });

  it('matches ** for any depth', () => {
    expect(isIgnored('build/classes/Foo.class', ['build/**'])).toBe(true);
  });

  it('matches a deeply nested path with **', () => {
    expect(isIgnored('src/main/kotlin/com/example/Foo.kt', ['src/**'])).toBe(true);
  });

  it('returns false when no patterns match', () => {
    expect(isIgnored('src/main/Foo.kt', ['*.log', 'build/**'])).toBe(false);
  });

  it('returns false for empty patterns array', () => {
    expect(isIgnored('anything.kt', [])).toBe(false);
  });

  it('matches an exact filename pattern', () => {
    expect(isIgnored('secrets.yaml', ['secrets.yaml'])).toBe(true);
  });
});
