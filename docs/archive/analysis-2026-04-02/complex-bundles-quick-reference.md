# Complex Bundles - Quick Reference

## The Core Problem

Gap-cli has **100+ enriched fields** per aggregate, but templates still contain conditional logic. 

**Your Goal:** Push ALL logic into `enrich()` so templates become trivial interpolation.

---

## The Solution: Convention Engines

```
Minimal Spec → Convention Engines → Fully Enriched Context → Trivial Templates
```

### Input (Minimal Spec)
```yaml
commands:
  - name: CreateOrder
    params: [name, status]
    emits: OrderCreated
```

### Convention Engines Derive
- **HTTP:** POST /orders, 201 status
- **Response:** returns entity
- **Auth:** @Authorise(action=CREATE, resource="Order")
- **Lookup:** not required
- **Validation:** name and status required

### Output (Enriched Context)
```json
{
  "name": "CreateOrder",
  "http": {
    "method": "POST",
    "path": "/orders",
    "statusCode": 201
  },
  "response": {
    "type": "entity",
    "returnType": "Order"
  },
  "authorization": {
    "annotation": "@Authorise(action = Action.CREATE, resource = \"Order\")"
  },
  "methodSignature": "fun createOrder(name: String, status: String): Order"
}
```

### Template (Trivial)
```handlebars
@{{http.method}}Mapping("{{http.path}}")
{{authorization.annotation}}
{{methodSignature}} {
    val result = commandService.{{names.camel}}({{#each params}}{{name}}{{/each}})
    return ResponseEntity.status({{http.statusCode}}).body(result)
}
```

---

## Convention Rules

### HTTP Conventions

| Command Pattern | Method | Path | Status |
|----------------|--------|------|--------|
| Create* | POST | /resources | 201 |
| Update*(id) | PUT | /resources/{id} | 200 |
| Delete*(id) | DELETE | /resources/{id} | 204 |
| Archive*(id) | PUT | /resources/{id}/archive | 200 |

| Query Pattern | Method | Path | Returns |
|--------------|--------|------|---------|
| Get*(id) | GET | /resources/{id} | single |
| Search*, List* | GET | /resources | list |

### Authorization Conventions

| Pattern | Action | ID Required |
|---------|--------|-------------|
| Create* | CREATE | No |
| Update* | UPDATE | Yes (#id) |
| Delete* | DELETE | Yes (#id) |
| Get* | READ | Yes (#id) |
| Search* | READ | No |

### Response Conventions

| Pattern | Returns | Status |
|---------|---------|--------|
| Create* | entity | 201 |
| Update* | entity | 200 |
| Delete* | void | 204 |
| Get* | single | 200 |
| Search* | list | 200 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Spec (YAML)                          │
│  aggregates:                                                │
│    Order:                                                   │
│      commands:                                              │
│        - name: CreateOrder                                  │
│          params: [name, status]                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Enrichment Pipeline                       │
│                                                             │
│  parseAggregates                                            │
│       ↓                                                     │
│  normalizeNames (pascal, camel, snake, kebab, plural)       │
│       ↓                                                     │
│  resolveTypes (uuid → UUID, string → String)                │
│       ↓                                                     │
│  enrichCommands                                             │
│    ├─ HTTP Convention Engine                               │
│    ├─ Response Strategy Engine                             │
│    ├─ Authorization Engine                                 │
│    ├─ Lookup Strategy Engine                               │
│    └─ Validation Engine                                    │
│       ↓                                                     │
│  enrichQueries                                              │
│    ├─ HTTP Convention Engine                               │
│    ├─ Response Strategy Engine                             │
│    └─ Authorization Engine                                 │
│       ↓                                                     │
│  resolveImports (scan context, generate import list)        │
│       ↓                                                     │
│  generateMethodSignatures                                   │
│       ↓                                                     │
│  generateRepositoryCalls                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Enriched Context (JSON)                    │
│  {                                                          │
│    aggregates: [{                                           │
│      name: "Order",                                         │
│      commands: [{                                           │
│        http: { method: "POST", path: "/orders" },           │
│        authorization: { annotation: "@Authorise(...)" },    │
│        methodSignature: "fun createOrder(...): Order"       │
│      }]                                                     │
│    }]                                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Templates (Handlebars)                     │
│  @{{http.method}}Mapping("{{http.path}}")                   │
│  {{authorization.annotation}}                               │
│  {{methodSignature}} { ... }                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Generated Code (Kotlin)                    │
│  @POSTMapping("/orders")                                    │
│  @Authorise(action = Action.CREATE, resource = "Order")     │
│  fun createOrder(name: String, status: String): Order {     │
│      val result = commandService.createOrder(name, status)  │
│      return ResponseEntity.status(201).body(result)         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Week 1: Foundation
- **Day 1-2:** Define TypeScript context interfaces
- **Day 3-4:** Build convention engines (HTTP, response, auth, lookup)
- **Day 5:** Compose into enrichment pipeline

### Week 2: Templates & Testing
- **Day 6-7:** Rewrite templates using enriched context
- **Day 8-9:** Integration tests (full pipeline, Kotlin compilation)
- **Day 10:** Refinement and bug fixes

### Week 3: Advanced Features
- **Day 11-12:** Database migration generation
- **Day 13-14:** OpenAPI spec generation

### Week 4: Polish
- **Day 15-16:** Error handling and validation
- **Day 17-18:** Documentation
- **Day 19-20:** Bundle composition (optional)

---

## Key Files to Create

```
bundles/ddd-complex/
├── src/
│   ├── types.ts                    # Context interfaces
│   ├── conventions/
│   │   ├── http.ts                 # HTTP convention engine
│   │   ├── response.ts             # Response strategy engine
│   │   ├── authorization.ts        # Auth engine
│   │   ├── lookup.ts               # Lookup strategy engine
│   │   └── validation.ts           # Validation engine
│   ├── enrich/
│   │   ├── index.ts                # Pipeline composition
│   │   ├── parse.ts                # Parse aggregates
│   │   ├── names.ts                # Naming variants
│   │   ├── types.ts                # Type mapping
│   │   ├── commands.ts             # Command enrichment
│   │   ├── queries.ts              # Query enrichment
│   │   └── imports.ts              # Import resolution
│   ├── migrations/
│   │   └── generator.ts            # SQL generation
│   └── openapi/
│       └── generator.ts            # OpenAPI generation
├── templates/
│   └── {{#each aggregates}}/
│       ├── api/
│       │   └── {{names.pascal}}Controller.kt.hbs
│       ├── application/
│       │   ├── {{names.pascal}}CommandService.kt.hbs
│       │   └── {{names.pascal}}QueryService.kt.hbs
│       ├── domain/
│       │   ├── {{names.pascal}}.kt.hbs
│       │   └── {{names.pascal}}Events.kt.hbs
│       └── infrastructure/
│           └── {{names.pascal}}Repository.kt.hbs
└── test/
    ├── conventions/                # Convention engine tests
    ├── enrich/                     # Enrichment tests
    └── integration/                # Full pipeline tests
```

---

## Testing Strategy

### 1. Convention Engine Tests (Unit)
```typescript
it('derives POST /orders with 201 for CreateOrder', () => {
  const result = deriveHttpMetadata({ name: 'CreateOrder', ... });
  expect(result.method).toBe('POST');
  expect(result.statusCode).toBe(201);
});
```

### 2. Enrichment Tests (Integration)
```typescript
it('enriches CreateOrder command fully', () => {
  const context = enrich(spec);
  const cmd = context.aggregates[0].commands[0];
  expect(cmd.http.method).toBe('POST');
  expect(cmd.authorization.action).toBe('CREATE');
  expect(cmd.methodSignature).toContain('createOrder');
});
```

### 3. Template Tests (Snapshot)
```typescript
it('generates correct controller', () => {
  const output = render('Controller.kt.hbs', context);
  expect(output).toMatchSnapshot();
});
```

### 4. Compilation Tests (E2E)
```typescript
it('generated code compiles', async () => {
  await generate(spec, './build');
  const result = await exec('kotlinc ./build/**/*.kt');
  expect(result.exitCode).toBe(0);
});
```

---

## Success Metrics

- [ ] Context model fully typed (100+ fields)
- [ ] Convention engines have 100% test coverage
- [ ] Templates have zero complex conditionals
- [ ] Generated code compiles with kotlinc
- [ ] Generated service runs in Spring Boot
- [ ] Output matches gap-cli (modulo formatting)

---

## Next Steps

1. **Read:** `complex-bundles-approach.md` for full analysis
2. **Plan:** `complex-bundles-roadmap.md` for day-by-day tasks
3. **Start:** Create `bundles/ddd-complex/src/types.ts`
4. **Build:** Implement HTTP convention engine
5. **Test:** Write 20+ test cases
6. **Iterate:** Add more engines, compose pipeline

---

## Questions?

- **How do I handle custom conventions?** Allow overrides in spec
- **What if a template needs logic?** The context model is wrong - enrich more
- **How do I test enrichment?** Given spec input, assert context output
- **How do I debug templates?** Log the context JSON, verify it's correct
- **How do I compare with gap-cli?** Generate same spec with both, diff output

---

## Resources

- **Gap-CLI:** `/home/gibbon/projects/gap-cli`
- **Current bundles:** `/home/gibbon/projects/fixedcode/bundles/`
- **Design doc:** `/home/gibbon/projects/fixedcode/docs/superpowers/specs/2026-03-30-fixedcode-engine-rewrite-design.md`
- **Gap analysis:** `/home/gibbon/projects/fixedcode/docs/analysis/gap-cli-vs-fixedcode.md`
