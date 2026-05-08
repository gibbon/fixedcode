# Architecture

## Overview

FixedCode is a deterministic code-generation engine. The core insight: separate the *what* (a YAML spec) from the *how* (templates and adapters) so the same spec always produces identical output.

```
spec.yaml
   │
   ▼
┌─────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐
│  parse  │ →  │  validate  │ →  │  enrich  │ →  │  render  │
└─────────┘    └────────────┘    └──────────┘    └──────────┘
                                                       │
                                                       ▼
                                                 ┌─────────────┐
                                                 │ generators  │
                                                 └─────────────┘
                                                       │
                                                       ▼
                                                 ┌─────────────┐
                                                 │   write     │  →  output dir + manifest
                                                 └─────────────┘
```

## Stages

1. **parse** — load YAML, error on malformed input.
2. **validate** — run the spec against the bundle's JSON Schema. Reject early.
3. **enrich** — bundle's `enrich(spec, metadata)` returns a `Context` with everything templates need (PascalCase names, derived HTTP routes, default values, etc.).
4. **render** — Handlebars compile + render every file in the bundle's `templates/` directory using the enriched context.
5. **generators** — bundle adapters map the context into each generator's input contract; generators produce additional files programmatically.
6. **write** — every output file is path-checked to stay inside the output directory, written, and recorded in `.fixedcode-manifest.json` with a hash and overwrite flag.

## Contracts

The full TypeScript types live in [`engine/src/types.ts`](../engine/src/types.ts). The public-facing contracts:

```ts
interface Bundle {
  kind: string;                     // matches spec.kind
  specSchema: object;               // JSON Schema
  enrich(spec, metadata): Context;  // spec → render context
  templates: string;                // path to Handlebars templates
  generateFiles?(ctx): FileEntry[]; // optional explicit file list (one-to-many)
  adapters?: Record<string, fn>;    // map context → generator inputs
  helpers?: Record<string, fn>;     // custom Handlebars helpers
  cfrs?: { provides: string[]; files: Record<string, string[]> };
}

interface Generator {
  name: string;
  generate(input: Record<string, unknown>): RenderedFile[];
}

interface FileEntry {
  path: string;
  content: string;
  overwrite: boolean;  // false = extension point (user-owned after first generation)
}
```

## Regeneration model

- **Generated files** (`overwrite: true`) — always rewritten on regenerate.
- **Extension points** (`overwrite: false`) — generated once, then user-owned.
- **Manifest** (`.fixedcode-manifest.json`) — tracks every generated path, its hash, and its overwrite flag. Drives clean regeneration.
- **`.fixedcodeignore`** — glob patterns the engine never touches (legacy code mixed into the output dir).

## Path safety

Every write goes through a containment check (`engine/src/engine/pipeline.ts`). The resolved absolute output path must start with the resolved output directory; otherwise the engine throws and aborts. This prevents any spec value from causing a write outside the intended directory.

## LLM integration

Two commands talk to an LLM:

- `fixedcode draft <kind> "<description>"` — generates a YAML spec from natural language; the response is parsed as YAML and validated against the bundle's schema before being saved.
- `fixedcode enrich <outputDir>` — reads the manifest, finds extension points, and asks the LLM to fill in the business-logic stubs. LLM output is written to disk **verbatim** — review with `git diff` before committing. See [`llm.md`](llm.md) for security caveats.

The LLM `baseUrl` is validated against an allowlist (OpenRouter, OpenAI, Anthropic, plus loopback hosts for local model servers like Ollama).
