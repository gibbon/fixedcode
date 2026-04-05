# Design Decisions - Complex Bundles

**Date:** 2026-04-02  
**Status:** Approved

---

## 1. Command Type Overrides

**Decision:** Convention with explicit override (Option A)

```yaml
commands:
  - name: SendNotification
    params: [recipientId, message]
    emits: NotificationSent
    commandType: CREATE  # explicit override when needed
```

**Rationale:** 
- Convention handles 90% of cases automatically
- Explicit override for edge cases (SendNotification acts as CREATE)
- Clear and unambiguous

---

## 2. Shared vs Bundle-Specific Code

**Decision:** Shared utilities, NO inheritance

**Shared packages:**
- `@fixedcode/naming` - naming conventions (pascal, camel, snake, kebab, plural)
- `@fixedcode/types` - common type mappings
- `@fixedcode/conventions` - convention engine utilities (not base classes)

**Bundle implementation:**
- Bundles use shared utilities via composition
- Each bundle implements its own enrichment pipeline
- No base classes or inheritance

**Example:**
```typescript
// Bundle uses shared utilities
import { toPascalCase, pluralize } from '@fixedcode/naming';
import { deriveHttpMethod } from '@fixedcode/conventions';

export function enrich(spec: Spec): Context {
  // Bundle composes utilities, doesn't inherit
  const names = {
    pascal: toPascalCase(spec.name),
    plural: pluralize(spec.name)
  };
  // ...
}
```

**Rationale:**
- Composition over inheritance
- Bundles remain independent and flexible
- Shared code is opt-in, not forced

---

## 3. Bundle Categories

**Decision:** Design for extensibility, build DDD first

**Categories to support:**
- DDD/Domain (Kotlin/Spring, TypeScript, Python)
- API (BFF, Experience)
- Agents (Python agents, orchestrators)
- MCP (servers, wrappers)
- Infrastructure (events, features, rules)
- Testing (integration, UI)

**Implementation:**
- Start with DDD bundles (immediate need)
- Engine supports all categories (no DDD-specific assumptions)
- Other bundles are PEXA-specific but engine is generic

**Rationale:**
- Prove the architecture with DDD
- Don't limit future bundle types
- PEXA can maintain their own bundle library

---

## 4. Pluralization

**Decision:** Use library with spec override

```typescript
import pluralize from 'pluralize';

function getPlural(name: string, spec?: string): string {
  return spec || pluralize(name);
}
```

```yaml
aggregates:
  Person:
    plural: people  # override when library gets it wrong
```

**Rationale:**
- Library handles edge cases (person → people, child → children)
- Spec override for custom cases
- Correctness matters for API paths

---

## 5. Type System

**Decision:** Support custom types and references

**Primitive types:**
- uuid, string, int, long, boolean, decimal, date, datetime, object

**Semantic types:**
- email, phone, url (map to String + validation)

**Custom types:**
- Bundles can define their own type mappings
- Support for complex defaults (JWT claims, auth headers)

**References:**
- Support aggregate references (foreign keys)

**Example:**
```yaml
attributes:
  - name: email
    type: email  # semantic type
  - name: customerId
    type: ref:Customer  # reference to Customer aggregate
  - name: metadata
    type: object
    default: { "source": "api" }  # complex default
```

**Rationale:**
- Gap-cli already supports this
- Real-world domains need references
- Complex defaults are common (JWT, headers)

---

## 6. Validation

**Decision:** Generate Bean Validation annotations + custom validators

**Generated:**
```kotlin
data class Order(
    @field:NotNull
    @field:Size(min = 1, max = 255)
    val name: String,
    
    @field:Email
    val email: String
)
```

**Custom (user implements):**
```kotlin
@Component
class OrderValidator {
    fun validateBusinessRules(order: Order): ValidationResult {
        // custom logic
    }
}
```

**Rationale:**
- Standard annotations for common cases
- Custom validators for business rules
- Users can override/extend

---

## 7. Testing

**Decision:** Generate unit tests, integration tests, and fixtures

**Unit tests:**
- Test each aggregate's commands/queries
- Test validation rules
- Test event emission

**Integration tests (black-box):**
- Generate itest-harness tests from domain spec
- Validate against OpenAPI at runtime
- Test full request/response cycle

**Fixtures:**
- Generate sample data for each aggregate
- Support seeding test databases

**Rationale:**
- Gap-cli's itest-harness is valuable
- Black-box testing validates the output works
- Fixtures accelerate development

---

## 8. Documentation

**Decision:** Generate OpenAPI specs + use OpenAPI generators

**Generated:**
- OpenAPI 3.0 specs from domain model
- Use OpenAPI Generator for clients/servers
- Markdown docs if deterministic

**OpenAPI Generator usage:**
```yaml
# Use generated OpenAPI to create:
- TypeScript client SDK
- Kotlin server stubs
- API documentation
```

**Rationale:**
- OpenAPI is standard, widely supported
- OpenAPI Generator accelerates development
- Deterministic docs are maintainable

---

## 9. Bundle Composition

**Decision:** Support both composable and monolithic, avoid inheritance

**Composable bundles:**
```yaml
# .fixedcode.yaml
bundles:
  base: "@fixedcode/bundle-spring-base"
  domain: "@fixedcode/bundle-ddd-kotlin"
  api: "@fixedcode/bundle-rest-api"

# Generate with multiple bundles
fixedcode generate spec.yaml --bundles base,domain,api
```

**Monolithic bundle:**
```yaml
bundles:
  full-service: "@fixedcode/bundle-spring-service-complete"

fixedcode generate spec.yaml --bundle full-service
```

**Implementation:**
- Bundles can reference shared context
- No inheritance between bundles
- Composition via context passing

**Pros/Cons:**

| Approach | Pros | Cons |
|----------|------|------|
| Composable | Flexible, reusable, smaller bundles | Complex coordination, context merging |
| Monolithic | Simple, everything in one place | Less reusable, harder to customize |

**Decision:** Support both, let users choose. Start with monolithic for simplicity, add composition later.

**Rationale:**
- Different projects have different needs
- Monolithic is easier to start with
- Composition adds flexibility for advanced users

**Note:** Layered = bundles build on each other (base → domain → api). Composable = bundles work together but are independent. We'll support composable (more flexible).

---

## 10. Convention Extensibility

**Decision:** Global config + per-spec overrides

**Global config (.fixedcode.yaml):**
```yaml
conventions:
  httpPathPrefix: /v1
  authorizationEnabled: true
  
bundles:
  ddd: "./bundles/ddd-complex"
```

**Per-spec overrides:**
```yaml
apiVersion: "1.0"
kind: ddd-complex

conventions:
  httpPathPrefix: /api/v2  # override global

spec:
  package: io.pexa.gap.order
  aggregates:
    Order:
      commands:
        - name: CreateOrder
          params: [name]
          emits: OrderCreated
          http:
            path: /custom-orders  # override convention
```

**Custom convention engines (advanced):**
```typescript
// project-conventions.ts
import { Convention } from '@fixedcode/conventions';

export const customHttpConvention: Convention = {
  deriveHttpMetadata(cmd, agg, config) {
    const base = defaultHttpConvention(cmd, agg, config);
    return {
      ...base,
      path: `${config.httpPathPrefix}${base.path}`
    };
  }
};
```

```yaml
# .fixedcode.yaml
conventions:
  httpPathPrefix: /v1
  customEngines:
    http: ./project-conventions.ts#customHttpConvention
```

**Rationale:**
- Global config for project-wide conventions
- Per-spec overrides for special cases
- Custom engines for advanced users (TypeScript modules)
- Flexible without being complex

---

## Implementation Priority

### Phase 1 (Week 1-2): Core DDD Bundle
1. ✅ Command type overrides
2. ✅ Shared utilities (naming, types)
3. ✅ Pluralization with library
4. ✅ Basic type system (primitives + semantic)
5. ✅ Bean Validation annotations

### Phase 2 (Week 3): Advanced Features
6. ✅ Custom types and references
7. ✅ Unit test generation
8. ✅ OpenAPI spec generation

### Phase 3 (Week 4): Testing & Docs
9. ✅ Integration test generation (itest-harness)
10. ✅ Fixture generation
11. ✅ OpenAPI Generator integration

### Phase 4 (Future): Composition & Extensibility
12. ⏳ Bundle composition
13. ⏳ Custom convention engines
14. ⏳ Additional bundle types (agents, MCP, etc.)

---

## Open Questions (Remaining)

1. **Context merging:** How do composable bundles merge their contexts?
2. **Bundle dependencies:** How does bundle A declare it needs bundle B?
3. **Conflict resolution:** What if two bundles generate the same file?
4. **Custom convention syntax:** Best way to reference TypeScript functions in YAML?

---

## Next Steps

1. Update `complex-bundles-approach.md` with these decisions
2. Update `complex-bundles-roadmap.md` with implementation details
3. Create `SHARED-UTILITIES.md` design document
4. Create `BUNDLE-COMPOSITION.md` design document
5. Start implementation: Week 1 Day 1

---

## Additional Decisions (2026-04-02 Part 2)

### Bundle Composition Details

**Q1: Context Merging**
**Decision:** TBD - Need to evaluate pros/cons of each approach
- Option A: Sequential enrichment (base → domain → api)
- Option B: Independent + merge
- Option C: Shared context object

**Action:** Research and document trade-offs before implementing composition

---

**Q2: File Conflicts**
**Decision:** Last bundle wins + log warning

```
⚠️  Warning: Multiple bundles generating 'application.yaml'
    - spring-base: application.yaml
    - ddd-domain: application.yaml (overwriting)
```

**Rationale:** Simple, predictable. User controls bundle order.

---

**Q3: Bundle Dependencies**
**Decision:** Defer - Multi-bundle is getting complex

**Action:** Start with monolithic bundles, revisit composition later when we have real use cases

---

### Custom Types & References

**Q4: Reference Syntax**
**Decision:** Option C - Implicit references

```yaml
attributes:
  - name: customer
    type: Customer  # if not primitive, assume reference
```

**Rationale:** Clean, matches domain modeling conventions

---

**Q5: Complex Defaults**
**Decision:** Support expressions via helper class/method

```yaml
attributes:
  - name: metadata
    type: object
    default:
      helper: MetadataHelper.createDefault
      # Or with params:
      helper: JwtHelper.createClaims
      params: [userId, userRole]
```

**Rationale:** Matches gap-cli approach, deterministic, type-safe

---

### Testing Details

**Q6: Unit Test Scope**
**Decision:** Option B - Comprehensive (but only deterministic logic)

Generate tests for:
- ✅ Command handlers execute
- ✅ Query handlers return data
- ✅ Events are emitted
- ✅ Validation rules
- ❌ Business logic (user implements)
- ✅ Error cases (deterministic ones)

**Rationale:** Test what we generate, not what users implement

---

**Q7: Integration Test (itest-harness)**
**Decision:** Option 1 - Generate tests from spec

**Rationale:** Matches gap-cli, validates generated code works

---

**Q8: Test Fixtures**
**Decision:** Don't care - generate valid examples

**Action:** Generate minimal valid fixtures, users can extend

---

### OpenAPI & Code Generation

**Q9: OpenAPI Generator Integration**
**Decision:** Build scripts (build.gradle) run OpenAPI Generator

```kotlin
// Generated build.gradle.kts
tasks.register("generateOpenApiClient") {
    // Run OpenAPI Generator
}
```

**Rationale:** Sites are standalone after generation, build scripts handle codegen

---

**Q10: Server vs Client Generation**
**Decision:** Option 2 - Generate OpenAPI, use generator for server

**Rationale:** Leverage OpenAPI ecosystem, standard approach

---

### Convention Extensibility

**Q11: Custom Convention Engine Syntax**
**Decision:** Option A - File path + export

```yaml
conventions:
  customEngines:
    http: ./conventions.ts#customHttpConvention
```

**Rationale:** Simple, explicit, TypeScript-friendly

---

**Q12: Convention Override Precedence**
**Decision:** 1 → 2 → 3 → 4 (later overrides earlier)

1. Default conventions (in bundle)
2. Global config (.fixedcode.yaml)
3. Per-spec overrides (spec.yaml)
4. Per-operation overrides (command definition)

---

### Validation Details

**Q13: Validation Annotation Placement**
**Decision:** Both - fields for entity validation, parameters for API validation

**Rationale:** OpenAPI spec creates parameter validation, fields need validation too

---

**Q14: Custom Validator Generation**
**Decision:** Yes - generate validator stubs like existing bundles

```kotlin
@Component
class OrderValidator {
    fun validateBusinessRules(order: Order): ValidationResult {
        // TODO: Implement custom validation
        return ValidationResult.success()
    }
}
```

---

### Documentation

**Q15: Deterministic Docs**
**Decision:** Only generate deterministic docs (no LLM)

- ✅ Markdown from spec structure
- ✅ OpenAPI specs
- ❌ LLM-generated descriptions

**Rationale:** Deterministic = maintainable, reproducible

---

**Q16: Doc Format**
**Decision:** Markdown

**Rationale:** Human-readable, git-friendly, simple

---

### Implementation Priority

**Q17: MVP Scope**
**Decision:** Approved

1. Core DDD bundle (monolithic)
2. Command/query enrichment with conventions
3. Basic type system (primitives + semantic types)
4. OpenAPI generation
5. Unit test generation

Later:
- Bundle composition (when we have real use cases)
- Custom types/references
- Integration tests
- Custom conventions

---

**Q18: Target Language**
**Decision:** TypeScript/Express first

**Rationale:** 
- Simpler than Kotlin/Spring
- Faster to prove concept
- Not for PEXA (personal project)
- Can add Kotlin bundle later

---

## Simplified Scope

Based on answers, **simplifying initial scope:**

### Phase 1: TypeScript DDD Bundle (Monolithic)
- Single bundle, no composition
- TypeScript/Express target
- Convention-based enrichment
- OpenAPI generation
- Unit tests
- Deterministic only

### Phase 2: Advanced Features (Later)
- Bundle composition (when needed)
- Kotlin/Spring bundle
- Integration tests
- Custom conventions
- Complex types/references

### Deferred/Complex
- Multi-bundle composition (needs more design)
- LLM-generated docs
- Non-deterministic features

---

## Key Simplifications

1. **No multi-bundle yet** - Start monolithic, add composition when we have real use cases
2. **TypeScript first** - Simpler than Kotlin, faster to validate approach
3. **Deterministic only** - No LLM, no complex business logic generation
4. **OpenAPI-centric** - Leverage OpenAPI Generator for server/client code

This makes Phase 1 achievable in 2-3 weeks instead of 4+.

