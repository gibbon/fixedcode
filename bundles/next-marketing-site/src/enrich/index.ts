import { parseSpec, type NormalizedSpec, type AnalyticsKind } from './spec.js';
import { escapeHtml, generateVariants, toPascalCase, type NamingVariants } from './naming.js';

export interface EnrichedNavLink {
  label: string;
  labelEscaped: string;
  href: string;
}

export interface EnrichedPage {
  slug: string;
  title: string;
  titleEscaped: string;
  description: string;
  componentName: string;
}

export interface EnrichedBrand {
  name: string;
  nameEscaped: string;
  tagline: string;
  taglineEscaped: string;
  primaryColor: string;
}

export interface EnrichedHero {
  headline: string;
  headlineEscaped: string;
  subhead: string;
  subheadEscaped: string;
  ctaText: string;
  ctaTextEscaped: string;
  ctaHref: string;
}

export interface EnrichedSocialLinks {
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  email: string | null;
  hasAny: boolean;
}

export interface NextMarketingSiteContext {
  appName: NamingVariants;
  brand: EnrichedBrand;
  hero: EnrichedHero;
  navLinks: EnrichedNavLink[];
  hasNavLinks: boolean;
  pages: EnrichedPage[];
  hasPages: boolean;
  socialLinks: EnrichedSocialLinks;
  recipes: string[];
  hasDocker: boolean;
  analytics: AnalyticsKind;
  hasAnalytics: boolean;
  hasPlausible: boolean;
  hasUmami: boolean;
  analyticsDomain: string;
  analyticsScriptUrl: string;
  /** Year shipped in the generator's static output. Resolved at runtime in the
   *  Footer component (via `new Date().getFullYear()`) so generation stays
   *  deterministic; this field is just here for docs/tests. */
  buildYear: number;
  /** npm dependencies merged into package.json */
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  [key: string]: unknown;
}

const BASE_DEPS: Record<string, string> = {
  next: '14.2.35',
  react: '^18.3.1',
  'react-dom': '^18.3.1',
};

const BASE_DEV_DEPS: Record<string, string> = {
  '@types/node': '^22.0.0',
  '@types/react': '^18.3.12',
  '@types/react-dom': '^18.3.1',
  typescript: '^5.7.2',
  tailwindcss: '^4.0.0',
  '@tailwindcss/postcss': '^4.0.0',
  postcss: '^8.4.49',
};

function resolveAnalyticsScriptUrl(kind: AnalyticsKind, override: string): string {
  if (override) return override;
  if (kind === 'plausible') return 'https://plausible.io/js/script.js';
  return '';
}

export function enrich(
  raw: Record<string, unknown>,
  _metadata: { name: string; apiVersion: string; description?: string },
): NextMarketingSiteContext {
  const spec: NormalizedSpec = parseSpec(raw);
  const appName = generateVariants(spec.appName);

  const navLinks: EnrichedNavLink[] = spec.navLinks.map((l) => ({
    label: l.label,
    labelEscaped: escapeHtml(l.label),
    href: l.href,
  }));

  const pages: EnrichedPage[] = spec.pages.map((p) => ({
    slug: p.slug,
    title: p.title,
    titleEscaped: escapeHtml(p.title),
    description: p.description ?? `${p.title} — ${spec.brand.name}`,
    componentName: `${toPascalCase(p.slug)}Page`,
  }));

  const social = spec.socialLinks;
  const hasAnySocial = Boolean(social.github || social.twitter || social.linkedin || social.email);

  const dependencies: Record<string, string> = { ...BASE_DEPS };
  const devDependencies: Record<string, string> = { ...BASE_DEV_DEPS };

  return {
    appName,
    brand: {
      name: spec.brand.name,
      nameEscaped: escapeHtml(spec.brand.name),
      tagline: spec.brand.tagline,
      taglineEscaped: escapeHtml(spec.brand.tagline),
      primaryColor: spec.brand.primaryColor,
    },
    hero: {
      headline: spec.hero.headline,
      headlineEscaped: escapeHtml(spec.hero.headline),
      subhead: spec.hero.subhead,
      subheadEscaped: escapeHtml(spec.hero.subhead),
      ctaText: spec.hero.ctaText,
      ctaTextEscaped: escapeHtml(spec.hero.ctaText),
      ctaHref: spec.hero.ctaHref,
    },
    navLinks,
    hasNavLinks: navLinks.length > 0,
    pages,
    hasPages: pages.length > 0,
    socialLinks: {
      github: social.github,
      twitter: social.twitter,
      linkedin: social.linkedin,
      email: social.email,
      hasAny: hasAnySocial,
    },
    recipes: spec.recipes,
    hasDocker: spec.features.docker,
    analytics: spec.features.analytics,
    hasAnalytics: spec.features.analytics !== 'none',
    hasPlausible: spec.features.analytics === 'plausible',
    hasUmami: spec.features.analytics === 'umami',
    analyticsDomain: spec.features.analyticsDomain,
    analyticsScriptUrl: resolveAnalyticsScriptUrl(
      spec.features.analytics,
      spec.features.analyticsScriptUrl,
    ),
    buildYear: new Date().getUTCFullYear(),
    dependencies,
    devDependencies,
  };
}
