import pluralize from 'pluralize';

export type OperationPattern =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Archive'
  | 'Add'
  | 'Remove'
  | 'Get'
  | 'Search'
  | 'Find';

export function detectPattern(name: string): OperationPattern {
  if (name.startsWith('Create')) return 'Create';
  if (name.startsWith('Update')) return 'Update';
  if (name.startsWith('Delete')) return 'Delete';
  if (name.startsWith('Archive')) return 'Archive';
  if (name.startsWith('Add')) return 'Add';
  if (name.startsWith('Remove')) return 'Remove';
  if (name.startsWith('Get')) return 'Get';
  if (name.startsWith('Search') || name.startsWith('List')) return 'Search';
  if (name.startsWith('Find')) return 'Find';
  console.warn(`Warning: unrecognized operation pattern '${name}', defaulting to 'Get'`);
  return 'Get';
}

export interface HttpMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  statusCode: number;
}

function toPascal(kebab: string): string {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Extract a kebab-case suffix from a Find* operation name.
 * e.g. "FindOrdersByStatus" with entity "order-references" → "by-status"
 *      "FindOrdersByDateRange" with entity "order" → "by-date-range"
 *
 * Accepts entityPluralKebab in kebab-case (e.g. "order-references") and
 * converts to PascalCase internally before matching against the operation name.
 */
function deriveFindSuffix(operationName: string, entityPluralKebab: string): string {
  // Strip "Find" prefix, then strip the entity name (singular or plural forms)
  let remainder = operationName.slice(4); // remove "Find"

  const entityPluralPascal = toPascal(entityPluralKebab);
  const entitySingularPascal = pluralize.singular(entityPluralPascal);

  if (remainder.startsWith(entityPluralPascal)) {
    remainder = remainder.slice(entityPluralPascal.length);
  } else if (remainder.startsWith(entitySingularPascal)) {
    remainder = remainder.slice(entitySingularPascal.length);
  }

  if (!remainder) return '';

  // Convert PascalCase remainder to kebab-case: "ByStatus" → "by-status"
  return remainder.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function deriveHttp(
  pattern: OperationPattern,
  resourcePlural: string,
  hasIdParam: boolean,
  idParamName?: string,
  pathPrefix = '',
  operationName = '',
): HttpMetadata {
  const base = pathPrefix ? `${pathPrefix}/${resourcePlural}` : `/${resourcePlural}`;
  const withId = `${base}/{${idParamName ?? 'id'}}`;

  switch (pattern) {
    case 'Create':
      return { method: 'POST', path: base, statusCode: 201 };
    case 'Update':
      return { method: 'PUT', path: withId, statusCode: 200 };
    case 'Delete':
      return { method: 'DELETE', path: withId, statusCode: 204 };
    case 'Archive':
      return { method: 'PUT', path: `${withId}/archive`, statusCode: 200 };
    case 'Add':
      return { method: 'POST', path: base, statusCode: 201 };
    case 'Remove':
      return { method: 'DELETE', path: withId, statusCode: 204 };
    case 'Get':
      return { method: 'GET', path: withId, statusCode: 200 };
    case 'Search':
      return { method: 'GET', path: base, statusCode: 200 };
    case 'Find': {
      const suffix = deriveFindSuffix(operationName, resourcePlural);
      const findPath = suffix ? `${base}/${suffix}` : base;
      return { method: 'GET', path: hasIdParam ? withId : findPath, statusCode: 200 };
    }
  }
}

export interface AuthMetadata {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  expression: string;
}

export function deriveAuth(pattern: OperationPattern, resource = ''): AuthMetadata {
  const actionMap: Record<OperationPattern, AuthMetadata['action']> = {
    Create: 'CREATE',
    Update: 'UPDATE',
    Delete: 'DELETE',
    Archive: 'UPDATE',
    Add: 'CREATE',
    Remove: 'DELETE',
    Get: 'READ',
    Search: 'READ',
    Find: 'READ',
  };
  const action = actionMap[pattern];
  return {
    action,
    expression: `hasAuthority('${action}') or hasRole('ADMIN')`,
  };
}

export interface ResponseMetadata {
  type: 'entity' | 'list' | 'paged' | 'void';
  returnType: string;
}

export function deriveResponse(pattern: OperationPattern, entityName: string): ResponseMetadata {
  switch (pattern) {
    case 'Create':
    case 'Update':
    case 'Archive':
    case 'Get':
    case 'Find':
      return { type: 'entity', returnType: entityName };
    case 'Add':
      return { type: 'entity', returnType: entityName };
    case 'Delete':
    case 'Remove':
      return { type: 'void', returnType: 'Unit' };
    case 'Search':
      return { type: 'paged', returnType: `Paged${entityName}List` };
  }
}
