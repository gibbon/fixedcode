# Productionise FixedCode v0.2.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take fixedcode from a private working repo to a polished public OSS dev tool: clean repo, security-reviewed, documented, CI/CD wired, engine published as `@fixedcode/engine@0.2.0` on npm.

**Architecture:** Five sequential phases each with explicit gates. Phase 1 (cleanup, including a git-history rewrite) gates everything else. Phase 2 (security review) and Phase 3 (docs) precede Phase 4 (CI/CD), which precedes Phase 5 (publish). The publish in Phase 5 is the terminal event.

**Tech Stack:** TypeScript (engine), Handlebars (bundle templates), Vitest, Node ≥20, GitHub Actions, npm, ESLint 9, Prettier, git filter-repo.

**Spec:** `docs/superpowers/specs/2026-05-08-productionise-fixedcode-design.md`

---

# Phase 1 — Cleanup

Cleanup is the gate. No other phase starts until the repo is purged of rdan code, cruft, and a clean filtered history is force-pushed. The user has pre-authorised the destructive operations (history rewrite, force-push, rdan-bundle move, deletion of slides/PDFs/old-cli).

## Task 1: Pre-flight backup

**Files:**
- Create: `~/projects/_backup-2026-05-08/fixedcode.git/`
- Create: `~/projects/_backup-2026-05-08/r.dan.git/`

- [ ] **Step 1: Make backup directory**

```bash
mkdir -p ~/projects/_backup-2026-05-08
```

- [ ] **Step 2: Mirror-clone fixedcode**

```bash
git clone --mirror ~/projects/fixedcode ~/projects/_backup-2026-05-08/fixedcode.git
```
Expected: clones to a bare mirror repo.

- [ ] **Step 3: Mirror-clone r.dan**

```bash
git clone --mirror ~/projects/r.dan ~/projects/_backup-2026-05-08/r.dan.git
```

- [ ] **Step 4: Verify both backups exist and are non-empty**

```bash
du -sh ~/projects/_backup-2026-05-08/*
```
Expected: two directories, each ≥ a few hundred KB.

(No commit — backups live outside the repo.)

## Task 2: Move rdan bundles to ~/projects/r.dan/bundles/

**Files:**
- Move: `bundles/rdan-*` → `~/projects/r.dan/bundles/`

- [ ] **Step 1: Confirm destination dir exists**

```bash
mkdir -p ~/projects/r.dan/bundles
ls -la ~/projects/r.dan/bundles
```
Expected: empty or near-empty directory.

- [ ] **Step 2: Move all rdan-* bundles (tracked + untracked) atomically**

```bash
cd ~/projects/fixedcode
mv bundles/rdan-agent-specialist bundles/rdan-config-feature bundles/rdan-dashboard-nextjs-page bundles/rdan-dashboard-page-crud bundles/rdan-integration bundles/rdan-tool-api bundles/rdan-tool-compute bundles/rdan-tool-local bundles/rdan-tool-state-crud ~/projects/r.dan/bundles/
```

- [ ] **Step 3: Verify the moves succeeded**

```bash
ls bundles/ | grep rdan && echo "FAIL: rdan still present" || echo "OK: no rdan in bundles/"
ls ~/projects/r.dan/bundles/ | wc -l
```
Expected: 9 bundles in `~/projects/r.dan/bundles/`, none in `fixedcode/bundles/`.

- [ ] **Step 4: Stage the deletions in fixedcode**

```bash
cd ~/projects/fixedcode
git add -A bundles/
git status --short
```
Expected: a long list of `D bundles/rdan-*/...` deletions.

(No commit yet — combined with config strip in Task 4.)

## Task 3: Discard rdan-related working-tree edits

**Files:**
- Revert: `.fixedcode.yaml` (working-tree-only `rdan-integration:` line)
- (Template file in `bundles/rdan-dashboard-nextjs-page` is now moved out, so its diff is moot.)

- [ ] **Step 1: Inspect the .fixedcode.yaml diff**

```bash
git diff .fixedcode.yaml
```
Expected: `+rdan-integration: "./bundles/rdan-integration"` only.

- [ ] **Step 2: Revert it**

```bash
git checkout .fixedcode.yaml
```

- [ ] **Step 3: Verify clean diff**

```bash
git diff .fixedcode.yaml
```
Expected: empty.

## Task 4: Strip rdan from .fixedcode.yaml

**Files:**
- Modify: `.fixedcode.yaml` (remove all `rdan-*:` lines)

- [ ] **Step 1: Show current rdan lines**

```bash
grep -n rdan .fixedcode.yaml
```
Expected: lines 8–16 (8 entries plus `rdan-infra-dashboard-page` referencing a non-existent dir).

- [ ] **Step 2: Remove all rdan lines**

```bash
sed -i '/rdan-/d' .fixedcode.yaml
```

- [ ] **Step 3: Verify**

```bash
grep -n rdan .fixedcode.yaml || echo "OK: no rdan refs"
cat .fixedcode.yaml
```
Expected: no rdan lines remain; remaining bundle entries (crud-api, ddd-basic, ddd-spike, mcp-wrapper, python-agent, python-service, spring-domain, spring-library, ts-agent, ts-service) intact.

## Task 5: Strip rdan from registry.json

**Files:**
- Modify: `registry.json` (remove the 3 rdan-* entries)

- [ ] **Step 1: Locate and inspect entries**

```bash
node -e "const r = require('./registry.json'); console.log(JSON.stringify(r.bundles?.filter(b => b.name.includes('rdan')) ?? [], null, 2));"
```
Expected: 3 entries with names containing `rdan`.

- [ ] **Step 2: Remove rdan entries with a small script**

Create a one-shot script `scripts/strip-rdan-registry.mjs`:

```javascript
import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync('registry.json', 'utf8'));
if (Array.isArray(r.bundles)) r.bundles = r.bundles.filter(b => !b.name.includes('rdan'));
if (Array.isArray(r.generators)) r.generators = r.generators.filter(g => !g.name.includes('rdan'));
fs.writeFileSync('registry.json', JSON.stringify(r, null, 2) + '\n');
console.log('Stripped rdan from registry.json');
```

```bash
mkdir -p scripts
# (write the file via Write tool, then:)
node scripts/strip-rdan-registry.mjs
```

- [ ] **Step 3: Verify**

```bash
grep -n rdan registry.json || echo "OK: no rdan refs"
```
Expected: empty.

- [ ] **Step 4: Delete the one-shot script (it's not part of the product)**

```bash
rm scripts/strip-rdan-registry.mjs
rmdir scripts 2>/dev/null || true
```

## Task 6: Excise rdan-agent sections from 2026-04-06 design doc

**Files:**
- Modify: `docs/superpowers/specs/2026-04-06-python-and-cicd-bundles-design.md`

- [ ] **Step 1: Find the rdan-agent references**

```bash
grep -n -i 'rdan' docs/superpowers/specs/2026-04-06-python-and-cicd-bundles-design.md
```
Expected: 4 lines (29, 31, 42, 1087 per spec review).

- [ ] **Step 2: Read each reference in context using Read tool with offset/limit, then edit each occurrence**

For lines 25–55 (the `rdan-agent` bundle section near the start), replace with text that says something like "rdan-agent is out of scope" or remove the section entirely. Use the Edit tool for each excision; if the section is a contiguous markdown block, remove the whole block including its heading.

- [ ] **Step 3: Verify rdan is gone**

```bash
grep -n -i 'rdan' docs/superpowers/specs/2026-04-06-python-and-cicd-bundles-design.md || echo "OK: no rdan refs"
```
Expected: empty.

## Task 7: Working-tree cleanup commit (cruft deletion)

**Files:**
- Delete: `order-build/`, `build/`, `aggregates}}/`, `*:Zone.Identifier` files, root `package.json`, root `node_modules/`, `slides-org/`, `old-cli/`, the two PDFs at repo root, `order-domain.yaml`

- [ ] **Step 1: List everything to delete (verify before deletion)**

```bash
ls -d order-build build 'aggregates}}' slides-org old-cli 2>/dev/null
ls *.pdf *:Zone.Identifier 2>/dev/null
ls package.json node_modules order-domain.yaml 2>/dev/null
```

- [ ] **Step 2: Delete cruft directories and files**

```bash
rm -rf order-build build 'aggregates}}' slides-org old-cli
rm -f 'Engineering a Deterministic Global Platform.pdf' 'GAP CLI - Technical Deep Dive.pdf'
rm -f 'Engineering a Deterministic Global Platform.pdf:Zone.Identifier' 'GAP CLI - Technical Deep Dive.pdf:Zone.Identifier'
rm -f package.json package-lock.json
rm -rf node_modules
rm -f order-domain.yaml
```

- [ ] **Step 3: Verify deletions**

```bash
ls order-build build 'aggregates}}' slides-org old-cli *.pdf 2>&1 | grep -v 'No such file' && echo "FAIL: items remain" || echo "OK"
```

## Task 8: Tighten .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read current .gitignore**

```bash
cat .gitignore
```

- [ ] **Step 2: Append missing patterns**

Use Edit tool to ensure these patterns are present (deduped):

```
node_modules/
dist/
build/
*-build/
.DS_Store
*:Zone.Identifier
*.tsbuildinfo
.env
.env.local
coverage/
```

- [ ] **Step 3: Verify nothing unintended is now ignored**

```bash
git status --ignored --short | head -30
git status --short
```

## Task 9: Commit cleanup so far

- [ ] **Step 1: Stage all current changes**

```bash
git add -A
git status --short
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: cleanup repo for productionisation

- Remove all rdan-* bundles (moved to r.dan repo).
- Strip rdan refs from .fixedcode.yaml and registry.json.
- Remove cruft: order-build/, build/, aggregates}}/, slides-org/, old-cli/,
  design PDFs, stray root package.json + node_modules, *:Zone.Identifier files.
- Excise rdan-agent sections from 2026-04-06 design doc.
- Tighten .gitignore.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 10: Verify all remaining packages build and test

**Files:**
- Read-only: `engine/`, `bundles/<each>/`, `generators/openapi/`

- [ ] **Step 1: Engine**

```bash
cd ~/projects/fixedcode/engine
npm install
npm run build
npm test
```
Expected: build succeeds, tests pass.

- [ ] **Step 2: Each remaining bundle**

```bash
for d in ~/projects/fixedcode/bundles/*/; do
  echo "=== $(basename "$d") ==="
  cd "$d"
  if [ -f package.json ]; then
    npm install --no-audit --no-fund 2>&1 | tail -3
    if grep -q '"build"' package.json; then npm run build 2>&1 | tail -5; fi
    if grep -q '"test"' package.json; then npm test 2>&1 | tail -5; fi
  fi
done
cd ~/projects/fixedcode
```
Expected: every bundle builds and tests cleanly. Any failure blocks the next step — fix it (typically a missing dep or an import that referenced an rdan utility) before continuing.

- [ ] **Step 3: Generators**

```bash
cd ~/projects/fixedcode/generators/openapi
npm install
npm run build
npm test
cd ~/projects/fixedcode
```

- [ ] **Step 4: End-to-end smoke test**

```bash
cd ~/projects/fixedcode
node engine/bin/fixedcode.js generate examples/workspace-service/workspace-domain.yaml -o /tmp/fc-smoke
node engine/bin/fixedcode.js verify examples/workspace-service/workspace-domain.yaml /tmp/fc-smoke
rm -rf /tmp/fc-smoke
```
Expected: generation runs, verify reports all checks passed.

- [ ] **Step 5: Commit any fixes from steps 1–4**

```bash
git status --short
# if fixes were needed:
git add -A
git commit -m "chore: post-cleanup fixes for build/test green across all packages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 11: History rewrite with git filter-repo

**Files:**
- Modify (history-wide): every commit touching `old-cli/`, `slides-org/`, the two PDFs, or `bundles/rdan-*/`

- [ ] **Step 1: Verify filter-repo is installed**

```bash
git filter-repo --version 2>&1 || pipx install git-filter-repo
git filter-repo --version
```
Expected: a version string. If `pipx` not present, fall back to `pip install --user git-filter-repo` and ensure it's on PATH.

- [ ] **Step 2: Confirm no open PRs or significant forks before rewriting**

```bash
gh pr list --state open --repo gibbon/fixedcode
gh repo view gibbon/fixedcode --json forkCount,stargazerCount
```
Expected: 0 open PRs. Fork count noted (we proceed regardless per user authorisation but surface in the log).

- [ ] **Step 3: Run filter-repo (dry-run first via --analyze)**

```bash
git filter-repo --analyze
ls .git/filter-repo/analysis/ 2>/dev/null | head
```
Expected: an `analysis/` directory with a report. (filter-repo's `--analyze` doesn't change history.)

- [ ] **Step 4: Run the actual rewrite**

```bash
git filter-repo \
  --invert-paths \
  --path old-cli \
  --path slides-org \
  --path-glob 'bundles/rdan-*' \
  --path 'Engineering a Deterministic Global Platform.pdf' \
  --path 'GAP CLI - Technical Deep Dive.pdf' \
  --path 'Engineering a Deterministic Global Platform.pdf:Zone.Identifier' \
  --path 'GAP CLI - Technical Deep Dive.pdf:Zone.Identifier' \
  --force
```
Note: `filter-repo` re-runs `git gc` automatically. The `--force` flag is required when the working tree contains uncommitted state but we just committed everything in Task 9–10.

- [ ] **Step 5: Verify history is clean**

```bash
git log --all --full-history --oneline -- old-cli 2>&1 | head
git log --all --full-history --oneline -- slides-org 2>&1 | head
git log --all --full-history --oneline -- 'bundles/rdan-*' 2>&1 | head
git log --all --full-history --oneline -- '*.pdf' 2>&1 | head
```
Expected: all four commands return empty.

- [ ] **Step 6: Verify repo size dropped**

```bash
du -sh .git
```
Expected: noticeably smaller than the pre-rewrite size (the PDFs alone were ~2.4 MB packed; old-cli and slides-org sources should drop further).

- [ ] **Step 7: Re-add origin remote (filter-repo strips it)**

```bash
git remote add origin git@github.com:gibbon/fixedcode.git
git remote -v
```

## Task 12: Force-push the rewritten history

- [ ] **Step 1: Final sanity check on master**

```bash
git status
git log --oneline -10
```
Expected: clean working tree, recent commits look right.

- [ ] **Step 2: Force-push**

```bash
git push --force --tags origin master
```
Expected: push succeeds (the user has pre-authorised this destructive op).

- [ ] **Step 3: Confirm GitHub repo state**

```bash
gh repo view gibbon/fixedcode --web 2>/dev/null || gh repo view gibbon/fixedcode
```

**Phase 1 acceptance gate:**
- `ls bundles/` shows exactly: `crud-api ddd-basic ddd-spike mcp-wrapper python-agent python-service spring-domain spring-library ts-agent ts-service`
- `git log --all --full-history -- 'bundles/rdan-*'` returns empty
- `git status` is clean
- All packages build and test cleanly
- master force-pushed to origin

---

# Phase 2 — Security & Best-Practices Code Review

## Task 13: Spawn parallel Explore agents on each scope area

**Files:**
- Read-only: `engine/src/engine/{pipeline,manifest,registry,deploy,parse,verify,build,llm,draft,enrich}.ts`, `engine/src/cli/*.ts`, `bundles/<each>/src/index.ts`, `generators/openapi/src/index.ts`

- [ ] **Step 1: Dispatch 4 Explore agents in parallel** (one tool message, four invocations) covering:

  1. **Path traversal & file write paths** — every `path.join`, `writeFile`, `copyFile`, `fs.cp` in `engine/src/engine/{deploy,write,manifest,pipeline,bundle-init}.ts` and `engine/src/cli/*`. For each, verify resolved paths cannot escape the project root; check that user-supplied identifiers (slugs, names, paths from spec) are validated.
  2. **Shell / spawn injection** — every `spawn`, `exec`, `execSync`, `execFile`, `child_process` use across the engine. The registry install path uses `npm install`; verify args are passed as an array, not a shell string.
  3. **LLM safety** — `engine/src/engine/{llm,draft,enrich}.ts`: prompt construction (any user-controlled string going into a prompt without escaping), response handling (JSON parse with try/catch and schema validation, never `eval` or dynamic require), URL handling (any `baseUrl` from config — verify it's https-only or at least an explicit allowlist).
  4. **Handlebars & template safety** — every `Handlebars.compile`, registered helper, and `noEscape` flag across `engine/src/engine/render.ts` and bundle `helpers.ts` files. Ensure spec keys can't trigger prototype pollution; ensure helpers don't `eval` or shell out.

- [ ] **Step 2: Collect findings into a single document**

Create `docs/superpowers/specs/2026-05-08-security-findings.md`. For each finding:

```markdown
### F-N: [short title]

**Severity:** critical | high | medium | low
**File:** path/to/file.ts:line
**Risk:** [what an attacker / accidental user could do]
**Fix:** [proposed change]
**Test:** [regression test description]
```

- [ ] **Step 3: Run npm audit on every package**

```bash
cd ~/projects/fixedcode/engine && npm audit --audit-level=high 2>&1 | tee /tmp/audit-engine.log
for d in ~/projects/fixedcode/bundles/*/; do
  cd "$d"
  echo "=== $(basename "$d") ==="
  npm audit --audit-level=high 2>&1 | tail -10
done
cd ~/projects/fixedcode/generators/openapi && npm audit --audit-level=high
cd ~/projects/fixedcode
```
Append any findings (with severity high+) into the findings doc.

- [ ] **Step 4: License audit**

```bash
cd ~/projects/fixedcode/engine
npx -y license-checker --summary 2>&1 | head -20
```
Flag any GPL/AGPL deps. (Apache-2.0/MIT/BSD are fine.)

- [ ] **Step 5: Commit the findings doc**

```bash
cd ~/projects/fixedcode
git add docs/superpowers/specs/2026-05-08-security-findings.md
git commit -m "docs(security): record code-review findings before v0.2.0

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 14: Fix critical and high severity findings (TDD)

**Files:** vary per finding (see findings doc).

For each critical / high finding:

- [ ] **Step 1: Write a failing regression test** in the appropriate `*.test.ts` next to the file being fixed. The test should reproduce the vulnerable behaviour using a malicious input.

- [ ] **Step 2: Run the test and confirm it fails**

```bash
cd ~/projects/fixedcode/engine
npx vitest run path/to/test.ts
```
Expected: FAIL.

- [ ] **Step 3: Apply the fix** (the smallest change that makes the test pass — no broader refactoring).

- [ ] **Step 4: Run the test and confirm it passes**

Expected: PASS.

- [ ] **Step 5: Run the full test suite to catch regressions**

```bash
cd ~/projects/fixedcode/engine && npm test
```

- [ ] **Step 6: Commit per finding**

```bash
git add -A
git commit -m "fix(security): F-N — <short title>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 15: File medium/low findings as GitHub issues

- [ ] **Step 1: For each medium/low finding, open an issue**

```bash
gh issue create \
  --repo gibbon/fixedcode \
  --title "security(<area>): <short title>" \
  --body "<copy from findings doc, plus reference to F-N>" \
  --label "security,deferred"
```

- [ ] **Step 2: Update the findings doc** with issue links per row.

- [ ] **Step 3: Commit the updated findings doc**

```bash
git add docs/superpowers/specs/2026-05-08-security-findings.md
git commit -m "docs(security): link deferred findings to GitHub issues

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 16: Run superpowers:requesting-code-review on the consolidated diff

- [ ] **Step 1: Invoke the skill** with context: "End-of-Phase-2 review. Consolidated security fixes for findings F-1 through F-N. The repo is being productionised for v0.2.0. Verify fixes are correct, tested, and don't introduce regressions. Spec at `docs/superpowers/specs/2026-05-08-productionise-fixedcode-design.md`."

- [ ] **Step 2: Address blocking comments only.** Advisory comments are filed as issues (re-use the gh issue create flow above).

- [ ] **Step 3: Final test run**

```bash
cd ~/projects/fixedcode/engine && npm test
for d in ~/projects/fixedcode/bundles/*/ ~/projects/fixedcode/generators/openapi; do
  cd "$d" && [ -f package.json ] && npm test --silent 2>&1 | tail -3
done
cd ~/projects/fixedcode
```

**Phase 2 acceptance gate:**
- All critical+high findings fixed with regression tests
- `npm audit --audit-level=high` clean across packages
- `superpowers:requesting-code-review` returns no blocking issues
- Findings doc committed

---

# Phase 3 — Documentation

## Task 17: Add LICENSE (Apache-2.0)

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Fetch Apache-2.0 text**

```bash
curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt -o LICENSE
```

- [ ] **Step 2: Verify content**

```bash
head -3 LICENSE
wc -l LICENSE
```
Expected: starts with "Apache License", ~202 lines.

- [ ] **Step 3: Commit**

```bash
git add LICENSE
git commit -m "docs: add Apache-2.0 license

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 18: Add SECURITY.md

**Files:**
- Create: `SECURITY.md`

- [ ] **Step 1: Write security policy**

Body:
```markdown
# Security Policy

## Supported Versions
The current minor (0.2.x) is supported. Older versions are not.

| Version | Supported |
|---------|-----------|
| 0.2.x   | ✅        |
| < 0.2   | ❌        |

## Reporting a Vulnerability
Email **<security contact>** with details. Please do not open a public issue.
We aim to acknowledge within 72 hours and ship a fix within 30 days for high-severity issues.

## Threat Model (summary)
- Specs are trusted input from the user running the CLI; they are not executed
  but can drive file paths and template rendering. Path-traversal protections
  are documented in `docs/architecture.md`.
- LLM calls (`draft`, `enrich`) treat model output as untrusted: JSON is parsed
  with schema validation; failures abort the operation.
- The registry install path runs `npm install` against user-approved package
  names from the registry; arguments are passed as an array, never a shell string.
```

- [ ] **Step 2: Ask user for the security contact email** *(or default to `security@fixedcode.dev` placeholder, ack in commit)*

- [ ] **Step 3: Commit**

```bash
git add SECURITY.md
git commit -m "docs: add SECURITY.md with disclosure policy and threat-model summary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 19: Add CODE_OF_CONDUCT.md

**Files:**
- Create: `CODE_OF_CONDUCT.md`

- [ ] **Step 1: Fetch Contributor Covenant 2.1**

```bash
curl -fsSL https://www.contributor-covenant.org/version/2/1/code_of_conduct.txt -o CODE_OF_CONDUCT.md
```

(Adjust the contact field at the bottom — replace the placeholder with the security email.)

- [ ] **Step 2: Commit**

```bash
git add CODE_OF_CONDUCT.md
git commit -m "docs: add Contributor Covenant 2.1 code of conduct

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 20: Add CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Write contributor guide**

Sections:
1. **Dev setup** — Node ≥20, `npm install` in each package, `npm test` to verify.
2. **Project layout** — engine/, bundles/, generators/, examples/, docs/.
3. **Adding a bundle** — link to docs/bundles.md.
4. **Adding a generator** — link to docs/generators.md.
5. **Commit messages** — Conventional Commits style: `feat(scope): ...`, `fix(scope): ...`, `docs: ...`.
6. **Tests** — vitest, write a test before fixing a bug, integration tests under `engine/test/`.
7. **PR process** — fork, branch, PR against `master`, ensure CI green, address review comments.

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 21: Add CHANGELOG.md

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1: Write initial changelog**

```markdown
# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] — 2026-05-XX

### Added
- Productionisation of the repo: README, LICENSE (Apache-2.0), CONTRIBUTING, SECURITY, CHANGELOG.
- GitHub Actions CI for typecheck/lint/test/build.
- GitHub Actions release workflow publishing `@fixedcode/engine` to npm with provenance.
- ESLint 9 + Prettier configuration.
- Per-package READMEs.
- CodeQL scanning, Dependabot config.

### Changed
- Removed unrelated `rdan-*` bundles (moved to a separate repo).
- Cleaned repo of build artifacts and historical PDFs / slide decks.
- `registry.json` install paths point at GitHub tarballs (npm distribution deferred).

### Security
- Code review pass with `superpowers:requesting-code-review`. Fixes summarised in `docs/superpowers/specs/2026-05-08-security-findings.md`.

[Unreleased]: https://github.com/gibbon/fixedcode/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/gibbon/fixedcode/releases/tag/v0.2.0
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG.md with 0.2.0 entry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 22: Write README.md

**Files:**
- Create: `README.md` (or replace if a placeholder exists)

- [ ] **Step 1: Draft README**

Sections (in order):

1. Hero block (h1 + tagline + 1-paragraph value prop).
2. Badges row (npm version, build status, license, node version, PRs welcome). Use shields.io URLs:
   - `https://img.shields.io/npm/v/@fixedcode/engine.svg`
   - `https://github.com/gibbon/fixedcode/actions/workflows/ci.yml/badge.svg`
   - `https://img.shields.io/github/license/gibbon/fixedcode.svg`
   - `https://img.shields.io/node/v/@fixedcode/engine.svg`
   - `https://img.shields.io/badge/PRs-welcome-brightgreen.svg`
3. "Why FixedCode?" (3–4 sentences on spec-driven, deterministic generation, AI-friendly).
4. Quickstart (4 commands: install, init, generate, deploy).
5. Concepts: Bundle / Generator / Spec — short blocks with one-line descriptions and links to docs/.
6. The AI Sandwich workflow — diagram (ASCII or mermaid), commands.
7. Bundle catalog — markdown table of the 10 bundles + 1 generator with one-line descriptions and links to per-package READMEs.
8. CFR catalog — short table linking to docs/cfrs.md.
9. Roadmap — 3–4 bullets pointing at GitHub milestones.
10. Contributing pointer + license footer.

- [ ] **Step 2: Verify links resolve**

```bash
# spot-check a few
grep -oP '\(https?://[^)]+\)' README.md | head
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with quickstart, concepts, and bundle catalog

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 23: Add .github/ issue & PR templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/feature.yml`, `.github/ISSUE_TEMPLATE/question.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/FUNDING.yml` (commented out)

- [ ] **Step 1: Write `bug.yml`**

```yaml
name: Bug report
description: Something isn't working as expected
labels: ["bug"]
body:
  - type: textarea
    id: description
    attributes:
      label: Describe the bug
    validations: { required: true }
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
    validations: { required: true }
  - type: textarea
    id: expected
    attributes:
      label: Expected behaviour
  - type: textarea
    id: env
    attributes:
      label: Environment
      placeholder: "fixedcode --version, node --version, OS"
```

- [ ] **Step 2: Write `feature.yml`**

```yaml
name: Feature request
description: Suggest an idea or improvement
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem this would solve
    validations: { required: true }
  - type: textarea
    id: proposal
    attributes:
      label: Proposal
    validations: { required: true }
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
```

- [ ] **Step 3: Write `question.yml`**

```yaml
name: Question
description: Ask a usage question
labels: ["question"]
body:
  - type: textarea
    id: question
    attributes:
      label: Your question
    validations: { required: true }
```

- [ ] **Step 4: Write `.github/PULL_REQUEST_TEMPLATE.md`**

```markdown
## Summary
<!-- 1-3 bullet points -->

## Changes
<!-- What changed and why -->

## Test plan
- [ ] `npm test` passes locally
- [ ] CI is green
- [ ] Manual verification: ...

## Related
<!-- Issue links, design docs -->
```

- [ ] **Step 5: Write `.github/FUNDING.yml` (commented placeholder)**

```yaml
# github: gibbon
# custom: ["https://example.com/sponsor"]
```

- [ ] **Step 6: Commit**

```bash
git add .github/
git commit -m "docs: add GitHub issue/PR templates and FUNDING placeholder

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 24: Populate docs/

**Files:**
- Create: `docs/architecture.md`, `docs/bundles.md`, `docs/generators.md`, `docs/cfrs.md`, `docs/registry.md`, `docs/llm.md`, `docs/release.md`

- [ ] **Step 1: For each doc, write 1–2 pages**

  - `architecture.md` — engine pipeline diagram (mermaid), Bundle / Generator / FileEntry / Context contracts (referenced from `engine/src/types.ts`).
  - `bundles.md` — writing a bundle: Bundle interface, schema.json conventions, enrich(), templates dir, generateFiles(), extension points (`overwrite: false`), helpers.
  - `generators.md` — Generator interface, adapter contract, OpenAPI as worked example.
  - `cfrs.md` — CFR catalog (run `node engine/bin/fixedcode.js cfr catalog` and embed), declaring CFRs in a bundle, `cfr suggest`/`check`/`report`.
  - `registry.md` — registry model, install/publish flow, why bundles are not on npm yet.
  - `llm.md` — LLM config, security caveats for prompt injection, mocking in tests.
  - `release.md` — internal: how to cut a release, branch-protection settings, npm provenance setup.

- [ ] **Step 2: Cross-link from README**

Confirm README links target the right `docs/<file>.md` paths.

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: populate docs/ tree (architecture, bundles, generators, cfrs, registry, llm, release)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 25: Per-package READMEs

**Files:**
- Create or replace: `engine/README.md`, `generators/openapi/README.md`, `bundles/<each>/README.md` (10 bundles)

- [ ] **Step 1: Engine README**

Cover: install, every CLI command with example, programmatic API summary, link to `docs/architecture.md`.

- [ ] **Step 2: OpenAPI generator README**

Purpose, input contract, example invocation, link to `docs/generators.md`.

- [ ] **Step 3: Bundle READMEs (10)**

For each bundle (`crud-api`, `ddd-basic`, `ddd-spike`, `mcp-wrapper`, `python-agent`, `python-service`, `spring-domain`, `spring-library`, `ts-agent`, `ts-service`):

```markdown
# @fixedcode/bundle-<name>

[1-paragraph purpose]

## Install
```
fixedcode registry install <name>
```

## Spec schema
[key fields with one-line descriptions or link to schema.json]

## Output
[short list of files generated]
```

- [ ] **Step 4: Commit**

```bash
git add engine/README.md generators/openapi/README.md bundles/*/README.md
git commit -m "docs: add per-package READMEs for engine, generator, and 10 bundles

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

**Phase 3 acceptance gate:**
- All root-level docs files present.
- `.github/` populated.
- `docs/` tree populated.
- Per-package READMEs in place.
- All links from README resolve to local files or canonical URLs.

---

# Phase 4 — CI/CD

## Task 26: Add ESLint + Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`, `.prettierignore`
- Modify: root-level `package.json` (we deleted it in Task 7; create a minimal one for repo-wide tooling)

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "fixedcode-monorepo",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create `eslint.config.js`**

```javascript
// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/templates/**',
      '**/*.hbs',
      'examples/**/build/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
];
```

- [ ] **Step 3: Create `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

- [ ] **Step 4: Create `.prettierignore`**

```
**/dist/**
**/node_modules/**
**/build/**
**/templates/**
**/*.hbs
examples/**/build/**
*.md
```

- [ ] **Step 5: Install deps**

```bash
npm install
```

- [ ] **Step 6: Run lint and prettier; fix what shows up**

```bash
npm run lint
npm run format
```

- [ ] **Step 7: Re-run to confirm green**

```bash
npm run lint
npm run format:check
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "build: add ESLint 9 flat config, Prettier, and root tooling package.json

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 27: Add `.github/workflows/ci.yml`

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install root deps
        run: npm install

      - name: Install engine
        working-directory: engine
        run: npm install

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Typecheck engine
        working-directory: engine
        run: npx tsc --noEmit

      - name: Build engine
        working-directory: engine
        run: npm run build

      - name: Test engine
        working-directory: engine
        run: npm test

      - name: Install + test each bundle
        run: |
          set -e
          for d in bundles/*/; do
            echo "::group::$(basename "$d")"
            (
              cd "$d"
              npm install --no-audit --no-fund
              if grep -q '"build"' package.json; then npm run build; fi
              if grep -q '"test"' package.json; then npm test; fi
            )
            echo "::endgroup::"
          done

      - name: Install + test generators
        run: |
          set -e
          for d in generators/*/; do
            echo "::group::$(basename "$d")"
            (
              cd "$d"
              npm install --no-audit --no-fund
              if grep -q '"build"' package.json; then npm run build; fi
              if grep -q '"test"' package.json; then npm test; fi
            )
            echo "::endgroup::"
          done

      - name: Smoke test (generate + verify)
        run: |
          node engine/bin/fixedcode.js generate examples/workspace-service/workspace-domain.yaml -o /tmp/smoke
          node engine/bin/fixedcode.js verify examples/workspace-service/workspace-domain.yaml /tmp/smoke

      - name: npm audit (engine)
        working-directory: engine
        run: npm audit --audit-level=high
        continue-on-error: true
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for typecheck, lint, build, test, smoke

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 28: Add `.github/workflows/release.yml`

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  id-token: write   # for npm provenance via OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - name: Install + build engine
        working-directory: engine
        run: |
          npm install
          npm run build
          npm test

      - name: Pack tarball
        working-directory: engine
        run: npm pack

      - name: Publish to npm with provenance
        working-directory: engine
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: engine/*.tgz
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions release workflow (npm publish + GitHub release on v* tags)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 29: Add `.github/workflows/codeql.yml`

**Files:**
- Create: `.github/workflows/codeql.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: CodeQL

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
  schedule:
    - cron: '0 5 * * 1'

permissions:
  actions: read
  contents: read
  security-events: write

jobs:
  analyze:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        language: ['javascript-typescript']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/analyze@v3
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/codeql.yml
git commit -m "ci: add CodeQL JavaScript/TypeScript scanning

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 30: Add `.github/dependabot.yml`

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Write config**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
  - package-ecosystem: "npm"
    directory: "/engine"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

- [ ] **Step 2: Commit**

```bash
git add .github/dependabot.yml
git commit -m "ci: add Dependabot config for npm and GitHub Actions weekly updates

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 31: Push and verify CI green

- [ ] **Step 1: Push**

```bash
git push origin master
```

- [ ] **Step 2: Watch CI**

```bash
gh run watch
```
Expected: ci.yml goes green on Node 20 and Node 22.

- [ ] **Step 3: If anything fails, fix in place and push again**

Repeat until green. Each fix is its own commit using the convention `ci: <fix>`.

## Task 32: Test release workflow with a pre-release tag (dry run)

- [ ] **Step 1: Tag a pre-release**

```bash
git tag v0.2.0-rc.0
git push origin v0.2.0-rc.0
```

- [ ] **Step 2: Watch release.yml**

```bash
gh run watch
```

- [ ] **Step 3: Check the resulting GitHub release**

```bash
gh release view v0.2.0-rc.0
```

- [ ] **Step 4: Decide: published to npm or not**

If `NPM_TOKEN` and trusted-publisher aren't yet configured, the publish step will fail. That's expected for the dry-run; document the gap and continue.

- [ ] **Step 5: Delete the pre-release once verified**

```bash
gh release delete v0.2.0-rc.0 --yes
git push origin :refs/tags/v0.2.0-rc.0
git tag -d v0.2.0-rc.0
```

## Task 33: Document branch protection in docs/release.md

**Files:**
- Modify: `docs/release.md`

- [ ] **Step 1: Append a "Repo settings" section**

```markdown
## Repo settings (apply manually via GitHub UI)

### Branch protection on `master`
- Require pull request before merging (1 review; relax to 0 for solo maintainer)
- Require status checks: `CI / test (20)`, `CI / test (22)`, `CodeQL`
- Require branches up-to-date before merging
- Auto-delete head branches after merge
- Allow squash-merge only

### Actions secrets
- `NPM_TOKEN` — npm automation token, OR configure trusted publisher in npm.

### Trusted publisher (preferred)
1. On npm: package settings → Publishing access → "Add a trusted publisher".
2. Provide org, repo (`gibbon/fixedcode`), workflow file (`release.yml`), env (none).
3. Remove `NPM_TOKEN` once trusted publisher is verified working.
```

- [ ] **Step 2: Commit**

```bash
git add docs/release.md
git commit -m "docs: document branch-protection and release secrets setup

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

**Phase 4 acceptance gate:**
- `eslint .` and `prettier --check .` clean.
- `ci.yml` green on master with Node 20 + 22.
- `release.yml` exercised end-to-end via the rc.0 tag.
- CodeQL + Dependabot active in repo settings.
- `docs/release.md` documents the manual repo-settings steps.

---

# Phase 5 — Publish v0.2.0

## Task 34: npm pre-flight checks

- [ ] **Step 1: Check name availability**

```bash
npm view @fixedcode/engine 2>&1 | head
```
Expected: 404 / "is not in the npm registry". If taken, fall back to unscoped name `fixedcode-engine` per the spec; update README install lines and CLI publishing commands accordingly.

- [ ] **Step 2: Reserve the @fixedcode org if not already owned**

```bash
npm org ls fixedcode 2>&1 | head
```
If the org doesn't exist, create it via `npm org create fixedcode` (free for public packages).

- [ ] **Step 3: Verify package.json metadata**

Edit `engine/package.json` — set/confirm:
- `"version": "0.2.0"`
- `"license": "Apache-2.0"`
- `"author": "Tom D"` (or your preferred attribution)
- `"repository": { "type": "git", "url": "git+https://github.com/gibbon/fixedcode.git" }`
- `"bugs": { "url": "https://github.com/gibbon/fixedcode/issues" }`
- `"homepage": "https://github.com/gibbon/fixedcode#readme"`
- `"engines": { "node": ">=20" }`
- `"files": ["dist", "bin", "README.md", "LICENSE"]`
- `"prepublishOnly": "npm run build && npm test"`

- [ ] **Step 4: Run `npm pack` and inspect tarball**

```bash
cd engine
npm pack --dry-run 2>&1 | tee /tmp/pack-dry.log
```
Expected: file list contains only `dist/`, `bin/`, `package.json`, `README.md`, `LICENSE`. No `src/`, no `tsconfig.json`, no `vitest.config.ts`, no `test/`.

- [ ] **Step 5: Commit metadata changes**

```bash
git add engine/package.json
git commit -m "build(engine): finalise package.json metadata for npm publish

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 35: Configure npm trusted publisher (or NPM_TOKEN fallback)

**Files:** none (GitHub UI + npm UI)

- [ ] **Step 1: Set up trusted publisher (preferred)**

Follow steps in `docs/release.md`. Verify on npm package settings page.

- [ ] **Step 2: If trusted publisher unavailable, generate NPM_TOKEN**

```bash
# Run interactively:
# npm token create --read-only=false --cidr=0.0.0.0/0
# Then add to GitHub repo secrets as NPM_TOKEN.
```

- [ ] **Step 3: Verify by re-running release.yml dry-run on a v0.2.0-rc.1 tag**

```bash
git tag v0.2.0-rc.1
git push origin v0.2.0-rc.1
gh run watch
```
Expected: publish step succeeds (publishes the rc to npm). Verify with `npm view @fixedcode/engine versions`. Then unpublish: `npm unpublish @fixedcode/engine@0.2.0-rc.1` (within 72h window).

```bash
gh release delete v0.2.0-rc.1 --yes
git push origin :refs/tags/v0.2.0-rc.1
git tag -d v0.2.0-rc.1
```

## Task 36: Update registry.json install paths

**Files:**
- Modify: `registry.json` — change every `"install": "npm install @fixedcode/bundle-..."` to a github tarball URL.

- [ ] **Step 1: Build the new install string template**

For each bundle entry, change:
```json
"install": "npm install @fixedcode/bundle-X"
```
to:
```json
"install": "npm install github:gibbon/fixedcode#main:bundles/X"
```
(Or, if that subpath form isn't supported by your CLI, switch to whatever the existing `fixedcode registry install` command actually does — confirm by reading `engine/src/engine/registry.ts`.)

- [ ] **Step 2: Verify the install path works locally**

```bash
node engine/bin/fixedcode.js registry install spring-domain
```
Expected: succeeds and registers the bundle.

- [ ] **Step 3: Update `docs/registry.md` if behaviour differs**

- [ ] **Step 4: Commit**

```bash
git add registry.json docs/registry.md
git commit -m "feat(registry): point install paths at github tarballs (npm distribution deferred)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 37: Final pre-publish gate

- [ ] **Step 1: All CI green**

```bash
gh run list --branch master --limit 5
```

- [ ] **Step 2: Tests on a clean install**

```bash
cd /tmp && rm -rf fc-clean && git clone git@github.com:gibbon/fixedcode.git fc-clean
cd fc-clean
npm install
cd engine && npm install && npm test
cd ../..
rm -rf /tmp/fc-clean
cd ~/projects/fixedcode
```

- [ ] **Step 3: Inspect tarball one more time**

```bash
cd engine && npm pack && tar -tzf fixedcode-engine-0.2.0.tgz | sort | head -50 && rm -f fixedcode-engine-0.2.0.tgz
cd ..
```

- [ ] **Step 4: Confirm CHANGELOG.md [0.2.0] section is accurate**

Bump the date placeholder in `CHANGELOG.md` to today's date.

```bash
git diff CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: finalise CHANGELOG date for 0.2.0

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

## Task 38: Tag and publish v0.2.0

- [ ] **Step 1: Tag**

```bash
git tag v0.2.0
git push origin v0.2.0
```

- [ ] **Step 2: Watch release.yml**

```bash
gh run watch
```
Expected: build → test → npm publish (with provenance) → GitHub release created.

- [ ] **Step 3: Verify on npm**

```bash
npm view @fixedcode/engine versions
npm view @fixedcode/engine@0.2.0
```
Expected: 0.2.0 listed; package metadata correct; provenance attestation present.

- [ ] **Step 4: Verify GitHub Release**

```bash
gh release view v0.2.0
```

## Task 39: End-to-end smoke test from npm

- [ ] **Step 1: Install globally on a fresh path**

```bash
mkdir -p /tmp/fc-public-smoke && cd /tmp/fc-public-smoke
npm init -y
npm install @fixedcode/engine
npx fixedcode --version
```
Expected: prints `0.2.0`.

- [ ] **Step 2: Generate something**

```bash
git clone git@github.com:gibbon/fixedcode.git /tmp/fc-src
npx fixedcode generate /tmp/fc-src/examples/workspace-service/workspace-domain.yaml -o /tmp/fc-public-smoke/out
ls /tmp/fc-public-smoke/out | head
```
Expected: generated files visible.

- [ ] **Step 3: Verify**

```bash
npx fixedcode verify /tmp/fc-src/examples/workspace-service/workspace-domain.yaml /tmp/fc-public-smoke/out
```
Expected: all checks passed.

- [ ] **Step 4: Cleanup**

```bash
rm -rf /tmp/fc-public-smoke /tmp/fc-src
```

## Task 40: Post-publish housekeeping

- [ ] **Step 1: Update README badges**

Confirm the npm version badge now resolves to `0.2.0`. If not, force a refresh by linking through shields.io with `?cacheSeconds=60`.

- [ ] **Step 2: Open follow-up issues for everything deferred**

- "Publish bundles to npm under @fixedcode" — link to spec section.
- "Migrate to release-please / changesets" — link to spec section.
- Each medium/low security finding from Phase 2.

- [ ] **Step 3: Add a final commit announcing v0.2.0 in CHANGELOG `[Unreleased]`**

```bash
# (no actual change — just confirm the [Unreleased] header is empty and ready to receive next changes)
```

- [ ] **Step 4: Final review**

```bash
gh repo view gibbon/fixedcode --json name,description,url,homepageUrl,licenseInfo
```
Confirm description reads as a clear OSS-tool-for-devs tagline; if empty, set with:

```bash
gh repo edit gibbon/fixedcode --description "Spec-driven, deterministic code generation engine. Same spec → same code, every time." --homepage "https://www.npmjs.com/package/@fixedcode/engine"
```

**Phase 5 acceptance gate:**
- `@fixedcode/engine@0.2.0` live on npm with provenance attestation.
- GitHub Release v0.2.0 published with notes.
- README badges resolve correctly.
- Fresh-machine `npm install @fixedcode/engine` + generate + verify works.
- `fixedcode registry install spring-domain` succeeds against the GitHub-tarball install path.

---

# Done.

The repo is now a presentable OSS dev tool: clean repo, security-reviewed, documented, CI green, npm published. Open the follow-up issues from Task 40 to seed v0.3.0 work.
