export type AnalyticsKind = 'none' | 'plausible' | 'umami';

export interface RawNavLink {
  label: string;
  href: string;
}

export interface RawPage {
  slug: string;
  title: string;
  description?: string;
}

export interface RawBrand {
  name: string;
  tagline: string;
  primaryColor?: string;
}

export interface RawHero {
  headline?: string;
  subhead?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface RawSocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
  [key: string]: string | undefined;
}

export interface RawFeatures {
  docker?: boolean;
  analytics?: AnalyticsKind;
  analyticsDomain?: string;
  analyticsScriptUrl?: string;
}

export interface RawNextMarketingSiteSpec {
  appName: string;
  brand: RawBrand;
  hero?: RawHero;
  navLinks?: RawNavLink[];
  pages?: RawPage[];
  socialLinks?: RawSocialLinks;
  recipes?: string[];
  features?: RawFeatures;
}

export interface NormalizedBrand {
  name: string;
  tagline: string;
  primaryColor: string;
}

export interface NormalizedHero {
  headline: string;
  subhead: string;
  ctaText: string;
  ctaHref: string;
}

export interface NormalizedSocialLinks {
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  email: string | null;
}

export interface NormalizedFeatures {
  docker: boolean;
  analytics: AnalyticsKind;
  analyticsDomain: string;
  analyticsScriptUrl: string;
}

export interface NormalizedSpec {
  appName: string;
  brand: NormalizedBrand;
  hero: NormalizedHero;
  navLinks: RawNavLink[];
  pages: RawPage[];
  socialLinks: NormalizedSocialLinks;
  recipes: string[];
  features: NormalizedFeatures;
}

const DEFAULT_HERO: NormalizedHero = {
  headline: 'Build something people want.',
  subhead: 'A clean, fast, no-nonsense landing page.',
  ctaText: 'Get started',
  ctaHref: '#',
};

export function parseSpec(raw: Record<string, unknown>): NormalizedSpec {
  const spec = raw as unknown as RawNextMarketingSiteSpec;
  if (!spec.brand || typeof spec.brand !== 'object') {
    throw new Error('next-marketing-site: spec.brand is required');
  }
  const features = spec.features ?? {};
  const hero = spec.hero ?? {};
  const social = spec.socialLinks ?? {};
  return {
    appName: spec.appName,
    brand: {
      name: spec.brand.name,
      tagline: spec.brand.tagline,
      primaryColor: spec.brand.primaryColor ?? '#0a0a0a',
    },
    hero: {
      headline: hero.headline ?? DEFAULT_HERO.headline,
      subhead: hero.subhead ?? DEFAULT_HERO.subhead,
      ctaText: hero.ctaText ?? DEFAULT_HERO.ctaText,
      ctaHref: hero.ctaHref ?? DEFAULT_HERO.ctaHref,
    },
    navLinks: Array.isArray(spec.navLinks) ? spec.navLinks : [],
    pages: Array.isArray(spec.pages) ? spec.pages : [],
    socialLinks: {
      github: social.github ?? null,
      twitter: social.twitter ?? null,
      linkedin: social.linkedin ?? null,
      email: social.email ?? null,
    },
    recipes: Array.isArray(spec.recipes) ? spec.recipes : [],
    features: {
      docker: features.docker ?? false,
      analytics: features.analytics ?? 'none',
      analyticsDomain: features.analyticsDomain ?? '',
      analyticsScriptUrl: features.analyticsScriptUrl ?? '',
    },
  };
}
