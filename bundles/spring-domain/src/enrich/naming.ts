import pluralizeLib from 'pluralize';

export interface NamingVariants {
  original: string;
  pascal: string;
  camel: string;
  snake: string;
  kebab: string;
  plural: string;
  pluralPascal: string;
  pluralCamel: string;
  pluralSnake: string;
  pluralKebab: string;
}

export function toPascalCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[\s_-]+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function toCamelCase(str: string): string {
  const p = toPascalCase(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function generateVariants(name: string, pluralOverride?: string): NamingVariants {
  const plural = pluralOverride ?? pluralizeLib(toCamelCase(name));
  const pluralPascal = toPascalCase(plural);

  return {
    original: name,
    pascal: toPascalCase(name),
    camel: toCamelCase(name),
    snake: toSnakeCase(name),
    kebab: toKebabCase(name),
    plural,
    pluralPascal,
    pluralCamel: toCamelCase(plural),
    pluralSnake: toSnakeCase(plural),
    pluralKebab: toKebabCase(plural),
  };
}
