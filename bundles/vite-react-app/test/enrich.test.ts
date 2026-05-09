import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

describe('vite-react-app enrich', () => {
  it('applies sensible defaults', () => {
    const ctx = enrich({ appName: 'my-app' }, meta);
    expect(ctx.appName.kebab).toBe('my-app');
    expect(ctx.appName.pascal).toBe('MyApp');
    expect(ctx.port).toBe(5173);
    expect(ctx.hasTanstackRouter).toBe(true);
    expect(ctx.hasApi).toBe(true);
    expect(ctx.hasTailwind).toBe(true);
    expect(ctx.hasAuth).toBe(false);
    expect(ctx.hasDocker).toBe(false);
    expect(ctx.routes).toEqual([
      { path: '/', name: 'Home', componentName: 'Home', routeFile: 'index', isIndex: true },
    ]);
    expect(ctx.dependencies['react']).toBeDefined();
    expect(ctx.dependencies['@tanstack/react-router']).toBeDefined();
    expect(ctx.dependencies['tailwindcss']).toBeDefined();
    expect(ctx.dependencies['@supabase/supabase-js']).toBeUndefined();
    expect(ctx.apiUrlEnvVar).toBe('VITE_MY_APP_API_BASE_URL');
  });

  it('handles all features off', () => {
    const ctx = enrich(
      {
        appName: 'plain-app',
        features: {
          router: 'none',
          api: false,
          auth: 'none',
          docker: false,
          tailwind: false,
        },
      },
      meta,
    );
    expect(ctx.hasRouter).toBe(false);
    expect(ctx.hasTanstackRouter).toBe(false);
    expect(ctx.hasApi).toBe(false);
    expect(ctx.hasTailwind).toBe(false);
    expect(ctx.hasAuth).toBe(false);
    expect(ctx.hasDocker).toBe(false);
    expect(ctx.dependencies['@tanstack/react-router']).toBeUndefined();
    expect(ctx.dependencies['tailwindcss']).toBeUndefined();
    expect(ctx.dependencies['@supabase/supabase-js']).toBeUndefined();

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    expect(outputs).not.toContain('src/router.tsx');
    expect(outputs).not.toContain('src/lib/api.ts');
    expect(outputs).not.toContain('src/lib/supabase.ts');
    expect(outputs).not.toContain('Dockerfile');
  });

  it('expands one extension-point file per route', () => {
    const ctx = enrich(
      {
        appName: 'multi-route',
        routes: [
          { path: '/', name: 'Home' },
          { path: '/about', name: 'About' },
          { path: '/users/$id', name: 'User Detail' },
        ],
      },
      meta,
    );
    expect(ctx.routes).toHaveLength(3);
    expect(ctx.routes[2].componentName).toBe('UserDetail');
    expect(ctx.routes[2].routeFile).toBe('users.$id');

    const files = generateFiles(ctx);
    const routeFiles = files.filter((f) => f.output.startsWith('src/routes/')).map((f) => f.output);
    expect(routeFiles).toEqual(
      expect.arrayContaining([
        'src/routes/index.tsx',
        'src/routes/about.tsx',
        'src/routes/users.$id.tsx',
      ]),
    );
    // route files are extension points
    const aboutFile = files.find((f) => f.output === 'src/routes/about.tsx');
    expect(aboutFile?.overwrite).toBe(false);
  });

  it('enables supabase auth and docker when requested', () => {
    const ctx = enrich(
      {
        appName: 'secure-app',
        features: { auth: 'supabase', docker: true },
      },
      meta,
    );
    expect(ctx.hasSupabase).toBe(true);
    expect(ctx.hasDocker).toBe(true);
    expect(ctx.dependencies['@supabase/supabase-js']).toBeDefined();

    const outputs = generateFiles(ctx).map((f) => f.output);
    expect(outputs).toContain('src/lib/supabase.ts');
    expect(outputs).toContain('Dockerfile');
    expect(outputs).toContain('nginx.conf');
  });
});
