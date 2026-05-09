import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles, helpers } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

const DASHBOARD_OUTPUTS = [
  'src/lib/dashboard.ts',
  'src/components/DashboardLayout.tsx',
  'src/components/StatCard.tsx',
  'src/routes/dashboard.tsx',
];

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hbs = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) {
    hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
  const src = readFileSync(join(TEMPLATE_DIR, templatePath), 'utf-8');
  return hbs.compile(src, { noEscape: true })(ctx);
}

const sampleStats = [
  {
    name: 'Active Users',
    endpoint: '/api/metrics/active-users',
    units: 'users',
    format: 'number' as const,
  },
  { name: 'MRR', endpoint: '/api/metrics/mrr', units: '$', format: 'currency' as const },
  { name: 'Conversion Rate', endpoint: '/api/metrics/conversion', format: 'percent' as const },
];

describe('vite-react-app dashboard recipe', () => {
  it('does not generate any dashboard files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipeDashboard).toBe(false);
    expect(ctx.dashboard.enabled).toBe(false);
    expect(ctx.hasDashboardRecipe).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const expected of DASHBOARD_OUTPUTS) {
      expect(outputs).not.toContain(expected);
    }
  });

  it('emits dashboard files and flows stat data through when enabled with 3 stats', () => {
    const ctx = enrich(
      {
        appName: 'metrics-app',
        recipes: ['dashboard'],
        dashboard: {
          title: 'Ops Dashboard',
          stats: sampleStats,
          timeRanges: ['24h', '7d', '30d'],
        },
      },
      meta,
    );

    expect(ctx.recipeDashboard).toBe(true);
    expect(ctx.dashboard.enabled).toBe(true);
    expect(ctx.dashboard.title).toBe('Ops Dashboard');
    expect(ctx.dashboard.stats).toHaveLength(3);
    expect(ctx.dashboard.stats.map((s) => s.name)).toEqual([
      'Active Users',
      'MRR',
      'Conversion Rate',
    ]);
    expect(ctx.dashboard.stats.map((s) => s.slug)).toEqual([
      'active-users',
      'mrr',
      'conversion-rate',
    ]);
    expect(ctx.dashboard.stats[2].format).toBe('percent');
    expect(ctx.dashboard.stats[2].units).toBe(''); // missing → empty string
    expect(ctx.dashboard.stats[2].hasUnits).toBe(false);
    expect(ctx.dashboard.timeRanges).toEqual(['24h', '7d', '30d']);
    expect(ctx.dashboard.defaultTimeRange).toBe('24h');

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const expected of DASHBOARD_OUTPUTS) {
      expect(outputs, `missing ${expected}`).toContain(expected);
    }

    // Page/card/route are extension points; the lib helper is regenerated.
    const extensionPoints = [
      'src/components/DashboardLayout.tsx',
      'src/components/StatCard.tsx',
      'src/routes/dashboard.tsx',
    ];
    for (const ep of extensionPoints) {
      const f = files.find((x) => x.output === ep);
      expect(f?.overwrite, `${ep} should be overwrite:false`).toBe(false);
    }
    const lib = files.find((x) => x.output === 'src/lib/dashboard.ts');
    expect(lib?.overwrite, 'src/lib/dashboard.ts should default to overwrite:true').not.toBe(false);

    // Stat data flows through to the rendered layout component.
    const rendered = renderTemplate(
      'recipes/dashboard/src/components/DashboardLayout.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('"Ops Dashboard"');
    expect(rendered).toContain('"24h"');
    expect(rendered).toContain('"Active Users"');
    expect(rendered).toContain('"/api/metrics/active-users"');
    expect(rendered).toContain('"MRR"');
    expect(rendered).toContain('"currency"');
    expect(rendered).toContain('"Conversion Rate"');
    expect(rendered).toContain('"percent"');
    // No leftover handlebars markers
    expect(rendered).not.toMatch(/{{/);
    expect(rendered).not.toMatch(/}}/);
  });

  it('renders title + empty grid (no error) when enabled with no stats', () => {
    const ctx = enrich(
      {
        appName: 'metrics-app',
        recipes: ['dashboard'],
      },
      meta,
    );

    expect(ctx.recipeDashboard).toBe(true);
    expect(ctx.dashboard.enabled).toBe(true);
    expect(ctx.dashboard.title).toBe('Dashboard'); // default
    expect(ctx.dashboard.stats).toEqual([]);
    expect(ctx.dashboard.hasStats).toBe(false);
    // Default time ranges populated
    expect(ctx.dashboard.timeRanges).toEqual(['7d', '30d', '90d']);
    expect(ctx.dashboard.defaultTimeRange).toBe('7d');

    // Files still emit
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const expected of DASHBOARD_OUTPUTS) {
      expect(outputs).toContain(expected);
    }

    // Rendered layout with no stats: title present, STATS array is empty, no errors.
    const rendered = renderTemplate(
      'recipes/dashboard/src/components/DashboardLayout.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('"Dashboard"');
    expect(rendered).toMatch(/const STATS: StatMeta\[\] = \[\s*\];/);
    expect(rendered).not.toMatch(/{{/);
    expect(rendered).not.toMatch(/}}/);
  });

  it('composition: dashboard + admin-screen → hasDashboardRecipe=true and Dashboard appears first in admin sidebar', () => {
    const ctx = enrich(
      {
        appName: 'admin-app',
        recipes: ['admin-screen', 'dashboard'],
        adminScreen: { domainSpec: 'sample-domain.yaml' },
        dashboard: { stats: sampleStats },
      },
      meta,
      { adminScreen: { cwd: FIXTURES_DIR } },
    );

    expect(ctx.recipeDashboard).toBe(true);
    expect(ctx.recipeAdminScreen).toBe(true);
    expect(ctx.hasDashboardRecipe).toBe(true);

    const outputs = generateFiles(ctx).map((f) => f.output);
    // Both recipe trees are present.
    for (const expected of DASHBOARD_OUTPUTS) {
      expect(outputs, `missing ${expected}`).toContain(expected);
    }
    expect(outputs).toContain('src/admin/AdminLayout.tsx');

    // The admin sidebar template renders the Dashboard link first.
    const rendered = renderTemplate(
      'recipes/admin-screen/src/admin/AdminLayout.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain("label: 'Dashboard'");
    expect(rendered).toContain("href: '/dashboard'");
    const dashIdx = rendered.indexOf("label: 'Dashboard'");
    const jobsIdx = rendered.indexOf("label: 'Jobs'");
    expect(dashIdx, 'Dashboard link should be present').toBeGreaterThan(-1);
    expect(jobsIdx, 'Jobs link should be present').toBeGreaterThan(-1);
    expect(dashIdx, 'Dashboard link should come before aggregate links').toBeLessThan(jobsIdx);

    // Without the dashboard recipe, the admin sidebar must NOT render a Dashboard link.
    const ctxNoDash = enrich(
      {
        appName: 'admin-app',
        recipes: ['admin-screen'],
        adminScreen: { domainSpec: 'sample-domain.yaml' },
      },
      meta,
      { adminScreen: { cwd: FIXTURES_DIR } },
    );
    expect(ctxNoDash.hasDashboardRecipe).toBe(false);
    const renderedNoDash = renderTemplate(
      'recipes/admin-screen/src/admin/AdminLayout.tsx.hbs',
      ctxNoDash as unknown as Record<string, unknown>,
    );
    expect(renderedNoDash).not.toContain("label: 'Dashboard'");
  });
});
