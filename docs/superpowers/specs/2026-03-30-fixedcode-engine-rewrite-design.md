# FixedCode Engine Rewrite Design

## Overview

Cleanroom rewrite of the GAP CLI as **FixedCode** — a pluggable, spec-driven code generation engine. The old CLI (Go, ~192k lines) generates Kotlin/Spring Boot microservices from YAML domain specs. The rewrite uses different technology, a different spec format, and a different architecture while preserving the core methodology: declarative specs in, production code out.

### Core Problem

The old CLI's architecture has two key pain points:
1. **The internal context model was never clean enough** — complexity leaked into templates despite multiple refactors
2. **Generate-per-aggregate-then-merge was flawed** — producing aggregates in isolation then stitching them together created workarounds for shared code and cross-cutting concerns

### Design Principles

- **Pluggable bundles** — the engine knows nothing about any specific spec format or output language
- **Context model is the product** — if a template needs logic, the context model is wrong
- **No merge phase** — bundles receive the full spec and produce one holistic context
- **Engine as library** — the CLI is a thin shell; the engine is importable for programmatic use

---

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | **TypeScript** | Large pool of bundle authors, npm for distribution |
| CLI framework | **Commander** | Lightweight, CLI is thin anyway |
| Template engine | **Handlebars** | Logic-less by design, forces clean context models. Custom helpers per bundle cover edge cases |
| Bundle distribution | **npm packages** | Primary distribution. Local paths for development. |
| Spec format | **YAML** | Familiar, readable, existing convention |

---

## System Architecture

Three layers:

```
┌─────────────────────────────────────────────┐
│  CLI (Commander)                            │
│  Parses args, resolves bundle, invokes      │
│  engine. Thin as possible.                  │
├─────────────────────────────────────────────┤
│  Engine                                     │
│  parse spec → validate envelope → resolve   │
│  bundle → validate body → enrich → render   │
│  → write files                              │
├─────────────────────────────────────────────┤
│  Bundles (npm packages or local paths)      │
│  Each bundle exports: kind, specSchema,     │
│  enrich(), templates, helpers, partials     │
│  Bundle = spec format + context model +     │
│  templates as one deployable unit           │
└─────────────────────────────────────────────┘
```

---

## Spec Envelope

Every spec file has a thin common envelope. The engine validates the envelope; the bundle validates and owns everything inside `spec:`.

```yaml
apiVersion: "1.0"              # envelope format version (engine validates)
kind: ddd-domain               # routes to the right bundle
metadata:
  name: order-service
  description: "Order management domain"  # optional

spec:
  # ... bundle-owned content
  # bundles may define their own versioning within spec if needed
```

**Engine validates:** `apiVersion` (supported envelope format?), `kind` (bundle found?), `spec` (present?)
**Bundle validates:** everything inside `spec:` against its own JSON Schema.

---

## Bundle Resolution

Bundles are discovered from `.fixedcode.yaml` at project or user level:

```yaml
bundles:
  # npm package
  ddd-domain: "@fixedcode/bundle-ddd-spring-kotlin"

  # local path (relative to config file)
  crud-api: "./bundles/crud-express"
```

Resolution order: the engine reads the `kind` from the spec envelope, looks it up in the config, and loads the bundle from the configured source. Local paths are the default workflow during development; publish to npm when ready to share.

The same `kind` can map to different packages in different projects — an org can override any default bundle with their own.

### Bundle Loading Mechanics

- **Local paths:** resolved relative to the config file, loaded via dynamic `import()`. The bundle's `package.json` `main` or `exports` field is used as the entry point (or `src/index.ts` by convention if no package.json).
- **npm packages:** must be pre-installed in `node_modules` (the engine does not run `npm install`). Loaded via `import()` by package name. Version pinning is done in the project's `package.json` dependencies, not in `.fixedcode.yaml`.
- The engine validates that the loaded module's default export conforms to the `Bundle` interface at load time — missing fields produce a clear error naming the bundle and the missing field.

### Config File Resolution

1. `.fixedcode.yaml` in the current working directory (project-level)
2. `~/.config/fixedcode/config.yaml` (user-level)

If both exist, project-level config takes precedence. Bundle maps are **not** merged — project config fully overrides user config. This keeps behavior predictable.

---

## Bundle Interface

```typescript
export interface Bundle {
  // Identity
  kind: string;

  // Spec validation — JSON Schema for the spec body
  specSchema: JSONSchema;

  // Transforms raw spec into rich context for templates
  enrich(spec: Record<string, unknown>, metadata: SpecMetadata): Context;

  // Path to Handlebars templates directory (relative to bundle root)
  templates: string;

  // Optional custom Handlebars helpers
  helpers?: Record<string, (...args: any[]) => any>;

  // Optional named partial templates
  partials?: Record<string, string>;
}

interface SpecMetadata {
  name: string;
  description?: string;
  apiVersion: string;
}

// Opaque at the engine level — each bundle defines its own shape
type Context = Record<string, unknown>;
```

A bundle is a directory or npm package with a default export conforming to this interface.

### Bundle Extensibility

Bundles are self-contained (schema + enrichment + templates). For v1, customisation is fork-and-modify. The manifest reserves an `extends` field for future bundle inheritance, but the machinery is not built yet.

---

## Engine Pipeline

A single linear pipeline — no branching, no merge phase:

```
read file → parse YAML → validate envelope → resolve bundle
    → validate spec body → enrich → render templates → write files
```

Each step is a discrete, testable function:

```typescript
parseSpec(filePath: string): RawSpec
validateEnvelope(raw: RawSpec): EnvelopeResult
resolveBundle(kind: string, config: Config): Bundle
validateBody(spec: unknown, schema: JSONSchema): ValidationResult
enrich(bundle: Bundle, spec: unknown, metadata: SpecMetadata): Context
render(templates: TemplateSet, context: Context, helpers, partials): RenderedFile[]
write(files: RenderedFile[], outputDir: string): void
```

### Template Rendering

- The templates directory is walked recursively
- File and directory names can be Handlebars expressions (e.g. `{{name}}/{{Name}}Controller.kt.hbs`)
- `.hbs` files are rendered with the context; non-`.hbs` files are copied as-is (static assets)
- If a template renders to an empty string (after trimming), the file is skipped (conditional file generation)
- **Handlebars is configured with `noEscape: true`** — output is raw, not HTML-escaped. This is a code generator, not a web app.

### Multi-File Generation

A single template can produce multiple files when the context contains collections. The engine supports a **repeat directive** in template filenames:

```
templates/
  {{#each aggregates}}/
    {{names.pascal}}Controller.kt.hbs
    {{names.pascal}}Service.kt.hbs
  {{/each}}/
```

When the engine encounters a directory name matching `{{#each <key>}}`, it iterates over the collection in the context and renders the contents once per item, with the current item as the template context. This is the only control flow the engine interprets in paths — all other Handlebars expressions in filenames are simple interpolation.

Alternatively, if the bundle's enrichment already flattens everything, the template directory can just use `{{name}}/` paths where the context is structured as a flat list. The `enrich()` function decides how to structure iteration.

### Output

- Template path (minus `.hbs` extension) becomes output path
- Handlebars expressions in paths are resolved against the context
- Path expressions that resolve to empty string or contain path traversal (`..`) are errors
- Output dir specified via `--output` flag (default: `./build`)
- `--dry-run` renders but doesn't write, shows file list
- `--diff` compares rendered output against existing files

---

## Context Model Philosophy

**The golden rule: if a template needs logic, the context model is wrong.**

Templates should only use:
- `{{value}}` — interpolation
- `{{#each list}}` — iteration
- `{{#if flag}}` — toggling sections on/off
- `{{> partial}}` — composition

All string manipulation, conditional chains, and computed values live in `enrich()`.

### Enrichment as Composable Transforms

Instead of one monolithic function, enrichment is a pipeline of focused steps:

```typescript
const enrich = pipe(
  parseAttributes,    // raw spec → typed attributes
  resolveNames,       // add naming variants
  resolveTypes,       // map spec types → language types
  resolveCommands,    // build command contexts with handlers
  resolveQueries,     // build query contexts
  resolveImports,     // compute required imports from usage
);
```

Each step is independently testable. The context model is strongly typed within the bundle (TypeScript interfaces), which serves as documentation of the model.

### Testing Strategy

The most important tests in a bundle are **enrichment tests**, not template output tests. Given this spec input, does `enrich()` produce exactly this context? If the model is right, the templates are trivial.

---

## CLI Surface

```
fixedcode generate order                    # finds order.yaml in specs/
fixedcode generate order ./output           # with destination
fixedcode g order                           # alias

fixedcode validate order                    # validate only
fixedcode v order                           # alias

fixedcode init --kind ddd-domain            # scaffold a starter spec
fixedcode bundle init                       # scaffold a new bundle project
```

### Spec Resolution

Given `fixedcode g workspace`, the engine looks for (in order):
1. `workspace.yaml`
2. `workspace-domain.yaml`
3. `specs/workspace.yaml`
4. `specs/workspace-domain.yaml`

First match wins. Explicit path always works.

### Command Aliases

| Full | Short | Purpose |
|------|-------|---------|
| `generate` | `g` | Run the full pipeline |
| `validate` | `v` | Validate spec only |

Bundle kind is inferred from the spec's `kind:` field — rarely needs specifying on the command line.

---

## Project Structure

### Engine

```
fixedcode/
├── src/
│   ├── cli/
│   │   ├── index.ts              # entry point, Commander setup
│   │   ├── generate.ts           # generate command
│   │   ├── validate.ts           # validate command
│   │   └── init.ts               # init commands
│   ├── engine/
│   │   ├── pipeline.ts           # orchestrates the full pipeline
│   │   ├── parse.ts              # YAML parsing, envelope validation
│   │   ├── resolve.ts            # bundle resolution (npm, local path)
│   │   ├── render.ts             # Handlebars rendering, file walking
│   │   └── write.ts              # file output, dry-run, diff
│   ├── config/
│   │   └── config.ts             # .fixedcode.yaml loading
│   └── index.ts                  # library export (engine as importable API)
├── test/
│   ├── engine/                   # unit tests per pipeline step
│   └── fixtures/                 # test specs, test bundles
├── package.json
├── tsconfig.json
└── .fixedcode.yaml               # example config
```

### Bundle (separate package)

```
bundle-ddd-spring-kotlin/
├── src/
│   ├── index.ts                  # default export: Bundle interface
│   ├── enrich/
│   │   ├── index.ts              # pipe of transform steps
│   │   ├── names.ts              # naming variant resolution
│   │   ├── types.ts              # type mapping
│   │   ├── commands.ts           # command context building
│   │   └── ...
│   ├── schema.json               # JSON Schema for spec body
│   └── helpers.ts                # custom Handlebars helpers
├── templates/
│   ├── {{name}}/
│   │   ├── {{Name}}Controller.kt.hbs
│   │   ├── {{Name}}Service.kt.hbs
│   │   └── ...
│   └── shared/
│       └── ...
├── test/
│   ├── enrich/                   # enrichment unit tests
│   └── fixtures/                 # test specs + expected contexts
└── package.json
```

---

## Build Order

### Phase 1: Context Model Design
- Pick 2-3 complex templates from old CLI (ApiDelegate, BusinessService, migration)
- Work backwards: what context shape makes these trivially simple in Handlebars?
- Define TypeScript interfaces for the context
- Write enrichment transforms to produce it from a spec
- Test enrichment heavily
- **Output:** a local bundle package with typed context interfaces, enrichment logic, and a handful of Handlebars templates proving the model works. This is a DDD-focused spike, not a shippable bundle — it validates the architecture.

### Phase 2: Engine Pipeline
- Parse, validate envelope, resolve bundle (local path only)
- Call bundle's enrich, render Handlebars, write files
- Dry-run and diff support
- Test against the Phase 1 spike bundle

### Phase 3: CLI
- Commander setup with generate, validate, init
- Spec resolution conventions and aliases
- Config file loading

### Phase 4: Reference Bundle
- Complete one real, shippable bundle end-to-end (simpler than full DDD — e.g. CRUD REST)
- Distinct from the Phase 1 spike: this is a clean, documented bundle that serves as the example for bundle authors
- The Phase 1 DDD spike may evolve into a full DDD bundle later, but Phase 4 proves the architecture with a simpler domain

### Phase 5: Polish
- Error messages (spec validation and enrichment errors must be excellent)
- `bundle init` scaffolding
- Documentation

---

## Error Handling

Each pipeline step produces typed errors that identify what went wrong and where:

| Step | Error | Example message |
|------|-------|-----------------|
| Parse | `SpecParseError` | `Failed to parse order.yaml: invalid YAML at line 12` |
| Envelope | `EnvelopeError` | `Missing required field 'kind' in order.yaml` |
| Resolve | `BundleNotFoundError` | `No bundle registered for kind 'ddd-domain'. Check .fixedcode.yaml` |
| Load | `BundleLoadError` | `Bundle '@fixedcode/bundle-ddd' failed to load: missing 'enrich' export` |
| Validate | `SpecValidationError` | `Spec validation failed: /aggregates/Order/attributes — 'status' has invalid type 'foo'` |
| Enrich | `EnrichmentError` | `Enrichment failed in bundle 'ddd-domain': Cannot resolve type mapping for 'foo'` |
| Render | `RenderError` | `Template error in {{Name}}Controller.kt.hbs line 23: 'commands' is not iterable` |
| Write | `WriteError` | `Cannot write to ./build/Order/OrderController.kt: permission denied` |

Errors are thrown as specific types inheriting from a base `FixedCodeError`. The CLI catches these and formats them with context (file path, line number where possible). The engine never swallows errors — every failure is surfaced.

---

## Post-Render Hooks

The engine supports an optional `postRender` step in the pipeline for running formatters on generated output:

```yaml
# .fixedcode.yaml
bundles:
  ddd-domain: "./bundles/ddd-spring-kotlin"

postRender:
  "*.kt": "ktlint --format"
  "*.ts": "prettier --write"
```

This is a simple glob-to-command mapping. The engine runs the commands on matching output files after writing. If a formatter fails, it warns but does not fail the generation — the unformatted output is still usable.

Not implemented in Phase 1-3. Added in Phase 5 (Polish).

---

## Decisions Deferred

- **Bundle inheritance** (`extends` field reserved, not implemented in v1)
- **Git URL bundle sources** (npm + local path for v1)
- **Deploy/pipeline commands** (out of scope — use CI/scripts)
- **MCP integration** (remote agent triggering — future)
- **Spec cross-references / imports** (each spec file is self-contained for v1)
- **Parallel generation** (pipeline is sequential for v1; parallelism is an optimisation if needed later)
