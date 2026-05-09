export type RouterKind = 'tanstack' | 'reactrouter' | 'none';
export type AuthKind = 'supabase' | 'clerk' | 'none';

export type RecipeName =
  | 'image-upload'
  | 'admin-screen'
  | 'users-management'
  | 'pricing-page'
  | 'dashboard';
export const KNOWN_RECIPES: readonly RecipeName[] = [
  'image-upload',
  'admin-screen',
  'users-management',
  'pricing-page',
  'dashboard',
] as const;

export interface RawRoute {
  path: string;
  name: string;
}

export interface RawImageUploadConfig {
  apiPath?: string;
}

export interface NormalizedImageUploadConfig {
  apiPath: string;
}

export interface RawUsersManagementConfig {
  signInPath?: string;
  signUpPath?: string;
  afterSignInPath?: string;
}

export interface NormalizedUsersManagementConfig {
  signInPath: string;
  signUpPath: string;
  afterSignInPath: string;
}

export interface RawAdminScreenConfig {
  domainSpec?: string;
  basePath?: string;
  apiBaseUrl?: string;
}

export interface NormalizedAdminScreenConfig {
  domainSpec: string | null;
  basePath: string;
  apiBaseUrl: string;
}

export type DashboardStatFormat = 'number' | 'currency' | 'percent';

export interface RawDashboardStat {
  name: string;
  endpoint: string;
  units?: string;
  format?: DashboardStatFormat;
}

export interface RawDashboardConfig {
  title?: string;
  stats?: RawDashboardStat[];
  timeRanges?: string[];
}

export interface NormalizedDashboardStat {
  name: string;
  endpoint: string;
  units: string;
  format: DashboardStatFormat;
}

export interface NormalizedDashboardConfig {
  title: string;
  stats: NormalizedDashboardStat[];
  timeRanges: string[];
}

export interface RawPricingFeature {
  text?: string;
  included?: boolean;
}

export interface RawPricingTier {
  name: string;
  price: string;
  period?: string;
  audience?: string;
  description?: string;
  features?: RawPricingFeature[];
  ctaText?: string;
  ctaHref?: string;
  highlight?: boolean;
}

export interface RawPricingConfig {
  headline?: string;
  subhead?: string;
  tiers?: RawPricingTier[];
}

export interface NormalizedPricingFeature {
  text: string;
  included: boolean;
}

export interface NormalizedPricingTier {
  name: string;
  price: string;
  period: string;
  audience: string;
  description: string;
  features: NormalizedPricingFeature[];
  ctaText: string;
  ctaHref: string;
  highlight: boolean;
}

export interface NormalizedPricingConfig {
  headline: string;
  subhead: string;
  tiers: NormalizedPricingTier[];
}

export interface RawViteReactAppSpec {
  appName: string;
  port?: number;
  routes?: RawRoute[];
  features?: {
    router?: RouterKind;
    api?: boolean;
    apiBaseUrl?: string;
    auth?: AuthKind;
    docker?: boolean;
    tailwind?: boolean;
  };
  recipes?: string[];
  imageUpload?: RawImageUploadConfig;
  adminScreen?: RawAdminScreenConfig;
  usersManagement?: RawUsersManagementConfig;
  pricing?: RawPricingConfig;
  dashboard?: RawDashboardConfig;
}

export interface NormalizedSpec {
  appName: string;
  port: number;
  routes: RawRoute[];
  features: {
    router: RouterKind;
    api: boolean;
    apiBaseUrl: string;
    auth: AuthKind;
    docker: boolean;
    tailwind: boolean;
  };
  recipes: RecipeName[];
  imageUpload: NormalizedImageUploadConfig;
  adminScreen: NormalizedAdminScreenConfig;
  usersManagement: NormalizedUsersManagementConfig;
  pricing: NormalizedPricingConfig;
  dashboard: NormalizedDashboardConfig;
}

const DEFAULT_ROUTES: RawRoute[] = [{ path: '/', name: 'Home' }];

export function parseSpec(raw: Record<string, unknown>): NormalizedSpec {
  const spec = raw as unknown as RawViteReactAppSpec;
  const features = spec.features ?? {};
  const routes = spec.routes && spec.routes.length > 0 ? spec.routes : DEFAULT_ROUTES;
  const recipes: RecipeName[] = Array.isArray(spec.recipes)
    ? spec.recipes.filter((x): x is RecipeName => (KNOWN_RECIPES as readonly string[]).includes(x))
    : [];
  return {
    appName: spec.appName,
    port: spec.port ?? 5173,
    routes,
    features: {
      router: features.router ?? 'tanstack',
      api: features.api ?? true,
      apiBaseUrl: features.apiBaseUrl ?? 'http://localhost:8080',
      auth: features.auth ?? 'none',
      docker: features.docker ?? false,
      tailwind: features.tailwind ?? true,
    },
    recipes,
    imageUpload: {
      apiPath: spec.imageUpload?.apiPath ?? '/images',
    },
    adminScreen: {
      domainSpec: spec.adminScreen?.domainSpec ?? null,
      basePath: spec.adminScreen?.basePath ?? '/admin',
      apiBaseUrl: spec.adminScreen?.apiBaseUrl ?? '',
    },
    usersManagement: {
      signInPath: spec.usersManagement?.signInPath ?? '/sign-in',
      signUpPath: spec.usersManagement?.signUpPath ?? '/sign-up',
      afterSignInPath: spec.usersManagement?.afterSignInPath ?? '/',
    },
    pricing: normalizePricing(spec.pricing),
    dashboard: normalizeDashboard(spec.dashboard),
  };
}

const VALID_FORMATS: readonly DashboardStatFormat[] = ['number', 'currency', 'percent'];

function normalizeDashboard(raw: RawDashboardConfig | undefined): NormalizedDashboardConfig {
  const stats: NormalizedDashboardStat[] = Array.isArray(raw?.stats)
    ? raw!
        .stats!.filter(
          (s) =>
            s &&
            typeof s.name === 'string' &&
            s.name.length > 0 &&
            typeof s.endpoint === 'string' &&
            s.endpoint.length > 0,
        )
        .map((s) => ({
          name: s.name,
          endpoint: s.endpoint,
          units: typeof s.units === 'string' ? s.units : '',
          format:
            s.format && (VALID_FORMATS as readonly string[]).includes(s.format)
              ? s.format
              : 'number',
        }))
    : [];
  const rawRanges = Array.isArray(raw?.timeRanges)
    ? raw!.timeRanges!.filter((r): r is string => typeof r === 'string' && r.length > 0)
    : [];
  const timeRanges = rawRanges.length > 0 ? rawRanges : ['7d', '30d', '90d'];
  return {
    title: typeof raw?.title === 'string' && raw!.title!.length > 0 ? raw!.title! : 'Dashboard',
    stats,
    timeRanges,
  };
}

function normalizePricing(raw: RawPricingConfig | undefined): NormalizedPricingConfig {
  const tiers: NormalizedPricingTier[] = Array.isArray(raw?.tiers)
    ? raw!.tiers!.map((t) => ({
        name: t.name,
        price: t.price,
        period: t.period ?? '',
        audience: t.audience ?? '',
        description: t.description ?? '',
        features: Array.isArray(t.features)
          ? t.features
              .filter((f) => typeof f.text === 'string' && f.text.length > 0)
              .map((f) => ({
                text: f.text as string,
                included: f.included !== false,
              }))
          : [],
        ctaText: t.ctaText ?? 'Get started',
        ctaHref: t.ctaHref ?? '#',
        highlight: t.highlight === true,
      }))
    : [];
  return {
    headline: raw?.headline ?? 'Pricing',
    subhead: raw?.subhead ?? '',
    tiers,
  };
}
