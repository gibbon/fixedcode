import type { Bundle, SpecMetadata } from '@fixedcode/engine';
import type { Context } from '@fixedcode/engine';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

export interface LibrarySpec {
  library: {
    name: string;
    description: string;
    version?: string;
    group?: string;
  };
  features?: {
    database?: {
      enabled?: boolean;
      type?: string;
      name?: string;
      port?: number;
    };
    messaging?: {
      enabled?: boolean;
    };
  };
  service?: {
    port?: number;
  };
  featureLibrary?: {
    coreDomain: string;
    featureName: string;
  };
}

export interface LibraryContext extends Context {
  LibraryName: string;
  LibraryNamePascal: string;
  LibraryNameCamel: string;
  LibraryNameSnake: string;
  LibraryNameKebab: string;
  PackageName: string;
  PackagePath: string;
  DomainPackage: string;
  DomainNamePascal: string;
  BoundedContextLower: string;
  BoundedContextKebab: string;
  Description: string;
  Version: string;
  Group: string;
  DatabaseEnabled: boolean;
  DatabaseType: string;
  DatabaseName: string;
  DatabasePort: number;
  DatabaseReadPort: number;
  SchemaName: string;
  KafkaEnabled: boolean;
  ActuatorEnabled: boolean;
  ServerPort: number;
  PropertyPrefix: string;
  IsFeatureLibrary: boolean;
  CoreLibraryName: string;
  CoreLibraryGroup: string;
  CoreDomain: string;
  FeatureName: string;
  FeatureNamePascal: string;
  FeatureNameKebab: string;
}

function parseLibraryName(name: string): { domain: string; suffix: string } {
  // Strip leading 'gap-' prefix if present
  const stripped = name.startsWith('gap-') ? name.slice(4) : name;
  const parts = stripped.split('-');
  if (parts.length >= 2 && parts[parts.length - 1] === 'core') {
    const domain = parts.slice(0, -1).join('-');
    return { domain, suffix: 'core' };
  }
  return { domain: stripped, suffix: '' };
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
    index === 0 ? word.toUpperCase() : word.toUpperCase()
  ).replace(/[\s_-]+/g, '');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[\s-]+/g, '_');
}

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/[\s_]+/g, '-');
}

/**
 * Simple deterministic port hash — maps a string to a port in [15432..25432].
 * Used to derive a stable read-replica port from the bounded context name.
 */
function hashToReadPort(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return 15432 + (Math.abs(hash) % 10000);
}

function enrich(spec: LibrarySpec, _metadata: SpecMetadata): LibraryContext {
  const lib = spec.library;
  const features = spec.features || {};
  const database = features.database || {};
  const messaging = features.messaging || {};
  const service = spec.service || {};

  const isFeature = !!spec.featureLibrary;
  const featureConf = spec.featureLibrary;

  const { domain, suffix } = parseLibraryName(lib.name);
  const domainPascal = toPascalCase(domain);
  const domainSnake = toSnakeCase(domain);

  const libraryPascal = toPascalCase(lib.name);
  const libraryCamel = toCamelCase(lib.name);
  const librarySnake = toSnakeCase(lib.name);

  // For feature libraries, package includes both core domain and feature
  // e.g. compliance.risk → compliance/risk
  let domainPackage: string;
  let packageName: string;
  if (isFeature && featureConf) {
    domainPackage = featureConf.coreDomain;
    packageName = featureConf.coreDomain + '.' + featureConf.featureName.replace(/-/g, '');
  } else {
    domainPackage = domain;
    packageName = suffix === 'core' ? domain : lib.name.replace(/-/g, '');
  }
  const packagePath = packageName.replace(/\./g, '/');

  const version = lib.version || '0.1.0';
  const group = lib.group || 'com.example';

  const dbName = database.name || `gap_${domainSnake}_db`;
  const dbPort = database.port || 5433;
  const dbReadPort = hashToReadPort(domainPascal);

  // Feature library fields
  const coreDomain = isFeature && featureConf ? featureConf.coreDomain : domainPackage;
  const featureName = featureConf?.featureName ?? '';
  const featureNamePascal = featureName ? toPascalCase(featureName) : '';
  const featureNameKebab = featureName ? toKebabCase(featureName) : '';
  const coreLibraryName = isFeature ? `gap-${coreDomain}-core` : '';
  const coreLibraryGroup = isFeature ? group : '';

  return {
    LibraryName: lib.name,
    LibraryNamePascal: libraryPascal,
    LibraryNameCamel: libraryCamel,
    LibraryNameSnake: librarySnake,
    LibraryNameKebab: toKebabCase(lib.name),
    PackageName: packageName,
    PackagePath: packagePath,
    DomainPackage: domainPackage,
    DomainNamePascal: toPascalCase(domainPackage),
    BoundedContextLower: toCamelCase(domainPackage),
    BoundedContextKebab: toKebabCase(domainPackage),
    Description: lib.description,
    Version: version,
    Group: group,
    DatabaseEnabled: database.enabled ?? true,
    DatabaseType: database.type || 'postgresql',
    DatabaseName: dbName,
    DatabasePort: dbPort,
    DatabaseReadPort: dbReadPort,
    SchemaName: domainPackage,
    KafkaEnabled: messaging.enabled ?? false,
    ActuatorEnabled: true,
    ServerPort: service.port || 8080,
    PropertyPrefix: `gap.${domainPackage}`,
    IsFeatureLibrary: isFeature,
    CoreLibraryName: coreLibraryName,
    CoreLibraryGroup: coreLibraryGroup,
    CoreDomain: coreDomain,
    FeatureName: featureName,
    FeatureNamePascal: featureNamePascal,
    FeatureNameKebab: featureNameKebab,
  };
}

const helpers: Bundle['helpers'] = {
  /** {{add a b}} — numeric addition for use in templates */
  add: (a: unknown, b: unknown) => Number(a) + Number(b),
};

export const bundle: Bundle = {
  kind: 'spring-library',
  specSchema: schema as Bundle['specSchema'],
  enrich: enrich as unknown as (spec: Record<string, unknown>, metadata: SpecMetadata) => Context,
  templates: 'templates',
  helpers,
};

export default bundle;