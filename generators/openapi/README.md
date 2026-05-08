# @fixedcode/generator-openapi

Generates an OpenAPI 3.0.3 specification from a domain context.

## Purpose

Most domain bundles describe HTTP-exposed operations (commands, queries) declaratively. This generator turns that into a portable OpenAPI document that other tools (mock servers, contract tests, client SDK generators) can consume.

## Install

```bash
fixedcode registry install openapi
```

## Input contract

The generator expects an `OpenApiInput` object with:

```ts
{
  info: { title: string; version: string; description?: string };
  servers?: { url: string; description?: string }[];
  operations: Array<{
    operationId: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;                          // e.g. "/workspaces/{workspaceId}"
    summary?: string;
    requestBody?: SchemaRef;
    responses: Record<string, SchemaRef>;
    parameters?: ParameterDef[];
    tags?: string[];
  }>;
  components?: { schemas?: Record<string, JsonSchema> };
}
```

Bundles wire their enriched context into this shape via an `adapters.openapi` function on the bundle export. See [`bundles/spring-domain/src/adapters/openapi.ts`](../../bundles/spring-domain/src/adapters/openapi.ts) for a worked example.

## Output

`openapi.yaml` at the configured output path, plus optionally `openapi.json` if requested.

## Documentation

- [Writing a generator](../../docs/generators.md)

## License

[Apache-2.0](../../LICENSE)
