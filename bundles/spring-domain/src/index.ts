import type { Bundle, Context, FileEntry, SpecMetadata } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseSpec, type NormalizedOutboxConfig, type RecipeName } from './enrich/spec.js';
import { enrichAggregate } from './enrich/aggregate.js';
import { generateVariants } from './enrich/naming.js';
import { toOpenApi } from './adapters/openapi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export interface EnrichedContext extends Context {
  boundedContext: string;
  names: ReturnType<typeof generateVariants>;
  packagePath: string;
  packageDot: string;
  service: { port?: number; package: string };
  aggregates: ReturnType<typeof enrichAggregate>[];
  recipes: RecipeName[];
  recipeTransactionalOutbox: boolean;
  outbox: NormalizedOutboxConfig;
}

export function enrich(raw: Record<string, unknown>, _metadata: SpecMetadata): EnrichedContext {
  const spec = parseSpec(raw);
  const names = generateVariants(spec.boundedContext);
  const packagePath = spec.service.package.replace(/\./g, '/');

  return {
    boundedContext: spec.boundedContext,
    names,
    packagePath,
    packageDot: spec.service.package,
    service: spec.service,
    aggregates: Object.entries(spec.aggregates).map(([name, agg]) => enrichAggregate(name, agg)),
    recipes: spec.recipes,
    recipeTransactionalOutbox: spec.recipes.includes('transactional-outbox'),
    outbox: spec.outbox,
  };
}

export function generateFiles(ctx: EnrichedContext): FileEntry[] {
  const pkg = ctx.packagePath;
  const files: FileEntry[] = [];

  // Once per bounded context — shared domain files
  files.push(
    {
      template: 'src/main/kotlin/domain/shared/DomainEvent.kt.hbs',
      output: `src/main/kotlin/${pkg}/domain/shared/DomainEvent.kt`,
      ctx: { ...ctx } as Record<string, unknown>,
    },
    {
      template: 'src/main/kotlin/domain/shared/ValidationResult.kt.hbs',
      output: `src/main/kotlin/${pkg}/domain/shared/ValidationResult.kt`,
      ctx: { ...ctx } as Record<string, unknown>,
    },
  );

  for (const agg of ctx.aggregates) {
    const aggCtx = { ...agg, packagePath: pkg, packageDot: ctx.packageDot } as Record<
      string,
      unknown
    >;
    const aggPath = `src/main/kotlin/${pkg}/domain/${agg.names.kebab}`;
    const testPath = `src/test/kotlin/${pkg}`;

    // Per aggregate
    files.push(
      {
        template: 'src/main/kotlin/domain/[aggregate]/Aggregate.kt.hbs',
        output: `${aggPath}/${agg.names.pascal}.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/main/kotlin/domain/[aggregate]/AggregateEvents.kt.hbs',
        output: `${aggPath}/${agg.names.pascal}Events.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/main/kotlin/application/[aggregate]/AggregateCommandService.kt.hbs',
        output: `src/main/kotlin/${pkg}/application/${agg.names.kebab}/${agg.names.pascal}CommandService.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/main/kotlin/application/[aggregate]/AggregateQueryService.kt.hbs',
        output: `src/main/kotlin/${pkg}/application/${agg.names.kebab}/${agg.names.pascal}QueryService.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/main/kotlin/api/[aggregate]/AggregateApiDelegateImpl.kt.hbs',
        output: `src/main/kotlin/${pkg}/api/${agg.names.kebab}/${agg.names.pascal}ApiDelegateImpl.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/main/kotlin/infrastructure/[aggregate]/AggregateReadRepositoryImpl.kt.hbs',
        output: `src/main/kotlin/${pkg}/infrastructure/${agg.names.kebab}/${agg.names.pascal}ReadRepositoryImpl.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/main/kotlin/infrastructure/[aggregate]/AggregateWriteRepositoryImpl.kt.hbs',
        output: `src/main/kotlin/${pkg}/infrastructure/${agg.names.kebab}/${agg.names.pascal}WriteRepositoryImpl.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/test/kotlin/domain/[aggregate]/AggregateTest.kt.hbs',
        output: `${testPath}/domain/${agg.names.kebab}/${agg.names.pascal}Test.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/test/kotlin/application/[aggregate]/AggregateCommandServiceTest.kt.hbs',
        output: `${testPath}/application/${agg.names.kebab}/${agg.names.pascal}CommandServiceTest.kt`,
        ctx: aggCtx,
      },
      {
        template: 'src/test/kotlin/api/[aggregate]/AggregateApiDelegateImplTest.kt.hbs',
        output: `${testPath}/api/${agg.names.kebab}/${agg.names.pascal}ApiDelegateImplTest.kt`,
        ctx: aggCtx,
      },
      // Interface (generated, always overwritten)
      {
        template: 'src/main/kotlin/domain/[aggregate]/AggregateBusinessService.kt.hbs',
        output: `${aggPath}/${agg.names.pascal}BusinessService.kt`,
        ctx: aggCtx,
      },
      // Extension points (generated ONCE, then user-owned)
      {
        template: 'src/main/kotlin/domain/[aggregate]/DefaultBusinessService.kt.hbs',
        output: `${aggPath}/Default${agg.names.pascal}BusinessService.kt`,
        ctx: aggCtx,
        overwrite: false,
      },
      {
        template: 'src/main/kotlin/domain/[aggregate]/DefaultValidator.kt.hbs',
        output: `${aggPath}/Default${agg.names.pascal}Validator.kt`,
        ctx: aggCtx,
        overwrite: false,
      },
    );

    // Per command
    for (const cmd of agg.commands) {
      files.push({
        template: 'src/main/kotlin/domain/[aggregate]/commands/[command].kt.hbs',
        output: `${aggPath}/commands/${cmd.names.pascal}Command.kt`,
        ctx: { ...aggCtx, cmd } as Record<string, unknown>,
      });
    }

    // Per entity
    for (const entity of agg.entities ?? []) {
      const entityPath = `${aggPath}/entities`;
      files.push(
        {
          template: 'src/main/kotlin/domain/[aggregate]/entities/[entity].kt.hbs',
          output: `${entityPath}/${entity.names.pascal}.kt`,
          ctx: { ...aggCtx, entity } as Record<string, unknown>,
        },
        {
          template: 'src/main/kotlin/domain/[aggregate]/entities/[entity]Events.kt.hbs',
          output: `${entityPath}/${entity.names.pascal}Events.kt`,
          ctx: { ...aggCtx, entity } as Record<string, unknown>,
        },
      );

      // Per entity command
      for (const cmd of entity.commands) {
        files.push({
          template: 'src/main/kotlin/domain/[aggregate]/commands/[command].kt.hbs',
          output: `${entityPath}/commands/${cmd.names.pascal}Command.kt`,
          ctx: { ...aggCtx, entity, cmd } as Record<string, unknown>,
        });
      }
    }
  }

  // Recipe: transactional-outbox
  if (ctx.recipeTransactionalOutbox) {
    const recipeCtx = ctx as unknown as Record<string, unknown>;
    files.push(
      {
        template: 'recipes/transactional-outbox/outbox/OutboxEvent.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/OutboxEvent.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/outbox/OutboxRepository.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/OutboxRepository.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/outbox/OutboxRecorder.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/OutboxRecorder.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/outbox/MessagePublisher.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/MessagePublisher.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/outbox/NoopMessagePublisher.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/NoopMessagePublisher.kt`,
        ctx: recipeCtx,
        overwrite: false,
      },
      {
        template: 'recipes/transactional-outbox/outbox/OutboxProperties.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/OutboxProperties.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/outbox/OutboxConfig.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/OutboxConfig.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/outbox/OutboxRelay.kt.hbs',
        output: `src/main/kotlin/${pkg}/outbox/OutboxRelay.kt`,
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/resources/application-outbox.yml.hbs',
        output: 'src/main/resources/application-outbox.yml',
        ctx: recipeCtx,
      },
      {
        template: 'recipes/transactional-outbox/resources/db/V099__outbox.sql.hbs',
        output: 'src/main/resources/db/migration/V099__outbox.sql',
        ctx: recipeCtx,
        overwrite: false,
      },
    );
  }

  return files;
}

export const helpers = {
  /**
   * Render a Spring property reference: `${VAR:default}`. Avoids the headache
   * of emitting literal `${...}` braces alongside Handlebars `{{ }}` (the
   * trailing `}` collides with Handlebars' close-tag tokenizer).
   */
  springProp: (...args: unknown[]) => {
    const params = args.slice(0, -1);
    const varName = String(params[0] ?? '');
    const hasDefault = params.length >= 2;
    const d = hasDefault ? `:${String(params[1] ?? '')}` : '';
    return `\${${varName}${d}}`;
  },
};

export const bundle: Bundle = {
  kind: 'spring-domain',
  specSchema: schema,
  enrich: enrich as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  helpers,
  adapters: {
    openapi: toOpenApi as unknown as (ctx: Context) => Record<string, unknown>,
  },
  cfrs: {
    provides: [
      'auth',
      'authorization',
      'input-validation',
      'error-handling',
      'optimistic-locking',
      'pagination',
      'filtering',
      'domain-events',
      'outbox',
      'unit-tests',
      'openapi',
    ],
    files: {
      auth: ['src/main/kotlin/*/config/SecurityConfig.kt'],
      'domain-events': ['src/main/kotlin/*/domain/shared/DomainEvent.kt'],
      'input-validation': ['src/main/kotlin/*/domain/shared/ValidationResult.kt'],
      openapi: ['*-openapi.yaml'],
    },
  },
};

export default bundle;
