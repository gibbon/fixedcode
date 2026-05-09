import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles, helpers } from '../../src/index.js';

const meta = { name: 'order', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');

const baseSpec = {
  boundedContext: 'Order',
  service: { port: 8081, package: 'io.example.order' },
  aggregates: {
    Order: {
      attributes: { orderId: 'uuid', status: 'string' },
      commands: [{ name: 'CreateOrder', body: ['status'] }],
      queries: [{ name: 'GetOrder', returns: 'Order' }],
      events: { OrderCreated: { fields: ['orderId'] } },
    },
  },
};

const OUTBOX_FILE_TAILS = [
  'outbox/OutboxEvent.kt',
  'outbox/OutboxRepository.kt',
  'outbox/OutboxRecorder.kt',
  'outbox/MessagePublisher.kt',
  'outbox/NoopMessagePublisher.kt',
  'outbox/OutboxProperties.kt',
  'outbox/OutboxConfig.kt',
  'outbox/OutboxRelay.kt',
];

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hbs = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) {
    hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
  const src = readFileSync(join(TEMPLATE_DIR, templatePath), 'utf-8');
  return hbs.compile(src, { noEscape: true })(ctx);
}

describe('spring-domain transactional-outbox recipe', () => {
  it('does not generate any outbox files when recipe is disabled', () => {
    const ctx = enrich(baseSpec, meta);
    expect(ctx.recipeTransactionalOutbox).toBe(false);
    expect(ctx.recipes).toEqual([]);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const tail of OUTBOX_FILE_TAILS) {
      expect(outputs.some((o) => o.endsWith(tail))).toBe(false);
    }
    expect(outputs.some((o) => o.endsWith('V099__outbox.sql'))).toBe(false);
  });

  it('generates all outbox files (and migration + yml) when enabled', () => {
    const ctx = enrich({ ...baseSpec, recipes: ['transactional-outbox'] }, meta);
    expect(ctx.recipeTransactionalOutbox).toBe(true);
    expect(ctx.recipes).toEqual(['transactional-outbox']);
    expect(ctx.outbox).toEqual({ pollIntervalMs: 5000, batchSize: 100, maxAttempts: 10 });

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const tail of OUTBOX_FILE_TAILS) {
      expect(outputs.some((o) => o.endsWith(tail)), `missing ${tail}`).toBe(true);
    }
    expect(outputs).toContain('src/main/resources/application-outbox.yml');
    expect(outputs).toContain('src/main/resources/db/migration/V099__outbox.sql');

    // Extension points: NoopMessagePublisher (user replaces with their bus
    // adapter) and the V099 migration (Flyway forbids retroactive edits).
    const noop = files.find((f) => f.output.endsWith('NoopMessagePublisher.kt'));
    expect(noop?.overwrite).toBe(false);
    const migration = files.find((f) => f.output.endsWith('V099__outbox.sql'));
    expect(migration?.overwrite).toBe(false);
    // Recorder/relay/repo/etc are framework plumbing — overwritable.
    const recorder = files.find((f) => f.output.endsWith('OutboxRecorder.kt'));
    expect(recorder?.overwrite).not.toBe(false);
    const relay = files.find((f) => f.output.endsWith('OutboxRelay.kt'));
    expect(relay?.overwrite).not.toBe(false);
  });

  it('honours custom outbox config (poll interval, batch, attempts)', () => {
    const ctx = enrich(
      {
        ...baseSpec,
        recipes: ['transactional-outbox'],
        outbox: { pollIntervalMs: 1000, batchSize: 50, maxAttempts: 5 },
      },
      meta,
    );
    expect(ctx.outbox).toEqual({ pollIntervalMs: 1000, batchSize: 50, maxAttempts: 5 });

    const propsRendered = renderTemplate(
      'recipes/transactional-outbox/outbox/OutboxProperties.kt.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(propsRendered).toContain('val pollIntervalMs: Long = 1000L');
    expect(propsRendered).toContain('val batchSize: Int = 50');
    expect(propsRendered).toContain('val maxAttempts: Int = 5');
    expect(propsRendered).toContain('@ConfigurationProperties(prefix = "app.outbox")');

    const ymlRendered = renderTemplate(
      'recipes/transactional-outbox/resources/application-outbox.yml.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(ymlRendered).toContain('pollIntervalMs: ${APP_OUTBOX_POLL_INTERVAL_MS:1000}');
    expect(ymlRendered).toContain('batchSize: ${APP_OUTBOX_BATCH_SIZE:50}');
    expect(ymlRendered).toContain('maxAttempts: ${APP_OUTBOX_MAX_ATTEMPTS:5}');
  });

  it('OutboxRecorder uses MANDATORY propagation so callers can never accidentally record outside a transaction', () => {
    const rendered = renderTemplate(
      'recipes/transactional-outbox/outbox/OutboxRecorder.kt.hbs',
      { packageDot: 'io.example.order' } as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('@Transactional(propagation = Propagation.MANDATORY)');
    // Records the topic via the existing DomainEvent contract — no new public surface.
    expect(rendered).toContain('event.getTopicName()');
    expect(rendered).toContain('event.getRootAggregateId()');
  });

  it('OutboxRelay wires @Scheduled with the configured poll interval and REQUIRES_NEW transaction', () => {
    const ctx = enrich(
      { ...baseSpec, recipes: ['transactional-outbox'], outbox: { pollIntervalMs: 2500 } },
      meta,
    );
    const rendered = renderTemplate(
      'recipes/transactional-outbox/outbox/OutboxRelay.kt.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    // The fixedDelayString placeholder lets ops override at runtime, but the
    // default echoes the spec — pin both halves.
    expect(rendered).toContain('@Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:2500}")');
    expect(rendered).toContain('@Transactional(propagation = Propagation.REQUIRES_NEW)');
  });

  it('OutboxRepository uses pessimistic locking so multiple service instances don\'t double-publish', () => {
    const rendered = renderTemplate(
      'recipes/transactional-outbox/outbox/OutboxRepository.kt.hbs',
      { packageDot: 'io.example.order' } as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('@Lock(LockModeType.PESSIMISTIC_WRITE)');
    // Skip rows that have hit max attempts — operator inspection only.
    expect(rendered).toContain('e.attempts < :maxAttempts');
    expect(rendered).toContain('order by e.occurredAt asc');
  });

  it('V099 migration creates the outbox table and the partial-index hot path', () => {
    const sql = readFileSync(
      join(TEMPLATE_DIR, 'recipes/transactional-outbox/resources/db/V099__outbox.sql.hbs'),
      'utf-8',
    );
    expect(sql).toContain('CREATE TABLE outbox_event');
    expect(sql).toContain('JSONB');
    // The relay's drain query benefits hugely from a partial index on
    // unpublished rows — Postgres-only but worth it.
    expect(sql).toContain('WHERE published_at IS NULL');
    expect(sql).toContain('idx_outbox_event_unpublished');
  });

  it('MessagePublisher is a fun interface so callers can wire a lambda in tests', () => {
    const rendered = renderTemplate(
      'recipes/transactional-outbox/outbox/MessagePublisher.kt.hbs',
      { packageDot: 'io.example.order' } as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('fun interface MessagePublisher');
    expect(rendered).toContain('fun publish(event: OutboxEvent)');
  });

  it('drops invalid recipe names silently rather than throwing', () => {
    // Mirrors the kotlin-spring-bff / vite-react-app recipe parsers — unknown
    // strings are filtered out by parseSpec(), not bubbled up.
    const ctx = enrich(
      { ...baseSpec, recipes: ['transactional-outbox', 'not-a-real-recipe'] },
      meta,
    );
    expect(ctx.recipes).toEqual(['transactional-outbox']);
  });
});
