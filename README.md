# FixedCode

**Spec-driven, deterministic code generation for the AI era.**

[Website](https://fixedcode.ai)  ·  [npm](https://www.npmjs.com/package/fixedcode)  ·  [Docs](docs/architecture.md)  ·  [Changelog](CHANGELOG.md)  ·  [Issues](https://github.com/gibbon/fixedcode/issues)

[![npm version](https://img.shields.io/npm/v/fixedcode.svg)](https://www.npmjs.com/package/fixedcode)
[![CI](https://github.com/gibbon/fixedcode/actions/workflows/ci.yml/badge.svg)](https://github.com/gibbon/fixedcode/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/fixedcode.svg)](https://www.npmjs.com/package/fixedcode)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

YAML in. Production code out. Same spec → same code, every time.

```bash
npm install -g fixedcode
fixedcode generate my-domain.yaml -o build
fixedcode deploy build /path/to/your/project
```

> **No LLM required.** The core engine — `generate`, `build`, `verify`, `deploy`, `validate`, `registry` — is fully deterministic and works **offline with zero AI dependencies**. The optional `draft` (spec-from-prose) and `enrich` (extension-point fill-in) commands use an LLM if you configure one, but you never have to. Hand-write your spec, hand-write your business logic, and the engine still works exactly the same.

## Why FixedCode?

LLMs are great at writing code from descriptions, but their output isn't reproducible — ask twice and you get two different answers. FixedCode flips this: the LLM writes the **spec**, the engine writes the **code**, and the LLM fills in extension points where the human-readable logic lives. The middle step is deterministic — the same YAML always produces the same output, byte for byte.

The result is what we call the **AI sandwich**:

- **Top slice (AI)** — turns natural language into a YAML spec.
- **Middle (deterministic)** — the FixedCode engine generates the project skeleton, controllers, tests, configs, migrations, etc.
- **Bottom slice (AI)** — fills in business logic in the extension points that were left blank.

You get the speed of "write me a service that does X" with the auditability of "I can read the spec and the templates." Regenerate at any time without losing your custom logic — extension points are user-owned.

## Quickstart

The minimum viable workflow needs **no LLM** at all:

```bash
npm install -g fixedcode

# write your spec by hand (or copy an example), then:
fixedcode generate my-domain.yaml -o build
fixedcode verify   my-domain.yaml build
fixedcode deploy   build /path/to/your/project
```

### Optional: LLM-assisted commands

If you'd rather not write specs and extension-point logic by hand, FixedCode can use an LLM. **This is opt-in** — you only need it for the two AI-flavoured commands:

```bash
# draft a spec from a description (LLM required)
fixedcode draft spring-domain "order service with orders and line items" -o my-domain.yaml

# fill in extension-point business logic (LLM required)
fixedcode enrich build/
```

To use these, drop an `llm` block in `.fixedcode.yaml`:

```yaml
llm:
  provider: openrouter # openrouter | openai | ollama
  model: google/gemini-2.5-flash
  apiKeyEnv: OPENROUTER_API_KEY
```

Allowed endpoints: openrouter.ai, api.openai.com, api.anthropic.com, plus loopback for local model servers (Ollama). See [`docs/llm.md`](docs/llm.md) for the full trust model.

## Concepts

A FixedCode project ties together three things:

| Concept | What it is |
|---|---|
| **Spec** | A YAML file describing what to build, validated against a bundle's JSON Schema. |
| **Bundle** | A package of Handlebars templates + an `enrich()` function that turns a spec into a render context. Produces files. |
| **Generator** | A programmatic (non-template) producer of files. Generators take an adapter-mapped context and emit files. The OpenAPI generator is the worked example. |

The engine pipeline:

```
spec.yaml → parse → validate → enrich → render templates → run generators → write
```

Two regeneration rules keep your work safe:

- **Generated files** (`overwrite: true`) — always rewritten when you regenerate.
- **Extension points** (`overwrite: false`) — generated once, then user-owned.

A `.fixedcode-manifest.json` in the output dir tracks every generated file with its overwrite flag and content hash.

## Bundles & generators

| Package | Kind | What it generates |
|---|---|---|
| [`spring-domain`](bundles/spring-domain) | bundle | Spring Boot DDD domain code in Kotlin: aggregates, commands, queries, controllers, repositories, events. |
| [`ts-service`](bundles/ts-service) | bundle | TypeScript + Express service skeleton with structured logging, config, tests. |
| [`ts-agent`](bundles/ts-agent) | bundle | TypeScript AI-agent service: tool registry, LLM loop, HTTP server. |
| [`python-service`](bundles/python-service) | bundle | Python + FastAPI service skeleton. |
| [`python-agent`](bundles/python-agent) | bundle | Python AI-agent service. |
| [`crud-api`](bundles/crud-api) | bundle | Minimal CRUD REST API (template-only). |
| [`vite-react-app`](bundles/vite-react-app) | bundle | Vite + React 19 + TypeScript SPA: TanStack Router, Tailwind v4, optional Supabase auth, optional Docker. |
| [`kotlin-spring-bff`](bundles/kotlin-spring-bff) | bundle | Kotlin + Spring Boot 3.3 Backend-For-Frontend: Resilience4j circuit breakers, typed WebClient per downstream service, optional Caffeine cache, JWT/OAuth2 security, JPA, Docker. |
| [`ddd-spike`](bundles/ddd-spike) | bundle | Original DDD reference bundle. |
| [`openapi`](generators/openapi) | generator | OpenAPI 3.0.3 spec from a domain context (used by `spring-domain`). |

Discover and install community bundles via the registry:

```bash
fixedcode registry list
fixedcode registry search agent
fixedcode registry install spring-domain
```

## Cross-Functional Requirements (CFRs)

Bundles declare which non-functional requirements they bake in (auth, logging, error handling, retry, soft-delete, etc.). The engine knows about a catalog of 28 CFRs across 7 categories and can verify or report on coverage:

```bash
fixedcode cfr catalog                              # list known CFRs
fixedcode cfr suggest order-domain.yaml        # what's missing?
fixedcode cfr check order-domain.yaml build    # is everything wired?
fixedcode cfr report order-domain.yaml build   # markdown report
```

See [`docs/cfrs.md`](docs/cfrs.md) for the full catalog.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — engine pipeline, contracts, types
- [`docs/bundles.md`](docs/bundles.md) — writing your own bundle
- [`docs/generators.md`](docs/generators.md) — writing your own generator
- [`docs/cfrs.md`](docs/cfrs.md) — Cross-Functional Requirements
- [`docs/registry.md`](docs/registry.md) — how the registry works, publishing
- [`docs/llm.md`](docs/llm.md) — LLM configuration and security caveats
- [`docs/release.md`](docs/release.md) — internal: cutting a release

## Roadmap

Pre-1.0; expect API evolution. Tracked in [issues](https://github.com/gibbon/fixedcode/issues):

- AST-validate LLM output before writing extension points (#8)
- Publish bundles + the OpenAPI generator to npm
- Interactive `enrich` confirmation (#5)
- More language bundles

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache License 2.0](LICENSE) — © 2026 contributors.
