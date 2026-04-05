# FixedCode Analysis Documents

This directory contains analysis and planning documents for the FixedCode project - a cleanroom rewrite of gap-cli with a smarter, more maintainable architecture.

---

## Documents Overview

### 1. **complex-bundles-approach.md** ⭐
**Purpose:** Comprehensive analysis and architectural approach for complex bundles

**Contents:**
- Deep dive into gap-cli's enrichment philosophy
- Convention over configuration design
- Proposed context model (100+ fields, fully enriched)
- Convention engines (HTTP, response, auth, lookup, validation)
- Enrichment pipeline architecture
- Implementation phases (4 weeks)
- Testing strategy
- Migration path from gap-cli

**Read this** for the full architectural vision and design rationale.

**Length:** ~1000 lines, comprehensive

---

### 2. **complex-bundles-roadmap.md** ⭐
**Purpose:** Tactical day-by-day implementation plan

**Contents:**
- Week 1: Foundation (context model, convention engines, pipeline)
- Week 2: Templates & testing (rewrite templates, integration tests)
- Week 3: Advanced features (migrations, OpenAPI)
- Week 4: Polish (error handling, docs, composition)
- Daily workflow and tasks
- Code examples for each component
- Success checklist

**Read this** when you're ready to start coding.

**Length:** ~800 lines, very detailed

---

### 3. **complex-bundles-quick-reference.md** ⭐
**Purpose:** Quick reference guide and visual summary

**Contents:**
- The core problem (one paragraph)
- The solution (convention engines)
- Convention rules (tables)
- Architecture diagram (ASCII)
- Implementation phases (summary)
- Key files to create
- Testing strategy
- Success metrics

**Read this** for a quick refresher or to share with others.

**Length:** ~300 lines, concise

---

### 4. **gap-cli-vs-fixedcode-comparison.md** ⭐
**Purpose:** Detailed side-by-side comparison of gap-cli and fixedcode approaches

**Contents:**
- Architecture comparison (visual diagrams)
- Template complexity comparison (code examples)
- Context comparison (gap-cli strategies vs fixedcode values)
- Spec comparison (verbose vs minimal)
- Convention examples (HTTP, auth, response)
- Testing comparison
- Migration path
- Summary table

**Read this** to understand the fundamental differences and improvements.

**Length:** ~500 lines, visual and detailed

---

### 5. **DECISIONS.md** ⭐
**Purpose:** Approved design decisions from discussion

**Contents:**
- Command type overrides (convention with explicit override)
- Shared utilities (composition, no inheritance)
- Bundle categories (DDD first, support all types)
- Pluralization (library with override)
- Type system (custom types and references)
- Validation (Bean Validation + custom)
- Testing (unit, integration, fixtures)
- Documentation (OpenAPI + generators)
- Bundle composition (both monolithic and composable)
- Convention extensibility (global + per-spec)

**Read this** for approved decisions and rationale.

**Length:** ~400 lines, comprehensive

---

### 6. **SHARED-UTILITIES.md** ⭐
**Purpose:** Design for reusable utilities (composition, no inheritance)

**Contents:**
- @fixedcode/naming - naming conventions
- @fixedcode/types - type mappings and validation
- @fixedcode/conventions - convention engine utilities
- Usage examples
- Testing strategy

**Read this** to understand shared code architecture.

**Length:** ~300 lines, detailed

## Reading Order

### If you're new to the project:
1. **SUMMARY.md** - 2 minute overview
2. **complex-bundles-quick-reference.md** - quick reference
3. **DECISIONS.md** - approved design decisions
4. **complex-bundles-approach.md** - deep dive into design
5. **complex-bundles-roadmap.md** - start implementing

### If you're ready to code:
1. **DECISIONS.md** - review approved decisions
2. **SHARED-UTILITIES.md** - understand shared code
3. **complex-bundles-roadmap.md** - follow day-by-day plan
4. **complex-bundles-quick-reference.md** - keep open for reference

### If you need a quick refresher:
1. **complex-bundles-quick-reference.md** - everything in one page

---

## Key Concepts

### The Core Problem
Gap-cli has rich context (100+ fields) but templates still have logic. Why? Because the context provides "strategies" not "ready-to-use values". Templates choose the strategy.

### The Solution
**Convention Engines** that derive everything from minimal spec:
- HTTP Convention Engine: name → method, path, status
- Response Strategy Engine: pattern → return type, status code
- Authorization Engine: pattern → @Authorise annotation
- Lookup Strategy Engine: pattern → entity fetch expression
- Validation Engine: types → constraints

### The Result
Templates become trivial interpolation:
```handlebars
@{{http.method}}Mapping("{{http.path}}")
{{authorization.annotation}}
{{methodSignature}} { ... }
```

No conditionals. No logic. Just rendering pre-computed values.

---

## Architecture Summary

```
Minimal Spec
    ↓
Convention Engines (derive everything)
    ↓
Fully Enriched Context (100+ fields, all pre-computed)
    ↓
Trivial Templates (just interpolation)
    ↓
Generated Code
```

---

## Implementation Status

### ✅ Done (Current State)
- Engine pipeline (parse → validate → resolve → enrich → render → write)
- Bundle system (pluggable, npm-distributed)
- Simple bundles (ddd-basic, crud-api, mcp-wrapper)
- Basic enrichment (naming variants, type mappings)

### 🚧 In Progress (This Plan)
- Complex context model (100+ fields)
- Convention engines (HTTP, response, auth, lookup, validation)
- Enhanced enrichment pipeline
- Simplified templates
- Database migrations
- OpenAPI generation

### 📋 Future
- Bundle composition
- Custom convention engines
- Migration tooling from gap-cli
- Visual bundle designer

---

## Success Criteria

### Minimum Viable Product (Week 2)
- [ ] Context model fully typed
- [ ] Convention engines implemented
- [ ] Templates generate valid Kotlin
- [ ] Generated code compiles

### Production Ready (Week 3)
- [ ] Database migrations generated
- [ ] OpenAPI spec generated
- [ ] Generated service runs
- [ ] Output matches gap-cli

### Complete (Week 4)
- [ ] Error handling polished
- [ ] Documentation complete
- [ ] Migration guide written

---

## Related Documents

### In `/docs/superpowers/specs/`
- **2026-03-30-fixedcode-engine-rewrite-design.md** - Original engine design spec
- **2026-03-28-spec-driven-generator-design.md** - Earlier design thinking

### In `/docs/superpowers/plans/`
- **2026-03-30-fixedcode-engine.md** - Implementation plan for engine

### In `/docs/`
- **business-plan.md** - Business context and vision

---

## Quick Links

- **Gap-CLI source:** `/home/gibbon/projects/gap-cli`
- **FixedCode bundles:** `/home/gibbon/projects/fixedcode/bundles/`
- **Engine source:** `/home/gibbon/projects/fixedcode/engine/`
- **Website:** `/home/gibbon/projects/fixedcode/website/`

---

## Questions?

### "Where do I start?"
Read **complex-bundles-quick-reference.md**, then follow **complex-bundles-roadmap.md** day 1.

### "How do convention engines work?"
See **complex-bundles-approach.md** section "Convention Engines" with code examples.

### "What's the difference from gap-cli?"
Read **gap-cli-vs-fixedcode-comparison.md** for detailed comparison.

### "How do I test enrichment?"
See **complex-bundles-roadmap.md** section "Testing Strategy" with examples.

### "Can I override conventions?"
Yes! See **complex-bundles-approach.md** section "How Much Convention vs Configuration?"

---

## Contributing

When adding new analysis documents:
1. Create the document in this directory
2. Update this README with a summary
3. Link to related documents
4. Add to the reading order

---

**Last Updated:** 2026-04-02  
**Status:** Planning phase for complex bundles  
**Next Action:** Start Week 1 Day 1 - Define context model

---

### 7. **TYPESCRIPT-FIRST-PLAN.md** ⭐
**Purpose:** Simplified 2-3 week plan for TypeScript/Express bundle

**Contents:**
- Why TypeScript first (simpler, faster)
- Simplified scope (monolithic, no composition)
- Week-by-week breakdown
- Day-by-day tasks
- Example spec and generated output
- Success criteria

**Read this** for the actual implementation plan.

**Length:** ~400 lines, tactical

---

## Latest Updates

**2026-04-02:** Added decisions from Q&A session
- Simplified scope: TypeScript/Express first
- Deferred multi-bundle composition
- Focus on deterministic generation only
- 2-3 week timeline instead of 4+

