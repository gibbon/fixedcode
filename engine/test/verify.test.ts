import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/engine/verify.js';
import { writeManifest, type Manifest } from '../src/engine/manifest.js';

let outputDir: string;
let specPath: string;

beforeEach(() => {
  outputDir = mkdtempSync(join(tmpdir(), 'verify-test-'));
  specPath = join(outputDir, 'spec.json');
});

afterEach(() => {
  rmSync(outputDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeSpec(kind: string, extra: Record<string, unknown> = {}): void {
  const spec = {
    apiVersion: '1.0',
    kind,
    metadata: { name: 'test-service' },
    spec: {},
    ...extra,
  };
  writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
}

function makeManifest(files: Manifest['files']): Manifest {
  return {
    generatedAt: '2026-04-08T00:00:00.000Z',
    engine: '1.0.0',
    bundles: {},
    files,
  };
}

function touchFile(relPath: string): void {
  const abs = join(outputDir, relPath);
  mkdirSync(abs.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(abs, '// generated', 'utf-8');
}

// ---------------------------------------------------------------------------
// Verify with manifest — all files present
// ---------------------------------------------------------------------------

describe('verify with manifest — all files exist', () => {
  it('passes when all manifest files are present on disk', () => {
    writeSpec('spring-domain');

    touchFile('src/main/kotlin/com/example/domain/Workspace.kt');
    touchFile('src/main/kotlin/com/example/application/WorkspaceCommandService.kt');

    writeManifest(
      outputDir,
      makeManifest({
        'src/main/kotlin/com/example/domain/Workspace.kt': {
          hash: 'aaa',
          bundle: 'spring-domain',
          overwrite: true,
        },
        'src/main/kotlin/com/example/application/WorkspaceCommandService.kt': {
          hash: 'bbb',
          bundle: 'spring-domain',
          overwrite: true,
        },
      }),
    );

    const result = verify({ specPath, outputDir });

    expect(result.passed).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.total).toBe(2);
    expect(result.checks).toHaveLength(2);
    expect(result.checks.every(c => c.exists)).toBe(true);
  });

  it('exposes the category for each check entry', () => {
    writeSpec('spring-domain');
    touchFile('src/Generated.kt');
    touchFile('src/DefaultExtension.kt');

    writeManifest(
      outputDir,
      makeManifest({
        'src/Generated.kt': { hash: 'a', bundle: 'spring-domain', overwrite: true },
        'src/DefaultExtension.kt': { hash: 'b', bundle: 'spring-domain', overwrite: false },
      }),
    );

    const result = verify({ specPath, outputDir });

    const generated = result.checks.find(c => c.file === 'src/Generated.kt');
    const ext = result.checks.find(c => c.file === 'src/DefaultExtension.kt');

    expect(generated?.category).toBe('generated');
    expect(ext?.category).toBe('extension-point');
  });
});

// ---------------------------------------------------------------------------
// Verify with manifest — missing files
// ---------------------------------------------------------------------------

describe('verify with manifest — missing files', () => {
  it('fails when a manifest file is missing from disk', () => {
    writeSpec('spring-domain');

    // Only write one of the two files on disk
    touchFile('src/main/kotlin/com/example/domain/Workspace.kt');

    writeManifest(
      outputDir,
      makeManifest({
        'src/main/kotlin/com/example/domain/Workspace.kt': {
          hash: 'aaa',
          bundle: 'spring-domain',
          overwrite: true,
        },
        'src/main/kotlin/com/example/application/WorkspaceCommandService.kt': {
          hash: 'bbb',
          bundle: 'spring-domain',
          overwrite: true,
        },
      }),
    );

    const result = verify({ specPath, outputDir });

    expect(result.passed).toBe(false);
    expect(result.missing).toContain(
      'src/main/kotlin/com/example/application/WorkspaceCommandService.kt',
    );
    expect(result.missing).toHaveLength(1);
  });

  it('reports all missing files in the missing array', () => {
    writeSpec('spring-domain');

    // Do NOT touch any files on disk

    writeManifest(
      outputDir,
      makeManifest({
        'src/main/kotlin/Foo.kt': { hash: 'a', bundle: 'spring-domain', overwrite: true },
        'src/main/kotlin/Bar.kt': { hash: 'b', bundle: 'spring-domain', overwrite: true },
        'src/main/kotlin/Baz.kt': { hash: 'c', bundle: 'spring-domain', overwrite: true },
      }),
    );

    const result = verify({ specPath, outputDir });

    expect(result.passed).toBe(false);
    expect(result.missing).toHaveLength(3);
    expect(result.total).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Verify with manifest — kind filtering
// ---------------------------------------------------------------------------

describe('verify with manifest — kind filtering', () => {
  it('only checks files whose bundle matches the spec kind', () => {
    writeSpec('spring-domain');

    // Only create the spring-domain file on disk
    touchFile('src/domain/Workspace.kt');

    writeManifest(
      outputDir,
      makeManifest({
        'src/domain/Workspace.kt': {
          hash: 'aaa',
          bundle: 'spring-domain',
          overwrite: true,
        },
        // This file belongs to a different bundle — should be ignored
        'build.gradle.kts': {
          hash: 'bbb',
          bundle: 'spring-library',
          overwrite: true,
        },
      }),
    );

    const result = verify({ specPath, outputDir });

    // spring-library file not on disk but should not be checked
    expect(result.passed).toBe(true);
    expect(result.total).toBe(1);
    expect(result.checks.map(c => c.file)).toEqual(['src/domain/Workspace.kt']);
  });
});

// ---------------------------------------------------------------------------
// Verify without manifest — spring-library fallback
// ---------------------------------------------------------------------------

describe('verify without manifest — spring-library fallback', () => {
  const LIBRARY_FILES = [
    'build.gradle.kts',
    'settings.gradle.kts',
    'gradle.properties',
    'gradlew',
    'docker-compose.yml',
    'src/main/resources/application.yml',
    'src/main/resources/logback-spring.xml',
  ];

  it('passes when all expected spring-library files exist', () => {
    writeSpec('spring-library');

    for (const f of LIBRARY_FILES) {
      touchFile(f);
    }

    const result = verify({ specPath, outputDir });

    expect(result.passed).toBe(true);
    expect(result.total).toBe(7);
    expect(result.missing).toEqual([]);
  });

  it('fails when some spring-library files are absent', () => {
    writeSpec('spring-library');

    // Only create a subset of the required files
    touchFile('build.gradle.kts');
    touchFile('settings.gradle.kts');

    const result = verify({ specPath, outputDir });

    expect(result.passed).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('checks exactly 7 files for spring-library', () => {
    writeSpec('spring-library');

    // Create all library files so we can count the checks
    for (const f of LIBRARY_FILES) {
      touchFile(f);
    }

    const result = verify({ specPath, outputDir });

    expect(result.total).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Verify without manifest — unknown kind warning
// ---------------------------------------------------------------------------

describe('verify without manifest — unknown bundle kind', () => {
  it('logs a console.warn containing the kind name when no manifest and no rules exist', () => {
    writeSpec('my-custom-bundle');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = verify({ specPath, outputDir });

    expect(warnSpy).toHaveBeenCalledOnce();
    const warnMsg: string = warnSpy.mock.calls[0][0] as string;
    expect(warnMsg).toContain('my-custom-bundle');

    // No checks performed — unknown kind
    expect(result.total).toBe(0);
    expect(result.passed).toBe(true); // no missing files means "passed"
  });
});
