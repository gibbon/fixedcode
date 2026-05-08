# Engine Fixes Design Spec — 2026-04-09

9 issues identified in the FixedCode engine during project review. All fixes scoped to `engine/` only.

## Fix 1: Export registry functions from public API

**File:** `engine/src/index.ts`

**Problem:** `fetchRegistry`, `searchRegistry`, `listRegistry`, `installPackage`, `publishPackage` and their associated types (`RegistryPackage`, `Registry`, `InstallResult`, `PublishOptions`) are defined in `engine/src/engine/registry.ts` but not exported from the package entry point. CLAUDE.md documents them as importable from `fixedcode`.

**Fix:** Add one export line to `engine/src/index.ts`:
```typescript
export { fetchRegistry, searchRegistry, listRegistry, installPackage, publishPackage } from './engine/registry.js';
export type { RegistryPackage, Registry, InstallResult, PublishOptions } from './engine/registry.js';
```

---

## Fix 2: Use `os.homedir()` in config.ts and consolidate imports

**File:** `engine/src/engine/config.ts`

**Problem:** Line 21 uses `process.env.HOME ?? ''` which fails on Windows where `HOME` is not set. Additionally, `node:fs` is imported twice (lines 1 and 4).

**Fix:**
- Add `import { homedir } from 'node:os'`
- Replace `process.env.HOME ?? ''` with `homedir()`
- Consolidate `import { readFileSync } from 'node:fs'` and `import { existsSync } from 'node:fs'` into a single `import { readFileSync, existsSync } from 'node:fs'`

---

## Fix 3: Replace hand-rolled matchGlob with picomatch

**File:** `engine/src/engine/manifest.ts` lines 108-115

**Problem:** `matchGlob` converts user-provided `.fixedcodeignore` glob patterns to regex via string replacement. The `.*` expansion for `**` can cause exponential backtracking (ReDoS) on pathological inputs. It also lacks support for `?`, character classes, and negation.

**Fix:**
- Add `picomatch` as a dependency in `engine/package.json`
- Replace the `matchGlob` function body with `picomatch(pattern)(path)`
- Remove the regex construction entirely

**Why picomatch:** Small (no transitive deps), battle-tested (used by micromatch, chokidar, fast-glob), handles all glob edge cases correctly.

---

## Fix 4: Pass configPath through build()

**File:** `engine/src/engine/build.ts`

**Problem:** `BuildOptions` lacks a `configPath` field. The `generate()` call at line 67 does not forward `configPath`, so programmatic callers of `build()` cannot specify a config file.

**Fix:**
- Add `configPath?: string` to `BuildOptions` interface
- Forward it in the generate call:
```typescript
await generate(specPath, {
  outputDir,
  dryRun: options.dryRun,
  diff: options.diff,
  configPath: options.configPath,
});
```

---

## Fix 5: Add exports field to engine package.json

**File:** `engine/package.json`

**Problem:** Missing `exports` field. Modern Node.js ESM resolution relies on `exports` for proper subpath and conditional resolution.

**Fix:** Add:
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "default": "./dist/index.js"
  }
}
```

Keep `main` and `types` for backwards compatibility with older tools.

---

## Fix 6: Remove unused statSync import in deploy.ts

**File:** `engine/src/engine/deploy.ts` line 8

**Problem:** `statSync` is imported but never used. The walk function uses `entry.isFile()` / `entry.isDirectory()` from `readdirSync({ withFileTypes: true })` instead.

**Fix:** Remove `statSync` from the import list.

---

## Fix 7: Consolidate duplicate node:fs imports in config.ts

Covered by Fix 2.

---

## Fix 8: Read version dynamically in bundle-init.ts

**File:** `engine/src/cli/bundle-init.ts` line 29

**Problem:** `version: '0.1.0'` is hardcoded in the generated package.json for new bundles. This will become stale as the engine version changes.

**Fix:** Read the engine's package.json at module level (same pattern as `pipeline.ts:7`) and use the version from there. This ensures scaffolded bundles reference the current engine version.

```typescript
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const enginePkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
```

Then use `enginePkg.version` in the generated package.json.

---

## Fix 9: Add unit tests for core engine modules

**Directory:** `engine/test/`

**Problem:** Only 4 test files exist (`draft.test.ts`, `enrich.test.ts`, `llm.test.ts`, `e2e-sandwich.test.ts`). Core modules — pipeline, config, manifest, parse, build, deploy, verify, registry — have zero unit tests.

**Test strategy:**
- Use `vitest` (already configured)
- Use real file I/O with temp directories (via `mkdtempSync`) — no fs mocks
- Clean up temp directories in `afterEach` hooks
- Mock only external boundaries: `fetch` for registry network calls, `generate` import for build.test.ts
- Each test file covers one module

**Test files to create:**

### `manifest.test.ts`
- `hashContent` — deterministic, different inputs produce different hashes
- `shouldWrite` — all 5 return paths: new file (write), extension point exists (skip), manifest has entry (write), manifest exists but no entry for file (warn-overwrite), no manifest at all/first run (write)
- `readManifest` / `writeManifest` — round-trip, missing file returns null, invalid JSON returns null
- `loadIgnorePatterns` — reads patterns, skips comments and blank lines, missing file returns []
- `isIgnored` — pattern matching via picomatch (after Fix 3)

### `config.test.ts`
- `findConfigFile` — walks up directories, finds .fixedcode.yaml, falls back to user config
- `loadConfig` — explicit path takes priority, env var override, empty/invalid YAML handled gracefully, bundles/generators type validation

### `parse.test.ts`
- `parseSpec` — valid YAML, missing file throws, empty file throws, non-object throws
- `validateEnvelope` — valid envelope passes, missing kind/metadata/spec fields throw `EnvelopeError` with specific field names in the message

### `build.test.ts`
- Ordering: library specs before domain specs
- No specs found throws
- `configPath` forwarded to generate (after Fix 4) — mock `generate` import to verify the option is passed through
- Migration consolidation: multiple V001 files combined into V002, FK constraints moved to end

### `deploy.test.ts`
- Copies files from build to target
- Skips existing versioned SQL migrations
- Dry run doesn't write files
- Missing build dir throws

### `registry.test.ts`
- `searchRegistry` — matches on name, description, tags, kind
- `listRegistry` — filters by kind, returns all when no filter
- `installPackage` — rejects unsafe install commands (allowlist validation)

### `verify.test.ts`
- Manifest-based verification path: all files present passes, missing file fails
- Fallback path for bundles without manifest
- Unknown bundle kind produces a warning
- Reports missing files with correct categorization

**Not in scope:** Integration tests for `generate()` (already covered by e2e-sandwich) or tests requiring network access / `gh` CLI.

---

## Dependency Changes

| Package | Action | Reason |
|---------|--------|--------|
| `picomatch` ^4.0.0 | Add to dependencies | Replace hand-rolled glob regex (Fix 3) |
| `@types/picomatch` | Add to devDependencies | TypeScript types for picomatch |

---

## Risk Assessment

All fixes are low-risk:
- Fixes 1, 5, 6 are additive/removal — no behavior change for existing callers
- Fix 2 changes behavior only on Windows (improvement)
- Fix 3 replaces regex with a library that handles the same patterns plus more — existing `.fixedcodeignore` files will continue to work
- Fix 4 is additive (new optional field)
- Fix 8 changes scaffolded output only (not existing bundles)
- Fix 9 is test-only — no production code changes

## Execution Order

1. Fixes 1-8 (code changes) — can be done in any order, all independent
2. Fix 9 (tests) — depends on Fixes 3 and 4 being done first since tests exercise the new behavior
