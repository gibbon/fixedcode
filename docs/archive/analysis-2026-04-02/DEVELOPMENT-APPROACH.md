# Development Approach - Using Subagents

**Goal:** Build the TypeScript DDD bundle efficiently using AI agents

---

## Recommended Approach: Iterative with Subagents

### Strategy: Test-Driven Development with AI

```
You (Architect) → Planning Agent → Execution Agent → Test → Iterate
```

**Your role:** Make decisions, review code, test integration  
**Planning agent:** Break down tasks, design interfaces  
**Execution agent:** Write code, tests, documentation

---

## Phase 1: Shared Utilities (Week 1 Day 1)

### Task 1: @fixedcode/naming Package

**You do:**
1. Create directory structure
2. Review the plan (TYPESCRIPT-FIRST-PLAN.md Day 1)
3. Decide on any open questions

**Planning agent:**
```
"Create a plan for implementing @fixedcode/naming package with:
- toPascalCase, toCamelCase, toSnakeCase, toKebabCase functions
- pluralize function using pluralize library
- generateNamingVariants function
- Full test coverage
- TypeScript with strict mode
Follow the design in SHARED-UTILITIES.md"
```

**Execution agent:**
```
"Implement the plan for @fixedcode/naming:
1. Create package.json with dependencies
2. Implement naming functions in src/index.ts
3. Write tests in test/naming.test.ts
4. Ensure 80%+ test coverage
Use minimal code, no verbose implementations"
```

**You verify:**
```bash
cd packages/naming
npm install
npm test
# Check coverage, review code
```

---

### Task 2: @fixedcode/types Package

**Same pattern:**
1. Planning agent: Create plan
2. Execution agent: Implement
3. You: Verify tests pass

---

### Task 3: @fixedcode/conventions Package

**Same pattern**

---

## Phase 2: Bundle Structure (Week 1 Day 2)

### Task: Create Bundle Skeleton

**Planning agent:**
```
"Create a plan for the bundle structure:
- Define TypeScript interfaces for Context (from SHARED-UTILITIES.md)
- Create JSON Schema for spec validation
- Set up bundle manifest
- Set up test infrastructure
Reference TYPESCRIPT-FIRST-PLAN.md Day 2"
```

**Execution agent:**
```
"Implement the bundle structure:
1. Create bundles/ddd-express/src/types.ts with Context interfaces
2. Create bundles/ddd-express/src/schema.json
3. Create bundles/ddd-express/src/index.ts (bundle export)
4. Set up vitest for testing
Minimal code only"
```

---

## Phase 3: Enrichment Pipeline (Week 1 Day 3-4)

### Approach: One Function at a Time

**Task 3.1: Parse Aggregates**

**Planning agent:**
```
"Plan the parseAggregates function that:
- Takes raw spec YAML
- Returns typed Aggregate objects
- Validates required fields
Include test cases"
```

**Execution agent:**
```
"Implement parseAggregates with tests"
```

**Task 3.2: Enrich Commands**

**Planning agent:**
```
"Plan enrichCommand function that:
- Uses @fixedcode/naming for naming variants
- Uses @fixedcode/conventions for HTTP metadata
- Handles commandType overrides
- Returns CommandContext
Reference DECISIONS.md for conventions"
```

**Execution agent:**
```
"Implement enrichCommand with tests"
```

**Repeat for:** enrichQuery, enrichEvent, resolveImports

---

## Phase 4: Templates (Week 1 Day 5 - Week 2 Day 7)

### Approach: One Template at a Time

**Task 4.1: Controller Template**

**You do:**
1. Create example of what you want generated
2. Show it to planning agent

**Planning agent:**
```
"Create a plan for the controller template that generates:
[paste your example]

Use Handlebars, reference the enriched context from types.ts"
```

**Execution agent:**
```
"Implement the controller template in templates/src/routes/{{names.pluralKebab}}.ts.hbs"
```

**You verify:**
```bash
# Generate from test spec
npm run generate test-spec.yaml
# Check generated code compiles
cd build/test-service
npm install
npm run build
```

**Repeat for:** Service, Model, Repository, App templates

---

## Workflow Pattern

### For Each Task:

```
1. YOU: Review plan, make decisions
   ↓
2. PLANNING AGENT: Create detailed plan
   ↓
3. YOU: Approve plan or request changes
   ↓
4. EXECUTION AGENT: Implement with tests
   ↓
5. YOU: Run tests, verify output
   ↓
6. If issues: Back to step 2 with feedback
   If good: Next task
```

---

## Agent Prompts

### Planning Agent Prompt Template

```
I need a plan for [TASK].

Context:
- We're building a TypeScript DDD bundle for FixedCode
- Reference documents: [TYPESCRIPT-FIRST-PLAN.md, DECISIONS.md, etc.]
- Current phase: [Week X Day Y]

Requirements:
[Specific requirements]

Create a detailed implementation plan with:
1. Function signatures / interfaces
2. Key logic / algorithms
3. Test cases
4. Dependencies on other components

Keep it minimal - only what's necessary.
```

### Execution Agent Prompt Template

```
Implement the following plan:

[Paste plan from planning agent]

Requirements:
- Write minimal code (no verbose implementations)
- Include comprehensive tests
- Use TypeScript strict mode
- Follow existing code style

Files to create/modify:
[List files]
```

---

## When to Use Subagents

### ✅ Good for Subagents:
- Implementing well-defined functions
- Writing tests
- Creating templates (with clear examples)
- Generating documentation
- Refactoring code

### ❌ Not Good for Subagents:
- Making architectural decisions
- Choosing between approaches
- Integrating complex systems
- Debugging integration issues

**You should:** Make decisions, review, integrate, test end-to-end

---

## Testing Strategy

### Unit Tests (Subagent)
```
"Write unit tests for [function] that cover:
- Happy path
- Edge cases
- Error cases
Aim for 80%+ coverage"
```

### Integration Tests (You)
```bash
# Generate full service
npm run generate examples/order-service.yaml

# Test it works
cd build/order-service
npm install
npm test
npm start

# Test API
curl http://localhost:3000/orders
```

---

## Iteration Strategy

### Week 1: Vertical Slice
Build one complete flow end-to-end:
- Shared utilities
- Enrichment for one command
- One template (controller)
- Generate and test

**Goal:** Prove the architecture works

### Week 2: Horizontal Expansion
Add more features:
- All templates
- OpenAPI generation
- Validation
- Unit tests

**Goal:** Complete feature set

### Week 3: Polish
- Error handling
- Documentation
- Examples
- Bug fixes

**Goal:** Production ready

---

## Communication Pattern

### Daily Standup (with yourself)
1. What did agents complete yesterday?
2. What are agents working on today?
3. What blockers need your decision?

### Code Review Checklist
- [ ] Tests pass
- [ ] Code is minimal (no over-engineering)
- [ ] Follows TypeScript conventions
- [ ] Matches the plan
- [ ] Integrates with existing code

---

## Example Session

### You:
```
"I want to implement @fixedcode/naming package.
Reference: SHARED-UTILITIES.md and TYPESCRIPT-FIRST-PLAN.md Day 1.
Create a plan."
```

### Planning Agent:
```
[Creates detailed plan with function signatures, test cases, etc.]
```

### You:
```
"Looks good. One change: pluralize should cache results for performance.
Update the plan."
```

### Planning Agent:
```
[Updates plan with caching]
```

### You:
```
"Approved. Implement this plan."
```

### Execution Agent:
```
[Implements code with tests]
```

### You:
```bash
cd packages/naming
npm test
# All pass ✅
git add .
git commit -m "feat: implement @fixedcode/naming package"
```

---

## Parallel Work

You can have multiple agents working in parallel:

**Agent 1:** Implement @fixedcode/naming  
**Agent 2:** Implement @fixedcode/types  
**Agent 3:** Implement @fixedcode/conventions

Then you integrate and test together.

---

## Git Strategy

### Branch per Task
```bash
git checkout -b feat/naming-package
# Agent implements
git commit -m "feat: implement naming package"
git checkout main
git merge feat/naming-package
```

### Commit Messages
```
feat: implement naming package
test: add tests for naming utilities
docs: document naming conventions
fix: handle edge case in pluralize
```

---

## Recommended Tools

### For You:
- **Terminal:** Run tests, verify output
- **Editor:** Review code, make small tweaks
- **Git:** Manage branches, commits

### For Agents:
- **Planning agent:** Create plans, design interfaces
- **Execution agent:** Write code, tests, docs
- **Review agent:** Check code quality (optional)

---

## Success Metrics

### After Each Task:
- [ ] Tests pass
- [ ] Code compiles
- [ ] Minimal implementation (no over-engineering)
- [ ] Matches the plan

### After Each Week:
- [ ] Vertical slice works (Week 1)
- [ ] All features implemented (Week 2)
- [ ] Production ready (Week 3)

---

## Next Steps

1. **Start with Day 1 Task 1:** @fixedcode/naming package
2. **Use planning agent** to create detailed plan
3. **Use execution agent** to implement
4. **You verify** tests pass and code works
5. **Iterate** through remaining tasks

---

## Questions?

- **"Should I review every line of code?"** - No, trust tests. Review interfaces and integration points.
- **"What if agent makes mistakes?"** - Tests will catch them. Fix and iterate.
- **"Can agents work on multiple tasks?"** - Yes, but integrate one at a time to avoid conflicts.
- **"How much should I code myself?"** - Integration, debugging, and decisions. Let agents handle implementation.

---

Ready to start! Begin with:

```
"Create a plan for implementing @fixedcode/naming package.
Reference: SHARED-UTILITIES.md
Include: toPascalCase, toCamelCase, toSnakeCase, toKebabCase, pluralize, generateNamingVariants
Requirements: TypeScript, tests, minimal code"
```
