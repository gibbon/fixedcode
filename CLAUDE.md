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
- `generators/openapi/src/index.ts` — OpenAPI spec generator

## Programmatic API

All CLI commands map to importable TypeScript functions:

```typescript
import { generate, validate, build, deploy, verify } from '@fixedcode/engine';
import { fetchRegistry, searchRegistry, installPackage, publishPackage } from '@fixedcode/engine';
```

## Working Example

```bash
cd examples/workspace-service
fixedcode build . -o build                    # 122 files from 2 YAML specs
fixedcode verify workspace-domain.yaml build  # 21 checks passed
fixedcode deploy build /path/to/project       # copies to target
```
