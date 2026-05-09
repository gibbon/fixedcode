import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { enrich, generateFiles } from '../../src/index.js';

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
