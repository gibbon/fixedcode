export interface RawAggregateSpec {
  plural?: string;
  attributes?: Record<string, string>;
  commands?: RawCommandSpec[];
  queries?: RawQuerySpec[];
  events?: Record<string, { fields: string[] }>;
  enumDefaults?: Record<string, string[]>;
  entities?: Record<string, RawEntitySpec>;
}

export interface RawCommandSpec {
  name: string;
  body?: string[];
  path?: string[];
  query?: string[];
  emits?: string;
  returns?: string;
}

export interface RawQuerySpec {
  name: string;
  path?: string[];
  query?: string[];
  returns: string;
}

export type RawEntitySpec = RawAggregateSpec;

export type RecipeName = 'transactional-outbox';
export const KNOWN_RECIPES: readonly RecipeName[] = ['transactional-outbox'] as const;

export interface RawOutboxConfig {
  pollIntervalMs?: number;
  batchSize?: number;
  maxAttempts?: number;
}

export interface NormalizedOutboxConfig {
  pollIntervalMs: number;
  batchSize: number;
  maxAttempts: number;
}

export interface RawDomainSpec {
  boundedContext: string;
  service: { port?: number; package: string };
  aggregates: Record<string, RawAggregateSpec>;
  remote_aggregates?: Record<string, unknown>;
  recipes?: string[];
  outbox?: RawOutboxConfig;
}

export interface ParsedDomainSpec extends RawDomainSpec {
  recipes: RecipeName[];
  outbox: NormalizedOutboxConfig;
}

export function parseSpec(raw: Record<string, unknown>): ParsedDomainSpec {
  if (!raw.boundedContext || typeof raw.boundedContext !== 'string') {
    throw new Error('spec.boundedContext is required and must be a string');
  }
  if (!raw.service || typeof raw.service !== 'object') {
    throw new Error('spec.service is required');
  }
  const service = raw.service as Record<string, unknown>;
  if (!service.package || typeof service.package !== 'string') {
    throw new Error('spec.service.package is required and must be a string');
  }
  if (!raw.aggregates || typeof raw.aggregates !== 'object') {
    throw new Error('spec.aggregates is required');
  }
  const r = raw as unknown as RawDomainSpec;
  const recipes: RecipeName[] = Array.isArray(r.recipes)
    ? r.recipes.filter((x): x is RecipeName => (KNOWN_RECIPES as readonly string[]).includes(x))
    : [];
  return {
    ...r,
    recipes,
    outbox: {
      pollIntervalMs: r.outbox?.pollIntervalMs ?? 5000,
      batchSize: r.outbox?.batchSize ?? 100,
      maxAttempts: r.outbox?.maxAttempts ?? 10,
    },
  };
}
