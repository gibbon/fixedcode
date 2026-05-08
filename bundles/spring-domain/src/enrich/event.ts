import { generateVariants, type NamingVariants } from './naming.js';

export interface EnrichedEventField {
  name: string;
  names: NamingVariants;
  required: boolean;
  kotlinType: string;
}

export interface EnrichedEvent {
  name: string;
  names: NamingVariants;
  fields: EnrichedEventField[];
}

export function enrichEvents(
  raw: Record<string, { fields: string[] }> | undefined,
  attributeTypeMap?: Record<string, string>,
): EnrichedEvent[] {
  if (!raw) return [];
  return Object.entries(raw).map(([name, def]) => ({
    name,
    names: generateVariants(name),
    fields: (def.fields ?? []).map((f) => {
      const optional = f.endsWith('?');
      const fieldName = optional ? f.slice(0, -1) : f;
      const kotlinType = attributeTypeMap?.[fieldName] ?? 'String';
      return {
        name: fieldName,
        names: generateVariants(fieldName),
        required: !optional,
        kotlinType,
      };
    }),
  }));
}
