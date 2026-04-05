import { enrichAttributes } from './attribute.js';
import { enrichCommand } from './command.js';
import { enrichQuery } from './query.js';
import { enrichEvents } from './event.js';
import { generateVariants } from './naming.js';
import type { RawEntitySpec } from './spec.js';

export function enrichEntity(name: string, raw: RawEntitySpec, parentIdentityField: string) {
  const attrs = enrichAttributes(raw.attributes);
  const identityField = attrs.find(a => a.isIdentity)?.name ?? 'id';
  const names = generateVariants(name);
  const aggCtx = { names: { pluralKebab: names.pluralKebab, pascal: names.pascal }, identityField };

  return {
    name,
    names,
    identityField,
    parentIdentityField,
    attributes: attrs,
    commands: (raw.commands ?? []).map(c => enrichCommand(c, aggCtx)),
    queries: (raw.queries ?? []).map(q => enrichQuery(q, aggCtx)),
    events: enrichEvents(raw.events),
    enumDefaults: raw.enumDefaults ?? {},
  };
}
