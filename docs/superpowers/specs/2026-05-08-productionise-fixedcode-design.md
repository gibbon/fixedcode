# Productionise FixedCode for OSS Release

**Date:** 2026-05-08
**Status:** Approved
**Owner:** Tom D
**Target version:** `@fixedcode/engine@0.2.0`

## Problem

`fixedcode` is a working spec-driven code generation engine but is not yet presentable as a public open-source dev tool. The repo is missing the public-readiness essentials (README, LICENSE, CI, automated releases), has accumulated cruft (build artifacts, slide decks, an old CLI, design PDFs), and has been used as the working tree for an unrelated project ("r.dan") whose 9 bundles are mixed into the codebase. Before this can be promoted as an OSS product, it needs cleanup, a security/best-practices review, documentation, CI/CD, and a publish flow.

## Goals

1. Repo presents as a polished OSS dev tool: README, LICENSE (Apache-2.0), CONTRIBUTING, SECURITY, CHANGELOG, badges, issue/PR templates.
2. Engine is published to npm as `@fixedcode/engine@0.2.0` with provenance.
3. Bundles + the OpenAPI generator stay distributed via the existing `registry.json` model (not npm) — but cleanly documented.
4. CI runs typecheck/lint/test/build on every PR; tagged commits cut a GitHub Release and publish to npm reproducibly.
5. Critical and high security findings are fixed; medium/low are filed as issues.
6. Repo history is sanitised: no rdan code, no slide decks, no PDFs, no `old-cli/`.

## Non-goals

- Bundles are not published to npm (deferred to a future release).
- No logo or wordmark — text + badges only for now.
- No commercial / SaaS positioning — pure OSS for developers.
- No 1.0.0 commitment — engine stays pre-1.0 to allow API evolution.
- No `release-please`/`changesets` automation in this pass — manual release notes for now.
- The community-registry workflow at `fixedcode-ai/registry` is not redesigned in this pass; only its install URLs are updated to point at GitHub tarballs.

## Approach

Cleanup gates everything else. The remaining workstreams (security review, docs, CI/CD, publish) follow in a fixed sequence with each phase having explicit acceptance criteria. The release of `v0.2.0` is the terminal event.

## Inputs / decisions captured during brainstorming

| Decision | Choice |
|---|---|
| Audience | OSS tool for developers |
| Sequencing | Single design covering all 5 workstreams; phased execution |
| License | Apache-2.0 |
| Engine target version | `0.2.0` |
| Bundle publishing | None on npm; registry-only via `registry.json` |
| Pending fixedcode work | All rdan; do not commit, move to `r.dan` repo |
| Rdan bundles destination | `~/projects/r.dan/bundles/` |
| `old-cli/`, `slides-org/`, PDFs | Delete and **purge from git history** |
| Code-review tool | `superpowers:requesting-code-review` skill |
| Logo | Not required |

## Phase 1 — Cleanup

**Goal:** Repo contains only the product (engine + 10 bundles + 1 generator) plus the docs/tooling needed to ship it. Git history contains no rdan/slide/old-cli/PDF residue.

### Actions
1. **Pre-flight backup** — full mirror clone of both `~/projects/fixedcode` and `~/projects/r.dan` to a timestamped path. No destructive op runs without this in place.
2. **Move rdan bundles** — `mv bundles/rdan-* ~/projects/r.dan/bundles/` (covers the 7 already-tracked rdan-* bundles plus the 2 untracked ones, `rdan-config-feature` and `rdan-integration`). The user can later structure them inside the r.dan repo as they see fit.
3. **Discard rdan-related pending work in fixedcode**:
   - Revert `.fixedcode.yaml` (drop the `rdan-integration:` line that's only in the working tree).
   - Revert the working-tree-only edit to `bundles/rdan-dashboard-nextjs-page/templates/dashboard/app/{{Slug}}/page.tsx.hbs` (moot once the dir is moved).
4. **Strip rdan from tracked config**:
   - `.fixedcode.yaml` — remove all `rdan-*:` bundle entries.
   - `registry.json` — remove the 3 rdan-* entries.
   - `docs/superpowers/specs/2026-04-06-python-and-cicd-bundles-design.md` — the doc is mostly about `ts-service`/`ts-agent`/`python-service`/`python-agent` (all kept) but has 4 references to `rdan-agent` (lines 29, 31, 42, 1087). Keep the doc; excise the rdan-agent sections only.
5. **Working-tree cleanup commit** — delete:
   - `order-build/`, `build/`, `aggregates}}/` (stray render outputs)
   - `*:Zone.Identifier` files (Windows-on-WSL noise)
   - Root-level `package.json` + `node_modules/` (single stray `yaml` dep, not part of the engine)
   - `slides-org/`, `old-cli/`, the two design-PDFs at repo root
6. **Tighten `.gitignore`** — at minimum: `dist/`, `node_modules/`, `*:Zone.Identifier`, `.DS_Store`, `build/`, `*-build/`, generated example outputs.
7. **Verify** — for each remaining package (engine, 10 bundles, 1 generator), run `npm install && npm run build && npm test`. Any failure blocks history rewrite.
8. **History rewrite** — `git filter-repo` removing from every commit:
   - `old-cli/`
   - `slides-org/`
   - `Engineering a Deterministic Global Platform.pdf`
   - `GAP CLI - Technical Deep Dive.pdf`
   - `bundles/rdan-*/`
9. **Pre-rewrite confirmation** — `gh pr list` to confirm no open PRs exist that would be invalidated; user confirms before force-push.
10. **Force-push** to `origin/master`.

### Acceptance
- `ls bundles/` shows exactly: `crud-api ddd-basic ddd-spike mcp-wrapper python-agent python-service spring-domain spring-library ts-agent ts-service`
- `git log --all --full-history -- 'bundles/rdan-*'` and `git log --all --full-history -- 'old-cli/'` return empty
- Repo size on disk noticeably smaller post-rewrite
- All remaining packages: build green, tests green
- `git status` is clean

## Phase 2 — Security & Best-Practices Code Review

**Goal:** Find and fix critical/high security and quality issues before the engine becomes publicly installable.

### Scope
A. **Static review** using parallel `Explore` subagents (read-only) plus `superpowers:requesting-code-review` for the consolidated pass:
   - `engine/src/engine/` — pipeline, manifest, registry, deploy, parse, verify, build
   - `engine/src/cli/` — command surface, argument parsing, env handling
   - LLM call paths under `draft` and `enrich`
   - Bundle `enrich()` functions and any custom Handlebars helpers
   - `generators/openapi`

B. **Risk areas**:
   1. **Path traversal** — file outputs derived from spec-supplied names/slugs. Validate that resolved paths stay inside the project root.
   2. **Shell injection** — any `spawn`/`exec` (registry install via npm, bundle init scripts).
   3. **SSRF / arbitrary URL fetch** — registry fetch, LLM `baseUrl` config, openapi remote refs.
   4. **Prompt injection** — `draft` and `enrich` paths must treat LLM output as untrusted; validate JSON shape and reject anything outside the allowed schema.
   5. **Manifest-driven file overwrites** — ensure no escape from project dir even with crafted `path` fields.
   6. **Secret handling** — API key env-var reads must not be logged, written to manifest, or echoed in errors.
   7. **Handlebars** — confirm `noEscape: true` is only used where the output is code/YAML; verify spec values can't trigger prototype pollution via crafted keys.
   8. **`npm audit`** — engine + each remaining bundle, blocking at `--audit-level=high`.
   9. **License audit** — ensure no copyleft (GPL/AGPL) in production deps.

C. **Process**:
   - Spawn parallel Explore agents per scope area; collect findings into a single document at `docs/superpowers/specs/2026-05-08-security-findings.md`.
   - Categorise: critical / high / medium / low.
   - Fix critical + high in this phase. Each fix has a regression test.
   - Defer medium/low to GitHub issues.
   - Run `superpowers:requesting-code-review` on the consolidated diff before declaring the phase complete.

### Deliverables
- Findings document checked in.
- Code fixes for critical + high, each with a regression test.
- `SECURITY.md` at repo root with disclosure email and supported versions.

### Acceptance
- All critical + high items closed.
- `npm audit --audit-level=high` clean across all remaining packages.
- `superpowers:requesting-code-review` returns no blocking issues.

## Phase 3 — Documentation

**Goal:** A new visitor can land on the GitHub repo, understand what FixedCode is, install it, and run the first generation in under five minutes.

### Files at repo root
1. **`README.md`** — sections: hero (name, tagline, value prop), badges (npm version, build, license, node, PRs welcome), "Why FixedCode?", quickstart (install, generate, deploy), concepts (Bundle / Generator / Spec) with simple diagrams, the AI Sandwich workflow with commands, bundle catalog table, CFR catalog table linking out, roadmap teaser, contributing pointer, license footer.
2. **`LICENSE`** — Apache-2.0 full text plus copyright line.
3. **`CONTRIBUTING.md`** — dev setup (node version, install layout), project layout, how to add a bundle/generator, commit-message convention, test strategy, PR process.
4. **`CODE_OF_CONDUCT.md`** — Contributor Covenant 2.1.
5. **`SECURITY.md`** — written in Phase 2; lives here.
6. **`CHANGELOG.md`** — Keep-a-Changelog format; first entry is `[0.2.0] — 2026-05-XX` summarising productionisation work.

### `.github/`
7. `ISSUE_TEMPLATE/{bug.yml, feature.yml, question.yml}`
8. `PULL_REQUEST_TEMPLATE.md`
9. `FUNDING.yml` placeholder (off by default; commented out)

### `docs/`
10. `architecture.md` — engine pipeline diagram, contracts (Bundle, Generator, FileEntry).
11. `bundles.md` — writing your own bundle, schema rules, conventions, extension points.
12. `generators.md` — writing a generator, adapter contract, OpenAPI as the worked example.
13. `cfrs.md` — CFR catalog, how-to declare/check.
14. `registry.md` — registry model, install/publish flow, bundle distribution rationale.
15. `llm.md` — LLM config, security caveats for prompt injection, mocking in tests.
16. `release.md` — internal: how to cut a release, branch-protection settings.

### Per-package READMEs
17. `engine/README.md` — full CLI reference + programmatic API.
18. `generators/openapi/README.md`
19. `bundles/<each>/README.md` for all 10 remaining bundles — purpose, schema highlights, output snapshot.

### Acceptance
- All files above present.
- README links resolve (verified with a link checker).
- Quickstart works against a clean machine (verified manually).

## Phase 4 — CI/CD

**Goal:** Every PR proves the repo is healthy; tagged commits ship a release.

### Workflows under `.github/workflows/`
1. **`ci.yml`** — runs on PR + push to master:
   - Matrix: Node 20, 22 on `ubuntu-latest`.
   - Steps: checkout → setup-node with cache → install all packages → typecheck (`tsc --noEmit`) → lint (ESLint flat config) → format check (`prettier --check`) → build all packages → run all vitest suites with coverage → upload to Codecov (skipped automatically when `CODECOV_TOKEN` is not set) → smoke test (`fixedcode generate examples/workspace-service/workspace-domain.yaml -o /tmp/out && fixedcode verify ...`) → `npm audit --audit-level=high` (non-blocking, posts comment).

2. **`release.yml`** — runs on tag `v*`:
   - checkout → setup-node → install → build → test
   - `npm publish ./engine --provenance` (OIDC auth via npm trusted publisher)
   - Create GitHub Release with notes pulled from the matching CHANGELOG section
   - Attach `npm pack` tarball as a release asset

3. **`codeql.yml`** — GitHub default CodeQL JavaScript/TypeScript scanning.

4. **`.github/dependabot.yml`** — weekly npm + github-actions updates.

### Tooling additions
- ESLint 9 flat config + `@typescript-eslint`, minimal opinionated rule set.
- Prettier with a single root `.prettierrc.json`.
- `husky` + `lint-staged` are out of scope for this pass; CI is the source of truth.
- `commitlint` is out of scope for this pass.

### Repo settings (documented in `docs/release.md`, applied manually)
- Branch protection on `master`: required CI checks (`ci/typecheck`, `ci/test`, `ci/lint`); 1 review unless solo maintainer.
- Auto-delete merged branches.
- Squash-merge only.

### Acceptance
- Open PR runs `ci.yml` end-to-end and goes green.
- A throwaway pre-release tag `v0.2.0-rc.0` exercises `release.yml` end-to-end against a test npm package or `--dry-run`.
- CodeQL + Dependabot show as active in repo settings.
- `eslint .` and `prettier --check .` pass locally.

## Phase 5 — Publish v0.2.0

**Goal:** `npm install @fixedcode/engine` works, GitHub Release v0.2.0 is live, registry installs work end-to-end.

### Pre-flight checklist
1. All CI green on master.
2. `SECURITY.md` present; `npm audit` clean at `--audit-level=high`.
3. README + LICENSE + CHANGELOG present and accurate.
4. `npm publish --dry-run` from `engine/` produces expected file list.
5. `npm pack` tarball inspected (`tar -tzf`) — only `dist/`, `bin/`, `package.json`, `README.md`, `LICENSE`.
6. `@fixedcode` npm org and `@fixedcode/engine` package name reserved (check via `npm view @fixedcode/engine` first).
7. npm trusted-publisher configured: GitHub Actions OIDC for `gibbon/fixedcode` workflow.

### Engine `package.json` adjustments
- `"version": "0.2.0"`
- `"files"` allowlist: `dist/`, `bin/`, `README.md`, `LICENSE`
- `"engines": { "node": ">=20" }`
- `"prepublishOnly": "npm run build && npm test"`
- `"repository"`, `"bugs"`, `"homepage"`, `"author"`, `"license": "Apache-2.0"` populated.

### Bundle / generator distribution
- `registry.json` install fields updated to point at GitHub tarballs (or git refs) instead of `npm install @fixedcode/bundle-...`. The CLI install command continues to work; the install path just changes.
- `docs/registry.md` documents this and notes that npm distribution may come later.

### GitHub Release
- Tag `v0.2.0` triggers `release.yml`.
- Release notes from `CHANGELOG.md` `[0.2.0]` section.
- Engine tarball attached.

### Acceptance
- `@fixedcode/engine@0.2.0` visible on npm with provenance attestation.
- GitHub Release `v0.2.0` exists with notes.
- Fresh machine: `npm install -g @fixedcode/engine` then `fixedcode generate <example>` works without errors.
- `fixedcode registry install spring-domain` successfully fetches from GitHub.
- README badges render and resolve correctly.

## Phasing & gates

Phases run strictly in order. Each phase's acceptance criteria must be met before the next phase starts. The autonomous-execution rule from `~/.claude/CLAUDE.md` applies: don't pause at milestones, fix and move on, only stop if truly stuck after 3 attempts. Run `superpowers:requesting-code-review` after each phase but don't block on user input for the review.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| History rewrite breaks open PRs/forks | `gh pr list` and fork-count check before force-push; communicate if non-zero. |
| `@fixedcode/engine` already taken on npm | Check via `npm view` early in Phase 5 pre-flight; reserve immediately. **Fallback:** publish unscoped as `fixedcode-engine` and update CLI install docs accordingly. |
| LLM tests breaking CI without API keys | Mock LLM client by default in vitest; gate integration tests behind an env var. |
| Force-push race with collaborators | Solo maintainer per current state; revisit if that changes. |
| Rdan move loses work | Pre-flight mirror-clone backup; `mv` (not `cp` then `rm`) preserves files atomically. |
| Smoke test in CI flaky due to file system writes | Use a tmp dir; clean up after each run. |
| Phase 2 finds something that requires major rework | Acceptable. Pause publish, fix, re-run review. The publish gate is the last one for a reason. |

## Out of scope (future phases)

- Publishing bundles + generators to npm.
- `release-please` or `changesets` automation.
- Logo / brand identity.
- Marketing site changes (`website/` is touched only if it references things that no longer exist).
- Bundle community-registry workflow redesign.
- Telemetry / usage analytics.
