# FixedCode — AI Agent Guide

Spec-driven code generation engine. YAML specs in, production code out. Deterministic — same spec always produces identical output.

## Project Structure

```
engine/           TypeScript engine — CLI, pipeline, types
bundles/          Template packages that generate code
  spring-library/ Project skeleton (Gradle, Docker, configs) — 102 templates
  spring-domain/  DDD domain code (aggregates, commands, queries) — 20+ templates per spec
generators/       Programmatic (non-template) code producers
  openapi/        OpenAPI 3.0.3 spec generator
examples/         Working examples with specs and generated output
website/          Next.js marketing site
registry.json     Local package index (also hosted at fixedcode-ai/registry on GitHub)
```

## CLI Commands

All commands are available via `node engine/bin/fixedcode.js <command>` or after `npm link` as `fixedcode <command>`.

### Generate code from a spec
```bash
fixedcode generate <spec.yaml> -o <outputDir>
```

### Build from all specs in a directory
```bash
fixedcode build <specDir> -o <outputDir>
```
Runs library specs first, then domain specs. Consolidates migrations.

### Verify expected files exist
```bash
fixedcode verify <spec.yaml> <outputDir>
```
Checks every expected file from the spec was generated. Returns pass/fail with list of missing files.

### Deploy to a target project
```bash
fixedcode deploy <buildDir> <targetDir>
```
Copies generated output into a downstream project. Smart migration handling — skips existing V002 files.

### Validate a spec (no generation)
```bash
fixedcode validate <spec.yaml>
```

### Registry — search, install, publish
```bash
fixedcode registry list                        # list all available bundles/generators
fixedcode registry list --kind generator       # filter by kind
fixedcode registry search <query>              # fuzzy search on name/description/tags
fixedcode registry install <name>              # npm install + add to .fixedcode.yaml
fixedcode registry publish --kind bundle --tags "tag1,tag2"  # open PR to registry repo
```

## Spec Format

Specs are YAML files with a standard envelope:

```yaml
apiVersion: "1.0"
kind: spring-domain          # matches a registered bundle
metadata:
  name: workspace-service

spec:
  # bundle-specific content
```

### spring-domain spec conventions
- `fieldName: type` — required field
- `fieldName?: type` — optional field (? suffix)
- `fieldName: type = Default` — field with default value
- First `uuid` attribute = identity field (used for path params)
- `plural: partys` — override auto-pluralization
- Command naming conventions: `Create*` → POST, `Update*` → PUT, `Delete*` → DELETE, `Get*` → GET by ID, `Search*` → GET paged, `Find*By*` → GET with derived path

## Architecture

### Engine Pipeline
```
spec.yaml → parse → validate → enrich → [generateFiles OR renderTemplates] → run generators → write
```

### Bundle Interface
```typescript
interface Bundle {
  kind: string;                    // matches spec.kind
  specSchema: object;              // JSON Schema for validation
  enrich(spec, metadata): Context; // transform spec → rich context
  templates: string;               // path to Handlebars templates
  generateFiles?(ctx): FileEntry[];    // optional: explicit file list (for one-to-many)
  adapters?: Record<string, fn>;       // optional: maps context for generators
  helpers?: Record<string, fn>;        // optional: custom Handlebars helpers
}
```

### Generator Interface
```typescript
interface Generator {
  name: string;                              // matches bundle adapter key
  generate(input: Record<string, unknown>): RenderedFile[];
}
```

Generators are standalone — they define their own input contract. Bundles provide adapters to map their enriched context into the generator's expected shape. The engine wires them together.

### Regeneration Contract
- **Generated files** (`overwrite: true`) — always overwritten on regeneration
- **Extension points** (`overwrite: false`) — generated once, then user-owned (e.g. `DefaultBusinessService.kt`)
- `.fixedcode-manifest.json` tracks every generated file with hash and overwrite flag
- `.fixedcodeignore` — glob patterns for files the engine should never touch

### Configuration
`.fixedcode.yaml` in the project root:
```yaml
bundles:
  spring-domain: "./bundles/spring-domain"   # local path
  hello-world: "@fixedcode/bundle-hello-world"  # npm package
generators:
  openapi: "./generators/openapi"
```

## Cross-Functional Requirements (CFRs)

CFRs are non-functional requirements every service needs: auth, logging, error handling, etc. Bundles declare which CFRs they bake in. The engine verifies and reports on compliance.

### CFR CLI Commands
```bash
fixedcode cfr catalog                              # list all 28 known CFRs across 7 categories
fixedcode cfr catalog --category security          # filter by category
fixedcode cfr suggest <spec.yaml>                  # show CFRs not yet covered by the bundle
fixedcode cfr check <spec.yaml> <outputDir>        # verify CFR files are present after generation
fixedcode cfr report <spec.yaml> <outputDir>       # generate Markdown compliance report
fixedcode cfr report <spec.yaml> <outputDir> -o compliance.md  # save to file
```

### CFR Categories
- **security** — auth, authorization, CORS, input validation, rate limiting
- **observability** — logging, metrics, health checks, tracing, audit log
- **resilience** — error handling, retry, circuit breaker, optimistic locking, dead letter queue
- **data** — pagination, filtering, migrations, soft delete
- **events** — domain events, transactional outbox, event schema versioning
- **testing** — unit tests, integration tests, contract tests
- **devops** — Docker, CI/CD, OpenAPI spec

### How bundles declare CFRs
```typescript
export const bundle: Bundle = {
  kind: 'my-bundle',
  // ...
  cfrs: {
    provides: ['auth', 'logging', 'domain-events', 'unit-tests'],
    files: {
      'auth': ['src/main/kotlin/*/config/SecurityConfig.kt'],
      'logging': ['src/main/resources/logback-spring.xml'],
    },
  },
};
```

### How specs configure CFRs
```yaml
spec:
  # ... domain content ...
  cfrs:
    rate-limiting: false    # disable a CFR the bundle provides
    soft-delete: true       # request a CFR (bundle must support it)
```

### AI Agent workflow for CFRs
1. Run `fixedcode cfr suggest <spec>` to see what's missing
2. Add the missing CFRs to the bundle templates
3. Update `cfrs.provides` and `cfrs.files` on the bundle export
4. Run `fixedcode cfr check` to verify everything is wired

## Key Files

- `engine/src/types.ts` — Bundle, Generator, FileEntry, Context interfaces
- `engine/src/engine/pipeline.ts` — main generate() function
- `engine/src/engine/build.ts` — multi-spec build with migration consolidation
- `engine/src/engine/deploy.ts` — smart copy to target project
- `engine/src/engine/verify.ts` — expected file verification
- `engine/src/engine/manifest.ts` — regeneration tracking
- `engine/src/engine/registry.ts` — registry fetch/search/install/publish
- `bundles/spring-domain/src/index.ts` — enrich() + generateFiles()
- `bundles/spring-domain/src/enrich/conventions.ts` — HTTP/auth/response convention engine
- `engine/src/engine/cfr.ts` — CFR catalog, verify, report, suggest
- `generators/openapi/src/index.ts` — OpenAPI spec generator
- `bundles/spring-domain/src/adapters/openapi.ts` — maps domain context to OpenAPI generator input

## Programmatic API

All CLI commands map to importable TypeScript functions:

```typescript
import { generate, validate, build, deploy, verify } from '@fixedcode/engine';
import { fetchRegistry, searchRegistry, installPackage, publishPackage } from '@fixedcode/engine';
```

## AI Sandwich Workflow

FixedCode is designed for AI-assisted development at every layer:

### Top Slice — AI creates the spec

Given natural language requirements, generate a YAML spec that conforms to the bundle's schema:

1. Read the bundle's `schema.json` to understand the spec format
2. Read this CLAUDE.md for convention rules (command naming → HTTP derivation, `?` for optionals, etc.)
3. Translate the requirements into a valid YAML spec
4. Run `fixedcode validate <spec.yaml>` to confirm validity

Example prompt: "I need a workspace management service with CRUD operations for workspaces and parties"
→ AI produces `workspace-domain.yaml` with aggregates, commands, queries, events.

### Middle — FixedCode generates (deterministic)

```bash
fixedcode build . -o build    # always produces identical output from same spec
```

### Bottom Slice — AI fills in extension points

After generation, extension points need business logic:

1. Read `.fixedcode-manifest.json` → find files with `"overwrite": false`
2. These are the user-owned files (e.g. `DefaultWorkspaceBusinessService.kt`, `DefaultWorkspaceValidator.kt`)
3. Each has TODO stubs where business logic goes
4. AI implements the domain logic based on the original requirements
5. On regeneration, these files are preserved — the AI's work is safe

### Creating Bundles from Existing Code

To turn an existing codebase into a reusable bundle:

1. **Analyze the codebase** — Identify the structural patterns that repeat across services:
   - Which files exist in every service? (these become templates)
   - What varies between services? (these become template variables)
   - What's the directory structure? (this becomes the template tree)
   - Which files contain business logic? (these become extension points with `overwrite: false`)

2. **Extract the spec format** — Define what a user needs to provide:
   - What's the minimum input to generate this codebase? (aggregate names, field types, etc.)
   - Write a `schema.json` that validates this input
   - Design conventions that reduce what the user has to specify (e.g. `Create*` → POST)

3. **Create the bundle**:
   ```bash
   fixedcode bundle init my-bundle
   ```
   Then:
   - Copy representative source files into `templates/`, replace variable parts with `{{handlebars}}` syntax
   - Write `src/index.ts` with `enrich()` that maps spec → template context
   - If one spec produces many files (one-to-many), add `generateFiles()` returning explicit `FileEntry[]`
   - Mark extension points with `overwrite: false` in the file entries
   - Add adapter functions if you want generators (e.g. OpenAPI) to work with your bundle

4. **Publish**:
   ```bash
   cd my-bundle
   fixedcode registry publish --kind bundle --tags "spring,kotlin,my-pattern"
   ```

**Tip for AI agents extracting bundles:** Compare 2-3 existing services that follow the same pattern. The parts that differ between them are the template variables. The parts that are identical are the static template content. The `enrich()` function should compute everything the templates need from the minimal spec input.

## Working Example

```bash
cd examples/workspace-service
fixedcode build . -o build                    # 122 files from 2 YAML specs
fixedcode verify workspace-domain.yaml build  # 21 checks passed
fixedcode deploy build /path/to/project       # copies to target
```
