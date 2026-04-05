# Shared Utilities Design

**Purpose:** Define reusable utilities that bundles can compose (no inheritance)

---

## Package Structure

```
packages/
├── naming/              # @fixedcode/naming
├── types/               # @fixedcode/types  
├── conventions/         # @fixedcode/conventions
└── engine/              # @fixedcode/engine (already exists)
```

---

## @fixedcode/naming

**Purpose:** Naming convention utilities

```typescript
// packages/naming/src/index.ts

export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toUpperCase() : word.toUpperCase()
    )
    .replace(/[\s_-]+/g, '');
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[\s-]+/g, '_');
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/[\s_]+/g, '-');
}

export function pluralize(word: string, override?: string): string {
  if (override) return override;
  
  // Use pluralize library
  const pluralizeLib = require('pluralize');
  return pluralizeLib(word);
}

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

export function generateNamingVariants(
  name: string,
  pluralOverride?: string
): NamingVariants {
  const plural = pluralize(name, pluralOverride);
  
  return {
    original: name,
    pascal: toPascalCase(name),
    camel: toCamelCase(name),
    snake: toSnakeCase(name),
    kebab: toKebabCase(name),
    plural,
    pluralPascal: toPascalCase(plural),
    pluralCamel: toCamelCase(plural),
    pluralSnake: toSnakeCase(plural),
    pluralKebab: toKebabCase(plural),
  };
}
```

**Usage in bundle:**
```typescript
import { generateNamingVariants } from '@fixedcode/naming';

const names = generateNamingVariants('Order', spec.plural);
// { pascal: 'Order', camel: 'order', pluralKebab: 'orders', ... }
```

---

## @fixedcode/types

**Purpose:** Common type mappings and utilities

```typescript
// packages/types/src/index.ts

export interface TypeMapping {
  [specType: string]: string;
}

// Common primitive mappings
export const PRIMITIVE_TYPES: TypeMapping = {
  uuid: 'UUID',
  string: 'String',
  int: 'Integer',
  long: 'Long',
  boolean: 'Boolean',
  decimal: 'BigDecimal',
  date: 'LocalDate',
  datetime: 'LocalDateTime',
  object: 'Object',
};

// Semantic type mappings
export const SEMANTIC_TYPES: TypeMapping = {
  email: 'String',
  phone: 'String',
  url: 'String',
};

export interface TypeResolver {
  resolve(specType: string): string;
  isReference(specType: string): boolean;
  getReferenceType(specType: string): string | null;
}

export function createTypeResolver(
  customMappings: TypeMapping = {}
): TypeResolver {
  const allMappings = {
    ...PRIMITIVE_TYPES,
    ...SEMANTIC_TYPES,
    ...customMappings,
  };
  
  return {
    resolve(specType: string): string {
      // Check for reference type (ref:Customer)
      if (specType.startsWith('ref:')) {
        return specType.substring(4);
      }
      
      return allMappings[specType] || 'Object';
    },
    
    isReference(specType: string): boolean {
      return specType.startsWith('ref:');
    },
    
    getReferenceType(specType: string): string | null {
      return this.isReference(specType) ? specType.substring(4) : null;
    },
  };
}

// Validation mapping
export interface ValidationRule {
  annotation: string;
  imports: string[];
}

export const VALIDATION_RULES: Record<string, ValidationRule> = {
  email: {
    annotation: '@field:Email',
    imports: ['jakarta.validation.constraints.Email'],
  },
  phone: {
    annotation: '@field:Pattern(regexp = "^\\\\+?[1-9]\\\\d{1,14}$")',
    imports: ['jakarta.validation.constraints.Pattern'],
  },
  url: {
    annotation: '@field:URL',
    imports: ['jakarta.validation.constraints.URL'],
  },
};

export function getValidationRule(specType: string): ValidationRule | null {
  return VALIDATION_RULES[specType] || null;
}
```

**Usage in bundle:**
```typescript
import { createTypeResolver, getValidationRule } from '@fixedcode/types';

const typeResolver = createTypeResolver({
  // Bundle-specific mappings
  timestamp: 'Instant',
});

const javaType = typeResolver.resolve('email'); // 'String'
const validation = getValidationRule('email'); // { annotation: '@field:Email', ... }
```

---

## @fixedcode/conventions

**Purpose:** Convention engine utilities (not base classes)

```typescript
// packages/conventions/src/index.ts

export type OperationPattern = 
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Archive'
  | 'Get'
  | 'Search'
  | 'FindBy'
  | 'Custom';

export function detectPattern(operationName: string): OperationPattern {
  if (operationName.startsWith('Create')) return 'Create';
  if (operationName.startsWith('Update')) return 'Update';
  if (operationName.startsWith('Delete')) return 'Delete';
  if (operationName.startsWith('Archive')) return 'Archive';
  if (operationName.startsWith('Get')) return 'Get';
  if (operationName.startsWith('Search') || operationName.startsWith('List')) return 'Search';
  if (operationName.includes('By')) return 'FindBy';
  return 'Custom';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const HTTP_METHOD_MAP: Record<OperationPattern, HttpMethod> = {
  Create: 'POST',
  Update: 'PUT',
  Delete: 'DELETE',
  Archive: 'PUT',
  Get: 'GET',
  Search: 'GET',
  FindBy: 'GET',
  Custom: 'POST',
};

export const STATUS_CODE_MAP: Record<OperationPattern, number> = {
  Create: 201,
  Update: 200,
  Delete: 204,
  Archive: 200,
  Get: 200,
  Search: 200,
  FindBy: 200,
  Custom: 200,
};

export type AuthAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';

export const AUTH_ACTION_MAP: Record<OperationPattern, AuthAction> = {
  Create: 'CREATE',
  Update: 'UPDATE',
  Delete: 'DELETE',
  Archive: 'UPDATE',
  Get: 'READ',
  Search: 'READ',
  FindBy: 'READ',
  Custom: 'EXECUTE',
};

export interface ConventionConfig {
  httpPathPrefix?: string;
  authorizationEnabled?: boolean;
  [key: string]: any;
}

export function getHttpMethod(
  pattern: OperationPattern,
  override?: HttpMethod
): HttpMethod {
  return override || HTTP_METHOD_MAP[pattern];
}

export function getStatusCode(
  pattern: OperationPattern,
  override?: number
): number {
  return override || STATUS_CODE_MAP[pattern];
}

export function getAuthAction(
  pattern: OperationPattern
): AuthAction {
  return AUTH_ACTION_MAP[pattern];
}

// Path building utility
export function buildPath(
  pattern: OperationPattern,
  resourcePlural: string,
  hasIdParam: boolean,
  config: ConventionConfig = {}
): string {
  const prefix = config.httpPathPrefix || '';
  const base = `${prefix}/${resourcePlural}`;
  
  if (pattern === 'Create' || pattern === 'Search') {
    return base;
  }
  
  if (hasIdParam) {
    if (pattern === 'Archive') {
      return `${base}/{id}/archive`;
    }
    return `${base}/{id}`;
  }
  
  return base;
}
```

**Usage in bundle:**
```typescript
import { 
  detectPattern, 
  getHttpMethod, 
  getStatusCode,
  buildPath 
} from '@fixedcode/conventions';

const pattern = detectPattern('CreateOrder'); // 'Create'
const method = getHttpMethod(pattern); // 'POST'
const status = getStatusCode(pattern); // 201
const path = buildPath(pattern, 'orders', false); // '/orders'
```

---

## Bundle Usage Example

```typescript
// bundles/ddd-complex/src/enrich/commands.ts

import { generateNamingVariants } from '@fixedcode/naming';
import { createTypeResolver } from '@fixedcode/types';
import { 
  detectPattern, 
  getHttpMethod, 
  getStatusCode,
  buildPath 
} from '@fixedcode/conventions';

export function enrichCommand(
  cmd: RawCommand,
  aggregate: AggregateContext,
  config: ConventionConfig
): CommandContext {
  // Use shared utilities via composition
  const names = generateNamingVariants(cmd.name);
  const typeResolver = createTypeResolver();
  
  // Detect pattern (or use override)
  const pattern = cmd.commandType 
    ? cmd.commandType 
    : detectPattern(cmd.name);
  
  // Derive HTTP metadata
  const hasIdParam = cmd.params.some(p => p.identity);
  const http = {
    method: getHttpMethod(pattern, cmd.http?.method),
    path: cmd.http?.path || buildPath(
      pattern, 
      aggregate.names.pluralKebab, 
      hasIdParam,
      config
    ),
    statusCode: getStatusCode(pattern, cmd.http?.statusCode),
  };
  
  return {
    name: cmd.name,
    names,
    http,
    // ... rest of enrichment
  };
}
```

---

## Benefits of This Approach

1. **No inheritance** - bundles compose utilities, don't extend base classes
2. **Reusable** - utilities work across all bundle types
3. **Testable** - each utility is independently testable
4. **Flexible** - bundles can use some, all, or none of the utilities
5. **Extensible** - bundles can add their own utilities

---

## Testing Strategy

Each utility package has comprehensive tests:

```typescript
// packages/naming/test/naming.test.ts
describe('generateNamingVariants', () => {
  it('generates all variants for Order', () => {
    const variants = generateNamingVariants('Order');
    expect(variants.pascal).toBe('Order');
    expect(variants.camel).toBe('order');
    expect(variants.pluralKebab).toBe('orders');
  });
  
  it('handles plural override', () => {
    const variants = generateNamingVariants('Person', 'people');
    expect(variants.plural).toBe('people');
    expect(variants.pluralKebab).toBe('people');
  });
});
```

---

## Next Steps

1. Create `packages/naming` with tests
2. Create `packages/types` with tests
3. Create `packages/conventions` with tests
4. Update bundles to use shared utilities
5. Document usage in bundle authoring guide
