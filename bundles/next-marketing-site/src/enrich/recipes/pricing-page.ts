import type { NormalizedPricingConfig } from '../spec.js';
import { escapeHtml } from '../naming.js';

export interface PricingFeatureContext {
  text: string;
  textEscaped: string;
  included: boolean;
}

export interface PricingTierContext {
  name: string;
  nameEscaped: string;
  /** kebab-case identifier safe for use as a React key. */
  slug: string;
  price: string;
  priceEscaped: string;
  period: string;
  periodEscaped: string;
  audience: string;
  audienceEscaped: string;
  description: string;
  descriptionEscaped: string;
  features: PricingFeatureContext[];
  hasFeatures: boolean;
  ctaText: string;
  ctaTextEscaped: string;
  ctaHref: string;
  highlight: boolean;
}

export interface PricingPageContext {
  enabled: boolean;
  headline: string;
  headlineEscaped: string;
  subhead: string;
  subheadEscaped: string;
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
    nameEscaped: escapeHtml(t.name),
    slug: slugify(t.name),
    price: t.price,
    priceEscaped: escapeHtml(t.price),
    period: t.period,
    periodEscaped: escapeHtml(t.period),
    audience: t.audience,
    audienceEscaped: escapeHtml(t.audience),
    description: t.description,
    descriptionEscaped: escapeHtml(t.description),
    features: t.features.map((f) => ({
      text: f.text,
      textEscaped: escapeHtml(f.text),
      included: f.included,
    })),
    hasFeatures: t.features.length > 0,
    ctaText: t.ctaText,
    ctaTextEscaped: escapeHtml(t.ctaText),
    ctaHref: t.ctaHref,
    highlight: t.highlight,
  }));
  return {
    enabled,
    headline: config.headline,
    headlineEscaped: escapeHtml(config.headline),
    subhead: config.subhead,
    subheadEscaped: escapeHtml(config.subhead),
    hasSubhead: config.subhead.length > 0,
    tiers,
    hasTiers: tiers.length > 0,
  };
}
