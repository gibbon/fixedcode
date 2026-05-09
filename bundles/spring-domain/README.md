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

## Recipes

A **recipe** is a named feature that the spec opts into. Each recipe expands to a fixed set of additional files inside the generated tree (no engine changes — recipes are entirely a bundle concern).

```yaml
spec:
  boundedContext: Order
  service: { package: com.example.order }
  aggregates: { ... }
  recipes:
    - transactional-outbox
```

### Available recipes

#### `transactional-outbox`

Reliable domain-event publication via the outbox pattern. The recorder writes each emitted [`DomainEvent`](templates/src/main/kotlin/domain/shared/DomainEvent.kt.hbs) to an `outbox_event` table inside the same transaction as the aggregate write — so commit semantics align (no dual-write inconsistency). A `@Scheduled` relay polls the table and publishes through a [`MessagePublisher`](templates/recipes/transactional-outbox/outbox/MessagePublisher.kt.hbs) extension point. Default `MessagePublisher` is a no-op; replace with your Kafka/SQS/NATS adapter.

Use it from your business service:

```kotlin
class DefaultOrderBusinessService(
    private val repo: OrderWriteRepository,
    private val outbox: OutboxRecorder,
) : OrderBusinessService {
    @Transactional
    override fun create(cmd: CreateOrderCommand): Order {
        val (order, events) = Order.create(cmd)
        repo.save(order)
        events.forEach(outbox::record)   // outbox row(s) committed atomically
        return order
    }
}
```

`OutboxRecorder.record()` declares `Propagation.MANDATORY` — calling it outside an active transaction is a programming error and throws fast (the row needs to commit atomically with the aggregate, anything else defeats the pattern).

The relay claims rows under `LockModeType.PESSIMISTIC_WRITE` so multiple service instances can run concurrently without double-publishing. Rows are retried up to `outbox.maxAttempts` times; beyond that they're left untouched for an operator to inspect (no auto-discard — too easy to misconfigure into silent data loss).

Generates (under `{packageDot}.outbox`):

- `OutboxEvent.kt` — JPA entity (table `outbox_event`)
- `OutboxRepository.kt` — pessimistic-locked unpublished-batch query
- `OutboxRecorder.kt` — `@Component`, `Propagation.MANDATORY` — the public API your business service calls
- `MessagePublisher.kt` — `fun interface` — the bus adapter contract
- `NoopMessagePublisher.kt` — **extension point** (`overwrite: false`) — replace with your real adapter (Kafka / SQS / NATS / Pub-Sub examples in the file header)
- `OutboxProperties.kt` — `@ConfigurationProperties("app.outbox")` with compile-time defaults from the spec
- `OutboxConfig.kt` — `@EnableScheduling` + `@EnableConfigurationProperties`
- `OutboxRelay.kt` — `@Scheduled` poller in a `REQUIRES_NEW` transaction
- `src/main/resources/application-outbox.yml` — env-overridable defaults; optional (the `OutboxProperties` defaults already match)
- `src/main/resources/db/migration/V099__outbox.sql` — **`overwrite: false`** (Flyway forbids retroactive edits). Versioned `V099` to sit below the `V100+` range used by BFF-side recipes and clear of the aggregate migration range. Includes a partial index on unpublished rows so the relay's hot path stays fast as the table grows.

Spec config (under `spec.outbox`):

| Field            | Default | Description                                                                               |
| ---------------- | ------- | ----------------------------------------------------------------------------------------- |
| `pollIntervalMs` | `5000`  | How often `OutboxRelay` polls. Lower = lower end-to-end latency, higher DB load.          |
| `batchSize`      | `100`   | Max rows per poll.                                                                        |
| `maxAttempts`    | `10`    | Retries before a row is parked for operator inspection.                                   |

Override per-environment with env vars: `APP_OUTBOX_POLL_INTERVAL_MS`, `APP_OUTBOX_BATCH_SIZE`, `APP_OUTBOX_MAX_ATTEMPTS`.

### Adding a new recipe

1. Add the recipe name to `schema.json` under `properties.recipes.items.enum` and `KNOWN_RECIPES` in `src/enrich/spec.ts`.
2. Add a `recipe<Name>: boolean` flag to the enriched context.
3. Drop templates under `templates/recipes/<recipe-name>/` and append them to `generateFiles()` behind the new flag.
4. Add a `test/recipes/<recipe-name>.test.ts` with on/off cases.

## Documentation

- [Writing a bundle](../../docs/bundles.md)
- [Spec format conventions](../../docs/architecture.md)

## License

[Apache-2.0](../../LICENSE)
