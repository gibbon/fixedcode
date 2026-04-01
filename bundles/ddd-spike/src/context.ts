/** The top-level context passed to all templates */
export interface DddContext {
  package: string;
  aggregates: AggregateContext[];
}

/** All naming variants for a concept — pre-computed, never derived in templates */
export interface NameVariants {
  pascal: string;      // OrderItem
  camel: string;       // orderItem
  snake: string;       // order_item
  kebab: string;       // order-item
  upper: string;       // ORDER_ITEM
  plural: string;      // OrderItems (pascal plural)
  camelPlural: string; // orderItems
  snakePlural: string; // order_items
  kebabPlural: string; // order-items
}

/** Mapped type information — spec type resolved to target language types */
export interface TypeMapping {
  spec: string;        // uuid, string, decimal, etc.
  kotlin: string;       // UUID, String, BigDecimal
  sql: string;          // UUID, VARCHAR(255), DECIMAL(19,2)
  nullable: boolean;    // whether this field is optional
  kotlinDecl: string;   // "UUID" or "String?" (includes ? for nullable)
  needsImport?: string; // e.g. "java.util.UUID", "java.math.BigDecimal"
}

export interface AttributeContext {
  names: NameVariants;
  type: TypeMapping;
  required: boolean;
  identity: boolean;
  default?: string;
  hasDefault: boolean;
  /** Pre-computed Kotlin default expression, e.g. `= "CREATED"` or empty */
  kotlinDefault: string;
  /** Pre-computed column definition for SQL DDL */
  sqlColumn: string;
}

export interface CommandContext {
  names: NameVariants;
  /** Params excluding the aggregate identity (already known) */
  params: ParamContext[];
  event: EventContext;
  /** Pre-computed: "POST" for create, "PUT" for update */
  httpMethod: string;
  /** Pre-computed: "" for create, "/{orderId}/status" for update */
  httpPath: string;
  /** Is this a create command (generates new aggregate)? */
  isCreate: boolean;
}

export interface ParamContext {
  names: NameVariants;
  type: TypeMapping;
  required: boolean;
}

export interface QueryContext {
  names: NameVariants;
  /** "single" or "list" */
  returns: string;
  isList: boolean;
  /** Pre-computed HTTP path */
  httpPath: string;
  filters: FilterContext[];
}

export interface FilterContext {
  names: NameVariants;
  type: TypeMapping;
}

export interface EventContext {
  names: NameVariants;
  fields: EventFieldContext[];
}

export interface EventFieldContext {
  names: NameVariants;
  type: TypeMapping;
}

export interface AggregateContext {
  names: NameVariants;
  identity: AttributeContext;
  attributes: AttributeContext[];
  /** All attributes including identity — for DDL generation */
  allAttributes: AttributeContext[];
  commands: CommandContext[];
  queries: QueryContext[];
  events: EventContext[];
  /** Pre-computed: unique list of Kotlin imports needed */
  imports: string[];
  /** Pre-computed: SQL table name (snake_case plural) */
  tableName: string;
  /** Pre-computed: REST endpoint path */
  endpoint: string;
  hasCommands: boolean;
  hasQueries: boolean;
}