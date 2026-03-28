# Determy Marketing Materials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a promotional Next.js website and a Slidev slide deck for Determy -- a spec-driven code generation engine -- to prove the concept to stakeholders.

**Architecture:** Two independent deliverables in the same repo. The website is a single-page Next.js app with Tailwind CSS, dark theme, gradient accents (purple/blue/cyan, Supabase-style). The slide deck is a Slidev presentation with matching dark theme. Both use the same messaging and content from the product design spec at `docs/superpowers/specs/2026-03-28-spec-driven-generator-design.md`.

**Tech Stack:**
- Website: Next.js 14 (App Router), Tailwind CSS 3, TypeScript, Framer Motion for animations
- Slides: Slidev, custom dark theme with gradient accents

---

## File Structure

### Website (`website/`)

```
website/
├── package.json
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Main page composing all sections
│   └── globals.css             # Tailwind base + custom gradient styles
├── components/
│   ├── Hero.tsx                # Hero section with animated terminal
│   ├── Problem.tsx             # Three pain points
│   ├── AISandwich.tsx          # Core concept diagram
│   ├── HowItWorks.tsx          # Four-step workflow with code
│   ├── SchemaTypes.tsx         # Five schema type cards
│   ├── BeforeAfter.tsx         # Comparison + stats
│   ├── Bundles.tsx             # Bundle ecosystem grid
│   ├── CodeExample.tsx         # Full YAML spec + output preview
│   ├── Footer.tsx              # Logo, links, tagline
│   ├── Navbar.tsx              # Top nav with logo
│   ├── GradientText.tsx        # Reusable gradient text component
│   └── Terminal.tsx            # Animated terminal component
└── public/
    └── determy-logo.svg        # Simple SVG logo
```

### Slides (`slides/`)

```
slides/
├── package.json
├── slides.md                   # All slides in Slidev markdown format
└── styles/
    └── theme.css               # Custom dark theme with gradients
```

---

## Track A: Website

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `website/package.json` (via create-next-app)
- Create: `website/tailwind.config.ts`
- Create: `website/app/layout.tsx`
- Create: `website/app/globals.css`

- [ ] **Step 1: Create Next.js app with Tailwind**

```bash
cd /home/gibbon/projects/gap-cli
npx create-next-app@latest website --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full scaffold.

- [ ] **Step 2: Install Framer Motion**

```bash
cd /home/gibbon/projects/gap-cli/website
npm install framer-motion
```

- [ ] **Step 3: Verify it runs**

```bash
cd /home/gibbon/projects/gap-cli/website
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/gibbon/projects/gap-cli
git init
git add website/
git commit -m "feat: scaffold Next.js website for Determy marketing site"
```

---

### Task 2: Global Styles and Layout

**Files:**
- Modify: `website/app/globals.css`
- Modify: `website/app/layout.tsx`
- Modify: `website/tailwind.config.ts`

- [ ] **Step 1: Set up dark theme with gradient utilities in tailwind.config.ts**

Add custom colors and extend theme:
```typescript
// In tailwind.config.ts, add to theme.extend:
colors: {
  determy: {
    bg: '#0a0a0a',
    surface: '#111111',
    border: '#1a1a2e',
    purple: '#a855f7',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    text: '#e2e8f0',
    muted: '#94a3b8',
  }
}
```

- [ ] **Step 2: Replace globals.css with dark theme base styles**

Set body to dark background (#0a0a0a), define gradient utility classes for text and backgrounds (purple -> blue -> cyan). Define `.gradient-text` class using `background-clip: text`. Add smooth scroll behavior.

- [ ] **Step 3: Update layout.tsx**

Set Inter + JetBrains Mono fonts (from next/font/google). Set metadata title to "Determy - The Trust Layer Between AI and Your Code". Set dark background on html/body.

- [ ] **Step 4: Verify build**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add website/app/globals.css website/app/layout.tsx website/tailwind.config.ts
git commit -m "feat: dark theme, gradient utilities, font setup"
```

---

### Task 3: Reusable Components (Navbar, GradientText, Terminal, Footer)

**Files:**
- Create: `website/components/Navbar.tsx`
- Create: `website/components/GradientText.tsx`
- Create: `website/components/Terminal.tsx`
- Create: `website/components/Footer.tsx`

- [ ] **Step 1: Create GradientText component**

A `<span>` with the gradient text effect (purple -> blue -> cyan). Props: `children`, optional `className`. Uses `bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent`.

- [ ] **Step 2: Create Navbar component**

Fixed top nav, transparent background with backdrop blur. Left: "Determy" logo text in gradient. Right: "GitHub" and "Get Started" button links (placeholder hrefs). Minimal, not cluttered.

- [ ] **Step 3: Create Terminal component**

A styled terminal window with title bar (three dots), dark background (#111). Props: `lines: string[]`, `title?: string`. Renders lines sequentially. Uses JetBrains Mono. Green/cyan text for commands, white for output, muted for comments. Include a typing animation effect using framer-motion -- lines appear one at a time with a slight delay.

- [ ] **Step 4: Create Footer component**

Simple footer. "Determy" gradient text, tagline "Built for the AI era. Not by it.", links row (GitHub, Docs, Slides -- all placeholder `#`). Copyright line.

- [ ] **Step 5: Verify build**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add website/components/
git commit -m "feat: reusable components - Navbar, GradientText, Terminal, Footer"
```

---

### Task 4: Hero Section

**Files:**
- Create: `website/components/Hero.tsx`

- [ ] **Step 1: Build Hero component**

Full viewport height section. Content:
- Large headline: "The trust layer between" (white) + "AI and your code" (gradient text)
- Subheadline: "Spec-driven. Deterministic. Regeneration-safe. A modern code generator built for the AI era."
- Two CTA buttons: "Get Started" (gradient bg, white text) and "View Slides" (outline, gradient border)
- Below: Terminal component showing the workflow:
  ```
  $ determy init --schema ddd-cqrs
  $ determy generate --spec workspace.yaml --bundle spring-kotlin
  ✓ Generated 47 files in 2.3s
  ✓ 0 hand-written files modified
  $ determy generate --spec workspace.yaml --bundle spring-kotlin
  ✓ Regenerated 42 files, skipped 5 extension points
  ```

Centered layout. Fade-in animation on load using framer-motion.

- [ ] **Step 2: Verify build**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add website/components/Hero.tsx
git commit -m "feat: Hero section with animated terminal"
```

---

### Task 5: Problem and AI Sandwich Sections

**Files:**
- Create: `website/components/Problem.tsx`
- Create: `website/components/AISandwich.tsx`

- [ ] **Step 1: Build Problem component**

Three-column grid (stacks on mobile). Each card has:
- Gradient-accented top border (purple, blue, cyan respectively)
- Icon area (emoji or simple SVG)
- Title + description

Cards:
1. "AI Tools Are Inconsistent" -- "Two developers, same prompt, different output. No structural guarantees. No auditability."
2. "Scaffolding Is Fire-and-Forget" -- "Generate once, then you're on your own. No regeneration. No upgrade path."
3. "Architecture Drifts at Scale" -- "Patterns live in docs and tribal knowledge. Delivery pressure always wins. Drift accumulates silently."

Dark card backgrounds (#111), subtle border (#1a1a2e).

- [ ] **Step 2: Build AISandwich component**

The core concept visualization. Three horizontal blocks stacked vertically with gradient connectors between them:

1. Top block (gradient purple bg): "AI" -- "Define intent from natural language. Draft specs, explore requirements." Tagged: "Creative & Flexible"
2. Middle block (solid dark, gradient border): "Determy" -- "Deterministic generation. Same spec → identical output. Every time. In seconds." Tagged: "Consistent & Auditable"
3. Bottom block (gradient cyan bg): "AI" -- "Embellish with business logic. Write domain-specific code in safe extension points." Tagged: "Creative & Flexible"

Section title: "The AI Sandwich" with subtitle "AI handles the creative work. Determy handles the guarantees."

Use framer-motion for scroll-triggered fade-in of each block.

- [ ] **Step 3: Verify build**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add website/components/Problem.tsx website/components/AISandwich.tsx
git commit -m "feat: Problem and AI Sandwich sections"
```

---

### Task 6: How It Works and Schema Types Sections

**Files:**
- Create: `website/components/HowItWorks.tsx`
- Create: `website/components/SchemaTypes.tsx`

- [ ] **Step 1: Build HowItWorks component**

Four-step horizontal flow (vertical on mobile). Each step has:
- Step number in gradient circle
- Title
- Badge: "AI-assisted" (purple) or "Deterministic" (cyan)
- Code snippet below

Steps:
1. "Define" (AI-assisted) -- YAML spec snippet (5-6 lines from DDD/CQRS example)
2. "Validate" (Deterministic) -- `determy validate --spec workspace.yaml` with checkmark output
3. "Generate" (Deterministic) -- `determy generate --spec workspace.yaml --bundle spring-kotlin` with file count output
4. "Embellish" (AI-assisted) -- Kotlin code snippet showing a regional validator override

Connecting lines/arrows between steps with gradient.

- [ ] **Step 2: Build SchemaTypes component**

Section title: "One Engine. Five Architecture Types."

Grid of 5 cards (3+2 or responsive). Each card:
- Icon (emoji or simple)
- Schema name
- One-liner description
- 2-3 bullet points of what it generates
- "Coming soon" badge on Event-Driven, Frontend, Infrastructure

Cards:
1. DDD/CQRS -- "Event-driven microservices with full CQRS" -- aggregates, commands, events
2. REST/CRUD -- "Standard API services with relationships" -- resources, endpoints, validation
3. Event-Driven -- "Producers, consumers, and event contracts" -- topics, handlers, DLQ
4. Frontend -- "Pages, components, and data sources" -- routes, forms, auth
5. Infrastructure -- "Service catalog to deployment configs" -- Terraform, Helm, scaling

- [ ] **Step 3: Verify build**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add website/components/HowItWorks.tsx website/components/SchemaTypes.tsx
git commit -m "feat: How It Works and Schema Types sections"
```

---

### Task 7: Before/After, Bundles, and Code Example Sections

**Files:**
- Create: `website/components/BeforeAfter.tsx`
- Create: `website/components/Bundles.tsx`
- Create: `website/components/CodeExample.tsx`

- [ ] **Step 1: Build BeforeAfter component**

Two-column comparison with stats bar below.

Left column (red/orange tint): "Without Determy"
- Teams interpret patterns individually
- Architecture drifts silently
- Every service solves the same problems differently
- Code reviews enforce rules after violations

Right column (green/cyan tint): "With Determy"
- Architecture encoded once, generated everywhere
- Templates improve → every service gets the upgrade
- Teams focus on business logic, not wiring
- Violations are structurally impossible

Stats bar below (4 stats in a row, large gradient numbers):
- "3s" -- Generation time
- "90%" -- Structural code automated
- "0" -- Architectural drift
- "1 change" -- Propagates everywhere

- [ ] **Step 2: Build Bundles component**

Section title: "Pluggable Stack Bundles"
Subtitle: "Pick your schema. Pick your stack. Generate."

Grid of bundle cards (6 cards, 3x2). Each card shows:
- Schema type badge (e.g. "DDD/CQRS")
- Stack name (e.g. "Spring Boot + Kotlin")
- File count hint (e.g. "~47 files generated")

Bundles:
1. DDD/CQRS + Spring Kotlin
2. DDD/CQRS + Go gRPC
3. REST/CRUD + Express TypeScript
4. REST/CRUD + FastAPI Python
5. Event-Driven + Node.js
6. Infrastructure + Terraform

Some marked "Coming soon".

- [ ] **Step 3: Build CodeExample component**

Full-width section with two panels side by side (stacked on mobile):

Left panel: "Your Spec" -- YAML code block showing a full DDD/CQRS workspace spec (~20 lines). Syntax highlighted.

Right panel: "Generated Output" -- File tree showing what gets generated:
```
gap-workspace-core/
├── api/
│   └── WorkspaceController.kt
├── application/
│   ├── WorkspaceCommandService.kt
│   ├── WorkspaceQueryService.kt
│   └── WorkspaceValidator.kt
├── domain/
│   ├── Workspace.kt
│   └── WorkspaceBusinessService.kt
├── infrastructure/
│   ├── WorkspaceRepository.kt
│   └── db/migration/
│       └── V1__create_workspace.sql
└── extensions/
    └── WorkspaceValidator.kt  ← you write this
```

Below: tagline "~20 lines of YAML. Thousands of lines of production code. Every time."

- [ ] **Step 4: Verify build**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add website/components/BeforeAfter.tsx website/components/Bundles.tsx website/components/CodeExample.tsx
git commit -m "feat: BeforeAfter, Bundles, and CodeExample sections"
```

---

### Task 8: Compose Page and Final Polish

**Files:**
- Modify: `website/app/page.tsx`
- Create: `website/public/determy-logo.svg`

- [ ] **Step 1: Create simple SVG logo**

A minimal SVG logo for Determy. Simple geometric mark (e.g. angled brackets with a diamond/spec shape) in gradient purple->cyan. Keep it simple -- this is a placeholder.

- [ ] **Step 2: Compose all sections in page.tsx**

Import and arrange all section components in order:
1. Navbar
2. Hero
3. Problem
4. AISandwich
5. HowItWorks
6. SchemaTypes
7. CodeExample
8. BeforeAfter
9. Bundles
10. Footer

Add `id` attributes to each section for potential nav scrolling. Add spacing between sections (py-24 or similar).

- [ ] **Step 3: Build and verify**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add website/app/page.tsx website/public/
git commit -m "feat: compose full marketing page with all sections"
```

---

## Track B: Slidev Slide Deck

### Task 9: Scaffold Slidev Project

**Files:**
- Create: `slides/package.json`
- Create: `slides/slides.md`
- Create: `slides/styles/theme.css`

- [ ] **Step 1: Create slides directory and initialize**

```bash
cd /home/gibbon/projects/gap-cli
mkdir -p slides/styles
cd slides
npm init -y
npm install @slidev/cli @slidev/theme-default
```

- [ ] **Step 2: Create package.json scripts**

Add to package.json:
```json
{
  "scripts": {
    "dev": "slidev",
    "build": "slidev build",
    "export": "slidev export"
  }
}
```

- [ ] **Step 3: Create custom theme CSS**

Create `slides/styles/theme.css` with:
- Dark background (#0a0a0a)
- Gradient text utility (purple -> blue -> cyan)
- Code block styling (dark surface, cyan/green text)
- Custom heading styles (large, bold, white)
- Accent colors matching website
- Card styling for content blocks

- [ ] **Step 4: Commit**

```bash
cd /home/gibbon/projects/gap-cli
git add slides/
git commit -m "feat: scaffold Slidev project with dark theme"
```

---

### Task 10: Write All Slides

**Files:**
- Modify: `slides/slides.md`

- [ ] **Step 1: Write slides 1-6 (setup and problem)**

Slide 1 -- Title:
- "Determy"
- "The Trust Layer Between AI and Your Code"
- Subtitle: "Spec-driven. Deterministic. Regeneration-safe."

Slide 2 -- The Problem:
- "AI coding tools are inconsistent"
- "Traditional scaffolding is fire-and-forget"
- "Architecture drifts at scale"
- Three-column layout

Slide 3 -- The Cost:
- "What happens without enforcement"
- Bullet points: pattern drift, duplicated effort, delivery pressure wins, code reviews enforce rules *after* violations
- "We could make progress in isolation -- but not safely and repeatedly."

Slide 4 -- The Insight:
- Quote style: "Why are you still using templates when you have AI?"
- Answer: "Because they're consistent and generate in seconds instead of minutes. And the output is identical every time."
- "This is the wrong question. The right question is: how do we use AI *and* determinism together?"

Slide 5 -- The AI Sandwich:
- Three-layer diagram:
  - AI (Creative) → Spec authoring from natural language
  - Determy (Deterministic) → Structural code generation
  - AI (Creative) → Business logic embellishment
- "AI handles the creative work. Determy handles the guarantees."

Slide 6 -- How It Works:
- Four steps: Define → Validate → Generate → Embellish
- Steps 1 & 4: "AI-assisted"
- Steps 2 & 3: "Deterministic"
- Flow diagram style

- [ ] **Step 2: Write slides 7-12 (product details)**

Slide 7 -- The Spec:
- Show a ~15-line YAML DDD/CQRS spec
- Title: "~20 Lines of YAML"
- Code block with syntax highlighting

Slide 8 -- What Gets Generated:
- File tree output
- "Domain model, API layer, persistence, tests, migrations, OpenAPI specs"
- "All from a single spec. In seconds."

Slide 9 -- Regeneration (the killer feature):
- "Templates improve → regenerate → every service gets the upgrade"
- Three-part flow: Generated Code (engine owns) / Extension Points (you own) / Manifest (tracks the contract)
- "Your hand-written business logic is never touched."
- "This is what makes Determy more than scaffolding."

Slide 10 -- Five Schema Types:
- Grid showing: DDD/CQRS, REST/CRUD, Event-Driven, Frontend, Infrastructure
- One line each
- "One engine. Five architecture types. Unlimited stacks."

Slide 11 -- Bundle Ecosystem:
- "Pick your schema. Pick your stack."
- Example bundles: Spring Kotlin, Express TS, FastAPI Python, Go gRPC, Terraform
- "Community-driven. Version-independent. Pluggable."

Slide 12 -- vs The Alternatives:
- Table comparing Yeoman, Cookiecutter, AI Assistants, Determy
- Columns: Regeneration, Schema system, AI era, Ecosystem
- Determy is the only one with all four checkmarks

- [ ] **Step 3: Write slides 13-18 (proof and business)**

Slide 13 -- The Numbers (proven at scale):
- Large stats: "3 seconds" generation, "90%" automated, "0" drift, "2 days" idea to all services
- "Proven across 3 jurisdictions, 4+ microservices, 100+ domain entities, 1000+ generated API endpoints"

Slide 14 -- Commercial Model:
- Three stages:
  - Stage 1: Starter Kit (engine + schemas + bundles)
  - Stage 2: Consulting (custom specs, templates, training)
  - Stage 3: Marketplace (community bundles, enterprise packs)
- "Each stage funds the next."

Slide 15 -- Market Timing:
- "Enterprises adopting AI coding tools are about to hit the drift wall"
- "The bigger they scale AI-assisted coding, the worse consistency gets"
- "Determy is the trust layer they'll need"
- "No one else occupies this space"

Slide 16 -- Prior Art:
- "This isn't theoretical. It's been running in production."
- Stats from the real GAP deployment (without naming Pexa)
- "New starters productive within a week"
- "Idea to all services: 2 days vs weeks per service manually"

Slide 17 -- What's Next:
- MVP scope: Engine + 2 schemas + 3 bundles
- Open decisions: engine language, product name, distribution
- "Stage 1 is buildable now."

Slide 18 -- Discussion:
- "Determy"
- "The trust layer between AI and your code"
- "Questions?"

- [ ] **Step 4: Verify slides build**

```bash
cd /home/gibbon/projects/gap-cli/slides && npx slidev build
```

- [ ] **Step 5: Commit**

```bash
cd /home/gibbon/projects/gap-cli
git add slides/slides.md
git commit -m "feat: complete 18-slide Determy presentation"
```

---

## Final Verification

### Task 11: End-to-End Build Check

- [ ] **Step 1: Build website**

```bash
cd /home/gibbon/projects/gap-cli/website && npm run build
```

Expected: Successful build, no errors.

- [ ] **Step 2: Build slides**

```bash
cd /home/gibbon/projects/gap-cli/slides && npx slidev build
```

Expected: Successful build, no errors.

- [ ] **Step 3: Final commit**

```bash
cd /home/gibbon/projects/gap-cli
git add -A
git commit -m "feat: Determy marketing materials - website and slide deck complete"
```
