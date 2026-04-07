import { enrichAttributes } from './attribute.js';
import { enrichCommand } from './command.js';
import { enrichQuery } from './query.js';
import { enrichEvents } from './event.js';
import { enrichEntity } from './entity.js';
import { generateVariants } from './naming.js';
import type { RawAggregateSpec } from './spec.js';

export function enrichAggregate(name: string, raw: RawAggregateSpec) {
  const attrs = enrichAttributes(raw.attributes);
  const identityField = attrs.find(a => a.isIdentity)?.name ?? 'id';
  const names = generateVariants(name, raw.plural);
  const aggCtx = { names: { pluralKebab: names.pluralKebab, pascal: names.pascal }, identityField };

  const attrTypeMap: Record<string, string> = {};
  for (const a of attrs) {
    attrTypeMap[a.name] = a.kotlinType;
  }

  const entities = Object.entries(raw.entities ?? {}).map(([eName, eRaw]) =>
    enrichEntity(eName, eRaw, identityField)
  );

  return {
    name,
    names,
    identityField,
    attributes: attrs,
    commands: (raw.commands ?? []).map(c => enrichCommand(c, aggCtx)),
    queries: (raw.queries ?? []).map(q => enrichQuery(q, aggCtx)),
    events: enrichEvents(raw.events, attrTypeMap),
    entities,
    enumDefaults: raw.enumDefaults ?? {},
  };
}
