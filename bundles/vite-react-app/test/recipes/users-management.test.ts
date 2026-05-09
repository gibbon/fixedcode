import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { enrich, generateFiles } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

const USERS_FILES = [
  'src/lib/auth.ts',
  'src/lib/auth-storage.ts',
  'src/auth/AuthProvider.tsx',
  'src/auth/useAuth.ts',
  'src/auth/RequireAuth.tsx',
  'src/auth/RequireRole.tsx',
  'src/routes/sign-in.tsx',
  'src/routes/sign-up.tsx',
];

describe('vite-react-app users-management recipe', () => {
  it('does not generate any users-management files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipeUsersManagement).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const out of outputs) {
      expect(out.startsWith('src/auth/')).toBe(false);
    }
    expect(outputs).not.toContain('src/lib/auth.ts');
    expect(outputs).not.toContain('src/lib/auth-storage.ts');
    expect(outputs).not.toContain('src/routes/sign-in.tsx');
  });

  it('generates the expected files (and marks extension points correctly) when enabled', () => {
    const ctx = enrich(
      {
        appName: 'auth-app',
        recipes: ['users-management'],
      },
      meta,
    );
    expect(ctx.recipeUsersManagement).toBe(true);
    expect(ctx.usersManagement.signInPath).toBe('/sign-in');
    expect(ctx.usersManagement.signUpPath).toBe('/sign-up');
    expect(ctx.usersManagement.afterSignInPath).toBe('/');

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const f of USERS_FILES) {
      expect(outputs, `missing ${f}`).toContain(f);
    }

    // Extension points
    for (const ep of [
      'src/auth/AuthProvider.tsx',
      'src/routes/sign-in.tsx',
      'src/routes/sign-up.tsx',
    ]) {
      const f = files.find((x) => x.output === ep);
      expect(f?.overwrite, `${ep} should be overwrite:false`).toBe(false);
    }

    // The auth.ts client uses native fetch (no axios import etc.)
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'users-management',
        'src',
        'lib',
        'auth.ts.hbs',
      ),
      'utf-8',
    );
    expect(tpl).toContain('fetch(');
    expect(tpl).not.toMatch(/from ['"]axios['"]/);

    // No new npm dependencies are added by the recipe
    const baseCtx = enrich({ appName: 'auth-app' }, meta);
    const enabledCtx = enrich({ appName: 'auth-app', recipes: ['users-management'] }, meta);
    expect(Object.keys(enabledCtx.dependencies).sort()).toEqual(
      Object.keys(baseCtx.dependencies).sort(),
    );
    expect(Object.keys(enabledCtx.devDependencies).sort()).toEqual(
      Object.keys(baseCtx.devDependencies).sort(),
    );
  });

  it('wraps admin routes in RequireRole when admin-screen is also enabled', () => {
    const ctx = enrich(
      {
        appName: 'auth-admin-app',
        recipes: ['users-management', 'admin-screen'],
        adminScreen: { domainSpec: 'sample-domain.yaml' },
      },
      meta,
      { adminScreen: { cwd: FIXTURES_DIR } },
    );
    expect(ctx.recipeUsersManagement).toBe(true);
    expect(ctx.recipeAdminScreen).toBe(true);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);

    // Both recipes' files are present
    expect(outputs).toContain('src/auth/AuthProvider.tsx');
    expect(outputs).toContain('src/admin/AdminLayout.tsx');
    expect(outputs).toContain('src/admin/index.ts');

    // The admin index template now contains a `guarded()` wrapper.
    const adminIndex = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'admin-screen',
        'src',
        'admin',
        'index.ts.hbs',
      ),
      'utf-8',
    );
    expect(adminIndex).toContain('RequireRole');
    expect(adminIndex).toContain("role: 'ADMIN'");
  });
});
