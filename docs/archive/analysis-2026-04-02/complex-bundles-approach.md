# Complex Bundles - Analysis & Approach

## Executive Summary

You're reimplementing gap-cli as fixedcode with a cleaner architecture. The gap analysis shows you've built the engine and proven the concept with simple bundles. Now you need to tackle **complex bundles** that generate production-grade Spring Boot microservices with DDD/CQRS patterns.

**Key Challenge:** Gap-cli has 100+ enriched fields per aggregate and templates still contain conditional logic. Your goal: push ALL logic into enrich() so templates become trivial.

---

## Current State Assessment

### What Works ✅
- **Engine pipeline:** parse → validate → resolve → enrich → render → write
- **Bundle system:** pluggable, npm-distributed, local dev paths
- **Simple bundles:** ddd-basic, crud-api, mcp-wrapper all generate correctly
- **Core enrichment:** naming variants (pascal, camel, snake, kebab), type mappings

### What's Missing for Production DDD Services ❌
1. **HTTP conventions** - derive method/path from command patterns
2. **Response strategies** - different return types (entity, id, void) with status codes
3. **Authorization metadata** - @Authorise annotations from operation types
4. **Lookup strategies** - how to fetch entities before/after commands
5. **Validation rules** - field constraints and validation service generation
6. **OpenAPI generation** - spec from domain model
7. **Database migrations** - Flyway SQL from aggregates
8. **Nested entities** - commands with child collections
9. **Row-level security** - ABAC constraints in queries

---

## Gap-CLI Architecture Deep Dive

### The Enrich Philosophy

> "Templates focus on formatting and presentation, with all complex logic pre-computed in Go components."

Gap-cli's `EntityMetadata` struct has **100+ fields** including:
- Naming variants (Name, NamePascal, NameCamel, NameSnake, NameKebab)
- HTTP metadata (Method, Path, OperationId, PathParams, QueryParams, BodyParams)
- Response handling (LookupStrategy, ReturnType, StatusCode, EtagHandling)
- Authorization (AuthoriseAction, AuthoriseId, AuthoriseAttributes)
- Validation (ValidationRules, RequiredFields, Constraints)
- Imports (all import statements pre-computed)
- Sample bodies (for OpenAPI examples)

### Why Gap-CLI Templates Still Have Logic

Even with rich context, gap-cli templates contain conditionals because:

1. **Different response patterns:**
   ```go
   {{- if eq $command.LookupStrategy.Strategy "noLookup" }}
   {{- if $command.HasNestedEntities }}
   ```

2. **Multiple return types:**
   - Create → 201 with entity
   - Update → 200 with entity
   - Delete → 204 with nothing

3. **Authorization variations:**
   - Different @Authorise per operation type
   - SpEL expressions for resource IDs

**Root cause:** These are still "strategies" not "pre-computed values". The template chooses the strategy. Better: enrich() chooses and provides ready-to-use strings.

---


## Convention Over Configuration

### The Spec Should Be Minimal

Gap-cli format (compact inline):
```yaml
commands:
  - CreateOrder(name!, status!) -> OrderCreated
```

FixedCode format (explicit YAML):
```yaml
commands:
  - name: CreateOrder
    params: [name, status]
    emits: OrderCreated
```

Both formats are minimal - neither specifies HTTP method, path, status codes, or authorization. **The key difference:** gap-cli uses inline syntax, fixedcode uses structured YAML. Both derive everything else via conventions.



















commands:
  - name: CreateOrder
    params: [name, status]
    emits: OrderCreated
```

And derive everything else.

### Convention Rules

| Command Pattern | HTTP Method | Path | Returns | Status |
|----------------|-------------|------|---------|--------|
| Create* | POST | /resources | entity | 201 |
| Update*(id) | PUT | /resources/{id} | entity | 200 |
| Delete*(id) | DELETE | /resources/{id} | void | 204 |
| Archive*(id) | PUT | /resources/{id}/archive | entity | 200 |

| Query Pattern | HTTP Method | Path | Returns |
|--------------|-------------|------|---------|
| Get*(id) | GET | /resources/{id} | single |
| Search*, List* | GET | /resources | list |
| Find*By* | GET | /resources/search | list |

### Authorization Conventions

| Command Type | Action | Resource | ID Expression |
|-------------|--------|----------|---------------|
| Create* | CREATE | aggregate | null |
| Update* | UPDATE | aggregate | #id |
| Delete* | DELETE | aggregate | #id |
| Get* | READ | aggregate | #id |
| Search* | READ | aggregate | null |

---

## Proposed Context Model for Complex DDD Bundle

### Top-Level Context

```typescript
interface DddComplexContext {
  package: string;
  boundedContext: string;
  aggregates: AggregateContext[];
  
  // Pre-computed shared code
  imports: {
    common: string[];      // imports needed by all files
    domain: string[];      // domain-specific imports
    infrastructure: string[];
  };
  
  // Database schema
  migrations: MigrationContext[];
  
  // OpenAPI
  openapi: OpenApiContext;
}
```

### Aggregate Context (Enhanced)

```typescript
interface AggregateContext {
  // Naming
  name: string;
  names: {
    pascal: string;      // Order
    camel: string;       // order
    snake: string;       // order
    kebab: string;       // order
    plural: string;      // orders
    pluralKebab: string; // orders
  };
  
  // Attributes
  attributes: AttributeContext[];
  identityField: AttributeContext;  // pre-selected
  
  // Operations (fully enriched)
  commands: CommandContext[];
  queries: QueryContext[];
  events: EventContext[];
  
  // Pre-computed code fragments
  imports: string[];                // all imports this aggregate needs
  tableDefinition: string;          // SQL CREATE TABLE
  repositoryMethods: string[];      // method signatures
}
```

### Command Context (Fully Enriched)

```typescript
interface CommandContext {
  // Naming
  name: string;
  names: {
    pascal: string;
    camel: string;
    kebab: string;
  };
  
  // HTTP (all pre-computed)
  http: {
    method: 'POST' | 'PUT' | 'DELETE';
    path: string;              // "/orders" or "/orders/{orderId}"
    operationId: string;       // "createOrder"
    pathParams: ParamContext[];
    queryParams: ParamContext[];
    bodyParams: ParamContext[];
    statusCode: number;        // 201, 200, 204
  };
  
  // Response handling (no conditionals in template)
  response: {
    type: 'entity' | 'id' | 'void';
    returnType: string;        // "Order" or "UUID" or "void"
    wrapInResponseEntity: boolean;
    includeEtag: boolean;
  };
  
  // Lookup strategy (pre-computed)
  lookup: {
    required: boolean;
    field: string;             // "orderId"
    expression: string;        // "repository.findById(orderId).orElseThrow()"
  };
  
  // Authorization (ready to use)
  authorization: {
    annotation: string;        // "@Authorise(action = CREATE, resource = \"Order\")"
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resourceExpression: string;
    idExpression?: string;     // "#orderId" or null
  };
  
  // Validation
  validation: {
    required: string[];        // field names
    constraints: ConstraintContext[];
  };
  
  // Event emission
  emits: {
    eventName: string;
    eventType: string;         // "OrderCreated"
    constructorCall: string;   // "OrderCreated(order.id, order.name)"
  };
  
  // Parameters
  params: ParamContext[];
  
  // Pre-computed code fragments
  methodSignature: string;     // "createOrder(name: String, status: String): Order"
  parameterAssignments: string[]; // ["order.name = name", "order.status = status"]
  imports: string[];
}
```

### Query Context (Fully Enriched)

```typescript
interface QueryContext {
  name: string;
  names: { pascal: string; camel: string; kebab: string; };
  
  http: {
    method: 'GET';
    path: string;
    operationId: string;
    pathParams: ParamContext[];
    queryParams: ParamContext[];
    statusCode: 200;
  };
  
  response: {
    type: 'single' | 'list' | 'page';
    returnType: string;        // "Order" or "List<Order>" or "Page<Order>"
    wrapInResponseEntity: boolean;
    includeEtag: boolean;
  };
  
  authorization: {
    annotation: string;
    action: 'READ';
    resourceExpression: string;
    idExpression?: string;
  };
  
  filters: FilterContext[];
  pagination: {
    enabled: boolean;
    defaultSize: number;
    maxSize: number;
  };
  
  // Pre-computed
  methodSignature: string;
  repositoryCall: string;      // "repository.findById(id)" or "repository.findAll()"
  imports: string[];
}
```

### Template Simplicity Goal

With this context, templates become:

```handlebars
package {{package}}.api;

{{#each imports}}
import {{this}};
{{/each}}

@RestController
@RequestMapping("/api/{{names.pluralKebab}}")
class {{names.pascal}}Controller(
    private val commandService: {{names.pascal}}CommandService,
    private val queryService: {{names.pascal}}QueryService
) {
    {{#each queries}}
    @GetMapping("{{http.path}}")
    {{authorization.annotation}}
    fun {{names.camel}}({{#each http.pathParams}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}): ResponseEntity<{{response.returnType}}> {
        return {{repositoryCall}}
            .map { ResponseEntity.ok(it) }
            .orElse(ResponseEntity.notFound().build())
    }
    {{/each}}
    
    {{#each commands}}
    @{{http.method}}Mapping("{{http.path}}")
    {{authorization.annotation}}
    fun {{names.camel}}({{#each params}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}): ResponseEntity<{{response.returnType}}> {
        {{#if lookup.required}}
        val entity = {{lookup.expression}}
        {{/if}}
        val event = commandService.{{names.camel}}({{#each params}}{{name}}{{#unless @last}}, {{/unless}}{{/each}})
        return ResponseEntity.status({{http.statusCode}}).body({{#if response.wrapInResponseEntity}}event{{else}}null{{/if}})
    }
    {{/each}}
}
```

**Key point:** No complex conditionals. Just interpolation and simple iteration.

---

## Enrichment Pipeline Design

### Composable Transform Steps

```typescript
const enrich = pipe(
  // Phase 1: Parse and normalize
  parseAggregates,           // raw spec → typed aggregates
  normalizeNames,            // add all naming variants
  
  // Phase 2: Type resolution
  resolveTypes,              // spec types → language types
  resolveDefaults,           // add default values with proper quoting
  
  // Phase 3: Operation enrichment
  enrichCommands,            // derive HTTP, response, auth, validation
  enrichQueries,             // derive HTTP, response, auth, filters
  enrichEvents,              // event field mapping
  
  // Phase 4: Cross-cutting concerns
  resolveImports,            // compute all imports from usage
  resolveLookupStrategies,   // pre-compute entity lookup expressions
  resolveAuthorization,      // generate @Authorise annotations
  
  // Phase 5: Code generation prep
  generateMethodSignatures,  // ready-to-use method signatures
  generateRepositoryCalls,   // ready-to-use repository expressions
  generateMigrations,        // SQL DDL from aggregates
  generateOpenApi,           // OpenAPI spec from operations
);
```

### Convention Engines

Each enrichment step uses convention engines:

```typescript
// HTTP Convention Engine
function deriveHttpMetadata(command: Command, aggregate: Aggregate): HttpMetadata {
  const pattern = detectPattern(command.name); // Create*, Update*, Delete*
  
  return {
    method: HTTP_METHOD_MAP[pattern],
    path: buildPath(pattern, aggregate.names.pluralKebab, command.params),
    operationId: command.names.camel,
    statusCode: STATUS_CODE_MAP[pattern],
    pathParams: extractPathParams(command.params),
    queryParams: extractQueryParams(command.params),
    bodyParams: extractBodyParams(command.params),
  };
}

// Response Strategy Engine
function deriveResponseStrategy(command: Command): ResponseStrategy {
  const pattern = detectPattern(command.name);
  
  if (pattern === 'Create') {
    return { type: 'entity', returnType: command.emits, statusCode: 201 };
  } else if (pattern === 'Delete') {
    return { type: 'void', returnType: 'void', statusCode: 204 };
  } else {
    return { type: 'entity', returnType: command.emits, statusCode: 200 };
  }
}

// Authorization Engine
function deriveAuthorization(operation: Command | Query, aggregate: Aggregate): AuthMetadata {
  const action = OPERATION_ACTION_MAP[detectPattern(operation.name)];
  const idParam = operation.params.find(p => p.isIdentity);
  
  return {
    action,
    annotation: buildAuthorizeAnnotation(action, aggregate.name, idParam?.name),
    resourceExpression: aggregate.name,
    idExpression: idParam ? `#${idParam.name}` : undefined,
  };
}
```

---

## Implementation Phases

### Phase 1: Enhanced Context Model (Week 1)
**Goal:** Define TypeScript interfaces for fully-enriched context

- [ ] Define `DddComplexContext` interface
- [ ] Define enhanced `AggregateContext` with all metadata
- [ ] Define `CommandContext` with HTTP, response, auth, validation
- [ ] Define `QueryContext` with HTTP, response, auth, filters
- [ ] Write tests: given spec input, assert expected context shape

### Phase 2: Convention Engines (Week 1-2)
**Goal:** Build the convention derivation logic

- [ ] HTTP convention engine (method, path, params from command name)
- [ ] Response strategy engine (return type, status code from pattern)
- [ ] Authorization engine (@Authorise annotations from operation type)
- [ ] Lookup strategy engine (entity fetch expressions)
- [ ] Validation engine (constraints from field types)
- [ ] Test each engine independently with unit tests

### Phase 3: Enrichment Pipeline (Week 2)
**Goal:** Compose convention engines into full enrichment

- [ ] Build composable transform pipeline
- [ ] Integrate all convention engines
- [ ] Add import resolution (scan context for types, generate imports)
- [ ] Add method signature generation
- [ ] Add repository call generation
- [ ] Integration tests: full spec → full context

### Phase 4: Template Simplification (Week 2-3)
**Goal:** Rewrite templates to use enriched context

- [ ] Controller template (trivial with enriched HTTP/auth)
- [ ] Command service template
- [ ] Query service template
- [ ] Repository template
- [ ] Entity template
- [ ] Events template
- [ ] Test: generate from real gap-cli spec, compare output

### Phase 5: Advanced Features (Week 3-4)
**Goal:** Add production features

- [ ] Database migration generation (Flyway SQL from aggregates)
- [ ] OpenAPI spec generation
- [ ] Nested entities support
- [ ] Pagination for list queries
- [ ] Row-level security (ABAC constraints)
- [ ] Validation service generation

### Phase 6: Bundle Composition (Week 4)
**Goal:** Support composing multiple bundles

- [ ] Base bundle: shared infrastructure (config, security, etc.)
- [ ] DDD bundle: domain layer
- [ ] API bundle: REST controllers
- [ ] Persistence bundle: repositories, migrations
- [ ] Test bundle: test fixtures
- [ ] Composition mechanism: bundles can reference each other

---

## Key Design Decisions

### 1. How Much Convention vs Configuration?

**Recommendation:** Start with 90% convention, allow 10% override.

```yaml
commands:
  - name: CreateOrder
    params: [name, status]
    emits: OrderCreated
    # Overrides (optional)
    http:
      path: "/custom-orders"  # override default "/orders"
      statusCode: 200         # override default 201
```

### 2. Single Bundle vs Composition?

**Recommendation:** Start with single monolithic bundle, refactor to composition in Phase 6.

Rationale:
- Easier to develop and test initially
- Composition adds complexity (bundle dependencies, shared context)
- Can extract common patterns once we see them

### 3. Template Logic Tolerance?

**Recommendation:** Allow simple `{{#if}}` for optional sections, but NO complex conditionals.

Allowed:
```handlebars
{{#if response.includeEtag}}
@ETag
{{/if}}
```

Not allowed:
```handlebars
{{#if (eq response.type "entity")}}
  {{#if (eq http.statusCode 201)}}
    return ResponseEntity.created(...).body(entity)
  {{else}}
    return ResponseEntity.ok(entity)
  {{/if}}
{{else if (eq response.type "void")}}
  return ResponseEntity.noContent().build()
{{/if}}
```

Instead, enrich should provide:
```typescript
response: {
  returnStatement: "return ResponseEntity.created(...).body(entity)"
}
```

### 4. Spec Format Evolution?

**Recommendation:** Keep spec minimal, version it, support migration.

```yaml
apiVersion: "1.0"
kind: ddd-complex
metadata:
  name: order-service

spec:
  version: "2.0"  # bundle-specific version
  package: io.pexa.gap.order
  aggregates:
    Order:
      # minimal spec
```

If spec format changes, bundle can detect version and migrate internally.

---

## Testing Strategy

### 1. Enrichment Tests (Most Important)

```typescript
describe('enrichCommands', () => {
  it('derives HTTP metadata for CreateOrder', () => {
    const spec = {
      aggregates: {
        Order: {
          commands: [
            { name: 'CreateOrder', params: ['name', 'status'], emits: 'OrderCreated' }
          ]
        }
      }
    };
    
    const context = enrich(spec);
    const command = context.aggregates[0].commands[0];
    
    expect(command.http.method).toBe('POST');
    expect(command.http.path).toBe('/orders');
    expect(command.http.statusCode).toBe(201);
    expect(command.response.type).toBe('entity');
    expect(command.authorization.action).toBe('CREATE');
  });
});
```

### 2. Convention Engine Tests

```typescript
describe('HTTP Convention Engine', () => {
  it('maps Create* to POST with 201', () => {
    const result = deriveHttpMetadata({ name: 'CreateOrder', ... });
    expect(result.method).toBe('POST');
    expect(result.statusCode).toBe(201);
  });
  
  it('maps Update* to PUT with 200', () => {
    const result = deriveHttpMetadata({ name: 'UpdateOrder', ... });
    expect(result.method).toBe('PUT');
    expect(result.statusCode).toBe(200);
  });
});
```

### 3. Template Output Tests (Snapshot Testing)

```typescript
describe('Controller Template', () => {
  it('generates correct controller for Order aggregate', () => {
    const context = enrich(orderSpec);
    const output = render('Controller.kt.hbs', context);
    expect(output).toMatchSnapshot();
  });
});
```

### 4. Integration Tests (Full Pipeline)

```typescript
describe('Full Pipeline', () => {
  it('generates complete service from spec', async () => {
    await generate('order-service.yaml', './build');
    
    // Verify files exist
    expect(fs.existsSync('./build/OrderController.kt')).toBe(true);
    
    // Verify compilation
    const result = await exec('kotlinc ./build/**/*.kt');
    expect(result.exitCode).toBe(0);
  });
});
```

---

## Migration Path from Gap-CLI

### Step 1: Pick Reference Aggregate
Choose a complex aggregate from gap-cli (e.g., Workspace with nested entities, multiple commands/queries).

### Step 2: Reverse Engineer Context
Run gap-cli with debug output to see the enriched context. Document all fields.

### Step 3: Implement Enrichment
Build fixedcode enrichment to produce equivalent context.

### Step 4: Compare Output
Generate with both gap-cli and fixedcode, diff the output. Iterate until identical.

### Step 5: Simplify
Once output matches, refactor to remove unnecessary complexity gap-cli accumulated.

---

## Success Metrics

### Phase 1-3 (Foundation)
- [ ] Context model fully typed in TypeScript
- [ ] All convention engines have 100% test coverage
- [ ] Enrichment pipeline produces expected context for 10+ test cases

### Phase 4 (Templates)
- [ ] Templates have zero complex conditionals
- [ ] Generated code compiles with kotlinc
- [ ] Generated code passes Spring Boot tests

### Phase 5 (Production)
- [ ] Generated service matches gap-cli output (modulo formatting)
- [ ] Generated service deploys and runs
- [ ] OpenAPI spec validates
- [ ] Database migrations apply successfully

### Phase 6 (Composition)
- [ ] Can compose 3+ bundles into single output
- [ ] Shared code (config, security) generated once
- [ ] Bundle dependencies resolved correctly

---

## Open Questions

1. **Pluralization:** Use simple rules (add 's') or library (pluralize npm package)?
2. **Type system:** Support custom types beyond primitives?
3. **Validation:** Generate Bean Validation annotations or custom validators?
4. **Error handling:** Generate exception handlers or leave to user?
5. **Testing:** Generate unit tests or just production code?
6. **Documentation:** Generate Javadoc/KDoc from spec descriptions?
7. **Versioning:** How to handle breaking changes in bundle format?
8. **Extensibility:** Custom convention engines per project?

---

## Next Steps

1. **Review this document** - validate approach with team
2. **Spike Phase 1** - build context interfaces for one aggregate
3. **Spike Phase 2** - implement HTTP convention engine
4. **Validate** - generate one file (Controller) end-to-end
5. **Iterate** - expand to full aggregate, then multiple aggregates
6. **Document** - write bundle authoring guide based on learnings

---

## Appendix: Example Enrichment Output

### Input Spec
```yaml
apiVersion: "1.0"
kind: ddd-complex
spec:
  package: io.pexa.gap.order
  aggregates:
    Order:
      attributes:
        - name: orderId
          type: uuid
          identity: true
        - name: name
          type: string
          required: true
        - name: status
          type: string
          required: true
          default: PENDING
      commands:
        - name: CreateOrder
          params: [name, status]
          emits: OrderCreated
        - name: UpdateOrderStatus
          params: [orderId, status]
          emits: OrderStatusUpdated
      queries:
        - name: GetOrder
          params: [orderId]
          returns: single
        - name: SearchOrders
          params: [status]
          returns: list
```

### Output Context (Excerpt)
```json
{
  "package": "io.pexa.gap.order",
  "aggregates": [
    {
      "name": "Order",
      "names": {
        "pascal": "Order",
        "camel": "order",
        "snake": "order",
        "kebab": "order",
        "plural": "orders",
        "pluralKebab": "orders"
      },
      "commands": [
        {
          "name": "CreateOrder",
          "names": { "pascal": "CreateOrder", "camel": "createOrder", "kebab": "create-order" },
          "http": {
            "method": "POST",
            "path": "/orders",
            "operationId": "createOrder",
            "statusCode": 201,
            "pathParams": [],
            "queryParams": [],
            "bodyParams": ["name", "status"]
          },
          "response": {
            "type": "entity",
            "returnType": "Order",
            "statusCode": 201
          },
          "authorization": {
            "annotation": "@Authorise(action = Action.CREATE, resource = \"Order\")",
            "action": "CREATE",
            "resourceExpression": "Order"
          },
          "methodSignature": "fun createOrder(name: String, status: String): Order",
          "imports": ["io.pexa.gap.order.domain.Order", "io.pexa.gap.order.domain.OrderCreated"]
        },
        {
          "name": "UpdateOrderStatus",
          "names": { "pascal": "UpdateOrderStatus", "camel": "updateOrderStatus", "kebab": "update-order-status" },
          "http": {
            "method": "PUT",
            "path": "/orders/{orderId}",
            "operationId": "updateOrderStatus",
            "statusCode": 200,
            "pathParams": ["orderId"],
            "bodyParams": ["status"]
          },
          "response": {
            "type": "entity",
            "returnType": "Order",
            "statusCode": 200
          },
          "lookup": {
            "required": true,
            "field": "orderId",
            "expression": "repository.findById(orderId).orElseThrow { NotFoundException(\"Order not found\") }"
          },
          "authorization": {
            "annotation": "@Authorise(action = Action.UPDATE, resource = \"Order\", id = \"#orderId\")",
            "action": "UPDATE",
            "resourceExpression": "Order",
            "idExpression": "#orderId"
          },
          "methodSignature": "fun updateOrderStatus(orderId: UUID, status: String): Order"
        }
      ],
      "queries": [
        {
          "name": "GetOrder",
          "names": { "pascal": "GetOrder", "camel": "getOrder", "kebab": "get-order" },
          "http": {
            "method": "GET",
            "path": "/orders/{orderId}",
            "operationId": "getOrder",
            "statusCode": 200,
            "pathParams": ["orderId"]
          },
          "response": {
            "type": "single",
            "returnType": "Order"
          },
          "authorization": {
            "annotation": "@Authorise(action = Action.READ, resource = \"Order\", id = \"#orderId\")",
            "action": "READ",
            "idExpression": "#orderId"
          },
          "repositoryCall": "repository.findById(orderId)",
          "methodSignature": "fun getOrder(orderId: UUID): Optional<Order>"
        }
      ]
    }
  ]
}
```

This context makes templates trivial - just interpolate pre-computed values.
