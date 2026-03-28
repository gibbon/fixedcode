# Spec-Driven Code Generator -- Product Design Spec

## 1. Product Overview

### What it is
An open-source, spec-driven code generation engine with a methodology for combining deterministic generation with AI-assisted development (the "AI sandwich" pattern). A modern replacement for Yeoman, built for the AI era.

### The problem it solves
AI coding tools generate inconsistent output. Traditional scaffolding is fire-and-forget. Enterprise teams need structural guarantees that scale across services and teams without depending on human discipline.

### Core thesis
AI is best at creative work (defining intent, writing business logic). Deterministic generation is best at structural work (consistent, auditable, repeatable). The product sits in the middle as the trust layer.

### The AI Sandwich
```
AI (creative)        -> spec authoring from natural language
Deterministic        -> structural code generation (the engine)
AI (creative)        -> business logic embellishment in extension points
```

AI handles both ends. Deterministic generation handles the structural middle layer where guarantees matter. No AI in the generation path -- same spec always produces identical output.

### What it is NOT
- Not a SaaS
- Not an AI coding assistant
- Not a one-time scaffolding tool
- The engine is schema and language agnostic -- templates define the output, not the engine

### Commercial model
- **Stage 1: Starter kit** -- engine + opinionated schema packs + template bundles for popular stacks
- **Stage 2: Consulting** -- help orgs design their own specs, templates, and extension contracts
- **Stage 3: Marketplace** -- open-source engine, community bundles, enterprise template packs

### Competitive landscape
| Tool | Limitation |
|------|-----------|
| Yeoman | Effectively deprecated, fire-and-forget, no regeneration |
| Cookiecutter | Python-only, fire-and-forget, no schema system |
| Plop | Lightweight but limited, no ecosystem |
| Nx/Turborepo generators | Tied to monorepo ecosystems |
| AI coding assistants | Inconsistent output, no structural guarantees |

This product occupies the unoccupied space: general purpose, schema-driven, regeneration-safe code generation with an ecosystem.

---

## 2. Architecture

### Three layers

#### Layer 1: The Engine (core, schema-agnostic)
The engine knows nothing about DDD, REST, events, or any specific architecture. It understands: "here's a schema definition, here's a YAML file that conforms to it, here are templates that consume the enriched metadata, produce files."

Responsibilities:
- CLI entry point with commands
- Schema registry -- discovers and loads schema definitions
- YAML parser with field-order preservation
- Metadata enrichment pipeline -- delegates to schema-specific enrichers
- Template renderer -- discovers bundles, renders templates, outputs files
- Regeneration manager -- tracks generated vs hand-written files
- Bundle discovery and composition

#### Layer 2: Schema Definitions (pluggable grammars)
Each schema defines:
- The YAML grammar (valid keys, types, relationships)
- Validation rules (cross-referencing, required fields, naming conventions)
- Enrichment rules (how to compute derived metadata -- name variants, type mappings, relationship detection)
- The template context shape (what data templates receive)

Schemas are independent packages. Users install only what they need. Third parties can create new schemas.

#### Layer 3: Template Bundles (the output)
A bundle is tied to one schema type + one target stack. Bundles contain:
- Template files (`.tmpl`)
- Static files (copied as-is)
- A bundle manifest (schema requirement, variables, feature flags, regeneration contract)
- Extension point declarations

Bundles are versioned independently from the engine.

---

## 3. Schema Definitions

### What a schema definition is

A schema is a package that teaches the engine how to understand a specific YAML grammar. It contains:

```
schemas/
  ddd-cqrs/
    schema.yaml          # Grammar definition (valid keys, types, structure)
    enricher.js          # or enricher.go -- transforms parsed YAML into template context
    defaults.yaml        # Default values and conventions
    examples/
      workspace.yaml     # Example spec for documentation
```

#### schema.yaml -- Grammar definition
Defines what the user-facing YAML can contain:
```yaml
name: ddd-cqrs
version: "1.0"
description: Domain-Driven Design with CQRS and Event Sourcing

root:
  required: [schema, boundedContext, aggregates]
  optional: [service, remoteAggregates]

definitions:
  aggregate:
    required: [attributes]
    optional: [commands, queries, events, entities, enumDefaults]
  attribute:
    syntax: "name[!]: type [= default]"
    # ! suffix = required field
    # = suffix = enum reference or literal default
  command:
    syntax: "CommandName(pathParams){bodyParams} -> EventName"
  query:
    syntax: "QueryName(params) -> ReturnType"

types:
  primitives: [uuid, string, integer, long, decimal, boolean, date, datetime, object]
  modifiers:
    "!": required
    "= EnumName": enum_reference
    "= literal": default_value
```

#### Enricher -- the critical abstraction
The enricher is a function that transforms parsed YAML into a rich template context. This is where the real work happens:

```
Input (parsed YAML):
  { name: "Workspace", attributes: { workspaceId!: uuid, name!: string } }

Enricher computes:
  - Name variants: Name, NameCamel, NamePascal, NameSnake, NameKebab
  - Type mappings: uuid -> UUID (Kotlin), string -> String, decimal -> BigDecimal
  - Field metadata: required flags, defaults, enum references
  - Command/query decomposition: path params, body params, return types
  - Relationship detection: foreign keys, entity hierarchies
  - Import requirements: which types need which imports

Output (template context):
  {
    Name: "Workspace",
    NameCamel: "workspace",
    NamePascal: "Workspace",
    NameSnake: "workspace",
    IDField: "workspaceId",
    Fields: [{ Name: "workspaceId", Type: "UUID", Required: true, ... }, ...],
    Commands: [{ Name: "CreateWorkspace", PathParams: [], BodyParams: [...], ... }],
    Queries: [...],
    HasCommands: true,
    HasEvents: true,
    ...
  }
```

The engine invokes the enricher and passes the result to the template renderer. The engine never inspects the template context -- it's opaque data that only the templates need to understand.

### MVP schemas (Stage 1)

#### 3.1 DDD/CQRS Schema
For enterprise service platforms, event-driven architectures.

```yaml
schema: ddd-cqrs/1.0
boundedContext: Workspace
aggregates:
  Workspace:
    attributes:
      workspaceId!: uuid
      name!: string
      status: string = Status
    commands:
      - CreateWorkspace{name!, status} -> WorkspaceCreated
    queries:
      - GetWorkspace(workspaceId!) -> Workspace
    events:
      WorkspaceCreated: [workspaceId!, name!]
    entities:
      Party:
        partyId!: uuid
        partyType!: string
```

Enrichment produces: aggregate contexts, command/query metadata, event schemas, entity hierarchies, CQRS separation.

#### 3.2 REST/CRUD Schema
For simpler API services, SaaS backends.

```yaml
schema: rest-crud/1.0
service: UserService
resources:
  User:
    fields:
      userId!: uuid
      email!: string
      name!: string
      role: string = Role
    relationships:
      - hasMany: Post
      - belongsTo: Organisation
    validation:
      email: email_format
    endpoints:
      - create
      - read
      - update
      - delete
      - list(page, size, filters)
```

Enrichment produces: resource metadata, relationship mappings, validation rules, endpoint definitions, DTO shapes.

### Future schemas (post-MVP)

Three additional schemas are planned but deferred past Stage 1. See Appendix A for their designs:
- **Event-Driven** -- producers, consumers, topics, event schemas (data pipelines, integration platforms)
- **Frontend** -- pages, components, data sources, auth rules (app scaffolding). Note: frontend generation is significantly harder than backend due to framework fragmentation
- **Infrastructure** -- services, environments, dependencies (Terraform/Helm/Pulumi generation). Note: abstracting across IaC tools with different models is non-trivial

---

## 4. Developer Workflow (The AI Sandwich)

### Step 1: Define (AI-assisted)
Developer describes what they want in natural language. AI generates a domain spec YAML conforming to the chosen schema.

### Step 2: Validate (deterministic)
```
[tool] validate --spec workspace-domain.yaml
```
Engine validates the spec against the schema -- cross-references, naming conventions, type checking.

### Step 3: Generate (deterministic)
```
[tool] generate --spec workspace-domain.yaml --bundle spring-kotlin
```
Engine enriches metadata and renders templates. Same spec produces identical output, every time, in seconds.

### Step 4: Embellish (AI-assisted)
Developer uses their preferred AI tool (Copilot, Claude, Cursor, etc.) to write business logic in the designated extension points.

### Step 5: Regenerate (deterministic)
```
[tool] generate --spec workspace-domain.yaml --bundle spring-kotlin
```
Templates improve, developer regenerates. Structural code updates. Hand-written extensions preserved.

The engine defines the boundary between what's generated and what's hand-written. This contract is what makes regeneration safe and what differentiates this from fire-and-forget scaffolding.

---

## 5. Regeneration Contract

The hardest problem in the system. This section defines how generated and hand-written code coexist safely.

### File categories

Every file in the output belongs to one of three categories:

| Category | Who creates it | Who modifies it | On regenerate |
|----------|---------------|-----------------|---------------|
| **regenerate** | Engine | Engine only | Overwritten |
| **once** | Engine | Developer | Skipped (never touched again) |
| **extension-point** | Engine creates stub | Developer fills in logic | Stub only created if missing |

### How extension points work

The engine generates two things: an **interface** (regenerated) and a **default implementation stub** (created once).

Example for DDD/CQRS:
```
# These are regenerated every time (engine owns them):
src/domain/workspace/WorkspaceValidator.kt          # Interface
src/domain/workspace/DefaultWorkspaceValidator.kt    # Default impl

# This is created once as a stub, then developer owns it:
src/extensions/AustralianWorkspaceValidator.kt       # Extension point
```

The developer writes their business logic in the extension file. The generated interface and default impl can be regenerated freely because they don't contain hand-written code. The extension file implements the interface, so if the interface changes, the compiler catches the mismatch.

### Conflict handling

**Developer edits a `regenerate` file:**
- The engine overwrites it. This is by design -- `regenerate` files are engine-owned.
- The manifest makes this clear upfront. If a developer needs custom behaviour, they use extension points, not direct edits.
- MVP: no warning. Future: optional warning via content hash comparison.

**New template version adds a file that already exists:**
- If the file is in the manifest as `regenerate`, overwrite it.
- If the file is NOT in the manifest (developer created it independently), skip it and warn.

**Developer deletes a generated file:**
- Next regeneration recreates it. Generated files are always recreated from the spec.

**Constraint:** Regeneration safety works at the file level. The engine does not merge content within files. This means the bundle architecture must be designed so that generated code and hand-written code live in separate files. This is a deliberate constraint, not a limitation -- it forces clean separation of concerns.

---

## 6. Template Bundle Architecture

### Bundle directory structure
```
bundles/
  ddd-cqrs-spring-kotlin/
    bundle.yaml              # Manifest
    templates/
      domain/
        {{ .NameCamel }}/
          {{ .NamePascal }}.kt.tmpl
          {{ .NamePascal }}BusinessService.kt.tmpl
      application/
        {{ .NameCamel }}/
          {{ .NamePascal }}CommandService.kt.tmpl
          {{ .NamePascal }}QueryService.kt.tmpl
      infrastructure/
        {{ .NamePascal }}Repository.kt.tmpl
      api/
        {{ .NamePascal }}Controller.kt.tmpl
    static/
      build.gradle.kts
      gradlew
    partials/
      _imports.tmpl
      _audit-fields.tmpl
```

### Bundle manifest
```yaml
name: ddd-cqrs-spring-kotlin
version: 1.0.0
schema: ddd-cqrs/1.0
description: Spring Boot + Kotlin with clean architecture

variables:
  required:
    - name: groupId
      description: Maven group ID
  optional:
    - name: port
      default: 8080

files:
  regenerate:           # Overwritten on every generate
    - templates/**
  once:                 # Created first time only, never overwritten
    - static/**
  extension-points:     # Stub created if missing, then developer-owned
    - extensions/**
```

### Design decisions
1. **The manifest declares the regeneration contract** -- which files the engine owns, which are one-time scaffolding, and which are extension stubs (see Section 5)
2. **Partials for reuse** -- common template fragments shared within a bundle
3. **Variables bridge spec and templates** -- things not in the domain spec but needed for generation
4. **Independent versioning** -- new bundle version doesn't require new engine version

---

## 6. Engine Internals

### CLI Commands
```
codegen init                               # Initialize a new project
codegen init --schema ddd-cqrs             # Initialize with a specific schema
codegen validate --spec domain.yaml        # Validate spec against schema
codegen generate --spec domain.yaml        # Generate from spec + bundle
codegen bundle list                        # List installed bundles
codegen bundle add ./path/to/bundle        # Install a bundle (local path or git URL in MVP)
codegen schema list                        # List installed schemas
```

Note: `codegen` is a placeholder CLI name. MVP `bundle add` supports local paths and git URLs only -- no remote registry until Stage 3.

### Generation pipeline
```
1.  Load spec file (YAML)
2.  Detect schema type (from schema: key in YAML)
3.  Load schema definition
4.  Parse spec against schema grammar
5.  Validate (schema rules + cross-references)
6.  Enrich (schema-specific enrichment -> template context)
7.  Discover bundle (from CLI flag or project config)
8.  Load bundle manifest
9.  Resolve variables (from spec + CLI + defaults)
10. Resolve feature flags
11. Render templates (enriched context -> output files)
12. Apply regeneration contract (skip hand-written files)
13. Write files
```

### Schema enricher interface
Each schema registers its own enricher:
```
SchemaEnricher:
  - parse(yaml) -> raw model
  - validate(raw model) -> errors
  - enrich(raw model) -> template context
```

The engine doesn't care what the enricher produces. It passes the result to the template renderer.

### Regeneration tracking
The engine maintains a `.generated-manifest.json` in the output directory:
```json
{
  "engine": "0.1.0",
  "bundle": "ddd-cqrs-spring-kotlin@1.0.0",
  "spec": "workspace-domain.yaml",
  "files": {
    "src/domain/Workspace.kt": "regenerate",
    "src/extensions/AUWorkspaceValidator.kt": "extension-point"
  }
}
```

### What the engine does NOT do
- No opinions about output language or framework
- No built-in type system (schemas define their own)
- No build/compile/test commands (developer's toolchain)
- No AI integration built in (bring your own)

---

## 7. Stage 1 Scope (MVP)

### Engine
- CLI with `init`, `validate`, `generate`, `bundle list/add`, `schema list`
- Schema registry (load schema definitions from local packages)
- YAML parser with field-order preservation
- Enrichment pipeline (schema calls its enricher, engine passes result to renderer)
- Template renderer
- Basic regeneration contract (regenerate vs once vs extension-point)
- Generated file manifest (simple list, no hash tracking)

### Schemas (2 to start)
- **DDD/CQRS** -- proven model, strongest differentiator for enterprise audience
- **REST/CRUD** -- broadest appeal, easiest to demo

Event-Driven, Frontend, and Infrastructure schemas follow in Stage 1.5 or from consulting engagements.

### Bundles (3 to start)
- ddd-cqrs-spring-kotlin
- rest-crud-express-typescript
- rest-crud-fastapi-python

### Documentation
- Methodology paper ("Spec-Driven Development")
- Getting started guide (spec to running service in 10 minutes)
- Bundle authoring guide
- Schema authoring guide

### What Stage 1 does NOT include
- AI integration (bring your own)
- Marketplace infrastructure
- Migration generation
- Build/test/run commands

---

## 8. Future Stages

### Stage 1.5
- Event-Driven, Frontend, and Infrastructure schemas
- Additional bundles (Go, .NET, React, Terraform)
- Migration generation support
- AI integration helpers (prompt templates for spec authoring)

### Stage 2: Consulting
- Help orgs design custom specs, templates, and extension contracts
- Custom schema development for niche architectures
- Training and enablement

### Stage 3: Marketplace
- Open-source engine
- Community bundle registry
- Enterprise template packs (compliance-ready, audit-ready)
- Verified/certified bundles
- Usage analytics for bundle authors

---

## 9. Prior Art and Reference Implementation

This design is informed by the GAP (Group API Platform) built at Pexa, which has been in production use across AU, NZ, and UK jurisdictions. Key learnings from that implementation:

- ~30 lines of YAML spec replaces thousands of lines of hand-written code
- 3-second generation, 2-minute full verification cycle
- 90% of structural code is generated, not handwritten
- 100% structural consistency across all services, zero architectural drift
- New capability deployed to all services in 2 days vs weeks per service manually
- New starters productive within a week

The GAP implementation proves the pattern works at enterprise scale. This product generalises the pattern for any architecture, any language, any team.

---

## 10. Open Decisions

- **Language choice for the engine**: Go vs TypeScript. Decision deferred. Architecture is the same either way.
- **Product name**: Under exploration. No decision yet.
- **Template language**: Go templates (proven) vs Handlebars/Nunjucks (more accessible). May depend on engine language choice.
- **Package distribution**: npm, Homebrew, standalone binary, or all of the above. Depends on language choice.
- **Schema plugin model**: Schemas need to register enrichers with the engine. If the engine is Go, enrichers could be Go plugins, embedded scripts, or subprocesses. If TypeScript, enrichers could be npm packages with a standard export. Decision depends on engine language.
- **Marketplace infrastructure**: Not needed for Stage 1. Design later when ecosystem demand is clearer.

---

## Appendix A: Future Schema Designs

These schemas are planned for Stage 1.5 or later. Included here for reference.

### A.1 Event-Driven Schema
For data pipelines, integration platforms.

```yaml
schema: event-driven/1.0
system: OrderProcessing
producers:
  OrderService:
    publishes:
      - OrderPlaced: {orderId!: uuid, total!: decimal}
      - OrderShipped: {orderId!: uuid, trackingId: string}
consumers:
  InventoryService:
    subscribes:
      - OrderPlaced -> ReserveStock
      - OrderShipped -> UpdateInventory
    deadLetter: true
    retries: 3
topics:
  orders:
    partitionKey: orderId
    retention: 7d
```

Enrichment produces: producer/consumer contracts, topic configurations, handler scaffolds, DLQ setup, event schema registry entries.

### A.2 Frontend Schema
For app scaffolding with API + UI together.

```yaml
schema: frontend/1.0
app: WorkspaceManager
pages:
  WorkspaceList:
    route: /workspaces
    dataSource: GET /api/workspaces
    components:
      - DataTable(columns: [name, status, createdAt])
      - SearchFilter(fields: [status, name])
  WorkspaceDetail:
    route: /workspaces/:id
    dataSource: GET /api/workspaces/:id
    components:
      - DetailView(fields: [name, status, parties])
      - ActionBar(actions: [edit, archive])
auth:
  provider: oauth2
  roles: [admin, viewer]
```

Enrichment produces: route definitions, component trees, data fetching hooks, auth guards, form schemas.

**Feasibility note:** Frontend generation is significantly harder than backend due to framework fragmentation (React vs Vue vs Svelte, each with multiple routing/state solutions). Expect 5-10x more effort than backend schemas.

### A.3 Infrastructure Schema
For Terraform/Pulumi/Helm generation from a service catalog.

```yaml
schema: infrastructure/1.0
platform: OrderPlatform
services:
  order-service:
    type: api
    runtime: jvm
    scaling: {min: 2, max: 10}
    dependencies:
      - postgres: {version: 15}
      - kafka: {topics: [orders, inventory]}
    environments:
      dev: {replicas: 1}
      prod: {replicas: 3, region: ap-southeast-2}
  worker-service:
    type: consumer
    runtime: jvm
    subscribes: [orders.OrderPlaced]
```

Enrichment produces: Terraform/Helm/Pulumi resources, environment configs, dependency wiring, scaling policies, network rules.

**Feasibility note:** Terraform, Pulumi, and Helm have fundamentally different models (declarative HCL vs imperative code vs templated YAML). A single spec abstracting all three requires careful design to avoid trivialising any of them.
