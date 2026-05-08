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

export interface RawDomainSpec {
  boundedContext: string;
  service: { port?: number; package: string };
  aggregates: Record<string, RawAggregateSpec>;
  remote_aggregates?: Record<string, unknown>;
}

export function parseSpec(raw: Record<string, unknown>): RawDomainSpec {
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
  return raw as unknown as RawDomainSpec;
}
