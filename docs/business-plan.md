# FixedCode Business Plan

## Executive Summary

FixedCode is an end-to-end spec-driven code generation platform. A developer describes a service, AI drafts a YAML spec, the engine generates a complete service with every cross-functional requirement built in, and CI/CD deploys it. Push a spec, get a running service.

It's proven in production at Pexa: a standards repo holds YAML specs. Push a spec → GitHub workflow triggers → GAP CLI generates the code → pushes to the service repo → CI/CD deploys. Developers never touch generated structural code. They review and enrich the 10% that's unique — the business logic in extension points.

The technology works. The question is whether the workflow — from spec to running service — can be packaged as a product that other organisations can adopt with their own CI/CD platforms, git workflows, and deployment targets.

## What We Actually Have

### The Working Pipeline (at Pexa)

```
Developer describes service (natural language)
        ↓
AI drafts YAML spec → push to standards repo
        ↓
GitHub workflow triggers → gap generate
        ↓
Generated code pushed to service repo
        ↓
CI/CD deploys (ArgoCD, GitHub Actions)
        ↓
Running service
```

The spec is the only input. Everything downstream is automated.

### What Gets Generated from a Single Spec

| Layer | What's Generated |
|-------|-----------------|
| Domain | Aggregates, entities, value objects, domain events with payloads |
| Application | CQRS command/query handlers, validators (interface + default impl), transaction boundaries |
| API | REST controllers, DTOs, OpenAPI specs — always in sync |
| Persistence | Repositories, Flyway database migrations, optimistic locking |
| Auth | Policy engine with field-level filtering, authorisation hooks at service boundary |
| Events | Outbox pattern for reliable publishing, Kafka integration, correlation/causation tracking, DLQ with retry |
| Observability | Structured JSON logging with correlation IDs across all layers, metrics, tracing |
| Audit | createdBy, modifiedAt on every entity, full change history |
| Side Effects | Outbox for reliable external calls (Auth0, webhooks), exponential backoff, DLQ |
| Testing | Spring integration tests, black-box API tests from OpenAPI contract, ArchUnit architecture tests |
| Extension Points | Clear interfaces with default implementations — regional services override via `@ConditionalOnMissingBean`, no profiles or flags |

### How Templates Were Built

AI did the componentisation — slicing code into templates, identifying structural vs business logic boundaries, wiring CFRs. But it wasn't one-click. It required significant iterative refinement and human guidance: debugging, resolving CFR wiring issues, getting the extension point boundaries right.

The value wasn't "AI generates templates." It was **human domain expertise guiding AI through many iterations** until the output was production-grade.

### The Regeneration Contract

| File Category | Who Creates | Who Modifies | On Regenerate |
|---------------|------------|--------------|---------------|
| `regenerate` | Engine | Engine only | Overwritten — the engine owns these |
| `once` | Engine | Developer | Skipped — never touched again |
| `extension-point` | Engine creates stub | Developer fills in logic | Stub only if missing |

Templates improve → regenerate → every service gets the upgrade. Extension points are never overwritten.

### Production Results

| Metric | Value |
|--------|-------|
| Generation time | 3 seconds per service |
| Full verification (generate → compile → test) | 2 minutes |
| Structural code automated | 90% |
| Architectural drift across services | 0 |
| New capability → all services deployed | 2 days (vs weeks per service manually) |
| New developer → productive | Days, not weeks |
| Review surface | ~10% (extension points only — structural code is known-good) |

## The Problem We Solve

### For Every Developer Using AI Tools

AI output is non-reproducible. Great service structure today, different one tomorrow. Same prompt, different output. There's no way to lock in what worked and replay it.

### For Teams

Patterns don't transfer. Your colleague built a great service. You want the same structure. Options: copy-paste and modify, or re-prompt and hope. No way to capture a proven pattern and share it.

### For Platform Teams

At scale it's chaos. 10 teams, 50 services, 50 different structures. Auth, logging, events, DLQ — each team wires these up differently. The platform team spends all day answering CFR questions. Review agents and CLAUDE.md files help but they're suggestions, not guarantees. The entire review pipeline exists to compensate for non-deterministic AI output.

### The Review Problem

The current AI workflow: write specs → AI generates → review agents check → humans review → fix drift → repeat. Every step is lossy. At scale, stuff slips through.

FixedCode inverts this: templates are reviewed once, generated code is known-good by construction, humans review only extension points (~10% of the code). Review effort scales linearly, not exponentially.

## The Product

### Core Engine (universal)

- **The engine**: spec → deterministic code generation, with the regeneration contract
- **The schema/bundle format**: how you define architectural patterns as reproducible templates
- **The AI-assisted template authoring workflow**: how AI + human expertise creates production-grade templates
- **The CLI**: `fixedcode capture`, `fixedcode generate`, `fixedcode validate` — what AI agents call

### Pipeline Integrations (pluggable)

Like Terraform providers — the engine is the core, pipeline integrations are pluggable:

- **Bundled**: GitHub Actions workflow, GitLab CI template (the most common platforms)
- **Generic**: Webhook adapter that covers most other CI/CD systems
- **Plugin interface**: a simple contract — "here's the generated code, here's where it goes, here's what to trigger next"
- **Community-contributed**: Jenkins, Azure DevOps, Buildkite etc. This is where a community ecosystem makes sense — not bundles (org-specific) but pipeline adapters (shared infrastructure)

The Pexa pipeline (GitHub Actions → ArgoCD) ships as the reference implementation.

### Org-Specific (customer owns)

- **Bundles/templates** encoding their specific standards (auth patterns, logging format, event strategy)
- **Git repo structure** and conventions
- **Deployment targets** (Kubernetes, ECS, serverless, bare metal...)
- **Business logic** in extension points

### Workflows by Role

**Platform team (set up once):**
1. Work with AI to encode architectural standards into schemas + templates (iterative refinement)
2. Set up the pipeline: standards repo → CI integration → service repos → deployment
3. Choose or write a pipeline adapter (GitHub Actions, GitLab CI, etc.)
4. Ongoing: improve templates, regenerate, every service across every team gets the upgrade

**Developer using AI:**
1. "I need a workspace service with parties and audit trails"
2. AI drafts YAML spec conforming to the org's schema
3. Push spec to standards repo (or AI calls `fixedcode generate` locally)
4. Pipeline generates service with every CFR built in — auth, logging, events, DLQ, tests
5. Developer fills extension points with business logic, assisted by AI
6. Time from idea to running service: minutes, not weeks

**Product manager / non-technical:**
1. "We need a new compliance domain for NZ with risk assessment and questionnaires"
2. AI translates requirements into a domain spec
3. Spec reviewed by tech lead, pushed to repo
4. Complete service generated — API, persistence, events, tests
5. Dev team focuses purely on NZ-specific business rules
6. PM defined *what*. Schema ensured *how*. Nobody hand-wired infrastructure.

### The Core Workflow

**For individual developers (entry point):**
1. **Capture**: AI analyses your best service, extracts patterns into schema + templates (with human refinement)
2. **Replay**: `fixedcode generate` — deterministic output from captured schema, 3 seconds
3. **Share**: Push schemas/bundles to a registry, team-wide consistency
4. **Evolve**: Update template, regenerate, every service upgrades, extension points untouched

**For the full pipeline (what we have at Pexa):**
1. Developer describes service → AI drafts spec
2. Spec pushed to standards repo
3. CI workflow triggers `fixedcode generate`
4. Generated code pushed to service repo
5. Service repo CI/CD deploys
6. Running service — developer fills extension points with business logic

### How It Scales Up

| Tier | What They Get | Revenue |
|------|--------------|---------|
| **Individual dev** | Capture + replay. Personal patterns. Free, open-source. | $0 — adoption funnel |
| **Team** | Shared registry. "This is how we build services here." | $50-200/mo per team |
| **Platform team** | Full CFR enforcement. Every service gets every CFR from day zero. Violations structurally impossible. | $1-5k/mo |
| **Regulated enterprise** | Compliance + audit. Manifest tracks what was generated, when, from which audited template. | $5-20k/mo |

Same core product at every tier. Each layer funds the next.

## The Open Question

**AI did the componentisation — but it required significant human refinement. Can we productise that workflow?**

What we actually did: AI built the schemas, templates, enrichment rules, and extension point boundaries. But it took iterative guidance — debugging CFR wiring, refining structural vs business logic boundaries, getting extension points right. Not one-click. Significant human expertise involved.

What that means:
- **The workflow is the product, not the engine.** Human domain knowledge + AI componentisation + iterative refinement + deterministic engine.
- **The question is whether others can do it without us.** Can a platform team use the same AI-assisted workflow to encode *their* standards? Or does the refinement/guidance require our expertise?
- **The experiment:** Give someone the engine + the AI workflow + documentation. Can they go from "here's my best service" to "here's my reusable schema" without us in the room?

If yes: product company. If no: consulting practice. Either is viable — but the refinement effort is the honest bottleneck.

## Competitive Landscape

| Approach | What It Does | What It Doesn't Do |
|----------|-------------|-------------------|
| Boilerplate repos / create-X-app | Copy-paste starting point | No capture from AI output. No regeneration. Dead on arrival. |
| CLAUDE.md / AI memory | Tries to make AI remember patterns | Still non-deterministic. Output varies. Not capturable or shareable. |
| Backstage | Day-1 templates, service catalogue | No pattern capture. No regeneration. Enterprise only. |
| Review agents (CodeRabbit, Codium) | Post-hoc checks on AI output | Compensates for non-determinism after the fact. Lossy at scale. |
| **FixedCode** | Capture → replay → share → evolve | AI builds templates, engine locks them in, pipeline deploys. Pre-hoc guarantees, not post-hoc checks. |

Nobody else combines: AI-assisted pattern capture + deterministic generation + regeneration safety + end-to-end pipeline.

## What Gets Acquired (Context)

Recent AI tooling acquisitions: Astral → OpenAI (millions of devs), Promptfoo → OpenAI (130k monthly devs), Bun → Anthropic (7M downloads/mo), DX → Atlassian (~$1B, 350+ enterprise customers), OpenClaw → OpenAI (250k GitHub stars, solo dev).

**The pattern:** all became infrastructure individual developers use daily. Not enterprise sales. Individual devs choosing to depend on it.

**What that implies for FixedCode:** the generation engine alone is too niche. The product that gets broad adoption is pattern capture and replay — "lock in your best AI output, replay it forever." Individual dev entry point, team/enterprise upsell.

**Acquisition is only realistic with significant adoption.** No traction = no acquisition. The path: open-source → individual dev adoption → teams standardise → strategic value to an acquirer.

## Realistic Paths

**1. Open source + consulting** — ship the engine, use it to land consulting engagements where you help platform teams encode their standards. Revenue: $200-500k/yr ceiling. A good practice, not a product company.

**2. Open source for leverage** — ship the engine + methodology. Career capital, speaking, reputation. No direct revenue but positions you as the experts in this space.

**3. Build the individual dev product** — `fixedcode capture` + `fixedcode generate` as an open-source CLI. Solve the universal problem (AI output isn't reproducible). Free for individuals, paid for teams/enterprise. This is the path that could lead to significant adoption and potentially acquisition — but capture is the hardest engineering problem and the product is unvalidated.

All three start the same way: ship the engine and see what happens.

## What We'd Build First

**The pipeline-agnostic product:**

1. **The engine** — spec → deterministic generation. Already exists.
2. **`fixedcode capture`** — AI-assisted pattern extraction from existing code. The hardest and most valuable part.
3. **`fixedcode generate`** — deterministic replay. Already exists.
4. **Reference pipeline** — the Pexa GitHub Actions workflow as a documented example. Not the product, but shows what's possible.
5. **Pipeline adapters** — lightweight examples for GitHub Actions, GitLab CI, and one other platform. Shows the engine is CI/CD-agnostic.
6. **Getting-started guide** — capture a pattern and replay it in under 5 minutes.

**What we explicitly don't build:**
- A hosted CI/CD service (every org has their own)
- A deployment platform (not our problem)
- A public bundle marketplace (bundles are org-specific)

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Individual devs don't see enough value to install another CLI | Medium | Value must be obvious in under 5 minutes. If capture → replay isn't faster than re-prompting, the UX is wrong. |
| Cursor / Claude add "save this pattern" natively | Medium | Speed to adoption. Also: FixedCode works across all AI tools, not locked to one. |
| Capture from existing AI output is too hard to build well | Medium | This is the entire product bet. Quality of captured schemas determines everything. |
| Every org's CI/CD is different — integration is painful | Medium | Stay pipeline-agnostic. Provide reference implementations, not a hosted service. The engine generates code; what happens after is the org's CI/CD. |
| The AI-assisted template workflow can't be self-service | Medium | Test early: can someone go from "my best service" to "reusable schema" without us? If not, it's consulting. |

## The Decision

Two questions:

**1. Is the individual dev capture/replay problem real enough to build for?**

Test: will developers capture and replay patterns from their AI output? If yes, teams and enterprises follow. If no, we know in weeks.

**2. Can the template authoring workflow be self-service?**

Test: give someone the engine + workflow + docs. Can they go from "here's my best service" to "reusable schema" without us in the room? This determines whether it's a product or a consulting practice.

Both can be tested cheaply before committing to the full build.
