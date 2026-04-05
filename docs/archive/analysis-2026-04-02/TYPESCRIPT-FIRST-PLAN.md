# TypeScript-First Implementation Plan

**Target:** DDD bundle for TypeScript/Express (monolithic, no composition)

**Timeline:** 2-3 weeks

---

## Why TypeScript First?

1. **Simpler** - Express is simpler than Spring Boot
2. **Faster** - Prove the concept quickly
3. **Same ecosystem** - Bundle code and target code both TypeScript
4. **Personal project** - Not for PEXA, can iterate freely

---

## Simplified Scope

### What We're Building
- Single monolithic bundle: `@fixedcode/bundle-ddd-express`
- Generates TypeScript/Express REST API
- Convention-based (HTTP, auth, validation)
- OpenAPI spec generation
- Unit tests
- Deterministic only (no LLM, no complex business logic)

### What We're NOT Building (Yet)
- ❌ Multi-bundle composition
- ❌ Kotlin/Spring bundle
- ❌ Integration tests (itest-harness)
- ❌ Custom convention engines
- ❌ Complex type references
- ❌ LLM-generated docs

---

## Week 1: Foundation

### Day 1: Shared Utilities
**Goal:** Create reusable packages

```bash
packages/
├── naming/              # @fixedcode/naming
├── types/               # @fixedcode/types
└── conventions/         # @fixedcode/conventions
```

**Tasks:**
- [ ] Create `@fixedcode/naming` package
  - toPascalCase, toCamelCase, toSnakeCase, toKebabCase
  - pluralize (using pluralize library)
  - generateNamingVariants
- [ ] Create `@fixedcode/types` package
  - Type mappings (uuid → string, etc for TypeScript)
  - Semantic types (email, phone, url)
  - Type resolver
- [ ] Create `@fixedcode/conventions` package
  - detectPattern
  - HTTP method/status code maps
  - buildPath utility
- [ ] Write tests for all utilities (80%+ coverage)

**Deliverable:** 3 packages with tests, published to npm or local

---

### Day 2: Bundle Structure
**Goal:** Create bundle skeleton

```bash
bundles/ddd-express/
├── src/
│   ├── index.ts              # Bundle export
│   ├── types.ts              # Context interfaces
│   ├── schema.json           # Spec schema
│   └── enrich/
│       └── index.ts          # Enrichment pipeline
├── templates/
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       └── models/
└── test/
```

**Tasks:**
- [ ] Define spec schema (JSON Schema)
- [ ] Define context interfaces (TypeScript)
- [ ] Create bundle manifest
- [ ] Set up test infrastructure

**Deliverable:** Bundle skeleton with types

---

### Day 3-4: Enrichment Pipeline
**Goal:** Implement enrichment using shared utilities

**Tasks:**
- [ ] Parse aggregates from spec
- [ ] Generate naming variants (using @fixedcode/naming)
- [ ] Enrich attributes (types, validation)
- [ ] Enrich commands (HTTP, auth, response)
- [ ] Enrich queries (HTTP, auth, response)
- [ ] Enrich events
- [ ] Resolve imports
- [ ] Write enrichment tests

**Example:**
```typescript
import { generateNamingVariants } from '@fixedcode/naming';
import { detectPattern, getHttpMethod } from '@fixedcode/conventions';

export function enrichCommand(cmd: RawCommand, agg: Aggregate): CommandContext {
  const names = generateNamingVariants(cmd.name);
  const pattern = cmd.commandType || detectPattern(cmd.name);
  
  return {
    name: cmd.name,
    names,
    http: {
      method: getHttpMethod(pattern),
      path: buildPath(pattern, agg.names.pluralKebab),
      statusCode: getStatusCode(pattern),
    },
    // ...
  };
}
```

**Deliverable:** Full enrichment pipeline with tests

---

### Day 5: Template Basics
**Goal:** Create simple templates

**Tasks:**
- [ ] Controller template (routes + handlers)
- [ ] Service template (command/query handlers)
- [ ] Model template (TypeScript interfaces)
- [ ] Test with simple spec

**Example Controller Template:**
```handlebars
// src/routes/{{names.pluralKebab}}.ts
import { Router } from 'express';
import { {{names.pascal}}Service } from '../services/{{names.kebab}}.service';

const router = Router();
const service = new {{names.pascal}}Service();

{{#each queries}}
router.{{http.method.toLowerCase}}('{{http.path}}', async (req, res) => {
  const result = await service.{{names.camel}}({{#each params}}req.params.{{name}}{{/each}});
  res.status({{http.statusCode}}).json(result);
});
{{/each}}

{{#each commands}}
router.{{http.method.toLowerCase}}('{{http.path}}', async (req, res) => {
  const result = await service.{{names.camel}}(req.body);
  res.status({{http.statusCode}}).json(result);
});
{{/each}}

export default router;
```

**Deliverable:** Basic templates that generate valid TypeScript

---

## Week 2: Features

### Day 6-7: Complete Templates
**Goal:** All templates working

**Tasks:**
- [ ] Service template (full implementation)
- [ ] Model template (with validation)
- [ ] Repository template (in-memory for now)
- [ ] Index/app template (Express setup)
- [ ] Package.json template
- [ ] Test templates compile

**Deliverable:** Complete set of templates

---

### Day 8: OpenAPI Generation
**Goal:** Generate OpenAPI 3.0 spec

**Tasks:**
- [ ] Implement OpenAPI generator
- [ ] Generate paths from commands/queries
- [ ] Generate schemas from aggregates
- [ ] Validate with OpenAPI validator
- [ ] Test with Swagger UI

**Example:**
```typescript
export function generateOpenApi(context: Context): OpenApiSpec {
  return {
    openapi: '3.0.0',
    info: { title: context.boundedContext, version: '1.0.0' },
    paths: generatePaths(context.aggregates),
    components: { schemas: generateSchemas(context.aggregates) },
  };
}
```

**Deliverable:** OpenAPI spec generation working

---

### Day 9: Validation
**Goal:** Add validation to models and routes

**Tasks:**
- [ ] Generate validation decorators (class-validator)
- [ ] Add validation middleware to routes
- [ ] Generate validation tests
- [ ] Test with invalid data

**Example:**
```typescript
// Generated model with validation
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  name: string;
  
  @IsEmail()
  email: string;
}
```

**Deliverable:** Validation working

---

### Day 10: Unit Tests
**Goal:** Generate unit tests

**Tasks:**
- [ ] Generate service tests
- [ ] Generate controller tests
- [ ] Generate model tests
- [ ] Use fixtures for test data
- [ ] Test generated tests pass

**Example:**
```typescript
// Generated test
describe('OrderService', () => {
  it('should create order', async () => {
    const service = new OrderService();
    const order = await service.createOrder({ name: 'Test' });
    expect(order.name).toBe('Test');
  });
});
```

**Deliverable:** Unit test generation working

---

## Week 3: Polish & Integration

### Day 11-12: Integration Testing
**Goal:** Full pipeline works end-to-end

**Tasks:**
- [ ] Generate complete service from spec
- [ ] Run `npm install`
- [ ] Run `npm test` (generated tests pass)
- [ ] Run `npm start` (server starts)
- [ ] Test API with curl/Postman
- [ ] Validate against OpenAPI spec

**Deliverable:** Generated service runs and works

---

### Day 13: Error Handling
**Goal:** Improve error messages

**Tasks:**
- [ ] Better spec validation errors
- [ ] Better enrichment errors
- [ ] Better template errors
- [ ] Add suggestions for common mistakes

**Deliverable:** Clear error messages

---

### Day 14: Documentation
**Goal:** Document the bundle

**Tasks:**
- [ ] Bundle README (how to use)
- [ ] Spec format documentation
- [ ] Convention documentation
- [ ] Example specs
- [ ] Migration guide from gap-cli

**Deliverable:** Complete documentation

---

### Day 15: Examples & Testing
**Goal:** Create example projects

**Tasks:**
- [ ] Simple example (Order aggregate)
- [ ] Complex example (multiple aggregates)
- [ ] Test with edge cases
- [ ] Fix bugs found

**Deliverable:** Working examples

---

## Success Criteria

### Week 1
- [ ] Shared utilities working with tests
- [ ] Bundle structure in place
- [ ] Enrichment pipeline working
- [ ] Basic templates generate valid TypeScript

### Week 2
- [ ] All templates complete
- [ ] OpenAPI generation working
- [ ] Validation working
- [ ] Unit tests generating

### Week 3
- [ ] Full pipeline works end-to-end
- [ ] Generated service runs
- [ ] Error messages clear
- [ ] Documentation complete
- [ ] Examples working

---

## Example Spec

```yaml
apiVersion: "1.0"
kind: ddd-express

spec:
  name: order-service
  aggregates:
    Order:
      attributes:
        - name: id
          type: uuid
          identity: true
        - name: customerName
          type: string
          required: true
        - name: email
          type: email
          required: true
        - name: status
          type: string
          required: true
          default: PENDING
      
      commands:
        - name: CreateOrder
          params: [customerName, email]
          emits: OrderCreated
        
        - name: UpdateOrderStatus
          params: [id, status]
          emits: OrderStatusUpdated
      
      queries:
        - name: GetOrder
          params: [id]
          returns: single
        
        - name: ListOrders
          params: [status]
          returns: list
      
      events:
        - name: OrderCreated
          fields: [id, customerName, email]
        - name: OrderStatusUpdated
          fields: [id, status]
```

---

## Generated Output

```
build/order-service/
├── src/
│   ├── routes/
│   │   └── orders.ts              # Express routes
│   ├── services/
│   │   └── order.service.ts       # Command/query handlers
│   ├── models/
│   │   ├── order.model.ts         # Order interface
│   │   └── order.dto.ts           # DTOs with validation
│   ├── repositories/
│   │   └── order.repository.ts    # In-memory repository
│   └── app.ts                     # Express app setup
├── test/
│   ├── order.service.test.ts
│   └── order.routes.test.ts
├── openapi.yaml                   # OpenAPI 3.0 spec
├── package.json
├── tsconfig.json
└── README.md
```

---

## Next Steps After Week 3

1. **Add Kotlin/Spring bundle** - Reuse shared utilities, different templates
2. **Add bundle composition** - When we have real use cases
3. **Add integration tests** - itest-harness for black-box testing
4. **Add custom conventions** - When users need them
5. **Add complex types** - References, custom types, complex defaults

---

## Key Differences from Original Plan

| Original | Simplified |
|----------|------------|
| Kotlin/Spring | TypeScript/Express |
| 4 weeks | 2-3 weeks |
| Multi-bundle | Monolithic |
| Integration tests | Unit tests only |
| Complex types | Basic types |
| Custom conventions | Default conventions |

**Rationale:** Prove the concept quickly, add complexity later based on real needs.
