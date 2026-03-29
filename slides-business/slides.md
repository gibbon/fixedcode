---
theme: default
title: 'FixedCode - Encode Your Platform, Accelerate Every Team'
info: 'Unified deck - problem, product, market, decision'
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
  <div class="gradient-text-lg mb-4">FixedCode</div>
  <div class="separator"></div>
  <p class="text-xl mt-4 !color-white opacity-90">Smaller Teams. Faster Delivery. Fewer Handoffs.</p>
  <p class="text-base mt-3 opacity-70">AI + deterministic generation replaces the coordination overhead that slows every software org down.</p>
  <p class="text-sm mt-3 opacity-50 tracking-widest uppercase">Capture &middot; Replay &middot; Share &middot; Evolve</p>
</div>

---
transition: slide-left
---

# The Problem

<div class="grid grid-cols-3 gap-6 mt-6">

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">AI Output Is Non-Reproducible</span></h3>
  <p class="!text-sm opacity-80">You vibe-coded a great service structure. Tomorrow the AI gives you something completely different. Same prompt, different output. There's no way to lock in what worked.</p>
</div>

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">Patterns Don't Transfer</span></h3>
  <p class="!text-sm opacity-80">Your colleague built a great service. You want the same structure. Options: copy-paste and modify, or re-prompt and hope. No way to capture and replay a proven pattern.</p>
</div>

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">At Scale It's Chaos</span></h3>
  <p class="!text-sm opacity-80">10 teams, 50 services, 50 different structures. Auth, logging, events &mdash; each team wires these up differently. Review agents and CLAUDE.md files help, but they're suggestions, not guarantees.</p>
</div>

</div>

<div class="callout mt-6" v-click>
Every developer using AI has the first problem. Every team has the second. Every enterprise has the third. Same root cause: AI output isn't capturable or reproducible.
</div>

---
transition: slide-left
---

# The Solution: AI Sandwich

<div class="grid grid-cols-2 gap-8 mt-4">

<div class="flex flex-col items-center gap-1">

<div class="layer layer-ai w-full !py-2 !px-4" v-click>
  <p class="!text-base font-bold !text-purple-400 !mb-1 text-center">AI + Human (Creative)</p>
  <div class="grid grid-cols-2 gap-2">
    <div class="rounded bg-black/20 border border-purple-500/20 !py-1 !px-2">
      <p class="!text-xs font-semibold !text-white !mb-0">Domain Specs</p>
      <p class="!text-xs opacity-60 !mb-0">PM defines <em>what</em>. AI translates to YAML domain specs.</p>
    </div>
    <div class="rounded bg-black/20 border border-purple-500/20 !py-1 !px-2">
      <p class="!text-xs font-semibold !text-white !mb-0">Template Curation</p>
      <p class="!text-xs opacity-60 !mb-0">Dev/platform defines <em>how</em>. AI extracts patterns. Human refines.</p>
    </div>
  </div>
</div>

<div class="text-center opacity-40 !text-sm">&#8595;</div>

<div class="layer layer-fixedcode w-full text-center !py-2 !px-4" v-click>
  <p class="!text-base font-bold !text-blue-400 !mb-0">FixedCode (Deterministic)</p>
  <p class="!text-xs opacity-80 !mb-0">Crystallises AI-generated patterns into reproducible templates. Same spec &rarr; identical output. Every time.</p>
</div>

<div class="text-center opacity-40 !text-sm">&#8595;</div>

<div class="layer layer-ai w-full text-center !py-2 !px-4" v-click>
  <p class="!text-base font-bold !text-purple-400 !mb-0">AI + Human (Creative)</p>
  <p class="!text-xs opacity-80 !mb-0">The custom parts: business rules, domain-specific logic, unique integrations. In clearly marked extension points that regeneration never touches.</p>
</div>

<p class="!text-xs opacity-50 mt-2" v-click>AI creates the patterns. FixedCode locks them in. AI enriches the output. You never re-prompt for the same structure twice.</p>

</div>

<div>
<p class="!text-sm font-semibold opacity-60 mb-3">How it reaches developers</p>

<div class="card mb-3">
  <p class="!text-sm"><strong class="!text-purple-400">AI builds the templates. FixedCode locks them in.</strong></p>
  <p class="!text-xs opacity-70 mt-1">The AI generates code and helps author the templates that encode the patterns. FixedCode crystallises those patterns into deterministic, reproducible generation. You never re-prompt for the same structure twice.</p>
</div>

<div class="card">
  <p class="!text-sm"><strong class="!text-blue-400">The CLI is the product.</strong></p>
  <p class="!text-xs opacity-70 mt-1">AI coding agents already know how to call CLIs. No plugins needed. AI generates the schemas, calls <code>fixedcode generate</code>, then enriches the extension points. The whole workflow is AI-native.</p>
</div>

</div>

</div>

---
transition: slide-left
---

# The End-to-End Pipeline

<div class="mt-4">

<div class="grid grid-cols-5 gap-2">

<div class="card text-center !py-3" v-click>
  <p class="!text-2xl mb-1">&#128172;</p>
  <p class="font-bold !text-xs !text-purple-400">Describe</p>
  <p class="!text-xs opacity-60 mt-1">"I need a order service with lineItems and audit trails"</p>
</div>

<div class="card text-center !py-3" v-click>
  <p class="!text-2xl mb-1">&#128221;</p>
  <p class="font-bold !text-xs !text-purple-400">AI Drafts Spec</p>
  <p class="!text-xs opacity-60 mt-1">~20 lines of YAML conforming to the org's schema</p>
</div>

<div class="card text-center !py-3" v-click>
  <p class="!text-2xl mb-1">&#9881;</p>
  <p class="font-bold !text-xs !text-blue-400">Generate</p>
  <p class="!text-xs opacity-60 mt-1">Push spec &rarr; CI triggers <code>fixedcode generate</code> &rarr; code to service repo</p>
</div>

<div class="card text-center !py-3" v-click>
  <p class="!text-2xl mb-1">&#128640;</p>
  <p class="font-bold !text-xs !text-blue-400">Deploy</p>
  <p class="!text-xs opacity-60 mt-1">Service repo CI/CD deploys automatically</p>
</div>

<div class="card text-center !py-3" v-click>
  <p class="!text-2xl mb-1">&#9998;</p>
  <p class="font-bold !text-xs !text-purple-400">Enrich</p>
  <p class="!text-xs opacity-60 mt-1">Developer fills extension points with business logic</p>
</div>

</div>

<div class="grid grid-cols-2 gap-4 mt-4">

<div class="card !py-2" v-click>
  <p class="!text-xs font-semibold !text-green-400 mb-1">What the developer gets (without touching infrastructure)</p>
  <p class="!text-xs opacity-70">Domain model, command/query separation, API + OpenAPI, persistence + migrations, auth + policy engine, event sourcing with outbox pattern, structured logging, audit trails, integration tests, black-box API tests &mdash; all generated from the spec.</p>
</div>

<div class="card !py-2" v-click>
  <p class="!text-xs font-semibold !text-green-400 mb-1">What the developer reviews</p>
  <p class="!text-xs opacity-70">Only the extension points &mdash; the ~10% that's business logic unique to this service. The 90% structural code is known-good by construction, generated from reviewed templates.</p>
</div>

</div>

<div class="callout !text-xs mt-3" v-click>
This pipeline is running in production today. Push a spec, get a running service with every CFR built in. The spec is the only input.
</div>

</div>

---
transition: slide-left
---

# The Platform Team Workflow

<div class="mt-2">

<p class="!text-sm opacity-60 mb-3">Platform team sets up once. Every developer and AI agent in the org generates from the same standards forever.</p>

<div class="grid grid-cols-3 gap-3">

<div class="card" v-click>
  <p class="font-bold !text-sm !text-purple-400 mb-2">1. Define Standards</p>
  <p class="!text-xs opacity-80">Platform team works with AI to encode their architectural standards into schemas and templates. Auth patterns, logging format, event strategy, test conventions &mdash; all captured.</p>
  <p class="!text-xs opacity-50 mt-2">Iterative. AI does the componentisation, humans refine until production-grade.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-blue-400 mb-2">2. Ship the Pipeline</p>
  <p class="!text-xs opacity-80">Schemas + bundles go into a standards repo. CI integration triggers <code>fixedcode generate</code> on spec changes. Generated code flows to service repos. Existing CI/CD deploys.</p>
  <p class="!text-xs opacity-50 mt-2">Pluggable: ships with GitHub Actions + GitLab CI. Adapters for others.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-green-400 mb-2">3. Evolve</p>
  <p class="!text-xs opacity-80">Platform team improves a template &mdash; better auth, hardened event patterns, new test strategy. Regenerate. Every service across every team gets the upgrade. Extension points untouched.</p>
  <p class="!text-xs opacity-50 mt-2">Platform team shifts from answering questions to improving templates.</p>
</div>

</div>

<div class="callout !text-xs mt-3" v-click>
The platform team never answers "how do I set up logging" again. The schema is the answer. The generated code is the implementation.
</div>

</div>

---
transition: slide-left
---

# Who Does What

<div class="mt-2">

<p class="!text-sm opacity-60 mb-3">Roles shift. Developers manage templates and edge cases. PMs and domain experts define specs and implement business rules with AI.</p>

<div class="grid grid-cols-3 gap-4">

<div class="card" v-click>
  <p class="font-bold !text-sm !text-purple-400 mb-2">Product Manager / Domain Expert</p>
  <p class="!text-xs opacity-80">"We need a compliance domain for NZ with risk assessment and questionnaires"</p>
  <p class="!text-xs opacity-80 mt-1">AI translates to a YAML spec. Schema validates it &mdash; if it conforms, it's valid by construction. No tech lead review needed.</p>
  <p class="!text-xs opacity-80 mt-1">Push spec &rarr; service generated &rarr; PM implements business rules in extension points with AI assistance.</p>
  <p class="!text-xs !text-green-400 mt-2">PM defines <em>what</em> and <em>why</em>. Schema guarantees <em>how</em>.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-blue-400 mb-2">Developer / Engineer</p>
  <p class="!text-xs opacity-80">Curates and evolves the templates. Handles code that doesn't fit the generated output. Manages the schemas, enrichment rules, and extension point boundaries.</p>
  <p class="!text-xs opacity-80 mt-1">Works with AI to refine templates, debug CFR wiring, harden patterns. Improves the platform &mdash; doesn't hand-wire individual services.</p>
  <p class="!text-xs !text-green-400 mt-2">Developer manages the <em>how</em>. Shifts from service builder to platform engineer.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-cyan-400 mb-2">Platform Team</p>
  <p class="!text-xs opacity-80">Owns the schema definitions, the pipeline integration, and the standards repo. Sets the architectural guardrails that every generated service inherits.</p>
  <p class="!text-xs opacity-80 mt-1">Improves a template &rarr; regenerates &rarr; every service across every team upgrades. Reviews template changes, not service code.</p>
  <p class="!text-xs !text-green-400 mt-2">Platform team encodes once. Everyone benefits forever.</p>
</div>

</div>

<div class="callout !text-xs mt-3" v-click>
The spec validates against the schema &mdash; if it conforms, the output is guaranteed correct. No manual review of structural code. PMs can go from requirements to running service with AI assistance. Developers focus on the platform, not individual services.
</div>

</div>

---
transition: slide-left
---

# The AI-Enabled Team

<div class="mt-2">

<div class="grid grid-cols-2 gap-6">

<div>
<p class="!text-xs font-semibold !text-red-400 uppercase tracking-wider mb-2">Traditional team structure</p>

<div class="card !py-2 mb-2">
  <p class="!text-xs opacity-70"><strong>Platform team</strong> writes docs, answers CFR questions all day, reviews service code for compliance</p>
</div>
<div class="card !py-2 mb-2">
  <p class="!text-xs opacity-70"><strong>Developers</strong> hand-wire auth, logging, events into every service. Weeks of infrastructure before any business logic</p>
</div>
<div class="card !py-2 mb-2">
  <p class="!text-xs opacity-70"><strong>PMs</strong> write requirements, throw them over the wall, wait weeks for a service</p>
</div>
<div class="card !py-2">
  <p class="!text-xs opacity-70"><strong>Review</strong> is 100% of every service. Everyone reviews structural code that should be identical but isn't</p>
</div>

</div>

<div>
<p class="!text-xs font-semibold !text-green-400 uppercase tracking-wider mb-2">With FixedCode + AI</p>

<div class="card !py-2 mb-2">
  <p class="!text-xs opacity-70"><strong>Platform team</strong> encodes standards into schemas + templates with AI. Improves the platform. Never answers the same question twice</p>
</div>
<div class="card !py-2 mb-2">
  <p class="!text-xs opacity-70"><strong>Developers</strong> curate templates, handle service-specific code that doesn't fit generation, and evolve the platform. Focus shifts to the hard/unique parts, not the repetitive wiring</p>
</div>
<div class="card !py-2 mb-2">
  <p class="!text-xs opacity-70"><strong>PMs</strong> describe what they need &rarr; AI drafts spec &rarr; push &rarr; running service &rarr; PM implements business rules with AI in extension points</p>
</div>
<div class="card !py-2">
  <p class="!text-xs opacity-70"><strong>Review</strong> is ~10%. Only extension points (business logic). Structural code is known-good. Template changes reviewed once, applied everywhere</p>
</div>

</div>

</div>

<div class="card-highlight !py-3 mt-3" v-click>
  <p class="!text-sm text-center"><span class="gradient-text font-semibold">This isn't a code generator. It's a different way to structure a software org.</span></p>
  <p class="!text-xs text-center opacity-70 mt-1">Fewer handoffs between PMs, devs, and platform. Fewer people needed for the same output. Generation handles the 90% that's structural. Humans focus on the 10% that's unique &mdash; service-specific logic, hard integrations, and the problems that actually need thought. The coordination overhead that slows every org down largely disappears.</p>
</div>

</div>

---
transition: slide-left
---

# The Product Architecture

<div class="mt-2">

<div class="grid grid-cols-3 gap-4">

<div>
<p class="!text-xs font-semibold !text-purple-400 uppercase tracking-wider mb-2">Core Engine (universal)</p>

<div class="card mb-2 !py-2">
  <p class="!text-xs"><code>fixedcode capture</code> &mdash; AI-assisted pattern extraction</p>
</div>
<div class="card mb-2 !py-2">
  <p class="!text-xs"><code>fixedcode generate</code> &mdash; deterministic replay</p>
</div>
<div class="card mb-2 !py-2">
  <p class="!text-xs"><code>fixedcode validate</code> &mdash; spec validation</p>
</div>
<div class="card !py-2">
  <p class="!text-xs">Schema + bundle format, regeneration contract, manifest tracking</p>
</div>

</div>

<div>
<p class="!text-xs font-semibold !text-blue-400 uppercase tracking-wider mb-2">Pipeline Integrations (pluggable)</p>

<div class="card mb-2 !py-2">
  <p class="!text-xs"><strong>Bundled:</strong> GitHub Actions, GitLab CI</p>
</div>
<div class="card mb-2 !py-2">
  <p class="!text-xs"><strong>Generic:</strong> Webhook adapter (covers most CI/CD)</p>
</div>
<div class="card mb-2 !py-2">
  <p class="!text-xs"><strong>Community:</strong> Jenkins, Azure DevOps, Buildkite etc.</p>
</div>
<div class="card !py-2">
  <p class="!text-xs"><strong>Plugin interface:</strong> simple contract &mdash; "here's the code, here's where it goes, here's what to trigger"</p>
</div>

</div>

<div>
<p class="!text-xs font-semibold !text-cyan-400 uppercase tracking-wider mb-2">Org-Specific (customer owns)</p>

<div class="card mb-2 !py-2">
  <p class="!text-xs">Schemas + bundles encoding their standards</p>
</div>
<div class="card mb-2 !py-2">
  <p class="!text-xs">Git repo structure and conventions</p>
</div>
<div class="card mb-2 !py-2">
  <p class="!text-xs">Deployment targets (K8s, ECS, serverless...)</p>
</div>
<div class="card !py-2">
  <p class="!text-xs">Business logic in extension points</p>
</div>

</div>

</div>

<div class="callout !text-xs mt-3" v-click>
Like Terraform providers: the engine is the core, pipeline integrations are pluggable, schemas are org-specific. Community contributes integrations. The shareable layer is the pipeline adapters, not the bundles.
</div>

</div>

---
transition: slide-left
---

# Why Review Agents Aren't Enough

<div class="grid grid-cols-2 gap-6 mt-4">

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">The current AI workflow</p>

<p class="!text-sm opacity-80 mb-3">Teams write shared specs, CLAUDE.md files, coding standards. AI generates code. Review agents check the output. Humans review what the agents flag. Fix, re-review, repeat.</p>

<p class="!text-sm opacity-80"><strong>Every step is lossy.</strong> The spec is a suggestion. The AI interprets it differently each time. The review agent catches <em>some</em> violations. At scale across 50 services, stuff slips through. The entire pipeline exists to compensate for non-deterministic output.</p>

<div class="callout !text-xs mt-3">
This is the quality anxiety companies feel right now: AI is fast, but can you trust it? The review cost is enormous and growing.
</div>

</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">The FixedCode difference</p>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-green-400">Generated code is known-good by construction.</strong></p>
  <p class="!text-xs opacity-70">Auth, logging, events, policy &mdash; generated from templates that were reviewed once. No review agent needed.</p>
</div>

<div class="card-highlight mb-2">
  <p class="!text-sm"><strong class="!text-green-400">Review surface shrinks from 100% to ~10%.</strong></p>
  <p class="!text-xs opacity-70">Only the extension points &mdash; the business logic that's actually unique to this service &mdash; need human review.</p>
</div>

<div class="card">
  <p class="!text-sm"><strong class="!text-green-400">Review effort scales linearly, not exponentially.</strong></p>
  <p class="!text-xs opacity-70">50 services doesn't mean 50x the review burden. The structural code is identical across all of them.</p>
</div>

</div>

</div>

---
transition: slide-left
---

# Proven at Scale

<div class="grid grid-cols-4 gap-6 mt-6">

<div class="stat" v-click>
  <div class="stat-value">~3s</div>
  <div class="stat-label">Generation time<br/>per service</div>
</div>

<div class="stat" v-click>
  <div class="stat-value">90%</div>
  <div class="stat-label">Structural code<br/>automated</div>
</div>

<div class="stat" v-click>
  <div class="stat-value">0</div>
  <div class="stat-label">Architecture drift<br/>across services</div>
</div>

<div class="stat" v-click>
  <div class="stat-value">100%</div>
  <div class="stat-label">CFR compliance<br/>across all services</div>
</div>

</div>

<div class="grid grid-cols-2 gap-6 mt-8">

<div class="card" v-click>
  <p class="!text-sm font-semibold"><span class="gradient-text">Production numbers</span></p>
  <p class="!text-xs opacity-80 mt-2">4+ microservices &middot; 100+ domain entities &middot; 1000+ API endpoints &middot; multiple currencys</p>
</div>

<div class="card" v-click>
  <p class="!text-sm font-semibold"><span class="gradient-text">What this proves</span></p>
  <p class="!text-xs opacity-80 mt-2">Regenerated multiple times as templates improved &mdash; zero business logic lost. New developers productive in days. Cross-service consistency without manual enforcement.</p>
</div>

</div>

---
transition: slide-left
---

# Who Uses This

<div class="grid grid-cols-3 gap-4 mt-4">

<div class="card" v-click>
  <p class="font-bold !text-sm !text-purple-400 mb-2">Individual Developer</p>
  <p class="!text-xs opacity-80">"I vibe-coded a great service. I want to lock in the pattern so next time I generate it in 3 seconds instead of re-prompting."</p>
  <p class="!text-xs opacity-80 mt-2">"My AI output is great today, different tomorrow. I want reproducibility."</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>Entry point.</strong> Free, open-source, works with any AI tool.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-blue-400 mb-2">Team Lead / Tech Lead</p>
  <p class="!text-xs opacity-80">"I want every service my team builds to have the same structure. Auth, logging, events &mdash; consistent, not up to whoever prompted it."</p>
  <p class="!text-xs opacity-80 mt-2">"New devs should generate a service and be productive in a day, not a week."</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>Shared patterns.</strong> Team registry, $50-200/mo.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-cyan-400 mb-2">Platform Team</p>
  <p class="!text-xs opacity-80">"We need every service across 10 teams to have auth, audit, events, policy, logging built in. Violations structurally impossible. Review only extension points."</p>
  <p class="!text-xs opacity-80 mt-2">"We spend all day answering CFR questions. We want to encode once and be done."</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>CFR enforcement.</strong> Enterprise, $1-20k/mo.</p>
</div>

</div>

<div class="callout mt-4" v-click>
Same product at every level. Individual devs discover it solving their own problem. Teams adopt it for consistency. Platform teams adopt it for governance. Each tier grows from the one below.
</div>

---
transition: slide-left
---

# Competitive Landscape

<div class="mt-4">

<div class="grid grid-cols-2 gap-6">

<div>

| Capability | Boilerplate repos | AI memory | Backstage | **FixedCode** |
|---|---|---|---|---|
| Pattern capture | Manual | Partial | No | **AI-assisted** |
| Deterministic replay | Copy-paste | **No** | Yes (day-1) | **Yes** |
| Regeneration-safe | No | No | No | **Yes** |
| Extension points | No | No | No | **Yes** |
| Scales to enterprise | No | No | Partial | **Yes** |

</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">Why nothing else does this</p>

<div class="card mb-2">
  <p class="!text-xs"><strong class="!text-purple-400">Boilerplate repos / create-X-app</strong> &mdash; copy-paste. No capture from AI output. No regeneration. Dead on arrival.</p>
</div>

<div class="card mb-2">
  <p class="!text-xs"><strong class="!text-blue-400">CLAUDE.md / AI memory</strong> &mdash; tries to make AI remember patterns. Still non-deterministic. Output varies. Not capturable or shareable.</p>
</div>

<div class="card mb-2">
  <p class="!text-xs"><strong class="!text-cyan-400">Backstage</strong> &mdash; day-1 templates only. No pattern capture. No regeneration. Enterprise only.</p>
</div>

<div class="card">
  <p class="!text-xs"><strong class="!text-green-400">Review agents</strong> &mdash; compensate for non-deterministic AI output after the fact. FixedCode prevents the problem. Different approach entirely.</p>
</div>

</div>

</div>

</div>

---
transition: slide-left
---

# What We'd Build

<div class="mt-2">

<div class="card-highlight !py-3 mb-3">
  <p class="!text-sm"><span class="gradient-text font-semibold">Target: every developer using AI tools.</span> The problem is universal &mdash; great AI output today, different output tomorrow. The product captures patterns from AI-generated code and makes them deterministically reproducible.</p>
</div>

<div class="grid grid-cols-4 gap-3">

<div class="card" v-click>
  <p class="font-bold !text-sm !text-purple-400 mb-2">Capture</p>
  <p class="!text-xs opacity-80">"I just vibe-coded a great service." AI analyses the output and extracts the structure into a schema + templates. The pattern is captured.</p>
  <p class="!text-xs opacity-50 mt-2"><code>fixedcode capture</code></p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-blue-400 mb-2">Replay</p>
  <p class="!text-xs opacity-80">"Generate me another one exactly like that." Deterministic generation from the captured schema. 3 seconds. Identical structure every time.</p>
  <p class="!text-xs opacity-50 mt-2"><code>fixedcode generate</code></p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-cyan-400 mb-2">Share</p>
  <p class="!text-xs opacity-80">"My whole team should use this pattern." Push schemas and bundles to a registry. Everyone generates the same proven structure.</p>
  <p class="!text-xs opacity-50 mt-2"><code>fixedcode share</code></p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-green-400 mb-2">Evolve</p>
  <p class="!text-xs opacity-80">"We improved the auth setup." Update the template, regenerate. Every service gets the upgrade. Extension points untouched.</p>
  <p class="!text-xs opacity-50 mt-2"><code>fixedcode generate</code></p>
</div>

</div>

<div class="grid grid-cols-2 gap-3 mt-3">

<div class="card !py-2" v-click>
  <p class="!text-xs"><strong class="!text-purple-400">Individual dev wedge:</strong> Open-source CLI. Works with any AI tool. Solves "I can't reproduce that great output." Free, no account needed.</p>
</div>

<div class="card !py-2" v-click>
  <p class="!text-xs"><strong class="!text-blue-400">Team/enterprise upsell:</strong> Private registries, schema governance, audit logs, CFR enforcement. The platform team features layer on top of individual adoption.</p>
</div>

</div>

</div>

---
transition: slide-left
---

# How It Scales Up

<div class="mt-2">

<p class="!text-sm opacity-60 mb-3">Individual dev adoption is the wedge. Each layer unlocks a new revenue tier without changing the core product.</p>

<div class="grid grid-cols-4 gap-3">

<div class="card" v-click>
  <p class="badge badge-purple mb-2">Individual Dev</p>
  <p class="!text-sm font-semibold">Free, open-source</p>
  <p class="!text-xs opacity-80 mt-1">Capture and replay patterns from AI-generated code. Personal use. Local schemas.</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>Goal:</strong> Adoption. Millions of devs using AI have this problem.</p>
</div>

<div class="card" v-click>
  <p class="badge badge-blue mb-2">Team</p>
  <p class="!text-sm font-semibold">Shared registries</p>
  <p class="!text-xs opacity-80 mt-1">Share proven patterns across a team. "This is how we build services here." Schemas become the team's golden path.</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>Revenue:</strong> Hosted registry. $50-200/mo per team.</p>
</div>

<div class="card" v-click>
  <p class="badge badge-cyan mb-2">Platform Team</p>
  <p class="!text-sm font-semibold">CFR enforcement</p>
  <p class="!text-xs opacity-80 mt-1">Encode auth, audit, logging, events, policy into schemas. Every service gets every CFR from day zero. Violations structurally impossible.</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>Revenue:</strong> Enterprise license. $1-5k/mo.</p>
</div>

<div class="card" v-click>
  <p class="badge badge-green mb-2">Regulated Enterprise</p>
  <p class="!text-sm font-semibold">Compliance + audit</p>
  <p class="!text-xs opacity-80 mt-1">Provable compliance for AI-generated code. Manifest tracks what was generated, when, from which audited template. Audit trail for regulators.</p>
  <p class="!text-xs !text-green-400 mt-2"><strong>Revenue:</strong> $5-20k/mo. Finance, health, government.</p>
</div>

</div>

<div class="callout mt-3" v-click>
Same core product at every tier. Individual devs get capture + replay for free. Teams get shared patterns. Platform teams get CFR enforcement. Regulated orgs get compliance. Each layer funds the next.
</div>

</div>

---
transition: slide-left
---

# What Gets Acquired (and What Product That Implies)

<div class="mt-1">

<div class="grid grid-cols-6 gap-2 mb-3">
<div class="card !py-1 text-center">
  <p class="!text-xs"><strong class="!text-purple-400">Astral</strong> &rarr; OpenAI</p>
  <p class="!text-xs opacity-50">Millions of devs</p>
</div>
<div class="card !py-1 text-center">
  <p class="!text-xs"><strong class="!text-blue-400">Promptfoo</strong> &rarr; OpenAI</p>
  <p class="!text-xs opacity-50">130k monthly devs</p>
</div>
<div class="card !py-1 text-center">
  <p class="!text-xs"><strong class="!text-cyan-400">Bun</strong> &rarr; Anthropic</p>
  <p class="!text-xs opacity-50">7M downloads/mo</p>
</div>
<div class="card !py-1 text-center">
  <p class="!text-xs"><strong class="!text-green-400">DX</strong> &rarr; Atlassian</p>
  <p class="!text-xs opacity-50">~$1B, 350+ customers</p>
</div>
<div class="card !py-1 text-center">
  <p class="!text-xs"><strong class="!text-yellow-400">OpenClaw</strong> &rarr; OpenAI</p>
  <p class="!text-xs opacity-50">250k stars, solo dev</p>
</div>
<div class="card !py-1 text-center">
  <p class="!text-xs"><strong class="!text-purple-400">Windsurf</strong> &rarr; Goog/Cog</p>
  <p class="!text-xs opacity-50">$82M ARR, split 3 ways</p>
</div>
</div>

<div class="card-highlight !py-2 mb-3">
  <p class="!text-xs"><span class="gradient-text font-semibold">The pattern:</span> all became <strong>infrastructure individual devs use daily</strong>. Not enterprise sales. Not platform teams. Individual devs choosing to depend on it.</p>
</div>

<div class="grid grid-cols-3 gap-3">

<div class="card !py-2">
  <p class="!text-xs font-semibold !text-purple-400 mb-1">The implied product</p>
  <p class="!text-xs opacity-80">A pattern capture and replay engine. AI generates great code &rarr; FixedCode crystallises the patterns into templates &rarr; regenerate deterministically forever. Never re-prompt for the same structure.</p>
</div>

<div class="card !py-2">
  <p class="!text-xs font-semibold !text-blue-400 mb-1">The pitch to every dev</p>
  <p class="!text-xs opacity-80">Great AI output today, different output tomorrow. Lock it in once, replay it forever. Share proven patterns with your team. AI creates, FixedCode makes it reproducible.</p>
</div>

<div class="card !py-2">
  <p class="!text-xs font-semibold !text-cyan-400 mb-1">Why this gets broad adoption</p>
  <p class="!text-xs opacity-80">Every dev using AI has this problem. Not an enterprise tool &mdash; a personal productivity tool that scales to teams. Enterprise governance is the upsell, not the entry point.</p>
</div>

</div>

</div>

---
transition: slide-left
---

# What's Defensible (and What Isn't)

<div class="grid grid-cols-2 gap-6 mt-4">

<div>
<p class="!text-sm font-semibold !text-green-400 uppercase tracking-wider mb-3">Defensible</p>

<div class="card mb-2">
  <p class="!text-sm"><strong>The capture → replay workflow</strong></p>
  <p class="!text-xs opacity-70">Getting the AI-assisted pattern extraction + deterministic regeneration + extension point boundaries right is hard. We've iterated on this for 2-3 years in production.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong>Production proof at scale</strong></p>
  <p class="!text-xs opacity-70">Evidence this works: 4+ services, 100+ entities, 1000+ endpoints, regenerated multiple times, zero business logic lost. Most dev tools never prove this.</p>
</div>

<div class="card">
  <p class="!text-sm"><strong>Individual dev adoption → team lock-in</strong></p>
  <p class="!text-xs opacity-70">If individual devs adopt, teams standardise on shared schemas. Switching cost increases at each tier. The moat is the adoption funnel, not the technology.</p>
</div>

</div>

<div>
<p class="!text-sm font-semibold !text-red-400 uppercase tracking-wider mb-3">Not defensible</p>

<div class="card mb-2">
  <p class="!text-sm"><strong>The engine itself</strong></p>
  <p class="!text-xs opacity-70">YAML parser + template renderer = rebuildable in a quarter. The generation engine is a feature, not a product.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong>The concept</strong></p>
  <p class="!text-xs opacity-70">"Capture AI patterns and replay them" is describable in one sentence. The value is in execution and adoption, not the idea.</p>
</div>

<div class="card">
  <p class="!text-sm"><strong>AI tools might add this natively</strong></p>
  <p class="!text-xs opacity-70">Cursor/Claude could build "save this pattern" into their product. Speed to adoption is the only defence.</p>
</div>

</div>

</div>

---
transition: slide-left
---

# Risks and Mitigations

<div class="mt-4">

<table>
  <thead><tr><th>Risk</th><th>Likelihood</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr>
      <td class="!text-xs">Individual devs don't see enough value to install another CLI</td>
      <td class="!text-xs"><span class="!text-yellow-400">Medium</span></td>
      <td class="!text-xs">The value has to be obvious in under 5 minutes. "Capture this, replay it" must be faster than re-prompting. If it's not, the UX is wrong.</td>
    </tr>
    <tr>
      <td class="!text-xs">Cursor / Claude add "save this pattern" natively</td>
      <td class="!text-xs"><span class="!text-yellow-400">Medium</span></td>
      <td class="!text-xs">Speed. If we're already the standard tool, native features complement rather than replace. Also: FixedCode works across all AI tools, not locked to one.</td>
    </tr>
    <tr>
      <td class="!text-xs">AI gets consistent enough that replay isn't needed</td>
      <td class="!text-xs"><span class="!text-green-400">Low</span></td>
      <td class="!text-xs">At scale (50+ services), deterministic guarantees will matter for years. Individual dev consistency may improve, but team/enterprise won't.</td>
    </tr>
    <tr>
      <td class="!text-xs">Capture from existing AI output is too hard to build well</td>
      <td class="!text-xs"><span class="!text-yellow-400">Medium</span></td>
      <td class="!text-xs">This is the hardest engineering challenge. AI-assisted extraction helps but the quality of captured schemas determines whether replay is useful.</td>
    </tr>
    <tr>
      <td class="!text-xs">Traction doesn't materialise</td>
      <td class="!text-xs"><span class="!text-yellow-400">Medium</span></td>
      <td class="!text-xs">Validate in weeks: can we get individual devs to capture and replay one pattern? If not, pivot to enterprise-only or stop.</td>
    </tr>
  </tbody>
</table>

</div>

---
transition: slide-left
---

# The Minimum Viable Test

<div class="mt-4">

<p class="!text-sm opacity-60 mb-4">Before committing 6 months, we can validate demand in weeks.</p>

<div class="grid grid-cols-2 gap-6">

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">What to build</p>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-purple-400"><code>fixedcode capture</code></strong> &mdash; AI extracts patterns from an existing service into a schema + templates</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-blue-400"><code>fixedcode generate</code></strong> &mdash; deterministic replay from captured schema. 3 seconds.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-cyan-400">Getting-started guide</strong> &mdash; capture a pattern and replay it in under 5 minutes</p>
</div>

</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">What tells us it's working</p>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-green-400">Individual devs capture and replay</strong> without being told to &mdash; organic adoption</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-yellow-400">Someone shares a schema with their team</strong> &mdash; that's the signal the network effect can work</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-purple-400">GitHub traction</strong> &mdash; not vanity stars, but people publishing their own schemas and bundles</p>
</div>

</div>

</div>

<div class="callout mt-4" v-click>
If nobody outside our org wants to use it after a few weeks, we have our answer before investing further.
</div>

</div>

---
transition: slide-left
---

# The Open Question

<div class="mt-2">

<div class="card-highlight !py-2 px-6 mb-3">
  <p class="!text-base text-center"><span class="gradient-text font-semibold">AI did the componentisation &mdash; but it wasn't one click. Can we productise that workflow?</span></p>
</div>

<div class="grid grid-cols-2 gap-4">

<div>
<p class="!text-xs font-semibold opacity-60 uppercase tracking-wider mb-2">What we actually did</p>

<p class="!text-xs opacity-80">AI built the schemas, templates, enrichment rules, and extension point boundaries. But it took significant refinement and guidance &mdash; iterating on what's structural vs business logic, debugging CFR wiring, getting the boundaries right.</p>

<p class="!text-xs opacity-80 mt-1">The value wasn't "AI generates templates." It was <strong>human expertise guiding AI through many iterations</strong> until the output was production-grade.</p>

</div>

<div>
<p class="!text-xs font-semibold opacity-60 uppercase tracking-wider mb-2">What that means</p>

<div class="card !py-1 mb-2">
  <p class="!text-xs"><strong class="!text-green-400">The workflow is the product.</strong> Human domain knowledge + AI componentisation + iterative refinement + deterministic engine. Not one step &mdash; a guided process.</p>
</div>

<div class="card !py-1 mb-2">
  <p class="!text-xs"><strong class="!text-blue-400">Can others do it without us?</strong> Can a platform team use this workflow to encode <em>their</em> standards? Or does the refinement/guidance require our expertise?</p>
</div>

<div class="card !py-1">
  <p class="!text-xs"><strong class="!text-cyan-400">The experiment:</strong> Give someone the engine + workflow + docs. Can they go from "my best service" to "reusable schema" without us in the room?</p>
</div>

</div>

</div>

<div class="callout !text-xs mt-2" v-click>
If yes: product company. If no: consulting practice. Either is viable &mdash; but the refinement effort is the honest bottleneck.
</div>

</div>

---
transition: slide-left
---

# The Decision

<div class="flex flex-col items-center mt-6">

<div class="grid grid-cols-3 gap-6 w-full max-w-3xl">

<div class="card text-center !py-4" v-click>
  <p class="font-bold !text-green-400 !text-base mb-3">Go</p>
  <p class="!text-sm opacity-80">Build capture + replay. Open-source it. See if devs use it.</p>
  <p class="!text-xs opacity-50 mt-3">Cost: a few weeks of effort.<br/>Upside: adoption funnel + every path opens.</p>
</div>

<div class="card text-center !py-4" v-click>
  <p class="font-bold !text-yellow-400 !text-base mb-3">Slow Go</p>
  <p class="!text-sm opacity-80">Write the methodology paper. Give talks. Gauge interest without shipping product.</p>
  <p class="!text-xs opacity-50 mt-3">Cost: lower. But slower signal<br/>and someone else may ship first.</p>
</div>

<div class="card text-center !py-4" v-click>
  <p class="font-bold !text-red-400 !text-base mb-3">No Go</p>
  <p class="!text-sm opacity-80">Keep it internal. Use the expertise for career leverage and reputation.</p>
  <p class="!text-xs opacity-50 mt-3">Cost: none. But the window<br/>closes without us in it.</p>
</div>

</div>

<div class="card-highlight text-center !py-3 mt-8 max-w-2xl" v-click>
<p class="!text-sm"><span class="gradient-text font-semibold">The core question:</span> Will individual developers capture and replay patterns from their AI output? If yes, teams and enterprises follow. If no, we know in weeks.</p>
</div>

</div>

---
transition: slide-left
class: text-center
---

<div class="flex flex-col items-center justify-center h-full">
  <div class="gradient-text-lg mb-6">FixedCode</div>
  <div class="separator"></div>
  <p class="text-xl mt-6 opacity-80">Smaller Teams. Faster Delivery. Fewer Handoffs.</p>
  <p class="text-base mt-4 opacity-60">The technology is proven. The org change is real. The question is whether we move.</p>
</div>
