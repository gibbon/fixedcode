import { generateVariants, type NamingVariants } from './naming.js';

export interface EnrichedAttribute {
  name: string;
  names: NamingVariants;
  rawType: string;
  kotlinType: string;
  required: boolean;
  defaultValue?: string;
  isIdentity: boolean;
}

const TYPE_MAP: Record<string, string> = {
  uuid: 'UUID',
  string: 'String',
  int: 'Int',
  long: 'Long',
  boolean: 'Boolean',
  decimal: 'BigDecimal',
  date: 'LocalDate',
  'date-time': 'OffsetDateTime',
  object: 'Map<String, Any>',
};

export function enrichAttributes(
  raw: Record<string, string> | undefined
): EnrichedAttribute[] {
  if (!raw) return [];
  const entries = Object.entries(raw);
  let identityAssigned = false;

  return entries.map(([rawKey, rawValue]) => {
    const optional = rawKey.endsWith('?');
    const name = optional ? rawKey.slice(0, -1) : rawKey;
    const [typePart, defaultPart] = rawValue.split('=').map(s => s.trim());
    const rawType = typePart.trim();
    const kotlinType = TYPE_MAP[rawType] ?? rawType;

    const isIdentity = !identityAssigned && rawType === 'uuid';
    if (isIdentity) identityAssigned = true;

    return {
      name,
      names: generateVariants(name),
      rawType,
      kotlinType,
      required: !optional,
      defaultValue: defaultPart,
      isIdentity,
    };
  });
}
