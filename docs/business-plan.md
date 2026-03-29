# FixedCode Business Plan

## Executive Summary

FixedCode isn't a code generator. It's a different way to structure a software org.

AI + deterministic generation replaces the coordination overhead that slows every software org down: the weeks on cross-functional requirements, the handoffs between PMs, developers, and platform teams, the review burden on code that should be identical but isn't. Smaller teams, faster delivery, fewer handoffs.

A PM creates a Jira ticket or Slack message describing what they need. An AI agent picks it up, translates it to a YAML domain spec, pushes it to a standards repo. CI triggers FixedCode to generate a complete service — auth, audit, logging, events, tests, everything — and deploys it. The PM fills in business logic in extension points with AI assistance. They never touch infrastructure. They never wait for a developer to wire up CFRs.

It's proven in production at Pexa across AU, NZ, and UK jurisdictions. The pipeline exists today: push a spec, get a running service. 4+ microservices, 100+ domain entities, 1000+ API endpoints. 90% of structural code is generated. Review surface is ~10% (extension points only).

The question is whether this workflow can be packaged as a product for other organisations — with their own CI/CD, git workflows, ticketing systems, and deployment targets.

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
| Application | Command/query handlers, validators (interface + default impl), transaction boundaries |
| API | REST controllers, DTOs, OpenAPI specs — always in sync |
| Persistence | Repositories, Flyway database migrations, optimistic locking |
| Auth | Policy engine with field-level filtering, authorisation hooks at service boundary |
| Events | Outbox pattern for reliable publishing, Kafka integration, correlation/causation tracking, dead letter handling |
| Observability | Structured JSON logging with correlation IDs across all layers, metrics, tracing |
| Audit | createdBy, modifiedAt on every entity, full change history |
| Side Effects | Outbox for reliable external calls (Auth0, webhooks), exponential backoff, retry |
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

### Input Adapters (how requests get in)

The PM or developer shouldn't have to leave their workflow. We ship adapters for common entry points:

- **Slack bot** — PM types in a channel, agent picks it up, drafts spec, drives the conversation
- **Jira webhook** — ticket created → agent translates to spec, comments back with questions/previews
- **CLI / AI agent** — developer prompts Claude Code/Cursor directly, agent calls `fixedcode generate`
- **Git push** — manually push a YAML spec, CI picks it up (simplest path)
- **MCP** — remote agent triggers the full pipeline programmatically

Each adapter is pluggable. We ship Slack + Jira + GitHub. Others can be community-contributed or custom-built.

### Pipeline Adapters (how generation connects to CI/CD)

Every org has their own CI/CD. We ship adapters for the common ones:

- **Bundled**: GitHub Actions workflow, GitLab CI template
- **Generic**: Webhook adapter that covers most other systems
- **Plugin interface**: simple contract — "here's the generated code, here's the target repo, here's what to trigger next"
- **Community-contributed**: Jenkins, Azure DevOps, Buildkite etc.

The Pexa pipeline (GitHub Actions → ArgoCD) ships as the reference implementation.

### What We Provide vs What They Own

**We provide:**
- FixedCode engine (CLI binary, runs anywhere)
- Input adapters (Slack bot, Jira webhook, CLI handler)
- Pipeline adapters (GitHub Actions, GitLab CI, webhook)
- Starter schemas + bundles (reference implementations, not used in production)
- AI workflow guides (how to author schemas and templates with AI)

**They own:**
- Their schemas + bundles encoding their standards
- Their standards repo (git, source of truth)
- Their CI/CD pipeline and deployment infrastructure
- Their business logic in extension points
- Their service-specific code that doesn't fit templates

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
4. Pipeline generates service with every CFR built in — auth, logging, events, tests
5. Developer fills extension points with business logic, assisted by AI
6. Time from idea to running service: minutes, not weeks

**Product manager / domain expert:**
1. Creates a Jira ticket or Slack message: "We need a new compliance domain for NZ with risk assessment and questionnaires"
2. AI agent picks up the request, translates plain English to YAML domain spec
3. Schema validates the spec — if it conforms, it's correct by construction. No tech lead review gate.
4. Pipeline generates complete service — API, persistence, events, tests, all CFRs
5. PM implements NZ-specific business rules in extension points, assisted by AI
6. Agent updates the Jira ticket with service URL and which extension points need attention
7. PM wrote English. AI wrote YAML. Schema guaranteed correctness. Nobody hand-wired infrastructure.

### The Design Phase Loop (critical product requirement)

The pipeline (spec → generate → deploy) assumes the schemas and templates already exist and the spec is correct. In reality, there are two iterative loops that happen before and during the pipeline:

**Loop 1: Schema/Template Design (platform team)**

This is the upfront work where the platform team encodes their standards:

1. Point AI at your best existing service
2. AI extracts patterns into draft schemas + templates
3. Generate from the draft, check the output
4. Output is wrong — refine templates with AI, regenerate, check again
5. Repeat 10-50 times until output is production-grade
6. Get extension point boundaries right
7. Validate all CFRs are wired correctly
8. Test that regeneration doesn't break existing extension points

This is the hardest part and took significant iteration at Pexa. Productising this loop requires:
- Fast generate → diff → iterate cycle
- AI-assisted template refinement ("this output is wrong because X, fix the template")
- CFR validation tooling (did the generated output actually wire up auth/logging/events correctly?)
- Preview mode — generate without committing, compare against expectations

**Loop 2: Conversational Spec Refinement (PM/developer ↔ agent)**

When a PM creates a Jira ticket or Slack message, the spec may not be right first time. The agent needs to have a conversation:

1. PM creates request: "need a compliance service for NZ"
2. Agent drafts spec, but schema validation fails → agent comments back: "this requires a bounded context name — what domain does this belong to?"
3. PM replies in the same thread/ticket
4. Agent updates spec, runs validation again
5. Agent shows preview: "here's what would be generated — look right?"
6. PM confirms or requests changes
7. Agent generates and pushes

The conversation happens **wherever the request started** — Jira comments, Slack thread, CLI prompt. The agent maintains context across iterations. This is conversational spec refinement — not one-shot translation.

Both loops are product features that need building. Loop 1 determines whether the product is self-service or consulting. Loop 2 determines whether PMs can actually use the system without developers.

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

## Target Market

### Who this is for

**Mid-market regulated companies (500-5000 engineers):** Banks, fintechs, insurers, health, government. They have 50+ services, growing fast, can't hire enough platform engineers. Regulatory requirements for audit, compliance, and consistency aren't optional. Platform teams of 2-10 people who are already the bottleneck.

**Fast-scaling companies:** Went from 5 to 50 services and skipped the "build a platform team" phase. Drowning in inconsistency. AI making it worse. Need guardrails but don't have the headcount to build internal tooling.

**In Australia specifically:** The entire financial services ecosystem. Big four banks (CBA, NAB, ANZ, Westpac) have stretched platform teams. Fintechs (Airwallex, Zeller, Judo Bank) are scaling fast without mature platform tooling. Insurers (IAG, Suncorp), super funds digitising. All have microservices, regulatory obligations, and are adopting AI coding tools without governance.

### Who this is NOT for

**FAANG / Big Tech:** Google, Meta, Amazon already built this internally with dedicated platform teams of 50-100+. Hundreds of millions invested. They don't need an external tool.

**Small startups (<10 engineers):** Don't have the consistency problem yet. One team, a few services. AI output is "close enough."

**Teams without microservices:** Monoliths don't have cross-service consistency problems. The value prop requires multiple services with shared architectural patterns.

### The positioning

FAANG spent hundreds of millions building this capability internally. FixedCode makes it accessible to everyone else.

## The Org Transformation

This isn't a code generator. It's a different way to structure a software org:

- **PMs ship directly.** They write requirements in plain English, AI translates, pipeline generates. They implement business rules with AI assistance. No waiting for developers to wire up infrastructure.
- **Developers shift to platform engineering.** They curate templates, handle service-specific code that doesn't fit generation, evolve the platform. They don't hand-wire individual services.
- **Platform teams encode once.** Standards go into schemas. Templates encode every CFR. The platform team improves the system, not answers repeat questions.
- **Review shrinks to 10%.** Generated code is known-good. Only extension points need human review. 50 services doesn't mean 50x the review burden.
- **Fewer handoffs.** PM → developer → platform → review → fix → re-review becomes PM → push → deployed service. The coordination overhead that slows every org down largely disappears.

The technology enables the org change. The org change is the value.

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

**The full product:**

1. **The engine** — spec → deterministic generation. Already exists.
2. **`fixedcode capture`** — AI-assisted pattern extraction from existing code. The hardest and most valuable part.
3. **`fixedcode generate`** — deterministic replay. Already exists.
4. **Input adapters** — Slack bot, Jira webhook listener. Agent picks up requests, drives conversational spec refinement, pushes validated specs.
5. **Pipeline adapters** — GitHub Actions workflow, GitLab CI template, generic webhook. Plugin interface for custom CI/CD.
6. **Reference pipeline** — the Pexa GitHub Actions → ArgoCD workflow as a documented, working example.
7. **AI workflow guides** — how to author schemas and templates with AI. The methodology, documented.
8. **Getting-started guide** — from request to running service, end to end.

**What we explicitly don't build:**
- A hosted CI/CD service (every org has their own)
- A deployment platform (not our problem)
- A public bundle marketplace (bundles are org-specific)
- A ticketing system (we integrate with theirs)

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
