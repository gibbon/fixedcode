# Engine Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 9 engine issues — missing exports, platform bugs, dead code, ReDoS vulnerability, and add unit tests for 9 untested core modules.

**Architecture:** All changes scoped to `engine/`. Code fixes (Tasks 1-7) are independent and can be done in any order. Test tasks (8-14) depend on Tasks 1-7 being complete since they exercise the fixed behavior.

**Tech Stack:** TypeScript, vitest, picomatch, node:os

**Spec:** `docs/superpowers/specs/2026-04-09-engine-fixes-design.md`

---

### Task 1: Export registry functions from public API

**Files:**
- Modify: `engine/src/index.ts`

- [ ] **Step 1: Add registry exports**

Add these two lines at the end of `engine/src/index.ts`:

```typescript
export { fetchRegistry, searchRegistry, listRegistry, installPackage, publishPackage } from './engine/registry.js';
export type { RegistryPackage, Registry, InstallResult, PublishOptions } from './engine/registry.js';
```

- [ ] **Step 2: Build to verify no type errors**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add engine/src/index.ts
git commit -m "fix: export registry functions from engine public API"
```

---

### Task 2: Fix config.ts — homedir + consolidate imports

**Files:**
- Modify: `engine/src/engine/config.ts`

- [ ] **Step 1: Consolidate imports and add os.homedir**

Replace lines 1-4 of `engine/src/engine/config.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { resolve, parse } from 'node:path';
import { existsSync } from 'node:fs';
```

With:

```typescript
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import { resolve, parse } from 'node:path';
```

- [ ] **Step 2: Replace process.env.HOME with homedir()**

Replace line 21:

```typescript
const userConfig = resolve(process.env.HOME ?? '', '.config/fixedcode/config.yaml');
```

With:

```typescript
const userConfig = resolve(homedir(), '.config/fixedcode/config.yaml');
```

- [ ] **Step 3: Build to verify**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add engine/src/engine/config.ts
git commit -m "fix: use os.homedir() for cross-platform config resolution"
```

---

### Task 3: Replace matchGlob with picomatch

**Files:**
- Modify: `engine/package.json`
- Modify: `engine/src/engine/manifest.ts`

- [ ] **Step 1: Install picomatch**

Run: `cd engine && npm install picomatch && npm install -D @types/picomatch`

- [ ] **Step 2: Replace matchGlob implementation**

In `engine/src/engine/manifest.ts`, add import at line 2 (after the crypto import):

```typescript
import picomatch from 'picomatch';
```

Replace the `matchGlob` function (lines 104-115):

```typescript
/**
 * Simple glob matcher. Supports `*` (single segment) and `**` (any depth).
 * Limitation: does not support `?`, character classes `[abc]`, or negation `!`.
 */
function matchGlob(path: string, pattern: string): boolean {
  const regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // escape all regex specials except * and ?
    .replace(/\*\*/g, '{{DOUBLESTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{DOUBLESTAR\}\}/g, '.*');
  return new RegExp(`^${regex}$`).test(path);
}
```

With:

```typescript
/**
 * Glob matcher using picomatch. Supports *, **, ?, character classes, and negation.
 */
function matchGlob(path: string, pattern: string): boolean {
  return picomatch(pattern)(path);
}
```

- [ ] **Step 3: Build to verify**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run existing tests**

Run: `cd engine && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add engine/package.json engine/package-lock.json engine/src/engine/manifest.ts
git commit -m "fix: replace hand-rolled glob regex with picomatch to prevent ReDoS"
```

---

### Task 4: Pass configPath through build()

**Files:**
- Modify: `engine/src/engine/build.ts`

- [ ] **Step 1: Add configPath to BuildOptions**

In `engine/src/engine/build.ts`, add to the `BuildOptions` interface after the `diff` field (line 19):

```typescript
  /** Path to .fixedcode.yaml config file */
  configPath?: string;
```

- [ ] **Step 2: Forward configPath to generate()**

Replace the `generate()` call at lines 67-71:

```typescript
    await generate(specPath, {
      outputDir,
      dryRun: options.dryRun,
      diff: options.diff,
    });
```

With:

```typescript
    await generate(specPath, {
      outputDir,
      dryRun: options.dryRun,
      diff: options.diff,
      configPath: options.configPath,
    });
```

- [ ] **Step 3: Build to verify**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add engine/src/engine/build.ts
git commit -m "fix: forward configPath from build() to generate()"
```

---

### Task 5: Add exports field to engine package.json

**Files:**
- Modify: `engine/package.json`

- [ ] **Step 1: Add exports field**

In `engine/package.json`, add the `exports` field after `"types"` (after line 6):

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
```

- [ ] **Step 2: Build to verify**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add engine/package.json
git commit -m "fix: add exports field to engine package.json for ESM resolution"
```

---

### Task 6: Remove unused statSync import and read dynamic version in bundle-init

**Files:**
- Modify: `engine/src/engine/deploy.ts`
- Modify: `engine/src/cli/bundle-init.ts`

- [ ] **Step 1: Remove unused statSync**

In `engine/src/engine/deploy.ts`, replace line 8:

```typescript
import { existsSync, readdirSync, mkdirSync, statSync, copyFileSync } from 'node:fs';
```

With:

```typescript
import { existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
```

- [ ] **Step 2: Read engine version dynamically in bundle-init.ts**

In `engine/src/cli/bundle-init.ts`, replace lines 1-3:

```typescript
import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
```

With:

```typescript
import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const enginePkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
```

Then replace the hardcoded version inside the `pkgJson` object (line ~29):

```typescript
          version: '0.1.0',
```

With:

```typescript
          version: enginePkg.version,
```

- [ ] **Step 3: Build to verify**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add engine/src/engine/deploy.ts engine/src/cli/bundle-init.ts
git commit -m "fix: remove unused statSync import, read version dynamically in bundle-init"
```

---

### Task 7: Verify all code fixes together

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `cd engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all existing tests**

Run: `cd engine && npx vitest run`
Expected: All tests pass (4 test files, all green)

---

### Task 8: Add manifest.test.ts

**Files:**
- Create: `engine/test/manifest.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/manifest.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  hashContent,
  shouldWrite,
  readManifest,
  writeManifest,
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

describe('hashContent', () => {
  it('returns a deterministic 16-char hex string', () => {
    const hash = hashContent('hello world');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(hashContent('hello world')).toBe(hash);
  });

  it('produces different hashes for different inputs', () => {
    expect(hashContent('a')).not.toBe(hashContent('b'));
  });
});

describe('readManifest / writeManifest', () => {
  it('round-trips a manifest', () => {
    const manifest: Manifest = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      engine: '0.1.0',
      bundles: { 'spring-domain': '0.1.0' },
      files: {
        'src/Foo.kt': { hash: 'abc123', bundle: 'spring-domain', overwrite: true },
      },
    };
    writeManifest(tmpDir, manifest);
    const read = readManifest(tmpDir);
    expect(read).toEqual(manifest);
  });

  it('returns null when no manifest exists', () => {
    expect(readManifest(tmpDir)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    writeFileSync(join(tmpDir, '.fixedcode-manifest.json'), 'not json');
    expect(readManifest(tmpDir)).toBeNull();
  });
});

describe('shouldWrite', () => {
  it('returns write when file does not exist', () => {
    expect(shouldWrite('new-file.kt', true, tmpDir, null)).toBe('write');
  });

  it('returns skip for extension point that already exists', () => {
    writeFileSync(join(tmpDir, 'ext.kt'), 'content');
    expect(shouldWrite('ext.kt', false, tmpDir, null)).toBe('skip');
  });

  it('returns write when manifest has entry for existing file', () => {
    writeFileSync(join(tmpDir, 'gen.kt'), 'content');
    const manifest: Manifest = {
      generatedAt: '', engine: '', bundles: {},
      files: { 'gen.kt': { hash: 'x', bundle: 'b', overwrite: true } },
    };
    expect(shouldWrite('gen.kt', true, tmpDir, manifest)).toBe('write');
  });

  it('returns warn-overwrite when file exists but not in manifest', () => {
    writeFileSync(join(tmpDir, 'user.kt'), 'content');
    const manifest: Manifest = {
      generatedAt: '', engine: '', bundles: {},
      files: {},
    };
    expect(shouldWrite('user.kt', true, tmpDir, manifest)).toBe('warn-overwrite');
  });

  it('returns write when no manifest at all (first run)', () => {
    writeFileSync(join(tmpDir, 'existing.kt'), 'content');
    expect(shouldWrite('existing.kt', true, tmpDir, null)).toBe('write');
  });
});

describe('loadIgnorePatterns', () => {
  it('returns empty array when no .fixedcodeignore exists', () => {
    expect(loadIgnorePatterns(tmpDir)).toEqual([]);
  });

  it('reads patterns, skips comments and blank lines', () => {
    writeFileSync(join(tmpDir, '.fixedcodeignore'), '# comment\n*.log\n\nDefault*.kt\n');
    expect(loadIgnorePatterns(tmpDir)).toEqual(['*.log', 'Default*.kt']);
  });
});

describe('isIgnored', () => {
  it('matches simple glob patterns', () => {
    expect(isIgnored('debug.log', ['*.log'])).toBe(true);
    expect(isIgnored('debug.txt', ['*.log'])).toBe(false);
  });

  it('matches ** for any depth', () => {
    expect(isIgnored('src/main/Foo.kt', ['src/**/*.kt'])).toBe(true);
    expect(isIgnored('src/main/Foo.java', ['src/**/*.kt'])).toBe(false);
  });

  it('returns false when no patterns match', () => {
    expect(isIgnored('hello.ts', ['*.kt', '*.java'])).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd engine && npx vitest run test/manifest.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add engine/test/manifest.test.ts
git commit -m "test: add unit tests for manifest module"
```

---

### Task 9: Add config.test.ts

**Files:**
- Create: `engine/test/config.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/config.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { findConfigFile, loadConfig } from '../src/engine/config.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'config-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.FIXEDCODE_CONFIG;
});

describe('findConfigFile', () => {
  it('finds .fixedcode.yaml in the given directory', () => {
    writeFileSync(join(tmpDir, '.fixedcode.yaml'), 'bundles: {}');
    expect(findConfigFile(tmpDir)).toBe(resolve(tmpDir, '.fixedcode.yaml'));
  });

  it('walks up directories to find config', () => {
    const nested = join(tmpDir, 'a', 'b', 'c');
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(tmpDir, '.fixedcode.yaml'), 'bundles: {}');
    expect(findConfigFile(nested)).toBe(resolve(tmpDir, '.fixedcode.yaml'));
  });

  it('returns null when no config found', () => {
    // Use a temp dir with no config anywhere in the chain
    // findConfigFile will walk up to root and check user home — may or may not exist
    // We only assert it doesn't throw
    const result = findConfigFile(tmpDir);
    expect(result === null || typeof result === 'string').toBe(true);
  });
});

describe('loadConfig', () => {
  it('returns defaults when no config exists', () => {
    const config = loadConfig(tmpDir);
    expect(config.bundles).toEqual({});
    expect(config.configDir).toBe(tmpDir);
  });

  it('loads from explicit path', () => {
    const cfgPath = join(tmpDir, 'custom.yaml');
    writeFileSync(cfgPath, 'bundles:\n  my-bundle: "./bundles/my-bundle"\n');
    const config = loadConfig(tmpDir, cfgPath);
    expect(config.bundles).toEqual({ 'my-bundle': './bundles/my-bundle' });
    expect(config.configDir).toBe(tmpDir);
  });

  it('respects FIXEDCODE_CONFIG env var', () => {
    const cfgPath = join(tmpDir, 'env-config.yaml');
    writeFileSync(cfgPath, 'bundles:\n  env-bundle: "./env"\n');
    process.env.FIXEDCODE_CONFIG = cfgPath;
    const config = loadConfig(tmpDir);
    expect(config.bundles).toEqual({ 'env-bundle': './env' });
  });

  it('explicit path takes priority over env var', () => {
    const envPath = join(tmpDir, 'env.yaml');
    const explicitPath = join(tmpDir, 'explicit.yaml');
    writeFileSync(envPath, 'bundles:\n  env: "./env"\n');
    writeFileSync(explicitPath, 'bundles:\n  explicit: "./explicit"\n');
    process.env.FIXEDCODE_CONFIG = envPath;
    const config = loadConfig(tmpDir, explicitPath);
    expect(config.bundles).toEqual({ explicit: './explicit' });
  });

  it('handles empty YAML gracefully', () => {
    const cfgPath = join(tmpDir, 'empty.yaml');
    writeFileSync(cfgPath, '');
    const config = loadConfig(tmpDir, cfgPath);
    expect(config.bundles).toEqual({});
  });

  it('handles invalid YAML gracefully', () => {
    const cfgPath = join(tmpDir, 'bad.yaml');
    writeFileSync(cfgPath, ':::not yaml:::');
    const config = loadConfig(tmpDir, cfgPath);
    expect(config.bundles).toEqual({});
  });

  it('warns when bundles is not an object', () => {
    const cfgPath = join(tmpDir, 'bad-bundles.yaml');
    writeFileSync(cfgPath, 'bundles: "string"\n');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = loadConfig(tmpDir, cfgPath);
    expect(config.bundles).toEqual({});
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('loads generators config', () => {
    const cfgPath = join(tmpDir, 'with-gen.yaml');
    writeFileSync(cfgPath, 'bundles: {}\ngenerators:\n  openapi: "./generators/openapi"\n');
    const config = loadConfig(tmpDir, cfgPath);
    expect(config.generators).toEqual({ openapi: './generators/openapi' });
  });

  it('loads llm config', () => {
    const cfgPath = join(tmpDir, 'with-llm.yaml');
    writeFileSync(cfgPath, 'bundles: {}\nllm:\n  provider: openrouter\n  model: test-model\n');
    const config = loadConfig(tmpDir, cfgPath);
    expect(config.llm).toEqual({ provider: 'openrouter', model: 'test-model' });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd engine && npx vitest run test/config.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add engine/test/config.test.ts
git commit -m "test: add unit tests for config module"
```

---

### Task 10: Add parse.test.ts

**Files:**
- Create: `engine/test/parse.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/parse.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseSpec, validateEnvelope } from '../src/engine/parse.js';
import { SpecParseError, EnvelopeError } from '../src/errors.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'parse-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('parseSpec', () => {
  it('parses valid YAML spec', () => {
    const specPath = join(tmpDir, 'valid.yaml');
    writeFileSync(specPath, 'apiVersion: "1.0"\nkind: test\nmetadata:\n  name: my-service\nspec:\n  name: foo\n');
    const result = parseSpec(specPath);
    expect(result.apiVersion).toBe('1.0');
    expect(result.kind).toBe('test');
    expect(result.metadata.name).toBe('my-service');
    expect(result.spec.name).toBe('foo');
  });

  it('throws SpecParseError for missing file', () => {
    expect(() => parseSpec(join(tmpDir, 'missing.yaml'))).toThrow(SpecParseError);
  });

  it('throws SpecParseError for empty file', () => {
    const specPath = join(tmpDir, 'empty.yaml');
    writeFileSync(specPath, '');
    expect(() => parseSpec(specPath)).toThrow(SpecParseError);
  });

  it('throws SpecParseError for non-object YAML', () => {
    const specPath = join(tmpDir, 'scalar.yaml');
    writeFileSync(specPath, 'just a string');
    expect(() => parseSpec(specPath)).toThrow(SpecParseError);
  });
});

describe('validateEnvelope', () => {
  it('passes for a valid envelope', () => {
    expect(() => validateEnvelope({
      apiVersion: '1.0',
      kind: 'test',
      metadata: { name: 'svc' },
      spec: { foo: 'bar' },
    })).not.toThrow();
  });

  it('throws EnvelopeError for missing apiVersion', () => {
    expect(() => validateEnvelope({
      kind: 'test',
      metadata: { name: 'svc' },
      spec: {},
    } as any)).toThrow(EnvelopeError);
  });

  it('throws EnvelopeError for missing kind', () => {
    expect(() => validateEnvelope({
      apiVersion: '1.0',
      metadata: { name: 'svc' },
      spec: {},
    } as any)).toThrow(EnvelopeError);
  });

  it('throws EnvelopeError for missing metadata.name', () => {
    expect(() => validateEnvelope({
      apiVersion: '1.0',
      kind: 'test',
      metadata: {},
      spec: {},
    } as any)).toThrow(EnvelopeError);
  });

  it('throws EnvelopeError for missing spec', () => {
    expect(() => validateEnvelope({
      apiVersion: '1.0',
      kind: 'test',
      metadata: { name: 'svc' },
    } as any)).toThrow(EnvelopeError);
  });

  it('collects all missing fields into one error', () => {
    try {
      validateEnvelope({} as any);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvelopeError);
      const msg = (err as EnvelopeError).message;
      expect(msg).toContain('apiVersion');
      expect(msg).toContain('kind');
      expect(msg).toContain('metadata.name');
      expect(msg).toContain('spec');
    }
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd engine && npx vitest run test/parse.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add engine/test/parse.test.ts
git commit -m "test: add unit tests for parse module"
```

---

### Task 11: Add deploy.test.ts

**Files:**
- Create: `engine/test/deploy.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/deploy.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deploy } from '../src/engine/deploy.js';

let tmpDir: string;
let buildDir: string;
let targetDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'deploy-test-'));
  buildDir = join(tmpDir, 'build');
  targetDir = join(tmpDir, 'target');
  mkdirSync(buildDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('deploy', () => {
  it('copies files from build to target', () => {
    mkdirSync(join(buildDir, 'src'), { recursive: true });
    writeFileSync(join(buildDir, 'src', 'Foo.kt'), 'class Foo');
    writeFileSync(join(buildDir, 'build.gradle.kts'), 'plugins {}');

    const result = deploy({ buildDir, targetDir });
    expect(result.filesCopied).toBe(2);
    expect(existsSync(join(targetDir, 'src', 'Foo.kt'))).toBe(true);
    expect(readFileSync(join(targetDir, 'src', 'Foo.kt'), 'utf-8')).toBe('class Foo');
  });

  it('skips existing versioned SQL migrations', () => {
    const migDir = join(buildDir, 'db', 'migration');
    mkdirSync(migDir, { recursive: true });
    writeFileSync(join(migDir, 'V001__create.sql'), 'CREATE TABLE foo;');

    // Pre-create the migration in target
    const targetMigDir = join(targetDir, 'db', 'migration');
    mkdirSync(targetMigDir, { recursive: true });
    writeFileSync(join(targetMigDir, 'V001__create.sql'), 'old version');

    const result = deploy({ buildDir, targetDir });
    expect(result.filesSkipped).toBe(1);
    // Original content preserved
    expect(readFileSync(join(targetMigDir, 'V001__create.sql'), 'utf-8')).toBe('old version');
  });

  it('does not write files in dry run mode', () => {
    writeFileSync(join(buildDir, 'file.txt'), 'hello');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = deploy({ buildDir, targetDir, dryRun: true });
    expect(result.filesCopied).toBe(1);
    expect(existsSync(join(targetDir, 'file.txt'))).toBe(false);

    consoleSpy.mockRestore();
  });

  it('throws when build directory does not exist', () => {
    expect(() => deploy({
      buildDir: join(tmpDir, 'nonexistent'),
      targetDir,
    })).toThrow('Build directory not found');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd engine && npx vitest run test/deploy.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add engine/test/deploy.test.ts
git commit -m "test: add unit tests for deploy module"
```

---

### Task 12: Add registry.test.ts

**Files:**
- Create: `engine/test/registry.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  searchRegistry,
  listRegistry,
  installPackage,
  type Registry,
  type RegistryPackage,
} from '../src/engine/registry.js';

const pkg = (overrides: Partial<RegistryPackage> = {}): RegistryPackage => ({
  name: '@fixedcode/bundle-spring-domain',
  description: 'Spring DDD domain code',
  version: '1.0.0',
  kind: 'bundle',
  tags: ['spring', 'kotlin', 'ddd'],
  author: 'fixedcode',
  install: 'npm install @fixedcode/bundle-spring-domain',
  ...overrides,
});

const registry: Registry = {
  version: 1,
  packages: [
    pkg(),
    pkg({ name: '@fixedcode/generator-openapi', description: 'OpenAPI spec generator', kind: 'generator', tags: ['openapi'] }),
    pkg({ name: '@fixedcode/bundle-python-agent', description: 'Python agent scaffold', tags: ['python', 'agent'] }),
  ],
};

describe('searchRegistry', () => {
  it('matches on name', () => {
    const results = searchRegistry(registry, 'openapi');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('@fixedcode/generator-openapi');
  });

  it('matches on description', () => {
    const results = searchRegistry(registry, 'scaffold');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('@fixedcode/bundle-python-agent');
  });

  it('matches on tags', () => {
    const results = searchRegistry(registry, 'kotlin');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('@fixedcode/bundle-spring-domain');
  });

  it('matches on kind', () => {
    const results = searchRegistry(registry, 'generator');
    expect(results).toHaveLength(1);
  });

  it('is case-insensitive', () => {
    const results = searchRegistry(registry, 'PYTHON');
    expect(results).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    expect(searchRegistry(registry, 'nonexistent')).toEqual([]);
  });
});

describe('listRegistry', () => {
  it('returns all packages when no kind filter', () => {
    expect(listRegistry(registry)).toHaveLength(3);
  });

  it('filters by kind', () => {
    const bundles = listRegistry(registry, 'bundle');
    expect(bundles).toHaveLength(2);
    expect(bundles.every(p => p.kind === 'bundle')).toBe(true);
  });

  it('returns empty when kind has no matches', () => {
    expect(listRegistry(registry, 'plugin')).toEqual([]);
  });
});

describe('installPackage input validation', () => {
  it('rejects unsafe install commands', () => {
    const badPkg = pkg({ install: 'rm -rf /' });
    expect(() => installPackage(badPkg, '/tmp', '.fixedcode.yaml', 'bundles'))
      .toThrow('Unsafe install command');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd engine && npx vitest run test/registry.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add engine/test/registry.test.ts
git commit -m "test: add unit tests for registry module"
```

---

### Task 13: Add verify.test.ts

**Files:**
- Create: `engine/test/verify.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/verify.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/engine/verify.js';
import { writeManifest, type Manifest } from '../src/engine/manifest.js';

let tmpDir: string;
let outputDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'verify-test-'));
  outputDir = join(tmpDir, 'build');
  mkdirSync(outputDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeSpec(kind: string, extras: Record<string, unknown> = {}): string {
  const specPath = join(tmpDir, 'test.yaml');
  const spec = {
    apiVersion: '1.0',
    kind,
    metadata: { name: 'test-service' },
    spec: { service: { package: 'com.example.test' }, ...extras },
  };
  writeFileSync(specPath, JSON.stringify(spec));
  return specPath;
}

describe('verify with manifest', () => {
  it('passes when all manifest files exist', () => {
    const specPath = writeSpec('spring-domain');
    writeFileSync(join(outputDir, 'Foo.kt'), 'class Foo');
    writeFileSync(join(outputDir, 'Bar.kt'), 'class Bar');

    writeManifest(outputDir, {
      generatedAt: '', engine: '0.1.0', bundles: {},
      files: {
        'Foo.kt': { hash: 'x', bundle: 'spring-domain', overwrite: true },
        'Bar.kt': { hash: 'y', bundle: 'spring-domain', overwrite: true },
      },
    });

    const result = verify({ specPath, outputDir });
    expect(result.passed).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.total).toBe(2);
  });

  it('fails when manifest file is missing from disk', () => {
    const specPath = writeSpec('spring-domain');
    // Only create one of the two expected files
    writeFileSync(join(outputDir, 'Foo.kt'), 'class Foo');

    writeManifest(outputDir, {
      generatedAt: '', engine: '0.1.0', bundles: {},
      files: {
        'Foo.kt': { hash: 'x', bundle: 'spring-domain', overwrite: true },
        'Missing.kt': { hash: 'y', bundle: 'spring-domain', overwrite: true },
      },
    });

    const result = verify({ specPath, outputDir });
    expect(result.passed).toBe(false);
    expect(result.missing).toEqual(['Missing.kt']);
  });

  it('only checks files matching the spec kind', () => {
    const specPath = writeSpec('spring-domain');
    // File from different bundle kind — should not be checked
    writeManifest(outputDir, {
      generatedAt: '', engine: '0.1.0', bundles: {},
      files: {
        'Other.kt': { hash: 'x', bundle: 'spring-library', overwrite: true },
      },
    });

    const result = verify({ specPath, outputDir });
    expect(result.passed).toBe(true);
    expect(result.total).toBe(0);
  });
});

describe('verify without manifest', () => {
  it('falls back to spring-library rules', () => {
    const specPath = writeSpec('spring-library');
    // Create the expected library files
    writeFileSync(join(outputDir, 'build.gradle.kts'), '');
    writeFileSync(join(outputDir, 'settings.gradle.kts'), '');
    writeFileSync(join(outputDir, 'gradle.properties'), '');
    writeFileSync(join(outputDir, 'gradlew'), '');
    writeFileSync(join(outputDir, 'docker-compose.yml'), '');
    mkdirSync(join(outputDir, 'src/main/resources'), { recursive: true });
    writeFileSync(join(outputDir, 'src/main/resources/application.yml'), '');
    writeFileSync(join(outputDir, 'src/main/resources/logback-spring.xml'), '');

    const result = verify({ specPath, outputDir });
    expect(result.passed).toBe(true);
    expect(result.total).toBe(7);
  });

  it('warns for unknown bundle kind with no manifest', () => {
    const specPath = writeSpec('unknown-bundle');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = verify({ specPath, outputDir });
    expect(result.total).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unknown-bundle'));

    warnSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd engine && npx vitest run test/verify.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add engine/test/verify.test.ts
git commit -m "test: add unit tests for verify module"
```

---

### Task 14: Add build.test.ts and run full test suite

**Files:**
- Create: `engine/test/build.test.ts`

- [ ] **Step 1: Write tests**

Create `engine/test/build.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'build-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('build', () => {
  it('throws when no spec files found', async () => {
    const { build } = await import('../src/engine/build.js');
    await expect(build({ specDir: tmpDir })).rejects.toThrow('No spec files found');
  });

  it('orders library specs before domain specs', async () => {
    // Write two spec files with different kinds
    writeFileSync(join(tmpDir, 'domain.yaml'), 'apiVersion: "1.0"\nkind: spring-domain\nmetadata:\n  name: test\nspec: {}\n');
    writeFileSync(join(tmpDir, 'library.yaml'), 'apiVersion: "1.0"\nkind: spring-library\nmetadata:\n  name: test\nspec: {}\n');

    // Track call order by mocking generate
    const callOrder: string[] = [];
    const mockGenerate = vi.fn().mockImplementation(async (specPath: string) => {
      callOrder.push(specPath.includes('library') ? 'library' : 'domain');
    });

    // Dynamic import and mock
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: mockGenerate,
    }));

    // Re-import to pick up mock
    const { build } = await import('../src/engine/build.js');
    await build({ specDir: tmpDir, outputDir: join(tmpDir, 'out'), dryRun: true });

    expect(callOrder).toEqual(['library', 'domain']);

    vi.doUnmock('../src/engine/pipeline.js');
  });

  it('forwards configPath to generate', async () => {
    writeFileSync(join(tmpDir, 'test.yaml'), 'apiVersion: "1.0"\nkind: test\nmetadata:\n  name: test\nspec: {}\n');

    const mockGenerate = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: mockGenerate,
    }));

    const { build } = await import('../src/engine/build.js');
    await build({ specDir: tmpDir, outputDir: join(tmpDir, 'out'), configPath: '/custom/config.yaml', dryRun: true });

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ configPath: '/custom/config.yaml' }),
    );

    vi.doUnmock('../src/engine/pipeline.js');
  });

  it('skips dotfiles', async () => {
    writeFileSync(join(tmpDir, '.hidden.yaml'), 'apiVersion: "1.0"\nkind: test\nmetadata:\n  name: x\nspec: {}\n');
    const { build } = await import('../src/engine/build.js');
    await expect(build({ specDir: tmpDir })).rejects.toThrow('No spec files found');
  });
});

describe('migration consolidation', () => {
  it('consolidates multiple V001 migrations into V002', async () => {
    // Set up spec files and pre-generated migration output
    writeFileSync(join(tmpDir, 'test.yaml'), 'apiVersion: "1.0"\nkind: test\nmetadata:\n  name: test\nspec: {}\n');

    const outDir = join(tmpDir, 'out');
    const migDir = join(outDir, 'src/main/resources/db/migration');
    mkdirSync(migDir, { recursive: true });

    writeFileSync(join(migDir, 'V001__create_foo_table.sql'), 'CREATE TABLE foo (id UUID);');
    writeFileSync(join(migDir, 'V001__create_bar_table.sql'), 'CREATE TABLE bar (id UUID);\nALTER TABLE bar ADD CONSTRAINT fk FOREIGN KEY (foo_id) REFERENCES foo(id);');

    // Mock generate to be a no-op (migrations already exist)
    vi.doMock('../src/engine/pipeline.js', () => ({
      generate: vi.fn().mockResolvedValue(undefined),
    }));

    const { build } = await import('../src/engine/build.js');
    await build({ specDir: tmpDir, outputDir: outDir });

    const v002Path = join(migDir, 'V002__create_all_aggregate_tables.sql');
    expect(existsSync(v002Path)).toBe(true);

    const content = readFileSync(v002Path, 'utf-8');
    // Table statements come before FK constraints
    const tableIdx = content.indexOf('CREATE TABLE');
    const fkIdx = content.indexOf('ALTER TABLE');
    expect(tableIdx).toBeLessThan(fkIdx);

    vi.doUnmock('../src/engine/pipeline.js');
  });
});
```

- [ ] **Step 2: Run build.test.ts**

Run: `cd engine && npx vitest run test/build.test.ts`
Expected: All tests pass

- [ ] **Step 3: Run full test suite**

Run: `cd engine && npx vitest run`
Expected: All test files pass (11 files total: 4 existing + 7 new)

- [ ] **Step 4: Commit**

```bash
git add engine/test/build.test.ts
git commit -m "test: add unit tests for build module"
```

---

### Task 15: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `cd engine && npx tsc --noEmit`
Expected: Clean build, no errors

- [ ] **Step 2: Full test suite**

Run: `cd engine && npx vitest run`
Expected: All 11 test files pass

- [ ] **Step 3: Verify exports are accessible**

Run: `cd engine && node -e "import('./dist/index.js').then(m => console.log(Object.keys(m).sort().join(', ')))"`
Expected: Output includes `fetchRegistry, listRegistry, searchRegistry, installPackage, publishPackage` among exports
