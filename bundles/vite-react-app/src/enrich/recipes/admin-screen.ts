import { readFileSync, existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import pluralize from 'pluralize';
import { toCamelCase, toKebabCase, toPascalCase, type NamingVariants } from '../naming.js';

export type FormInputType = 'text' | 'number' | 'checkbox' | 'date' | 'datetime-local' | 'select';

export interface AdminFieldEnumOption {
  value: string;
  label: string;
}

export interface AdminField {
  name: string;
  label: string;
  rawType: string;
  formInputType: FormInputType;
  required: boolean;
  isId: boolean;
  isReadonly: boolean;
  enumValues: AdminFieldEnumOption[];
}

export interface AdminAggregateNames extends NamingVariants {
  /** Plural variants for naming files and routes. */
  plural: string;
  pluralPascal: string;
  pluralCamel: string;
  pluralKebab: string;
}

export interface AdminAggregate {
  name: string;
  names: AdminAggregateNames;
  /** kebab-case singular for routes/labels (`workspace`). */
  nameKebab: string;
  /** PascalCase singular (`Workspace`). */
  namePascal: string;
  /** camelCase singular (`workspace`). */
  nameCamel: string;
  /** kebab-case plural (`workspaces`). */
  namePluralKebab: string;
  /** PascalCase plural (`Workspaces`). */
  namePluralPascal: string;
  /** camelCase plural (`workspaces`). */
  namePluralCamel: string;
  /** Path segment used in the API URL — kebab plural (`workspaces`). */
  apiPath: string;
  identityField: string;
  fields: AdminField[];
  /** Fields excluding the identity (used for forms/inputs). */
  inputFields: AdminField[];
}

export interface AdminScreenContext {
  enabled: true;
  basePath: string;
  apiBaseUrl: string;
  domainSpecPath: string;
  aggregates: AdminAggregate[];
}

export interface AdminScreenDisabledContext {
  enabled: false;
  basePath: string;
  apiBaseUrl: string;
  aggregates: [];
}

export interface AdminScreenInput {
  enabled: boolean;
  domainSpec: string | null;
  basePath: string;
  apiBaseUrl: string;
}

export interface BuildAdminContextOptions {
  /** Override the working directory used to resolve `domainSpec`. Defaults to `process.cwd()`. */
  cwd?: string;
}

const TYPE_TO_INPUT: Record<string, FormInputType> = {
  uuid: 'text',
  string: 'text',
  int: 'number',
  long: 'number',
  double: 'number',
  decimal: 'number',
  boolean: 'checkbox',
  date: 'date',
  localDate: 'date',
  'date-time': 'datetime-local',
  instant: 'datetime-local',
  offsetDateTime: 'datetime-local',
};

function buildNames(name: string, pluralOverride?: string): AdminAggregateNames {
  const pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const kebab = toKebabCase(name);
  const pluralCamel = pluralOverride ? toCamelCase(pluralOverride) : pluralize(camel);
  const pluralPascal = toPascalCase(pluralCamel);
  const pluralKebab = toKebabCase(pluralCamel);
  return {
    original: name,
    pascal,
    camel,
    snake: kebab.replace(/-/g, '_'),
    kebab,
    upperSnake: kebab.replace(/-/g, '_').toUpperCase(),
    plural: pluralCamel,
    pluralPascal,
    pluralCamel,
    pluralKebab,
  };
}

function humanLabel(name: string): string {
  // FooBar / fooBar / foo_bar / foo-bar → "Foo Bar"
  const spaced = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

interface RawAggregate {
  attributes?: Record<string, string>;
  enumDefaults?: Record<string, string[]>;
  plural?: string;
}

interface RawDomainSpec {
  apiVersion?: string;
  kind?: string;
  spec?: {
    aggregates?: Record<string, RawAggregate>;
  };
}

function enrichField(
  rawKey: string,
  rawValue: string,
  identityAssigned: { taken: boolean },
  enumDefaults: Record<string, string[]>,
): AdminField {
  const optional = rawKey.endsWith('?');
  const name = optional ? rawKey.slice(0, -1) : rawKey;
  const [typePart, defaultPart] = String(rawValue)
    .split('=')
    .map((s) => s.trim());
  const rawType = typePart;

  // Spring-domain default convention: `string = EnumName` declares an enum-typed field.
  // If `defaultPart` matches an entry in `enumDefaults`, treat as a select.
  const enumName = defaultPart && enumDefaults[defaultPart] ? defaultPart : undefined;

  let formInputType: FormInputType;
  let isReadonly = false;
  const isIdCandidate = rawType === 'uuid' && !identityAssigned.taken;
  if (isIdCandidate) {
    identityAssigned.taken = true;
    formInputType = 'text';
    isReadonly = true;
  } else if (enumName) {
    formInputType = 'select';
  } else {
    formInputType = TYPE_TO_INPUT[rawType] ?? 'text';
  }

  const enumValues: AdminFieldEnumOption[] = enumName
    ? enumDefaults[enumName].map((v) => ({ value: v, label: humanLabel(v) }))
    : [];

  return {
    name,
    label: humanLabel(name),
    rawType,
    formInputType,
    required: !optional,
    isId: isIdCandidate,
    isReadonly,
    enumValues,
  };
}

function loadDomainSpec(absolutePath: string): RawDomainSpec {
  if (!existsSync(absolutePath)) {
    throw new Error(
      `[vite-react-app:admin-screen] domainSpec not found at "${absolutePath}". ` +
        `The path is resolved relative to process.cwd() — run fixedcode from the directory that contains your spec, or provide an absolute path.`,
    );
  }
  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(absolutePath, 'utf-8'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[vite-react-app:admin-screen] failed to parse domainSpec YAML at "${absolutePath}": ${msg}`,
    );
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error(
      `[vite-react-app:admin-screen] domainSpec at "${absolutePath}" is empty or not an object.`,
    );
  }
  const parsed = raw as RawDomainSpec;
  if (parsed.kind && parsed.kind !== 'spring-domain') {
    throw new Error(
      `[vite-react-app:admin-screen] domainSpec at "${absolutePath}" has kind "${parsed.kind}" — expected "spring-domain".`,
    );
  }
  return parsed;
}

export function buildAdminScreenContext(
  input: AdminScreenInput,
  opts: BuildAdminContextOptions = {},
): AdminScreenContext | AdminScreenDisabledContext {
  if (!input.enabled) {
    return {
      enabled: false,
      basePath: input.basePath,
      apiBaseUrl: input.apiBaseUrl,
      aggregates: [],
    };
  }

  if (!input.domainSpec) {
    throw new Error(
      `[vite-react-app:admin-screen] recipe "admin-screen" is enabled but spec.adminScreen.domainSpec is not set. ` +
        `Add: \`adminScreen: { domainSpec: ./path/to/your-domain.yaml }\` (path resolved relative to process.cwd()).`,
    );
  }

  const cwd = opts.cwd ?? process.cwd();
  const absolutePath = isAbsolute(input.domainSpec)
    ? input.domainSpec
    : resolve(cwd, input.domainSpec);

  const domain = loadDomainSpec(absolutePath);
  const aggregatesRaw = domain.spec?.aggregates ?? {};
  const aggregateNames = Object.keys(aggregatesRaw);
  if (aggregateNames.length === 0) {
    throw new Error(
      `[vite-react-app:admin-screen] domainSpec at "${absolutePath}" defines no aggregates under spec.aggregates.`,
    );
  }

  const aggregates: AdminAggregate[] = aggregateNames.map((aggName) => {
    const raw = aggregatesRaw[aggName];
    const enumDefaults = raw.enumDefaults ?? {};
    const attributes = raw.attributes ?? {};

    const identityAssigned = { taken: false };
    const fields: AdminField[] = Object.entries(attributes).map(([k, v]) =>
      enrichField(k, v, identityAssigned, enumDefaults),
    );
    const identityField = fields.find((f) => f.isId)?.name ?? 'id';

    const names = buildNames(aggName, raw.plural);
    return {
      name: aggName,
      names,
      nameKebab: names.kebab,
      namePascal: names.pascal,
      nameCamel: names.camel,
      namePluralKebab: names.pluralKebab,
      namePluralPascal: names.pluralPascal,
      namePluralCamel: names.pluralCamel,
      apiPath: names.pluralKebab,
      identityField,
      fields,
      inputFields: fields.filter((f) => !f.isId),
    };
  });

  return {
    enabled: true,
    basePath: input.basePath,
    apiBaseUrl: input.apiBaseUrl,
    domainSpecPath: absolutePath,
    aggregates,
  };
}
