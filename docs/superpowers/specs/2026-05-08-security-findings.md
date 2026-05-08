# Security Review Findings — v0.2.0 productionisation

**Date:** 2026-05-08
**Scope:** engine/src, bundle helpers, generators
**Method:** 4 parallel Explore subagents (path traversal, shell injection, LLM safety, Handlebars/templates) plus consolidated triage.

## Severity legend
- **Critical** — exploitable in default config; ship-blocker
- **High** — exploitable with non-default but plausible config; fix this phase
- **Medium** — defense-in-depth, hard to exploit, or hardening; defer to issue
- **Low** — note only; defer to issue

## Summary

| ID | Severity | Area | File | Status |
|----|----------|------|------|--------|
| F-1 | high | path traversal | engine/src/cli/bundle-init.ts | **Fix this phase** |
| F-2 | medium | path traversal | engine/src/engine/deploy.ts | Issue |
| F-3 | medium | path traversal | engine/src/engine/enrich.ts (`--spec`) | Issue |
| F-4 | medium | path traversal | engine/src/engine/dynamicImport.ts | Issue |
| F-5 | high | shell args | engine/src/engine/registry.ts (`registryRepo`) | **Fix this phase** |
| F-6 | medium | shell args | engine/src/engine/registry.ts (branch names) | Issue |
| F-7 | high | shell args | engine/src/engine/registry.ts (`npm install` regex too permissive) | **Fix this phase** |
| F-8 | high | LLM | engine/src/engine/llm.ts (`baseUrl` not validated) | **Fix this phase** |
| F-9 | high | LLM | engine/src/engine/enrich.ts (writes LLM output without validation) | Document + warn |
| F-10 | medium | LLM | engine/src/cli/enrich-cmd.ts (no upload warning) | Issue |
| F-11 | medium | LLM | enrich + draft (prompt-injection through spec values) | Issue (inherent) |
| F-12 | low | LLM | engine/src/engine/llm.ts (env-var name in error msg) | Issue |
| Handlebars/templates | — | clean | — | No findings |

## Findings — fixed this phase (high)

### F-1 — Path traversal in `bundle init <name>`
**File:** `engine/src/cli/bundle-init.ts:18`
**Risk:** The bundle name is joined into `path.join(opts.output, name)` without validation. `fixedcode bundle init "../../etc/evil" -o ./bundles` writes outside the bundles dir.
**Fix:** Reject names containing path separators or starting with `.`; resolve and require the result to start with `resolve(opts.output) + sep`.

### F-5 — Unvalidated `registryRepo` argument passed to `gh repo clone`
**File:** `engine/src/engine/registry.ts:195`
**Risk:** `registryRepo` from `PublishOptions` is passed to `gh repo clone <registryRepo>`. While array-form `execFileSync` blocks shell injection, gh may interpret `--help`, `-R`, or other flag-like values. This is reachable from the CLI.
**Fix:** Validate against `/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/` (GitHub `owner/repo` format) before any shell call.

### F-7 — `npm install` registry-entry regex too permissive
**File:** `engine/src/engine/registry.ts:80`
**Risk:** Current regex `/^npm install [\w@/.:-]+$/` allows `npm install ../../backdoor` because `.` is in the char class. A malicious registry entry can install from a relative path.
**Fix:** Tighten to require an `@scope/name` or `name` form, no `..`, no leading `/` or `.`.

### F-8 — LLM `baseUrl` not validated → exfiltration risk
**File:** `engine/src/engine/llm.ts:56`, `engine/src/engine/config.ts:57`
**Risk:** A user (or attacker editing `.fixedcode.yaml`) can set `llm.baseUrl` to any URL. When `enrich` runs, project file contents and the API key are sent there.
**Fix:** Validate `baseUrl` is `https://` (or `http://localhost*`) and matches an allowlist of known hostnames (`openrouter.ai`, `api.openai.com`, `api.anthropic.com`, `localhost`, `127.0.0.1`). Reject anything else with a clear error.

### F-9 — `enrich` writes LLM output without language validation
**File:** `engine/src/engine/enrich.ts:290`
**Risk:** Stripped LLM output is written to disk as-is. A malicious LLM endpoint or prompt-injected response can introduce arbitrary code into extension-point files.
**Fix this phase:** Add a console warning before each enrich write listing the destination file and the LLM endpoint, plus document the assumption in `docs/llm.md` that the user MUST review the diff before committing. Full AST-based validation is out of scope for v0.2.0 (issue F-9-followup filed for v0.3.x).

## Findings — deferred (issues, not blockers)

### F-2 — `deploy.ts` lacks explicit path-containment
**File:** `engine/src/engine/deploy.ts:60`
**Risk:** Defense-in-depth — `relPath` is derived from filesystem walk so the only realistic exploitation requires malicious symlinks in the build dir. The pipeline write path already contains the same files via writeWithManifest's `containsPath` check, so this is duplicate-checking.
**Fix:** Add `if (!resolve(dstPath).startsWith(resolve(dstDir) + sep)) throw …` to deploy.ts. Filed as issue.

### F-3 — `enrich --spec` accepts absolute paths without containment
**File:** `engine/src/engine/enrich.ts:228, 236`
**Risk:** `--spec /etc/passwd` would read it and ship the contents to the LLM. Non-default flow but plausible if a user copy-pastes a path.
**Fix:** Require `--spec` to resolve under the project's outputDir or be a sibling of the YAML file. Filed as issue.

### F-4 — `dynamicImport` doesn't `realpath` the resolved entry
**File:** `engine/src/engine/dynamicImport.ts:36`
**Risk:** A bundle with `"main": "../../foo.js"` gets imported. Bundles are user-installed code that runs in our process so this is post-trust; still worth tightening.
**Fix:** `fs.realpath` the resolved entry and require it under bundleDir. Filed as issue.

### F-6 — Branch names not validated against `git check-ref-format`
**File:** `engine/src/engine/registry.ts:191`
**Risk:** Already in array-form spawn so injection is blocked; `git` itself rejects malformed branch names. Defense-in-depth only.
**Fix:** Validate regex `^[a-z0-9][a-z0-9._/-]*$` before use. Filed as issue.

### F-10 — `enrich` should prompt before sending files to LLM
**File:** `engine/src/cli/enrich-cmd.ts`
**Risk:** Users may not realise enrich uploads project files. Privacy/policy concern.
**Fix:** Print "About to send N files (~K KB) to <baseUrl>. Continue? [y/N]" unless `--yes` is set. Filed as issue.

### F-11 — Prompt injection through spec values
**File:** `engine/src/engine/enrich.ts`, `engine/src/engine/draft.ts`
**Risk:** Inherent LLM risk. Worth documenting.
**Fix:** Wrap user-supplied content in delimited blocks (e.g. `<USER_SPEC>...</USER_SPEC>`) in the prompt. Document in `docs/llm.md`. Filed as issue.

### F-12 — Env-var name leaked in error message
**File:** `engine/src/engine/llm.ts:60`
**Risk:** Error like "Set MY_SECRET_KEY env var" reveals the configured env-var name. Marginal; not the secret itself.
**Fix:** Genericise the error to "API key not found; configure llm.apiKeyEnv in `.fixedcode.yaml` and set the env var." Filed as issue.

## npm audit (outstanding)

To be re-run after fixes; full results recorded under "Phase 2 verification" in the plan.

## License audit (outstanding)

To be run via `license-checker` after fixes.
