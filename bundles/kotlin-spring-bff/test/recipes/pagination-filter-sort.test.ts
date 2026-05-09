import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles } from '../../src/index.js';

const APP_YML_TPL_PATH = join(
  __dirname,
  '..',
  '..',
  'templates',
  'src',
  'main',
  'resources',
  'application.yml.hbs',
);

function renderApplicationYml(ctx: Record<string, unknown>): string {
  const hb = Handlebars.create();
  // Mirror the bundle helpers we use in application.yml.
  hb.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  hb.registerHelper('springProp', (...args: unknown[]) => {
    const params = args.slice(0, -1);
    const varName = String(params[0] ?? '');
    const hasDefault = params.length >= 2;
    const d = hasDefault ? `:${String(params[1] ?? '')}` : '';
    return `\${${varName}${d}}`;
  });
  hb.registerHelper('concat', (...args: unknown[]) => {
    const params = args.slice(0, -1);
    return params.map((p) => String(p ?? '')).join('');
  });
  const tpl = hb.compile(readFileSync(APP_YML_TPL_PATH, 'utf-8'));
  return tpl(ctx);
}

const md = { name: 'my-bff', apiVersion: '1.0' };

const PAGINATION_FILE_TAILS = [
  'pagination/PageRequest.kt',
  'pagination/PageResponse.kt',
  'pagination/SortSpec.kt',
  'pagination/FilterSpec.kt',
  'pagination/PaginationProperties.kt',
  'pagination/PageRequestArgumentResolver.kt',
  'pagination/PaginationWebConfig.kt',
];

describe('kotlin-spring-bff pagination-filter-sort recipe', () => {
  it('does not generate any pagination files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'my-bff', groupId: 'com.example' }, md);
    expect(ctx.recipePaginationFilterSort).toBe(false);
    expect(ctx.recipes).toEqual([]);
    expect(ctx.recipeProfiles).toEqual([]);
    expect(ctx.hasRecipeProfiles).toBe(false);
    const files = generateFiles(ctx);
    const paginationOutputs = files.filter((f) => f.output.includes('/pagination/'));
    expect(paginationOutputs).toEqual([]);
    expect(
      files.some((f) => f.output.endsWith('application-pagination-filter-sort.yml')),
    ).toBe(false);
  });

  it('works without features.database (recipe is JPA-agnostic)', () => {
    const ctx = enrich(
      { appName: 'my-bff', groupId: 'com.example', recipes: ['pagination-filter-sort'] },
      md,
    );
    expect(ctx.recipePaginationFilterSort).toBe(true);
    expect(ctx.features.database).toBe(false);
    // No throw — unlike users-management, this recipe has no JPA requirement.
  });

  it('generates all pagination files when recipe is enabled', () => {
    const ctx = enrich(
      { appName: 'my-bff', groupId: 'com.example', recipes: ['pagination-filter-sort'] },
      md,
    );
    expect(ctx.recipes).toEqual(['pagination-filter-sort']);
    expect(ctx.recipeProfiles).toEqual(['pagination-filter-sort']);
    expect(ctx.hasRecipeProfiles).toBe(true);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const tail of PAGINATION_FILE_TAILS) {
      expect(
        outputs.some((o) => o.endsWith(tail)),
        `missing ${tail}`,
      ).toBe(true);
    }
    expect(outputs).toContain('src/main/resources/application-pagination-filter-sort.yml');

    // No file in this recipe is an extension point — all are framework plumbing.
    const paginationFiles = files.filter((f) => f.output.includes('/pagination/'));
    for (const f of paginationFiles) {
      expect(f.overwrite, `${f.output} should be overwritable`).not.toBe(false);
    }
  });

  it('honours custom paginationFilterSort config in PaginationProperties + yml', () => {
    const ctx = enrich(
      {
        appName: 'my-bff',
        groupId: 'com.example',
        recipes: ['pagination-filter-sort'],
        paginationFilterSort: { defaultPageSize: 50, maxPageSize: 200 },
      },
      md,
    );
    expect(ctx.paginationFilterSort).toEqual({ defaultPageSize: 50, maxPageSize: 200 });

    const propsTpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'pagination-filter-sort',
        'pagination',
        'PaginationProperties.kt.hbs',
      ),
      'utf-8',
    );
    expect(propsTpl).toContain('@ConfigurationProperties(prefix = "app.pagination")');
    expect(propsTpl).toContain('val defaultPageSize: Int = {{paginationFilterSort.defaultPageSize}}');
    expect(propsTpl).toContain('val maxPageSize: Int = {{paginationFilterSort.maxPageSize}}');
  });

  it('composes with other recipes — appends to recipeProfiles in deterministic order', () => {
    const ctx = enrich(
      {
        appName: 'my-bff',
        groupId: 'com.example',
        features: { database: true },
        recipes: ['pagination-filter-sort', 'image-upload', 'users-management'],
      },
      md,
    );
    // image-upload, users-management, pagination-filter-sort — recipe-list order doesn't matter.
    expect(ctx.recipeProfiles).toEqual([
      'image-upload',
      'users-management',
      'pagination-filter-sort',
    ]);
  });

  it('application.yml renders an `include:` block listing every active recipe profile', () => {
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'src',
        'main',
        'resources',
        'application.yml.hbs',
      ),
      'utf-8',
    );
    expect(tpl).toContain('{{#if hasRecipeProfiles}}');
    expect(tpl).toContain('{{#each recipeProfiles}}');
    expect(tpl).toContain('- {{this}}');
  });

  it('application.yml has NO `profiles: include:` block when no recipes are enabled', () => {
    const ctx = enrich({ appName: 'my-bff', groupId: 'com.example' }, md);
    const yml = renderApplicationYml(ctx as unknown as Record<string, unknown>);
    // The `profiles: include:` block belongs under `spring:`. There's an unrelated
    // `include:` line in the management.endpoints.web block that we want to ignore.
    expect(yml).not.toMatch(/^\s*profiles:\s*$/m);
    expect(yml).not.toMatch(/- (image-upload|users-management|pagination-filter-sort)/);
  });

  it('application.yml renders all enabled recipe profiles in the documented order', () => {
    const ctx = enrich(
      {
        appName: 'my-bff',
        groupId: 'com.example',
        features: { database: true },
        recipes: ['users-management', 'pagination-filter-sort', 'image-upload'],
      },
      md,
    );
    const yml = renderApplicationYml(ctx as unknown as Record<string, unknown>);
    // Order is fixed by enrich(), independent of the recipes-array order.
    const idxImage = yml.indexOf('- image-upload');
    const idxUsers = yml.indexOf('- users-management');
    const idxPagination = yml.indexOf('- pagination-filter-sort');
    expect(idxImage).toBeGreaterThan(0);
    expect(idxUsers).toBeGreaterThan(idxImage);
    expect(idxPagination).toBeGreaterThan(idxUsers);
  });

  it('PaginationWebConfig registers via @EnableConfigurationProperties', () => {
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'pagination-filter-sort',
        'pagination',
        'PaginationWebConfig.kt.hbs',
      ),
      'utf-8',
    );
    expect(tpl).toContain('@EnableConfigurationProperties(PaginationProperties::class)');
    expect(tpl).toContain('addArgumentResolvers');
  });

  it('PageResponse wire format includes numberOfElements/first/last for FE consumers', () => {
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'pagination-filter-sort',
        'pagination',
        'PageResponse.kt.hbs',
      ),
      'utf-8',
    );
    expect(tpl).toContain('val numberOfElements: Int,');
    expect(tpl).toContain('val first: Boolean,');
    expect(tpl).toContain('val last: Boolean,');
  });

  it('FilterSpec rejects unknown op tokens (returns null) — no silent EQ fallback', () => {
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'pagination-filter-sort',
        'pagination',
        'FilterSpec.kt.hbs',
      ),
      'utf-8',
    );
    // The parser must `return null` rather than re-using EQ when the op is unknown.
    expect(tpl).toContain('Op.fromTokenOrNull(opToken) ?: return null');
  });

  it('SortSpec rejects unknown direction tokens (returns null)', () => {
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'pagination-filter-sort',
        'pagination',
        'SortSpec.kt.hbs',
      ),
      'utf-8',
    );
    expect(tpl).toMatch(/else -> return null/);
  });

  it('PageRequest, FilterSpec, and SortSpec templates document the wire convention', () => {
    const root = join(__dirname, '..', '..', 'templates', 'recipes', 'pagination-filter-sort');
    const pageReq = readFileSync(join(root, 'pagination', 'PageRequest.kt.hbs'), 'utf-8');
    expect(pageReq).toContain('data class PageRequest');
    expect(pageReq).toContain('?page&size&sort&filter');

    const filter = readFileSync(join(root, 'pagination', 'FilterSpec.kt.hbs'), 'utf-8');
    expect(filter).toContain('?filter=field:op:value');
    expect(filter).toContain('LIKE');
    expect(filter).toContain('IN');

    const sort = readFileSync(join(root, 'pagination', 'SortSpec.kt.hbs'), 'utf-8');
    expect(sort).toContain('?sort=field,direction');
  });
});
