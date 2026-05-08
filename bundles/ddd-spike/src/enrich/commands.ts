import type { CommandContext, ParamContext, EventContext } from '../context.js';
import { toNameVariants } from './names.js';
import { toTypeMapping } from './types.js';

interface RawCommand {
  name: string;
  params: Array<{ name: string; type: string; required?: boolean }>;
  emits: string;
}

interface IdentityInfo {
  name: string;
  type: string;
}

function enrichParam(raw: { name: string; type: string; required?: boolean }): ParamContext {
  return {
    names: toNameVariants(raw.name),
    type: toTypeMapping(raw.type, raw.required ?? false),
    required: raw.required ?? false,
  };
}

function enrichEvent(eventName: string, command: RawCommand, identity: IdentityInfo): EventContext {
  const fields = [
    { names: toNameVariants(identity.name), type: toTypeMapping(identity.type, true) },
    ...command.params.map((p) => ({
      names: toNameVariants(p.name),
      type: toTypeMapping(p.type, true),
    })),
  ];

  return {
    names: toNameVariants(eventName),
    fields,
  };
}

export function enrichCommand(raw: RawCommand, identity: IdentityInfo): CommandContext {
  const names = toNameVariants(raw.name);
  const isCreate = names.pascal.startsWith('Create');
  const identityNames = toNameVariants(identity.name);

  return {
    names,
    params: raw.params.map(enrichParam),
    event: enrichEvent(raw.emits, raw, identity),
    httpMethod: isCreate ? 'POST' : 'PUT',
    httpPath: isCreate ? '' : `/{${identityNames.camel}}`,
    isCreate,
  };
}
