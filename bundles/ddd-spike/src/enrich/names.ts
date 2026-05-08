import type { NameVariants } from '../context.js';

/**
 * Split a PascalCase or camelCase string into words.
 * Handles acronyms: "HTMLParser" → ["HTML", "Parser"]
 */
function splitWords(name: string): string[] {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean);
}

function toPascal(words: string[]): string {
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toCamel(words: string[]): string {
  const pascal = toPascal(words);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnake(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join('_');
}

function toKebab(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join('-');
}

function toUpper(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join('_');
}

/** Naive English pluralisation — covers common cases */
function pluralize(word: string): string {
  if (
    word.endsWith('s') ||
    word.endsWith('x') ||
    word.endsWith('z') ||
    word.endsWith('sh') ||
    word.endsWith('ch')
  ) {
    return word + 'es';
  }
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + 'ies';
  }
  return word + 's';
}

export function toNameVariants(name: string): NameVariants {
  const words = splitWords(name);
  const pascal = toPascal(words);
  const camel = toCamel(words);
  const snake = toSnake(words);

  const kebab = toKebab(words);

  return {
    pascal,
    camel,
    snake,
    kebab,
    upper: toUpper(words),
    plural: pluralize(pascal),
    camelPlural: pluralize(camel),
    snakePlural: pluralize(snake),
    kebabPlural: pluralize(kebab),
  };
}
