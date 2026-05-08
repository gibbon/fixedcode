# Writing a Bundle

A **bundle** turns a YAML spec into a tree of files via Handlebars templates and an `enrich()` function. Every bundle is a self-contained npm package.

## Quick start

```bash
fixedcode bundle init my-bundle -k my-domain -o ./bundles
```

This scaffolds:

```
my-bundle/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Bundle export (kind, schema, enrich, templates path)
│   └── enrich/
│       └── index.ts      # spec → context transformation
├── templates/            # Handlebars templates (.hbs files)
└── test/
    ├── enrich/
    └── fixtures/
```

## The `Bundle` interface

```ts
import type { Bundle, SpecMetadata, Context } from '@fixedcode/engine';
import { enrich } from './enrich/index.js';

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
};

export const bundle: Bundle = {
  kind: 'my-domain',                      // matches spec.kind in YAML
  specSchema: schema as Bundle['specSchema'],
  enrich,                                 // (spec, metadata) → Context
  templates: 'templates',                 // path to .hbs files
  // optional:
  generateFiles?: (ctx) => FileEntry[],   // for one-to-many file output
  adapters?: { openapi: (ctx) => OpenApiInput },
  helpers?: { eq: (a, b) => a === b },
  cfrs?: { provides: ['logging'], files: { logging: ['src/.../Logger.kt'] } },
};

export default bundle;
```

## Templates

Templates are Handlebars files (`.hbs`) under `templates/`. The directory tree is the output tree. The file name and path can themselves use Handlebars expressions:

```
templates/
└── src/
    └── main/
        └── kotlin/
            └── {{packageDir}}/
                └── {{namePascal}}Service.kt.hbs
```

The `.hbs` suffix is stripped on output.

The render context is whatever your `enrich()` returns. By convention you provide multiple casings of identifiers (`namePascal`, `nameCamel`, `nameKebab`, `nameSnake`) so templates can use the right form.

## Extension points

Mark a file as user-owned after first generation by returning it from `generateFiles()` with `overwrite: false`:

```ts
export function generateFiles(ctx: Context): FileEntry[] {
  return [
    {
      path: 'src/main/kotlin/.../DefaultBusinessService.kt',
      content: renderTemplate('DefaultBusinessService.kt.hbs', ctx),
      overwrite: false,  // generated once, then user-owned
    },
    // ... other always-overwritten files
  ];
}
```

The engine records this in the manifest. On the next `generate`, files marked `overwrite: false` are skipped if they already exist. Extension points are how the AI-sandwich workflow keeps your business logic safe across regenerations.

## `cfrs` declaration

Bundles can declare which Cross-Functional Requirements they provide:

```ts
cfrs: {
  provides: ['logging', 'auth', 'docker', 'unit-tests'],
  files: {
    logging: ['src/main/resources/logback-spring.xml'],
    auth: ['src/main/kotlin/.../config/SecurityConfig.kt'],
  },
},
```

`fixedcode cfr check` and `fixedcode cfr report` use this metadata to verify generated output. See [`cfrs.md`](cfrs.md).

## Tests

We use `vitest`. A typical bundle test fixture:

```ts
import { describe, it, expect } from 'vitest';
import { bundle } from '../src/index.js';

describe('my-bundle enrich', () => {
  it('expands names into all casings', () => {
    const ctx = bundle.enrich(
      { name: 'workspace-service' },
      { /* metadata */ } as any,
    );
    expect(ctx).toMatchObject({
      namePascal: 'WorkspaceService',
      nameCamel: 'workspaceService',
      nameKebab: 'workspace-service',
      nameSnake: 'workspace_service',
    });
  });
});
```

For end-to-end coverage, render against a fixture spec and snapshot the output tree.

## Conventions

- Spec schemas use kebab-case for keys and PascalCase for type names where applicable.
- Default values are encoded in the schema (`default: "..."`) so consumers can omit them.
- Bundles should be additive: adding a new optional field shouldn't change generated output for old specs.
- Use `noEscape: true` (the engine default) for code/YAML output. If a template renders HTML, register a helper that escapes manually.

## Publishing to the registry

```bash
cd my-bundle
fixedcode registry publish --kind bundle --tags "spring,kotlin,my-pattern"
```

This opens a PR against the [`fixedcode-ai/registry`](https://github.com/fixedcode-ai/registry) repo to add your bundle to `registry.json`. See [`registry.md`](registry.md) for the publish flow.
