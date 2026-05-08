# @fixedcode/bundle-ts-agent

TypeScript AI-agent service.

## Install

```bash
fixedcode registry install ts-agent
```

## What it generates

Layers an agent runtime on top of a `ts-service`-style skeleton: tool registry, LLM call loop, HTTP endpoints for invocation, optional orchestrator mode for multi-agent pipelines.

## Spec highlights

`name`, `model.tier`, `prompt`, `tools` (each with `type` and `config`), optional `mode: orchestrator`.

## Documentation

- [Writing a bundle](../../docs/bundles.md)
- [Spec format conventions](../../docs/architecture.md)

## License

[Apache-2.0](../../LICENSE)
