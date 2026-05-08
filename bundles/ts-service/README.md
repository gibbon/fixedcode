# @fixedcode/bundle-ts-service

TypeScript + Express service skeleton.

## Install

```bash
fixedcode registry install ts-service
```

## What it generates

Project skeleton for a plain TypeScript microservice: `package.json`, `tsconfig.json`, Express HTTP server with health endpoint, structured logging via pino, dotenv-typed config, vitest scaffolding, Docker.

## Spec highlights

`service.name`, `service.port`, `features.{database,docker}`.

## Documentation

- [Writing a bundle](../../docs/bundles.md)
- [Spec format conventions](../../docs/architecture.md)

## License

[Apache-2.0](../../LICENSE)
