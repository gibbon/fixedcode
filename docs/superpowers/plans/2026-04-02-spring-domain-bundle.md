# Spring Domain Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `spring-domain` fixedcode bundle that generates a complete Spring/Kotlin DDD service from a bounded-context spec, including an engine extension to support one-to-many file expansion.

**Architecture:** The engine gets a new optional `generateFiles()` contract that lets a bundle return an explicit list of (template, outputPath, context) tuples instead of rendering a flat template directory. The `spring-domain` bundle uses this to expand per-aggregate, per-command, and per-entity templates from a single spec. All convention logic (HTTP routes, auth annotations, response types) lives in TypeScript enrichment; Handlebars templates are pure interpolation.

**Tech Stack:** TypeScript (ESM), Handlebars, Vitest, Spring/Kotlin target output. Bundle follows the same structure as `bundles/spring-library`.

**Spec:** `docs/superpowers/specs/2026-04-02-spring-domain-bundle-design.md`

---

> **Scope note:** This plan has two independent streams — engine changes (Tasks 1–3) and the spring-domain bundle (Tasks 4–21). Engine changes are a prerequisite for Task 20 (wiring generateFiles into the pipeline test) but Tasks 4–19 can proceed independently.

---

## File Map

**Engine changes:**
- Modify: `engine/src/types.ts` — add `FileEntry` interface, add `generateFiles?` to `Bundle`
- Modify: `engine/src/engine/render.ts` — add `renderFile(absPath, ctx)` function
- Modify: `engine/src/engine/pipeline.ts` — branch on `bundle.generateFiles`

**New bundle: `bundles/spring-domain/`**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `schema.json` — JSON Schema for the spring-domain spec format
- Create: `src/index.ts` — exports `enrich()`, `generateFiles()`, and default bundle object
- Create: `src/enrich/naming.ts` — naming variants (pascal, camel, snake, kebab, plural)
- Create: `src/enrich/conventions.ts` — convention engines (detectPattern, deriveHttp, deriveAuth, deriveResponse)
- Create: `src/enrich/spec.ts` — parse and validate the raw spec body
- Create: `src/enrich/attribute.ts` — enrich a single attribute (type mapping, required/optional, identity detection)
- Create: `src/enrich/event.ts` — enrich event definitions
- Create: `src/enrich/command.ts` — enrich commands (full HTTP/auth/response derivation)
- Create: `src/enrich/query.ts` — enrich queries
- Create: `src/enrich/entity.ts` — enrich entities (composition of attribute/command/query/event enrichers)
- Create: `src/enrich/aggregate.ts` — enrich aggregates (composition of all enrichers)
- Create: `test/enrich/naming.test.ts`
- Create: `test/enrich/conventions.test.ts`
- Create: `test/enrich/command.test.ts`
- Create: `test/enrich/query.test.ts`
- Create: `test/enrich/aggregate.test.ts`
- Create: `test/generateFiles.test.ts`
- Create: `test/e2e.test.ts` — generate from workspace-domain spec, assert output file list

**Templates (ported from gap-cli aggregate bundle, converted from Go tmpl to Handlebars):**
- `templates/src/main/kotlin/domain/shared/DomainEvent.kt.hbs`
- `templates/src/main/kotlin/domain/shared/ValidationResult.kt.hbs`
- `templates/src/main/kotlin/domain/[aggregate]/Aggregate.kt.hbs`
- `templates/src/main/kotlin/domain/[aggregate]/AggregateEvents.kt.hbs`
- `templates/src/main/kotlin/domain/[aggregate]/commands/[command].kt.hbs`
- `templates/src/main/kotlin/domain/[aggregate]/entities/[entity].kt.hbs`
- `templates/src/main/kotlin/domain/[aggregate]/entities/[entity]Events.kt.hbs`
- `templates/src/main/kotlin/application/[aggregate]/AggregateCommandService.kt.hbs`
- `templates/src/main/kotlin/application/[aggregate]/AggregateQueryService.kt.hbs`
- `templates/src/main/kotlin/api/[aggregate]/AggregateApiDelegateImpl.kt.hbs`
- `templates/src/main/kotlin/infrastructure/[aggregate]/AggregateReadRepositoryImpl.kt.hbs`
- `templates/src/main/kotlin/infrastructure/[aggregate]/AggregateWriteRepositoryImpl.kt.hbs`
- `templates/src/test/kotlin/domain/[aggregate]/AggregateTest.kt.hbs`
- `templates/src/test/kotlin/application/[aggregate]/AggregateCommandServiceTest.kt.hbs`
- `templates/src/test/kotlin/api/[aggregate]/AggregateApiDelegateImplTest.kt.hbs`

---

## Task 1: Add FileEntry and generateFiles to engine types

**Files:**
- Modify: `engine/src/types.ts`

- [ ] **Read the current Bundle interface**

  Read `engine/src/types.ts`. Confirm `Bundle` has `kind`, `specSchema`, `enrich`, `templates`, optional `helpers` and `partials`. No `generateFiles` or `FileEntry` yet.

- [ ] **Add FileEntry and update Bundle**

  In `engine/src/types.ts`, add after the `RenderedFile` interface:

  ```typescript
  /**
   * A single file to generate, returned by a bundle's generateFiles() function.
   * template: path relative to the bundle's templates/ directory
   * output: path relative to the generation output directory
   * ctx: context for rendering this specific file
   */
  export interface FileEntry {
    template: string;
    output: string;
    ctx: Record<string, unknown>;
  }
  ```

  Add `generateFiles?` to the `Bundle` interface:

  ```typescript
  /**
   * Optional alternative to the directory-walk render path.
   * If present, the engine calls this instead of renderTemplates().
   * Returns an explicit list of files to generate with per-file contexts.
   */
  generateFiles?: (ctx: Context) => FileEntry[];
  ```

- [ ] **Build the engine to confirm no type errors**

  ```bash
  cd engine && npm run build
  ```
  Expected: builds cleanly.

- [ ] **Commit**

  ```bash
  cd engine
  git add src/types.ts
  git commit -m "feat(engine): add FileEntry type and optional generateFiles to Bundle interface"
  ```

---

## Task 2: Add renderFile to engine render module

**Files:**
- Modify: `engine/src/engine/render.ts`

- [ ] **Read render.ts**

  Read `engine/src/engine/render.ts`. The internal `renderTemplateFile` function does the work but is private. We need a public function that takes an absolute template path and a context and returns rendered content.

- [ ] **Add renderFile export**

  Add this function to `engine/src/engine/render.ts` after the existing exports:

  ```typescript
  /**
   * Render a single Handlebars template file to a string.
   * Used by the generateFiles pipeline branch.
   *
   * @param absTemplatePath - Absolute path to the .hbs file
   * @param ctx - Context for rendering
   * @param options - Handlebars options (helpers, partials)
   */
  export function renderFile(
    absTemplatePath: string,
    ctx: Record<string, unknown>,
    options: TemplateOptions = {}
  ): string {
    const hb = Handlebars.create();

    if (options.helpers) {
      for (const [name, fn] of Object.entries(options.helpers)) {
        hb.registerHelper(name, fn);
      }
    }
    if (options.partials) {
      for (const [name, source] of Object.entries(options.partials)) {
        hb.registerPartial(name, source);
      }
    }

    const content = readFileSync(absTemplatePath, 'utf-8');
    try {
      return hb.compile(content)(ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new RenderError(absTemplatePath, msg);
    }
  }
  ```

- [ ] **Build engine**

  ```bash
  cd engine && npm run build
  ```
  Expected: builds cleanly.

- [ ] **Commit**

  ```bash
  git add engine/src/engine/render.ts
  git commit -m "feat(engine): add renderFile for single-file rendering"
  ```

---

## Task 3: Update pipeline to support generateFiles

**Files:**
- Modify: `engine/src/engine/write.ts`
- Modify: `engine/src/engine/pipeline.ts`

- [ ] **Fix existing bug in write.ts first**

  Read `engine/src/engine/write.ts`. Lines 53–56 define a local `readFileSync` wrapper using `require()` — this is broken in an ESM module. Fix it: delete the local `readFileSync` function entirely and add `readFileSync` to the existing import at line 1:

  ```typescript
  import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
  ```

- [ ] **Add writeSingleFile to write.ts**

  Add this export alongside `writeFiles`:

  ```typescript
  export function writeSingleFile(
    absPath: string,
    content: string,
    options: WriteOptions = {}
  ): void {
    if (options.dryRun) {
      console.log(`[DRY RUN] Would write: ${absPath}`);
      return;
    }
    const dir = dirname(absPath);
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      if (options.diff && existsSync(absPath)) {
        const existing = readFileSync(absPath, 'utf-8');
        if (existing !== content) {
          console.log(`[DIFF] ${absPath}`);
          console.log(existing);
          console.log('--- vs ---');
          console.log(content);
        }
      }
      writeFileSync(absPath, content, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new WriteError(absPath, message);
    }
  }
  ```

- [ ] **Read pipeline.ts**

  Read `engine/src/engine/pipeline.ts`. Note that `bundleDir` (line 44) and `templatesDir` (line 45) are declared after `enrich()`. We need to hoist them before the render branch.

- [ ] **Update pipeline.ts imports**

  Add `renderFile` to the render import and `writeSingleFile` to the write import:

  ```typescript
  import { renderTemplates, renderFile } from './render.js';
  import { writeFiles, writeSingleFile } from './write.js';
  ```

- [ ] **Replace the render+write block (lines 44–54) with the branching logic**

  ```typescript
  // Hoist bundle resolution before the branch
  const bundleDir = resolve(config.configDir, config.bundles[bundle.kind]);
  const templatesDir = resolve(bundleDir, bundle.templates);
  const outputDir = options.outputDir ?? resolve(specDir, 'build');

  if (bundle.generateFiles) {
    // New path: bundle returns explicit file list
    const entries = bundle.generateFiles(context);
    for (const entry of entries) {
      const absTemplatePath = resolve(bundleDir, bundle.templates, entry.template);
      const content = renderFile(absTemplatePath, entry.ctx, {
        noEscape: true,
        helpers: bundle.helpers,
        partials: bundle.partials,
      });
      if (content.trim() !== '') {
        writeSingleFile(resolve(outputDir, entry.output), content, {
          dryRun: options.dryRun,
          diff: options.diff,
        });
      }
    }
  } else {
    // Existing path: walk templates directory
    const rendered = await renderTemplates(templatesDir, context, {
      noEscape: true,
      helpers: bundle.helpers,
      partials: bundle.partials,
    });
    writeFiles(rendered, outputDir, { dryRun: options.dryRun, diff: options.diff });
  }
  ```

  The `bundleDir` and `templatesDir` constants are declared once before the branch — do not re-declare them inside the `else` block.

- [ ] **Build engine**

  ```bash
  cd engine && npm run build
  ```
  Expected: builds cleanly. Existing bundles unaffected (they don't export `generateFiles`).

- [ ] **Run engine tests**

  ```bash
  cd engine && npm test
  ```
  Expected: all existing tests pass.

- [ ] **Commit**

  ```bash
  git add engine/src/engine/pipeline.ts engine/src/engine/write.ts
  git commit -m "feat(engine): support generateFiles bundle contract for one-to-many file expansion"
  ```

---

## Task 4: Create spring-domain bundle skeleton

**Files:**
- Create: `bundles/spring-domain/package.json`
- Create: `bundles/spring-domain/tsconfig.json`
- Create: `bundles/spring-domain/vitest.config.ts`
- Create: `bundles/spring-domain/schema.json`
- Create: `bundles/spring-domain/src/index.ts` (stub)

- [ ] **Create package.json**

  ```json
  {
    "name": "@fixedcode/bundle-spring-domain",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
      ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts"
      }
    },
    "scripts": {
      "build": "tsc",
      "test": "vitest run"
    },
    "dependencies": {
      "@fixedcode/engine": "file:../../engine",
      "pluralize": "^8.0.0"
    },
    "devDependencies": {
      "@types/node": "^22.0.0",
      "@types/pluralize": "^0.0.33",
      "typescript": "^5.3.3",
      "vitest": "^1.2.2"
    }
  }
  ```

- [ ] **Create tsconfig.json** (copy from `bundles/spring-library/tsconfig.json`, change `rootDir` to `./src`, add `"include": ["src/**/*", "test/**/*"]`)

- [ ] **Create vitest.config.ts**

  ```typescript
  import { defineConfig } from 'vitest/config';
  export default defineConfig({
    test: { globals: true }
  });
  ```

- [ ] **Create schema.json** — JSON Schema for the spring-domain spec body (the `spec:` section only, not the envelope):

  ```json
  {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["boundedContext", "service", "aggregates"],
    "properties": {
      "boundedContext": { "type": "string" },
      "service": {
        "type": "object",
        "required": ["package"],
        "properties": {
          "port": { "type": "number" },
          "package": { "type": "string" }
        }
      },
      "aggregates": {
        "type": "object",
        "additionalProperties": { "$ref": "#/definitions/aggregate" }
      },
      "remote_aggregates": {
        "type": "object"
      }
    },
    "definitions": {
      "aggregate": {
        "type": "object",
        "properties": {
          "attributes": { "type": "object" },
          "commands": { "type": "array" },
          "queries": { "type": "array" },
          "events": { "type": "object" },
          "enumDefaults": { "type": "object" },
          "entities": { "type": "object" }
        }
      }
    }
  }
  ```

- [ ] **Create stub src/index.ts**

  ```typescript
  import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
  import { readFileSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';
  import { dirname, join } from 'node:path';

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

  export function enrich(_spec: Record<string, unknown>, _metadata: SpecMetadata): Context {
    throw new Error('Not implemented');
  }

  export function generateFiles(_ctx: Context): FileEntry[] {
    throw new Error('Not implemented');
  }

  export const bundle: Bundle = {
    kind: 'spring-domain',
    specSchema: schema,
    enrich: enrich as Bundle['enrich'],
    generateFiles,
    templates: 'templates',
  };

  export default bundle;
  ```

- [ ] **Install and build**

  ```bash
  cd bundles/spring-domain && npm install && npm run build
  ```
  Expected: builds cleanly.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/
  git commit -m "feat(spring-domain): bundle skeleton with schema and stub exports"
  ```

---

## Task 5: Implement naming utilities

**Files:**
- Create: `bundles/spring-domain/src/enrich/naming.ts`
- Create: `bundles/spring-domain/test/enrich/naming.test.ts`

- [ ] **Write failing tests**

  `test/enrich/naming.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { generateVariants } from '../../src/enrich/naming.js';

  describe('generateVariants', () => {
    it('generates all case variants for a simple word', () => {
      const v = generateVariants('Workspace');
      expect(v.pascal).toBe('Workspace');
      expect(v.camel).toBe('workspace');
      expect(v.snake).toBe('workspace');
      expect(v.kebab).toBe('workspace');
      expect(v.plural).toBe('workspaces');
      expect(v.pluralKebab).toBe('workspaces');
      expect(v.pluralPascal).toBe('Workspaces');
    });

    it('handles multi-word PascalCase input', () => {
      const v = generateVariants('WorkspaceReference');
      expect(v.pascal).toBe('WorkspaceReference');
      expect(v.camel).toBe('workspaceReference');
      expect(v.kebab).toBe('workspace-reference');
      expect(v.snake).toBe('workspace_reference');
    });

    it('handles irregular plurals', () => {
      const v = generateVariants('Party');
      expect(v.plural).toBe('parties');
      expect(v.pluralKebab).toBe('parties');
    });

    it('accepts a plural override', () => {
      const v = generateVariants('Person', 'people');
      expect(v.plural).toBe('people');
      expect(v.pluralKebab).toBe('people');
      expect(v.pluralPascal).toBe('People');
    });

    it('handles command-style input (verb + noun)', () => {
      const v = generateVariants('CreateWorkspace');
      expect(v.pascal).toBe('CreateWorkspace');
      expect(v.camel).toBe('createWorkspace');
      expect(v.kebab).toBe('create-workspace');
    });
  });
  ```

- [ ] **Run tests to confirm failure**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: fails — module not found.

- [ ] **Implement naming.ts**

  ```typescript
  import pluralizeLib from 'pluralize';

  export interface NamingVariants {
    original: string;
    pascal: string;
    camel: string;
    snake: string;
    kebab: string;
    plural: string;
    pluralPascal: string;
    pluralCamel: string;
    pluralSnake: string;
    pluralKebab: string;
  }

  export function toPascalCase(str: string): string {
    // Handle PascalCase input like 'CreateWorkspace' — split on uppercase boundaries
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[\s_-]+/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }

  export function toCamelCase(str: string): string {
    const p = toPascalCase(str);
    return p.charAt(0).toLowerCase() + p.slice(1);
  }

  export function toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  export function toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  export function generateVariants(name: string, pluralOverride?: string): NamingVariants {
    const plural = pluralOverride ?? pluralizeLib(toCamelCase(name));
    const pluralPascal = toPascalCase(plural);

    return {
      original: name,
      pascal: toPascalCase(name),
      camel: toCamelCase(name),
      snake: toSnakeCase(name),
      kebab: toKebabCase(name),
      plural,
      pluralPascal,
      pluralCamel: toCamelCase(plural),
      pluralSnake: toSnakeCase(plural),
      pluralKebab: toKebabCase(plural),
    };
  }
  ```

- [ ] **Run tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: naming tests pass.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/naming.ts bundles/spring-domain/test/enrich/naming.test.ts
  git commit -m "feat(spring-domain): implement naming utilities with tests"
  ```

---

## Task 6: Implement convention engine

**Files:**
- Create: `bundles/spring-domain/src/enrich/conventions.ts`
- Create: `bundles/spring-domain/test/enrich/conventions.test.ts`

- [ ] **Write failing tests**

  `test/enrich/conventions.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { detectPattern, deriveHttp, deriveAuth, deriveResponse } from '../../src/enrich/conventions.js';

  describe('detectPattern', () => {
    it('detects Create', () => expect(detectPattern('CreateWorkspace')).toBe('Create'));
    it('detects Update', () => expect(detectPattern('UpdateWorkspaceStatus')).toBe('Update'));
    it('detects Delete', () => expect(detectPattern('DeleteWorkspace')).toBe('Delete'));
    it('detects Archive', () => expect(detectPattern('ArchiveWorkspace')).toBe('Archive'));
    it('detects Add (entity)', () => expect(detectPattern('AddParty')).toBe('Add'));
    it('detects Remove (entity)', () => expect(detectPattern('RemoveParty')).toBe('Remove'));
    it('detects Get', () => expect(detectPattern('GetWorkspace')).toBe('Get'));
    it('detects Search', () => expect(detectPattern('SearchWorkspace')).toBe('Search'));
    it('detects List', () => expect(detectPattern('ListWorkspaces')).toBe('Search'));
    it('detects Find', () => expect(detectPattern('FindWorkspacesByStatus')).toBe('Find'));
  });

  describe('deriveHttp', () => {
    it('Create → POST /workspaces 201', () => {
      const h = deriveHttp('Create', 'workspaces', false);
      expect(h.method).toBe('POST');
      expect(h.path).toBe('/workspaces');
      expect(h.statusCode).toBe(201);
    });
    it('Update with id → PUT /workspaces/{workspaceId} 200', () => {
      const h = deriveHttp('Update', 'workspaces', true, 'workspaceId');
      expect(h.method).toBe('PUT');
      expect(h.path).toBe('/workspaces/{workspaceId}');
      expect(h.statusCode).toBe(200);
    });
    it('Delete with id → DELETE /workspaces/{workspaceId} 204', () => {
      const h = deriveHttp('Delete', 'workspaces', true, 'workspaceId');
      expect(h.method).toBe('DELETE');
      expect(h.path).toBe('/workspaces/{workspaceId}');
      expect(h.statusCode).toBe(204);
    });
    it('Archive → PUT /workspaces/{id}/archive 200', () => {
      const h = deriveHttp('Archive', 'workspaces', true, 'workspaceId');
      expect(h.path).toBe('/workspaces/{workspaceId}/archive');
    });
    it('Get with id → GET /workspaces/{workspaceId} 200', () => {
      const h = deriveHttp('Get', 'workspaces', true, 'workspaceId');
      expect(h.method).toBe('GET');
      expect(h.path).toBe('/workspaces/{workspaceId}');
    });
    it('Search → GET /workspaces 200', () => {
      const h = deriveHttp('Search', 'workspaces', false);
      expect(h.method).toBe('GET');
      expect(h.path).toBe('/workspaces');
    });
  });

  describe('deriveAuth', () => {
    it('Create → CREATE', () => expect(deriveAuth('Create').action).toBe('CREATE'));
    it('Update → UPDATE', () => expect(deriveAuth('Update').action).toBe('UPDATE'));
    it('Delete → DELETE', () => expect(deriveAuth('Delete').action).toBe('DELETE'));
    it('Get → READ',    () => expect(deriveAuth('Get').action).toBe('READ'));
    it('Search → READ', () => expect(deriveAuth('Search').action).toBe('READ'));
  });

  describe('deriveResponse', () => {
    it('Create → entity 201', () => expect(deriveResponse('Create', 'Workspace').type).toBe('entity'));
    it('Delete → void 204',   () => expect(deriveResponse('Delete', 'Workspace').type).toBe('void'));
    it('Get → entity 200',    () => expect(deriveResponse('Get', 'Workspace').type).toBe('entity'));
    it('Search → paged 200',  () => expect(deriveResponse('Search', 'Workspace').type).toBe('paged'));
  });
  ```

- [ ] **Implement conventions.ts**

  ```typescript
  export type OperationPattern = 'Create' | 'Update' | 'Delete' | 'Archive' | 'Add' | 'Remove' | 'Get' | 'Search' | 'Find';

  export function detectPattern(name: string): OperationPattern {
    if (name.startsWith('Create')) return 'Create';
    if (name.startsWith('Update')) return 'Update';
    if (name.startsWith('Delete')) return 'Delete';
    if (name.startsWith('Archive')) return 'Archive';
    if (name.startsWith('Add')) return 'Add';
    if (name.startsWith('Remove')) return 'Remove';
    if (name.startsWith('Get')) return 'Get';
    if (name.startsWith('Search') || name.startsWith('List')) return 'Search';
    if (name.startsWith('Find')) return 'Find';
    return 'Get'; // fallback — should not happen with validated specs
  }

  export interface HttpMetadata {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    statusCode: number;
  }

  export function deriveHttp(
    pattern: OperationPattern,
    resourcePlural: string,
    hasIdParam: boolean,
    idParamName?: string,
    pathPrefix = ''
  ): HttpMetadata {
    const base = `${pathPrefix}/${resourcePlural}`;
    const withId = `${base}/{${idParamName ?? 'id'}}`;

    switch (pattern) {
      case 'Create': return { method: 'POST', path: base, statusCode: 201 };
      case 'Update': return { method: 'PUT', path: withId, statusCode: 200 };
      case 'Delete': return { method: 'DELETE', path: withId, statusCode: 204 };
      case 'Archive': return { method: 'PUT', path: `${withId}/archive`, statusCode: 200 };
      case 'Add':    return { method: 'POST', path: base, statusCode: 201 };
      case 'Remove': return { method: 'DELETE', path: withId, statusCode: 204 };
      case 'Get':    return { method: 'GET', path: withId, statusCode: 200 };
      case 'Search': return { method: 'GET', path: base, statusCode: 200 };
      case 'Find':   return { method: 'GET', path: hasIdParam ? withId : base, statusCode: 200 };
    }
  }

  export interface AuthMetadata {
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    expression: string;
  }

  export function deriveAuth(pattern: OperationPattern, resource = ''): AuthMetadata {
    const actionMap: Record<OperationPattern, AuthMetadata['action']> = {
      Create: 'CREATE', Update: 'UPDATE', Delete: 'DELETE', Archive: 'UPDATE',
      Add: 'CREATE', Remove: 'DELETE', Get: 'READ', Search: 'READ', Find: 'READ',
    };
    const action = actionMap[pattern];
    return {
      action,
      expression: `hasAuthority('${action}') or hasRole('ADMIN')`,
    };
  }

  export interface ResponseMetadata {
    type: 'entity' | 'list' | 'paged' | 'void';
    returnType: string;
  }

  export function deriveResponse(pattern: OperationPattern, entityName: string): ResponseMetadata {
    switch (pattern) {
      case 'Create':
      case 'Update':
      case 'Archive':
      case 'Get':
      case 'Find':
        return { type: 'entity', returnType: entityName };
      case 'Add':
        return { type: 'entity', returnType: entityName };
      case 'Delete':
      case 'Remove':
        return { type: 'void', returnType: 'Unit' };
      case 'Search':
        return { type: 'paged', returnType: `Paged${entityName}List` };
    }
  }
  ```

- [ ] **Run tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: all convention tests pass.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/conventions.ts bundles/spring-domain/test/enrich/conventions.test.ts
  git commit -m "feat(spring-domain): implement convention engine with tests"
  ```

---

## Task 7: Implement attribute and spec parsers

**Files:**
- Create: `bundles/spring-domain/src/enrich/attribute.ts`
- Create: `bundles/spring-domain/src/enrich/spec.ts`

- [ ] **Implement attribute.ts**

  Attributes in the spec are a map like `{ workspaceId: 'uuid', status: 'string = Status', completionDate?: 'date' }`. The key may end in `?` for optional. The value is a type string, optionally with a default.

  ```typescript
  import { generateVariants, type NamingVariants } from './naming.js';

  export interface EnrichedAttribute {
    name: string;
    names: NamingVariants;
    rawType: string;
    kotlinType: string;
    required: boolean;
    defaultValue?: string;
    isIdentity: boolean;
  }

  const TYPE_MAP: Record<string, string> = {
    uuid: 'UUID',
    string: 'String',
    int: 'Int',
    long: 'Long',
    boolean: 'Boolean',
    decimal: 'BigDecimal',
    date: 'LocalDate',
    'date-time': 'OffsetDateTime',
    object: 'Map<String, Any>',
  };

  export function enrichAttributes(
    raw: Record<string, string> | undefined
  ): EnrichedAttribute[] {
    if (!raw) return [];
    const entries = Object.entries(raw);
    let identityAssigned = false;

    return entries.map(([rawKey, rawValue]) => {
      const optional = rawKey.endsWith('?');
      const name = optional ? rawKey.slice(0, -1) : rawKey;
      const [typePart, defaultPart] = rawValue.split('=').map(s => s.trim());
      const rawType = typePart.trim();
      const kotlinType = TYPE_MAP[rawType] ?? rawType;

      const isIdentity = !identityAssigned && rawType === 'uuid';
      if (isIdentity) identityAssigned = true;

      return {
        name,
        names: generateVariants(name),
        rawType,
        kotlinType,
        required: !optional,
        defaultValue: defaultPart,
        isIdentity,
      };
    });
  }
  ```

- [ ] **Implement spec.ts** — thin wrapper that extracts typed fields from the raw spec body:

  ```typescript
  export interface RawAggregateSpec {
    attributes?: Record<string, string>;
    commands?: RawCommandSpec[];
    queries?: RawQuerySpec[];
    events?: Record<string, { fields: string[] }>;
    enumDefaults?: Record<string, string[]>;
    entities?: Record<string, RawEntitySpec>;
  }

  export interface RawCommandSpec {
    name: string;
    body?: string[];
    path?: string[];
    query?: string[];
    emits?: string;
    returns?: string;  // for query-style commands with explicit path override
  }

  export interface RawQuerySpec {
    name: string;
    path?: string[];
    query?: string[];
    returns: string;
  }

  export interface RawEntitySpec extends RawAggregateSpec {}

  export interface RawDomainSpec {
    boundedContext: string;
    service: { port?: number; package: string };
    aggregates: Record<string, RawAggregateSpec>;
    remote_aggregates?: Record<string, unknown>;
  }

  export function parseSpec(raw: Record<string, unknown>): RawDomainSpec {
    if (!raw.boundedContext || typeof raw.boundedContext !== 'string') {
      throw new Error('spec.boundedContext is required and must be a string');
    }
    if (!raw.service || typeof raw.service !== 'object') {
      throw new Error('spec.service is required');
    }
    if (!raw.aggregates || typeof raw.aggregates !== 'object') {
      throw new Error('spec.aggregates is required');
    }
    return raw as unknown as RawDomainSpec;
  }
  ```

- [ ] **Build to confirm no type errors**

  ```bash
  cd bundles/spring-domain && npm run build
  ```

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/attribute.ts bundles/spring-domain/src/enrich/spec.ts
  git commit -m "feat(spring-domain): attribute enricher and spec parser"
  ```

---

## Task 8: Implement event enricher

**Files:**
- Create: `bundles/spring-domain/src/enrich/event.ts`

- [ ] **Implement event.ts**

  Events in the spec are: `{ WorkspaceCreated: { fields: ['workspaceId', 'status?', ...] } }` where `?` suffix on a field name means optional.

  ```typescript
  import { generateVariants, type NamingVariants } from './naming.js';

  export interface EnrichedEventField {
    name: string;
    names: NamingVariants;
    required: boolean;
  }

  export interface EnrichedEvent {
    name: string;
    names: NamingVariants;
    fields: EnrichedEventField[];
  }

  export function enrichEvents(
    raw: Record<string, { fields: string[] }> | undefined
  ): EnrichedEvent[] {
    if (!raw) return [];
    return Object.entries(raw).map(([name, def]) => ({
      name,
      names: generateVariants(name),
      fields: (def.fields ?? []).map(f => {
        const optional = f.endsWith('?');
        const fieldName = optional ? f.slice(0, -1) : f;
        return { name: fieldName, names: generateVariants(fieldName), required: !optional };
      }),
    }));
  }
  ```

- [ ] **Build**

  ```bash
  cd bundles/spring-domain && npm run build
  ```

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/event.ts
  git commit -m "feat(spring-domain): event enricher"
  ```

---

## Task 9: Implement command enricher

**Files:**
- Create: `bundles/spring-domain/src/enrich/command.ts`
- Create: `bundles/spring-domain/test/enrich/command.test.ts`

- [ ] **Write failing tests**

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { enrichCommand } from '../../src/enrich/command.js';

  const aggCtx = {
    names: { kebab: 'workspaces', pascal: 'Workspace', camel: 'workspace', plural: 'workspaces', pluralKebab: 'workspaces' },
    identityField: 'workspaceId',
  };

  describe('enrichCommand', () => {
    it('CreateWorkspace → POST /workspaces 201 CREATE', () => {
      const cmd = enrichCommand({ name: 'CreateWorkspace', body: ['transactionType', 'jurisdiction', 'completionDate?'] }, aggCtx as any);
      expect(cmd.http.method).toBe('POST');
      expect(cmd.http.path).toBe('/workspaces');
      expect(cmd.http.statusCode).toBe(201);
      expect(cmd.auth.action).toBe('CREATE');
      expect(cmd.params.body).toHaveLength(3);
      expect(cmd.params.body[2].required).toBe(false); // completionDate?
      expect(cmd.params.path).toHaveLength(0);
    });

    it('UpdateWorkspaceStatus → PUT /workspaces/{workspaceId} 200', () => {
      const cmd = enrichCommand({ name: 'UpdateWorkspaceStatus', body: ['status'] }, aggCtx as any);
      expect(cmd.http.method).toBe('PUT');
      expect(cmd.http.path).toBe('/workspaces/{workspaceId}');
      expect(cmd.params.path).toHaveLength(1);
      expect(cmd.params.path[0].name).toBe('workspaceId');
    });

    it('explicit path override takes precedence over convention', () => {
      const cmd = enrichCommand(
        { name: 'GetWorkspacesBySubscriber', path: ['subscriberId'], returns: 'WorkspaceList' },
        aggCtx as any
      );
      expect(cmd.params.path[0].name).toBe('subscriberId');
      expect(cmd.http.path).toBe('/workspaces/{subscriberId}');
    });
  });
  ```

- [ ] **Implement command.ts**

  ```typescript
  import { generateVariants, type NamingVariants } from './naming.js';
  import { detectPattern, deriveHttp, deriveAuth, deriveResponse, type OperationPattern } from './conventions.js';

  export interface EnrichedParam {
    name: string;
    names: NamingVariants;
    required: boolean;
  }

  export interface EnrichedCommand {
    name: string;
    names: NamingVariants;
    pattern: OperationPattern;
    http: { method: string; path: string; statusCode: number };
    auth: { action: string; expression: string };
    response: { type: string; returnType: string };
    params: { path: EnrichedParam[]; body: EnrichedParam[]; query: EnrichedParam[] };
    emits?: string;
    methodSignature: string;
    imports: string[];
  }

  interface AggCtx {
    names: { pluralKebab: string; pascal: string };
    identityField: string;
  }

  function parseParam(raw: string): EnrichedParam {
    const optional = raw.endsWith('?');
    const name = optional ? raw.slice(0, -1) : raw;
    return { name, names: generateVariants(name), required: !optional };
  }

  export function enrichCommand(raw: {
    name: string;
    body?: string[];
    path?: string[];
    query?: string[];
    emits?: string;
    returns?: string;
  }, agg: AggCtx): EnrichedCommand {
    const names = generateVariants(raw.name);
    const pattern = detectPattern(raw.name);
    const needsId = ['Update', 'Delete', 'Archive', 'Get', 'Remove'].includes(pattern);

    // Path params: explicit override OR convention (identity field for mutating patterns)
    const pathParams: EnrichedParam[] = raw.path
      ? raw.path.map(parseParam)
      : needsId
        ? [{ name: agg.identityField, names: generateVariants(agg.identityField), required: true }]
        : [];

    const bodyParams = (raw.body ?? []).map(parseParam);
    const queryParams = (raw.query ?? []).map(parseParam);

    const hasIdParam = pathParams.length > 0;
    const idParamName = pathParams[0]?.name;
    const http = deriveHttp(pattern, agg.names.pluralKebab, hasIdParam, idParamName);
    const auth = deriveAuth(pattern, agg.names.pascal);
    const response = deriveResponse(pattern, agg.names.pascal);

    const allParams = [...pathParams, ...bodyParams].map(p => `${p.names.camel}: ${p.required ? 'String' : 'String?'}`).join(', ');
    const methodSignature = `fun ${names.camel}(${allParams}): ${response.returnType}`;

    return {
      name: raw.name,
      names,
      pattern,
      http,
      auth,
      response,
      params: { path: pathParams, body: bodyParams, query: queryParams },
      emits: raw.emits,
      methodSignature,
      imports: [],
    };
  }
  ```

- [ ] **Run tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: command tests pass.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/command.ts bundles/spring-domain/test/enrich/command.test.ts
  git commit -m "feat(spring-domain): command enricher with convention + override support"
  ```

---

## Task 10: Implement query enricher

**Files:**
- Create: `bundles/spring-domain/src/enrich/query.ts`
- Create: `bundles/spring-domain/test/enrich/query.test.ts`

- [ ] **Write failing tests**

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { enrichQuery } from '../../src/enrich/query.js';

  const aggCtx = {
    names: { pluralKebab: 'workspaces', pascal: 'Workspace' },
    identityField: 'workspaceId',
  };

  describe('enrichQuery', () => {
    it('GetWorkspace → GET /workspaces/{workspaceId} 200', () => {
      const q = enrichQuery({ name: 'GetWorkspace', returns: 'Workspace' }, aggCtx as any);
      expect(q.http.method).toBe('GET');
      expect(q.http.path).toBe('/workspaces/{workspaceId}');
      expect(q.response.type).toBe('entity');
    });

    it('SearchWorkspace → GET /workspaces 200 paged', () => {
      const q = enrichQuery({ name: 'SearchWorkspace', returns: 'PagedWorkspaceList' }, aggCtx as any);
      expect(q.http.path).toBe('/workspaces');
      expect(q.response.type).toBe('paged');
    });

    it('FindBySubscriber with explicit query param', () => {
      const q = enrichQuery({ name: 'FindWorkspacesBySubscriber', query: ['subscriberId'], returns: 'WorkspaceList' }, aggCtx as any);
      expect(q.params.query[0].name).toBe('subscriberId');
    });
  });
  ```

- [ ] **Implement query.ts** — same shape as command.ts but queries only have path and query params (no body). Follow the same pattern as enrichCommand, using detectPattern and the convention rules.

- [ ] **Run tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: query tests pass.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/query.ts bundles/spring-domain/test/enrich/query.test.ts
  git commit -m "feat(spring-domain): query enricher"
  ```

---

## Task 11: Implement aggregate enricher

**Files:**
- Create: `bundles/spring-domain/src/enrich/entity.ts`
- Create: `bundles/spring-domain/src/enrich/aggregate.ts`
- Create: `bundles/spring-domain/test/enrich/aggregate.test.ts`

- [ ] **Write failing tests first** (create the test file before any implementation)

  Create `test/enrich/aggregate.test.ts` with the test code from the end of this task. Run `npm test` to confirm it fails with "module not found" or similar.

- [ ] **Implement entity.ts** — enriches an entity (same pipeline as aggregate but also receives `parentIdentityField`):

  ```typescript
  import { enrichAttributes } from './attribute.js';
  import { enrichCommand } from './command.js';
  import { enrichQuery } from './query.js';
  import { enrichEvents } from './event.js';
  import { generateVariants } from './naming.js';
  import type { RawEntitySpec } from './spec.js';

  export function enrichEntity(name: string, raw: RawEntitySpec, parentIdentityField: string) {
    const attrs = enrichAttributes(raw.attributes);
    const identityField = attrs.find(a => a.isIdentity)?.name ?? 'id';
    const names = generateVariants(name);
    const aggCtx = { names: { pluralKebab: names.pluralKebab, pascal: names.pascal }, identityField };

    return {
      name,
      names,
      identityField,
      parentIdentityField,
      attributes: attrs,
      commands: (raw.commands ?? []).map(c => enrichCommand(c, aggCtx)),
      queries: (raw.queries ?? []).map(q => enrichQuery(q, aggCtx)),
      events: enrichEvents(raw.events),
      enumDefaults: raw.enumDefaults ?? {},
    };
  }
  ```

- [ ] **Implement aggregate.ts**:

  ```typescript
  import { enrichAttributes } from './attribute.js';
  import { enrichCommand } from './command.js';
  import { enrichQuery } from './query.js';
  import { enrichEvents } from './event.js';
  import { enrichEntity } from './entity.js';
  import { generateVariants } from './naming.js';
  import type { RawAggregateSpec } from './spec.js';

  export function enrichAggregate(name: string, raw: RawAggregateSpec) {
    const attrs = enrichAttributes(raw.attributes);
    const identityField = attrs.find(a => a.isIdentity)?.name ?? 'id';
    const names = generateVariants(name);
    const aggCtx = { names: { pluralKebab: names.pluralKebab, pascal: names.pascal }, identityField };

    const entities = Object.entries(raw.entities ?? {}).map(([eName, eRaw]) =>
      enrichEntity(eName, eRaw, identityField)
    );

    return {
      name,
      names,
      identityField,
      attributes: attrs,
      commands: (raw.commands ?? []).map(c => enrichCommand(c, aggCtx)),
      queries: (raw.queries ?? []).map(q => enrichQuery(q, aggCtx)),
      events: enrichEvents(raw.events),
      entities,
      enumDefaults: raw.enumDefaults ?? {},
    };
  }
  ```

- [ ] **Write tests for aggregate enricher**

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { enrichAggregate } from '../../src/enrich/aggregate.js';

  describe('enrichAggregate', () => {
    it('enriches a simple aggregate', () => {
      const agg = enrichAggregate('Workspace', {
        attributes: { workspaceId: 'uuid', status: 'string' },
        commands: [{ name: 'CreateWorkspace', body: ['status'] }],
        queries: [{ name: 'GetWorkspace', returns: 'Workspace' }],
        events: { WorkspaceCreated: { fields: ['workspaceId'] } },
      });

      expect(agg.identityField).toBe('workspaceId');
      expect(agg.names.pascal).toBe('Workspace');
      expect(agg.names.pluralKebab).toBe('workspaces');
      expect(agg.commands[0].http.method).toBe('POST');
      expect(agg.queries[0].http.method).toBe('GET');
      expect(agg.events[0].name).toBe('WorkspaceCreated');
    });

    it('enriches nested entities', () => {
      const agg = enrichAggregate('Workspace', {
        attributes: { workspaceId: 'uuid' },
        entities: {
          Party: {
            attributes: { partyId: 'uuid', workspaceId: 'uuid' },
            commands: [{ name: 'AddParty', body: ['partyType'] }],
          },
        },
      });

      expect(agg.entities).toHaveLength(1);
      expect(agg.entities[0].name).toBe('Party');
      expect(agg.entities[0].parentIdentityField).toBe('workspaceId');
      expect(agg.entities[0].commands[0].http.method).toBe('POST');
    });
  });
  ```

- [ ] **Run tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: all tests pass.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/enrich/entity.ts bundles/spring-domain/src/enrich/aggregate.ts bundles/spring-domain/test/enrich/aggregate.test.ts
  git commit -m "feat(spring-domain): aggregate and entity enrichers with tests"
  ```

---

## Task 12: Wire enrich() and generateFiles()

**Files:**
- Modify: `bundles/spring-domain/src/index.ts`
- Create: `bundles/spring-domain/test/generateFiles.test.ts`

- [ ] **Implement enrich() in index.ts**

  ```typescript
  import { parseSpec } from './enrich/spec.js';
  import { enrichAggregate } from './enrich/aggregate.js';
  import { generateVariants } from './enrich/naming.js';

  export function enrich(raw: Record<string, unknown>, _metadata: SpecMetadata): Context {
    const spec = parseSpec(raw);
    const names = generateVariants(spec.boundedContext);
    const packagePath = spec.service.package.replace(/\./g, '/');

    return {
      boundedContext: spec.boundedContext,
      names,
      packagePath,
      service: spec.service,
      aggregates: Object.entries(spec.aggregates).map(([name, agg]) => enrichAggregate(name, agg)),
    };
  }
  ```

- [ ] **Implement generateFiles() in index.ts** using the full implementation from the spec document (Task 12 from the plan's file map, copying the TypeScript from the design spec).

- [ ] **Write generateFiles test**

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { enrich, generateFiles } from '../src/index.js';

  const rawSpec = {
    boundedContext: 'Workspace',
    service: { port: 8081, package: 'io.example.workspace' },
    aggregates: {
      Workspace: {
        attributes: { workspaceId: 'uuid', status: 'string' },
        commands: [
          { name: 'CreateWorkspace', body: ['status'] },
          { name: 'UpdateWorkspaceStatus', body: ['status'] },
        ],
        queries: [{ name: 'GetWorkspace', returns: 'Workspace' }],
        events: { WorkspaceCreated: { fields: ['workspaceId'] } },
        entities: {
          Party: {
            attributes: { partyId: 'uuid' },
            commands: [{ name: 'AddParty', body: ['partyType'] }],
          },
        },
      },
    },
  };

  describe('generateFiles', () => {
    it('produces correct file paths for all expansion types', () => {
      const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
      const files = generateFiles(ctx);
      const paths = files.map(f => f.output);

      // Once per bounded context
      expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/shared/DomainEvent.kt');

      // Per aggregate
      expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/workspace/Workspace.kt');
      expect(paths).toContain('src/main/kotlin/io/example/workspace/application/workspace/WorkspaceCommandService.kt');
      expect(paths).toContain('src/main/kotlin/io/example/workspace/api/workspace/WorkspaceApiDelegateImpl.kt');

      // Per command
      expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/workspace/commands/CreateWorkspaceCommand.kt');
      expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/workspace/commands/UpdateWorkspaceStatusCommand.kt');

      // Per entity
      expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/workspace/entities/Party.kt');

      // Per entity command
      expect(paths).toContain('src/main/kotlin/io/example/workspace/domain/workspace/entities/commands/AddPartyCommand.kt');

      // Tests
      expect(paths).toContain('src/test/kotlin/io/example/workspace/domain/workspace/WorkspaceTest.kt');
    });

    it('passes correct context to each file', () => {
      const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
      const files = generateFiles(ctx);
      const cmdFile = files.find(f => f.output.includes('CreateWorkspaceCommand.kt'));
      expect(cmdFile?.ctx).toHaveProperty('cmd');
      expect((cmdFile?.ctx as any).cmd.name).toBe('CreateWorkspace');
    });

    it('every file entry includes packagePath in its context', () => {
      const ctx = enrich(rawSpec, { name: 'test', apiVersion: '1.0' });
      const files = generateFiles(ctx);
      for (const f of files) {
        expect(f.ctx).toHaveProperty('packagePath');
      }
    });
  });
  ```

- [ ] **Run tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: all tests pass.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/src/index.ts bundles/spring-domain/test/generateFiles.test.ts
  git commit -m "feat(spring-domain): enrich() and generateFiles() wired and tested"
  ```

---

## Task 13: Templates — shared domain files

**Files:**
- Create: `bundles/spring-domain/templates/src/main/kotlin/domain/shared/DomainEvent.kt.hbs`
- Create: `bundles/spring-domain/templates/src/main/kotlin/domain/shared/ValidationResult.kt.hbs`

Port from gap-cli: `generator-source/bundles/aggregate/domain/shared/DomainEvent.kt.tmpl` and `ValidationResult.kt.tmpl`.

- [ ] **Create templates directory structure**

  ```bash
  mkdir -p bundles/spring-domain/templates/src/main/kotlin/domain/shared
  mkdir -p bundles/spring-domain/templates/src/main/kotlin/domain/\[aggregate\]/commands
  mkdir -p bundles/spring-domain/templates/src/main/kotlin/domain/\[aggregate\]/entities
  mkdir -p bundles/spring-domain/templates/src/main/kotlin/application/\[aggregate\]
  mkdir -p bundles/spring-domain/templates/src/main/kotlin/api/\[aggregate\]
  mkdir -p bundles/spring-domain/templates/src/main/kotlin/infrastructure/\[aggregate\]
  mkdir -p bundles/spring-domain/templates/src/test/kotlin/domain/\[aggregate\]
  mkdir -p bundles/spring-domain/templates/src/test/kotlin/application/\[aggregate\]
  mkdir -p bundles/spring-domain/templates/src/test/kotlin/api/\[aggregate\]
  ```

- [ ] **Port DomainEvent.kt.hbs**

  Read `gap-cli/generator-source/bundles/aggregate/domain/shared/DomainEvent.kt.tmpl`.
  Convert Go template syntax to Handlebars: `{{ .PackageName }}` → `{{packagePath}}` (dots to slashes already done), `{{ .BoundedContext }}` → `{{boundedContext}}`. Remove the AI analysis comments at the top. Keep the Kotlin code unchanged.

- [ ] **Port ValidationResult.kt.hbs**

  Same porting approach from `ValidationResult.kt.tmpl`. Note: the gap-cli version imports from `io.pexa.gap.shared` — replace with `{{packagePath}}` for the package declaration.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/templates/
  git commit -m "feat(spring-domain): shared domain templates (DomainEvent, ValidationResult)"
  ```

---

## Task 14: Templates — per-aggregate files

**Files:**
- Create: `templates/src/main/kotlin/domain/[aggregate]/Aggregate.kt.hbs`
- Create: `templates/src/main/kotlin/domain/[aggregate]/AggregateEvents.kt.hbs`

Port from: `aggregate/domain/{{ .NameCamel }}/` templates in gap-cli.

- [ ] **Port Aggregate.kt.hbs**

  The aggregate root Kotlin data class. Handlebars context received is an `EnrichedAggregate`. Key substitutions:
  - `{{ .PackageName }}` → `{{../packagePath}}` (aggregate ctx has no packagePath — pass it via spread in generateFiles, or add it to each agg context)

  > **Important:** Update `generateFiles` to spread `packagePath` into each aggregate context: `ctx: { ...agg, packagePath: ctx.packagePath }`. Do this for all per-aggregate entries.

  Template structure:
  ```handlebars
  package {{packagePath}}.domain.{{names.kebab}}

  import java.util.UUID
  {{#each attributes}}
  {{/each}}

  data class {{names.pascal}}(
    {{#each attributes}}
    val {{names.camel}}: {{kotlinType}}{{#unless required}}?{{/unless}},
    {{/each}}
  )
  ```

- [ ] **Port AggregateEvents.kt.hbs**

  Contains all aggregate-level event data classes. Port from `aggregate/domain/{{ .NameCamel }}/events/` or inline event definitions.

- [ ] **Update generateFiles to include packagePath in per-file contexts**

  Every per-aggregate, per-command, per-entity file entry needs `packagePath` in its context. Update `generateFiles` in `src/index.ts`.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/templates/src/main/kotlin/domain/
  git commit -m "feat(spring-domain): per-aggregate domain templates"
  ```

---

## Task 15: Templates — per-command and per-entity

**Files:**
- Create: `templates/src/main/kotlin/domain/[aggregate]/commands/[command].kt.hbs`
- Create: `templates/src/main/kotlin/domain/[aggregate]/entities/[entity].kt.hbs`
- Create: `templates/src/main/kotlin/domain/[aggregate]/entities/[entity]Events.kt.hbs`

- [ ] **Port [command].kt.hbs**

  A command data class. Context: `{ ...agg, cmd, packagePath }`.

  ```handlebars
  package {{packagePath}}.domain.{{agg.names.kebab}}.commands

  data class {{cmd.names.pascal}}Command(
    {{#each cmd.params.path}}
    val {{names.camel}}: UUID,
    {{/each}}
    {{#each cmd.params.body}}
    val {{names.camel}}: String{{#unless required}}?{{/unless}},
    {{/each}}
  )
  ```

  > **Note:** The template receives a single `cmd` object alongside `agg`. Use `cmd.*` for command data, `agg.*` for aggregate context. Do not iterate `agg.commands` in this template.

- [ ] **Port [entity].kt.hbs and [entity]Events.kt.hbs**

  Same approach as Aggregate.kt.hbs and AggregateEvents.kt.hbs but context is `{ ...agg, entity, packagePath }`. Use `entity.*` for entity data.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/templates/src/main/kotlin/domain/\[aggregate\]/
  git commit -m "feat(spring-domain): per-command and per-entity domain templates"
  ```

---

## Task 16: Templates — application layer

**Files:**
- Create: `templates/src/main/kotlin/application/[aggregate]/AggregateCommandService.kt.hbs`
- Create: `templates/src/main/kotlin/application/[aggregate]/AggregateQueryService.kt.hbs`

Port from: `aggregate/application/{{ .NameCamel }}/services/` in gap-cli.

- [ ] **Port AggregateCommandService.kt.hbs**

  This iterates `agg.commands` to generate one method per command. Key context fields: `names`, `commands`, `packagePath`.

  ```handlebars
  package {{packagePath}}.application.{{names.kebab}}

  interface {{names.pascal}}CommandService {
    {{#each commands}}
    {{methodSignature}}
    {{/each}}
  }
  ```

- [ ] **Port AggregateQueryService.kt.hbs** — same pattern for queries, iterating `queries`.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/templates/src/main/kotlin/application/
  git commit -m "feat(spring-domain): application layer templates"
  ```

---

## Task 17: Templates — api and infrastructure layers

**Files:**
- Create: `templates/src/main/kotlin/api/[aggregate]/AggregateApiDelegateImpl.kt.hbs`
- Create: `templates/src/main/kotlin/infrastructure/[aggregate]/AggregateReadRepositoryImpl.kt.hbs`
- Create: `templates/src/main/kotlin/infrastructure/[aggregate]/AggregateWriteRepositoryImpl.kt.hbs`

Port from: `aggregate/api/` and `aggregate/infrastructure/repository/` in gap-cli.

- [ ] **Port AggregateApiDelegateImpl.kt.hbs**

  Iterates `commands` and `queries`. Uses `cmd.http.method`, `cmd.http.path`, `cmd.http.statusCode`, `cmd.auth.expression`, `cmd.methodSignature`. This is the most logic-heavy template in gap-cli — the enrichment should have pre-computed everything the template needs.

- [ ] **Port AggregateReadRepositoryImpl.kt.hbs** — iterates queries.

- [ ] **Port AggregateWriteRepositoryImpl.kt.hbs** — iterates commands.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/templates/src/main/kotlin/api/ bundles/spring-domain/templates/src/main/kotlin/infrastructure/
  git commit -m "feat(spring-domain): api and infrastructure layer templates"
  ```

---

## Task 18: Templates — tests

**Files:**
- Create: `templates/src/test/kotlin/domain/[aggregate]/AggregateTest.kt.hbs`
- Create: `templates/src/test/kotlin/application/[aggregate]/AggregateCommandServiceTest.kt.hbs`
- Create: `templates/src/test/kotlin/api/[aggregate]/AggregateApiDelegateImplTest.kt.hbs`

Port from: `aggregate/` test templates in gap-cli (look for `*Test.kt.tmpl` files).

- [ ] **Port test templates** following the same approach as production templates. Tests iterate commands/queries to generate one test method per operation.

- [ ] **Commit**

  ```bash
  git add bundles/spring-domain/templates/src/test/
  git commit -m "feat(spring-domain): test templates"
  ```

---

## Task 19: Register bundle and end-to-end test

**Files:**
- Modify: `.fixedcode.yaml`
- Create: `bundles/spring-domain/test/e2e.test.ts`
- Create: `bundles/spring-domain/test/fixtures/workspace.yaml`

- [ ] **Register the bundle in `.fixedcode.yaml`**

  Add to `.fixedcode.yaml`:
  ```yaml
  bundles:
    spring-domain: "./bundles/spring-domain"
  ```

- [ ] **Create a minimal workspace fixture spec**

  `test/fixtures/workspace.yaml`:
  ```yaml
  apiVersion: "1.0"
  kind: spring-domain
  metadata:
    name: workspace-service

  spec:
    boundedContext: Workspace
    service:
      port: 8081
      package: io.example.workspace
    aggregates:
      Workspace:
        attributes:
          workspaceId: uuid
          status: string = Status
        commands:
          - name: CreateWorkspace
            body: [status]
            emits: WorkspaceCreated
          - name: UpdateWorkspaceStatus
            body: [status]
            emits: WorkspaceStatusUpdated
        queries:
          - name: GetWorkspace
            returns: Workspace
          - name: SearchWorkspace
            returns: PagedWorkspaceList
        events:
          WorkspaceCreated:
            fields: [workspaceId, status]
        entities:
          Party:
            attributes:
              partyId: uuid
              workspaceId: uuid
            commands:
              - name: AddParty
                body: [partyType, role]
                emits: PartyAdded
            events:
              PartyAdded:
                fields: [workspaceId, partyId]
  ```

- [ ] **Write e2e test**

  `test/e2e.test.ts`:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { enrich, generateFiles } from '../src/index.js';
  import { parse as parseYaml } from 'yaml';
  import { readFileSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';
  import { dirname, join } from 'node:path';

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const specYaml = readFileSync(join(__dirname, 'fixtures/workspace.yaml'), 'utf-8');
  const spec = parseYaml(specYaml);

  describe('spring-domain e2e', () => {
    it('generates all expected files from workspace spec', () => {
      const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
      const files = generateFiles(ctx);
      const paths = files.map(f => f.output);

      // Shared
      expect(paths.some(p => p.endsWith('DomainEvent.kt'))).toBe(true);
      expect(paths.some(p => p.endsWith('ValidationResult.kt'))).toBe(true);

      // Aggregate
      expect(paths.some(p => p.endsWith('Workspace.kt') && p.includes('/domain/'))).toBe(true);
      expect(paths.some(p => p.endsWith('WorkspaceEvents.kt'))).toBe(true);
      expect(paths.some(p => p.endsWith('WorkspaceCommandService.kt'))).toBe(true);
      expect(paths.some(p => p.endsWith('WorkspaceApiDelegateImpl.kt'))).toBe(true);
      expect(paths.some(p => p.endsWith('WorkspaceReadRepositoryImpl.kt'))).toBe(true);

      // Commands
      expect(paths.some(p => p.endsWith('CreateWorkspaceCommand.kt'))).toBe(true);
      expect(paths.some(p => p.endsWith('UpdateWorkspaceStatusCommand.kt'))).toBe(true);

      // Entity
      expect(paths.some(p => p.endsWith('Party.kt'))).toBe(true);
      expect(paths.some(p => p.endsWith('AddPartyCommand.kt'))).toBe(true);

      // Tests
      expect(paths.some(p => p.includes('/test/') && p.endsWith('WorkspaceTest.kt'))).toBe(true);

      console.log(`Total files generated: ${files.length}`);
    });
  });
  ```

- [ ] **Run all bundle tests**

  ```bash
  cd bundles/spring-domain && npm test
  ```
  Expected: all tests pass including e2e.

- [ ] **Build the bundle**

  ```bash
  npm run build
  ```
  Expected: clean build.

- [ ] **Commit**

  ```bash
  git add .fixedcode.yaml bundles/spring-domain/test/
  git commit -m "feat(spring-domain): register bundle and e2e test with workspace fixture"
  ```

---

## Task 20: Archive old analysis docs

**Files:**
- Move/delete: `docs/analysis/` (9 outdated docs superseded by the spec)

- [ ] **Archive the old docs**

  ```bash
  mkdir -p docs/archive
  mv docs/analysis docs/archive/analysis-2026-04-02
  ```

- [ ] **Commit**

  ```bash
  git add docs/
  git commit -m "chore: archive outdated analysis docs — superseded by spring-domain spec"
  ```
