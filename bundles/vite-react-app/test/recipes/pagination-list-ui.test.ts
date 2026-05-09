import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles, helpers } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');

const PAGINATION_OUTPUTS = [
  'src/lib/pagination/types.ts',
  'src/lib/pagination/buildQuery.ts',
  'src/lib/pagination/usePagedList.ts',
  'src/components/pagination/Pagination.tsx',
  'src/components/pagination/SortHeader.tsx',
];

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hbs = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) {
    hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
  const src = readFileSync(join(TEMPLATE_DIR, templatePath), 'utf-8');
  return hbs.compile(src, { noEscape: true })(ctx);
}

describe('vite-react-app pagination-list-ui recipe', () => {
  it('does not generate any pagination files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipePaginationListUi).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const out of PAGINATION_OUTPUTS) {
      expect(outputs).not.toContain(out);
    }
  });

  it('throws a clear error when recipe is enabled but features.api is off', () => {
    expect(() =>
      enrich(
        {
          appName: 'plain-app',
          features: { api: false },
          recipes: ['pagination-list-ui'],
        },
        meta,
      ),
    ).toThrow(/pagination-list-ui.*requires features\.api/i);
  });

  it('generates all five pagination files when recipe is enabled', () => {
    const ctx = enrich(
      {
        appName: 'plain-app',
        features: { api: true },
        recipes: ['pagination-list-ui'],
      },
      meta,
    );
    expect(ctx.recipePaginationListUi).toBe(true);
    expect(ctx.paginationListUi).toEqual({
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
    });

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const out of PAGINATION_OUTPUTS) {
      expect(outputs, `missing ${out}`).toContain(out);
    }

    // Component files are extension points; lib files are framework plumbing.
    const pagination = files.find((f) => f.output.endsWith('Pagination.tsx'));
    expect(pagination?.overwrite).toBe(false);
    const sortHeader = files.find((f) => f.output.endsWith('SortHeader.tsx'));
    expect(sortHeader?.overwrite).toBe(false);
    const hook = files.find((f) => f.output.endsWith('usePagedList.ts'));
    expect(hook?.overwrite).not.toBe(false);
    const types = files.find((f) => f.output.endsWith('types.ts'));
    expect(types?.overwrite).not.toBe(false);
  });

  it('honours custom paginationListUi config and dedups + sorts pageSizeOptions', () => {
    const ctx = enrich(
      {
        appName: 'plain-app',
        features: { api: true },
        recipes: ['pagination-list-ui'],
        paginationListUi: {
          defaultPageSize: 25,
          pageSizeOptions: [50, 25, 100, 25, 200],
        },
      },
      meta,
    );
    expect(ctx.paginationListUi.defaultPageSize).toBe(25);
    expect(ctx.paginationListUi.pageSizeOptions).toEqual([25, 50, 100, 200]);
  });

  it('TS types match the BFF wire format exactly', () => {
    const rendered = renderTemplate(
      'recipes/pagination-list-ui/src/lib/pagination/types.ts.hbs',
      {} as Record<string, unknown>,
    );
    // Wire-format fields the BE pagination-filter-sort recipe ships in PageResponse.kt.
    for (const field of [
      'content: T[]',
      'page: number',
      'size: number',
      'totalElements: number',
      'totalPages: number',
      'numberOfElements: number',
      'first: boolean',
      'last: boolean',
      'hasNext: boolean',
      'hasPrevious: boolean',
    ]) {
      expect(rendered, `missing wire-format field: ${field}`).toContain(field);
    }
    // Filter ops match the BE enum exactly.
    expect(rendered).toContain("'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'IN'");
  });

  it('buildQuery serialises sort/filter triples in the exact BFF convention', () => {
    const rendered = renderTemplate(
      'recipes/pagination-list-ui/src/lib/pagination/buildQuery.ts.hbs',
      {} as Record<string, unknown>,
    );
    // sort=field,direction (lowercase direction)
    expect(rendered).toContain('`${s.field},${s.direction.toLowerCase()}`');
    // filter=field:op:value (lowercase op)
    expect(rendered).toContain('`${f.field}:${f.op.toLowerCase()}:${f.value}`');
    // Multi-valued sort / filter — repeat the param name.
    expect(rendered).toMatch(/params\.append\('sort'/);
    expect(rendered).toMatch(/params\.append\('filter'/);
  });

  it('usePagedList hook renders defaultPageSize from spec config', () => {
    const ctx = enrich(
      {
        appName: 'plain-app',
        features: { api: true },
        recipes: ['pagination-list-ui'],
        paginationListUi: { defaultPageSize: 40 },
      },
      meta,
    );
    const rendered = renderTemplate(
      'recipes/pagination-list-ui/src/lib/pagination/usePagedList.ts.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('const DEFAULT_PAGE_SIZE = 40;');
    // setSize/setSort/setFilters all reset to page 0 — important UX invariant.
    expect(rendered).toContain("setRequest((prev) => ({ ...prev, sort, page: 0 }))");
    expect(rendered).toContain("setRequest((prev) => ({ ...prev, filters, page: 0 }))");
  });

  it('Pagination component renders pageSizeOptions array literally', () => {
    const ctx = enrich(
      {
        appName: 'plain-app',
        features: { api: true },
        recipes: ['pagination-list-ui'],
        paginationListUi: { pageSizeOptions: [5, 25, 100] },
      },
      meta,
    );
    const rendered = renderTemplate(
      'recipes/pagination-list-ui/src/components/pagination/Pagination.tsx.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('const DEFAULT_PAGE_SIZE_OPTIONS = [5,25,100];');
    expect(rendered).toContain('aria-label="Pagination"');
  });

  it('SortHeader cycles no-sort → ASC → DESC → no-sort and emits aria-sort', () => {
    const rendered = renderTemplate(
      'recipes/pagination-list-ui/src/components/pagination/SortHeader.tsx.hbs',
      {} as Record<string, unknown>,
    );
    expect(rendered).toContain("if (direction === null) return 'ASC';");
    expect(rendered).toContain("if (direction === 'ASC') return 'DESC';");
    expect(rendered).toContain('aria-sort');
  });

  it('composes with users-management without throwing', () => {
    const ctx = enrich(
      {
        appName: 'plain-app',
        features: { api: true },
        recipes: ['pagination-list-ui', 'users-management'],
      },
      meta,
    );
    expect(ctx.recipePaginationListUi).toBe(true);
    expect(ctx.recipeUsersManagement).toBe(true);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const out of PAGINATION_OUTPUTS) {
      expect(outputs).toContain(out);
    }
  });
});
