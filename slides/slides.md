---
theme: default
title: 'Determy - The Trust Layer Between AI and Your Code'
info: 'Spec-driven. Deterministic. Regeneration-safe.'
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
---

<style>
@import './styles/theme.css';
</style>

<div class="flex flex-col items-center justify-center h-full">
  <div class="gradient-text-lg mb-4">Determy</div>
  <div class="separator"></div>
  <p class="text-xl mt-4 !color-white opacity-90">The Trust Layer Between AI and Your Code</p>
  <p class="text-sm mt-6 opacity-50 tracking-widest uppercase">Spec-driven &middot; Deterministic &middot; Regeneration-safe</p>
</div>

---
transition: slide-left
---

# The Problem

<div class="grid grid-cols-3 gap-6 mt-10">

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">AI Tools Are Inconsistent</span></h3>
  <p class="!text-sm opacity-80">Two developers, same prompt, different output. Every time.</p>
  <p class="!text-sm opacity-60 mt-3">Structural consistency is left to chance.</p>
</div>

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">Scaffolding Is Fire-and-Forget</span></h3>
  <p class="!text-sm opacity-80">Generate once, then you're on your own. Templates improve? Too bad.</p>
  <p class="!text-sm opacity-60 mt-3">No path back to the generator.</p>
</div>

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">Architecture Drifts at Scale</span></h3>
  <p class="!text-sm opacity-80">Patterns live in docs. Delivery pressure wins. Drift accumulates.</p>
  <p class="!text-sm opacity-60 mt-3">Every team reinvents the wheel.</p>
</div>

</div>

---
transition: slide-left
---

# What Happens Without Enforcement

<div class="mt-8">

<v-clicks>

- Teams interpret patterns individually
- Architectural consistency depends on people *remembering*
- Pattern drift accumulates silently across services
- Code reviews enforce rules **after** violations have already been written
- Regional teams solve the same structural problems independently

</v-clicks>

</div>

<div class="callout mt-8" v-click>
"We could make progress in isolation -- but not safely and repeatedly."
</div>

---
transition: slide-left
---

# The Question That Started This

<div class="flex flex-col items-center justify-center mt-12">

<blockquote class="!text-2xl !text-center max-w-2xl">
"Why are you still using templates when you have AI?"
</blockquote>

<div v-click class="mt-8 text-center">
<p class="!text-lg opacity-90">Because they're <strong>consistent</strong> and generate in <strong>seconds</strong>.</p>
<p class="!text-lg opacity-90">And the output is <strong>identical every time</strong>.</p>
</div>

<div v-click class="mt-8 card-highlight text-center px-8 py-4">
<p class="!text-base"><span class="gradient-text font-semibold">The real question:</span> How do we use AI <em>and</em> determinism together?</p>
</div>

</div>

---
transition: slide-left
---

# The AI Sandwich

<div class="flex flex-col items-center mt-8 gap-3">

<div class="layer layer-ai w-full max-w-2xl text-center" v-click>
  <p class="!text-xs uppercase tracking-widest opacity-60 mb-1">Layer 1</p>
  <p class="!text-lg font-bold !text-purple-400">AI (Creative)</p>
  <p class="!text-sm opacity-80">Define intent. Draft specs from natural language.</p>
</div>

<div class="text-center opacity-40">&#8595;</div>

<div class="layer layer-determy w-full max-w-2xl text-center" v-click>
  <p class="!text-xs uppercase tracking-widest opacity-60 mb-1">Layer 2</p>
  <p class="!text-lg font-bold !text-blue-400">Determy (Deterministic)</p>
  <p class="!text-sm opacity-80">Same spec &rarr; identical output. Every time.</p>
</div>

<div class="text-center opacity-40">&#8595;</div>

<div class="layer layer-ai w-full max-w-2xl text-center" v-click>
  <p class="!text-xs uppercase tracking-widest opacity-60 mb-1">Layer 3</p>
  <p class="!text-lg font-bold !text-purple-400">AI (Creative)</p>
  <p class="!text-sm opacity-80">Write business logic in safe extension points.</p>
</div>

</div>

<p class="text-center mt-6 opacity-70 !text-sm" v-click>AI handles the creative work. Determy handles the guarantees.</p>

---
transition: slide-left
---

# Four Steps

<div class="grid grid-cols-4 gap-4 mt-12">

<div class="card text-center" v-click>
  <div class="step-number mx-auto mb-3">1</div>
  <p class="!text-base font-bold !text-purple-400">Define</p>
  <p class="!text-xs opacity-60 mt-1">AI</p>
  <p class="!text-sm mt-2 opacity-80">Describe what you need in natural language</p>
</div>

<div class="card text-center" v-click>
  <div class="step-number mx-auto mb-3">2</div>
  <p class="!text-base font-bold !text-blue-400">Validate</p>
  <p class="!text-xs opacity-60 mt-1">Deterministic</p>
  <p class="!text-sm mt-2 opacity-80">Schema validation ensures spec correctness</p>
</div>

<div class="card text-center" v-click>
  <div class="step-number mx-auto mb-3">3</div>
  <p class="!text-base font-bold !text-blue-400">Generate</p>
  <p class="!text-xs opacity-60 mt-1">Deterministic</p>
  <p class="!text-sm mt-2 opacity-80">Same spec produces identical output every time</p>
</div>

<div class="card text-center" v-click>
  <div class="step-number mx-auto mb-3">4</div>
  <p class="!text-base font-bold !text-purple-400">Embellish</p>
  <p class="!text-xs opacity-60 mt-1">AI</p>
  <p class="!text-sm mt-2 opacity-80">Write business logic in protected extension points</p>
</div>

</div>

---
transition: slide-left
---

# ~20 Lines of YAML

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

```yaml
schema: ddd-cqrs/1.0
boundedContext: Workspace
aggregates:
  Workspace:
    attributes:
      workspaceId!: uuid
      name!: string
      status: string = Status
      customAttributes: object
    commands:
      - CreateWorkspace{name!, status}
          -> WorkspaceCreated
      - UpdateWorkspace(workspaceId!){name!}
          -> WorkspaceUpdated
    queries:
      - GetWorkspace(workspaceId!)
          -> Workspace
      - SearchWorkspace(page, size, filters)
          -> PagedList
    entities:
      Party:
        partyId!: uuid
        partyType!: string = PartyType
```

</div>

<div class="flex flex-col justify-center">
  <p class="!text-lg font-semibold mb-4"><span class="gradient-text">This is the entire input.</span></p>
  <div class="space-y-3 !text-sm">
    <p>Define your <strong>bounded context</strong></p>
    <p>Declare <strong>aggregates</strong> and their attributes</p>
    <p>Specify <strong>commands</strong> with their events</p>
    <p>Define <strong>queries</strong> and return types</p>
    <p>Add <strong>entities</strong> as needed</p>
  </div>
  <div class="callout mt-6 !text-sm">
    Readable by humans. Parseable by machines. Versionable in Git.
  </div>
</div>

</div>

---
transition: slide-left
---

# From That Spec, You Get

<div class="grid grid-cols-2 gap-8 mt-6">

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">Generated File Tree</p>

```
workspace-service/
  domain/
    Workspace.kt
    WorkspaceId.kt
    Party.kt
  commands/
    CreateWorkspaceCommand.kt
    CreateWorkspaceHandler.kt
    UpdateWorkspaceCommand.kt
    UpdateWorkspaceHandler.kt
  queries/
    GetWorkspaceQuery.kt
    SearchWorkspaceQuery.kt
  events/
    WorkspaceCreated.kt
    WorkspaceUpdated.kt
  api/
    WorkspaceController.kt
    openapi.yaml
  migrations/
    V1__create_workspace.sql
  tests/
    WorkspaceCommandTests.kt
```

</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">What's Included</p>

<v-clicks>

- **Domain model** -- aggregates, entities, value objects
- **CQRS** -- commands, handlers, queries
- **Events** -- domain events with full payloads
- **API layer** -- controllers, DTOs, mapping
- **OpenAPI spec** -- auto-generated, always in sync
- **Database migrations** -- schema creation scripts
- **Test scaffolding** -- unit tests for command handlers
- **Extension points** -- marked regions for business logic

</v-clicks>
</div>

</div>

---
transition: slide-left
---

# Not Scaffolding. Regeneration.

<div class="mt-6">

<div class="card-highlight text-center py-4 mb-8" v-click>
<p class="!text-lg">Templates improve &rarr; <strong>Regenerate</strong> &rarr; Every service gets the upgrade</p>
</div>

<div class="grid grid-cols-3 gap-6 mt-6">

<div class="card text-center" v-click>
  <p class="!text-3xl mb-2">&#128196;</p>
  <p class="font-bold !text-blue-400">Generated Files</p>
  <p class="!text-sm opacity-80 mt-2">Fully owned by Determy. Regenerated on every run. Never edit these.</p>
</div>

<div class="card text-center" v-click>
  <p class="!text-3xl mb-2">&#9998;</p>
  <p class="font-bold !text-purple-400">Extension Points</p>
  <p class="!text-sm opacity-80 mt-2">Your code goes here. Clearly marked. Never overwritten by the engine.</p>
</div>

<div class="card text-center" v-click>
  <p class="!text-3xl mb-2">&#128221;</p>
  <p class="font-bold !text-cyan-400">Manifest</p>
  <p class="!text-sm opacity-80 mt-2">Tracks what was generated, when, and from which spec version.</p>
</div>

</div>

<p class="text-center mt-8 opacity-70 !text-sm" v-click>Your business logic is <strong>always</strong> safe.</p>

</div>

---
transition: slide-left
---

# One Engine. Five Architecture Types.

<div class="grid grid-cols-5 gap-4 mt-10">

<div class="card text-center" v-click>
  <p class="!text-2xl mb-2">&#127981;</p>
  <p class="font-bold !text-sm !text-purple-400">DDD / CQRS</p>
  <p class="!text-xs opacity-70 mt-2">Aggregates, commands, events, queries</p>
</div>

<div class="card text-center" v-click>
  <p class="!text-2xl mb-2">&#128640;</p>
  <p class="font-bold !text-sm !text-blue-400">REST / CRUD</p>
  <p class="!text-xs opacity-70 mt-2">Resources, endpoints, validation, pagination</p>
</div>

<div class="card text-center" v-click>
  <p class="!text-2xl mb-2">&#9889;</p>
  <p class="font-bold !text-sm !text-cyan-400">Event-Driven</p>
  <p class="!text-xs opacity-70 mt-2">Producers, consumers, schemas, dead letters</p>
</div>

<div class="card text-center" v-click>
  <p class="!text-2xl mb-2">&#127912;</p>
  <p class="font-bold !text-sm !text-green-400">Frontend</p>
  <p class="!text-xs opacity-70 mt-2">Pages, components, state, API client</p>
</div>

<div class="card text-center" v-click>
  <p class="!text-2xl mb-2">&#9881;</p>
  <p class="font-bold !text-sm !text-yellow-400">Infrastructure</p>
  <p class="!text-xs opacity-70 mt-2">Terraform, Helm, CI/CD, monitoring</p>
</div>

</div>

<div class="text-center mt-10" v-click>
  <p class="!text-sm opacity-60">Schemas are <strong>pluggable</strong>. Build your own.</p>
</div>

---
transition: slide-left
---

# Pick Your Schema. Pick Your Stack.

<div class="mt-6">
<p class="!text-sm opacity-60 mb-4">Bundles = Schema + Stack. Each bundle is a set of templates targeting a specific architecture and language.</p>

<div class="grid grid-cols-3 gap-4">

<div class="card" v-click>
  <p class="badge badge-purple mb-2">DDD / CQRS</p>
  <p class="!text-sm font-semibold">Spring Kotlin</p>
  <p class="!text-xs opacity-60 mt-1">Axon Framework, PostgreSQL, OpenAPI</p>
</div>

<div class="card" v-click>
  <p class="badge badge-purple mb-2">DDD / CQRS</p>
  <p class="!text-sm font-semibold">NestJS TypeScript</p>
  <p class="!text-xs opacity-60 mt-1">CQRS module, TypeORM, Swagger</p>
</div>

<div class="card" v-click>
  <p class="badge badge-blue mb-2">REST / CRUD</p>
  <p class="!text-sm font-semibold">Spring Kotlin</p>
  <p class="!text-xs opacity-60 mt-1">JPA, Flyway, OpenAPI</p>
</div>

<div class="card" v-click>
  <p class="badge badge-blue mb-2">REST / CRUD</p>
  <p class="!text-sm font-semibold">FastAPI Python</p>
  <p class="!text-xs opacity-60 mt-1">SQLAlchemy, Pydantic, Alembic</p>
</div>

<div class="card" v-click>
  <p class="badge badge-cyan mb-2">Event-Driven</p>
  <p class="!text-sm font-semibold">Spring Kafka</p>
  <p class="!text-xs opacity-60 mt-1">Avro schemas, dead letters, retry</p>
</div>

<div class="card" v-click>
  <p class="badge badge-green mb-2">Frontend</p>
  <p class="!text-sm font-semibold">React TypeScript</p>
  <p class="!text-xs opacity-60 mt-1">TanStack Query, Zustand, Zod</p>
</div>

</div>

<p class="text-center mt-6 !text-sm opacity-50" v-click>More bundles ship with the marketplace. Or build your own.</p>
</div>

---
transition: slide-left
---

# Why Not Just Use...

<div class="mt-6">

| Capability | Yeoman | Cookiecutter | AI Assistants | **Determy** |
|---|---|---|---|---|
| Schema-driven | No | No | No | **Yes** |
| Deterministic output | Yes | Yes | **No** | **Yes** |
| Regeneration-safe | No | No | No | **Yes** |
| Multi-language | Yes | Python-only | Yes | **Yes** |
| Architecture-aware | No | No | Partial | **Yes** |
| Extension points | No | No | No | **Yes** |
| Maintained | **Deprecated** | Minimal | Active | **Active** |
| AI integration | No | No | Native | **Sandwich** |

</div>

<div class="callout mt-4" v-click>
Determy is the only tool that combines deterministic generation with AI integration and regeneration safety.
</div>

---
transition: slide-left
---

# Proven at Scale

<div class="grid grid-cols-4 gap-6 mt-12">

<div class="stat" v-click>
  <div class="stat-value">3s</div>
  <div class="stat-label">Generation time<br/>per service</div>
</div>

<div class="stat" v-click>
  <div class="stat-value">90%</div>
  <div class="stat-label">Code automated<br/>from spec</div>
</div>

<div class="stat" v-click>
  <div class="stat-value">0</div>
  <div class="stat-label">Architecture drift<br/>across services</div>
</div>

<div class="stat" v-click>
  <div class="stat-value">2d</div>
  <div class="stat-label">Idea to all<br/>services deployed</div>
</div>

</div>

<div class="text-center mt-12" v-click>
  <p class="!text-lg opacity-80">3 jurisdictions &middot; 4+ microservices &middot; 100+ entities &middot; 1000+ endpoints</p>
</div>

---
transition: slide-left
---

# Three Stages

<div class="grid grid-cols-3 gap-6 mt-10">

<div class="card" v-click>
  <p class="badge badge-purple mb-3">Stage 1</p>
  <h3 class="!text-lg font-bold">Starter Kit</h3>
  <p class="!text-sm opacity-80 mt-2">Open-source engine + core bundles. Build community. Prove the model.</p>
  <p class="!text-xs opacity-50 mt-4">Revenue: sponsorships, premium bundles</p>
</div>

<div class="card" v-click>
  <p class="badge badge-blue mb-3">Stage 2</p>
  <h3 class="!text-lg font-bold">Consulting</h3>
  <p class="!text-sm opacity-80 mt-2">Custom schema design + bundle development for enterprise teams.</p>
  <p class="!text-xs opacity-50 mt-4">Revenue: professional services</p>
</div>

<div class="card" v-click>
  <p class="badge badge-cyan mb-3">Stage 3</p>
  <h3 class="!text-lg font-bold">Marketplace</h3>
  <p class="!text-sm opacity-80 mt-2">Community-contributed bundles. Revenue share. Network effects.</p>
  <p class="!text-xs opacity-50 mt-4">Revenue: marketplace commission</p>
</div>

</div>

<p class="text-center mt-8 opacity-60 !text-sm" v-click>Each stage funds the next.</p>

---
transition: slide-left
---

# Why Now

<div class="mt-8 space-y-6">

<div class="card" v-click>
  <p class="!text-base"><strong class="!text-purple-400">AI tools are amplifying architectural drift.</strong></p>
  <p class="!text-sm opacity-80 mt-1">Every team using Copilot or ChatGPT generates structurally different code. The consistency problem is getting worse, not better.</p>
</div>

<div class="card" v-click>
  <p class="!text-base"><strong class="!text-blue-400">Yeoman is effectively dead.</strong></p>
  <p class="!text-sm opacity-80 mt-1">The most widely adopted code generator is deprecated with no successor. The space is open.</p>
</div>

<div class="card" v-click>
  <p class="!text-base"><strong class="!text-cyan-400">The AI Sandwich is a new category.</strong></p>
  <p class="!text-sm opacity-80 mt-1">No existing tool combines deterministic generation with AI for creative work. This isn't incremental -- it's a new approach.</p>
</div>

<div class="card" v-click>
  <p class="!text-base"><strong class="!text-green-400">Enterprise demand is real.</strong></p>
  <p class="!text-sm opacity-80 mt-1">Teams with 50+ microservices spend months on consistency. They're looking for exactly this.</p>
</div>

</div>

---
transition: slide-left
---

# This Isn't Theoretical

<div class="mt-8">

<div class="card-highlight p-6 mb-6">
  <p class="!text-lg font-semibold mb-4"><span class="gradient-text">Built and validated in production</span></p>
  <div class="grid grid-cols-2 gap-4 !text-sm">
    <div>
      <p class="opacity-60 mb-1">Services generated</p>
      <p class="font-bold !text-lg">4+ microservices</p>
    </div>
    <div>
      <p class="opacity-60 mb-1">Entities modeled</p>
      <p class="font-bold !text-lg">100+ domain entities</p>
    </div>
    <div>
      <p class="opacity-60 mb-1">API endpoints</p>
      <p class="font-bold !text-lg">1000+ endpoints</p>
    </div>
    <div>
      <p class="opacity-60 mb-1">Jurisdictions</p>
      <p class="font-bold !text-lg">3 regional deployments</p>
    </div>
  </div>
</div>

<v-clicks>

- Full DDD/CQRS architecture generated from specs
- Regenerated multiple times as templates improved -- zero business logic lost
- Cross-service consistency maintained without manual enforcement
- New developers productive within days, not weeks

</v-clicks>

</div>

---
transition: slide-left
---

# Stage 1 Scope

<div class="grid grid-cols-2 gap-8 mt-6">

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">MVP Deliverables</p>

<v-clicks>

- CLI tool: `determy generate`
- Core engine with schema validation
- DDD/CQRS schema (v1.0)
- REST/CRUD schema (v1.0)
- Spring Kotlin bundle
- Extension point system
- Regeneration manifest
- Documentation site

</v-clicks>
</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">Open Decisions</p>

<v-clicks>

- Spec language: YAML vs. custom DSL?
- AI integration depth for v1
- Bundle packaging format
- Marketplace architecture
- Pricing model for premium bundles
- Community governance model

</v-clicks>
</div>

</div>

<div class="callout mt-6" v-click>
Stage 1 goal: ship the engine, prove the model, build the community.
</div>

---
transition: slide-left
class: text-center
---

<div class="flex flex-col items-center justify-center h-full">
  <div class="gradient-text-lg mb-6">Determy</div>
  <div class="separator"></div>
  <p class="text-xl mt-6 opacity-80">The Trust Layer Between AI and Your Code</p>
  <p class="text-3xl mt-12 opacity-60">Questions?</p>
</div>
