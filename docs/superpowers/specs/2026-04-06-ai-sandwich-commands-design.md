# AI Sandwich CLI Commands Design

**Date:** 2026-04-06
**Status:** Draft
**Context:** Cementing the AI sandwich as a first-class product feature by adding `fixedcode draft` (top slice — AI creates specs) and `fixedcode enrich` (bottom slice — AI fills extension points) to the CLI.

## Background

FixedCode's marketing positions the "AI sandwich" as the core value proposition:

1. **Top slice (AI):** Natural language → YAML spec
2. **Middle (deterministic):** `fixedcode generate` → production code
3. **Bottom slice (AI):** Extension points → business logic

Today, the middle layer is fully implemented. The top and bottom slices are documented workflows ("use Claude Code to draft a spec", "open the stub in Cursor") but not product features. This design adds two CLI commands that make the sandwich a built-in capability.

---

## Part 1: Shared LLM Client

### Design

Both commands need to call an LLM. Rather than adding provider-specific SDKs, we use a single `fetch()`-based client targeting the OpenAI-compatible chat completions API. All three supported providers speak this protocol:

| Provider | Default Base URL | Auth |
|----------|-----------------|------|
| `openrouter` | `https://openrouter.ai/api/v1` | Bearer token from env var |
| `openai` | `https://api.openai.com/v1` | Bearer token from env var |
| `ollama` | `http://localhost:11434/v1` | None |

### Configuration

**In `.fixedcode.yaml`:**
```yaml
llm:
  provider: openrouter
  model: google/gemini-2.5-flash
  baseUrl: https://openrouter.ai/api/v1     # optional, derived from provider
  apiKeyEnv: OPENROUTER_API_KEY              # env var name, not the key itself
```

**Override layering** (lowest to highest priority):
1. `.fixedcode.yaml` `llm:` block
2. Environment variables: `FIXEDCODE_LLM_PROVIDER`, `FIXEDCODE_LLM_MODEL`, `FIXEDCODE_LLM_BASE_URL`, `FIXEDCODE_LLM_API_KEY`
3. CLI flags: `--provider`, `--model`

The `apiKeyEnv` field names the environment variable that holds the API key (e.g. `OPENROUTER_API_KEY`). The actual key is never stored in config files. When `FIXEDCODE_LLM_API_KEY` is set as an env var, it provides the key directly (useful in CI).

### Interface

```typescript
interface LlmConfig {
  provider: 'openrouter' | 'ollama' | 'openai';
  model: string;
  baseUrl: string;
  apiKey?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  temperature?: number;       // default 0.2 for deterministic-ish output
  maxTokens?: number;         // default 4096
}

/** Resolve LLM config from .fixedcode.yaml + env vars + CLI overrides */
function resolveLlmConfig(
  config: FixedCodeConfig,
  overrides?: { provider?: string; model?: string }
): LlmConfig;

/** Send a chat completion request, return the response text */
async function chatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<string>;
```

### Implementation Notes

- Uses Node.js built-in `fetch()` (Node 18+). No new dependencies.
- Request format: `POST {baseUrl}/chat/completions` with `{ model, messages, temperature, max_tokens }`.
- Response: extract `choices[0].message.content`.
- Error handling: throw on non-200 status with provider error message. Throw on missing API key (except ollama).
- No streaming for v1 — both commands produce structured output where streaming adds no UX value.
- No retry/fallback logic — single provider per invocation. Users can change provider via CLI flag if one fails.
- Error handling covers: network/timeout errors, non-JSON response bodies, empty `choices` array, null `content` (content-filtered responses). Each surfaces a descriptive error message.
- `resolveLlmConfig()` throws descriptive errors when config cannot be resolved:
  - Missing provider: "No LLM provider configured. Set `llm.provider` in .fixedcode.yaml, set FIXEDCODE_LLM_PROVIDER env var, or use --provider flag."
  - Missing model: "No LLM model configured. Set `llm.model` in .fixedcode.yaml, set FIXEDCODE_LLM_MODEL env var, or use --model flag."

### Config Type Extension

```typescript
interface FixedCodeConfig {
  bundles: Record<string, string>;
  generators?: Record<string, string>;
  configDir: string;
  llm?: {
    provider: 'openrouter' | 'ollama' | 'openai';
    model: string;
    baseUrl?: string;
    apiKeyEnv?: string;
  };
}
```

---

## Part 2: `fixedcode draft` Command

### Purpose

Generate a valid YAML spec from a natural language description. Cements the top slice of the AI sandwich.

### Usage

```bash
# Generate a spec, write to file
fixedcode draft spring-domain "workspace service with CRUD for workspaces and parties" -o workspace-domain.yaml

# Output to stdout (pipe-friendly)
fixedcode draft spring-domain "workspace service with CRUD for workspaces and parties"

# Override LLM provider
fixedcode draft ts-agent "coding agent with file read/write tools" -o coder.yaml --model anthropic/claude-sonnet-4
```

### CLI Signature

```
fixedcode draft <kind> <description> [-o <output>] [--provider <p>] [--model <m>] [--no-retry]
```

| Argument | Required | Description |
|----------|----------|-------------|
| `kind` | Yes | Bundle kind (e.g. `spring-domain`, `ts-agent`) |
| `description` | Yes | Natural language description of the desired service/agent |
| `-o, --output` | No | Output file path. If omitted, prints to stdout. |
| `--provider` | No | Override LLM provider |
| `--model` | No | Override LLM model |
| `--no-retry` | No | Disable auto-retry on validation failure (default: retry once) |

### Pipeline

1. **Resolve bundle** — load bundle from `.fixedcode.yaml` config by `kind` (same resolution as `generate`)
2. **Load schema** — read the bundle's `schema.json`
3. **Load conventions** — if `CLAUDE.md` exists in project root, extract the spec conventions section (command naming rules, field syntax, etc.)
4. **Load examples** — if the bundle has an `examples/` directory, read `.yaml` files sorted alphabetically and use the first as a few-shot example
5. **Build system prompt** containing:
   - The JSON Schema (structural constraint)
   - The spec envelope format (`apiVersion`, `kind`, `metadata.name`, `metadata.description`, `spec`)
   - Convention rules (if found)
   - Example spec (if found)
   - Instruction: output only valid YAML, no markdown fences, no explanation
6. **Send to LLM** — user message is the description
7. **Extract YAML** — strip markdown code fences if present, parse with YAML parser
8. **Validate** — run the parsed spec through the existing validation pipeline (schema check via ajv)
9. **If valid** — write to `-o` path or stdout
10. **If invalid and retry enabled** — send a follow-up message with the validation errors, ask the LLM to fix them. Validate again. If still invalid, output the best attempt with errors printed to stderr.
11. **If invalid and retry disabled** — output the attempt with errors to stderr

### System Prompt Structure

```
You are a code generation spec author for FixedCode.

Given a natural language description, produce a YAML spec that conforms to the following schema and conventions.

## Spec Envelope

Every spec has this structure:
apiVersion: "1.0"
kind: {kind}
metadata:
  name: <derived-from-description>
  description: <one-line summary>
spec:
  <body conforming to schema below>

## Schema

{JSON Schema contents}

## Conventions

{Extracted from CLAUDE.md, if present}

## Example

{First example spec from bundle, if present}

## Rules

- Output ONLY the YAML spec. No explanation, no markdown fences.
- The spec MUST validate against the schema above.
- Use the conventions for naming (e.g. command naming → HTTP method derivation).
- Prefer explicit over implicit — include all fields rather than relying on defaults.
```

### Bundle Example Convention

Bundles can optionally include example specs:

```
bundles/spring-domain/
├── examples/
│   └── workspace-domain.yaml    # Used by `draft` as few-shot example
├── schema.json
├── src/
└── templates/
```

No changes to the Bundle interface. This is a directory convention — `draft` checks for `examples/*.yaml` in the resolved bundle path and reads the first match.

### Exported Function

```typescript
interface DraftOptions {
  kind: string;
  description: string;
  output?: string;
  retry?: boolean;            // default true
  configPath?: string;        // path to .fixedcode.yaml (uses CWD discovery if omitted)
  llmOverrides?: { provider?: string; model?: string };
}

async function draft(options: DraftOptions): Promise<string>;
```

Returns the generated YAML string. Writes to file if `output` is set.

---

## Part 3: `fixedcode enrich` Command

### Purpose

Fill extension point stubs with AI-generated business logic. Cements the bottom slice of the AI sandwich.

### Usage

```bash
# Enrich all extension points in a build directory
fixedcode enrich build/

# Enrich a specific file only
fixedcode enrich build/ --file src/main/kotlin/.../DefaultWorkspaceBusinessService.kt

# Skip git safety check
fixedcode enrich build/ --force

# Specify the spec explicitly (if not in manifest)
fixedcode enrich build/ --spec workspace-domain.yaml
```

### CLI Signature

```
fixedcode enrich <outputDir> [--spec <spec.yaml>] [--file <path>] [--force] [--provider <p>] [--model <m>]
```

| Argument | Required | Description |
|----------|----------|-------------|
| `outputDir` | Yes | The generated output directory (contains `.fixedcode-manifest.json`) |
| `--spec` | No | Path to the original spec. Auto-discovered from manifest if `specFile` is recorded. |
| `--file` | No | Enrich only this specific extension point file (relative to outputDir) |
| `--force` | No | Skip git safety check (allow enriching uncommitted files) |
| `--provider` | No | Override LLM provider |
| `--model` | No | Override LLM model |

### Pipeline

1. **Read manifest** — load `.fixedcode-manifest.json` from `outputDir`
2. **Find extension points** — filter manifest entries where `overwrite === false`. If `--file` is specified, filter to just that one.
3. **Git safety check** (unless `--force`):
   - For each extension point file, check if it has uncommitted changes via `git status --porcelain <file>`
   - If any are dirty, refuse with message: "Extension point files have uncommitted changes. Commit first or use --force."
   - This ensures the user can `git diff` to review AI additions after enrichment.
4. **Load spec** — from `--spec` flag, or from manifest's `specFile` field, or fail with clear error
5. **For each extension point:**
   a. **Read the stub** — the current file content (TODO-filled)
   b. **Gather neighbours** — from the manifest, find related generated files (`overwrite: true`) using path proximity:
      - Same directory and parent directory
      - Files sharing the same name prefix (e.g. `Workspace*.kt` for `DefaultWorkspaceBusinessService.kt`)
      - Cap at ~10 neighbour files to stay within context limits
   c. **Build prompt:**
      - System: "You are implementing business logic for an extension point..."
      - User: spec YAML + stub file + neighbour files + instruction
   d. **Send to LLM** — get the completed file
   e. **Extract code** — strip markdown fences if present
   f. **Write in place** — overwrite the stub file
6. **Report** — list enriched files, print `git diff <outputDir>` suggestion

**Processing order:** Extension points are processed sequentially (one LLM call at a time) in v1. Parallel processing can be added later with rate-limit awareness.

**Edge case — no extension points:** If the manifest contains no `overwrite: false` entries (or `--file` doesn't match), print "No extension points found" and exit cleanly.

### Neighbour Discovery

The neighbour algorithm finds the generated files most relevant to an extension point:

```typescript
function findNeighbours(
  extensionPointPath: string,
  manifest: Manifest,
  maxFiles: number = 10
): string[] {
  // 1. Same directory — files in the same dir (e.g. the interface this class implements)
  // 2. Parent directory — files one level up (e.g. aggregate root, events)
  // 3. Name affinity — files sharing a name prefix (e.g. Workspace*.kt)
  // All filtered to overwrite: true only (generated files, not other extension points)
  // Sorted by relevance: same-dir first, then parent, then name-affinity
  // Capped at maxFiles
}
```

This works because bundles already organise output by module/aggregate. For `DefaultWorkspaceBusinessService.kt` in `domain/workspace/`, the neighbours would be:
- `WorkspaceBusinessService.kt` (interface, same dir)
- `Workspace.kt` (aggregate, same dir)
- `WorkspaceEvents.kt` (events, same dir)
- `WorkspaceCommandService.kt` (application layer, parent dir)

### Prompt Structure

```
You are implementing business logic for a generated extension point file.

## Original Spec
{YAML spec contents}

## Extension Point (file to implement)
Path: {relative path}
```{language}
{stub file contents}
```

## Related Generated Files
{For each neighbour:}
Path: {relative path}
```{language}
{file contents}
```

## Instructions
- Implement all TODO stubs with working business logic based on the spec and related files.
- Preserve all existing signatures, class names, and imports.
- Follow the patterns established in the related files.
- Do not add features beyond what the spec describes.
- Output ONLY the complete file. No explanation, no markdown fences.
```

### Manifest Enhancement

Add `specFile` to the manifest metadata so `enrich` can auto-discover the spec:

```typescript
interface ManifestEntry {
  hash: string;
  bundle: string;
  overwrite: boolean;
  specFile?: string;          // NEW: path to spec that generated this file (relative to outputDir)
}

interface Manifest {
  generatedAt: string;
  engine: string;
  bundles: Record<string, string>;   // kind → version (matches existing type)
  files: Record<string, ManifestEntry>;
}
```

The `generate` pipeline writes `specFile` on each `ManifestEntry` when creating/updating the manifest. The path is stored relative to the output directory: `relative(outputDir, resolve(specPath))`. The `enrich` command resolves it as `resolve(outputDir, entry.specFile)`.

**Multi-spec builds:** When `fixedcode build` processes multiple specs into one output directory, each `ManifestEntry` records which spec generated it. The `enrich` command groups extension points by their `specFile` and loads the correct spec per group. No `--spec` flag needed for multi-spec builds.

### Exported Function

```typescript
interface EnrichOptions {
  outputDir: string;
  specFile?: string;          // override: use this spec for all extension points
  file?: string;              // enrich only this file
  force?: boolean;            // skip git safety check
  configPath?: string;        // path to .fixedcode.yaml (uses CWD discovery if omitted)
  llmOverrides?: { provider?: string; model?: string };
}

interface EnrichResult {
  enriched: string[];         // paths of files that were enriched
  skipped: string[];          // paths skipped (dirty git state)
  errors: string[];           // paths that failed
}

async function enrich(options: EnrichOptions): Promise<EnrichResult>;
```

---

## Part 4: New Files

```
engine/
├── src/
│   ├── cli/
│   │   ├── draft-cmd.ts              # CLI command: fixedcode draft
│   │   └── enrich-cmd.ts             # CLI command: fixedcode enrich
│   └── engine/
│       ├── llm.ts                    # Shared LLM client (fetch-based)
│       ├── draft.ts                  # Draft pipeline (schema → prompt → validate → output)
│       └── enrich.ts                 # Enrich pipeline (manifest → neighbours → prompt → write)
└── test/
    ├── llm.test.ts                   # LLM client unit tests (mock fetch)
    ├── draft.test.ts                 # Draft pipeline tests (mock LLM, real validation)
    └── enrich.test.ts                # Enrich pipeline tests (mock LLM, real manifest)
```

**Modified files:**
- `engine/src/cli/index.ts` — register `createDraftCommand()` and `createEnrichCommand()`
- `engine/src/engine/pipeline.ts` — write `specFile` to each `ManifestEntry` during `generate()`
- `engine/src/engine/manifest.ts` — add `specFile` to `ManifestEntry` interface
- `engine/src/engine/config.ts` — parse `llm` field from YAML in `loadConfig()`
- `engine/src/types.ts` — add `llm` to `FixedCodeConfig`

**No new dependencies.** The LLM client uses Node.js built-in `fetch()`.

---

## Testing Strategy

### LLM Client (`llm.test.ts`)
- Mock `fetch()` to test request formatting (headers, body structure)
- Test config resolution: yaml < env vars < CLI flags
- Test error handling: missing API key, non-200 response, malformed response
- Test each provider's default base URL derivation

### Draft (`draft.test.ts`)
- Mock the LLM client, test the full pipeline:
  - Schema loading from bundle
  - System prompt construction (includes schema, conventions, examples)
  - YAML extraction (with and without markdown fences)
  - Validation pass-through (valid spec → output)
  - Validation failure → retry with errors → output
  - `--no-retry` skips retry
- Integration test with a real bundle (spring-domain or ts-agent) and mocked LLM

### Enrich (`enrich.test.ts`)
- Mock the LLM client, test the full pipeline:
  - Manifest reading and extension point discovery
  - Git safety check (mock `execFileSync` for `git status`)
  - Neighbour discovery algorithm (same dir, parent dir, name affinity)
  - Prompt construction (includes spec, stub, neighbours)
  - File writing
  - `--force` bypasses git check
  - `--file` filters to single file
- Integration test with a generated output directory and mocked LLM

---

## What This Does NOT Include

- **Streaming** — Not needed for structured output commands. Can add later.
- **Multiple provider fallback** — Single provider per invocation. Change via CLI flag.
- **Cost tracking** — Not needed for CLI commands. The LLM provider tracks this.
- **Interactive draft mode** — Single-shot only for v1. Interactive can come later.
- **Input adapters (Slack/Jira)** — Separate design, targets Organisation/Enterprise tiers.
- **Audit trail** — Separate design, targets Enterprise tier.
