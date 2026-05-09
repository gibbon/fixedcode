import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { enrich, generateFiles } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

describe('vite-react-app admin-screen recipe', () => {
  it('does not generate any admin files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipeAdminScreen).toBe(false);
    expect(ctx.adminScreen.enabled).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const output of outputs) {
      expect(output.startsWith('src/admin/')).toBe(false);
    }
  });

  it('throws a clear error when recipe is enabled but domainSpec is missing', () => {
    expect(() =>
      enrich(
        {
          appName: 'admin-app',
          recipes: ['admin-screen'],
        },
        meta,
      ),
    ).toThrow(/admin-screen.*domainSpec.*not set/i);
  });

  it('emits the expected files for a 2-aggregate domain spec', () => {
    const ctx = enrich(
      {
        appName: 'admin-app',
        recipes: ['admin-screen'],
        adminScreen: { domainSpec: 'sample-domain.yaml' },
      },
      meta,
      { adminScreen: { cwd: FIXTURES_DIR } },
    );

    expect(ctx.recipeAdminScreen).toBe(true);
    expect(ctx.adminScreen.enabled).toBe(true);
    if (!ctx.adminScreen.enabled) throw new Error('expected enabled');
    expect(ctx.adminScreen.aggregates.map((a) => a.name)).toEqual(['Job', 'Application']);

    const files = generateFiles(ctx);
    const adminFiles = files.filter((f) => f.output.startsWith('src/admin/'));
    const adminOutputs = adminFiles.map((f) => f.output);

    // 6 per aggregate × 2 aggregates + 2 once-only = 14
    expect(adminOutputs.length).toBe(14);

    const expected = [
      'src/admin/AdminLayout.tsx',
      'src/admin/index.ts',
      // Job (Jobs)
      'src/admin/Jobs/types.ts',
      'src/admin/Jobs/JobClient.ts',
      'src/admin/Jobs/JobsListPage.tsx',
      'src/admin/Jobs/JobCreatePage.tsx',
      'src/admin/Jobs/JobEditPage.tsx',
      'src/admin/Jobs/JobForm.tsx',
      // Application (Applications)
      'src/admin/Applications/types.ts',
      'src/admin/Applications/ApplicationClient.ts',
      'src/admin/Applications/ApplicationsListPage.tsx',
      'src/admin/Applications/ApplicationCreatePage.tsx',
      'src/admin/Applications/ApplicationEditPage.tsx',
      'src/admin/Applications/ApplicationForm.tsx',
    ];
    for (const e of expected) {
      expect(adminOutputs, `missing ${e}`).toContain(e);
    }

    // CreatePage / EditPage / Form / AdminLayout are extension points
    for (const ep of [
      'src/admin/AdminLayout.tsx',
      'src/admin/Jobs/JobCreatePage.tsx',
      'src/admin/Jobs/JobEditPage.tsx',
      'src/admin/Jobs/JobForm.tsx',
    ]) {
      const f = adminFiles.find((x) => x.output === ep);
      expect(f?.overwrite, `${ep} should be overwrite:false`).toBe(false);
    }
    // Client / types / ListPage are regenerated each time
    for (const reg of [
      'src/admin/Jobs/JobClient.ts',
      'src/admin/Jobs/types.ts',
      'src/admin/Jobs/JobsListPage.tsx',
    ]) {
      const f = adminFiles.find((x) => x.output === reg);
      expect(f?.overwrite, `${reg} should default to overwrite:true`).not.toBe(false);
    }
  });

  it('maps spring-domain types to FE input types correctly', () => {
    const ctx = enrich(
      {
        appName: 'admin-app',
        recipes: ['admin-screen'],
        adminScreen: { domainSpec: 'sample-domain.yaml' },
      },
      meta,
      { adminScreen: { cwd: FIXTURES_DIR } },
    );
    if (!ctx.adminScreen.enabled) throw new Error('expected enabled');

    const job = ctx.adminScreen.aggregates.find((a) => a.name === 'Job');
    expect(job).toBeDefined();
    const byName = Object.fromEntries(job!.fields.map((f) => [f.name, f]));

    expect(byName.jobId.isId).toBe(true);
    expect(byName.jobId.formInputType).toBe('text');
    expect(byName.jobId.isReadonly).toBe(true);

    expect(byName.title.formInputType).toBe('text');

    // status uses enum default convention → select
    expect(byName.status.formInputType).toBe('select');
    expect(byName.status.enumValues.map((e) => e.value)).toEqual(['DRAFT', 'PUBLISHED', 'CLOSED']);

    expect(byName.salary.formInputType).toBe('number');
    expect(byName.remote.formInputType).toBe('checkbox');
    expect(byName.postedDate.formInputType).toBe('date');

    const application = ctx.adminScreen.aggregates.find((a) => a.name === 'Application');
    const appByName = Object.fromEntries(application!.fields.map((f) => [f.name, f]));
    expect(appByName.applicationId.isId).toBe(true);
    // jobId is the SECOND uuid → not the identity, treated as plain text
    expect(appByName.jobId.isId).toBe(false);
    expect(appByName.score.formInputType).toBe('number');
    expect(appByName.score.required).toBe(false);
    expect(appByName.appliedAt.formInputType).toBe('datetime-local');
  });
});
