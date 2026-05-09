import type { Bundle, Context, FileEntry, SpecMetadata } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { enrich, type ViteReactAppContext } from './enrich/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export { enrich };
export type { ViteReactAppContext } from './enrich/index.js';

export function generateFiles(ctx: ViteReactAppContext): FileEntry[] {
  const c = ctx as unknown as Record<string, unknown>;
  const files: FileEntry[] = [
    { template: 'package.json.hbs', output: 'package.json', ctx: c },
    { template: 'vite.config.ts.hbs', output: 'vite.config.ts', ctx: c },
    { template: 'tsconfig.json.hbs', output: 'tsconfig.json', ctx: c },
    { template: 'tsconfig.app.json.hbs', output: 'tsconfig.app.json', ctx: c },
    { template: 'tsconfig.node.json.hbs', output: 'tsconfig.node.json', ctx: c },
    { template: 'eslint.config.js.hbs', output: 'eslint.config.js', ctx: c },
    { template: 'index.html.hbs', output: 'index.html', ctx: c },
    { template: '.gitignore.hbs', output: '.gitignore', ctx: c },
    { template: '.env.example.hbs', output: '.env.example', ctx: c },
    { template: 'README.md.hbs', output: 'README.md', ctx: c },
    { template: 'src/main.tsx.hbs', output: 'src/main.tsx', ctx: c },
    { template: 'src/App.tsx.hbs', output: 'src/App.tsx', ctx: c },
    { template: 'src/index.css.hbs', output: 'src/index.css', ctx: c },
    { template: 'src/vite-env.d.ts.hbs', output: 'src/vite-env.d.ts', ctx: c },
  ];

  if (ctx.hasTanstackRouter) {
    files.push({ template: 'src/router.tsx.hbs', output: 'src/router.tsx', ctx: c });
  }

  // One extension-point file per route
  for (const route of ctx.routes) {
    files.push({
      template: 'src/routes/route.tsx.hbs',
      output: `src/routes/${route.routeFile}.tsx`,
      ctx: { ...c, route },
      overwrite: false,
    });
  }

  if (ctx.hasApi) {
    files.push({ template: 'src/lib/api.ts.hbs', output: 'src/lib/api.ts', ctx: c });
  }

  if (ctx.hasSupabase) {
    files.push({ template: 'src/lib/supabase.ts.hbs', output: 'src/lib/supabase.ts', ctx: c });
  }

  if (ctx.hasDocker) {
    files.push(
      { template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: c },
      { template: 'nginx.conf.hbs', output: 'nginx.conf', ctx: c },
    );
  }

  // Recipe: admin-screen
  if (ctx.recipeAdminScreen && ctx.adminScreen.enabled) {
    files.push(
      {
        template: 'recipes/admin-screen/src/admin/AdminLayout.tsx.hbs',
        output: 'src/admin/AdminLayout.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/admin-screen/src/admin/index.ts.hbs',
        output: 'src/admin/index.ts',
        ctx: c,
      },
    );
    for (const agg of ctx.adminScreen.aggregates) {
      const aggCtx = { ...c, agg };
      const dir = `src/admin/${agg.namePluralPascal}`;
      files.push(
        {
          template: 'recipes/admin-screen/src/admin/aggregate/types.ts.hbs',
          output: `${dir}/types.ts`,
          ctx: aggCtx,
        },
        {
          template: 'recipes/admin-screen/src/admin/aggregate/Client.ts.hbs',
          output: `${dir}/${agg.namePascal}Client.ts`,
          ctx: aggCtx,
        },
        {
          template: 'recipes/admin-screen/src/admin/aggregate/ListPage.tsx.hbs',
          output: `${dir}/${agg.namePluralPascal}ListPage.tsx`,
          ctx: aggCtx,
        },
        {
          template: 'recipes/admin-screen/src/admin/aggregate/CreatePage.tsx.hbs',
          output: `${dir}/${agg.namePascal}CreatePage.tsx`,
          ctx: aggCtx,
          overwrite: false,
        },
        {
          template: 'recipes/admin-screen/src/admin/aggregate/EditPage.tsx.hbs',
          output: `${dir}/${agg.namePascal}EditPage.tsx`,
          ctx: aggCtx,
          overwrite: false,
        },
        {
          template: 'recipes/admin-screen/src/admin/aggregate/Form.tsx.hbs',
          output: `${dir}/${agg.namePascal}Form.tsx`,
          ctx: aggCtx,
          overwrite: false,
        },
      );
    }
  }

  // Recipe: users-management
  if (ctx.recipeUsersManagement) {
    files.push(
      {
        template: 'recipes/users-management/src/lib/auth.ts.hbs',
        output: 'src/lib/auth.ts',
        ctx: c,
      },
      {
        template: 'recipes/users-management/src/lib/auth-storage.ts.hbs',
        output: 'src/lib/auth-storage.ts',
        ctx: c,
      },
      {
        template: 'recipes/users-management/src/auth/AuthProvider.tsx.hbs',
        output: 'src/auth/AuthProvider.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/users-management/src/auth/useAuth.ts.hbs',
        output: 'src/auth/useAuth.ts',
        ctx: c,
      },
      {
        template: 'recipes/users-management/src/auth/RequireAuth.tsx.hbs',
        output: 'src/auth/RequireAuth.tsx',
        ctx: c,
      },
      {
        template: 'recipes/users-management/src/auth/RequireRole.tsx.hbs',
        output: 'src/auth/RequireRole.tsx',
        ctx: c,
      },
      {
        template: 'recipes/users-management/src/routes/sign-in.tsx.hbs',
        output: 'src/routes/sign-in.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/users-management/src/routes/sign-up.tsx.hbs',
        output: 'src/routes/sign-up.tsx',
        ctx: c,
        overwrite: false,
      },
    );
  }

  // Recipe: pricing-page
  if (ctx.recipePricingPage) {
    files.push(
      {
        template: 'recipes/pricing-page/src/components/PricingPage.tsx.hbs',
        output: 'src/components/PricingPage.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/pricing-page/src/routes/pricing.tsx.hbs',
        output: 'src/routes/pricing.tsx',
        ctx: c,
        overwrite: false,
      },
    );
  }

  // Recipe: dashboard
  if (ctx.recipeDashboard) {
    files.push(
      {
        template: 'recipes/dashboard/src/lib/dashboard.ts.hbs',
        output: 'src/lib/dashboard.ts',
        ctx: c,
      },
      {
        template: 'recipes/dashboard/src/components/DashboardLayout.tsx.hbs',
        output: 'src/components/DashboardLayout.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/dashboard/src/components/StatCard.tsx.hbs',
        output: 'src/components/StatCard.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/dashboard/src/routes/dashboard.tsx.hbs',
        output: 'src/routes/dashboard.tsx',
        ctx: c,
        overwrite: false,
      },
    );
  }

  // Recipe: pagination-list-ui
  if (ctx.recipePaginationListUi) {
    files.push(
      {
        template: 'recipes/pagination-list-ui/src/lib/pagination/types.ts.hbs',
        output: 'src/lib/pagination/types.ts',
        ctx: c,
      },
      {
        template: 'recipes/pagination-list-ui/src/lib/pagination/buildQuery.ts.hbs',
        output: 'src/lib/pagination/buildQuery.ts',
        ctx: c,
      },
      {
        template: 'recipes/pagination-list-ui/src/lib/pagination/usePagedList.ts.hbs',
        output: 'src/lib/pagination/usePagedList.ts',
        ctx: c,
      },
      {
        template: 'recipes/pagination-list-ui/src/components/pagination/Pagination.tsx.hbs',
        output: 'src/components/pagination/Pagination.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/pagination-list-ui/src/components/pagination/SortHeader.tsx.hbs',
        output: 'src/components/pagination/SortHeader.tsx',
        ctx: c,
        overwrite: false,
      },
    );
  }

  // Recipe: form-validation
  if (ctx.recipeFormValidation) {
    files.push(
      {
        template: 'recipes/form-validation/src/lib/forms/useZodForm.ts.hbs',
        output: 'src/lib/forms/useZodForm.ts',
        ctx: c,
      },
      {
        template: 'recipes/form-validation/src/components/forms/Form.tsx.hbs',
        output: 'src/components/forms/Form.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/form-validation/src/components/forms/FieldError.tsx.hbs',
        output: 'src/components/forms/FieldError.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/form-validation/src/components/forms/TextField.tsx.hbs',
        output: 'src/components/forms/TextField.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/form-validation/src/components/forms/NumberField.tsx.hbs',
        output: 'src/components/forms/NumberField.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/form-validation/src/components/forms/Select.tsx.hbs',
        output: 'src/components/forms/Select.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/form-validation/src/components/forms/DatePicker.tsx.hbs',
        output: 'src/components/forms/DatePicker.tsx',
        ctx: c,
        overwrite: false,
      },
    );
  }

  // Recipe: image-upload
  if (ctx.recipeImageUpload) {
    files.push(
      {
        template: 'recipes/image-upload/src/types/image.ts.hbs',
        output: 'src/types/image.ts',
        ctx: c,
      },
      {
        template: 'recipes/image-upload/src/lib/images.ts.hbs',
        output: 'src/lib/images.ts',
        ctx: c,
      },
      {
        template: 'recipes/image-upload/src/components/ImageUpload.tsx.hbs',
        output: 'src/components/ImageUpload.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/image-upload/src/components/ImageGallery.tsx.hbs',
        output: 'src/components/ImageGallery.tsx',
        ctx: c,
      },
    );
  }

  return files;
}

export const helpers = {
  eq: (a: unknown, b: unknown) => a === b,
  json: (v: unknown) => JSON.stringify(v),
};

export const bundle: Bundle = {
  kind: 'vite-react-app',
  specSchema: schema,
  enrich: enrich as unknown as Bundle['enrich'],
  generateFiles: generateFiles as unknown as (ctx: Context) => FileEntry[],
  templates: 'templates',
  helpers: helpers as unknown as Bundle['helpers'],
  cfrs: {
    provides: ['docker'],
    files: {
      docker: ['Dockerfile', 'nginx.conf'],
    },
  },
};

export default bundle;
