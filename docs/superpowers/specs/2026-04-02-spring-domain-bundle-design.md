# Spring Domain Bundle — Design Spec

**Date:** 2026-04-02  
**Status:** Draft  
**Scope:** `spring-library` completion + `spring-domain` new bundle

---

## What We're Building

Two fixedcode bundles that together generate a complete Spring/Kotlin DDD service from a minimal domain spec.

`spring-library` generates the project skeleton (build files, Docker, CI config). It is partially built — this spec completes it.

`spring-domain` generates all domain code: aggregates, entities, commands, queries, events, repositories, services, controllers, and tests. This is the complex bundle that proves fixedcode's convention-engine architecture works at real-world scale.

The key architectural principle: **all logic lives in TypeScript enrichment code, templates are trivial interpolation**. The enrichment pipeline derives HTTP routes, auth annotations, response types, and method signatures from command names and param conventions. Templates have no conditionals.

---

## Spec Format

One spec file per bounded context. Uses standard YAML — no custom DSL. The spec wraps the domain content in the standard fixedcode envelope:

```yaml
apiVersion: "1.0"
kind: spring-domain
metadata:
  name: workspace-service

spec:
  boundedContext: Workspace
  service:
    port: 8081
    package: io.example.workspace   # dot-notation, converted to io/example/workspace for paths

  aggregates:
    Workspace:
      attributes:
        workspaceId: uuid            # no ? = required
        status: string = Status
        completionDate?: date        # ? = optional
        labels?: object

      commands:
        - name: CreateWorkspace
          body: [transactionType, jurisdiction, completionDate?]
          emits: WorkspaceCreated

        - name: UpdateWorkspaceStatus  # workspaceId inferred as path param (identity field)
          body: [status]
          emits: WorkspaceStatusUpdated

        - name: GetWorkspacesBySubscriber
          path: [subscriberId]         # explicit override — not the identity field
          returns: WorkspaceList

      queries:
        - name: GetWorkspace           # workspaceId inferred as path param (identity field)
          returns: Workspace

        - name: SearchWorkspace        # no path/body params — page/size/sort/direction are standard
          returns: PagedWorkspaceList

        - name: FindWorkspacesByStatus # Find* → GET with explicit param
          query: [status]
          returns: WorkspaceList

      events:
        WorkspaceCreated:
          fields: [workspaceId, status, transactionType, jurisdiction]
        WorkspaceStatusUpdated:
          fields: [workspaceId, status]

      enumDefaults:
        Status: [CREATED, PREPARED, APPROVED, CLOSED]

      entities:
        Party:
          attributes:
            partyId: uuid
            workspaceId: uuid
            partyType: string = PartyType
            role: string = Role
            partyDetails: object
            representationDetails?: object

          commands:
            - name: AddParty            # workspaceId inferred as path param (parent aggregate identity)
              body: [partyType, role, partyDetails, representationDetails?]
              emits: PartyAdded

            - name: UpdateParty         # workspaceId + partyId inferred as path params
              body: [partyDetails?, representationDetails?]
              emits: PartyUpdated

          queries:
            - name: SearchParty
              returns: PagedPartyList

          events:                       # entity events — rendered into entity's own Events file
            PartyAdded:
              fields: [workspaceId, partyId, partyType, role]
            PartyUpdated:
              fields: [workspaceId, partyId]

          enumDefaults:
            PartyType: [INDIVIDUAL, COMPANY, TRUST]
            Role: [BUYER, SELLER, BORROWER, LENDER]

  remote_aggregates:                    # parsed and validated, no code generated (deferred)
    LodgementCase:
      topic: lodgement
      eventTypes: [LODGEMENT_CREATED, LODGEMENT_UPDATED]
      key: lodgementCaseId
      fields:
        lodgementCaseId: uuid
        workspaceId: uuid
        lodgementData: object
```

### Field notation

- `fieldName: type` — required field
- `fieldName?: type` — optional field  
- `fieldName: type = Default` — required field with a default value (enum or expression)

### Identity field

The first `uuid` attribute in an aggregate or entity is its identity field. Used by the convention engine to infer path params. Can be overridden explicitly with `path: [...]` on any command or query.

### Convention rules for param location

| Pattern | Path params (auto) | Body params | Query params |
|---|---|---|---|
| `Create*` | none | all listed `body` params | — |
| `Update*(id)` | aggregate identity field | all listed `body` params | — |
| `Delete*(id)` | aggregate identity field | none | — |
| `Archive*(id)` | aggregate identity field | none | — |
| `Add*(entity)` | parent aggregate identity | all listed `body` params | — |
| `Remove*(entity)` | parent + entity identity | none | — |
| `Get*(id)` | aggregate identity field | — | — |
| `Search*` / `List*` | none | — | standard pagination (page, size, sort, direction, filters) |
| `Find*` | explicit `query` or `path` required | — | listed `query` params |

`Find*` does not have a default convention — it requires explicit `query: [...]` or `path: [...]` to avoid ambiguity.

Explicit `path:`, `body:`, or `query:` on any command/query overrides the convention entirely.

### remote_aggregates

Parsed and validated by the enricher (schema checked, fields typed) but no files are generated for them. This makes the spec valid end-to-end without requiring implementation of the consumer code generation (deferred).

---

## Bundle Architecture

### spring-library

Handles project skeleton. No domain logic. Run once per service.

Generates: `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, `docker-compose.yml`, `Dockerfile`, `catalog-info.yaml`, `README.md`, CI config.

Already partially implemented — completion work is converting remaining templates to `.hbs` and wiring the enrichment for library-level fields (name, package, features flags).

Uses the existing engine contract (`enrich()` only, no `generateFiles` needed — all templates are one-to-one).

### spring-domain

Handles all domain code. Run whenever the spec changes.

```
bundles/spring-domain/
  src/
    index.ts              ← exports enrich() + generateFiles()
    enrich/
      spec.ts             ← parse YAML envelope, validate schema, extract spec body
      aggregate.ts        ← build aggregate enriched context
      entity.ts           ← build entity enriched context (same pipeline, nested)
      command.ts          ← derive HTTP, auth, response type, method signature
      query.ts            ← derive HTTP, response type
      event.ts            ← build event context
      naming.ts           ← naming variants (internal module, not a separate package)
      conventions.ts      ← convention engines (internal module)
  templates/
    src/
      main/kotlin/
        domain/
          shared/                              ← generated once per bounded context
            DomainEvent.kt.hbs
            ValidationResult.kt.hbs
          [aggregate]/                         ← generated once per aggregate
            Aggregate.kt.hbs
            AggregateEvents.kt.hbs             ← aggregate-level events only
            commands/
              [command].kt.hbs                 ← generated once per command
            entities/
              [entity].kt.hbs                  ← generated once per entity
              [entity]Events.kt.hbs            ← entity-level events
        application/
          [aggregate]/
            AggregateCommandService.kt.hbs
            AggregateQueryService.kt.hbs
        api/
          [aggregate]/
            AggregateApiDelegateImpl.kt.hbs
        infrastructure/
          [aggregate]/
            AggregateReadRepositoryImpl.kt.hbs
            AggregateWriteRepositoryImpl.kt.hbs
      test/kotlin/
        domain/[aggregate]/
          AggregateTest.kt.hbs
        application/[aggregate]/
          AggregateCommandServiceTest.kt.hbs
        api/[aggregate]/
          AggregateApiDelegateImplTest.kt.hbs
  schema.json
  package.json
```

### Template directory convention

Bracket names signal expansion scope — readable at a glance:
- `shared/` — generated once for the bounded context
- `[aggregate]/` — generated once per aggregate root
- `[command].kt.hbs` — generated once per command
- `[entity]/` — generated once per entity

The TypeScript `generateFiles()` function is the authoritative source of expansion logic. Bracket names are documentation, not engine magic.

### Events: aggregate vs entity

- **Aggregate events** (defined at aggregate level) → rendered into `AggregateEvents.kt.hbs`
- **Entity events** (defined inside an entity block) → rendered into `[entity]Events.kt.hbs`

Both files exist in the template directory. The `generateFiles` function expands them separately.

### Naming convention

`spring-domain` uses `camelCase` keys in the enriched context (e.g. `agg.nameKebab`, `cmd.http.method`). This differs from the existing `spring-library` bundle which uses `PascalCase` keys — that was a legacy decision. All new bundles use `camelCase`. The inconsistency is noted and accepted.

---

## Engine Contract Change

These are changes that must be made to the engine before the `spring-domain` bundle can be implemented.

### 1. Add `FileEntry` type to `engine/src/engine/types.ts`

```typescript
export interface FileEntry {
  template: string;   // path relative to bundle's templates/ directory
  output: string;     // path relative to the generation output directory
  ctx: Record<string, unknown>;  // context for this specific file
}
```

### 2. Add `generateFiles?` to the `Bundle` interface in `engine/src/engine/types.ts`

```typescript
export interface Bundle {
  kind: string;
  schema: object;
  enrich: (spec: unknown, metadata: SpecMetadata) => Context;
  generateFiles?: (ctx: Context) => FileEntry[];  // optional — bundles without it use existing render path
}
```

The engine uses `Context` (i.e. `Record<string, unknown>`) in the interface for compatibility. Within the bundle implementation, the function accepts and uses `EnrichedContext` — the cast is the bundle's responsibility.

### 3. Add `renderFile` to `engine/src/engine/render.ts`

A new single-file render function alongside the existing `renderTemplates`:

```typescript
export function renderFile(
  templateAbsPath: string,
  ctx: Record<string, unknown>
): string   // returns rendered content
```

### 4. Update `engine/src/engine/pipeline.ts`

After calling `enrich()`, branch on whether the bundle exports `generateFiles`:

```
if bundle.generateFiles exists:
  entries = bundle.generateFiles(context)
  for each entry:
    absTemplatePath = resolve(bundleDir, bundle.templates, entry.template)
    content = renderFile(absTemplatePath, entry.ctx)
    write content to resolve(outputDir, entry.output)
else:
  renderTemplates(...)   // existing behaviour, unchanged
```

Template paths in `FileEntry.template` are relative to the bundle's declared `templates` directory. The engine resolves them using `bundleDir` and `bundle.templates` (already available in `pipeline.ts`).

Existing bundles (`ddd-basic`, `crud-api`, `mcp-wrapper`, `spring-library`) are unaffected — they do not export `generateFiles`.

---

## Enrichment Pipeline

All convention logic lives in `src/enrich/` as internal modules.

### `naming.ts` — naming variants

```typescript
generateVariants('Workspace')
// → {
//     original: 'Workspace',
//     pascal: 'Workspace', camel: 'workspace',
//     snake: 'workspace', kebab: 'workspace',
//     plural: 'workspaces', pluralKebab: 'workspaces',
//     pluralPascal: 'Workspaces', pluralCamel: 'workspaces'
//   }
```

### `conventions.ts` — HTTP/auth/response derivation

| Pattern | HTTP Method | Path | Status | Auth Action |
|---|---|---|---|---|
| `Create*` | POST | `/workspaces` | 201 | CREATE |
| `Update*` | PUT | `/workspaces/{id}` | 200 | UPDATE |
| `Delete*` | DELETE | `/workspaces/{id}` | 204 | DELETE |
| `Archive*` | PUT | `/workspaces/{id}/archive` | 200 | UPDATE |
| `Add*` (entity) | POST | `/workspaces/{id}/parties` | 201 | CREATE |
| `Remove*` (entity) | DELETE | `/workspaces/{id}/parties/{partyId}` | 204 | DELETE |
| `Get*` | GET | `/workspaces/{id}` | 200 | READ |
| `Search*` / `List*` | GET | `/workspaces` | 200 | READ |
| `Find*` | GET | path from explicit override | 200 | READ |

### Enriched context shapes

```typescript
interface EnrichedContext {
  boundedContext: string;
  names: NamingVariants;          // variants of boundedContext name
  packagePath: string;            // 'io/example/workspace' — dots replaced with slashes
  service: { port: number };
  aggregates: EnrichedAggregate[];
}

interface EnrichedAggregate {
  name: string;
  names: NamingVariants;
  identityField: string;          // name of the first uuid attribute
  attributes: EnrichedAttribute[];
  commands: EnrichedCommand[];
  queries: EnrichedQuery[];
  events: EnrichedEvent[];
  entities: EnrichedEntity[];
  enumDefaults: Record<string, string[]>;
}

interface EnrichedEntity {
  name: string;
  names: NamingVariants;
  identityField: string;
  parentIdentityField: string;    // identity field of the owning aggregate
  attributes: EnrichedAttribute[];
  commands: EnrichedCommand[];
  queries: EnrichedQuery[];
  events: EnrichedEvent[];
  enumDefaults: Record<string, string[]>;
}

interface EnrichedCommand {
  name: string;
  names: NamingVariants;
  http: { method: string; path: string; statusCode: number };
  auth: { action: string; expression: string };
  response: { type: 'entity' | 'list' | 'paged' | 'void'; returnType: string };
  params: {
    path: EnrichedParam[];
    body: EnrichedParam[];
    query: EnrichedParam[];
  };
  emits?: string;
  methodSignature: string;
  imports: string[];
}

interface EnrichedQuery {
  name: string;
  names: NamingVariants;
  http: { method: string; path: string; statusCode: number };
  auth: { action: string; expression: string };
  response: { type: 'entity' | 'list' | 'paged'; returnType: string };
  params: {
    path: EnrichedParam[];
    query: EnrichedParam[];
  };
  methodSignature: string;
  imports: string[];
}

interface EnrichedParam {
  name: string;
  names: NamingVariants;
  type: string;                   // resolved Kotlin type (String, UUID, etc.)
  required: boolean;
  defaultValue?: string;
}

interface EnrichedEvent {
  name: string;
  names: NamingVariants;
  fields: EnrichedParam[];
}

interface EnrichedAttribute {
  name: string;
  names: NamingVariants;
  type: string;                   // resolved Kotlin type
  required: boolean;
  defaultValue?: string;
  isIdentity: boolean;
}
```

### `packagePath` derivation

`service.package: io.example.workspace` → `packagePath: 'io/example/workspace'`

Simple dot-to-slash replacement. Used in all output paths:
`src/main/kotlin/io/example/workspace/domain/shared/DomainEvent.kt`

---

## `generateFiles` Implementation

```typescript
export function generateFiles(ctx: EnrichedContext): FileEntry[] {
  const pkg = ctx.packagePath;
  const files: FileEntry[] = [];

  // Once per bounded context
  files.push(
    { template: 'src/main/kotlin/domain/shared/DomainEvent.kt.hbs',
      output: `src/main/kotlin/${pkg}/domain/shared/DomainEvent.kt`,
      ctx },
    { template: 'src/main/kotlin/domain/shared/ValidationResult.kt.hbs',
      output: `src/main/kotlin/${pkg}/domain/shared/ValidationResult.kt`,
      ctx }
  );

  for (const agg of ctx.aggregates) {
    const aggPath = `src/main/kotlin/${pkg}/domain/${agg.names.kebab}`;
    const testPath = `src/test/kotlin/${pkg}`;

    // Per aggregate
    files.push(
      { template: 'src/main/kotlin/domain/[aggregate]/Aggregate.kt.hbs',
        output: `${aggPath}/${agg.names.pascal}.kt`, ctx: agg },
      { template: 'src/main/kotlin/domain/[aggregate]/AggregateEvents.kt.hbs',
        output: `${aggPath}/${agg.names.pascal}Events.kt`, ctx: agg },
      { template: 'src/main/kotlin/application/[aggregate]/AggregateCommandService.kt.hbs',
        output: `src/main/kotlin/${pkg}/application/${agg.names.kebab}/${agg.names.pascal}CommandService.kt`, ctx: agg },
      { template: 'src/main/kotlin/application/[aggregate]/AggregateQueryService.kt.hbs',
        output: `src/main/kotlin/${pkg}/application/${agg.names.kebab}/${agg.names.pascal}QueryService.kt`, ctx: agg },
      { template: 'src/main/kotlin/api/[aggregate]/AggregateApiDelegateImpl.kt.hbs',
        output: `src/main/kotlin/${pkg}/api/${agg.names.kebab}/${agg.names.pascal}ApiDelegateImpl.kt`, ctx: agg },
      { template: 'src/main/kotlin/infrastructure/[aggregate]/AggregateReadRepositoryImpl.kt.hbs',
        output: `src/main/kotlin/${pkg}/infrastructure/${agg.names.kebab}/${agg.names.pascal}ReadRepositoryImpl.kt`, ctx: agg },
      { template: 'src/main/kotlin/infrastructure/[aggregate]/AggregateWriteRepositoryImpl.kt.hbs',
        output: `src/main/kotlin/${pkg}/infrastructure/${agg.names.kebab}/${agg.names.pascal}WriteRepositoryImpl.kt`, ctx: agg },
      { template: 'src/test/kotlin/domain/[aggregate]/AggregateTest.kt.hbs',
        output: `${testPath}/domain/${agg.names.kebab}/${agg.names.pascal}Test.kt`, ctx: agg },
      { template: 'src/test/kotlin/application/[aggregate]/AggregateCommandServiceTest.kt.hbs',
        output: `${testPath}/application/${agg.names.kebab}/${agg.names.pascal}CommandServiceTest.kt`, ctx: agg },
      { template: 'src/test/kotlin/api/[aggregate]/AggregateApiDelegateImplTest.kt.hbs',
        output: `${testPath}/api/${agg.names.kebab}/${agg.names.pascal}ApiDelegateImplTest.kt`, ctx: agg }
    );

    // Per command
    for (const cmd of agg.commands) {
      files.push({
        template: 'src/main/kotlin/domain/[aggregate]/commands/[command].kt.hbs',
        output: `${aggPath}/commands/${cmd.names.pascal}Command.kt`,
        ctx: { ...agg, cmd }
      });
    }

    // Per entity
    for (const entity of agg.entities) {
      const entityPath = `${aggPath}/entities`;
      files.push(
        { template: 'src/main/kotlin/domain/[aggregate]/entities/[entity].kt.hbs',
          output: `${entityPath}/${entity.names.pascal}.kt`,
          ctx: { ...agg, entity } },
        { template: 'src/main/kotlin/domain/[aggregate]/entities/[entity]Events.kt.hbs',
          output: `${entityPath}/${entity.names.pascal}Events.kt`,
          ctx: { ...agg, entity } }
      );

      // Per entity command — same expansion as aggregate commands
      for (const cmd of entity.commands) {
        files.push({
          template: 'src/main/kotlin/domain/[aggregate]/commands/[command].kt.hbs',
          output: `${entityPath}/commands/${cmd.names.pascal}Command.kt`,
          ctx: { ...agg, entity, cmd }  // cmd is the single command; entity.commands is not iterated in the template
        });
      }
    }
  }

  return files;
}
```

**Context shape note:** Each per-command `FileEntry` receives a single `cmd` object alongside the aggregate/entity context. Templates use `cmd.*` directly — they do not iterate `commands`. The full `commands` array is available on `agg` for templates that need it (e.g. `AggregateCommandService.kt.hbs`), but command-file templates should only use `cmd`.
```

---

## Output Structure

```
src/
  main/kotlin/io/example/workspace/
    domain/
      shared/
        DomainEvent.kt
        ValidationResult.kt
      workspace/
        Workspace.kt
        WorkspaceEvents.kt
        commands/
          CreateWorkspaceCommand.kt
          UpdateWorkspaceStatusCommand.kt
        entities/
          Party.kt
          PartyEvents.kt
    application/
      workspace/
        WorkspaceCommandService.kt
        WorkspaceQueryService.kt
    api/
      workspace/
        WorkspaceApiDelegateImpl.kt
    infrastructure/
      workspace/
        WorkspaceReadRepositoryImpl.kt
        WorkspaceWriteRepositoryImpl.kt

  test/kotlin/io/example/workspace/
    domain/workspace/
      WorkspaceTest.kt
    application/workspace/
      WorkspaceCommandServiceTest.kt
    api/workspace/
      WorkspaceApiDelegateImplTest.kt
```

Test paths mirror source paths exactly.

---

## What This Proves

Porting `spring-domain` from gap-cli demonstrates:

1. **Complex bundles work** — multiple aggregates, entities, one-to-many file expansion, shared code
2. **Templates stay trivial** — all the logic that lived in gap-cli's Go templates moves to TypeScript enrichment
3. **Convention engines generalise** — the same pattern works for any target stack
4. **The engine contract extension is sound** — `generateFiles` is backward compatible and solves the one-to-many problem cleanly

Once this works, porting other gap-cli bundles (agent-python, bff-api, etc.) follows the same pattern.

---

## What's Deferred

- Bundle composition (running spring-library + spring-domain together with one command)
- Custom convention overrides in `.fixedcode.yaml`
- Remote aggregate consumer code generation (parsed, validated, not rendered)
- OpenAPI spec generation
- Database migration generation (Flyway)
- Integration test generation (itest-harness equivalent)
