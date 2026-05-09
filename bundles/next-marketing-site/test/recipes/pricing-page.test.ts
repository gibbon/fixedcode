import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles, helpers } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');

const minimalSpec = () => ({
  appName: 'demo-site',
  brand: { name: 'Demo', tagline: 'Demo tagline.' },
});

const sampleTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    audience: 'Solo dev',
    description: 'For tinkering.',
    features: [
      { text: 'Local CLI', included: true },
      { text: 'Team registry', included: false },
    ],
    ctaText: 'Get started',
    ctaHref: '/signup',
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    audience: 'Engineering team',
    description: 'Shared schemas.',
    features: [{ text: 'Shared registry', included: true }],
    ctaText: 'Start trial',
    ctaHref: '/trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    audience: 'Regulated industry',
    description: 'Audit logs.',
    features: [{ text: 'SSO' }],
    ctaHref: '/contact',
  },
];

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hbs = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) {
    hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
  const src = readFileSync(join(TEMPLATE_DIR, templatePath), 'utf-8');
  return hbs.compile(src, { noEscape: true })(ctx);
}

describe('next-marketing-site pricing-page recipe', () => {
  it('does not generate any pricing files when recipe is disabled', () => {
    const ctx = enrich(minimalSpec(), meta);
    expect(ctx.recipePricingPage).toBe(false);
    expect(ctx.pricing.enabled).toBe(false);
    expect(ctx.recipes).toEqual([]);
    const outputs = generateFiles(ctx).map((f) => f.output);
    expect(outputs).not.toContain('app/pricing/page.tsx');
    // And the nav was NOT auto-augmented with /pricing
    expect(ctx.navLinks.find((l) => l.href === '/pricing')).toBeUndefined();
  });

  it('emits app/pricing/page.tsx and flows tier data through when enabled with 3 tiers', () => {
    const ctx = enrich(
      {
        ...minimalSpec(),
        recipes: ['pricing-page'],
        pricing: {
          headline: 'Plans for every team',
          subhead: 'Pay as you scale.',
          tiers: sampleTiers,
        },
      },
      meta,
    );

    expect(ctx.recipePricingPage).toBe(true);
    expect(ctx.pricing.enabled).toBe(true);
    expect(ctx.pricing.headline).toBe('Plans for every team');
    expect(ctx.pricing.tiers).toHaveLength(3);
    expect(ctx.pricing.tiers.map((t) => t.slug)).toEqual(['free', 'team', 'enterprise']);

    // Auto-added /pricing nav link (since none was present)
    const pricingLink = ctx.navLinks.find((l) => l.href === '/pricing');
    expect(pricingLink).toBeDefined();
    expect(pricingLink?.label).toBe('Pricing');
    expect(ctx.hasNavLinks).toBe(true);

    // Per-tier defaults applied
    const enterprise = ctx.pricing.tiers[2];
    expect(enterprise.ctaText).toBe('Get started'); // default fallback
    expect(enterprise.period).toBe('');
    expect(enterprise.highlight).toBe(false);

    const files = generateFiles(ctx);
    const pricingFile = files.find((f) => f.output === 'app/pricing/page.tsx');
    expect(pricingFile).toBeDefined();
    expect(pricingFile?.overwrite).toBe(false);

    // Tier data flows through to the rendered page
    const rendered = renderTemplate(
      'recipes/pricing-page/app/pricing/page.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('"Plans for every team"');
    expect(rendered).toContain('"Pay as you scale."');
    expect(rendered).toContain('"Free"');
    expect(rendered).toContain('"$0"');
    expect(rendered).toContain('"/forever"');
    expect(rendered).toContain('"Local CLI"');
    expect(rendered).toContain('"Team"');
    expect(rendered).toContain('"$99"');
    expect(rendered).toContain('"Enterprise"');
    expect(rendered).toContain('"Custom"');
    // No leftover handlebars markers
    expect(rendered).not.toMatch(/{{/);
    expect(rendered).not.toMatch(/}}/);
  });

  it('renders highlight markup only for the highlighted tier', () => {
    const ctx = enrich(
      {
        ...minimalSpec(),
        recipes: ['pricing-page'],
        pricing: { tiers: sampleTiers },
      },
      meta,
    );

    const rendered = renderTemplate(
      'recipes/pricing-page/app/pricing/page.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );

    const trueCount = (rendered.match(/highlight: true/g) ?? []).length;
    const falseCount = (rendered.match(/highlight: false/g) ?? []).length;
    expect(trueCount).toBe(1);
    expect(falseCount).toBe(2);

    expect(rendered).toContain('Most popular');
    expect(rendered).toContain('tier.highlight');
  });

  it('does not duplicate the /pricing nav link when one already exists', () => {
    const ctx = enrich(
      {
        ...minimalSpec(),
        recipes: ['pricing-page'],
        navLinks: [{ label: 'Plans', href: '/pricing' }],
        pricing: { tiers: sampleTiers },
      },
      meta,
    );
    const pricingLinks = ctx.navLinks.filter((l) => l.href === '/pricing');
    expect(pricingLinks).toHaveLength(1);
    expect(pricingLinks[0].label).toBe('Plans'); // user's label preserved
  });

  it('treats unknown recipe names as no-ops', () => {
    const ctx = enrich(
      {
        ...minimalSpec(),
        recipes: ['nope-not-real', 'pricing-page'] as string[],
      },
      meta,
    );
    expect(ctx.recipes).toEqual(['pricing-page']);
    expect(ctx.recipePricingPage).toBe(true);
  });
});
