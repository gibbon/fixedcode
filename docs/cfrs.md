# Cross-Functional Requirements (CFRs)

CFRs are the non-functional requirements every service needs: auth, logging, error handling, observability, etc. FixedCode tracks a catalog of 28 CFRs across 7 categories. Bundles declare which CFRs they bake in; the engine verifies and reports on coverage.

## Categories

- **security** — auth, authorization, CORS, input validation, rate limiting
- **observability** — logging, metrics, health checks, tracing, audit log
- **resilience** — error handling, retry, circuit breaker, optimistic locking, dead letter queue
- **data** — pagination, filtering, migrations, soft delete
- **events** — domain events, transactional outbox, event schema versioning
- **testing** — unit tests, integration tests, contract tests
- **devops** — Docker, CI/CD, OpenAPI spec

## CLI

```bash
fixedcode cfr catalog                              # list all 28 CFRs across 7 categories
fixedcode cfr catalog --category security          # filter by category
fixedcode cfr suggest <spec.yaml>                  # show CFRs not yet covered by the bundle
fixedcode cfr check <spec.yaml> <outputDir>        # verify CFR files are present after generation
fixedcode cfr report <spec.yaml> <outputDir>       # generate a Markdown compliance report
fixedcode cfr report <spec.yaml> <outputDir> -o compliance.md  # save to file
```

## Declaring CFRs in a bundle

```ts
export const bundle: Bundle = {
  kind: 'spring-domain',
  // ...
  cfrs: {
    provides: ['auth', 'logging', 'domain-events', 'unit-tests'],
    files: {
      auth: ['src/main/kotlin/*/config/SecurityConfig.kt'],
      logging: ['src/main/resources/logback-spring.xml'],
      'domain-events': ['src/main/kotlin/*/domain/events/*.kt'],
      'unit-tests': ['src/test/kotlin/*/**/*Test.kt'],
    },
  },
};
```

`files` is a map of CFR ID → glob patterns. `cfr check` verifies that, after generation, files matching every glob exist. Globs are evaluated against the output directory.

## Configuring CFRs in a spec

Specs can opt out of bundle-provided CFRs or request optional ones:

```yaml
spec:
  # ... domain content ...
  cfrs:
    rate-limiting: false    # disable a CFR the bundle provides
    soft-delete: true       # request a CFR (bundle must support it)
```

## Workflow

1. Run `fixedcode cfr suggest <spec>` to see what's missing relative to the catalog.
2. If it's something the bundle should bake in, add the CFR to `cfrs.provides` and the relevant file globs to `cfrs.files`.
3. Run `fixedcode cfr check` to confirm everything is wired.
4. Generate a compliance report with `fixedcode cfr report` for stakeholders.
