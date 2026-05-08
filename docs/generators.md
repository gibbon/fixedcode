# Writing a Generator

**Generators** differ from bundles in one way: bundles produce files from Handlebars templates; generators produce files programmatically.

A generator's input contract is its own concern. Bundles wire their enriched context into the generator's input via an **adapter**. The OpenAPI generator at `generators/openapi/` is the worked example.

## The `Generator` interface

```ts
import type { Generator } from 'fixedcode';

export const openapi: Generator = {
  name: 'openapi',
  generate(input: OpenApiInput): RenderedFile[] {
    // ... build the OpenAPI 3.0.3 document, serialise it, return as files
    return [
      { path: 'openapi.yaml', content: yamlString, overwrite: true },
    ];
  },
};

export default openapi;
```

`RenderedFile` is the same shape as `FileEntry` (`path`, `content`, `overwrite`). Generators commonly produce one or more files, all flagged `overwrite: true` (never user-owned — regenerate at will).

## Adapters

Bundles connect to generators via the optional `adapters` field on the `Bundle` export:

```ts
export const bundle: Bundle = {
  // ...
  adapters: {
    openapi: (ctx) => ({
      info: { title: ctx.name, version: '1.0.0' },
      operations: ctx.aggregates.flatMap((agg) => agg.commands.map((cmd) => ({
        operationId: `${cmd.namePascal}`,
        method: cmd.httpMethod,
        path: cmd.httpPath,
        // ...
      }))),
    }),
  },
};
```

The engine wires this together: when a bundle declares an adapter for a generator that's also registered in `.fixedcode.yaml`, the adapter is called with the enriched context, and the result is passed to the generator's `generate()`. Output files are merged into the bundle's output.

## When to use a generator vs a template

- **Templates** are easier when the output structure is fixed and you're substituting values (controllers, repositories, configs).
- **Generators** are better when the structure depends on the input shape — e.g. an OpenAPI spec where the number of paths/operations is data-driven, or a JSON Schema where shape varies per spec.

## Configuring a project to use a generator

In `.fixedcode.yaml`:

```yaml
bundles:
  spring-domain: "./bundles/spring-domain"

generators:
  openapi: "./generators/openapi"
```

Or via npm:

```yaml
generators:
  openapi: "@fixedcode/generator-openapi"
```

When `spring-domain` exposes an `openapi` adapter and the openapi generator is registered, the engine wires them automatically — the OpenAPI spec is generated alongside the Kotlin code.

## Tests

Generators are pure functions: input → list of files. Test them with table-driven cases and snapshot the output content.
