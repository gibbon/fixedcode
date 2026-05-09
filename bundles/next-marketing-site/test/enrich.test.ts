import { describe, it, expect } from 'vitest';
import { enrich } from '../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const minimalSpec = () => ({
  appName: 'demo-site',
  brand: { name: 'Demo', tagline: 'Demo tagline.' },
});

describe('next-marketing-site enrich', () => {
  it('applies sensible defaults', () => {
    const ctx = enrich(minimalSpec(), meta);
    expect(ctx.appName.kebab).toBe('demo-site');
    expect(ctx.appName.pascal).toBe('DemoSite');
    expect(ctx.brand.name).toBe('Demo');
    expect(ctx.brand.primaryColor).toBe('#0a0a0a');
    expect(ctx.hero.headline).toBeTruthy();
    expect(ctx.hero.ctaText).toBe('Get started');
    expect(ctx.navLinks).toEqual([]);
    expect(ctx.hasNavLinks).toBe(false);
    expect(ctx.pages).toEqual([]);
    expect(ctx.hasPages).toBe(false);
    expect(ctx.socialLinks.hasAny).toBe(false);
    expect(ctx.hasDocker).toBe(false);
    expect(ctx.hasAnalytics).toBe(false);
    expect(ctx.dependencies['next']).toBeDefined();
    expect(ctx.dependencies['react']).toBe('^18.3.1');
    expect(ctx.devDependencies['tailwindcss']).toBe('^4.0.0');
    expect(ctx.devDependencies['@tailwindcss/postcss']).toBe('^4.0.0');
  });

  it('escapes HTML-significant characters in brand and hero strings', () => {
    const ctx = enrich(
      {
        appName: 'risky-site',
        brand: {
          name: 'Acme & Sons',
          tagline: 'We <love> "you".',
        },
        hero: {
          headline: 'Hello "world"',
          subhead: 'A & B',
          ctaText: '<go>',
          ctaHref: '/start',
        },
      },
      meta,
    );
    expect(ctx.brand.nameEscaped).toBe('Acme &amp; Sons');
    expect(ctx.brand.taglineEscaped).toBe('We &lt;love&gt; &quot;you&quot;.');
    expect(ctx.hero.headlineEscaped).toBe('Hello &quot;world&quot;');
    expect(ctx.hero.subheadEscaped).toBe('A &amp; B');
    expect(ctx.hero.ctaTextEscaped).toBe('&lt;go&gt;');
  });

  it('expands additional pages with PascalCase component names', () => {
    const ctx = enrich(
      {
        ...minimalSpec(),
        pages: [
          { slug: 'about', title: 'About Us' },
          { slug: 'contact', title: 'Contact' },
          { slug: 'pricing-plans', title: 'Pricing' },
        ],
      },
      meta,
    );
    expect(ctx.pages).toHaveLength(3);
    expect(ctx.pages[0].componentName).toBe('AboutPage');
    expect(ctx.pages[2].slug).toBe('pricing-plans');
    expect(ctx.pages[2].componentName).toBe('PricingPlansPage');
    expect(ctx.pages[1].description).toBe('Contact — Demo');
  });

  it('flags analytics + docker when requested', () => {
    const ctx = enrich(
      {
        ...minimalSpec(),
        features: { docker: true, analytics: 'plausible', analyticsDomain: 'demo.com' },
      },
      meta,
    );
    expect(ctx.hasDocker).toBe(true);
    expect(ctx.hasAnalytics).toBe(true);
    expect(ctx.hasPlausible).toBe(true);
    expect(ctx.hasUmami).toBe(false);
    expect(ctx.analyticsDomain).toBe('demo.com');
    expect(ctx.analyticsScriptUrl).toBe('https://plausible.io/js/script.js');
  });

  it('throws if brand is missing', () => {
    expect(() => enrich({ appName: 'no-brand' } as Record<string, unknown>, meta)).toThrow(
      /brand/i,
    );
  });
});
