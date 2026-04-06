# Agent & Service Bundles Design

**Date:** 2026-04-06
**Status:** Draft
**Context:** FixedCode bundle expansion beyond Spring/Kotlin into TypeScript agents, Python services, AI agent orchestration, and CI/CD pipeline generation.

## Background

FixedCode currently generates Kotlin/Spring services via `spring-library` (project skeleton) and `spring-domain` (DDD domain code). Two prior projects inform the agent bundle designs:

- **r.dan** — TypeScript agent platform using Vercel AI SDK. Individual agents (coder, planner, researcher, telegram) are simple standalone units: YAML spec (prompt + tools + model config) → tool-calling loop → own HTTP server. Tool handlers are small async `handle(input)` functions. No framework needed at runtime.
- **gap-cli** — Go-based code generator producing Python FastAPI agent services from YAML specs using Strands Agents, with single-agent and orchestrator patterns.

The approach: TypeScript bundles first (r.dan agents as reference), then Python bundles (gap-cli as reference), then CI/CD bundles.

---

## Part 0: TypeScript Bundles

### Bundle Architecture

Two bundles, same layered pattern as Spring:

| Bundle | Role | Analogous to |
|--------|------|-------------|
| `ts-service` | Project skeleton (Express, Docker, configs, tests) | `spring-library` |
| `ts-agent` | Agent code (tools, LLM loop, HTTP server) | `spring-domain` |

`ts-service` is usable standalone for plain TypeScript microservices. `ts-agent` layers on top for standalone AI agent services. `rdan-agent` generates agents that plug into the r.dan kernel.

### rdan-agent Bundle

**Separate bundle** — same spec format as `ts-agent` for tools/prompt/model, but generates r.dan-compatible output:

- YAML agent spec (consumed by r.dan kernel)
- Tool handler files (`export async function handle(input)`)
- No HTTP server, no state management, no agent loop — kernel provides all of this

**Spec format:**
```yaml
apiVersion: "1.0"
kind: rdan-agent
metadata:
  name: coder-agent

spec:
  model:
    tier: balanced

  prompt: "You are a coding agent..."

  tools:
    - name: read-file
      type: cli
      config: { command: "cat" }
    - name: write-file
      type: function
      config: { handler: "write-file" }
```

**Generated file structure:**
```
coder-agent/
├── agent.yaml                         # r.dan agent spec
├── src/
│   └── tools/
│       ├── read-file.ts               # CLI tool (if custom config needed)
│       └── write-file.ts              # Function tool handler
├── package.json                       # Tool handler dependencies only
└── .fixedcode-manifest.json
```

**CFRs:** None — the kernel provides tracing, metrics, health, auth.

**Why separate bundle:** r.dan agents are fundamentally different from standalone agents — no HTTP server, no state, no loop. Sharing a bundle with a `runtime` flag would mean most templates are conditional. Separate bundles with a shared spec format is cleaner.

### ts-service Bundle

**Generates:**
- TypeScript + Node.js project structure
- `package.json` with dependency management
- `tsconfig.json`
- Express HTTP server with health endpoint
- Docker + docker-compose
- Structured logging (pino)
- Environment config (dotenv + typed config)
- Test scaffolding (vitest)
- Extension points for custom routes

**Spec format:**
```yaml
apiVersion: "1.0"
kind: ts-service
metadata:
  name: ops-agent

spec:
  service:
    port: 3000
    package: ops-agent
  features:
    database: { enabled: false }
    docker: true
```

**CFRs provided** (always generated):
- logging
- health-check
- error-handling
- docker

**Generated file structure:**
```
ops-agent/
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── index.ts                      # Entry point — starts HTTP server
│   ├── config.ts                     # Typed env config
│   ├── server.ts                     # Express app setup
│   ├── routes/
│   │   └── health.ts                 # /health endpoint
│   └── defaults/
│       └── custom-routes.ts          # Extension point (overwrite: false)
├── tests/
│   └── health.test.ts
└── .fixedcode-manifest.json
```

### ts-agent Bundle

**Reference:** r.dan individual agents (coder.yaml, planner.yaml, researcher.yaml)

**Generates:** A standalone, self-contained agent that runs its own HTTP server and tool-calling loop. No framework runtime needed.

**Key files generated:**
- Agent spec (YAML) — prompt, model config, tool list
- Tool handler files — small `handle(input)` async functions per tool
- Agent loop — tool-calling loop using configurable AI SDK
- HTTP server — `/invoke`, `/health` endpoints
- Entry point — starts server, loads spec, runs agent

#### LLM Provider Configuration

Same as Python bundles — spec declares the SDK:

| Provider | SDK | Notes |
|----------|-----|-------|
| `vercel-ai` | Vercel AI SDK | Default. Proven in r.dan |
| `claude-sdk` | Anthropic SDK | Direct Claude access |
| `openai` | OpenAI SDK | GPT models |

#### Agent Modes

**Single agent** — one agent with tools, own HTTP server:

```yaml
apiVersion: "1.0"
kind: ts-agent
metadata:
  name: coder-agent

spec:
  mode: single
  provider: vercel-ai
  model:
    tier: balanced            # fast | balanced | quality

  prompt: "You are a coding agent with full filesystem access..."

  tools:
    - name: read-file
      type: cli
      config: { command: "cat" }
    - name: write-file
      type: function
      config: { handler: "write-file" }
    - name: web-search
      type: http
      config: { baseUrl: "https://api.search.com" }
    - name: external-tools
      type: mcp
      config: { server: "localhost:3001" }

  server:
    port: 3100
```

**Orchestrator** — multi-agent with routing and criticality:

```yaml
apiVersion: "1.0"
kind: ts-agent
metadata:
  name: ops-orchestrator

spec:
  mode: orchestrator
  provider: vercel-ai

  agents:
    - name: planner
      prompt: "You plan the approach..."
      tools: [web-search]
      critical: true
    - name: coder
      prompt: "You write code..."
      tools: [read-file, write-file]
      critical: true
    - name: reviewer
      prompt: "You review the output..."
      tools: [read-file]
      critical: false

  routing: sequential

  tools:
    - name: read-file
      type: cli
      config: { command: "cat" }
    - name: write-file
      type: function
      config: { handler: "write-file" }
    - name: web-search
      type: http
      config: { baseUrl: "https://api.search.com" }

  server:
    port: 3100
```

#### Tool Types

Five tool types (matching r.dan):

| Type | Description | Generated handler pattern |
|------|-------------|--------------------------|
| `http` | REST API calls | `fetch()` wrapper |
| `cli` | Shell command execution | `execSync()` / `spawn()` wrapper |
| `function` | Custom TypeScript handler | `export async function handle(input)` |
| `mcp` | Model Context Protocol | MCP client connection |
| `database` | PostgreSQL queries | `pg` client wrapper |

#### Enrichment Pipeline

```typescript
interface TsAgentContext {
  packageName: string;                  // kebab-case
  moduleName: string;                   // camelCase

  mode: 'single' | 'orchestrator';
  provider: 'vercel-ai' | 'claude-sdk' | 'openai';
  modelTier: string;

  // Provider-specific
  providerImport: string;              // e.g. "import { generateText } from 'ai'"
  providerDependency: string;          // e.g. "ai: ^6.0.0"

  tools: EnrichedTool[];
  prompt?: string;                     // single mode
  agents?: EnrichedAgent[];            // orchestrator mode
  routing?: 'sequential' | 'parallel' | 'llm-decided';
  serverPort: number;
}
```

#### `generateFiles()` Implementation

```typescript
function generateFiles(ctx: TsAgentContext): FileEntry[] {
  const files: FileEntry[] = [];

  // Agent loop (provider-specific template)
  files.push({
    output: `src/agent.ts`,
    template: `providers/${ctx.provider}/agent.ts.hbs`,
    ctx, overwrite: true,
  });

  // Per-tool handlers
  for (const tool of ctx.tools) {
    files.push({
      output: `src/tools/${tool.name.kebab}.ts`,
      template: `tools/${tool.type}.ts.hbs`,
      ctx: { tool }, overwrite: true,
    });
    files.push({
      output: `tests/tools/${tool.name.kebab}.test.ts`,
      template: `tests/tool.test.ts.hbs`,
      ctx: { tool }, overwrite: true,
    });
  }

  // Extension point
  files.push({
    output: `src/defaults/custom-agent.ts`,
    template: 'defaults/custom-agent.ts.hbs',
    ctx, overwrite: false,
  });

  // Orchestrator mode
  if (ctx.mode === 'orchestrator') {
    files.push({
      output: `src/orchestrator.ts`,
      template: `providers/${ctx.provider}/orchestrator.ts.hbs`,
      ctx, overwrite: true,
    });
    for (const agent of ctx.agents!) {
      files.push({
        output: `src/agents/${agent.name.kebab}/agent.ts`,
        template: 'agents/agent.ts.hbs',
        ctx: { agent }, overwrite: true,
      });
      files.push({
        output: `src/agents/${agent.name.kebab}/default-${agent.name.kebab}.ts`,
        template: 'agents/default-agent.ts.hbs',
        ctx: { agent }, overwrite: false,
      });
    }
  }

  return files;
}
```

**Generated file structure (single agent):**
```
coder-agent/
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── agent.yaml                         # The agent spec (for reference/reload)
├── src/
│   ├── index.ts                       # Entry point
│   ├── config.ts                      # Typed config
│   ├── server.ts                      # Express + /invoke, /health
│   ├── agent.ts                       # Tool-calling loop (provider-specific)
│   ├── tools/
│   │   ├── read-file.ts               # CLI tool handler
│   │   ├── write-file.ts              # Function tool handler
│   │   └── web-search.ts              # HTTP tool handler
│   └── defaults/
│       └── custom-agent.ts            # Extension point (overwrite: false)
├── tests/
│   ├── agent.test.ts
│   └── tools/
│       ├── read-file.test.ts
│       └── write-file.test.ts
└── .fixedcode-manifest.json
```

**CFRs provided** (always generated):
- tracing
- metrics
- unit-tests
- health-check

**CFRs conditionally generated:**
- auth — when middleware includes auth
- rate-limiting — when `cfrs.rate-limiting: true`

---

## Part 1: Python Bundles

### Bundle Architecture

Two bundles, layered like the Spring pair:

| Bundle | Role | Analogous to |
|--------|------|-------------|
| `python-service` | Project skeleton (FastAPI, Docker, configs, tests) | `spring-library` |
| `python-agent` | Agent domain code (tools, orchestration, middleware) | `spring-domain` |

`python-service` is usable standalone for plain Python microservices. `python-agent` layers on top for AI agent services.

### python-service Bundle

**Generates:**
- FastAPI + Uvicorn application structure
- `pyproject.toml` with dependency management
- Pydantic settings/configuration
- Docker + docker-compose
- Structured logging (`python-json-logger`)
- Health check endpoint (`/health`)
- Test scaffolding (pytest)
- Extension points for custom routes and middleware

**Spec format:**
```yaml
apiVersion: "1.0"
kind: python-service
metadata:
  name: ops-agent

spec:
  service:
    port: 8000
    package: ops_agent
  features:
    database: { enabled: true, type: postgres }
    docker: true
```

**CFRs provided** (always generated):
- logging
- health-check
- error-handling
- input-validation
- cors
- docker

### python-agent Bundle

**Generates:**
- Agent definition with configurable LLM SDK
- Single agent or orchestrator mode (spec-driven)
- Tool definitions and registration
- Pluggable middleware stack
- Session persistence (file for dev, configurable for prod)
- Streaming support
- API endpoints: `/query`, `/stream`, `/health`
- Cost tracking / token counting

#### LLM Provider Configuration

The spec declares which SDK to use. The bundle swaps in the right client code via templates:

| Provider | SDK | Notes |
|----------|-----|-------|
| `strands` | Strands Agents | Default. Proven in gap-cli |
| `claude-agent-sdk` | Claude Agent SDK | Anthropic-native |
| `openai` | OpenAI SDK | GPT models |
| `ollama` | Ollama | Local models |

#### Agent Modes

**Single agent** — one agent with tools, endpoints, middleware:

```yaml
apiVersion: "1.0"
kind: python-agent
metadata:
  name: ops-agent

spec:
  mode: single
  provider: strands
  streaming: true

  prompt: "You are an operations assistant..."

  middleware:
    - correlation-id
    - auth:
        provider: auth0
        permission: "admin:query"
    - feature-toggles:
        toggleName: opsAgentEnabled

  session:
    dev: file
    prod: { provider: s3, bucket: "${ENV}-sessions" }  # literal string — resolved at runtime via env vars

  tools:
    - name: query-database
      type: database
      config: { readOnly: true, databases: [ops-db] }
    - name: call-api
      type: http
      config: { baseUrl: "https://api.internal" }
    - name: run-script
      type: cli
      config: { command: "kubectl" }
    - name: external-tools
      type: mcp
      config: { server: "localhost:3001" }

  cfrs:
    rate-limiting: true
    tracing: true
```

> **Note on `${...}` placeholders in spec values:** These are literal strings passed through to generated Python config files. They are resolved at runtime via environment variables, not during template rendering.

**Orchestrator** — multi-agent pipeline with routing and criticality:

```yaml
apiVersion: "1.0"
kind: python-agent
metadata:
  name: ops-orchestrator

spec:
  mode: orchestrator
  provider: strands
  streaming: true

  middleware:
    - correlation-id
    - auth:
        provider: auth0
        permission: "admin:query"

  session:
    dev: file
    prod: { provider: s3, bucket: "${ENV}-sessions" }

  agents:
    - name: planner
      prompt: "You are the planning agent..."
      tools: [call-api]
      critical: true          # failure stops the pipeline
    - name: enricher
      prompt: "You enrich context with data lookups..."
      tools: [query-database]
      critical: false          # failure is logged, flow continues with degraded results
    - name: executor
      prompt: "You execute approved plans..."
      tools: [run-script, query-database]
      critical: true

  routing: sequential           # or "parallel", "llm-decided"

  tools:
    - name: query-database
      type: database
      config: { readOnly: true, databases: [ops-db] }
    - name: call-api
      type: http
      config: { baseUrl: "https://api.internal" }
    - name: run-script
      type: cli
      config: { command: "kubectl" }

  cfrs:
    rate-limiting: true
    tracing: true
```

#### Tool Types

Four tool types at launch:

| Type | Description | Config |
|------|-------------|--------|
| `http` | REST API calls | `baseUrl`, `headers`, `timeout` |
| `cli` | Shell command execution | `command`, `args`, `timeout` |
| `database` | PostgreSQL queries | `readOnly`, `databases` |
| `mcp` | Model Context Protocol tools | `server`, `transport` |

Each tool type generates:
- Tool implementation file with `@tool` decorator (or equivalent for the chosen SDK)
- Configuration loader
- Input validation

**Future tool types:** `function` (inline Python), `file-write` (filesystem operations).

#### Orchestrator Criticality

Each agent in an orchestrator pipeline declares `critical: true|false`:

- **`critical: true`** (default) — if this agent fails, the entire pipeline halts and returns an error
- **`critical: false`** — if this agent fails, the failure is logged, and the pipeline continues with the remaining agents. Downstream agents receive a marker indicating the upstream agent failed, so they can adapt.

This enables resilient pipelines where non-essential enrichment steps can fail without blocking the core flow.

#### Orchestrator Routing

Three routing strategies for how requests flow through agents:

- **`sequential`** — agents execute in order, each receiving the prior agent's output as context
- **`parallel`** — agents execute concurrently, results aggregated at the end
- **`llm-decided`** — a meta-agent decides which agents to invoke and in what order based on the request

**CFRs provided** (always generated):
- tracing (correlation-id middleware is always included)
- metrics (token/cost tracking is always included)
- unit-tests (test scaffolding is always generated)

**CFRs conditionally generated** (only when spec includes the relevant middleware/config):
- auth — generated when `middleware` includes an `auth` entry
- authorization — generated when auth middleware specifies `permission`
- rate-limiting — generated when `cfrs.rate-limiting: true`

---

### Naming Conventions

Python naming follows PEP 8:

| Variant | Convention | Example |
|---------|-----------|---------|
| `snake` | Module/file names, functions, variables | `query_database`, `ops_agent` |
| `pascal` | Class names | `QueryDatabase`, `OpsAgent` |
| `kebab` | Package/project names in pyproject.toml | `ops-agent` |
| `screaming_snake` | Constants | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |

The `enrich()` function generates these variants for: service name, package name, each tool name, each agent name, each middleware name.

### Enrichment Pipeline

#### python-service `enrich()`

Transforms the spec into a flat context for templates:

```typescript
interface PythonServiceContext {
  // From metadata
  serviceName: NamingVariants;        // snake, pascal, kebab
  packageName: string;                // snake_case, derived from metadata.name

  // From spec.service
  port: number;                       // default 8000

  // Feature flags (drive conditional template inclusion)
  hasDatabase: boolean;
  databaseType: string;               // "postgres"
  hasDocker: boolean;                  // default true
}
```

#### python-agent `enrich()`

Transforms the spec into a rich context:

```typescript
interface PythonAgentContext {
  // Inherited from python-service context (resolved via build pipeline)
  packageName: string;                // snake_case package name

  mode: 'single' | 'orchestrator';
  provider: 'strands' | 'claude-agent-sdk' | 'openai' | 'ollama';
  streaming: boolean;

  // Provider-specific enrichment
  providerImport: string;             // e.g. "from strands import Agent"
  providerClientInit: string;         // e.g. "Agent(tools=tools)"
  providerDependency: string;         // e.g. "strands-agents>=1.0"
  providerToolDecorator: string;      // e.g. "@tool" or SDK-specific equivalent

  // Enriched tools (one per spec tool)
  tools: EnrichedTool[];

  // Enriched middleware (one per spec middleware entry)
  middleware: EnrichedMiddleware[];

  // Single mode only
  prompt?: string;

  // Orchestrator mode only
  agents?: EnrichedAgent[];
  routing?: 'sequential' | 'parallel' | 'llm-decided';

  // Session config
  session: { devProvider: string; prodProvider: string; prodConfig: object };
}

interface EnrichedTool {
  name: NamingVariants;               // snake for file, pascal for class
  type: 'http' | 'cli' | 'database' | 'mcp';
  config: Record<string, unknown>;    // passthrough, validated per type
  templatePath: string;               // e.g. "tools/http.py.hbs" or "tools/database.py.hbs"
}

interface EnrichedMiddleware {
  name: NamingVariants;
  type: string;                       // "correlation-id", "auth", "feature-toggles"
  config: Record<string, unknown>;
  hasAuth: boolean;                   // drives CFR declaration
}

interface EnrichedAgent {
  name: NamingVariants;
  prompt: string;
  toolRefs: string[];                 // references to tools[] by name
  critical: boolean;                  // default true
}
```

### Provider Template Switching

Each provider gets its own template subdirectory for SDK-specific files:

```
templates/
├── providers/
│   ├── strands/
│   │   ├── agent.py.hbs              # Strands Agent init + tool wiring
│   │   └── orchestrator.py.hbs       # Strands multi-agent pipeline
│   ├── claude-agent-sdk/
│   │   ├── agent.py.hbs
│   │   └── orchestrator.py.hbs
│   ├── openai/
│   │   ├── agent.py.hbs
│   │   └── orchestrator.py.hbs
│   └── ollama/
│       ├── agent.py.hbs
│       └── orchestrator.py.hbs
├── tools/
│   ├── http.py.hbs                   # Tool type templates (provider-agnostic)
│   ├── cli.py.hbs
│   ├── database.py.hbs
│   └── mcp.py.hbs
├── middleware/
│   ├── correlation_id.py.hbs
│   ├── auth.py.hbs
│   └── feature_toggles.py.hbs
├── routes/                           # Shared across modes
├── session/                          # Shared across modes
└── tests/                            # Test templates per tool type
```

The `enrich()` function sets `providerTemplatePath` based on `spec.provider`. The `generateFiles()` function selects the correct provider subdirectory and renders it to the shared output path (`agent.py`, `orchestrator.py`).

### `generateFiles()` Implementation

Both bundles use `generateFiles()` for one-to-many expansion:

**python-service** — simple directory-walk rendering (no `generateFiles()` needed). All templates are one-to-one.

**python-agent** — `generateFiles()` returns explicit `FileEntry[]`:

```typescript
function generateFiles(ctx: PythonAgentContext): FileEntry[] {
  const files: FileEntry[] = [];

  // Provider-specific agent file (select template by provider)
  files.push({
    path: `src/${ctx.packageName}/agent.py`,
    template: `providers/${ctx.provider}/agent.py.hbs`,
    overwrite: true,
  });

  // Per-tool files (select template by tool type)
  for (const tool of ctx.tools) {
    files.push({
      path: `src/${ctx.packageName}/tools/${tool.name.snake}.py`,
      template: `tools/${tool.type}.py.hbs`,
      context: { tool },
      overwrite: true,
    });
    files.push({
      path: `tests/test_tools/test_${tool.name.snake}.py`,
      template: `tests/test_tool.py.hbs`,
      context: { tool },
      overwrite: true,
    });
  }

  // Per-middleware files
  for (const mw of ctx.middleware) {
    files.push({
      path: `src/${ctx.packageName}/middleware/${mw.name.snake}.py`,
      template: `middleware/${mw.type}.py.hbs`,
      context: { middleware: mw },
      overwrite: true,
    });
  }

  // Extension point: default agent behavior (overwrite: false)
  files.push({
    path: `src/${ctx.packageName}/defaults/default_agent.py`,
    template: 'defaults/default_agent.py.hbs',
    overwrite: false,
  });

  // Orchestrator mode
  if (ctx.mode === 'orchestrator') {
    files.push({
      path: `src/${ctx.packageName}/orchestrator.py`,
      template: `providers/${ctx.provider}/orchestrator.py.hbs`,
      overwrite: true,
    });

    for (const agent of ctx.agents!) {
      files.push({
        path: `src/${ctx.packageName}/agents/${agent.name.snake}/agent.py`,
        template: 'agents/agent.py.hbs',
        context: { agent },
        overwrite: true,
      });
      // Extension point per agent (overwrite: false)
      files.push({
        path: `src/${ctx.packageName}/agents/${agent.name.snake}/default_${agent.name.snake}.py`,
        template: 'agents/default_agent.py.hbs',
        context: { agent },
        overwrite: false,
      });
    }
  }

  return files;
}
```

### Schema Outline

#### python-service schema

```json
{
  "type": "object",
  "required": ["service"],
  "properties": {
    "service": {
      "type": "object",
      "required": ["package"],
      "properties": {
        "port": { "type": "integer", "default": 8000 },
        "package": { "type": "string", "pattern": "^[a-z][a-z0-9_]*$" }
      }
    },
    "features": {
      "type": "object",
      "properties": {
        "database": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": false },
            "type": { "enum": ["postgres"], "default": "postgres" }
          }
        },
        "docker": { "type": "boolean", "default": true }
      }
    }
  }
}
```

#### python-agent schema

```json
{
  "type": "object",
  "required": ["mode", "provider"],
  "properties": {
    "mode": { "enum": ["single", "orchestrator"], "default": "single" },
    "provider": { "enum": ["strands", "claude-agent-sdk", "openai", "ollama"], "default": "strands" },
    "streaming": { "type": "boolean", "default": true },
    "prompt": { "type": "string" },
    "middleware": {
      "type": "array",
      "items": {
        "oneOf": [
          { "type": "string" },
          { "type": "object", "minProperties": 1, "maxProperties": 1 }
        ]
      }
    },
    "session": {
      "type": "object",
      "properties": {
        "dev": { "type": "string", "default": "file" },
        "prod": { "type": "object" }
      }
    },
    "tools": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["name", "type"],
        "properties": {
          "name": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "type": { "enum": ["http", "cli", "database", "mcp"] },
          "config": { "type": "object" }
        }
      }
    },
    "agents": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "prompt"],
        "properties": {
          "name": { "type": "string" },
          "prompt": { "type": "string" },
          "tools": { "type": "array", "items": { "type": "string" } },
          "critical": { "type": "boolean", "default": true }
        }
      }
    },
    "routing": { "enum": ["sequential", "parallel", "llm-decided"], "default": "sequential" },
    "cfrs": { "type": "object", "additionalProperties": { "type": "boolean" } }
  },
  "if": { "properties": { "mode": { "const": "orchestrator" } } },
  "then": { "required": ["agents"] },
  "else": { "required": ["prompt", "tools"] }
}
```

### Generated File Structure

**python-service standalone:**
```
ops-service/
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── src/
│   └── ops_service/
│       ├── __init__.py
│       ├── main.py                    # FastAPI app entry point
│       ├── config.py                  # Pydantic settings
│       ├── routes/
│       │   └── health.py              # /health endpoint
│       └── defaults/
│           └── default_routes.py      # Extension point (overwrite: false)
├── tests/
│   └── conftest.py
└── .fixedcode-manifest.json
```

**Single agent (python-service + python-agent):**
```
ops-agent/
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── src/
│   └── ops_agent/
│       ├── __init__.py
│       ├── main.py                    # FastAPI app entry point
│       ├── config.py                  # Pydantic settings
│       ├── agent.py                   # Agent definition + LLM client
│       ├── routes/
│       │   ├── query.py               # /query endpoint
│       │   ├── stream.py              # /stream endpoint
│       │   └── health.py              # /health endpoint
│       ├── tools/
│       │   ├── query_database.py      # Generated per tool
│       │   ├── call_api.py
│       │   └── run_script.py
│       ├── middleware/
│       │   ├── correlation_id.py
│       │   ├── auth.py
│       │   └── feature_toggles.py
│       ├── session/
│       │   ├── manager.py             # Session interface
│       │   ├── file_store.py          # Dev storage
│       │   └── s3_store.py            # Prod storage
│       └── defaults/
│           └── default_agent.py       # Extension point (overwrite: false)
├── tests/
│   ├── conftest.py
│   ├── test_agent.py
│   └── test_tools/
│       ├── test_query_database.py
│       └── test_call_api.py
└── .fixedcode-manifest.json
```

**Orchestrator adds:**
```
├── src/
│   └── ops_agent/
│       ├── orchestrator.py            # Pipeline router + aggregator
│       ├── agents/
│       │   ├── planner/
│       │   │   ├── agent.py
│       │   │   └── default_planner.py # Extension point
│       │   ├── enricher/
│       │   │   ├── agent.py
│       │   │   └── default_enricher.py
│       │   └── executor/
│       │       ├── agent.py
│       │       └── default_executor.py
```

---

## Part 2: CI/CD Bundles

### Bundle Architecture

Two bundle families per CI/CD platform:

| Bundle | Role |
|--------|------|
| `{platform}-fixedcode` | FixedCode generation pipeline (spec change → build → PR) |
| `{platform}-service` | Service CI/CD pipeline (build → test → deploy) |

**Platforms at launch:**
- `github-actions-fixedcode` / `github-actions-service`

**Future platforms:**
- `gitlab-ci-fixedcode` / `gitlab-ci-service`
- `bitbucket-pipelines-fixedcode` / `bitbucket-pipelines-service`

### github-actions-fixedcode

Generates a GitHub Actions workflow that:
1. Triggers on spec file changes (`.yaml` in a configured directory)
2. Runs `fixedcode build` to regenerate code
3. Opens a PR with the generated diff
4. Runs `fixedcode verify` as a check

**Rendering:** Directory-walk templates (one-to-one). No `generateFiles()` needed.

**Spec format:**
```yaml
apiVersion: "1.0"
kind: github-actions-fixedcode
metadata:
  name: workspace-generation

spec:
  specDir: specs/
  outputDir: src/
  branches:
    trigger: main
    targetPrefix: generated/fixedcode   # branch name: generated/fixedcode-<run-id>
  verify: true
  nodeVersion: "20"
```

**Generates:**
```
.github/
└── workflows/
    └── fixedcode-generate.yml
```

### github-actions-service

Generates a GitHub Actions workflow for the service itself:
1. Build and test on PR
2. Build Docker image on merge
3. Deploy to environments (dev/staging/prod)

**Rendering:** Directory-walk templates (one-to-one). No `generateFiles()` needed.

**Spec format:**
```yaml
apiVersion: "1.0"
kind: github-actions-service
metadata:
  name: ops-agent-cicd

spec:
  language: python          # or "kotlin"
  docker:
    registry: ghcr.io
    image: "myorg/ops-agent"       # literal — no runtime interpolation
  environments:
    - name: dev
      trigger: push
      branch: main
    - name: staging
      trigger: manual
    - name: prod
      trigger: manual
      requiresApproval: true
  steps:
    test: true
    lint: true
    securityScan: true
```

**Generates:**
```
.github/
└── workflows/
    ├── ci.yml              # Build + test on PR
    ├── docker.yml          # Build + push image on merge
    └── deploy.yml          # Environment deployments
```

### CI/CD Bundle Notes

- CI/CD bundles use simple directory-walk rendering — no `generateFiles()`, no adapters, no generator integration.
- No `enrich()` complexity — the spec maps almost directly to template variables.
- These are intentionally simple bundles to validate the pattern before adding more platforms.
- `enrich()` is a near-passthrough — maps spec fields to template variables with minimal transformation (e.g., deriving workflow file names from metadata.name).

---

## Implementation Order

1. **`ts-service`** — TypeScript project skeleton (validates TS bundle pattern)
2. **`ts-agent` single mode** — standalone agent with tools
3. **`ts-agent` orchestrator mode** — multi-agent pipeline
4. **`rdan-agent`** — r.dan-compatible agent (simpler — kernel does the heavy lifting)
5. **`python-service`** — Python project skeleton (same pattern, FastAPI)
6. **`python-agent` single mode** — single agent with tools and middleware
7. **`python-agent` orchestrator mode** — multi-agent pipeline
8. **`github-actions-fixedcode`** — FixedCode generation pipeline
9. **`github-actions-service`** — service CI/CD pipeline
10. **Additional CI/CD platforms** — GitLab, Bitbucket as needed

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM SDK | Configurable via `provider` field | Users have existing preferences and contracts |
| Agent modes | Single bundle, spec-driven | Avoids bundle proliferation |
| Tool types at launch | http, cli, database, mcp | Covers most real use cases |
| Criticality model | Per-agent `critical` flag | Simple, proven in gap-cli |
| CI/CD bundle split | Separate fixedcode vs service bundles | Different concerns, different triggers |

## Decisions Deferred

- Tool type extensibility (custom tool types via plugin bundles)
- Agent-to-agent data contract in orchestrator mode (what shape flows between sequential agents — blocks orchestrator template authoring)
- Secret management in CI/CD bundles
- Multi-cloud deployment targets
- Agent versioning and rollback strategies
- OpenAPI adapter for python-agent endpoints (deferred — may not be needed since agent endpoints are fixed, not domain-derived)
- Session config may move from spec to `.fixedcode.yaml` overlay (environment-specific config in the domain spec is a smell, but pragmatic for now)
