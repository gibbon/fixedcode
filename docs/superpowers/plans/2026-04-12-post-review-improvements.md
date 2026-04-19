# Post-Review Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gaps identified in the 2026-04-12 project review — fix the silent CFR verify bug, bring test coverage to the CLI and Handlebars rendering layers, prove regeneration determinism end-to-end, and tidy loose ends (untracked example, bundle-author docs).

**Architecture:** Seven independent tasks that each land as their own commit. No cross-task coupling except Task 1 → Task 2 (the bug fix must precede the expanded CFR file map so we can verify the map actually works). Tests are added using the existing vitest + tmpdir pattern established in `engine/test/verify.test.ts`. No new production dependencies.

**Tech Stack:** TypeScript (engine), vitest (tests), Handlebars (templates), Node stdlib (fs/path/os), Spring Boot + Kotlin (generated output under test).

---

## Scope Note

This plan bundles seven small, independent tasks rather than splitting into seven micro-plans. They all live in the same repo, share the same test harness, and together fulfill one goal: ship the review's high + medium priority items. If an executor prefers, tasks 3, 4, 5 (test additions) and tasks 6, 7 (cleanup/docs) can each be pulled out as standalone work.

## Pre-flight

- [ ] **Verify the working tree is clean or already on a feature branch.**

Run: `git status --short && git branch --show-current`
Expected: only the untracked `order-build/` and `order-domain.yaml` (which Task 6 handles), no unrelated modified files.

- [ ] **Make sure the test suite passes from a clean slate before starting.**

Run: `cd engine && npm test`
Expected: all tests green. If anything is red on master, stop and surface it — don't build on a broken base.

---

## Task 1: Fix CFR verify glob-vs-existsSync bug

**Context for the executor:** `engine/src/engine/cfr.ts:100-128` declares that each bundle CFR maps to a list of files, and verifies presence with `existsSync(resolve(outputDir, f))`. But `bundles/spring-domain/src/index.ts:141-147` declares the files using glob patterns like `'src/main/kotlin/*/config/SecurityConfig.kt'` — `existsSync` does no glob expansion, so the star is taken as a literal directory name and every such check silently returns "missing." The fix: expand globs before checking existence. Use `fast-glob` if it's already a dep, otherwise add it — it's tiny and widely used.

**Files:**
- Modify: `engine/src/engine/cfr.ts` (`verifyCfrs` function, ~lines 100-128)
- Test: `engine/test/cfr.test.ts` (create)
- Possibly modify: `engine/package.json` (add `fast-glob` if missing)

- [ ] **Step 1: Check whether fast-glob is already available.**

Run: `cd engine && node -e "require.resolve('fast-glob')" 2>&1 || echo "NOT INSTALLED"`
Expected: prints the resolved path, OR prints `NOT INSTALLED`. If not installed, install it: `cd engine && npm install fast-glob`.

- [ ] **Step 2: Write the failing test.**

Create `engine/test/cfr.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyCfrs } from '../src/engine/cfr.js';

let outputDir: string;

beforeEach(() => {
  outputDir = mkdtempSync(join(tmpdir(), 'cfr-test-'));
});

afterEach(() => {
  rmSync(outputDir, { recursive: true, force: true });
});

function touch(relPath: string): void {
  const abs = join(outputDir, relPath);
  mkdirSync(abs.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(abs, '// generated', 'utf-8');
}

describe('verifyCfrs', () => {
  it('passes when literal files exist', () => {
    touch('src/main/kotlin/com/example/config/SecurityConfig.kt');
    const result = verifyCfrs(
      { provides: ['auth'], files: { auth: ['src/main/kotlin/com/example/config/SecurityConfig.kt'] } },
      undefined,
      outputDir
    );
    expect(result.passed).toBe(true);
    expect(result.cfrs[0].present).toBe(true);
  });

  it('expands glob patterns and passes when at least one match exists', () => {
    touch('src/main/kotlin/com/example/config/SecurityConfig.kt');
    const result = verifyCfrs(
      { provides: ['auth'], files: { auth: ['src/main/kotlin/*/config/SecurityConfig.kt'] } },
      undefined,
      outputDir
    );
    expect(result.passed).toBe(true);
    expect(result.cfrs[0].present).toBe(true);
    expect(result.cfrs[0].missingFiles).toEqual([]);
  });

  it('fails when glob matches nothing', () => {
    const result = verifyCfrs(
      { provides: ['auth'], files: { auth: ['src/main/kotlin/*/config/SecurityConfig.kt'] } },
      undefined,
      outputDir
    );
    expect(result.passed).toBe(false);
    expect(result.cfrs[0].present).toBe(false);
    expect(result.cfrs[0].missingFiles).toContain('src/main/kotlin/*/config/SecurityConfig.kt');
  });

  it('skips disabled CFRs even if files are missing', () => {
    const result = verifyCfrs(
      { provides: ['auth'], files: { auth: ['definitely/not/there.kt'] } },
      { auth: false },
      outputDir
    );
    expect(result.passed).toBe(true);
    expect(result.cfrs[0].enabled).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test and watch it fail.**

Run: `cd engine && npm test -- cfr.test.ts`
Expected: the "expands glob patterns" test fails — `verifyCfrs` currently calls `existsSync` with a literal path containing `*`, so `present` comes back `false`.

- [ ] **Step 4: Implement the fix.**

Edit `engine/src/engine/cfr.ts`. Replace the imports block and `verifyCfrs` function:

```typescript
import fg from 'fast-glob';
import { resolve } from 'node:path';
```
(keep the existing top-of-file comment; remove the `existsSync` import and the `node:fs` line if that was the only use)

```typescript
export function verifyCfrs(
  bundleCfrs: BundleCfrManifest,
  specCfrs: SpecCfrConfig | undefined,
  outputDir: string
): CfrVerifyResult {
  const results: CfrVerifyResult['cfrs'] = [];

  for (const cfrId of bundleCfrs.provides) {
    const def = CFR_CATALOG.find(c => c.id === cfrId);
    const enabled = specCfrs?.[cfrId] !== false;
    const expectedFiles = bundleCfrs.files?.[cfrId] ?? [];

    const missingFiles = enabled
      ? expectedFiles.filter(pattern => {
          const matches = fg.sync(pattern, { cwd: resolve(outputDir), dot: true });
          return matches.length === 0;
        })
      : [];

    results.push({
      id: cfrId,
      name: def?.name ?? cfrId,
      enabled,
      present: missingFiles.length === 0,
      missingFiles,
    });
  }

  return {
    passed: results.every(r => !r.enabled || r.present),
    cfrs: results,
  };
}
```

Note: we use `fg.sync` for simplicity — `verifyCfrs` is called from CLI commands that are already synchronous at the call site. Relative patterns resolved via `cwd` keep the existing "paths are relative to outputDir" contract.

- [ ] **Step 5: Run the tests and verify all four pass.**

Run: `cd engine && npm test -- cfr.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Run the full suite to catch regressions.**

Run: `cd engine && npm test`
Expected: all green.

- [ ] **Step 7: Commit.**

```bash
git add engine/src/engine/cfr.ts engine/test/cfr.test.ts engine/package.json engine/package-lock.json
git commit -m "fix(cfr): expand glob patterns when verifying CFR files"
```

---

## Task 2: Expand the spring-domain CFR files map

**Context for the executor:** With Task 1 landed, `verifyCfrs` actually checks files properly. Now we need the spring-domain bundle to point at real files for each CFR it claims to provide. The bundle currently lists 11 CFRs in `provides` but only supplies `files` entries for 4 of them (auth, domain-events, input-validation, openapi). The rest are unverifiable. We'll audit each claimed CFR, find the representative template output, and add a glob that will match any generated service.

**Files:**
- Modify: `bundles/spring-domain/src/index.ts` (the `cfrs.files` map)
- Test: we'll verify via a real `cfr check` run against `examples/workspace-service/build` after rebuild (no new unit test — Task 1 covers the engine logic).

- [ ] **Step 1: Regenerate the workspace example so we have current output to audit against.**

Run:
```bash
cd examples/workspace-service
node ../../engine/bin/fixedcode.js build . -o build
```
Expected: build completes, ~120 files written. If the engine entry point lives elsewhere, use `npx fixedcode build . -o build` or `node ../../engine/dist/cli/index.js build . -o build` — pick whichever works. (Check `engine/package.json` `bin` field if unsure.)

- [ ] **Step 2: For each provided CFR, find a representative generated file.**

Run these searches from the repo root to locate likely files:

```bash
find examples/workspace-service/build -name 'SecurityConfig.kt' -o -name 'GlobalExceptionHandler.kt' -o -name '*PagedResponse*' -o -name '*OptimisticLock*' -o -name '*Outbox*' -o -name '*Test.kt' -o -name '*-openapi.yaml'
```
Expected: a list that shows which CFR claims can actually be grounded in file paths. Record which ones have no corresponding file — these are the CFRs that are "claimed but not actually implemented."

**Judgement call:** if a CFR has no implementing file, either:
1. Remove it from `provides` (honest — the bundle doesn't really provide it), OR
2. Leave it, file a note in the commit message, and add the implementing template in a follow-up task.

Prefer option 1 for this pass. The review said "wire CFRs truthfully" — shrinking an over-claim is as valuable as expanding coverage.

- [ ] **Step 3: Update the cfrs.files map in the bundle.**

Edit `bundles/spring-domain/src/index.ts:132-147` to reflect the audit. Example shape (adjust based on what Step 2 actually found):

```typescript
cfrs: {
  provides: [
    'auth', 'authorization', 'input-validation',
    'error-handling',
    'pagination',
    'domain-events',
    'unit-tests',
    'openapi',
    // Remove any CFR that has no matching file. Prefer honesty over claims.
  ],
  files: {
    'auth':              ['src/main/kotlin/**/config/SecurityConfig.kt'],
    'authorization':     ['src/main/kotlin/**/config/SecurityConfig.kt'],
    'input-validation':  ['src/main/kotlin/**/domain/shared/ValidationResult.kt'],
    'error-handling':    ['src/main/kotlin/**/api/GlobalExceptionHandler.kt'],
    'pagination':        ['src/main/kotlin/**/api/PagedResponse.kt'],
    'domain-events':     ['src/main/kotlin/**/domain/shared/DomainEvent.kt'],
    'unit-tests':        ['src/test/kotlin/**/*Test.kt'],
    'openapi':           ['*-openapi.yaml'],
  },
},
```

Use `**` (globstar) where the path depth is variable across services — `fast-glob` supports it. Drop any key whose file was not found in Step 2.

- [ ] **Step 4: Rebuild the engine if the bundle imports from compiled sources.**

Run: `cd engine && npm run build 2>&1 || true; cd ../bundles/spring-domain && npm run build 2>&1 || true`
Expected: either both build successfully, or the repo uses ts-node/tsx directly and no build step is needed. Check whichever is true for this repo. If neither is needed, skip.

- [ ] **Step 5: Run `cfr check` against the regenerated output.**

Run:
```bash
cd examples/workspace-service
node ../../engine/bin/fixedcode.js cfr check workspace-domain.yaml build
```
Expected: every enabled CFR reports PASS. If any reports MISSING, go back to Step 2 and correct either the glob or the provides list.

- [ ] **Step 6: Generate the compliance report and eyeball it.**

Run:
```bash
node ../../engine/bin/fixedcode.js cfr report workspace-domain.yaml build
```
Expected: a Markdown report with no MISSING rows under the PROVIDED section. The "Not Yet Covered" section is informational and fine.

- [ ] **Step 7: Commit.**

```bash
git add bundles/spring-domain/src/index.ts
git commit -m "feat(spring-domain): ground CFR file map in real output paths"
```

---

## Task 3: Add unit tests for render.ts

**Context for the executor:** `engine/src/engine/render.ts` is 212 lines of Handlebars orchestration — directory walks, `{{#each}}` iteration directories, filename templating, binary-file passthrough. It is completely untested. It is also the layer most responsible for the engine's deterministic-output guarantee. We add focused tests for each branch.

**Files:**
- Test: `engine/test/render.test.ts` (create)

- [ ] **Step 1: Write the initial failing test file.**

Create `engine/test/render.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderTemplates, renderFile, createHandlebarsEnv } from '../src/engine/render.js';
import { RenderError } from '../src/errors.js';

let templatesDir: string;

beforeEach(() => {
  templatesDir = mkdtempSync(join(tmpdir(), 'render-test-'));
});

afterEach(() => {
  rmSync(templatesDir, { recursive: true, force: true });
});

function write(rel: string, contents: string): void {
  const abs = join(templatesDir, rel);
  mkdirSync(abs.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(abs, contents, 'utf-8');
}

describe('renderTemplates', () => {
  it('renders a simple .hbs file and strips the .hbs extension', async () => {
    write('hello.txt.hbs', 'Hello {{name}}!');
    const out = await renderTemplates(templatesDir, { name: 'World' });
    expect(out).toHaveLength(1);
    expect(out[0].path).toBe('hello.txt');
    expect(out[0].content).toBe('Hello World!');
  });

  it('passes static non-template files through unchanged', async () => {
    write('static.txt', 'no templating here');
    const out = await renderTemplates(templatesDir, {});
    expect(out).toHaveLength(1);
    expect(out[0].content).toBe('no templating here');
  });

  it('skips binary file extensions', async () => {
    write('logo.png', 'binary-bytes');
    const out = await renderTemplates(templatesDir, {});
    expect(out).toHaveLength(0);
  });

  it('drops files that render to empty strings', async () => {
    write('conditional.txt.hbs', '{{#if enabled}}present{{/if}}');
    const out = await renderTemplates(templatesDir, { enabled: false });
    expect(out).toHaveLength(0);
  });

  it('templates filenames from context', async () => {
    write('{{name}}.txt.hbs', 'content');
    const out = await renderTemplates(templatesDir, { name: 'alice' });
    expect(out[0].path).toBe('alice.txt');
  });

  it('walks nested directories', async () => {
    write('a/b/c.txt.hbs', '{{value}}');
    const out = await renderTemplates(templatesDir, { value: 'deep' });
    expect(out[0].path).toBe(join('a', 'b', 'c.txt'));
    expect(out[0].content).toBe('deep');
  });

  it('produces identical output on repeated runs (determinism)', async () => {
    write('a.txt.hbs', '{{x}}');
    write('b/c.txt.hbs', '{{y}}');
    const first = await renderTemplates(templatesDir, { x: '1', y: '2' });
    const second = await renderTemplates(templatesDir, { x: '1', y: '2' });
    expect(first).toEqual(second);
  });

  it('wraps template compile errors in RenderError', async () => {
    write('bad.txt.hbs', '{{#if unclosed');
    await expect(renderTemplates(templatesDir, {})).rejects.toThrow(RenderError);
  });
});

describe('renderFile', () => {
  it('renders a single template file with provided context', () => {
    write('single.hbs', 'hi {{who}}');
    const hb = createHandlebarsEnv();
    const out = renderFile(join(templatesDir, 'single.hbs'), { who: 'there' }, {}, hb);
    expect(out).toBe('hi there');
  });

  it('supports custom helpers passed via options', () => {
    write('helper.hbs', '{{upper name}}');
    const hb = createHandlebarsEnv({
      helpers: { upper: (s: unknown) => String(s).toUpperCase() },
    });
    const out = renderFile(join(templatesDir, 'helper.hbs'), { name: 'bob' }, {}, hb);
    expect(out).toBe('BOB');
  });

  it('throws RenderError when the template does not exist', () => {
    const hb = createHandlebarsEnv();
    expect(() => renderFile(join(templatesDir, 'missing.hbs'), {}, {}, hb)).toThrow(RenderError);
  });
});
```

- [ ] **Step 2: Run the tests.**

Run: `cd engine && npm test -- render.test.ts`
Expected: all pass. If any fail, the expectation likely encodes an assumption that doesn't match current behavior — **read the actual behavior in `render.ts` and correct the test**, do not modify production code to match a guessed expectation. (The goal is to characterize current behavior, not to change it.)

- [ ] **Step 3: If any test failed in Step 2, fix expectations and re-run.**

Run: `cd engine && npm test -- render.test.ts`
Expected: all green.

- [ ] **Step 4: Run full suite.**

Run: `cd engine && npm test`
Expected: all green.

- [ ] **Step 5: Commit.**

```bash
git add engine/test/render.test.ts
git commit -m "test: add unit tests for render module"
```

---

## Task 4: Add CLI command layer tests

**Context for the executor:** The 12 files in `engine/src/cli/` are the user's entry point and have zero direct tests. We won't cover all 12 at once — we'll hit the five most critical paths with integration-style tests that spawn the CLI via Node and assert on stdout/exit code. The targets are `generate`, `build`, `verify`, `deploy`, `validate`. We use a built-in bundle (the `hello-world` style `ts-basic-service` if it exists, or `spring-domain` against a minimal spec) so the test is fully self-contained.

**Files:**
- Test: `engine/test/cli.test.ts` (create)
- Test fixtures: `engine/test/fixtures/cli-minimal-spec.yaml` (create)

- [ ] **Step 1: Pick a cheap bundle to exercise in tests.**

Run: `ls bundles/ && cat bundles/hello-world/src/index.ts 2>&1 | head -20`
Expected: find a bundle whose generation is fast and produces few files. If `hello-world` exists, use it. Otherwise create a fixture that uses the smallest viable `spring-domain` spec (one aggregate, one command). Record the choice in the test file.

- [ ] **Step 2: Write the failing test skeleton.**

Create `engine/test/cli.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const CLI = resolve(__dirname, '..', 'bin', 'fixedcode.js');

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'cli-test-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function runCli(args: string[], cwd: string = workDir): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
      code: err.status ?? 1,
    };
  }
}

function writeMinimalSpec(): string {
  // Use whatever bundle Step 1 selected. Example for hello-world:
  const spec = `apiVersion: "1.0"
kind: hello-world
metadata:
  name: cli-test
spec:
  greeting: Hello
`;
  const path = join(workDir, 'spec.yaml');
  writeFileSync(path, spec, 'utf-8');
  return path;
}

describe('CLI: validate', () => {
  it('exits 0 for a valid spec', () => {
    writeMinimalSpec();
    const r = runCli(['validate', 'spec.yaml']);
    expect(r.code).toBe(0);
  });

  it('exits non-zero and reports the error for an invalid spec', () => {
    writeFileSync(join(workDir, 'bad.yaml'), 'not: a: real: spec\n');
    const r = runCli(['validate', 'bad.yaml']);
    expect(r.code).not.toBe(0);
    expect(r.stderr + r.stdout).toMatch(/invalid|error/i);
  });
});

describe('CLI: generate', () => {
  it('produces files under the output directory', () => {
    writeMinimalSpec();
    const r = runCli(['generate', 'spec.yaml', '-o', 'out']);
    expect(r.code).toBe(0);
    expect(existsSync(join(workDir, 'out'))).toBe(true);
    expect(existsSync(join(workDir, 'out', '.fixedcode-manifest.json'))).toBe(true);
  });
});

describe('CLI: build + verify', () => {
  it('build + verify round-trip on a single-spec directory', () => {
    writeMinimalSpec();
    const b = runCli(['build', '.', '-o', 'build']);
    expect(b.code).toBe(0);
    const v = runCli(['verify', 'spec.yaml', 'build']);
    expect(v.code).toBe(0);
    expect(v.stdout).toMatch(/pass/i);
  });
});

describe('CLI: deploy', () => {
  it('copies build output into a target directory', () => {
    writeMinimalSpec();
    runCli(['generate', 'spec.yaml', '-o', 'build']);
    const target = mkdtempSync(join(tmpdir(), 'cli-deploy-target-'));
    try {
      const r = runCli(['deploy', 'build', target]);
      expect(r.code).toBe(0);
      expect(existsSync(join(target, '.fixedcode-manifest.json'))).toBe(true);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
});
```

Note on fixtures: the workDir needs a `.fixedcode.yaml` pointing at whichever bundle you chose, OR the test needs to set one up. Check how `e2e-sandwich.test.ts` configures this and follow the same pattern — copy the relevant block.

- [ ] **Step 3: Run the tests; iterate until green.**

Run: `cd engine && npm test -- cli.test.ts`
Expected: all tests pass. Likely issues to resolve:
- CLI entry point path (`bin/fixedcode.js` may be different — check `engine/package.json` "bin")
- Missing `.fixedcode.yaml` in workDir — add one in `beforeEach`
- The chosen bundle needs a templates dir that exists relative to the config — use absolute paths in `.fixedcode.yaml`

Don't modify CLI code to make tests pass unless you find a real bug — in which case, note it in the commit message.

- [ ] **Step 4: Run the full suite.**

Run: `cd engine && npm test`
Expected: all green.

- [ ] **Step 5: Commit.**

```bash
git add engine/test/cli.test.ts engine/test/fixtures/
git commit -m "test: add integration tests for CLI commands"
```

---

## Task 5: Add a regeneration determinism e2e test

**Context for the executor:** The review claims the pipeline is deterministic, and `manifest.test.ts` tests the hashing primitive, but there is no test proving that `generate` run twice on the same spec produces byte-identical output. This is the core promise of the tool — we should have a test that guards it.

**Files:**
- Test: `engine/test/determinism.test.ts` (create)

- [ ] **Step 1: Write the test.**

Create `engine/test/determinism.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { generate } from '../src/engine/pipeline.js';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'determinism-test-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function hashTree(root: string): Map<string, string> {
  const out = new Map<string, string>();
  function walk(dir: string) {
    for (const entry of readdirSync(dir).sort()) {
      const abs = join(dir, entry);
      const rel = relative(root, abs);
      // Exclude the manifest itself — it contains a generatedAt timestamp that
      // is expected to differ between runs. We assert on file contents.
      if (rel === '.fixedcode-manifest.json') continue;
      const s = statSync(abs);
      if (s.isDirectory()) walk(abs);
      else out.set(rel, createHash('sha256').update(readFileSync(abs)).digest('hex'));
    }
  }
  walk(root);
  return out;
}

describe('regeneration determinism', () => {
  it('produces identical file contents across two runs with the same spec', async () => {
    // Use whichever spec the test harness already has set up for e2e tests.
    // Follow the setup pattern in e2e-sandwich.test.ts: load a fixture spec,
    // create a .fixedcode.yaml, call generate() directly.
    const outA = join(tmp, 'a');
    const outB = join(tmp, 'b');

    // TODO: call generate() with the same inputs twice. Example shape:
    // await generate({ specPath, outputDir: outA, configPath });
    // await generate({ specPath, outputDir: outB, configPath });

    const hashesA = hashTree(outA);
    const hashesB = hashTree(outB);

    expect(hashesA.size).toBeGreaterThan(0);
    expect(hashesA.size).toBe(hashesB.size);
    for (const [file, hash] of hashesA) {
      expect(hashesB.get(file), `file ${file} differs`).toBe(hash);
    }
  });
});
```

- [ ] **Step 2: Wire up the actual `generate()` call.**

Open `engine/test/e2e-sandwich.test.ts` and copy the exact setup (fixture spec path, config construction, `generate()` invocation shape). Replace the `TODO` block in the new test with the real calls. Use a small spec so the test is fast.

- [ ] **Step 3: Run the test.**

Run: `cd engine && npm test -- determinism.test.ts`
Expected: pass. If it fails, the failing filename points at a non-determinism source — likely a timestamp, random UUID, or unordered iteration. That's a real bug and should be fixed in a follow-up commit, not by weakening the test.

- [ ] **Step 4: Run the full suite.**

Run: `cd engine && npm test`
Expected: all green.

- [ ] **Step 5: Commit.**

```bash
git add engine/test/determinism.test.ts
git commit -m "test: add e2e regeneration determinism guard"
```

---

## Task 6: Promote order-management to an example

**Context for the executor:** The repo root has `order-domain.yaml` and an `order-build/` directory as untracked files — they look like a completed build that someone did manually, sitting outside the examples tree. Either commit it as a proper example alongside `workspace-service`, or delete it. We'll promote it since another end-to-end example has documentation value.

**Files:**
- Move: `order-domain.yaml` → `examples/order-management-service/order-domain.yaml`
- Delete: `order-build/` (we regenerate it from the spec as part of the move)
- Create: `examples/order-management-service/.fixedcode.yaml`
- Create: `examples/order-management-service/README.md` (brief — one screenful)

- [ ] **Step 1: Inspect the spec and the build to confirm they belong together.**

Run:
```bash
head -40 order-domain.yaml
ls order-build/src/ 2>/dev/null
```
Expected: the spec's `boundedContext` and package should show up in the build tree. If they don't match, the two may be unrelated — stop and ask.

- [ ] **Step 2: Move the spec into the examples tree.**

Run:
```bash
mkdir -p examples/order-management-service
git mv order-domain.yaml examples/order-management-service/order-domain.yaml 2>/dev/null || mv order-domain.yaml examples/order-management-service/order-domain.yaml
```
(`git mv` fails on untracked files, hence the fallback.)

- [ ] **Step 3: Copy the workspace example's config as a starting point and adapt it.**

Run:
```bash
cp examples/workspace-service/.fixedcode.yaml examples/order-management-service/.fixedcode.yaml
```
Edit the copy if any paths need updating — bundle paths are relative to the config file, so they should still resolve. Verify with:

```bash
cd examples/order-management-service && node ../../engine/bin/fixedcode.js validate order-domain.yaml
```
Expected: validation passes.

- [ ] **Step 4: Regenerate the build from the spec.**

Run:
```bash
cd examples/order-management-service
node ../../engine/bin/fixedcode.js build . -o build
node ../../engine/bin/fixedcode.js verify order-domain.yaml build
```
Expected: build produces files, verify passes.

- [ ] **Step 5: Delete the old untracked order-build at the repo root.**

Run: `rm -rf order-build/`

- [ ] **Step 6: Add a short README.**

Create `examples/order-management-service/README.md`:

```markdown
# Order Management Service

Example spring-domain generation with two aggregates (`Order`, `LineItem`) and their commands, queries, and events.

## Regenerate

    node ../../engine/bin/fixedcode.js build . -o build
    node ../../engine/bin/fixedcode.js verify order-domain.yaml build
```

Keep it short — the workspace-service example is the fuller walkthrough.

- [ ] **Step 7: Confirm the repo is clean.**

Run: `git status --short`
Expected: new files under `examples/order-management-service/`, no stray `order-build/` or `order-domain.yaml` at the repo root.

- [ ] **Step 8: Commit.**

```bash
git add examples/order-management-service/
git commit -m "docs(examples): add order-management-service example"
```

---

## Task 7: Bundle authoring guide

**Context for the executor:** CLAUDE.md explains how to write specs and how to use the CLI, but only sketches bundle authoring in half a section. Bundle authors — the people who get the most leverage out of FixedCode — need a walkthrough that starts from zero and ends with a published bundle. We write one guide, cross-link it from CLAUDE.md, keep it concrete.

**Files:**
- Create: `docs/creating-bundles.md`
- Modify: `CLAUDE.md` (add a one-line pointer from the "Creating Bundles from Existing Code" section to the new doc)

- [ ] **Step 1: Draft the guide.**

Create `docs/creating-bundles.md`. Structure:

1. **When to write a bundle** — one paragraph. If you have a codebase pattern that repeats 3+ times, a bundle is worth it. Below that, it isn't.
2. **The five files every bundle needs** — `package.json`, `schema.json`, `src/index.ts`, `templates/`, optional `test/`. For each, one sentence on purpose and one on what goes inside.
3. **Walkthrough: from two services to one bundle** — pick an existing bundle (`hello-world` or `spring-library`) and narrate how it was built. Show:
   - The fields that vary between hypothetical services → become template variables
   - The files that exist in both → become templates
   - The logic in `enrich()` that computes derived context (casing variants, package paths, port defaults)
   - Where `generateFiles()` is used instead of template directory walking (and why: one-to-many relationships)
4. **Extension points** — how to mark files `overwrite: false`, what goes in the stub, how `enrich` command fills them later.
5. **Declaring CFRs** — point to `CFR_CATALOG` in `engine/src/engine/cfr.ts`, show the `cfrs.provides` + `cfrs.files` shape with a concrete example from `spring-domain`. Note that file entries support glob patterns (Task 1's fix).
6. **Testing a bundle** — minimal: write a fixture spec, run `generate`, assert on output. Point at `bundles/spring-domain/test/` as a reference.
7. **Publishing** — the `fixedcode registry publish` command, what tags to use, what the PR looks like.

Target: 300-500 lines. Concrete snippets over prose. Every section should show at least one real code excerpt copied from an existing bundle.

- [ ] **Step 2: Cross-link from CLAUDE.md.**

Edit `CLAUDE.md` — at the top of the "Creating Bundles from Existing Code" section, add one line:

```markdown
> See [docs/creating-bundles.md](docs/creating-bundles.md) for the full step-by-step guide.
```

- [ ] **Step 3: Read the finished guide cold.**

Pretend you've never seen the project. Read top to bottom. Every code snippet should either be runnable or clearly marked as an excerpt with a file reference. If any step assumes knowledge that wasn't introduced earlier, fix it.

- [ ] **Step 4: Commit.**

```bash
git add docs/creating-bundles.md CLAUDE.md
git commit -m "docs: add bundle authoring guide"
```

---

## Wrap-up

- [ ] **Run the full test suite one last time.**

Run: `cd engine && npm test`
Expected: everything green.

- [ ] **Review the commit log.**

Run: `git log --oneline -10`
Expected: seven (or fewer if you batched docs) focused commits on top of the starting commit.

- [ ] **Decide on PR shape.**

Two reasonable options:
1. One PR titled "post-review improvements" with all seven commits — easy to review as a unit, ships together.
2. Split into three PRs: (a) CFR fix + spring-domain map, (b) test additions, (c) docs + example. Use this if the reviewer prefers smaller surface area.

Ask the human which shape they want before opening anything.
