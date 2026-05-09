import type { NormalizedPricingConfig } from '../spec.js';

export interface PricingFeatureContext {
  text: string;
  included: boolean;
}

export interface PricingTierContext {
  name: string;
  /** kebab-case identifier safe for use as a React key. */
  slug: string;
  price: string;
  period: string;
  audience: string;
  description: string;
  features: PricingFeatureContext[];
  hasFeatures: boolean;
  ctaText: string;
  ctaHref: string;
  highlight: boolean;
}

export interface PricingPageContext {
  enabled: boolean;
  headline: string;
  subhead: string;
  hasSubhead: boolean;
  tiers: PricingTierContext[];
  hasTiers: boolean;
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tier'
  );
}

export function buildPricingPageContext(
  enabled: boolean,
  config: NormalizedPricingConfig,
): PricingPageContext {
  const tiers: PricingTierContext[] = config.tiers.map((t) => ({
    name: t.name,
    slug: slugify(t.name),
    price: t.price,
    period: t.period,
    audience: t.audience,
    description: t.description,
    features: t.features.map((f) => ({ text: f.text, included: f.included })),
    hasFeatures: t.features.length > 0,
    ctaText: t.ctaText,
    ctaHref: t.ctaHref,
    highlight: t.highlight,
  }));
  return {
    enabled,
    headline: config.headline,
    subhead: config.subhead,
    hasSubhead: config.subhead.length > 0,
    tiers,
    hasTiers: tiers.length > 0,
  };
}
