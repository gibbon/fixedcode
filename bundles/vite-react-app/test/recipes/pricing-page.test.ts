import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles, helpers } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');

const PRICING_OUTPUTS = ['src/components/PricingPage.tsx', 'src/routes/pricing.tsx'];

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hbs = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) {
    hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
  const src = readFileSync(join(TEMPLATE_DIR, templatePath), 'utf-8');
  return hbs.compile(src, { noEscape: true })(ctx);
}

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
    features: [{ text: 'SSO', included: true }],
    ctaHref: '/contact',
  },
];

describe('vite-react-app pricing-page recipe', () => {
  it('does not generate any pricing files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipePricingPage).toBe(false);
    expect(ctx.pricing.enabled).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const expected of PRICING_OUTPUTS) {
      expect(outputs).not.toContain(expected);
    }
  });

  it('emits pricing files and flows tier data through when enabled with 3 tiers', () => {
    const ctx = enrich(
      {
        appName: 'paid-app',
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
    expect(ctx.pricing.subhead).toBe('Pay as you scale.');
    expect(ctx.pricing.hasSubhead).toBe(true);
    expect(ctx.pricing.tiers).toHaveLength(3);
    expect(ctx.pricing.tiers.map((t) => t.name)).toEqual(['Free', 'Team', 'Enterprise']);
    expect(ctx.pricing.tiers.map((t) => t.slug)).toEqual(['free', 'team', 'enterprise']);

    // ctaText/ctaHref defaults applied per tier
    const enterprise = ctx.pricing.tiers[2];
    expect(enterprise.ctaText).toBe('Get started'); // default fallback
    expect(enterprise.ctaHref).toBe('/contact');
    expect(enterprise.period).toBe(''); // missing → empty string
    expect(enterprise.highlight).toBe(false);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const expected of PRICING_OUTPUTS) {
      expect(outputs, `missing ${expected}`).toContain(expected);
    }

    // Both files are extension points
    for (const ep of PRICING_OUTPUTS) {
      const f = files.find((x) => x.output === ep);
      expect(f?.overwrite, `${ep} should be overwrite:false`).toBe(false);
    }

    // Tier data flows through to the rendered component
    const rendered = renderTemplate(
      'recipes/pricing-page/src/components/PricingPage.tsx.hbs',
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
        appName: 'paid-app',
        recipes: ['pricing-page'],
        pricing: { tiers: sampleTiers },
      },
      meta,
    );

    const rendered = renderTemplate(
      'recipes/pricing-page/src/components/PricingPage.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );

    // Each tier emits a `highlight: <boolean>` literal in the TIERS array.
    // Exactly one tier has `highlight: true`.
    const trueCount = (rendered.match(/highlight: true/g) ?? []).length;
    const falseCount = (rendered.match(/highlight: false/g) ?? []).length;
    expect(trueCount).toBe(1);
    expect(falseCount).toBe(2);

    // The component branches on tier.highlight to render a "Most popular" badge
    // and a different CTA / card style. The branch source must be present.
    expect(rendered).toContain('Most popular');
    expect(rendered).toContain('tier.highlight');
  });

  it('treats the recipe as enabled with empty tiers and applies headline default', () => {
    const ctx = enrich(
      {
        appName: 'paid-app',
        recipes: ['pricing-page'],
      },
      meta,
    );
    expect(ctx.recipePricingPage).toBe(true);
    expect(ctx.pricing.enabled).toBe(true);
    expect(ctx.pricing.headline).toBe('Pricing'); // default
    expect(ctx.pricing.tiers).toEqual([]);
    expect(ctx.pricing.hasTiers).toBe(false);
    // Files still emit — the page just renders an empty grid.
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const expected of PRICING_OUTPUTS) {
      expect(outputs).toContain(expected);
    }
  });
});
