import {
  parseSpec,
  type NormalizedSpec,
  type RouterKind,
  type AuthKind,
  type RecipeName,
  type NormalizedImageUploadConfig,
  type NormalizedUsersManagementConfig,
  type NormalizedPaginationListUiConfig,
} from './spec.js';
import {
  generateVariants,
  routePathToFile,
  toPascalCase,
  toUpperSnakeCase,
  type NamingVariants,
} from './naming.js';
import {
  buildAdminScreenContext,
  type AdminScreenContext,
  type AdminScreenDisabledContext,
  type BuildAdminContextOptions,
} from './recipes/admin-screen.js';
import { buildPricingPageContext, type PricingPageContext } from './recipes/pricing-page.js';
import { buildDashboardContext, type DashboardContext } from './recipes/dashboard.js';

export type { AdminAggregate, AdminField, AdminScreenContext } from './recipes/admin-screen.js';
export type {
  PricingFeatureContext,
  PricingTierContext,
  PricingPageContext,
} from './recipes/pricing-page.js';
export type { DashboardStatContext, DashboardContext } from './recipes/dashboard.js';

export interface EnrichOptions {
  adminScreen?: BuildAdminContextOptions;
}

export interface EnrichedRoute {
  path: string;
  name: string;
  componentName: string;
  routeFile: string;
  isIndex: boolean;
}

export interface ViteReactAppContext {
  appName: NamingVariants;
  port: number;
  routes: EnrichedRoute[];
  router: RouterKind;
  hasRouter: boolean;
  hasTanstackRouter: boolean;
  hasReactRouter: boolean;
  hasApi: boolean;
  apiBaseUrl: string;
  apiUrlEnvVar: string;
  auth: AuthKind;
  hasAuth: boolean;
  hasSupabase: boolean;
  hasClerk: boolean;
  hasDocker: boolean;
  hasTailwind: boolean;
  recipes: RecipeName[];
  recipeImageUpload: boolean;
  imageUpload: NormalizedImageUploadConfig;
  recipeAdminScreen: boolean;
  adminScreen: AdminScreenContext | AdminScreenDisabledContext;
  recipeUsersManagement: boolean;
  usersManagement: NormalizedUsersManagementConfig;
  recipePricingPage: boolean;
  pricing: PricingPageContext;
  recipeDashboard: boolean;
  dashboard: DashboardContext;
  recipePaginationListUi: boolean;
  paginationListUi: NormalizedPaginationListUiConfig;
  recipeFormValidation: boolean;
  /**
   * True when the dashboard recipe is enabled alongside admin-screen.
   * Lets the admin-screen sidebar render a Dashboard link as the first item.
   */
  hasDashboardRecipe: boolean;
  /** npm dependencies merged into package.json */
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  [key: string]: unknown;
}

const BASE_DEPS: Record<string, string> = {
  react: '^19.0.0',
  'react-dom': '^19.0.0',
};

const BASE_DEV_DEPS: Record<string, string> = {
  '@types/react': '^19.0.0',
  '@types/react-dom': '^19.0.0',
  '@types/node': '^22.0.0',
  '@vitejs/plugin-react': '^4.3.4',
  typescript: '~5.7.2',
  vite: '^6.0.0',
  '@eslint/js': '^9.17.0',
  eslint: '^9.17.0',
  'eslint-plugin-react-hooks': '^5.1.0',
  'eslint-plugin-react-refresh': '^0.4.16',
  globals: '^15.14.0',
  'typescript-eslint': '^8.18.0',
};

export function enrich(
  raw: Record<string, unknown>,
  _metadata: { name: string; apiVersion: string; description?: string },
  options: EnrichOptions = {},
): ViteReactAppContext {
  const spec: NormalizedSpec = parseSpec(raw);
  const appName = generateVariants(spec.appName);

  const routes: EnrichedRoute[] = spec.routes.map((r) => ({
    path: r.path,
    name: r.name,
    componentName: toPascalCase(r.name),
    routeFile: routePathToFile(r.path),
    isIndex: r.path === '/' || r.path === '',
  }));

  const dependencies: Record<string, string> = { ...BASE_DEPS };
  const devDependencies: Record<string, string> = { ...BASE_DEV_DEPS };

  if (spec.features.router === 'tanstack') {
    dependencies['@tanstack/react-router'] = '^1.95.0';
    devDependencies['@tanstack/router-plugin'] = '^1.95.0';
  } else if (spec.features.router === 'reactrouter') {
    dependencies['react-router-dom'] = '^7.1.0';
  }

  if (spec.features.tailwind) {
    dependencies['tailwindcss'] = '^4.0.0';
    devDependencies['@tailwindcss/vite'] = '^4.0.0';
  }

  if (spec.features.auth === 'supabase') {
    dependencies['@supabase/supabase-js'] = '^2.47.0';
  } else if (spec.features.auth === 'clerk') {
    dependencies['@clerk/clerk-react'] = '^5.20.0';
  }

  const recipeAdminScreen = spec.recipes.includes('admin-screen');
  const adminScreen = buildAdminScreenContext(
    {
      enabled: recipeAdminScreen,
      domainSpec: spec.adminScreen.domainSpec,
      basePath: spec.adminScreen.basePath,
      apiBaseUrl: spec.adminScreen.apiBaseUrl,
    },
    options.adminScreen ?? {},
  );

  const recipePricingPage = spec.recipes.includes('pricing-page');
  const pricing = buildPricingPageContext(recipePricingPage, spec.pricing);

  const recipeDashboard = spec.recipes.includes('dashboard');
  const dashboard = buildDashboardContext(recipeDashboard, spec.dashboard);

  const recipePaginationListUi = spec.recipes.includes('pagination-list-ui');
  // The hook fetches via `src/lib/api.ts`, which is only generated when features.api is true.
  if (recipePaginationListUi && !spec.features.api) {
    throw new Error(
      '[vite-react-app:pagination-list-ui] recipe "pagination-list-ui" requires features.api: true ' +
        '(the usePagedList hook is built on top of the typed `api()` client in src/lib/api.ts). ' +
        'Set `features: { api: true }` in your spec.',
    );
  }

  const recipeFormValidation = spec.recipes.includes('form-validation');
  if (recipeFormValidation) {
    dependencies['react-hook-form'] = '^7.55.0';
    dependencies['zod'] = '^3.24.0';
    dependencies['@hookform/resolvers'] = '^3.9.0';
  }

  return {
    appName,
    port: spec.port,
    routes,
    router: spec.features.router,
    hasRouter: spec.features.router !== 'none',
    hasTanstackRouter: spec.features.router === 'tanstack',
    hasReactRouter: spec.features.router === 'reactrouter',
    hasApi: spec.features.api,
    apiBaseUrl: spec.features.apiBaseUrl,
    apiUrlEnvVar: `VITE_${toUpperSnakeCase(spec.appName)}_API_BASE_URL`,
    auth: spec.features.auth,
    hasAuth: spec.features.auth !== 'none',
    hasSupabase: spec.features.auth === 'supabase',
    hasClerk: spec.features.auth === 'clerk',
    hasDocker: spec.features.docker,
    hasTailwind: spec.features.tailwind,
    recipes: spec.recipes,
    recipeImageUpload: spec.recipes.includes('image-upload'),
    imageUpload: spec.imageUpload,
    recipeAdminScreen,
    adminScreen,
    recipeUsersManagement: spec.recipes.includes('users-management'),
    usersManagement: spec.usersManagement,
    recipePricingPage,
    pricing,
    recipeDashboard,
    dashboard,
    recipePaginationListUi,
    paginationListUi: spec.paginationListUi,
    recipeFormValidation,
    hasDashboardRecipe: recipeDashboard,
    dependencies,
    devDependencies,
  };
}
