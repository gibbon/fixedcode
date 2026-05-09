export interface NamingVariants {
  original: string;
  pascal: string;
  camel: string;
  snake: string;
  kebab: string;
  upperSnake: string;
}

export function toPascalCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[\s_/-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
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
    .replace(/[\s/-]+/g, '_')
    .toLowerCase();
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/]+/g, '-')
    .toLowerCase();
}

export function toUpperSnakeCase(str: string): string {
  return toSnakeCase(str).toUpperCase();
}

export function generateVariants(name: string): NamingVariants {
  return {
    original: name,
    pascal: toPascalCase(name),
    camel: toCamelCase(name),
    snake: toSnakeCase(name),
    kebab: toKebabCase(name),
    upperSnake: toUpperSnakeCase(name),
  };
}

/**
 * Convert a route path like "/", "/about", "/users/$id" into a filename-safe stem.
 * "/" → "index", "/about" → "about", "/users/$id" → "users.$id"
 */
export function routePathToFile(path: string): string {
  if (path === '/' || path === '') return 'index';
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed.replace(/\//g, '.');
}
