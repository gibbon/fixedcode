import type {
  DashboardStatFormat,
  NormalizedDashboardConfig,
  NormalizedDashboardStat,
} from '../spec.js';

export interface DashboardStatContext {
  name: string;
  /** kebab-case identifier safe for use as a React key. */
  slug: string;
  /** camelCase identifier safe for use as a JS variable. */
  camel: string;
  endpoint: string;
  units: string;
  hasUnits: boolean;
  format: DashboardStatFormat;
}

export interface DashboardContext {
  enabled: boolean;
  title: string;
  stats: DashboardStatContext[];
  hasStats: boolean;
  timeRanges: string[];
  /** First entry in `timeRanges`. Used as the initial selection. */
  defaultTimeRange: string;
  hasTimeRanges: boolean;
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stat'
  );
}

function toCamel(slug: string): string {
  const parts = slug.split('-').filter((s) => s.length > 0);
  if (parts.length === 0) return 'stat';
  return parts
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

export function buildDashboardContext(
  enabled: boolean,
  config: NormalizedDashboardConfig,
): DashboardContext {
  const seenSlugs = new Set<string>();
  const stats: DashboardStatContext[] = config.stats.map((s: NormalizedDashboardStat) => {
    let slug = slugify(s.name);
    // disambiguate duplicates so React keys stay unique
    let suffix = 2;
    let candidate = slug;
    while (seenSlugs.has(candidate)) {
      candidate = `${slug}-${suffix++}`;
    }
    slug = candidate;
    seenSlugs.add(slug);
    return {
      name: s.name,
      slug,
      camel: toCamel(slug),
      endpoint: s.endpoint,
      units: s.units,
      hasUnits: s.units.length > 0,
      format: s.format,
    };
  });
  return {
    enabled,
    title: config.title,
    stats,
    hasStats: stats.length > 0,
    timeRanges: config.timeRanges,
    defaultTimeRange: config.timeRanges[0] ?? '7d',
    hasTimeRanges: config.timeRanges.length > 0,
  };
}
