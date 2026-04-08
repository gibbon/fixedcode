# Code Review Findings — 2026-04-08

Comprehensive review of fixedcode engine, spring-domain bundle, and python-agent bundle.

## Final Totals: 7 CRITICAL, 20 HIGH, 26 MEDIUM, 23 LOW

### Engine additions (2 CRITICAL, 7 HIGH, 11 MEDIUM, 9 LOW):

**CRITICAL:**
- C6. `execSync` with shell injection in registry.ts:87 — registry install uses shell. Fix: use `execFileSync`.
- C7. `require()` in ESM module in cfr.ts:103 — will fail in strict ESM. Fix: use top-level imports.

**HIGH:**
- H14. Zip temp directory never cleaned up in draft.ts:180 — leaks extracted files on disk.
- H15. Unused `RenderedFileWithMeta` type in types.ts:92 — dead code.
- H16. Unused imports in pipeline.ts — `RawSpec`, `FixedCodeConfig`, `RenderedFile`, `writeFiles`, `WriteOptions`.
- H17. `deploy --clean` declared but never implemented.
- H18. `DraftError` class defined but never used.
- H19. Incomplete public API exports — `fetchRegistry`, `searchRegistry`, etc. not exported from src/index.ts.
- H20. `renderFile` creates new Handlebars instance per file — 100+ instantiations per generate.

**MEDIUM:**
- Ajv recompiles schema each call, matchGlob potential ReDoS, validateEnvelope misleading return type, findCommonDir incorrect startsWith algorithm, Windows HOME fallback missing, hardcoded engine version, build doesn't pass configPath, deploy hardcoded to Spring dirs, no exports field in package.json, fast-glob dependency unused, spec-resolver unused dirname import.

**LOW:**
- No path traversal check on generateFiles output, lazy imports in init.ts, verify.ts hardcoded to spring bundles, migration consolidation fragile SQL parsing, no tests for core pipeline/config/manifest/parse/render/build/deploy/verify/registry.

---

## CRITICAL (5 total)

### C1. SQL injection in python-agent database tool template
**File:** `bundles/python-agent/templates/tools/database.py.hbs:24-26,53`
The `_is_read_only` check is bypassable with `SELECT 1; DROP TABLE users;--`. The `cur.execute(query)` receives raw unsanitized LLM input.
**Fix:** Set `conn.autocommit = False`, `SET TRANSACTION READ ONLY`, reject semicolons.

### C2. Command injection in python-agent CLI tool template
**File:** `bundles/python-agent/templates/tools/cli.py.hbs:21-28`
Uses `shell=True` with string replacement. The `{repo}` substitution does no sanitization. Double-quoted `{input}` breaks shlex.quote.
**Fix:** Use `subprocess.run(shlex.split(cmd), shell=False)` where possible, or at minimum sanitize `{repo}`.

### C3. Auth middleware ships with JWT signature verification disabled
**File:** `bundles/python-agent/templates/middleware/auth.py.hbs:18`
`options={"verify_signature": False}` means any forged JWT passes. Generated code ships in this state.
**Fix:** Add JWKS verification or raise a startup warning.

### C4. spring-domain `parseSpec` shallow validation with unsafe cast
**File:** `bundles/spring-domain/src/enrich/spec.ts:46`
Checks only 3 top-level keys then `as unknown as RawDomainSpec`. Missing `service.package` causes crash.
**Fix:** Validate `service.package` before cast.

### C5. spring-domain event fields hardcoded to UUID type
**File:** `bundles/spring-domain/templates/.../AggregateEvents.kt.hbs:16`
All event fields render as `UUID`. A `status` field would produce invalid Kotlin.
**Fix:** Propagate type from aggregate attributes during event enrichment.

---

## HIGH (13 total)

### H1. Missing `llm-decided` routing template (python-agent)
Schema allows it, but no template code generates a `route()` function for it. Runtime ImportError.

### H2. Missing `python-dotenv` dependency in pyproject.toml (python-agent)
`main.py.hbs` calls `load_dotenv()` but the dep isn't listed.

### H3. Broken `create_agent` import in Strands app.py CLI mode (python-agent)
`_chat_loop()` calls `create_agent` before it's imported.

### H4. Non-Strands providers massively behind Strands (python-agent)
No progress tracking, no cost estimation, no session management, no request validation, no structured output, no streaming. Only Strands is production-quality.

### H5. Broken import in orchestrator agent.py.hbs (python-agent)
`from ..shared import` needs to be `from ...shared import` given the actual directory depth.

### H6. spring-domain `deriveFindSuffix` naive singularization
Uses `/s$/` instead of `pluralize.singular()`. Breaks on `parties` → `Partie`.

### H7. spring-domain schema too permissive
`commands: { "type": "array" }` with no item validation. `commands: [42, true]` passes schema.

### H8. Duplicated `parseParam` and `AggCtx` in spring-domain command.ts and query.ts
DRY violation — identical code in two files.

### H9. spring-domain `methodSignature` hardcodes all params as String
Path params should be UUID, body params should use actual types.

### H10. spring-domain missing `plural` property in schema
`plural: partys` works in enrichment but isn't declared in schema.json.

### H11. No default for `tool.config.timeout` (python-agent)
Omitting timeout generates `timeout=,` — Python syntax error.

### H12. No tool config validation per type (python-agent)
CLI without `command`, HTTP without `baseUrl`, DB without `databases` all generate broken code.

### H13. Orchestrator Dockerfile hardcodes `app:app` (python-agent)
Should be `main:app` in orchestrator mode.

---

## MEDIUM (15 total)

### python-agent (8)
- M1. Orchestrator `conftest.py` imports `app` not `main` in orchestrator mode
- M2. Orchestrator agents don't wire declared tool references
- M3. Unused `json` import in claude-agent-sdk app.py
- M4. CFR claims `tracing` but only has correlation-id (not OpenTelemetry)
- M5. Schema `else` requires tools in single mode but enrichment defaults to empty
- M6. No `.env.example` template
- M7. Resume endpoint creates blank session instead of resuming
- M8. Unused `ChatContentPart` import in enrich.ts

### spring-domain (7)
- M9. `deriveAuth` ignores `resource` parameter (dead param)
- M10. `remote_aggregates` declared but never consumed
- M11. No test coverage for enrichAttributes, enrichEvents, enrichEntity, toOpenApi
- M12. Duplicated `toPascal` in naming.ts and conventions.ts
- M13. Template trailing comma in command data classes
- M14. Body params hardcoded to String in command templates
- M15. `_metadata` unused in enrich()

---

## LOW (14 total)

### python-agent (8)
- L1. Progress store grows unboundedly (memory leak)
- L2. `EnrichedMiddleware.hasAuth` field redundant
- L3. Inconsistent Ollama config (settings vs env var)
- L4. `SessionSummary` schema unused
- L5. `ToolCall`/`AgentMetrics` schemas never populated
- L6. Unused `json` import in claude-agent-sdk
- L7. `ResumeSessionRequest` used but resume doesn't work
- L8. No `.env.example` generated

### spring-domain (6)
- L9. `defaultValue` enriched but never used in templates
- L10. `enumDefaults` enriched but no template consumes it
- L11. Query params not rendered in API delegate
- L12. CFR files map incomplete (4 of 11 mapped)
- L13. No `@last` handling for multi-path-param queries
- L14. `returns` field on commands accepted but never used
