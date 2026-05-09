export type RouterKind = 'tanstack' | 'reactrouter' | 'none';
export type AuthKind = 'supabase' | 'clerk' | 'none';

export type RecipeName = 'image-upload' | 'admin-screen' | 'users-management' | 'pricing-page';
export const KNOWN_RECIPES: readonly RecipeName[] = [
  'image-upload',
  'admin-screen',
  'users-management',
  'pricing-page',
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
