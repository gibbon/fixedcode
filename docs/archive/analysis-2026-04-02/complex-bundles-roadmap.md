# Complex Bundles - Implementation Roadmap

## Quick Start Guide

This is the tactical implementation plan for building complex DDD bundles in fixedcode. Read `complex-bundles-approach.md` for the full analysis.

---

## Week 1: Foundation

### Day 1-2: Context Model Design

**Goal:** Define TypeScript interfaces for fully-enriched context

```typescript
// bundles/ddd-complex/src/types.ts

export interface DddComplexContext {
  package: string;
  boundedContext: string;
  aggregates: AggregateContext[];
  imports: ImportContext;
}

export interface AggregateContext {
  name: string;
  names: NamingVariants;
  attributes: AttributeContext[];
  identityField: AttributeContext;
  commands: CommandContext[];
  queries: QueryContext[];
  events: EventContext[];
  imports: string[];
}

export interface CommandContext {
  name: string;
  names: NamingVariants;
  http: HttpMetadata;
  response: ResponseStrategy;
  lookup: LookupStrategy;
  authorization: AuthMetadata;
  validation: ValidationMetadata;
  emits: EventEmission;
  params: ParamContext[];
  methodSignature: string;
  parameterAssignments: string[];
  imports: string[];
}

export interface QueryContext {
  name: string;
  names: NamingVariants;
  http: HttpMetadata;
  response: ResponseStrategy;
  authorization: AuthMetadata;
  filters: FilterContext[];
  pagination: PaginationMetadata;
  methodSignature: string;
  repositoryCall: string;
  imports: string[];
}

// ... (see full definitions in approach doc)
```

**Tasks:**
- [ ] Create `bundles/ddd-complex/src/types.ts` with all interfaces
- [ ] Document each field with JSDoc comments
- [ ] Create example context JSON for reference
- [ ] Write validation tests for context shape

**Deliverable:** Fully typed context model with documentation

---

### Day 3-4: Convention Engines

**Goal:** Build the core convention derivation logic

#### 1. HTTP Convention Engine

```typescript
// bundles/ddd-complex/src/conventions/http.ts

export function deriveHttpMetadata(
  operation: Command | Query,
  aggregate: AggregateContext
): HttpMetadata {
  const pattern = detectPattern(operation.name);
  
  return {
    method: getHttpMethod(pattern),
    path: buildPath(pattern, aggregate, operation),
    operationId: operation.names.camel,
    statusCode: getStatusCode(pattern),
    pathParams: extractPathParams(operation.params),
    queryParams: extractQueryParams(operation.params),
    bodyParams: extractBodyParams(operation.params),
  };
}

function detectPattern(name: string): OperationPattern {
  if (name.startsWith('Create')) return 'Create';
  if (name.startsWith('Update')) return 'Update';
  if (name.startsWith('Delete')) return 'Delete';
  if (name.startsWith('Archive')) return 'Archive';
  if (name.startsWith('Get')) return 'Get';
  if (name.startsWith('Search') || name.startsWith('List')) return 'Search';
  if (name.includes('By')) return 'FindBy';
  return 'Custom';
}

const HTTP_METHOD_MAP: Record<OperationPattern, HttpMethod> = {
  Create: 'POST',
  Update: 'PUT',
  Delete: 'DELETE',
  Archive: 'PUT',
  Get: 'GET',
  Search: 'GET',
  FindBy: 'GET',
  Custom: 'POST',
};

const STATUS_CODE_MAP: Record<OperationPattern, number> = {
  Create: 201,
  Update: 200,
  Delete: 204,
  Archive: 200,
  Get: 200,
  Search: 200,
  FindBy: 200,
  Custom: 200,
};

function buildPath(
  pattern: OperationPattern,
  aggregate: AggregateContext,
  operation: Command | Query
): string {
  const base = `/${aggregate.names.pluralKebab}`;
  
  if (pattern === 'Create' || pattern === 'Search') {
    return base;
  }
  
  if (pattern === 'Get' || pattern === 'Update' || pattern === 'Delete') {
    const idParam = operation.params.find(p => p.isIdentity);
    return idParam ? `${base}/{${idParam.name}}` : base;
  }
  
  if (pattern === 'Archive') {
    const idParam = operation.params.find(p => p.isIdentity);
    return `${base}/{${idParam.name}}/archive`;
  }
  
  return base;
}
```

**Tests:**
```typescript
describe('HTTP Convention Engine', () => {
  it('derives POST /orders with 201 for CreateOrder', () => {
    const result = deriveHttpMetadata(
      { name: 'CreateOrder', params: [...] },
      { names: { pluralKebab: 'orders' } }
    );
    expect(result.method).toBe('POST');
    expect(result.path).toBe('/orders');
    expect(result.statusCode).toBe(201);
  });
  
  it('derives PUT /orders/{orderId} with 200 for UpdateOrder', () => {
    const result = deriveHttpMetadata(
      { name: 'UpdateOrder', params: [{ name: 'orderId', isIdentity: true }] },
      { names: { pluralKebab: 'orders' } }
    );
    expect(result.method).toBe('PUT');
    expect(result.path).toBe('/orders/{orderId}');
    expect(result.statusCode).toBe(200);
  });
});
```

**Tasks:**
- [ ] Implement HTTP convention engine
- [ ] Write 20+ test cases covering all patterns
- [ ] Handle edge cases (no ID param, custom paths)
- [ ] Document conventions in README

---

#### 2. Response Strategy Engine

```typescript
// bundles/ddd-complex/src/conventions/response.ts

export function deriveResponseStrategy(
  operation: Command | Query,
  pattern: OperationPattern
): ResponseStrategy {
  if (operation.type === 'query') {
    return {
      type: operation.returns === 'single' ? 'single' : 'list',
      returnType: operation.returns === 'single' 
        ? operation.aggregate.names.pascal
        : `List<${operation.aggregate.names.pascal}>`,
      statusCode: 200,
      wrapInResponseEntity: true,
      includeEtag: operation.returns === 'single',
    };
  }
  
  // Command response strategies
  if (pattern === 'Create') {
    return {
      type: 'entity',
      returnType: operation.aggregate.names.pascal,
      statusCode: 201,
      wrapInResponseEntity: true,
      includeEtag: true,
    };
  }
  
  if (pattern === 'Delete') {
    return {
      type: 'void',
      returnType: 'void',
      statusCode: 204,
      wrapInResponseEntity: false,
      includeEtag: false,
    };
  }
  
  // Update, Archive, etc.
  return {
    type: 'entity',
    returnType: operation.aggregate.names.pascal,
    statusCode: 200,
    wrapInResponseEntity: true,
    includeEtag: true,
  };
}
```

**Tasks:**
- [ ] Implement response strategy engine
- [ ] Test all command patterns
- [ ] Test all query patterns
- [ ] Handle custom return types

---

#### 3. Authorization Engine

```typescript
// bundles/ddd-complex/src/conventions/authorization.ts

export function deriveAuthorization(
  operation: Command | Query,
  pattern: OperationPattern,
  aggregate: AggregateContext
): AuthMetadata {
  const action = getAction(pattern);
  const idParam = operation.params.find(p => p.isIdentity);
  
  return {
    action,
    annotation: buildAnnotation(action, aggregate.name, idParam?.name),
    resourceExpression: aggregate.name,
    idExpression: idParam ? `#${idParam.name}` : undefined,
  };
}

function getAction(pattern: OperationPattern): AuthAction {
  const actionMap: Record<OperationPattern, AuthAction> = {
    Create: 'CREATE',
    Update: 'UPDATE',
    Delete: 'DELETE',
    Archive: 'UPDATE',
    Get: 'READ',
    Search: 'READ',
    FindBy: 'READ',
    Custom: 'EXECUTE',
  };
  return actionMap[pattern];
}

function buildAnnotation(
  action: AuthAction,
  resource: string,
  idParam?: string
): string {
  const parts = [
    `action = Action.${action}`,
    `resource = "${resource}"`,
  ];
  
  if (idParam) {
    parts.push(`id = "#${idParam}"`);
  }
  
  return `@Authorise(${parts.join(', ')})`;
}
```

**Tasks:**
- [ ] Implement authorization engine
- [ ] Test all action mappings
- [ ] Test annotation generation
- [ ] Support custom authorization rules

---

#### 4. Lookup Strategy Engine

```typescript
// bundles/ddd-complex/src/conventions/lookup.ts

export function deriveLookupStrategy(
  command: Command,
  pattern: OperationPattern,
  aggregate: AggregateContext
): LookupStrategy {
  // Create commands don't need lookup
  if (pattern === 'Create') {
    return {
      required: false,
      field: '',
      expression: '',
    };
  }
  
  // Update/Delete need to fetch entity first
  if (pattern === 'Update' || pattern === 'Delete' || pattern === 'Archive') {
    const idParam = command.params.find(p => p.isIdentity);
    if (!idParam) {
      throw new Error(`${command.name} requires an identity parameter`);
    }
    
    return {
      required: true,
      field: idParam.name,
      expression: `repository.findById(${idParam.name}).orElseThrow { NotFoundException("${aggregate.name} not found") }`,
    };
  }
  
  return {
    required: false,
    field: '',
    expression: '',
  };
}
```

**Tasks:**
- [ ] Implement lookup strategy engine
- [ ] Test all command patterns
- [ ] Handle custom lookup logic
- [ ] Generate proper exception handling

---

### Day 5: Enrichment Pipeline

**Goal:** Compose all convention engines into full enrichment

```typescript
// bundles/ddd-complex/src/enrich/index.ts

import { pipe } from '../utils/pipe';
import { parseAggregates } from './parse';
import { normalizeNames } from './names';
import { resolveTypes } from './types';
import { enrichCommands } from './commands';
import { enrichQueries } from './queries';
import { resolveImports } from './imports';

export const enrich = pipe(
  parseAggregates,
  normalizeNames,
  resolveTypes,
  enrichCommands,
  enrichQueries,
  resolveImports,
);

// bundles/ddd-complex/src/enrich/commands.ts

import { deriveHttpMetadata } from '../conventions/http';
import { deriveResponseStrategy } from '../conventions/response';
import { deriveAuthorization } from '../conventions/authorization';
import { deriveLookupStrategy } from '../conventions/lookup';

export function enrichCommands(context: DddComplexContext): DddComplexContext {
  return {
    ...context,
    aggregates: context.aggregates.map(agg => ({
      ...agg,
      commands: agg.commands.map(cmd => {
        const pattern = detectPattern(cmd.name);
        
        return {
          ...cmd,
          http: deriveHttpMetadata(cmd, agg),
          response: deriveResponseStrategy(cmd, pattern),
          authorization: deriveAuthorization(cmd, pattern, agg),
          lookup: deriveLookupStrategy(cmd, pattern, agg),
          methodSignature: generateMethodSignature(cmd),
          parameterAssignments: generateParameterAssignments(cmd),
          imports: resolveCommandImports(cmd, agg),
        };
      }),
    })),
  };
}
```

**Tasks:**
- [ ] Implement pipe utility
- [ ] Implement each enrichment step
- [ ] Test pipeline with full spec
- [ ] Verify context shape matches types

---

## Week 2: Templates & Testing

### Day 6-7: Template Implementation

**Goal:** Rewrite templates to use enriched context

#### Controller Template

```handlebars
{{! bundles/ddd-complex/templates/{{#each aggregates}}/api/{{names.pascal}}Controller.kt.hbs }}
package {{../package}}.api

{{#each imports}}
import {{this}}
{{/each}}

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/{{names.pluralKebab}}")
class {{names.pascal}}Controller(
    private val commandService: {{names.pascal}}CommandService,
    private val queryService: {{names.pascal}}QueryService
) {
    {{#each queries}}
    
    @GetMapping("{{http.path}}")
    {{authorization.annotation}}
    {{methodSignature}} {
        {{#if (eq response.type "single")}}
        return {{repositoryCall}}
            .map { ResponseEntity.ok(it) }
            .orElse(ResponseEntity.notFound().build())
        {{else}}
        return ResponseEntity.ok({{repositoryCall}})
        {{/if}}
    }
    {{/each}}
    
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
}
```

**Tasks:**
- [ ] Implement Controller template
- [ ] Implement CommandService template
- [ ] Implement QueryService template
- [ ] Implement Repository template
- [ ] Implement Entity template
- [ ] Implement Events template
- [ ] Test each template independently

---

### Day 8-9: Integration Testing

**Goal:** Generate complete service and verify compilation

```typescript
// bundles/ddd-complex/test/integration.test.ts

describe('Full Pipeline', () => {
  it('generates complete Order service', async () => {
    const spec = {
      apiVersion: '1.0',
      kind: 'ddd-complex',
      spec: {
        package: 'io.pexa.gap.order',
        aggregates: {
          Order: {
            attributes: [
              { name: 'orderId', type: 'uuid', identity: true },
              { name: 'name', type: 'string', required: true },
              { name: 'status', type: 'string', required: true, default: 'PENDING' },
            ],
            commands: [
              { name: 'CreateOrder', params: ['name', 'status'], emits: 'OrderCreated' },
              { name: 'UpdateOrderStatus', params: ['orderId', 'status'], emits: 'OrderStatusUpdated' },
            ],
            queries: [
              { name: 'GetOrder', params: ['orderId'], returns: 'single' },
              { name: 'SearchOrders', params: ['status'], returns: 'list' },
            ],
          },
        },
      },
    };
    
    await generate(spec, './build/order-service');
    
    // Verify files exist
    expect(fs.existsSync('./build/order-service/api/OrderController.kt')).toBe(true);
    expect(fs.existsSync('./build/order-service/application/OrderCommandService.kt')).toBe(true);
    expect(fs.existsSync('./build/order-service/domain/Order.kt')).toBe(true);
    
    // Verify compilation
    const result = await exec('kotlinc ./build/order-service/**/*.kt');
    expect(result.exitCode).toBe(0);
  });
});
```

**Tasks:**
- [ ] Write integration tests for 3+ aggregates
- [ ] Test with nested entities
- [ ] Test with complex commands
- [ ] Verify Kotlin compilation
- [ ] Compare output with gap-cli

---

### Day 10: Refinement

**Goal:** Fix issues found in testing

**Tasks:**
- [ ] Fix template bugs
- [ ] Fix enrichment bugs
- [ ] Improve error messages
- [ ] Add validation for invalid specs
- [ ] Document known limitations

---

## Week 3: Advanced Features

### Day 11-12: Database Migrations

**Goal:** Generate Flyway SQL from aggregates

```typescript
// bundles/ddd-complex/src/migrations/generator.ts

export function generateMigration(aggregate: AggregateContext): string {
  const tableName = aggregate.names.snake;
  
  const columns = aggregate.attributes.map(attr => {
    const sqlType = mapTypeToSql(attr.type);
    const nullable = attr.isRequired ? 'NOT NULL' : 'NULL';
    const defaultClause = attr.defaultValue ? `DEFAULT ${attr.defaultValue}` : '';
    
    return `  ${attr.name} ${sqlType} ${nullable} ${defaultClause}`.trim();
  });
  
  const primaryKey = aggregate.identityField.name;
  
  return `
CREATE TABLE ${tableName} (
${columns.join(',\n')},
  PRIMARY KEY (${primaryKey})
);

CREATE INDEX idx_${tableName}_${primaryKey} ON ${tableName}(${primaryKey});
`.trim();
}

function mapTypeToSql(type: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'UUID',
    string: 'VARCHAR(255)',
    int: 'INTEGER',
    long: 'BIGINT',
    boolean: 'BOOLEAN',
    decimal: 'DECIMAL(19,2)',
    date: 'DATE',
    datetime: 'TIMESTAMP',
    object: 'JSONB',
  };
  return typeMap[type] || 'TEXT';
}
```

**Tasks:**
- [ ] Implement migration generator
- [ ] Generate CREATE TABLE statements
- [ ] Generate indexes
- [ ] Generate foreign keys for nested entities
- [ ] Test with PostgreSQL

---

### Day 13-14: OpenAPI Generation

**Goal:** Generate OpenAPI 3.0 spec from domain model

```typescript
// bundles/ddd-complex/src/openapi/generator.ts

export function generateOpenApi(context: DddComplexContext): OpenApiSpec {
  return {
    openapi: '3.0.0',
    info: {
      title: `${context.boundedContext} API`,
      version: '1.0.0',
    },
    paths: generatePaths(context),
    components: {
      schemas: generateSchemas(context),
    },
  };
}

function generatePaths(context: DddComplexContext): Record<string, PathItem> {
  const paths: Record<string, PathItem> = {};
  
  for (const agg of context.aggregates) {
    for (const query of agg.queries) {
      const path = query.http.path;
      paths[path] = paths[path] || {};
      paths[path][query.http.method.toLowerCase()] = {
        operationId: query.http.operationId,
        parameters: generateParameters(query.http.pathParams, query.http.queryParams),
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${query.response.returnType}` },
              },
            },
          },
        },
      };
    }
    
    for (const cmd of agg.commands) {
      const path = cmd.http.path;
      paths[path] = paths[path] || {};
      paths[path][cmd.http.method.toLowerCase()] = {
        operationId: cmd.http.operationId,
        parameters: generateParameters(cmd.http.pathParams, cmd.http.queryParams),
        requestBody: cmd.http.bodyParams.length > 0 ? {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${cmd.names.pascal}Request` },
            },
          },
        } : undefined,
        responses: {
          [cmd.http.statusCode.toString()]: {
            description: 'Success',
            content: cmd.response.type !== 'void' ? {
              'application/json': {
                schema: { $ref: `#/components/schemas/${cmd.response.returnType}` },
              },
            } : undefined,
          },
        },
      };
    }
  }
  
  return paths;
}
```

**Tasks:**
- [ ] Implement OpenAPI generator
- [ ] Generate paths from operations
- [ ] Generate schemas from aggregates
- [ ] Validate with OpenAPI validator
- [ ] Test with Swagger UI

---

## Week 4: Polish & Documentation

### Day 15-16: Error Handling & Validation

**Tasks:**
- [ ] Add spec validation (required fields, valid types)
- [ ] Improve error messages (show line numbers, suggestions)
- [ ] Add warnings for conventions violations
- [ ] Test error cases

---

### Day 17-18: Documentation

**Tasks:**
- [ ] Write bundle authoring guide
- [ ] Document all conventions
- [ ] Create example specs
- [ ] Write migration guide from gap-cli
- [ ] Record demo video

---

### Day 19-20: Bundle Composition (Optional)

**Goal:** Support composing multiple bundles

**Approach:**
1. Base bundle: shared infrastructure (config, security, logging)
2. Domain bundle: aggregates, commands, queries
3. API bundle: REST controllers
4. Persistence bundle: repositories, migrations

**Tasks:**
- [ ] Design bundle composition mechanism
- [ ] Implement bundle dependencies
- [ ] Test composing 3+ bundles
- [ ] Document composition patterns

---

## Success Checklist

### Minimum Viable Product (Week 2)
- [ ] Context model fully typed
- [ ] All convention engines implemented
- [ ] Templates generate valid Kotlin code
- [ ] Generated code compiles
- [ ] Integration tests pass

### Production Ready (Week 3)
- [ ] Database migrations generated
- [ ] OpenAPI spec generated
- [ ] Generated service runs in Spring Boot
- [ ] Output matches gap-cli (modulo formatting)

### Complete (Week 4)
- [ ] Error handling polished
- [ ] Documentation complete
- [ ] Migration guide written
- [ ] Bundle composition working (optional)

---

## Daily Workflow

1. **Morning:** Review previous day's work, plan today's tasks
2. **Code:** Implement one feature/engine
3. **Test:** Write tests for new code (aim for 80%+ coverage)
4. **Integrate:** Run full pipeline, fix issues
5. **Document:** Update README with new conventions
6. **Commit:** Push working code daily

---

## Getting Help

- **Stuck on conventions?** Look at gap-cli examples in `/home/gibbon/projects/gap-cli`
- **Template issues?** Check Handlebars docs, test with simple context first
- **Type errors?** Use TypeScript strict mode, fix incrementally
- **Integration failures?** Test each step independently, isolate the issue

---

## Next Action

**Start here:**
1. Create `bundles/ddd-complex/` directory
2. Copy `bundles/ddd-basic/` as starting point
3. Create `src/types.ts` with context interfaces
4. Implement HTTP convention engine
5. Write tests for HTTP conventions
6. Iterate!
