---
theme: default
title: 'FixedCode - Should We Productise This?'
info: 'Internal discussion deck'
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
  <p class="text-xl mt-4 !color-white opacity-90">Should we productise this?</p>
  <p class="text-base mt-6 opacity-50">An honest assessment of what we have, what it's worth, and what it would take to find out.</p>
</div>

---
transition: slide-left
---

# What We've Already Built

<div class="grid grid-cols-2 gap-6 mt-4">

<div>
<div class="card-highlight !py-3 mb-3">
  <p class="!text-sm font-semibold"><span class="gradient-text">Production-validated at example</span></p>
</div>

- ~30 lines of YAML &rarr; a complete service with **every cross-functional requirement built in**
- Auth, audit trails, structured logging, event sourcing, DLQ, policy engine, optimistic locking, migrations, CQRS, tests &mdash; all generated
- Regeneration-safe: templates improve, all services upgrade, hand-written code untouched
- New teams never ask "how do we wire up logging" &mdash; it's already there

</div>

<div>
<div class="grid grid-cols-2 gap-2">
  <div class="card text-center !py-3">
    <p class="font-bold !text-lg !text-purple-400">3s</p>
    <p class="!text-xs opacity-60">generation time</p>
  </div>
  <div class="card text-center !py-3">
    <p class="font-bold !text-lg !text-blue-400">90%</p>
    <p class="!text-xs opacity-60">code automated</p>
  </div>
  <div class="card text-center !py-3">
    <p class="font-bold !text-lg !text-cyan-400">0</p>
    <p class="!text-xs opacity-60">architectural drift</p>
  </div>
  <div class="card text-center !py-3">
    <p class="font-bold !text-lg !text-green-400">2d</p>
    <p class="!text-xs opacity-60">idea to deployed</p>
  </div>
</div>

<div class="card mt-3 !py-3">
  <p class="!text-sm opacity-80">4+ microservices &middot; 100+ entities &middot; 1000+ endpoints &middot; multiple jurisdictions</p>
</div>

</div>

</div>

---
transition: slide-left
---

# The Problem Others Have

<div class="grid grid-cols-3 gap-6 mt-6">

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">CFRs Slow Everyone Down</span></h3>
  <p class="!text-sm opacity-80">Auth, logging, observability, retry logic, DLQ handling, database migrations &mdash; every new service spends weeks wiring these up. Teams block on platform teams for guidance. Each team does it differently.</p>
</div>

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">Guardrails Are Social, Not Structural</span></h3>
  <p class="!text-sm opacity-80">Golden paths live in wikis. CLAUDE.md files are suggestions. Code reviews catch violations after the fact. Nothing enforces standards at generation time.</p>
</div>

<div class="card">
  <h3 class="!text-lg mb-3"><span class="gradient-text">AI Makes It Worse at Scale</span></h3>
  <p class="!text-sm opacity-80">AI tools are fast but inconsistent. 10 teams using Copilot/Claude generate 10 different service structures. Speed without guardrails is just faster drift.</p>
</div>

</div>

<div class="callout mt-6" v-click>
The real cost isn't building services. It's the weeks spent on cross-functional requirements, the coordination overhead, and fixing the drift afterwards.
</div>

---
transition: slide-left
---

# The Core Idea: AI Sandwich

<div class="grid grid-cols-2 gap-8 mt-4">

<div class="flex flex-col items-center gap-1">

<div class="layer layer-ai w-full text-center !py-2 !px-4">
  <p class="!text-sm font-bold !text-purple-400 !mb-0">AI (Creative)</p>
  <p class="!text-xs opacity-80 !mb-0">Developer describes what they need. AI drafts the spec.</p>
</div>

<div class="text-center opacity-40 !text-sm">&#8595;</div>

<div class="layer layer-fixedcode w-full text-center !py-2 !px-4">
  <p class="!text-sm font-bold !text-blue-400 !mb-0">FixedCode (Deterministic)</p>
  <p class="!text-xs opacity-80 !mb-0">Same spec &rarr; identical output. Every time. In seconds.</p>
</div>

<div class="text-center opacity-40 !text-sm">&#8595;</div>

<div class="layer layer-ai w-full text-center !py-2 !px-4">
  <p class="!text-sm font-bold !text-purple-400 !mb-0">AI (Creative)</p>
  <p class="!text-xs opacity-80 !mb-0">Business logic in protected extension points.</p>
</div>

</div>

<div>

```yaml
schema: ddd/1.0
boundedContext: Workspace
aggregates:
  Workspace:
    attributes:
      workspaceId!: uuid
      name!: string
      status: string = Status
    commands:
      - CreateWorkspace{name!, status}
          -> WorkspaceCreated
    queries:
      - GetWorkspace(workspaceId!)
          -> Workspace
    entities:
      Party:
        partyId!: uuid
        partyType!: string = PartyType
```

<p class="!text-xs opacity-60 mt-2">The AI agent calls <code>fixedcode generate</code> directly. No plugins needed &mdash; AI coding agents already know how to use CLIs.</p>

</div>

</div>

---
transition: slide-left
---

# The Review Problem at Scale

<div class="grid grid-cols-2 gap-6 mt-4">

<div>
<p class="!text-sm font-semibold !text-red-400 uppercase tracking-wider mb-3">How AI code gets reviewed today</p>

<div class="card mb-2">
  <p class="!text-xs">1. Write shared specs, CLAUDE.md, coding standards</p>
</div>
<div class="card mb-2">
  <p class="!text-xs">2. AI generates code &mdash; <em>hopefully</em> following the spec</p>
</div>
<div class="card mb-2">
  <p class="!text-xs">3. Deploy review agents to check it did</p>
</div>
<div class="card mb-2">
  <p class="!text-xs">4. Human reviews what agents flagged</p>
</div>
<div class="card mb-2">
  <p class="!text-xs">5. Fix drift, re-review, repeat</p>
</div>

<div class="callout !text-xs mt-2">
Every step is lossy. At 50 services, stuff slips through. The entire pipeline exists to compensate for non-deterministic output.
</div>

</div>

<div>
<p class="!text-sm font-semibold !text-green-400 uppercase tracking-wider mb-3">How FixedCode changes this</p>

<div class="card mb-2">
  <p class="!text-xs">1. Platform team encodes standards into schemas + templates <strong>(reviewed once)</strong></p>
</div>
<div class="card mb-2">
  <p class="!text-xs">2. FixedCode generates structural code &mdash; <strong>identical every time, from reviewed templates</strong></p>
</div>
<div class="card mb-2">
  <p class="!text-xs">3. Developer writes business logic in extension points</p>
</div>
<div class="card-highlight mb-2">
  <p class="!text-xs"><strong class="!text-green-400">4. Review only the extension points</strong> &mdash; the 10% that's actually unique</p>
</div>

<div class="callout !text-xs mt-2">
No review agent needed for auth, logging, events, DLQ. Those are generated from reviewed templates. Known-good by construction.
</div>

</div>

</div>

---
transition: slide-left
---

# Who Would Buy This

<div class="mt-4">

<div class="card-highlight !py-3 mb-4">
  <p class="!text-sm"><span class="gradient-text font-semibold">Platform teams who want to accelerate delivery without sacrificing governance.</span> The value isn't consistency for its own sake &mdash; it's removing weeks of cross-functional work from every new service so teams ship faster without ever touching the platform team.</p>
</div>

<div class="grid grid-cols-2 gap-6">

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">What they get today (without us)</p>

- Weeks per service wiring up auth, logging, events, DLQ, audit, migrations
- Teams blocked waiting for platform guidance on cross-functional requirements
- Each team interprets the golden path differently
- Code reviews catching structural violations after the fact

</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">What they get with FixedCode</p>

- **Every CFR built in from day zero** &mdash; auth, audit, logging, events, DLQ, policy, tests
- **Teams never block on platform** &mdash; the schema encodes the golden path, not a wiki
- **Violations are structurally impossible** &mdash; not caught in review, prevented at generation
- **New starters productive in days** &mdash; clone, generate, run, extend

</div>

</div>

</div>

---
transition: slide-left
---

# What's Defensible

<div class="grid grid-cols-2 gap-6 mt-4">

<div>
<p class="!text-sm font-semibold !text-green-400 uppercase tracking-wider mb-3">Hard to replicate</p>

<div class="card mb-2">
  <p class="!text-sm"><strong>Schema + enrichment knowledge</strong></p>
  <p class="!text-xs opacity-70">Where the regenerate/once/extension-point boundaries belong for DDD services. Learned through production failures over 2-3 years.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong>Production proof</strong></p>
  <p class="!text-xs opacity-70">Evidence that this actually works at scale. Most scaffolding tools never prove this. We have the numbers.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong>The team's expertise</strong></p>
  <p class="!text-xs opacity-70">Understanding *why* certain boundaries exist, not just where. This is tacit knowledge that doesn't transfer via code.</p>
</div>

</div>

<div>
<p class="!text-sm font-semibold !text-red-400 uppercase tracking-wider mb-3">Not defensible</p>

<div class="card mb-2">
  <p class="!text-sm"><strong>The engine itself</strong></p>
  <p class="!text-xs opacity-70">A YAML-to-code template renderer is rebuildable in a quarter by any competent team.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong>The AI Sandwich concept</strong></p>
  <p class="!text-xs opacity-70">It's a pattern, not IP. Anyone can describe it and implement it.</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong>Bundle library (today)</strong></p>
  <p class="!text-xs opacity-70">At 50+ bundles, the ecosystem becomes a moat. At 3 bundles, it's a demo.</p>
</div>

</div>

</div>

---
transition: slide-left
---

# The Real Moat Question

<div class="mt-6">

<div class="card-highlight !py-4 px-6 mb-6">
  <p class="!text-lg text-center"><span class="gradient-text font-semibold">The moat isn't the technology. It's speed to market.</span></p>
  <p class="!text-sm opacity-70 text-center mt-2">If we ship before anyone else connects deterministic generation to AI coding tools, we own the category long enough to build network effects. The window is 12-18 months.</p>
</div>

<div class="grid grid-cols-3 gap-4">

<div class="card" v-click>
  <p class="font-bold !text-sm !text-purple-400">Anthropic / GitHub / JetBrains</p>
  <p class="!text-xs opacity-70 mt-2">Could build this, but it's orthogonal to their core product. More likely to acquire or partner than build.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-blue-400">Backstage / Platform Tools</p>
  <p class="!text-xs opacity-70 mt-2">Closest threat. But they're focused on service catalogues, not regeneration-safe generation. Different problem.</p>
</div>

<div class="card" v-click>
  <p class="font-bold !text-sm !text-cyan-400">Random startup, same idea</p>
  <p class="!text-xs opacity-70 mt-2">Possible, but they'd lack the production-validated schemas. Our head start is 2-3 years of getting the boundaries right.</p>
</div>

</div>

<div class="callout mt-4" v-click>
The risk of <em>not</em> building it: someone else ships a worse version, gets mindshare, and our superior schemas never reach the market.
</div>

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
  <p class="!text-sm"><strong class="!text-purple-400">Open-source the engine</strong> with one schema (DDD) and one bundle (Spring Kotlin)</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-blue-400">CLI that AI agents call directly</strong> &mdash; <code>fixedcode generate</code></p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-cyan-400">Getting-started guide</strong> &mdash; spec to running service in 10 minutes</p>
</div>

</div>

<div>
<p class="!text-sm font-semibold opacity-60 uppercase tracking-wider mb-3">What tells us it's working</p>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-green-400">1 platform engineer outside our org</strong> tries it and finds it useful</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-yellow-400">Someone asks "can I write my own schema?"</strong> &mdash; that's the signal the real product has demand</p>
</div>

<div class="card mb-2">
  <p class="!text-sm"><strong class="!text-purple-400">GitHub traction</strong> &mdash; not vanity stars, but issues, forks, questions about extending it</p>
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

# The Decision

<div class="flex flex-col items-center mt-6">

<div class="grid grid-cols-3 gap-6 w-full max-w-3xl">

<div class="card text-center !py-4" v-click>
  <p class="font-bold !text-green-400 !text-base mb-3">Go</p>
  <p class="!text-sm opacity-80">Open-source it. Run the minimum test. See if anyone cares.</p>
  <p class="!text-xs opacity-50 mt-3">Cost: a few weeks of effort.<br/>Upside: category ownership + acquisition path.</p>
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
<p class="!text-sm"><span class="gradient-text font-semibold">The core question:</span> Can we find one platform engineer outside our org who would use this? If yes, the rest follows. If no, we know before we've invested.</p>
</div>

</div>

---
transition: slide-left
class: text-center
---

<div class="flex flex-col items-center justify-center h-full">
  <div class="gradient-text-lg mb-6">FixedCode</div>
  <div class="separator"></div>
  <p class="text-xl mt-6 opacity-80">Deterministic Code Generation for the AI Era</p>
  <p class="text-base mt-4 opacity-60">The technology is proven. The category is empty. The question is whether we move.</p>
</div>
