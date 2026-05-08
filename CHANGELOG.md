# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Removed
- `bundles/spring-library` — replaced with a generic project-skeleton bundle in a future release.
- `bundles/mcp-wrapper` — to be reintroduced with cleaner external references.
- `examples/workspace-service` — replaced with simpler examples.
- `docs/archive/` and `docs/business-plan.md`.

### Notes
- Repo history rewritten to remove unrelated content. Force-push pre-v0.2.1.

## [0.2.0] — 2026-05-09

First public OSS release.

### Added
- Productionisation of the repo: README, LICENSE (Apache-2.0), CONTRIBUTING, SECURITY, CHANGELOG.
- GitHub Actions CI for typecheck, lint, build, test, and smoke generation.
- GitHub Actions release workflow that publishes `fixedcode` to npm with provenance.
- ESLint 9 + Prettier configuration at the repo root.
- CodeQL JavaScript/TypeScript security scanning.
- Dependabot config (npm + GitHub Actions, weekly).
- Per-package READMEs for the engine, the OpenAPI generator, and each bundle.
- Issue templates (bug / feature / question) and a PR template under `.github/`.
- LLM `baseUrl` allowlist (`engine/src/engine/llm.ts`) — restricts the LLM endpoint to known providers (OpenRouter, OpenAI, Anthropic) and loopback hosts (`localhost`, `127.0.0.1`, `[::1]`).
- Privacy banner on `fixedcode enrich` reminding users that file content is sent to the configured LLM endpoint and that LLM output is written verbatim — review with `git diff` before committing.

### Changed
- Removed unrelated `rdan-*` bundles (now live in a separate repo).
- Cleaned the repo of build artifacts, slide decks, and historical PDFs; rewrote git history to drop them entirely (see Phase 1 of the productionisation design).
- `bundle init <name>` now validates `<name>` against `^[a-z0-9][a-z0-9_-]*$` to prevent path traversal.
- `registry publish`'s `registryRepo` argument is now validated as `owner/repo` before any `gh`/`git` invocation.
- `registry install` parsing tightened: rejects relative paths and absolute paths in the package identifier; accepts `github:owner/repo[#ref]` for GitHub-hosted bundles.
- Bumped `vitest` to `^3` and `typescript` to `^5.7` across packages, closing the dev-dep audit findings carried by the older versions.

### Removed
- `bundles/ddd-basic` — broken-on-arrival spike, superseded by `spring-domain`.

### Security
- Code-review pass with `superpowers:requesting-code-review`. Five critical/high findings (F-1, F-5, F-7, F-8, F-9 in `docs/superpowers/specs/2026-05-08-security-findings.md`) fixed with regression tests. Seven medium/low findings deferred to issues #1–#7; AST-based LLM-output validation tracked in #8.

### Notes
- This is a pre-1.0 release. The engine's API may evolve in 0.3.x.
- `registry.json` is a discovery catalog in v0.2.0; bundles and the OpenAPI generator are not yet published to npm. `fixedcode registry list` and `search` work for discovery; `fixedcode registry install` will 404 until those packages ship. To use a bundle today, register a local `file:` path in `.fixedcode.yaml`.

[Unreleased]: https://github.com/gibbon/fixedcode/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/gibbon/fixedcode/releases/tag/v0.2.0
