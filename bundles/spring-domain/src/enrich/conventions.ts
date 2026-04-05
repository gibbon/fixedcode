export type OperationPattern = 'Create' | 'Update' | 'Delete' | 'Archive' | 'Add' | 'Remove' | 'Get' | 'Search' | 'Find';

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
  return 'Get'; // fallback
}

export interface HttpMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  statusCode: number;
}

export function deriveHttp(
  pattern: OperationPattern,
  resourcePlural: string,
  hasIdParam: boolean,
  idParamName?: string,
  pathPrefix = ''
): HttpMetadata {
  const base = `${pathPrefix}/${resourcePlural}`;
  const withId = `${base}/{${idParamName ?? 'id'}}`;

  switch (pattern) {
    case 'Create': return { method: 'POST', path: base, statusCode: 201 };
    case 'Update': return { method: 'PUT', path: withId, statusCode: 200 };
    case 'Delete': return { method: 'DELETE', path: withId, statusCode: 204 };
    case 'Archive': return { method: 'PUT', path: `${withId}/archive`, statusCode: 200 };
    case 'Add':    return { method: 'POST', path: base, statusCode: 201 };
    case 'Remove': return { method: 'DELETE', path: withId, statusCode: 204 };
    case 'Get':    return { method: 'GET', path: withId, statusCode: 200 };
    case 'Search': return { method: 'GET', path: base, statusCode: 200 };
    case 'Find':   return { method: 'GET', path: hasIdParam ? withId : base, statusCode: 200 };
  }
}

export interface AuthMetadata {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  expression: string;
}

export function deriveAuth(pattern: OperationPattern, resource = ''): AuthMetadata {
  const actionMap: Record<OperationPattern, AuthMetadata['action']> = {
    Create: 'CREATE', Update: 'UPDATE', Delete: 'DELETE', Archive: 'UPDATE',
    Add: 'CREATE', Remove: 'DELETE', Get: 'READ', Search: 'READ', Find: 'READ',
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
