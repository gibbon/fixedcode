# ts-service & ts-agent Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two new FixedCode bundles — `ts-service` (TypeScript project skeleton) and `ts-agent` (standalone AI agent) — following the same layered pattern as `spring-library` + `spring-domain`.

**Architecture:** Each bundle is a TypeScript package in `bundles/` that exports the `Bundle` interface from `@fixedcode/engine`. `ts-service` generates a FastAPI-equivalent Express project skeleton. `ts-agent` generates a standalone agent with a tool-calling loop, HTTP server, and per-tool handler files. Both use `generateFiles()` for one-to-many expansion.

**Tech Stack:** TypeScript, Vitest, Handlebars templates, Express (generated output), Vercel AI SDK / Anthropic SDK / OpenAI SDK (generated output, configurable via `provider` field)

**Spec:** `docs/superpowers/specs/2026-04-06-python-and-cicd-bundles-design.md` (Part 0: TypeScript Bundles)

**Reference bundle:** `bundles/spring-domain/` — follow its exact patterns for package.json, tsconfig.json, vitest.config.ts, src/index.ts export shape, test structure.

---

## File Structure

### ts-service bundle

```
bundles/ts-service/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── schema.json                           # JSON Schema for spec validation
├── src/
│   ├── index.ts                          # Bundle export: kind, specSchema, enrich, generateFiles, templates, cfrs
│   └── enrich/
│       ├── naming.ts                     # Re-export from shared location (or copy from spring-domain)
│       └── spec.ts                       # Parse + validate raw spec
├── templates/
│   ├── package.json.hbs
│   ├── tsconfig.json.hbs
│   ├── Dockerfile.hbs
│   ├── docker-compose.yml.hbs
│   ├── src/
│   │   ├── index.ts.hbs                  # Entry point
│   │   ├── config.ts.hbs                 # Typed env config
│   │   ├── server.ts.hbs                 # Express app
│   │   └── routes/
│   │       └── health.ts.hbs             # /health endpoint
│   ├── defaults/
│   │   └── custom-routes.ts.hbs          # Extension point (overwrite: false)
│   └── tests/
│       └── health.test.ts.hbs
└── test/
    ├── e2e.test.ts                       # Full generate pipeline test
    ├── enrich.test.ts                    # Enrichment unit tests
    └── fixtures/
        └── basic-service.yaml            # Test fixture spec
```

### ts-agent bundle

```
bundles/ts-agent/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── schema.json
├── src/
│   ├── index.ts                          # Bundle export
│   └── enrich/
│       ├── naming.ts                     # Naming variants (shared)
│       ├── spec.ts                       # Parse + validate raw spec
│       ├── tool.ts                       # Enrich tool definitions
│       └── provider.ts                   # Provider-specific enrichment (imports, deps, decorators)
├── templates/
│   ├── agent.yaml.hbs                    # Generated agent spec for reference
│   ├── providers/
│   │   ├── vercel-ai/
│   │   │   └── agent.ts.hbs             # Vercel AI SDK tool-calling loop
│   │   ├── claude-sdk/
│   │   │   └── agent.ts.hbs             # Anthropic SDK tool-calling loop
│   │   └── openai/
│   │       └── agent.ts.hbs             # OpenAI SDK tool-calling loop
│   ├── tools/
│   │   ├── http.ts.hbs                   # HTTP tool handler template
│   │   ├── cli.ts.hbs                    # CLI tool handler template
│   │   ├── function.ts.hbs              # Custom function tool handler
│   │   ├── database.ts.hbs              # Database tool handler
│   │   └── mcp.ts.hbs                   # MCP tool handler
│   ├── src/
│   │   ├── index.ts.hbs                  # Entry point
│   │   ├── server.ts.hbs                # Express + /invoke, /health
│   │   └── config.ts.hbs                # Typed config
│   ├── defaults/
│   │   └── custom-agent.ts.hbs          # Extension point (overwrite: false)
│   └── tests/
│       ├── agent.test.ts.hbs
│       └── tool.test.ts.hbs             # Per-tool test template
└── test/
    ├── e2e.test.ts
    ├── enrich.test.ts
    ├── enrich/
    │   ├── tool.test.ts
    │   └── provider.test.ts
    └── fixtures/
        ├── single-agent.yaml
        └── orchestrator.yaml
```

---

## Task 1: ts-service — scaffold bundle package

**Files:**
- Create: `bundles/ts-service/package.json`
- Create: `bundles/ts-service/tsconfig.json`
- Create: `bundles/ts-service/vitest.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@fixedcode/bundle-ts-service",
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
    "@fixedcode/engine": "file:../../engine"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.2",
    "yaml": "^2.8.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Copy exact config from `bundles/spring-domain/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { globals: true }
});
```

- [ ] **Step 4: Run npm install**

Run: `cd bundles/ts-service && npm install`
Expected: `node_modules/` created, `@fixedcode/engine` linked

- [ ] **Step 5: Commit**

```bash
git add bundles/ts-service/package.json bundles/ts-service/tsconfig.json bundles/ts-service/vitest.config.ts bundles/ts-service/package-lock.json
git commit -m "feat(ts-service): scaffold bundle package"
```

---

## Task 2: ts-service — schema.json + naming utilities

**Files:**
- Create: `bundles/ts-service/schema.json`
- Create: `bundles/ts-service/src/enrich/naming.ts`

- [ ] **Step 1: Write failing test for naming**

Create `bundles/ts-service/test/enrich/naming.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateVariants } from '../../src/enrich/naming.js';

describe('generateVariants', () => {
  it('generates all naming variants from kebab-case input', () => {
    const v = generateVariants('ops-agent');
    expect(v.pascal).toBe('OpsAgent');
    expect(v.camel).toBe('opsAgent');
    expect(v.snake).toBe('ops_agent');
    expect(v.kebab).toBe('ops-agent');
  });

  it('generates variants from PascalCase input', () => {
    const v = generateVariants('OpsAgent');
    expect(v.kebab).toBe('ops-agent');
    expect(v.snake).toBe('ops_agent');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bundles/ts-service && npx vitest run test/enrich/naming.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create naming.ts**

Copy `bundles/spring-domain/src/enrich/naming.ts` to `bundles/ts-service/src/enrich/naming.ts`. Remove the `pluralize` dependency and plural variants — ts-service doesn't need pluralization:

```typescript
export interface NamingVariants {
  original: string;
  pascal: string;
  camel: string;
  snake: string;
  kebab: string;
}

export function toPascalCase(str: string): string {
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

export function generateVariants(name: string): NamingVariants {
  return {
    original: name,
    pascal: toPascalCase(name),
    camel: toCamelCase(name),
    snake: toSnakeCase(name),
    kebab: toKebabCase(name),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bundles/ts-service && npx vitest run test/enrich/naming.test.ts`
Expected: PASS

- [ ] **Step 5: Create schema.json**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["service"],
  "properties": {
    "service": {
      "type": "object",
      "required": ["package"],
      "properties": {
        "port": { "type": "integer", "default": 3000 },
        "package": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Package name in kebab-case (used for package.json name and directory)"
        }
      },
      "additionalProperties": false
    },
    "features": {
      "type": "object",
      "properties": {
        "database": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": false },
            "type": { "enum": ["postgres"], "default": "postgres" }
          },
          "additionalProperties": false
        },
        "docker": { "type": "boolean", "default": true }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

- [ ] **Step 6: Commit**

```bash
git add bundles/ts-service/schema.json bundles/ts-service/src/enrich/naming.ts bundles/ts-service/test/enrich/naming.test.ts
git commit -m "feat(ts-service): add schema.json and naming utilities"
```

---

## Task 3: ts-service — enrich() + spec parsing

**Files:**
- Create: `bundles/ts-service/src/enrich/spec.ts`
- Create: `bundles/ts-service/test/enrich.test.ts`

- [ ] **Step 1: Write failing test for enrich**

Create `bundles/ts-service/test/enrich.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrich } from '../src/index.js';

describe('ts-service enrich', () => {
  it('enriches a basic service spec', () => {
    const ctx = enrich(
      { service: { port: 3000, package: 'ops-agent' }, features: { docker: true } },
      { name: 'ops-agent', apiVersion: '1.0' }
    );

    expect(ctx.serviceName.pascal).toBe('OpsAgent');
    expect(ctx.serviceName.kebab).toBe('ops-agent');
    expect(ctx.serviceName.snake).toBe('ops_agent');
    expect(ctx.packageName).toBe('ops-agent');
    expect(ctx.port).toBe(3000);
    expect(ctx.hasDocker).toBe(true);
    expect(ctx.hasDatabase).toBe(false);
  });

  it('applies defaults', () => {
    const ctx = enrich(
      { service: { package: 'my-svc' } },
      { name: 'my-svc', apiVersion: '1.0' }
    );

    expect(ctx.port).toBe(3000);
    expect(ctx.hasDocker).toBe(true);
    expect(ctx.hasDatabase).toBe(false);
  });

  it('enables database feature', () => {
    const ctx = enrich(
      { service: { package: 'db-svc' }, features: { database: { enabled: true, type: 'postgres' } } },
      { name: 'db-svc', apiVersion: '1.0' }
    );

    expect(ctx.hasDatabase).toBe(true);
    expect(ctx.databaseType).toBe('postgres');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bundles/ts-service && npx vitest run test/enrich.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create spec.ts**

```typescript
export interface RawTsServiceSpec {
  service: {
    port?: number;
    package: string;
  };
  features?: {
    database?: { enabled?: boolean; type?: string };
    docker?: boolean;
  };
}

export function parseSpec(raw: Record<string, unknown>): RawTsServiceSpec {
  const spec = raw as RawTsServiceSpec;
  return {
    service: {
      port: spec.service.port ?? 3000,
      package: spec.service.package,
    },
    features: {
      database: spec.features?.database ?? { enabled: false },
      docker: spec.features?.docker ?? true,
    },
  };
}
```

- [ ] **Step 4: Create src/index.ts with enrich()**

```typescript
import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface TsServiceContext extends Context {
  serviceName: NamingVariants;
  packageName: string;
  port: number;
  hasDatabase: boolean;
  databaseType: string;
  hasDocker: boolean;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): TsServiceContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(spec.service.package);

  return {
    serviceName,
    packageName: spec.service.package,
    port: spec.service.port ?? 3000,
    hasDatabase: spec.features?.database?.enabled ?? false,
    databaseType: spec.features?.database?.type ?? 'postgres',
    hasDocker: spec.features?.docker ?? true,
  };
}

// generateFiles and bundle export will be added in Task 4
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd bundles/ts-service && npx vitest run test/enrich.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add bundles/ts-service/src/enrich/spec.ts bundles/ts-service/src/index.ts bundles/ts-service/test/enrich.test.ts
git commit -m "feat(ts-service): enrich() with spec parsing and naming variants"
```

---

## Task 4: ts-service — generateFiles() + bundle export

**Files:**
- Modify: `bundles/ts-service/src/index.ts`
- Create: `bundles/ts-service/test/e2e.test.ts`
- Create: `bundles/ts-service/test/fixtures/basic-service.yaml`

- [ ] **Step 1: Create test fixture**

Create `bundles/ts-service/test/fixtures/basic-service.yaml`:

```yaml
apiVersion: "1.0"
kind: ts-service
metadata:
  name: ops-agent

spec:
  service:
    port: 3000
    package: ops-agent
  features:
    database: { enabled: false }
    docker: true
```

- [ ] **Step 2: Write failing e2e test**

Create `bundles/ts-service/test/e2e.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(join(__dirname, 'fixtures/basic-service.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

describe('ts-service e2e', () => {
  it('generates all expected files from basic service spec', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Project files
    expect(paths).toContain('package.json');
    expect(paths).toContain('tsconfig.json');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('docker-compose.yml');

    // Source files
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/config.ts');
    expect(paths).toContain('src/server.ts');
    expect(paths).toContain('src/routes/health.ts');

    // Extension point
    expect(paths).toContain('src/defaults/custom-routes.ts');
    const extPoint = files.find(f => f.output === 'src/defaults/custom-routes.ts');
    expect(extPoint?.overwrite).toBe(false);

    // Test files
    expect(paths).toContain('tests/health.test.ts');
  });

  it('excludes Docker files when docker is disabled', () => {
    const ctx = enrich(
      { service: { package: 'no-docker' }, features: { docker: false } },
      { name: 'no-docker', apiVersion: '1.0' }
    );
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    expect(paths).not.toContain('Dockerfile');
    expect(paths).not.toContain('docker-compose.yml');
  });

  it('all generated files have overwrite true except extension points', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);

    const extensionPoints = files.filter(f => f.overwrite === false);
    expect(extensionPoints).toHaveLength(1);
    expect(extensionPoints[0].output).toBe('src/defaults/custom-routes.ts');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd bundles/ts-service && npx vitest run test/e2e.test.ts`
Expected: FAIL — generateFiles not exported

- [ ] **Step 4: Implement generateFiles() and complete bundle export**

Update `bundles/ts-service/src/index.ts` — add `generateFiles()` and the default `bundle` export:

```typescript
import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface TsServiceContext extends Context {
  serviceName: NamingVariants;
  packageName: string;
  port: number;
  hasDatabase: boolean;
  databaseType: string;
  hasDocker: boolean;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): TsServiceContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(spec.service.package);

  return {
    serviceName,
    packageName: spec.service.package,
    port: spec.service.port ?? 3000,
    hasDatabase: spec.features?.database?.enabled ?? false,
    databaseType: spec.features?.database?.type ?? 'postgres',
    hasDocker: spec.features?.docker ?? true,
  };
}

export function generateFiles(ctx: TsServiceContext): FileEntry[] {
  const files: FileEntry[] = [];
  const c = ctx as Record<string, unknown>;

  // Project config files
  files.push(
    { template: 'package.json.hbs', output: 'package.json', ctx: c, overwrite: true },
    { template: 'tsconfig.json.hbs', output: 'tsconfig.json', ctx: c, overwrite: true },
  );

  // Docker (conditional)
  if (ctx.hasDocker) {
    files.push(
      { template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: c, overwrite: true },
      { template: 'docker-compose.yml.hbs', output: 'docker-compose.yml', ctx: c, overwrite: true },
    );
  }

  // Source files
  files.push(
    { template: 'src/index.ts.hbs', output: 'src/index.ts', ctx: c, overwrite: true },
    { template: 'src/config.ts.hbs', output: 'src/config.ts', ctx: c, overwrite: true },
    { template: 'src/server.ts.hbs', output: 'src/server.ts', ctx: c, overwrite: true },
    { template: 'src/routes/health.ts.hbs', output: 'src/routes/health.ts', ctx: c, overwrite: true },
  );

  // Extension point
  files.push({
    template: 'defaults/custom-routes.ts.hbs',
    output: 'src/defaults/custom-routes.ts',
    ctx: c,
    overwrite: false,
  });

  // Tests
  files.push(
    { template: 'tests/health.test.ts.hbs', output: 'tests/health.test.ts', ctx: c, overwrite: true },
  );

  return files;
}

export const bundle: Bundle = {
  kind: 'ts-service',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  cfrs: {
    provides: ['logging', 'health-check', 'error-handling', 'docker'],
    files: {
      'health-check': ['src/routes/health.ts'],
      'docker': ['Dockerfile', 'docker-compose.yml'],
    },
  },
};

export default bundle;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd bundles/ts-service && npx vitest run test/e2e.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add bundles/ts-service/src/index.ts bundles/ts-service/test/e2e.test.ts bundles/ts-service/test/fixtures/basic-service.yaml
git commit -m "feat(ts-service): generateFiles() and bundle export with CFRs"
```

---

## Task 5: ts-service — Handlebars templates

**Files:**
- Create: `bundles/ts-service/templates/package.json.hbs`
- Create: `bundles/ts-service/templates/tsconfig.json.hbs`
- Create: `bundles/ts-service/templates/Dockerfile.hbs`
- Create: `bundles/ts-service/templates/docker-compose.yml.hbs`
- Create: `bundles/ts-service/templates/src/index.ts.hbs`
- Create: `bundles/ts-service/templates/src/config.ts.hbs`
- Create: `bundles/ts-service/templates/src/server.ts.hbs`
- Create: `bundles/ts-service/templates/src/routes/health.ts.hbs`
- Create: `bundles/ts-service/templates/defaults/custom-routes.ts.hbs`
- Create: `bundles/ts-service/templates/tests/health.test.ts.hbs`

- [ ] **Step 1: Create package.json.hbs**

```handlebars
{
  "name": "{{packageName}}",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.18.0",
    "pino": "^8.0.0",
    "pino-pretty": "^10.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json.hbs**

```handlebars
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create Dockerfile.hbs**

```handlebars
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE {{port}}
CMD ["node", "dist/index.js"]
```

- [ ] **Step 4: Create docker-compose.yml.hbs**

```handlebars
version: "3.8"
services:
  {{packageName}}:
    build: .
    ports:
      - "{{port}}:{{port}}"
    environment:
      - PORT={{port}}
      - NODE_ENV=development
{{#if hasDatabase}}
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: {{serviceName.snake}}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
{{/if}}
```

- [ ] **Step 5: Create src/index.ts.hbs**

```handlebars
import { createServer } from './server.js';
import { config } from './config.js';
import { logger } from './logger.js';

const app = createServer();

app.listen(config.port, () => {
  logger.info({ port: config.port }, '{{serviceName.pascal}} started');
});
```

- [ ] **Step 6: Create src/config.ts.hbs**

```handlebars
import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '{{port}}', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;
```

- [ ] **Step 7: Create src/server.ts.hbs**

```handlebars
import express from 'express';
import { healthRouter } from './routes/health.js';
import { customRoutes } from './defaults/custom-routes.js';
import { logger } from './logger.js';

export function createServer(): express.Express {
  const app = express();

  app.use(express.json());

  // Request logging
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, 'request');
    next();
  });

  // Routes
  app.use(healthRouter);
  app.use(customRoutes);

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
```

- [ ] **Step 8: Create src/routes/health.ts.hbs**

```handlebars
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '{{packageName}}' });
});
```

- [ ] **Step 9: Create defaults/custom-routes.ts.hbs**

```handlebars
import { Router } from 'express';

// This file is an extension point — it is generated once and then owned by you.
// Add your custom routes here. This file will NOT be overwritten on regeneration.

export const customRoutes = Router();

// Example:
// customRoutes.get('/api/hello', (_req, res) => {
//   res.json({ message: 'Hello from {{serviceName.pascal}}!' });
// });
```

- [ ] **Step 10: Create tests/health.test.ts.hbs**

```handlebars
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';

describe('/health', () => {
  const app = createServer();

  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('{{packageName}}');
  });
});
```

- [ ] **Step 11: Noticed missing logger template — create src/logger.ts.hbs**

The server.ts and index.ts templates import `./logger.js`. Add the template and update `generateFiles()` to include it:

```handlebars
import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

Update `generateFiles()` in `src/index.ts` to add:
```typescript
{ template: 'src/logger.ts.hbs', output: 'src/logger.ts', ctx: c, overwrite: true },
```

- [ ] **Step 12: Commit**

```bash
git add bundles/ts-service/templates/ bundles/ts-service/src/index.ts
git commit -m "feat(ts-service): all Handlebars templates for project skeleton"
```

---

## Task 6: ts-service — integration test with engine pipeline

**Files:**
- Create: `bundles/ts-service/test/integration.test.ts`
- Create: `examples/ts-basic-service/ts-service.yaml`
- Create: `examples/ts-basic-service/.fixedcode.yaml`

- [ ] **Step 1: Create example spec**

Create `examples/ts-basic-service/ts-service.yaml`:

```yaml
apiVersion: "1.0"
kind: ts-service
metadata:
  name: hello-service

spec:
  service:
    port: 3000
    package: hello-service
  features:
    docker: true
```

- [ ] **Step 2: Create example config**

Create `examples/ts-basic-service/.fixedcode.yaml`:

```yaml
bundles:
  ts-service: "../../bundles/ts-service"
```

- [ ] **Step 3: Build the bundle**

Run: `cd bundles/ts-service && npm run build`
Expected: Compiles without errors, `dist/` created

- [ ] **Step 4: Run fixedcode generate against the example**

Run: `node engine/bin/fixedcode.js generate examples/ts-basic-service/ts-service.yaml -o examples/ts-basic-service/build`
Expected: Files generated in `examples/ts-basic-service/build/`

- [ ] **Step 5: Verify generated output**

Run: `ls -R examples/ts-basic-service/build/`
Expected: package.json, tsconfig.json, Dockerfile, docker-compose.yml, src/index.ts, src/config.ts, src/server.ts, src/logger.ts, src/routes/health.ts, src/defaults/custom-routes.ts, tests/health.test.ts

- [ ] **Step 6: Run fixedcode verify**

Run: `node engine/bin/fixedcode.js verify examples/ts-basic-service/ts-service.yaml examples/ts-basic-service/build`
Expected: All checks pass

- [ ] **Step 7: Commit**

```bash
git add examples/ts-basic-service/ bundles/ts-service/dist/
git commit -m "feat(ts-service): integration test with engine pipeline"
```

---

## Task 7: ts-agent — scaffold bundle package

**Files:**
- Create: `bundles/ts-agent/package.json`
- Create: `bundles/ts-agent/tsconfig.json`
- Create: `bundles/ts-agent/vitest.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@fixedcode/bundle-ts-agent",
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
    "@fixedcode/engine": "file:../../engine"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.2",
    "yaml": "^2.8.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json and vitest.config.ts**

Same as ts-service (copy from Task 1).

- [ ] **Step 3: Run npm install**

Run: `cd bundles/ts-agent && npm install`
Expected: `node_modules/` created

- [ ] **Step 4: Commit**

```bash
git add bundles/ts-agent/package.json bundles/ts-agent/tsconfig.json bundles/ts-agent/vitest.config.ts bundles/ts-agent/package-lock.json
git commit -m "feat(ts-agent): scaffold bundle package"
```

---

## Task 8: ts-agent — schema.json + provider enrichment

**Files:**
- Create: `bundles/ts-agent/schema.json`
- Create: `bundles/ts-agent/src/enrich/naming.ts` (copy from ts-service)
- Create: `bundles/ts-agent/src/enrich/provider.ts`
- Create: `bundles/ts-agent/test/enrich/provider.test.ts`

- [ ] **Step 1: Write failing test for provider enrichment**

Create `bundles/ts-agent/test/enrich/provider.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrichProvider } from '../../src/enrich/provider.js';

describe('enrichProvider', () => {
  it('returns Vercel AI SDK config for vercel-ai provider', () => {
    const p = enrichProvider('vercel-ai');
    expect(p.providerImport).toContain('generateText');
    expect(p.providerImport).toContain('ai');
    expect(p.providerDependency).toContain('ai');
  });

  it('returns Anthropic SDK config for claude-sdk provider', () => {
    const p = enrichProvider('claude-sdk');
    expect(p.providerImport).toContain('Anthropic');
    expect(p.providerDependency).toContain('@anthropic-ai/sdk');
  });

  it('returns OpenAI SDK config for openai provider', () => {
    const p = enrichProvider('openai');
    expect(p.providerImport).toContain('OpenAI');
    expect(p.providerDependency).toContain('openai');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bundles/ts-agent && npx vitest run test/enrich/provider.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement provider.ts**

```typescript
export interface ProviderConfig {
  providerImport: string;
  providerDependency: string;
  providerClientInit: string;
}

const providers: Record<string, ProviderConfig> = {
  'vercel-ai': {
    providerImport: "import { generateText, tool } from 'ai';",
    providerDependency: '"ai": "^6.0.0"',
    providerClientInit: 'generateText({ model, tools, maxSteps, messages })',
  },
  'claude-sdk': {
    providerImport: "import Anthropic from '@anthropic-ai/sdk';",
    providerDependency: '"@anthropic-ai/sdk": "^0.80.0"',
    providerClientInit: 'new Anthropic()',
  },
  'openai': {
    providerImport: "import OpenAI from 'openai';",
    providerDependency: '"openai": "^4.0.0"',
    providerClientInit: 'new OpenAI()',
  },
};

export function enrichProvider(provider: string): ProviderConfig {
  const config = providers[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  return config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bundles/ts-agent && npx vitest run test/enrich/provider.test.ts`
Expected: PASS

- [ ] **Step 5: Copy naming.ts from ts-service**

Copy `bundles/ts-service/src/enrich/naming.ts` to `bundles/ts-agent/src/enrich/naming.ts`.

- [ ] **Step 6: Create schema.json**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["mode", "provider"],
  "properties": {
    "mode": { "enum": ["single", "orchestrator"], "default": "single" },
    "provider": { "enum": ["vercel-ai", "claude-sdk", "openai"], "default": "vercel-ai" },
    "model": {
      "type": "object",
      "properties": {
        "tier": { "enum": ["fast", "balanced", "quality"], "default": "balanced" }
      }
    },
    "prompt": { "type": "string" },
    "tools": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "type"],
        "properties": {
          "name": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "type": { "enum": ["http", "cli", "function", "database", "mcp"] },
          "config": { "type": "object" }
        }
      }
    },
    "agents": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "prompt"],
        "properties": {
          "name": { "type": "string" },
          "prompt": { "type": "string" },
          "tools": { "type": "array", "items": { "type": "string" } },
          "critical": { "type": "boolean", "default": true }
        }
      }
    },
    "routing": { "enum": ["sequential", "parallel", "llm-decided"], "default": "sequential" },
    "server": {
      "type": "object",
      "properties": {
        "port": { "type": "integer", "default": 3100 }
      }
    }
  },
  "if": { "properties": { "mode": { "const": "orchestrator" } } },
  "then": { "required": ["agents"] },
  "else": { "required": ["prompt", "tools"] }
}
```

- [ ] **Step 7: Commit**

```bash
git add bundles/ts-agent/schema.json bundles/ts-agent/src/enrich/naming.ts bundles/ts-agent/src/enrich/provider.ts bundles/ts-agent/test/enrich/provider.test.ts
git commit -m "feat(ts-agent): schema.json, naming, and provider enrichment"
```

---

## Task 9: ts-agent — tool enrichment

**Files:**
- Create: `bundles/ts-agent/src/enrich/tool.ts`
- Create: `bundles/ts-agent/test/enrich/tool.test.ts`

- [ ] **Step 1: Write failing test**

Create `bundles/ts-agent/test/enrich/tool.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrichTool } from '../../src/enrich/tool.js';

describe('enrichTool', () => {
  it('enriches an HTTP tool with naming variants', () => {
    const tool = enrichTool({ name: 'call-api', type: 'http', config: { baseUrl: 'https://api.example.com' } });
    expect(tool.name.pascal).toBe('CallApi');
    expect(tool.name.camel).toBe('callApi');
    expect(tool.name.kebab).toBe('call-api');
    expect(tool.type).toBe('http');
    expect(tool.templatePath).toBe('tools/http.ts.hbs');
  });

  it('enriches a CLI tool', () => {
    const tool = enrichTool({ name: 'run-script', type: 'cli', config: { command: 'kubectl' } });
    expect(tool.name.pascal).toBe('RunScript');
    expect(tool.type).toBe('cli');
    expect(tool.templatePath).toBe('tools/cli.ts.hbs');
    expect(tool.config.command).toBe('kubectl');
  });

  it('enriches a function tool', () => {
    const tool = enrichTool({ name: 'write-file', type: 'function', config: { handler: 'write-file' } });
    expect(tool.type).toBe('function');
    expect(tool.templatePath).toBe('tools/function.ts.hbs');
  });

  it('enriches a database tool', () => {
    const tool = enrichTool({ name: 'query-db', type: 'database', config: { readOnly: true } });
    expect(tool.type).toBe('database');
    expect(tool.templatePath).toBe('tools/database.ts.hbs');
  });

  it('enriches an MCP tool', () => {
    const tool = enrichTool({ name: 'external', type: 'mcp', config: { server: 'localhost:3001' } });
    expect(tool.type).toBe('mcp');
    expect(tool.templatePath).toBe('tools/mcp.ts.hbs');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bundles/ts-agent && npx vitest run test/enrich/tool.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement tool.ts**

```typescript
import { generateVariants, type NamingVariants } from './naming.js';

export interface RawTool {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface EnrichedTool {
  name: NamingVariants;
  type: string;
  config: Record<string, unknown>;
  templatePath: string;
}

export function enrichTool(raw: RawTool): EnrichedTool {
  return {
    name: generateVariants(raw.name),
    type: raw.type,
    config: raw.config ?? {},
    templatePath: `tools/${raw.type}.ts.hbs`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bundles/ts-agent && npx vitest run test/enrich/tool.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bundles/ts-agent/src/enrich/tool.ts bundles/ts-agent/test/enrich/tool.test.ts
git commit -m "feat(ts-agent): tool enrichment with naming variants"
```

---

## Task 10: ts-agent — enrich() + spec parsing

**Files:**
- Create: `bundles/ts-agent/src/enrich/spec.ts`
- Create: `bundles/ts-agent/src/index.ts`
- Create: `bundles/ts-agent/test/enrich.test.ts`

- [ ] **Step 1: Write failing test**

Create `bundles/ts-agent/test/enrich.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrich } from '../src/index.js';

describe('ts-agent enrich', () => {
  it('enriches a single agent spec', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'vercel-ai',
        model: { tier: 'balanced' },
        prompt: 'You are a coding agent...',
        tools: [
          { name: 'read-file', type: 'cli', config: { command: 'cat' } },
          { name: 'write-file', type: 'function', config: { handler: 'write-file' } },
        ],
        server: { port: 3100 },
      },
      { name: 'coder-agent', apiVersion: '1.0' }
    );

    expect(ctx.mode).toBe('single');
    expect(ctx.provider).toBe('vercel-ai');
    expect(ctx.packageName).toBe('coder-agent');
    expect(ctx.moduleName).toBe('coderAgent');
    expect(ctx.providerImport).toContain('generateText');
    expect(ctx.tools).toHaveLength(2);
    expect(ctx.tools[0].name.pascal).toBe('ReadFile');
    expect(ctx.tools[1].name.pascal).toBe('WriteFile');
    expect(ctx.prompt).toBe('You are a coding agent...');
    expect(ctx.serverPort).toBe(3100);
  });

  it('applies defaults', () => {
    const ctx = enrich(
      {
        mode: 'single',
        provider: 'vercel-ai',
        prompt: 'You are an agent',
        tools: [{ name: 'search', type: 'http' }],
      },
      { name: 'basic-agent', apiVersion: '1.0' }
    );

    expect(ctx.serverPort).toBe(3100);
    expect(ctx.modelTier).toBe('balanced');
    expect(ctx.streaming).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bundles/ts-agent && npx vitest run test/enrich.test.ts`
Expected: FAIL

- [ ] **Step 3: Create spec.ts**

```typescript
export interface RawTsAgentSpec {
  mode: 'single' | 'orchestrator';
  provider: string;
  streaming?: boolean;
  model?: { tier?: string };
  prompt?: string;
  tools?: Array<{ name: string; type: string; config?: Record<string, unknown> }>;
  agents?: Array<{ name: string; prompt: string; tools?: string[]; critical?: boolean }>;
  routing?: string;
  server?: { port?: number };
}

export function parseSpec(raw: Record<string, unknown>): RawTsAgentSpec {
  const spec = raw as RawTsAgentSpec;
  return {
    mode: spec.mode ?? 'single',
    provider: spec.provider ?? 'vercel-ai',
    streaming: spec.streaming ?? true,
    model: { tier: spec.model?.tier ?? 'balanced' },
    prompt: spec.prompt,
    tools: spec.tools ?? [],
    agents: spec.agents,
    routing: spec.routing ?? 'sequential',
    server: { port: spec.server?.port ?? 3100 },
  };
}
```

- [ ] **Step 4: Create src/index.ts with enrich()**

```typescript
import type { Bundle, Context, FileEntry, SpecMetadata } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec } from './enrich/spec.js';
import { generateVariants, type NamingVariants } from './enrich/naming.js';
import { enrichTool, type EnrichedTool } from './enrich/tool.js';
import { enrichProvider, type ProviderConfig } from './enrich/provider.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface EnrichedAgent {
  name: NamingVariants;
  prompt: string;
  toolRefs: string[];
  critical: boolean;
}

export interface TsAgentContext extends Context {
  packageName: string;
  moduleName: string;
  serviceName: NamingVariants;
  mode: 'single' | 'orchestrator';
  provider: string;
  streaming: boolean;
  modelTier: string;
  providerImport: string;
  providerDependency: string;
  providerClientInit: string;
  tools: EnrichedTool[];
  prompt?: string;
  agents?: EnrichedAgent[];
  routing?: string;
  serverPort: number;
}

export function enrich(raw: Record<string, unknown>, metadata: SpecMetadata): TsAgentContext {
  const spec = parseSpec(raw);
  const serviceName = generateVariants(metadata.name);
  const providerConfig = enrichProvider(spec.provider);
  const tools = (spec.tools ?? []).map(t => enrichTool(t));

  const agents = spec.agents?.map(a => ({
    name: generateVariants(a.name),
    prompt: a.prompt,
    toolRefs: a.tools ?? [],
    critical: a.critical ?? true,
  }));

  return {
    packageName: serviceName.kebab,
    moduleName: serviceName.camel,
    serviceName,
    mode: spec.mode,
    provider: spec.provider,
    streaming: spec.streaming ?? true,
    modelTier: spec.model?.tier ?? 'balanced',
    ...providerConfig,
    tools,
    prompt: spec.prompt,
    agents,
    routing: spec.routing,
    serverPort: spec.server?.port ?? 3100,
  };
}

// generateFiles and bundle export will be added in Task 11
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd bundles/ts-agent && npx vitest run test/enrich.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add bundles/ts-agent/src/enrich/spec.ts bundles/ts-agent/src/index.ts bundles/ts-agent/test/enrich.test.ts
git commit -m "feat(ts-agent): enrich() with spec parsing, tools, and provider config"
```

---

## Task 11: ts-agent — generateFiles() + bundle export (single mode)

**Files:**
- Modify: `bundles/ts-agent/src/index.ts`
- Create: `bundles/ts-agent/test/e2e.test.ts`
- Create: `bundles/ts-agent/test/fixtures/single-agent.yaml`

- [ ] **Step 1: Create test fixture**

Create `bundles/ts-agent/test/fixtures/single-agent.yaml`:

```yaml
apiVersion: "1.0"
kind: ts-agent
metadata:
  name: coder-agent

spec:
  mode: single
  provider: vercel-ai
  model:
    tier: balanced
  prompt: "You are a coding agent with full filesystem access."
  tools:
    - name: read-file
      type: cli
      config: { command: "cat" }
    - name: write-file
      type: function
      config: { handler: "write-file" }
    - name: web-search
      type: http
      config: { baseUrl: "https://api.search.com" }
  server:
    port: 3100
```

- [ ] **Step 2: Write failing e2e test**

Create `bundles/ts-agent/test/e2e.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(join(__dirname, 'fixtures/single-agent.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

describe('ts-agent e2e (single mode)', () => {
  it('generates all expected files for a single agent', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Agent core
    expect(paths).toContain('agent.yaml');
    expect(paths).toContain('src/agent.ts');
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/server.ts');
    expect(paths).toContain('src/config.ts');

    // Per-tool files
    expect(paths).toContain('src/tools/read-file.ts');
    expect(paths).toContain('src/tools/write-file.ts');
    expect(paths).toContain('src/tools/web-search.ts');

    // Per-tool tests
    expect(paths).toContain('tests/tools/read-file.test.ts');
    expect(paths).toContain('tests/tools/write-file.test.ts');
    expect(paths).toContain('tests/tools/web-search.test.ts');

    // Extension point
    expect(paths).toContain('src/defaults/custom-agent.ts');
    const extPoint = files.find(f => f.output === 'src/defaults/custom-agent.ts');
    expect(extPoint?.overwrite).toBe(false);
  });

  it('uses provider-specific template for agent.ts', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);
    const agentFile = files.find(f => f.output === 'src/agent.ts');
    expect(agentFile?.template).toBe('providers/vercel-ai/agent.ts.hbs');
  });

  it('uses tool-type-specific templates for tool files', () => {
    const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
    const files = generateFiles(ctx);

    const readFile = files.find(f => f.output === 'src/tools/read-file.ts');
    expect(readFile?.template).toBe('tools/cli.ts.hbs');

    const writeFile = files.find(f => f.output === 'src/tools/write-file.ts');
    expect(writeFile?.template).toBe('tools/function.ts.hbs');

    const webSearch = files.find(f => f.output === 'src/tools/web-search.ts');
    expect(webSearch?.template).toBe('tools/http.ts.hbs');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd bundles/ts-agent && npx vitest run test/e2e.test.ts`
Expected: FAIL — generateFiles not exported

- [ ] **Step 4: Implement generateFiles() and bundle export**

Add to `bundles/ts-agent/src/index.ts`:

```typescript
export function generateFiles(ctx: TsAgentContext): FileEntry[] {
  const files: FileEntry[] = [];
  const c = ctx as Record<string, unknown>;

  // Agent spec YAML (for reference)
  files.push({ template: 'agent.yaml.hbs', output: 'agent.yaml', ctx: c, overwrite: true });

  // Core source files
  files.push(
    { template: 'src/index.ts.hbs', output: 'src/index.ts', ctx: c, overwrite: true },
    { template: 'src/server.ts.hbs', output: 'src/server.ts', ctx: c, overwrite: true },
    { template: 'src/config.ts.hbs', output: 'src/config.ts', ctx: c, overwrite: true },
  );

  // Provider-specific agent loop
  files.push({
    template: `providers/${ctx.provider}/agent.ts.hbs`,
    output: 'src/agent.ts',
    ctx: c,
    overwrite: true,
  });

  // Per-tool handler files
  for (const tool of ctx.tools) {
    files.push({
      template: tool.templatePath,
      output: `src/tools/${tool.name.kebab}.ts`,
      ctx: { ...c, tool } as Record<string, unknown>,
      overwrite: true,
    });
    files.push({
      template: 'tests/tool.test.ts.hbs',
      output: `tests/tools/${tool.name.kebab}.test.ts`,
      ctx: { ...c, tool } as Record<string, unknown>,
      overwrite: true,
    });
  }

  // Extension point
  files.push({
    template: 'defaults/custom-agent.ts.hbs',
    output: 'src/defaults/custom-agent.ts',
    ctx: c,
    overwrite: false,
  });

  // Orchestrator mode (Task 13)
  if (ctx.mode === 'orchestrator' && ctx.agents) {
    files.push({
      template: `providers/${ctx.provider}/orchestrator.ts.hbs`,
      output: 'src/orchestrator.ts',
      ctx: c,
      overwrite: true,
    });

    for (const agent of ctx.agents) {
      files.push({
        template: 'agents/agent.ts.hbs',
        output: `src/agents/${agent.name.kebab}/agent.ts`,
        ctx: { ...c, agent } as Record<string, unknown>,
        overwrite: true,
      });
      files.push({
        template: 'agents/default-agent.ts.hbs',
        output: `src/agents/${agent.name.kebab}/default-${agent.name.kebab}.ts`,
        ctx: { ...c, agent } as Record<string, unknown>,
        overwrite: false,
      });
    }
  }

  return files;
}

export const bundle: Bundle = {
  kind: 'ts-agent',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  cfrs: {
    provides: ['tracing', 'metrics', 'unit-tests', 'health-check'],
    files: {
      'health-check': ['src/server.ts'],
      'unit-tests': ['tests/**/*.test.ts'],
    },
  },
};

export default bundle;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd bundles/ts-agent && npx vitest run test/e2e.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add bundles/ts-agent/src/index.ts bundles/ts-agent/test/e2e.test.ts bundles/ts-agent/test/fixtures/single-agent.yaml
git commit -m "feat(ts-agent): generateFiles() and bundle export for single mode"
```

---

## Task 12: ts-agent — Handlebars templates (single mode)

**Files:**
- Create all templates under `bundles/ts-agent/templates/`

- [ ] **Step 1: Create agent.yaml.hbs**

```handlebars
kind: agent
name: {{packageName}}
description: Generated by FixedCode

model:
  tier: {{modelTier}}

prompt: |
  {{prompt}}

tools:
{{#each tools}}
  - name: {{this.name.kebab}}
    type: {{this.type}}
{{#if this.config}}
    config:
{{#each this.config}}
      {{@key}}: {{this}}
{{/each}}
{{/if}}
{{/each}}
```

- [ ] **Step 2: Create providers/vercel-ai/agent.ts.hbs**

```handlebars
import { generateText, tool } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { logger } from './logger.js';
{{#each tools}}
import { handle as handle{{this.name.pascal}} } from './tools/{{this.name.kebab}}.js';
{{/each}}

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const MODEL_TIERS: Record<string, string> = {
  fast: 'anthropic/claude-haiku-4-5-20251001',
  balanced: 'anthropic/claude-sonnet-4-6',
  quality: 'anthropic/claude-opus-4-6',
};

const tools = {
{{#each tools}}
  '{{this.name.kebab}}': tool({
    description: '{{this.name.pascal}} tool',
    parameters: z.object({ input: z.string() }),
    execute: async ({ input }) => handle{{this.name.pascal}}({ input }),
  }),
{{/each}}
};

export async function runAgent(input: string): Promise<string> {
  const model = openrouter(MODEL_TIERS['{{modelTier}}'] ?? MODEL_TIERS.balanced);

  const result = await generateText({
    model,
    tools,
    maxSteps: 20,
    system: `{{prompt}}`,
    prompt: input,
  });

  logger.info({ usage: result.usage }, 'agent completed');
  return result.text;
}
```

- [ ] **Step 3: Create providers/claude-sdk/agent.ts.hbs**

```handlebars
import Anthropic from '@anthropic-ai/sdk';
import { logger } from './logger.js';
{{#each tools}}
import { handle as handle{{this.name.pascal}} } from './tools/{{this.name.kebab}}.js';
{{/each}}

const client = new Anthropic();

const MODEL_TIERS: Record<string, string> = {
  fast: 'claude-haiku-4-5-20251001',
  balanced: 'claude-sonnet-4-6',
  quality: 'claude-opus-4-6',
};

const toolDefs = [
{{#each tools}}
  {
    name: '{{this.name.kebab}}',
    description: '{{this.name.pascal}} tool',
    input_schema: { type: 'object' as const, properties: { input: { type: 'string' } }, required: ['input'] },
  },
{{/each}}
];

const handlers: Record<string, (input: Record<string, unknown>) => Promise<unknown>> = {
{{#each tools}}
  '{{this.name.kebab}}': handle{{this.name.pascal}},
{{/each}}
};

export async function runAgent(input: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: input }];
  const model = MODEL_TIERS['{{modelTier}}'] ?? MODEL_TIERS.balanced;

  let response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: `{{prompt}}`,
    messages,
    tools: toolDefs,
  });

  while (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(b => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') break;

    const handler = handlers[toolUse.name];
    const result = handler ? await handler(toolUse.input as Record<string, unknown>) : { error: 'unknown tool' };

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) }] });

    response = await client.messages.create({ model, max_tokens: 4096, system: `{{prompt}}`, messages, tools: toolDefs });
  }

  const textBlock = response.content.find(b => b.type === 'text');
  logger.info({ usage: response.usage }, 'agent completed');
  return textBlock?.type === 'text' ? textBlock.text : '';
}
```

- [ ] **Step 4: Create providers/openai/agent.ts.hbs**

```handlebars
import OpenAI from 'openai';
import { logger } from './logger.js';
{{#each tools}}
import { handle as handle{{this.name.pascal}} } from './tools/{{this.name.kebab}}.js';
{{/each}}

const client = new OpenAI();

const MODEL_TIERS: Record<string, string> = {
  fast: 'gpt-4o-mini',
  balanced: 'gpt-4o',
  quality: 'gpt-4o',
};

const toolDefs: OpenAI.ChatCompletionTool[] = [
{{#each tools}}
  {
    type: 'function',
    function: {
      name: '{{this.name.kebab}}',
      description: '{{this.name.pascal}} tool',
      parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
    },
  },
{{/each}}
];

const handlers: Record<string, (input: Record<string, unknown>) => Promise<unknown>> = {
{{#each tools}}
  '{{this.name.kebab}}': handle{{this.name.pascal}},
{{/each}}
};

export async function runAgent(input: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: `{{prompt}}` },
    { role: 'user', content: input },
  ];
  const model = MODEL_TIERS['{{modelTier}}'] ?? MODEL_TIERS.balanced;

  let response = await client.chat.completions.create({ model, messages, tools: toolDefs });

  while (response.choices[0]?.finish_reason === 'tool_calls') {
    const toolCalls = response.choices[0].message.tool_calls ?? [];
    messages.push(response.choices[0].message);

    for (const call of toolCalls) {
      const handler = handlers[call.function.name];
      const args = JSON.parse(call.function.arguments);
      const result = handler ? await handler(args) : { error: 'unknown tool' };
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }

    response = await client.chat.completions.create({ model, messages, tools: toolDefs });
  }

  logger.info({ usage: response.usage }, 'agent completed');
  return response.choices[0]?.message.content ?? '';
}
```

- [ ] **Step 5: Create tool handler templates**

Create `bundles/ts-agent/templates/tools/http.ts.hbs`:

```handlebars
import { logger } from '../logger.js';

const BASE_URL = '{{tool.config.baseUrl}}';

export async function handle(input: Record<string, unknown>): Promise<unknown> {
  const { path = '', method = 'GET', body } = input;
  const url = `${BASE_URL}${path}`;

  logger.info({ url, method }, '{{tool.name.pascal}} request');

  const res = await fetch(url, {
    method: method as string,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}
```

Create `bundles/ts-agent/templates/tools/cli.ts.hbs`:

```handlebars
import { execSync } from 'node:child_process';
import { logger } from '../logger.js';

export function handle(input: Record<string, unknown>): { output: string } {
  const args = (input.args as string) ?? (input.input as string) ?? '';
  const cmd = `{{tool.config.command}} ${args}`;

  logger.info({ cmd }, '{{tool.name.pascal}} exec');

  const output = execSync(cmd, { encoding: 'utf-8', timeout: 30_000 });
  return { output: output.trim() };
}
```

Create `bundles/ts-agent/templates/tools/function.ts.hbs`:

```handlebars
import { logger } from '../logger.js';

// This is a custom function tool — implement your logic here.
export async function handle(input: Record<string, unknown>): Promise<unknown> {
  logger.info({ input }, '{{tool.name.pascal}} called');

  // TODO: implement {{tool.name.kebab}} handler
  return { success: true };
}
```

Create `bundles/ts-agent/templates/tools/database.ts.hbs`:

```handlebars
import pg from 'pg';
import { logger } from '../logger.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function handle(input: Record<string, unknown>): Promise<unknown> {
  const { query, params = [] } = input;

  if (typeof query !== 'string') {
    throw new Error('query must be a string');
  }

{{#if tool.config.readOnly}}
  if (!/^\s*SELECT\b/i.test(query)) {
    throw new Error('Only SELECT queries are allowed (readOnly mode)');
  }
{{/if}}

  logger.info({ query }, '{{tool.name.pascal}} query');

  const result = await pool.query(query, params as unknown[]);
  return { rows: result.rows, rowCount: result.rowCount };
}
```

Create `bundles/ts-agent/templates/tools/mcp.ts.hbs`:

```handlebars
import { logger } from '../logger.js';

const MCP_SERVER = '{{tool.config.server}}';

export async function handle(input: Record<string, unknown>): Promise<unknown> {
  const { tool: toolName, args } = input;

  logger.info({ tool: toolName, server: MCP_SERVER }, '{{tool.name.pascal}} MCP call');

  const res = await fetch(`http://${MCP_SERVER}/tools/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });

  return res.json();
}
```

- [ ] **Step 6: Create remaining source templates**

Create `bundles/ts-agent/templates/src/index.ts.hbs`:

```handlebars
import { createServer } from './server.js';
import { config } from './config.js';
import { logger } from './logger.js';

const app = createServer();

app.listen(config.port, () => {
  logger.info({ port: config.port }, '{{serviceName.pascal}} agent started');
});
```

Create `bundles/ts-agent/templates/src/server.ts.hbs`:

```handlebars
import express from 'express';
import { runAgent } from './agent.js';
import { logger } from './logger.js';

export function createServer(): express.Express {
  const app = express();
  app.use(express.json());

  app.post('/invoke', async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        res.status(400).json({ error: 'input is required' });
        return;
      }
      const result = await runAgent(input);
      res.json({ result });
    } catch (err) {
      logger.error({ err }, 'agent invocation failed');
      res.status(500).json({ error: 'Agent invocation failed' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', agent: '{{packageName}}' });
  });

  return app;
}
```

Create `bundles/ts-agent/templates/src/config.ts.hbs`:

```handlebars
import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '{{serverPort}}', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;
```

Create `bundles/ts-agent/templates/src/logger.ts.hbs`:

```handlebars
import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

- [ ] **Step 7: Create test and extension point templates**

Create `bundles/ts-agent/templates/tests/tool.test.ts.hbs`:

```handlebars
import { describe, it, expect } from 'vitest';
import { handle } from '../../src/tools/{{tool.name.kebab}}.js';

describe('{{tool.name.pascal}} tool', () => {
  it('handles input', async () => {
    const result = await handle({ input: 'test' });
    expect(result).toBeDefined();
  });
});
```

Create `bundles/ts-agent/templates/defaults/custom-agent.ts.hbs`:

```handlebars
// This file is an extension point — it is generated once and then owned by you.
// Add custom agent behavior, pre/post processing, or additional tool wiring here.
// This file will NOT be overwritten on regeneration.

export function preProcess(input: string): string {
  return input;
}

export function postProcess(output: string): string {
  return output;
}
```

- [ ] **Step 8: Update generateFiles() to include logger.ts**

Add to `generateFiles()` in `bundles/ts-agent/src/index.ts`, alongside the other src templates:

```typescript
{ template: 'src/logger.ts.hbs', output: 'src/logger.ts', ctx: c, overwrite: true },
```

- [ ] **Step 9: Commit**

```bash
git add bundles/ts-agent/templates/
git commit -m "feat(ts-agent): all Handlebars templates for single agent mode"
```

---

## Task 13: ts-agent — orchestrator mode templates + tests

**Files:**
- Create: `bundles/ts-agent/templates/providers/vercel-ai/orchestrator.ts.hbs`
- Create: `bundles/ts-agent/templates/agents/agent.ts.hbs`
- Create: `bundles/ts-agent/templates/agents/default-agent.ts.hbs`
- Create: `bundles/ts-agent/test/fixtures/orchestrator.yaml`
- Modify: `bundles/ts-agent/test/e2e.test.ts`

- [ ] **Step 1: Create orchestrator fixture**

Create `bundles/ts-agent/test/fixtures/orchestrator.yaml`:

```yaml
apiVersion: "1.0"
kind: ts-agent
metadata:
  name: ops-orchestrator

spec:
  mode: orchestrator
  provider: vercel-ai

  agents:
    - name: planner
      prompt: "You plan the approach..."
      tools: [web-search]
      critical: true
    - name: coder
      prompt: "You write code..."
      tools: [read-file, write-file]
      critical: true
    - name: reviewer
      prompt: "You review the output..."
      tools: [read-file]
      critical: false

  routing: sequential

  tools:
    - name: read-file
      type: cli
      config: { command: "cat" }
    - name: write-file
      type: function
      config: { handler: "write-file" }
    - name: web-search
      type: http
      config: { baseUrl: "https://api.search.com" }

  server:
    port: 3200
```

- [ ] **Step 2: Write failing orchestrator e2e test**

Add to `bundles/ts-agent/test/e2e.test.ts`:

```typescript
const orchYaml = readFileSync(join(__dirname, 'fixtures/orchestrator.yaml'), 'utf-8');
const orchSpec = parseYaml(orchYaml);

describe('ts-agent e2e (orchestrator mode)', () => {
  it('generates orchestrator + per-agent files', () => {
    const ctx = enrich(orchSpec.spec, { name: orchSpec.metadata.name, apiVersion: orchSpec.apiVersion });
    const files = generateFiles(ctx);
    const paths = files.map(f => f.output);

    // Orchestrator
    expect(paths).toContain('src/orchestrator.ts');

    // Per-agent files
    expect(paths).toContain('src/agents/planner/agent.ts');
    expect(paths).toContain('src/agents/planner/default-planner.ts');
    expect(paths).toContain('src/agents/coder/agent.ts');
    expect(paths).toContain('src/agents/coder/default-coder.ts');
    expect(paths).toContain('src/agents/reviewer/agent.ts');
    expect(paths).toContain('src/agents/reviewer/default-reviewer.ts');

    // Extension points
    const orchExtPoints = files.filter(f => f.overwrite === false && f.output.includes('agents/'));
    expect(orchExtPoints).toHaveLength(3);
  });

  it('marks non-critical agents in context', () => {
    const ctx = enrich(orchSpec.spec, { name: orchSpec.metadata.name, apiVersion: orchSpec.apiVersion });
    const reviewer = ctx.agents?.find(a => a.name.kebab === 'reviewer');
    expect(reviewer?.critical).toBe(false);

    const planner = ctx.agents?.find(a => a.name.kebab === 'planner');
    expect(planner?.critical).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd bundles/ts-agent && npx vitest run test/e2e.test.ts`
Expected: Orchestrator tests PASS (generateFiles already handles orchestrator mode from Task 11), but template files don't exist yet for rendering.

- [ ] **Step 4: Create orchestrator template**

Create `bundles/ts-agent/templates/providers/vercel-ai/orchestrator.ts.hbs`:

```handlebars
import { logger } from './logger.js';
{{#each agents}}
import { runAgent as run{{this.name.pascal}} } from './agents/{{this.name.kebab}}/agent.js';
{{/each}}

interface AgentResult {
  agent: string;
  success: boolean;
  output?: string;
  error?: string;
}

interface OrchestratorResult {
  results: AgentResult[];
  finalOutput: string;
}

const AGENTS = [
{{#each agents}}
  { name: '{{this.name.kebab}}', run: run{{this.name.pascal}}, critical: {{this.critical}} },
{{/each}}
];

export async function runOrchestrator(input: string): Promise<OrchestratorResult> {
  const results: AgentResult[] = [];
  let context = input;

{{#if (eq routing 'sequential')}}
  // Sequential routing — each agent receives prior output as context
  for (const agent of AGENTS) {
    try {
      logger.info({ agent: agent.name }, 'running agent');
      const output = await agent.run(context);
      results.push({ agent: agent.name, success: true, output });
      context = output;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ agent: agent.name, success: false, error });

      if (agent.critical) {
        logger.error({ agent: agent.name, error }, 'critical agent failed — halting pipeline');
        return { results, finalOutput: `Pipeline halted: ${agent.name} failed — ${error}` };
      }

      logger.warn({ agent: agent.name, error }, 'non-critical agent failed — continuing');
    }
  }
{{else}}
  // Parallel routing — all agents run concurrently
  const settled = await Promise.allSettled(
    AGENTS.map(async (agent) => {
      const output = await agent.run(input);
      return { agent: agent.name, output, critical: agent.critical };
    })
  );

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push({ agent: result.value.agent, success: true, output: result.value.output });
    } else {
      const agentName = 'unknown';
      results.push({ agent: agentName, success: false, error: result.reason?.message });
    }
  }

  context = results.filter(r => r.success).map(r => r.output).join('\n\n');
{{/if}}

  return { results, finalOutput: context };
}
```

- [ ] **Step 5: Create per-agent templates**

Create `bundles/ts-agent/templates/agents/agent.ts.hbs`:

```handlebars
import { runAgent as baseRunAgent } from '../agent.js';
import { preProcess, postProcess } from './default-{{agent.name.kebab}}.js';
import { logger } from '../logger.js';

export async function runAgent(input: string): Promise<string> {
  logger.info({ agent: '{{agent.name.kebab}}' }, 'agent started');

  const processed = preProcess(input);
  const result = await baseRunAgent(processed);
  return postProcess(result);
}
```

Create `bundles/ts-agent/templates/agents/default-agent.ts.hbs`:

```handlebars
// Extension point for {{agent.name.pascal}} agent.
// This file is generated once and then owned by you.
// Customize pre/post processing for this specific agent.
// This file will NOT be overwritten on regeneration.

export function preProcess(input: string): string {
  // Add {{agent.name.pascal}}-specific prompt prefix or input transformation
  return `{{agent.prompt}}\n\n${input}`;
}

export function postProcess(output: string): string {
  return output;
}
```

- [ ] **Step 6: Run all tests**

Run: `cd bundles/ts-agent && npx vitest run`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add bundles/ts-agent/templates/providers/vercel-ai/orchestrator.ts.hbs bundles/ts-agent/templates/agents/ bundles/ts-agent/test/fixtures/orchestrator.yaml bundles/ts-agent/test/e2e.test.ts
git commit -m "feat(ts-agent): orchestrator mode templates and tests"
```

---

## Task 14: ts-agent — integration test with engine pipeline

**Files:**
- Create: `examples/ts-basic-agent/ts-agent.yaml`
- Create: `examples/ts-basic-agent/.fixedcode.yaml`

- [ ] **Step 1: Create example spec**

Create `examples/ts-basic-agent/ts-agent.yaml`:

```yaml
apiVersion: "1.0"
kind: ts-agent
metadata:
  name: coder-agent

spec:
  mode: single
  provider: vercel-ai
  model:
    tier: balanced
  prompt: "You are a coding agent with filesystem access."
  tools:
    - name: read-file
      type: cli
      config: { command: "cat" }
    - name: write-file
      type: function
  server:
    port: 3100
```

- [ ] **Step 2: Create example config**

Create `examples/ts-basic-agent/.fixedcode.yaml`:

```yaml
bundles:
  ts-agent: "../../bundles/ts-agent"
```

- [ ] **Step 3: Build the bundle**

Run: `cd bundles/ts-agent && npm run build`
Expected: Compiles without errors

- [ ] **Step 4: Run fixedcode generate**

Run: `node engine/bin/fixedcode.js generate examples/ts-basic-agent/ts-agent.yaml -o examples/ts-basic-agent/build`
Expected: Files generated in `examples/ts-basic-agent/build/`

- [ ] **Step 5: Verify generated output**

Run: `ls -R examples/ts-basic-agent/build/src/`
Expected: index.ts, server.ts, config.ts, logger.ts, agent.ts, tools/read-file.ts, tools/write-file.ts, defaults/custom-agent.ts

- [ ] **Step 6: Verify the generated code is valid TypeScript**

Run: `cd examples/ts-basic-agent/build && npm install && npx tsc --noEmit`
Expected: No type errors (or minor fixable ones — note and fix template issues)

- [ ] **Step 7: Commit**

```bash
git add examples/ts-basic-agent/
git commit -m "feat(ts-agent): integration test with engine pipeline"
```

---

## Task 15: Run all bundle tests + final verification

- [ ] **Step 1: Run ts-service tests**

Run: `cd bundles/ts-service && npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run ts-agent tests**

Run: `cd bundles/ts-agent && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Run engine tests to check nothing is broken**

Run: `cd engine && npm test`
Expected: All existing tests PASS

- [ ] **Step 4: Run full build pipeline on ts example**

Run: `node engine/bin/fixedcode.js build examples/ts-basic-agent -o examples/ts-basic-agent/build`
Expected: Succeeds (even though there's only one spec, build should handle it)

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any issues from final verification"
```
