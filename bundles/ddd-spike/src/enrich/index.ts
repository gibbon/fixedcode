import type { SpecMetadata } from '@fixedcode/engine';
import type { DddContext, AggregateContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';
import { enrichAttribute } from './attributes.js';
import { enrichCommand } from './commands.js';
import { enrichQuery } from './queries.js';

interface RawAggregate {
  name: string;
  attributes: Array<{
    name: string;
    type: string;
    required?: boolean;
    identity?: boolean;
    default?: string;
  }>;
  commands?: Array<{
    name: string;
    params: Array<{ name: string; type: string; required?: boolean }>;
    emits: string;
  }>;
  queries?: Array<{
    name: string;
    returns: string;
    filters?: Array<{ name: string; type: string }>;
  }>;
  events?: Array<{
    name: string;
    fields: Array<{ name: string; type: string }>;
  }>;
}

function collectImports(agg: AggregateContext): string[] {
  const imports = new Set<string>();

  for (const attr of agg.allAttributes) {
    if (attr.type.needsImport) imports.add(attr.type.needsImport);
  }
  for (const cmd of agg.commands) {
    for (const param of cmd.params) {
      if (param.type.needsImport) imports.add(param.type.needsImport);
    }
  }
  for (const query of agg.queries) {
    for (const filter of query.filters) {
      if (filter.type.needsImport) imports.add(filter.type.needsImport);
    }
  }

  return [...imports].sort();
}

function enrichAggregate(raw: RawAggregate): AggregateContext {
  const names = toNameVariants(raw.name);

  const allAttributes = raw.attributes.map(enrichAttribute);
  const identity = allAttributes.find((a) => a.identity);
  if (!identity) {
    throw new Error(`Aggregate '${raw.name}' has no identity attribute (set identity: true)`);
  }
  const attributes = allAttributes.filter((a) => !a.identity);

  const identityInfo = { name: identity.names.camel, type: identity.type.spec };
  const commands = (raw.commands ?? []).map((c) => enrichCommand(c, identityInfo));
  const queries = (raw.queries ?? []).map((q) => enrichQuery(q, identityInfo));

  // Build events from spec (not derived from commands — spec is authoritative)
  const events = (raw.events ?? []).map((e) => ({
    names: toNameVariants(e.name),
    fields: e.fields.map((f) => ({
      names: toNameVariants(f.name),
      type: toTypeMapping(f.type, true),
    })),
  }));

  const agg: AggregateContext = {
    names,
    identity,
    attributes,
    allAttributes,
    commands,
    queries,
    events,
    imports: [], // computed below
    tableName: names.snakePlural,
    endpoint: `/${names.kebabPlural}`,
    hasCommands: commands.length > 0,
    hasQueries: queries.length > 0,
  };

  agg.imports = collectImports(agg);
  return agg;
}

export function enrich(spec: Record<string, unknown>, _metadata: SpecMetadata): DddContext {
  const rawAggregates = spec.aggregates as RawAggregate[];

  return {
    package: spec.package as string,
    aggregates: rawAggregates.map(enrichAggregate),
  };
}
