export type RouterKind = 'tanstack' | 'reactrouter' | 'none';
export type AuthKind = 'supabase' | 'clerk' | 'none';

export type RecipeName = 'image-upload' | 'admin-screen';
export const KNOWN_RECIPES: readonly RecipeName[] = ['image-upload', 'admin-screen'] as const;

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
  };
}
