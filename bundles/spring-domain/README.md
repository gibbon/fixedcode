# @fixedcode/bundle-spring-domain

Spring Boot DDD domain code in Kotlin.

## Install

```bash
fixedcode registry install spring-domain
```

## What it generates

Generates a complete domain layer: aggregates with attributes, commands (Create/Update/Delete), queries (Get/Search/Find), domain events, controllers, repositories, services, and tests. Driven by a YAML spec describing aggregates and their operations.

## Spec highlights

`aggregates` (with `attributes`, `commands`, `queries`, `events`), naming conventions auto-derive HTTP routes (Create* → POST, Get* → GET by ID, Search* → GET paged, Find*By* → GET with derived path).

## Adapters

Exposes an `openapi` adapter — when the OpenAPI generator is registered, an OpenAPI 3.0.3 spec is generated alongside the Kotlin code.

## Documentation

- [Writing a bundle](../../docs/bundles.md)
- [Spec format conventions](../../docs/architecture.md)

## License

[Apache-2.0](../../LICENSE)
