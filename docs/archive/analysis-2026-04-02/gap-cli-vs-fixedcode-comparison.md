# Gap-CLI vs FixedCode: Side-by-Side Comparison

## The Transformation

### Gap-CLI Approach (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                    Workspace YAML                           │
│  - Aggregates defined                                       │
│  - Commands, queries, events                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Go Enrichment (enrich.go)                      │
│  - 100+ fields per aggregate                                │
│  - Naming variants                                          │
│  - Type mappings                                            │
│  - HTTP metadata                                            │
│  - Authorization metadata                                   │
│  - BUT: Still provides "strategies" not "values"            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Go Templates (.tmpl)                           │
│  - Still have conditional logic                             │
│  - {{- if eq $command.LookupStrategy.Strategy "noLookup" }} │
│  - {{- if $command.HasNestedEntities }}                     │
│  - Templates choose strategies                              │
│  - 446 lines with 20+ conditionals                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Generate Per Aggregate                         │
│  - Each aggregate generated in isolation                    │
│  - Shared code duplicated                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Merge Phase                                    │
│  - Stitch aggregates together                               │
│  - Workarounds for cross-cutting concerns                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Generated Code                                 │
└─────────────────────────────────────────────────────────────┘
```

**Problems:**
- Templates still have logic despite rich context
- Generate-then-merge creates workarounds
- Context provides strategies, not ready-to-use values
- Hard to maintain and extend

---

### FixedCode Approach (New)

```
┌─────────────────────────────────────────────────────────────┐
│                    Minimal YAML Spec                        │
│  commands:                                                  │
│    - name: CreateOrder                                      │
│      params: [name, status]                                 │
│      emits: OrderCreated                                    │
│  (Convention derives everything else)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Convention Engines (TypeScript)                │
│                                                             │
│  HTTP Engine:                                               │
│    CreateOrder → POST /orders, 201                          │
│                                                             │
│  Response Engine:                                           │
│    Create* → returns entity, status 201                     │
│                                                             │
│  Authorization Engine:                                      │
│    Create* → @Authorise(action=CREATE, resource="Order")    │
│                                                             │
│  Lookup Engine:                                             │
│    Create* → no lookup required                             │
│                                                             │
│  Result: Ready-to-use values, not strategies                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Fully Enriched Context                         │
│  {                                                          │
│    http: {                                                  │
│      method: "POST",                                        │
│      path: "/orders",                                       │
│      statusCode: 201                                        │
│    },                                                       │
│    authorization: {                                         │
│      annotation: "@Authorise(action=CREATE, ...)"           │
│    },                                                       │
│    methodSignature: "fun createOrder(...): Order",          │
│    returnStatement: "ResponseEntity.status(201).body(...)"  │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Trivial Templates (Handlebars)                 │
│  @{{http.method}}Mapping("{{http.path}}")                   │
│  {{authorization.annotation}}                               │
│  {{methodSignature}} {                                      │
│      {{returnStatement}}                                    │
│  }                                                          │
│  (No conditionals, just interpolation)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Holistic Generation                            │
│  - Full spec processed at once                              │
│  - Shared code generated once                               │
│  - No merge phase needed                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Generated Code                                 │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Templates are trivial (no logic)
- Convention over configuration (minimal spec)
- Holistic generation (no merge phase)
- Easy to maintain and extend
- TypeScript ecosystem (large pool of bundle authors)

---

## Template Complexity Comparison

### Gap-CLI Template (ApiDelegateImpl.kt.tmpl)

```go
{{range .Endpoints}}
{{if $.HasPathParameters .}}
    override fun {{.Name}}(
{{- range $field, $def := .ProcessedFields}}
        {{$field}}: {{$def.KotlinType}}
{{- end}}
    ): ResponseEntity<Any> {
        try {
            val response = {{$.ResourceConfig.BeanName}}.{{.ClientCall.Operation}}(
{{- range $field, $def := .ProcessedFields}}
                {{$field}}
{{- end}}
            ).execute()
            if (!response.isSuccessful) {
                throw RuntimeException("{{.ClientCall.Operation}} failed: ${response.errorBody()?.string()}")
            }
            return ResponseEntity.ok(response.body()!!)
        } catch (e: Exception) {
            throw RuntimeException("BFF mapping failed for {{.Name}}: ${e.message}", e)
        }
    }
{{else if $.IsSearchEndpoint .}}
    override fun {{.Name}}({{camel .Name}}Request: {{title .Name}}Request): ResponseEntity<Any> {
        try {
            val response = {{$.ResourceConfig.BeanName}}.{{.ClientCall.Operation}}(
                page = {{camel .Name}}Request.page,
                size = {{camel .Name}}Request.propertySize,
                sort = {{camel .Name}}Request.sort,
                direction = {{camel .Name}}Request.direction
            ).execute()
            if (!response.isSuccessful) {
                throw RuntimeException("{{.ClientCall.Operation}} failed: ${response.errorBody()?.string()}")
            }
            return ResponseEntity.ok(response.body()!!)
        } catch (e: Exception) {
            throw RuntimeException("BFF mapping failed for {{.Name}}: ${e.message}", e)
        }
    }
{{else if $.NeedsMapper .}}
    // ... more conditionals
{{else}}
    // ... even more conditionals
{{/if}}
{{/end}}
```

**Issues:**
- Multiple nested conditionals
- Logic in template (HasPathParameters, IsSearchEndpoint, NeedsMapper)
- Hard to read and maintain
- Difficult to test

---

### FixedCode Template (Controller.kt.hbs)

```handlebars
{{#each commands}}

@{{http.method}}Mapping("{{http.path}}")
{{authorization.annotation}}
{{methodSignature}} {
    {{#if lookup.required}}
    val entity = {{lookup.expression}}
    {{/if}}
    val result = commandService.{{names.camel}}({{#each params}}{{name}}{{#unless @last}}, {{/unless}}{{/each}})
    {{#if (eq response.type "void")}}
    return ResponseEntity.noContent().build()
    {{else}}
    return ResponseEntity.status({{http.statusCode}}).body(result)
    {{/if}}
}

{{/each}}
```

**Benefits:**
- Minimal conditionals (only for optional sections)
- All logic in enrichment
- Easy to read and maintain
- Easy to test (test enrichment, not template)

---

## Context Comparison

### Gap-CLI Context (Partial)

```go
type EntityMetadata struct {
    Name                string
    NamePascal          string
    NameCamel           string
    NameSnake           string
    NameKebab           string
    
    // Commands with strategies (template chooses)
    Commands []CommandMetadata
}

type CommandMetadata struct {
    Name            string
    HTTPMethod      string
    Path            string
    
    // Strategy, not ready-to-use value
    LookupStrategy  LookupStrategy
    
    // Template must check this and build annotation
    AuthoriseAction string
    AuthoriseId     string
    
    // Template must check this and choose return statement
    ReturnType      string
    StatusCode      int
}
```

**Problem:** Template must interpret strategies and build code.

---

### FixedCode Context (Proposed)

```typescript
interface CommandContext {
    name: string;
    names: {
        pascal: string;
        camel: string;
        kebab: string;
    };
    
    http: {
        method: 'POST' | 'PUT' | 'DELETE';
        path: string;              // "/orders"
        statusCode: number;        // 201
    };
    
    // Ready-to-use annotation string
    authorization: {
        annotation: string;        // "@Authorise(action = CREATE, resource = \"Order\")"
    };
    
    // Ready-to-use expression
    lookup: {
        required: boolean;
        expression: string;        // "repository.findById(id).orElseThrow(...)"
    };
    
    // Ready-to-use signature
    methodSignature: string;       // "fun createOrder(name: String, status: String): Order"
    
    // Ready-to-use return statement
    returnStatement: string;       // "return ResponseEntity.status(201).body(result)"
}
```

**Benefit:** Template just interpolates ready-to-use values.

---

## Spec Comparison
## Spec Comparison

### Gap-CLI Spec (Compact Inline Syntax)

```yaml
version: "2.0"
boundedContext: "order"
rootIDField: "orderId"

aggregates:
  Order:
    attributes:
      orderId!: uuid
      name!: string
      status!: string
      completedAt: datetime
      metadata: object
    
    commands:
      - CreateOrder(name!, status!) -> OrderCreated
      - UpdateOrderStatus(orderId!, status!) -> OrderStatusUpdated
    
    queries:
      - GetOrder(orderId!) -> Order
      - ListOrders(status!) -> OrderList
    
    events:
      OrderCreated:
        - orderId!
        - name!
      OrderStatusUpdated:
        - orderId!
        - status!
```

---

### FixedCode Spec (Explicit YAML Structure)

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

**Key Difference:** Gap-cli uses compact inline syntax `CreateOrder(name!, status!) -> OrderCreated`, while FixedCode uses explicit YAML structure. **Both are minimal** - neither specifies HTTP method, path, status codes, or authorization. Both derive everything via conventions.


---

## Convention Examples

### HTTP Conventions

| Spec | Gap-CLI | FixedCode |
|------|---------|-----------|
| `CreateOrder` | Must specify method/path | Derives: POST /orders, 201 |
| `UpdateOrderStatus(orderId)` | Must specify method/path | Derives: PUT /orders/{orderId}, 200 |
| `DeleteOrder(orderId)` | Must specify method/path | Derives: DELETE /orders/{orderId}, 204 |
| `GetOrder(orderId)` | Must specify method/path | Derives: GET /orders/{orderId}, 200 |
| `SearchOrders` | Must specify method/path | Derives: GET /orders, 200 |

### Authorization Conventions

| Command | Gap-CLI | FixedCode |
|---------|---------|-----------|
| `CreateOrder` | Must specify | Derives: `@Authorise(action=CREATE, resource="Order")` |
| `UpdateOrder(id)` | Must specify | Derives: `@Authorise(action=UPDATE, resource="Order", id="#id")` |
| `DeleteOrder(id)` | Must specify | Derives: `@Authorise(action=DELETE, resource="Order", id="#id")` |
| `GetOrder(id)` | Must specify | Derives: `@Authorise(action=READ, resource="Order", id="#id")` |

### Response Conventions

| Command | Gap-CLI | FixedCode |
|---------|---------|-----------|
| `CreateOrder` | Must specify return type | Derives: returns Order, status 201 |
| `UpdateOrder` | Must specify return type | Derives: returns Order, status 200 |
| `DeleteOrder` | Must specify return type | Derives: returns void, status 204 |

---

## Architecture Comparison

### Gap-CLI Architecture

```
Spec → Enrich (Go) → Templates (Go) → Generate Per Aggregate → Merge → Output
       ↓                ↓
   100+ fields    Still has logic
```

**Issues:**
- Generate-then-merge creates workarounds
- Templates have logic despite rich context
- Hard to extend (Go, monolithic)

---

### FixedCode Architecture

```
Spec → Convention Engines → Fully Enriched Context → Trivial Templates → Output
       ↓                     ↓                         ↓
   Derive everything    Ready-to-use values      Just interpolation
```

**Benefits:**
- Holistic generation (no merge)
- Templates are trivial
- Easy to extend (TypeScript, pluggable bundles)

---

## Testing Comparison

### Gap-CLI Testing

```go
// Test template output (brittle)
func TestApiDelegate(t *testing.T) {
    output := generateApiDelegate(spec)
    assert.Contains(t, output, "override fun createOrder")
    assert.Contains(t, output, "@PostMapping")
}
```

**Problem:** Testing generated code is brittle. If template changes, tests break.

---

### FixedCode Testing

```typescript
// Test enrichment (robust)
describe('HTTP Convention Engine', () => {
  it('derives POST /orders with 201 for CreateOrder', () => {
    const result = deriveHttpMetadata({ name: 'CreateOrder', ... });
    expect(result.method).toBe('POST');
    expect(result.path).toBe('/orders');
    expect(result.statusCode).toBe(201);
  });
});

// Test context (robust)
describe('Enrichment', () => {
  it('enriches CreateOrder command fully', () => {
    const context = enrich(spec);
    const cmd = context.aggregates[0].commands[0];
    expect(cmd.http.method).toBe('POST');
    expect(cmd.authorization.annotation).toContain('@Authorise');
  });
});

// Snapshot test template output (optional)
describe('Template', () => {
  it('generates correct controller', () => {
    const output = render('Controller.kt.hbs', context);
    expect(output).toMatchSnapshot();
  });
});
```

**Benefit:** Test the enrichment logic, not the template output. More robust.

---

## Migration Path

### From Gap-CLI to FixedCode

1. **Pick a reference aggregate** from gap-cli (e.g., Order)
2. **Run gap-cli with debug** to see enriched context
3. **Implement FixedCode enrichment** to produce equivalent context
4. **Generate with both** and diff the output
5. **Iterate** until output matches
6. **Simplify** - remove unnecessary complexity gap-cli accumulated

---

## Summary

| Aspect | Gap-CLI | FixedCode |
|--------|---------|-----------|
| **Spec** | Verbose | Minimal (conventions) |
| **Enrichment** | 100+ fields, strategies | 100+ fields, ready-to-use values |
| **Templates** | Complex logic | Trivial interpolation |
| **Generation** | Per-aggregate + merge | Holistic |
| **Language** | Go | TypeScript |
| **Distribution** | Monolithic | Pluggable bundles (npm) |
| **Testing** | Template output | Enrichment logic |
| **Maintainability** | Hard | Easy |
| **Extensibility** | Hard | Easy |

---

## The Key Insight

**Gap-CLI provides strategies. FixedCode provides values.**

Gap-CLI:
```go
LookupStrategy: { Strategy: "byId", Field: "orderId" }
```
Template must interpret and build: `repository.findById(orderId).orElseThrow(...)`

FixedCode:
```typescript
lookup: {
  required: true,
  expression: "repository.findById(orderId).orElseThrow { NotFoundException(\"Order not found\") }"
}
```
Template just interpolates: `{{lookup.expression}}`

**This is the fundamental difference.**
