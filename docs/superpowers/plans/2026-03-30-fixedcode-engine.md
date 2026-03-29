# FixedCode Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FixedCode engine — a pluggable, spec-driven code generation pipeline — and validate it with a DDD spike bundle.

**Architecture:** A TypeScript engine that reads YAML specs, resolves pluggable bundles (npm or local), calls the bundle's enrichment to produce a rich context, then renders Handlebars templates against that context. Bundles own their spec format, enrichment logic, and templates. The engine is generic and knows nothing about any specific domain.

**Tech Stack:** TypeScript, Vitest, Commander, Handlebars, yaml (YAML 1.2), Ajv (JSON Schema), fast-glob

**Spec:** `docs/superpowers/specs/2026-03-30-fixedcode-engine-rewrite-design.md`

**Context-Model-First Approach:** We build the spike bundle first (Phase 1) to validate the context model design, then build the engine (Phase 2) and CLI (Phase 3) around it.

---

## File Structure

### Engine (`engine/`)

```
engine/
├── src/
│   ├── types.ts                    # Bundle, SpecMetadata, Context, RenderedFile, RawSpec
│   ├── errors.ts                   # FixedCodeError hierarchy
│   ├── engine/
│   │   ├── parse.ts                # parseSpec(), validateEnvelope()
│   │   ├── config.ts               # loadConfig()
│   │   ├── resolve.ts              # resolveBundle()
│   │   ├── validate.ts             # validateBody() via Ajv
│   │   ├── render.ts               # loadTemplates(), renderTemplates()
│   │   ├── write.ts                # writeFiles()
│   │   └── pipeline.ts             # generate() — orchestrates all steps
│   ├── cli/
│   │   ├── index.ts                # Commander program setup + bin entry
│   │   ├── generate.ts             # generate/g command handler
│   │   ├── validate-cmd.ts         # validate/v command handler
│   │   └── spec-resolver.ts        # spec name → file path resolution
│   └── index.ts                    # public library API
├── test/
│   ├── engine/
│   │   ├── parse.test.ts
│   │   ├── config.test.ts
│   │   ├── resolve.test.ts
│   │   ├── validate.test.ts
│   │   ├── render.test.ts
│   │   ├── write.test.ts
│   │   └── pipeline.test.ts
│   ├── cli/
│   │   ├── spec-resolver.test.ts
│   │   └── cli.test.ts
│   └── fixtures/
│       ├── valid-envelope.yaml
│       ├── missing-kind.yaml
│       ├── missing-spec.yaml
│       ├── bad-yaml.yaml
│       └── test-bundle/
│           ├── src/
│           │   └── index.ts
│           ├── templates/
│           │   └── hello.txt.hbs
│           └── package.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Spike Bundle (`bundles/ddd-spike/`)

```
bundles/ddd-spike/
├── src/
│   ├── index.ts                    # default export: Bundle
│   ├── schema.json                 # JSON Schema for DDD spec body
│   ├── helpers.ts                  # Handlebars helpers (case conversion)
│   ├── context.ts                  # TypeScript interfaces for enriched context
│   └── enrich/
│       ├── index.ts                # pipe() composition of all steps
│       ├── names.ts                # name variant generation
│       ├── types.ts                # spec type → Kotlin/SQL type mapping
│       ├── attributes.ts           # attribute enrichment
│       ├── commands.ts             # command context building
│       └── queries.ts              # query context building
├── templates/
│   ├── src/main/kotlin/
│   │   └── {{#each aggregates}}/
│   │       ├── domain/
│   │       │   └── {{names.pascal}}.kt.hbs
│   │       ├── api/
│   │       │   └── {{names.pascal}}Controller.kt.hbs
│   │       ├── application/
│   │       │   ├── {{names.pascal}}CommandService.kt.hbs
│   │       │   └── {{names.pascal}}QueryService.kt.hbs
│   │       └── infrastructure/
│   │           └── {{names.pascal}}Repository.kt.hbs
│   └── src/main/resources/
│       └── db/migration/
│           └── V1__create_tables.sql.hbs
├── test/
│   ├── enrich/
│   │   ├── names.test.ts
│   │   ├── types.test.ts
│   │   ├── attributes.test.ts
│   │   ├── commands.test.ts
│   │   ├── queries.test.ts
│   │   └── enrich.test.ts
│   ├── templates/
│   │   └── render.test.ts
│   └── fixtures/
│       ├── order-spec.yaml
│       └── expected-context.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Phase 1: Context Model Design (Spike Bundle)

### Task 1: Project Scaffolding

**Files:**
- Create: `engine/package.json`
- Create: `engine/tsconfig.json`
- Create: `engine/vitest.config.ts`
- Create: `engine/src/types.ts`
- Create: `engine/src/errors.ts`
- Create: `bundles/ddd-spike/package.json`
- Create: `bundles/ddd-spike/tsconfig.json`
- Create: `bundles/ddd-spike/vitest.config.ts`

- [ ] **Step 1: Create engine package**

```bash
cd /home/gibbon/projects/fixedcode
mkdir -p engine/src engine/test
```

`engine/package.json`:
```json
{
  "name": "@fixedcode/engine",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "fixedcode": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "ajv": "^8.17.0",
    "commander": "^13.0.0",
    "fast-glob": "^3.3.0",
    "handlebars": "^4.7.0",
    "yaml": "^2.7.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

`engine/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

`engine/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: '.',
  },
});
```

- [ ] **Step 2: Create spike bundle package**

```bash
mkdir -p bundles/ddd-spike/src/enrich bundles/ddd-spike/test/enrich bundles/ddd-spike/test/fixtures bundles/ddd-spike/templates
```

`bundles/ddd-spike/package.json`:
```json
{
  "name": "@fixedcode/bundle-ddd-spike",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fixedcode/engine": "file:../../engine"
  },
  "devDependencies": {
    "handlebars": "^4.7.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

`bundles/ddd-spike/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

`bundles/ddd-spike/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: '.',
  },
});
```

- [ ] **Step 3: Create core types**

`engine/src/types.ts`:
```typescript
/**
 * The contract between the engine and any bundle.
 * A bundle is a directory or npm package with a default export conforming to this interface.
 */
export interface Bundle {
  /** Routes specs to this bundle via the `kind` field in the spec envelope */
  kind: string;

  /** JSON Schema that validates the `spec:` body of matching specs */
  specSchema: Record<string, unknown>;

  /** Transforms raw spec body into a rich context for template rendering */
  enrich(spec: Record<string, unknown>, metadata: SpecMetadata): Context;

  /** Relative path (from bundle root) to the Handlebars templates directory */
  templates: string;

  /** Optional custom Handlebars helpers available in this bundle's templates */
  helpers?: Record<string, (...args: unknown[]) => unknown>;

  /** Optional named Handlebars partial templates */
  partials?: Record<string, string>;
}

export interface SpecMetadata {
  name: string;
  description?: string;
  apiVersion: string;
}

/** Opaque at the engine level — each bundle defines its own shape */
export type Context = Record<string, unknown>;

export interface RawSpec {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    description?: string;
  };
  spec: Record<string, unknown>;
}

export interface RenderedFile {
  /** Relative output path */
  path: string;
  /** Rendered content */
  content: string;
}

export interface FixedCodeConfig {
  bundles: Record<string, string>;
}
```

- [ ] **Step 4: Create error hierarchy**

`engine/src/errors.ts`:
```typescript
export class FixedCodeError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FixedCodeError';
  }
}

export class SpecParseError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'SPEC_PARSE_ERROR');
    this.name = 'SpecParseError';
  }
}

export class EnvelopeError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'ENVELOPE_ERROR');
    this.name = 'EnvelopeError';
  }
}

export class BundleNotFoundError extends FixedCodeError {
  constructor(kind: string) {
    super(`No bundle registered for kind '${kind}'. Check .fixedcode.yaml`, 'BUNDLE_NOT_FOUND');
    this.name = 'BundleNotFoundError';
  }
}

export class BundleLoadError extends FixedCodeError {
  constructor(bundle: string, reason: string) {
    super(`Bundle '${bundle}' failed to load: ${reason}`, 'BUNDLE_LOAD_ERROR');
    this.name = 'BundleLoadError';
  }
}

export class SpecValidationError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'SPEC_VALIDATION_ERROR');
    this.name = 'SpecValidationError';
  }
}

export class EnrichmentError extends FixedCodeError {
  constructor(kind: string, reason: string) {
    super(`Enrichment failed in bundle '${kind}': ${reason}`, 'ENRICHMENT_ERROR');
    this.name = 'EnrichmentError';
  }
}

export class RenderError extends FixedCodeError {
  constructor(template: string, reason: string) {
    super(`Template error in ${template}: ${reason}`, 'RENDER_ERROR');
    this.name = 'RenderError';
  }
}

export class WriteError extends FixedCodeError {
  constructor(path: string, reason: string) {
    super(`Cannot write to ${path}: ${reason}`, 'WRITE_ERROR');
    this.name = 'WriteError';
  }
}
```

- [ ] **Step 5: Install dependencies and verify setup**

```bash
cd /home/gibbon/projects/fixedcode/engine && npm install
cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npm install
```

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run`
Expected: No tests found (passes with 0 tests)

- [ ] **Step 6: Create engine/src/index.ts stub**

`engine/src/index.ts`:
```typescript
export type { Bundle, SpecMetadata, Context, RawSpec, RenderedFile, FixedCodeConfig } from './types.js';
export {
  FixedCodeError, SpecParseError, EnvelopeError, BundleNotFoundError,
  BundleLoadError, SpecValidationError, EnrichmentError, RenderError, WriteError,
} from './errors.js';
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add engine/ bundles/ddd-spike/
git commit -m "feat: scaffold engine and ddd-spike bundle packages"
```

---

### Task 2: Context Model Interfaces

Design the enriched context type by working backwards from what Kotlin/Spring templates need. This is the most important design work — templates should be trivially simple given this context.

**Files:**
- Create: `bundles/ddd-spike/src/context.ts`
- Create: `bundles/ddd-spike/test/fixtures/order-spec.yaml`

- [ ] **Step 1: Create the context interfaces**

These interfaces define what templates receive. Every conditional, every naming variant, every computed value is pre-resolved here.

`bundles/ddd-spike/src/context.ts`:
```typescript
/** The top-level context passed to all templates */
export interface DddContext {
  package: string;
  aggregates: AggregateContext[];
}

/** All naming variants for a concept — pre-computed, never derived in templates */
export interface NameVariants {
  pascal: string;      // OrderItem
  camel: string;       // orderItem
  snake: string;       // order_item
  kebab: string;       // order-item
  upper: string;       // ORDER_ITEM
  plural: string;      // OrderItems (pascal plural)
  camelPlural: string; // orderItems
  snakePlural: string; // order_items
}

/** Mapped type information — spec type resolved to target language types */
export interface TypeMapping {
  spec: string;        // uuid, string, decimal, etc.
  kotlin: string;      // UUID, String, BigDecimal
  sql: string;         // UUID, VARCHAR(255), DECIMAL(19,2)
  nullable: boolean;   // whether this field is optional
  kotlinDecl: string;  // "UUID" or "String?" (includes ? for nullable)
  needsImport?: string; // e.g. "java.util.UUID", "java.math.BigDecimal"
}

export interface AttributeContext {
  names: NameVariants;
  type: TypeMapping;
  required: boolean;
  identity: boolean;
  default?: string;
  hasDefault: boolean;
  /** Pre-computed Kotlin default expression, e.g. `= "CREATED"` or empty */
  kotlinDefault: string;
  /** Pre-computed column definition for SQL DDL */
  sqlColumn: string;
}

export interface CommandContext {
  names: NameVariants;
  /** Params excluding the aggregate identity (already known) */
  params: ParamContext[];
  event: EventContext;
  /** Pre-computed: "POST" for create, "PUT" for update */
  httpMethod: string;
  /** Pre-computed: "" for create, "/{orderId}/status" for update */
  httpPath: string;
  /** Is this a create command (generates new aggregate)? */
  isCreate: boolean;
}

export interface ParamContext {
  names: NameVariants;
  type: TypeMapping;
  required: boolean;
}

export interface QueryContext {
  names: NameVariants;
  /** "single" or "list" */
  returns: string;
  isList: boolean;
  /** Pre-computed HTTP path */
  httpPath: string;
  filters: FilterContext[];
}

export interface FilterContext {
  names: NameVariants;
  type: TypeMapping;
}

export interface EventContext {
  names: NameVariants;
  fields: EventFieldContext[];
}

export interface EventFieldContext {
  names: NameVariants;
  type: TypeMapping;
}

export interface AggregateContext {
  names: NameVariants;
  identity: AttributeContext;
  attributes: AttributeContext[];
  /** All attributes including identity — for DDL generation */
  allAttributes: AttributeContext[];
  commands: CommandContext[];
  queries: QueryContext[];
  events: EventContext[];
  /** Pre-computed: unique list of Kotlin imports needed */
  imports: string[];
  /** Pre-computed: SQL table name (snake_case plural) */
  tableName: string;
  /** Pre-computed: REST endpoint path */
  endpoint: string;
  hasCommands: boolean;
  hasQueries: boolean;
}
```

- [ ] **Step 2: Create the fixture spec**

`bundles/ddd-spike/test/fixtures/order-spec.yaml`:
```yaml
apiVersion: "1.0"
kind: ddd-domain
metadata:
  name: order-service
  description: "Order management domain"

spec:
  package: com.example.order

  aggregates:
    - name: Order
      attributes:
        - { name: orderId, type: uuid, required: true, identity: true }
        - { name: customerId, type: uuid, required: true }
        - { name: status, type: string, default: "CREATED" }
        - { name: totalAmount, type: decimal }

      commands:
        - name: CreateOrder
          params:
            - { name: customerId, type: uuid, required: true }
          emits: OrderCreated

        - name: UpdateStatus
          params:
            - { name: status, type: string, required: true }
          emits: OrderStatusUpdated

      queries:
        - name: GetOrder
          returns: single

        - name: SearchOrders
          returns: list
          filters:
            - { name: status, type: string }

      events:
        - name: OrderCreated
          fields:
            - { name: orderId, type: uuid }
            - { name: customerId, type: uuid }

        - name: OrderStatusUpdated
          fields:
            - { name: orderId, type: uuid }
            - { name: status, type: string }
```

- [ ] **Step 3: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat: define DDD context model interfaces and fixture spec"
```

---

### Task 3: Name Resolution Enrichment

**Files:**
- Create: `bundles/ddd-spike/src/enrich/names.ts`
- Create: `bundles/ddd-spike/test/enrich/names.test.ts`

- [ ] **Step 1: Write failing tests for name resolution**

`bundles/ddd-spike/test/enrich/names.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { toNameVariants } from '../../src/enrich/names.js';

describe('toNameVariants', () => {
  it('converts PascalCase input', () => {
    const result = toNameVariants('OrderItem');
    expect(result).toEqual({
      pascal: 'OrderItem',
      camel: 'orderItem',
      snake: 'order_item',
      kebab: 'order-item',
      upper: 'ORDER_ITEM',
      plural: 'OrderItems',
      camelPlural: 'orderItems',
      snakePlural: 'order_items',
    });
  });

  it('converts single word', () => {
    const result = toNameVariants('Order');
    expect(result.pascal).toBe('Order');
    expect(result.camel).toBe('order');
    expect(result.snake).toBe('order');
    expect(result.plural).toBe('Orders');
  });

  it('converts camelCase input', () => {
    const result = toNameVariants('orderId');
    expect(result.pascal).toBe('OrderId');
    expect(result.camel).toBe('orderId');
    expect(result.snake).toBe('order_id');
  });

  it('handles acronyms in names', () => {
    const result = toNameVariants('HTMLParser');
    expect(result.camel).toBe('htmlParser');
    expect(result.snake).toBe('html_parser');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/names.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement name resolution**

`bundles/ddd-spike/src/enrich/names.ts`:
```typescript
import type { NameVariants } from '../context.js';

/**
 * Split a PascalCase or camelCase string into words.
 * Handles acronyms: "HTMLParser" → ["HTML", "Parser"]
 */
function splitWords(name: string): string[] {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean);
}

function toPascal(words: string[]): string {
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toCamel(words: string[]): string {
  const pascal = toPascal(words);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnake(words: string[]): string {
  return words.map(w => w.toLowerCase()).join('_');
}

function toKebab(words: string[]): string {
  return words.map(w => w.toLowerCase()).join('-');
}

function toUpper(words: string[]): string {
  return words.map(w => w.toUpperCase()).join('_');
}

/** Naive English pluralisation — covers common cases */
function pluralize(word: string): string {
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
      word.endsWith('sh') || word.endsWith('ch')) {
    return word + 'es';
  }
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + 'ies';
  }
  return word + 's';
}

export function toNameVariants(name: string): NameVariants {
  const words = splitWords(name);
  const pascal = toPascal(words);
  const camel = toCamel(words);
  const snake = toSnake(words);

  return {
    pascal,
    camel,
    snake,
    kebab: toKebab(words),
    upper: toUpper(words),
    plural: pluralize(pascal),
    camelPlural: pluralize(camel),
    snakePlural: pluralize(snake),
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/names.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): add name variant resolution"
```

---

### Task 4: Type Mapping Enrichment

**Files:**
- Create: `bundles/ddd-spike/src/enrich/types.ts`
- Create: `bundles/ddd-spike/test/enrich/types.test.ts`

- [ ] **Step 1: Write failing tests**

`bundles/ddd-spike/test/enrich/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { toTypeMapping } from '../../src/enrich/types.js';

describe('toTypeMapping', () => {
  it('maps uuid type', () => {
    const result = toTypeMapping('uuid', true);
    expect(result).toEqual({
      spec: 'uuid',
      kotlin: 'UUID',
      sql: 'UUID',
      nullable: false,
      kotlinDecl: 'UUID',
      needsImport: 'java.util.UUID',
    });
  });

  it('maps string type (required)', () => {
    const result = toTypeMapping('string', true);
    expect(result.kotlin).toBe('String');
    expect(result.sql).toBe('VARCHAR(255)');
    expect(result.nullable).toBe(false);
    expect(result.kotlinDecl).toBe('String');
    expect(result.needsImport).toBeUndefined();
  });

  it('maps string type (optional)', () => {
    const result = toTypeMapping('string', false);
    expect(result.nullable).toBe(true);
    expect(result.kotlinDecl).toBe('String?');
  });

  it('maps decimal type', () => {
    const result = toTypeMapping('decimal', false);
    expect(result.kotlin).toBe('BigDecimal');
    expect(result.sql).toBe('DECIMAL(19,2)');
    expect(result.kotlinDecl).toBe('BigDecimal?');
    expect(result.needsImport).toBe('java.math.BigDecimal');
  });

  it('maps int type', () => {
    const result = toTypeMapping('int', true);
    expect(result.kotlin).toBe('Int');
    expect(result.sql).toBe('INT');
  });

  it('maps long type', () => {
    const result = toTypeMapping('long', true);
    expect(result.kotlin).toBe('Long');
    expect(result.sql).toBe('BIGINT');
  });

  it('maps boolean type', () => {
    const result = toTypeMapping('boolean', true);
    expect(result.kotlin).toBe('Boolean');
    expect(result.sql).toBe('BOOLEAN');
  });

  it('maps date type', () => {
    const result = toTypeMapping('date', true);
    expect(result.kotlin).toBe('LocalDate');
    expect(result.needsImport).toBe('java.time.LocalDate');
  });

  it('maps datetime type', () => {
    const result = toTypeMapping('datetime', true);
    expect(result.kotlin).toBe('LocalDateTime');
    expect(result.needsImport).toBe('java.time.LocalDateTime');
  });

  it('throws on unknown type', () => {
    expect(() => toTypeMapping('foo', true)).toThrow('Unknown type: foo');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/types.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement type mapping**

`bundles/ddd-spike/src/enrich/types.ts`:
```typescript
import type { TypeMapping } from '../context.js';

interface TypeDef {
  kotlin: string;
  sql: string;
  needsImport?: string;
}

const TYPE_MAP: Record<string, TypeDef> = {
  uuid:     { kotlin: 'UUID',          sql: 'UUID',           needsImport: 'java.util.UUID' },
  string:   { kotlin: 'String',        sql: 'VARCHAR(255)' },
  int:      { kotlin: 'Int',           sql: 'INT' },
  long:     { kotlin: 'Long',          sql: 'BIGINT' },
  boolean:  { kotlin: 'Boolean',       sql: 'BOOLEAN' },
  decimal:  { kotlin: 'BigDecimal',    sql: 'DECIMAL(19,2)',  needsImport: 'java.math.BigDecimal' },
  date:     { kotlin: 'LocalDate',     sql: 'DATE',           needsImport: 'java.time.LocalDate' },
  datetime: { kotlin: 'LocalDateTime', sql: 'TIMESTAMP',      needsImport: 'java.time.LocalDateTime' },
  object:   { kotlin: 'Map<String, Any?>', sql: 'JSONB' },
};

export function toTypeMapping(specType: string, required: boolean): TypeMapping {
  const def = TYPE_MAP[specType];
  if (!def) {
    throw new Error(`Unknown type: ${specType}`);
  }

  const nullable = !required;
  return {
    spec: specType,
    kotlin: def.kotlin,
    sql: def.sql,
    nullable,
    kotlinDecl: nullable ? `${def.kotlin}?` : def.kotlin,
    needsImport: def.needsImport,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): add spec-to-Kotlin/SQL type mapping"
```

---

### Task 5: Attribute Enrichment

**Files:**
- Create: `bundles/ddd-spike/src/enrich/attributes.ts`
- Create: `bundles/ddd-spike/test/enrich/attributes.test.ts`

- [ ] **Step 1: Write failing tests**

`bundles/ddd-spike/test/enrich/attributes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { enrichAttribute } from '../../src/enrich/attributes.js';

describe('enrichAttribute', () => {
  it('enriches a required uuid identity field', () => {
    const result = enrichAttribute({
      name: 'orderId', type: 'uuid', required: true, identity: true,
    });
    expect(result.names.pascal).toBe('OrderId');
    expect(result.names.camel).toBe('orderId');
    expect(result.type.kotlin).toBe('UUID');
    expect(result.type.nullable).toBe(false);
    expect(result.required).toBe(true);
    expect(result.identity).toBe(true);
    expect(result.hasDefault).toBe(false);
    expect(result.kotlinDefault).toBe('');
    expect(result.sqlColumn).toBe('order_id UUID NOT NULL');
  });

  it('enriches an optional string field with default', () => {
    const result = enrichAttribute({
      name: 'status', type: 'string', default: 'CREATED',
    });
    expect(result.required).toBe(false);
    expect(result.type.kotlinDecl).toBe('String?');
    expect(result.hasDefault).toBe(true);
    expect(result.kotlinDefault).toBe(' = "CREATED"');
    expect(result.sqlColumn).toBe("status VARCHAR(255) DEFAULT 'CREATED'");
  });

  it('enriches an optional decimal field', () => {
    const result = enrichAttribute({
      name: 'totalAmount', type: 'decimal',
    });
    expect(result.type.kotlinDecl).toBe('BigDecimal?');
    expect(result.sqlColumn).toBe('total_amount DECIMAL(19,2)');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/attributes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement attribute enrichment**

`bundles/ddd-spike/src/enrich/attributes.ts`:
```typescript
import type { AttributeContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';

interface RawAttribute {
  name: string;
  type: string;
  required?: boolean;
  identity?: boolean;
  default?: string;
}

export function enrichAttribute(raw: RawAttribute): AttributeContext {
  const names = toNameVariants(raw.name);
  const required = raw.required ?? false;
  const type = toTypeMapping(raw.type, required);
  const hasDefault = raw.default !== undefined;

  let kotlinDefault = '';
  if (hasDefault) {
    kotlinDefault = type.kotlin === 'String' ? ` = "${raw.default}"` : ` = ${raw.default}`;
  }

  let sqlColumn = `${names.snake} ${type.sql}`;
  if (required) {
    sqlColumn += ' NOT NULL';
  }
  if (hasDefault) {
    const sqlDefault = type.kotlin === 'String' ? `'${raw.default}'` : raw.default;
    sqlColumn += ` DEFAULT ${sqlDefault}`;
  }

  return {
    names,
    type,
    required,
    identity: raw.identity ?? false,
    default: raw.default,
    hasDefault,
    kotlinDefault,
    sqlColumn,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/attributes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): add attribute enrichment"
```

---

### Task 6: Command & Query Enrichment

**Files:**
- Create: `bundles/ddd-spike/src/enrich/commands.ts`
- Create: `bundles/ddd-spike/src/enrich/queries.ts`
- Create: `bundles/ddd-spike/test/enrich/commands.test.ts`
- Create: `bundles/ddd-spike/test/enrich/queries.test.ts`

- [ ] **Step 1: Write failing tests for commands**

`bundles/ddd-spike/test/enrich/commands.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { enrichCommand } from '../../src/enrich/commands.js';

describe('enrichCommand', () => {
  it('enriches a create command', () => {
    const result = enrichCommand(
      {
        name: 'CreateOrder',
        params: [{ name: 'customerId', type: 'uuid', required: true }],
        emits: 'OrderCreated',
      },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.names.pascal).toBe('CreateOrder');
    expect(result.isCreate).toBe(true);
    expect(result.httpMethod).toBe('POST');
    expect(result.httpPath).toBe('');
    expect(result.params).toHaveLength(1);
    expect(result.params[0].names.camel).toBe('customerId');
    expect(result.event.names.pascal).toBe('OrderCreated');
  });

  it('enriches an update command', () => {
    const result = enrichCommand(
      {
        name: 'UpdateStatus',
        params: [{ name: 'status', type: 'string', required: true }],
        emits: 'OrderStatusUpdated',
      },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.isCreate).toBe(false);
    expect(result.httpMethod).toBe('PUT');
    expect(result.httpPath).toBe('/{orderId}');
    expect(result.event.names.pascal).toBe('OrderStatusUpdated');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/commands.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement command enrichment**

`bundles/ddd-spike/src/enrich/commands.ts`:
```typescript
import type { CommandContext, ParamContext, EventContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';

interface RawCommand {
  name: string;
  params: Array<{ name: string; type: string; required?: boolean }>;
  emits: string;
}

interface IdentityInfo {
  name: string;
  type: string;
}

function enrichParam(raw: { name: string; type: string; required?: boolean }): ParamContext {
  return {
    names: toNameVariants(raw.name),
    type: toTypeMapping(raw.type, raw.required ?? false),
    required: raw.required ?? false,
  };
}

function enrichEvent(eventName: string, command: RawCommand, identity: IdentityInfo): EventContext {
  const fields = [
    { names: toNameVariants(identity.name), type: toTypeMapping(identity.type, true) },
    ...command.params.map(p => ({
      names: toNameVariants(p.name),
      type: toTypeMapping(p.type, true),
    })),
  ];

  return {
    names: toNameVariants(eventName),
    fields,
  };
}

export function enrichCommand(raw: RawCommand, identity: IdentityInfo): CommandContext {
  const names = toNameVariants(raw.name);
  const isCreate = names.pascal.startsWith('Create');
  const identityNames = toNameVariants(identity.name);

  return {
    names,
    params: raw.params.map(enrichParam),
    event: enrichEvent(raw.emits, raw, identity),
    httpMethod: isCreate ? 'POST' : 'PUT',
    httpPath: isCreate ? '' : `/{${identityNames.camel}}`,
    isCreate,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/commands.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests for queries**

`bundles/ddd-spike/test/enrich/queries.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { enrichQuery } from '../../src/enrich/queries.js';

describe('enrichQuery', () => {
  it('enriches a single-return query', () => {
    const result = enrichQuery(
      { name: 'GetOrder', returns: 'single' },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.names.pascal).toBe('GetOrder');
    expect(result.returns).toBe('single');
    expect(result.isList).toBe(false);
    expect(result.httpPath).toBe('/{orderId}');
    expect(result.filters).toHaveLength(0);
  });

  it('enriches a list query with filters', () => {
    const result = enrichQuery(
      {
        name: 'SearchOrders',
        returns: 'list',
        filters: [{ name: 'status', type: 'string' }],
      },
      { name: 'orderId', type: 'uuid' },
    );
    expect(result.isList).toBe(true);
    expect(result.httpPath).toBe('');
    expect(result.filters).toHaveLength(1);
    expect(result.filters[0].names.camel).toBe('status');
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/queries.test.ts`
Expected: FAIL

- [ ] **Step 7: Implement query enrichment**

`bundles/ddd-spike/src/enrich/queries.ts`:
```typescript
import type { QueryContext, FilterContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';

interface RawQuery {
  name: string;
  returns: string;
  filters?: Array<{ name: string; type: string }>;
}

interface IdentityInfo {
  name: string;
  type: string;
}

function enrichFilter(raw: { name: string; type: string }): FilterContext {
  return {
    names: toNameVariants(raw.name),
    type: toTypeMapping(raw.type, false),
  };
}

export function enrichQuery(raw: RawQuery, identity: IdentityInfo): QueryContext {
  const isList = raw.returns === 'list';
  const identityNames = toNameVariants(identity.name);

  return {
    names: toNameVariants(raw.name),
    returns: raw.returns,
    isList,
    httpPath: isList ? '' : `/{${identityNames.camel}}`,
    filters: (raw.filters ?? []).map(enrichFilter),
  };
}
```

- [ ] **Step 8: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/queries.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): add command and query enrichment"
```

---

### Task 7: Full Enrichment Pipeline

Wire all transforms together into the bundle's `enrich()` function and test end-to-end with the Order fixture.

**Files:**
- Create: `bundles/ddd-spike/src/enrich/index.ts`
- Create: `bundles/ddd-spike/test/enrich/enrich.test.ts`

- [ ] **Step 1: Write failing integration test**

`bundles/ddd-spike/test/enrich/enrich.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { enrich } from '../../src/enrich/index.js';
import type { DddContext } from '../../src/context.js';

function loadFixture(): { spec: Record<string, unknown>; metadata: { name: string; apiVersion: string } } {
  const raw = parse(readFileSync(new URL('../fixtures/order-spec.yaml', import.meta.url), 'utf-8'));
  return { spec: raw.spec, metadata: { name: raw.metadata.name, apiVersion: raw.apiVersion } };
}

describe('enrich (full pipeline)', () => {
  it('produces correct top-level structure', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;

    expect(ctx.package).toBe('com.example.order');
    expect(ctx.aggregates).toHaveLength(1);
  });

  it('enriches aggregate names and identity', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.names.pascal).toBe('Order');
    expect(order.names.snake).toBe('order');
    expect(order.identity.names.camel).toBe('orderId');
    expect(order.identity.type.kotlin).toBe('UUID');
    expect(order.tableName).toBe('orders');
    expect(order.endpoint).toBe('/orders');
  });

  it('enriches all attributes', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.allAttributes).toHaveLength(4);
    expect(order.attributes).toHaveLength(3); // excludes identity

    const status = order.attributes.find(a => a.names.camel === 'status')!;
    expect(status.hasDefault).toBe(true);
    expect(status.kotlinDefault).toBe(' = "CREATED"');
  });

  it('enriches commands with http metadata', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.commands).toHaveLength(2);
    expect(order.commands[0].isCreate).toBe(true);
    expect(order.commands[0].httpMethod).toBe('POST');
    expect(order.commands[1].httpMethod).toBe('PUT');
    expect(order.commands[1].httpPath).toBe('/{orderId}');
  });

  it('enriches queries', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.queries).toHaveLength(2);
    expect(order.queries[0].isList).toBe(false);
    expect(order.queries[1].isList).toBe(true);
    expect(order.queries[1].filters).toHaveLength(1);
  });

  it('computes imports from types used', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.imports).toContain('java.util.UUID');
    expect(order.imports).toContain('java.math.BigDecimal');
    // No duplicates
    const unique = [...new Set(order.imports)];
    expect(order.imports).toEqual(unique);
  });

  it('computes boolean flags', () => {
    const { spec, metadata } = loadFixture();
    const ctx = enrich(spec, metadata) as DddContext;
    const order = ctx.aggregates[0];

    expect(order.hasCommands).toBe(true);
    expect(order.hasQueries).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/enrich.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the enrichment pipeline**

`bundles/ddd-spike/src/enrich/index.ts`:
```typescript
import type { SpecMetadata } from '@fixedcode/engine';
import type { DddContext, AggregateContext } from '../context.js';
import { toNameVariants } from './names.js';
import { enrichAttribute } from './attributes.js';
import { enrichCommand } from './commands.js';
import { enrichQuery } from './queries.js';

interface RawAggregate {
  name: string;
  attributes: Array<{
    name: string;
    type: string;
    required?: boolean;
    identity?: boolean;
    default?: string;
  }>;
  commands?: Array<{
    name: string;
    params: Array<{ name: string; type: string; required?: boolean }>;
    emits: string;
  }>;
  queries?: Array<{
    name: string;
    returns: string;
    filters?: Array<{ name: string; type: string }>;
  }>;
  events?: Array<{
    name: string;
    fields: Array<{ name: string; type: string }>;
  }>;
}

function collectImports(agg: AggregateContext): string[] {
  const imports = new Set<string>();

  for (const attr of agg.allAttributes) {
    if (attr.type.needsImport) imports.add(attr.type.needsImport);
  }
  for (const cmd of agg.commands) {
    for (const param of cmd.params) {
      if (param.type.needsImport) imports.add(param.type.needsImport);
    }
  }
  for (const query of agg.queries) {
    for (const filter of query.filters) {
      if (filter.type.needsImport) imports.add(filter.type.needsImport);
    }
  }

  return [...imports].sort();
}

function enrichAggregate(raw: RawAggregate): AggregateContext {
  const names = toNameVariants(raw.name);

  const allAttributes = raw.attributes.map(enrichAttribute);
  const identity = allAttributes.find(a => a.identity);
  if (!identity) {
    throw new Error(`Aggregate '${raw.name}' has no identity attribute (set identity: true)`);
  }
  const attributes = allAttributes.filter(a => !a.identity);

  const identityInfo = { name: identity.names.camel, type: identity.type.spec };
  const commands = (raw.commands ?? []).map(c => enrichCommand(c, identityInfo));
  const queries = (raw.queries ?? []).map(q => enrichQuery(q, identityInfo));

  // Build events from spec (not derived from commands — spec is authoritative)
  const events = (raw.events ?? []).map(e => ({
    names: toNameVariants(e.name),
    fields: e.fields.map(f => ({
      names: toNameVariants(f.name),
      type: { spec: f.type, kotlin: '', sql: '', nullable: false, kotlinDecl: '', needsImport: undefined,
        ...(() => {
          const { toTypeMapping } = require('./types.js');
          return toTypeMapping(f.type, true);
        })(),
      },
    })),
  }));

  const agg: AggregateContext = {
    names,
    identity,
    attributes,
    allAttributes,
    commands,
    queries,
    events,
    imports: [], // computed below
    tableName: names.snakePlural,
    endpoint: `/${names.kebab}s`,
    hasCommands: commands.length > 0,
    hasQueries: queries.length > 0,
  };

  agg.imports = collectImports(agg);
  return agg;
}

export function enrich(spec: Record<string, unknown>, _metadata: SpecMetadata): DddContext {
  const rawAggregates = spec.aggregates as RawAggregate[];

  return {
    package: spec.package as string,
    aggregates: rawAggregates.map(enrichAggregate),
  };
}
```

**Note:** The event field type resolution uses a dynamic require which is not ideal. Refactor to use a direct import instead:

Replace the events mapping block with:

```typescript
import { toTypeMapping } from './types.js';

// ... inside enrichAggregate:
const events = (raw.events ?? []).map(e => ({
  names: toNameVariants(e.name),
  fields: e.fields.map(f => ({
    names: toNameVariants(f.name),
    type: toTypeMapping(f.type, true),
  })),
}));
```

- [ ] **Step 4: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/enrich/enrich.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Run all spike tests together**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): wire full enrichment pipeline"
```

---

### Task 8: Spike Bundle Handlebars Templates

Write templates that consume the enriched context. These should be trivially simple — if they're not, the context model needs fixing.

**Files:**
- Create: `bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/domain/{{names.pascal}}.kt.hbs`
- Create: `bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/api/{{names.pascal}}Controller.kt.hbs`
- Create: `bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/application/{{names.pascal}}CommandService.kt.hbs`
- Create: `bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/application/{{names.pascal}}QueryService.kt.hbs`
- Create: `bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/infrastructure/{{names.pascal}}Repository.kt.hbs`
- Create: `bundles/ddd-spike/templates/src/main/resources/db/migration/V1__create_tables.sql.hbs`
- Create: `bundles/ddd-spike/test/templates/render.test.ts`

- [ ] **Step 1: Write the domain entity template**

`bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/domain/{{names.pascal}}.kt.hbs`:
```handlebars
package {{../package}}.domain

{{#each imports}}
import {{this}}
{{/each}}

data class {{names.pascal}}(
    val {{identity.names.camel}}: {{identity.type.kotlinDecl}},
{{#each attributes}}
    val {{names.camel}}: {{type.kotlinDecl}}{{kotlinDefault}}{{#unless @last}},{{/unless}}
{{/each}}
)
```

- [ ] **Step 2: Write the controller template**

`bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/api/{{names.pascal}}Controller.kt.hbs`:
```handlebars
package {{../package}}.api

{{#each imports}}
import {{this}}
{{/each}}
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("{{endpoint}}")
class {{names.pascal}}Controller(
{{#if hasCommands}}
    private val {{names.camel}}CommandService: {{names.pascal}}CommandService,
{{/if}}
{{#if hasQueries}}
    private val {{names.camel}}QueryService: {{names.pascal}}QueryService,
{{/if}}
) {
{{#each commands}}

    @{{httpMethod}}Mapping{{#if httpPath}}("{{httpPath}}"){{/if}}
    fun {{names.camel}}(
{{#unless isCreate}}
        @PathVariable {{../identity.names.camel}}: {{../identity.type.kotlinDecl}},
{{/unless}}
{{#each params}}
        @RequestBody {{names.camel}}: {{type.kotlinDecl}}{{#unless @last}},{{/unless}}
{{/each}}
    ): ResponseEntity<{{#if isCreate}}{{../names.pascal}}{{else}}Void{{/if}}> {
{{#if isCreate}}
        val result = {{../names.camel}}CommandService.{{names.camel}}({{#each params}}{{names.camel}}{{#unless @last}}, {{/unless}}{{/each}})
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
{{else}}
        {{../names.camel}}CommandService.{{names.camel}}({{../identity.names.camel}}{{#each params}}, {{names.camel}}{{/each}})
        return ResponseEntity.noContent().build()
{{/if}}
    }
{{/each}}
{{#each queries}}

    @GetMapping{{#if httpPath}}("{{httpPath}}"){{/if}}
    fun {{names.camel}}(
{{#if isList}}
{{#each filters}}
        @RequestParam(required = false) {{names.camel}}: {{type.kotlinDecl}}{{#unless @last}},{{/unless}}
{{/each}}
{{else}}
        @PathVariable {{../identity.names.camel}}: {{../identity.type.kotlinDecl}}
{{/if}}
    ): ResponseEntity<{{#if isList}}List<{{../names.pascal}}>{{else}}{{../names.pascal}}{{/if}}> {
{{#if isList}}
        return ResponseEntity.ok({{../names.camel}}QueryService.{{names.camel}}({{#each filters}}{{names.camel}}{{#unless @last}}, {{/unless}}{{/each}}))
{{else}}
        return ResponseEntity.ok({{../names.camel}}QueryService.{{names.camel}}({{../identity.names.camel}}))
{{/if}}
    }
{{/each}}
}
```

- [ ] **Step 3: Write command service template**

`bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/application/{{names.pascal}}CommandService.kt.hbs`:
```handlebars
package {{../package}}.application

{{#each imports}}
import {{this}}
{{/each}}
import {{../package}}.domain.{{names.pascal}}
import {{../package}}.infrastructure.{{names.pascal}}Repository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class {{names.pascal}}CommandService(
    private val {{names.camel}}Repository: {{names.pascal}}Repository,
) {
{{#each commands}}

    fun {{names.camel}}({{#unless isCreate}}{{../identity.names.camel}}: {{../identity.type.kotlinDecl}}, {{/unless}}{{#each params}}{{names.camel}}: {{type.kotlinDecl}}{{#unless @last}}, {{/unless}}{{/each}}): {{#if isCreate}}{{../names.pascal}}{{else}}Unit{{/if}} {
{{#if isCreate}}
        val {{../names.camel}} = {{../names.pascal}}(
            {{../identity.names.camel}} = {{../identity.type.kotlin}}.randomUUID(),
{{#each params}}
            {{names.camel}} = {{names.camel}},
{{/each}}
        )
        return {{../names.camel}}Repository.save({{../names.camel}})
{{else}}
        val {{../names.camel}} = {{../names.camel}}Repository.findById({{../identity.names.camel}})
            ?: throw NoSuchElementException("{{../names.pascal}} not found: ${{../identity.names.camel}}")
        val updated = {{../names.camel}}.copy({{#each params}}{{names.camel}} = {{names.camel}}{{#unless @last}}, {{/unless}}{{/each}})
        {{../names.camel}}Repository.save(updated)
{{/if}}
    }
{{/each}}
}
```

- [ ] **Step 4: Write query service template**

`bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/application/{{names.pascal}}QueryService.kt.hbs`:
```handlebars
package {{../package}}.application

{{#each imports}}
import {{this}}
{{/each}}
import {{../package}}.domain.{{names.pascal}}
import {{../package}}.infrastructure.{{names.pascal}}Repository
import org.springframework.stereotype.Service

@Service
class {{names.pascal}}QueryService(
    private val {{names.camel}}Repository: {{names.pascal}}Repository,
) {
{{#each queries}}

{{#if isList}}
    fun {{names.camel}}({{#each filters}}{{names.camel}}: {{type.kotlinDecl}}{{#unless @last}}, {{/unless}}{{/each}}): List<{{../names.pascal}}> {
        return {{../names.camel}}Repository.findAll()
    }
{{else}}
    fun {{names.camel}}({{../identity.names.camel}}: {{../identity.type.kotlinDecl}}): {{../names.pascal}} {
        return {{../names.camel}}Repository.findById({{../identity.names.camel}})
            ?: throw NoSuchElementException("{{../names.pascal}} not found: ${{../identity.names.camel}}")
    }
{{/if}}
{{/each}}
}
```

- [ ] **Step 5: Write repository template**

`bundles/ddd-spike/templates/src/main/kotlin/{{#each aggregates}}/infrastructure/{{names.pascal}}Repository.kt.hbs`:
```handlebars
package {{../package}}.infrastructure

{{#each imports}}
import {{this}}
{{/each}}
import {{../package}}.domain.{{names.pascal}}
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface {{names.pascal}}Repository : CrudRepository<{{names.pascal}}, {{identity.type.kotlinDecl}}>
```

- [ ] **Step 6: Write migration template**

`bundles/ddd-spike/templates/src/main/resources/db/migration/V1__create_tables.sql.hbs`:
```handlebars
{{#each aggregates}}
CREATE TABLE {{tableName}} (
{{#each allAttributes}}
    {{sqlColumn}}{{#unless @last}},{{/unless}}
{{/each}}
);

{{/each}}
```

- [ ] **Step 7: Write template rendering test**

This test verifies that templates + context produce valid output. It renders directly with Handlebars (not the engine) to test the bundle in isolation.

`bundles/ddd-spike/test/templates/render.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import Handlebars from 'handlebars';
import { enrich } from '../../src/enrich/index.js';

function loadSpec() {
  const raw = parse(readFileSync(new URL('../fixtures/order-spec.yaml', import.meta.url), 'utf-8'));
  return enrich(raw.spec, { name: raw.metadata.name, apiVersion: raw.apiVersion });
}

function renderTemplate(templatePath: string, context: Record<string, unknown>): string {
  const source = readFileSync(new URL(`../../templates/${templatePath}`, import.meta.url), 'utf-8');
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}

describe('template rendering', () => {
  it('renders domain entity', () => {
    const ctx = loadSpec();
    const agg = ctx.aggregates[0];
    const result = renderTemplate(
      'src/main/kotlin/{{#each aggregates}}/domain/{{names.pascal}}.kt.hbs',
      { ...agg, package: ctx.package },
    );

    expect(result).toContain('data class Order');
    expect(result).toContain('val orderId: UUID');
    expect(result).toContain('val customerId: UUID');
    expect(result).toContain('val status: String?');
    expect(result).toContain('import java.util.UUID');
  });

  it('renders migration SQL', () => {
    const ctx = loadSpec();
    const result = renderTemplate(
      'src/main/resources/db/migration/V1__create_tables.sql.hbs',
      ctx,
    );

    expect(result).toContain('CREATE TABLE orders');
    expect(result).toContain('order_id UUID NOT NULL');
    expect(result).toContain('customer_id UUID NOT NULL');
    expect(result).toContain("status VARCHAR(255) DEFAULT 'CREATED'");
  });

  it('renders controller with endpoints', () => {
    const ctx = loadSpec();
    const agg = ctx.aggregates[0];
    const result = renderTemplate(
      'src/main/kotlin/{{#each aggregates}}/api/{{names.pascal}}Controller.kt.hbs',
      { ...agg, package: ctx.package },
    );

    expect(result).toContain('@RestController');
    expect(result).toContain('@RequestMapping("/orders")');
    expect(result).toContain('@PostMapping');
    expect(result).toContain('@PutMapping("/{orderId}")');
    expect(result).toContain('@GetMapping("/{orderId}")');
    expect(result).toContain('fun createOrder');
    expect(result).toContain('fun updateStatus');
  });
});
```

- [ ] **Step 8: Run template tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run test/templates/render.test.ts`
Expected: PASS

If any test fails, it means the context model doesn't match what templates need — fix the enrichment, not the template.

- [ ] **Step 9: Run all spike tests**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): add Handlebars templates and rendering tests"
```

---

### Task 9: Bundle Entry Point

Wire the bundle's exports together into the Bundle interface.

**Files:**
- Create: `bundles/ddd-spike/src/schema.json`
- Create: `bundles/ddd-spike/src/helpers.ts`
- Create: `bundles/ddd-spike/src/index.ts`

- [ ] **Step 1: Create JSON Schema for spec body**

`bundles/ddd-spike/src/schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["package", "aggregates"],
  "properties": {
    "package": { "type": "string" },
    "aggregates": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["name", "attributes"],
        "properties": {
          "name": { "type": "string" },
          "attributes": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": { "type": "string" },
                "type": { "type": "string", "enum": ["uuid", "string", "int", "long", "boolean", "decimal", "date", "datetime", "object"] },
                "required": { "type": "boolean" },
                "identity": { "type": "boolean" },
                "default": {}
              }
            }
          },
          "commands": { "type": "array" },
          "queries": { "type": "array" },
          "events": { "type": "array" }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create helpers**

`bundles/ddd-spike/src/helpers.ts`:
```typescript
export const helpers: Record<string, (...args: unknown[]) => unknown> = {
  eq: (a: unknown, b: unknown) => a === b,
};
```

- [ ] **Step 3: Create bundle entry point**

`bundles/ddd-spike/src/index.ts`:
```typescript
import type { Bundle } from '@fixedcode/engine';
import specSchema from './schema.json' with { type: 'json' };
import { enrich } from './enrich/index.js';
import { helpers } from './helpers.js';

const bundle: Bundle = {
  kind: 'ddd-domain',
  specSchema,
  enrich,
  templates: '../templates',
  helpers,
};

export default bundle;
```

- [ ] **Step 4: Verify bundle compiles**

Run: `cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx tsc --noEmit`
Expected: No errors (may need adjustments for JSON import syntax depending on TS version)

- [ ] **Step 5: Commit**

```bash
git add bundles/ddd-spike/
git commit -m "feat(ddd-spike): wire bundle entry point with schema and exports"
```

---

## Phase 2: Engine Pipeline

### Task 10: Spec Parsing & Envelope Validation

**Files:**
- Create: `engine/src/engine/parse.ts`
- Create: `engine/test/engine/parse.test.ts`
- Create: `engine/test/fixtures/valid-envelope.yaml`
- Create: `engine/test/fixtures/missing-kind.yaml`
- Create: `engine/test/fixtures/missing-spec.yaml`
- Create: `engine/test/fixtures/bad-yaml.yaml`

- [ ] **Step 1: Create test fixtures**

`engine/test/fixtures/valid-envelope.yaml`:
```yaml
apiVersion: "1.0"
kind: test-bundle
metadata:
  name: test-service
  description: "A test"
spec:
  foo: bar
```

`engine/test/fixtures/missing-kind.yaml`:
```yaml
apiVersion: "1.0"
metadata:
  name: test
spec:
  foo: bar
```

`engine/test/fixtures/missing-spec.yaml`:
```yaml
apiVersion: "1.0"
kind: test-bundle
metadata:
  name: test
```

`engine/test/fixtures/bad-yaml.yaml`:
```
this: is: not: valid: yaml: [
```

- [ ] **Step 2: Write failing tests**

`engine/test/engine/parse.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseSpec, validateEnvelope } from '../../src/engine/parse.js';
import { SpecParseError, EnvelopeError } from '../../src/errors.js';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

describe('parseSpec', () => {
  it('parses valid YAML', () => {
    const result = parseSpec(join(fixturesDir, 'valid-envelope.yaml'));
    expect(result.apiVersion).toBe('1.0');
    expect(result.kind).toBe('test-bundle');
    expect(result.spec).toEqual({ foo: 'bar' });
  });

  it('throws SpecParseError for invalid YAML', () => {
    expect(() => parseSpec(join(fixturesDir, 'bad-yaml.yaml')))
      .toThrow(SpecParseError);
  });

  it('throws SpecParseError for missing file', () => {
    expect(() => parseSpec(join(fixturesDir, 'nonexistent.yaml')))
      .toThrow(SpecParseError);
  });
});

describe('validateEnvelope', () => {
  it('validates a correct envelope', () => {
    const raw = parseSpec(join(fixturesDir, 'valid-envelope.yaml'));
    const result = validateEnvelope(raw);
    expect(result.kind).toBe('test-bundle');
    expect(result.metadata.name).toBe('test-service');
    expect(result.spec).toEqual({ foo: 'bar' });
  });

  it('throws EnvelopeError for missing kind', () => {
    expect(() => {
      const raw = parseSpec(join(fixturesDir, 'missing-kind.yaml'));
      validateEnvelope(raw);
    }).toThrow(EnvelopeError);
  });

  it('throws EnvelopeError for missing spec', () => {
    expect(() => {
      const raw = parseSpec(join(fixturesDir, 'missing-spec.yaml'));
      validateEnvelope(raw);
    }).toThrow(EnvelopeError);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/parse.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement**

`engine/src/engine/parse.ts`:
```typescript
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { RawSpec } from '../types.js';
import { SpecParseError, EnvelopeError } from '../errors.js';

const SUPPORTED_API_VERSIONS = ['1.0'];

export function parseSpec(filePath: string): Record<string, unknown> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new SpecParseError(`Cannot read spec file: ${filePath}`);
  }

  try {
    return parse(content) as Record<string, unknown>;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new SpecParseError(`Failed to parse ${filePath}: ${message}`);
  }
}

export function validateEnvelope(raw: Record<string, unknown>): RawSpec {
  const apiVersion = raw.apiVersion as string | undefined;
  if (!apiVersion) {
    throw new EnvelopeError("Missing required field 'apiVersion'");
  }
  if (!SUPPORTED_API_VERSIONS.includes(apiVersion)) {
    throw new EnvelopeError(`Unsupported apiVersion '${apiVersion}'. Supported: ${SUPPORTED_API_VERSIONS.join(', ')}`);
  }

  const kind = raw.kind as string | undefined;
  if (!kind) {
    throw new EnvelopeError("Missing required field 'kind'");
  }

  const metadata = raw.metadata as Record<string, unknown> | undefined;
  if (!metadata || typeof metadata.name !== 'string') {
    throw new EnvelopeError("Missing required field 'metadata.name'");
  }

  const spec = raw.spec as Record<string, unknown> | undefined;
  if (!spec) {
    throw new EnvelopeError("Missing required field 'spec'");
  }

  return {
    apiVersion,
    kind,
    metadata: {
      name: metadata.name,
      description: metadata.description as string | undefined,
    },
    spec,
  };
}
```

- [ ] **Step 5: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/parse.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add engine/
git commit -m "feat(engine): add spec parsing and envelope validation"
```

---

### Task 11: Config Loading & Bundle Resolution

**Files:**
- Create: `engine/src/engine/config.ts`
- Create: `engine/src/engine/resolve.ts`
- Create: `engine/test/engine/config.test.ts`
- Create: `engine/test/engine/resolve.test.ts`
- Create: `engine/test/fixtures/test-bundle/src/index.ts`
- Create: `engine/test/fixtures/test-bundle/package.json`

- [ ] **Step 1: Write config tests**

`engine/test/engine/config.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/engine/config.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('loadConfig', () => {
  it('loads config from a directory', () => {
    const dir = join(tmpdir(), `fixedcode-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '.fixedcode.yaml'), 'bundles:\n  test: "./bundles/test"');

    const config = loadConfig(dir);
    expect(config.bundles.test).toBe('./bundles/test');

    rmSync(dir, { recursive: true });
  });

  it('returns empty bundles when no config found', () => {
    const dir = join(tmpdir(), `fixedcode-empty-${Date.now()}`);
    mkdirSync(dir, { recursive: true });

    const config = loadConfig(dir);
    expect(config.bundles).toEqual({});

    rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/config.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement config loading**

`engine/src/engine/config.ts`:
```typescript
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { homedir } from 'node:os';
import type { FixedCodeConfig } from '../types.js';

const PROJECT_CONFIG = '.fixedcode.yaml';
const USER_CONFIG_PATH = join(homedir(), '.config', 'fixedcode', 'config.yaml');

function tryLoadYaml(filePath: string): FixedCodeConfig | null {
  if (!existsSync(filePath)) return null;
  try {
    const content = readFileSync(filePath, 'utf-8');
    const raw = parse(content) as Record<string, unknown>;
    return {
      bundles: (raw.bundles as Record<string, string>) ?? {},
    };
  } catch {
    return null;
  }
}

export function loadConfig(cwd: string): FixedCodeConfig {
  // Project-level takes precedence
  const projectConfig = tryLoadYaml(join(cwd, PROJECT_CONFIG));
  if (projectConfig) return projectConfig;

  // Fall back to user-level
  const userConfig = tryLoadYaml(USER_CONFIG_PATH);
  if (userConfig) return userConfig;

  return { bundles: {} };
}
```

- [ ] **Step 4: Run config tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/config.test.ts`
Expected: PASS

- [ ] **Step 5: Create test bundle fixture**

`engine/test/fixtures/test-bundle/package.json`:
```json
{
  "name": "test-bundle",
  "type": "module",
  "main": "src/index.js"
}
```

`engine/test/fixtures/test-bundle/src/index.ts` (pre-compiled as .js for test loading):

Actually, create `engine/test/fixtures/test-bundle/src/index.js`:
```javascript
export default {
  kind: 'test-kind',
  specSchema: { type: 'object' },
  enrich(spec, metadata) {
    return { message: `Hello ${metadata.name}`, ...spec };
  },
  templates: '../templates',
};
```

Create `engine/test/fixtures/test-bundle/templates/hello.txt.hbs`:
```handlebars
Hello {{message}}!
```

- [ ] **Step 6: Write resolve tests**

`engine/test/engine/resolve.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { resolveBundle } from '../../src/engine/resolve.js';
import { BundleNotFoundError, BundleLoadError } from '../../src/errors.js';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

describe('resolveBundle', () => {
  it('loads a bundle from a local path', async () => {
    const bundle = await resolveBundle('test-kind', {
      bundles: { 'test-kind': join(fixturesDir, 'test-bundle') },
    });
    expect(bundle.kind).toBe('test-kind');
    expect(typeof bundle.enrich).toBe('function');
  });

  it('throws BundleNotFoundError for unknown kind', async () => {
    await expect(resolveBundle('unknown', { bundles: {} }))
      .rejects.toThrow(BundleNotFoundError);
  });

  it('throws BundleLoadError for invalid bundle path', async () => {
    await expect(resolveBundle('bad', { bundles: { bad: '/nonexistent/path' } }))
      .rejects.toThrow(BundleLoadError);
  });
});
```

- [ ] **Step 7: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/resolve.test.ts`
Expected: FAIL

- [ ] **Step 8: Implement bundle resolution**

`engine/src/engine/resolve.ts`:
```typescript
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Bundle, FixedCodeConfig } from '../types.js';
import { BundleNotFoundError, BundleLoadError } from '../errors.js';

function isLocalPath(source: string): boolean {
  return source.startsWith('.') || source.startsWith('/');
}

function validateBundleExport(mod: unknown, source: string): Bundle {
  const bundle = (mod as Record<string, unknown>).default as Record<string, unknown> | undefined;
  if (!bundle) {
    throw new BundleLoadError(source, 'no default export');
  }
  if (typeof bundle.kind !== 'string') {
    throw new BundleLoadError(source, "missing 'kind' export");
  }
  if (typeof bundle.enrich !== 'function') {
    throw new BundleLoadError(source, "missing 'enrich' export");
  }
  if (typeof bundle.templates !== 'string') {
    throw new BundleLoadError(source, "missing 'templates' export");
  }
  return bundle as unknown as Bundle;
}

export async function resolveBundle(kind: string, config: FixedCodeConfig): Promise<Bundle> {
  const source = config.bundles[kind];
  if (!source) {
    throw new BundleNotFoundError(kind);
  }

  try {
    if (isLocalPath(source)) {
      const absolutePath = resolve(source);
      if (!existsSync(absolutePath)) {
        throw new BundleLoadError(source, `path does not exist: ${absolutePath}`);
      }

      // Resolve entry point: try package.json main, then src/index.js
      let entryPoint: string;
      const pkgPath = join(absolutePath, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = await import(pathToFileURL(pkgPath).href, { with: { type: 'json' } });
        const main = pkg.default?.main ?? 'src/index.js';
        entryPoint = join(absolutePath, main);
      } else {
        entryPoint = join(absolutePath, 'src', 'index.js');
      }

      const mod = await import(pathToFileURL(entryPoint).href);
      const bundle = validateBundleExport(mod, source);

      // Resolve templates path relative to bundle root
      bundle.templates = resolve(absolutePath, bundle.templates as string);
      return bundle;
    } else {
      // npm package — must be pre-installed
      const mod = await import(source);
      return validateBundleExport(mod, source);
    }
  } catch (err) {
    if (err instanceof BundleLoadError || err instanceof BundleNotFoundError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new BundleLoadError(source, message);
  }
}
```

- [ ] **Step 9: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/resolve.test.ts`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add engine/
git commit -m "feat(engine): add config loading and bundle resolution"
```

---

### Task 12: Spec Body Validation

**Files:**
- Create: `engine/src/engine/validate.ts`
- Create: `engine/test/engine/validate.test.ts`

- [ ] **Step 1: Write failing tests**

`engine/test/engine/validate.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateBody } from '../../src/engine/validate.js';
import { SpecValidationError } from '../../src/errors.js';

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    count: { type: 'number' },
  },
};

describe('validateBody', () => {
  it('passes valid spec', () => {
    expect(() => validateBody({ name: 'test' }, schema)).not.toThrow();
  });

  it('passes with optional fields', () => {
    expect(() => validateBody({ name: 'test', count: 5 }, schema)).not.toThrow();
  });

  it('throws SpecValidationError for missing required field', () => {
    expect(() => validateBody({}, schema)).toThrow(SpecValidationError);
  });

  it('throws SpecValidationError for wrong type', () => {
    expect(() => validateBody({ name: 123 }, schema)).toThrow(SpecValidationError);
  });

  it('includes field path in error message', () => {
    try {
      validateBody({ name: 123 }, schema);
    } catch (err) {
      expect((err as Error).message).toContain('/name');
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/validate.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

`engine/src/engine/validate.ts`:
```typescript
import Ajv from 'ajv';
import { SpecValidationError } from '../errors.js';

const ajv = new Ajv({ allErrors: true });

export function validateBody(spec: Record<string, unknown>, schema: Record<string, unknown>): void {
  const validate = ajv.compile(schema);
  const valid = validate(spec);

  if (!valid && validate.errors) {
    const details = validate.errors
      .map(e => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    throw new SpecValidationError(`Spec validation failed: ${details}`);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/validate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add engine/
git commit -m "feat(engine): add JSON Schema spec body validation"
```

---

### Task 13: Template Rendering Engine

**Files:**
- Create: `engine/src/engine/render.ts`
- Create: `engine/test/engine/render.test.ts`
- Create test template fixtures

- [ ] **Step 1: Create template test fixtures**

```bash
mkdir -p engine/test/fixtures/test-bundle/templates
```

`engine/test/fixtures/templates/simple/hello.txt.hbs`:
```handlebars
Hello {{name}}!
```

`engine/test/fixtures/templates/simple/static.txt`:
```
This is a static file.
```

`engine/test/fixtures/templates/each/{{#each items}}/{{names.pascal}}.txt.hbs`:
```handlebars
Item: {{names.pascal}} ({{names.camel}})
```

`engine/test/fixtures/templates/conditional/maybe.txt.hbs`:
```handlebars
{{#if showIt}}
Visible content
{{/if}}
```

- [ ] **Step 2: Write failing tests**

`engine/test/engine/render.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { renderTemplates } from '../../src/engine/render.js';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/templates');

describe('renderTemplates', () => {
  it('renders a simple .hbs template', async () => {
    const files = await renderTemplates(
      join(fixturesDir, 'simple'),
      { name: 'World' },
    );

    const hello = files.find(f => f.path === 'hello.txt');
    expect(hello).toBeDefined();
    expect(hello!.content).toBe('Hello World!\n');
  });

  it('copies static files as-is', async () => {
    const files = await renderTemplates(
      join(fixturesDir, 'simple'),
      { name: 'World' },
    );

    const static_ = files.find(f => f.path === 'static.txt');
    expect(static_).toBeDefined();
    expect(static_!.content).toBe('This is a static file.\n');
  });

  it('skips templates that render to empty', async () => {
    const files = await renderTemplates(
      join(fixturesDir, 'conditional'),
      { showIt: false },
    );

    expect(files).toHaveLength(0);
  });

  it('renders with {{#each}} directory iteration', async () => {
    const files = await renderTemplates(
      join(fixturesDir, 'each'),
      {
        items: [
          { names: { pascal: 'Order', camel: 'order' } },
          { names: { pascal: 'Product', camel: 'product' } },
        ],
      },
    );

    expect(files).toHaveLength(2);
    expect(files.find(f => f.path === 'Order.txt')).toBeDefined();
    expect(files.find(f => f.path === 'Product.txt')).toBeDefined();
    expect(files[0].content).toContain('Item: Order (order)');
  });

  it('uses noEscape (raw output)', async () => {
    const files = await renderTemplates(
      join(fixturesDir, 'simple'),
      { name: '<b>HTML</b>' },
    );

    const hello = files.find(f => f.path === 'hello.txt');
    expect(hello!.content).toContain('<b>HTML</b>');
  });

  it('supports custom helpers', async () => {
    const files = await renderTemplates(
      join(fixturesDir, 'simple'),
      { name: 'World' },
      { shout: (s: unknown) => String(s).toUpperCase() },
    );
    // helpers are registered but this template doesn't use them — just verify no error
    expect(files.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/render.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement rendering**

`engine/src/engine/render.ts`:
```typescript
import { readFileSync, statSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import Handlebars from 'handlebars';
import fg from 'fast-glob';
import type { RenderedFile, Context } from '../types.js';
import { RenderError } from '../errors.js';

const EACH_DIR_PATTERN = /^\{\{#each (\w+)\}\}$/;
const EACH_END_PATTERN = /^\{\{\/each\}\}$/;
const HBS_EXT = '.hbs';

function resolvePathExpressions(pathStr: string, context: Context): string {
  // Simple Handlebars interpolation in file/dir names (not #each — that's handled separately)
  return pathStr.replace(/\{\{([^#/][^}]*)\}\}/g, (_, expr) => {
    const trimmed = expr.trim();
    const parts = trimmed.split('.');
    let value: unknown = context;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return '';
      }
    }
    return String(value ?? '');
  });
}

interface TemplateEntry {
  /** Absolute path to the source file */
  sourcePath: string;
  /** Relative path from templates root, with Handlebars expressions in directory names */
  relativePath: string;
}

function collectTemplateEntries(templatesDir: string): TemplateEntry[] {
  const entries = fg.sync('**/*', {
    cwd: templatesDir,
    dot: false,
    onlyFiles: true,
    absolute: false,
  });

  return entries.map(relativePath => ({
    sourcePath: join(templatesDir, relativePath),
    relativePath,
  }));
}

function renderSingleFile(
  entry: TemplateEntry,
  context: Context,
  hbs: typeof Handlebars,
): RenderedFile | null {
  const isTemplate = entry.relativePath.endsWith(HBS_EXT);
  const content = readFileSync(entry.sourcePath, 'utf-8');

  let outputPath = entry.relativePath;
  if (isTemplate) {
    outputPath = outputPath.slice(0, -HBS_EXT.length);
  }

  // Resolve Handlebars expressions in the path
  outputPath = resolvePathExpressions(outputPath, context);

  if (!outputPath || outputPath.includes('..')) {
    throw new RenderError(entry.relativePath, `resolved path is empty or contains traversal: '${outputPath}'`);
  }

  if (isTemplate) {
    try {
      const template = hbs.compile(content, { noEscape: true });
      const rendered = template(context);
      if (rendered.trim() === '') return null;
      return { path: outputPath, content: rendered };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new RenderError(entry.relativePath, message);
    }
  } else {
    return { path: outputPath, content };
  }
}

/**
 * Walk a templates directory structure and render all templates.
 * Supports {{#each key}} directory names for multi-file generation.
 */
export async function renderTemplates(
  templatesDir: string,
  context: Context,
  helpers?: Record<string, (...args: unknown[]) => unknown>,
  partials?: Record<string, string>,
): Promise<RenderedFile[]> {
  const hbs = Handlebars.create();

  if (helpers) {
    for (const [name, fn] of Object.entries(helpers)) {
      hbs.registerHelper(name, fn);
    }
  }
  if (partials) {
    for (const [name, source] of Object.entries(partials)) {
      hbs.registerPartial(name, source);
    }
  }

  const entries = collectTemplateEntries(templatesDir);
  const results: RenderedFile[] = [];

  for (const entry of entries) {
    // Check if any parent directory is an {{#each}} directive
    const pathParts = entry.relativePath.split('/');
    let eachKey: string | null = null;
    let eachStartIdx = -1;
    let eachEndIdx = -1;

    for (let i = 0; i < pathParts.length; i++) {
      const match = pathParts[i].match(EACH_DIR_PATTERN);
      if (match) {
        eachKey = match[1];
        eachStartIdx = i;
      }
      if (EACH_END_PATTERN.test(pathParts[i])) {
        eachEndIdx = i;
      }
    }

    if (eachKey && eachStartIdx >= 0) {
      const items = context[eachKey] as Record<string, unknown>[] | undefined;
      if (!Array.isArray(items)) continue;

      // Build the path without the {{#each}} and {{/each}} segments
      const beforeEach = pathParts.slice(0, eachStartIdx);
      const endIdx = eachEndIdx >= 0 ? eachEndIdx + 1 : eachStartIdx + 1;
      const afterEach = pathParts.slice(endIdx);
      const innerPath = afterEach.join('/');

      for (const item of items) {
        const itemContext = { ...item, ...context } as Context;
        // Remove the collection from context to avoid confusion
        delete (itemContext as Record<string, unknown>)[eachKey!];

        const innerRelativePath = [...beforeEach, innerPath].filter(Boolean).join('/');
        const innerEntry: TemplateEntry = {
          sourcePath: entry.sourcePath,
          relativePath: innerRelativePath,
        };

        const file = renderSingleFile(innerEntry, itemContext, hbs);
        if (file) results.push(file);
      }
    } else {
      const file = renderSingleFile(entry, context, hbs);
      if (file) results.push(file);
    }
  }

  return results;
}
```

- [ ] **Step 5: Run tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/render.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add engine/
git commit -m "feat(engine): add Handlebars template rendering with #each directory support"
```

---

### Task 14: File Writing & Pipeline Orchestration

**Files:**
- Create: `engine/src/engine/write.ts`
- Create: `engine/src/engine/pipeline.ts`
- Create: `engine/test/engine/write.test.ts`
- Create: `engine/test/engine/pipeline.test.ts`

- [ ] **Step 1: Write failing tests for write**

`engine/test/engine/write.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { writeFiles } from '../../src/engine/write.js';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('writeFiles', () => {
  it('writes rendered files to output dir', () => {
    const outDir = join(tmpdir(), `fixedcode-write-${Date.now()}`);
    const files = [
      { path: 'hello.txt', content: 'Hello World!' },
      { path: 'sub/dir/nested.txt', content: 'Nested content' },
    ];

    writeFiles(files, outDir);

    expect(readFileSync(join(outDir, 'hello.txt'), 'utf-8')).toBe('Hello World!');
    expect(readFileSync(join(outDir, 'sub/dir/nested.txt'), 'utf-8')).toBe('Nested content');

    rmSync(outDir, { recursive: true });
  });

  it('returns file list in dry-run mode', () => {
    const outDir = join(tmpdir(), `fixedcode-dry-${Date.now()}`);
    const files = [
      { path: 'hello.txt', content: 'Hello World!' },
    ];

    const written = writeFiles(files, outDir, { dryRun: true });

    expect(written).toEqual(['hello.txt']);
    expect(existsSync(join(outDir, 'hello.txt'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/write.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement write**

`engine/src/engine/write.ts`:
```typescript
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { RenderedFile } from '../types.js';
import { WriteError } from '../errors.js';

export interface WriteOptions {
  dryRun?: boolean;
}

export function writeFiles(
  files: RenderedFile[],
  outputDir: string,
  options: WriteOptions = {},
): string[] {
  const paths = files.map(f => f.path);

  if (options.dryRun) {
    return paths;
  }

  for (const file of files) {
    const fullPath = join(outputDir, file.path);
    try {
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, file.content, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new WriteError(fullPath, message);
    }
  }

  return paths;
}
```

- [ ] **Step 4: Run write tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/write.test.ts`
Expected: PASS

- [ ] **Step 5: Write pipeline integration test**

`engine/test/engine/pipeline.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generate } from '../../src/engine/pipeline.js';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

describe('generate (pipeline)', () => {
  it('runs full pipeline with test bundle', async () => {
    const outDir = join(tmpdir(), `fixedcode-pipeline-${Date.now()}`);

    const result = await generate({
      specPath: join(fixturesDir, 'valid-envelope.yaml'),
      outputDir: outDir,
      config: {
        bundles: {
          'test-kind': join(fixturesDir, 'test-bundle'),
        },
      },
    });

    expect(result.files.length).toBeGreaterThan(0);
    expect(existsSync(join(outDir, 'hello.txt'))).toBe(true);

    rmSync(outDir, { recursive: true });
  });

  it('supports dry-run', async () => {
    const outDir = join(tmpdir(), `fixedcode-dry-pipeline-${Date.now()}`);

    const result = await generate({
      specPath: join(fixturesDir, 'valid-envelope.yaml'),
      outputDir: outDir,
      dryRun: true,
      config: {
        bundles: {
          'test-kind': join(fixturesDir, 'test-bundle'),
        },
      },
    });

    expect(result.files.length).toBeGreaterThan(0);
    expect(existsSync(outDir)).toBe(false);
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/pipeline.test.ts`
Expected: FAIL

- [ ] **Step 7: Implement pipeline**

`engine/src/engine/pipeline.ts`:
```typescript
import type { FixedCodeConfig, RenderedFile } from '../types.js';
import { parseSpec, validateEnvelope } from './parse.js';
import { resolveBundle } from './resolve.js';
import { validateBody } from './validate.js';
import { renderTemplates } from './render.js';
import { writeFiles } from './write.js';
import { EnrichmentError } from '../errors.js';

export interface GenerateOptions {
  specPath: string;
  outputDir: string;
  config: FixedCodeConfig;
  dryRun?: boolean;
}

export interface GenerateResult {
  files: string[];
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  // 1. Parse
  const raw = parseSpec(options.specPath);

  // 2. Validate envelope
  const envelope = validateEnvelope(raw);

  // 3. Resolve bundle
  const bundle = await resolveBundle(envelope.kind, options.config);

  // 4. Validate spec body
  validateBody(envelope.spec, bundle.specSchema);

  // 5. Enrich
  let context;
  try {
    context = bundle.enrich(envelope.spec, {
      name: envelope.metadata.name,
      description: envelope.metadata.description,
      apiVersion: envelope.apiVersion,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new EnrichmentError(bundle.kind, message);
  }

  // 6. Render
  const rendered = await renderTemplates(
    bundle.templates,
    context,
    bundle.helpers,
    bundle.partials,
  );

  // 7. Write
  const files = writeFiles(rendered, options.outputDir, { dryRun: options.dryRun });

  return { files };
}
```

- [ ] **Step 8: Run pipeline tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/engine/pipeline.test.ts`
Expected: PASS

- [ ] **Step 9: Run all engine tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run`
Expected: All tests pass

- [ ] **Step 10: Update engine/src/index.ts with pipeline export**

```typescript
export type { Bundle, SpecMetadata, Context, RawSpec, RenderedFile, FixedCodeConfig } from './types.js';
export {
  FixedCodeError, SpecParseError, EnvelopeError, BundleNotFoundError,
  BundleLoadError, SpecValidationError, EnrichmentError, RenderError, WriteError,
} from './errors.js';
export { generate } from './engine/pipeline.js';
export type { GenerateOptions, GenerateResult } from './engine/pipeline.js';
```

- [ ] **Step 11: Commit**

```bash
git add engine/
git commit -m "feat(engine): add file writing and pipeline orchestration"
```

---

## Phase 3: CLI

### Task 15: Spec Resolution & CLI Commands

**Files:**
- Create: `engine/src/cli/spec-resolver.ts`
- Create: `engine/src/cli/generate.ts`
- Create: `engine/src/cli/validate-cmd.ts`
- Create: `engine/src/cli/index.ts`
- Create: `engine/test/cli/spec-resolver.test.ts`
- Create: `engine/test/cli/cli.test.ts`

- [ ] **Step 1: Write spec resolution tests**

`engine/test/cli/spec-resolver.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { resolveSpecPath } from '../../src/cli/spec-resolver.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('resolveSpecPath', () => {
  it('returns explicit .yaml path as-is', () => {
    const dir = join(tmpdir(), `fixedcode-resolve-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const specPath = join(dir, 'my-spec.yaml');
    writeFileSync(specPath, 'test: true');

    expect(resolveSpecPath(specPath, dir)).toBe(specPath);
    rmSync(dir, { recursive: true });
  });

  it('resolves shorthand to <name>.yaml', () => {
    const dir = join(tmpdir(), `fixedcode-resolve-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'order.yaml'), 'test: true');

    expect(resolveSpecPath('order', dir)).toBe(join(dir, 'order.yaml'));
    rmSync(dir, { recursive: true });
  });

  it('resolves shorthand to <name>-domain.yaml', () => {
    const dir = join(tmpdir(), `fixedcode-resolve-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'order-domain.yaml'), 'test: true');

    expect(resolveSpecPath('order', dir)).toBe(join(dir, 'order-domain.yaml'));
    rmSync(dir, { recursive: true });
  });

  it('resolves shorthand to specs/<name>.yaml', () => {
    const dir = join(tmpdir(), `fixedcode-resolve-${Date.now()}`);
    mkdirSync(join(dir, 'specs'), { recursive: true });
    writeFileSync(join(dir, 'specs', 'order.yaml'), 'test: true');

    expect(resolveSpecPath('order', dir)).toBe(join(dir, 'specs', 'order.yaml'));
    rmSync(dir, { recursive: true });
  });

  it('throws if spec not found', () => {
    const dir = join(tmpdir(), `fixedcode-resolve-${Date.now()}`);
    mkdirSync(dir, { recursive: true });

    expect(() => resolveSpecPath('nonexistent', dir)).toThrow();
    rmSync(dir, { recursive: true });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/cli/spec-resolver.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement spec resolver**

`engine/src/cli/spec-resolver.ts`:
```typescript
import { existsSync } from 'node:fs';
import { join, isAbsolute, extname } from 'node:path';
import { SpecParseError } from '../errors.js';

export function resolveSpecPath(input: string, cwd: string): string {
  // If it's already an absolute path or has a yaml extension, use as-is
  if (isAbsolute(input) && existsSync(input)) return input;
  if (extname(input) === '.yaml' || extname(input) === '.yml') {
    const full = isAbsolute(input) ? input : join(cwd, input);
    if (existsSync(full)) return full;
    throw new SpecParseError(`Spec file not found: ${full}`);
  }

  // Try resolution order
  const candidates = [
    join(cwd, `${input}.yaml`),
    join(cwd, `${input}-domain.yaml`),
    join(cwd, 'specs', `${input}.yaml`),
    join(cwd, 'specs', `${input}-domain.yaml`),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new SpecParseError(
    `Cannot find spec for '${input}'. Searched:\n${candidates.map(c => `  - ${c}`).join('\n')}`,
  );
}
```

- [ ] **Step 4: Run spec resolver tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/cli/spec-resolver.test.ts`
Expected: PASS

- [ ] **Step 5: Implement CLI commands**

`engine/src/cli/generate.ts`:
```typescript
import { resolve } from 'node:path';
import { generate } from '../engine/pipeline.js';
import { loadConfig } from '../engine/config.js';
import { resolveSpecPath } from './spec-resolver.js';
import { FixedCodeError } from '../errors.js';

export async function handleGenerate(
  specInput: string,
  outputDir?: string,
  options: { dryRun?: boolean; config?: string } = {},
): Promise<void> {
  const cwd = process.cwd();
  const specPath = resolveSpecPath(specInput, cwd);
  const config = loadConfig(options.config ? resolve(options.config) : cwd);
  const output = resolve(outputDir ?? './build');

  try {
    const result = await generate({
      specPath,
      outputDir: output,
      config,
      dryRun: options.dryRun,
    });

    if (options.dryRun) {
      console.log('Dry run — files that would be generated:');
      result.files.forEach(f => console.log(`  ${f}`));
    } else {
      console.log(`Generated ${result.files.length} files in ${output}`);
      result.files.forEach(f => console.log(`  ${f}`));
    }
  } catch (err) {
    if (err instanceof FixedCodeError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
```

`engine/src/cli/validate-cmd.ts`:
```typescript
import { resolve } from 'node:path';
import { parseSpec, validateEnvelope } from '../engine/parse.js';
import { resolveBundle } from '../engine/resolve.js';
import { validateBody } from '../engine/validate.js';
import { loadConfig } from '../engine/config.js';
import { resolveSpecPath } from './spec-resolver.js';
import { FixedCodeError } from '../errors.js';

export async function handleValidate(
  specInput: string,
  options: { config?: string } = {},
): Promise<void> {
  const cwd = process.cwd();
  const specPath = resolveSpecPath(specInput, cwd);
  const config = loadConfig(options.config ? resolve(options.config) : cwd);

  try {
    const raw = parseSpec(specPath);
    const envelope = validateEnvelope(raw);
    const bundle = await resolveBundle(envelope.kind, config);
    validateBody(envelope.spec, bundle.specSchema);

    console.log(`✓ ${specPath} is valid (kind: ${envelope.kind})`);
  } catch (err) {
    if (err instanceof FixedCodeError) {
      console.error(`Validation failed: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
```

`engine/src/cli/index.ts`:
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { handleGenerate } from './generate.js';
import { handleValidate } from './validate-cmd.js';

const program = new Command()
  .name('fixedcode')
  .description('Pluggable, spec-driven code generation')
  .version('0.1.0');

program
  .command('generate')
  .alias('g')
  .description('Generate code from a spec file')
  .argument('<spec>', 'Spec file path or shorthand name')
  .argument('[output]', 'Output directory', './build')
  .option('--dry-run', 'Show what would be generated without writing')
  .option('--config <path>', 'Path to .fixedcode.yaml')
  .action(async (spec: string, output: string, opts: Record<string, unknown>) => {
    await handleGenerate(spec, output, {
      dryRun: opts.dryRun as boolean,
      config: opts.config as string,
    });
  });

program
  .command('validate')
  .alias('v')
  .description('Validate a spec file against its bundle schema')
  .argument('<spec>', 'Spec file path or shorthand name')
  .option('--config <path>', 'Path to .fixedcode.yaml')
  .action(async (spec: string, opts: Record<string, unknown>) => {
    await handleValidate(spec, { config: opts.config as string });
  });

program.parse();
```

- [ ] **Step 6: Run all engine tests**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add engine/
git commit -m "feat(engine): add CLI with generate and validate commands"
```

---

## Phase 2.5: End-to-End Integration

### Task 16: End-to-End Test with Spike Bundle

Wire the spike bundle to the engine and generate real Kotlin files from the order spec.

**Files:**
- Create: `engine/test/e2e/generate-ddd.test.ts`
- Create: `.fixedcode.yaml` (root config)

- [ ] **Step 1: Build the spike bundle**

```bash
cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npm run build
```

If this fails due to the `@fixedcode/engine` dependency not being built yet:
```bash
cd /home/gibbon/projects/fixedcode/engine && npm run build
cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npm install && npm run build
```

- [ ] **Step 2: Create root config**

`.fixedcode.yaml`:
```yaml
bundles:
  ddd-domain: "./bundles/ddd-spike"
```

- [ ] **Step 3: Write e2e test**

`engine/test/e2e/generate-ddd.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generate } from '../../src/engine/pipeline.js';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const projectRoot = join(import.meta.dirname, '../../..');
const specPath = join(projectRoot, 'bundles/ddd-spike/test/fixtures/order-spec.yaml');

describe('e2e: generate DDD from order spec', () => {
  it('generates Kotlin domain entity', async () => {
    const outDir = join(tmpdir(), `fixedcode-e2e-${Date.now()}`);

    await generate({
      specPath,
      outputDir: outDir,
      config: {
        bundles: {
          'ddd-domain': join(projectRoot, 'bundles/ddd-spike'),
        },
      },
    });

    const entity = readFileSync(
      join(outDir, 'src/main/kotlin/domain/Order.kt'),
      'utf-8',
    );
    expect(entity).toContain('data class Order');
    expect(entity).toContain('val orderId: UUID');

    const controller = readFileSync(
      join(outDir, 'src/main/kotlin/api/OrderController.kt'),
      'utf-8',
    );
    expect(controller).toContain('@RestController');
    expect(controller).toContain('@PostMapping');

    const migration = readFileSync(
      join(outDir, 'src/main/resources/db/migration/V1__create_tables.sql'),
      'utf-8',
    );
    expect(migration).toContain('CREATE TABLE orders');

    rmSync(outDir, { recursive: true });
  });
});
```

**Note:** The exact output paths will depend on how the `{{#each aggregates}}` directory name resolves. The test paths may need adjustment once the rendering is verified. The test is intentionally written to verify the content matters more than exact paths.

- [ ] **Step 4: Run e2e test**

Run: `cd /home/gibbon/projects/fixedcode/engine && npx vitest run test/e2e/generate-ddd.test.ts`
Expected: PASS

If it fails, debug the specific step (enrichment, rendering, path resolution) and fix. This is the integration point where all pieces come together.

- [ ] **Step 5: Run full test suite across both packages**

```bash
cd /home/gibbon/projects/fixedcode/bundles/ddd-spike && npx vitest run
cd /home/gibbon/projects/fixedcode/engine && npx vitest run
```
Expected: All tests pass in both packages

- [ ] **Step 6: Commit**

```bash
git add .fixedcode.yaml engine/
git commit -m "feat: end-to-end integration test with DDD spike bundle"
```

---

## Summary

| Phase | Tasks | What it proves |
|-------|-------|----------------|
| Phase 1 (Tasks 1-9) | Context model, enrichment, templates | The DDD context model is clean enough for trivially simple templates |
| Phase 2 (Tasks 10-14) | Engine pipeline steps | Parse, validate, resolve, render, write all work in isolation |
| Phase 3 (Task 15) | CLI | Users can run `fixedcode g order` from the command line |
| Integration (Task 16) | End-to-end | Full flow works: YAML spec → enriched context → rendered Kotlin files |

**Total: 16 tasks, ~80 steps**

After this plan is complete, the FixedCode engine is functional with:
- A working CLI (`fixedcode generate`, `fixedcode validate`)
- A pluggable bundle system (local paths, npm packages)
- A validated DDD context model (spike bundle)
- Full test coverage across all pipeline steps
- Typed error hierarchy with actionable messages

**Not included in this plan (future work):**
- Phase 4: Reference bundle (clean CRUD REST bundle for documentation)
- Phase 5: Polish (error messages, `bundle init` scaffolding, `--diff`, post-render hooks)
- Bundle inheritance, git URL sources, MCP integration
